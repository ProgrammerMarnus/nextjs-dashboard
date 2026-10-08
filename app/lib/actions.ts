'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import postgres from 'postgres';
import { createClient } from '@/utils/supabase/server';
import { fromDateTimeLocal } from '@/app/lib/time';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const AppointmentSchema = z.object({
  patient_id: z.string().min(1),
  starts_at: z.string().min(16),
  status: z.enum(['booked', 'done', 'no_show']),
});

function parseAppointment(formData: FormData) {
  return AppointmentSchema.parse({
    patient_id: formData.get('patient_id'),
    starts_at: formData.get('starts_at'),
    status: formData.get('status'),
  });
}

export async function createAppointment(formData: FormData) {
  const a = parseAppointment(formData);
  const supabase = await createClient();
  const { error } = await supabase.from('appointments').insert({
    patient_id: a.patient_id,
    starts_at: fromDateTimeLocal(a.starts_at),
    status: a.status,
  });
  if (error) throw new Error(`${error.code}: ${error.message}`);
  revalidatePath('/dashboard/appointments');
  redirect('/dashboard/appointments');
}

export async function updateAppointment(id: string, formData: FormData) {
  const a = parseAppointment(formData);
  const supabase = await createClient();
  const { error } = await supabase
    .from('appointments')
    .update({
      patient_id: a.patient_id,
      starts_at: fromDateTimeLocal(a.starts_at),
      status: a.status,
    })
    .eq('id', id);
  if (error) throw new Error(`${error.code}: ${error.message}`);
  revalidatePath('/dashboard/appointments');
  redirect('/dashboard/appointments');
}

export async function deleteAppointment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw new Error(`${error.code}: ${error.message}`);
  revalidatePath('/dashboard/appointments');
}

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return { message: 'Database Error: Failed to Create Invoice.' };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  // Validate form fields using Zod
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  // Prepare data for update into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  // Update data into the database
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to delete invoice.');
  }
  revalidatePath('/dashboard/invoices');
}

export type AuthState = {
  error: string | null;
};

export async function signIn(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const parsed = z
    .object({ email: z.string().email(), password: z.string().min(6) })
    .safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

  if (!parsed.success) {
    return { error: 'Please provide a valid email and password.' };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Never leak which part of the credentials was wrong.
    return { error: 'Invalid credentials.' };
  }

  const callbackUrl = formData.get('redirectTo') || '/dashboard';
  redirect(callbackUrl.toString());
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

const PatientSchema = z.object({
  full_name: z.string().min(1, { message: "Please enter the patient's full name." }),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
});

export type PatientState = {
  errors?: {
    full_name?: string[];
    phone?: string[];
    date_of_birth?: string[];
  };
  message?: string | null;
};

export async function createPatient(prevState: PatientState, formData: FormData) {
  const validated = PatientSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
    date_of_birth: formData.get('date_of_birth'),
  });
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to create patient.',
    };
  }
  const { full_name, phone, date_of_birth } = validated.data;

  const supabase = await createClient();
  const { error } = await supabase.from('patients').insert({
    full_name,
    phone: phone || null,
    date_of_birth: date_of_birth || null,
  });
  if (error) {
    console.error('Supabase error:', error);
    return { message: `Database error ${error.code}: failed to create patient.` };
  }

  revalidatePath('/dashboard/patients');
  redirect('/dashboard/patients');
}

export async function updatePatient(
  id: string,
  prevState: PatientState,
  formData: FormData,
) {
  const validated = PatientSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
    date_of_birth: formData.get('date_of_birth'),
  });
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to update patient.',
    };
  }
  const { full_name, phone, date_of_birth } = validated.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from('patients')
    .update({ full_name, phone: phone || null, date_of_birth: date_of_birth || null })
    .eq('id', id);
  if (error) {
    console.error('Supabase error:', error);
    return { message: `Database error ${error.code}: failed to update patient.` };
  }

  revalidatePath('/dashboard/patients');
  redirect('/dashboard/patients');
}

export async function deletePatient(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('patients').delete().eq('id', id);
  if (error) {
    console.error('Supabase error:', error);
    throw new Error(`Database error ${error.code}: failed to delete patient.`);
  }
  revalidatePath('/dashboard/patients');
}
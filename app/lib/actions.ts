'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { fromDateTimeLocal } from '@/app/lib/time';
import { AppError, handleError, type ActionResult } from './errors';

const IdSchema = z.string().uuid({ message: 'Invalid ID format.' });

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
  if (error) throw handleError(error, 'Failed to create appointment.');
  revalidatePath('/dashboard/appointments');
  redirect('/dashboard/appointments');
}

export async function updateAppointment(id: string, formData: FormData) {
  const validatedId = IdSchema.safeParse(id);
  if (!validatedId.success) {
    throw new AppError('Invalid appointment ID.', 'VALIDATION_ERROR', 400);
  }
  const a = parseAppointment(formData);
  const supabase = await createClient();
  const { error } = await supabase
    .from('appointments')
    .update({
      patient_id: a.patient_id,
      starts_at: fromDateTimeLocal(a.starts_at),
      status: a.status,
    })
    .eq('id', validatedId.data);
  if (error) throw handleError(error, 'Failed to update appointment.');
  revalidatePath('/dashboard/appointments');
  redirect('/dashboard/appointments');
}

export async function deleteAppointment(id: string) {
  const validated = IdSchema.safeParse(id);
  if (!validated.success) {
    console.error('Validation Error:', validated.error.flatten().fieldErrors);
    throw new AppError('Invalid appointment ID.', 'VALIDATION_ERROR', 400);
  }
  const supabase = await createClient();
  const { error } = await supabase.from('appointments').delete().eq('id', validated.data);
  if (error) throw handleError(error, 'Failed to delete appointment.');
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

export async function createInvoice(
  prevState: State,
  formData: FormData,
): Promise<State> {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('invoices').insert({
      customer_id: customerId,
      amount: amountInCents,
      status,
      date,
    });
    if (error) throw handleError(error, 'Failed to create invoice.');
  } catch (error) {
    const appError = handleError(error, 'Failed to create invoice.');
    return { message: appError.message };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
): Promise<State> {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('invoices')
      .update({
        customer_id: customerId,
        amount: amountInCents,
        status,
      })
      .eq('id', id);
    if (error) throw handleError(error, 'Failed to update invoice.');
  } catch (error) {
    const appError = handleError(error, 'Failed to update invoice.');
    return { message: appError.message };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  const validated = IdSchema.safeParse(id);
  if (!validated.success) {
    console.error('Validation Error:', validated.error.flatten().fieldErrors);
    throw new AppError('Invalid invoice ID.', 'VALIDATION_ERROR', 400);
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('invoices').delete().eq('id', validated.data);
    if (error) throw handleError(error, 'Failed to delete invoice.');
  } catch (error) {
    throw handleError(error, 'Failed to delete invoice.');
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

export async function createPatient(
  prevState: PatientState,
  formData: FormData,
): Promise<PatientState> {
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
    const appError = handleError(error, 'Failed to create patient.');
    return { message: appError.message };
  }

  revalidatePath('/dashboard/patients');
  redirect('/dashboard/patients');
}

export async function updatePatient(
  id: string,
  prevState: PatientState,
  formData: FormData,
): Promise<PatientState> {
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
    const appError = handleError(error, 'Failed to update patient.');
    return { message: appError.message };
  }

  revalidatePath('/dashboard/patients');
  redirect('/dashboard/patients');
}

export async function deletePatient(id: string) {
  const validated = IdSchema.safeParse(id);
  if (!validated.success) {
    console.error('Validation Error:', validated.error.flatten().fieldErrors);
    throw new AppError('Invalid patient ID.', 'VALIDATION_ERROR', 400);
  }
  const supabase = await createClient();
  const { error } = await supabase.from('patients').delete().eq('id', validated.data);
  if (error) {
    console.error('Supabase error:', error);
    throw handleError(error, 'Failed to delete patient.');
  }
  revalidatePath('/dashboard/patients');
}
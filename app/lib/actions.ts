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
  status: z.enum(['booked', 'done', 'no_show', 'cancelled']),
});

export type AppointmentState = {
  errors?: {
    patient_id?: string[];
    starts_at?: string[];
    status?: string[];
  };
  message?: string | null;
};

// Postgres exclusion-constraint violation (appointments_no_overlap).
const SLOT_CONFLICT_CODE = '23P01';
const SLOT_CONFLICT_MESSAGE =
  'That time slot is already taken — each appointment holds a 30-minute slot. Please pick a different start time.';

function parseAppointment(formData: FormData) {
  return AppointmentSchema.safeParse({
    patient_id: formData.get('patient_id'),
    starts_at: formData.get('starts_at'),
    status: formData.get('status'),
  });
}

export async function createAppointment(
  prevState: AppointmentState,
  formData: FormData,
): Promise<AppointmentState> {
  const parsed = parseAppointment(formData);
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: 'Missing or invalid fields. Failed to create appointment.',
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('appointments').insert({
    patient_id: parsed.data.patient_id,
    starts_at: fromDateTimeLocal(parsed.data.starts_at),
    status: parsed.data.status,
  });
  if (error) {
    // The DB exclusion constraint is the source of truth for slot conflicts.
    if (error.code === SLOT_CONFLICT_CODE) {
      return { message: SLOT_CONFLICT_MESSAGE };
    }
    throw handleError(error, 'Failed to create appointment.');
  }
  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard');
  redirect('/dashboard/appointments');
}

export async function updateAppointment(
  id: string,
  prevState: AppointmentState,
  formData: FormData,
): Promise<AppointmentState> {
  const validatedId = IdSchema.safeParse(id);
  if (!validatedId.success) {
    throw new AppError('Invalid appointment ID.', 'VALIDATION_ERROR', 400);
  }
  const parsed = parseAppointment(formData);
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: 'Missing or invalid fields. Failed to update appointment.',
    };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from('appointments')
    .update({
      patient_id: parsed.data.patient_id,
      starts_at: fromDateTimeLocal(parsed.data.starts_at),
      status: parsed.data.status,
    })
    .eq('id', validatedId.data);
  if (error) {
    if (error.code === SLOT_CONFLICT_CODE) {
      return { message: SLOT_CONFLICT_MESSAGE };
    }
    throw handleError(error, 'Failed to update appointment.');
  }
  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard');
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
  revalidatePath('/dashboard');
}

// Resolve an appointment from the "Upcoming" section: flip status only.
export async function setAppointmentStatus(
  id: string,
  status: 'done' | 'no_show' | 'cancelled',
) {
  const validated = IdSchema.safeParse(id);
  if (!validated.success) {
    console.error('Validation Error:', validated.error.flatten().fieldErrors);
    throw new AppError('Invalid appointment ID.', 'VALIDATION_ERROR', 400);
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', validated.data);
  if (error) throw handleError(error, 'Failed to update appointment status.');
  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard');
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

export async function signUp(
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
    return { error: 'Please provide a valid email and password (min 6 chars).' };
  }

  const { error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    return { error: error.message };
  }

  redirect('/login?message=Check your email to confirm your account.');
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
  revalidatePath('/dashboard');
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
  revalidatePath('/dashboard');
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
  revalidatePath('/dashboard');
}
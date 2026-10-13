import { createClient } from '@/utils/supabase/server';
import { AppError } from './errors';

export type Patient = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  created_at: string;
};

export type PatientsPerMonth = {
  month_start: string;
  label: string;
  new_patients: number;
};

export interface AppointmentRow {
  id: string;
  starts_at: string;
  status: 'booked' | 'done' | 'no_show';
  patients: { full_name: string } | null;
}

export interface StatusRow {
  status: 'booked' | 'done' | 'no_show';
  total: number;
}

export async function fetchPatients(): Promise<Patient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .select('id, user_id, full_name, phone, date_of_birth, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    throw new AppError('Failed to fetch patients.', 'FETCH_ERROR', 500);
  }
  return data as Patient[];
}

export async function fetchPatientsPerMonth(): Promise<PatientsPerMonth[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients_per_month')
    .select('month_start, label, new_patients')
    .order('month_start', { ascending: true });

  if (error) {
    console.error('Supabase error:', error);
    throw new AppError('Failed to fetch patients per month.', 'FETCH_ERROR', 500);
  }
  return data as PatientsPerMonth[];
}

export async function fetchAppointments(): Promise<AppointmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('appointments')
    .select('id, starts_at, status, patients ( full_name )')
    .order('starts_at', { ascending: false });

  if (error) throw new AppError(error.message, 'FETCH_ERROR', 500);
  return data as unknown as AppointmentRow[];
}

export async function fetchAppointmentStatusThisMonth(): Promise<StatusRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('appointment_status_this_month').select('status, total');
  if (error) throw new AppError(error.message, 'FETCH_ERROR', 500);
  return data as StatusRow[];
}

export async function fetchPatientOptions(): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('patients').select('id, full_name').order('full_name');
  if (error) throw new AppError(error.message, 'FETCH_ERROR', 500);
  return data;
}

export async function fetchPatientById(id: string): Promise<Patient | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .select('id, user_id, full_name, phone, date_of_birth, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Supabase error:', error);
    throw new AppError('Failed to fetch patient.', 'FETCH_ERROR', 500);
  }
  return (data as Patient | null) ?? null;
}

export async function fetchAppointmentById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('appointments')
    .select('id, patient_id, starts_at, status')
    .eq('id', id)
    .single();
  return data;
}

// All appointment start times (ISO). Used by the calendar picker to mark taken
// slots as unavailable. `excludeId` omits one appointment (used when editing, so
// the row's own current slot isn't shown as "taken").
export async function fetchAppointmentSlotTimes(excludeId?: string): Promise<string[]> {
  const supabase = await createClient();
  let query = supabase.from('appointments').select('id, starts_at');
  if (excludeId) query = query.neq('id', excludeId);
  const { data, error } = await query;
  if (error) throw new AppError(error.message, 'FETCH_ERROR', 500);
  return (data ?? []).map((r) => r.starts_at as string);
}
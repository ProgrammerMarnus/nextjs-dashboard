// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.

export type Patient = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  user_id: string;
  patient_id: string;
  starts_at: string;
  status: 'booked' | 'done' | 'no_show';
  created_at: string;
};

export type PatientsPerMonth = {
  month_start: string;
  label: string;
  new_patients: number;
};

export type AppointmentStatus = {
  status: 'booked' | 'done' | 'no_show';
  total: number;
};
'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { updateAppointment, type AppointmentState } from '@/app/lib/actions';
import { toDateTimeLocal } from '@/app/lib/time';
import { Button } from '@/app/ui/button';
import DateTimePicker from '@/app/ui/appointments/datetime-picker';

export default function EditAppointmentForm({
  appointment,
  patients,
  takenSlots,
}: {
  appointment: { id: string; patient_id: string; starts_at: string; status: string };
  patients: { id: string; full_name: string }[];
  takenSlots: string[];
}) {
  const initialState: AppointmentState = { message: null, errors: {} };
  const update = updateAppointment.bind(null, appointment.id);
  const [state, formAction] = useActionState(update, initialState);

  // Controlled inputs so a rejected submit (e.g. slot already taken) keeps the user's
  // entries instead of resetting the form. No `min` here — past times stay editable
  // so historical appointments can still be corrected/resolved.
  const [patientId, setPatientId] = useState(appointment.patient_id);
  const [startsAt, setStartsAt] = useState(toDateTimeLocal(appointment.starts_at));
  const [status, setStatus] = useState(appointment.status);

  // See create-form: onSubmit+preventDefault avoids React 19's post-submit form
  // reset so the entries survive a rejected (slot-taken) submit.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formAction(new FormData(e.currentTarget));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        <div className="mb-4">
          <label htmlFor="patient_id" className="mb-2 block text-sm font-medium">
            Patient
          </label>
          <select
            id="patient_id"
            name="patient_id"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            required
            className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
            aria-describedby="patient_id-error"
          >
            <option value="" disabled>
              Select a patient
            </option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
          <div id="patient_id-error" aria-live="polite" aria-atomic="true">
            {state.errors?.patient_id?.map((error) => (
              <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="starts_at" className="mb-2 block text-sm font-medium">
            Starts at
          </label>
          <DateTimePicker
            name="starts_at"
            value={startsAt}
            onChange={setStartsAt}
            takenSlots={takenSlots}
          />
          <div id="starts_at-error" aria-live="polite" aria-atomic="true">
            {state.errors?.starts_at?.map((error) => (
              <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="status" className="mb-2 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
          >
            <option value="booked">Booked</option>
            <option value="done">Done</option>
            <option value="no_show">No-show</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div aria-live="polite" aria-atomic="true">
          {state.message && <p className="mt-2 text-sm text-red-500">{state.message}</p>}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/appointments"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Save appointment</Button>
      </div>
    </form>
  );
}

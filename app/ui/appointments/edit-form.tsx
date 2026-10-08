import { updateAppointment } from '@/app/lib/actions';
import { toDateTimeLocal } from '@/app/lib/time';

export default function EditAppointmentForm({
  appointment,
  patients,
}: {
  appointment: { id: string; patient_id: string; starts_at: string; status: string };
  patients: { id: string; full_name: string }[];
}) {
  const update = updateAppointment.bind(null, appointment.id);

  return (
    <form action={update} className="space-y-4">
      <label htmlFor="patient_id">Patient</label>
      <select id="patient_id" name="patient_id" defaultValue={appointment.patient_id} required>
        <option value="" disabled>
          Select a patient
        </option>
        {patients.map((p) => (
          <option key={p.id} value={p.id}>
            {p.full_name}
          </option>
        ))}
      </select>

      <label htmlFor="starts_at">Starts at</label>
      <input
        id="starts_at"
        type="datetime-local"
        name="starts_at"
        defaultValue={toDateTimeLocal(appointment.starts_at)}
        required
      />

      <label htmlFor="status">Status</label>
      <select id="status" name="status" defaultValue={appointment.status}>
        <option value="booked">Booked</option>
        <option value="done">Done</option>
        <option value="no_show">No-show</option>
      </select>

      <button type="submit">Save appointment</button>
    </form>
  );
}
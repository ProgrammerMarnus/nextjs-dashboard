import { createAppointment } from '@/app/lib/actions';

export default function CreateAppointmentForm({
  patients,
}: {
  patients: { id: string; full_name: string }[];
}) {
  return (
    <form action={createAppointment} className="space-y-4">
      <label htmlFor="patient_id">Patient</label>
      <select id="patient_id" name="patient_id" defaultValue="" required>
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
      <input id="starts_at" type="datetime-local" name="starts_at" required />

      <label htmlFor="status">Status</label>
      <select id="status" name="status" defaultValue="booked">
        <option value="booked">Booked</option>
        <option value="done">Done</option>
        <option value="no_show">No-show</option>
      </select>

      <button type="submit">Create appointment</button>
    </form>
  );
}
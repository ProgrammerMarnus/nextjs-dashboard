import { notFound } from 'next/navigation';
import { fetchAppointmentById, fetchPatientOptions, fetchAppointmentSlotTimes } from '@/app/lib/supabase-data';
import { toDateTimeLocal } from '@/app/lib/time';
import EditAppointmentForm from '@/app/ui/appointments/edit-form';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [appointment, patients, slotTimes] = await Promise.all([
    fetchAppointmentById(id),
    fetchPatientOptions(),
    // Exclude this appointment's own slot so it isn't shown as "taken" while editing.
    fetchAppointmentSlotTimes(id),
  ]);
  if (!appointment) notFound();
  const takenSlots = slotTimes.map(toDateTimeLocal);
  return (
    <main>
      <h1 className="mb-6 text-2xl">Edit appointment</h1>
      <EditAppointmentForm appointment={appointment} patients={patients} takenSlots={takenSlots} />
    </main>
  );
}
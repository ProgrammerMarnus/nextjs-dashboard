import { fetchPatientOptions, fetchAppointmentSlotTimes } from '@/app/lib/supabase-data';
import { toDateTimeLocal } from '@/app/lib/time';
import CreateAppointmentForm from '@/app/ui/appointments/create-form';

export default async function Page() {
  const [patients, slotTimes] = await Promise.all([
    fetchPatientOptions(),
    fetchAppointmentSlotTimes(),
  ]);
  // Normalise ISO slot times to clinic-local 'YYYY-MM-DDTHH:mm' for the picker.
  const takenSlots = slotTimes.map(toDateTimeLocal);
  return (
    <main>
      <h1 className="mb-6 text-2xl">New appointment</h1>
      <CreateAppointmentForm patients={patients} takenSlots={takenSlots} />
    </main>
  );
}
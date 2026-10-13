import { fetchPatientOptions } from '@/app/lib/supabase-data';
import CreateAppointmentForm from '@/app/ui/appointments/create-form';

export default async function Page() {
  const patients = await fetchPatientOptions();
  return (
    <main>
      <h1 className="mb-6 text-2xl">New appointment</h1>
      <CreateAppointmentForm patients={patients} />
    </main>
  );
}
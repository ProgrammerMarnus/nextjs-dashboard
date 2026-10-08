import { fetchPatientOptions } from '@/app/lib/data';
import CreateAppointmentForm from '@/app/ui/appointments/create-form';

export default async function Page() {
  const patients = await fetchPatientOptions();
  return <CreateAppointmentForm patients={patients} />;
}
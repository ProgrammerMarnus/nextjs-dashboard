import { fetchPatientsPerMonth, fetchAppointmentStatusThisMonth, fetchAppointments } from '@/app/lib/supabase-data';
import ChartGrid from '@/app/ui/charts/chart-grid';
import UpcomingList from '@/app/ui/dashboard/upcoming-list';
import { CreatePatient } from '@/app/ui/patients/buttons';
import { CreateAppointment } from '@/app/ui/appointments/buttons';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function Page() {
  const [perMonth, statusRows, appointments] = await Promise.all([
    fetchPatientsPerMonth(),
    fetchAppointmentStatusThisMonth(),
    fetchAppointments(),
  ]);
  return (
    <main className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {/* Top on desktop */}
        <div className="hidden gap-2 md:flex">
          <CreatePatient />
          <CreateAppointment />
        </div>
      </div>
      <ChartGrid patients={perMonth} status={statusRows} />
      <section className="mt-6 rounded-md border p-4">
        <UpcomingList rows={appointments} />
      </section>
      {/* Bottom on mobile */}
      <div className="mt-6 flex flex-wrap gap-2 md:hidden">
        <CreatePatient />
        <CreateAppointment />
      </div>
    </main>
  );
}
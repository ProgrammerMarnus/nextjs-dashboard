import { fetchPatientsPerMonth, fetchAppointmentStatusThisMonth } from '@/app/lib/data';
import PatientsChart from '@/app/ui/dashboard/patients-chart';
import StatusDonut from '@/app/ui/dashboard/status-donut';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function Page() {
  const [perMonth, statusRows] = await Promise.all([
    fetchPatientsPerMonth(),
    fetchAppointmentStatusThisMonth(),
  ]);
  return (
    <main className='p-6'>
      <h1 className='text-2xl font-bold'>Dashboard</h1>
      <div className='mt-6 grid gap-6 md:grid-cols-2'>
        <section className='rounded-md border p-4'>
          <h2 className='font-semibold'>Is the practice growing? New patients per month (last 6 months)</h2>
          <PatientsChart rows={perMonth} />
        </section>
        <section className='rounded-md border p-4'>
          <h2 className='font-semibold'>What share of this month&apos;s appointments are no-shows?</h2>
          <StatusDonut rows={statusRows} />
        </section>
      </div>
    </main>
  );
}
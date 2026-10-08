import Link from 'next/link';
import { fetchAppointments } from '@/app/lib/supabase-data';
import { formatSA } from '@/app/lib/time';
import { deleteAppointment } from '@/app/lib/actions';

export default async function Page() {
  const rows = await fetchAppointments();
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Appointments</h1>
      <Link href="/dashboard/appointments/create" className="underline">
        New appointment
      </Link>
      {rows.length === 0 ? (
        <p className="mt-4">No appointments yet.</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Starts</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const remove = deleteAppointment.bind(null, a.id);
              return (
                <tr key={a.id}>
                  <td>{a.patients?.full_name ?? 'Unknown'}</td>
                  <td>{formatSA(a.starts_at)}</td>
                  <td>{a.status}</td>
                  <td>
                    <Link href={`/dashboard/appointments/${a.id}/edit`}>Edit</Link>{' '}
                    <form action={remove} className="inline">
                      <button type="submit">Delete</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
import { fetchAppointments } from '@/app/lib/supabase-data';
import { formatSA, nowMs } from '@/app/lib/time';
import { ResolveAppointment } from '@/app/ui/appointments/buttons';

// Next N booked appointments, soonest first. Done / No-show become available
// once a slot starts; Cancel is available any time before it starts. Rendered
// on the Appointments page and the Dashboard.
export default async function UpcomingAppointments({ limit = 3 }: { limit?: number }) {
  const rows = await fetchAppointments();
  const now = nowMs();

  const upcoming = rows
    .filter((a) => a.status === 'booked')
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, limit);

  return (
    <section aria-labelledby="upcoming-heading">
      <h2 id="upcoming-heading" className="text-sm font-semibold text-gray-700">
        Upcoming Appointments
      </h2>
      {upcoming.length === 0 ? (
        <p className="mt-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
          No upcoming appointments.
        </p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((a) => {
            const started = new Date(a.starts_at).getTime() <= now;
            return (
              <li
                key={a.id}
                className="flex flex-col justify-between rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">{a.patients?.full_name ?? 'Unknown'}</p>
                  <p className="mt-1 text-sm text-gray-500">{formatSA(a.starts_at)}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ResolveAppointment id={a.id} status="done" enabled={started} />
                  <ResolveAppointment id={a.id} status="no_show" enabled={started} />
                  <ResolveAppointment id={a.id} status="cancelled" enabled={!started} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

import Link from 'next/link';
import { fetchAppointments } from '@/app/lib/supabase-data';
import { formatSA } from '@/app/lib/time';
import { lusitana } from '@/app/ui/fonts';
import {
  CreateAppointment,
  UpdateAppointment,
  DeleteAppointment,
} from '@/app/ui/appointments/buttons';
import UpcomingAppointments from '@/app/ui/dashboard/upcoming-appointments';

const STATUS_STYLES: Record<string, string> = {
  booked: 'bg-blue-100 text-blue-600',
  done: 'bg-green-100 text-green-700',
  no_show: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

const STATUS_LABELS: Record<string, string> = {
  booked: 'Booked',
  done: 'Done',
  no_show: 'No-show',
  cancelled: 'Cancelled',
};

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'booked', label: 'Booked' },
  { key: 'done', label: 'Done' },
  { key: 'no_show', label: 'No-show' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = status && FILTERS.some((f) => f.key === status) ? status : 'all';

  const rows = await fetchAppointments();

  const filtered = active === 'all' ? rows : rows.filter((a) => a.status === active);

  const filterHref = (key: string) =>
    key === 'all' ? '/dashboard/appointments' : `/dashboard/appointments?status=${key}`;

  return (
    <main className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Appointments</h1>
        <CreateAppointment />
      </div>

      {/* Upcoming: next 3 booked appointments, resolvable once their slot starts. */}
      <div className="mt-6">
        <UpcomingAppointments />
      </div>

      {/* Status filter */}
      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Filter appointments by status">
        {FILTERS.map((f) => {
          const isActive = f.key === active;
          return (
            <Link
              key={f.key}
              href={filterHref(f.key)}
              aria-current={isActive ? 'page' : undefined}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No appointments match this filter.</p>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <ul className="mt-6 space-y-3 md:hidden">
            {filtered.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {a.patients?.full_name ?? 'Unknown'}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{formatSA(a.starts_at)}</p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[a.status] ?? 'bg-gray-100 text-gray-700'}`}
                  >
                    {STATUS_LABELS[a.status] ?? a.status}
                  </span>
                </div>
                <div className="mt-3 flex justify-end gap-3">
                  <UpdateAppointment id={a.id} />
                  <DeleteAppointment id={a.id} />
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="mt-6 flow-root hidden md:block">
            <div className="inline-block min-w-full align-middle">
              <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
                <table className="hidden min-w-full text-gray-900 md:table">
                  <thead className="rounded-lg text-left text-sm font-normal">
                    <tr>
                      <th scope="col" className="px-4 py-5 font-medium sm:pl-6">Patient</th>
                      <th scope="col" className="px-3 py-5 font-medium">Starts</th>
                      <th scope="col" className="px-3 py-5 font-medium">Status</th>
                      <th scope="col" className="relative pb-4 pl-3 pr-6 pt-2 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filtered.map((a) => (
                      <tr key={a.id} className="border-b text-sm">
                        <td className="whitespace-nowrap px-4 py-3">{a.patients?.full_name ?? 'Unknown'}</td>
                        <td className="whitespace-nowrap px-3 py-3">{formatSA(a.starts_at)}</td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[a.status] ?? 'bg-gray-100 text-gray-700'}`}
                          >
                            {STATUS_LABELS[a.status] ?? a.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-3 pl-6 pr-3">
                          <div className="flex justify-end gap-3">
                            <UpdateAppointment id={a.id} />
                            <DeleteAppointment id={a.id} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
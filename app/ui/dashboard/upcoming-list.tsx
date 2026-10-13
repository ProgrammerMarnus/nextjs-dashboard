'use client';

import { useEffect, useState } from 'react';
import { useSettings, type UpcomingWindow } from '@/app/ui/settings/settings-context';
import { formatSA } from '@/app/lib/time';
import { ResolveAppointment } from '@/app/ui/appointments/buttons';
import type { AppointmentRow } from '@/app/lib/supabase-data';

// Client-side view of the Upcoming Appointments section. The booked rows are
// fetched server-side (RLS-safe) and passed in; this component applies the
// user's chosen display — next N, or everything within a timeframe window.
export default function UpcomingList({ rows }: { rows: AppointmentRow[] }) {
  const { settings } = useSettings();
  const [now, setNow] = useState(() => Date.now());

  // Update now periodically so "started" status stays accurate without remount
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const booked = rows
    .filter((a) => a.status === 'booked')
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  const windowEnd = (w: UpcomingWindow): number => {
    const d = new Date(now);
    if (w === 'today') {
      d.setHours(23, 59, 59, 999);
    } else if (w === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (w === 'month') {
      d.setMonth(d.getMonth() + 1);
    }
    return Number.POSITIVE_INFINITY; // 'all'
  };

  const upcoming =
    settings.upcomingMode === 'count'
      ? booked.slice(0, settings.upcomingLimit)
      : booked.filter((a) => new Date(a.starts_at).getTime() <= windowEnd(settings.upcomingWindow));

  const heading =
    settings.upcomingMode === 'count'
      ? `Upcoming Appointments (next ${settings.upcomingLimit})`
      : `Upcoming Appointments${
          settings.upcomingWindow === 'all'
            ? ''
            : ` · ${settings.upcomingWindow === 'today' ? 'Today' : settings.upcomingWindow === 'week' ? 'Next 7 days' : 'Next 30 days'}`
        }`;

  return (
    <section aria-labelledby="upcoming-heading">
      <h2 id="upcoming-heading" className="text-sm font-semibold text-gray-700">
        {heading}
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

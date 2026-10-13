'use client';

import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { StatusRow } from '@/app/lib/supabase-data';
import { useSettings } from '@/app/ui/settings/settings-context';
import { chartColors, STATUS_COLOURS } from '@/app/ui/charts/chart-theme';

export type StatusVariant = 'donut' | 'pie' | 'bar';

const DISPLAY: Record<string, string> = { booked: 'Booked', done: 'Done', no_show: 'No-show', cancelled: 'Cancelled' };

type LegendEntry = { value?: string | number; payload?: { value?: number } };
type LegendPayload = LegendEntry[];

function LegendContent({ payload, total }: { payload?: LegendPayload; total: number }) {
  return (
    <ul className="flex flex-col gap-2 text-sm text-gray-700">
      {(payload ?? []).map((entry, i) => {
        const name = String(entry.value ?? '');
        const value = Number(entry.payload?.value ?? 0);
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <li key={`${name}-${i}`} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLOURS[name] ?? '#9ca3af' }} />
            <span>
              {name}
              <span className="ml-1 text-gray-400">
                {value} ({pct}%)
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function StatusChart({ rows, variant = 'donut' }: { rows: StatusRow[]; variant?: StatusVariant }) {
  const { isDark, accent } = useSettings();
  const c = chartColors(isDark, accent);

  const total = rows.reduce((n, r) => n + r.total, 0);
  if (total === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-gray-500">
        <svg className="mb-2 h-12 w-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">No appointments this month yet.</p>
      </div>
    );
  }

  const data = rows.map((r) => ({ name: DISPLAY[r.status] ?? r.status, value: r.total }));
  const tooltipStyle = {
    backgroundColor: c.tooltipBg,
    border: `1px solid ${c.tooltipBorder}`,
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.15)',
  };

  if (variant === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: c.axis }} axisLine={{ stroke: c.axisLine }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: c.axis }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: c.tooltipLabel, fontWeight: 600 }} itemStyle={{ color: c.tooltipItem }} formatter={(v) => [Number(v ?? 0), 'appointments']} />
          <Bar dataKey="value" name="Appointments" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {data.map((d) => (
              <Cell key={d.name} fill={STATUS_COLOURS[d.name] ?? c.series} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={variant === 'donut' ? '55%' : 0}
          outerRadius="75%"
          isAnimationActive={false}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={STATUS_COLOURS[d.name] ?? '#9ca3af'} stroke={isDark ? '#0f172a' : '#ffffff'} strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: c.tooltipLabel, fontWeight: 600 }} itemStyle={{ color: c.tooltipItem }} formatter={(v, name) => [Number(v ?? 0), String(name)]} />
        <Legend layout="vertical" align="right" verticalAlign="middle" content={<LegendContent total={total} />} wrapperStyle={{ paddingTop: 20, fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

'use client';

import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PatientsPerMonth } from '@/app/lib/supabase-data';
import { useSettings } from '@/app/ui/settings/settings-context';
import { chartColors } from '@/app/ui/charts/chart-theme';

export type PatientsVariant = 'bar' | 'area' | 'line';

function computeData(rows: PatientsPerMonth[], variant: PatientsVariant) {
  if (variant === 'bar') return rows.map((r) => ({ ...r, value: r.new_patients }));
  if (variant === 'area') {
    // Cumulative total patients
    let cumulative = 0;
    return rows.map((r) => {
      cumulative += r.new_patients;
      return { ...r, value: cumulative };
    });
  }
  // line: month-over-month growth rate
  return rows.map((r, i) => {
    const prev = i > 0 ? rows[i - 1].new_patients : 0;
    const growth = prev > 0 ? ((r.new_patients - prev) / prev) * 100 : 0;
    return { ...r, value: Number(growth.toFixed(1)) };
  });
}

function yAxisLabel(variant: PatientsVariant) {
  if (variant === 'bar') return 'New patients';
  if (variant === 'area') return 'Total patients';
  return 'MoM growth %';
}

function tooltipFormatter(variant: PatientsVariant): (value: unknown) => [number, string] {
  if (variant === 'bar') return (v) => [Number(v ?? 0), 'new patients'];
  if (variant === 'area') return (v) => [Number(v ?? 0), 'total patients'];
  return (v) => [Number(v ?? 0), 'growth %'];
}

export default function PatientsChart({
  rows,
  variant = 'bar',
}: {
  rows: PatientsPerMonth[];
  variant?: PatientsVariant;
}) {
  const { isDark, accent } = useSettings();
  const c = chartColors(isDark, accent);
  const data = computeData(rows, variant);

  if (!rows || rows.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-gray-500">
        <svg className="mb-2 h-12 w-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">No patient data yet.</p>
      </div>
    );
  }

  const axis = { fontSize: 12, fill: c.axis } as const;
  const tooltipStyle = {
    backgroundColor: c.tooltipBg,
    border: `1px solid ${c.tooltipBorder}`,
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.15)',
  };
  const labelStyle = { color: c.tooltipLabel, fontWeight: 600 };
  const itemStyle = { color: c.tooltipItem };

  const children = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
      <XAxis dataKey="label" tick={axis} axisLine={{ stroke: c.axisLine }} tickLine={false} />
      <YAxis allowDecimals={variant !== 'line'} tick={axis} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} formatter={tooltipFormatter(variant)} />
    </>
  );

  return (
    <ResponsiveContainer width="100%" height={300}>
      {variant === 'area' ? (
        <AreaChart data={data}>
          {children}
          <Area type="monotone" dataKey="value" stroke={c.series} strokeWidth={2} fill={c.series} fillOpacity={0.2} name={yAxisLabel(variant)} />
        </AreaChart>
      ) : variant === 'line' ? (
        <LineChart data={data}>
          {children}
          <Line type="monotone" dataKey="value" stroke={c.series} strokeWidth={2} dot={{ r: 3 }} name={yAxisLabel(variant)} />
        </LineChart>
      ) : (
        <BarChart data={data}>
          {children}
          <Bar dataKey="value" fill={c.series} name={yAxisLabel(variant)} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}

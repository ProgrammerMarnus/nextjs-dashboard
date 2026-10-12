'use client';

import { PieChart, Pie, Sector, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PieSectorShapeProps, PieLabelRenderProps } from 'recharts';
import type { StatusRow } from '@/app/lib/supabase-data';

const DISPLAY: Record<string, string> = { booked: 'Booked', done: 'Done', no_show: 'No-show' };

// Color-blind safe palette (Okabe-Ito inspired)
const COLOURS: Record<string, string> = {
  Booked: '#0072B2',     // Blue
  Done: '#009E73',       // Green
  'No-show': '#D55E00',  // Vermillion
};

function Slice(props: PieSectorShapeProps) {
  return <Sector {...props} fill={COLOURS[String(props.name)] ?? '#9ca3af'} />;
}

function SliceLabel({ x, y, textAnchor, name, value, percent }: PieLabelRenderProps) {
  const pct = Math.round((percent ?? 0) * 100);
  return (
    <text x={x} y={y} textAnchor={textAnchor} fontSize={12} fill='#111827' fontWeight={500}>
      {String(name)}: {value} ({pct}%)
    </text>
  );
}

export default function StatusDonut({ rows }: { rows: StatusRow[] }) {
  const total = rows.reduce((n, r) => n + r.total, 0);
  if (total === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-64 text-gray-500'>
        <svg className='w-12 h-12 mb-2 opacity-50' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
        </svg>
        <p className='text-sm'>No appointments this month yet.</p>
        <p className='text-xs text-gray-400'>Add an appointment to see the status split.</p>
      </div>
    );
  }
  const data = rows.map((r) => ({ name: DISPLAY[r.status] ?? r.status, value: r.total }));
  const noShow = rows.find((r) => r.status === 'no_show')?.total ?? 0;
  const noShowPct = Math.round((noShow / total) * 100);

  return (
    <div>
      <ResponsiveContainer width='100%' height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey='value'
            nameKey='name'
            innerRadius='55%'
            outerRadius='80%'
            shape={Slice}
            label={SliceLabel}
            labelLine
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            labelStyle={{ color: '#111827', fontWeight: 600 }}
            itemStyle={{ color: '#374151' }}
            formatter={(value, name) => [Number(value ?? 0), String(name)]}
          />
          <Legend
            layout='vertical'
            align='right'
            verticalAlign='middle'
            iconType='circle'
            iconSize={10}
            wrapperStyle={{ paddingTop: 20 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className='mt-2 text-sm text-gray-600'>
        <span className='font-medium'>{noShowPct}%</span> of <span className='font-medium'>{total}</span> appointments this month were no-shows.
        <span className='ml-2 text-gray-500'>{noShowPct >= 15 ? 'Consider reminder messages.' : 'Rate is acceptable.'}</span>
      </p>
    </div>
  );
}
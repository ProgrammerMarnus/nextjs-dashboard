'use client';

import { PieChart, Pie, Sector, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PieSectorShapeProps, PieLabelRenderProps } from 'recharts';
import type { StatusRow } from '@/app/lib/data';

const DISPLAY: Record<string, string> = { booked: 'Booked', done: 'Done', no_show: 'No-show' };
const COLOURS: Record<string, string> = { Booked: '#2563eb', Done: '#16a34a', 'No-show': '#dc2626' };

function Slice(props: PieSectorShapeProps) {
  return <Sector {...props} fill={COLOURS[String(props.name)] ?? '#9ca3af'} />;
}

function SliceLabel({ x, y, textAnchor, name, value, percent }: PieLabelRenderProps) {
  const pct = Math.round((percent ?? 0) * 100);
  return (
    <text x={x} y={y} textAnchor={textAnchor} fontSize={12} fill='#111827'>
      {String(name)}: {value} ({pct}%)
    </text>
  );
}

export default function StatusDonut({ rows }: { rows: StatusRow[] }) {
  const total = rows.reduce((n, r) => n + r.total, 0);
  if (total === 0) {
    return <p className='text-sm text-gray-500'>No appointments this month yet. Add one to see the split.</p>;
  }
  const data = rows.map((r) => ({ name: DISPLAY[r.status] ?? r.status, value: r.total }));
  const noShow = rows.find((r) => r.status === 'no_show')?.total ?? 0;

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
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <p className='text-sm'>
        {Math.round((noShow / total) * 100)}% of {total} appointments this month were no-shows.
        The owner decides whether to send reminder messages.
      </p>
    </div>
  );
}
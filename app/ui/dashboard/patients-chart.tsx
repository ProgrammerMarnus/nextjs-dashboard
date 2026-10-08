'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PatientsPerMonth } from '@/app/lib/data';

export default function PatientsChart({ rows }: { rows: PatientsPerMonth[] }) {
  if (rows.length === 0) {
    return <p className='text-sm text-gray-500'>No patient data yet.</p>;
  }
  return (
    <div>
      <ResponsiveContainer width='100%' height={300}>
        <BarChart data={rows} layout='vertical'>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis type='number' unit=' patients' tick={{ fontSize: 12 }} />
          <YAxis
            type='category'
            dataKey='label'
            tick={{ fontSize: 12 }}
            width={80}
            tickMargin={10}
          />
          <Tooltip />
          <Legend />
          <Bar dataKey='new_patients' fill='#2563eb' name='New patients' radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className='text-sm'>
        {rows[0]?.new_patients ?? 0} new patients last month. The owner tracks growth to plan capacity.
      </p>
    </div>
  );
}
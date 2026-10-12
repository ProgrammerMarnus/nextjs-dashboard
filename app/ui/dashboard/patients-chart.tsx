'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PatientsPerMonth } from '@/app/lib/supabase-data';

const COLOR_BLIND_BLUE = '#0072B2';

export default function PatientsChart({ rows }: { rows: PatientsPerMonth[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-64 text-gray-500'>
        <svg className='w-12 h-12 mb-2 opacity-50' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
        </svg>
        <p className='text-sm'>No patient data yet.</p>
        <p className='text-xs text-gray-400'>Create patients to see growth trends.</p>
      </div>
    );
  }

  const lastMonth = rows[rows.length - 1];
  const prevMonth = rows[rows.length - 2];
  const change = prevMonth ? lastMonth.new_patients - prevMonth.new_patients : 0;
  const changeText = change > 0 ? `+${change} vs last month` : change < 0 ? `${change} vs last month` : 'Same as last month';

  return (
    <div>
      <ResponsiveContainer width='100%' height={300}>
        <BarChart data={rows} layout='vertical'>
          <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
          <XAxis
            type='number'
            unit=' patients'
            tick={{ fontSize: 12, fill: '#374151' }}
            axisLine={{ stroke: '#9ca3af' }}
            tickLine={false}
          />
          <YAxis
            type='category'
            dataKey='label'
            tick={{ fontSize: 12, fill: '#374151' }}
            width={80}
            tickMargin={10}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            labelStyle={{ color: '#111827', fontWeight: 600 }}
            itemStyle={{ color: '#374151' }}
            formatter={(value) => [Number(value ?? 0), 'new patients']}
          />
          <Bar
            dataKey='new_patients'
            fill={COLOR_BLIND_BLUE}
            name='New patients'
            radius={[0, 4, 4, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
      <p className='mt-2 text-sm text-gray-600'>
        <span className='font-medium'>{lastMonth.new_patients}</span> new patients last month.
        <span className='ml-2 text-gray-500'>{changeText}.</span>
        The owner tracks growth to plan capacity.
      </p>
    </div>
  );
}
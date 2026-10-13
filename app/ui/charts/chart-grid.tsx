'use client';

import { useSettings, CHART_OPTIONS, type ChartKey } from '@/app/ui/settings/settings-context';
import type { PatientsPerMonth, StatusRow } from '@/app/lib/supabase-data';
import PatientsChart from '@/app/ui/charts/patients-chart';
import StatusChart from '@/app/ui/charts/status-chart';

const PATIENTS_VARIANT: Record<string, 'bar' | 'area' | 'line'> = {
  'patients-bar': 'bar',
  'patients-area': 'area',
  'patients-line': 'line',
};
const STATUS_VARIANT: Record<string, 'donut' | 'pie' | 'bar'> = {
  'status-donut': 'donut',
  'status-pie': 'pie',
  'status-bar': 'bar',
};

function labelFor(key: ChartKey): string {
  return CHART_OPTIONS.find((o) => o.key === key)?.title ?? 'Chart';
}

function Slot({
  slotKey,
  patients,
  status,
}: {
  slotKey: ChartKey;
  patients: PatientsPerMonth[];
  status: StatusRow[];
}) {
  if (slotKey in PATIENTS_VARIANT) {
    return <PatientsChart rows={patients} variant={PATIENTS_VARIANT[slotKey]} />;
  }
  if (slotKey in STATUS_VARIANT) {
    return <StatusChart rows={status} variant={STATUS_VARIANT[slotKey]} />;
  }
  return null;
}

// Renders the two dashboard chart slots. Reads the chosen chart keys from
// settings so each slot always shows a different, user-selected chart type.
export default function ChartGrid({
  patients,
  status,
}: {
  patients: PatientsPerMonth[];
  status: StatusRow[];
}) {
  const { settings } = useSettings();
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      {settings.chartSlots.map((key, i) => (
        <section key={`${key}-${i}`} className="rounded-md border p-4">
          <h2 className="font-semibold">{labelFor(key)}</h2>
          <Slot slotKey={key} patients={patients} status={status} />
        </section>
      ))}
    </div>
  );
}

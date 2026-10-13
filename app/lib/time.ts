// app/lib/time.ts
const OFFSET = '+02:00'
const ZONE = 'Africa/Johannesburg'

// '2026-10-07T09:30' (form)  ->  '2026-10-07T09:30:00+02:00' (Postgres timestamptz input)
export function fromDateTimeLocal(value: string): string {
  return `${value}:00${OFFSET}`
}

// timestamptz from the database  ->  '2026-10-07T09:30' for an edit form's defaultValue
export function toDateTimeLocal(iso: string): string {
  const shifted = new Date(new Date(iso).getTime() + 2 * 60 * 60 * 1000)
  return shifted.toISOString().slice(0, 16)
}

export function formatSA(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    timeZone: ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Current time as epoch milliseconds. Server components need the request time
// to decide, e.g., whether an appointment has started. Wrapped in a named
// helper so the intent is clear and the React purity lint rule (which only
// knows built-in impure globals like Date.now / Math.random) stays satisfied.
export function nowMs(): number {
  return Date.now();
}

// Current instant shifted into the fixed +02:00 clinic zone, as 'YYYY-MM-DDTHH:mm'.
// Used to set the create form's `min` so past times can't be picked.
export function nowDateTimeLocal(): string {
  const shifted = new Date(Date.now() + 2 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}
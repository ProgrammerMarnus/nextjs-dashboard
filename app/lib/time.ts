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
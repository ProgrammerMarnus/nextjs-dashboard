# Practice Dashboard

A medical practice dashboard for tracking patient growth and appointment no-show rates. Built with Next.js 16, Supabase (PostgreSQL + Auth + RLS), and deployed on Vercel.

## Production URL
https://nextjs-org-learn.vercel.app

## Demo Login
- **Owner**: `user@nextmail.com` / `123456` — 30+ patients, 200+ appointments seeded
- **Second user (RLS test)**: `user2@nextmail.com` / `123456` — separate data, cannot see owner's data

## What It Does
- **Patients CRUD**: Create, read, update, delete patients
- **Appointments CRUD**: Create, read, update, delete appointments with patient selection
- **Chart 1 — Growth**: New patients per month (last 6 months), horizontal bar chart
- **Chart 2 — No-shows**: Appointment status split this month, donut chart

## Who It's For
Solo practitioners or small clinic owners who need to:
- Track month-over-month patient acquisition
- Monitor no-show rates to decide on reminder messaging

## Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (email/password)
- **RLS**: Row Level Security on all domain tables
- **Charts**: Recharts (color-blind safe palette)
- **Validation**: Zod
- **Styling**: Tailwind CSS
- **Deploy**: Vercel

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
POSTGRES_URL (pooled)
POSTGRES_URL_NON_POOLING
POSTGRES_HOST
POSTGRES_DATABASE
POSTGRES_USER
POSTGRES_PASSWORD
```

## Local Development
```bash
pnpm install
cp .env.example .env.local   # fill in your Supabase credentials
pnpm dev
```

## Database Setup
Run SQL files in `supabase/` in order:
1. `patients.sql` — patients table + RLS policies
2. `appointments.sql` — appointments table + RLS policies (FK to patients)
3. `patients_per_month.sql` — chart view #1 (security_invoker = true)
4. `appointment-status-view.sql` — chart view #2 (security_invoker = true)
5. `seed_patients.sql` — demo data (replace UUID with your user's UID)

## RLS Verification
RLS is enabled on `patients` and `appointments`. Policies enforce `user_id = auth.uid()`. Verified in production: user B cannot see or edit user A's rows (tested 12 Oct 2026).

## Project Structure
```
app/
├── dashboard/
│   ├── (overview)/page.tsx      # Dashboard with two charts
│   ├── patients/                # Patients CRUD pages
│   └── appointments/            # Appointments CRUD pages
├── lib/
│   ├── actions.ts               # Server actions (mutations)
│   ├── supabase-data.ts         # Server data fetching
│   ├── errors.ts                # Error handling
│   └── definitions.ts           # TypeScript types
└── ui/
    ├── dashboard/
    │   ├── patients-chart.tsx   # Bar chart (color-blind safe)
    │   └── status-donut.tsx     # Donut chart (color-blind safe)
    ├── patients/                # Patient form components
    └── appointments/            # Appointment form components
```

## Scripts
```bash
pnpm build      # Production build
pnpm dev        # Development server (Turbopack)
pnpm lint       # ESLint
```

## Freeze Plan (8 Oct)
### Must Ship
1. Appointments list: patient name, time, status
2. Appointments create: patient select, datetime-local, status
3. Appointments edit: pre-filled patient and time
4. Appointments delete: removes row, list re-renders
5. Two charts render from real data behind RLS

### Cut
- Third entity (invoices): two entities and two charts not yet stable
- Realtime: not started

### Polish (Post-Freeze)
1. Empty-state wording on charts
2. Color-blind accessible chart colours
3. Favicon and pitch paragraph in README

## Smoke Checklist (12 Oct 2026, Production)
- [x] Owner login works
- [x] Second user login works
- [x] Patients CRUD works for both users
- [x] Appointments CRUD works for both users
- [x] Chart 1 renders patient growth data
- [x] Chart 2 renders appointment status split
- [x] RLS: user B cannot see user A's patients
- [x] RLS: user B cannot see user A's appointments
- [x] RLS: user B cannot edit user A's rows
- [x] .env.local not in repo
- [x] RLS enabled on all domain tables
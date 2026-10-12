## Practice Dashboard

A medical practice dashboard for tracking patient growth and appointment no-show rates. Built with Next.js 16, Supabase (PostgreSQL + Auth + RLS), and deployed on Vercel.

### Who it's for
Solo practitioners or small clinic owners who want to:
- Track new patient acquisition month-over-month
- Monitor appointment no-show rates to decide on reminder messaging

### Chart questions

**Chart 1: Is the practice growing?**
- Question: New patients per month (last 6 months)
- Who acts: The owner decides whether to open a second consulting day
- Shape: Horizontal bar chart, one bar per month
- Data source: `patients_per_month` view (security_invoker = true)

**Chart 2: What share of this month's appointments are no-shows?**
- Question: No-show percentage of this month's appointments
- Who acts: The owner decides whether to send reminder messages
- Shape: Donut chart with status breakdown
- Data source: `appointment_status_this_month` view (security_invoker = true)

### Roles & Demo Login
- **Owner (demo)**: `user@nextmail.com` / `123456` — has 30+ patients and 200+ appointments seeded
- **Second user (RLS test)**: `user2@nextmail.com` / `123456` — has separate patient data, cannot see owner's data

### Production URL
https://nextjs-org-learn.vercel.app

### How to run locally
```bash
pnpm install
cp .env.example .env.local   # fill in your Supabase credentials
pnpm dev
```

### Environment variables (names only)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `POSTGRES_URL` (pooled)
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_HOST`
- `POSTGRES_DATABASE`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

### Database setup
Run the SQL files in `supabase/` in order:
1. `patients.sql` — patients table + RLS
2. `appointments.sql` — appointments table + RLS (FK to patients)
3. `patients_per_month.sql` — chart view #1
4. `appointment-status-view.sql` — chart view #2
5. `seed_patients.sql` — demo data (replace the UUID with your user's UID)

### Freeze plan (8 Oct)

#### Must ship today (max 5, each one testable on the preview URL)
1. Appointments list shows patient name, time, status; smoke check 1
2. Appointments create with patient select, datetime-local, status; smoke check 2
3. Appointments edit opens with correct patient and time; smoke check 3
4. Appointments delete removes row and list re-renders; smoke check 4
5. Two charts render on /dashboard from real rows behind RLS; smoke check 5

#### Cut (one honest sentence each)
- Third entity (invoices): cut; two entities and two charts were not yet stable in production on 8 Oct
- Stretch (Realtime): cut; not started

#### Monday polish (max 3, cosmetic or README-only)
1. Empty-state wording on charts
2. Chart colours for colour-blind accessibility
3. Favicon and pitch paragraph in README

### Smoke test
RLS: user B cannot see or edit user A's patients or appointments (checked 12 Oct 2026, production)
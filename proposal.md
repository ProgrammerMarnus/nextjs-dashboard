# Cura Health — Practice Dashboard

_A capstone: a patient & appointment manager for small clinics, built with Next.js, Supabase, and Recharts._

---

## 1. What it does (2–3 sentences)

Cura Health is a practice dashboard where a clinic owner signs in, manages patients and their
appointments, and instantly sees how the practice is growing. It prevents double-booking, tracks
whether each appointment was **Done**, a **No-show**, or **Cancelled**, and surfaces the next few
upcoming appointments with one-tap status updates. Two charts turn that activity into signal:
monthly patient growth and this month's appointment-status split.

## 2. Live link & demo login

- **Production:** https://nextjs-org-learn.vercel.app
- **Demo account (owner):** `user@nextmail.com` / `123456`
  - 30+ patients, ~64 appointments across the last 6 months, seeded deterministically.
- **Second account (RLS proof):** `user2@nextmail.com` / `123456`
  - A separate clinic's data that **cannot** see or edit the owner's rows.

> Sign in with the owner account for the demo; sign in with the second account to show isolation.

## 3. How to run it

```bash
git clone <repo> && cd nextjs-org-learn
pnpm install

# Local env — create .env.local with your Supabase + Postgres credentials:
#   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
#   SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET,
#   POSTGRES_URL, POSTGRES_URL_NON_POOLING, POSTGRES_HOST, POSTGRES_DATABASE,
#   POSTGRES_USER, POSTGRES_PASSWORD

pnpm dev        # http://localhost:3000  (Turbopack)
```

**Database setup** — run the SQL files in `supabase/` in order (`patients.sql`,
`appointments.sql`, `appointments-fix.sql`, `patients_per_month.sql`,
`appointment-status-view.sql`, `appointments-no-overlap.sql`). Then seed realistic demo data:

```bash
node --env-file=.env scripts/reset-reseed.mjs   # wipe + reseed both clinics deterministically
```

**Quality gates:** `pnpm test` (Vitest unit tests), `pnpm lint` (ESLint), `pnpm build` (prod build),
`pnpm test:e2e` (Playwright, incl. RLS isolation between the two demo users).

## 4. Tech stack & why

| Choice | Why |
| --- | --- |
| **Next.js 16 (App Router + Turbopack)** | Server Components fetch data behind auth so the DB client and secrets never ship to the browser; Server Actions give type-safe mutations with progressive enhancement (forms work before hydration). |
| **Supabase (PostgreSQL)** | Managed Postgres with **Row Level Security** built in — the security boundary lives in the database, not just app code. |
| **Supabase Auth (`@supabase/ssr`)** | Email/password sessions stored as secure cookies; no session-handling library to babysit. |
| **Row Level Security** | Every domain table enforces `user_id = auth.uid()`. A forgotten `WHERE` clause in application code still cannot leak another clinic's data. This is the core trust decision. |
| **Postgres exclusion constraint** | Enforces "no double-booking" at the database level (`tstzrange` overlap via `btree_gist`), so two people booking the same 30-minute slot can't race past it. |
| **Recharts** | Declarative React charts; used with a **color-blind-safe (Okabe-Ito)** palette so statuses stay distinguishable. |
| **Zod** | Single source of truth for validating every server action's input. |
| **Tailwind CSS** | Utility-first styling for fast, consistent, responsive UI (including a mobile bottom nav). |
| **Vercel** | Zero-config deploys for the App Router; the production URL above is the deployed build. |

## 5. Known limitations (honest)

1. **Single clinic timezone.** Appointment times are stored in UTC and displayed in one fixed clinic
   timezone; there is no per-user timezone picker, so the app isn't ready for geographically
   distributed staff without a timezone setting.
2. **Manual status tracking.** "Done" / "No-show" are resolved by staff clicking a button after the
   slot — there are **no automated reminders, emails, or calendar invites**, so the no-show rate only
   reflects what staff record. Charts also use fixed windows (last 6 months / this month) with no
   custom date range.

## 6. What I would do next (three concrete things)

1. **Automated appointment reminders (email/SMS 24h ahead).** Because the app already records
   `no_show` status, I'd wire reminders and then measure the drop in the no-show rate on the status
   chart — turning a tracked metric into a lever that improves the practice.
2. **Custom date ranges + CSV export.** Generalize both charts to accept a start/end date and add an
   export so practitioners can pull quarter-over-quarter growth and hand reports to accountants.
3. **Roles & multi-provider scheduling.** Add receptionist vs. practitioner roles, and generalize the
   no-double-booking constraint from "per user" to "per provider" so one clinic can run several
   calendars side by side.

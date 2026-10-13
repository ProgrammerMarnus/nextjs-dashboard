# Cura Health — Practice Dashboard

A patient & appointment manager for small clinics, built with **Next.js 16**, **Supabase**
(PostgreSQL + Auth + Row Level Security), and **Recharts**. Deployed on Vercel.

---

## 1. What it does (2–3 sentences)

Cura Health lets a clinic owner sign in, manage patients and their appointments, and see how the
practice is growing at a glance. It prevents double-booking, tracks whether each appointment was
**Done**, a **No-show**, or **Cancelled**, and surfaces the next few upcoming appointments with
one-tap status updates. Two charts turn that activity into signal: monthly patient growth and this
month's appointment-status split.

## 2. Live link & demo login

- **Production:** https://nextjs-org-learn.vercel.app
- **Demo account (owner):** `user@nextmail.com` / `123456` — 30+ patients, ~64 seeded appointments.
- **Second account (RLS proof):** `user2@nextmail.com` / `123456` — a separate clinic whose data the
  owner cannot see or edit (and vice-versa).
- **Backup recording:** _paste your Loom/OBS link here_ — a 5-minute run of the [`demo.md`](./demo.md)
  walk, kept in case the live demo fails.

## 3. How to run it

```bash
pnpm install
cp .env.example .env.local   # fill in your Supabase + Postgres credentials (see below)
pnpm dev                     # http://localhost:3000 (Turbopack)
```

Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`,
`POSTGRES_HOST`, `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.

**Database:** run the SQL files in `supabase/` in order (`patients.sql`, `appointments.sql`,
`appointments-fix.sql`, `patients_per_month.sql`, `appointment-status-view.sql`,
`appointments-no-overlap.sql`). Then seed realistic demo data:

```bash
node --env-file=.env scripts/reset-reseed.mjs   # deterministic wipe + reseed of both demo users
```

**Quality gates:** `pnpm test` (Vitest), `pnpm lint` (ESLint), `pnpm build`, `pnpm test:e2e`
(Playwright, including RLS isolation between the two demo users).

## 4. Tech stack & why

- **Next.js 16 (App Router + Turbopack):** Server Components fetch data behind auth so DB secrets
  never ship to the browser; Server Actions give type-safe, progressively-enhanced mutations.
- **Supabase PostgreSQL:** managed database with Row Level Security built in.
- **Supabase Auth (`@supabase/ssr`):** email/password sessions in secure cookies.
- **Row Level Security:** every domain table enforces `user_id = auth.uid()`, so a bug in app code
  still cannot leak another clinic's data — the core trust decision of the project.
- **Postgres exclusion constraint:** prevents double-booking at the database level (tstzrange overlap
  via `btree_gist`), so two users can't race to book the same 30-minute slot.
- **Recharts:** declarative charts with a color-blind-safe (Okabe-Ito) palette.
- **Zod:** single source of truth for validating server-action input.
- **Tailwind CSS:** utility-first, responsive styling (incl. a mobile bottom nav).
- **Vercel:** zero-config deploys for the App Router.

## 5. Known limitations

1. **Single clinic timezone.** Times are stored in UTC and shown in one fixed clinic timezone; there's
   no per-user timezone setting, so it isn't ready for geographically distributed staff.
2. **Manual status tracking.** Done / No-show are resolved by staff after the slot — there are no
   automated reminders or calendar invites, and the charts use fixed windows (last 6 months / this
   month) with no custom date range.

## 6. What I would do next (three concrete things)

1. **Automated appointment reminders (email/SMS 24h ahead).** Since the app already records
   `no_show`, I'd measure the drop in the no-show rate on the status chart — turning a tracked metric
   into a lever that improves the practice.
2. **Custom date ranges + CSV export.** Let both charts take a start/end date and export data for
   accountants and quarter-over-quarter reporting.
3. **Roles & multi-provider scheduling.** Add receptionist vs. practitioner roles and generalize the
   no-double-booking constraint from "per user" to "per provider" so one clinic runs several calendars.

---

**Docs:** see [`proposal.md`](./proposal.md) for the capstone proposal and [`demo.md`](./demo.md) for
the 5-minute demo script.

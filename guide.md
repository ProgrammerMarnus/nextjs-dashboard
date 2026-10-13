# Project Guide — `nextjs-dashboard`

A complete, file-by-file map of this codebase: what every part does, where it lives, and the
small details that matter. Written so a new developer (or future you) can navigate the repo
without guessing.

---

## 1. What this is

A **medical practice dashboard** for a solo/small clinic owner. It answers two Monday-morning
questions and lets the owner manage two core records:

- **Patients** — full CRUD (create, read, update, delete).
- **Appointments** — full CRUD, each linked to a patient, with a status (`booked` / `done` / `no_show`).
- **Chart 1 (Growth)** — new patients per month over the last 6 months (horizontal bar chart).
- **Chart 2 (No-shows)** — this month's appointment status split (donut chart).

Everything is scoped per user by **Row Level Security (RLS)**: user B can never see or edit
user A's rows. The project is a customised fork of the official *Next.js Learn Dashboard*
tutorial, re-pointed at a clinic domain and backed by Supabase.

- **Live URL:** https://nextjs-org-learn.vercel.app
- **Demo logins:** `user@nextmail.com` / `123456` (owner, seeded) and `user2@nextmail.com` / `123456` (RLS test user).

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) | Server Components + Server Actions |
| Language | **TypeScript 5.7** | `strict` mode |
| Database | **Supabase** (PostgreSQL) | via `@supabase/supabase-js` |
| Auth | **Supabase Auth** (email/password) | SSR cookie session |
| Security | **Postgres RLS** on every domain table | `user_id = auth.uid()` |
| Styling | **Tailwind CSS 3.4** | `@tailwindcss/forms` plugin |
| Charts | **Recharts 3.10** | colour-blind-safe palette |
| Validation | **Zod 3** | in Server Actions |
| Unit tests | **Vitest 2** + jsdom + Testing Library | mocks Supabase |
| E2E tests | **Playwright** | chromium/firefox/webkit |
| Deploy | **Vercel** | |

Package manager is **pnpm 9.15** (see `packageManager` in `package.json`).

---

## 3. How to run it

```bash
pnpm install
cp .env.example .env.local      # fill in your Supabase credentials (see section 10)
pnpm dev                        # http://localhost:3000 (Turbopack)
```

Other scripts (from `package.json`):

| Script | Does |
|---|---|
| `pnpm build` | `next build` — production build |
| `pnpm dev` | `next dev --turbopack` — dev server |
| `pnpm start` | `next start` — serve a prior `build` (needs `.next`) |
| `pnpm lint` | `eslint .` |
| `pnpm test` | `vitest run` — unit tests (no Supabase needed) |
| `pnpm test:e2e` | `playwright test` — needs a running app + real Supabase |

> **Note on tests:** `vitest` mocks the Supabase client (`vitest.setup.ts`), so unit tests run
> with **no `.env` and no database**. Playwright e2e tests need the dev/prod server *and* a live
> Supabase backend (they create real rows and prove RLS isolation).

---

## 4. Directory map (top level)

```
├── app/            # Next.js App Router: routes, layouts, UI, server logic
├── utils/          # Supabase client factories (browser/server/proxy)
├── supabase/       # SQL: schema, RLS policies, chart views, seed data
├── e2e/            # Playwright end-to-end specs (wired to `test:e2e`)
├── tests/          # Extra Playwright specs (auth + RLS isolation; NOT in default testDir)
├── docs/guides/    # Written how-to guides (charts, RLS, auth, proposal template)
├── public/         # Static assets (images, favicon, customer avatars)
├── proxy.ts        # Next.js "middleware" entrypoint (session refresh + route guard)
├── *.config.*      # Build/lint/test tooling config
└── guide.md        # This file
```

---

## 5. `app/` — routes, pages, layouts

Next.js uses **file-system routing**: a `page.tsx` becomes a URL, a `layout.tsx` wraps its
children, a `route.ts` is an API endpoint.

### Route tree (what maps to what URL)

| File | URL | Type |
|---|---|---|
| `app/page.tsx` | `/` | Public landing page |
| `app/login/page.tsx` | `/login` | Public login page |
| `app/layout.tsx` | (all) | Root layout: `<html>`, fonts, metadata |
| `app/dashboard/layout.tsx` | `/dashboard/*` | Sidebar shell for all dashboard pages |
| `app/dashboard/(overview)/page.tsx` | `/dashboard` | Overview: the two charts |
| `app/dashboard/(overview)/loading.tsx` | `/dashboard` | Suspense skeleton while charts load |
| `app/dashboard/patients/page.tsx` | `/dashboard/patients` | Patients list |
| `app/dashboard/patients/loading.tsx` | `/dashboard/patients` | Suspense skeleton (`PatientsTableSkeleton`) while the list loads |
| `app/dashboard/patients/create/page.tsx` | `/dashboard/patients/create` | Add patient form |
| `app/dashboard/patients/[id]/edit/page.tsx` | `/dashboard/patients/<id>/edit` | Edit patient form |
| `app/dashboard/patients/[id]/edit/not-found.tsx` | (404 in that route) | Custom 404 for missing patient |
| `app/dashboard/error.tsx` | (any `/dashboard/*`) | Error boundary for the whole dashboard segment (see below) |
| `app/dashboard/appointments/page.tsx` | `/dashboard/appointments` | Appointments list |
| `app/dashboard/appointments/loading.tsx` | `/dashboard/appointments` | Suspense skeleton (`AppointmentsTableSkeleton`) while the list loads |
| `app/dashboard/appointments/create/page.tsx` | `/dashboard/appointments/create` | Add appointment form |
| `app/dashboard/appointments/[id]/edit/page.tsx` | `/dashboard/appointments/<id>/edit` | Edit appointment form |
| `app/dashboard/appointments/[id]/edit/not-found.tsx` | (404 in that route) | Custom 404 for missing appointment |
| `app/dashboard/settings/page.tsx` | `/dashboard/settings` | Settings page (theme, charts, upcoming) |
| `app/dashboard/settings/layout.tsx` | `/dashboard/settings` | Settings layout (server wrapper) |
| `app/seed/route.ts` | `/seed` | API: seeds legacy tutorial tables (`users`, `customers`, `invoices`, `revenue`) |
| `app/query/route.ts` | `/query` | API: demo query joining legacy `invoices` + `customers` |

**Small details worth knowing:**

- `(overview)` is a **route group** — the parentheses keep it out of the URL, so its `page.tsx`
  is served at `/dashboard` (not `/dashboard/overview`). The `loading.tsx` in that group is the
  Suspense fallback shown while `page.tsx`'s `await` data calls resolve.
- `[id]` is a **dynamic segment**. In Next 15+ `params` is a **Promise**, so pages do
  `const { id } = await params;` (see both `edit/page.tsx` files).
- `chart-check` is intentionally temporary ("delete it on Wednesday") — it renders a `<pre>` of
  the chart view so you can eyeball that RLS returns the right rows per user.
- `error.tsx` is a **Client Component error boundary** for the entire `/dashboard/*` segment. If a
  Server Component fetch raises `AppError` (or any render throws), Next renders this instead of a
  blank 500; it logs the error and offers a **Try again** button that calls `reset()` to retry the
  segment. It must be `'use client'` because it uses `useEffect` and the `reset` callback.
- `loading.tsx` files wrap their sibling `page.tsx` in a **Suspense boundary** automatically. The
  overview, patients, and appointments lists each have one, reusing the existing skeleton
  components from `app/ui/skeletons.tsx`.
- `not-found.tsx` renders when a route calls `notFound()`. Both `patients/[id]/edit` and
  `appointments/[id]/edit` have one, so a bad or missing id shows a friendly 404 with a "Go back"
  link instead of Next's default.
- `seed` and `query` are **leftovers from the tutorial**. They reference `invoices`/`customers`/
  `revenue` tables that this clinic project **does not create** (see section 12). Hitting them against
  the real clinic database errors. They are kept only as reference.

### `app/layout.tsx` (root)
- Imports `global.css`, applies the **Inter** font, and sets `metadata` (title template
  `%s | Acme Dashboard`, `metadataBase`). Wraps every page in `<html><body>`.

### `app/dashboard/layout.tsx`
- Renders `<SideNav />` beside the page content. Fixed sidebar on desktop (`md:w-64`), stacked on
  mobile. This layout persists across all `/dashboard/*` navigations (sidebar isn't re-mounted).

---

## 6. `app/lib/` — server logic, types, helpers

This is the brain of the app.

### `actions.ts` — Server Actions (all mutations)
Marked `'use server'` at the top, so **every export is a callable server function** (invoked
directly from forms). Important constraint: a `'use server'` module may **only export async
functions** — exporting a `const`/object breaks the build (we hit and reverted exactly this).

Exports and what they do:

| Action | Purpose | Validation |
|---|---|---|
| `createAppointment(prevState, formData)` | Insert an appointment (returns state, redirects); slot conflicts (PG `23P01`) return an inline message | `AppointmentSchema` |
| `updateAppointment(id, prevState, formData)` | Update by id; same slot-conflict handling | `IdSchema` (UUID) + `AppointmentSchema` |
| `deleteAppointment(id)` | Delete by id | `IdSchema` |
| `signIn(prevState, formData)` | Supabase password sign-in; `redirect` on success | inline Zod (email + password >= 6) |
| `signOut()` | Sign out, redirect to `/` | — |
| `createPatient(prevState, formData)` | Insert patient (returns state, redirects) | `PatientSchema` |
| `updatePatient(id, prevState, formData)` | Update patient | `PatientSchema` |
| `deletePatient(id)` | Delete patient | `IdSchema` |

Internal (not exported, by design): `IdSchema` (UUID), `AppointmentSchema`
(`patient_id`, `starts_at`, `status` in {booked,done,no_show}), `PatientSchema`
(`full_name` required; `phone`, `date_of_birth` optional), `parseAppointment()`.

**Two return conventions coexist:**
- Appointment/auth actions **`throw`** an `AppError` on DB failure (form-bound via `.bind`).
- Patient actions **return** a `PatientState` (`{ errors, message }`) instead of throwing, because
  their forms use `useActionState` and render field-level errors inline.

**Datetime handling:** `starts_at` is picked in a custom calendar component
(`appointments/datetime-picker.tsx`, `'use client'`): a month grid plus 08:00–17:30
30-minute time slots, fed taken slots by the create/edit pages. Booked days render
amber; a booked start time (`isBookedSlot`) renders light red;
the selected day/slot renders transparent green; past dates are greyed and disabled
(`disallowPast`, create form only). The picker writes `'YYYY-MM-DDTHH:mm'` (e.g.
`2026-10-07T09:30`) into a hidden `starts_at` input, converted to a Postgres
`timestamptz` string by `fromDateTimeLocal()` (appends `:00+02:00`, the SAST offset)
before insert. Past times are hard-rejected by `createAppointment` before touching
the DB. See `time.ts`.

**Revalidation:** after a successful mutation, each action calls `revalidatePath('/dashboard/...')`
so the affected list re-fetches fresh data.

### `supabase-data.ts` — read functions (server data fetching)
Each function builds a server Supabase client, runs a `.select()`, and throws an `AppError` on
failure. Exports:

| Function | Reads | Ordered by |
|---|---|---|
| `fetchPatients()` | `patients` (full columns) | `created_at` desc |
| `fetchPatientsPerMonth()` | view `patients_per_month` | `month_start` asc |
| `fetchAppointments()` | `appointments` joined to `patients(full_name)` | `starts_at` desc |
| `fetchAppointmentStatusThisMonth()` | view `appointment_status_this_month` | — |
| `fetchPatientOptions()` | `patients` (`id`, `full_name`) | `full_name` |
| `fetchPatientById(id)` | single `patients` row (`maybeSingle`) | — |
| `fetchAppointmentById(id)` | single `appointments` row (`single`) | — |
| `fetchAppointmentSlotTimes(excludeId?)` | all appointment `starts_at` (ISO), minus one row for edit | — |

Also **defines the shared row types** used across the app: `Patient`, `PatientsPerMonth`,
`AppointmentRow`, `StatusRow`. (Note: `definitions.ts` holds a *parallel, older* copy of some of
these types — see section 12.)

### `errors.ts` — typed error handling
- `AppError` — an `Error` subclass carrying `code`, `status` (default 500), and `details`.
- `handleError(error, fallback)` — normalises anything into an `AppError` (passes `AppError`
  through, wraps `Error`, wraps unknown values with the fallback message).
- `isAppError(error)` — type guard.
- `ActionResult<T>` — a `{success,data}` / `{success,error}` union (defined but not yet used).

### `time.ts` — South Africa timezone helpers
- `OFFSET = '+02:00'`, `ZONE = 'Africa/Johannesburg'`.
- `fromDateTimeLocal('2026-10-07T09:30')` -> `'2026-10-07T09:30:00+02:00'` (form -> Postgres).
- `toDateTimeLocal(iso)` -> `'2026-10-07T09:30'` (Postgres -> edit-form `defaultValue`), shifting
  by +2h before slicing.
- `formatSA(iso)` -> `en-ZA` string like `"07 Oct 2026, 09:30"` (display in the appointments table).
- `nowDateTimeLocal()` — current instant as `'YYYY-MM-DDTHH:mm'` in the `+02:00` zone;
  floor for the create-form picker (`disallowPast`).

### `utils.ts` — small formatters
`formatCurrency` (cents -> USD), `formatDateToLocal`, `generatePagination` (page-number windowing).
Mostly unused by the clinic features but kept from the tutorial.

### `placeholder-data.ts` — legacy demo data
Arrays `users`, `customers`, `invoices`, `revenue` from the tutorial. Consumed only by
`seed/route.ts`; **not** used by the clinic UI. ESLint ignores this file.

### Test files (in `app/lib/`)
- `actions.test.ts` — unit tests for the Server Actions, with `createClient` mocked in-file so the
  module graph shares one mock instance. Covers insert/update/delete calls, `AppError` on DB
  failure, invalid-UUID rejection, sign-in success (asserts `redirect`) and failure, and the
  `PatientSchema` custom message.
- `errors.test.ts` — 9 tests for `AppError`, `handleError`, `isAppError`.

---

## 7. `app/ui/` — components

### Shared
- `button.tsx` — the blue `Button` (used by forms; `aria-disabled` while pending).
- `acme-logo.tsx` — the "Acme" globe wordmark (Lusitana font).
- `fonts.ts` — loads **Inter** and **Lusitana** via `next/font/google`; exports `.className`s.
- `global.css` — Tailwind directives + a rule to hide number-input spinners.
- `home.module.css` — a decorative `shape` used on the landing page.
- `skeletons.tsx` — shimmer loading placeholders (`DashboardSkeleton`, `ChartSkeleton`,
  `PatientsTableSkeleton`, `AppointmentsTableSkeleton`, `TableRowSkeleton`).
- `search.tsx` — debounced search box that writes `?query=` to the URL (built, but not currently
  mounted on the list pages).

### Auth
- `login-form.tsx` (`'use client'`) — email/password form wired to the `signIn` Server Action via
  `useActionState`. Shows inline error from `state.error`, disables the button while pending, and
  posts a hidden `redirectTo` (from `?callbackUrl`, default `/dashboard`).

### Dashboard
- `dashboard/sidenav.tsx` — sidebar: logo link, `<NavLinks />`, spacer, and a **Sign Out** form
  bound to the `signOut` action.
- `dashboard/nav-links.tsx` (`'use client'`) — the nav items. **Currently: Home, Patients,
  Appointments, Settings** (previously pointed at non-existent `/dashboard/invoices` and
  `/dashboard/customers`; fixed to real routes). Highlights the active link with `usePathname`.
- `dashboard/upcoming-appointments.tsx` — shared **server** component rendering the next 3
  `booked` appointments with **Done / No-show** (enabled only after the slot starts) and **Cancel**
  (enabled any time before it starts) buttons. Used on the Dashboard and Appointments page.
- `dashboard/upcoming-list.tsx` (`'use client'`) — client component that filters and renders
  upcoming appointments based on user settings (count mode or time window).

### Patients
- `patients/buttons.tsx` — `CreatePatient` (link), `UpdatePatient` (link to edit),
  `DeletePatient` (form bound to `deletePatient`).
- `patients/create-form.tsx` / `edit-form.tsx` (`'use client'`) — forms bound to
  `createPatient` / `updatePatient.bind(null, id)` via `useActionState`; render Zod field errors.

### Appointments
- `appointments/buttons.tsx` — `CreateAppointment` (link), `UpdateAppointment` (link to edit),
  `DeleteAppointment` (form bound to `deleteAppointment`); mirrors the patient buttons.
- `appointments/create-form.tsx` / `edit-form.tsx` (`'use client'`) — controlled forms
  bound to `createAppointment` / `updateAppointment.bind(null, id)`
  via `useActionState`, but submitting through an `onSubmit` + `preventDefault` handler that
  calls the action dispatch manually (React 19's `<form action>` reset wipes even controlled
  inputs — this preserves the patient name on a slot-conflict rejection). Both render Zod
  field errors **and** the "slot already taken" message returned when the DB exclusion
  constraint (`appointments_no_overlap`, PG code `23P01`) rejects an overlapping 30-minute
  slot. Both mount the custom calendar (`appointments/datetime-picker.tsx`); create blocks
  past dates, edit stays fully editable for historical correction.
- The list pages (`app/dashboard/appointments/page.tsx`, `app/dashboard/patients/page.tsx`)
  mount the existing `app/ui/search.tsx` (debounced, writes `?query=`) and filter
  server-side by patient name (case-insensitive substring, `?query=` survives status-tab
  switches on the appointments page).

> **Client vs Server split:** charts, the login form, the patient forms, and now the appointment
> forms are Client Components (`'use client'`, interactive via `useActionState`). They all use the
> shared `Button` for styling consistency.

### Settings
- `settings/settings-context.tsx` (`'use client'`) — React context + provider for user
  preferences (theme, chart slots, upcoming display). Persists to `localStorage`, applies theme
  classes to `<html>` via CSS variables, exports `useSettings()` hook.

### Charts (in `app/ui/charts/`)
- `charts/chart-grid.tsx` (`'use client'`) — renders the two dashboard chart slots based on
  `settings.chartSlots`; delegates to `PatientsChart` or `StatusChart`.
- `charts/patients-chart.tsx` (`'use client'`) — Recharts Bar / Area / Line of `new_patients`
  per month. Reads theme + accent from settings; empty state when no data.
- `charts/status-chart.tsx` (`'use client'`) — Recharts Donut / Pie / Bar of appointment status
  split. Uses colour-blind-safe palette; custom legend with counts and percentages.
- `charts/chart-theme.ts` — shared colour tokens (`grid`, `axis`, `tooltip`, `series` accent) and
  status colours; driven by `isDark` + `accent` from settings.

---

## 8. `utils/supabase/` — Supabase client factories

Three factories, one per runtime context:

- `client.ts` — `createBrowserClient` for **Client Components** (uses the publishable key).
- `server.ts` — `createServerClient` for **Server Components / Server Actions**. Reads/writes
  cookies via `next/headers`. Its `setAll` swallows cookie-set errors thrown when called from a
  Server Component (session refresh is handled in the proxy instead).
- `proxy.ts` — `updateSession(request)`: refreshes the Supabase session **and enforces routing**:
  - no user + `/dashboard/*` -> redirect to `/login?callbackUrl=...`
  - user + `/login` -> redirect to `/dashboard`
  - otherwise return the response with refreshed cookies.

`proxy.ts` (repo root) is the Next.js middleware entrypoint that calls `updateSession` on every
matched path (skips `_next/static`, `_next/image`, `favicon`, and image files).

---

## 9. `supabase/` — database (run in order, in the Supabase SQL Editor)

SQL Editor runs as `postgres`, where `auth.uid()` is `null` — so **seed scripts set `user_id`
explicitly**, and the app (signed in) is what actually exercises RLS.

| File | Creates | Key details |
|---|---|---|
| `patients.sql` | `public.patients` + RLS | `user_id uuid default auth.uid()`; 4 policies (select/insert/update/delete) each `auth.uid() = user_id`; index on `user_id`; grants to `authenticated` |
| `appointments.sql` | `public.appointments` + RLS | FK `patient_id -> patients(id) on delete cascade`; `status` CHECK in {booked,done,no_show}; insert/update policies also `EXISTS` a visible patient (closes the FK/RLS trap) |
| `patients_per_month.sql` | view `patients_per_month` | `security_invoker = true`; generates the last 6 months via `generate_series`, left-joins patients, counts by month (so quiet months show 0) |
| `appointment-status-view.sql` | view `appointment_status_this_month` | `security_invoker = true`; counts appointments in the current calendar month by status |
| `seed_patients.sql` | 30 demo patients | Spread over ~180 days; **replace the UUID** with your user's id |
| `appointments-seed.sql` | appointments for every user | Unique 30-minute slots for the current month via `row_number()` (no clashes); past = done/no_show, future = booked |
| `appointments-fix.sql` | re-creates `appointments` | `DROP ... CASCADE` then rebuild including the no-overlap constraint (idempotent fix if the first table went wrong) |
| `appointments-no-overlap.sql` | constraint `appointments_no_overlap` | GiST exclusion constraint (`btree_gist`): per user, 30-minute `tstzrange`s may not overlap; upper bound is UTC-anchored so the index expression stays IMMUTABLE; violations surface as PG `23P01`, which the appointment actions turn into an inline "slot already taken" message |

**Wipe + reseed from the terminal:** `node --env-file=.env scripts/reset-reseed.mjs` deletes all
patients and appointments for both users, (re)applies `appointments_no_overlap`, and seeds fresh
data at unique slots. Safe to rerun.

**RLS model in one line:** every domain table has `user_id` defaulting to `auth.uid()` and four
owner-only policies. Chart views use `security_invoker = true` so they read through the *caller's*
RLS, not the view owner's. That's what makes "user B can't see user A's counts" true.

---

## 10. Environment variables

Set in `.env.local` (git-ignored) and in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
POSTGRES_URL                 # pooled connection
POSTGRES_URL_NON_POOLING
POSTGRES_HOST
POSTGRES_DATABASE
POSTGRES_USER
POSTGRES_PASSWORD
```

- The two `NEXT_PUBLIC_*` are read by `utils/supabase/*` and are bundled into client JS (safe).
- `POSTGRES_URL` is used by `seed/route.ts` and `query/route.ts` (legacy `postgres` driver).
- `.env` and `.env*.local` are ignored by `.gitignore` — never commit them.

---

## 11. Tests

### Unit — `vitest` (no Supabase, no `.env`)
- Config `vitest.config.ts`: jsdom environment, `setupFiles: ['./vitest.setup.ts']`,
  includes `**/*.test.{ts,tsx}`, `@` alias -> repo root, React plugin.
- `vitest.setup.ts` mocks `next/navigation` (incl. `redirect`), `next/cache`
  (`revalidatePath`), `@/utils/supabase/server`, and `postgres`; sets dummy env vars. `actions.test.ts`
  additionally re-mocks the Supabase client in-file so the mock instance is shared with `actions.ts`.
- Run: `pnpm test`.

### End-to-end — `playwright`
- `playwright.config.ts`: `testDir: './e2e'`, `baseURL: http://localhost:3000`, three browser
  projects (chromium/firefox/webkit), and a `webServer` that runs `npm run start` (needs a prior
  `next build`).
- `e2e/dashboard.spec.ts` — smoke: login page renders, dashboard routes don't 500.
- `tests/auth.spec.ts` — login success/failure, redirect when unauthenticated, nav to
  Patients/Appointments.
- `tests/rls-isolation.spec.ts` — the **two-user RLS proof**: user one creates a patient +
  appointment, user two can't see them and only sees their own patient in the select. Requires a
  real seeded backend.
- Run: `pnpm test:e2e`.

> Note: `tests/` is **not** in the default `testDir` (`./e2e`), so `pnpm test:e2e` won't pick it
> up unless you run `npx playwright test tests/` or point `testDir` at it.

---

## 12. Config files & tooling

| File | Purpose |
|---|---|
| `package.json` | deps + scripts; pins `pnpm@9.15`; includes `@vitejs/plugin-react` (required by vitest) |
| `pnpm-lock.yaml` / `pnpm-workspace.yaml` | lockfile; workspace root; allows only `bcrypt`/`sharp` build scripts |
| `next.config.ts` | Next config (currently empty defaults) |
| `tsconfig.json` | strict TS; `@/*` -> `./*`; excludes tests/e2e from the main build typecheck |
| `eslint.config.mjs` | flat config using `eslint-config-next/core-web-vitals`; ignores `placeholder-data.ts` etc. |
| `tailwind.config.ts` | content globs; custom `blue` palette; a `shimmer` keyframe (used by skeletons); `@tailwindcss/forms` plugin |
| `postcss.config.js` | Tailwind + Autoprefixer |
| `.npmrc` | `ignore-workspace=true` |
| `playwright.config.ts` | e2e config (see section 11) |
| `vitest.config.ts` / `vitest.setup.ts` | unit test config + global mocks (see section 11) |

---

## 13. `docs/guides/` — written how-tos

Reference docs (not required to run the app, but useful context):

- `first-chart-and-donut.md` — the step-by-step recipe for building both charts behind RLS
  (seed rows -> `security_invoker` view -> server fetch -> client chart -> honesty checklist).
- `stuck-card.md` — symptom -> cause -> fix for common RLS/redirect/empty-chart problems.
- `who-am-i-auth-roles.md` — an optional deeper dive into `profiles`, roles, and a
  `security definer` helper to avoid RLS recursion.
- `worked-proposal.md` — a filled-in `PROPOSAL.md` example (domain, 3 entities, 2 charts, roles).

---

## 14. Legacy / leftover artifacts (know these, don't be fooled)

These are remnants of the Next.js Learn tutorial that this clinic fork was built from. They are
**not part of the clinic domain** and can be confusing:

- `app/lib/placeholder-data.ts` — `users`/`customers`/`invoices`/`revenue` demo arrays.
- `app/seed/route.ts` (`/seed`) and `app/query/route.ts` (`/query`) — API routes that create/query
  those legacy tables. **They will error against the clinic database** (those tables don't exist).
- `app/lib/definitions.ts` — an older copy of `Patient`/`Appointment` types that duplicates
  `supabase-data.ts`. The live code imports types from `supabase-data.ts`.
- `app/lib/utils.ts` (`formatCurrency`, `generatePagination`) and `app/ui/search.tsx` — tutorial
  utilities not wired into the clinic pages.
- `public/customers/*.png` — tutorial avatars (unused by the clinic UI).
- Nav/ tests that used to reference `/dashboard/invoices` and `/dashboard/customers` — **fixed**
  during this pass to point at the real `patients`/`appointments` routes.

---

## 15. Data flow at a glance

1. **Request hits `proxy.ts`** -> `updateSession` refreshes the Supabase session cookies and guards
   `/dashboard/*` (redirects to `/login` if signed out).
2. **A dashboard page (Server Component)** calls a fetch function from `supabase-data.ts`, which
   builds a server Supabase client carrying the user's session.
3. **Postgres RLS** filters every query to `user_id = auth.uid()`; chart views read through
   `security_invoker` so they inherit the same filtering.
4. **A mutation** (form submit) calls a Server Action in `actions.ts`, which validates with Zod,
   writes via Supabase, `revalidatePath`s the list, and `redirect`s.
5. **Charts** receive plain rows (strings/numbers) from the server and render client-side with
   Recharts.

---

## 16. Recent fixes & improvements applied to this repo

### Round 1 — correctness
- **Test tooling:** added the missing `@vitejs/plugin-react` devDependency (vitest config imported
  it but it wasn't installed).
- **`app/lib/actions.test.ts`:** rewrote from placeholder/broken tests into a working suite (10
  cases) covering all Server Actions; fixed a build-breaking `'use server'` export by keeping the
  Zod schemas module-private.
- **`app/ui/dashboard/nav-links.tsx`:** replaced dead `Invoices`/`Customers` links (404s) with the
  real `Patients`/`Appointments` routes and a calendar icon.
- **`e2e/dashboard.spec.ts`** and **`tests/auth.spec.ts`:** corrected the login heading assertion
  and the non-existent `/dashboard/invoices` / `/dashboard/customers` navigation to match the
  actual app.

### Round 2 — robustness & polish
- **`app/dashboard/error.tsx` (new):** a `'use client'` error boundary for the whole `/dashboard/*`
  segment. A failed data fetch (an `AppError`) or any render error now shows a friendly
  "Something went wrong" page with a **Try again** (`reset()`) button instead of an unhandled 500.
- **`app/dashboard/patients/loading.tsx`** and **`app/dashboard/appointments/loading.tsx` (new):**
  Suspense fallbacks that render the existing `PatientsTableSkeleton` / `AppointmentsTableSkeleton`
  while each list's Server Component loads. (These skeletons existed but were previously unused.)
- **`app/dashboard/appointments/[id]/edit/not-found.tsx` (new):** a custom 404 for a missing
  appointment, mirroring the patients edit route.
- **`app/ui/appointments/create-form.tsx`** and **`edit-form.tsx`:** restyled from raw/unstyled HTML
  to match the patient forms — grey field container, labelled inputs/selects, the shared `Button`,
  and a Cancel link. Still Server Components (progressive enhancement), just visually consistent now.

Verification status (run locally): unit tests **18/18 pass**, `tsc --noEmit` **clean**,
`eslint .` **clean**, `next build` **succeeds** (12 routes). Playwright e2e were **not run** here
because they require a live Supabase backend and a running server.

### Round 3 — appointments depth, UI polish & mobile
- **Double-booking prevention:** `supabase/appointments-no-overlap.sql` adds a Postgres **exclusion
  constraint** (`tstzrange` overlap via `btree_gist`, UTC-anchored for an `IMMUTABLE` index expr).
  `createAppointment`/`updateAppointment` translate Postgres `23P01` into a friendly
  "That time slot is already taken" message.
- **Uniform UI:** appointment forms/list restyled to match the patient forms; status badges use
  consistent colored pills.
- **Landing & branding:** removed the Acme welcome fluff, added healthcare-themed hero SVGs
  (`public/hero-desktop.svg`, `hero-mobile.svg`), renamed the brand to **Cura Health**
  (wordmark, `<title>`, and metadata description). Legend dots on the status donut now match slice
  colors via a custom `LegendContent`.
- **Upcoming Appointments:** a shared server component
  (`app/ui/dashboard/upcoming-appointments.tsx`) renders the next 3 `booked` appointments with
  **Done / No-show** (enabled only after the slot starts) and **Cancel** (enabled any time before it
  starts) buttons. Used on both the Dashboard (under the charts) and the Appointments page.
- **Cancelled status (4th):** added end-to-end — types, `AppointmentSchema`, DB CHECK constraint,
  create/edit selects, filter tab, status badge, donut chart + legend, and seeds. The live
  `appointments_status_check` constraint was altered and the DB reseeded.
- **Dashboard actions:** **New patient** and **New appointment** buttons in the Dashboard header
  (reuse the existing create button components).
- **Mobile:** a fixed bottom nav (`app/ui/dashboard/bottom-nav.tsx`) with Home/Patients/Appointments
  shown only on small screens (desktop keeps the sidebar); the appointments table is paired with a
  stacked **card list** on mobile so the data isn't hidden. All mutation actions now also
  `revalidatePath('/dashboard')` so the dashboard stays dynamic after create/edit/delete/resolve.
- **Charts:** the "New Patients per Month" bar chart was switched from horizontal (left→right) to
  vertical (bottom→top).

## Capstone deliverables (12 Oct 2026)
Three top-level docs bring the repo up to capstone submission standard. They align on the same facts:
production URL **https://nextjs-org-learn.vercel.app**, demo login `user@nextmail.com` / `123456`
(owner) and `user2@nextmail.com` / `123456` (RLS proof), Supabase Auth + RLS on `auth.uid() = user_id`.

- **`README.md`** — rewritten to Monday's six-part structure: what it does (2–3 sentences) → live
  link & demo login → how to run it (incl. `scripts/reset-reseed.mjs`) → tech stack & *why* → known
  limitations → three concrete next steps.
- **`proposal.md`** — the capstone proposal in the same six-part shape, with the pitch framing and a
  deeper "tech stack & why" table.
- **`demo.md`** — the 5-minute demo: a five-line script (Hook / Problem / Walk / Decision / Limits)
  plus the timed run sheet (0:00–5:00) and the panel's Not yet / Approaching / Meets / Exceeds rubric
  for the five scored criteria, with a 4:30–5:30 delivery target.

### Round 4 — Settings & Personalization (13 Oct 2026)
- **SettingsProvider**: wraps the dashboard layout so every dashboard page has access to the user's
  persisted preferences. Loads from `localStorage` on first client render (SSR-safe defaults).
- **Theme system**: 5 themes (Light, Dark, Midnight, Forest, Ocean) with distinct accent colours.
  Applied via CSS variables on `<html>` (`theme-<name>`, `scheme-dark`); Tailwind `darkMode: 'class'`
  + custom overrides in `global.css` remap surfaces/borders/text/accent without per-component
  `dark:` variants.
- **Chart selector**: two dashboard slots; each can independently pick Bar / Area / Line (patients)
  or Donut / Pie / Bar (status). Slots auto-swap so they never show the same chart.
- **Upcoming appointments customisation**: "Next N" (1–12) or a time window (Today / 7 days / 30
  days / All). Renders in `UpcomingList` (client) instead of the previous server-only
  `UpcomingAppointments`.
- **Settings page** (`/dashboard/settings`): client page with radio groups for theme, chart slots,
  and upcoming mode/limit/window, plus a "Reset to Defaults" button. Persisted to `localStorage`
  and reflected immediately.
- **Nav**: Settings link added to the sidebar.
- **Charts refactored**: `patients-chart.tsx`, `status-chart.tsx`, `chart-grid.tsx`,
  `chart-theme.ts` moved to `app/ui/charts/`; now read theme + accent from settings and render
  multiple variants.

### Round 5 — Appointment calendar & list filters (13 Oct 2026)
- **Custom calendar picker** (`app/ui/appointments/datetime-picker.tsx`): month grid with
  08:00–17:30 30-minute time slots, fed taken slots by the create/edit pages
  (`fetchAppointmentSlotTimes` + `toDateTimeLocal`). Booked days render amber; a booked
  start time renders light red (`isBookedSlot`); the selected slot renders
  transparent green; past dates are greyed/disabled (`disallowPast`, create only). Replaces the
  native `datetime-local` input (which cannot be styled per-slot).
- **Past-date guard:** `createAppointment` hard-rejects a past `starts_at` before touching the
  DB; new unit test covers it plus a `2030` fixture roll-forward for the old `2024` dates.
- **Name-preserving forms:** both appointment forms submit via `onSubmit` + `preventDefault`
  calling the `useActionState` dispatch manually — React 19's `<form action>` reset wipes even
  controlled inputs (`recursivelyResetForm`), which was clearing the patient name on a
  slot-conflict rejection. Edit page excludes its own slot from the taken list.
- **Patient-name filters:** both list pages mount the existing `app/ui/search.tsx`
  (`?query=`, case-insensitive substring); status-tab links on appointments preserve it.

# Cura Health — Demo Presentation (5 minutes)

Presenter run sheet + speaker script + code map. Built from the structure in `demo.md`.
**Timing target: land between 4:30–5:30.** Narrate **why**, never the clicks.

- **Production URL:** https://nextjs-org-learn.vercel.app (never localhost)
- **Demo account (owner):** `user@nextmail.com` / `123456`
- **Second account (RLS proof):** `user2@nextmail.com` / `123456`
- **Backup:** recorded Loom/OBS run linked from README, in case the live demo fails.

## Pre-flight (do before you walk in)

1. Open the production URL in one browser, log in as `user@nextmail.com` **ahead of time** — session must already be live so you land straight on the Dashboard.
2. Open a **second private window** already logged in as `user2@nextmail.com` (for the 3:30 RLS proof — instant switch, no login fumbling).
3. Know your scripted patient name in advance, e.g. **"Thabo Mokoena"** — type it once, fast.
4. Pick a target slot in the picker that is **free** (the grid greys out taken slots in red; an amber day just means "has appointments," not "full").
5. Have VS Code open on this repo, `app/lib/actions.ts` already open in a tab, plus a second tab on `supabase/appointments-no-overlap.sql` — the two files you'll flash if the panel asks to see code.

---

## 0:00–0:30 · Hook
> "What is this and who is it for?"

**DO:** Land on the Dashboard. Let the sidebar, the two charts, and Upcoming Appointments sit for one beat. Don't click anything.

**SAY:**
> "Cura Health is a practice dashboard for small clinics. It lets staff run every appointment in one place and see at a glance how the practice is doing."

## 0:30–1:00 · Problem
> "Why does it need to exist?"

**SAY:**
> "Without it, clinics juggle paper or spreadsheets — they double-book the same slot and never see who actually showed up. No-shows quietly cost them money. So I made one screen that fixes both."

- Name the two pains out loud: **double-booking** and **invisible no-shows**.
- Bridge: "Watch both get fixed in the next two minutes."

## 1:00–3:30 · Live walk
> "Does it actually work?"

One happy path: **sign in → create → edit → chart → sign out.**
You're already signed in (pre-flight), so start at Create and narrate what a sign-in would have done.

1. **Create patient** — sidebar → Patients → **New patient**. Enter *Thabo Mokoena*, phone, DOB. Submit.
   - **SAY:** "First the patient exists. That was a server action — validated with Zod before it touches the database."
2. **Create appointment** — **New appointment** → pick Thabo → open the calendar picker.
   - **DO:** Pick a day, then try a **red slot** in the time grid — show it's disabled. Then pick a green/free slot. Submit.
   - **SAY:** "The taken slot is blocked here in the UI — but the real guard is in the database, which I'll show you in a moment."
3. **Edit** that appointment — Appointments table → pencil icon → change the time and/or status → save.
   - **SAY:** "Editing re-runs the same validation and the same overlap guard."
4. **Chart** — back on the Dashboard.
   - **SAY:** "This is **New Patients per Month** — Thabo just became the newest bar. And this donut is **Appointment Status** — Done, No-show, Booked. This is how a clinic would spot a no-show trend before it eats their revenue."
5. **Resolve an Upcoming Appointment** — on the same Dashboard, take one upcoming card, click **Done** or **No-show**.
   - **SAY:** "One tap after the slot starts, the status chart updates. The chairman's no-show number is now a real measurement, not a feeling."
6. **Sign out** — sidebar power icon → confirm you're back on the landing page.

**SAY (framing):** "I'm proving a new patient and appointment are captured, the slot can't be double-booked, and the chart reflects it — not clicking buttons."

## 3:30–4:15 · One Decision
> "How did you build it?"

**SAY:**
> "The decision I'd highlight is **Row Level Security at the database layer** — `auth.uid() = user_id`. I chose it because isolation is enforced where the data lives, so even if my app code had a bug, one clinic can never see another's rows."

- Stack in one breath: **Next.js App Router + Supabase (Postgres) + Recharts.**
- **DO:** Switch to the second private window (`user2@nextmail.com`). Patients and Appointments pages contain **none** of Thabo / user one's rows. Switch back.
- **SAY:** "Same app, same tables, zero shared data — the database refuses the query, it's not a filter I wrote in the UI."

## 4:15–5:00 · Limits + next
> "What is honest and what is next?"

**Two honest limitations**
1. Times are fixed to **one clinic timezone** (no per-user timezone yet).
2. Status is **tracked manually** — no automated reminders, so no-shows are measured, not prevented.

**Three concrete next steps**
1. **24-hour reminders** → then measure whether the no-show rate actually drops (the donut makes it measurable).
2. **Custom date-range charts + CSV export** for reporting.
3. **Roles & per-provider scheduling** so multi-doctor clinics each get their own calendar.

**CLOSE (return to the hook):**
> "So a small clinic gets a single screen that stops double-booking and makes growth and no-shows visible."

---

# Code Map — where the important functions live

Use this when the panel asks *"show me where that's implemented"* or *"how does the app actually do that?"*

## The five things that make this project good

| # | Feature | Core code | Why it's great |
|---|---------|-----------|----------------|
| 1 | **Double-booking blocked in the DB** | `supabase/appointments-no-overlap.sql:27` | An `EXCLUDE USING gist` constraint (`user_id` =, 30-min `tstzrange` &&) — the app is not trusted to enforce this; Postgres is. Even a buggy client can't insert a clash. |
| 2 | **RLS: `auth.uid() = user_id` on every table** | `supabase/patients.sql:21`, `supabase/appointments.sql:28` | Four policies per table (select/insert/update/delete). The insert policy even re-checks the patient FK through patients' own RLS (`appointments.sql:36`) — a subtle trap most tutorials miss. |
| 3 | **Charts are Postgres views with `security_invoker`** | `supabase/patients_per_month.sql:5`, `supabase/appointment-status-view.sql:4` | Aggregation happens in SQL (`generate_series` for gapless months), and respects the caller's RLS — no client-side data leakage, no ORM. |
| 4 | **Server Actions: one mutation path, validated once** | `app/lib/actions.ts:40` `createAppointment`, `:224` `createPatient`, `:127` `setAppointmentStatus` | Zod parse → DB write → `revalidatePath` → `redirect`. Typed end-to-end, works without JS. |
| 5 | **Slot picker with real-time disabled slots** | `app/ui/appointments/datetime-picker.tsx:76` `isBookedSlot` | Calendar (Mon-first grid, past dates disabled) + 30-min slot grid fed by live DB times via `fetchAppointmentSlotTimes` (`app/lib/supabase-data.ts:112`). |

## Demo moment → code reference

| When you demo... | Open this file | Point at |
|---|---|---|
| **Sign in** | `app/ui/login-form.tsx` | `useActionState(signIn, …)` at line 19 — progressive enhancement; `signIn()` at `app/lib/actions.ts:150` (Zod → `signInWithPassword` → redirect) |
| **Create patient** | `app/lib/actions.ts` | `createPatient()` at line 224 — Zod schema `PatientSchema` (line 209), `revalidatePath` (line 253) |
| **Blocked slot (create)** | `app/lib/actions.ts` | `createAppointment()` at line 40; past-time guard at line 53; **PG error `23P01` → friendly message** at lines 67–69 |
| **Blocked slot (the real guard)** | `supabase/appointments-no-overlap.sql` | `appointments_no_overlap` constraint at lines 27–35 — note the UTC-anchored range comment (lines 22–25) explaining IMMUTABLE index expressions |
| **Calendar/slot grid** | `app/ui/appointments/datetime-picker.tsx` | `buildTimeSlots()` line 27 (clinic hours 08:00–17:30), `isBookedSlot` line 76, `pickDay`/"next free slot" logic lines 96–106 |
| **Taken slots fed to picker** | `app/lib/supabase-data.ts` | `fetchAppointmentSlotTimes(excludeId)` line 112 — the `excludeId` handles editing (row's own slot isn't "taken") |
| **Edit appointment** | `app/lib/actions.ts` | `updateAppointment()` line 77 + same `23P01` mapping (lines 103–105) |
| **Dashboard loads fast** | `app/dashboard/(overview)/page.tsx` | `Promise.all` at line 13 — three queries in parallel, not awaited in sequence |
| **New Patients per Month** | `supabase/patients_per_month.sql` | View lines 5–22; fetcher `fetchPatientsPerMonth()` at `app/lib/supabase-data.ts:45` |
| **Chart is interactive** | `app/ui/charts/patients-chart.tsx` | `computeData()` line 22 — bar = monthly, **area = cumulative total, line = MoM growth %**; user can swap chart types per slot (`app/ui/charts/chart-grid.tsx:53`) |
| **Appointment Status donut** | `supabase/appointment-status-view.sql` | View lines 4–12 (`security_invoker = true`); donut with percentage legend at `app/ui/charts/status-chart.tsx:15` `LegendContent` |
| **Resolve Done / No-show** | `app/lib/actions.ts` | `setAppointmentStatus()` line 127 — a status-only server action; enable/disable rules in `app/ui/appointments/buttons.tsx:58`; "has it started?" check at `app/ui/dashboard/upcoming-list.tsx:64` |
| **Upcoming list windows** | `app/ui/dashboard/upcoming-list.tsx` | Lines 38–50 — next-N or today/week/month window; live `now` tick (lines 17–20) so "started" stays accurate |
| **Sign out** | `app/lib/actions.ts` | `signOut()` line 177, wired in `app/ui/dashboard/sidenav.tsx:21` |
| **RLS proof** | `tests/rls-isolation.spec.ts` | Playwright test (line 4) signing in as both demo users and asserting user two never sees user one's rows — automation for the trust claim |

## Q&A — question → where the answer lives

| Likely question | Answer + code |
|---|---|
| "What stops two bookings at the same time — really?" | The exclusion constraint, not the UI: `supabase/appointments-no-overlap.sql:27`. The UI's red slots are just kindness. |
| "How is data isolated between clinics?" | RLS at the DB: `supabase/appointments.sql:28`, `supabase/patients.sql:21`. Proof: `tests/rls-isolation.spec.ts:4`. |
| "Where does double-booking's error message come from?" | `app/lib/actions.ts:67` — Postgres SQLSTATE `23P01` mapped to a human sentence (`SLOT_CONFLICT_MESSAGE`, line 29). |
| "Is the DB secret exposed to the browser?" | No — all reads/writes go through Server Components/Actions; the Supabase server client lives in `utils/supabase/server` (cookie session). Charts fetch server-side and pass plain props. |
| "How do you know the chart updates without a page refresh?" | `revalidatePath('/dashboard')` after every mutation: `app/lib/actions.ts:72`, `:108`, `:142`, `:254`. |
| "Why not an ORM / raw SQL in the API route?" | Views do aggregation in-database (`security_invoker`) and RLS still applies: `supabase/patients_per_month.sql:5`. Fewer round-trips, no duplicated auth logic. |
| "What breaks if Supabase is down?" | Errors funnel through `AppError`/`handleError` (`app/lib/errors.ts`) and render via `app/dashboard/error.tsx` — surfaced, not swallowed. |

## Honest limitations (have these ready, unprompted)

1. **Single clinic timezone** — `app/lib/time.ts:2` hardcodes `+02:00` / `Africa/Johannesburg`; `fromDateTimeLocal`/`formatSA` assume it everywhere. Fine for one clinic, wrong for distributed staff.
2. **Manual status tracking** — Done/No-show are set by staff (`setAppointmentStatus`, `app/lib/actions.ts:127`); nothing reminds the patient, so no-shows are measured, not prevented. Charts are fixed windows (last 6 months / this month).

## Backup plan

- If the live demo fails: play the recorded run (link in README) and narrate over it.
- If only the network drops: everything above is reproducible locally via `pnpm dev` with the seed script (`node --env-file=.env scripts/reset-reseed.mjs`).
- Worst case: walk the panel through this document's **Code Map** table — the constraints, policies, and views are the strong part of the story anyway.

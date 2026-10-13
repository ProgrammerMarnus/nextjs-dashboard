# Demo — Cura Health (5 minutes)

A presentation run sheet for the capstone demo. Each row answers one question the
panel is holding in mind. Narrate **why** you're doing each step, never the clicks.

## Run sheet

| Time        | Part          | Question it answers        |
| ----------- | ------------- | -------------------------- |
| 0:00–0:30   | Hook          | What is this and who is it for? |
| 0:30–1:00   | Problem       | Why does it need to exist? |
| 1:00–3:30   | Live walk     | Does it actually work? |
| 3:30–4:15   | One Decision  | How did you build it? |
| 4:15–5:00   | Limits + next | What is honest and what is next? |

**Timing target: land between 4:30–5:30.**

---

## 0:00–0:30 · Hook
> "What is this and who is it for?"

> "Cura Health is a practice dashboard for small clinics. It lets staff run every
> appointment in one place and see at a glance how the practice is doing."

- Land on the **live production URL** (never localhost).
- Open the Dashboard. Let the sidebar, the two charts, and Upcoming Appointments
  speak for one beat, then say the one-liner.

## 0:30–1:00 · Problem
> "Why does it need to exist?"

> "Without it, clinics juggle paper or spreadsheets — they double-book the same
> slot and never see who actually showed up. No-shows quietly cost them money."

- Name the pain: **double-booking** and **invisible no-shows**.
- Set up the promise: "So I made one screen that fixes both."

## 1:00–3:30 · Live walk
> "Does it actually work?"

Walk **one happy path**: **sign in → create → edit → chart → sign out.**

1. **Sign in** — `user@nextmail.com` / `123456`.
2. **Create** a patient, then **create an appointment** for them.
   - Try to book a slot that overlaps an existing one → show it's **blocked**.
3. **Edit** that appointment (change time/status).
4. **Chart** — land on the Dashboard; narrate the **New Patients per Month** bar
   chart and the **Appointment Status** donut ("this is how they'd spot the no-show trend").
5. Resolve an **Upcoming Appointment** to Done / No-show.
6. **Sign out.**

> Narrate intent: "I'm proving a new patient and appointment are captured, and
> that the chart updates — not clicking buttons."

## 3:30–4:15 · One Decision
> "How did you build it?"

> "The decision I'd highlight is **Row Level Security at the database layer** —
> `auth.uid() = user_id`. I chose it because isolation is enforced where the data
> lives, so even if my app code had a bug, one clinic can never see another's rows."

- Briefly state the stack: Next.js App Router + Supabase (Postgres) + Recharts.
- Show the second account (`user2@nextmail.com`) sees none of the first's data.

## 4:15–5:00 · Limits + next
> "What is honest and what is next?"

**Two honest limitations**
1. Times are fixed to **one clinic timezone** (no per-user timezone yet).
2. Status is **tracked manually** — no automated reminders, so no-shows aren't prevented.

**Three concrete next steps**
1. **24-hour reminders** → then measure whether the no-show rate drops.
2. **Custom date-range charts + CSV export** for reporting.
3. **Roles & per-provider scheduling** for multi-doctor clinics.

> Close by returning to the hook: "So a small clinic gets a single screen that
> stops double-booking and makes growth and no-shows visible."

---

## Backup

A recorded backup of this walk is linked from the README (record via Loom/OBS
following this run sheet), in case the live demo fails.


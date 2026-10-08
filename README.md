## Next.js App Router Course - Starter

This is the starter template for the Next.js App Router Course. It contains the starting code for the dashboard application.

For more information, see the [course curriculum](https://nextjs.org/learn) on the Next.js Website.

## Chart one
Question: Is the practice growing? New patients per month
Who acts: the owner decides whether to open a second consulting day
Shape: bar, one per month, last 6 months
View: patients_per_month (month_start, label, new_patients) — with (security_invoker = true)

## Chart two
Question: What share of this month's appointments are no-shows?
Who acts: the owner decides whether to send reminder messages
Shape: donut, status counts this month
View: appointment_status_this_month (status, total) — with (security_invoker = true)

## Smoke test
RLS: user B cannot see or edit user A's patients or appointments (checked 8 Oct)

## Freeze plan (8 Oct)

### Must ship today (max 5, each one testable on the preview URL)
1. Appointments list shows patient name, time, status; smoke check 1
2. Appointments create with patient select, datetime-local, status; smoke check 2
3. Appointments edit opens with correct patient and time; smoke check 3
4. Appointments delete removes row and list re-renders; smoke check 4
5. Two charts render on /dashboard from real rows behind RLS; smoke check 5

### Cut (one honest sentence each)
- Third entity (invoices): cut; two entities and two charts were not yet stable in production on 8 Oct
- Stretch (Realtime): cut; not started

### Monday polish (max 3, cosmetic or README-only)
1. Empty-state wording on charts
2. Chart colours for colour-blind accessibility
3. Favicon and pitch paragraph in README

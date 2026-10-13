-- Seed appointments across statuses for the current month — WITHOUT slot clashes.
-- Run this in Supabase SQL Editor AFTER appointments.sql and appointments-no-overlap.sql.
-- Works for every user; each patient gets a few appointments at unique 30-minute slots.
--
-- The trick: enumerate slots per user with row_number() so no two rows share a
-- (user, 30-minute window) pair. Status follows the calendar: past = done/no_show,
-- today+future = booked.

insert into public.appointments (user_id, patient_id, starts_at, status)
with users as (
  select distinct user_id from public.patients
),
slots as (
  -- half-hour slots, 08:00-16:30 SAST, days 0-27 of the current month
  select date_trunc('month', now())
         + make_interval(days => d.n, hours => 8 + h.n / 2, mins => (h.n % 2) * 30) as starts_at
  from generate_series(0, 27) d(n), generate_series(0, 17) h(n)
),
user_slots as (
  select u.user_id, s.starts_at,
         row_number() over (partition by u.user_id order by s.starts_at) as slot_no
  from users u cross join slots s
),
user_patients as (
  select p.user_id, p.id as patient_id,
         row_number() over (partition by p.user_id order by p.created_at, p.id) as patient_no,
         count(*) over (partition by p.user_id) as patient_count
  from public.patients p
)
select
  us.user_id,
  up.patient_id,
  us.starts_at,
  case
    when us.starts_at < now() and random() < 0.12 then 'no_show'
    when us.starts_at < now() and random() < 0.22 then 'cancelled'
    when us.starts_at < now() then 'done'
    else 'booked'
  end as status
from user_slots us
join user_patients up
  on up.user_id = us.user_id
 and up.patient_no = 1 + ((us.slot_no - 1) % up.patient_count)
-- ~4 appointments per patient across the month (18 slots/day * 28 days / patient_count is plenty)
where us.slot_no <= up.patient_count * 4;

-- Verify: one row per slot, zero overlaps
select status, count(*) from public.appointments group by status order by status;
select starts_at, count(*) from public.appointments
group by starts_at having count(*) > 1;
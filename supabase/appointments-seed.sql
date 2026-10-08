-- Seed 30-60 appointments across statuses for the current month
-- REPLACE THE UUID BELOW with your user_id from Supabase Authentication -> Users
-- Run this in Supabase SQL Editor

insert into appointments (user_id, patient_id, starts_at, status)
select
  p.user_id,
  p.id,
  date_trunc('month', now())
    + make_interval(days => (random() * 27)::int, hours => 8 + (random() * 8)::int),
  (array['booked', 'done', 'done', 'done', 'no_show'])[1 + (random() * 4)::int]
from patients p
cross join generate_series(1, 5) as n
where p.user_id = 'REPLACE_WITH_YOUR_USER_ID_FROM_AUTH_USERS';

-- Verify
select status, count(*) from appointments group by status order by status;
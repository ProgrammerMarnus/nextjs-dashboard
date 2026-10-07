-- Chart one: new patients per month (last 6 months, one row per month)
-- Run this in Supabase SQL Editor AFTER supabase/patients.sql
-- Creates public.patients_per_month (fixes 42P01 "relation does not exist").

create or replace view public.patients_per_month
with (security_invoker = true) as
with months as (
  select generate_series(
    date_trunc('month', now()) - interval '5 months',
    date_trunc('month', now()),
    interval '1 month'
  ) as month_start
)
select
  m.month_start,
  to_char(m.month_start, 'Mon YYYY') as label,
  count(p.id)::int                   as new_patients
from months m
left join public.patients p
  on date_trunc('month', p.created_at) = m.month_start
group by m.month_start
order by m.month_start;

-- The view reads public.patients through the caller's RLS policies
-- (security_invoker = true). The signed-in role needs SELECT on both.
grant select on public.patients_per_month to authenticated;

-- Proof (SQL Editor runs as postgres: sums ALL users — expected):
-- select * from public.patients_per_month;

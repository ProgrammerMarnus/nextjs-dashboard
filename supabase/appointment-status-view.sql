-- Chart Two: Appointment status this month view
-- Run this in Supabase SQL Editor

create or replace view appointment_status_this_month
with (security_invoker = true) as
select
  status,
  count(*)::int as total
from appointments
where starts_at >= date_trunc('month', now())
  and starts_at <  date_trunc('month', now()) + interval '1 month'
group by status;

grant select on appointment_status_this_month to authenticated;

-- Test it (runs as the signed-in user, so shows only their data):
-- select * from appointment_status_this_month;
-- Sprint seed: 30 realistic patients for user one, spread over last 6 months
-- Run in Supabase SQL Editor. Replace the UUID with YOUR user one's UID
-- (Supabase -> Authentication -> Users -> copy icon next to the id).
-- user_id is explicit because auth.uid() is null for the postgres role.

insert into public.patients (user_id, full_name, phone, date_of_birth, created_at)
select
  '00000000-0000-0000-0000-000000000000'::uuid,          -- paste YOUR user's UID here
  'Patient ' || g,
  '082' || lpad(floor(random() * 10000000)::int::text, 7, '0'),
  date '1960-01-01' + floor(random() * 20000)::int,       -- a random birth date
  now() - (random() * interval '180 days')                 -- spread over the last 6 months
from generate_series(1, 30) as g;

-- Build 4: Double-booking prevention (deduplication)
-- Run this in Supabase SQL Editor AFTER appointments.sql (or appointments-fix.sql)
--
-- Each appointment holds a 30-minute slot. Two appointments for the SAME user
-- may not overlap; different users are independent (each user owns their own
-- calendar via RLS). Any status counts — a done/no_show appointment still
-- occupies its slot.
--
-- btree_gist lets a GiST index enforce `=` on a uuid column.

create extension if not exists btree_gist;

-- If old duplicated rows exist, this ALTER will fail until they are removed:
--   delete from public.appointments a
--   using public.appointments b
--   where a.user_id = b.user_id
--     and a.id > b.id
--     and tstzrange(a.starts_at, ((a.starts_at at time zone 'utc') + interval '30 minutes') at time zone 'utc')
--       && tstzrange(b.starts_at, ((b.starts_at at time zone 'utc') + interval '30 minutes') at time zone 'utc');
-- (Prefer reseeding: see scripts/reset-reseed.mjs)
--
-- NOTE: the range upper bound is written UTC-anchored on purpose.
-- `timestamptz + interval` is only STABLE (depends on the session TimeZone
-- setting) and Postgres rejects non-IMMUTABLE expressions in index predicates.
-- Converting to UTC, adding, and converting back is exact and immutable.

alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    user_id with =,
    tstzrange(
      starts_at,
      ((starts_at at time zone 'utc') + interval '30 minutes') at time zone 'utc'
    ) with &&
  );

-- Test it (two inserts at the same time for one user; the second must fail with 23P01):
--   insert into public.appointments (patient_id, starts_at)
--   select p.id, now() + interval '1 day' from public.patients p limit 1;
--   insert into public.appointments (patient_id, starts_at)
--   select p.id, now() + interval '1 day' + interval '10 minutes' from public.patients p limit 1;
--   -- ERROR: conflicting key value violates exclusion constraint "appointments_no_overlap"
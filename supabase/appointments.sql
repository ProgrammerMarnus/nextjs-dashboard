-- Build 2: Appointments table with FK to patients, RLS policies
-- Run this in Supabase SQL Editor

-- 1. Create the table
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id),
  patient_id uuid not null references public.patients (id) on delete cascade,
  starts_at timestamptz not null,
  status text not null default 'booked'
    check (status in ('booked', 'done', 'no_show')),
  created_at timestamptz not null default now()
);

-- 2. Indexes for policy performance (FK does not create an index)
create index appointments_user_id_idx on public.appointments (user_id);
create index appointments_patient_id_idx on public.appointments (patient_id);

-- 3. Enable RLS and set grants
alter table public.appointments enable row level security;

revoke all on table public.appointments from anon, authenticated;
grant select, insert, update, delete on table public.appointments to authenticated;

-- 4. Four policies: owner can select, insert, update, delete their own rows
-- The exists() subquery in insert/update policies closes the FK trap:
-- it runs as the current user, so patients RLS hides other users' patients.
create policy "appointments: owner can select"
  on public.appointments for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "appointments: owner can insert"
  on public.appointments for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.patients p where p.id = patient_id)
  );

create policy "appointments: owner can update"
  on public.appointments for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.patients p where p.id = patient_id)
  );

create policy "appointments: owner can delete"
  on public.appointments for delete
  to authenticated
  using ((select auth.uid()) = user_id);
-- Build 1: Patients table with RLS policies
-- Run this in Supabase SQL Editor

-- 1. Create the table
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id),
  full_name text not null,
  phone text,
  date_of_birth date,
  created_at timestamptz not null default now()
);

-- 2. Enable RLS and set grants
alter table public.patients enable row level security;

revoke all on table public.patients from anon, authenticated;
grant select, insert, update, delete on table public.patients to authenticated;

-- 3. Four policies: owner can select, insert, update, delete their own rows
create policy "patients: owner can select"
  on public.patients for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "patients: owner can insert"
  on public.patients for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "patients: owner can update"
  on public.patients for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "patients: owner can delete"
  on public.patients for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 4. Index for policy performance
create index patients_user_id_idx on public.patients (user_id);
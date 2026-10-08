-- Drop and recreate appointments table with proper FK and RLS
drop table if exists public.appointments cascade;

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id),
  patient_id uuid not null references public.patients (id) on delete cascade,
  starts_at timestamptz not null,
  status text not null default 'booked'
    check (status in ('booked', 'done', 'no_show')),
  created_at timestamptz not null default now()
);

create index appointments_user_id_idx on public.appointments (user_id);
create index appointments_patient_id_idx on public.appointments (patient_id);

alter table public.appointments enable row level security;

revoke all on table public.appointments from anon, authenticated;
grant select, insert, update, delete on table public.appointments to authenticated;

create policy "appointments: owner can select"
  on public.appointments for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "appointments: owner can insert"
  on public.appointments for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.patients p where p.id = patient_id)
  );

create policy "appointments: owner can update"
  on public.appointments for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.patients p where p.id = patient_id)
  );

create policy "appointments: owner can delete"
  on public.appointments for delete to authenticated
  using ((select auth.uid()) = user_id);
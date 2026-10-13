import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL_NON_POOLING, { ssl: 'require' });

try {
  const counts = await sql`
    select u.email, count(a.id)::int as appointments
    from auth.users u
    left join public.appointments a on a.user_id = u.id
    group by u.email order by u.email
  `;
  console.log('APPOINTMENTS BY USER:', JSON.stringify(counts));

  const pat = await sql`select u.email, count(p.id)::int as patients from auth.users u left join public.patients p on p.user_id = u.id group by u.email order by u.email`;
  console.log('PATIENTS BY USER:', JSON.stringify(pat));

  const dups = await sql`select count(*)::int as dup_slots from (select user_id, starts_at from public.appointments group by user_id, starts_at having count(*) > 1) d`;
  console.log('DUPLICATE SLOTS:', JSON.stringify(dups));

  const overlaps = await sql`
    select count(*)::int as overlapping_pairs
    from public.appointments a
    join public.appointments b
      on a.user_id = b.user_id and a.id < b.id
     and tstzrange(a.starts_at, ((a.starts_at at time zone 'utc') + interval '30 minutes') at time zone 'utc')
      && tstzrange(b.starts_at, ((b.starts_at at time zone 'utc') + interval '30 minutes') at time zone 'utc')
  `;
  console.log('OVERLAPPING 30-MIN SLOTS:', JSON.stringify(overlaps));

  const reserved1 = await sql`select count(*)::int as n from public.appointments where user_id = '31cd7f15-703d-411d-ba74-514e85375802' and tstzrange(starts_at, ((starts_at at time zone 'utc') + interval '30 minutes') at time zone 'utc') && tstzrange(timestamptz '2026-10-10T10:00:00+02:00', timestamptz '2026-10-10T10:30:00+02:00')`;
  const reserved2 = await sql`select count(*)::int as n from public.appointments where user_id = '72670413-41b6-45f7-9966-7e017b7834ac' and tstzrange(starts_at, ((starts_at at time zone 'utc') + interval '30 minutes') at time zone 'utc') && tstzrange(timestamptz '2026-10-11T14:30:00+02:00', timestamptz '2026-10-11T15:00:00+02:00')`;
  console.log('E2E RESERVED SLOTS OCCUPIED (must be 0/0):', reserved1[0].n, reserved2[0].n);

  const con = await sql`select conname from pg_constraint where conname = 'appointments_no_overlap'`;
  console.log('CONSTRAINT EXISTS:', con.length === 1);

  const statuses = await sql`select status, count(*)::int as n from public.appointments group by status order by status`;
  console.log('STATUSES:', JSON.stringify(statuses));
} finally {
  await sql.end();
}

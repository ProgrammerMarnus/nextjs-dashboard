// Reset + reseed patients and appointments for BOTH users.
// - Wipes public.appointments and public.patients entirely.
// - Applies the 30-minute no-overlap exclusion constraint (per user).
// - Seeds fresh patients (created_at spread over 6 months for the chart)
//   and appointments at unique slots: past = done/no_show, future = booked.
//
// Run:  node --env-file=.env scripts/reset-reseed.mjs
// Safe to rerun (it starts by dropping the constraint and wiping both tables).

import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL_NON_POOLING, { ssl: 'require' });

const USER1 = '31cd7f15-703d-411d-ba74-514e85375802'; // user@nextmail.com
const USER2 = '72670413-41b6-45f7-9966-7e017b7834ac'; // user2@nextmail.com

// Slots the e2e RLS test books itself — keep them free in the seed.
const RESERVED = {
  [USER1]: ['2026-10-10T10:00'],
  [USER2]: ['2026-10-11T14:30'],
};

// Deterministic PRNG so reruns produce identical data.
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PATIENTS = {
  [USER1]: [
    'Thabo Molefe', 'Naledi Khumalo', 'Sipho Nkosi', 'Zanele Dlamini',
    'Pieter van der Merwe', 'Lerato Mokoena', 'Johan Botha', 'Ayanda Zulu',
    'Kagiso Sithole', 'Mpho Radebe', 'Chantelle Naidoo', 'Bongani Mahlangu',
    'Refilwe Matlwa', 'Karabo Dube', 'Elmarie Steyn', 'Themba Shabangu',
  ],
  [USER2]: [
    'Nomsa Cele', 'Jaco Pretorius', 'Fatima Patel', 'Tshepo Moloi',
    'Sharlene Pillay', 'Sizwe Ndlovu',
  ],
};

const TODAY = 13; // Oct 2026 — appointments before this day are history.

function buildSlots(rand) {
  // Every 30-minute slot, 08:00-16:30 SAST, days 1-31 of October 2026.
  const slots = [];
  for (let day = 1; day <= 31; day++) {
    for (let half = 0; half < 18; half++) {
      const hour = 8 + Math.floor(half / 2);
      const minute = half % 2 === 0 ? '00' : '30';
      slots.push(`2026-10-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${minute}`);
    }
  }
  // Deterministic shuffle so appointments spread across the whole month.
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  return slots;
}

async function resetAndSeed() {
  const rand = mulberry32(20261013);

  console.log('1. Dropping constraint (if any) and wiping tables...');
  await sql`alter table public.appointments drop constraint if exists appointments_no_overlap`;
  await sql`delete from public.appointments`;
  await sql`delete from public.patients`;

  console.log('2. Applying 30-minute no-overlap constraint...');
  await sql`create extension if not exists btree_gist`;
  // timestamptz + interval is only STABLE (session-timezone dependent), so anchor
  // the arithmetic in UTC to keep the index expression IMMUTABLE.
  await sql`
    alter table public.appointments
    add constraint appointments_no_overlap
    exclude using gist (
      user_id with =,
      tstzrange(
        starts_at,
        ((starts_at at time zone 'utc') + interval '30 minutes') at time zone 'utc'
      ) with &&
    )
  `;

  console.log('3. Seeding patients...');
  for (const [userId, names] of Object.entries(PATIENTS)) {
    for (const [i, name] of names.entries()) {
      // Spread created_at across May-Oct 2026 (last 6 months) for the chart.
      const month = 5 + (i % 6); // 5..10
      const day = 1 + Math.floor(rand() * 27);
      const createdAt = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T09:00:00+02:00`;
      const phone = `07${Math.floor(rand() * 9)} ${String(Math.floor(rand() * 900) + 100)} ${String(Math.floor(rand() * 9000) + 1000)}`;
      const dobYear = 1960 + Math.floor(rand() * 45);
      const dobMonth = 1 + Math.floor(rand() * 12);
      const dobDay = 1 + Math.floor(rand() * 28);
      const dob = `${dobYear}-${String(dobMonth).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}`;
      await sql`
        insert into public.patients (user_id, full_name, phone, date_of_birth, created_at)
        values (${userId}, ${name}, ${phone}, ${dob}, ${createdAt})
      `;
    }
  }
  console.log('4. Seeding appointments at unique 30-minute slots...');
  for (const [userId, names] of Object.entries(PATIENTS)) {
    const patients = await sql`
      select id from public.patients where user_id = ${userId} order by created_at, id
    `;
    const target = names.length * 4; // ~4 appointments per patient
    const slots = buildSlots(rand).filter((s) => !RESERVED[userId].includes(s));

    for (let n = 0; n < target; n++) {
      const slot = slots[n];
      const patient = patients[n % patients.length];
      const day = Number(slot.slice(8, 10));
      let status;
      if (day < TODAY) {
        const r = rand();
        status = r < 0.12 ? 'no_show' : r < 0.22 ? 'cancelled' : 'done';
      } else {
        status = 'booked';
      }
      await sql`
        insert into public.appointments (user_id, patient_id, starts_at, status)
        values (${userId}, ${patient.id}, ${`${slot}:00+02:00`}, ${status})
      `;
    }
  }

  console.log('5. Verifying...');
  const counts = await sql`
    select u.email, a.status, count(*)::int as n
    from public.appointments a
    join auth.users u on u.id = a.user_id
    group by u.email, a.status
    order by u.email, a.status
  `;
  console.log(JSON.stringify(counts, null, 2));

  const dups = await sql`
    select user_id, starts_at, count(*) as n
    from public.appointments
    group by user_id, starts_at
    having count(*) > 1
  `;
  if (dups.length > 0) {
    throw new Error(`Duplicate slots found: ${JSON.stringify(dups)}`);
  }
  console.log('No duplicate slots.');

  // Prove the constraint blocks an overlap (then roll back).
  try {
    await sql.begin(async (tx) => {
      const first = await tx`
        insert into public.appointments (user_id, patient_id, starts_at, status)
        select user_id, id, timestamptz '2026-10-20T09:00:00+02:00', 'booked'
        from public.appointments limit 1 returning id, user_id
      `;
      await tx`
        insert into public.appointments (user_id, patient_id, starts_at, status)
        select ${first[0].user_id}, id, timestamptz '2026-10-20T09:15:00+02:00', 'booked'
        from public.patients where user_id = ${first[0].user_id} limit 1
      `;
      throw new Error('OVERLAP_NOT_BLOCKED');
    });
    console.error('ERROR: constraint did NOT block an overlapping insert!');
    process.exitCode = 1;
  } catch (err) {
    if (String(err).includes('OVERLAP_NOT_BLOCKED')) {
      console.error('ERROR: constraint did NOT block an overlapping insert!');
      process.exitCode = 1;
    } else {
      console.log('Constraint works: overlapping insert was rejected (test rolled back).');
    }
  }
}

try {
  await resetAndSeed();
} finally {
  await sql.end();
}

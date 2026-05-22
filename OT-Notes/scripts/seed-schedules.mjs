// Seed script: create tables + populate recurring_schedules for all 15 students
// Run from OT-Notes/: node scripts/seed-schedules.mjs

const SUPABASE_URL = 'https://camsudjrqwfmnmvwbhwd.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhbXN1ZGpycXdmbW5tdndiaHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjIyNTcsImV4cCI6MjA5NTAzODI1N30.MW4B4FpTtmsxFDtKTB0BoSCKvJP4lQblXniZJvL9qyc';

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

// dayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const schedule = [
  // Weekday evening (Mon–Thu, 5–8 PM)
  { studentName: 'Alex Johnson',    dayOfWeek: 1, timeSlotId: 'weekday-evening' }, // Mon
  { studentName: 'Alex Johnson',    dayOfWeek: 3, timeSlotId: 'weekday-evening' }, // Wed
  { studentName: 'Maya Patel',      dayOfWeek: 2, timeSlotId: 'weekday-evening' }, // Tue
  { studentName: 'Maya Patel',      dayOfWeek: 4, timeSlotId: 'weekday-evening' }, // Thu
  { studentName: 'Liam Rodriguez',  dayOfWeek: 1, timeSlotId: 'weekday-evening' }, // Mon
  { studentName: 'Emma Chen',       dayOfWeek: 2, timeSlotId: 'weekday-evening' }, // Tue
  { studentName: 'Noah Williams',   dayOfWeek: 1, timeSlotId: 'weekday-evening' }, // Mon
  { studentName: 'Noah Williams',   dayOfWeek: 3, timeSlotId: 'weekday-evening' }, // Wed
  { studentName: 'Mia Anderson',    dayOfWeek: 4, timeSlotId: 'weekday-evening' }, // Thu
  { studentName: 'Aiden Moore',     dayOfWeek: 3, timeSlotId: 'weekday-evening' }, // Wed

  // Friday evening (4:30–7:30 PM)
  { studentName: 'Oliver Martinez', dayOfWeek: 5, timeSlotId: 'friday-evening' },
  { studentName: 'Charlotte Brown', dayOfWeek: 5, timeSlotId: 'friday-evening' },
  { studentName: 'Isabella Lee',    dayOfWeek: 5, timeSlotId: 'friday-evening' },

  // Saturday morning (9 AM–12:30 PM)
  { studentName: 'Sophia Davis',    dayOfWeek: 6, timeSlotId: 'saturday-morning' },
  { studentName: 'Ava Thompson',    dayOfWeek: 6, timeSlotId: 'saturday-morning' },
  { studentName: 'Mason Taylor',    dayOfWeek: 6, timeSlotId: 'saturday-morning' },
  { studentName: 'Lucas Wilson',    dayOfWeek: 6, timeSlotId: 'saturday-morning' },

  // Saturday afternoon (1:30–5 PM)
  { studentName: 'Elijah Garcia',   dayOfWeek: 6, timeSlotId: 'saturday-afternoon' },
  { studentName: 'Lucas Wilson',    dayOfWeek: 6, timeSlotId: 'saturday-afternoon' },
  { studentName: 'Emma Chen',       dayOfWeek: 6, timeSlotId: 'saturday-afternoon' },

  // Sunday morning (9 AM–12 PM)
  { studentName: 'Isabella Lee',    dayOfWeek: 0, timeSlotId: 'sunday-morning' },
  { studentName: 'Charlotte Brown', dayOfWeek: 0, timeSlotId: 'sunday-morning' },
  { studentName: 'Liam Rodriguez',  dayOfWeek: 0, timeSlotId: 'sunday-morning' },

  // Sunday afternoon (1–4 PM)
  { studentName: 'Mason Taylor',    dayOfWeek: 0, timeSlotId: 'sunday-afternoon' },
  { studentName: 'Sophia Davis',    dayOfWeek: 0, timeSlotId: 'sunday-afternoon' },
  { studentName: 'Mia Anderson',    dayOfWeek: 0, timeSlotId: 'sunday-afternoon' },

  // Sunday evening (5–8 PM)
  { studentName: 'Oliver Martinez', dayOfWeek: 0, timeSlotId: 'sunday-evening' },
  { studentName: 'Ava Thompson',    dayOfWeek: 0, timeSlotId: 'sunday-evening' },
  { studentName: 'Aiden Moore',     dayOfWeek: 0, timeSlotId: 'sunday-evening' },
];

async function rpc(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: sql }),
  });
  return res;
}

async function restDelete(table) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}?id=not.is.null`, {
    method: 'DELETE',
    headers,
  });
}

async function restInsert(table, rows) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(rows),
  });
}

async function seed() {
  console.log('Creating tables via SQL editor (you may need to run schema.sql manually)...');
  console.log('Attempting direct REST inserts...\n');

  // Try to delete existing rows
  const del = await restDelete('recurring_schedules');
  if (del.ok || del.status === 204) {
    console.log('Cleared existing recurring_schedules rows');
  } else {
    const txt = await del.text();
    if (txt.includes('PGRST205')) {
      console.error('\nTABLES DO NOT EXIST IN SUPABASE YET.');
      console.error('Please run the SQL below in your Supabase SQL editor first:\n');
      const { readFileSync } = await import('fs');
      const { fileURLToPath } = await import('url');
      const { dirname, join } = await import('path');
      const dir = dirname(fileURLToPath(import.meta.url));
      const sql = readFileSync(join(dir, 'schema.sql'), 'utf8');
      console.error('--- schema.sql ---');
      console.error(sql);
      console.error('------------------');
      console.error('\nAfter creating the tables, re-run this script.');
      process.exit(1);
    }
    console.warn('Delete warning:', del.status, txt);
  }

  // Insert schedule rows
  const rows = schedule.map((s, i) => ({
    id: `rs_seed_${String(i).padStart(3, '0')}`,
    student_name: s.studentName,
    day_of_week: s.dayOfWeek,
    time_slot_id: s.timeSlotId,
  }));

  const ins = await restInsert('recurring_schedules', rows);
  if (ins.ok || ins.status === 201 || ins.status === 204) {
    console.log(`Inserted ${rows.length} recurring schedule entries.\n`);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const slotLabel = {
      'weekday-evening':    '5–8 PM (Mon–Thu)',
      'friday-evening':     '4:30–7:30 PM (Fri)',
      'saturday-morning':   '9 AM–12:30 PM (Sat)',
      'saturday-afternoon': '1:30–5 PM (Sat)',
      'sunday-morning':     '9 AM–12 PM (Sun)',
      'sunday-afternoon':   '1–4 PM (Sun)',
      'sunday-evening':     '5–8 PM (Sun)',
    };
    console.log('Schedule summary:');
    for (const r of rows) {
      console.log(`  ${r.student_name.padEnd(20)} ${days[r.day_of_week].padEnd(4)} ${slotLabel[r.time_slot_id]}`);
    }
  } else {
    const txt = await ins.text();
    console.error('Insert failed:', ins.status, txt);
  }

  // Also seed default admin PIN in app_settings
  const pinIns = await restInsert('app_settings', [{ key: 'admin_pin', value: '1234' }]);
  if (pinIns.ok || pinIns.status === 201 || pinIns.status === 204 || pinIns.status === 409) {
    console.log('\nAdmin PIN seeded (default: 1234)');
  }
}

seed().catch(console.error);

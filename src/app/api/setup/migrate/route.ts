import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { qOne, qRun } from '@/lib/supabase';
import { checkAgentKey, unauthorized } from '@/lib/agent-auth';

// POST /api/setup/migrate — one-shot schema bootstrap (plain Postgres).
// Applies 0001 (minus Supabase RLS) + 0002 (users) + seeds staff accounts.
// Guarded by the agent key; only needed once on a fresh DB.
export async function POST(req: NextRequest) {
  if (!checkAgentKey(req)) return unauthorized();

  try {
    const exists = await qOne(`select 1 from information_schema.tables where table_name = 'leads'`);
    const fs = await import('fs');
    const path = await import('path');
    const base = path.join(process.cwd(), 'supabase', 'migrations');

    const applied: string[] = [];
    if (!exists) {
      const raw1 = fs.readFileSync(path.join(base, '0001_init.sql'), 'utf8');
      const cut = raw1.split('-- ============ RLS ============')[0];
      await qRun(cut);
      applied.push('0001');
    }

    // 0002: users + owner_id FKs (idempotent — IF NOT EXISTS everywhere)
    const raw2 = fs.readFileSync(path.join(base, '0002_users.sql'), 'utf8');
    await qRun(raw2);
    applied.push('0002');

    // 0003: calendar UX — follow_ups.location + confirmed (ยืนยันนัด)
    const raw3 = fs.readFileSync(path.join(base, '0003_calendar.sql'), 'utf8');
    await qRun(raw3);
    applied.push('0003');

    // 0004: call_logs — โทรออก + บันทึกผลอัตโนมัติ
    const raw4 = fs.readFileSync(path.join(base, '0004_calls.sql'), 'utf8');
    await qRun(raw4);
    applied.push('0004');

    // Seed staff accounts (skip existing emails)
    const seeded = await seedUsers();
    return NextResponse.json({ message: 'schema applied', migrations: applied, seeded }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

async function seedUsers(): Promise<string[]> {
  const password = process.env.SEED_PASSWORD || 'ink-crm-2026';
  const hash = await bcrypt.hash(password, 10);
  const seeded: string[] = [];

  // Admin account — upsert (name "admin" so login works with just "admin")
  const admin = await qOne<{ id: string }>(
    `select id from users where email = 'admin@inkhomes.co' or lower(full_name) = 'admin' or email = 'manager@inkhomes.co'`
  );
  if (admin) {
    await qRun(
      `update users set email = 'admin@inkhomes.co', full_name = 'Admin', role = 'manager', password_hash = $1 where id = $2`,
      [hash, admin.id]
    );
  } else {
    await qRun(
      `insert into users (email, full_name, role, password_hash) values ('admin@inkhomes.co','Admin','manager',$1)`,
      [hash]
    );
  }
  seeded.push('admin');

  // Other staff (skip existing, don't touch passwords).
  // NOTE: only system accounts here — mockup users (สมชาย/นิด) were removed in
  // /api/setup/clean and must NOT be re-seeded.
  const others = [
    { email: 'ink-agent@inkhomes.co', full_name: 'Ink Agent', role: 'agent' },
  ];
  for (const s of others) {
    const existing = await qOne(`select id from users where email = $1`, [s.email]);
    if (existing) continue;
    await qRun(
      `insert into users (email, full_name, role, password_hash) values ($1,$2,$3,$4)`,
      [s.email, s.full_name, s.role, s.role === 'agent' ? null : hash]
    );
    seeded.push(s.email);
  }
  return seeded;
}

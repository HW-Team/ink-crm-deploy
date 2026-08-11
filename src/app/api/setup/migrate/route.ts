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

    // Seed staff accounts (skip existing emails)
    const seeded = await seedUsers();
    return NextResponse.json({ message: 'schema applied', migrations: applied, seeded }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

async function seedUsers(): Promise<string[]> {
  const seeds = [
    { email: 'somchai@inkhomes.co', full_name: 'สมชาย ใจดี', role: 'sales' },
    { email: 'nid@inkhomes.co', full_name: 'นิด นิลวรรณ', role: 'sales' },
    { email: 'manager@inkhomes.co', full_name: 'ผู้จัดการ Ink', role: 'manager' },
    { email: 'ink-agent@inkhomes.co', full_name: 'Ink Agent', role: 'agent' },
  ];
  const password = process.env.SEED_PASSWORD || 'ink-crm-2026';
  const hash = await bcrypt.hash(password, 10);
  const seeded: string[] = [];
  for (const s of seeds) {
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

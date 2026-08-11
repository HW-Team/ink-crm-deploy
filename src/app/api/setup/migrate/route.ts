import { NextRequest, NextResponse } from 'next/server';
import { qOne } from '@/lib/supabase';
import { checkAgentKey, unauthorized } from '@/lib/agent-auth';

// POST /api/setup/migrate — one-shot schema bootstrap (plain Postgres).
// Applies supabase/migrations/0001_init.sql minus the Supabase RLS section.
// Guarded by the agent key; only needed once on a fresh DB.
export async function POST(req: NextRequest) {
  if (!checkAgentKey(req)) return unauthorized();

  try {
    const exists = await qOne(`select 1 from information_schema.tables where table_name = 'leads'`);
    if (exists) return NextResponse.json({ message: 'already migrated' }, { status: 409 });

    const fs = await import('fs');
    const path = await import('path');
    const schemaPath = path.join(process.cwd(), 'supabase', 'migrations', '0001_init.sql');
    const raw = fs.readFileSync(schemaPath, 'utf8');

    // Strip Supabase-only RLS block (auth.role() does not exist on plain Postgres)
    const cut = raw.split('-- ============ RLS ============')[0];
    const { qRun } = await import('@/lib/supabase');
    await qRun(cut);

    return NextResponse.json({ message: 'schema applied' }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

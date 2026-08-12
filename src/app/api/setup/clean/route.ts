import { NextRequest, NextResponse } from 'next/server';
import { q, qRun } from '@/lib/supabase';
import { checkAgentKey, unauthorized } from '@/lib/agent-auth';

// POST /api/setup/clean — wipe all TEST data before the real migration (HWT-144).
// Deletes every lead/contact/log/follow-up (all current rows are mock/test data)
// and removes mockup user accounts, keeping only the real system accounts
// (admin + ink-agent). Guarded by the agent key.
export async function POST(req: NextRequest) {
  if (!checkAgentKey(req)) return unauthorized();

  try {
    await qRun(`delete from follow_ups`);
    await qRun(`delete from conversation_logs`);
    await qRun(`delete from leads`);
    await qRun(`delete from contacts`);
    // keep only real accounts: admin + ink-agent (name/email allowlist)
    const before = await q<{ n: number }>(`select count(*)::int as n from users where email not in ('admin@inkhomes.co','ink-agent@inkhomes.co') and lower(full_name) not in ('admin','ink agent')`);
    await qRun(
      `delete from users
       where email not in ('admin@inkhomes.co', 'ink-agent@inkhomes.co')
         and lower(full_name) not in ('admin', 'ink agent')`
    );
    const left = await qRun(
      `select email, full_name, role from users order by role desc`
    );
    return NextResponse.json({
      message: 'cleaned',
      deleted_users: before[0]?.n ?? 0,
      remaining_users: left,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

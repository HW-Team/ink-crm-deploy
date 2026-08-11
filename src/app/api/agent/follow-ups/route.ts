import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/supabase';
import { checkAgentKey, unauthorized } from '@/lib/agent-auth';

// GET /api/agent/follow-ups?due_before=YYYY-MM-DD&owner=name → list due follow-ups
export async function GET(req: NextRequest) {
  if (!checkAgentKey(req)) return unauthorized();
  const dueBefore = req.nextUrl.searchParams.get('due_before') ?? new Date().toISOString().slice(0, 10);
  const owner = req.nextUrl.searchParams.get('owner');

  try {
    const follow_ups = await q(
      `select fu.*,
         c.full_name as contact_name, c.primary_phone, c.normalized_phone,
         l.full_name as lead_name, l.crm_stage
       from follow_ups fu
       left join contacts c on c.id = fu.contact_id
       left join leads l on l.id = fu.lead_id
       where fu.status = 'open' and fu.due_date <= $1
       ${owner ? `and fu.owner = $2` : ''}
       order by fu.due_date asc`,
      owner ? [dueBefore, owner] : [dueBefore]
    );
    return NextResponse.json({ follow_ups });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

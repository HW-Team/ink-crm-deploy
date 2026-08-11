import { NextRequest, NextResponse } from 'next/server';
import { qOne, qRun } from '@/lib/supabase';
import { checkAgentKey, unauthorized } from '@/lib/agent-auth';

// POST /api/agent/contacts/:id/conversations — log a touchpoint
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAgentKey(req)) return unauthorized();
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  const channel = String(body.channel ?? 'OTHER').toUpperCase();
  const outcome = body.outcome ? String(body.outcome) : null;

  try {
    const log = await qOne(
      `insert into conversation_logs (contact_id, channel, direction, summary, outcome, next_action, next_followup_date, team_member)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
      [
        id,
        channel,
        String(body.direction ?? 'IN').toUpperCase(),
        body.summary ? String(body.summary) : null,
        outcome,
        body.next_action ? String(body.next_action) : null,
        body.next_followup_date ? String(body.next_followup_date) : null,
        body.team_member ? String(body.team_member) : 'ink-agent',
      ]
    );
    if (!log) return NextResponse.json({ error: 'log insert failed' }, { status: 500 });

    // touch contact: last contact + log count
    await qRun(
      `update contacts set
         last_contact_date = now(),
         last_contact_channel = $1,
         last_contact_outcome = $2,
         contacted_yet = true,
         log_count = log_count + 1
       where id = $3`,
      [channel, outcome, id]
    );

    return NextResponse.json({ log }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

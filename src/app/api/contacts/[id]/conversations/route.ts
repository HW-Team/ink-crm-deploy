import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { qOne, qRun } from '@/lib/supabase';

// POST /api/contacts/:id/conversations — staff logs a touchpoint (session auth)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  const channel = String(body.channel ?? 'PHONE').toUpperCase();
  const outcome = body.outcome ? String(body.outcome) : null;

  try {
    const log = await qOne(
      `insert into conversation_logs (contact_id, channel, direction, summary, outcome, next_action, next_followup_date, team_member, user_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
      [
        id,
        channel,
        String(body.direction ?? 'OUT').toUpperCase(),
        body.summary ? String(body.summary) : null,
        outcome,
        body.next_action ? String(body.next_action) : null,
        body.next_followup_date ? String(body.next_followup_date) : null,
        me.full_name,
        me.id,
      ]
    );
    if (!log) return NextResponse.json({ error: 'log insert failed' }, { status: 500 });

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

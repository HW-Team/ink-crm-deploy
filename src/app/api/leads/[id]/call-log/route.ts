import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { qOne, qRun } from "@/lib/supabase";

const OUTCOMES = ["contacted", "no_answer", "appointment", "other"] as const;

// POST /api/leads/:id/call-log — record a call + outcome in one motion.
// Writes call_logs + conversation_logs; outcome=contacted bumps new → contacted
// (only when the lead is owned — intake rule preserved).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const outcome = OUTCOMES.includes(body.outcome) ? body.outcome : null;
  const note = (body.note ?? "").toString().slice(0, 500) || null;
  const durationSec = Number.isFinite(Number(body.duration_sec)) ? Math.max(0, Number(body.duration_sec)) : null;

  try {
    const lead = await qOne<any>(
      `select l.*, c.id as cid from leads l left join contacts c on c.id = l.contact_id where l.id = $1`,
      [id]
    );
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (lead.owner_id && lead.owner_id !== me.id && me.role !== "manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const call = await qOne<any>(
      `insert into call_logs (lead_id, contact_id, user_id, owner, phone, outcome, note, duration_sec)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
      [id, lead.cid, me.id, me.full_name, lead.phone, outcome, note, durationSec]
    );

    const outcomeLabel = outcome === "contacted" ? "โทรติดต่อ"
      : outcome === "no_answer" ? "โทรไม่รับ"
      : outcome === "appointment" ? "โทรนัดหมาย"
      : "โทร";
    await qRun(
      `insert into conversation_logs (contact_id, lead_id, channel, direction, summary, outcome, team_member, user_id)
       values ($1, $2, 'PHONE', 'outbound', $3, $4, $5, $6)`,
      [lead.cid, id, outcome === "contacted" && note ? `${outcomeLabel} — ${note}` : note ? `${outcomeLabel} — ${note}` : outcomeLabel, outcome ?? "other", me.full_name, me.id]
    );

    if (outcome === "contacted" && lead.crm_stage === "new" && lead.owner_id) {
      await qRun(`update leads set crm_stage = 'contacted' where id = $1`, [id]);
    }

    return NextResponse.json({ ok: true, call });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

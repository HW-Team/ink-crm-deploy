import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { qOne, qRun } from "@/lib/supabase";

// POST /api/leads/:id/visit — schedule a site visit (โชว์รูม/ที่ดิน).
// Creates a site_visit follow-up + bumps the lead stage to site_visit.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { due_date?: string; due_time?: string; note?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
  const dueDate = body.due_date ?? "";
  if (!dueDate) return NextResponse.json({ error: "due_date required" }, { status: 400 });

  try {
    const lead = await qOne<{ contact_id: string | null; crm_stage: string }>(
      `select contact_id, crm_stage from leads where id = $1`, [id]
    );
    if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });

    const fu = await qOne(
      `insert into follow_ups (contact_id, lead_id, due_date, due_time, task_type, owner, owner_id, priority, status, latest_note)
       values ($1,$2,$3,$4,'นัดดูโชว์รูม/ที่ดิน',$5,$6,'high','open',$7) returning *`,
      [lead.contact_id, id, dueDate, body.due_time || null, me.full_name, me.id, body.note || null]
    );

    // stage bump: only move forward (never backwards from won/lost)
    const forward = { new: 0, contacted: 1, qualified: 2, site_visit: 3, proposal: 4, won: 5 };
    const from = forward[lead.crm_stage as keyof typeof forward] ?? 0;
    if ((forward[lead.crm_stage as keyof typeof forward] ?? 0) < 3 && !["won", "lost", "unqualified"].includes(lead.crm_stage)) {
      await qRun(`update leads set crm_stage = 'site_visit' where id = $1`, [id]);
    }

    return NextResponse.json({ follow_up: fu, stage: "site_visit" }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

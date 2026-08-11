import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { qOne } from "@/lib/supabase";

// POST /api/follow-ups — create a follow-up (staff, session auth)
export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }

  const dueDate = String(body.due_date ?? "");
  if (!dueDate) return NextResponse.json({ error: "due_date required" }, { status: 400 });

  try {
    const fu = await qOne(
      `insert into follow_ups (contact_id, lead_id, due_date, due_time, task_type, owner, owner_id, priority, status, latest_note)
       values ($1,$2,$3,$4,$5,$6,$7,$8,'open',$9) returning *`,
      [
        body.contact_id ? String(body.contact_id) : null,
        body.lead_id ? String(body.lead_id) : null,
        dueDate,
        body.due_time ? String(body.due_time) : null,
        body.task_type ? String(body.task_type) : "โทรติดตาม",
        me.full_name,
        me.id,
        body.priority ? String(body.priority) : "medium",
        body.latest_note ? String(body.latest_note) : null,
      ]
    );
    if (!fu) return NextResponse.json({ error: "insert failed" }, { status: 500 });
    return NextResponse.json({ follow_up: fu }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

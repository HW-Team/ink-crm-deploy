import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { qOne } from "@/lib/supabase";

// PATCH /api/follow-ups/:id — reschedule (due_date/due_time), complete (status=done),
// or cancel (status=cancelled). Staff session auth.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { due_date?: string; due_time?: string | null; status?: string; latest_note?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }

  try {
    const fu = await qOne(
      `update follow_ups set
         due_date = coalesce($1::date, due_date),
         due_time = case when $2::boolean then $3::time else due_time end,
         status = coalesce($4, status),
         latest_note = coalesce($5, latest_note),
         completed_at = case when $4 = 'done' then now() when $4 = 'open' then null else completed_at end
       where id = $6 returning *`,
      [
        body.due_date || null,
        body.due_time !== undefined,
        body.due_time || null,
        body.status || null,
        body.latest_note || null,
        id,
      ]
    );
    if (!fu) return NextResponse.json({ error: "follow-up not found" }, { status: 404 });
    return NextResponse.json({ follow_up: fu });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

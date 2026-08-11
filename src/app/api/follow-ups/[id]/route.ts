import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { qOne, qRun } from "@/lib/supabase";

// PATCH /api/follow-ups/:id — reschedule (due_date/due_time), complete (status=done),
// cancel (status=cancelled), confirm a visit (confirmed=true, auto-logs), set location.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { due_date?: string; due_time?: string | null; status?: string; latest_note?: string; confirmed?: boolean; location?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }

  try {
    const before = await qOne<{ id: string; confirmed: boolean; contact_id: string | null; lead_id: string | null }>(
      `select id, confirmed, contact_id, lead_id from follow_ups where id = $1`, [id]
    );
    if (!before) return NextResponse.json({ error: "follow-up not found" }, { status: 404 });

    const fu = await qOne(
      `update follow_ups set
         due_date = coalesce($1::date, due_date),
         due_time = case when $2::boolean then $3::time else due_time end,
         status = coalesce($4, status),
         latest_note = coalesce($5, latest_note),
         confirmed = coalesce($6, confirmed),
         location = coalesce($7, location),
         completed_at = case when $4 = 'done' then now() when $4 = 'open' then null else completed_at end
       where id = $8 returning *`,
      [
        body.due_date || null,
        body.due_time !== undefined,
        body.due_time || null,
        body.status || null,
        body.latest_note || null,
        body.confirmed ?? null,
        body.location ?? null,
        id,
      ]
    );
    if (!fu) return NextResponse.json({ error: "follow-up not found" }, { status: 404 });

    // ยืนยันนัด → auto-log so it shows in the lead's history
    // NOTE: channel must be in channel_type enum ('PHONE','LINE','MESSENGER','WHATSAPP','EMAIL','SITE_FORM','OTHER')
    if (body.confirmed === true && !before.confirmed) {
      await qRun(
        `insert into conversation_logs (contact_id, lead_id, channel, direction, team_member, user_id, summary)
         values ($1,$2,'OTHER','OUT',$3,$4,$5)`,
        [before.contact_id, before.lead_id, me.full_name, me.id, "ยืนยันนัดแล้ว (ผ่านปฏิทิน)"]
      );
    }

    return NextResponse.json({ follow_up: fu });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

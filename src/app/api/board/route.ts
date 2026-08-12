import { NextRequest, NextResponse } from "next/server";
import { q, qOne } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";

// GET /api/board — full pipeline kanban.
//   ?owner=me | <user_id> | all   (default: all)
// Returns owned leads (optionally filtered) + inbox (unowned) for the ใหม่ lane.
export async function GET(req: NextRequest) {
  try {
    const owner = req.nextUrl.searchParams.get("owner") ?? "all";
    let ownerId: string | null = null;
    if (owner === "me") {
      const me = await getSessionUser();
      if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      ownerId = me.id;
    } else if (owner !== "all") {
      ownerId = owner;
    }

    const [leads, inboxRows, unownedRows] = await Promise.all([
      q(
        `select l.id, l.full_name, l.phone, l.interest, l.crm_stage, l.priority,
                v.id as visit_id, v.due_date as visit_date, v.due_time as visit_time,
                v.confirmed as visit_confirmed, v.status as visit_status
         from leads l
         left join lateral (
           select id, due_date, due_time, confirmed, status from follow_ups
           where lead_id = l.id and status = 'open' and task_type like '%นัดดู%'
           order by due_date limit 1
         ) v on true
         where l.owner_id is not null ${ownerId ? "and l.owner_id = $1" : ""}
         order by l.lead_date desc limit 300`,
        ownerId ? [ownerId] : []
      ),
      q(
        `select id, full_name, phone, interest, crm_stage
         from leads where owner_id is null
         order by lead_date desc limit 60`
      ),
      q(`select count(*)::int as n from leads where owner_id is null`),
    ]);
    return NextResponse.json({ leads, inbox: inboxRows, unowned_count: unownedRows[0]?.n ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { q } from "@/lib/supabase";

// GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD — events for calendar views.
// Events = open follow_ups in range + site visits, joined with contact/lead names.
export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const from = req.nextUrl.searchParams.get("from") ?? new Date().toISOString().slice(0, 10);
  const to = req.nextUrl.searchParams.get("to") ?? from;

  try {
    const events = await q(
      `select fu.id, fu.lead_id, fu.contact_id, fu.due_date, fu.due_time, fu.task_type,
              fu.status, fu.latest_note, fu.owner,
              c.full_name as contact_name, c.primary_phone,
              l.full_name as lead_name, l.crm_stage
       from follow_ups fu
       left join contacts c on c.id = fu.contact_id
       left join leads l on l.id = fu.lead_id
       where fu.due_date between $1 and $2
       order by fu.due_date, fu.due_time`,
      [from, to]
    );
    return NextResponse.json({ events });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

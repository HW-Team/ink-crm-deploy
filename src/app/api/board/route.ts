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
        `select id, full_name, phone, interest, crm_stage, priority
         from leads
         where owner_id is not null ${ownerId ? "and owner_id = $1" : ""}
         order by lead_date desc limit 300`,
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

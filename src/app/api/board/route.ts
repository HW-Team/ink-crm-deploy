import { NextRequest, NextResponse } from "next/server";
import { q, qOne } from "@/lib/supabase";

// GET /api/board — pipeline leads ONLY (owned). Unowned leads live in the inbox
// (ลีดใหม่) — manual intake rule: nothing enters the pipeline until claimed.
export async function GET() {
  try {
    const leads = await q(
      `select id, full_name, phone, interest, crm_stage, priority
       from leads where owner_id is not null
       order by lead_date desc limit 300`
    );
    const unowned = await q(`select count(*)::int as n from leads where owner_id is null`);
    return NextResponse.json({ leads, unowned_count: unowned[0]?.n ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

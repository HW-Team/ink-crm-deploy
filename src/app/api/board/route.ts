import { NextRequest, NextResponse } from "next/server";
import { q, qOne } from "@/lib/supabase";

// GET /api/board — leads grouped for kanban (all stages)
export async function GET() {
  try {
    const leads = await q(
      `select id, full_name, phone, interest, crm_stage, priority
       from leads order by lead_date desc limit 300`
    );
    return NextResponse.json({ leads });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

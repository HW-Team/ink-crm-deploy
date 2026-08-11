import { NextRequest, NextResponse } from "next/server";
import { qOne } from "@/lib/supabase";

// PATCH /api/leads/:id/stage — UI bump stage
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { stage?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
  if (!body.stage) return NextResponse.json({ error: "stage required" }, { status: 400 });

  try {
    const lead = await qOne(`update leads set crm_stage=$1 where id=$2 returning *`, [body.stage, id]);
    if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });
    return NextResponse.json({ lead });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

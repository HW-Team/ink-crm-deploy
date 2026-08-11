import { NextRequest, NextResponse } from "next/server";
import { qOne } from "@/lib/supabase";

// POST /api/leads — create lead from UI form
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }

  const fullName = String(body.full_name ?? "").trim();
  if (!fullName) return NextResponse.json({ error: "full_name required" }, { status: 400 });

  try {
    const lead = await qOne(
      `insert into leads (full_name, phone, source, interest, province, owner, crm_stage)
       values ($1,$2,$3,$4,$5,$6,'new') returning *`,
      [
        fullName,
        body.phone ? String(body.phone) : null,
        String(body.source ?? "OTHER").toUpperCase(),
        body.interest ? String(body.interest) : null,
        body.province ? String(body.province) : null,
        body.owner ? String(body.owner) : null,
      ]
    );
    return NextResponse.json({ lead }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

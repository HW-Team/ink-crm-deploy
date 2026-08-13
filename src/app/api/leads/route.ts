import { NextRequest, NextResponse } from "next/server";
import { q, qOne } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";

// GET /api/leads — lightweight lead picker list (session-authed) for
// calendar quick-add etc. Returns id/full_name/phone/contact_id.
export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = Math.min(500, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "200", 10) || 200));
  try {
    const leads = await q(
      `select id, full_name, phone, contact_id, crm_stage
       from leads order by lead_date desc limit ${limit}`
    );
    return NextResponse.json({ leads });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

// POST /api/leads — create lead from UI form
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }

  const fullName = String(body.full_name ?? "").trim();
  if (!fullName) return NextResponse.json({ error: "full_name required" }, { status: 400 });

  try {
    const lead = await qOne(
      `insert into leads (full_name, phone, email, source, interest, province, owner, crm_stage)
       values ($1,$2,$3,$4,$5,$6,$7,'new') returning *`,
      [
        fullName,
        body.phone ? String(body.phone) : null,
        body.email ? String(body.email) : null,
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

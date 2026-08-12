import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { qOne } from "@/lib/supabase";

// POST /api/leads/:id/claim — รับงาน (assign self to an unowned lead)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const lead = await qOne<{ owner_id: string | null }>(
      `select owner_id from leads where id = $1`, [id]
    );
    if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });
    if (lead.owner_id && lead.owner_id !== me.id) {
      return NextResponse.json({ error: "ลีดนี้มีเจ้าของแล้ว" }, { status: 409 });
    }
    const updated = await qOne(
      `update leads
       set owner_id = $1, owner = $2,
           crm_stage = case when crm_stage = 'new' then 'contacted' else crm_stage end,
           updated_at = now()
       where id = $3 returning *`,
      [me.id, me.full_name, id]
    );
    return NextResponse.json({ lead: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { qOne } from "@/lib/supabase";

// POST /api/leads/:id/unclaim — put a lead back into the inbox (owner null, stage new).
// Manager only — used to undo test claims or reassign flow.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const lead = await qOne(
      `update leads set owner_id = null, owner = null, crm_stage = 'new', updated_at = now()
       where id = $1 returning id`,
      [id]
    );
    if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

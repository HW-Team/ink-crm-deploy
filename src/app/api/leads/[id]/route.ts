import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { qRun } from "@/lib/supabase";

// DELETE /api/leads/:id — hard-delete a lead (manager only).
// For cleaning bad/test/duplicate leads. Contact rows are left intact.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    await qRun(
      `delete from conversation_logs where lead_id = $1;
       delete from follow_ups where lead_id = $1;
       delete from leads where id = $1;`,
      [id]
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

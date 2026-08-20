import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { q } from "@/lib/supabase";

// GET /api/leads/:id/calls — call history for a lead (newest first)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const calls = await q(
      `select c.*, u.full_name as user_name
       from call_logs c left join users u on u.id = c.user_id
       where c.lead_id = $1
       order by c.called_at desc limit 50`,
      [id]
    );
    return NextResponse.json({ ok: true, calls });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

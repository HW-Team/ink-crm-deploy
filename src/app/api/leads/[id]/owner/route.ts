import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { qOne } from "@/lib/supabase";

// PATCH /api/leads/:id/owner — โอนเจ้าของ { owner_id }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "manager" && me.role !== "sales") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  let body: { owner_id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
  if (!body.owner_id) return NextResponse.json({ error: "owner_id required" }, { status: 400 });

  try {
    const user = await qOne<{ id: string; full_name: string }>(
      `select id, full_name from users where id = $1`, [body.owner_id]
    );
    if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });
    const updated = await qOne(
      `update leads set owner_id = $1, owner = $2 where id = $3 returning *`,
      [user.id, user.full_name, id]
    );
    if (!updated) return NextResponse.json({ error: "lead not found" }, { status: 404 });
    return NextResponse.json({ lead: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

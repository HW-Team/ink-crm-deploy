import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, scryptHash } from "@/lib/auth";
import { qOne } from "@/lib/supabase";

const ROLES = ["sales", "manager", "agent"];

// PATCH /api/users/:id — update user (manager only): name/email/role/active/password
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "manager") return NextResponse.json({ error: "ต้องเป็นผู้จัดการ" }, { status: 403 });
  const { id } = await params;

  let body: { full_name?: string; email?: string; role?: string; active?: boolean; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }

  if (body.role && !ROLES.includes(body.role)) return NextResponse.json({ error: "role ไม่ถูกต้อง" }, { status: 400 });
  if (body.password !== undefined && String(body.password).length < 4) {
    return NextResponse.json({ error: "รหัสผ่านอย่างน้อย 4 ตัว" }, { status: 400 });
  }
  // guard: cannot disable/demote yourself
  if (id === me.id && (body.active === false || (body.role && body.role !== "manager"))) {
    return NextResponse.json({ error: "ไม่สามารถปิด/ลดสิทธิ์บัญชีตัวเองได้" }, { status: 400 });
  }

  try {
    const user = await qOne(
      `update users set
         full_name = coalesce($1, full_name),
         email = coalesce($2, email),
         role = coalesce($3, role),
         active = coalesce($4, active),
         password_hash = case when $5::boolean then $6 else password_hash end
       where id = $7
       returning id, email, full_name, role, active`,
      [
        body.full_name ?? null,
        body.email ? String(body.email).trim().toLowerCase() : null,
        body.role ?? null,
        body.active ?? null,
        body.password !== undefined,
        body.password ? scryptHash(String(body.password)) : null,
        id,
      ]
    );
    if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    return NextResponse.json({ user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

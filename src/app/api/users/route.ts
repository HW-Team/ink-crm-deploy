import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, scryptHash } from "@/lib/auth";
import { q, qOne } from "@/lib/supabase";

const ROLES = ["sales", "manager", "agent"];

// GET /api/users — staff list (any logged-in staff)
export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const users = await q(
      `select u.id, u.email, u.full_name, u.role, u.active, u.created_at,
         (select count(*) from leads l where l.owner_id = u.id) as owned_leads,
         (select count(*) from follow_ups fu where fu.owner_id = u.id and fu.status = 'open') as open_followups
       from users u order by u.role desc, u.full_name`
    );
    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

// POST /api/users — create user (manager only)
export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "manager") return NextResponse.json({ error: "ต้องเป็นผู้จัดการ" }, { status: 403 });

  let body: { full_name?: string; email?: string; role?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }

  const fullName = String(body.full_name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const role = String(body.role ?? "sales");
  const password = String(body.password ?? "");
  if (!fullName || !email || !ROLES.includes(role) || password.length < 4) {
    return NextResponse.json({ error: "กรอกข้อมูลให้ครบ (รหัสผ่านอย่างน้อย 4 ตัว)" }, { status: 400 });
  }

  try {
    const dup = await qOne(`select id from users where email = $1`, [email]);
    if (dup) return NextResponse.json({ error: "อีเมลนี้มีในระบบแล้ว" }, { status: 409 });

    const user = await qOne(
      `insert into users (email, full_name, role, password_hash) values ($1,$2,$3,$4)
       returning id, email, full_name, role`,
      [email, fullName, role, scryptHash(password)]
    );
    return NextResponse.json({ user }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

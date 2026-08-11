import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { qOne } from "@/lib/supabase";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE, scryptHash, scryptVerify } from "@/lib/auth";

// POST /api/auth/login — username or email + password (staff). Google OAuth to come.
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) return NextResponse.json({ error: "กรอกชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 });

  const user = await qOne<{ id: string; password_hash: string | null; active: boolean }>(
    `select id, password_hash, active from users where email = $1 or lower(full_name) = lower($1)`,
    [email]
  );
  if (!user || !user.password_hash || !user.active) {
    return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const stored = user.password_hash;
  let ok: boolean;
  if (stored.startsWith("scrypt$")) {
    ok = scryptVerify(password, stored);
  } else {
    ok = await bcrypt.compare(password, stored);
    if (ok) {
      // upgrade legacy bcrypt hash → native scrypt
      await qOne(`update users set password_hash = $1 where id = $2`, [scryptHash(password), user.id]);
    }
  }
  if (!ok) return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true, sameSite: "lax", secure: false, path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { qOne } from "@/lib/supabase";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

// POST /api/auth/login — email + password (staff). Google OAuth to come (needs client creds).
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) return NextResponse.json({ error: "กรอกอีเมลและรหัสผ่าน" }, { status: 400 });

  const user = await qOne<{ id: string; password_hash: string | null; active: boolean }>(
    `select id, password_hash, active from users where email = $1`,
    [email]
  );
  if (!user || !user.password_hash || !user.active) {
    return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true, sameSite: "lax", secure: false, path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

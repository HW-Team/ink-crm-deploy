import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { qOne } from "@/lib/supabase";
import {
  googleConfigured, exchangeCode, domainAllowed, GOOGLE_STATE_COOKIE,
} from "@/lib/google-oauth";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

// GET /api/auth/google/callback — exchange code, find-or-create user, set session.
export async function GET(req: NextRequest) {
  const jar = await cookies();
  const state = req.nextUrl.searchParams.get("state") || "";
  const saved = jar.get(GOOGLE_STATE_COOKIE)?.value;
  const fail = (msg: string) =>
    NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, req.nextUrl.origin));

  if (!googleConfigured()) return fail("Google ยังไม่ได้ตั้งค่า");
  if (!saved || state !== saved) return fail("state ไม่ตรงกัน — ลองใหม่อีกครั้ง");
  jar.delete(GOOGLE_STATE_COOKIE);

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return fail("ไม่มีรหัสยืนยันจาก Google");

  try {
    const { email, name, sub } = await exchangeCode(code, req.nextUrl.origin);
    if (!email) return fail("Google ไม่ได้ส่งอีเมลให้ — ใช้บัญชีอื่น");

    // existing user?
    let user = await qOne<{ id: string; active: boolean }>(
      `select id, active from users where lower(email) = lower($1)`, [email]
    );
    if (user && !user.active) return fail("บัญชีนี้ถูกปิดใช้งาน — ติดต่อผู้จัดการ");
    if (user && sub) {
      await qOne(`update users set google_id = $1 where id = $2`, [sub, user.id]);
    }

    // auto-provision only for allowed domains
    if (!user) {
      if (!domainAllowed(email)) {
        return fail("อีเมลนี้ยังไม่มีสิทธิ์เข้าใช้ — ให้ผู้จัดการเพิ่มบัญชีก่อน");
      }
      const created = await qOne<{ id: string }>(
        `insert into users (email, full_name, role, password_hash, active, google_id)
         values ($1, $2, 'sales', null, true, $3)
         on conflict (email) do update set email = excluded.email
         returning id`,
        [email, name || email.split("@")[0] || "ทีมขาย", sub || null]
      );
      user = created ? { id: created.id, active: true } : null;
      if (!user) return fail("สร้างบัญชีไม่สำเร็จ");
    }

    const res = NextResponse.redirect(new URL("/", req.nextUrl.origin));
    res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
      httpOnly: true, sameSite: "lax", secure: false, path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (e: any) {
    return fail(e?.message === "token exchange failed" ? "Google ปฏิเสธคำขอ — ลองใหม่" : "เกิดข้อผิดพลาด — ลองใหม่อีกครั้ง");
  }
}

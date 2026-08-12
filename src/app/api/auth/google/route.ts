import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  googleConfigured, googleAuthUrl, GOOGLE_STATE_COOKIE, GOOGLE_STATE_MAX_AGE,
} from "@/lib/google-oauth";

// GET /api/auth/google — start Google OAuth (state cookie → redirect).
export async function GET(req: NextRequest) {
  if (!googleConfigured()) {
    return NextResponse.json({ error: "Google Sign-In ยังไม่ได้ตั้งค่า (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET)" }, { status: 503 });
  }
  const state = crypto.randomBytes(24).toString("hex");
  const res = NextResponse.redirect(googleAuthUrl(state, req.nextUrl.origin));
  res.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true, sameSite: "lax", secure: false, path: "/",
    maxAge: GOOGLE_STATE_MAX_AGE,
  });
  return res;
}

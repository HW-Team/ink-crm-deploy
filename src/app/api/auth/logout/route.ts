import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

// POST /api/auth/logout — clear session cookie and send the user to /login.
// Redirect target must be the PUBLIC URL (req.url is internal localhost behind
// the reverse proxy) — build from APP_URL, falling back to forwarded headers.
export async function POST(req: NextRequest) {
  const base = process.env.APP_URL || `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("x-forwarded-host") ?? req.headers.get("host")}`;
  const res = NextResponse.redirect(new URL("/login", base), 303);
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true, sameSite: "lax", secure: false, path: "/",
    maxAge: 0,
  });
  return res;
}

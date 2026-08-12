import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

// POST /api/auth/logout — clear session cookie and send the user to /login.
// Must use a redirect (303 for form POST) so the browser doesn't show a raw
// JSON response after the sidebar/MobileNav logout form submits.
export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true, sameSite: "lax", secure: false, path: "/",
    maxAge: 0,
  });
  return res;
}

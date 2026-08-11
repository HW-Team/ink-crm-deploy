import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";

// Route protection: app pages need a valid session; /login and API auth/agent routes are open.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("ink_session")?.value;

  const isOpen =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/agent") ||
    pathname.startsWith("/api/setup");

  if (isOpen) return NextResponse.next();
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    // API routes other than the open set are guarded by their own handlers; let them through
    // (they will 401 themselves if no valid session — pages fetch them with the cookie).
    return NextResponse.next();
  }
  if (!verifySessionToken(token)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

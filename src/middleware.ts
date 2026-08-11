import { NextRequest, NextResponse } from "next/server";

// Route protection: presence-check the session cookie. Real signature verification
// happens server-side (pages via getSessionUser, API handlers). Middleware must stay
// edge-runtime-safe: NO node:crypto / pg imports here (that crashed every route:
// "Failed to load external module node:crypto").
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isOpen =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/agent") ||
    pathname.startsWith("/api/setup");

  if (isOpen) return NextResponse.next();
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next(); // API handlers 401 themselves
  }
  if (!req.cookies.get("ink_session")?.value) {
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

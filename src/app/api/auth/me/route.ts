import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

// GET /api/auth/me — current session user
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user });
}

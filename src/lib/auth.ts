import crypto from "node:crypto";
import { cookies } from "next/headers";
import { qOne } from "@/lib/supabase";

// Password hashing: native scrypt (fast). Format: scrypt$<salt>$<hash>
export function scryptHash(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}
export function scryptVerify(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const test = crypto.scryptSync(password, parts[1], 64);
  const want = Buffer.from(parts[2], "hex");
  return test.length === want.length && crypto.timingSafeEqual(test, want);
}

// Minimal session: HMAC-signed cookie (no external auth dependency).
// SESSION_SECRET must be set in app env (Coolify) — generated at deploy.
const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const COOKIE = "ink_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: string;
  email: string;
  full_name: string;
  role: "sales" | "manager" | "agent";
  avatar_url: string | null;
};

export function createSessionToken(uid: string): string {
  const exp = Date.now() + MAX_AGE * 1000;
  const payload = Buffer.from(JSON.stringify({ uid, exp })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): { uid: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expect = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { uid: data.uid };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  const parsed = verifySessionToken(token);
  if (!parsed) return null;
  return qOne<SessionUser>(
    `select id, email, full_name, role, avatar_url from users where id = $1 and active = true`,
    [parsed.uid]
  );
}

export const SESSION_COOKIE = COOKIE;
export const SESSION_MAX_AGE = MAX_AGE;

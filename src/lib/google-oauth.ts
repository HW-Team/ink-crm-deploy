// Google OAuth helpers (staff login via Google, HWT — "simple google login").
// Flow: GET /api/auth/google → redirect to Google → callback exchanges code →
// find-or-create user by email (domain whitelist via GOOGLE_ALLOWED_DOMAINS) →
// set the same HMAC ink_session cookie used by password login.

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

export function googleConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

export function googleClientId(): string {
  return CLIENT_ID;
}

export function googleRedirectUri(reqOrigin?: string | null): string {
  const base = process.env.APP_URL || reqOrigin || "";
  return `${base}/api/auth/google/callback`;
}

// Comma-separated allowlist (case-insensitive). Empty → no auto-provisioning;
// only emails already in the users table may sign in.
export function domainAllowed(email: string): boolean {
  const raw = process.env.GOOGLE_ALLOWED_DOMAINS || "";
  if (!raw.trim()) return false;
  const domain = email.split("@").pop()?.toLowerCase() || "";
  return raw.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean).includes(domain);
}

export const GOOGLE_STATE_COOKIE = "g_oauth_state";
export const GOOGLE_STATE_MAX_AGE = 60 * 10; // 10 minutes

export function googleAuthUrl(state: string, reqOrigin?: string | null): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: googleRedirectUri(reqOrigin),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCode(code: string, reqOrigin?: string | null): Promise<{ email: string; name: string; sub: string }> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: googleRedirectUri(reqOrigin),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) throw new Error("token exchange failed");
  const tokens = await tokenRes.json();

  const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!infoRes.ok) throw new Error("userinfo failed");
  const info = await infoRes.json();
  return { email: String(info.email || "").toLowerCase(), name: String(info.name || ""), sub: String(info.sub || "") };
}

import { Pool } from 'pg';

// Ink CRM data layer — plain PostgreSQL (pivoted off Supabase per CZ: "just make postgres").
// Single pool; server-side only (pages + API routes). Browser code never touches this.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

export async function q<T = any>(text: string, params?: unknown[]): Promise<T[]> {
  const res = await pool.query(text, params as any[]);
  return res.rows as T[];
}

export async function qOne<T = any>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

export async function qRun(text: string, params?: unknown[]): Promise<void> {
  await pool.query(text, params as any[]);
}

// Normalize Thai phone numbers for dedupe: strip spaces, dashes, leading +66/0 handling
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let p = raw.replace(/[^0-9+]/g, '');
  if (p.startsWith('+66')) p = '0' + p.slice(3);
  else if (p.startsWith('66') && p.length >= 10) p = '0' + p.slice(2);
  if (!p.startsWith('0')) return null;
  return p;
}

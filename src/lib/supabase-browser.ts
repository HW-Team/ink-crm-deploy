import { createClient } from "@supabase/supabase-js";

// Browser client — anon key + RLS (staff authenticated)
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY");
  return createClient(url, key);
}

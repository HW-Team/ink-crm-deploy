import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { q, qRun } from "@/lib/supabase";

// POST /api/setup/clean-dupes — merge duplicate leads by phone (manager only).
// For each numeric phone with >1 lead: keep the NEWEST lead, hard-delete the
// older duplicates (with their logs + follow-ups). Placeholder phones like
// "ไม่ให้เบอร์" / "ไม่ระบุ" are skipped.
export async function POST() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const dupes = await q<{ phone: string }>(
      `select phone from leads
       where phone is not null and phone ~ '^[0-9+()\\- .]{6,}$'
       group by phone having count(*) > 1`
    );
    const deleted: { phone: string; count: number; kept: string }[] = [];
    for (const d of dupes) {
      const rows = await q<{ id: string; full_name: string; lead_date: string | null }>(
        `select id, full_name, lead_date from leads
         where phone = $1 order by lead_date desc nulls last, created_at desc`,
        [d.phone]
      );
      if (rows.length <= 1) continue;
      const keep = rows[0];
      const old = rows.slice(1);
      const ids = old.map((r) => r.id);
      await qRun(`delete from conversation_logs where lead_id = any($1::uuid[])`, [ids]);
      await qRun(`delete from follow_ups where lead_id = any($1::uuid[])`, [ids]);
      await qRun(`delete from leads where id = any($1::uuid[])`, [ids]);
      deleted.push({ phone: d.phone, count: old.length, kept: keep.full_name });
    }
    return NextResponse.json({ ok: true, phones_cleaned: deleted.length, deleted });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

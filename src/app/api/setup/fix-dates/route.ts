import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { q, qRun } from "@/lib/supabase";

// POST /api/setup/fix-dates — one-time data repair (manager only).
// Leads whose lead_date is in the future (> now + 3d) or before 2024 got wrong
// dates from the legacy sheet. Backfill from the linked contact's first_lead_date
// (or created_at / today as fallback). NULL lead_date gets the same treatment.
export async function POST() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const bad = await q<{ id: string; full_name: string; lead_date: string | null }>(
      `select l.id, l.full_name, l.lead_date
       from leads l
       where l.lead_date is null
          or l.lead_date < '2024-01-01'
          or l.lead_date > now() + interval '3 days'`
    );
    if (bad.length === 0) return NextResponse.json({ ok: true, fixed: 0, note: "no bad dates" });

    await qRun(
      `update leads l
       set lead_date = coalesce(
         (select c.first_lead_date from contacts c where c.id = l.contact_id and c.first_lead_date is not null),
         (select c.created_at::date from contacts c where c.id = l.contact_id),
         now()::date
       ),
       updated_at = now()
       where l.lead_date is null
          or l.lead_date < '2024-01-01'
          or l.lead_date > now() + interval '3 days'`
    );
    return NextResponse.json({ ok: true, fixed: bad.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { q, qRun } from "@/lib/supabase";

// POST /api/setup/fix-dates — one-time data repair (manager only).
// Leads with future/garbage lead_date got wrong dates from the legacy sheet.
// Reconstruct the real month from the source tab (month_tab: MAY26/JUNE26/...),
// fall back to the contact's first valid lead date, then today.
// Also repairs contacts.first_lead_date that carries the same garbage.
export async function POST() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const bad = await q<{ id: string }>(
      `select id from leads
       where lead_date is null or lead_date < '2024-01-01' or lead_date > now() + interval '3 days'`
    );
    const badContacts = await q<{ id: string }>(
      `select id from contacts
       where first_lead_date is null or first_lead_date < '2024-01-01' or first_lead_date > now() + interval '3 days'`
    );

    if (bad.length) {
      await qRun(
        `update leads l
         set lead_date = case
           when l.month_tab ~ 'JAN' then '2026-01-01'::date
           when l.month_tab ~ 'FEB' then '2026-02-01'::date
           when l.month_tab ~ 'MAR' then '2026-03-01'::date
           when l.month_tab ~ 'APR' then '2026-04-01'::date
           when l.month_tab ~ 'MAY' then '2026-05-01'::date
           when l.month_tab ~ 'JUN' then '2026-06-01'::date
           when l.month_tab ~ 'JUL' then '2026-07-01'::date
           when l.month_tab ~ 'AUG' then '2026-08-01'::date
           when l.month_tab ~ 'SEP' then '2026-09-01'::date
           when l.month_tab ~ 'OCT' then '2026-10-01'::date
           when l.month_tab ~ 'NOV' then '2026-11-01'::date
           when l.month_tab ~ 'DEC' then '2026-12-01'::date
           else coalesce(
             (select min(c.first_lead_date) from contacts c
              where c.id = l.contact_id
                and c.first_lead_date between '2024-01-01' and now()),
             l.lead_date, now()::date)
         end,
         updated_at = now()
         where l.lead_date is null
            or l.lead_date < '2024-01-01'
            or l.lead_date > now() + interval '3 days'`
      );
    }

    if (badContacts.length) {
      await qRun(
        `update contacts c
         set first_lead_date = coalesce(
           (select min(l.lead_date) from leads l
            where l.contact_id = c.id
              and l.lead_date between '2024-01-01' and now()),
           c.created_at::date)
         where c.first_lead_date is null
            or c.first_lead_date < '2024-01-01'
            or c.first_lead_date > now() + interval '3 days'`
      );
    }

    return NextResponse.json({ ok: true, fixed_leads: bad.length, fixed_contacts: badContacts.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

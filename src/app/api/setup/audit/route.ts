import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { q } from "@/lib/supabase";

// GET /api/setup/audit — data-integrity audit (manager only).
// Used for the pilot credibility review: date anomalies, dupes, gaps, test data.
export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const [byMonth, anomalies, dupes, testLeads, noProvince, noPhone, stageCounts, owners] = await Promise.all([
      q(`select to_char(lead_date, 'YYYY-MM') as m, count(*)::int as n
         from leads group by 1 order by 1 desc limit 24`),
      q(`select id, full_name, lead_date from leads
         where lead_date < '2024-01-01' or lead_date > now() + interval '3 days'
         order by lead_date limit 50`),
      q(`select phone, count(*)::int as n from leads
         where phone is not null group by phone having count(*) > 1 order by n desc limit 20`),
      q(`select id, full_name, phone, source, lead_date from leads
         where full_name ilike '%e2e%' or full_name ilike '%test%' or full_name ilike '%ทดสอบ%'
            or full_name like 'FB %' or full_name like 'Web %'
         order by lead_date desc limit 30`),
      q(`select count(*)::int as n from leads where province is null`),
      q(`select count(*)::int as n from leads where phone is null and email is null`),
      q(`select crm_stage, count(*)::int as n from leads group by crm_stage order by n desc`),
      q(`select owner, count(*)::int as n from leads where owner_id is not null group by owner order by n desc`),
    ]);
    return NextResponse.json({ by_month: byMonth, anomalies: anomalies, phone_dupes: dupes, test_leads: testLeads, no_province: noProvince[0]?.n ?? 0, no_phone_no_email: noPhone[0]?.n ?? 0, stages: stageCounts, owners });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

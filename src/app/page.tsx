import { q } from "@/lib/supabase";
import { thDate } from "@/lib/labels";
import { getServerLang, t } from "@/lib/i18n";
import StageBadge from "@/components/StageBadge";
import ClaimButton from "@/components/ClaimButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const lang = await getServerLang();
  const today = new Date().toISOString().slice(0, 10);

  const [followUps, newLeads, totalLeadsRows, inboxRows] = await Promise.all([
    q(
      `select fu.*, c.full_name as contact_name, c.primary_phone,
              l.full_name as lead_name, l.crm_stage
       from follow_ups fu
       left join contacts c on c.id = fu.contact_id
       left join leads l on l.id = fu.lead_id
       where fu.status = 'open' and fu.due_date <= $1
       order by fu.due_date limit 20`,
      [today]
    ),
    q(
      `select * from leads where lead_date >= $1
       order by lead_date desc limit 10`,
      [`${today}T00:00:00`]
    ),
    q(`select count(*)::int as n from leads`),
    q(`select l.* from leads l where l.owner_id is null order by l.lead_date desc limit 8`),
  ]);

  const totalLeads = totalLeadsRows[0]?.n ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{t(lang, "today.title")}</h1>
          <p className="text-sm text-[#64748B]">{thDate(new Date().toISOString(), lang)}</p>
        </div>
      </header>

      <div className="card flex items-center gap-6">
        <div>
          <div className="kpi-value">{followUps.length}</div>
          <div className="kpi-label">{t(lang, "today.dueToday")}</div>
        </div>
        <div>
          <div className="kpi-value">{newLeads.length}</div>
          <div className="kpi-label">{t(lang, "today.newToday")}</div>
        </div>
        <div>
          <div className="kpi-value">{inboxRows.length}</div>
          <div className="kpi-label">{t(lang, "today.claimQueue")}</div>
        </div>
        <div>
          <div className="kpi-value">{totalLeads}</div>
          <div className="kpi-label">{t(lang, "today.allLeads")}</div>
        </div>
      </div>

      {inboxRows.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[#0F172A]">{t(lang, "today.claimQueue")}</h2>
            <Link href="/leads?tab=inbox" className="text-sm font-medium text-[#0E7490] hover:underline">{t(lang, "common.viewAll")}</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {inboxRows.map((l: any) => (
              <div key={l.id} className="card flex items-center justify-between gap-3 !py-3">
                <div className="min-w-0">
                  <p className="font-medium text-[#0F172A] text-sm truncate">{l.full_name}</p>
                  <p className="font-mono text-xs text-[#64748B] mt-0.5 truncate">{l.phone ?? "—"}</p>
                  {l.interest && <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{l.interest}</p>}
                </div>
                <ClaimButton leadId={l.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-3">{t(lang, "today.dueToday")}</h2>
        <div className="card overflow-x-auto p-0">
          <table className="tbl">
            <thead>
              <tr><th>{t(lang, "today.contacts")}</th><th>{t(lang, "common.phone")}</th><th>{t(lang, "common.stage")}</th><th>{t(lang, "common.due")}</th><th>{t(lang, "common.owner")}</th><th>{t(lang, "common.note")}</th></tr>
            </thead>
            <tbody>
              {followUps.length === 0 && (
                <tr><td colSpan={6} className="text-center text-[#94A3B8] py-8">{t(lang, "today.noDue")}</td></tr>
              )}
              {followUps.map((fu: any) => (
                <tr key={fu.id}>
                  <td className="font-medium text-[#0F172A]">{fu.contact_name ?? fu.lead_name ?? "—"}</td>
                  <td className="font-mono text-[13px]">{fu.primary_phone ?? "—"}</td>
                  <td><StageBadge stage={fu.crm_stage ?? "new"} lang={lang} /></td>
                  <td>{thDate(fu.due_date, lang)}</td>
                  <td>{fu.owner ?? "—"}</td>
                  <td className="max-w-[240px] truncate">{fu.latest_note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-3">{t(lang, "today.newToday")}</h2>
        <div className="card overflow-x-auto p-0">
          <table className="tbl">
            <thead>
              <tr><th>{t(lang, "common.name")}</th><th>{t(lang, "common.phone")}</th><th>{t(lang, "common.stage")}</th><th>{t(lang, "common.due")}</th></tr>
            </thead>
            <tbody>
              {newLeads.length === 0 && (
                <tr><td colSpan={4} className="text-center text-[#94A3B8] py-8">{t(lang, "today.noNew")}</td></tr>
              )}
              {newLeads.map((l: any) => (
                <tr key={l.id}>
                  <td className="font-medium text-[#0F172A]">{l.full_name}</td>
                  <td className="font-mono text-[13px]">{l.phone ?? "—"}</td>
                  <td><StageBadge stage={l.crm_stage} lang={lang} /></td>
                  <td>{thDate(l.lead_date, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

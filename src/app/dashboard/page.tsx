import { q } from "@/lib/supabase";
import StageBadge from "@/components/StageBadge";
import { sourceLabel, stageLabel } from "@/lib/labels";
import { t, getServerLang } from "@/lib/i18n";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STAGE_ORDER = ["new", "contacted", "qualified", "site_visit", "proposal", "won", "unqualified", "lost", "no_answer", "duplicate"];
const PIPELINE = ["contacted", "qualified", "site_visit", "proposal", "won"];

export default async function DashboardPage() {
  const lang = await getServerLang();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const twoWeeksAgo = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);

  const [
    leadRows, contactsRows, followUpsRows, unownedRows,
    trendRows, weekCounts, activityRows, workloadRows, closesRows, pipelineRows,
  ] = await Promise.all([
    q(`select crm_stage, source, full_name, owner from leads limit 5000`),
    q(`select count(*)::int as n from contacts`),
    q(`select count(*)::int as n from follow_ups where status = 'open'`),
    q(`select count(*)::int as n from leads where owner_id is null`),
    q(
      `select to_char(lead_date, 'MM-DD') as d, count(*)::int as n
       from leads where lead_date >= $1 group by 1 order by 1`,
      [`${twoWeeksAgo}T00:00:00`]
    ),
    q(
      `select
         count(*) filter (where lead_date >= $1 and lead_date < $2) as this_week,
         count(*) filter (where lead_date >= $2 and lead_date < $3) as last_week
       from leads`,
      [`${weekAgo}T00:00:00`, `${today}T00:00:00`, `${twoWeeksAgo}T00:00:00`]
    ),
    q(
      `select
         count(*) filter (where lead_date >= $1) as new_today,
         (select count(*) from conversation_logs where logged_at >= $1) as logs_today,
         (select count(*) from follow_ups where status = 'done' and completed_at >= $1) as done_today,
         (select count(*) from follow_ups where status = 'open' and due_date = $2) as due_today
       from leads`,
      [`${today}T00:00:00`, today]
    ),
    q(
      `select u.full_name, u.role,
         count(l.id) filter (where l.owner_id = u.id) as owned_leads,
         count(l.id) filter (where l.owner_id = u.id and l.crm_stage = 'new') as uncontacted,
         count(fu.id) filter (where fu.owner_id = u.id and fu.status = 'open') as open_followups
       from users u
       left join leads l on 1 = 1
       left join follow_ups fu on 1 = 1
       group by u.id, u.full_name, u.role
       order by owned_leads desc`
    ),
    q(
      `select count(*)::int as n from leads
       where crm_stage = 'won' and updated_at >= $1`, [`${weekAgo}T00:00:00`]
    ),
    q(
      `select crm_stage, count(*)::int as n, coalesce(sum(deal_value), 0)::numeric(12,0) as total
       from leads where owner_id is not null group by crm_stage`
    ),
  ]);

  const totalLeads = leadRows.length;
  const byStage = new Map<string, number>();
  const bySource = new Map<string, number>();
  for (const l of leadRows) {
    byStage.set(l.crm_stage, (byStage.get(l.crm_stage) ?? 0) + 1);
    bySource.set(l.source, (bySource.get(l.source) ?? 0) + 1);
  }
  const openFollowUps = followUpsRows[0]?.n ?? 0;
  const totalContacts = contactsRows[0]?.n ?? 0;
  const unowned = unownedRows[0]?.n ?? 0;
  const qualified = byStage.get("qualified") ?? 0;
  const w = weekCounts[0] ?? { this_week: 0, last_week: 0 };
  const leadDelta = w.last_week ? Math.round(((w.this_week - w.last_week) / w.last_week) * 100) : null;
  const act = activityRows[0] ?? { new_today: 0, logs_today: 0, done_today: 0, due_today: 0 };
  const closesWeek = closesRows[0]?.n ?? 0;
  const maxLoad = Math.max(1, ...workloadRows.map((x) => x.owned_leads ?? 0));
  const maxTrend = Math.max(1, ...trendRows.map((x) => x.n));

  const pipeline = new Map<string, { n: number; total: number }>();
  for (const s of PIPELINE) pipeline.set(s, { n: 0, total: 0 });
  for (const r of pipelineRows) {
    if (pipeline.has(r.crm_stage)) {
      pipeline.set(r.crm_stage, { n: r.n, total: Number(r.total) });
    }
  }
  const pipelineTotal = [...pipeline.values()].reduce((a, b) => a + b.n, 0);

  const kpis = [
    { label: t(lang, "dash.allLeads"), value: totalLeads, sub: leadDelta === null ? t(lang, "dash.firstWeek") : `${leadDelta >= 0 ? "+" : ""}${leadDelta}% ${t(lang, "dash.vsLastWeek")}` },
    { label: t(lang, "today.contacts"), value: totalContacts, sub: t(lang, "dash.contactsDb") },
    { label: t(lang, "dash.openFups"), value: openFollowUps, sub: `${act.due_today} ${t(lang, "dash.dueToday")}` },
    { label: t(lang, "dash.qualified"), value: qualified, sub: t(lang, "dash.readyToClose") },
    { label: t(lang, "today.claimQueue"), value: unowned, sub: t(lang, "dash.inbox") },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{t(lang, "dash.title")}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{t(lang, "dash.overview")}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#0F172A] font-mono">{closesWeek}</div>
          <div className="text-xs text-[#64748B]">{t(lang, "dash.wonWeek")}</div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value mt-1">{k.value.toLocaleString()}</div>
            <div className={`text-xs mt-1.5 ${leadDelta !== null && k.label === t(lang, "dash.allLeads") && leadDelta < 0 ? "text-[#B91C1C]" : "text-[#64748B]"}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      <section className="card">
        <h2 className="text-base font-semibold text-[#0F172A] mb-4">{t(lang, "dash.newLeads14d")}</h2>
        {trendRows.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">{t(lang, "dash.noDaily")}</p>
        ) : (
          <div className="flex items-end gap-1 h-20">
            {trendRows.map((r) => (
              <div key={r.d} className="flex-1 flex flex-col items-center gap-1 group" title={`${r.d}: ${r.n} ${t(lang, "today.allLeads")}`}>
                <div
                  className="w-full rounded-t bg-[#0E7490] group-hover:bg-[#155E75] transition-colors"
                  style={{ height: `${Math.max(4, Math.round((r.n / maxTrend) * 64))}px` }}
                />
                <span className="text-[9px] text-[#94A3B8]">{r.d.slice(3)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card">
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">{t(lang, "dash.pipeline")}</h2>
          <div className="space-y-3">
            {PIPELINE.map((s) => {
              const row = pipeline.get(s)!;
              const pct = pipelineTotal ? Math.round((row.n / pipelineTotal) * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex items-baseline justify-between text-sm mb-1">
                    <span className="text-[#334155]">{stageLabel(lang, s)}</span>
                    <span className="font-mono text-[#0F172A] font-semibold">{row.n} <span className="text-[#94A3B8] font-normal">/ {row.total.toLocaleString()} ฿</span></span>
                  </div>
                  <div className="pbar"><div style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
            {pipelineTotal === 0 && <p className="text-sm text-[#94A3B8]">{t(lang, "dash.claimFirst")}</p>}
          </div>
        </section>

        <section className="card">
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">{t(lang, "dash.activity")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { n: act.new_today, l: t(lang, "leads.inbox"), to: "/leads" },
              { n: act.due_today, l: t(lang, "today.dueToday"), to: "/" },
              { n: act.logs_today, l: t(lang, "log.title"), to: "/contacts" },
              { n: act.done_today, l: t(lang, "dash.closeFup"), to: "/followups" },
            ].map((a) => (
              <Link key={a.l} href={a.to} className="rounded-lg border border-[#E2E8F0] px-4 py-3 hover:border-[#0E7490] transition-colors">
                <div className="text-xl font-bold text-[#0F172A] font-mono">{a.n}</div>
                <div className="text-xs text-[#64748B] mt-0.5">{a.l}</div>
              </Link>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-[#334155]">{t(lang, "dash.wonWeek")}</span>
              <span className="font-mono font-semibold text-[#0F172A]">{closesWeek}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card">
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">{t(lang, "dash.workload")}</h2>
          <div className="space-y-3">
            {workloadRows.map((x: any) => (
              <div key={x.full_name} className="flex items-center gap-3">
                <div className="w-28 text-sm text-[#334155] shrink-0 truncate">
                  {x.full_name}{x.role === "agent" ? " (AI)" : ""}
                </div>
                <div className="pbar flex-1">
                  <div style={{ width: `${Math.round(((x.owned_leads ?? 0) / maxLoad) * 100)}%` }} />
                </div>
                <div className="w-24 text-right text-xs text-[#64748B] shrink-0">
                  {x.owned_leads ?? 0} {t(lang, "today.allLeads")} · {x.open_followups ?? 0} {t(lang, "dash.openFups")}
                </div>
              </div>
            ))}
            {workloadRows.length === 0 && <p className="text-sm text-[#94A3B8]">{t(lang, "dash.noWorkload")}</p>}
          </div>
        </section>

        <section className="card">
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">{t(lang, "common.source")}</h2>
          <div className="space-y-3">
            {[...bySource.entries()].sort((a, b) => b[1] - a[1]).map(([src, n]) => {
              const pct = totalLeads ? Math.round((n / totalLeads) * 100) : 0;
              return (
                <div key={src} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-[#334155] shrink-0">{sourceLabel(lang, src)}</div>
                  <div className="pbar flex-1"><div style={{ width: `${pct}%` }} /></div>
                  <div className="w-10 text-right text-sm font-semibold text-[#0F172A]">{n}</div>
                </div>
              );
            })}
            {bySource.size === 0 && <p className="text-sm text-[#94A3B8]">{t(lang, "common.noData")}</p>}
          </div>
        </section>
      </div>

      <section className="card overflow-x-auto p-0">
        <h2 className="text-base font-semibold text-[#0F172A] px-6 pt-5 pb-2">{t(lang, "dash.latestLeads")}</h2>
        <table className="tbl">
          <thead>
            <tr><th>{t(lang, "common.name")}</th><th>{t(lang, "common.stage")}</th><th>{t(lang, "common.source")}</th><th>{t(lang, "common.owner")}</th></tr>
          </thead>
          <tbody>
            {leadRows.slice(0, 10).map((l: any) => (
              <tr key={l.id}>
                <td className="font-medium text-[#0F172A]">
                  <a href={`/leads/${l.id}`} className="hover:text-[#0E7490]">{l.full_name}</a>
                </td>
                <td><StageBadge stage={l.crm_stage} lang={lang} /></td>
                <td>{sourceLabel(lang, l.source)}</td>
                <td>{l.owner ?? "—"}</td>
              </tr>
            ))}
            {leadRows.length === 0 && (
              <tr><td colSpan={4} className="text-center text-[#94A3B8] py-8">{t(lang, "dash.noLeads")}</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

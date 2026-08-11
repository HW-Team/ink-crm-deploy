import { q } from "@/lib/supabase";
import StageBadge from "@/components/StageBadge";
import { SOURCE_LABELS } from "@/lib/labels";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STAGE_ORDER = ["new", "contacted", "qualified", "site_visit", "proposal", "won", "unqualified", "lost", "no_answer", "duplicate"];
const STAGE_LABELS: Record<string, string> = {
  new: "ใหม่", contacted: "ติดต่อแล้ว", qualified: "สนใจ", site_visit: "นัดดู",
  proposal: "เสนอราคา", won: "ปิดการขาย", unqualified: "ไม่ผ่าน", lost: "หลุด",
  no_answer: "ไม่ตอบ", duplicate: "ซ้ำ",
};
const PIPELINE = ["contacted", "qualified", "site_visit", "proposal", "won"];

export default async function DashboardPage() {
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
    { label: "ลีดทั้งหมด", value: totalLeads, sub: leadDelta === null ? "สัปดาห์แรก" : `${leadDelta >= 0 ? "+" : ""}${leadDelta}% เทียบสัปดาห์ก่อน` },
    { label: "คอนแทกต์", value: totalContacts, sub: "ฐานข้อมูลลูกค้า" },
    { label: "ติดตามค้าง", value: openFollowUps, sub: `${act.due_today} รายครบกำหนดวันนี้` },
    { label: "สนใจ", value: qualified, sub: "ลีดที่พร้อมปิด" },
    { label: "รอรับงาน", value: unowned, sub: "ลีดในกล่อง inbox" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">แดชบอร์ด</h1>
          <p className="text-sm text-[#64748B] mt-0.5">ภาพรวม CRM วันนี้</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#0F172A] font-mono">{closesWeek}</div>
          <div className="text-xs text-[#64748B]">ปิดการขายสัปดาห์นี้</div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value mt-1">{k.value.toLocaleString()}</div>
            <div className={`text-xs mt-1.5 ${leadDelta !== null && k.label === "ลีดทั้งหมด" && leadDelta < 0 ? "text-[#B91C1C]" : "text-[#64748B]"}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      <section className="card">
        <h2 className="text-base font-semibold text-[#0F172A] mb-4">ลีดใหม่ 14 วัน</h2>
        {trendRows.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">ยังไม่มีข้อมูลลีดรายวัน</p>
        ) : (
          <div className="flex items-end gap-1 h-20">
            {trendRows.map((r) => (
              <div key={r.d} className="flex-1 flex flex-col items-center gap-1 group" title={`${r.d}: ${r.n} ลีด`}>
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
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">Pipeline</h2>
          <div className="space-y-3">
            {PIPELINE.map((s) => {
              const row = pipeline.get(s)!;
              const pct = pipelineTotal ? Math.round((row.n / pipelineTotal) * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex items-baseline justify-between text-sm mb-1">
                    <span className="text-[#334155]">{STAGE_LABELS[s]}</span>
                    <span className="font-mono text-[#0F172A] font-semibold">{row.n} <span className="text-[#94A3B8] font-normal">/ {row.total.toLocaleString()} ฿</span></span>
                  </div>
                  <div className="pbar"><div style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
            {pipelineTotal === 0 && <p className="text-sm text-[#94A3B8]">ยังไม่มีลีดใน pipeline รับงานจากกล่องลีดใหม่ก่อน</p>}
          </div>
        </section>

        <section className="card">
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">กิจกรรมวันนี้</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { n: act.new_today, l: "ลีดใหม่", to: "/leads" },
              { n: act.due_today, l: "ติดตามครบกำหนด", to: "/" },
              { n: act.logs_today, l: "บันทึกการติดต่อ", to: "/contacts" },
              { n: act.done_today, l: "ปิดงานติดตาม", to: "/followups" },
            ].map((a) => (
              <Link key={a.l} href={a.to} className="rounded-lg border border-[#E2E8F0] px-4 py-3 hover:border-[#0E7490] transition-colors">
                <div className="text-xl font-bold text-[#0F172A] font-mono">{a.n}</div>
                <div className="text-xs text-[#64748B] mt-0.5">{a.l}</div>
              </Link>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-[#334155]">ปิดการขายสัปดาห์นี้</span>
              <span className="font-mono font-semibold text-[#0F172A]">{closesWeek}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card">
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">ภาระงานต่อคน</h2>
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
                  {x.owned_leads ?? 0} ลีด · {x.open_followups ?? 0} ติดตาม
                </div>
              </div>
            ))}
            {workloadRows.length === 0 && <p className="text-sm text-[#94A3B8]">ยังไม่มีทีม</p>}
          </div>
        </section>

        <section className="card">
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">แหล่งที่มา</h2>
          <div className="space-y-3">
            {[...bySource.entries()].sort((a, b) => b[1] - a[1]).map(([src, n]) => {
              const pct = totalLeads ? Math.round((n / totalLeads) * 100) : 0;
              return (
                <div key={src} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-[#334155] shrink-0">{SOURCE_LABELS[src] ?? src}</div>
                  <div className="pbar flex-1"><div style={{ width: `${pct}%` }} /></div>
                  <div className="w-10 text-right text-sm font-semibold text-[#0F172A]">{n}</div>
                </div>
              );
            })}
            {bySource.size === 0 && <p className="text-sm text-[#94A3B8]">ยังไม่มีข้อมูล</p>}
          </div>
        </section>
      </div>

      <section className="card overflow-x-auto p-0">
        <h2 className="text-base font-semibold text-[#0F172A] px-6 pt-5 pb-2">ลีดล่าสุด</h2>
        <table className="tbl">
          <thead>
            <tr><th>ชื่อ</th><th>สเตจ</th><th>แหล่ง</th><th>เจ้าของ</th></tr>
          </thead>
          <tbody>
            {leadRows.slice(0, 10).map((l: any) => (
              <tr key={l.id}>
                <td className="font-medium text-[#0F172A]">
                  <a href={`/leads/${l.id}`} className="hover:text-[#0E7490]">{l.full_name}</a>
                </td>
                <td><StageBadge stage={l.crm_stage} /></td>
                <td>{SOURCE_LABELS[l.source] ?? l.source}</td>
                <td>{l.owner ?? "—"}</td>
              </tr>
            ))}
            {leadRows.length === 0 && (
              <tr><td colSpan={4} className="text-center text-[#94A3B8] py-8">ยังไม่มีลีด</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

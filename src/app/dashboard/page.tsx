import { q } from "@/lib/supabase";
import StageBadge from "@/components/StageBadge";
import { SOURCE_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [leadRows, contactsRows, followUpsRows, workloadRows, unownedRows] = await Promise.all([
    q(`select crm_stage, source, full_name, owner from leads limit 5000`),
    q(`select count(*)::int as n from contacts`),
    q(`select count(*)::int as n from follow_ups where status = 'open'`),
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
    q(`select count(*)::int as n from leads where owner_id is null`),
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

  const stageOrder = ["new", "contacted", "qualified", "site_visit", "proposal", "won", "unqualified", "lost", "no_answer", "duplicate"];
  const stageLabels: Record<string, string> = {
    new: "ใหม่", contacted: "ติดต่อแล้ว", qualified: "สนใจ", site_visit: "นัดดู",
    proposal: "เสนอราคา", won: "ปิดการขาย", unqualified: "ไม่ผ่าน", lost: "หลุด",
    no_answer: "ไม่ตอบ", duplicate: "ซ้ำ",
  };
  const qualified = byStage.get("qualified") ?? 0;
  const maxLoad = Math.max(1, ...workloadRows.map((w) => w.owned_leads ?? 0));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">แดชบอร์ด</h1>
        <p className="text-sm text-[#64748B]">ภาพรวม CRM</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "ลีดทั้งหมด", value: totalLeads },
          { label: "คอนแทกต์", value: totalContacts },
          { label: "ติดตามค้าง", value: openFollowUps },
          { label: "สนใจ", value: qualified },
          { label: "รอรับงาน", value: unowned },
        ].map((k) => (
          <div key={k.label} className="card">
            <div className="kpi-value">{k.value.toLocaleString()}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card">
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">Pipeline ตามสเตจ</h2>
          <div className="space-y-3">
            {stageOrder.map((s) => {
              const n = byStage.get(s) ?? 0;
              const pct = totalLeads ? Math.round((n / totalLeads) * 100) : 0;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-[#334155] shrink-0">{stageLabels[s]}</div>
                  <div className="pbar flex-1"><div style={{ width: `${pct}%` }} /></div>
                  <div className="w-10 text-right text-sm font-semibold text-[#0F172A]">{n}</div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-6">
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

          <section className="card">
            <h2 className="text-base font-semibold text-[#0F172A] mb-4">ภาระงานต่อคน</h2>
            <div className="space-y-3">
              {workloadRows.map((w: any) => (
                <div key={w.full_name} className="flex items-center gap-3">
                  <div className="w-28 text-sm text-[#334155] shrink-0 truncate">
                    {w.full_name}{w.role === "agent" ? " (AI)" : ""}
                  </div>
                  <div className="pbar flex-1">
                    <div style={{ width: `${Math.round(((w.owned_leads ?? 0) / maxLoad) * 100)}%` }} />
                  </div>
                  <div className="w-24 text-right text-xs text-[#64748B] shrink-0">
                    {w.owned_leads ?? 0} ลีด · {w.open_followups ?? 0} ติดตาม
                  </div>
                </div>
              ))}
              {workloadRows.length === 0 && <p className="text-sm text-[#94A3B8]">ยังไม่มีทีม</p>}
            </div>
          </section>
        </div>
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
                <td className="font-medium text-[#0F172A]">{l.full_name}</td>
                <td><StageBadge stage={l.crm_stage} /></td>
                <td>{SOURCE_LABELS[l.source] ?? l.source}</td>
                <td>{l.owner ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

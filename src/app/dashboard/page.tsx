import { q } from "@/lib/supabase";
import StageBadge from "@/components/StageBadge";
import { SOURCE_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [leadRows, contactsRows, followUpsRows] = await Promise.all([
    q(`select crm_stage, source, full_name, owner from leads limit 5000`),
    q(`select count(*)::int as n from contacts`),
    q(`select count(*)::int as n from follow_ups where status = 'open'`),
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

  const stageOrder = ["new", "contacted", "qualified", "site_visit", "proposal", "won", "unqualified", "lost", "no_answer", "duplicate"];
  const stageLabels: Record<string, string> = {
    new: "ใหม่", contacted: "ติดต่อแล้ว", qualified: "สนใจ", site_visit: "นัดดู",
    proposal: "เสนอราคา", won: "ปิดการขาย", unqualified: "ไม่ผ่าน", lost: "หลุด",
    no_answer: "ไม่ตอบ", duplicate: "ซ้ำ",
  };
  const qualified = byStage.get("qualified") ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">แดชบอร์ด</h1>
        <p className="text-sm text-[#64748B]">ภาพรวม CRM</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "ลีดทั้งหมด", value: totalLeads },
          { label: "คอนแทกต์", value: totalContacts },
          { label: "ติดตามค้าง", value: openFollowUps },
          { label: "สนใจ", value: qualified },
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

import { q } from "@/lib/supabase";
import { thDate } from "@/lib/labels";
import StageBadge from "@/components/StageBadge";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [followUps, newLeads, totalLeadsRows] = await Promise.all([
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
  ]);

  const totalLeads = totalLeadsRows[0]?.n ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">วันนี้</h1>
          <p className="text-sm text-[#64748B]">{thDate(new Date().toISOString())}</p>
        </div>
      </header>

      <div className="card flex items-center gap-6">
        <div>
          <div className="kpi-value">{followUps.length}</div>
          <div className="kpi-label">ติดตามที่ครบกำหนดวันนี้</div>
        </div>
        <div>
          <div className="kpi-value">{newLeads.length}</div>
          <div className="kpi-label">ลีดใหม่วันนี้</div>
        </div>
        <div>
          <div className="kpi-value">{totalLeads}</div>
          <div className="kpi-label">ลีดทั้งหมด</div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-3">ติดตามครบกำหนด</h2>
        <div className="card overflow-x-auto p-0">
          <table className="tbl">
            <thead>
              <tr><th>คอนแทกต์</th><th>เบอร์</th><th>สเตจ</th><th>ครบกำหนด</th><th>เจ้าของ</th><th>หมายเหตุ</th></tr>
            </thead>
            <tbody>
              {followUps.length === 0 && (
                <tr><td colSpan={6} className="text-center text-[#94A3B8] py-8">ไม่มีติดตามค้างวันนี้</td></tr>
              )}
              {followUps.map((fu: any) => (
                <tr key={fu.id}>
                  <td className="font-medium text-[#0F172A]">{fu.contact_name ?? fu.lead_name ?? "—"}</td>
                  <td className="font-mono text-[13px]">{fu.primary_phone ?? "—"}</td>
                  <td><StageBadge stage={fu.crm_stage ?? "new"} /></td>
                  <td>{thDate(fu.due_date)}</td>
                  <td>{fu.owner ?? "—"}</td>
                  <td className="max-w-[240px] truncate">{fu.latest_note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-3">ลีดใหม่วันนี้</h2>
        <div className="card overflow-x-auto p-0">
          <table className="tbl">
            <thead>
              <tr><th>ชื่อ</th><th>เบอร์</th><th>สเตจ</th><th>เวลา</th></tr>
            </thead>
            <tbody>
              {newLeads.length === 0 && (
                <tr><td colSpan={4} className="text-center text-[#94A3B8] py-8">ยังไม่มีลีดใหม่วันนี้</td></tr>
              )}
              {newLeads.map((l: any) => (
                <tr key={l.id}>
                  <td className="font-medium text-[#0F172A]">{l.full_name}</td>
                  <td className="font-mono text-[13px]">{l.phone ?? "—"}</td>
                  <td><StageBadge stage={l.crm_stage} /></td>
                  <td>{thDate(l.lead_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

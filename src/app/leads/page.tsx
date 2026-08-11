import { q } from "@/lib/supabase";
import StageBadge from "@/components/StageBadge";
import { SOURCE_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ stage?: string; q?: string }> }) {
  const params = await searchParams;

  const conds: string[] = [];
  const vals: unknown[] = [];
  if (params.stage) { vals.push(params.stage); conds.push(`crm_stage = $${vals.length}`); }
  if (params.q) { vals.push(`%${params.q}%`); conds.push(`(full_name ilike $${vals.length} or phone ilike $${vals.length})`); }

  const leads = await q(
    `select * from leads ${conds.length ? `where ${conds.join(" and ")}` : ""}
     order by lead_date desc limit 200`,
    vals
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">ลีด</h1>
          <p className="text-sm text-[#64748B]">รายการลีดทั้งหมด</p>
        </div>
        <a href="/leads/new" className="btn-primary">+ ลีดใหม่</a>
      </header>

      <form className="flex gap-3 items-center" method="get">
        <input name="q" className="inp max-w-xs" placeholder="ค้นชื่อ / เบอร์" defaultValue={params.q ?? ""} />
        <select name="stage" className="inp max-w-[180px]" defaultValue={params.stage ?? ""}>
          <option value="">ทุกสเตจ</option>
          <option value="new">ใหม่</option>
          <option value="contacted">ติดต่อแล้ว</option>
          <option value="qualified">สนใจ</option>
          <option value="site_visit">นัดดู</option>
          <option value="proposal">เสนอราคา</option>
          <option value="won">ปิดการขาย</option>
          <option value="no_answer">ไม่ตอบ</option>
        </select>
        <button className="btn-secondary">กรอง</button>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="tbl">
          <thead>
            <tr><th>ชื่อ</th><th>เบอร์</th><th>สเตจ</th><th>แหล่ง</th><th>สนใจ</th><th>เจ้าของ</th><th>วันที่</th></tr>
          </thead>
          <tbody>
            {leads.map((l: any) => (
              <tr key={l.id}>
                <td className="font-medium text-[#0F172A]">
                  <a href={`/leads/${l.id}`} className="hover:text-[#0E7490]">{l.full_name}</a>
                </td>
                <td className="font-mono text-[13px]">{l.phone ?? "—"}</td>
                <td><StageBadge stage={l.crm_stage} /></td>
                <td>{SOURCE_LABELS[l.source] ?? l.source}</td>
                <td>{l.interest ?? "—"}</td>
                <td>{l.owner ?? "—"}</td>
                <td className="whitespace-nowrap">{new Date(l.lead_date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td colSpan={7} className="text-center text-[#94A3B8] py-8">ไม่พบลีด</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

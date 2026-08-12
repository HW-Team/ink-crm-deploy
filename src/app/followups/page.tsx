import { q } from "@/lib/supabase";
import { thDate } from "@/lib/labels";
import { t, getServerLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage() {
  const lang = await getServerLang();
  const followUps = await q(
    `select fu.*, c.full_name as contact_name, c.primary_phone,
            l.full_name as lead_name, l.crm_stage
     from follow_ups fu
     left join contacts c on c.id = fu.contact_id
     left join leads l on l.id = fu.lead_id
     order by fu.due_date limit 300`
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">ติดตาม</h1>
        <p className="text-sm text-[#64748B]">{t(lang, "fu.listTitle")}</p>
      </header>

      <div className="card overflow-x-auto p-0">
        <table className="tbl">
          <thead>
            <tr><th>คอนแทกต์</th><th>เบอร์</th><th>ครบกำหนด</th><th>ประเภท</th><th>เจ้าของ</th><th>สถานะ</th><th>หมายเหตุ</th></tr>
          </thead>
          <tbody>
            {followUps.map((fu: any) => (
              <tr key={fu.id}>
                <td className="font-medium text-[#0F172A]">{fu.contact_name ?? fu.lead_name ?? "—"}</td>
                <td className="font-mono text-[13px]">{fu.primary_phone ?? "—"}</td>
                <td className="whitespace-nowrap">{thDate(fu.due_date)}{fu.due_time ? ` ${fu.due_time}` : ""}</td>
                <td>{fu.task_type ?? "—"}</td>
                <td>{fu.owner ?? "—"}</td>
                <td>
                  <span className={`badge ${fu.status === "done" ? "st-won" : fu.status === "cancelled" ? "st-lost" : "st-contacted"}`}>
                    {fu.status === "done" ? "เสร็จ" : fu.status === "cancelled" ? "ยกเลิก" : "ค้าง"}
                  </span>
                </td>
                <td className="max-w-[240px] truncate">{fu.latest_note ?? "—"}</td>
              </tr>
            ))}
            {followUps.length === 0 && (
              <tr><td colSpan={7} className="text-center text-[#94A3B8] py-8">ไม่มีรายการติดตาม</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { q } from "@/lib/supabase";
import { thDate } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const followUps = await q(
    `select fu.*, c.full_name as contact_name, c.primary_phone
     from follow_ups fu
     left join contacts c on c.id = fu.contact_id
     where fu.status = 'open'
     order by fu.due_date limit 200`
  );

  // group by month
  const byMonth = new Map<string, any[]>();
  for (const fu of followUps) {
    const key = fu.due_date ? String(fu.due_date).slice(0, 7) : "ไม่มีกำหนด";
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(fu);
  }
  const months = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">ปฏิทิน</h1>
        <p className="text-sm text-[#64748B]">นัดหมายและติดตามตามเดือน</p>
      </header>

      {months.length === 0 && (
        <div className="card"><p className="text-sm text-[#94A3B8]">ไม่มีนัดหมายค้าง</p></div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {months.map(([month, items]) => {
          const [y, m] = month.split("-");
          const monthName = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("th-TH", { month: "long", year: "numeric" });
          return (
            <section key={month} className="card">
              <h2 className="text-base font-semibold text-[#0F172A] mb-3">{monthName} <span className="text-[#94A3B8] font-normal">({items.length})</span></h2>
              <div className="space-y-2">
                {items.map((fu: any) => (
                  <div key={fu.id} className="flex items-center justify-between text-sm border border-[#E2E8F0] rounded-md px-3 py-2">
                    <div>
                      <p className="font-medium text-[#0F172A]">{fu.contact_name ?? "—"}</p>
                      <p className="text-xs text-[#64748B]">{thDate(fu.due_date)}{fu.due_time ? ` ${fu.due_time}` : ""} · {fu.task_type ?? "ติดตาม"}</p>
                    </div>
                    <span className="font-mono text-xs text-[#94A3B8]">{fu.primary_phone ?? ""}</span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

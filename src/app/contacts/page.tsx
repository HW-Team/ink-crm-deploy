import { q } from "@/lib/supabase";
import { thDate } from "@/lib/labels";
import { t, getServerLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const lang = await getServerLang();
  const params = await searchParams;

  const conds: string[] = [`deleted_at is null`];
  const vals: unknown[] = [];
  if (params.q) {
    vals.push(`%${params.q}%`);
    conds.push(`(full_name ilike $${vals.length} or normalized_phone ilike $${vals.length})`);
  }

  const contacts = await q(
    `select c.*, coalesce((
        select json_agg(l.crm_stage order by l.lead_date)
        from leads l where l.contact_id = c.id
      ), '[]') as leads
     from contacts c
     where ${conds.join(" and ")}
     order by c.updated_at desc limit 300`,
    vals
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{t(lang, "contacts.title")}</h1>
          <p className="text-sm text-[#64748B]">{t(lang, "contacts.linked")}dedupe {t(lang, "contacts.byPhone")}</p>
        </div>
      </header>

      <form className="flex gap-3 items-center" method="get">
        <input name="q" className="inp max-w-xs" placeholder="ค้นชื่อ / เบอร์" defaultValue={params.q ?? ""} />
        <button className="btn-secondary">ค้นหา</button>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="tbl">
          <thead>
            <tr><th>ชื่อ</th><th>เบอร์</th><th>{t(lang, "contacts.lastStage")}</th><th>{t(lang, "contacts.firstSource")}</th><th>จังหวัด</th><th>อัปเดตล่าสุด</th></tr>
          </thead>
          <tbody>
            {contacts.map((c: any) => (
              <tr key={c.id}>
                <td className="font-medium text-[#0F172A]">{c.full_name}</td>
                <td className="font-mono text-[13px]">{c.primary_phone ?? "—"}</td>
                <td>{(c.leads ?? []).length > 0 ? (c.leads[c.leads.length - 1] ?? "—") : "—"}</td>
                <td>{c.first_source ?? "—"}</td>
                <td>{c.province ?? "—"}</td>
                <td className="whitespace-nowrap">{thDate(c.updated_at)}</td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr><td colSpan={6} className="text-center text-[#94A3B8] py-8">ไม่พบ{t(lang, "contacts.title")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

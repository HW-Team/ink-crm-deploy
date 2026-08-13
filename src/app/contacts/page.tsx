import { q } from "@/lib/supabase";
import { thDate } from "@/lib/labels";
import { t, getServerLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const lang = await getServerLang();
  const params = await searchParams;
  const PAGE_SIZE = 50;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const conds: string[] = [`deleted_at is null`];
  const vals: unknown[] = [];
  if (params.q) {
    vals.push(`%${params.q}%`);
    conds.push(`(full_name ilike $${vals.length} or normalized_phone ilike $${vals.length})`);
  }
  const where = `where ${conds.join(" and ")}`;

  const [countRows, contacts] = await Promise.all([
    q(`select count(*)::int as n from contacts c ${where}`, vals),
    q(
      `select c.*, coalesce((
          select json_agg(l.crm_stage order by l.lead_date)
          from leads l where l.contact_id = c.id
        ), '[]') as leads
       from contacts c
       ${where}
       order by c.updated_at desc limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`,
      vals
    ),
  ]);
  const total = countRows[0]?.n ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/contacts?${qs}` : "/contacts";
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{t(lang, "contacts.title")}</h1>
          <p className="text-sm text-[#64748B]">{t(lang, "contacts.linked")}dedupe {t(lang, "contacts.byPhone")}</p>
        </div>
      </header>

      <form className="flex gap-3 items-center" method="get">
        <input name="q" className="inp max-w-xs" placeholder={t(lang, "leads.search")} defaultValue={params.q ?? ""} />
        <button className="btn-secondary">{t(lang, "common.search")}</button>
        {params.q && (
          <a href="/contacts" className="text-xs font-medium text-[#0E7490] hover:underline">{t(lang, "leads.clear")}</a>
        )}
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="tbl">
          <thead>
            <tr><th>{t(lang, "common.name")}</th><th>{t(lang, "common.phone")}</th><th>{t(lang, "contacts.lastStage")}</th><th>{t(lang, "contacts.firstSource")}</th><th>{t(lang, "common.province")}</th><th>{t(lang, "contacts.lastUpdate")}</th></tr>
          </thead>
          <tbody>
            {contacts.map((c: any) => (
              <tr key={c.id}>
                <td className="font-medium text-[#0F172A]">{c.full_name}</td>
                <td className="font-mono text-[13px]">{c.primary_phone ?? "—"}</td>
                <td>{(c.leads ?? []).length > 0 ? (c.leads[c.leads.length - 1] ?? "—") : "—"}</td>
                <td>{c.first_source ?? "—"}</td>
                <td>{c.province ?? "—"}</td>
                <td className="whitespace-nowrap">{thDate(c.updated_at, lang)}</td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr><td colSpan={6} className="text-center text-[#94A3B8] py-8">{t(lang, "contacts.notFound")}</td></tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#E2E8F0]">
            <span className="text-xs text-[#64748B]">
              {total.toLocaleString()} {t(lang, "contacts.title")} · {t(lang, "leads.page", { n: safePage, m: totalPages })}
            </span>
            <div className="flex items-center gap-1.5">
              {safePage > 1 ? (
                <a href={pageHref(safePage - 1)} className="btn-secondary !py-1.5 !px-3 !text-xs">‹ {t(lang, "leads.prev")}</a>
              ) : (
                <span className="btn-secondary !py-1.5 !px-3 !text-xs opacity-40 pointer-events-none">‹ {t(lang, "leads.prev")}</span>
              )}
              {safePage < totalPages ? (
                <a href={pageHref(safePage + 1)} className="btn-secondary !py-1.5 !px-3 !text-xs">{t(lang, "leads.next")} ›</a>
              ) : (
                <span className="btn-secondary !py-1.5 !px-3 !text-xs opacity-40 pointer-events-none">{t(lang, "leads.next")} ›</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

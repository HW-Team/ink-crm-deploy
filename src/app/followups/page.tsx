import { q } from "@/lib/supabase";
import { thDate } from "@/lib/labels";
import { t, getServerLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const lang = await getServerLang();
  const params = await searchParams;
  const PAGE_SIZE = 50;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [countRows, followUps] = await Promise.all([
    q(`select count(*)::int as n from follow_ups`),
    q(
      `select fu.*, c.full_name as contact_name, c.primary_phone,
              l.full_name as lead_name, l.crm_stage
       from follow_ups fu
       left join contacts c on c.id = fu.contact_id
       left join leads l on l.id = fu.lead_id
       order by fu.due_date limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`
    ),
  ]);
  const total = countRows[0]?.n ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageHref = (p: number) => (p > 1 ? `/followups?page=${p}` : "/followups");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">{t(lang, "nav.followups")}</h1>
        <p className="text-sm text-[#64748B]">{t(lang, "fu.listTitle")}</p>
      </header>

      <div className="card overflow-x-auto p-0">
        <table className="tbl">
          <thead>
            <tr><th>{t(lang, "common.contact")}</th><th>{t(lang, "common.phone")}</th><th>{t(lang, "common.due")}</th><th>{t(lang, "fu.type")}</th><th>{t(lang, "common.owner")}</th><th>{t(lang, "common.status")}</th><th>{t(lang, "common.note")}</th></tr>
          </thead>
          <tbody>
            {followUps.map((fu: any) => (
              <tr key={fu.id}>
                <td className="font-medium text-[#0F172A]">{fu.contact_name ?? fu.lead_name ?? "—"}</td>
                <td className="font-mono text-[13px]">{fu.primary_phone ?? "—"}</td>
                <td className="whitespace-nowrap">{thDate(fu.due_date, lang)}{fu.due_time ? ` ${fu.due_time}` : ""}</td>
                <td>{fu.task_type ?? "—"}</td>
                <td>{fu.owner ?? "—"}</td>
                <td>
                  <span className={`badge ${fu.status === "done" ? "st-won" : fu.status === "cancelled" ? "st-lost" : "st-contacted"}`}>
                    {fu.status === "done" ? t(lang, "fu.done") : fu.status === "cancelled" ? t(lang, "common.cancelled") : t(lang, "fu.open")}
                  </span>
                </td>
                <td className="max-w-[240px] truncate">{fu.latest_note ?? "—"}</td>
              </tr>
            ))}
            {followUps.length === 0 && (
              <tr><td colSpan={7} className="text-center text-[#94A3B8] py-8">{t(lang, "fu.empty")}</td></tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#E2E8F0]">
            <span className="text-xs text-[#64748B]">
              {total.toLocaleString()} · {t(lang, "leads.page", { n: safePage, m: totalPages })}
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

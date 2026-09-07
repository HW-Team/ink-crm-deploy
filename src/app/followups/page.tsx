import { q } from "@/lib/supabase";
import { thDate, relDue, dayDiff, taskTypeLabel } from "@/lib/labels";
import { t, getServerLang } from "@/lib/i18n-server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const lang = await getServerLang();
  const params = await searchParams;
  const PAGE_SIZE = 50;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  // Default view = open work. `?status=all` reveals done/cancelled history.
  const statusFilter = params.status === "all" ? "all" : "open";
  const where = statusFilter === "open" ? "where fu.status = 'open'" : "";
  const countQ = statusFilter === "open" ? `select count(*)::int as n from follow_ups fu ${where}` : `select count(*)::int as n from follow_ups fu`;

  const [countRows, followUps] = await Promise.all([
    q(countQ),
    q(
      `select fu.*, c.full_name as contact_name, c.primary_phone,
              l.full_name as lead_name, l.crm_stage, l.id as l_lead_id
       from follow_ups fu
       left join contacts c on c.id = fu.contact_id
       left join leads l on l.id = fu.lead_id
       ${where}
       order by
         case when fu.status = 'open' then 0 else 1 end,
         fu.due_date asc nulls last,
         fu.created_at desc
       limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`
    ),
  ]);
  const total = countRows[0]?.n ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (statusFilter === "all") sp.set("status", "all");
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/followups?${qs}` : "/followups";
  };

  const tabCls = (activeTab: boolean) =>
    `px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px ${
      activeTab ? "border-[#0E7490] text-[#0E7490]" : "border-transparent text-[#64748B] hover:text-[#334155]"
    }`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">{t(lang, "nav.followups")}</h1>
        <p className="text-sm text-[#64748B]">{t(lang, "fu.listTitle")}</p>
      </header>

      <div className="flex items-center gap-2 border-b border-[#E2E8F0]">
        <Link href="/followups" className={tabCls(statusFilter === "open")}>
          {t(lang, "fu.tabOpen")} <span className="ml-1 text-xs font-normal bg-[#E0F2FE] text-[#075985] rounded-full px-2 py-0.5">{total.toLocaleString()}</span>
        </Link>
        <Link href="/followups?status=all" className={tabCls(statusFilter === "all")}>
          {t(lang, "fu.tabAll")}
        </Link>
      </div>

      {/* mobile cards */}
      <ul className="md:hidden space-y-2.5">
        {followUps.map((fu) => {
          const overdue = fu.status === "open" && (dayDiff(fu.due_date) ?? 0) > 0;
          return (
            <li key={fu.id} className="card !p-3.5">
              <div className="flex items-center justify-between gap-2">
                <Link href={fu.l_lead_id ? `/leads/${fu.l_lead_id}` : "/followups"} className="font-semibold text-[15px] text-[#0F172A] truncate">
                  {fu.contact_name ?? fu.lead_name ?? "—"}
                </Link>
                <span className={`badge ${fu.status === "done" ? "st-won" : fu.status === "cancelled" ? "st-lost" : overdue ? "st-lost" : "st-contacted"}`}>
                  {fu.status === "done" ? t(lang, "fu.done") : fu.status === "cancelled" ? t(lang, "common.cancelled") : t(lang, "fu.open")}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-[#64748B] flex-wrap">
                <span>{taskTypeLabel(lang, fu.task_type)}</span>
                {fu.due_date && (
                  <span className={overdue ? "text-[#B91C1C] font-semibold" : ""}>
                    · {fu.due_date.length <= 10 ? relDue(lang, fu.due_date) : thDate(fu.due_date, lang)}
                    {fu.due_time ? ` ${fu.due_time}` : ""}
                  </span>
                )}
                {fu.owner && <span>· {fu.owner}</span>}
              </div>
              {fu.latest_note && (
                <p className="text-[13px] text-[#5B6B7C] mt-1.5 line-clamp-2">{fu.latest_note}</p>
              )}
              {fu.primary_phone && (
                <a href={`tel:${fu.primary_phone.replace(/[^\d+]/g, "")}`} className="inline-block mt-2 text-[13px] font-mono text-[#0E7490] bg-[#E0F2FE] rounded-md px-2.5 py-1">
                  ☎ {fu.primary_phone}
                </a>
              )}
            </li>
          );
        })}
        {followUps.length === 0 && (
          <li className="card text-center py-10">
            <div className="text-sm font-medium text-[#334155]">{t(lang, "fu.empty")}</div>
          </li>
        )}
      </ul>

      {/* desktop table */}
      <div className="card overflow-x-auto p-0 hidden md:block">
        <table className="tbl">
          <thead>
            <tr><th>{t(lang, "common.contact")}</th><th>{t(lang, "common.phone")}</th><th>{t(lang, "common.due")}</th><th>{t(lang, "fu.type")}</th><th>{t(lang, "common.owner")}</th><th>{t(lang, "common.status")}</th><th>{t(lang, "common.note")}</th></tr>
          </thead>
          <tbody>
            {followUps.map((fu) => {
              const overdue = fu.status === "open" && (dayDiff(fu.due_date) ?? 0) > 0;
              return (
              <tr key={fu.id}>
                <td className="font-medium text-[#0F172A]">
                  {fu.l_lead_id ? (
                    <Link href={`/leads/${fu.l_lead_id}`} className="hover:text-[#0E7490]">{fu.contact_name ?? fu.lead_name ?? "—"}</Link>
                  ) : (fu.contact_name ?? fu.lead_name ?? "—")}
                </td>
                <td className="font-mono text-[13px]">
                  {fu.primary_phone ? (
                    <a href={`tel:${fu.primary_phone.replace(/[^\d+]/g, "")}`} className="text-[#0E7490] hover:underline">{fu.primary_phone}</a>
                  ) : "—"}
                </td>
                <td className="whitespace-nowrap">
                  <span className={overdue ? "text-[#B91C1C] font-semibold" : ""}>
                    {fu.due_date && fu.due_date.length <= 10 ? relDue(lang, fu.due_date) : thDate(fu.due_date, lang)}
                  </span>
                  {fu.due_time ? ` ${fu.due_time}` : ""}
                </td>
                <td>{taskTypeLabel(lang, fu.task_type)}</td>
                <td>{fu.owner ?? "—"}</td>
                <td>
                  <span className={`badge ${fu.status === "done" ? "st-won" : fu.status === "cancelled" ? "st-lost" : "st-contacted"}`}>
                    {fu.status === "done" ? t(lang, "fu.done") : fu.status === "cancelled" ? t(lang, "common.cancelled") : t(lang, "fu.open")}
                  </span>
                </td>
                <td className="max-w-[240px] truncate">{fu.latest_note ?? "—"}</td>
              </tr>
              );
            })}
            {followUps.length === 0 && (
              <tr><td colSpan={7} className="text-center text-[#94A3B8] py-8">{t(lang, "fu.empty")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="card flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-xs text-[#64748B]">
            {total.toLocaleString()} {t(lang, "fu.count")} · {t(lang, "leads.page", { n: safePage, m: totalPages })}
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
  );
}

import { q } from "@/lib/supabase";
import StageBadge from "@/components/StageBadge";
import { sourceLabel, stageLabel } from "@/lib/labels";
import { t, getServerLang } from "@/lib/i18n-server";
import ClaimButton from "@/components/ClaimButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ stage?: string; q?: string; tab?: string; page?: string }> }) {
  const lang = await getServerLang();
  const params = await searchParams;
  const tab = params.tab === "inbox" ? "inbox" : "all";
  const PAGE_SIZE = 50;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const conds: string[] = [];
  const vals: unknown[] = [];
  if (params.stage) { vals.push(params.stage); conds.push(`l.crm_stage = $${vals.length}`); }
  if (params.q) { vals.push(`%${params.q}%`); conds.push(`(l.full_name ilike $${vals.length} or l.phone ilike $${vals.length})`); }
  if (tab === "inbox") conds.push("l.owner_id is null");
  const where = conds.length ? `where ${conds.join(" and ")}` : "";

  const [inboxRows, countRows] = await Promise.all([
    q(`select count(*)::int as n from leads where owner_id is null`),
    q(`select count(*)::int as n from leads l ${where}`, vals),
  ]);
  const inboxCount = inboxRows[0]?.n ?? 0;
  const total = countRows[0]?.n ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const leads = await q(
    `select l.*, u.full_name as owner_name
     from leads l left join users u on u.id = l.owner_id
     ${where}
     order by l.lead_date desc limit ${PAGE_SIZE} offset ${(safePage - 1) * PAGE_SIZE}`,
    vals
  );

  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (tab === "inbox") sp.set("tab", "inbox");
    if (params.stage) sp.set("stage", params.stage);
    if (params.q) sp.set("q", params.q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/leads?${qs}` : "/leads";
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{t(lang, "leads.title")}</h1>
          <p className="text-sm text-[#64748B]">{t(lang, "leads.subtitle")}</p>
        </div>
        <Link href="/leads/new" className="btn-primary">+ {t(lang, "leads.new.title")}</Link>
      </header>

      <div className="flex items-center gap-2 border-b border-[#E2E8F0]">
        <Link
          href="/leads?tab=inbox"
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px ${
            tab === "inbox"
              ? "border-[#0E7490] text-[#0E7490]"
              : "border-transparent text-[#64748B] hover:text-[#334155]"
          }`}
        >
          {t(lang, "leads.inbox")} <span className="ml-1 text-xs font-normal bg-[#E0F2FE] text-[#075985] rounded-full px-2 py-0.5">{inboxCount}</span>
        </Link>
        <Link
          href="/leads"
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px ${
            tab === "all"
              ? "border-[#0E7490] text-[#0E7490]"
              : "border-transparent text-[#64748B] hover:text-[#334155]"
          }`}
        >
          {t(lang, "leads.all")}
        </Link>
      </div>

      <form className="flex gap-3 items-center" method="get">
        <input type="hidden" name="tab" value={tab} />
        <input name="q" className="inp max-w-xs" placeholder={t(lang, "leads.search")} defaultValue={params.q ?? ""} />
        {tab === "all" && (
          <select name="stage" className="inp max-w-[180px]" defaultValue={params.stage ?? ""}>
            <option value="">{t(lang, "leads.all")}</option>
            <option value="new">{t(lang, "stage.new")}</option>
            <option value="contacted">{t(lang, "stage.contacted")}</option>
            <option value="qualified">{t(lang, "stage.qualified")}</option>
            <option value="site_visit">{t(lang, "stage.site_visit")}</option>
            <option value="proposal">{t(lang, "stage.proposal")}</option>
            <option value="won">{t(lang, "stage.won")}</option>
            <option value="no_answer">{t(lang, "stage.no_answer")}</option>
          </select>
        )}
        <button className="btn-secondary">{t(lang, "leads.filter")}</button>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="tbl">
          <thead>
            <tr><th>{t(lang, "common.name")}</th><th>{t(lang, "common.phone")}</th><th>{t(lang, "common.stage")}</th><th>{t(lang, "common.source")}</th><th>{t(lang, "common.interest")}</th><th>{tab === "inbox" ? t(lang, "leads.detail.claim") : t(lang, "common.owner")}</th><th>{t(lang, "common.due")}</th></tr>
          </thead>
          <tbody>
            {leads.map((l: any) => (
              <tr key={l.id}>
                <td className="font-medium text-[#0F172A]">
                  <a href={`/leads/${l.id}`} className="hover:text-[#0E7490]">{l.full_name}</a>
                </td>
                <td className="font-mono text-[13px]">{l.phone ?? "—"}</td>
                <td><StageBadge stage={l.crm_stage} lang={lang} /></td>
                <td>{sourceLabel(lang, l.source)}</td>
                <td>{l.interest ?? "—"}</td>
                <td>
                  {l.owner_name
                    ? <span className="text-[13px] text-[#334155]">{l.owner_name}</span>
                    : <ClaimButton leadId={l.id} />}
                </td>
                <td className="whitespace-nowrap">{new Date(l.lead_date).toLocaleDateString(lang === "en" ? "en-US" : "th-TH", { day: "numeric", month: "short" })}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <div className="text-sm font-medium text-[#334155]">
                    {tab === "inbox" ? t(lang, "leads.inboxEmpty") : t(lang, "leads.notFound")}
                  </div>
                  <div className="text-xs text-[#94A3B8] mt-1">
                    {tab === "inbox" ? t(lang, "leads.inboxHint") : t(lang, "leads.trySearch")}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#E2E8F0]">
            <span className="text-xs text-[#64748B]">
              {total.toLocaleString()} {t(lang, "leads.total")} · {t(lang, "leads.page", { n: safePage, m: totalPages })}
            </span>
            <div className="flex items-center gap-1.5">
              {safePage > 1 ? (
                <a href={pageHref(safePage - 1)} className="btn-secondary !py-1.5 !px-3 !text-xs">‹ {t(lang, "leads.prev")}</a>
              ) : (
                <span className="btn-secondary !py-1.5 !px-3 !text-xs opacity-40 pointer-events-none">‹ {t(lang, "leads.prev")}</span>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                .reduce<React.ReactNode[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push(<span key={`e${p}`} className="text-xs text-[#94A3B8] px-0.5">…</span>);
                  acc.push(
                    p === safePage ? (
                      <span key={p} className="w-8 h-8 inline-flex items-center justify-center rounded-md bg-[#0E7490] text-white text-xs font-semibold">{p}</span>
                    ) : (
                      <a key={p} href={pageHref(p)} className="w-8 h-8 inline-flex items-center justify-center rounded-md text-xs font-medium text-[#334155] hover:bg-[#EEF2F7]">{p}</a>
                    )
                  );
                  return acc;
                }, [])}
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

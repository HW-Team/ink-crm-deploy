import { q, qOne } from "@/lib/supabase";
import StageBadge from "@/components/StageBadge";
import { thDate, sourceLabel } from "@/lib/labels";
import LogConversation from "@/components/LogConversation";
import AddFollowUp from "@/components/AddFollowUp";
import TransferOwner from "@/components/TransferOwner";
import VisitButton from "@/components/VisitButton";
import { t, getServerLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const lang = await getServerLang();
  const { id } = await params;

  const lead = await qOne(
    `select l.*, u.full_name as owner_name
     from leads l left join users u on u.id = l.owner_id
     where l.id = $1`,
    [id]
  );
  if (!lead) return <p className="text-[#B91C1C]">ไม่พบลีด</p>;

  const [logs, followUps, users] = await Promise.all([
    q(`select * from conversation_logs where contact_id = $1 order by logged_at desc limit 50`, [lead.contact_id]),
    q(`select * from follow_ups where contact_id = $1 order by due_date`, [lead.contact_id]),
    q<{ id: string; full_name: string; role: string }>(
      `select id, full_name, role from users where active = true order by role desc, full_name`
    ),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{lead.full_name}</h1>
          <p className="text-sm text-[#64748B]">
            <span className="font-mono">{lead.phone ?? "—"}</span>
            {" · "}{sourceLabel(lang, lead.source)}
            {" · "}{thDate(lead.lead_date)}
          </p>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <StageBadge stage={lead.crm_stage} />
          <div className="flex items-center gap-3">
            <VisitButton leadId={lead.id} />
            <AddFollowUp contactId={lead.contact_id} leadId={lead.id} />
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card">
          <h2 className="text-base font-semibold text-[#0F172A] mb-3">{t(lang, "leads.detail.title")}</h2>
          <dl className="space-y-2 text-sm">
            {[
              ["จังหวัด", lead.province], ["สนใจ", lead.interest],
              ["มูลค่า", lead.deal_value ? `฿${Number(lead.deal_value).toLocaleString()}` : null],
              [t(lang, "leads.detail.probability"), lead.probability_pct ? `${lead.probability_pct}%` : null],
              [t(lang, "common.nextAction"), lead.next_action],
            ].map(([k, v]) => (
              <div key={k as string} className="flex gap-3">
                <dt className="w-28 text-[#64748B] shrink-0">{k}</dt>
                <dd className="text-[#334155]">{v ?? "—"}</dd>
              </div>
            ))}
            <div className="flex gap-3 items-center pt-2">
              <dt className="w-28 text-[#64748B] shrink-0">เจ้าของ</dt>
              <dd className="text-[#334155]">{lead.owner_name ?? t(lang, "common.noOwner")}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <TransferOwner leadId={lead.id} currentOwnerId={lead.owner_id} users={users} />
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="text-base font-semibold text-[#0F172A]">{t(lang, "log.title")}</h2>
          <LogConversation contactId={lead.contact_id} leadId={lead.id} />
          <div className="pt-2 border-t border-[#E2E8F0]">
            <h2 className="text-base font-semibold text-[#0F172A] mb-2">ติดตาม</h2>
            {followUps.length === 0 && <p className="text-sm text-[#94A3B8] mb-2">{t(lang, "leads.detail.noFollowups")}</p>}
            <div className="space-y-2 mb-3">
              {followUps.map((fu: any) => (
                <div key={fu.id} className="flex items-center justify-between text-sm border border-[#E2E8F0] rounded-md px-3 py-2">
                  <div>
                    <span className={fu.status === "done" ? "line-through text-[#94A3B8]" : "text-[#334155]"}>
                      {thDate(fu.due_date)}{fu.due_time ? ` ${fu.due_time}` : ""}
                    </span>
                    {fu.latest_note && <p className="text-xs text-[#64748B]">{fu.latest_note}</p>}
                  </div>
                  <span className={`badge ${fu.status === "done" ? "st-won" : "st-contacted"}`}>
                    {fu.status === "done" ? "เสร็จ" : "ค้าง"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="card">
        <h2 className="text-base font-semibold text-[#0F172A] mb-3">{t(lang, "leads.detail.contactLog")}</h2>
        {logs.length === 0 && <p className="text-sm text-[#94A3B8]">{t(lang, "common.noHistory")}</p>}
        <div className="space-y-3">
          {logs.map((log: any) => (
            <div key={log.id} className="border border-[#E2E8F0] rounded-md px-4 py-3">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-semibold uppercase tracking-wide">
                  {log.channel} · {log.direction}
                  {log.team_member ? ` · ${log.team_member}` : ""}
                </span>
                <span>{new Date(log.logged_at).toLocaleString("th-TH")}</span>
              </div>
              {log.summary && <p className="text-sm text-[#334155] mt-1.5">{log.summary}</p>}
              {log.next_action && <p className="text-xs text-[#0E7490] mt-1">ถัดไป: {log.next_action}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

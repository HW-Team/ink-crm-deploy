"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import StageBadge from "./StageBadge";
import ClaimButton from "./ClaimButton";
import FollowUpActions from "./FollowUpActions";
import { stageLabel } from "@/lib/labels";
import { STAGE_CLASS } from "@/lib/labels";
import { t, getClientLang } from "@/lib/i18n";

const LANE_KEYS = ["new", "contacted", "qualified", "site_visit", "proposal", "won"];
const CARD_STAGES = [...LANE_KEYS, "no_answer", "lost", "duplicate", "unqualified"];

type Lead = {
  id: string; full_name: string; phone: string | null; interest: string | null; crm_stage: string; priority?: string | null;
  visit_id?: string | null; visit_date?: string | null; visit_time?: string | null; visit_confirmed?: boolean; visit_status?: string | null;
};

export default function Board() {
  const router = useRouter();
  const lang = getClientLang();
  const [lanes, setLanes] = useState<Record<string, any[]>>({});
  const [inbox, setInbox] = useState<Lead[]>([]);
  const [inboxTotal, setInboxTotal] = useState(0);
  const [users, setUsers] = useState<{ id: string; full_name: string; role: string; active: boolean }[]>([]);
  const [meId, setMeId] = useState<string>("");
  const [owner, setOwner] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Lead | null>(null);

  const LANES = LANE_KEYS.map((key) => ({ key, label: stageLabel(lang, key) }));

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/board?owner=${owner}`);
    const d = await r.json();
    const grouped: Record<string, any[]> = {};
    for (const lane of LANE_KEYS) grouped[lane] = [];
    for (const lead of d.leads ?? []) {
      if (grouped[lead.crm_stage]) grouped[lead.crm_stage].push(lead);
      else grouped.other = [...(grouped.other ?? []), lead];
    }
    setLanes(grouped);
    setInbox(d.inbox ?? []);
    setInboxTotal(d.unowned_count ?? 0);
    setLoading(false);
  }, [owner]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => { if (d.user) setMeId(d.user.id); });
    fetch("/api/users").then((r) => r.json().then((d) => setUsers(d.users ?? [])).catch(() => {}));
  }, []);

  const move = async (stage: string, leadId: string) => {
    setDragging(null);
    setSheet(null);
    setLanes((prev) => {
      const next: Record<string, any[]> = {};
      for (const lane of LANE_KEYS) next[lane] = [...(prev[lane] ?? [])];
      if (prev.other) next.other = [...prev.other];
      let moved: any = null;
      for (const k of Object.keys(prev)) {
        const idx = prev[k].findIndex((l) => l.id === leadId);
        if (idx >= 0) { moved = prev[k][idx]; }
      }
      if (moved) {
        for (const k of Object.keys(next)) next[k] = next[k].filter((l) => l.id !== leadId);
        next[stage] = [moved, ...(next[stage] ?? [])];
      }
      return next;
    });
    await fetch(`/api/leads/${leadId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (stage === "new" || owner !== "all") load();
  };

  const onCardTap = (lead: Lead) => {
    if (window.innerWidth < 768) setSheet(lead);
    else router.push(`/leads/${lead.id}`);
  };

  const fmtVisit = (l: Lead) =>
    l.visit_date ? new Date(l.visit_date + "T12:00:00").toLocaleDateString(lang === "en" ? "en-US" : "th-TH", { day: "numeric", month: "short" }) + (l.visit_time ? " " + l.visit_time : "") : "";

  const renderVisit = (l: Lead) =>
    l.visit_id ? (
      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${l.visit_confirmed ? "bg-[#EDE9FE] text-[#6D28D9]" : "bg-[#FEF3C7] text-[#B45309]"}`}>
          นัดดูโชว์รูม{fmtVisit(l) ? " · " + fmtVisit(l) : ""}
        </span>
        <span className="hidden md:inline-flex"><FollowUpActions id={l.visit_id!} status={l.visit_status ?? "open"} confirmed={!!l.visit_confirmed} /></span>
      </div>
    ) : null;

  if (loading) return <p className="text-sm text-[#64748B]">{t(lang, "common.loading")}</p>;

  return (
    <div className="space-y-4">
      {/* filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-[#EEF2F7] rounded-lg p-1">
          {([["all", t(lang, "common.all")], ["me", t(lang, "board.me")]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setOwner(k)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium ${owner === k ? "bg-white text-[#0E7490] shadow-sm" : "text-[#64748B]"}`}>
              {label}
            </button>
          ))}
        </div>
        <select
          className="inp !w-auto !py-1.5 text-sm"
          value={owner === "me" || owner === "all" ? "all" : owner}
          onChange={(e) => setOwner(e.target.value)}
        >
          <option value="all">{t(lang, "board.allUsers")}</option>
          {users.filter((u) => u.active).map((u) => (
            <option key={u.id} value={u.id}>{u.full_name}{u.role === "agent" ? " (AI)" : ""}</option>
          ))}
        </select>
      </div>

      {/* lanes: horizontal swipe on mobile, grid on desktop */}
      <div className="flex md:grid gap-4 overflow-x-auto snap-x snap-mandatory md:snap-none md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
        {LANES.map((lane) => (
          <div
            key={lane.key}
            className="lane min-w-[82vw] sm:min-w-[55vw] md:min-w-0 snap-center shrink-0 md:shrink flex flex-col max-h-[calc(100dvh-190px)] md:max-h-none"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/plain");
              if (id) move(lane.key, id);
            }}
          >
            <h3 className="flex items-center justify-between">
              <span>
                {lane.label}{" "}
                <span className="text-[#94A3B8] font-normal">
                  ({lane.key === "new" ? inbox.length : (lanes[lane.key] ?? []).length})
                </span>
              </span>
              {lane.key === "new" && inboxTotal > inbox.length && (
                <span className="text-[10px] font-semibold text-[#0E7490] bg-[#E0F2FE] rounded-full px-2 py-0.5">+{inboxTotal - inbox.length}</span>
              )}
            </h3>
            <div className="space-y-2 overflow-y-auto pr-0.5 md:overflow-visible">
              {lane.key === "new" &&
                (inbox.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] px-2 py-3">{t(lang, "board.empty")}</p>
                ) : (
                  inbox.map((lead) => (
                    <div key={lead.id} className="lane-card cursor-pointer" onClick={() => onCardTap(lead)}>
                      <p className="font-medium text-[#0F172A] text-sm truncate">{lead.full_name}</p>
                      <p className="font-mono text-xs text-[#94A3B8] mt-0.5 truncate">{lead.phone ?? "—"}</p>
                      {lead.interest && <p className="text-xs text-[#64748B] mt-1 truncate">{lead.interest}</p>}
                      <div className="mt-1.5 hidden md:block" onClick={(e) => e.stopPropagation()}>
                        <ClaimButton leadId={lead.id} onClaimed={load} />
                      </div>
                    </div>
                  ))
                ))}
              {lane.key !== "new" &&
                ((lanes[lane.key] ?? []).length === 0 ? (
                  <p className="text-xs text-[#94A3B8] px-2 py-3">{t(lang, "board.empty")}</p>
                ) : (
                  (lanes[lane.key] ?? []).map((lead) => (
                    <div
                      key={lead.id}
                      className="lane-card cursor-pointer"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", lead.id);
                        setDragging(lead.id);
                      }}
                      onClick={() => onCardTap(lead)}
                      style={{ opacity: dragging === lead.id ? 0.5 : 1 }}
                    >
                      <p className="font-medium text-[#0F172A] text-sm truncate">{lead.full_name}</p>
                      <p className="font-mono text-xs text-[#94A3B8] mt-0.5 truncate">{lead.phone ?? "—"}</p>
                      {lead.interest && <p className="text-xs text-[#64748B] mt-1 truncate">{lead.interest}</p>}
                      {renderVisit(lead)}
                      <div className="mt-1.5 flex items-center justify-between gap-1">
                        <StageBadge stage={lead.crm_stage} lang={lang} />
                        <div className="flex items-center gap-1">
                          <button
                            className="md:hidden text-[11px] font-semibold text-[#0E7490] bg-[#E0F2FE] rounded-md px-2 py-1"
                            onClick={(e) => { e.stopPropagation(); setSheet(lead); }}
                          >
                            {t(lang, "board.moveStage")}
                          </button>
                          <select
                            value={lead.crm_stage}
                            onChange={(e) => move(e.target.value, lead.id)}
                            className="hidden md:block text-[11px] border border-[#E2E8F0] rounded px-1.5 py-0.5 bg-white text-[#334155] focus:outline-none focus:border-[#0E7490]"
                            title={t(lang, "board.moveStage")}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {CARD_STAGES.map((s) => (
                              <option key={s} value={s}>{stageLabel(lang, s)}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* mobile bottom sheet — tap card to move stage / quick actions */}
      {sheet && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setSheet(null)}>
          <div
            className="w-full bg-white rounded-t-2xl p-4 pb-8 max-h-[80dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-10 h-1.5 rounded-full bg-[#E2E8F0] mb-3" />
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="text-lg font-bold text-[#0F172A]">{sheet.full_name}</h3>
              <StageBadge stage={sheet.crm_stage} lang={lang} />
            </div>
            {sheet.phone && (
              <a href={`tel:${sheet.phone}`} className="font-mono text-sm text-[#0E7490] hover:underline">{sheet.phone}</a>
            )}
            {sheet.interest && <p className="text-xs text-[#64748B] mt-1">{sheet.interest}</p>}
            {sheet.visit_id && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sheet.visit_confirmed ? "bg-[#EDE9FE] text-[#6D28D9]" : "bg-[#FEF3C7] text-[#B45309]"}`}>
                  นัดดูโชว์รูม{fmtVisit(sheet) ? " · " + fmtVisit(sheet) : ""}
                </span>
                <FollowUpActions id={sheet.visit_id} status={sheet.visit_status ?? "open"} confirmed={!!sheet.visit_confirmed} />
              </div>
            )}

            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mt-4 mb-1.5">{t(lang, "board.moveStage")}</p>
            <div className="space-y-1">
              {CARD_STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => move(s, sheet.id)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium border transition-colors ${
                    sheet.crm_stage === s
                      ? "border-[#0E7490] bg-[#E0F2FE] text-[#075985]"
                      : "border-[#E2E8F0] text-[#334155] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${STAGE_CLASS[s] ?? "st-new"}`} />
                    {stageLabel(lang, s)}
                  </span>
                  {sheet.crm_stage === s && <span className="text-[#0E7490] font-bold">✓</span>}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-4">
              <button className="btn-primary flex-1" onClick={() => { router.push(`/leads/${sheet.id}`); }}>
                {t(lang, "board.openLead")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

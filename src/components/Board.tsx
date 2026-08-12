"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import StageBadge from "./StageBadge";
import ClaimButton from "./ClaimButton";
import { stageLabel } from "@/lib/labels";
import { t, getClientLang } from "@/lib/i18n";

const LANE_KEYS = ["new", "contacted", "qualified", "site_visit", "proposal", "won"];
const CARD_STAGES = [...LANE_KEYS, "no_answer", "lost", "duplicate", "unqualified"];

type Lead = { id: string; full_name: string; phone: string | null; interest: string | null; crm_stage: string; priority?: string | null };

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
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers(d.users ?? [])).catch(() => {});
  }, []);

  const move = async (stage: string, leadId: string) => {
    setDragging(null);
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

  if (loading) return <p className="text-sm text-[#64748B]">{t(lang, "common.loading")}</p>;

  return (
    <div className="space-y-4">
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
        {meId && owner === "me" && <span className="text-xs text-[#94A3B8]">{t(lang, "board.myOnly")}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {LANES.map((lane) => (
          <div
            key={lane.key}
            className="lane"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/plain");
              if (id) move(lane.key, id);
            }}
          >
            <h3>
              {lane.label}{" "}
              <span className="text-[#94A3B8] font-normal">
                ({lane.key === "new" ? inbox.length : (lanes[lane.key] ?? []).length})
              </span>
            </h3>
            {lane.key === "new" && (
              <div className="space-y-2">
                {inbox.map((lead) => (
                  <div key={lead.id} className="lane-card cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                    <p className="font-medium text-[#0F172A] text-sm truncate">{lead.full_name}</p>
                    <p className="font-mono text-xs text-[#94A3B8] mt-0.5 truncate">{lead.phone ?? "—"}</p>
                    {lead.interest && <p className="text-xs text-[#64748B] mt-1 truncate">{lead.interest}</p>}
                    <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                      <ClaimButton leadId={lead.id} />
                    </div>
                  </div>
                ))}
                {inbox.length === 0 && <p className="text-xs text-[#94A3B8] px-2 py-3">{t(lang, "board.empty")}</p>}
              </div>
            )}
            {lane.key !== "new" && (
              <>
                {(lanes[lane.key] ?? []).map((lead) => (
                  <div
                    key={lead.id}
                    className="lane-card cursor-pointer"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", lead.id);
                      setDragging(lead.id);
                    }}
                    onClick={() => router.push(`/leads/${lead.id}`)}
                    style={{ opacity: dragging === lead.id ? 0.5 : 1 }}
                  >
                    <p className="font-medium text-[#0F172A] text-sm truncate">{lead.full_name}</p>
                    <p className="font-mono text-xs text-[#94A3B8] mt-0.5 truncate">{lead.phone ?? "—"}</p>
                    {lead.interest && <p className="text-xs text-[#64748B] mt-1 truncate">{lead.interest}</p>}
                    <div className="mt-1.5 flex items-center justify-between gap-1">
                      <StageBadge stage={lead.crm_stage} lang={lang} />
                      <select
                        value={lead.crm_stage}
                        onChange={(e) => move(e.target.value, lead.id)}
                        className="text-[11px] border border-[#E2E8F0] rounded px-1.5 py-0.5 bg-white text-[#334155] focus:outline-none focus:border-[#0E7490]"
                        title={t(lang, "board.moveStage")}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {CARD_STAGES.map((s) => (
                          <option key={s} value={s}>{stageLabel(lang, s)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {(lanes[lane.key] ?? []).length === 0 && (
                  <p className="text-xs text-[#94A3B8] px-2 py-3">{t(lang, "board.empty")}</p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

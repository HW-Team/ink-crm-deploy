"use client";

import { useEffect, useState } from "react";
import StageBadge from "./StageBadge";

const LANES = [
  { key: "new", label: "ใหม่" },
  { key: "contacted", label: "ติดต่อแล้ว" },
  { key: "qualified", label: "สนใจ" },
  { key: "site_visit", label: "นัดดู" },
  { key: "proposal", label: "เสนอราคา" },
  { key: "won", label: "ปิดการขาย" },
];

export default function Board() {
  const [lanes, setLanes] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/board")
      .then((r) => r.json())
      .then((d) => {
        const grouped: Record<string, any[]> = {};
        for (const lane of LANES) grouped[lane.key] = [];
        for (const lead of d.leads ?? []) {
          if (grouped[lead.crm_stage]) grouped[lead.crm_stage].push(lead);
          else grouped.no_answer = [...(grouped.no_answer ?? []), lead];
        }
        setLanes(grouped);
      })
      .finally(() => setLoading(false));
  }, []);

  const onDrop = async (stage: string, leadId: string) => {
    setDragging(null);
    // optimistic
    setLanes((prev) => {
      const next: Record<string, any[]> = {};
      for (const lane of LANES) next[lane.key] = [...(prev[lane.key] ?? [])];
      let moved: any = null;
      for (const k of Object.keys(prev)) {
        const idx = prev[k].findIndex((l) => l.id === leadId);
        if (idx >= 0) { moved = prev[k][idx]; }
      }
      if (moved) {
        next[stage] = [moved, ...next[stage]];
        for (const k of Object.keys(next)) next[k] = next[k].filter((l) => l.id !== leadId);
        next[stage] = next[stage].filter(Boolean);
      }
      return next;
    });
    await fetch(`/api/leads/${leadId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
  };

  if (loading) return <p className="text-sm text-[#64748B]">กำลังโหลด...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {LANES.map((lane) => (
        <div
          key={lane.key}
          className="lane"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const id = e.dataTransfer.getData("text/plain");
            if (id) onDrop(lane.key, id);
          }}
        >
          <h3>{lane.label} <span className="text-[#94A3B8] font-normal">({(lanes[lane.key] ?? []).length})</span></h3>
          {(lanes[lane.key] ?? []).map((lead) => (
            <div
              key={lead.id}
              className="lane-card"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", lead.id);
                setDragging(lead.id);
              }}
              style={{ opacity: dragging === lead.id ? 0.5 : 1 }}
            >
              <p className="font-medium text-[#0F172A] text-sm truncate">{lead.full_name}</p>
              <p className="font-mono text-xs text-[#94A3B8] mt-0.5 truncate">{lead.phone ?? "—"}</p>
              {lead.interest && <p className="text-xs text-[#64748B] mt-1 truncate">{lead.interest}</p>}
              <div className="mt-1.5"><StageBadge stage={lead.crm_stage} /></div>
            </div>
          ))}
          {(lanes[lane.key] ?? []).length === 0 && (
            <p className="text-xs text-[#94A3B8] px-2 py-3">ว่าง</p>
          )}
        </div>
      ))}
    </div>
  );
}

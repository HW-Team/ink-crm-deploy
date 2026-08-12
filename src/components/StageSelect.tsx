"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { stageLabel } from "@/lib/labels";
import { t, getClientLang } from "@/lib/i18n";

const STAGES = ["new", "contacted", "qualified", "site_visit", "proposal", "won", "no_answer", "lost", "duplicate", "unqualified"];

// Stage selector styled as a badge — used on the lead detail page.
export default function StageSelect({ leadId, stage, compact }: { leadId: string; stage: string; compact?: boolean }) {
  const router = useRouter();
  const lang = getClientLang();
  const [val, setVal] = useState(stage);
  const [busy, setBusy] = useState(false);

  // keep in sync when the server re-renders with a new stage
  useEffect(() => { setVal(stage); }, [stage]);

  const change = async (next: string) => {
    if (next === val || busy) return;
    setVal(next);
    setBusy(true);
    const res = await fetch(`/api/leads/${leadId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: next }),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setVal(stage); // revert on failure
    }
  };

  return (
    <select
      value={val}
      disabled={busy}
      onChange={(e) => change(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      title={t(lang, "board.moveStage")}
      className={`badge appearance-none text-center cursor-pointer disabled:opacity-50 ${compact ? "!text-[12px]" : ""}`}
      style={{ paddingRight: "1.4rem", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748B' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.45rem center" }}
    >
      {STAGES.map((s) => (
        <option key={s} value={s}>{stageLabel(lang, s)}</option>
      ))}
    </select>
  );
}

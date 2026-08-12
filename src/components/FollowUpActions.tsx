"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, getClientLang } from "@/lib/i18n";

// Inline follow-up status controls for the lead detail page:
// confirm a showroom visit, mark done, reopen, cancel.
export default function FollowUpActions({ id, status, confirmed }: { id: string; status: string; confirmed: boolean }) {
  const router = useRouter();
  const lang = getClientLang();
  const [busy, setBusy] = useState(false);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    const res = await fetch(`/api/follow-ups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  };

  const btn = "text-[11px] font-semibold border border-[#E2E8F0] rounded-md px-2 py-0.5 hover:border-[#0E7490] hover:text-[#0E7490] disabled:opacity-50 transition-colors";

  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="badge st-won">{t(lang, "fu.done")}</span>
        <button className={btn} disabled={busy} onClick={() => patch({ status: "open" })}>{t(lang, "visit.reopen")}</button>
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="badge st-lost">{t(lang, "common.cancelled")}</span>
        <button className={btn} disabled={busy} onClick={() => patch({ status: "open" })}>{t(lang, "visit.reopen")}</button>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      {confirmed ? (
        <span className="badge st-site_visit">{t(lang, "visit.confirmed")}</span>
      ) : (
        <button className={btn} disabled={busy} onClick={() => patch({ confirmed: true })}>{t(lang, "visit.confirm")}</button>
      )}
      <button className={btn} disabled={busy} onClick={() => patch({ status: "done" })}>{t(lang, "visit.done")}</button>
      <button className={btn} disabled={busy} onClick={() => patch({ status: "cancelled" })}>{t(lang, "visit.cancel")}</button>
    </span>
  );
}

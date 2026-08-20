"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, getClientLang } from "@/lib/i18n";

const OUTCOMES = [
  { key: "contacted", labelKey: "call.contacted", cls: "bg-[#15803D] text-white" },
  { key: "no_answer", labelKey: "call.noAnswer", cls: "bg-[#B45309] text-white" },
  { key: "appointment", labelKey: "call.appointment", cls: "bg-[#6D28D9] text-white" },
  { key: "other", labelKey: "call.other", cls: "bg-[#475569] text-white" },
] as const;

export default function CallButton({ leadId, phone }: { leadId: string; phone: string | null }) {
  const lang = getClientLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!phone) return null;

  const tel = `tel:${phone.replace(/[^0-9+]/g, "")}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const save = async () => {
    if (!outcome || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/call-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "save failed");
      setOpen(false);
      setOutcome(null);
      setNote("");
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        className="btn-primary !px-4 !py-2 text-sm"
        onClick={() => setOpen(true)}
      >
        📞 {t(lang, "call.call")}
      </button>
    );
  }

  return (
    <div className="card !p-4 max-w-md">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-mono text-[15px] text-[#0F172A]">{phone}</p>
          <p className="text-xs text-[#64748B]">{t(lang, "call.fromPhone")}</p>
        </div>
        <div className="flex gap-2">
          <a href={tel} className="btn-primary !px-4 !py-2 text-sm">📞 {t(lang, "call.now")}</a>
          <button className="btn-secondary !px-3 !py-2 text-sm" onClick={copy}>
            {copied ? "✓ " + t(lang, "call.copied") : t(lang, "call.copy")}
          </button>
        </div>
      </div>

      <p className="text-sm font-semibold text-[#0F172A] mt-4 mb-2">{t(lang, "call.outcome")}</p>
      <div className="flex gap-2 flex-wrap">
        {OUTCOMES.map((o) => (
          <button
            key={o.key}
            className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition ${outcome === o.key ? o.cls : "bg-[#E2E8F0] text-[#334155]"}`}
            onClick={() => setOutcome(o.key)}
          >
            {t(lang, o.labelKey)}
          </button>
        ))}
      </div>

      <input
        className="inp mt-3"
        placeholder={t(lang, "call.notePlaceholder")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {error && <p className="text-sm text-[#B91C1C] mt-2">{error}</p>}

      <div className="flex gap-2 mt-3">
        <button className="btn-secondary flex-1 !py-2 text-sm" disabled={busy} onClick={() => setOpen(false)}>
          {t(lang, "common.cancel")}
        </button>
        <button className="btn-primary flex-1 !py-2 text-sm" disabled={!outcome || busy} onClick={save}>
          {busy ? "…" : t(lang, "call.save")}
        </button>
      </div>
    </div>
  );
}

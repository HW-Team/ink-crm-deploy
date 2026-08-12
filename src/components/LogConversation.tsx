"use client";
import { t, getClientLang } from "@/lib/i18n";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogConversation({ contactId, leadId }: { contactId: string | null; leadId: string }) {
  const lang = getClientLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ channel: "PHONE", summary: "", outcome: "", next_action: "", next_followup_date: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) return setError(t(lang, "log.noContact"));
    setBusy(true);
    setError("");
    const res = await fetch(`/api/contacts/${contactId}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, next_followup_date: form.next_followup_date || null }),
    });
    if (res.ok) {
      setOpen(false);
      setForm({ channel: "PHONE", summary: "", outcome: "", next_action: "", next_followup_date: "" });
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "บันทึกไม่สำเร็จ");
      setBusy(false);
    }
  };

  if (!open) {
    return <button className="btn-primary" onClick={() => setOpen(true)}>+ {t(lang, "log.title")}</button>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="inp-label">{t(lang, "log.channel")}</label>
          <select className="inp" value={form.channel} onChange={set("channel")}>
            <option value="PHONE">{t(lang, "ch.PHONE")}</option>
            <option value={t(lang, "ch.LINE")}>{t(lang, "ch.LINE")}</option>
            <option value="MESSENGER">{t(lang, "ch.MESSENGER")}</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">{t(lang, "ch.EMAIL")}</option>
            <option value="SITE_FORM">{t(lang, "log.form")}</option>
            <option value="OTHER">{t(lang, "ch.OTHER")}</option>
          </select>
        </div>
        <div>
          <label className="inp-label">{t(lang, "log.outcome")}</label>
          <input className="inp" value={form.outcome} onChange={set("outcome")} placeholder={t(lang, "log.hint")} />
        </div>
      </div>
      <div>
        <label className="inp-label">สรุป</label>
        <textarea className="inp" rows={2} value={form.summary} onChange={set("summary")} placeholder={t(lang, "log.summary")} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="inp-label">ขั้นตอนถัดไป</label>
          <input className="inp" value={form.next_action} onChange={set("next_action")} placeholder={t(lang, "log.nextHint")} />
        </div>
        <div>
          <label className="inp-label">นัดติดตาม</label>
          <input className="inp" type="date" value={form.next_followup_date} onChange={set("next_followup_date")} />
        </div>
      </div>
      {error && <p className="text-sm text-[#B91C1C]">{error}</p>}
      <div className="flex gap-3">
        <button className="btn-primary" disabled={busy}>{busy ? "กำลังบันทึก..." : "บันทึก"}</button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>ยกเลิก</button>
      </div>
    </form>
  );
}

"use client";
import { t, getClientLang } from "@/lib/i18n";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddFollowUp({ contactId, leadId }: { contactId: string | null; leadId: string }) {
  const lang = getClientLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ due_date: "", due_time: "", task_type: t(lang, "fu.type.call"), latest_note: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_id: contactId, lead_id: leadId, ...form }),
    });
    if (res.ok) {
      setOpen(false);
      setForm({ due_date: "", due_time: "", task_type: t(lang, "fu.type.call"), latest_note: "" });
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t(lang, "fu.saveFailed"));
      setBusy(false);
    }
  };

  if (!open) {
    return <button className="btn-secondary" onClick={() => setOpen(true)}>+ นัดติดตาม</button>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="inp-label">วันครบ *</label>
          <input className="inp" type="date" required value={form.due_date} onChange={set("due_date")} />
        </div>
        <div>
          <label className="inp-label">เวลา</label>
          <input className="inp" type="time" value={form.due_time} onChange={set("due_time")} />
        </div>
        <div>
          <label className="inp-label">ประเภท</label>
          <select className="inp" value={form.task_type} onChange={set("task_type")}>
            <option>{t(lang, "fu.type.call")}</option>
            <option>{t(lang, "fu.type.visit")}</option>
            <option>{t(lang, "fu.type.proposal")}</option>
            <option>อื่นๆ</option>
          </select>
        </div>
      </div>
      <div>
        <label className="inp-label">หมายเหตุ</label>
        <input className="inp" value={form.latest_note} onChange={set("latest_note")} placeholder={t(lang, "fu.type.reminder")} />
      </div>
      {error && <p className="text-sm text-[#B91C1C]">{error}</p>}
      <div className="flex gap-3">
        <button className="btn-primary" disabled={busy}>{busy ? "กำลังบันทึก..." : "บันทึก"}</button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>ยกเลิก</button>
      </div>
    </form>
  );
}

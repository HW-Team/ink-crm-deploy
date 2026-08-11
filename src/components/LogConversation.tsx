"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogConversation({ contactId, leadId }: { contactId: string | null; leadId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ channel: "PHONE", summary: "", outcome: "", next_action: "", next_followup_date: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) return setError("ยังไม่มีคอนแทกต์ให้ลงบันทึก");
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
    return <button className="btn-primary" onClick={() => setOpen(true)}>+ บันทึกการติดต่อ</button>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="inp-label">ช่องทาง</label>
          <select className="inp" value={form.channel} onChange={set("channel")}>
            <option value="PHONE">โทร</option>
            <option value="LINE">LINE</option>
            <option value="MESSENGER">Messenger</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">อีเมล</option>
            <option value="SITE_FORM">ฟอร์มเว็บ</option>
            <option value="OTHER">อื่นๆ</option>
          </select>
        </div>
        <div>
          <label className="inp-label">ผลลัพธ์</label>
          <input className="inp" value={form.outcome} onChange={set("outcome")} placeholder="เช่น สนใจ, ขอดูราคา" />
        </div>
      </div>
      <div>
        <label className="inp-label">สรุป</label>
        <textarea className="inp" rows={2} value={form.summary} onChange={set("summary")} placeholder="คุยอะไรไปบ้าง" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="inp-label">ขั้นตอนถัดไป</label>
          <input className="inp" value={form.next_action} onChange={set("next_action")} placeholder="เช่น นัดดูโชว์รูม" />
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

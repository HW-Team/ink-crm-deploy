"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VisitButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ due_date: "", due_time: "", note: "", location: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/leads/${leadId}/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "บันทึกไม่สำเร็จ");
      setBusy(false);
    }
  };

  if (!open) {
    return <button className="btn-primary" onClick={() => setOpen(true)}>นัดดูโชว์รูม/ที่ดิน</button>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="inp-label">วันนัด *</label>
          <input className="inp" type="date" required value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
        </div>
        <div>
          <label className="inp-label">เวลา</label>
          <input className="inp" type="time" value={form.due_time} onChange={(e) => setForm((f) => ({ ...f, due_time: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="inp-label">สถานที่</label>
        <input className="inp" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="โชว์รูม / ที่อยู่หน้างาน" />
      </div>
      <div>
        <label className="inp-label">หมายเหตุ</label>
        <input className="inp" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="สถานที่นัด / เตือนตัวเอง" />
      </div>
      {error && <p className="text-sm text-[#B91C1C]">{error}</p>}
      <div className="flex gap-3">
        <button className="btn-primary" disabled={busy}>{busy ? "กำลังบันทึก..." : "บันทึกนัด"}</button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>ยกเลิก</button>
      </div>
    </form>
  );
}

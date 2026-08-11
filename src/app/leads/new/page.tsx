"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewLeadPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", phone: "", source: "FACEBOOK", interest: "", province: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const d = await res.json();
      router.push(`/leads?tab=inbox`);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "เกิดข้อผิดพลาด");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">ลีดใหม่</h1>
        <p className="text-sm text-[#64748B]">เพิ่มลีดด้วยมือ ลีดจะเข้ากล่องรอรับงานก่อนเข้าบอร์ด</p>
      </header>

      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="inp-label">ชื่อ *</label>
          <input className="inp" required value={form.full_name} onChange={set("full_name")} placeholder="ชื่อลูกค้า" />
        </div>
        <div>
          <label className="inp-label">เบอร์โทร</label>
          <input className="inp" value={form.phone} onChange={set("phone")} placeholder="08x-xxx-xxxx" />
        </div>
        <div>
          <label className="inp-label">แหล่ง</label>
          <select className="inp" value={form.source} onChange={set("source")}>
            <option value="FACEBOOK">Facebook</option>
            <option value="WEBSITE">เว็บไซต์</option>
            <option value="LINE">LINE</option>
            <option value="CALL">โทร</option>
            <option value="OTHER">อื่นๆ</option>
          </select>
        </div>
        <div>
          <label className="inp-label">สนใจ</label>
          <input className="inp" value={form.interest} onChange={set("interest")} placeholder="ประเภทโครงการ" />
        </div>
        <div>
          <label className="inp-label">จังหวัด</label>
          <input className="inp" value={form.province} onChange={set("province")} placeholder="กรุงเทพฯ" />
        </div>

        {error && <p className="text-sm text-[#B91C1C]">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button className="btn-primary" disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
          <a href="/leads" className="btn-secondary">ยกเลิก</a>
        </div>
      </form>
    </div>
  );
}

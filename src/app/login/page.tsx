"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(d.error ?? "เกิดข้อผิดพลาด");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FA] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0E7490] to-[#155E75] text-white flex items-center justify-center text-xl font-bold mb-4">IC</div>
          <h1 className="text-xl font-bold text-[#0F172A]">Ink CRM</h1>
          <p className="text-sm text-[#64748B] mt-1">ทีมขายบ้านน็อคดาวน์ · ลงชื่อเข้าใช้ด้วยบัญชีทีม</p>
        </div>

        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="inp-label">อีเมล</label>
            <input className="inp" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="somchai@inkhomes.co" autoComplete="email" />
          </div>
          <div>
            <label className="inp-label">รหัสผ่าน</label>
            <input className="inp" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete="current-password" />
          </div>
          {error && <p className="text-sm text-[#B91C1C]">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "กำลังเข้า..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="text-center text-[11px] text-[#94A3B8] mt-6">
          เฉพาะทีม Ink Homes · Google Sign-In จะเปิดใช้งานหลังตั้งค่า OAuth
        </p>
      </div>
    </div>
  );
}

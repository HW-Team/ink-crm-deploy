"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const e = params.get("error");
    if (e) setError(e);
  }, [params]);

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
            <label className="inp-label">ชื่อผู้ใช้ / อีเมล</label>
            <input className="inp" type="text" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin" autoComplete="username" />
          </div>
          <div>
            <label className="inp-label">รหัสผ่าน</label>
            <input className="inp" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete="current-password" />
          </div>
          {error && <p className="text-sm text-[#B91C1C]">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "กำลังเข้า..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px flex-1 bg-[#E2E8F0]" />
          <span className="text-[11px] text-[#94A3B8]">หรือ</span>
          <div className="h-px flex-1 bg-[#E2E8F0]" />
        </div>

        <a href="/api/auth/google"
          className="w-full flex items-center justify-center gap-2 border border-[#CBD5E1] bg-white rounded-xl px-4 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
          </svg>
          เข้าสู่ระบบด้วย Google
        </a>

        <p className="text-center text-[11px] text-[#94A3B8] mt-6">
          เฉพาะทีม Ink Homes · บัญชี Google ต้องได้รับอนุญาตจากผู้จัดการ
        </p>
      </div>
    </div>
  );
}

"use client";
import { t, getClientLang, type Lang } from "@/lib/i18n";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserRow = { id: string; email: string; full_name: string; role: string; active: boolean; owned_leads?: number; open_followups?: number };

const ROLES = (lang: Lang) => [
  { value: "sales", label: t(lang, "role.sales") },
  { value: "manager", label: t(lang, "role.manager") },
  { value: "agent", label: t(lang, "role.agent") },
];

export default function UsersAdmin({ users, meId }: { users: UserRow[]; meId: string }) {
  const lang = getClientLang();
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", role: "sales", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pwOpen, setPwOpen] = useState<string | null>(null);
  const [pw, setPw] = useState("");

  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(""), 2500); };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ full_name: "", email: "", role: "sales", password: "" });
      flash(t(lang, "users.created"));
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t(lang, "users.createFailed"));
    }
    setBusy(false);
  };

  const update = async (u: UserRow, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    });
    if (res.ok) { flash(t(lang, "users.saved")); router.refresh(); }
    else {
      const d = await res.json().catch(() => ({}));
      flash(d.error ?? "บันทึกไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="bg-[#DCFCE7] text-[#166534] text-sm font-medium rounded-lg px-4 py-2.5">{notice}</div>
      )}

      <section className="card max-w-xl">
        <h2 className="text-base font-semibold text-[#0F172A] mb-4">{t(lang, "users.addNew")}</h2>
        <form onSubmit={create} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="inp-label">ชื่อ *</label>
              <input className="inp" required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder={t(lang, "common.fullname")} />
            </div>
            <div>
              <label className="inp-label">{t(lang, "common.email")} *</label>
              <input className="inp" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="name@inkhomes.co" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="inp-label">{t(lang, "users.role")}</label>
              <select className="inp" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                {ROLES(lang).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="inp-label">{t(lang, "users.initialPassword")} *</label>
              <input className="inp" required minLength={4} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder={t(lang, "users.min4")} />
            </div>
          </div>
          {error && <p className="text-sm text-[#B91C1C]">{error}</p>}
          <button className="btn-primary" disabled={busy}>{busy ? t(lang, "users.creating") : t(lang, "users.create")}</button>
        </form>
      </section>

      <section className="card overflow-x-auto p-0">
        <h2 className="text-base font-semibold text-[#0F172A] px-6 pt-5 pb-2">ทีม ({users.length})</h2>
        <table className="tbl">
          <thead>
            <tr><th>ชื่อ</th><th>{t(lang, "common.email")}</th><th>{t(lang, "users.role")}</th><th>งาน</th><th>สถานะ</th><th>จัดการ</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium text-[#0F172A]">{u.full_name}{u.id === meId ? " (คุณ)" : ""}</td>
                <td className="text-[13px]">{u.email}</td>
                <td>
                  <select
                    className="text-[13px] border border-[#E2E8F0] rounded px-2 py-1 bg-white"
                    value={u.role}
                    disabled={u.id === meId}
                    onChange={(e) => update(u, { role: e.target.value })}
                  >
                    {ROLES(lang).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </td>
                <td className="text-[13px] text-[#64748B]">{u.owned_leads ?? 0} ลีด · {u.open_followups ?? 0} ติดตาม</td>
                <td>
                  <button
                    className={`text-[12px] font-medium rounded-full px-2.5 py-0.5 ${u.active ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#B91C1C]"}`}
                    disabled={u.id === meId}
                    onClick={() => update(u, { active: !u.active })}
                  >
                    {u.active ? t(lang, "users.active") : "ปิด"}
                  </button>
                </td>
                <td>
                  <button
                    className="btn-secondary !py-1 !px-2.5 !text-xs"
                    onClick={() => { setPwOpen(u.id); setPw(""); }}
                  >
                    {t(lang, "users.changePassword")}
                  </button>
                  {pwOpen === u.id && (
                    <span className="inline-flex items-center gap-1.5 ml-2">
                      <input
                        className="text-[13px] border border-[#E2E8F0] rounded px-2 py-1 w-28"
                        type="password" minLength={4} value={pw} placeholder="ใหม่" autoFocus
                        onChange={(e) => setPw(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && pw.length >= 4) { update(u, { password: pw }); setPwOpen(null); }
                        }}
                      />
                      <button className="btn-primary !py-1 !px-2.5 !text-xs" disabled={pw.length < 4}
                        onClick={() => { update(u, { password: pw }); setPwOpen(null); }}>ตั้ง</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

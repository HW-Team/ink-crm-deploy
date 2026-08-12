"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, getClientLang } from "@/lib/i18n";

export default function NewLeadPage() {
  const router = useRouter();
  const lang = getClientLang();
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
      router.push(`/leads?tab=inbox`);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t(lang, "common.error"));
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">{t(lang, "leads.new.title")}</h1>
        <p className="text-sm text-[#64748B]">{t(lang, "leads.new.hint")}</p>
      </header>

      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="inp-label">{t(lang, "common.name")} *</label>
          <input className="inp" required value={form.full_name} onChange={set("full_name")} placeholder={t(lang, "leads.new.customerName")} />
        </div>
        <div>
          <label className="inp-label">{t(lang, "common.phone")}</label>
          <input className="inp" value={form.phone} onChange={set("phone")} placeholder="08x-xxx-xxxx" />
        </div>
        <div>
          <label className="inp-label">{t(lang, "common.source")}</label>
          <select className="inp" value={form.source} onChange={set("source")}>
            <option value="FACEBOOK">{t(lang, "src.FACEBOOK")}</option>
            <option value="WEBSITE">{t(lang, "src.WEBSITE")}</option>
            <option value="LINE">{t(lang, "src.LINE")}</option>
            <option value="CALL">{t(lang, "src.CALL")}</option>
            <option value="OTHER">{t(lang, "src.OTHER")}</option>
          </select>
        </div>
        <div>
          <label className="inp-label">{t(lang, "common.interest")}</label>
          <input className="inp" value={form.interest} onChange={set("interest")} placeholder={t(lang, "leads.new.project")} />
        </div>
        <div>
          <label className="inp-label">{t(lang, "common.province")}</label>
          <input className="inp" value={form.province} onChange={set("province")} placeholder={t(lang, "leads.new.bangkok")} />
        </div>

        {error && <p className="text-sm text-[#B91C1C]">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button className="btn-primary" disabled={saving}>{saving ? t(lang, "common.saving") : t(lang, "leads.new.save")}</button>
          <a href="/leads" className="btn-secondary">{t(lang, "common.cancel")}</a>
        </div>
      </form>
    </div>
  );
}

"use client";
import { t, getClientLang } from "@/lib/i18n";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = { id: string; full_name: string; role: string };

export default function TransferOwner({ leadId, currentOwnerId, users }: { leadId: string; currentOwnerId: string | null; users: User[] }) {
  const lang = getClientLang();
  const router = useRouter();
  const [value, setValue] = useState(currentOwnerId ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!value) return;
    setBusy(true);
    const res = await fetch(`/api/leads/${leadId}/owner`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner_id: value }),
    });
    if (res.ok) router.refresh();
    else setBusy(false);
  };

  return (
    <div className="flex items-center gap-2">
      <select className="inp max-w-[180px] !py-1.5 text-sm" value={value} onChange={(e) => setValue(e.target.value)}>
        <option value="">{t(lang, "common.noOwner")}</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.full_name}{u.role === "agent" ? " (AI)" : ""}</option>
        ))}
      </select>
      <button className="btn-secondary !py-1.5 text-sm" onClick={save} disabled={busy || !value}>
        {busy ? "..." : "โอน"}
      </button>
    </div>
  );
}

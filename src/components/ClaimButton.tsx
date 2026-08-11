"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClaimButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const claim = async () => {
    setBusy(true);
    const res = await fetch(`/api/leads/${leadId}/claim`, { method: "POST" });
    if (res.ok) router.refresh();
    else setBusy(false);
  };

  return (
    <button onClick={claim} disabled={busy}
      className="text-[12px] font-semibold text-[#0E7490] bg-[#E0F2FE] hover:bg-[#BAE6FD] px-2.5 py-1 rounded-md disabled:opacity-50">
      {busy ? "..." : "รับงาน"}
    </button>
  );
}

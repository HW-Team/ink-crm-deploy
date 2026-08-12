"use client";

import { useState } from "react";
import { LANGS, setLangCookie, getClientLang, type Lang } from "@/lib/i18n";

// TH | EN switcher — sets the lang cookie and reloads (server-rendered pages
// read the cookie, so a reload is the simplest consistent switch).
export default function LangToggle({ initial = "th" }: { initial?: Lang }) {
  const [lang, setLang] = useState<Lang>(initial || getClientLang());

  const pick = (l: Lang) => {
    setLang(l);
    setLangCookie(l);
    window.location.reload();
  };

  return (
    <div className="inline-flex items-center rounded-lg border border-[#CBD5E1] bg-white overflow-hidden text-[11px] font-semibold shadow-sm">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => pick(l)}
          className={`px-2 py-1 uppercase transition-colors ${
            lang === l ? "bg-[#0E7490] text-white" : "text-[#64748B] hover:bg-[#F1F5F9]"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

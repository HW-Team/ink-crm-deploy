"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/", label: "วันนี้", icon: "◎" },
  { href: "/dashboard", label: "แดชบอร์ด", icon: "▤" },
  { href: "/leads", label: "ลีด", icon: "◈" },
  { href: "/board", label: "บอร์ด", icon: "▦" },
  { href: "/calendar", label: "ปฏิทิน", icon: "◫" },
  { href: "/contacts", label: "คอนแทกต์", icon: "◉" },
  { href: "/followups", label: "ติดตาม", icon: "☰" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-[#E2E8F0] h-14 flex items-center px-4">
        <button
          onClick={() => setOpen(!open)}
          aria-label="เมนู"
          className="text-[#334155] text-xl"
        >
          ☰
        </button>
        <span className="ml-3 font-semibold text-[#0F172A]">Ink Homes CRM</span>
      </header>

      {/* sidebar */}
      <aside
        className={`fixed md:sticky top-14 md:top-0 z-30 h-[calc(100vh-3.5rem)] md:h-screen w-56 bg-white border-r border-[#E2E8F0] flex flex-col transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 pt-6 pb-4 hidden md:block">
          <p className="font-bold text-[#0F172A] text-lg leading-tight">Ink Homes</p>
          <p className="text-[#64748B] text-xs tracking-wide mt-0.5">CRM ภายใน</p>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-[#EEF2F7] text-[#0E7490] font-semibold"
                    : "text-[#64748B] hover:bg-[#F6F8FA] hover:text-[#334155]"
                }`}
              >
                <span className="w-4 text-center text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-[#E2E8F0] text-xs text-[#94A3B8]">
          Ink team · v1
        </div>
      </aside>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS = {
  today: "M8 3v4M16 3v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  leads: "M12 3v18M5 8h14M5 16h14",
  board: "M3 4h18v16H3zM3 9h18M9 9v11",
  calendar: "M8 3v4M16 3v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  add: "M12 5v14M5 12h14",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.3 7.3 0 0 0-2-1.2L14.6 3h-4l-.4 2.7a7.3 7.3 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7.3 7.3 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7.3 7.3 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z",
};

const BASE = [
  { href: "/", key: "today", label: "วันนี้" },
  { href: "/leads", key: "leads", label: "ลีด" },
  { href: "/board", key: "board", label: "บอร์ด" },
  { href: "/calendar", key: "calendar", label: "ปฏิทิน" },
  { href: "/leads/new", key: "add", label: "เพิ่ม" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user?.role === "manager") setIsManager(true);
    }).catch(() => {});
  }, []);

  const items = isManager
    ? [...BASE.slice(0, 4), { href: "/admin/users", key: "settings", label: "ตั้งค่า" }, BASE[4]]
    : BASE;

  const isActive = (href: string, key: string) => {
    if (key === "add") return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0] backdrop-blur">
      <div className="grid grid-cols-6">
        {items.map((it) => {
          const active = isActive(it.href, it.key);
          const add = it.key === "add";
          return (
            <Link key={it.key} href={it.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 ${
                add ? "text-[#0E7490]" : active ? "text-[#0E7490]" : "text-[#94A3B8]"
              }`}>
              {add ? (
                <span className="w-9 h-9 rounded-full bg-[#0E7490] text-white flex items-center justify-center -mt-4 shadow-md">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d={ICONS.add} />
                  </svg>
                </span>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
                  <path d={ICONS[it.key as keyof typeof ICONS]} />
                </svg>
              )}
              <span className={`text-[10px] font-medium ${active ? "text-[#0E7490]" : "text-[#94A3B8]"}`}>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

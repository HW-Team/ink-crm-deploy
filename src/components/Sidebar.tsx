import { cookies } from "next/headers";
import Link from "next/link";
import { verifySessionToken } from "@/lib/auth";
import { qOne } from "@/lib/supabase";

// Sidebar — shows current user (server-side via session cookie) + logout
export default async function Sidebar() {
  const jar = await cookies();
  const parsed = verifySessionToken(jar.get("ink_session")?.value);
  let me: { full_name: string; role: string } | null = null;
  if (parsed) {
    try {
      me = await qOne<{ full_name: string; role: string }>(
        `select full_name, role from users where id = $1 and active = true`, [parsed.uid]
      );
    } catch {
      me = null; // pre-migration / DB hiccup — degrade gracefully
    }
  }

  const links = [
    { href: "/", label: "วันนี้", icon: "M3 10h18M8 3v4M16 3v4M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" },
    { href: "/dashboard", label: "แดชบอร์ด", icon: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" },
    { href: "/leads", label: "ลีด", icon: "M12 3v18M5 8h14M5 16h14" },
    { href: "/board", label: "บอร์ด", icon: "M3 4h18v16H3zM3 9h18M9 9v11" },
    { href: "/calendar", label: "ปฏิทิน", icon: "M8 3v4M16 3v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" },
    { href: "/contacts", label: "คอนแทกต์", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
    { href: "/followups", label: "ติดตาม", icon: "M12 3a9 9 0 1 0 9 9M12 7v5l3 2" },
  ];

  return (
    <aside className="w-56 shrink-0 border-r border-[#E2E8F0] bg-white hidden md:flex flex-col sticky top-0 h-screen">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0E7490] to-[#155E75] text-white flex items-center justify-center text-sm font-bold">IC</div>
        <div>
          <div className="font-bold text-[#0F172A] text-sm leading-tight">Ink CRM</div>
          <div className="text-[11px] text-[#64748B]">ทีมขายบ้านน็อคดาวน์</div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#334155] hover:bg-[#EEF2F7]">
            <svg className="w-4.5 h-4.5 w-[18px] h-[18px] text-[#64748B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d={l.icon} />
            </svg>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-[#E2E8F0]">
        {me ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#075985] flex items-center justify-center text-xs font-bold">
                {me.full_name.slice(0, 1)}
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-semibold text-[#0F172A]">{me.full_name}</div>
                <div className="text-[11px] text-[#64748B]">{me.role === "manager" ? "ผู้จัดการ" : me.role === "agent" ? "Ink Agent" : "พนักงานขาย"}</div>
              </div>
            </div>
            <form action="/api/auth/logout" method="post">
              <button className="text-[11px] text-[#B91C1C] hover:underline" title="ออกจากระบบ">ออก</button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="text-sm text-[#0E7490]">เข้าสู่ระบบ</Link>
        )}
      </div>
    </aside>
  );
}

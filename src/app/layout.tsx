import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "Ink Homes CRM",
  description: "Internal CRM for Ink Homes — leads, contacts, conversations, follow-ups",
};

// NOTE: no next/font/google — the build-time font download from Google Fonts
// 404s from the datacenter IP and breaks `next build` (Turbopack "Module not
// found: @vercel/turbopack-next/internal/font/google/font"). System font stack
// defined in globals.css instead.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full bg-[#F6F8FA] text-[#0F172A] font-sans">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 px-4 py-5 md:px-8 md:py-8 pb-24 md:pb-8">{children}</main>
        </div>
        <MobileNav />
      </body>
    </html>
  );
}

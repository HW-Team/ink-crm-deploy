import type { Metadata } from "next";
import { Noto_Sans_Thai, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const noto = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-noto",
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Ink Homes CRM",
  description: "Internal CRM for Ink Homes — leads, contacts, conversations, follow-ups",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${noto.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#F6F8FA] text-[#0F172A] font-sans">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 px-6 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}

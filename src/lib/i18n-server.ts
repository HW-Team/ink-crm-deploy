import { cookies } from "next/headers";
import { t, type Lang } from "@/lib/i18n";

export { t };
export type { Lang };

// Server-side: read the lang cookie.
export async function getServerLang(): Promise<Lang> {
  try {
    const jar = await cookies();
    return jar.get("lang")?.value === "en" ? "en" : "th";
  } catch {
    return "th";
  }
}

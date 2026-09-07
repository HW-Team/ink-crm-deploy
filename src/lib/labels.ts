import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export const STAGE_CLASS: Record<string, string> = {
  new: "st-new",
  contacted: "st-contacted",
  qualified: "st-qualified",
  site_visit: "st-site_visit",
  proposal: "st-proposal",
  won: "st-won",
  unqualified: "st-unqualified",
  lost: "st-lost",
  duplicate: "st-duplicate",
  no_answer: "st-no_answer",
};

export function stageLabel(lang: Lang, stage: string): string {
  return t(lang, `stage.${stage}`);
}

export function sourceLabel(lang: Lang, source: string): string {
  return t(lang, `src.${source}`);
}

export function channelLabel(lang: Lang, channel: string): string {
  return t(lang, `ch.${channel}`);
}

export function priorityLabel(lang: Lang, p: string): string {
  return t(lang, `common.priority.${p}`);
}

// task_type mixes migration labels ("Initial call", "โทรติดตาม") with the
// seeded keys (call/visit/...). Look up a known i18n key first; fall back to
// the stored text so free-form values never render as "fu.type.<raw>".
export function taskTypeLabel(lang: Lang, raw: string | null | undefined): string {
  if (!raw) return "—";
  const key = `fu.type.${raw}`;
  const hit = t(lang, key);
  return hit === key ? raw : hit;
}

export function thDate(iso: string | null | undefined, lang: Lang = "th"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(lang === "en" ? "en-US" : "th-TH", { day: "numeric", month: "short", year: "numeric" });
}

// Whole-day difference using one timezone on BOTH sides — the server runs in
// Asia/Bangkok (UTC+7) but date-only strings parse as UTC midnight, so mixing
// the two would shift every "today" by a day. Server-side only.
const TZ = "Asia/Bangkok";
function utcDayInTz(d: Date): number {
  // integer days since epoch as counted in TZ (Intl gives us the wall date)
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "numeric" }).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Math.floor(Date.UTC(get("year"), get("month") - 1, get("day")) / 86400000);
}

export function dayDiff(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return utcDayInTz(new Date()) - utcDayInTz(d);
}

// "วันนี้ / เมื่อวาน / 3 วันก่อน" — falls back to absolute date past 30 days.
export function relDate(lang: Lang, iso: string | null | undefined): string {
  const diff = dayDiff(iso);
  if (diff === null) return "—";
  if (diff === 0) return t(lang, "rel.today");
  if (diff === 1) return t(lang, "rel.yesterday");
  if (diff > 1 && diff <= 30) return t(lang, "rel.daysAgo", { n: diff });
  return thDate(iso, lang);
}

// Due-date semantics: past = overdue (red-worthy), future = countdown.
export function relDue(lang: Lang, iso: string | null | undefined): string {
  const diff = dayDiff(iso);
  if (diff === null) return "—";
  if (diff === 0) return t(lang, "rel.today");
  if (diff === 1) return t(lang, "rel.yesterday");
  if (diff === -1) return t(lang, "rel.tomorrow");
  if (diff > 1 && diff <= 30) return t(lang, "rel.overdueDays", { n: diff });
  if (diff > 30) return t(lang, "rel.overdue");
  if (diff >= -30) return t(lang, "rel.inDays", { n: -diff });
  return thDate(iso, lang);
}

export function thDateTime(iso: string | null | undefined, lang: Lang = "th"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(lang === "en" ? "en-US" : "th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

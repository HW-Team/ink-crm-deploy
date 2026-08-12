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

export function thDate(iso: string | null | undefined, lang: Lang = "th"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(lang === "en" ? "en-US" : "th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export function thDateTime(iso: string | null | undefined, lang: Lang = "th"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(lang === "en" ? "en-US" : "th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

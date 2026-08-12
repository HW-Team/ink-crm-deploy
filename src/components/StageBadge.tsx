import { stageLabel } from "@/lib/labels";
import { t, getServerLang, type Lang } from "@/lib/i18n";

export default function StageBadge({ stage, lang = "th" }: { stage: string | null | undefined; lang?: Lang }) {
  const classes: Record<string, string> = {
    new: "st-new", contacted: "st-contacted", qualified: "st-qualified", site_visit: "st-site_visit",
    proposal: "st-proposal", won: "st-won", unqualified: "st-unqualified", lost: "st-lost",
    duplicate: "st-duplicate", no_answer: "st-no_answer",
  };
  const s = stage ?? "new";
  return <span className={`badge ${classes[s] ?? "st-new"}`}>{stageLabel(lang, s)}</span>;
}

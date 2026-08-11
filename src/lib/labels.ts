export const STAGE_LABELS: Record<string, string> = {
  new: "ใหม่",
  contacted: "ติดต่อแล้ว",
  qualified: "สนใจ",
  site_visit: "นัดดู",
  proposal: "เสนอราคา",
  won: "ปิดการขาย",
  unqualified: "ไม่ผ่าน",
  lost: "หลุด",
  duplicate: "ซ้ำ",
  no_answer: "ไม่ตอบ",
};

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

export const SOURCE_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  WEBSITE: "เว็บไซต์",
  LINE: "LINE",
  CALL: "โทร",
  OTHER: "อื่นๆ",
};

export function thDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export function thDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

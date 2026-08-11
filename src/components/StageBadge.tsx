export default function StageBadge({ stage }: { stage: string | null | undefined }) {
  const labels: Record<string, string> = {
    new: "ใหม่", contacted: "ติดต่อแล้ว", qualified: "สนใจ", site_visit: "นัดดู",
    proposal: "เสนอราคา", won: "ปิดการขาย", unqualified: "ไม่ผ่าน", lost: "หลุด",
    duplicate: "ซ้ำ", no_answer: "ไม่ตอบ",
  };
  const classes: Record<string, string> = {
    new: "st-new", contacted: "st-contacted", qualified: "st-qualified", site_visit: "st-site_visit",
    proposal: "st-proposal", won: "st-won", unqualified: "st-unqualified", lost: "st-lost",
    duplicate: "st-duplicate", no_answer: "st-no_answer",
  };
  const s = stage ?? "new";
  return <span className={`badge ${classes[s] ?? "st-new"}`}>{labels[s] ?? s}</span>;
}

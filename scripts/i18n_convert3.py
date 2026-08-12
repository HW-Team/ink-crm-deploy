#!/usr/bin/env python3
"""Pass 3: convert client components — add lang prop + t() strings."""
import re

ROOT = "/opt/data/ink-crm/src"

def conv(f, reps, prop_old, prop_new):
    p = f"{ROOT}/{f}"
    src = open(p, encoding="utf-8").read()
    n = 0
    for old, new in reps:
        if old in src:
            src = src.replace(old, new)
            n += 1
        else:
            print(f"  MISS {f}: {old[:60]}")
    if prop_old and prop_old in src:
        src = src.replace(prop_old, prop_new)
        print(f"  {f}: prop updated")
    elif prop_old:
        print(f"  PROP MISS {f}: {prop_old[:60]}")
    # ensure import
    if "from \"@/lib/i18n\"" not in src:
        src = re.sub(r"(import .*?from \"@/lib/labels\";\n?)", r"\1import { t, type Lang } from \"@/lib/i18n\";\n", src, count=1)
        if "from \"@/lib/i18n\"" not in src:
            src = src.replace("import Link from \"next/link\";", "import Link from \"next/link\";\nimport { t, type Lang } from \"@/lib/i18n\";", 1) if "import Link" in src else src
    open(p, "w", encoding="utf-8").write(src)
    print(f"{f}: {n} strings")

# ---- StageBadge ----
conv("components/StageBadge.tsx", [
 ('  const labels: Record<string, string> = {\n    new: "ใหม่", contacted: "ติดต่อแล้ว", qualified: "สนใจ", site_visit: "นัดดู",\n    proposal: "เสนอราคา", won: "ปิดการขาย", unqualified: "ไม่ผ่าน", lost: "หลุด",\n    duplicate: "ซ้ำ", no_answer: "ไม่ตอบ",\n  };\n', ""),
 ("{labels[s] ?? s}", "{stageLabel(lang, s)}"),
], "export default function StageBadge({ stage }: { stage: string | null | undefined })",
   "import { stageLabel } from \"@/lib/labels\";\nimport { t, type Lang } from \"@/lib/i18n\";\n\nexport default function StageBadge({ stage, lang = \"th\" }: { stage: string | null | undefined; lang?: Lang })")

# ---- ClaimButton ----
conv("components/ClaimButton.tsx", [
 ("รับงาน", "{t(lang, \"leads.detail.claim\")}"),
 ("กำลังรับ...", "{t(lang, \"common.saving\")}"),
 ("รับงานแล้ว", "{t(lang, \"users.saved\")}"),
], "export default function ClaimButton({ leadId }: { leadId: string })",
   "export default function ClaimButton({ leadId, lang = \"th\" }: { leadId: string; lang?: Lang })")

# ---- TransferOwner ----
conv("components/TransferOwner.tsx", [
 ("โอนเจ้าของ", "{t(lang, \"leads.detail.transfer\")}"),
 ("ไม่มีเจ้าของ", "{t(lang, \"common.noOwner\")}"),
 ("บันทึกแล้ว", "{t(lang, \"users.saved\")}"),
 ("เปลี่ยน", "{t(lang, \"common.save\")}"),
], "export default function TransferOwner({ leadId, currentOwnerId, users }: { leadId: string; currentOwnerId: string | null; users: User[] })",
   "export default function TransferOwner({ leadId, currentOwnerId, users, lang = \"th\" }: { leadId: string; currentOwnerId: string | null; users: User[]; lang?: Lang })")

# ---- VisitButton ----
conv("components/VisitButton.tsx", [
 ("นัดดูหน้างาน", "{t(lang, \"visit.title\")}"),
 ("บันทึกนัด", "{t(lang, \"visit.save\")}"),
 ("สถานที่นัด / เตือนตัวเอง", "{t(lang, \"visit.placeHint\")}"),
 ("เพิ่มนัดเรียบร้อย", "{t(lang, \"cal.added\")}"),
 ("บันทึกไม่สำเร็จ", "{t(lang, \"fu.saveFailed\")}"),
 ("กำลังบันทึก...", "{t(lang, \"common.saving\")}"),
], "export default function VisitButton({ leadId }: { leadId: string })",
   "export default function VisitButton({ leadId, lang = \"th\" }: { leadId: string; lang?: Lang })")

# ---- LogConversation ----
conv("components/LogConversation.tsx", [
 ("บันทึกการติดต่อ", "{t(lang, \"log.title\")}"),
 ("คุยอะไรไปบ้าง", "{t(lang, \"log.summary\")}"),
 ("ช่องทาง", "{t(lang, \"log.channel\")}"),
 ("ผลลัพธ์", "{t(lang, \"log.outcome\")}"),
 ("เช่น สนใจ, ขอดูราคา", "{t(lang, \"log.hint\")}"),
 ("เช่น นัดดูโชว์รูม", "{t(lang, \"log.nextHint\")}"),
 ("ฟอร์มเว็บ", "{t(lang, \"log.form\")}"),
 ("ยังไม่มีคอนแทกต์ให้ลงบันทึก", "{t(lang, \"log.noContact\")}"),
 ("บันทึกแล้ว", "{t(lang, \"users.saved\")}"),
 ("โทร", "{t(lang, \"ch.PHONE\")}"),
 ("LINE", "{t(lang, \"ch.LINE\")}"),
 ("Messenger", "{t(lang, \"ch.MESSENGER\")}"),
 ("อีเมล", "{t(lang, \"ch.EMAIL\")}"),
 ("อื่นๆ", "{t(lang, \"ch.OTHER\")}"),
], "export default function LogConversation({ contactId, leadId }: { contactId: string | null; leadId: string })",
   "export default function LogConversation({ contactId, leadId, lang = \"th\" }: { contactId: string | null; leadId: string; lang?: Lang })")

# ---- AddFollowUp ----
conv("components/AddFollowUp.tsx", [
 ("เพิ่มนัดติดตาม", "{t(lang, \"fu.add\")}"),
 ("โทรติดตาม", "{t(lang, \"fu.type.call\")}"),
 ("นัดดูโชว์รูม", "{t(lang, \"fu.type.visit\")}"),
 ("นัดดูที่ดิน", "{t(lang, \"fu.type.land\")}"),
 ("ส่งข้อเสนอ", "{t(lang, \"fu.type.proposal\")}"),
 ("เตือนตัวเอง", "{t(lang, \"fu.type.reminder\")}"),
 ("บันทึกนัด", "{t(lang, \"visit.save\")}"),
 ("บันทึกไม่สำเร็จ", "{t(lang, \"fu.saveFailed\")}"),
 ("เพิ่มนัด", "{t(lang, \"cal.addEvent\")}"),
], "export default function AddFollowUp({ contactId, leadId }: { contactId: string | null; leadId: string })",
   "export default function AddFollowUp({ contactId, leadId, lang = \"th\" }: { contactId: string | null; leadId: string; lang?: Lang })")

print("PASS 3 PART A DONE")

#!/usr/bin/env python3
"""Pass 3B: Board, CalendarClient, UsersAdmin, login page."""
import re

ROOT = "/opt/data/ink-crm/src"

def conv(f, reps, prop_old=None, prop_new=None):
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
    elif prop_old:
        print(f"  PROP MISS {f}: {prop_old[:60]}")
    if "from \"@/lib/i18n\"" not in src:
        src = re.sub(r"(import .*?from \"@/lib/labels\";\n?)", r"\1import { t, type Lang } from \"@/lib/i18n\";\n", src, count=1)
        if "from \"@/lib/i18n\"" not in src:
            src = src.replace("import Link from \"next/link\";", "import Link from \"next/link\";\nimport { t, type Lang } from \"@/lib/i18n\";", 1) if "import Link" in src else src
    open(p, "w", encoding="utf-8").write(src)
    print(f"{f}: {n} strings")

# ---- Board ----
conv("components/Board.tsx", [
 ("บอร์ดแสดงเฉพาะลีดที่มีเจ้าของ", "{t(lang, \"board.ownedOnly\")}"),
 ("ลีดใหม่ในกล่อง {n} ราย รับงานก่อนลีดถึงจะเข้าบอร์ด", "{t(lang, \"board.claimQueue\", { n: unownedCount })}"),
 ("เลื่อนสเตจ", "{t(lang, \"board.moveStage\")}"),
 ("ลีดใหม่รอรับงานในหน้า ลีด", "{t(lang, \"board.claimFirst\")}"),
 ("ยังไม่มีลีดในสเตจนี้", "{t(lang, \"board.empty\")}"),
 ("ลีดใหม่", "{t(lang, \"leads.inbox\")}"),
 ("ติดต่อแล้ว", "{t(lang, \"stage.contacted\")}"),
 ("สนใจ", "{t(lang, \"stage.qualified\")}"),
 ("นัดดู", "{t(lang, \"stage.site_visit\")}"),
 ("เสนอราคา", "{t(lang, \"stage.proposal\")}"),
 ("ปิดการขาย", "{t(lang, \"stage.won\")}"),
], "export default function Board()",
   "export default function Board({ lang = \"th\" }: { lang?: Lang })")

# ---- UsersAdmin ----
conv("components/UsersAdmin.tsx", [
 ("เพิ่มผู้ใช้ใหม่", "{t(lang, \"users.addNew\")}"),
 ("สร้างผู้ใช้", "{t(lang, \"users.create\")}"),
 ("สร้างผู้ใช้แล้ว", "{t(lang, \"users.created\")}"),
 ("สร้างไม่สำเร็จ", "{t(lang, \"users.createFailed\")}"),
 ("รหัสผ่านเริ่มต้น", "{t(lang, \"users.initialPassword\")}"),
 ("อย่างน้อย 4 ตัว", "{t(lang, \"users.min4\")}"),
 ("สิทธิ์", "{t(lang, \"users.role\")}"),
 ("เปลี่ยนรหัส", "{t(lang, \"users.changePassword\")}"),
 ("บันทึกแล้ว", "{t(lang, \"users.saved\")}"),
 ("กำลังสร้าง...", "{t(lang, \"users.creating\")}"),
 ("ชื่อ-นามสกุล", "{t(lang, \"common.fullname\")}"),
 ("อีเมล", "{t(lang, \"common.email\")}"),
 ("พนักงานขาย", "{t(lang, \"role.sales\")}"),
 ("ผู้จัดการ", "{t(lang, \"role.manager\")}"),
 ("Ink Agent", "{t(lang, \"role.agent\")}"),
 ("ใช้งาน", "{t(lang, \"users.active\")}"),
], "export default function UsersAdmin({ users, meId }: { users: UserRow[]; meId: string })",
   "export default function UsersAdmin({ users, meId, lang = \"th\" }: { users: UserRow[]; meId: string; lang?: Lang })")

# ---- CalendarClient: months + strings ----
conv("components/CalendarClient.tsx", [
 ("const MONTHS = [\"มกราคม\", \"กุมภาพันธ์\", \"มีนาคม\", \"เมษายน\", \"พฤษภาคม\", \"มิถุนายน\", \"กรกฎาคม\", \"สิงหาคม\", \"กันยายน\", \"ตุลาคม\", \"พฤศจิกายน\", \"ธันวาคม\"];",
  "const MONTHS = (lang: Lang) => [\"common.month.jan\",\"common.month.feb\",\"common.month.mar\",\"common.month.apr\",\"common.month.may\",\"common.month.jun\",\"common.month.jul\",\"common.month.aug\",\"common.month.sep\",\"common.month.oct\",\"common.month.nov\",\"common.month.dec\"].map((k) => t(lang, k));"),
 ("MONTHS[", "MONTHS(lang)["),
 ("ทุกคน", "{t(lang, \"cal.ownerFilter.all\")}"),
 ("เฉพาะงานของฉัน", "{t(lang, \"cal.ownerFilter.me\")}"),
 ("รายการของวัน", "{t(lang, \"cal.dayList\")}"),
 ("เพิ่มนัดหมาย", "{t(lang, \"cal.addEvent\")}"),
 ("เลือกลีด", "{t(lang, \"cal.selectLead\")}"),
 ("เลือกลีดก่อน", "{t(lang, \"cal.selectLeadFirst\")}"),
 ("สถานที่ (นัดดู)", "{t(lang, \"cal.location\")}"),
 ("โน้ตเตือน", "{t(lang, \"cal.note\")}"),
 ("ยืนยันนัด", "{t(lang, \"cal.confirm\")}"),
 ("ยืนยันนัดแล้ว", "{t(lang, \"cal.confirmed\")}"),
 ("เสร็จแล้ว", "{t(lang, \"cal.done\")}"),
 ("เปิดงานใหม่", "{t(lang, \"cal.reopen\")}"),
 ("โทรหาลูกค้า", "{t(lang, \"cal.call\")}"),
 ("เปิดหน้าลีด", "{t(lang, \"cal.openLead\")}"),
 ("เปิดแผนที่", "{t(lang, \"cal.openMap\")}"),
 ("วันนี้ว่าง ไม่มีนัดหมาย", "{t(lang, \"cal.noEvents\")}"),
 ("ไม่มีนัดหมายวันนี้", "{t(lang, \"cal.noEventsDay\")}"),
 ("เพิ่มงานเรียบร้อย", "{t(lang, \"cal.added\")}"),
 ("เพิ่มไม่สำเร็จ", "{t(lang, \"cal.addFailed\")}"),
 ("ย้ายไม่สำเร็จ", "{t(lang, \"cal.moveFailed\")}"),
 ("กำลังโหลด...", "{t(lang, \"common.loading\")}"),
 ("โชว์รูม / ที่อยู่หน้างาน", "{t(lang, \"cal.visitPlace\")}"),
 ("ไม่ระบุชื่อ", "{t(lang, \"common.unknown\")}"),
 ("เลยกำหนด", "{t(lang, \"common.overdue\")}"),
 ("เพิ่มนัด", "{t(lang, \"cal.quickAdd\")}"),
 ("โทรติดตาม", "{t(lang, \"fu.type.call\")}"),
 ("นัดดู", "{t(lang, \"stage.site_visit\")}"),
 ("ส่งข้อเสนอ", "{t(lang, \"fu.type.proposal\")}"),
 ("เตือนตัวเอง", "{t(lang, \"fu.type.reminder\")}"),
 ("เจ้าของ", "{t(lang, \"common.owner\")}"),
], "export default function CalendarClient({ initialMonth }: { initialMonth: string })",
   "export default function CalendarClient({ initialMonth, lang = \"th\" }: { initialMonth: string; lang?: Lang })")

# ---- login page (client) ----
conv("app/login/page.tsx", [
 ("<h1 className=\"text-xl font-bold text-[#0F172A]\">Ink CRM</h1>", "<h1 className=\"text-xl font-bold text-[#0F172A]\">Ink CRM</h1>"),
 ("ทีมขายบ้านน็อคดาวน์ · ลงชื่อเข้าใช้ด้วยบัญชีทีม", "{t(lang, \"login.subtitle\")}"),
 ("ชื่อผู้ใช้ / อีเมล", "{t(lang, \"login.userLabel\")}"),
 ("รหัสผ่าน", "{t(lang, \"login.password\")}"),
 ("กำลังเข้า...", "{t(lang, \"login.busy\")}"),
 ("เข้าสู่ระบบ", "{t(lang, \"common.login\")}"),
 ("เข้าสู่ระบบด้วย Google", "{t(lang, \"login.google\")}"),
 ("หรือ", "{t(lang, \"login.or\")}"),
 ("เฉพาะทีม Ink Homes · บัญชี Google ต้องได้รับอนุญาตจากผู้จัดการ", "{t(lang, \"login.footer\")}"),
], None, None)

print("PASS 3B DONE")

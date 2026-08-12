#!/usr/bin/env python3
"""Pass 2: convert remaining Thai UI strings in pages to t(lang, key)."""
import re

ROOT = "/opt/data/ink-crm/src"

def conv(f, reps):
    p = f"{ROOT}/{f}"
    src = open(p, encoding="utf-8").read()
    n = 0
    for old, new in reps:
        if old in src:
            src = src.replace(old, new)
            n += 1
        else:
            print(f"  MISS {f}: {old[:50]}")
    open(p, "w", encoding="utf-8").write(src)
    print(f"{f}: {n} ok")

# ---------------- dashboard ----------------
conv("app/dashboard/page.tsx", [
 ("<h1 className=\"text-2xl font-bold text-[#0F172A]\">แดชบอร์ด</h1>", "<h1 className=\"text-2xl font-bold text-[#0F172A]\">{t(lang, \"dash.title\")}</h1>"),
 ("ลีดใหม่ 14 วัน", "{t(lang, \"dash.newLeads14d\")}"),
 ("ติดตามค้าง", "{t(lang, \"dash.openFups\")}"),
 ("ลีดในกล่อง", "{t(lang, \"dash.inbox\")}"),
 ("ติดต่อแล้ว", "{t(lang, \"dash.contacted\")}"),
 ("สนใจ", "{t(lang, \"dash.qualified\")}"),
 ("นัดดู", "{t(lang, \"dash.visits\")}"),
 ("ลีดที่พร้อมปิด", "{t(lang, \"dash.readyToClose\")}"),
 ("ปิดการขายสัปดาห์นี้", "{t(lang, \"dash.wonWeek\")}"),
 ("รายครบกำหนดวันนี้", "{t(lang, \"dash.dueToday\")}"),
 ("เทียบสัปดาห์ก่อน", "{t(lang, \"dash.vsLastWeek\")}"),
 ("กิจกรรมวันนี้", "{t(lang, \"dash.activity\")}"),
 ("ภาระงานต่อคน", "{t(lang, \"dash.workload\")}"),
 ("ยังไม่มีทีม", "{t(lang, \"dash.noWorkload\")}"),
 ("ยังไม่มีลีด", "{t(lang, \"dash.noLeads\")}"),
 ("ยังไม่มีข้อมูลลีดรายวัน", "{t(lang, \"dash.noDaily\")}"),
 ("ลีดล่าสุด", "{t(lang, \"dash.latestLeads\")}"),
 ("ปิดงานติดตาม", "{t(lang, \"dash.closeFup\")}"),
 ("รับงานจากกล่องลีดใหม่ก่อน", "{t(lang, \"dash.claimFirst\")}"),
 ("สัปดาห์แรก", "{t(lang, \"dash.firstWeek\")}"),
 ("ฟันเนล", "{t(lang, \"dash.funnel\")}"),
 ("ไปป์ไลน์", "{t(lang, \"dash.pipeline\")}"),
 ("ไม่ผ่าน", "{t(lang, \"stage.unqualified\")}"),
 ("แหล่งที่มา", "{t(lang, \"common.source\")}"),
])

# ---------------- leads list ----------------
conv("app/leads/page.tsx", [
 ("ลีดใหม่", "{t(lang, \"leads.inbox\")}"),
 ("ทั้งหมด", "{t(lang, \"leads.all\")}"),
 ("ค้นชื่อ / เบอร์", "{t(lang, \"leads.search\")}"),
 ("ยังไม่มีลีดใน", "{t(lang, \"leads.empty\")}"),
 ("ไม่พบลีด", "{t(lang, \"leads.notFound\")}"),
 ("ลองเปลี่ยนคำค้น หรือเพิ่มลีดใหม่", "{t(lang, \"leads.trySearch\")}"),
 ("ลีดจากเว็บและ", "{t(lang, \"leads.inboxHint\")}"),
 ("ไม่มีลีดรอรับงาน", "{t(lang, \"leads.inboxEmpty\")}"),
 ("ทุกสเตจ", "{t(lang, \"leads.all\")}"),
 ("เพิ่มลีด", "{t(lang, \"leads.new.title\")}"),
 ("<th>ชื่อ</th><th>เบอร์</th><th>สเตจ</th>", "<th>{t(lang, \"common.name\")}</th><th>{t(lang, \"common.phone\")}</th><th>{t(lang, \"common.stage\")}</th>"),
])

# ---------------- leads new ----------------
conv("app/leads/new/page.tsx", [
 ("เพิ่มลีดด้วยมือ ลีดจะเข้ากล่องรอรับงานก่อนเข้าบอร์ด", "{t(lang, \"leads.new.hint\")}"),
 ("เพิ่มลีด", "{t(lang, \"leads.new.title\")}"),
 ("ชื่อลูกค้า", "{t(lang, \"leads.new.customerName\")}"),
 ("เบอร์โทร", "{t(lang, \"common.phone\")}"),
 ("ประเภทโครงการ", "{t(lang, \"leads.new.project\")}"),
 ("จังหวัด", "{t(lang, \"common.province\")}"),
 ("บันทึกลีด", "{t(lang, \"leads.new.save\")}"),
 ("เพิ่มลีดเรียบร้อย", "{t(lang, \"leads.new.saved\")}"),
 ("เกิดข้อผิดพลาด", "{t(lang, \"common.error\")}"),
 ("กำลังบันทึก...", "{t(lang, \"common.saving\")}"),
 ("กรุงเทพฯ", "{t(lang, \"leads.new.bangkok\")}"),
 ("เว็บไซต์", "{t(lang, \"src.WEBSITE\")}"),
])

# ---------------- leads detail ----------------
conv("app/leads/[id]/page.tsx", [
 ("ข้อมูลลีด", "{t(lang, \"leads.detail.title\")}"),
 ("โอกาสปิด", "{t(lang, \"leads.detail.probability\")}"),
 ("ขั้นตอนถัดไป", "{t(lang, \"common.nextAction\")}"),
 ("ไม่มีเจ้าของ", "{t(lang, \"common.noOwner\")}"),
 ("ประวัติการติดต่อ", "{t(lang, \"leads.detail.contactLog\")}"),
 ("ยังไม่มีประวัติ", "{t(lang, \"common.noHistory\")}"),
 ("นัดติดตาม", "{t(lang, \"leads.detail.followups\")}"),
 ("ไม่มีรายการติดตาม", "{t(lang, \"leads.detail.noFollowups\")}"),
 ("รับงาน", "{t(lang, \"leads.detail.claim\")}"),
 ("โอนเจ้าของ", "{t(lang, \"leads.detail.transfer\")}"),
 ("บันทึกการติดต่อ", "{t(lang, \"log.title\")}"),
])

# ---------------- followups ----------------
conv("app/followups/page.tsx", [
 ("รายการติดตามทั้งหมด", "{t(lang, \"fu.listTitle\")}"),
])

# ---------------- contacts ----------------
conv("app/contacts/page.tsx", [
 ("คอนแทกต์", "{t(lang, \"contacts.title\")}"),
 ("ไม่พบคอนแทกต์", "{t(lang, \"contacts.notFound\")}"),
 ("แหล่งแรก", "{t(lang, \"contacts.firstSource\")}"),
 ("สเตจล่าสุด", "{t(lang, \"contacts.lastStage\")}"),
 ("ลูกค้า (", "{t(lang, \"contacts.linked\")}"),
 ("ด้วยเบอร์)", "{t(lang, \"contacts.byPhone\")}"),
])

# ---------------- board page ----------------
conv("app/board/page.tsx", [
 ("ลากการ์ดเพื่อเปลี่ยนสเตจ", "{t(lang, \"board.dragHint\")}"),
])

# ---------------- calendar page ----------------
conv("app/calendar/page.tsx", [
 ("ปฏิทิน", "{t(lang, \"cal.title\")}"),
])

# ---------------- admin/users page ----------------
conv("app/admin/users/page.tsx", [
 ("ตั้งค่า", "{t(lang, \"users.title\")}"),
 ("สร้าง แก้ไขสิทธิ์ ปิดบัญชี และตั้งรหัสผ่าน", "{t(lang, \"users.subtitle\")}"),
])

print("PASS 2 DONE")

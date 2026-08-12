// Lightweight i18n: Thai default, English toggle. Language stored in a `lang` cookie.
// Server components: const lang = await getServerLang();  Client: pass lang as prop.
import { cookies } from "next/headers";

export type Lang = "th" | "en";

export const LANGS: Lang[] = ["th", "en"];

type Entry = { th: string; en: string };

const D = {
  // nav / chrome
  "nav.today": { th: "วันนี้", en: "Today" },
  "nav.leads": { th: "ลีด", en: "Leads" },
  "nav.board": { th: "บอร์ด", en: "Board" },
  "nav.calendar": { th: "ปฏิทิน", en: "Calendar" },
  "nav.add": { th: "เพิ่ม", en: "Add" },
  "nav.settings": { th: "ตั้งค่า", en: "Settings" },
  "nav.dashboard": { th: "แดชบอร์ด", en: "Dashboard" },
  "nav.contacts": { th: "คอนแทกต์", en: "Contacts" },
  "nav.followups": { th: "ติดตาม", en: "Follow-ups" },
  "sidebar.subtitle": { th: "ทีมขายบ้านน็อคดาวน์", en: "Prefab home sales team" },
  "nav.logout": { th: "ออก", en: "Logout" },
  "nav.logout.full": { th: "ออกจากระบบ", en: "Log out" },
  "role.manager": { th: "ผู้จัดการ", en: "Manager" },
  "role.sales": { th: "พนักงานขาย", en: "Sales" },
  "role.agent": { th: "Ink Agent", en: "Ink Agent" },
  "common.login": { th: "เข้าสู่ระบบ", en: "Sign in" },
  "common.save": { th: "บันทึก", en: "Save" },
  "common.cancel": { th: "ยกเลิก", en: "Cancel" },
  "common.add": { th: "เพิ่ม", en: "Add" },
  "common.all": { th: "ทั้งหมด", en: "All" },
  "common.search": { th: "ค้นหา", en: "Search" },
  "common.none": { th: "—", en: "—" },
  "common.close": { th: "ปิด", en: "Close" },
  "common.viewAll": { th: "ดูทั้งหมด", en: "View all" },
  "common.owner": { th: "เจ้าของ", en: "Owner" },
  "common.noOwner": { th: "ไม่มีเจ้าของ", en: "Unassigned" },
  "common.note": { th: "หมายเหตุ", en: "Note" },
  "common.due": { th: "ครบกำหนด", en: "Due" },
  "common.overdue": { th: "เลยกำหนด", en: "Overdue" },
  "common.today": { th: "วันนี้", en: "Today" },
  "common.thisWeek": { th: "สัปดาห์นี้", en: "This week" },
  "common.source": { th: "แหล่งที่มา", en: "Source" },
  "common.province": { th: "จังหวัด", en: "Province" },
  "common.phone": { th: "เบอร์โทร", en: "Phone" },
  "common.email": { th: "อีเมล", en: "Email" },
  "common.name": { th: "ชื่อ", en: "Name" },
  "common.fullname": { th: "ชื่อ-นามสกุล", en: "Full name" },
  "common.interest": { th: "ประเภทโครงการ", en: "Project type" },
  "common.stage": { th: "สเตจ", en: "Stage" },
  "common.priority": { th: "ความสำคัญ", en: "Priority" },
  "common.priority.high": { th: "สูง", en: "High" },
  "common.priority.medium": { th: "กลาง", en: "Medium" },
  "common.priority.low": { th: "ต่ำ", en: "Low" },
  "common.priority.urgent": { th: "ด่วน", en: "Urgent" },
  "common.unknown": { th: "ไม่ระบุชื่อ", en: "Unknown" },
  "common.nextAction": { th: "ขั้นตอนถัดไป", en: "Next step" },
  "common.updated": { th: "อัปเดตล่าสุด", en: "Updated" },
  "common.history": { th: "ประวัติการติดต่อ", en: "Contact history" },
  "common.noHistory": { th: "ยังไม่มีประวัติ", en: "No history yet" },
  "common.noData": { th: "ยังไม่มีข้อมูล", en: "No data" },
  "common.loading": { th: "กำลังโหลด...", en: "Loading…" },
  "common.error": { th: "เกิดข้อผิดพลาด", en: "Something went wrong" },
  "common.saving": { th: "กำลังบันทึก...", en: "Saving…" },
  "common.month.jan": { th: "มกราคม", en: "January" },
  "common.month.feb": { th: "กุมภาพันธ์", en: "February" },
  "common.month.mar": { th: "มีนาคม", en: "March" },
  "common.month.apr": { th: "เมษายน", en: "April" },
  "common.month.may": { th: "พฤษภาคม", en: "May" },
  "common.month.jun": { th: "มิถุนายน", en: "June" },
  "common.month.jul": { th: "กรกฎาคม", en: "July" },
  "common.month.aug": { th: "สิงหาคม", en: "August" },
  "common.month.sep": { th: "กันยายน", en: "September" },
  "common.month.oct": { th: "ตุลาคม", en: "October" },
  "common.month.nov": { th: "พฤศจิกายน", en: "November" },
  "common.month.dec": { th: "ธันวาคม", en: "December" },

  // login
  "login.title": { th: "Ink CRM", en: "Ink CRM" },
  "login.subtitle": { th: "ทีมขายบ้านน็อคดาวน์ · ลงชื่อเข้าใช้ด้วยบัญชีทีม", en: "Prefab home sales · Sign in with your team account" },
  "login.userLabel": { th: "ชื่อผู้ใช้ / อีเมล", en: "Username / Email" },
  "login.password": { th: "รหัสผ่าน", en: "Password" },
  "login.busy": { th: "กำลังเข้า...", en: "Signing in…" },
  "login.google": { th: "เข้าสู่ระบบด้วย Google", en: "Sign in with Google" },
  "login.or": { th: "หรือ", en: "or" },
  "login.footer": { th: "เฉพาะทีม Ink Homes · บัญชี Google ต้องได้รับอนุญาตจากผู้จัดการ", en: "Ink Homes team only · Google accounts need manager approval" },

  // today page
  "today.title": { th: "วันนี้", en: "Today" },
  "today.dueToday": { th: "ติดตามที่ครบกำหนดวันนี้", en: "Follow-ups due today" },
  "today.noDue": { th: "ไม่มีติดตามค้างวันนี้", en: "Nothing due today" },
  "today.newToday": { th: "ลีดใหม่วันนี้", en: "New leads today" },
  "today.noNew": { th: "ยังไม่มีลีดใหม่วันนี้", en: "No new leads today" },
  "today.claimQueue": { th: "ลีดรอรับงาน", en: "Leads to claim" },
  "today.claim": { th: "ไปรับงาน", en: "Claim" },
  "today.allLeads": { th: "ลีดทั้งหมด", en: "All leads" },
  "today.contacts": { th: "คอนแทกต์", en: "Contacts" },
  "today.followups": { th: "ติดตามค้าง", en: "Open follow-ups" },
  "today.owner": { th: "เจ้าของ", en: "Owner" },

  // dashboard
  "dash.title": { th: "แดชบอร์ด", en: "Dashboard" },
  "dash.overview": { th: "ภาพรวม CRM วันนี้", en: "CRM overview today" },
  "dash.contactsDb": { th: "ฐานข้อมูลลูกค้า", en: "Customer database" },
  "dash.allLeads": { th: "ลีดทั้งหมด", en: "All leads" },
  "dash.newLeads14d": { th: "ลีดใหม่ 14 วัน", en: "New leads · 14d" },
  "dash.openFups": { th: "ติดตามค้าง", en: "Open follow-ups" },
  "dash.inbox": { th: "ลีดในกล่อง", en: "Inbox leads" },
  "dash.contacted": { th: "ติดต่อแล้ว", en: "Contacted" },
  "dash.qualified": { th: "สนใจ", en: "Qualified" },
  "dash.visits": { th: "นัดดู", en: "Site visits" },
  "dash.readyToClose": { th: "ลีดที่พร้อมปิด", en: "Ready to close" },
  "dash.wonWeek": { th: "ปิดการขายสัปดาห์นี้", en: "Won this week" },
  "dash.dueToday": { th: "รายครบกำหนดวันนี้", en: "Due today" },
  "dash.vsLastWeek": { th: "เทียบสัปดาห์ก่อน", en: "vs last week" },
  "dash.activity": { th: "กิจกรรมวันนี้", en: "Today's activity" },
  "dash.workload": { th: "ภาระงานต่อคน", en: "Workload by person" },
  "dash.noWorkload": { th: "ยังไม่มีทีม", en: "No team yet" },
  "dash.noLeads": { th: "ยังไม่มีลีด", en: "No leads yet" },
  "dash.noDaily": { th: "ยังไม่มีข้อมูลลีดรายวัน", en: "No daily lead data" },
  "dash.latestLeads": { th: "ลีดล่าสุด", en: "Latest leads" },
  "dash.funnel": { th: "ฟันเนล", en: "Funnel" },
  "dash.pipeline": { th: "ไปป์ไลน์", en: "Pipeline" },
  "dash.closeFup": { th: "ปิดงานติดตาม", en: "Complete follow-up" },
  "dash.claimFirst": { th: "รับงานจากกล่องลีดใหม่ก่อน", en: "Claim leads from the inbox first" },
  "dash.firstWeek": { th: "สัปดาห์แรก", en: "First week" },

  // leads
  "leads.title": { th: "ลีด", en: "Leads" },
  "leads.subtitle": { th: "กล่องลีดใหม่ และรายการทั้งหมด", en: "Inbox and all leads" },
  "leads.filter": { th: "กรอง", en: "Filter" },
  "leads.inbox": { th: "ลีดใหม่", en: "Inbox" },
  "leads.all": { th: "ทั้งหมด", en: "All" },
  "leads.search": { th: "ค้นชื่อ / เบอร์", en: "Search name / phone" },
  "leads.empty": { th: "ยังไม่มีลีดในรายการนี้", en: "No leads here yet" },
  "leads.notFound": { th: "ไม่พบลีด", en: "No leads found" },
  "leads.trySearch": { th: "ลองเปลี่ยนคำค้น หรือเพิ่มลีดใหม่", en: "Try a different search or add a new lead" },
  "leads.inboxHint": { th: "ลีดจากเว็บและ Facebook จะมารวมที่นี่ รอรับงานเข้าบอร์ด", en: "Web & Facebook leads collect here — claim them to start working" },
  "leads.inboxEmpty": { th: "ไม่มีลีดรอรับงาน", en: "No leads waiting" },
  "leads.new.title": { th: "เพิ่มลีด", en: "New lead" },
  "leads.new.hint": { th: "เพิ่มลีดด้วยมือ ลีดจะเข้ากล่องรอรับงานก่อนเข้าบอร์ด", en: "Manual leads land in the inbox before the board" },
  "leads.new.customerName": { th: "ชื่อลูกค้า", en: "Customer name" },
  "leads.new.project": { th: "ประเภทโครงการ", en: "Project type" },
  "leads.new.save": { th: "บันทึกลีด", en: "Save lead" },
  "leads.new.saved": { th: "เพิ่มลีดเรียบร้อย", en: "Lead added" },
  "leads.detail.title": { th: "ข้อมูลลีด", en: "Lead details" },
  "leads.detail.probability": { th: "โอกาสปิด", en: "Close probability" },
  "leads.detail.conversations": { th: "บันทึกการติดต่อ", en: "Log conversation" },
  "leads.detail.contactLog": { th: "ประวัติการติดต่อ", en: "Contact history" },
  "leads.detail.followups": { th: "นัดติดตาม", en: "Follow-ups" },
  "leads.detail.noFollowups": { th: "ไม่มีรายการติดตาม", en: "No follow-ups" },
  "leads.detail.claim": { th: "รับงาน", en: "Claim" },
  "leads.detail.transfer": { th: "โอนเจ้าของ", en: "Transfer" },

  // board
  "board.title": { th: "บอร์ด", en: "Board" },
  "board.dragHint": { th: "ลากการ์ดเพื่อเปลี่ยนสเตจ", en: "Drag cards to change stage" },
  "board.ownedOnly": { th: "บอร์ดแสดงเฉพาะลีดที่มีเจ้าของ", en: "Board shows claimed leads only" },
  "board.claimQueue": { th: "ลีดใหม่ในกล่อง {n} ราย รับงานก่อนลีดถึงจะเข้าบอร์ด", en: "{n} leads in the inbox — claim them to start working" },
  "board.empty": { th: "ยังไม่มีลีดในสเตจนี้", en: "No leads in this stage" },
  "board.moveStage": { th: "เลื่อนสเตจ", en: "Move stage" },
  "board.claimFirst": { th: "ลีดใหม่รอรับงานในหน้า ลีด", en: "New leads wait in the Leads page" },

  // calendar
  "cal.title": { th: "ปฏิทิน", en: "Calendar" },
  "cal.ownerFilter.all": { th: "ทุกคน", en: "Everyone" },
  "cal.ownerFilter.me": { th: "เฉพาะงานของฉัน", en: "Only mine" },
  "cal.dayList": { th: "รายการของวัน", en: "Day's schedule" },
  "cal.addEvent": { th: "เพิ่มนัดหมาย", en: "Add appointment" },
  "cal.quickAdd": { th: "เพิ่มนัด", en: "Add appointment" },
  "cal.selectLead": { th: "เลือกลีด", en: "Select lead" },
  "cal.selectLeadFirst": { th: "เลือกลีดก่อน", en: "Select a lead first" },
  "cal.location": { th: "สถานที่ (นัดดู)", en: "Location (visit)" },
  "cal.note": { th: "โน้ตเตือน", en: "Reminder note" },
  "cal.confirm": { th: "ยืนยันนัด", en: "Confirm visit" },
  "cal.confirmed": { th: "ยืนยันนัดแล้ว", en: "Visit confirmed" },
  "cal.done": { th: "เสร็จแล้ว", en: "Done" },
  "cal.reopen": { th: "เปิดงานใหม่", en: "Reopen" },
  "cal.call": { th: "โทรหาลูกค้า", en: "Call customer" },
  "cal.openLead": { th: "เปิดหน้าลีด", en: "Open lead" },
  "cal.openMap": { th: "เปิดแผนที่", en: "Open map" },
  "cal.noEvents": { th: "วันนี้ว่าง ไม่มีนัดหมาย", en: "Free day — no appointments" },
  "cal.noEventsDay": { th: "ไม่มีนัดหมายวันนี้", en: "No appointments today" },
  "cal.added": { th: "เพิ่มงานเรียบร้อย", en: "Appointment added" },
  "cal.addFailed": { th: "เพิ่มไม่สำเร็จ", en: "Could not add" },
  "cal.moveFailed": { th: "ย้ายไม่สำเร็จ", en: "Could not move" },
  "cal.movedTo": { th: "ย้ายไป", en: "Moved to" },
  "cal.allDay": { th: "ทั้งวัน", en: "All day" },
  "cal.followup": { th: "ติดตาม", en: "Follow-up" },
  "cal.visitPlace": { th: "โชว์รูม / ที่อยู่หน้างาน", en: "Showroom / site address" },

  // users admin
  "users.title": { th: "ตั้งค่า", en: "Settings" },
  "users.subtitle": { th: "สร้าง แก้ไขสิทธิ์ ปิดบัญชี และตั้งรหัสผ่าน", en: "Create, manage roles, deactivate accounts & reset passwords" },
  "users.addNew": { th: "เพิ่มผู้ใช้ใหม่", en: "Add new user" },
  "users.create": { th: "สร้างผู้ใช้", en: "Create user" },
  "users.created": { th: "สร้างผู้ใช้แล้ว", en: "User created" },
  "users.createFailed": { th: "สร้างไม่สำเร็จ", en: "Could not create" },
  "users.initialPassword": { th: "รหัสผ่านเริ่มต้น", en: "Initial password" },
  "users.min4": { th: "อย่างน้อย 4 ตัว", en: "At least 4 characters" },
  "users.role": { th: "สิทธิ์", en: "Role" },
  "users.changePassword": { th: "เปลี่ยนรหัส", en: "Change password" },
  "users.saved": { th: "บันทึกแล้ว", en: "Saved" },
  "users.active": { th: "ใช้งาน", en: "Active" },
  "users.creating": { th: "กำลังสร้าง...", en: "Creating…" },

  // follow-ups / visit / log
  "fu.add": { th: "เพิ่มนัดติดตาม", en: "Add follow-up" },
  "fu.type.call": { th: "โทรติดตาม", en: "Call" },
  "fu.type.visit": { th: "นัดดูโชว์รูม", en: "Showroom visit" },
  "fu.type.land": { th: "นัดดูที่ดิน", en: "Land visit" },
  "fu.type.proposal": { th: "ส่งข้อเสนอ", en: "Send proposal" },
  "fu.type.reminder": { th: "เตือนตัวเอง", en: "Self reminder" },
  "fu.remind": { th: "เตือนตัวเอง", en: "Remind me" },
  "fu.saveFailed": { th: "บันทึกไม่สำเร็จ", en: "Could not save" },
  "log.title": { th: "บันทึกการติดต่อ", en: "Log conversation" },
  "log.summary": { th: "คุยอะไรไปบ้าง", en: "What was discussed" },
  "log.channel": { th: "ช่องทาง", en: "Channel" },
  "log.outcome": { th: "ผลลัพธ์", en: "Outcome" },
  "log.hint": { th: "เช่น สนใจ, ขอดูราคา", en: "e.g. interested, wants a quote" },
  "log.nextHint": { th: "เช่น นัดดูโชว์รูม", en: "e.g. book a showroom visit" },
  "log.form": { th: "ฟอร์มเว็บ", en: "Web form" },
  "log.noContact": { th: "ยังไม่มีคอนแทกต์ให้ลงบันทึก", en: "No contact to log against" },
  "visit.title": { th: "นัดดูหน้างาน", en: "Schedule visit" },
  "visit.save": { th: "บันทึกนัด", en: "Save visit" },
  "visit.placeHint": { th: "สถานที่นัด / เตือนตัวเอง", en: "Visit location / note" },

  // contacts
  "contacts.title": { th: "คอนแทกต์", en: "Contacts" },
  "contacts.notFound": { th: "ไม่พบคอนแทกต์", en: "No contacts found" },
  "contacts.linked": { th: "ลูกค้า (", en: "Linked leads (" },
  "contacts.firstSource": { th: "แหล่งแรก", en: "First source" },
  "contacts.lastStage": { th: "สเตจล่าสุด", en: "Latest stage" },
  "contacts.byPhone": { th: "ด้วยเบอร์)", en: "by phone)" },

  // stages (full)
  "stage.new": { th: "ใหม่", en: "New" },
  "stage.contacted": { th: "ติดต่อแล้ว", en: "Contacted" },
  "stage.qualified": { th: "สนใจ", en: "Interested" },
  "stage.site_visit": { th: "นัดดู", en: "Site visit" },
  "stage.proposal": { th: "เสนอราคา", en: "Proposal" },
  "stage.won": { th: "ปิดการขาย", en: "Won" },
  "stage.unqualified": { th: "ไม่ผ่าน", en: "Not qualified" },
  "stage.lost": { th: "หลุด", en: "Lost" },
  "stage.duplicate": { th: "ซ้ำ", en: "Duplicate" },
  "stage.no_answer": { th: "ไม่ตอบ", en: "No answer" },

  // sources
  "src.FACEBOOK": { th: "Facebook", en: "Facebook" },
  "src.WEBSITE": { th: "เว็บไซต์", en: "Website" },
  "src.LINE": { th: "LINE", en: "LINE" },
  "src.CALL": { th: "โทร", en: "Call" },
  "src.OTHER": { th: "อื่นๆ", en: "Other" },

  // channels
  "ch.PHONE": { th: "โทร", en: "Phone" },
  "ch.LINE": { th: "LINE", en: "LINE" },
  "ch.MESSENGER": { th: "Messenger", en: "Messenger" },
  "ch.WHATSAPP": { th: "WhatsApp", en: "WhatsApp" },
  "ch.EMAIL": { th: "อีเมล", en: "Email" },
  "ch.SITE_FORM": { th: "ฟอร์มเว็บ", en: "Web form" },
  "ch.OTHER": { th: "อื่นๆ", en: "Other" },
} as const;

export type Key = keyof typeof D;

export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const e = (D as Record<string, Entry>)[key];
  if (!e) return key;
  let s = e[lang] ?? e.th;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

// Server-side: read the lang cookie.
export async function getServerLang(): Promise<Lang> {
  try {
    const jar = await cookies();
    return jar.get("lang")?.value === "en" ? "en" : "th";
  } catch {
    return "th";
  }
}

// Client-side: read the lang cookie (for client components without a prop).
export function getClientLang(): Lang {
  if (typeof document === "undefined") return "th";
  return document.cookie.split(";").some((c) => c.trim().startsWith("lang=en")) ? "en" : "th";
}

export function setLangCookie(lang: Lang): void {
  document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`;
}

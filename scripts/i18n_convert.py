#!/usr/bin/env python3
"""Apply i18n conversions to Ink CRM pages/components (exact string replaces)."""
import re, sys

ROOT = "/opt/data/ink-crm/src"

# (file, [(old, new), ...]) — new strings use {t} markers resolved below
FILES = {
 "app/page.tsx": [
  ("import { thDate } from \"@/lib/labels\";", "import { thDate } from \"@/lib/labels\";\nimport { getServerLang, t } from \"@/lib/i18n\";"),
  ("export default async function TodayPage() {\n  const today", "export default async function TodayPage() {\n  const lang = await getServerLang();\n  const today"),
  ("<h1 className=\"text-2xl font-bold text-[#0F172A]\">วันนี้</h1>", "<h1 className=\"text-2xl font-bold text-[#0F172A]\">{t(lang, \"today.title\")}</h1>"),
  ("{thDate(new Date().toISOString())}", "{thDate(new Date().toISOString(), lang)}"),
  ("<div className=\"kpi-label\">ติดตามที่ครบกำหนดวันนี้</div>", "<div className=\"kpi-label\">{t(lang, \"today.dueToday\")}</div>"),
  ("<div className=\"kpi-label\">ลีดใหม่วันนี้</div>", "<div className=\"kpi-label\">{t(lang, \"today.newToday\")}</div>"),
  ("<div className=\"kpi-label\">รอรับงาน</div>", "<div className=\"kpi-label\">{t(lang, \"today.claimQueue\")}</div>"),
  ("<div className=\"kpi-label\">ลีดทั้งหมด</div>", "<div className=\"kpi-label\">{t(lang, \"today.allLeads\")}</div>"),
  ("<h2 className=\"text-lg font-semibold text-[#0F172A]\">ลีดรอรับงาน</h2>", "<h2 className=\"text-lg font-semibold text-[#0F172A]\">{t(lang, \"today.claimQueue\")}</h2>"),
  (">ดูทั้งหมด</Link>", ">{t(lang, \"common.viewAll\")}</Link>"),
  ("<h2 className=\"text-lg font-semibold text-[#0F172A] mb-3\">ติดตามครบกำหนด</h2>", "<h2 className=\"text-lg font-semibold text-[#0F172A] mb-3\">{t(lang, \"today.dueToday\")}</h2>"),
  ("<tr><th>คอนแทกต์</th><th>เบอร์</th><th>สเตจ</th><th>ครบกำหนด</th><th>เจ้าของ</th><th>หมายเหตุ</th></tr>",
   "<tr><th>{t(lang, \"today.contacts\")}</th><th>{t(lang, \"common.phone\")}</th><th>{t(lang, \"common.stage\")}</th><th>{t(lang, \"common.due\")}</th><th>{t(lang, \"common.owner\")}</th><th>{t(lang, \"common.note\")}</th></tr>"),
  (">ไม่มีติดตามค้างวันนี้</td>", ">{t(lang, \"today.noDue\")}</td>"),
  ("{thDate(fu.due_date)}", "{thDate(fu.due_date, lang)}"),
  ("<h2 className=\"text-lg font-semibold text-[#0F172A] mb-3\">ลีดใหม่วันนี้</h2>", "<h2 className=\"text-lg font-semibold text-[#0F172A] mb-3\">{t(lang, \"today.newToday\")}</h2>"),
  ("<tr><th>ชื่อ</th><th>เบอร์</th><th>สเตจ</th><th>เวลา</th></tr>", "<tr><th>{t(lang, \"common.name\")}</th><th>{t(lang, \"common.phone\")}</th><th>{t(lang, \"common.stage\")}</th><th>{t(lang, \"common.due\")}</th></tr>"),
  (">ยังไม่มีลีดใหม่วันนี้</td>", ">{t(lang, \"today.noNew\")}</td>"),
  ("{thDate(l.lead_date)}", "{thDate(l.lead_date, lang)}"),
 ],
 "app/leads/page.tsx": [
  ("import { SOURCE_LABELS } from \"@/lib/labels\";", "import { sourceLabel } from \"@/lib/labels\";\nimport { getServerLang, t } from \"@/lib/i18n\";"),
  ("export default async function LeadsPage", "export default async function LeadsPage"),
  ("{SOURCE_LABELS[l.source] ?? l.source}", "{sourceLabel(lang, l.source)}"),
 ],
 "app/leads/[id]/page.tsx": [
  ("import { thDate, SOURCE_LABELS } from \"@/lib/labels\";", "import { thDate, sourceLabel } from \"@/lib/labels\";\nimport { getServerLang, t } from \"@/lib/i18n\";"),
  ("{SOURCE_LABELS[lead.source] ?? lead.source}", "{sourceLabel(lang, lead.source)}"),
  ("{thDate(lead.lead_date)}", "{thDate(lead.lead_date, lang)}"),
  ("{thDate(fu.due_date)}", "{thDate(fu.due_date, lang)}"),
 ],
 "app/followups/page.tsx": [
  ("import { thDate } from \"@/lib/labels\";", "import { thDate } from \"@/lib/labels\";\nimport { getServerLang, t } from \"@/lib/i18n\";"),
  ("{thDate(fu.due_date)}", "{thDate(fu.due_date, lang)}"),
 ],
 "app/contacts/page.tsx": [
  ("import { thDate } from \"@/lib/labels\";", "import { thDate } from \"@/lib/labels\";\nimport { getServerLang, t } from \"@/lib/i18n\";"),
  ("{thDate(c.updated_at)}", "{thDate(c.updated_at, lang)}"),
 ],
}

for f, reps in FILES.items():
    p = f"{ROOT}/{f}"
    src = open(p, encoding="utf-8").read()
    n = 0
    for old, new in reps:
        if old in src:
            src = src.replace(old, new)
            n += 1
    # add lang plumbing where missing (after the function signature line if lang not present)
    if "getServerLang" in src and "const lang = await getServerLang()" not in src:
        # insert after the first "export default async function" line
        src = re.sub(r"(export default async function \w+\(\) \{\n)",
                     r"\1  const lang = await getServerLang();\n", src, count=1)
    open(p, "w", encoding="utf-8").write(src)
    print(f"{f}: {n} replaces")

# dashboard has its own local STAGE_LABELS — handle separately
p = f"{ROOT}/app/dashboard/page.tsx"
src = open(p, encoding="utf-8").read()
src = src.replace('import { SOURCE_LABELS } from "@/lib/labels";', 'import { sourceLabel, stageLabel } from "@/lib/labels";\nimport { getServerLang, t } from "@/lib/i18n";')
src = re.sub(r"const STAGE_LABELS: Record<string, string> = \{[^}]*\};\n", "", src, flags=re.S)
src = src.replace("{STAGE_LABELS[s]}", "{stageLabel(lang, s)}")
src = src.replace("{SOURCE_LABELS[src] ?? src}", "{sourceLabel(lang, src)}")
src = src.replace("{SOURCE_LABELS[l.source] ?? l.source}", "{sourceLabel(lang, l.source)}")
src = re.sub(r"(export default async function \w+\(\) \{\n)", r"\1  const lang = await getServerLang();\n", src, count=1)
open(p, "w", encoding="utf-8").write(src)
print("app/dashboard/page.tsx: handled")

print("DONE")

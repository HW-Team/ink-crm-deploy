# Ink CRM — Product Improvement Plan (v2: "make all functions ready")

Status: PLANNING → BUILD · Owner: Rook (with CZ) · Source: CZ directive Aug 11 2026
"far from finish — dashboard needs polishing, new leads should be manually added not auto-populated on kanban, calendar needs proper calendar functions. research & make this a well-developed app."

---

## 1. Vision

A proper sales CRM for a knockdown-home builder — modeled on standard industry patterns
(Pipedrive lead-inbox→pipeline, HubSpot funnel dashboard + activity, Zoho calendar semantics),
but tuned for Thai sales staff on mobile + the Ink agent as a first-class member.

**Principles**
- Every lead has a lifecycle: **Inbox (ลีดใหม่) → Pipeline (ติดต่อแล้ว → ปิดการขาย) → Done**
- No data enters the pipeline automatically — intake is always a human (or agent) REVIEW action
- Dashboard answers: "เท่าไหร่ / อยู่ตรงไหน / ใครทำอะไร / จะปิดเมื่อไหร่" — numbers AND money
- Calendar is a working tool: create, reschedule, see at-a-glance — not a read-only list
- One API path for UI + agent; agent writes visible instantly
- DESIGN.md tokens + WCAG AA everywhere; mobile bottom-nav for field sales

---

## 2. Current state inventory (live Aug 11 2026)

| Area | State | Gap |
|---|---|---|
| Auth (user/pass + session) | ✅ works | Google OAuth pending creds; user mgmt (admin add/disable) missing |
| Leads list + filters + manual add form | ✅ works | no inbox/review split; no bulk; no full edit on detail |
| Lead detail (log, follow-up, transfer, claim) | ✅ works | no full edit; no do-not-contact; no deal value edit in UI |
| Kanban (drag) | ✅ works | **unowned leads auto-show — violates manual-intake rule** |
| Today queue | ✅ basic | no complete-flow (done / reschedule / skip); no call-first UX polish |
| Dashboard | ⚠️ basic | no trends, no money, no activity, no conversion, no empty states |
| Calendar | ⚠️ read-only month list | no real grid/week/day/create/drag-reschedule |
| Contacts | ⚠️ list only | no merge UI, no edit, no detail page |
| Follow-ups | ⚠️ list + create | no complete/reschedule/bulk |
| Search | ⚠️ leads-only filter | not global (leads+contacts) |
| Mobile | ❌ none | sidebar hidden on mobile = no navigation |
| Agent API | ✅ core CRUD | missing follow-up create/complete, contact update, notes |
| Webhooks (FB/Payload) | ❌ pending | HWT-145 |
| Data migration (806 leads) | ❌ pending | HWT-144 |
| Users mgmt / settings | ❌ none | admin panel |

---

## 3. Target UX model

### Lead lifecycle (the intake rule — CZ's core ask)
```
webhook / agent / form
        │
        ▼
  ┌─ INBOX (ลีดใหม่) ─┐   ← new & unowned; review list + claim buttons
  │  review → รับงาน   │
  └────────┬──────────┘
           ▼
  PIPELINE (kanban): ติดต่อแล้ว → สนใจ → นัดดู → เสนอราคา → ปิดการขาย
           (only OWNED leads appear on the board)
           │
           ▼
  done / lost / duplicate (archived from board)
```
- `+ ลีดใหม่` (manual form) creates the lead in INBOX (unowned) → staff claims → enters pipeline
- Agent/webhook-created leads also land in INBOX (Discord alert unchanged)
- Kanban ใหม่ column removed from default view? No — pipeline STARTS at ติดต่อแล้ว; ใหม่ = inbox stage only.

### Dashboard (2.0)
- KPI row w/ delta vs previous period + tiny sparkline (CSS)
- Pipeline funnel: counts AND ฿ value per stage + conversion % between stages
- วันนี้ activity strip: รับงาน n · ติดต่อ n · นัดดู n · ปิด n
- Team workload: per person leads + open follow-ups + this-week closes
- Empty states everywhere; skeleton loading

### Calendar (2.0)
- Month grid (real) + Week + Day agenda; today highlight; prev/next
- Events = follow-ups (task_type) + site visits + birthdays? no
- Click a day → quick-add follow-up (lead picker or link from lead page)
- Drag event → reschedule (PATCH due_date)
- Colors: นัดดู ม่วง · ติดตาม เหลือง · เลยกำหนด แดง

---

## 4. Build waves (each deployable + verifiable)

### Wave A — Intake & pipeline semantics (CZ's explicit asks)
- [A1] leads: add `intake` concept — kanban/board API excludes unowned leads; ลีดใหม่ = inbox
- [A2] Leads page: two tabs "ลีดใหม่ (inbox)" / "ทั้งหมด"; inbox = unowned + claim
- [A3] Manual add form → creates unowned inbox lead (owner field removed — claim instead)
- [A4] Today page: show inbox count + "รับงาน" quick action; claimed → appears in queue
- ACCEPT: new lead via form → NOT on board until claimed; claim → appears on board instantly

### Wave B — Dashboard 2.0
- [B1] KPI deltas (lead_date vs interval), sparkline bars (CSS)
- [B2] Pipeline value: SUM(deal_value) per stage + count; conversion %
- [B3] Today activity strip (counts from logs/follow-ups/claims by date)
- [B4] Workload polish + this-week closes; empty states + skeletons
- ACCEPT: dashboard shows ฿ value, deltas, activity; renders with 0 data (no crash)

### Wave C — Calendar 2.0
- [C1] Month grid component (no external lib — container-safe, DESIGN tokens)
- [C2] Week + Day views; prev/next/today; events from follow_ups + site visits
- [C3] Day click → quick-add follow-up; drag → reschedule PATCH
- [C4] Lead page: "นัดดู" button → creates site_visit follow-up + sets stage (auto)
- ACCEPT: create on calendar → visible on month; drag → date changes in DB; stage bump on นัดดู

### Wave D — Completeness (proper usage everywhere)
- [D1] Lead detail full edit (fields incl. deal_value, probability, do_not_contact, notes)
- [D2] Follow-up actions: done / done+create-next / reschedule; bulk on list
- [D3] Contacts: detail page, merge duplicates (choose master), edit
- [D4] Global search (leads+contacts) + recent
- [D5] Mobile bottom nav (วันนี้ · ลีด · บอร์ด · ปฏิทิน · เพิ่ม) + responsive tables
- [D6] Admin settings: user mgmt (add/disable/reset pw), stage config
- ACCEPT: full edit persists; merge works; search from any page; mobile navigable

### Wave E — Integration & data (HWT-144/145)
- [E1] Data migration: 806 leads / 440 contacts / 778 follow-ups (legacy_id preserved)
- [E2] FB lead webhook → POST /api/agent/leads (inbox) + Discord alert stays
- [E3] Payload /api/leads webhook → same
- [E4] Agent API: follow-up create/complete, contact update, notes
- ACCEPT: migration counts exact; test FB lead → inbox ≤5 min; agent loop incl follow-ups

---

## 5. Non-goals (v2)
- Google OAuth until CZ provides client creds (username/pass is the current path)
- Native mobile app, email sync, multi-company, reports/export
- Deal-value forecasting model (just SUM)

## 6. Definition of ready (all waves)
- Typecheck clean · deploy green on Coolify · acceptance probes pass (curl + UI)
- DESIGN.md tokens used (no hex drift) · Thai labels · empty states on every view
- Agent API covered by docs/agent-api.md updates

## 7. Research references (patterns adopted)
- Pipedrive: Lead Inbox → Deals pipeline (manual conversion), activity timeline
- HubSpot: deal-stage funnel dashboard with count+value, activity feed, team goals
- Zoho/Outlook calendar semantics: month/week/day, drag-reschedule, color-coded types
- Webflow/Figma-free build constraint: CSS-only charts (no chart lib — container-safe)

# Feature: Phone Call — click-to-call + auto outcome logging

**Feature Type**: New Capability
**Estimated Complexity**: Low-Medium
**Primary Systems**: Ink CRM (Next.js + Postgres)
**Dependencies**: none (no provider — free, per CZ decision A)

## User Story

As a sales rep (mostly mobile)
I want to tap a call button on a lead and record the call outcome in one motion
So that every outreach attempt is logged automatically and the pipeline moves without manual double-entry.

## Problem Statement

Today calling a lead = `tel:` link (mobile only), then the rep must separately open
"บันทึกการติดต่อ" and type everything. Desktop has no call affordance at all. Outreach
attempts are under-logged, so the pipeline and Ink Agent lose the "who called when" history.

## Solution Statement

A "📞 โทรหา" button on the lead detail page (and board bottom sheet) that:
1. fires `tel:` (works on mobile; desktop shows the number + copy + "โทรจากมือถือ" hint)
2. opens a quick **ผลการโทร?** sheet: ติดต่อแล้ว / ไม่รับสาย / นัดหมาย / อื่นๆ + note
3. on save — writes a `call_logs` row **and** a `conversation_logs` entry automatically;
   outcome ติดต่อแล้ว bumps stage `new → contacted` (intake rule preserved: no owner → no bump)

## Out of Scope / Non-Goals

- No VOIP/softphone, no virtual number, no recording (CZ decision A — provider cost, later ticket)
- No automatic duration capture (no provider; duration_sec stays null / manual)
- No call-history page — history lives on the lead detail page (per-lead context is what sales needs)
- Not changing existing tel: links elsewhere

## CONTEXT REFERENCES

- `src/app/leads/[id]/page.tsx` — lead detail; add CallButton near phone + history section
- `src/components/Board.tsx` (line ~229) — bottom sheet phone link; add call action
- `src/app/api/leads/[id]/route.ts` — DELETE only; new routes below follow `[id]` route pattern
- `src/lib/supabase.ts` — q / qOne / qRun helpers
- `src/lib/i18n.ts` — dictionary (TH default) + t(); `src/lib/labels.ts` — stageLabel/STAGE_CLASS
- Migration pattern: `supabase/migrations/0004_calls.sql` + register in `src/app/api/setup/migrate/route.ts`

## IMPLEMENTATION PLAN

### Phase 1: Schema + migration
**Tasks:**
- CREATE `supabase/migrations/0004_calls.sql` — call_logs table (lead_id, contact_id, user_id, owner, phone, called_at, duration_sec, outcome, note) + indexes
- UPDATE `src/app/api/setup/migrate/route.ts` — read+apply 0004 (mirror 0003 block)

### Phase 2: API
**Tasks:**
- CREATE `src/app/api/leads/[id]/calls/route.ts` — GET call history (join user name, desc)
- CREATE `src/app/api/leads/[id]/call-log/route.ts` — POST {outcome, note, duration_sec}:
  - session-auth (getSessionUser); load lead (owner check: manager or owner or unowned)
  - insert call_logs (owner = me.full_name, phone = lead.phone, outcome, note)
  - insert conversation_logs (channel OTHER→ actually PHONE, summary = outcome label + note, auto)
  - if outcome == contacted AND lead.crm_stage == 'new' AND lead.owner_id → bump to 'contacted'
  - return {ok, call}

### Phase 3: UI
**Tasks:**
- CREATE `src/components/CallButton.tsx` — client component:
  - button "📞 โทรหา {phone}" → `window.location.href = tel:` + setOpen(true)
  - outcome sheet: 4 outcome buttons + note input + save → POST call-log → onLogged() → close
  - desktop fallback: number displayed + copy button
- UPDATE `src/app/leads/[id]/page.tsx` — render CallButton under phone; add "ประวัติโทร" section listing call_logs (called_at, owner, outcome, note)
- UPDATE `src/components/Board.tsx` bottom sheet — small โทร action (tel: + outcome quick log) — keep minimal: tel link + outcome sheet reuse via CallButton-lite (or skip board for v1: lead detail only). **Decision: lead detail only for v1** (scope control), board sheet keeps existing tel link.

### Phase 4: i18n
**Tasks:**
- UPDATE `src/lib/i18n.ts` — keys: call.call (โทรหา), call.outcome (ผลการโทร), call.contacted (ติดต่อแล้ว), call.noAnswer (ไม่รับสาย), call.appointment (นัดหมาย), call.other (อื่นๆ), call.history (ประวัติโทร), call.copy (คัดลอกเบอร์), call.copied (คัดลอกแล้ว), call.fromPhone (กดโทรจากมือถือของคุณ)

### Phase 5: Validation
**Tasks:**
- npx tsc --noEmit clean
- migrate 0004 applied (POST /api/setup/migrate as admin)
- Playwright: open lead detail → click โทรหา → pick outcome ติดต่อแล้ว → history row appears + stage badge → ติดต่อแล้ว (if was ใหม่+owned); call_logs + conversation_logs rows in DB via API check
- Mobile 390px: sheet renders, tel: link present

## VALIDATION COMMANDS

- `cd /opt/data/ink-crm && npx tsc --noEmit`
- Deploy via resync_deploy_repo.py + Coolify deploy, poll status
- Playwright script (cache/): login → lead detail → call flow → assert history + stage

## ACCEPTANCE CRITERIA

- [ ] หน้า ลีด มีปุ่ม โทรหา → กดแล้วขึ้นผลการโทร 4 ตัวเลือก + บันทึก
- [ ] บันทึกแล้ว: call_logs + conversation_logs ถูกสร้าง, สเตจ ใหม่→ติดต่อแล้ว (ถ้ามีเจ้าของ)
- [ ] ประวัติโทรแสดงบนหน้าลีด (เวลา/คนโทร/ผลลัพธ์/โน้ต)
- [ ] tsc clean + migrate 0004 ผ่าน + เทสต์ browser ผ่าน

## OPEN QUESTIONS / ASSUMPTIONS

- Assumed: outcome ติดต่อแล้ว bumps only when owned + stage new (intake rule intact)
- Assumed: ไม่รับสาย does NOT bump stage (attempt logged only)
- Assumed: board bottom sheet keeps existing tel: (v1 scope = lead detail only)
- Assumed: duration_sec unused in v1 (null)

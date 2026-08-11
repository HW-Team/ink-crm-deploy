# Ink CRM — Agent API (HWT-143)

REST API for the **Ink agent** (Hermes, DeepSeek, ink-prefab workspace). Every request must carry the agent key:

```
x-ink-agent-key: <INK_AGENT_KEY>
```

Base URL: `https://crm.ink-homes.com` (production) · `http://localhost:3000` (dev)

---

## 1. Find contact by phone

```
GET /api/agent/contacts?phone=081-234-5678
```

Returns contact + all linked leads. Phone is normalized (strip dashes, +66 → 0).

**200:**
```json
{ "contact": { "id": "...", "full_name": "...", "normalized_phone": "0812345678", "leads": [...] } }
```
**200:** `{ "contact": null }` — not found

## 2. Create lead (auto-link/dedupe contact)

```
POST /api/agent/leads
Content-Type: application/json

{
  "full_name": "สมชาย ใจดี",
  "phone": "081-234-5678",
  "source": "FACEBOOK",          // FACEBOOK | WEBSITE | LINE | CALL
  "interest": "บ้านเดี่ยว 2 ชั้น",
  "province": "เชียงใหม่",
  "meta_lead_id": "FB_leadgen_id_123"
}
```

Creates or reuses a contact by normalized phone. **201:**
```json
{ "lead": { "id": "...", "crm_stage": "new", ... }, "contact_id": "..." }
```

## 3. Bump lead stage

```
PATCH /api/agent/leads/:id/stage
Content-Type: application/json

{ "stage": "qualified" }
```

Valid stages: `new, contacted, qualified, site_visit, proposal, won, unqualified, lost, duplicate, no_answer`

## 4. Log a conversation

```
POST /api/agent/contacts/:contactId/conversations
Content-Type: application/json

{
  "channel": "LINE",            // PHONE | LINE | MESSENGER | EMAIL | SITE_FORM
  "direction": "OUT",           // IN | OUT
  "summary": "นัดดูโชว์รูมเสาร์นี้ 10 โมง",
  "outcome": "นัดสำเร็จ",
  "next_action": "โทรยืนยันก่อนวันนัด",
  "next_followup_date": "2026-08-14T09:00:00Z",
  "team_member": "ink-agent"
}
```

Also updates the contact's `last_contact_*` fields + `contacted_yet=true`.

## 5. List due follow-ups

```
GET /api/agent/follow-ups?due_before=2026-08-11&owner=ชื่อ
```

**200:**
```json
{ "follow_ups": [ { "id": "...", "due_date": "2026-08-11", "contacts": {...}, "leads": {...} } ] }
```

---

## Hermes tool config (for ink-prefab-agent)

Wire as native tools in the Ink agent's Hermes profile — REST + key pattern:

```yaml
tools:
  - name: ink_find_contact
    command: curl -s -H "x-ink-agent-key: $INK_AGENT_KEY" "https://crm.ink-homes.com/api/agent/contacts?phone=$1"
  - name: ink_create_lead
    command: curl -s -X POST -H "x-ink-agent-key: $INK_AGENT_KEY" -H "Content-Type: application/json" -d "$1" "https://crm.ink-homes.com/api/agent/leads"
  - name: ink_bump_stage
    command: curl -s -X PATCH -H "x-ink-agent-key: $INK_AGENT_KEY" -H "Content-Type: application/json" -d "$1" "https://crm.ink-homes.com/api/agent/leads/$2/stage"
  - name: ink_log_conversation
    command: curl -s -X POST -H "x-ink-agent-key: $INK_AGENT_KEY" -H "Content-Type: application/json" -d "$1" "https://crm.ink-homes.com/api/agent/contacts/$2/conversations"
  - name: ink_list_followups
    command: curl -s -H "x-ink-agent-key: $INK_AGENT_KEY" "https://crm.ink-homes.com/api/agent/follow-ups"
```

Acceptance loop (HWT-143): **find lead by phone → log conversation → bump stage → visible in web UI instantly.**

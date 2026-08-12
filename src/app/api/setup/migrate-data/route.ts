import { NextRequest, NextResponse } from 'next/server';
import { q, qOne, qRun } from '@/lib/supabase';
import { checkAgentKey, unauthorized } from '@/lib/agent-auth';

// POST /api/setup/migrate-data — bulk import from the legacy workbook (HWT-144).
// Body: { contacts, leads, logs, follow_ups } (normalized JSON from parse_ink_no_thai.py).
// Idempotent: skips rows whose legacy_id already exists. Contacts resolve phone
// collisions by merging into the existing contact (dedupe key = normalized_phone).
export async function POST(req: NextRequest) {
  if (!checkAgentKey(req)) return unauthorized();

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  const contacts = Array.isArray(body.contacts) ? body.contacts : [];
  const leads = Array.isArray(body.leads) ? body.leads : [];
  const logs = Array.isArray(body.logs) ? body.logs : [];
  const followUps = Array.isArray(body.follow_ups) ? body.follow_ups : [];

  const C = 'legacy_id, full_name, primary_phone, normalized_phone, email, line_id, fb_name, province, preferred_contact_time, first_source, first_lead_date, latest_lead_id, interest, budget_range, land_status, timeline, crm_stage, contacted_yet, last_contact_date, last_contact_channel, last_contact_outcome, latest_conversation_summary, next_followup_date, next_action, owner, priority, do_not_contact, notes, all_linked_lead_ids, log_count';

  try {
    const stats = { contacts: 0, contacts_merged: 0, contacts_errors: 0, leads: 0, logs: 0, follow_ups: 0, skipped: 0 };

    // ── 1. CONTACTS (per-row: phone-collision fallback) ──
    const contactMap: Record<string, string> = {};
    for (const c of contacts) {
      const ins = await qOne<{ id: string }>(
        `insert into contacts (${C}) values (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
         on conflict (legacy_id) do nothing returning id`,
        [c.legacy_id, c.full_name, c.primary_phone, c.normalized_phone, c.email, c.line_id, c.fb_name,
         c.province, c.preferred_contact_time, c.first_source, c.first_lead_date, c.latest_lead_id,
         c.interest, c.budget_range, c.land_status, c.timeline, c.crm_stage, c.contacted_yet,
         c.last_contact_date, c.last_contact_channel, c.last_contact_outcome, c.latest_conversation_summary,
         c.next_followup_date, c.next_action, c.owner, c.priority, c.do_not_contact, c.notes,
         c.all_linked_lead_ids ?? [], c.log_count ?? 0]
      );
      if (ins) { contactMap[c.legacy_id] = ins.id; stats.contacts++; continue; }
      const existing = await qOne<{ id: string }>(`select id from contacts where legacy_id = $1`, [c.legacy_id]);
      if (existing) { contactMap[c.legacy_id] = existing.id; stats.skipped++; continue; }
      const byPhone = c.normalized_phone
        ? await qOne<{ id: string }>(`select id from contacts where normalized_phone = $1 limit 1`, [c.normalized_phone])
        : null;
      if (byPhone) { contactMap[c.legacy_id] = byPhone.id; stats.contacts_merged++; }
      else stats.contacts_errors++;
    }

    // ── 2. LEADS (bulk, idempotent) ──
    const L = 'legacy_id, contact_id, legacy_contact_id, lead_date, month_tab, original_statuses, crm_stage, priority, full_name, phone, email, province, source, interest, preferred_contact_time, owner, next_followup_date, last_contact_date, last_contact_channel, last_contact_summary, deal_value, probability_pct, next_action, archived, meta_lead_id, duplicate_check';
    const leadRows: unknown[][] = [];
    for (const l of leads) {
      leadRows.push([
        l.legacy_id, contactMap[l.legacy_contact_id as string] ?? null, l.legacy_contact_id,
        l.lead_date, l.month_tab, l.original_statuses, l.crm_stage, l.priority, l.full_name, l.phone,
        l.email, l.province, l.source, l.interest, l.preferred_contact_time, l.owner,
        l.next_followup_date, l.last_contact_date, l.last_contact_channel, l.last_contact_summary,
        l.deal_value, l.probability_pct, l.next_action, l.archived ?? false, l.meta_lead_id, l.duplicate_check,
      ]);
    }
    for (let i = 0; i < leadRows.length; i += 200) {
      const chunk = leadRows.slice(i, i + 200);
      const placeholders = chunk.map((_, k) => `(${Array.from({ length: 26 }, (_, j) => `$${k * 26 + j + 1}`).join(',')})`).join(',');
      const r = await qRun(`insert into leads (${L}) values ${placeholders} on conflict (legacy_id) do nothing`, chunk.flat() as any[]);
      void r;
    }
    stats.leads = leadRows.length;

    // lead legacy→uuid map
    const leadMap: Record<string, string> = {};
    for (const l of leads) {
      const row = await qOne<{ id: string }>(`select id from leads where legacy_id = $1`, [l.legacy_id]);
      if (row) leadMap[l.legacy_id as string] = row.id;
    }

    // ── 3. LOGS ──
    const LG = 'legacy_id, lead_id, contact_id, logged_at, channel, direction, team_member, outcome, summary, next_action, next_followup_date, attachment_link';
    const logRows: unknown[][] = [];
    for (const g of logs) {
      logRows.push([
        g.legacy_id, leadMap[g.legacy_lead_id as string] ?? null, contactMap[g.legacy_contact_id as string] ?? null,
        g.logged_at, g.channel, g.direction, g.team_member, g.outcome, g.summary, g.next_action,
        g.next_followup_date, g.attachment_link,
      ]);
    }
    for (let i = 0; i < logRows.length; i += 200) {
      const chunk = logRows.slice(i, i + 200);
      const placeholders = chunk.map((_, k) => `(${Array.from({ length: 12 }, (_, j) => `$${k * 12 + j + 1}`).join(',')})`).join(',');
      await qRun(`insert into conversation_logs (${LG}) values ${placeholders} on conflict (legacy_id) do nothing`, chunk.flat() as any[]);
    }
    stats.logs = logRows.length;

    // ── 4. FOLLOW UPS ──
    const FU = 'legacy_id, lead_id, contact_id, due_date, due_time, task_type, owner, priority, status, latest_note';
    const fuRows: unknown[][] = [];
    for (const f of followUps) {
      fuRows.push([
        f.legacy_id, leadMap[f.legacy_lead_id as string] ?? null, contactMap[f.legacy_contact_id as string] ?? null,
        f.due_date, f.due_time, f.task_type, f.owner, f.priority, f.status, f.latest_note,
      ]);
    }
    for (let i = 0; i < fuRows.length; i += 200) {
      const chunk = fuRows.slice(i, i + 200);
      const placeholders = chunk.map((_, k) => `(${Array.from({ length: 10 }, (_, j) => `$${k * 10 + j + 1}`).join(',')})`).join(',');
      await qRun(`insert into follow_ups (${FU}) values ${placeholders} on conflict (legacy_id) do nothing`, chunk.flat() as any[]);
    }
    stats.follow_ups = fuRows.length;

    const final = await q(`select
      (select count(*)::int from contacts) as contacts,
      (select count(*)::int from leads) as leads,
      (select count(*)::int from conversation_logs) as logs,
      (select count(*)::int from follow_ups) as follow_ups`);

    return NextResponse.json({ message: 'migrated', stats, totals: final[0] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

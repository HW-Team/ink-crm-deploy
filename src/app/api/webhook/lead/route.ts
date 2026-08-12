import { NextRequest, NextResponse } from 'next/server';
import { q, qOne, qRun } from '@/lib/supabase';
import { checkAgentKey, unauthorized } from '@/lib/agent-auth';

// POST /api/webhook/lead — inbound lead intake for FB Lead Ads + web conversions (HWT-145).
// Creates an UNOWNED lead (lands in the inbox; team claims before kanban).
// Idempotent: dedupes by meta_lead_id (FB) then by normalized phone.
// Accepts flexible field names (FB-style and web-form-style).
export async function POST(req: NextRequest) {
  if (!checkAgentKey(req)) return unauthorized();

  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  const S = (v: any) => {
    if (v === null || v === undefined) return null;
    const t = String(v).trim();
    return t && t.toLowerCase() !== 'none' && t.toLowerCase() !== 'n/a' ? t : null;
  };
  const normPhone = (v: any) => {
    const t = S(v);
    if (!t) return null;
    const p = t.replace(/\D/g, '');
    if (!p) return null;
    const qq = p.startsWith('66') && p.length === 11 ? '0' + p.slice(2) : p;
    return qq.length >= 9 ? qq : null;
  };

  const name = S(b.name) || S(b.full_name);
  const phone = S(b.phone) || S(b.phone_number) || S(b.telephone);
  const np = normPhone(phone);
  const email = S(b.email) || S(b.email_address);
  const province = S(b.province) || S(b.location) || S(b.city);
  const interest = S(b.interest) || S(b.project_type) || S(b.message) || S(b.comments);
  const metaLeadId = S(b.meta_lead_id) || S(b.leadgen_id) || S(b.fb_lead_id);
  const rawSource = S(b.source) || S(b.channel) || 'OTHER';
  const source = (['FACEBOOK', 'WEBSITE', 'LINE', 'CALL', 'OTHER'] as const).includes(rawSource as any)
    ? (rawSource as string) : 'OTHER';
  const formName = S(b.form_name) || S(b.ad_name);

  if (!name && !np && !email) {
    return NextResponse.json({ error: 'at least one of name/phone/email required' }, { status: 400 });
  }

  try {
    // 1) dedupe by meta lead id
    if (metaLeadId) {
      const dup = await qOne<{ id: string }>(`select id from leads where meta_lead_id = $1`, [metaLeadId]);
      if (dup) return NextResponse.json({ ok: true, duplicate: true, lead_id: dup.id });
    }

    // 2) resolve or create contact
    let contact = np
      ? await qOne<{ id: string }>(`select id from contacts where normalized_phone = $1 limit 1`, [np])
      : null;
    if (!contact && email) {
      contact = await qOne<{ id: string }>(`select id from contacts where lower(email) = lower($1) limit 1`, [email]);
    }
    let contactId: string | null = null;
    if (contact) {
      contactId = contact.id;
    } else {
      const ins = await qOne<{ id: string }>(
        `insert into contacts (full_name, primary_phone, normalized_phone, email, province, first_source, interest, created_at)
         values ($1,$2,$3,$4,$5,$6,$7, now()) returning id`,
        [name || 'ไม่ระบุชื่อ', phone, np, email, province, source, interest]
      );
      contactId = ins ? ins.id : null;
    }

    // 3) create the lead (unowned → inbox)
    const mergedInterest = formName && interest ? `${interest} (${formName})` : (interest || formName);
    const ins = await qOne<{ id: string }>(
      `insert into leads (contact_id, lead_date, crm_stage, priority, full_name, phone, email, province, source, interest, meta_lead_id)
       values ($1, now(), 'new', 'medium', $2, $3, $4, $5, $6, $7, $8) returning id`,
      [contactId, name || 'ไม่ระบุชื่อ', phone, email, province, source, mergedInterest, metaLeadId]
    );

    return NextResponse.json({ ok: true, duplicate: false, lead_id: ins?.id, contact_id: contactId, stage: 'new' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

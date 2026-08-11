import { NextRequest, NextResponse } from 'next/server';
import { qOne, normalizePhone } from '@/lib/supabase';
import { checkAgentKey, unauthorized } from '@/lib/agent-auth';

// POST /api/agent/leads — create lead, auto-create/link contact (dedupe by normalized phone)
export async function POST(req: NextRequest) {
  if (!checkAgentKey(req)) return unauthorized();

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  const fullName = String(body.full_name ?? body.name ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  if (!fullName) return NextResponse.json({ error: 'full_name required' }, { status: 400 });

  const norm = normalizePhone(phone);
  const source = String(body.source ?? 'FACEBOOK').toUpperCase();

  try {
    // find or create contact
    let contactId: string | null = null;
    if (norm) {
      const existing = await qOne<{ id: string }>(
        `select id from contacts where normalized_phone=$1`, [norm]
      );
      if (existing) {
        contactId = existing.id;
      } else {
        const newContact = await qOne<{ id: string }>(
          `insert into contacts (full_name, primary_phone, normalized_phone, first_source, first_lead_date, crm_stage)
           values ($1,$2,$3,$4,now(),'new') returning id`,
          [fullName, phone || null, norm, source]
        );
        if (!newContact) return NextResponse.json({ error: 'contact insert failed' }, { status: 500 });
        contactId = newContact.id;
      }
    }

    const lead = await qOne(
      `insert into leads (contact_id, full_name, phone, source, interest, province, meta_lead_id, crm_stage)
       values ($1,$2,$3,$4,$5,$6,$7,'new') returning *`,
      [
        contactId,
        fullName,
        phone || null,
        source,
        body.interest ? String(body.interest) : null,
        body.province ? String(body.province) : null,
        body.meta_lead_id ? String(body.meta_lead_id) : null,
      ]
    );
    if (!lead) return NextResponse.json({ error: 'lead insert failed' }, { status: 500 });
    return NextResponse.json({ lead, contact_id: contactId }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

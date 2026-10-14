import { NextRequest, NextResponse } from 'next/server';
import { q, qOne, normalizePhone } from '@/lib/supabase';
import { checkAgentKey, unauthorized } from '@/lib/agent-auth';

const STAGES = ['new','contacted','qualified','site_visit','proposal','won','unqualified','lost','duplicate','no_answer'];
const SOURCES = ['FACEBOOK','WEBSITE','LINE','CALL','OTHER'];

// GET /api/agent/leads?since=YYYY-MM-DD&stage=new&source=WEBSITE&uncontacted=1&limit=50
// → recent leads, newest first, with contact + touchpoint counts (read-only)
export async function GET(req: NextRequest) {
  if (!checkAgentKey(req)) return unauthorized();
  const sp = req.nextUrl.searchParams;
  const since = sp.get('since');
  const stage = sp.get('stage');
  const source = sp.get('source')?.toUpperCase();
  const uncontacted = sp.get('uncontacted') === '1' || sp.get('uncontacted') === 'true';
  const limit = Math.min(Math.max(parseInt(sp.get('limit') ?? '20', 10) || 20, 1), 100);

  if (since && !/^\d{4}-\d{2}-\d{2}$/.test(since)) return NextResponse.json({ error: 'since must be YYYY-MM-DD' }, { status: 400 });
  if (stage && !STAGES.includes(stage)) return NextResponse.json({ error: 'invalid stage' }, { status: 400 });
  if (source && !SOURCES.includes(source)) return NextResponse.json({ error: 'invalid source' }, { status: 400 });

  const where = ['coalesce(l.archived, false) = false'];
  const params: unknown[] = [];
  if (since) { params.push(since); where.push(`coalesce(l.created_at, l.lead_date) >= $${params.length}::date`); }
  if (stage) { params.push(stage); where.push(`l.crm_stage = $${params.length}`); }
  if (source) { params.push(source); where.push(`l.source = $${params.length}`); }
  if (uncontacted) where.push(`coalesce(c.contacted_yet, false) = false`);
  params.push(limit);

  try {
    const leads = await q(
      `select l.id, l.contact_id, l.full_name, l.phone, l.email, l.province, l.source, l.interest,
         l.crm_stage, l.owner, l.lead_date, l.created_at, l.next_followup_date,
         c.contacted_yet, c.last_contact_date, c.last_contact_channel,
         (select count(*)::int from conversation_logs cl
           where cl.lead_id = l.id or (l.contact_id is not null and cl.contact_id = l.contact_id)) as log_count
       from leads l
       left join contacts c on c.id = l.contact_id
       where ${where.join(' and ')}
       order by coalesce(l.created_at, l.lead_date) desc
       limit $${params.length}`,
      params
    );
    return NextResponse.json({ leads });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

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

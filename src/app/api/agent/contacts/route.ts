import { NextRequest, NextResponse } from 'next/server';
import { q, qOne, normalizePhone } from '@/lib/supabase';
import { checkAgentKey, unauthorized } from '@/lib/agent-auth';

const CONTACT_WITH_LEADS = `select c.*,
        coalesce((
          select json_agg(l order by l.lead_date desc)
          from leads l where l.contact_id = c.id
        ), '[]') as leads
       from contacts c`;

// GET /api/agent/contacts?phone=08x-xxx-xxxx → find contact by normalized phone (+ linked leads)
// GET /api/agent/contacts?email=a@b.com     → find contact by email (contact or any of its leads)
// GET /api/agent/contacts?q=name            → search contacts by name, up to 10
export async function GET(req: NextRequest) {
  if (!checkAgentKey(req)) return unauthorized();
  const sp = req.nextUrl.searchParams;
  const phone = sp.get('phone');
  const email = sp.get('email')?.trim().toLowerCase();
  const name = sp.get('q')?.trim();
  if (!phone && !email && !name) return NextResponse.json({ error: 'phone, email or q required' }, { status: 400 });

  try {
    if (phone) {
      const norm = normalizePhone(phone);
      if (norm) {
        const contact = await qOne(
          `${CONTACT_WITH_LEADS} where c.normalized_phone = $1 and c.deleted_at is null`,
          [norm]
        );
        return NextResponse.json({ contact: contact ?? null });
      }
      // Non-Thai numbers (e.g. +44…) never normalize — match the raw digits on leads instead.
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 6) return NextResponse.json({ error: 'invalid phone' }, { status: 400 });
      const contact = await qOne(
        `${CONTACT_WITH_LEADS}
         where c.deleted_at is null and (
           regexp_replace(coalesce(c.primary_phone, ''), '\\D', '', 'g') = $1
           or exists (select 1 from leads l where l.contact_id = c.id
                      and regexp_replace(coalesce(l.phone, ''), '\\D', '', 'g') = $1)
         )
         limit 1`,
        [digits]
      );
      return NextResponse.json({ contact: contact ?? null });
    }

    if (email) {
      const contact = await qOne(
        `${CONTACT_WITH_LEADS}
         where c.deleted_at is null and (
           lower(c.email) = $1
           or exists (select 1 from leads l where l.contact_id = c.id and lower(l.email) = $1)
         )
         limit 1`,
        [email]
      );
      return NextResponse.json({ contact: contact ?? null });
    }

    if (name!.length < 2) return NextResponse.json({ error: 'q must be at least 2 characters' }, { status: 400 });
    const contacts = await q(
      `${CONTACT_WITH_LEADS}
       where c.deleted_at is null and c.full_name ilike '%' || $1 || '%'
       order by c.first_lead_date desc nulls last
       limit 10`,
      [name]
    );
    return NextResponse.json({ contacts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

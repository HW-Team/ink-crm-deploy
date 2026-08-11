import { NextRequest, NextResponse } from 'next/server';
import { qOne, normalizePhone } from '@/lib/supabase';
import { checkAgentKey, unauthorized } from '@/lib/agent-auth';

// GET /api/agent/contacts?phone=08x-xxx-xxxx → find contact by normalized phone (+ linked leads)
export async function GET(req: NextRequest) {
  if (!checkAgentKey(req)) return unauthorized();
  const phone = req.nextUrl.searchParams.get('phone');
  if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 });

  const norm = normalizePhone(phone);
  if (!norm) return NextResponse.json({ error: 'invalid phone' }, { status: 400 });

  try {
    const contact = await qOne(
      `select c.*,
        coalesce((
          select json_agg(l order by l.lead_date desc)
          from leads l where l.contact_id = c.id
        ), '[]') as leads
       from contacts c
       where c.normalized_phone = $1 and c.deleted_at is null`,
      [norm]
    );
    return NextResponse.json({ contact: contact ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

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
  const prefContactTime = S(b.preferred_contact_time) || S(b.contact_time) || S(b.best_time);
  const interest = S(b.interest) || S(b.project_type) || S(b.message) || S(b.comments);
  const metaLeadId = S(b.meta_lead_id) || S(b.leadgen_id) || S(b.fb_lead_id);
  const rawSource = S(b.source) || S(b.channel) || 'OTHER';
  const source = (['FACEBOOK', 'WEBSITE', 'LINE', 'CALL', 'OTHER'] as const).includes(rawSource as any)
    ? (rawSource as string) : 'OTHER';
  const formName = S(b.form_name) || S(b.ad_name);
  const lineId = S(b.line_id) || S(b.lineid);

  // --- FB Lead Ads custom fields → structured lead details -----------------
  // Payload stores FB form answers as [{ name, values }]. Map known labels to
  // CRM fields; anything else goes into the interest summary so no info is lost.
  const customs: { name?: string | null; values?: (string | null)[] | null }[] = Array.isArray(b.fb_custom_fields) ? b.fb_custom_fields : [];
  const cf = (keys: string[]): string | null => {
    for (const k of keys) {
      const f = customs.find((x) => (x.name ?? "").toLowerCase().replace(/[\s\-_.]/g, "") === k);
      if (f && Array.isArray(f.values)) {
        const v = S(f.values[0]);
        if (v) return v;
      }
    }
    return null;
  };
  const cfName = cf(["name", "fullname", "ชื่อ"]);
  const cfPhone = cf(["phone", "phonenumber", "โทร", "เบอร์", "เบอร์โทร", "mobile"]);
  const cfEmail = cf(["email", "อีเมล"]);
  const cfProvince = cf(["province", "provincecity", "จังหวัด", "location", "city", "พื้นที่"]);
  const cfPref = cf(["preferredcontacttime", "contacttime", "besttimetocall", "เวลาติดต่อ", "ช่วงเวลาติดต่อ", "เวลาสะดวก", "เวลาว่าง"]);
  const cfLine = cf(["line", "lineid", "ไลน์", "ไอดีไลน์"]);
  const cfBudget = cf(["budget", "budgetrange", "งบ", "งบประมาณ", "price", "ราคา"]);
  const cfTimeline = cf(["timeline", "ระยะเวลา", "plan", "เมื่อไหร่", "เมื่อไร", "กำหนด", "ต้องการสร้างเมื่อไหร่", "ต้องการสร้าง", "จะสร้างเมื่อไหร่", "เวลาเริ่มสร้าง"]);
  const cfHouse = cf(["housetype", "type", "housestyle", "แบบบ้าน", "ประเภทบ้าน", "projecttype", "โครงการ"]);
  const cfMsg = cf(["message", "interest", "comment", "รายละเอียด", "ความสนใจ", "ข้อความ"]);

  const fName = name || cfName;
  const fPhone = phone || cfPhone;
  const fNp = normPhone(fPhone);
  const fEmail = email || cfEmail;
  const fProvince = province || cfProvince;
  const fPref = prefContactTime || cfPref;
  const fLine = lineId || cfLine;

  const interestParts: string[] = [];
  if (cfHouse) interestParts.push(cfHouse);
  if (cfBudget) interestParts.push(`งบ ${cfBudget}`);
  if (cfTimeline) interestParts.push(`ต้องการ ${cfTimeline}`);
  if (cfMsg && !interest) interestParts.push(cfMsg);
  const interestFull = [interest, interestParts.join(" · ")].filter(Boolean).join(" · ") || null;

  if (!fName && !fNp && !fEmail) {
    return NextResponse.json({ error: 'at least one of name/phone/email required' }, { status: 400 });
  }

  try {
    // 1) dedupe by meta lead id
    if (metaLeadId) {
      const dup = await qOne<{ id: string }>(`select id from leads where meta_lead_id = $1`, [metaLeadId]);
      if (dup) return NextResponse.json({ ok: true, duplicate: true, lead_id: dup.id });
    }
    // 1b) accidental double-submit guard: same phone within 10 min
    //     (double-click / form retry) — legit re-entries later still create new leads
    if (fNp) {
      const recent = await qOne<{ id: string }>(
        `select id from leads where phone = $1 and lead_date > now() - interval '10 minutes' limit 1`,
        [fNp]
      );
      if (recent) return NextResponse.json({ ok: true, duplicate: true, lead_id: recent.id });
    }

    // 2) resolve or create contact
    let contact = fNp
      ? await qOne<{ id: string }>(`select id from contacts where normalized_phone = $1 limit 1`, [fNp])
      : null;
    if (!contact && fEmail) {
      contact = await qOne<{ id: string }>(`select id from contacts where lower(email) = lower($1) limit 1`, [fEmail]);
    }
    let contactId: string | null = null;
    if (contact) {
      contactId = contact.id;
      // enrich existing contact with anything new from this form
      if (fLine) await qOne(`update contacts set line_id = coalesce(line_id, $1) where id = $2`, [fLine, contact.id]);
    } else {
      const ins = await qOne<{ id: string }>(
        `insert into contacts (full_name, primary_phone, normalized_phone, email, province, line_id, first_source, interest, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8, now()) returning id`,
        [fName || 'ไม่ระบุชื่อ', fPhone, fNp, fEmail, fProvince, fLine, source, interestFull]
      );
      contactId = ins ? ins.id : null;
    }

    // 3) create the lead (unowned → inbox)
    const mergedInterest = formName && interestFull ? `${interestFull} (${formName})` : (interestFull || formName);
    const ins = await qOne<{ id: string }>(
      `insert into leads (contact_id, lead_date, crm_stage, priority, full_name, phone, email, province, source, interest, meta_lead_id, preferred_contact_time)
       values ($1, now(), 'new', 'medium', $2, $3, $4, $5, $6, $7, $8, $9) returning id`,
      [contactId, fName || 'ไม่ระบุชื่อ', fPhone, fEmail, fProvince, source, mergedInterest, metaLeadId, fPref]
    );

    return NextResponse.json({ ok: true, duplicate: false, lead_id: ins?.id, contact_id: contactId, stage: 'new' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

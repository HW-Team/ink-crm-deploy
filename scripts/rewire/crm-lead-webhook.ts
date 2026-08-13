import { createHmac } from 'crypto'

// Forwards every newly-created lead to the Ink CRM inbound webhook
// (HWT-145 rewire). The CRM is now the source of truth for the sales team:
// FB Lead Ads and web conversions land directly in the CRM inbox, where a
// salesperson claims the lead and works the pipeline.
//
// Runs alongside — never replaces — the Lark notification and the Hermes
// Discord alert (those stay as human alerts). Failures here must NEVER block
// lead creation: the caller wraps this in Promise.allSettled and we
// additionally swallow every error internally.

const REQUEST_TIMEOUT_MS = 5000

type FbCustomField = {
  name?: string | null
  values?: (string | null)[] | null
}

type CrmLeadDoc = {
  id?: string | number
  name?: string | null
  email?: string | null
  phone?: string | null
  company?: string | null
  message?: string | null
  status?: string | null
  source?: string | null
  value?: number | null
  notes?: unknown
  createdAt?: string | null
  fbLeadId?: string | null
  fbFormId?: string | null
  fbAdId?: string | null
  fbAdsetId?: string | null
  fbCampaignId?: string | null
  fbCustomFields?: FbCustomField[] | null
}

function clean(value?: string | null): string | undefined {
  const trimmed = value?.toString().trim()
  return trimmed ? trimmed : undefined
}

function mapSource(source?: string | null): string {
  switch (source) {
    case 'facebook_lead_ad':
    case 'facebook':
    case 'social':
      return 'FACEBOOK'
    case 'website':
    case 'direct':
      return 'WEBSITE'
    case 'referral':
      return 'LINE'
    default:
      return 'OTHER'
  }
}

/**
 * POST a lead to the CRM inbound webhook. Uses the same HMAC-signed webhook
 * scheme as the Hermes forwarder (X-Hub-Signature-256) plus the agent key
 * header the CRM accepts, whichever the CRM validates first.
 */
export async function notifyCrmLead(doc: CrmLeadDoc, _req?: unknown): Promise<void> {
  const url = process.env.CRM_WEBHOOK_URL
  const secret = process.env.CRM_WEBHOOK_KEY
  if (!url || !secret) {
    // Not configured — CRM forwarding is optional at this layer.
    return
  }

  const interest = clean(doc.message) ?? clean(doc.company)
  const body = JSON.stringify({
    name: clean(doc.name),
    phone: clean(doc.phone),
    email: clean(doc.email),
    interest,
    source: mapSource(doc.source),
    meta_lead_id: clean(doc.fbLeadId) ?? undefined,
    form_name: clean(doc.fbFormId) ?? undefined,
    // FB Lead Ads custom fields (งบ/จังหวัด/ช่วงเวลาติดต่อ/Line ID/แบบบ้าน...)
    // + any direct line id on the doc — CRM maps known labels into the lead card.
    line_id: clean((doc as any).lineId ?? (doc as any).line_id) ?? undefined,
    fb_custom_fields: (doc.fbCustomFields ?? []).map((f) => ({
      name: f.name ?? null,
      values: Array.isArray(f.values) ? f.values : [],
    })),
  })

  try {
    const signature = createHmac('sha256', secret).update(body).digest('hex')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': `sha256=${signature}`,
          'X-Webhook-Signature': signature,
          'X-Ink-Agent-Key': secret,
        },
        body,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }
  } catch (err) {
    // Never throw: lead creation must not fail because of CRM delivery.
    if (_req && typeof _req === 'object' && 'payload' in _req) {
      const p = (_req as { payload?: { logger?: { error?: (m: string, x?: unknown) => void } } }).payload
      p?.logger?.error?.('CRM webhook delivery failed', { error: err, leadId: doc.id })
    }
  }
}

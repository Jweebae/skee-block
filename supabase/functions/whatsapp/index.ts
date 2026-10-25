// The WhatsApp Cloud API connection, set up by the owner from admin → WhatsApp (no code needed).
// - GET: Meta's webhook check (hub.verify_token must match whatsapp_config.verify_token).
// - POST from Meta (signed with the app secret): incoming messages. A client verifies their number by sending
//   "3kee code 123456" to the business number; receiving messages and replying within 24 hours is free.
// - POST from the website: the client starts a verification; owners save the connection, check it and create the
//   message templates that automatic (paid) messages use.
// Deployed with verify_jwt off: Meta sends no Supabase token, and website calls are checked here.
import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2'

const GRAPH = 'https://graph.facebook.com/v22.0'
const ORIGINS = ['https://3kee.site', 'https://www.3kee.site', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174']
const CODE_MINUTES = 30

// Utility templates for automatic messages. Meta reviews them (usually minutes to a few hours) before they can be sent.
export const TEMPLATES = [
  { name: 'skee_request_received', text: 'Salam {{1}}, 3kee received your request {{2}} for {{3}} at {{4}}. Skee usually replies within 10 minutes.', example: ['Yacine', 'SKB-4827', 'Saturday 24 October', '11:30'] },
  { name: 'skee_booking_confirmed', text: 'Salam {{1}}, your 3kee appointment {{2}} is confirmed for {{3}} at {{4}}. Studio location: {{5}} See you in the chair.', example: ['Yacine', 'SKB-4827', 'Saturday 24 October', '11:30', 'https://maps.app.goo.gl/example'] },
  { name: 'skee_booking_moved', text: 'Salam {{1}}, your 3kee appointment {{2}} has moved to {{3}} at {{4}}. Reply here if the new time does not work for you.', example: ['Yacine', 'SKB-4827', 'Sunday 25 October', '14:00'] },
  { name: 'skee_booking_cancelled', text: 'Salam {{1}}, your 3kee appointment {{2}} on {{3}} at {{4}} was cancelled. You can book another time on 3kee.site.', example: ['Yacine', 'SKB-4827', 'Saturday 24 October', '11:30'] },
  { name: 'skee_request_declined', text: 'Salam {{1}}, Skee could not take your request {{2}} for {{3}} at {{4}}. Please choose another time on 3kee.site.', example: ['Yacine', 'SKB-4827', 'Saturday 24 October', '11:30'] },
  { name: 'skee_day_reminder', text: 'Good morning {{1}}, a reminder of your 3kee appointment today at {{2}} ({{3}}). Studio location: {{4}} See you soon.', example: ['Yacine', '11:30', 'Skin Fade', 'https://maps.app.goo.gl/example'] },
  { name: 'skee_owner_new_request', text: 'New 3kee request {{1}} from {{2}}: {{3}}, {{4}} at {{5}}. Answer it at 3kee.site/#admin.', example: ['SKB-4827', 'Yacine B.', 'Skin Fade', 'Saturday 24 October', '11:30'] },
  { name: 'skee_owner_cancelled', text: '3kee booking {{1}} ({{2}}, {{3}} at {{4}}) was cancelled by the client. The slot is free again.', example: ['SKB-4827', 'Yacine B.', 'Saturday 24 October', '11:30'] },
]

class Problem extends Error {
  constructor(public status: number, public code: string) { super(code) }
}
function fail(status: number, code: string): never { throw new Problem(status, code) }

function cors(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(origin) ? origin : ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  }
}
const reply = (req: Request, status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } })

const digits = (phone: unknown) => String(phone ?? '').replace(/\D/g, '')
const e164 = (value: unknown, label: string) => {
  const text = String(value ?? '').trim()
  if (!text) return null
  let d = digits(text)
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('0')) d = `213${d.slice(1)}`
  if (d.length === 9 && /^[567]/.test(d)) d = `213${d}`
  if (!/^[0-9]{8,15}$/.test(d)) fail(400, `bad_${label}`)
  return `+${d}`
}

async function loadAll(db: SupabaseClient) {
  const [config, secrets, switches] = await Promise.all([
    db.from('whatsapp_config').select('*').eq('id', 'main').maybeSingle(),
    db.from('whatsapp_secrets').select('access_token, app_secret').eq('id', 'main').maybeSingle(),
    db.from('studio_private').select('whatsapp_verification, whatsapp_messages').eq('id', 'main').maybeSingle(),
  ])
  const c = config.data ?? {}
  const s = secrets.data ?? {}
  return {
    config: c, token: s.access_token as string | null, appSecret: s.app_secret as string | null,
    connected: Boolean(c.display_number && c.phone_number_id && s.access_token),
    verification: switches.data?.whatsapp_verification === true,
    messages: switches.data?.whatsapp_messages === true,
  }
}

async function graph(token: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${GRAPH}/${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } })
  const data = await response.json().catch(() => ({}))
  return { ok: response.ok, data }
}

async function sendText(token: string, phoneNumberId: string, to: string, body: string) {
  return graph(token, `${phoneNumberId}/messages`, { method: 'POST', body: JSON.stringify({ messaging_product: 'whatsapp', to: digits(to), type: 'text', text: { body } }) })
}

// ---------- Meta webhook ----------
async function validSignature(raw: string, header: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)))
  const expected = `sha256=${[...mac].map(b => b.toString(16).padStart(2, '0')).join('')}`
  if (expected.length !== header.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ header.charCodeAt(i)
  return diff === 0
}

async function handleIncoming(db: SupabaseClient, raw: string, signature: string) {
  const all = await loadAll(db)
  if (!all.appSecret || !(await validSignature(raw, signature, all.appSecret))) return new Response('bad signature', { status: 403 })
  const event = JSON.parse(raw || '{}')
  for (const entry of event.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        if (message.type !== 'text') continue
        const code = String(message.text?.body ?? '').match(/\b(\d{6})\b/)?.[1]
        if (!code || !all.verification || !all.connected) continue
        const { data: pending } = await db.from('whatsapp_verifications').select('*').eq('code', code).is('verified_at', null).gt('expires_at', new Date().toISOString())
        const match = (pending ?? []).find(row => digits(row.phone) === digits(message.from))
        if (!match) {
          await sendText(all.token!, all.config.phone_number_id, message.from, '3kee: this code is not valid for this number or has expired. Ask for a new code on 3kee.site.')
          continue
        }
        const now = new Date().toISOString()
        await db.from('whatsapp_verifications').update({ verified_at: now }).eq('id', match.id)
        await db.from('client_profiles').update({ phone_verified_at: now }).eq('user_id', match.user_id).eq('phone', match.phone)
        await sendText(all.token!, all.config.phone_number_id, message.from, '3kee: your WhatsApp number is verified ✓ You can go back to 3kee.site.')
      }
    }
  }
  return new Response('ok', { status: 200 })
}

// ---------- website actions ----------
async function caller(req: Request, db: SupabaseClient) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await db.auth.getUser(token)
  return error ? null : data.user
}
async function isOwner(db: SupabaseClient, userId: string) {
  const { data } = await db.from('studio_admins').select('user_id').eq('user_id', userId).maybeSingle()
  return Boolean(data)
}

async function clientStatus(db: SupabaseClient, user: User) {
  const all = await loadAll(db)
  const { data: profile } = await db.from('client_profiles').select('phone, phone_verified_at').eq('user_id', user.id).maybeSingle()
  return { enabled: all.verification && all.connected, phone: profile?.phone ?? null, verified: Boolean(profile?.phone_verified_at) }
}

async function startVerification(db: SupabaseClient, user: User) {
  const all = await loadAll(db)
  if (!all.verification || !all.connected) fail(409, 'whatsapp_off')
  const { data: profile } = await db.from('client_profiles').select('phone, phone_verified_at').eq('user_id', user.id).maybeSingle()
  if (!profile?.phone) fail(409, 'no_phone')
  if (profile.phone_verified_at) return { verified: true }
  const { count } = await db.from('whatsapp_verifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gt('created_at', new Date(Date.now() - 3600000).toISOString())
  if ((count ?? 0) >= 5) fail(429, 'too_many_codes')
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000)
  const expires = new Date(Date.now() + CODE_MINUTES * 60000).toISOString()
  await db.from('whatsapp_verifications').insert({ user_id: user.id, phone: profile.phone, code, expires_at: expires })
  return { code, expires_at: expires, link: `https://wa.me/${digits(all.config.display_number)}?text=${encodeURIComponent(`3kee code ${code}`)}` }
}

async function ownerStatus(db: SupabaseClient) {
  const all = await loadAll(db)
  const c = all.config
  return {
    display_number: c.display_number ?? '', phone_number_id: c.phone_number_id ?? '', waba_id: c.waba_id ?? '', owner_alert_number: c.owner_alert_number ?? '',
    verify_token: c.verify_token, webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp`,
    has_token: Boolean(all.token), token_end: all.token ? all.token.slice(-4) : '', has_app_secret: Boolean(all.appSecret),
    connected: all.connected, last_check: c.last_check ?? {}, verification: all.verification, messages: all.messages,
    templates: TEMPLATES.map(({ name, text }) => ({ name, text })),
  }
}

async function ownerSave(db: SupabaseClient, body: any) {
  const phoneNumberId = String(body.phone_number_id ?? '').trim() || null
  const wabaId = String(body.waba_id ?? '').trim() || null
  if (phoneNumberId && !/^[0-9]{5,30}$/.test(phoneNumberId)) fail(400, 'bad_phone_number_id')
  if (wabaId && !/^[0-9]{5,30}$/.test(wabaId)) fail(400, 'bad_waba_id')
  const { error } = await db.from('whatsapp_config').update({
    display_number: e164(body.display_number, 'display_number'), phone_number_id: phoneNumberId, waba_id: wabaId,
    owner_alert_number: e164(body.owner_alert_number, 'owner_alert_number'), updated_at: new Date().toISOString(),
  }).eq('id', 'main')
  if (error) { console.error(error); fail(500, 'save_failed') }
  const secrets: Record<string, string> = {}
  if (typeof body.access_token === 'string' && body.access_token.trim()) secrets.access_token = body.access_token.trim()
  if (typeof body.app_secret === 'string' && body.app_secret.trim()) secrets.app_secret = body.app_secret.trim()
  if (Object.keys(secrets).length) {
    const saved = await db.from('whatsapp_secrets').upsert({ id: 'main', ...secrets, updated_at: new Date().toISOString() })
    if (saved.error) { console.error(saved.error); fail(500, 'save_failed') }
  }
  return ownerStatus(db)
}

async function ownerCheck(db: SupabaseClient) {
  const all = await loadAll(db)
  if (!all.token || !all.config.phone_number_id) fail(409, 'not_configured')
  const { ok, data } = await graph(all.token!, `${all.config.phone_number_id}?fields=display_phone_number,verified_name,quality_rating`)
  const check = ok
    ? { ok: true, at: new Date().toISOString(), number: data.display_phone_number, name: data.verified_name, quality: data.quality_rating }
    : { ok: false, at: new Date().toISOString(), error: data?.error?.message ?? 'Meta did not accept the connection.' }
  await db.from('whatsapp_config').update({ last_check: check }).eq('id', 'main')
  return { check }
}

async function ownerTemplates(db: SupabaseClient, create: boolean) {
  const all = await loadAll(db)
  if (!all.token || !all.config.waba_id) fail(409, 'not_configured')
  if (create) {
    for (const template of TEMPLATES) {
      await graph(all.token!, `${all.config.waba_id}/message_templates`, {
        method: 'POST',
        body: JSON.stringify({ name: template.name, language: 'en', category: 'UTILITY', components: [{ type: 'BODY', text: template.text, example: { body_text: [template.example] } }] }),
      })
    }
  }
  const { ok, data } = await graph(all.token!, `${all.config.waba_id}/message_templates?fields=name,status,rejected_reason&limit=200`)
  if (!ok) return { templates: TEMPLATES.map(t => ({ name: t.name, status: 'UNKNOWN' })), error: data?.error?.message ?? 'Meta did not answer.' }
  const found = new Map((data.data ?? []).map((t: any) => [t.name, t]))
  return { templates: TEMPLATES.map(t => ({ name: t.name, status: (found.get(t.name) as any)?.status ?? 'NOT_CREATED', reason: (found.get(t.name) as any)?.rejected_reason ?? null })) }
}

Deno.serve(async req => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) })
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const { data } = await db.from('whatsapp_config').select('verify_token').eq('id', 'main').maybeSingle()
    if (url.searchParams.get('hub.mode') === 'subscribe' && data?.verify_token && url.searchParams.get('hub.verify_token') === data.verify_token) {
      return new Response(url.searchParams.get('hub.challenge') ?? '', { status: 200 })
    }
    return new Response('forbidden', { status: 403 })
  }
  if (req.method !== 'POST') return reply(req, 405, { error: 'method_not_allowed' })
  const raw = await req.text()
  const signature = req.headers.get('x-hub-signature-256')
  if (signature) {
    try { return await handleIncoming(db, raw, signature) } catch (problem) { console.error('incoming failed', problem); return new Response('ok', { status: 200 }) }
  }
  try {
    let body: any = {}
    try { body = JSON.parse(raw || '{}') } catch { fail(400, 'bad_request') }
    const action = String(body.action ?? '')
    if (action === 'enabled') { const all = await loadAll(db); return reply(req, 200, { verification: all.verification && all.connected }) }
    const user = await caller(req, db)
    if (!user) fail(401, 'not_signed_in')
    if (action === 'status') return reply(req, 200, await clientStatus(db, user!))
    if (action === 'start') return reply(req, 200, await startVerification(db, user!))
    if (!await isOwner(db, user!.id)) fail(403, 'not_allowed')
    if (action === 'owner_status') return reply(req, 200, await ownerStatus(db))
    if (action === 'owner_save') return reply(req, 200, await ownerSave(db, body))
    if (action === 'owner_check') return reply(req, 200, await ownerCheck(db))
    if (action === 'owner_templates') return reply(req, 200, await ownerTemplates(db, body.create === true))
    fail(400, 'unknown_action')
  } catch (problem) {
    if (problem instanceof Problem) return reply(req, problem.status, { error: problem.code })
    console.error('whatsapp failed', problem)
    return reply(req, 500, { error: 'server_error' })
  }
})

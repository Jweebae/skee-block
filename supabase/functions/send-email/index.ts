// Sends 3kee website emails through Resend (secret RESEND_API_KEY, set in the Supabase dashboard, never in this repository).
// Deployed with verify_jwt off because it checks the caller itself: it reads the signed-in user from their access token
// and only ever writes to that user's own address. Today the website may ask for one email: "welcome", once per account.
// Booking emails will be sent from the server side when bookings are stored, not on request from the browser.
// Templates come from emails/build.mjs, published at https://3kee.site/email/templates/<name>.html (subject = <title>).
import { createClient } from 'jsr:@supabase/supabase-js@2'

const FROM = '3kee <contact@3kee.site>'
const TEMPLATE_URL = 'https://3kee.site/email/templates/'
const ORIGINS = ['https://3kee.site', 'https://www.3kee.site', 'http://localhost:5173', 'http://127.0.0.1:5173']

function cors(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(origin) ? origin : ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function reply(req: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } })
}

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const fill = (text: string, values: Record<string, string>, escape: (s: string) => string) =>
  text.replace(/\{\{(\w+)\}\}/g, (_, key) => escape(values[key] ?? ''))

async function render(name: string, values: Record<string, string>) {
  const page = await fetch(`${TEMPLATE_URL}${name}.html`)
  if (!page.ok) throw new Error(`template ${name}: ${page.status}`)
  const html = await page.text()
  const subject = html.match(/<title>([^<]*)<\/title>/)?.[1]
  if (!subject) throw new Error(`template ${name}: no subject`)
  return { subject: fill(subject, values, s => s.replace(/[\r\n]+/g, ' ')), html: fill(html, values, escapeHtml) }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) })
  if (req.method !== 'POST') return reply(req, 405, { error: 'method_not_allowed' })

  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return reply(req, 401, { error: 'not_signed_in' })
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const { data: { user }, error: authError } = await admin.auth.getUser(token)
  if (authError || !user?.email) return reply(req, 401, { error: 'not_signed_in' })

  const { template } = await req.json().catch(() => ({}))
  if (template !== 'welcome') return reply(req, 400, { error: 'unknown_template' })
  if (user.user_metadata?.profile_complete !== true) return reply(req, 409, { error: 'profile_incomplete' })
  if (user.app_metadata?.welcome_email_sent_at) return reply(req, 200, { sent: false, reason: 'already_sent' })

  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) return reply(req, 500, { error: 'email_not_configured' })
  try {
    const { subject, html } = await render('welcome', { first_name: String(user.user_metadata?.first_name ?? '').trim() || 'there' })
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `welcome-${user.id}` },
      body: JSON.stringify({ from: FROM, to: [user.email], subject, html }),
    })
    if (!sent.ok) throw new Error(`resend ${sent.status}: ${await sent.text()}`)
  } catch (problem) {
    console.error('send failed', problem)
    return reply(req, 502, { error: 'send_failed' })
  }
  // app_metadata cannot be changed by the user, so this "sent once" mark cannot be reset from the browser.
  await admin.auth.admin.updateUserById(user.id, { app_metadata: { welcome_email_sent_at: new Date().toISOString() } })
  return reply(req, 200, { sent: true })
})

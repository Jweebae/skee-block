// Every booking change on 3kee goes through this function. It runs with the service role, so it re-checks every rule
// itself: prices and durations come from the saved studio settings (never from the browser), times must sit inside
// working hours, and the database refuses overlapping live bookings. Emails go out through Resend (secret
// RESEND_API_KEY) using the templates published at https://3kee.site/email/templates/.
// Deployed with verify_jwt off: some actions are public (busy times), the rest check the caller's token here.
import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2'

const SITE = 'https://3kee.site'
const FROM = '3kee <contact@3kee.site>'
const TEMPLATE_URL = `${SITE}/email/templates/`
const STUDIO_WHATSAPP = '213557660824'
const ORIGINS = ['https://3kee.site', 'https://www.3kee.site', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174']
const OFFSET = '+01:00' // Africa/Algiers, no daylight saving
const BASE_PRICE = 800
const WINDOW_DAYS = 14
const MIN_NOTICE_MINUTES = 60
const CLIENT_CANCEL_HOURS = 3
const MAX_ACTIVE_PER_CLIENT = 2
const LIVE = ['requested', 'confirmed']
const GRAPH = 'https://graph.facebook.com/v22.0'
const UUID = /^[0-9a-f-]{36}$/
const MAX_AMOUNT = 1000000000

class Problem extends Error {
  constructor(public status: number, public code: string) { super(code) }
}
function fail(status: number, code: string): never { throw new Problem(status, code) }

function cors(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(origin) ? origin : ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}
const reply = (req: Request, status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } })

// ---------- time and settings ----------
type Hours = { weekday: number; open: boolean; start: string; end: string; breaks?: { start: string; end: string }[]; breakStart?: string; breakEnd?: string }
type Settings = { services: any[]; addons: any[]; hours: Hours[]; offers?: any[] }

const minutes = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value ?? '') ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN
const instant = (date: string, time: string) => new Date(`${date}T${time}:00${OFFSET}`)
const algiersParts = (at: Date) => {
  const shifted = new Date(at.getTime() + 60 * 60 * 1000).toISOString()
  return { date: shifted.slice(0, 10), time: shifted.slice(11, 16) }
}
const addDays = (date: string, days: number) => {
  const next = new Date(`${date}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + days)
  return next.toISOString().slice(0, 10)
}

// 24:00 only ever means the end of a day. Days saved before breaks became a list have one breakStart and breakEnd.
const dayMinutes = (value: string) => value === '24:00' ? 1440 : minutes(value)
const breaksOf = (day: Hours) => day.breaks ?? (day.breakStart && day.breakEnd ? [{ start: day.breakStart, end: day.breakEnd }] : [])

// The same rule as previewSlots in app/src/settings/studioSettings.js, so keep the two in step.
function slotsFor(hours: Hours[], date: string, duration: number) {
  const day = hours.find(row => row.weekday === new Date(`${date}T12:00:00Z`).getUTCDay())
  if (!day?.open) return []
  const start = dayMinutes(day.start), end = dayMinutes(day.end)
  const pauses = breaksOf(day).map(pause => [dayMinutes(pause.start), dayMinutes(pause.end)])
  const slots: string[] = []
  for (let at = start; at + duration <= end; at += 15) {
    if (pauses.some(([from, to]) => at < to && at + duration > from)) continue
    slots.push(`${String(Math.floor(at / 60)).padStart(2, '0')}:${String(at % 60).padStart(2, '0')}`)
  }
  return slots
}

async function loadSettings(db: SupabaseClient): Promise<Settings> {
  const { data, error } = await db.from('studio_settings').select('payload').eq('id', 'main').maybeSingle()
  if (error || !data?.payload?.services) fail(503, 'settings_unavailable')
  return data!.payload as Settings
}

// Prices and minutes always come from the saved settings.
function priceVisit(settings: Settings, serviceId: string, choices: unknown, { ownerMode = false } = {}) {
  const service = settings.services.find(item => item.id === serviceId && (ownerMode || item.visible !== false))
  if (!service) fail(400, 'unknown_service')
  if (!Array.isArray(choices) || choices.length > 20) fail(400, 'bad_addons')
  const addons: { id: string; name: string; typeId: string; typeName: string; price: number; duration: number }[] = []
  for (const choice of choices as any[]) {
    const addon = settings.addons.find(item => item.id === choice?.addonId && (ownerMode || item.visible !== false))
    const type = addon?.types?.find((item: any) => item.id === choice?.typeId && (ownerMode || item.visible !== false))
    if (!type || addons.some(item => item.id === addon.id)) fail(400, 'bad_addons')
    addons.push({ id: addon.id, name: addon.name, typeId: type.id, typeName: type.name, price: Number(type.price) || 0, duration: Number(type.duration) || 0 })
  }
  const duration = Number(service.duration) + addons.reduce((sum, item) => sum + item.duration, 0)
  const total = BASE_PRICE + addons.reduce((sum, item) => sum + item.price, 0)
  return { service, addons, duration, total }
}

// What a visit costs under an offer. The browser only names the offer: the amount is worked out here from the saved
// settings, by the same rule as offerQuote in app/src/offers/offers.js. An offer that has ended or no longer matches the
// visit is refused, so a client is never charged a different price from the one on their screen.
function quoteOffer(settings: Settings, offerId: unknown, visit: { service: any; addons: { id: string; typeId: string; price: number }[]; total: number }) {
  const offer = (settings.offers ?? []).find(item => item.id === offerId)
  const price = Number(offer?.newPrice) || 0
  const ends = offer?.endsAt ? new Date(`${offer.endsAt}:00${OFFSET}`).getTime() : 0
  if (!offer || offer.visible === false || price <= 0 || (ends && ends <= Date.now())) fail(409, 'offer_ended')
  if (offer.serviceId && offer.serviceId !== visit.service.id) fail(409, 'offer_changed')
  // An add-on the owner has since taken off the menu is no longer part of the deal.
  const included = (offer.addons ?? []).flatMap((choice: any) => {
    const group = settings.addons.find(item => item.id === choice.addonId && item.visible !== false)
    const type = group?.types?.find((item: any) => item.id === choice.typeId && item.visible !== false)
    return type ? [{ id: group.id, typeId: type.id }] : []
  })
  if (!included.every((item: any) => visit.addons.some(chosen => chosen.id === item.id && chosen.typeId === item.typeId))) fail(409, 'offer_changed')
  const extras = visit.addons.filter(chosen => !included.some((item: any) => item.id === chosen.id)).reduce((sum, item) => sum + item.price, 0)
  const total = price + (offer.includesCut ? 0 : BASE_PRICE) + extras
  if (total >= visit.total) fail(409, 'offer_changed')
  return { name: String(offer.name), total }
}

function checkClientTime(settings: Settings, date: string, time: string, duration: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !Number.isFinite(minutes(time))) fail(400, 'bad_time')
  const today = algiersParts(new Date()).date
  if (date < today || date > addDays(today, WINDOW_DAYS)) fail(400, 'outside_window')
  if (!slotsFor(settings.hours, date, duration).includes(time)) fail(400, 'outside_hours')
  if (instant(date, time).getTime() < Date.now() + MIN_NOTICE_MINUTES * 60 * 1000) fail(400, 'too_soon')
}

function checkOwnerTime(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !Number.isFinite(minutes(time))) fail(400, 'bad_time')
}

const cleanText = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max)
// Algerian mobiles only, with or without the first 0 or +213; stored as +213XXXXXXXXX (same rule as app/src/lib/phone.js).
const cleanPhone = (value: unknown) => {
  let digits = String(value ?? '').replace(/\D/g, '')
  if (digits.startsWith('00213')) digits = digits.slice(5)
  else if (digits.startsWith('213') && digits.length > 10) digits = digits.slice(3)
  if (digits.startsWith('0')) digits = digits.slice(1)
  if (!/^[567]\d{8}$/.test(digits)) fail(400, 'bad_phone')
  return `+213${digits}`
}
const phoneDigits = (phone: string | null) => {
  let digits = String(phone ?? '').replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = `213${digits.slice(1)}`
  return digits
}

// ---------- people ----------
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
async function ownerEmails(db: SupabaseClient) {
  const { data } = await db.from('studio_admins').select('user_id')
  const emails: string[] = []
  for (const row of data ?? []) {
    const { data: found } = await db.auth.admin.getUserById(row.user_id)
    if (found?.user?.email) emails.push(found.user.email)
  }
  return emails
}
const fullName = (user: User) => [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ').trim() || user.email!.split('@')[0]

// ---------- emails ----------
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const fill = (text: string, values: Record<string, string>, escape: (s: string) => string) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => escape(values[key] ?? ''))
const money = (amount: number) => `${new Intl.NumberFormat('fr-DZ').format(amount)} DA`
const dayLabel = (at: Date) => new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Algiers' }).format(at)

function emailValues(booking: any, location?: string) {
  const at = new Date(booking.starts_at)
  const extras = (booking.addons ?? []).map((item: any) => item.typeName === 'Standard' ? item.name : `${item.name} (${item.typeName})`).join(', ')
  return {
    first_name: String(booking.client_name ?? '').split(' ')[0] || 'there',
    client_name: booking.client_name ?? '',
    code: booking.code,
    service: booking.service_name,
    extras: extras || 'None',
    date: dayLabel(at),
    time: algiersParts(at).time,
    duration: `${booking.duration_minutes} min`,
    total: booking.offer_name ? `${money(booking.total_price)} (${booking.offer_name}${booking.gift_id ? '' : ' offer'}, usual ${money(booking.usual_price)})` : money(booking.total_price),
    notes: booking.notes || 'None',
    phone: booking.client_phone || 'Not given',
    location_url: location || `https://wa.me/${STUDIO_WHATSAPP}?text=${encodeURIComponent(`Salam Skee, I need the location for booking ${booking.code}.`)}`,
    admin_url: `${SITE}/#admin`,
    account_url: SITE,
    review_url: `${SITE}/#review/${booking.review_token}`,
  }
}

async function sendEmail(to: string[], template: string, values: Record<string, string>, key: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey || !to.length) return false
  try {
    const page = await fetch(`${TEMPLATE_URL}${template}.html`)
    if (!page.ok) throw new Error(`template ${template}: ${page.status}`)
    const html = await page.text()
    const subject = html.match(/<title>([^<]*)<\/title>/)?.[1]
    if (!subject) throw new Error(`template ${template}: no subject`)
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
      body: JSON.stringify({ from: FROM, to, subject: fill(subject, values, s => s.replace(/[\r\n]+/g, ' ')), html: fill(html, values, escapeHtml) }),
    })
    if (!sent.ok) throw new Error(`resend ${sent.status}: ${await sent.text()}`)
    return true
  } catch (problem) {
    console.error('email failed', template, problem)
    return false
  }
}

async function location(db: SupabaseClient) {
  const { data } = await db.from('studio_private').select('location_url, location_note').eq('id', 'main').maybeSingle()
  return data ?? { location_url: null, location_note: null }
}

// The owner's switches in admin → Notifications (table studio_private).
async function switches(db: SupabaseClient) {
  const { data } = await db.from('studio_private').select('client_emails, owner_alerts, whatsapp_messages').eq('id', 'main').maybeSingle()
  return { clientEmails: data?.client_emails !== false, ownerAlerts: data?.owner_alerts !== false, whatsappMessages: data?.whatsapp_messages === true }
}

// Automatic WhatsApp messages use templates approved by Meta (created from admin → WhatsApp). Meta charges for each one,
// so they only go out while the owner's "Automatic WhatsApp messages" switch is on.
const WA_TEMPLATES: Record<string, { name: string; params: (v: Record<string, string>) => string[] }> = {
  'booking-received': { name: 'skee_request_received', params: v => [v.first_name, v.code, v.date, v.time] },
  'booking-confirmed': { name: 'skee_booking_confirmed', params: v => [v.first_name, v.code, v.date, v.time, v.location_url] },
  'booking-changed': { name: 'skee_booking_moved', params: v => [v.first_name, v.code, v.date, v.time] },
  'booking-cancelled': { name: 'skee_booking_cancelled', params: v => [v.first_name, v.code, v.date, v.time] },
  'booking-declined': { name: 'skee_request_declined', params: v => [v.first_name, v.code, v.date, v.time] },
  'booking-reminder': { name: 'skee_day_reminder', params: v => [v.first_name, v.time, v.service, v.location_url] },
  'owner-new-request': { name: 'skee_owner_new_request', params: v => [v.code, v.client_name, v.service, v.date, v.time] },
  'owner-cancelled': { name: 'skee_owner_cancelled', params: v => [v.code, v.client_name, v.date, v.time] },
}

async function sendWhatsApp(db: SupabaseClient, to: string | null, template: string, values: Record<string, string>) {
  const chosen = WA_TEMPLATES[template]
  if (!chosen || !to) return false
  const [{ data: config }, { data: secrets }] = await Promise.all([
    db.from('whatsapp_config').select('phone_number_id').eq('id', 'main').maybeSingle(),
    db.from('whatsapp_secrets').select('access_token').eq('id', 'main').maybeSingle(),
  ])
  if (!config?.phone_number_id || !secrets?.access_token) return false
  try {
    const sent = await fetch(`${GRAPH}/${config.phone_number_id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secrets.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: to.replace(/\D/g, ''), type: 'template', template: { name: chosen.name, language: { code: 'en' }, components: [{ type: 'body', parameters: chosen.params(values).map(text => ({ type: 'text', text: String(text || '-').slice(0, 900) })) }] } }),
    })
    if (!sent.ok) throw new Error(`whatsapp ${sent.status}: ${await sent.text()}`)
    return true
  } catch (problem) {
    console.error('whatsapp failed', template, problem)
    return false
  }
}

// Sends each message about a booking at most once per kind (email and WhatsApp separately) and records it.
async function notifyClient(db: SupabaseClient, booking: any, template: string, kind: string) {
  const flags = await switches(db)
  const log = { ...(booking.emails ?? {}) }
  // The client's own Email switch in their account.
  const { data: profile } = booking.client_id ? await db.from('client_profiles').select('email_notifications').eq('user_id', booking.client_id).maybeSingle() : { data: null }
  const wantsEmail = flags.clientEmails && profile?.email_notifications !== false && booking.client_email && !log[kind]
  const wantsWhatsApp = flags.whatsappMessages && booking.client_phone && booking.reminder_channel === 'whatsapp' && !log[`wa_${kind}`]
  if (!wantsEmail && !wantsWhatsApp) return
  const place = ['booking-confirmed', 'booking-reminder'].includes(template) ? (await location(db)).location_url ?? undefined : undefined
  const values = emailValues(booking, place)
  const now = new Date().toISOString()
  if (wantsEmail && await sendEmail([booking.client_email], template, values, `${kind}-${booking.id}-${booking.updated_at}`)) log[kind] = now
  if (wantsWhatsApp && await sendWhatsApp(db, booking.client_phone, template, values)) log[`wa_${kind}`] = now
  if (JSON.stringify(log) !== JSON.stringify(booking.emails ?? {})) await db.from('bookings').update({ emails: log }).eq('id', booking.id)
}
async function notifyOwners(db: SupabaseClient, booking: any, template: string, kind: string) {
  const flags = await switches(db)
  const values = emailValues(booking)
  if (flags.ownerAlerts) await sendEmail(await ownerEmails(db), template, values, `${kind}-${booking.id}-${booking.updated_at}`)
  if (flags.whatsappMessages) {
    const { data } = await db.from('whatsapp_config').select('owner_alert_number').eq('id', 'main').maybeSingle()
    if (data?.owner_alert_number) await sendWhatsApp(db, data.owner_alert_number, template, values)
  }
}

// ---------- writes ----------
async function insertBooking(db: SupabaseClient, row: Record<string, unknown>) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const digits = attempt < 4 ? 4 : 6
    const code = `SKB-${Math.floor(10 ** (digits - 1) + Math.random() * 9 * 10 ** (digits - 1))}`
    const { data, error } = await db.from('bookings').insert({ ...row, code }).select().single()
    if (!error) return data
    if (error.code === '23P01') fail(409, 'slot_taken')
    if (error.code !== '23505') { console.error('insert failed', error); fail(500, 'save_failed') }
  }
  return fail(500, 'save_failed')
}

async function updateBooking(db: SupabaseClient, id: string, changes: Record<string, unknown>) {
  const { data, error } = await db.from('bookings').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error?.code === '23P01') fail(409, 'slot_taken')
  if (error || !data) { console.error('update failed', error); fail(500, 'save_failed') }
  return data
}

async function getBooking(db: SupabaseClient, id: unknown) {
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) fail(400, 'bad_booking')
  const { data } = await db.from('bookings').select('*').eq('id', id).maybeSingle()
  if (!data) fail(404, 'not_found')
  return data
}

const publicBooking = (b: any) => ({ id: b.id, code: b.code, status: b.status, starts_at: b.starts_at, ends_at: b.ends_at, service_name: b.service_name, total_price: b.total_price })

// ---------- actions ----------
async function busyTimes(db: SupabaseClient, body: any) {
  const from = String(body.from ?? ''), to = String(body.to ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || to < from || to > addDays(from, 31)) fail(400, 'bad_range')
  const { data, error } = await db.from('bookings').select('starts_at, ends_at').in('status', LIVE)
    .lt('starts_at', instant(addDays(to, 1), '00:00').toISOString()).gt('ends_at', instant(from, '00:00').toISOString())
  if (error) fail(500, 'read_failed')
  return { busy: (data ?? []).map(row => ({ start: row.starts_at, end: row.ends_at })) }
}

async function createRequest(db: SupabaseClient, user: User, body: any) {
  if (user.user_metadata?.profile_complete !== true) fail(409, 'profile_incomplete')
  const settings = await loadSettings(db)
  const visit = priceVisit(settings, body.serviceId, body.addons ?? [])
  const deal = body.offerId ? quoteOffer(settings, body.offerId, visit) : null
  checkClientTime(settings, body.date, body.time, visit.duration)
  const phone = cleanPhone(body.phone)
  const channel = body.channel === 'whatsapp' ? 'whatsapp' : 'email'
  const allowed = new Set(visit.service.preferences ?? [])
  const preferences = Array.isArray(body.preferences) ? [...new Set(body.preferences.filter((item: unknown) => typeof item === 'string' && allowed.has(item)))] : []
  const { count } = await db.from('bookings').select('id', { count: 'exact', head: true }).eq('client_id', user.id).in('status', LIVE).gt('ends_at', new Date().toISOString())
  if ((count ?? 0) >= MAX_ACTIVE_PER_CLIENT) fail(409, 'too_many_active')
  const startsAt = instant(body.date, body.time)
  const bookingId = crypto.randomUUID()
  const gift = !deal && body.giftId ? await holdGift(db, user, body.giftId, bookingId) : null
  let booking
  try {
    booking = await insertBooking(db, {
      id: bookingId, client_id: user.id, client_name: fullName(user), client_email: user.email, client_phone: phone,
      service_id: visit.service.id, service_name: visit.service.name, addons: visit.addons, preferences,
      notes: cleanText(body.notes, 1000), reminder_channel: channel, total_price: deal?.total ?? visit.total - (gift ? giftOff(gift, visit.total) : 0), duration_minutes: visit.duration,
      offer_name: deal?.name ?? gift?.title ?? null, usual_price: deal || gift ? visit.total : null, gift_id: gift?.id ?? null,
      starts_at: startsAt.toISOString(), ends_at: new Date(startsAt.getTime() + visit.duration * 60000).toISOString(),
    })
  } catch (problem) {
    if (gift) await releaseGift(db, { id: bookingId, gift_id: gift.id })
    throw problem
  }
  await db.from('client_profiles').upsert({ user_id: user.id, phone, reminder_channel: channel, updated_at: new Date().toISOString() })
  await notifyClient(db, booking, 'booking-received', 'received')
  await notifyOwners(db, booking, 'owner-new-request', 'owner_new')
  return { booking: publicBooking(booking) }
}

async function clientCancel(db: SupabaseClient, user: User, body: any) {
  const booking = await getBooking(db, body.id)
  if (booking.client_id !== user.id) fail(404, 'not_found')
  if (!LIVE.includes(booking.status)) fail(409, 'not_active')
  if (booking.status === 'confirmed' && new Date(booking.starts_at).getTime() - Date.now() < CLIENT_CANCEL_HOURS * 3600000) fail(409, 'too_late')
  if (new Date(booking.starts_at).getTime() <= Date.now()) fail(409, 'too_late')
  const updated = await updateBooking(db, booking.id, { status: 'cancelled', cancelled_by: 'client' })
  await releaseGift(db, booking)
  await notifyClient(db, updated, 'booking-cancelled', 'cancelled')
  await notifyOwners(db, updated, 'owner-cancelled', 'owner_cancelled')
  return { booking: publicBooking(updated) }
}

async function clientReschedule(db: SupabaseClient, user: User, body: any) {
  const booking = await getBooking(db, body.id)
  if (booking.client_id !== user.id) fail(404, 'not_found')
  if (!LIVE.includes(booking.status)) fail(409, 'not_active')
  if (new Date(booking.starts_at).getTime() - Date.now() < CLIENT_CANCEL_HOURS * 3600000) fail(409, 'too_late')
  const settings = await loadSettings(db)
  checkClientTime(settings, body.date, body.time, booking.duration_minutes)
  const startsAt = instant(body.date, body.time)
  // A new time is a new request: Skee confirms it again.
  const updated = await updateBooking(db, booking.id, {
    starts_at: startsAt.toISOString(), ends_at: new Date(startsAt.getTime() + booking.duration_minutes * 60000).toISOString(),
    status: 'requested', emails: {},
  })
  await notifyClient(db, updated, 'booking-received', 'received')
  await notifyOwners(db, updated, 'owner-new-request', 'owner_new')
  return { booking: publicBooking(updated) }
}

async function clientEditRequest(db: SupabaseClient, user: User, body: any) {
  const booking = await getBooking(db, body.id)
  if (booking.client_id !== user.id) fail(404, 'not_found')
  if (booking.status !== 'requested') fail(409, 'already_confirmed')
  const settings = await loadSettings(db)
  const service = settings.services.find(item => item.id === booking.service_id)
  const allowed = new Set(service?.preferences ?? [])
  const preferences = Array.isArray(body.preferences) ? [...new Set(body.preferences.filter((item: unknown) => typeof item === 'string' && allowed.has(item)))] : booking.preferences
  const updated = await updateBooking(db, booking.id, { notes: cleanText(body.notes ?? booking.notes, 1000), preferences })
  return { booking: publicBooking(updated) }
}

async function clientHide(db: SupabaseClient, user: User, body: any) {
  const booking = await getBooking(db, body.id)
  if (booking.client_id !== user.id) fail(404, 'not_found')
  if (LIVE.includes(booking.status) && new Date(booking.ends_at).getTime() > Date.now()) fail(409, 'still_active')
  await updateBooking(db, booking.id, { client_hidden: body.hidden !== false })
  return { ok: true }
}

async function clientLocation(db: SupabaseClient, user: User, body: any) {
  const booking = await getBooking(db, body.id)
  if (booking.client_id !== user.id) fail(404, 'not_found')
  if (booking.status !== 'confirmed' || new Date(booking.ends_at).getTime() < Date.now() - 2 * 3600000) fail(403, 'locked')
  const place = await location(db)
  return { location_url: place.location_url, location_note: place.location_note }
}

const OWNER_MOVES: Record<string, { from: string[]; to: string; afterStart?: boolean }> = {
  confirm: { from: ['requested'], to: 'confirmed' },
  decline: { from: ['requested'], to: 'declined' },
  cancel: { from: ['requested', 'confirmed'], to: 'cancelled' },
  no_show: { from: ['confirmed', 'completed'], to: 'no_show', afterStart: true },
  reopen: { from: ['completed', 'no_show'], to: 'confirmed' },
}

async function ownerUpdate(db: SupabaseClient, body: any) {
  const move = OWNER_MOVES[body.move]
  if (!move) fail(400, 'bad_action')
  const booking = await getBooking(db, body.id)
  if (!move.from.includes(booking.status)) fail(409, 'wrong_status')
  if (move.afterStart && new Date(booking.starts_at).getTime() > Date.now()) fail(409, 'not_started')
  const undoing = move.to === 'no_show' || body.move === 'reopen'
  if (undoing) await refuseIfRepaid(db, booking.id)
  // Reopening fails here if someone took the time meanwhile, so the payment is only removed once this has worked.
  const updated = await updateBooking(db, booking.id, { status: move.to, cancelled_by: move.to === 'cancelled' ? 'studio' : booking.cancelled_by })
  if (undoing) await clearPayment(db, booking.id)
  if (['declined', 'cancelled'].includes(move.to)) await releaseGift(db, booking)
  if (move.to === 'confirmed') await notifyClient(db, updated, 'booking-confirmed', 'confirmed')
  if (move.to === 'declined') await notifyClient(db, updated, 'booking-declined', 'declined')
  if (move.to === 'cancelled') await notifyClient(db, updated, 'booking-cancelled', 'cancelled')
  return { booking: publicBooking(updated) }
}

async function ownerMove(db: SupabaseClient, body: any) {
  const booking = await getBooking(db, body.id)
  if (!LIVE.includes(booking.status)) fail(409, 'wrong_status')
  checkOwnerTime(body.date, body.time)
  const startsAt = instant(body.date, body.time)
  const updated = await updateBooking(db, booking.id, {
    starts_at: startsAt.toISOString(), ends_at: new Date(startsAt.getTime() + booking.duration_minutes * 60000).toISOString(),
    emails: { ...booking.emails, moved: null, reminder: null },
  })
  await notifyClient(db, updated, 'booking-changed', 'moved')
  return { booking: publicBooking(updated) }
}

async function ownerWalkIn(db: SupabaseClient, body: any) {
  const settings = await loadSettings(db)
  const visit = priceVisit(settings, body.serviceId, body.addons ?? [], { ownerMode: true })
  checkOwnerTime(body.date, body.time)
  const name = cleanText(body.name, 121)
  if (!name) fail(400, 'bad_name')
  const phone = body.phone ? cleanPhone(body.phone) : null
  const email = cleanText(body.email, 254).toLowerCase() || null
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail(400, 'bad_email')
  // Attach the visit to an existing client account when the phone number matches.
  let clientId: string | null = null
  if (phone) {
    const { data } = await db.from('client_profiles').select('user_id, phone')
    clientId = (data ?? []).find(row => phoneDigits(row.phone) === phoneDigits(phone))?.user_id ?? null
  }
  const startsAt = instant(body.date, body.time)
  const booking = await insertBooking(db, {
    client_id: clientId, client_name: name, client_email: email, client_phone: phone,
    service_id: visit.service.id, service_name: visit.service.name, addons: visit.addons, preferences: [],
    notes: cleanText(body.notes, 1000), reminder_channel: 'whatsapp', total_price: visit.total, duration_minutes: visit.duration,
    starts_at: startsAt.toISOString(), ends_at: new Date(startsAt.getTime() + visit.duration * 60000).toISOString(),
    status: 'confirmed', source: 'walk_in',
  })
  if (email) await notifyClient(db, booking, 'booking-confirmed', 'confirmed')
  return { booking: publicBooking(booking) }
}

// ---------- closing a visit ----------
// The owner confirms the cut is done and records what came in. What a client paid or owes stays in owner-only tables,
// never on the booking, because clients can read their own bookings.
const wholeAmount = (value: unknown) => {
  const amount = Number(value ?? 0)
  if (!Number.isInteger(amount) || amount < 0 || amount > MAX_AMOUNT) fail(400, 'bad_amount')
  return amount
}

async function debtRepaid(db: SupabaseClient, debtId: string) {
  const { data } = await db.from('money_entries').select('amount').eq('debt_id', debtId)
  return (data ?? []).reduce((sum, row) => sum + row.amount, 0)
}

async function savePayment(db: SupabaseClient, booking: any, body: any) {
  const free = body.free === true
  const received = free ? 0 : wholeAmount(body.received)
  const owed = free ? 0 : wholeAmount(body.debt)
  const { data: debt } = await db.from('client_debts').select('id').eq('booking_id', booking.id).maybeSingle()
  if (debt && owed < await debtRepaid(db, debt.id)) fail(409, 'debt_repaid')
  const note = cleanText(body.note, 500)
  // The day of the visit, or today if it is closed ahead of time, so money never lands on a future date.
  const paidOn = [algiersParts(new Date(booking.starts_at)).date, algiersParts(new Date()).date].sort()[0]
  const { error } = await db.from('visit_payments').upsert({ booking_id: booking.id, amount_received: received, is_free: free, note, paid_on: paidOn, updated_at: new Date().toISOString() })
  if (error) { console.error('payment failed', error); fail(500, 'save_failed') }
  if (owed > 0) {
    const row = { booking_id: booking.id, client_id: booking.client_id, client_name: booking.client_name, client_phone: booking.client_phone, client_email: booking.client_email, amount: owed, note, created_on: paidOn }
    const { error: problem } = await db.from('client_debts').upsert(row, { onConflict: 'booking_id' })
    if (problem) { console.error('debt failed', problem); fail(500, 'save_failed') }
  } else if (debt) await db.from('client_debts').delete().eq('id', debt.id)
}

async function refuseIfRepaid(db: SupabaseClient, bookingId: string) {
  const { data: debt } = await db.from('client_debts').select('id').eq('booking_id', bookingId).maybeSingle()
  if (debt && await debtRepaid(db, debt.id) > 0) fail(409, 'debt_repaid')
}

async function clearPayment(db: SupabaseClient, bookingId: string) {
  await db.from('client_debts').delete().eq('booking_id', bookingId)
  await db.from('visit_payments').delete().eq('booking_id', bookingId)
}

// The amount is saved first, so the review email only goes out for a visit whose payment is recorded. Nothing the owner
// types here reaches the client, not even that the cut was free. A re-save corrects a closed visit and sends nothing.
async function ownerClose(db: SupabaseClient, body: any) {
  const booking = await getBooking(db, body.id)
  if (!['confirmed', 'no_show', 'completed'].includes(booking.status)) fail(409, 'wrong_status')
  await savePayment(db, booking, body)
  const updated = await updateBooking(db, booking.id, { status: 'completed' })
  if (booking.status !== 'completed') await notifyClient(db, updated, 'review-request', 'review_request')
  return { booking: publicBooking(updated) }
}

async function ownerDebtNotify(db: SupabaseClient, body: any) {
  if (typeof body.id !== 'string' || !UUID.test(body.id)) fail(400, 'bad_action')
  const { data: debt } = await db.from('client_debts').select('*').eq('id', body.id).maybeSingle()
  if (!debt) fail(404, 'not_found')
  if (!debt.client_email) fail(409, 'no_email')
  const left = debt.amount - await debtRepaid(db, debt.id)
  if (left <= 0 || debt.forgiven_at) fail(409, 'wrong_status')
  const values = { first_name: String(debt.client_name).split(' ')[0] || 'there', amount: money(left) }
  const sent = await sendEmail([debt.client_email], 'debt-reminder', values, `debt-${debt.id}-${algiersParts(new Date()).date}`)
  if (!sent) fail(502, 'email_failed')
  await db.from('client_debts').update({ last_reminded_at: new Date().toISOString(), reminders: debt.reminders + 1 }).eq('id', debt.id)
  return { ok: true }
}

// ---------- gifts to one client ----------
const giftOff = (gift: any, total: number) => Math.min(total, gift.kind === 'free_cut' ? BASE_PRICE : Number(gift.amount) || 0)

// A gift pays for one booking: the booking holds it, and it comes back if that booking falls through.
async function holdGift(db: SupabaseClient, user: User, giftId: unknown, bookingId: string) {
  if (typeof giftId !== 'string' || !UUID.test(giftId)) fail(409, 'gift_ended')
  const { data: gift } = await db.from('client_gifts').select('*').eq('id', giftId).eq('client_id', user.id).maybeSingle()
  if (!gift || gift.status !== 'active' || (gift.expires_on && gift.expires_on < algiersParts(new Date()).date)) fail(409, 'gift_ended')
  const { data: held } = await db.from('client_gifts').update({ status: 'used', used_booking_id: bookingId }).eq('id', gift.id).eq('status', 'active').select('id')
  if (!held?.length) fail(409, 'gift_ended')
  return gift
}
async function releaseGift(db: SupabaseClient, booking: any) {
  if (booking.gift_id) await db.from('client_gifts').update({ status: 'active', used_booking_id: null }).eq('id', booking.gift_id).eq('used_booking_id', booking.id)
}

async function ownerGift(db: SupabaseClient, body: any) {
  if (typeof body.clientId !== 'string' || !UUID.test(body.clientId)) fail(400, 'bad_gift')
  const kind = body.kind === 'amount_off' ? 'amount_off' : 'free_cut'
  const amount = kind === 'amount_off' ? wholeAmount(body.amount) : 0
  const title = cleanText(body.title, 80)
  const expires = /^\d{4}-\d{2}-\d{2}$/.test(body.expiresOn ?? '') ? body.expiresOn : null
  if (!title || (kind === 'amount_off' && !amount) || amount > 1000000 || (expires && expires < algiersParts(new Date()).date)) fail(400, 'bad_gift')
  const { data: found } = await db.auth.admin.getUserById(body.clientId)
  if (!found?.user?.email) fail(404, 'not_found')
  const message = cleanText(body.message, 500)
  const { data: gift, error } = await db.from('client_gifts').insert({ client_id: body.clientId, kind, amount, title, message, expires_on: expires }).select().single()
  if (error) { console.error('gift failed', error); fail(500, 'save_failed') }
  const values = {
    first_name: found.user.user_metadata?.first_name || found.user.email.split('@')[0], gift_title: title, gift_message: message,
    gift_value: kind === 'free_cut' ? 'One free cut' : `${money(amount)} off your next visit`,
    gift_until: expires ? dayLabel(new Date(`${expires}T12:00:00Z`)) : 'No end date',
    account_url: `${SITE}/#account`,
  }
  return { gift, emailed: await sendEmail([found.user.email], 'client-gift', values, `gift-${gift.id}`) }
}

async function ownerGiftCancel(db: SupabaseClient, body: any) {
  if (typeof body.id !== 'string' || !UUID.test(body.id)) fail(400, 'bad_gift')
  await db.from('client_gifts').update({ status: 'cancelled' }).eq('id', body.id).eq('status', 'active')
  return { ok: true }
}

// ---------- clients ----------
// Names and sign-in details live in the auth service, which browsers cannot list.
async function ownerClients(db: SupabaseClient) {
  const users: User[] = []
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) fail(500, 'read_failed')
    users.push(...data.users)
    if (data.users.length < 1000) break
  }
  const { data: owners } = await db.from('studio_admins').select('user_id')
  const ownerIds = new Set((owners ?? []).map(row => row.user_id))
  return { accounts: users.filter(user => user.email).map(user => ({
    id: user.id, email: user.email, name: fullName(user), created_at: user.created_at, last_sign_in_at: user.last_sign_in_at,
    provider: user.app_metadata?.provider ?? 'email', owner: ownerIds.has(user.id),
  })) }
}

// ---------- reviews ----------
// The link in the review email carries a private token, so a client needs no sign-in and a walk-in with an email can
// answer too. Nothing is published until an owner approves it.
async function bookingByToken(db: SupabaseClient, token: unknown) {
  if (typeof token !== 'string' || !UUID.test(token)) fail(404, 'not_found')
  const { data } = await db.from('bookings').select('*').eq('review_token', token).maybeSingle()
  if (data?.status !== 'completed') fail(404, 'not_found')
  return data
}

async function reviewLookup(db: SupabaseClient, body: any) {
  const booking = await bookingByToken(db, body.token)
  const { data: review } = await db.from('reviews').select('status').eq('booking_id', booking.id).maybeSingle()
  const { data: profile } = booking.client_id ? await db.from('client_profiles').select('avatar_path').eq('user_id', booking.client_id).maybeSingle() : { data: null }
  return { first_name: String(booking.client_name).split(' ')[0], service: booking.service_name, date: booking.starts_at, reviewed: Boolean(review), has_photo: Boolean(profile?.avatar_path) }
}

const publicName = (name: string) => {
  const parts = String(name).trim().split(/\s+/)
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.` : parts[0]
}
function reviewFlags(text: string, rating: number) {
  const flags: string[] = []
  if (rating <= 2) flags.push('low_rating')
  if (/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|site|dz|fr)\b/i.test(text)) flags.push('link')
  if (/\d[\d\s.-]{7,}\d/.test(text)) flags.push('phone_number')
  return flags
}

async function reviewSubmit(db: SupabaseClient, body: any) {
  const booking = await bookingByToken(db, body.token)
  const rating = Number(body.rating)
  const text = cleanText(body.body, 1000)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !text) fail(400, 'bad_review')
  const { error } = await db.from('reviews').insert({
    booking_id: booking.id, client_id: booking.client_id, display_name: publicName(booking.client_name), service_name: booking.service_name,
    rating, body: text, flags: reviewFlags(text, rating), show_photo: body.showPhoto === true,
  })
  if (error?.code === '23505') fail(409, 'already_reviewed')
  if (error) { console.error('review failed', error); fail(500, 'save_failed') }
  const flags = await switches(db)
  if (flags.ownerAlerts) await sendEmail(await ownerEmails(db), 'owner-new-review', { client_name: booking.client_name, service: booking.service_name, rating: `${rating}/5`, review_text: text, admin_url: `${SITE}/#admin` }, `review-${booking.id}`)
  return { ok: true }
}

async function publicReviews(db: SupabaseClient, body: any) {
  const limit = Math.min(Math.max(Math.trunc(Number(body.limit)) || 3, 1), 12)
  const page = Math.max(Math.trunc(Number(body.page)) || 0, 0)
  const { data, count, error } = await db.from('reviews').select('id, display_name, service_name, rating, body, reply, published_at, show_photo, client_id', { count: 'exact' })
    .eq('status', 'approved').order('published_at', { ascending: false }).range(page * limit, page * limit + limit - 1)
  if (error) fail(500, 'read_failed')
  const { data: ratings } = await db.from('reviews').select('rating').eq('status', 'approved')
  const average = ratings?.length ? ratings.reduce((sum, row) => sum + row.rating, 0) / ratings.length : 0
  // A photo appears only when the client chose so for that review. The bucket is private, so these links are short-lived.
  const ids = (data ?? []).filter(row => row.show_photo && row.client_id).map(row => row.client_id)
  const { data: profiles } = ids.length ? await db.from('client_profiles').select('user_id, avatar_path').in('user_id', ids).not('avatar_path', 'is', null) : { data: [] }
  const paths = (profiles ?? []).map(row => row.avatar_path)
  const { data: links } = paths.length ? await db.storage.from('client-photos').createSignedUrls(paths, 3600) : { data: [] }
  const photos = Object.fromEntries((profiles ?? []).map((row, index) => [row.user_id, links?.[index]?.signedUrl ?? null]))
  return {
    total: count ?? 0, average,
    reviews: (data ?? []).map(({ client_id, show_photo, ...row }) => ({ ...row, photo: show_photo ? photos[client_id] ?? null : null })),
  }
}

async function ownerReview(db: SupabaseClient, body: any) {
  if (typeof body.id !== 'string' || !UUID.test(body.id)) fail(400, 'bad_action')
  if (body.move === 'delete') {
    const { error } = await db.from('reviews').delete().eq('id', body.id)
    if (error) fail(500, 'save_failed')
    return { ok: true }
  }
  const changes: Record<string, unknown> = {}
  if (body.move === 'approve') { changes.status = 'approved'; changes.published_at = new Date().toISOString() }
  else if (body.move === 'reject') { changes.status = 'rejected'; changes.published_at = null }
  else if (body.move !== 'reply') fail(400, 'bad_action')
  if (body.reply !== undefined) changes.reply = cleanText(body.reply, 600) || null
  const { error } = await db.from('reviews').update(changes).eq('id', body.id)
  if (error) fail(500, 'save_failed')
  return { ok: true }
}

// ---------- router ----------
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) })
  if (req.method !== 'POST') return reply(req, 405, { error: 'method_not_allowed' })
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body.action ?? '')
    if (action === 'busy') return reply(req, 200, await busyTimes(db, body))
    const publicActions: Record<string, (db: SupabaseClient, body: any) => Promise<unknown>> = {
      reviews: publicReviews, review_lookup: reviewLookup, review_submit: reviewSubmit,
    }
    if (Object.hasOwn(publicActions, action)) return reply(req, 200, await publicActions[action](db, body))

    const user = await caller(req, db)
    if (!user?.email) fail(401, 'not_signed_in')
    const clientActions: Record<string, (db: SupabaseClient, user: User, body: any) => Promise<unknown>> = {
      create: createRequest, cancel: clientCancel, reschedule: clientReschedule, edit: clientEditRequest, hide: clientHide, location: clientLocation,
    }
    if (clientActions[action]) return reply(req, 200, await clientActions[action](db, user!, body))

    if (!await isOwner(db, user!.id)) fail(403, 'not_allowed')
    const ownerActions: Record<string, (db: SupabaseClient, body: any) => Promise<unknown>> = {
      owner_update: ownerUpdate, owner_move: ownerMove, walk_in: ownerWalkIn, owner_close: ownerClose, owner_debt_notify: ownerDebtNotify,
      owner_gift: ownerGift, owner_gift_cancel: ownerGiftCancel, owner_clients: ownerClients, owner_review: ownerReview,
    }
    if (ownerActions[action]) return reply(req, 200, await ownerActions[action](db, body))
    fail(400, 'unknown_action')
  } catch (problem) {
    if (problem instanceof Problem) return reply(req, problem.status, { error: problem.code })
    console.error('bookings failed', problem)
    return reply(req, 500, { error: 'server_error' })
  }
})

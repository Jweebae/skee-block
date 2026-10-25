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
type Hours = { weekday: number; open: boolean; start: string; end: string; breakStart: string; breakEnd: string }
type Settings = { services: any[]; addons: any[]; hours: Hours[] }

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

function slotsFor(hours: Hours[], date: string, duration: number) {
  const day = hours.find(row => row.weekday === new Date(`${date}T12:00:00Z`).getUTCDay())
  if (!day?.open) return []
  const start = minutes(day.start), end = minutes(day.end), breakStart = minutes(day.breakStart), breakEnd = minutes(day.breakEnd)
  const slots: string[] = []
  for (let at = start; at + duration <= end; at += 15) {
    if (Number.isFinite(breakStart) && Number.isFinite(breakEnd) && at < breakEnd && at + duration > breakStart) continue
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
    total: money(booking.total_price),
    notes: booking.notes || 'None',
    phone: booking.client_phone || 'Not given',
    location_url: location || `https://wa.me/${STUDIO_WHATSAPP}?text=${encodeURIComponent(`Salam Skee, I need the location for booking ${booking.code}.`)}`,
    admin_url: `${SITE}/#admin`,
    account_url: SITE,
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
  const { data } = await db.from('studio_private').select('client_emails, owner_alerts').eq('id', 'main').maybeSingle()
  return { clientEmails: data?.client_emails !== false, ownerAlerts: data?.owner_alerts !== false }
}

// Sends one email about a booking at most once per kind, and records it on the booking.
async function notifyClient(db: SupabaseClient, booking: any, template: string, kind: string) {
  if (!booking.client_email || booking.emails?.[kind]) return
  if (!(await switches(db)).clientEmails) return
  const place = ['booking-confirmed', 'booking-reminder'].includes(template) ? (await location(db)).location_url ?? undefined : undefined
  const ok = await sendEmail([booking.client_email], template, emailValues(booking, place), `${kind}-${booking.id}-${booking.updated_at}`)
  if (ok) await db.from('bookings').update({ emails: { ...booking.emails, [kind]: new Date().toISOString() } }).eq('id', booking.id)
}
async function notifyOwners(db: SupabaseClient, booking: any, template: string, kind: string) {
  if (!(await switches(db)).ownerAlerts) return
  await sendEmail(await ownerEmails(db), template, emailValues(booking), `${kind}-${booking.id}-${booking.updated_at}`)
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
  checkClientTime(settings, body.date, body.time, visit.duration)
  const phone = cleanPhone(body.phone)
  const channel = body.channel === 'whatsapp' ? 'whatsapp' : 'email'
  const allowed = new Set(visit.service.preferences ?? [])
  const preferences = Array.isArray(body.preferences) ? [...new Set(body.preferences.filter((item: unknown) => typeof item === 'string' && allowed.has(item)))] : []
  const { count } = await db.from('bookings').select('id', { count: 'exact', head: true }).eq('client_id', user.id).in('status', LIVE).gt('ends_at', new Date().toISOString())
  if ((count ?? 0) >= MAX_ACTIVE_PER_CLIENT) fail(409, 'too_many_active')
  const startsAt = instant(body.date, body.time)
  const booking = await insertBooking(db, {
    client_id: user.id, client_name: fullName(user), client_email: user.email, client_phone: phone,
    service_id: visit.service.id, service_name: visit.service.name, addons: visit.addons, preferences,
    notes: cleanText(body.notes, 1000), reminder_channel: channel, total_price: visit.total, duration_minutes: visit.duration,
    starts_at: startsAt.toISOString(), ends_at: new Date(startsAt.getTime() + visit.duration * 60000).toISOString(),
  })
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
  complete: { from: ['confirmed', 'no_show'], to: 'completed', afterStart: true },
  no_show: { from: ['confirmed', 'completed'], to: 'no_show', afterStart: true },
}

async function ownerUpdate(db: SupabaseClient, body: any) {
  const move = OWNER_MOVES[body.move]
  if (!move) fail(400, 'bad_action')
  const booking = await getBooking(db, body.id)
  if (!move.from.includes(booking.status)) fail(409, 'wrong_status')
  if (move.afterStart && new Date(booking.starts_at).getTime() > Date.now()) fail(409, 'not_started')
  const updated = await updateBooking(db, booking.id, { status: move.to, cancelled_by: move.to === 'cancelled' ? 'studio' : booking.cancelled_by })
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

// ---------- router ----------
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) })
  if (req.method !== 'POST') return reply(req, 405, { error: 'method_not_allowed' })
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body.action ?? '')
    if (action === 'busy') return reply(req, 200, await busyTimes(db, body))

    const user = await caller(req, db)
    if (!user?.email) fail(401, 'not_signed_in')
    const clientActions: Record<string, (db: SupabaseClient, user: User, body: any) => Promise<unknown>> = {
      create: createRequest, cancel: clientCancel, reschedule: clientReschedule, edit: clientEditRequest, hide: clientHide, location: clientLocation,
    }
    if (clientActions[action]) return reply(req, 200, await clientActions[action](db, user!, body))

    if (!await isOwner(db, user!.id)) fail(403, 'not_allowed')
    const ownerActions: Record<string, (db: SupabaseClient, body: any) => Promise<unknown>> = {
      owner_update: ownerUpdate, owner_move: ownerMove, walk_in: ownerWalkIn,
    }
    if (ownerActions[action]) return reply(req, 200, await ownerActions[action](db, body))
    fail(400, 'unknown_action')
  } catch (problem) {
    if (problem instanceof Problem) return reply(req, problem.status, { error: problem.code })
    console.error('bookings failed', problem)
    return reply(req, 500, { error: 'server_error' })
  }
})

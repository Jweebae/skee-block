import { BASE_CUT_PRICE, SERVICES, PREVIEW_ADDONS, TREATMENT_ADDONS } from '../booking/catalog'
import { MAX_OFFERS, MAX_OFFER_PHOTOS } from '../offers/offers'

export const SETTINGS_KEY = 'skee.studio-settings.v1'
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const PREFERENCES = {
  signature: ['Keep length on top', 'Scissor finish', 'Natural hairline'],
  fade: ['Low fade', 'Mid fade', 'High fade'],
  beard: ['Natural shape', 'Defined edges', 'Keep the length'],
  shave: ['Sensitive skin', 'Clean shave'],
  pair: ['Natural finish', 'Sharp finish'],
  ritual: ['Classic finish', 'Textured finish'],
}

export function createDefaultSettings() {
  return {
    version: 2,
    services: SERVICES.map((item, index) => ({ ...item, visible: true, preferences: PREFERENCES[item.id], category: ['Signature', 'Fade', 'Beard', 'Ritual', 'Pair', 'The full hour and a half'][index] })),
    addons: structuredClone(PREVIEW_ADDONS),
    hours: WEEKDAYS.map((day, weekday) => ({ weekday, day, open: weekday !== 5, start: '10:00', end: '20:00', breakStart: '13:00', breakEnd: '14:00' })),
    offers: [],
  }
}

function text(value, label, max, required = true) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error(`${label}: enter ${required ? 'a value of ' : 'up to '}${max} characters or fewer.`)
  return value.trim()
}

function integer(value, label, min, max) {
  if (!['string', 'number'].includes(typeof value) || (typeof value === 'string' && !value.trim()) || !Number.isInteger(Number(value)) || Number(value) < min || Number(value) > max) throw new Error(`${label}: enter a whole number from ${min} to ${max}.`)
  return Number(value)
}

// Cut photos live in the public Supabase Storage bucket `cut-photos` (uploaded from admin → Cuts).
const PHOTO_URL = /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/cut-photos\/[A-Za-z0-9._/-]+\.(webp|jpe?g)$/
export const MAX_CUT_PHOTOS = 8
function photoList(value, label) {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > MAX_CUT_PHOTOS) throw new Error(`${label}: use up to ${MAX_CUT_PHOTOS} photos.`)
  return [...new Set(value.filter(url => typeof url === 'string' && PHOTO_URL.test(url)))]
}

// Offers shown above the menu. An empty end time means the offer runs until the owner hides it.
function offerEndsAt(value, label) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(text)) throw new Error(`${label}: choose a valid end date and time, or leave it empty.`)
  return text
}

export function timeInMinutes(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return NaN
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

export function validateSettings(input) {
  if (!input || input.version !== 2 || !Array.isArray(input.services) || !Array.isArray(input.addons) || !Array.isArray(input.hours)) throw new Error('The saved studio settings have an unsupported format.')
  if (input.services.length > 100 || input.addons.length > 100 || input.hours.length !== 7) throw new Error('Check the studio menu and the seven working days.')
  const ids = new Set()
  function identity(item, label) {
    if (!item || typeof item !== 'object') throw new Error(`${label}: check the saved details.`)
    const id = text(item.id, `${label} ID`, 80)
    if (!/^[a-zA-Z0-9-]+$/.test(id) || ids.has(id)) throw new Error('Each cut, add-on and type needs a unique ID.')
    ids.add(id)
    return { id, name: text(item.name, `${label} name`, 80), description: text(item.description, `${label} description`, 500, false), visible: item.visible !== false }
  }
  const services = input.services.map(item => {
    const base = identity(item, 'Cut')
    if (!Array.isArray(item.preferences) || item.preferences.length > 30) throw new Error(`${base.name}: use up to 30 preferences.`)
    return { ...base, photos: photoList(item.photos, base.name), duration: integer(item.duration, `${base.name} duration`, 5, 240), category: text(item.category || 'Cut', 'Category', 60), preferences: [...new Set(item.preferences.map(value => text(value, 'Preference', 100, false)).filter(Boolean))] }
  })
  const addons = input.addons.map(item => {
    const base = identity(item, 'Add-on')
    if (!Array.isArray(item.types) || item.types.length > 30) throw new Error(`${base.name}: use up to 30 types.`)
    const types = item.types.map(type => ({ ...identity(type, `${base.name} type`), duration: integer(type.duration, `${base.name} / ${type.name} extra minutes`, 0, 120), price: integer(type.price, `${base.name} / ${type.name} price`, 0, 100000) }))
    return { ...base, types }
  })
  const hours = WEEKDAYS.map((day, weekday) => {
    const item = input.hours.find(row => row.weekday === weekday)
    if (!item) throw new Error(`Working hours for ${day} are missing.`)
    const open = Boolean(item.open)
    const start = item.start || '10:00', end = item.end || '20:00'
    const breakStart = item.breakStart || '', breakEnd = item.breakEnd || ''
    if (!Number.isFinite(timeInMinutes(start)) || !Number.isFinite(timeInMinutes(end))) throw new Error(`${day}: enter valid opening and closing times.`)
    if (open && timeInMinutes(start) >= timeInMinutes(end)) throw new Error(`${day}: closing time must be after opening time. Overnight hours are not supported yet.`)
    if (open && Boolean(breakStart) !== Boolean(breakEnd)) throw new Error(`${day}: enter both break times, or leave both empty.`)
    if (open && breakStart && (!Number.isFinite(timeInMinutes(breakStart)) || !Number.isFinite(timeInMinutes(breakEnd)) || timeInMinutes(breakStart) < timeInMinutes(start) || timeInMinutes(breakStart) >= timeInMinutes(breakEnd) || timeInMinutes(breakEnd) > timeInMinutes(end))) throw new Error(`${day}: the break must sit inside working hours, with its end after its start.`)
    return { weekday, day, open, start, end, breakStart, breakEnd }
  })
  const serviceIds = new Set(services.map(item => item.id))
  const offers = (Array.isArray(input.offers) ? input.offers : []).slice(0, MAX_OFFERS).map(item => {
    const base = identity(item, 'Offer')
    const price = (value, label) => (value === '' || value === null || value === undefined ? 0 : integer(value, label, 0, 100000))
    const oldPrice = price(item.oldPrice, `${base.name} old price`)
    const newPrice = price(item.newPrice, `${base.name} offer price`)
    if (oldPrice > 0 && newPrice > 0 && newPrice >= oldPrice) throw new Error(`${base.name}: the offer price must be lower than the old price.`)
    return {
      ...base,
      label: text(item.label || 'Offer', 'Offer tag', 24),
      serviceId: serviceIds.has(item.serviceId) ? item.serviceId : '',
      photos: photoList(item.photos, base.name).slice(0, MAX_OFFER_PHOTOS),
      oldPrice, newPrice,
      endsAt: offerEndsAt(item.endsAt, base.name),
    }
  })
  // No editable base-price field: this business rule is always 800 DA.
  return { version: 2, services, addons, hours, offers, basePrice: BASE_CUT_PRICE }
}

export function migrateSettings(input) {
  if (input?.version !== 1) return validateSettings(input)
  // Retain the old key and all saved edits. An old flat extra becomes one type.
  const migrated = validateSettings({ ...input, version: 2, addons: input.addons?.map(item => ({
    ...item, types: [{ id: `type-${crypto.randomUUID()}`, name: 'Standard', description: item.description, price: item.price, duration: item.duration, visible: true }],
  })) })
  const samples = TREATMENT_ADDONS.filter(item => !migrated.addons.some(saved => saved.id === item.id || saved.name.toLowerCase() === item.name.toLowerCase())).slice(0, 100 - migrated.addons.length)
  return validateSettings({ ...migrated, addons: [...structuredClone(samples), ...migrated.addons] })
}

export function readSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return { settings: raw ? migrateSettings(JSON.parse(raw)) : createDefaultSettings(), error: '' }
  } catch {
    return { settings: createDefaultSettings(), error: 'Saved settings could not be loaded. Sample settings are shown; saving will replace the browser’s saved copy.' }
  }
}

export function previewSlots(hours, dateId, duration) {
  if (!dateId || !Number.isFinite(duration) || duration <= 0) return []
  const day = hours.find(row => row.weekday === new Date(`${dateId}T12:00:00Z`).getUTCDay())
  if (!day?.open) return []
  const slots = [], start = timeInMinutes(day.start), end = timeInMinutes(day.end)
  const breakStart = timeInMinutes(day.breakStart), breakEnd = timeInMinutes(day.breakEnd)
  for (let at = start; at + duration <= end; at += 15) {
    if (Number.isFinite(breakStart) && Number.isFinite(breakEnd) && at < breakEnd && at + duration > breakStart) continue
    slots.push(`${String(Math.floor(at / 60)).padStart(2, '0')}:${String(at % 60).padStart(2, '0')}`)
  }
  return slots
}

// "Open now · until 20:00", "Today · 10:00", "Tomorrow · 10:00" or "Saturday · 10:00", in M'Sila time (UTC+1, no DST).
export function nextOpening(hours, now = Date.now()) {
  const local = new Date(now + 3600000)
  const minute = local.getUTCHours() * 60 + local.getUTCMinutes()
  for (let offset = 0; offset < 8; offset++) {
    const day = hours.find(row => row.weekday === (local.getUTCDay() + offset) % 7)
    if (!day?.open) continue
    const start = timeInMinutes(day.start), end = timeInMinutes(day.end)
    const breakStart = timeInMinutes(day.breakStart), breakEnd = timeInMinutes(day.breakEnd)
    if (offset === 0) {
      if (minute >= end) continue
      if (minute >= start) {
        if (Number.isFinite(breakStart) && minute >= breakStart && minute < breakEnd) return `Today · back at ${day.breakEnd}`
        return `Open now · until ${Number.isFinite(breakStart) && minute < breakStart ? day.breakStart : day.end}`
      }
      return `Today · ${day.start}`
    }
    return `${offset === 1 ? 'Tomorrow' : WEEKDAYS[day.weekday]} · ${day.start}`
  }
  return 'See weekly hours'
}

import { supabase } from './supabase'

// Every booking change goes through the `bookings` Edge Function, which re-checks prices, hours and overlaps.
const MESSAGES = {
  slot_taken: 'Someone has just taken this time. Choose another time.',
  too_soon: 'This time is too soon. Bookings need at least one hour’s notice.',
  outside_hours: 'This time is outside the studio’s hours. Choose another time.',
  outside_window: 'Choose a date within the next two weeks.',
  too_many_active: 'You already have two upcoming appointments or requests. Cancel one, or message Skee on WhatsApp.',
  profile_incomplete: 'Finish creating your account first.',
  bad_phone: 'Check the WhatsApp number: an Algerian mobile, with or without the first 0, for example 0555 12 34 56.',
  unknown_service: 'This cut is no longer on the menu. Choose another cut.',
  bad_addons: 'One of the add-ons changed. Check your add-ons again.',
  too_late: 'It is too late to change this appointment online. Message Skee on WhatsApp.',
  not_active: 'This appointment can no longer be changed.',
  already_confirmed: 'Skee has already confirmed this appointment. Message Skee on WhatsApp to change it.',
  wrong_status: 'This appointment has changed meanwhile. Refresh and try again.',
  not_started: 'You can mark a visit done or missed only after it has started.',
  not_signed_in: 'Your sign-in has expired. Sign in again.',
  not_allowed: 'Only owners can do this.',
  locked: 'The location unlocks once Skee confirms your appointment.',
  bad_name: 'Enter the client’s name.',
  bad_email: 'Check the email address.',
  bad_action: 'This change is not possible. Refresh the page and try again.',
  unknown_action: 'This change is not possible. Refresh the page and try again.',
}

export class BookingError extends Error {
  constructor(code) {
    super(MESSAGES[code] || 'Something went wrong. Check your connection and try again.')
    this.code = code
  }
}

export async function callBookings(action, body = {}) {
  if (!supabase) throw new BookingError('unavailable')
  // `action` names the job and always comes last, so nothing in `body` can replace it.
  const { data, error } = await supabase.functions.invoke('bookings', { body: { ...body, action } })
  if (!error) return data
  let code = 'server_error'
  try { code = (await error.context?.json())?.error || code } catch { /* not JSON */ }
  throw new BookingError(code)
}

// Algeria keeps UTC+1 all year.
export const algiersInstant = (dateId, time) => new Date(`${dateId}T${time}:00+01:00`)
export function algiersParts(value) {
  const shifted = new Date(new Date(value).getTime() + 3600000).toISOString()
  return { date: shifted.slice(0, 10), time: shifted.slice(11, 16) }
}
export const dayLabel = (value, options = { weekday: 'long', day: 'numeric', month: 'long' }) =>
  new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'Africa/Algiers' }).format(new Date(value))

export function freeTimes(times, dateId, duration, busy) {
  return times.filter(time => {
    const start = algiersInstant(dateId, time).getTime(), end = start + duration * 60000
    return start > Date.now() + 3600000 && !busy.some(slot => start < new Date(slot.end).getTime() && end > new Date(slot.start).getTime())
  })
}

export const STATUS_LABELS = {
  requested: 'Under review', confirmed: 'Confirmed', declined: 'Declined', cancelled: 'Cancelled',
  completed: 'Completed', no_show: 'Missed', expired: 'Expired',
}

export function whatsappLink(phone, text) {
  let digits = String(phone || '').replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = `213${digits.slice(1)}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

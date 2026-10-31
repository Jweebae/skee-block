import { BASE_CUT_PRICE } from '../booking/catalog'

// Flash deals shown above the service menu. Saved with the studio settings, so they reach every device the same way
// the menu does. Algeria keeps UTC+1 all year, so an end time typed by the owner is read in M'Sila time.
export const MAX_OFFERS = 3
export const MAX_OFFER_PHOTOS = 5
export const MAX_OFFER_ITEMS = 8

export const offerEnd = offer => (offer?.endsAt ? new Date(`${offer.endsAt}:00+01:00`).getTime() : 0)

// Live offers only: visible, and not past their end time.
export function liveOffers(offers, now) {
  return (offers || []).filter(offer => offer.visible !== false && (!offer.endsAt || offerEnd(offer) > now)).slice(0, MAX_OFFERS)
}

export const MAX_OFFER_ADDONS = 20

// What the offer is made of: add-ons picked from the studio menu (which are really applied to the booking),
// then any extra lines the owner typed by hand. Menu prices are read fresh, so an edited menu is never out of date.
export function offerLines(offer, menu = [], cutName = '') {
  const lines = []
  // The cut itself is listed only when the deal's price covers it.
  if (offer?.includesCut) lines.push({ id: 'base-cut', name: cutName || 'Haircut', price: BASE_CUT_PRICE })
  for (const choice of offer?.addons || []) {
    const group = menu.find(item => item.id === choice.addonId && item.visible !== false)
    const type = group?.types?.find(item => item.id === choice.typeId && item.visible !== false)
    if (!group || !type) continue
    lines.push({ id: `${group.id}-${type.id}`, name: type.name === 'Standard' ? group.name : `${group.name} · ${type.name}`, price: Number(type.price) || 0 })
  }
  for (const item of offer?.items || []) lines.push({ id: item.id, name: item.name, price: Number(item.price) || 0 })
  return lines
}

export const linesTotal = lines => lines.reduce((sum, line) => sum + (Number(line.price) || 0), 0)

// Booking takes the add-ons as a map of group to chosen type.
export const offerAddonMap = offer => Object.fromEntries((offer?.addons || []).map(choice => [choice.addonId, choice.typeId]))

// What a visit costs under an offer, or null when the client's choices no longer match the deal. Add-ons on top of the
// deal are charged normally, and so is the cut when the deal does not cover it. The bookings Edge Function applies this
// same rule (quoteOffer) and saves the result, so keep the two in step.
export function offerQuote(offer, { serviceId, addons = [], menu = [], normalTotal = 0, now = 0 }) {
  const price = Number(offer?.newPrice) || 0
  if (!offer || offer.visible === false || price <= 0 || (offer.endsAt && offerEnd(offer) <= now)) return null
  if (offer.serviceId && offer.serviceId !== serviceId) return null
  // An add-on the owner has since taken off the menu is no longer part of the deal.
  const included = (offer.addons || []).flatMap(choice => {
    const group = menu.find(item => item.id === choice.addonId && item.visible !== false)
    const type = group?.types?.find(item => item.id === choice.typeId && item.visible !== false)
    return type ? [{ id: group.id, typeId: type.id }] : []
  })
  if (!included.every(item => addons.some(chosen => chosen.id === item.id && chosen.typeId === item.typeId))) return null
  const extras = addons.filter(chosen => !included.some(item => item.id === chosen.id)).reduce((sum, item) => sum + item.price, 0)
  const total = price + (offer.includesCut ? 0 : BASE_CUT_PRICE) + extras
  return total < normalTotal ? { name: offer.name, total } : null
}

export function offerPercent(offer) {
  const was = Number(offer?.oldPrice) || 0
  const now = Number(offer?.newPrice) || 0
  return was > 0 && now > 0 && now < was ? Math.round((1 - now / was) * 100) : 0
}

// "2 days 04 h", "04 h 09 m", "09 m 12 s" — the unit shrinks as the deadline gets close.
export function countdownText(endsAt, now) {
  const left = endsAt - now
  if (left <= 0) return ''
  const days = Math.floor(left / 86400000)
  const hours = Math.floor(left / 3600000) % 24
  const minutes = Math.floor(left / 60000) % 60
  const seconds = Math.floor(left / 1000) % 60
  const pad = value => String(value).padStart(2, '0')
  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ${pad(hours)} h`
  if (hours > 0) return `${pad(hours)} h ${pad(minutes)} m`
  return `${pad(minutes)} m ${pad(seconds)} s`
}

// How often the countdown needs redrawing: once a second in the last hour, once a minute before that.
export const countdownStep = (endsAt, now) => (endsAt - now < 3600000 ? 1000 : 60000)

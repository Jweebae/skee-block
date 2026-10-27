// Flash deals shown above the service menu. Saved with the studio settings, so they reach every device the same way
// the menu does. Algeria keeps UTC+1 all year, so an end time typed by the owner is read in M'Sila time.
export const MAX_OFFERS = 3
export const MAX_OFFER_PHOTOS = 5

export const offerEnd = offer => (offer?.endsAt ? new Date(`${offer.endsAt}:00+01:00`).getTime() : 0)

// Live offers only: visible, and not past their end time.
export function liveOffers(offers, now) {
  return (offers || []).filter(offer => offer.visible !== false && (!offer.endsAt || offerEnd(offer) > now)).slice(0, MAX_OFFERS)
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

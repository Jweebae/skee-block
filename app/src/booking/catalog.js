// Initial sample menu from the approved design. Admin settings override these defaults.
export const BASE_CUT_PRICE = 800

export const SERVICES = [
  { id: 'signature', name: 'The Signature Cut', duration: 45, description: 'Consultation, precision scissor and clipper work, hot towel finish, styled to wear.' },
  { id: 'fade', name: 'Skin Fade', duration: 45, description: 'Foil-shaver fade blended to the scalp, razor-sharp line-up, texture on top.' },
  { id: 'beard', name: 'Beard Sculpt', duration: 30, description: 'Shape and weight, straight-razor edges, hot towel and oil to finish.' },
  { id: 'shave', name: 'Hot Towel Shave', duration: 40, description: 'Pre-shave oil, two hot towels, straight razor, cold towel and balm.' },
  { id: 'pair', name: 'Cut & Beard', duration: 60, description: 'The Signature Cut, with an optional beard sculpt added separately to your booking.' },
  { id: 'ritual', name: 'The Block Ritual', duration: 90, description: 'Start with your cut. Add beard care, hot towel shave or a black-mask facial at booking; extras are charged separately.' },
]

// Editable samples only, not approved live prices or treatment specifications.
export const TREATMENT_ADDONS = [
  { id: 'protein', name: 'Protein hair treatment', description: 'Choose your protein treatment type.', types: [
    { id: 'protein-classic', name: 'Classic protein', description: 'Sample protein treatment option for the current menu.', duration: 45, price: 2000, visible: true },
    { id: 'protein-premium', name: 'Premium protein', description: 'Sample alternative protein treatment with extra appointment time.', duration: 60, price: 3000, visible: true },
  ], visible: true },
  { id: 'gommage', name: 'Gommage', description: 'Exfoliation care, with your choice of treatment.', types: [
    { id: 'gommage-face', name: 'Face gommage', description: 'Sample facial exfoliation option.', duration: 15, price: 500, visible: true },
    { id: 'gommage-scalp', name: 'Scalp gommage', description: 'Sample scalp exfoliation option.', duration: 20, price: 700, visible: true },
  ], visible: true },
]

// Remaining sample extras from board 03, each with an editable starting type.
export const PREVIEW_ADDONS = [
  ...TREATMENT_ADDONS,
  { id: 'wash', name: 'Wash & scalp massage', description: 'Cleanse, five-minute massage, cool rinse.', duration: 10, price: 400 },
  { id: 'mask', name: 'Black mask facial', description: 'Charcoal peel-off and hot towel.', duration: 15, price: 500 },
  { id: 'brow', name: 'Brow detail', description: 'Razor clean-up and shape.', duration: 5, price: 300 },
  { id: 'design', name: 'Hair design / hard part', description: 'Razor-cut line or pattern.', duration: 10, price: 300 },
].map(item => item.types ? item : ({
  id: item.id, name: item.name, description: item.description, visible: true,
  types: [{ id: `${item.id}-standard`, name: 'Standard', description: item.description, duration: item.duration, price: item.price, visible: true }],
}))

export function formatPrice(amount) {
  return `${new Intl.NumberFormat('fr-DZ').format(amount)} DA`
}

export function getPreviewDates(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Africa/Algiers', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = type => parts.find(item => item.type === type).value
  const today = new Date(`${part('year')}-${part('month')}-${part('day')}T12:00:00Z`)
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today)
    date.setUTCDate(date.getUTCDate() + index + 1)
    return {
      id: date.toISOString().slice(0, 10),
      weekday: date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
      day: date.getUTCDate(),
      month: date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }),
      label: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' }),
    }
  })
}

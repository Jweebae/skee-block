// The owner's book: who the clients are, what they owe, and where the money went. Plain calculations with no database
// calls, so the totals can be tested on their own. Dates are M'Sila days (UTC+1 all year).
export const dayOf = value => new Date(new Date(value).getTime() + 3600000).toISOString().slice(0, 10)

function phoneDigits(phone) {
  let digits = String(phone || '').replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = `213${digits.slice(1)}`
  return digits
}

const sum = (rows, read) => rows.reduce((total, row) => total + (Number(read(row)) || 0), 0)

// A client is an account, else a phone number, else a name: walk-ins often have no account.
const fallbackKey = row => (row.client_phone ? phoneDigits(row.client_phone) : `name:${String(row.client_name || '').trim().toLowerCase()}`)

// The same phone number on a walk-in and on an account is one person.
export function clientResolver(bookings = [], profiles = []) {
  const owners = new Map()
  for (const row of profiles) if (row.phone) owners.set(phoneDigits(row.phone), row.user_id)
  for (const row of bookings) if (row.client_id && row.client_phone) owners.set(phoneDigits(row.client_phone), row.client_id)
  return row => row.client_id || owners.get(phoneDigits(row.client_phone)) || fallbackKey(row)
}

export function withRepayments(debts = [], entries = []) {
  const paid = new Map()
  for (const entry of entries) if (entry.debt_id) paid.set(entry.debt_id, (paid.get(entry.debt_id) || 0) + entry.amount)
  return debts.map(debt => {
    const repaid = paid.get(debt.id) || 0
    const left = debt.forgiven_at ? 0 : Math.max(debt.amount - repaid, 0)
    return { ...debt, repaid, left, state: debt.forgiven_at ? 'forgiven' : left ? 'open' : 'paid' }
  })
}

export function buildClients({ bookings = [], payments = [], debts = [], entries = [], profiles = [], accounts = [], cards = [], gifts = [], now = 0 }) {
  const keyOf = clientResolver(bookings, profiles)
  const paidFor = new Map(payments.map(row => [row.booking_id, row]))
  const profileOf = new Map(profiles.map(row => [row.user_id, row]))
  const accountOf = new Map(accounts.map(row => [row.id, row]))
  const cardOf = new Map(cards.map(row => [row.client_key, row]))
  const clients = new Map()
  const person = (key, row = {}) => {
    if (!clients.has(key)) clients.set(key, { key, name: row.client_name || row.name || '', email: row.client_email || row.email || '', phone: row.client_phone || '', bookings: [], debts: [], gifts: [] })
    return clients.get(key)
  }
  for (const account of accounts) person(account.id, account)
  for (const booking of bookings) {
    const client = person(keyOf(booking), booking)
    client.bookings.push(booking)
    client.name ||= booking.client_name
    client.email ||= booking.client_email || ''
    client.phone ||= booking.client_phone || ''
  }
  const allDebts = withRepayments(debts, entries)
  for (const debt of allDebts) person(keyOf(debt), debt).debts.push(debt)
  for (const gift of gifts) person(gift.client_id).gifts.push(gift)

  return [...clients.values()].flatMap(client => {
    const account = accountOf.get(client.key)
    if (account?.owner && !client.bookings.length) return []
    const profile = profileOf.get(client.key)
    const card = cardOf.get(client.key)
    const visits = [...client.bookings].sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at))
    const done = visits.filter(item => item.status === 'completed')
    const paid = done.map(item => paidFor.get(item.id)).filter(Boolean)
    const counts = {}
    for (const item of done) counts[item.service_name] = (counts[item.service_name] || 0) + 1
    const spent = sum(paid, row => row.amount_received) + sum(client.debts, row => row.repaid)
    return [{
      ...client, bookings: visits, account, userId: account?.id || profile?.user_id || null, isOwner: Boolean(account?.owner),
      name: client.name || account?.name || account?.email || 'Client',
      email: client.email || account?.email || '',
      phone: profile?.phone || client.phone,
      username: profile?.username || '', avatarPath: profile?.avatar_path || '', reminder: profile?.reminder_channel || '',
      joined: account?.created_at || visits.at(-1)?.created_at || '', lastSignIn: account?.last_sign_in_at || '', provider: account?.provider || '',
      done: done.length, missed: visits.filter(item => item.status === 'no_show').length,
      cancelled: visits.filter(item => ['cancelled', 'declined'].includes(item.status)).length,
      free: paid.filter(row => row.is_free).length, spent, average: paid.length ? Math.round(spent / paid.length) : 0,
      owed: sum(client.debts, row => row.left), lastVisit: done[0]?.starts_at || '',
      firstVisit: done.at(-1)?.starts_at || '',
      nextVisit: visits.filter(item => ['requested', 'confirmed'].includes(item.status) && new Date(item.starts_at).getTime() > now).at(-1)?.starts_at || '',
      usual: Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || '',
      vip: Boolean(card?.vip), notes: card?.notes || '',
    }]
  })
}

// Every movement of money in one list: closed visits and everything typed by hand.
export function moneyLines({ bookings = [], payments = [], entries = [] }) {
  const bookingOf = new Map(bookings.map(row => [row.id, row]))
  const visits = payments.flatMap(payment => {
    const booking = bookingOf.get(payment.booking_id)
    if (booking?.status !== 'completed') return []
    return [{ id: `visit-${booking.id}`, source: 'visit', kind: 'income', amount: payment.amount_received, date: payment.paid_on, scope: 'business', category: 'Cut', note: `${booking.client_name} · ${booking.service_name}`, booking, payment, free: payment.is_free }]
  })
  const typed = entries.map(entry => ({ id: entry.id, source: 'entry', kind: entry.kind, amount: entry.amount, date: entry.entry_date, scope: entry.scope, category: entry.category, note: entry.note, entry, free: false }))
  return [...visits, ...typed].sort((a, b) => b.date.localeCompare(a.date))
}

// What is left: everything that ever came in, less everything spent or taken out.
export const moneyOnHand = lines => sum(lines, line => (['income', 'opening'].includes(line.kind) ? line.amount : -line.amount))

export const inPeriod = (lines, { from = '', to = '', scope = 'all' } = {}) => lines.filter(line => (!from || line.date >= from) && (!to || line.date <= to) && (scope === 'all' || line.scope === scope))

export function moneyTotals(lines) {
  const of = kind => lines.filter(line => line.kind === kind)
  const visits = lines.filter(line => line.source === 'visit')
  const earned = sum(of('income'), line => line.amount)
  const spent = sum(of('expense'), line => line.amount)
  const takenOut = sum(of('withdrawal'), line => line.amount)
  const free = visits.filter(line => line.free)
  const paying = visits.filter(line => !line.free)
  return {
    earned, spent, takenOut, kept: earned - spent - takenOut, cuts: visits.length, freeCuts: free.length,
    freeValue: sum(free, line => line.booking.total_price),
    shortfall: sum(paying, line => Math.max(line.booking.total_price - line.amount, 0)),
    average: paying.length ? Math.round(sum(paying, line => line.amount) / paying.length) : 0,
  }
}

const UNITS = { day: 10, month: 7, year: 4 }

function allDays(from, to) {
  const days = []
  for (let at = new Date(`${from}T12:00:00Z`); at.toISOString().slice(0, 10) <= to; at.setUTCDate(at.getUTCDate() + 1)) days.push(at.toISOString().slice(0, 10))
  return days
}

// Rows for the table and the chart, oldest first. Short day ranges keep their empty days, so the gaps stay visible.
export function moneyByPeriod(lines, unit, { from = '', to = '' } = {}) {
  const buckets = new Map()
  if (unit === 'day' && from && to && allDays(from, to).length <= 62) for (const day of allDays(from, to)) buckets.set(day, [])
  for (const line of lines) {
    const key = line.date.slice(0, UNITS[unit])
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(line)
  }
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, rows]) => ({ key, ...moneyTotals(rows) }))
}

export function spendingByCategory(lines) {
  const totals = new Map()
  for (const line of lines) if (line.kind === 'expense') totals.set(line.category || 'Other', (totals.get(line.category || 'Other') || 0) + line.amount)
  return [...totals.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount)
}

export function periodPresets(today) {
  const at = new Date(`${today}T12:00:00Z`)
  at.setUTCDate(at.getUTCDate() - 6)
  return {
    today: { label: 'Today', from: today, to: today, unit: 'day' },
    week: { label: '7 days', from: at.toISOString().slice(0, 10), to: today, unit: 'day' },
    month: { label: 'This month', from: `${today.slice(0, 7)}-01`, to: today, unit: 'day' },
    year: { label: 'This year', from: `${today.slice(0, 4)}-01-01`, to: today, unit: 'month' },
    all: { label: 'All time', from: '', to: '', unit: 'year' },
  }
}

const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`

export function moneyCsv(lines) {
  const rows = lines.map(line => [line.date, line.kind, line.scope, line.category, line.free ? 'free' : '', line.amount, line.note])
  return [['Date', 'Type', 'Scope', 'Category', 'Free', 'Amount DA', 'Note'], ...rows].map(row => row.map(csvCell).join(',')).join('\n')
}

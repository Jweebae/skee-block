import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { callBookings, dayLabel, STATUS_LABELS, whatsappLink } from '../lib/bookingsApi'
import { BASE_CUT_PRICE, formatPrice } from '../booking/catalog'
import { formatDzMobile } from '../lib/phone'
import useStudioBook from './useStudioBook'
import { buildClients, dayOf } from './studioBook'
import './StudioBook.css'

// Every client in one list, with what the owner needs in a line and the rest one tap away. Notes, spending and debts are
// visible to owners only.
const shortDay = value => (value ? dayLabel(value, { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
const QUIET_DAYS = 60
const FILTERS = [['all', 'All'], ['regular', 'Regulars'], ['vip', 'VIP'], ['debt', 'With debts'], ['quiet', `Not seen in ${QUIET_DAYS} days`], ['new', 'Never came']]
const GIFT_TITLES = { free_cut: 'A free cut on me', amount_off: 'A little something from me' }
const SORTS = { recent: ['Last visit', (a, b) => (b.lastVisit || '').localeCompare(a.lastVisit || '')], spent: ['Money spent', (a, b) => b.spent - a.spent], done: ['Done cuts', (a, b) => b.done - a.done], debt: ['Debt', (a, b) => b.owed - a.owed], name: ['Name', (a, b) => a.name.localeCompare(b.name)] }

function matches(client, filter, now) {
  if (filter === 'regular') return client.done >= 3
  if (filter === 'vip') return client.vip
  if (filter === 'debt') return client.owed > 0
  if (filter === 'quiet') return client.done > 0 && !client.nextVisit && now - new Date(client.lastVisit).getTime() > QUIET_DAYS * 86400000
  if (filter === 'new') return client.done === 0
  return true
}

function GiftForm({ client, onDone, onCancel }) {
  const [fields, setFields] = useState({ kind: 'free_cut', amount: '', title: GIFT_TITLES.free_cut, message: '', expiresOn: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = key => event => setFields(current => ({ ...current, [key]: event.target.value }))
  async function submit(event) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      const data = await callBookings('owner_gift', { ...fields, clientId: client.userId, amount: Number(fields.amount) || 0 })
      onDone(data.emailed ? `Gift sent to ${client.name}. It is in their account and in their inbox.` : `Gift saved in ${client.name}’s account, but the email could not be sent.`)
    } catch (problem) { setError(problem.message) } finally { setBusy(false) }
  }
  return <form className="book-form" onSubmit={submit} aria-label={`Send a gift to ${client.name}`}>
    <div className="book-tabs" role="group" aria-label="Gift type">{[['free_cut', `Free cut · ${formatPrice(BASE_CUT_PRICE)}`], ['amount_off', 'Money off']].map(([id, label]) => <button key={id} type="button" aria-pressed={fields.kind === id} onClick={() => setFields(current => ({ ...current, kind: id, title: current.title === GIFT_TITLES[current.kind] ? GIFT_TITLES[id] : current.title }))}>{label}</button>)}</div>
    <div className="book-form-grid">
      <label>Title<input required maxLength={80} value={fields.title} onChange={set('title')} /></label>
      {fields.kind === 'amount_off' && <label>Amount off · DA<input type="number" min="1" max="1000000" required value={fields.amount} onChange={set('amount')} /></label>}
      <label>Valid until (optional)<input type="date" value={fields.expiresOn} onChange={set('expiresOn')} /></label>
    </div>
    <label>Message to the client (optional)<textarea rows={2} maxLength={500} value={fields.message} onChange={set('message')} /></label>
    <p className="book-note">It appears in their account and arrives by email. They use it when booking, and add-ons stay at their normal price.</p>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <div className="admin-card-actions"><button type="button" className="admin-outline" onClick={onCancel}>Not now</button><button type="submit" className="admin-save" disabled={busy}>{busy ? 'Sending…' : 'Send the gift'}</button></div>
  </form>
}

function DebtForm({ client, today, onDone, onCancel }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    setBusy(true); setError('')
    const { error: problem } = await supabase.from('client_debts').insert({ client_id: client.userId, client_name: client.name, client_phone: client.phone || null, client_email: client.email || null, amount: Number(amount), note, created_on: today })
    setBusy(false)
    if (problem) setError('The debt could not be saved. Try again.')
    else onDone(`${formatPrice(Number(amount))} saved as a debt for ${client.name}.`)
  }
  return <form className="book-form" onSubmit={submit} aria-label={`Add a debt for ${client.name}`}>
    <div className="book-form-grid"><label>Amount owed · DA<input type="number" min="1" max="100000000" required value={amount} onChange={event => setAmount(event.target.value)} /></label><label>Note (optional)<input maxLength={500} value={note} onChange={event => setNote(event.target.value)} /></label></div>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <div className="admin-card-actions"><button type="button" className="admin-outline" onClick={onCancel}>Not now</button><button type="submit" className="admin-save" disabled={busy}>Save the debt</button></div>
  </form>
}

function ClientCard({ client, payments, today, onChanged }) {
  const [mode, setMode] = useState('')
  const [notes, setNotes] = useState(client.notes)
  const [saved, setSaved] = useState(client.notes)
  const [error, setError] = useState('')
  async function saveCard(changes) {
    setError('')
    const { error: problem } = await supabase.from('client_cards').upsert({ client_key: client.key, notes: saved, vip: client.vip, ...changes, updated_at: new Date().toISOString() })
    if (problem) { setError('This could not be saved. Try again.'); return false }
    return true
  }
  async function saveNotes() {
    if (notes !== saved && await saveCard({ notes })) setSaved(notes)
  }
  async function cancelGift(gift) {
    try { await callBookings('owner_gift_cancel', { id: gift.id }); onChanged('Gift cancelled.') } catch (problem) { setError(problem.message) }
  }
  const done = text => { setMode(''); onChanged(text) }
  const received = id => payments.find(row => row.booking_id === id)
  return <div className="client-card">
    <dl className="appt-details">
      <div><dt>Email</dt><dd>{client.email || '—'}</dd></div>
      <div><dt>WhatsApp</dt><dd>{client.phone ? formatDzMobile(client.phone) : '—'}</dd></div>
      <div><dt>Account</dt><dd>{client.account ? `${client.provider === 'google' ? 'Google' : 'Email'}${client.username ? ` · ${client.username}` : ''}` : 'No account · walk-in'}</dd></div>
      <div><dt>Client since</dt><dd>{shortDay(client.joined)}</dd></div>
      <div><dt>Last sign-in</dt><dd>{shortDay(client.lastSignIn)}</dd></div>
      <div><dt>First cut</dt><dd>{shortDay(client.firstVisit)}</dd></div>
      <div><dt>Next appointment</dt><dd>{shortDay(client.nextVisit)}</dd></div>
      <div><dt>Usual cut</dt><dd>{client.usual || '—'}</dd></div>
      <div><dt>Average per visit</dt><dd>{client.average ? formatPrice(client.average) : '—'}</dd></div>
      <div><dt>Free cuts</dt><dd>{client.free}</dd></div>
      <div><dt>Missed</dt><dd>{client.missed}</dd></div>
      <div><dt>Cancelled or declined</dt><dd>{client.cancelled}</dd></div>
      {client.reminder && <div><dt>Reminders by</dt><dd>{client.reminder === 'whatsapp' ? 'WhatsApp' : 'Email'}</dd></div>}
    </dl>
    <div className="client-actions">
      {client.phone && <a className="admin-outline" href={whatsappLink(client.phone, `Salam ${client.name.split(' ')[0]}, `)} target="_blank" rel="noreferrer">WhatsApp ↗</a>}
      {client.userId ? <button type="button" className="admin-outline" aria-expanded={mode === 'gift'} onClick={() => setMode(current => (current === 'gift' ? '' : 'gift'))}>Send a gift</button>
        : client.phone && <a className="admin-outline" href={whatsappLink(client.phone, `Salam ${client.name.split(' ')[0]}, your next cut is on me. Message me to pick a time. — Skee`)} target="_blank" rel="noreferrer">Offer a free cut ↗</a>}
      <button type="button" className="admin-outline" aria-expanded={mode === 'debt'} onClick={() => setMode(current => (current === 'debt' ? '' : 'debt'))}>Add a debt</button>
      <button type="button" className="admin-outline" aria-pressed={client.vip} onClick={async () => { if (await saveCard({ vip: !client.vip })) onChanged(client.vip ? 'VIP mark removed.' : `${client.name} is now marked VIP.`) }}>{client.vip ? 'Remove VIP' : 'Mark VIP'}</button>
    </div>
    {mode === 'gift' && <GiftForm client={client} onDone={done} onCancel={() => setMode('')} />}
    {mode === 'debt' && <DebtForm client={client} today={today} onDone={done} onCancel={() => setMode('')} />}
    <label className="client-notes">Private notes · only owners see this<textarea rows={3} maxLength={4000} value={notes} placeholder="Preferences, reminders, anything Skee should remember." onChange={event => setNotes(event.target.value)} onBlur={saveNotes} /></label>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {client.gifts.length > 0 && <div className="client-list"><span className="lbl">Gifts</span><ul>{client.gifts.map(gift => <li key={gift.id}><span>{gift.title}</span><small>{gift.status === 'active' ? gift.expires_on ? `Waiting · until ${shortDay(gift.expires_on)}` : 'Waiting' : gift.status === 'used' ? 'Used' : 'Cancelled'}</small>{gift.status === 'active' && <button type="button" className="admin-outline" onClick={() => cancelGift(gift)}>Cancel</button>}</li>)}</ul></div>}
    {client.debts.length > 0 && <div className="client-list"><span className="lbl">Debts</span><ul>{client.debts.map(debt => <li key={debt.id}><span>{shortDay(debt.created_on)} · {formatPrice(debt.amount)}</span><small>{debt.state === 'open' ? `${formatPrice(debt.left)} left` : debt.state === 'paid' ? 'Repaid' : 'Forgiven'}</small></li>)}</ul></div>}
    <div className="client-list"><span className="lbl">Visits · {client.bookings.length}</span>{client.bookings.length ? <ul>{client.bookings.map(item => {
      const paid = received(item.id)
      return <li key={item.id}><span>{shortDay(item.starts_at)} · {item.service_name}</span><small>{STATUS_LABELS[item.status]}{item.status === 'completed' ? paid ? paid.is_free ? ' · free' : ` · ${formatPrice(paid.amount_received)} of ${formatPrice(item.total_price)}` : ' · payment not recorded' : ` · ${formatPrice(item.total_price)}`}</small></li>
    })}</ul> : <p className="book-note">Signed up, but has not booked yet.</p>}</div>
  </div>
}

export default function ClientsManager({ headingRef }) {
  const book = useStudioBook()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('recent')
  const [message, setMessage] = useState('')
  const data = book.data
  const clients = useMemo(() => (data ? buildClients(data) : []), [data])
  const today = data ? dayOf(data.now) : ''
  const needle = query.trim().toLowerCase()
  const shown = clients
    .filter(client => matches(client, filter, data?.now ?? 0))
    .filter(client => !needle || [client.name, client.email, client.phone, client.username].some(value => String(value).toLowerCase().includes(needle)))
    .sort(SORTS[sort][1])
  const changed = text => { setMessage(text); book.reload() }
  const owed = clients.reduce((total, client) => total + client.owed, 0)

  return <>
    <div className="admin-title-row"><div><span className="lbl">Skee Block · Your clients</span><h1 className="serif" ref={headingRef} tabIndex={-1}>Clients</h1><p>Everyone who has an account or has sat in the chair. Done cuts are the ones you confirmed. Spent is the money you recorded, so it can differ from the booking price. Clients never see this page.</p></div></div>
    {book.error && <p className="admin-error" role="alert">{book.error}</p>}{message && <p className="admin-message" role="status">{message}</p>}
    {!data ? !book.error && <p className="admin-empty">Loading your clients…</p> : <>
      <dl className="book-stats"><div><dt>Clients</dt><dd>{clients.length}</dd></div><div><dt>Done cuts</dt><dd>{clients.reduce((total, client) => total + client.done, 0)}</dd></div><div><dt>Total spent</dt><dd>{formatPrice(clients.reduce((total, client) => total + client.spent, 0))}</dd></div><div><dt>Owed to you</dt><dd>{formatPrice(owed)}</dd></div></dl>
      <div className="book-toolbar">
        <label>Search<input type="search" value={query} placeholder="Name, email, number or username" onChange={event => setQuery(event.target.value)} /></label>
        <label>Sort by<select value={sort} onChange={event => setSort(event.target.value)}>{Object.entries(SORTS).map(([id, [label]]) => <option key={id} value={id}>{label}</option>)}</select></label>
      </div>
      <div className="book-tabs" role="group" aria-label="Filter clients">{FILTERS.map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div>
      {shown.length ? <div className="client-table" role="list">
        <div className="client-head" aria-hidden="true"><span>Client</span><span>WhatsApp</span><span>Done cuts</span><span>Spent</span><span>Debt</span><span>Last visit</span></div>
        {shown.map(client => <details key={client.key} className="client-row" role="listitem">
          <summary>
            <span className="client-who">{client.avatarPath && data.photos[client.avatarPath] ? <img src={data.photos[client.avatarPath]} alt="" /> : <i aria-hidden="true">{client.name.charAt(0).toUpperCase()}</i>}<span><b>{client.name}</b><small>{client.vip && <em>VIP · </em>}{client.isOwner ? 'Owner · ' : ''}{client.email || (client.account ? '' : 'Walk-in')}</small></span></span>
            <span data-label="WhatsApp">{client.phone ? formatDzMobile(client.phone) : '—'}</span>
            <span data-label="Done cuts" className="client-num">{client.done}</span>
            <span data-label="Spent" className="client-num">{formatPrice(client.spent)}</span>
            <span data-label="Debt" className={`client-num${client.owed ? ' client-owes' : ''}`}>{client.owed ? formatPrice(client.owed) : '—'}</span>
            <span data-label="Last visit">{shortDay(client.lastVisit)}</span>
          </summary>
          <ClientCard client={client} payments={data.payments} today={today} onChanged={changed} />
        </details>)}
      </div> : <p className="admin-empty">{clients.length ? 'No client matches this search.' : 'Your clients will appear here after their first sign-up or booking.'}</p>}
    </>}
  </>
}

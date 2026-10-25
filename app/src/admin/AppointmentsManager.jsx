import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { callBookings, dayLabel, algiersParts, STATUS_LABELS, whatsappLink } from '../lib/bookingsApi'
import { BASE_CUT_PRICE, formatPrice } from '../booking/catalog'
import PhoneField from '../lib/PhoneField'
import { formatDzMobile, normalizeDzMobile } from '../lib/phone'

// Owners answer requests, close visits, move or cancel appointments, and add walk-ins. Every change goes through the
// bookings Edge Function, which emails the client where needed.
const REFRESH_MS = 30000
const extrasText = booking => (booking.addons || []).map(item => item.typeName === 'Standard' ? item.name : `${item.name} (${item.typeName})`).join(', ')

async function fetchAppointments() {
  const since = new Date(Date.now() - 14 * 86400000).toISOString()
  const [{ data, error }, place] = await Promise.all([
    supabase.from('bookings').select('*').gte('ends_at', since).order('starts_at'),
    supabase.from('studio_private').select('location_url').eq('id', 'main').maybeSingle(),
  ])
  if (error) return { error: 'Appointments could not be loaded. Check your connection and try again.' }
  return { bookings: data, locationUrl: place.data?.location_url || '', now: Date.now() }
}

function whatsappMessages(booking, locationUrl) {
  const first = booking.client_name.split(' ')[0]
  const { time } = algiersParts(booking.starts_at)
  const date = dayLabel(booking.starts_at)
  const messages = [
    ['Confirmation', `Salam ${first}, your 3kee appointment ${booking.code} is confirmed: ${date} at ${time}, ${booking.service_name}. See you in the chair. — Skee`],
    ['Reminder', `Salam ${first}, a reminder of your appointment today at ${time} (${booking.service_name}). Reply if you are running late. — Skee`],
  ]
  if (locationUrl) messages.push(['Location', `Salam ${first}, here is the studio location for ${booking.code} at ${time}: ${locationUrl} — Skee`])
  return messages
}

function BookingCard({ booking, locationUrl, onAction, busy, now }) {
  const [confirming, setConfirming] = useState('')
  const [moving, setMoving] = useState(false)
  const [moveTo, setMoveTo] = useState(() => algiersParts(booking.starts_at))
  const started = new Date(booking.starts_at).getTime() <= now
  const { time } = algiersParts(booking.starts_at)
  const live = ['requested', 'confirmed'].includes(booking.status)
  const act = (action, extra) => { setConfirming(''); onAction(booking, action, extra) }
  return <section className="admin-editor-card appt-card" data-status={booking.status} aria-label={`${booking.code} ${booking.client_name}`}>
    <div className="appt-head">
      <div><span className="lbl">{dayLabel(booking.starts_at, { weekday: 'short', day: 'numeric', month: 'short' })} · {time} · {booking.duration_minutes} min</span><h3>{booking.client_name}</h3><p>{booking.service_name}{extrasText(booking) ? ` + ${extrasText(booking)}` : ''}</p></div>
      <div className="appt-side"><span className={`appt-status appt-${booking.status}`}>{STATUS_LABELS[booking.status]}</span><strong>{formatPrice(booking.total_price)}</strong><small>{booking.code}{booking.source === 'walk_in' ? ' · walk-in' : ''}</small></div>
    </div>
    <dl className="appt-details">
      {booking.client_phone && <div><dt>WhatsApp</dt><dd>{formatDzMobile(booking.client_phone)}</dd></div>}
      {booking.client_email && <div><dt>Email</dt><dd>{booking.client_email}</dd></div>}
      {booking.preferences?.length > 0 && <div><dt>Preferences</dt><dd>{booking.preferences.join(' · ')}</dd></div>}
      {booking.notes && <div><dt>Notes</dt><dd>{booking.notes}</dd></div>}
      <div><dt>Reminder by</dt><dd>{booking.reminder_channel === 'whatsapp' ? 'WhatsApp' : 'Email'}</dd></div>
    </dl>
    {moving ? <div className="appt-move">
      <label>New date<input type="date" value={moveTo.date} onChange={event => setMoveTo(current => ({ ...current, date: event.target.value }))} /></label>
      <label>New time<input type="time" step="900" value={moveTo.time} onChange={event => setMoveTo(current => ({ ...current, time: event.target.value }))} /></label>
      <button type="button" className="admin-outline" onClick={() => setMoving(false)}>Keep the time</button>
      <button type="button" className="admin-save" disabled={busy || !moveTo.date || !moveTo.time} onClick={() => { setMoving(false); onAction(booking, 'move', moveTo) }}>Move and tell the client</button>
    </div> : <div className="admin-card-actions appt-actions">
      {booking.status === 'requested' && <><button type="button" className="admin-save" disabled={busy} onClick={() => act('confirm')}>Accept</button>
        {confirming === 'decline' ? <button type="button" className="admin-outline admin-delete" disabled={busy} onClick={() => act('decline')}>Yes, decline</button> : <button type="button" className="admin-outline" disabled={busy} onClick={() => setConfirming('decline')}>Decline</button>}</>}
      {booking.status === 'confirmed' && started && <><button type="button" className="admin-save" disabled={busy} onClick={() => act('complete')}>Done</button><button type="button" className="admin-outline" disabled={busy} onClick={() => act('no_show')}>Missed</button></>}
      {['completed', 'no_show'].includes(booking.status) && <button type="button" className="admin-outline" disabled={busy} onClick={() => act(booking.status === 'completed' ? 'no_show' : 'complete')}>Mark {booking.status === 'completed' ? 'missed' : 'done'} instead</button>}
      {live && !started && <button type="button" className="admin-outline" disabled={busy} onClick={() => setMoving(true)}>Move</button>}
      {live && (confirming === 'cancel' ? <button type="button" className="admin-outline admin-delete" disabled={busy} onClick={() => act('cancel')}>Yes, cancel it</button> : <button type="button" className="admin-outline admin-delete" disabled={busy} onClick={() => setConfirming('cancel')}>Cancel</button>)}
      {confirming && <button type="button" className="admin-outline" onClick={() => setConfirming('')}>Keep it</button>}
    </div>}
    {booking.client_phone && live && <div className="appt-whatsapp"><span className="lbl">WhatsApp</span>{whatsappMessages(booking, locationUrl).map(([label, text]) => <a key={label} className="admin-outline" href={whatsappLink(booking.client_phone, text)} target="_blank" rel="noreferrer">{label} ↗</a>)}</div>}
  </section>
}

function WalkInForm({ settings, onDone }) {
  const [fields, setFields] = useState(() => ({ name: '', phone: '', email: '', serviceId: settings.services[0]?.id || '', date: algiersParts(new Date()).date, time: '', notes: '' }))
  const [choices, setChoices] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = key => event => setFields(current => ({ ...current, [key]: event.target.value }))
  const service = settings.services.find(item => item.id === fields.serviceId)
  const extras = settings.addons.flatMap(addon => addon.types.filter(type => choices[addon.id] === type.id).map(type => type))
  const total = BASE_CUT_PRICE + extras.reduce((sum, type) => sum + Number(type.price), 0)
  const minutes = (service ? Number(service.duration) : 0) + extras.reduce((sum, type) => sum + Number(type.duration), 0)
  async function submit(event) {
    event.preventDefault()
    const phone = fields.phone.trim() ? normalizeDzMobile(fields.phone) : ''
    if (phone === null) { setError('Check the WhatsApp number: an Algerian mobile, with or without the first 0.'); return }
    setBusy(true); setError('')
    try {
      await callBookings('walk_in', { ...fields, phone, addons: Object.entries(choices).filter(([, typeId]) => typeId).map(([addonId, typeId]) => ({ addonId, typeId })) })
      onDone(`Walk-in saved for ${fields.name} on ${fields.date} at ${fields.time}.`)
    } catch (problem) { setError(problem.message) } finally { setBusy(false) }
  }
  return <form className="admin-editor-card appt-walkin" onSubmit={submit}>
    <div className="admin-card-heading"><span className="lbl">Walk-in or phone booking</span></div>
    <div className="admin-field-grid">
      <label>Client name<input required maxLength={121} value={fields.name} onChange={set('name')} /></label>
      <label htmlFor="walkin-phone">WhatsApp number<PhoneField id="walkin-phone" value={fields.phone} onChange={value => setFields(current => ({ ...current, phone: value }))} /></label>
      <label>Email (optional)<input type="email" maxLength={254} value={fields.email} onChange={set('email')} /></label>
      <label>Cut<select value={fields.serviceId} onChange={set('serviceId')}>{settings.services.map(item => <option key={item.id} value={item.id}>{item.name} · {item.duration} min</option>)}</select></label>
      <label>Date<input type="date" required value={fields.date} onChange={set('date')} /></label>
      <label>Time<input type="time" step="900" required value={fields.time} onChange={set('time')} /></label>
    </div>
    {settings.addons.length > 0 && <div className="appt-addons"><span className="lbl">Add-ons</span>{settings.addons.map(addon => <label key={addon.id}>{addon.name}<select value={choices[addon.id] || ''} onChange={event => setChoices(current => ({ ...current, [addon.id]: event.target.value }))}><option value="">None</option>{addon.types.map(type => <option key={type.id} value={type.id}>{type.name} · +{formatPrice(type.price)} · +{type.duration} min</option>)}</select></label>)}</div>}
    <label className="admin-full-field">Notes<textarea rows={2} maxLength={1000} value={fields.notes} onChange={set('notes')} /></label>
    <div className="admin-card-actions"><span className="appt-total">{minutes} min · {formatPrice(total)}</span><button type="submit" className="admin-save" disabled={busy}>{busy ? 'Saving…' : 'Save walk-in'}</button></div>
    {error && <p className="admin-error" role="alert">{error}</p>}
  </form>
}

export default function AppointmentsManager({ settings, headingRef }) {
  const [data, setData] = useState({ bookings: null, locationUrl: '', now: 0 })
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const [walkIn, setWalkIn] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    let active = true
    const load = () => fetchAppointments().then(result => {
      if (!active) return
      if (result.error) setError(result.error)
      else setData(result)
    })
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => { active = false; clearInterval(timer) }
  }, [version])

  async function onAction(booking, action, extra) {
    setBusy(true); setError(''); setMessage('')
    try {
      if (action === 'move') await callBookings('owner_move', { id: booking.id, ...extra })
      else await callBookings('owner_update', { id: booking.id, move: action })
      const done = { confirm: 'accepted; the client was emailed', decline: 'declined; the client was emailed', cancel: 'cancelled; the client was emailed', complete: 'marked done', no_show: 'marked missed', move: 'moved; the client was emailed' }[action]
      setMessage(`${booking.code} (${booking.client_name}) ${done}.`)
      setVersion(value => value + 1)
    } catch (problem) { setError(problem.message) } finally { setBusy(false) }
  }

  const now = data.now
  const bookings = data.bookings || []
  const requests = bookings.filter(item => item.status === 'requested' && new Date(item.starts_at).getTime() > now)
  const toClose = bookings.filter(item => item.status === 'confirmed' && new Date(item.starts_at).getTime() <= now)
  const upcoming = bookings.filter(item => item.status === 'confirmed' && new Date(item.starts_at).getTime() > now)
  const closed = bookings.filter(item => !['requested', 'confirmed'].includes(item.status) || (item.status === 'requested' && new Date(item.starts_at).getTime() <= now)).reverse()
  const days = [...new Set(upcoming.map(item => algiersParts(item.starts_at).date))]
  const card = item => <BookingCard key={`${item.id}-${item.updated_at}`} booking={item} locationUrl={data.locationUrl} onAction={onAction} busy={busy} now={now} />

  return <>
    <div className="admin-title-row"><div><span className="lbl">Skee Block · Studio controls</span><h1 className="serif" ref={headingRef} tabIndex={-1}>Appointments</h1><p>Answer requests, close today’s visits, move or cancel appointments and add walk-ins. Clients get an email for every answer, move and cancellation. The list refreshes every 30 seconds.</p></div><button type="button" className="admin-save" onClick={() => setWalkIn(open => !open)}>{walkIn ? 'Close walk-in' : '+ Walk-in booking'}</button></div>
    {walkIn && <WalkInForm settings={settings} onDone={text => { setWalkIn(false); setMessage(text); setVersion(value => value + 1) }} />}
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-message" role="status">{message}</p>}
    {!data.locationUrl && data.bookings && <p className="admin-empty">Add the studio’s private map link in Studio details so confirmations and reminders can share it.</p>}
    {data.bookings === null ? <p className="admin-empty">Loading appointments…</p> : <>
      <h2 className="appt-group">Requests waiting · {requests.length}</h2>
      {requests.length ? <div className="admin-editor-list">{requests.map(card)}</div> : <p className="admin-empty">No requests waiting.</p>}
      {toClose.length > 0 && <><h2 className="appt-group">To close · {toClose.length}</h2><p className="appt-hint">These visits have started. Mark each one done or missed.</p><div className="admin-editor-list">{toClose.map(card)}</div></>}
      <h2 className="appt-group">Upcoming · {upcoming.length}</h2>
      {days.length ? days.map(day => <div key={day} className="appt-day"><h3 className="lbl">{dayLabel(`${day}T12:00:00Z`)}</h3><div className="admin-editor-list">{upcoming.filter(item => algiersParts(item.starts_at).date === day).map(card)}</div></div>) : <p className="admin-empty">No confirmed appointments ahead.</p>}
      {closed.length > 0 && <details className="appt-closed"><summary>Last 14 days · {closed.length}</summary><div className="admin-editor-list">{closed.map(card)}</div></details>}
    </>}
  </>
}

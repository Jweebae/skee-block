import { useEffect, useState } from 'react'
import logo from '../assets/skee-logo-white.svg'
import { supabase } from '../lib/supabase'
import { callBookings, dayLabel, algiersParts, freeTimes, whatsappLink, STATUS_LABELS } from '../lib/bookingsApi'
import { formatPrice, getPreviewDates } from '../booking/catalog'
import { previewSlots } from '../settings/studioSettings'
import { STUDIO_PHONE } from '../settings/studioContact'
import PhoneField from '../lib/PhoneField'
import { localDzPart, normalizeDzMobile, PHONE_HINT } from '../lib/phone'
import WhatsAppVerify from './WhatsAppVerify'
import { callAccount, USERNAME_PATTERN } from '../lib/accountApi'
import useClientProfile, { announceProfileChange } from './useClientProfile'
import ProfileNudge from './ProfileNudge'
import ProfilePhoto from './ProfilePhoto'
import HeaderAvatar from './HeaderAvatar'
import './AccountPage.css'

// The client's own dashboard (design board 05): upcoming appointment, history, profile and notifications.
// Reads go straight to the database (row level security limits them to this client); changes go through the
// bookings Edge Function.
const CANCEL_HOURS = 3
const LIVE = ['requested', 'confirmed']

async function loadAccount(userId) {
  const [bookings, profile] = await Promise.all([
    supabase.from('bookings').select('*').eq('client_id', userId).order('starts_at', { ascending: false }),
    supabase.from('client_profiles').select('*').eq('user_id', userId).maybeSingle(),
  ])
  if (bookings.error) return { error: 'Your appointments could not be loaded. Check your connection and try again.', now: Date.now() }
  return { bookings: bookings.data, profile: profile.data, now: Date.now(), error: '' }
}

const extrasText = booking => (booking.addons || []).map(item => item.typeName === 'Standard' ? item.name : `${item.name} (${item.typeName})`).join(', ')
const studioChat = code => whatsappLink(STUDIO_PHONE, `Salam Skee, about booking ${code} — `)

function Reschedule({ booking, settings, onDone, onCancel }) {
  const [dates] = useState(getPreviewDates)
  const [busy, setBusy] = useState(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    callBookings('busy', { from: dates[0].id, to: dates[dates.length - 1].id })
      // This appointment's own time does not block its new time.
      .then(data => { if (active) setBusy(data.busy.filter(slot => new Date(slot.start).getTime() !== new Date(booking.starts_at).getTime())) })
      .catch(() => { if (active) setBusy([]) })
    return () => { active = false }
  }, [dates, booking.starts_at])
  const open = busy ? dates.map(day => ({ ...day, times: freeTimes(previewSlots(settings.hours, day.id, booking.duration_minutes), day.id, booking.duration_minutes, busy) })).filter(day => day.times.length) : []
  const chosen = open.find(day => day.id === date)
  async function submit() {
    setSending(true); setError('')
    try { await callBookings('reschedule', { id: booking.id, date, time }); onDone('Your new time was sent to Skee. It is under review again.') }
    catch (problem) { setError(problem.message) } finally { setSending(false) }
  }
  return <div className="acct-reschedule">
    <p>Pick a new time. Skee confirms it again, and your current time is released.</p>
    {busy === null ? <p className="acct-muted">Loading free times…</p> : <div className="acct-two">
      <label>Date<select value={date} onChange={event => { setDate(event.target.value); setTime('') }}><option value="">Choose a date</option>{open.map(day => <option key={day.id} value={day.id}>{day.label}</option>)}</select></label>
      <label>Time<select value={time} disabled={!chosen} onChange={event => setTime(event.target.value)}><option value="">Choose a time</option>{chosen?.times.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
    </div>}
    {error && <p className="acct-error" role="alert">{error}</p>}
    <div className="acct-actions"><button type="button" className="acct-btn" onClick={onCancel}>Keep my time</button><button type="button" className="acct-btn acct-btn-primary" disabled={!date || !time || sending} onClick={submit}>{sending ? 'Sending…' : 'Send new time'}</button></div>
  </div>
}

function Upcoming({ booking, settings, now, onChanged }) {
  const [mode, setMode] = useState('')
  const [place, setPlace] = useState(null)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const { time } = algiersParts(booking.starts_at)
  const lateForChanges = new Date(booking.starts_at).getTime() - now < CANCEL_HOURS * 3600000
  const canCancel = booking.status === 'requested' || !lateForChanges
  async function cancel() {
    setWorking(true); setError('')
    try { await callBookings('cancel', { id: booking.id }); onChanged(`${booking.code} was cancelled. Skee has been told.`) }
    catch (problem) { setError(problem.message) } finally { setWorking(false) }
  }
  async function showLocation() {
    setError('')
    try { setPlace(await callBookings('location', { id: booking.id })) } catch (problem) { setError(problem.message) }
  }
  return <section className="acct-upcoming" aria-label={`Upcoming appointment ${booking.code}`}>
    <div className="acct-upcoming-main">
      <span className="acct-label acct-gold">{booking.status === 'confirmed' ? 'Upcoming' : 'Under review'} · {booking.code}</span>
      <h2 className="serif">{booking.service_name}</h2>
      <p>{dayLabel(booking.starts_at)} · {time} · {booking.duration_minutes} min · with Skee</p>
      {extrasText(booking) && <p className="acct-muted">+ {extrasText(booking)}</p>}
      <p className="acct-muted">{formatPrice(booking.total_price)}{booking.offer_name ? ` · ${booking.offer_name} offer, usual ${formatPrice(booking.usual_price)}` : ''} · paid at the studio</p>
      {mode === 'reschedule' ? <Reschedule booking={booking} settings={settings} onDone={onChanged} onCancel={() => setMode('')} /> : <div className="acct-actions">
        {!lateForChanges && <button type="button" className="acct-btn" onClick={() => setMode('reschedule')}>Reschedule</button>}
        {canCancel && (mode === 'cancel'
          ? <><button type="button" className="acct-btn acct-btn-danger" disabled={working} onClick={cancel}>{working ? 'Cancelling…' : 'Yes, cancel'}</button><button type="button" className="acct-btn" onClick={() => setMode('')}>Keep it</button></>
          : <button type="button" className="acct-btn acct-btn-danger" onClick={() => setMode('cancel')}>Cancel</button>)}
        <a className="acct-btn acct-btn-gold" href={studioChat(booking.code)} target="_blank" rel="noreferrer">WhatsApp</a>
      </div>}
      {lateForChanges && booking.status === 'confirmed' && <p className="acct-muted">Less than {CANCEL_HOURS} hours to go: to change or cancel, message Skee on WhatsApp.</p>}
      {error && <p className="acct-error" role="alert">{error}</p>}
    </div>
    <div className="acct-upcoming-side">
      <span className="acct-label">Reminders</span>
      <ul className="acct-checks">
        <li data-done={Boolean(booking.emails?.received)}>Request received<small>{booking.emails?.received ? 'Email sent' : 'Email pending'}</small></li>
        <li data-done={Boolean(booking.emails?.confirmed)}>Confirmation<small>{booking.status === 'confirmed' ? 'Confirmed by Skee' : 'Waiting for Skee'}</small></li>
        <li data-done={Boolean(booking.emails?.reminder)}>Appointment-day reminder<small>{dayLabel(booking.starts_at, { weekday: 'short', day: 'numeric', month: 'short' })} · 08:00</small></li>
      </ul>
      {booking.status === 'confirmed'
        ? place ? <p className="acct-location">{place.location_url ? <a href={place.location_url} target="_blank" rel="noreferrer">Open the studio location ↗</a> : 'Skee will send the location on WhatsApp.'}{place.location_note && <small>{place.location_note}</small>}</p>
          : <button type="button" className="acct-link" onClick={showLocation}>View location · unlocked for this booking</button>
        : <p className="acct-muted">The location unlocks once Skee confirms.</p>}
    </div>
  </section>
}

function History({ bookings, now, onChanged }) {
  const [tab, setTab] = useState('completed')
  const [error, setError] = useState('')
  const past = bookings.filter(item => !LIVE.includes(item.status) || new Date(item.ends_at).getTime() <= now)
  const tabs = {
    completed: past.filter(item => !item.client_hidden && item.status === 'completed'),
    cancelled: past.filter(item => !item.client_hidden && item.status !== 'completed'),
    deleted: past.filter(item => item.client_hidden),
  }
  async function hide(booking, hidden) {
    setError('')
    try { await callBookings('hide', { id: booking.id, hidden }); onChanged(hidden ? 'Removed from your history. You can restore it from Deleted.' : 'Restored to your history.') }
    catch (problem) { setError(problem.message) }
  }
  const statusLine = item => item.status === 'requested' ? 'Expired · Skee did not answer in time' : item.status === 'cancelled' ? `Cancelled by ${item.cancelled_by === 'client' ? 'you' : 'the studio'}` : STATUS_LABELS[item.status]
  return <section className="acct-history" aria-labelledby="acct-history-title">
    <div className="acct-history-head"><h2 id="acct-history-title" className="serif">History</h2>
      <div className="acct-tabs" role="group" aria-label="History">{[['completed', 'Completed'], ['cancelled', 'Cancelled'], ['deleted', 'Deleted']].map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>{label} {tabs[id].length}</button>)}</div>
    </div>
    {tabs[tab].length === 0 ? <p className="acct-muted acct-empty">{tab === 'completed' ? 'Your completed visits will appear here.' : tab === 'cancelled' ? 'No cancelled, declined or missed appointments.' : 'Nothing removed.'}</p>
      : <ul className="acct-rows">{tabs[tab].map(item => <li key={item.id}>
        <span className="acct-when">{dayLabel(item.starts_at, { day: '2-digit', month: 'short', year: 'numeric' })}<small>{algiersParts(item.starts_at).time}</small></span>
        <span className="acct-what"><span className="serif">{item.service_name}</span><small>{statusLine(item)}{extrasText(item) ? ` · + ${extrasText(item)}` : ''}</small></span>
        <span className="acct-price">{formatPrice(item.total_price)}</span>
        <button type="button" className="acct-btn" onClick={() => hide(item, !item.client_hidden)}>{item.client_hidden ? 'Restore' : 'Remove'}</button>
      </li>)}</ul>}
    <p className="acct-muted acct-note">Remove hides a visit from your history; you can restore it from Deleted.</p>
    {error && <p className="acct-error" role="alert">{error}</p>}
  </section>
}

function Preferences({ userId, profile, onSaved }) {
  const [fields, setFields] = useState(() => ({ phone: localDzPart(profile?.phone), reminder_channel: profile?.reminder_channel || 'email', email_notifications: profile?.email_notifications ?? true, rebook_nudges: profile?.rebook_nudges ?? false }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const toggle = key => setFields(current => ({ ...current, [key]: !current[key] }))
  async function save(event) {
    event.preventDefault()
    const phone = normalizeDzMobile(fields.phone)
    if (fields.phone.trim() && !phone) { setError(`Check the WhatsApp number. ${PHONE_HINT}`); return }
    setSaving(true); setError('')
    const { error: problem } = await supabase.from('client_profiles').upsert({ user_id: userId, ...fields, phone, updated_at: new Date().toISOString() })
    setSaving(false)
    if (problem) setError('Your preferences could not be saved. Try again.')
    else { announceProfileChange(); onSaved('Preferences saved.') }
  }
  return <form className="acct-box" onSubmit={save} aria-labelledby="acct-pref-title">
    <span id="acct-pref-title" className="acct-label">Profile & notifications</span>
    <label className="acct-field" htmlFor="acct-phone">WhatsApp number<PhoneField id="acct-phone" value={fields.phone} onChange={value => setFields(current => ({ ...current, phone: value }))} invalid={Boolean(fields.phone.trim()) && !normalizeDzMobile(fields.phone)} /><small id="acct-phone-hint" className="acct-muted">{PHONE_HINT}</small></label>
    {profile?.phone && <WhatsAppVerify />}
    <fieldset className="acct-field"><legend>Reminders by</legend><div className="acct-tabs">{[['email', 'Email'], ['whatsapp', 'WhatsApp']].map(([id, label]) => <button key={id} type="button" aria-pressed={fields.reminder_channel === id} onClick={() => setFields(current => ({ ...current, reminder_channel: id }))}>{label}</button>)}</div></fieldset>
    {[['email_notifications', 'Email', 'Confirmations, changes and your appointment-day reminder'], ['rebook_nudges', 'Rebook nudges', 'A gentle note when your cut is due']].map(([key, title, hint]) => <label key={key} className="acct-switch"><span>{title}<small>{hint}</small></span><input type="checkbox" role="switch" checked={fields[key]} onChange={() => toggle(key)} /></label>)}
    <button type="submit" className="acct-btn acct-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save preferences'}</button>
    {error && <p className="acct-error" role="alert">{error}</p>}
  </form>
}

function UsernameBox({ current, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(current || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  async function save(event) {
    event.preventDefault()
    setSaving(true); setError('')
    try { const data = await callAccount('set_username', { username: value }); setEditing(false); announceProfileChange(); onSaved(`Your username is now ${data.username}.`) }
    catch (problem) { setError(problem.message) } finally { setSaving(false) }
  }
  if (!editing) return <p>Username: <strong>{current || 'not set yet'}</strong> <button type="button" className="acct-link" onClick={() => { setValue(current || ''); setEditing(true) }}>{current ? 'Change' : 'Choose one'}</button></p>
  return <form className="acct-username" onSubmit={save}>
    <label className="acct-field" htmlFor="acct-username">Username<input id="acct-username" className="acct-text" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={30} pattern={USERNAME_PATTERN} required value={value} onChange={event => setValue(event.target.value)} /><small className="acct-muted">3 to 30 letters, numbers, dots or underscores. You can sign in with it instead of your email.</small></label>
    <div className="acct-actions"><button type="button" className="acct-btn" onClick={() => setEditing(false)}>Keep it</button><button type="submit" className="acct-btn acct-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save username'}</button></div>
    {error && <p className="acct-error" role="alert">{error}</p>}
  </form>
}

export default function AccountPage({ client, settings, onClose, onBook, onSignIn }) {
  const [state, setState] = useState({ bookings: null, profile: null, now: 0, error: '' })
  const [version, setVersion] = useState(0)
  const [message, setMessage] = useState('')
  const userId = client.user?.id
  const profileStatus = useClientProfile(client.profileComplete ? client.user : null)
  useEffect(() => {
    if (!userId) return
    let active = true
    loadAccount(userId).then(result => { if (active) setState(result) })
    return () => { active = false }
  }, [userId, version])
  const changed = text => { setMessage(text); setVersion(value => value + 1) }

  const meta = client.user?.user_metadata || {}
  const name = meta.first_name || String(meta.full_name || meta.name || '').split(' ')[0]
  const bookings = state.bookings || []
  const upcoming = bookings.filter(item => LIVE.includes(item.status) && new Date(item.ends_at).getTime() > state.now).reverse()
  const completed = bookings.filter(item => item.status === 'completed')
  const counts = completed.reduce((all, item) => ({ ...all, [item.service_id]: (all[item.service_id] || 0) + 1 }), {})
  const usualId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]
  const usual = completed.find(item => item.service_id === usualId)
  const since = client.user?.created_at ? new Date(client.user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : ''

  return <div className="acct-page">
    <header className="acct-header"><a href="#top" className="acct-brand" onClick={event => { event.preventDefault(); onClose() }}><img src={logo} alt="SKEE" /><span>My account</span></a>
      <div className="acct-header-actions">{client.user && <HeaderAvatar user={client.user} status={profileStatus} size={40} />}<button type="button" className="acct-btn acct-btn-primary" onClick={() => onBook(usual?.service_id || null)}>{completed.length ? 'Book again' : 'Book the chair'}</button><button type="button" className="acct-btn" onClick={onClose}>Home</button></div></header>
    <main className="acct-main">
      {!client.ready ? <p className="acct-muted">Checking your sign-in…</p> : !client.user || !client.profileComplete ? <section className="acct-signed-out"><h1 className="serif">Your place at the <em>Block</em>.</h1><p>Sign in to see your appointments and history.</p><button type="button" className="acct-btn acct-btn-primary" onClick={onSignIn}>Sign in</button></section> : <>
        <div className="acct-hello">
          <div><span className="acct-label">Signed in{since ? ` · client since ${since}` : ''}</span><h1 className="serif">Salam, <em>{name || 'friend'}</em>.</h1></div>
          <dl className="acct-stats"><div><dt>Visits</dt><dd className="serif">{completed.length}</dd></div><div><dt>Usual</dt><dd>{usual?.service_name || '—'}</dd></div></dl>
        </div>
        <ProfileNudge user={client.user} status={profileStatus} variant="account" />
        {message && <p className="acct-notice" role="status">{message}</p>}
        {state.error && <p className="acct-error" role="alert">{state.error}</p>}
        {state.bookings === null ? <p className="acct-muted">Loading your appointments…</p> : <>
          {upcoming.length ? upcoming.map(item => <Upcoming key={`${item.id}-${item.updated_at}`} booking={item} settings={settings} now={state.now} onChanged={changed} />)
            : <section className="acct-upcoming acct-upcoming-empty"><div className="acct-upcoming-main"><span className="acct-label">Upcoming</span><h2 className="serif">No appointment yet.</h2><p>Choose your cut, add the extras you like and pick your hour.</p><div className="acct-actions"><button type="button" className="acct-btn acct-btn-primary" onClick={() => onBook(usual?.service_id || null)}>Book the chair</button></div></div></section>}
          <History bookings={bookings} now={state.now} onChanged={changed} />
          <div className="acct-grid">
            <section className="acct-box" aria-labelledby="acct-photo-title"><span id="acct-photo-title" className="acct-label">Profile photo</span><ProfilePhoto userId={userId} path={profileStatus.profile?.avatar_path} name={name} /><p className="acct-muted">Optional. Only Skee sees it. With a review, it is shown only if you choose.</p></section>
            <Preferences key={state.profile?.updated_at || 'new'} userId={userId} profile={state.profile} onSaved={changed} />
            <section className="acct-box" aria-labelledby="acct-sign-title"><span id="acct-sign-title" className="acct-label">Sign-in</span><p>Signed in as <strong>{client.user.email}</strong>.</p><UsernameBox key={state.profile?.username || 'none'} current={state.profile?.username} onSaved={changed} /><p className="acct-muted">Sign in with your email, your username or Google.</p><div className="acct-actions"><button type="button" className="acct-btn" onClick={onSignIn}>Change password</button><button type="button" className="acct-btn" onClick={async () => { await client.signOut(); onClose() }}>Sign out</button></div><p className="acct-muted">Your data is handled as described in the <a href="#privacy">privacy notice</a>.</p></section>
          </div>
        </>}
      </>}
    </main>
  </div>
}

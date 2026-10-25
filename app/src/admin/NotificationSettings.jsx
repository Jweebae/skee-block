import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Switches for every message the website sends. The bookings and send-email functions read them before sending.
const SWITCHES = [
  ['client_emails', 'Emails to clients', 'Welcome, request received, confirmed, declined, moved, cancelled, and later the appointment-day reminder and review request.'],
  ['owner_alerts', 'Alerts to owners', 'An email to every owner when a client sends a request or cancels.'],
]
const stamp = () => new Date().toISOString()

async function fetchSwitches() {
  const { data, error } = await supabase.from('studio_private').select('client_emails, owner_alerts').eq('id', 'main').maybeSingle()
  if (error) return { error: 'The notification settings could not be loaded.' }
  return { values: { client_emails: data?.client_emails !== false, owner_alerts: data?.owner_alerts !== false } }
}

export default function NotificationSettings({ headingRef }) {
  const [values, setValues] = useState(null)
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    let active = true
    fetchSwitches().then(result => { if (!active) return; if (result.error) setError(result.error); else setValues(result.values) })
    return () => { active = false }
  }, [])

  async function flip(key) {
    const next = !values[key]
    setSaving(key); setError(''); setMessage('')
    const { error: problem } = await supabase.from('studio_private').upsert({ id: 'main', [key]: next, updated_at: stamp() })
    setSaving('')
    if (problem) { setError('The change could not be saved. Try again.'); return }
    setValues(current => ({ ...current, [key]: next }))
    setMessage(`${SWITCHES.find(([id]) => id === key)[1]} ${next ? 'switched on' : 'switched off'}.`)
  }

  return <>
    <div className="admin-title-row"><div><span className="lbl">Skee Block · Studio controls</span><h1 className="serif" ref={headingRef} tabIndex={-1}>Notifications</h1><p>Turn each kind of message on or off. Changes apply to the next message straight away. Account emails (sign-in codes, password resets) always stay on, because clients need them to sign in. WhatsApp switches are in the WhatsApp section.</p></div></div>
    {values === null && !error ? <p className="admin-empty">Loading…</p> : values && <div className="admin-editor-list">{SWITCHES.map(([key, title, hint]) => {
      return <section key={key} className="admin-editor-card admin-switch-row" aria-label={title}>
        <div><h3>{title}</h3><p>{hint}</p></div>
        <button type="button" role="switch" aria-checked={values[key]} className={`admin-switch${values[key] ? ' is-on' : ''}`} disabled={saving === key} onClick={() => flip(key)}><span aria-hidden="true" /><b>{values[key] ? 'On' : 'Off'}</b></button>
      </section>
    })}</div>}
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-message" role="status">{message}</p>}
  </>
}

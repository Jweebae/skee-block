import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// The studio's exact location is private: only owners can read it here, and clients get it only in the confirmation
// and appointment-day emails and on a confirmed appointment.
async function fetchDetails() {
  const { data, error } = await supabase.from('studio_private').select('location_url, location_note').eq('id', 'main').maybeSingle()
  return error ? { error: 'The studio details could not be loaded.' } : { url: data?.location_url || '', note: data?.location_note || '' }
}

export default function StudioDetails({ headingRef }) {
  const [fields, setFields] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    let active = true
    fetchDetails().then(result => { if (!active) return; if (result.error) { setError(result.error); setFields({ url: '', note: '' }) } else setFields(result) })
    return () => { active = false }
  }, [])

  async function save(event) {
    event.preventDefault()
    const url = fields.url.trim()
    if (url && !url.startsWith('https://')) { setError('The map link must start with https:// (copy it from Google Maps → Share).'); return }
    setBusy(true); setError(''); setMessage('')
    const { error: problem } = await supabase.from('studio_private').upsert({ id: 'main', location_url: url || null, location_note: fields.note.trim() || null, updated_at: new Date().toISOString() })
    setBusy(false)
    if (problem) setError('The studio details could not be saved. Try again.')
    else setMessage('Saved. Confirmed clients will get this location.')
  }

  return <>
    <div className="admin-title-row"><div><span className="lbl">Skee Block · Studio controls</span><h1 className="serif" ref={headingRef} tabIndex={-1}>Studio details</h1><p>The exact location stays private. Clients receive it only after you confirm their appointment: in the confirmation email, the appointment-day reminder and their confirmed appointment.</p></div></div>
    {fields === null ? <p className="admin-empty">Loading…</p> : <form className="admin-editor-card" onSubmit={save}>
      <div className="admin-field-grid">
        <label>Map link<input type="url" inputMode="url" maxLength={500} placeholder="https://maps.app.goo.gl/…" value={fields.url} onChange={event => setFields(current => ({ ...current, url: event.target.value }))} /></label>
      </div>
      <label className="admin-full-field">Directions note (optional)<textarea rows={2} maxLength={500} placeholder="Parking, which door, which floor…" value={fields.note} onChange={event => setFields(current => ({ ...current, note: event.target.value }))} /></label>
      <div className="admin-card-actions"><button type="submit" className="admin-save" disabled={busy}>{busy ? 'Saving…' : 'Save studio details'}</button></div>
    </form>}
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-message" role="status">{message}</p>}
  </>
}

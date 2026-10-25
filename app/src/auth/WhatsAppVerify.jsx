import { useEffect, useState } from 'react'
import { callWhatsApp } from '../lib/whatsappApi'
import { formatDzMobile } from '../lib/phone'

// Shown after a client saves a WhatsApp number, while the owner has WhatsApp verification switched on.
// The client sends a prefilled code message to the studio's business number; the server confirms it.
export default function WhatsAppVerify({ className = '' }) {
  const [state, setState] = useState(null)
  const [start, setStart] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    callWhatsApp('status').then(data => { if (active) setState(data) }).catch(() => { if (active) setState({ enabled: false }) })
    return () => { active = false }
  }, [])
  // While a code is waiting, check every few seconds whether it has arrived.
  useEffect(() => {
    if (!start || state?.verified) return
    let active = true
    const timer = setInterval(() => callWhatsApp('status').then(data => { if (active && data.verified) setState(data) }).catch(() => {}), 4000)
    return () => { active = false; clearInterval(timer) }
  }, [start, state?.verified])

  if (!state?.enabled || !state.phone) return null
  if (state.verified) return <p className={`wa-verify is-verified ${className}`} role="status">WhatsApp {formatDzMobile(state.phone)} verified ✓</p>
  async function begin() {
    setError('')
    try { const data = await callWhatsApp('start'); if (data.verified) setState(current => ({ ...current, verified: true })); else setStart(data) }
    catch (problem) { setError(problem.message) }
  }
  return <div className={`wa-verify ${className}`}>
    <p><strong>Verify your WhatsApp number</strong> {formatDzMobile(state.phone)}, so Skee can reach you there.</p>
    {start ? <>
      <a className="wa-verify-button" href={start.link} target="_blank" rel="noreferrer">Open WhatsApp and send the code ↗</a>
      <p className="wa-verify-hint">WhatsApp opens with “3kee code {start.code}” already written. Press Send, then come back here. The code works for 30 minutes.</p>
    </> : <button type="button" className="wa-verify-button" onClick={begin}>Verify on WhatsApp</button>}
    {error && <p className="wa-verify-error" role="alert">{error}</p>}
  </div>
}

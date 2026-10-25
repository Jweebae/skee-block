import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { callWhatsApp } from '../lib/whatsappApi'

// The owner connects the studio's WhatsApp business number to the website here, without code, then switches
// verification (free) and automatic messages (paid by Meta per message) on or off.
const STATUS_TEXT = { APPROVED: 'Approved', PENDING: 'Waiting for Meta', REJECTED: 'Rejected', NOT_CREATED: 'Not created', PAUSED: 'Paused', DISABLED: 'Disabled', UNKNOWN: 'Unknown' }
const stamp = () => new Date().toISOString()

function Copy({ label, value }) {
  const [copied, setCopied] = useState(false)
  return <div className="wa-copy"><span className="lbl">{label}</span><code>{value}</code><button type="button" className="admin-outline" onClick={() => navigator.clipboard?.writeText(value).then(() => setCopied(true), () => setCopied(false))}>{copied ? 'Copied' : 'Copy'}</button></div>
}

function Switch({ title, hint, on, locked, busy, onFlip }) {
  return <section className="admin-editor-card admin-switch-row" aria-label={title}>
    <div><h3>{title}</h3><p>{hint}</p></div>
    <button type="button" role="switch" aria-checked={on} className={`admin-switch${on ? ' is-on' : ''}`} disabled={busy || (locked && !on)} onClick={onFlip}><span aria-hidden="true" /><b>{locked && !on ? 'Connect first' : on ? 'On' : 'Off'}</b></button>
  </section>
}

export default function WhatsAppSettings({ headingRef }) {
  const [status, setStatus] = useState(null)
  const [fields, setFields] = useState({ display_number: '', phone_number_id: '', waba_id: '', owner_alert_number: '', access_token: '', app_secret: '' })
  const [templates, setTemplates] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const adopt = data => {
    setStatus(data)
    setFields({ display_number: data.display_number, phone_number_id: data.phone_number_id, waba_id: data.waba_id, owner_alert_number: data.owner_alert_number, access_token: '', app_secret: '' })
  }
  useEffect(() => {
    let active = true
    callWhatsApp('owner_status').then(data => { if (active) adopt(data) }).catch(problem => { if (active) setError(problem.message) })
    return () => { active = false }
  }, [])

  async function run(name, task, done) {
    setBusy(name); setError(''); setMessage('')
    try { await task(); if (done) setMessage(done) } catch (problem) { setError(problem.message) } finally { setBusy('') }
  }
  const save = event => { event.preventDefault(); run('save', async () => adopt(await callWhatsApp('owner_save', fields)), 'Connection details saved. The token and app secret are stored privately and are never shown again.') }
  const check = () => run('check', async () => { const { check: result } = await callWhatsApp('owner_check'); setStatus(current => ({ ...current, last_check: result })); if (!result.ok) throw new Error(`Meta answered: ${result.error}`) }, 'Connected to Meta.')
  const loadTemplates = create => run(create ? 'create' : 'templates', async () => { const data = await callWhatsApp('owner_templates', { create }); setTemplates(data.templates); if (data.error) throw new Error(`Meta answered: ${data.error}`) }, create ? 'Templates sent to Meta for review. Check their status again in a few minutes.' : '')
  const flip = (column, label) => run(column, async () => {
    const key = column === 'whatsapp_verification' ? 'verification' : 'messages'
    const next = !status[key]
    const { error: problem } = await supabase.from('studio_private').upsert({ id: 'main', [column]: next, updated_at: stamp() })
    if (problem) throw new Error('The change could not be saved. Try again.')
    setStatus(current => ({ ...current, [key]: next }))
    setMessage(`${label} switched ${next ? 'on' : 'off'}.`)
  })
  const set = key => event => setFields(current => ({ ...current, [key]: event.target.value }))
  const allApproved = templates?.length && templates.every(item => item.status === 'APPROVED')

  return <>
    <div className="admin-title-row"><div><span className="lbl">Skee Block · Studio controls</span><h1 className="serif" ref={headingRef} tabIndex={-1}>WhatsApp</h1><p>Connect the studio’s WhatsApp business number once, then switch number verification and automatic messages on or off here. Until then, the WhatsApp buttons on each appointment keep working as they do today.</p></div></div>
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-message" role="status">{message}</p>}
    {!status ? !error && <p className="admin-empty">Loading…</p> : <>
      <div className="admin-editor-list">
        <Switch title="WhatsApp number verification · free" hint="After a client enters their number, they confirm it by sending a code to the business number from their WhatsApp. Meta does not charge for messages clients send to you, or for your replies within 24 hours." on={status.verification} locked={!status.connected} busy={busy === 'whatsapp_verification'} onFlip={() => flip('whatsapp_verification', 'WhatsApp number verification')} />
        <Switch title="Automatic WhatsApp messages · paid by Meta" hint="Request received, confirmed, moved, cancelled and declined messages to clients who chose WhatsApp, plus owner alerts to the alert number. Meta charges for every one of these messages and needs a payment method in WhatsApp Manager. Needs the templates below to be approved." on={status.messages} locked={!status.connected || !allApproved} busy={busy === 'whatsapp_messages'} onFlip={() => flip('whatsapp_messages', 'Automatic WhatsApp messages')} />
      </div>

      <h2 className="appt-group">Connection {status.connected ? '· saved' : '· not connected'}</h2>
      {status.last_check?.at && <p className={status.last_check.ok ? 'admin-message' : 'admin-error'}>{status.last_check.ok ? `Last check: connected as “${status.last_check.name}” (${status.last_check.number}).` : `Last check failed: ${status.last_check.error}`}</p>}
      <form className="admin-editor-card wa-form" onSubmit={save}>
        <div className="admin-field-grid">
          <label>Business WhatsApp number<input value={fields.display_number} onChange={set('display_number')} placeholder="+213 5XX XX XX XX" maxLength={20} /></label>
          <label>Phone number ID<input value={fields.phone_number_id} onChange={set('phone_number_id')} inputMode="numeric" placeholder="From Meta: API Setup" maxLength={30} /></label>
          <label>WhatsApp Business Account ID<input value={fields.waba_id} onChange={set('waba_id')} inputMode="numeric" placeholder="From Meta: API Setup" maxLength={30} /></label>
          <label>Owner alert number (optional)<input value={fields.owner_alert_number} onChange={set('owner_alert_number')} placeholder="Your own WhatsApp, +213…" maxLength={20} /></label>
          <label>Access token {status.has_token && <small>saved (…{status.token_end}); leave empty to keep it</small>}<input type="password" autoComplete="off" value={fields.access_token} onChange={set('access_token')} placeholder={status.has_token ? '••••••••' : 'Permanent token from a system user'} /></label>
          <label>App secret {status.has_app_secret && <small>saved; leave empty to keep it</small>}<input type="password" autoComplete="off" value={fields.app_secret} onChange={set('app_secret')} placeholder={status.has_app_secret ? '••••••••' : 'From App settings → Basic'} /></label>
        </div>
        <div className="admin-card-actions"><button type="button" className="admin-outline" disabled={busy !== '' || !status.connected} onClick={check}>{busy === 'check' ? 'Checking…' : 'Check connection'}</button><button type="submit" className="admin-save" disabled={busy !== ''}>{busy === 'save' ? 'Saving…' : 'Save connection'}</button></div>
      </form>

      <div className="admin-editor-card wa-webhook"><span className="lbl">Paste these two into Meta (step 7)</span><Copy label="Callback URL" value={status.webhook_url} /><Copy label="Verify token" value={status.verify_token} /></div>

      <h2 className="appt-group">Message templates · only for automatic messages</h2>
      <div className="admin-editor-card wa-templates">
        <p>Meta must approve each message before the website can send it on its own. One click sends all eight for review; approval usually takes from a few minutes to a few hours.</p>
        <ul>{(templates || status.templates).map(item => <li key={item.name}><span><code>{item.name}</code>{item.text && <small>{item.text}</small>}{item.reason && item.reason !== 'NONE' && <small>Reason: {item.reason}</small>}</span>{item.status && <b className={`wa-tpl wa-tpl-${item.status}`}>{STATUS_TEXT[item.status] || item.status}</b>}</li>)}</ul>
        <div className="admin-card-actions"><button type="button" className="admin-outline" disabled={busy !== '' || !status.connected} onClick={() => loadTemplates(false)}>{busy === 'templates' ? 'Checking…' : 'Check status'}</button><button type="button" className="admin-save" disabled={busy !== '' || !status.connected || !status.waba_id} onClick={() => loadTemplates(true)}>{busy === 'create' ? 'Sending…' : 'Create templates'}</button></div>
      </div>

      <h2 className="appt-group">Set-up guide · once, about 30 minutes</h2>
      <ol className="admin-editor-card wa-guide">
        <li><b>Get the business SIM.</b> Use a number that is not used in the normal WhatsApp or WhatsApp Business app; Meta’s platform and the app cannot share a number. Keep the SIM in a phone that can receive SMS.</li>
        <li><b>Create the business on Meta.</b> Open business.facebook.com, sign in with Facebook and create a business portfolio named “3kee”.</li>
        <li><b>Create the app.</b> Open developers.facebook.com → My Apps → Create app → choose “Other”, then “Business”, name it “3kee website” and link it to the 3kee portfolio. On the app page, add the product <b>WhatsApp</b> → Set up.</li>
        <li><b>Add the number.</b> WhatsApp → API Setup → “Add phone number”: display name <b>3kee</b>, category Beauty, then the SIM number and the SMS code. Copy the <b>Phone number ID</b> and the <b>WhatsApp Business Account ID</b> shown there into the form above, with the number itself.</li>
        <li><b>Make a permanent access token.</b> business.facebook.com → Settings → Users → System users → Add, role Admin. Then “Assign assets”: the app (full control) and the WhatsApp account (full control). Click “Generate new token”, choose the app, expiry “Never”, and tick <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code>. Paste the token into the form above. Do not send it to anyone.</li>
        <li><b>Copy the app secret.</b> developers.facebook.com → your app → App settings → Basic → App secret → Show. Paste it into the form, click <b>Save connection</b>, then <b>Check connection</b>: it should say “Connected”.</li>
        <li><b>Connect the webhook.</b> developers.facebook.com → your app → WhatsApp → Configuration → Webhook → Edit. Paste the Callback URL and Verify token from the box above → Verify and save. Under “Webhook fields”, subscribe to <code>messages</code>.</li>
        <li><b>Publish the app.</b> App settings → Basic: Privacy policy URL <code>https://3kee.site/#privacy</code>, category, icon. Then switch App mode from Development to <b>Live</b> at the top of the page.</li>
        <li><b>Switch on verification.</b> Turn on “WhatsApp number verification” at the top of this page, then test it with your own account in My account.</li>
        <li><b>Only if you want paid automatic messages:</b> click Create templates, wait until all are Approved, add a payment method in WhatsApp Manager, then turn on “Automatic WhatsApp messages”. You can turn it off at any time.</li>
      </ol>
    </>}
  </>
}

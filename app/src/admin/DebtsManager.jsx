import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { callBookings, dayLabel, whatsappLink } from '../lib/bookingsApi'
import { formatPrice } from '../booking/catalog'
import { formatDzMobile } from '../lib/phone'
import useStudioBook from './useStudioBook'
import { dayOf, withRepayments } from './studioBook'
import './StudioBook.css'

// Who owes what. A repayment is saved as money in, so it also counts in the Money section on the day it was paid.
// The client never sees this: they only hear about a debt when an owner presses a reminder button.
const shortDay = value => dayLabel(`${value}T12:00:00Z`, { day: 'numeric', month: 'short', year: 'numeric' })

function DebtCard({ debt, today, onChanged }) {
  const [mode, setMode] = useState('')
  const [amount, setAmount] = useState(String(debt.left))
  const [date, setDate] = useState(today)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const first = debt.client_name.split(' ')[0]
  async function run(task, done) {
    setBusy(true); setError('')
    try { await task(); onChanged(done) } catch (problem) { setError(problem.message || 'This could not be saved. Try again.') } finally { setBusy(false) }
  }
  function repay(event) {
    event.preventDefault()
    const paid = Number(amount)
    run(async () => {
      const { error: problem } = await supabase.from('money_entries').insert({ kind: 'income', amount: paid, entry_date: date, scope: 'business', category: 'Debt repaid', note: debt.client_name, debt_id: debt.id })
      if (problem) throw new Error('The repayment could not be saved. Try again.')
    }, `${formatPrice(paid)} repaid by ${debt.client_name}.`)
  }
  const forgive = () => run(async () => {
    const { error: problem } = await supabase.from('client_debts').update({ forgiven_at: new Date().toISOString() }).eq('id', debt.id)
    if (problem) throw new Error('This could not be saved. Try again.')
  }, `The debt of ${debt.client_name} was forgiven.`)
  const remove = () => run(async () => {
    const { error: problem } = await supabase.from('client_debts').delete().eq('id', debt.id)
    if (problem) throw new Error('This could not be removed. Try again.')
  }, 'Debt removed.')
  return <section className="admin-editor-card debt-card" data-state={debt.state} aria-label={`Debt of ${debt.client_name}`}>
    <div className="debt-head">
      <div><span className="lbl">Since {shortDay(debt.created_on)}</span><h3>{debt.client_name}</h3><p>{[debt.client_phone && formatDzMobile(debt.client_phone), debt.client_email].filter(Boolean).join(' · ') || 'No contact details'}</p>{debt.note && <p className="book-note">{debt.note}</p>}</div>
      <div className="debt-amount"><strong>{debt.state === 'open' ? formatPrice(debt.left) : debt.state === 'paid' ? 'Repaid' : 'Forgiven'}</strong><small>{debt.repaid > 0 ? `${formatPrice(debt.repaid)} of ${formatPrice(debt.amount)} repaid` : `Owed ${formatPrice(debt.amount)}`}</small>{debt.reminders > 0 && <small>Reminded {debt.reminders} {debt.reminders === 1 ? 'time' : 'times'}</small>}</div>
    </div>
    {debt.state === 'open' && (mode === 'repay' ? <form className="book-form" onSubmit={repay}>
      <div className="book-form-grid"><label>Amount repaid · DA<input type="number" min="1" max={debt.left} required value={amount} onChange={event => setAmount(event.target.value)} /></label><label>Date<input type="date" required value={date} max={today} onChange={event => setDate(event.target.value)} /></label></div>
      <div className="admin-card-actions"><button type="button" className="admin-outline" onClick={() => setMode('')}>Not now</button><button type="submit" className="admin-save" disabled={busy}>Save repayment</button></div>
    </form> : <div className="admin-card-actions">
      <button type="button" className="admin-save" onClick={() => setMode('repay')}>Repaid</button>
      <button type="button" className="admin-outline" disabled={busy || !debt.client_email} title={debt.client_email ? '' : 'No email address for this client'} onClick={() => run(() => callBookings('owner_debt_notify', { id: debt.id }), `${debt.client_name} was emailed a reminder.`)}>Remind by email</button>
      {debt.client_phone && <a className="admin-outline" href={whatsappLink(debt.client_phone, `Salam ${first}, a quick note: ${formatPrice(debt.left)} is still open from your visit. You can settle it at your next cut. Thank you. — Skee`)} target="_blank" rel="noreferrer">Remind on WhatsApp ↗</a>}
      {mode === 'forgive' ? <><button type="button" className="admin-outline admin-delete" disabled={busy} onClick={forgive}>Yes, forgive it</button><button type="button" className="admin-outline" onClick={() => setMode('')}>Keep it</button></> : <button type="button" className="admin-outline admin-delete" onClick={() => setMode('forgive')}>Forgive</button>}
    </div>)}
    {debt.state === 'forgiven' && debt.repaid === 0 && <div className="admin-card-actions"><button type="button" className="admin-outline admin-delete" disabled={busy} onClick={remove}>Remove</button></div>}
    {error && <p className="admin-error" role="alert">{error}</p>}
  </section>
}

export default function DebtsManager({ headingRef }) {
  const book = useStudioBook()
  const [message, setMessage] = useState('')
  const data = book.data
  const debts = data ? withRepayments(data.debts, data.entries) : []
  const open = debts.filter(debt => debt.state === 'open').sort((a, b) => b.left - a.left)
  const closed = debts.filter(debt => debt.state !== 'open')
  const today = data ? dayOf(data.now) : ''
  const changed = text => { setMessage(text); book.reload() }
  return <>
    <div className="admin-title-row"><div><span className="lbl">Skee Block · Private</span><h1 className="serif" ref={headingRef} tabIndex={-1}>Debts</h1><p>Clients who still owe you money. Add a debt when you close a cut, or from a client’s line in Clients. Clients cannot see this; they only hear from you when you press a reminder.</p></div></div>
    {book.error && <p className="admin-error" role="alert">{book.error}</p>}{message && <p className="admin-message" role="status">{message}</p>}
    {!data ? !book.error && <p className="admin-empty">Loading debts…</p> : <>
      <dl className="book-stats"><div><dt>Owed to you</dt><dd>{formatPrice(open.reduce((total, debt) => total + debt.left, 0))}</dd></div><div><dt>Open debts</dt><dd>{open.length}</dd></div><div><dt>Clients</dt><dd>{new Set(open.map(debt => debt.client_id || debt.client_phone || debt.client_name)).size}</dd></div></dl>
      {open.length ? <div className="admin-editor-list">{open.map(debt => <DebtCard key={`${debt.id}-${debt.left}`} debt={debt} today={today} onChanged={changed} />)}</div> : <p className="admin-empty">Nobody owes you anything right now.</p>}
      {closed.length > 0 && <details className="appt-closed"><summary>Repaid or forgiven · {closed.length}</summary><div className="admin-editor-list">{closed.map(debt => <DebtCard key={`${debt.id}-${debt.left}`} debt={debt} today={today} onChanged={changed} />)}</div></details>}
    </>}
  </>
}

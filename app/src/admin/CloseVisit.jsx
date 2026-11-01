import { useState } from 'react'
import { formatPrice } from '../booking/catalog'

// Closing a visit: what really came in, what is still owed, or that it was on the house. All of it is private to owners.
// The same form corrects a visit already closed.
export default function CloseVisit({ booking, payment, debt, busy, onSave, onCancel }) {
  const total = booking.total_price
  const closed = booking.status === 'completed'
  const [mode, setMode] = useState(() => (payment?.is_free ? 'free' : payment && payment.amount_received !== total ? 'less' : 'full'))
  const [received, setReceived] = useState(() => String(payment?.amount_received ?? total))
  const [owed, setOwed] = useState(() => String(debt?.amount ?? 0))
  const [note, setNote] = useState(payment?.note || '')
  const amount = mode === 'full' ? total : mode === 'free' ? 0 : Number(received) || 0
  const debtAmount = mode === 'less' ? Number(owed) || 0 : 0
  const gap = Math.max(total - amount, 0)
  const valid = Number.isInteger(amount) && Number.isInteger(debtAmount) && amount >= 0 && debtAmount >= 0
  function submit(event) {
    event.preventDefault()
    if (valid) onSave({ free: mode === 'free', received: amount, debt: debtAmount, note })
  }
  return <form className="close-visit" onSubmit={submit} aria-label={`Close visit ${booking.code}`}>
    <div className="close-visit-head"><span className="lbl">{closed ? 'Payment for this cut' : 'Cut done'} · private</span><span>Expected {formatPrice(total)}</span></div>
    <div className="book-tabs" role="group" aria-label="How did the client pay?">{[['full', 'Paid in full'], ['less', 'Paid another amount'], ['free', 'Free cut']].map(([id, label]) => <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}>{label}</button>)}</div>
    {mode === 'less' && <div className="close-visit-fields">
      <label>Money received · DA<input type="number" min="0" max="1000000" step="1" required value={received} onChange={event => setReceived(event.target.value)} /></label>
      <label>Still owes · DA<input type="number" min="0" max="1000000" step="1" value={owed} onChange={event => setOwed(event.target.value)} /></label>
      {gap > 0 && Number(owed) !== gap && <button type="button" className="admin-outline" onClick={() => setOwed(String(gap))}>Put the {formatPrice(gap)} on debt</button>}
    </div>}
    <label className="close-visit-note">Private note (optional)<input maxLength={500} value={note} placeholder={mode === 'free' ? 'Why it was free' : ''} onChange={event => setNote(event.target.value)} /></label>
    <p className="close-visit-sum" role="status">{mode === 'free' ? 'Nothing is added to what you earned.' : `${formatPrice(amount)} is added to what you earned.`}{debtAmount > 0 ? ` ${formatPrice(debtAmount)} is saved as a debt.` : ''}{closed ? '' : booking.client_email ? ' The client gets an email asking for a review.' : ' This client has no email, so ask for the review on WhatsApp.'}</p>
    <div className="admin-card-actions"><button type="button" className="admin-outline" onClick={onCancel}>Not now</button><button type="submit" className="admin-save" disabled={busy || !valid}>{closed ? 'Save payment' : 'Confirm cut done'}</button></div>
  </form>
}

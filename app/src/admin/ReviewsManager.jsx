import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { callBookings, dayLabel } from '../lib/bookingsApi'
import { fetchAll } from '../lib/fetchAll'
import './StudioBook.css'

// Nothing a client writes reaches the website until an owner posts it live. Rejected reviews stay here, out of sight.
const TABS = [['pending', 'To read'], ['approved', 'Live'], ['rejected', 'Rejected']]
const FLAGS = { low_rating: 'Low rating', link: 'Contains a link', phone_number: 'Contains a phone number' }
const stars = rating => `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`

function ReviewCard({ review, onChanged }) {
  const [reply, setReply] = useState(review.reply || '')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function act(move, done) {
    setBusy(true); setError('')
    try { await callBookings('owner_review', { id: review.id, move, reply }); onChanged(done) }
    catch (problem) { setError(problem.message); setBusy(false) }
  }
  return <section className="admin-editor-card review-admin" aria-label={`Review by ${review.display_name}`}>
    <div className="review-admin-head"><div><span className="review-admin-stars" role="img" aria-label={`${review.rating} out of 5`}>{stars(review.rating)}</span><h3>{review.display_name}</h3><p>{review.service_name} · {dayLabel(review.created_at, { day: 'numeric', month: 'short', year: 'numeric' })} · {review.show_photo ? 'Photo shown if they have one' : 'Photo hidden'}</p></div>
      {review.flags?.length > 0 && <ul className="review-flags">{review.flags.map(flag => <li key={flag}>{FLAGS[flag] || flag}</li>)}</ul>}</div>
    <blockquote>{review.body}</blockquote>
    <label>Reply as Skee (optional, shown under the review)<textarea rows={2} maxLength={600} value={reply} onChange={event => setReply(event.target.value)} /></label>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <div className="admin-card-actions">
      {confirming ? <><button type="button" className="admin-outline admin-delete" disabled={busy} onClick={() => act('delete', 'Review deleted.')}>Yes, delete forever</button><button type="button" className="admin-outline" onClick={() => setConfirming(false)}>Keep it</button></> : <button type="button" className="admin-outline admin-delete" onClick={() => setConfirming(true)}>Delete</button>}
      {review.status !== 'pending' && reply !== (review.reply || '') && <button type="button" className="admin-outline" disabled={busy} onClick={() => act('reply', 'Reply saved.')}>Save reply</button>}
      {review.status !== 'rejected' && <button type="button" className="admin-outline" disabled={busy} onClick={() => act('reject', 'Review rejected. It is not on the website.')}>{review.status === 'approved' ? 'Take it down' : 'Reject'}</button>}
      {review.status !== 'approved' && <button type="button" className="admin-save" disabled={busy} onClick={() => act('approve', 'Review posted live on the website.')}>Post it live</button>}
    </div>
  </section>
}

export default function ReviewsManager({ headingRef }) {
  const [reviews, setReviews] = useState(null)
  const [version, setVersion] = useState(0)
  const [tab, setTab] = useState('pending')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    let active = true
    fetchAll(() => supabase.from('reviews').select('*').order('created_at', { ascending: false }).order('id'))
      .then(rows => { if (active) { setReviews(rows); setError('') } })
      .catch(() => { if (active) setError('Reviews could not be loaded. Check your connection and try again.') })
    return () => { active = false }
  }, [version])
  const all = reviews || []
  const shown = all.filter(item => item.status === tab)
  const live = all.filter(item => item.status === 'approved')
  const average = live.length ? (live.reduce((total, item) => total + item.rating, 0) / live.length).toFixed(1) : '—'
  return <>
    <div className="admin-title-row"><div><span className="lbl">Skee Block · Word on the Block</span><h1 className="serif" ref={headingRef} tabIndex={-1}>Reviews</h1><p>Read what clients write, then post it live or reject it. The homepage shows the newest three, and every review you post appears on the reviews page.</p></div></div>
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-message" role="status">{message}</p>}
    {reviews === null ? !error && <p className="admin-empty">Loading reviews…</p> : <>
      <dl className="book-stats"><div><dt>To read</dt><dd>{all.filter(item => item.status === 'pending').length}</dd></div><div><dt>Live</dt><dd>{live.length}</dd></div><div><dt>Average rating</dt><dd>{average}</dd></div></dl>
      <div className="book-tabs" role="group" aria-label="Review status">{TABS.map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>{label} · {all.filter(item => item.status === id).length}</button>)}</div>
      {shown.length ? <div className="admin-editor-list">{shown.map(item => <ReviewCard key={`${item.id}-${item.status}-${item.reply}`} review={item} onChanged={text => { setMessage(text); setVersion(value => value + 1) }} />)}</div> : <p className="admin-empty">{tab === 'pending' ? 'No reviews waiting. You get an email when one arrives.' : tab === 'approved' ? 'No reviews on the website yet.' : 'No rejected reviews.'}</p>}
    </>}
  </>
}

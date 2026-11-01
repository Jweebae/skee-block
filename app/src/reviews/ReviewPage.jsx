import { useEffect, useState } from 'react'
import logo from '../assets/skee-logo-white.svg'
import { callBookings, dayLabel } from '../lib/bookingsApi'
import './Reviews.css'

// Reached from the link in the review email, or from the client's history. The link's private token is the proof of the
// visit, so there is nothing to sign in to.
const RATING_WORDS = ['', 'Poor', 'Could be better', 'Good', 'Very good', 'Excellent']

export default function ReviewPage({ token, signedIn }) {
  const [visit, setVisit] = useState(null)
  const [failed, setFailed] = useState('')
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [showPhoto, setShowPhoto] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  useEffect(() => {
    let active = true
    callBookings('review_lookup', { token })
      .then(data => { if (active) setVisit(data) })
      .catch(problem => { if (active) setFailed(problem.message) })
    return () => { active = false }
  }, [token])
  async function submit(event) {
    event.preventDefault()
    setSending(true); setError('')
    try { await callBookings('review_submit', { token, rating, body, showPhoto }); setSent(true) }
    catch (problem) { setError(problem.message) } finally { setSending(false) }
  }
  const back = signedIn ? '#account' : '#top'
  return <main className="review-page">
    <a className="review-page-brand" href={back}><img src={logo} alt="SKEE" /><span>{signedIn ? 'My account' : 'Skee Block'}</span></a>
    <div className="review-page-body">
      {failed ? <><h1 className="serif">This link has <em>expired</em>.</h1><p>{failed} If you think this is a mistake, message Skee on WhatsApp.</p></>
        : !visit ? <p>Loading your visit…</p>
          : sent || visit.reviewed ? <><span className="lbl">Thank you</span><h1 className="serif">Skee will read <em>every word</em>.</h1><p>{sent ? 'Your review is with Skee now. It appears on the website once it is approved.' : 'You have already reviewed this visit. Thank you.'}</p><a className="review-page-btn" href={back}>{signedIn ? 'Back to my account' : 'Back to the website'}</a></>
            : <form onSubmit={submit}>
              <span className="lbl">{visit.service} · {dayLabel(visit.date, { day: 'numeric', month: 'long' })}</span>
              <h1 className="serif">How was it, <em>{visit.first_name}</em>?</h1>
              <p>Your honest impression: the cut, the welcome and your whole experience at the Block.</p>
              <fieldset className="review-rating"><legend>Your rating</legend>
                <div>{[1, 2, 3, 4, 5].map(value => <label key={value} data-on={value <= rating}><input type="radio" name="rating" required value={value} checked={rating === value} onChange={() => setRating(value)} /><span aria-hidden="true">★</span><span className="visually-hidden">{value} out of 5: {RATING_WORDS[value]}</span></label>)}</div>
                <small aria-live="polite">{RATING_WORDS[rating] || 'Tap a star'}</small>
              </fieldset>
              <label className="review-text">Your review<textarea required rows={6} maxLength={1000} value={body} placeholder="What did you like? What could Skee do better?" onChange={event => setBody(event.target.value)} /><small>{body.length}/1000</small></label>
              {visit.has_photo && <label className="review-photo"><input type="checkbox" checked={showPhoto} onChange={event => setShowPhoto(event.target.checked)} /><span>Show my profile photo next to this review<small>Leave this off to keep your photo hidden from other visitors. Skee can always see it.</small></span></label>}
              <p className="review-note">It appears with your first name and last initial, only after Skee approves it.</p>
              {error && <p className="review-error" role="alert">{error}</p>}
              <button type="submit" className="review-page-btn" disabled={sending || !rating || !body.trim()}>{sending ? 'Sending…' : 'Send my review'}</button>
            </form>}
    </div>
  </main>
}

import { useEffect, useRef, useState } from 'react'
import { countdownStep, countdownText, offerEnd, offerPercent, liveOffers } from './offers'
import './OffersStrip.css'

const SLIDE_MS = 4600
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// A card's photos cross-fade on their own; the thin bars underneath show where the cycle is and can be tapped.
function usePhotoCycle(count, paused) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (count < 2 || paused || reducedMotion()) return
    const timer = setInterval(() => setIndex(value => value + 1), SLIDE_MS)
    return () => clearInterval(timer)
  }, [count, paused])
  // Clamped here rather than reset in an effect, so a changed photo list never renders an empty frame.
  return [count ? index % count : 0, setIndex]
}

// Ticks only while an offer has a deadline, and only as often as the shown unit needs.
function useCountdown(endsAt) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!endsAt) return
    let timer = 0
    const tick = () => {
      const at = Date.now()
      setNow(at)
      if (at < endsAt) timer = setTimeout(tick, countdownStep(endsAt, at))
    }
    timer = setTimeout(tick, countdownStep(endsAt, Date.now()))
    return () => clearTimeout(timer)
  }, [endsAt])
  return endsAt ? countdownText(endsAt, now) : ''
}

function OfferCard({ offer, index }) {
  const card = useRef(null)
  const [hovered, setHovered] = useState(false)
  const photos = offer.photos || []
  const [shown, setShown] = usePhotoCycle(photos.length, hovered)
  const left = useCountdown(offerEnd(offer))
  const percent = offerPercent(offer)
  const was = Number(offer.oldPrice) || 0
  const now = Number(offer.newPrice) || 0

  // The gold glow follows the pointer. Written straight to the element so moving the mouse never re-renders.
  function follow(event) {
    const box = card.current?.getBoundingClientRect()
    if (!box) return
    card.current.style.setProperty('--mx', `${((event.clientX - box.left) / box.width) * 100}%`)
    card.current.style.setProperty('--my', `${((event.clientY - box.top) / box.height) * 100}%`)
  }

  return <article
    ref={card}
    className={`offer-card${photos.length ? ' has-photo' : ''}`}
    style={{ '--delay': `${index * 90}ms` }}
    onPointerMove={follow}
    onPointerEnter={() => setHovered(true)}
    onPointerLeave={() => { setHovered(false); card.current?.style.removeProperty('--mx') }}
  >
    <span className="offer-canvas" aria-hidden="true">
      {photos.length
        ? photos.map((src, position) => <img key={src} src={src} alt="" loading="lazy" decoding="async" className={position === shown ? 'is-shown' : ''} />)
        : <><span className="offer-weave" /><span className="offer-weave offer-weave-two" /></>}
      {percent > 0 && <span className="offer-ghost">{percent}<i>%</i></span>}
    </span>
    <span className="offer-scrim" aria-hidden="true" />
    <span className="offer-glow" aria-hidden="true" />
    <span className="offer-sheen" aria-hidden="true" />

    <button type="button" className="offer-hit" data-action="booking" data-service={offer.serviceId || undefined}>
      <span className="visually-hidden">Book — {offer.name}</span>
    </button>

    <div className="offer-body">
      <div className="offer-top">
        <span className="offer-tag">{offer.label || 'Offer'}</span>
        {percent > 0 && <span className="offer-badge">−{percent}%</span>}
        {left && <span className="offer-timer"><i aria-hidden="true" />Ends in {left}</span>}
      </div>
      <h3 className="serif offer-title">{offer.name}</h3>
      {offer.description && <p className="offer-text">{offer.description}</p>}
      <div className="offer-foot">
        <span className="offer-prices">
          {was > 0 && now > 0 && <s>{was} DA</s>}
          {(now > 0 || was > 0) && <strong>{now > 0 ? now : was} DA</strong>}
        </span>
        <span className="offer-cta">Book this <i aria-hidden="true">→</i></span>
      </div>
    </div>

    {photos.length > 1 && <span className="offer-bars">
      {photos.map((src, position) => <button
        key={src}
        type="button"
        className={`offer-bar${position === shown ? ' is-active' : ''}`}
        aria-label={`Show photo ${position + 1} of ${photos.length}`}
        onClick={() => setShown(position)}
      ><i key={`${position}-${shown}-${hovered}`} style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: hovered ? 'paused' : 'running' }} /></button>)}
    </span>}
  </article>
}

export default function OffersStrip({ offers }) {
  const [now, setNow] = useState(() => Date.now())
  // One slow timer retires an offer whose deadline passes while the page is open.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])
  const live = liveOffers(offers, now)
  if (!live.length) return null
  return <div className="offers-strip" data-count={live.length} aria-label="Current offers">
    {live.map((offer, index) => <OfferCard key={offer.id} offer={offer} index={index} />)}
  </div>
}

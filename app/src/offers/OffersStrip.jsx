import { useEffect, useRef, useState } from 'react'
import { countdownStep, countdownText, offerAddonMap, offerEnd, offerLines, offerPercent, liveOffers } from './offers'
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

function OfferCard({ offer, index, services, menu, onBook }) {
  const card = useRef(null)
  const [hovered, setHovered] = useState(false)
  const [lit, setLit] = useState(false) // a finger held on the card, where there is no hover
  const [open, setOpen] = useState(false)
  const [album, setAlbum] = useState(false)
  const photos = offer.photos || []
  // The cut is the one thing the offer leaves open, so Book now waits until it is picked.
  const [cutId, setCutId] = useState(offer.serviceId || '')
  const cut = services.find(item => item.id === cutId)
  const lines = offerLines(offer, menu, cut?.name)
  const [shown, setShown] = usePhotoCycle(photos.length, hovered || open)
  const left = useCountdown(offerEnd(offer))
  const percent = offerPercent(offer)
  const was = Number(offer.oldPrice) || 0
  const now = Number(offer.newPrice) || 0

  // The gold pool follows the pointer — a mouse anywhere on the card, or a finger while it stays down.
  // Written straight to the element so moving never costs a re-render.
  function follow(event) {
    const box = card.current?.getBoundingClientRect()
    if (!box) return
    card.current.style.setProperty('--mx', `${((event.clientX - box.left) / box.width) * 100}%`)
    card.current.style.setProperty('--my', `${((event.clientY - box.top) / box.height) * 100}%`)
  }
  function press(event) {
    follow(event)
    if (event.pointerType !== 'mouse') setLit(true)
  }
  function release() {
    setLit(false)
    card.current?.style.removeProperty('--mx')
  }

  function toggle() {
    setOpen(value => !value)
    setAlbum(false)
  }

  // Everything else in the offer is already decided, so booking opens straight at Date & time.
  function book() {
    if (!cutId) return
    onBook({ serviceId: cutId, addons: offerAddonMap(offer), step: 2, offerId: offer.id })
  }

  function chooseCut(id) {
    setCutId(id)
    setAlbum(false)
  }

  return <article
    ref={card}
    className={`offer-card${photos.length ? ' has-photo' : ''}${open ? ' is-open' : ''}${lit ? ' is-lit' : ''}`}
    style={{ '--delay': `${index * 90}ms` }}
    onPointerDown={press}
    onPointerMove={follow}
    onPointerUp={release}
    onPointerCancel={release}
    onPointerEnter={() => setHovered(true)}
    onPointerLeave={() => { setHovered(false); release() }}
  >
    <span className="offer-canvas" aria-hidden="true">
      {photos.length
        ? photos.map((src, position) => <img key={src} src={src} alt="" loading="lazy" decoding="async" className={position === shown ? 'is-shown' : ''} />)
        : <><span className="offer-weave" /><span className="offer-weave offer-weave-two" /></>}
      {percent > 0 && <span className="offer-ghost">{percent}<i>%</i></span>}
    </span>
    {/* Only over a photo, and only once the card is open: the picture blurs from the bottom up so the
        item list and the buttons stay legible. Four stacked layers make the ramp smooth. */}
    {photos.length > 0 && <span className="offer-blur" aria-hidden="true"><i /><i /><i /><i /></span>}
    <span className="offer-scrim" aria-hidden="true" />
    <span className="offer-glow" aria-hidden="true" />
    <span className="offer-sheen" aria-hidden="true" />

    {/* Covers the card behind the words: tapping anywhere empty opens the deal, and closes it again. */}
    <button type="button" className="offer-hit" aria-expanded={open} onClick={toggle}>
      <span className="visually-hidden">{open ? 'Close' : 'See'} the deal — {offer.name}</span>
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
        <span className="offer-cta">{open ? 'Close' : 'See the deal'} <i aria-hidden="true">⌄</i></span>
      </div>

      <div className="offer-more" data-open={open}>
        <div className="offer-more-clip">
          <div className="offer-more-pad">
            {lines.length > 0 && <ul className="offer-items">
              {lines.map(line => <li key={line.id}><span>{line.name}</span>{line.price > 0 && <b>{line.price} DA</b>}</li>)}
            </ul>}

            {(was > 0 || now > 0) && <div className="offer-total">
              {was > 0 && <span>Usual total <s>{was} DA</s></span>}
              <span className="offer-total-now">Offer price <strong>{now > 0 ? now : was} DA</strong></span>
              {!offer.includesCut && <span className="offer-total-note">Your cut is charged separately</span>}
            </div>}

            <div className="offer-actions">
              <button type="button" className="offer-btn offer-btn-primary" disabled={!cutId} onClick={book}>Book now <i aria-hidden="true">→</i></button>
              <button type="button" className="offer-btn" aria-expanded={album} onClick={() => setAlbum(value => !value)}>{cut ? 'Change cut' : 'Choose cut'} <i aria-hidden="true">⌄</i></button>
              <span className="offer-chosen" role="status">{cut ? <>Cut: <b>{cut.name}</b></> : 'Choose your cut to unlock booking'}</span>
            </div>

            <div className="offer-album" data-open={album}>
              <div className="offer-more-clip">
                <div className="offer-album-grid">
                  {services.map(option => <button
                    key={option.id}
                    type="button"
                    className={`offer-cut${option.id === cutId ? ' is-chosen' : ''}`}
                    aria-pressed={option.id === cutId}
                    onClick={() => chooseCut(option.id)}
                  >
                    {option.photos?.[0] && <img src={option.photos[0]} alt="" loading="lazy" decoding="async" />}
                    <span className="offer-cut-copy">
                      <span className="serif offer-cut-name">{option.name}</span>
                      {option.description && <span className="offer-cut-text">{option.description}</span>}
                      <span className="offer-cut-foot"><i>{option.duration} min</i><i className="offer-cut-go">{option.id === cutId ? 'Chosen ✓' : 'Choose'}</i></span>
                    </span>
                  </button>)}
                  {!services.length && <p className="offer-cut-empty">The menu is being updated. Tap Book now to reach Skee.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {photos.length > 1 && <span className="offer-bars">
      {photos.map((src, position) => <button
        key={src}
        type="button"
        className={`offer-bar${position === shown ? ' is-active' : ''}`}
        aria-label={`Show photo ${position + 1} of ${photos.length}`}
        onClick={() => setShown(position)}
      ><i key={`${position}-${shown}-${hovered}-${open}`} style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: hovered || open ? 'paused' : 'running' }} /></button>)}
    </span>}
  </article>
}

export default function OffersStrip({ offers, services = [], menu = [], onBook }) {
  const [now, setNow] = useState(() => Date.now())
  // One slow timer retires an offer whose deadline passes while the page is open.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])
  const live = liveOffers(offers, now)
  if (!live.length) return null
  return <div className="offers-strip" data-count={live.length} aria-label="Current offers">
    {live.map((offer, index) => <OfferCard key={offer.id} offer={offer} index={index} services={services} menu={menu} onBook={onBook} />)}
  </div>
}

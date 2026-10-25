import { useEffect, useRef, useState } from 'react'
import logo from './assets/skee-logo-white.svg'
import heroPortrait from './assets/hero-portrait.png'
import curtainTaper from './assets/gallery/curtain-taper.webp'
import sweptTaper from './assets/gallery/swept-taper.webp'
import texturedTaper from './assets/gallery/textured-taper.webp'
import curlyTaper from './assets/gallery/curly-taper.webp'
import './App.css'
import BookingFlow from './booking/BookingFlow'
import { clearPendingBooking, hasPendingBooking } from './booking/bookingDraft'
import { BASE_CUT_PRICE } from './booking/catalog'
import useStudioSettings from './settings/useStudioSettings'
import { nextOpening } from './settings/studioSettings'
import { STUDIO_PHONE, STUDIO_AREA, WHATSAPP_URL } from './settings/studioContact'
import AdminGate from './admin/AdminGate'
import useClientSession from './auth/useClientSession'
import ClientAccount from './auth/ClientAccount'
import AccountPage from './auth/AccountPage'
import PrivacyNotice from './legal/PrivacyNotice'


function ChatIcon() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" /><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1.2-1.1 2 .9-.4 1.6c-3.9.4-8.4-4.1-8-8l1.6-.4.9 2z" /></svg>
}

// Layout, content and design tokens ported from the approved Home board.
// Bracketed content deliberately preserves the reference's unconfirmed details.
export default function App() {
  const { settings, error: storageError, saveSettings } = useStudioSettings()
  const client = useClientSession()
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === '#admin')
  const [isPrivacy, setIsPrivacy] = useState(() => window.location.hash === '#privacy')
  const [isAccount, setIsAccount] = useState(() => window.location.hash === '#account')
  const visibleServices = settings.services.filter(item => item.visible)
  const openDays = settings.hours.filter(item => item.open)
  const hoursSummary = openDays.length === 0 ? 'Closed this week' : openDays.length === 6 && !settings.hours[5].open && openDays.every(item => item.start === openDays[0].start && item.end === openDays[0].end) ? `Sat–Thu · ${openDays[0].start}–${openDays[0].end}` : `${openDays.length} open days · See weekly hours`
  const friday = settings.hours[5]
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])
  const [menuOpen, setMenuOpen] = useState(false)
  const [action, setAction] = useState('booking')
  const dialogRef = useRef(null)
  const bookingDialogRef = useRef(null)
  const [bookingRequest, setBookingRequest] = useState(null)

  useEffect(() => {
    const navigate = () => {
      const hash = window.location.hash
      setBookingRequest(null); setMenuOpen(false); setIsAdmin(hash === '#admin'); setIsPrivacy(hash === '#privacy'); setIsAccount(hash === '#account')
      if (hash === '#account' && dialogRef.current?.open) dialogRef.current.close()
    }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])

  useEffect(() => {
    if (isAdmin || window.location.hash !== '#top') return
    const frame = requestAnimationFrame(() => document.getElementById('top')?.scrollIntoView({ behavior: 'instant' }))
    return () => cancelAnimationFrame(frame)
  }, [isAdmin])

  useEffect(() => {
    if (!isAccount || isAdmin) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [isAccount, isAdmin])

  useEffect(() => {
    if (!bookingRequest || isAdmin) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    bookingDialogRef.current.showModal()
    return () => { document.body.style.overflow = previousOverflow }
  }, [bookingRequest, isAdmin])

  const autoOpened = useRef(false)
  useEffect(() => {
    // Coming back from Google: open the account dialog when there is something to finish or to explain.
    if (isAdmin || autoOpened.current) return
    const returned = client.returnedFromGoogle && client.ready && client.user && (!client.profileComplete || client.choosingPassword)
    if (!client.error && !returned) return
    const frame = requestAnimationFrame(() => {
      if (!dialogRef.current || dialogRef.current.open) return
      autoOpened.current = true
      setAction('account')
      dialogRef.current.showModal()
    })
    return () => cancelAnimationFrame(frame)
  }, [client.error, client.ready, client.user, client.profileComplete, client.choosingPassword, client.returnedFromGoogle, isAdmin])

  // A visitor who signed in to send a booking request goes straight back to it.
  useEffect(() => {
    if (isAdmin || !client.profileComplete || !hasPendingBooking()) return
    const frame = requestAnimationFrame(() => {
      if (dialogRef.current?.open) dialogRef.current.close()
      if (bookingRequest) clearPendingBooking()
      else setBookingRequest({ serviceId: null })
    })
    return () => cancelAnimationFrame(frame)
  }, [client.profileComplete, bookingRequest, isAdmin])

  function openAccount() {
    setAction('account')
    setMenuOpen(false)
    if (!dialogRef.current.open) dialogRef.current.showModal()
  }

  function handleAction(event) {
    const trigger = event.target.closest('[data-action]')
    if (!trigger) return
    if (trigger.dataset.action === 'whatsapp') {
      window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer')
      setMenuOpen(false)
      return
    }
    if (trigger.dataset.action === 'booking') {
      setMenuOpen(false)
      setBookingRequest({ serviceId: trigger.dataset.service || null })
      return
    }
    if (trigger.dataset.action === 'account' && client.user && client.profileComplete) {
      setMenuOpen(false)
      window.location.hash = 'account'
      return
    }
    setAction(trigger.dataset.action)
    setMenuOpen(false)
    dialogRef.current.showModal()
  }

  if (isAdmin) return <AdminGate settings={settings} storageError={storageError} onSave={saveSettings} />
  if (isPrivacy) return <PrivacyNotice />

  return (
    <div onClick={handleAction}>
    <div className="homepage page-frame">
      <div className="brand-backdrop" aria-hidden="true" />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header header-surface">
        <div className="header-inner header-layout">
          <a href="#top" aria-label="Skee Block home" className="brand-lockup brand-layout">
            <img src={logo} alt="SKEE" className="brand-mark" />
            <span className="brand-divider"></span>
            <span className="brand-word">
              Block
            </span>
          </a>
          <nav className="nav desktop-nav nav-links">
            <a href="#services">
              Services
            </a>
            <a href="#story">
              The Block
            </a>
            <a href="#reviews">
              Reviews
            </a>
            <a href="#visit">
              Visit
            </a>
          </nav>
          <div className="desktop-actions header-actions">
            <button className="btn btn-ghost button-sign-in" data-action="account" type="button">
              {client.user ? 'Account' : 'Sign in'}
            </button>
            <button className="btn btn-bone button-book" data-action="booking" type="button">
              Book
            </button>
          </div>
        </div>
      <button type="button" className="mobile-menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
      {menuOpen && <nav id="mobile-navigation" className="mobile-navigation" aria-label="Mobile navigation" onClick={() => setMenuOpen(false)}><a href="#services">Services</a><a href="#story">The Block</a><a href="#reviews">Reviews</a><a href="#visit">Visit</a><button data-action="account">Sign in</button></nav>}
    </header>
      <main id="main-content">
      <section id="top" className="hero hero-frame">
        <div className="hero-grid hero-layout">
          <div className="hero-copy hero-stack">
            <div className="lbl in hero-eyebrow eyebrow-row">
              <span className="eyebrow-rule"></span>
              <span className="text-gold">
                M'Sila · By appointment only
              </span>
            </div>
            <h1 className="serif in d1 hero-title hero-heading">
              The chair
              <br />
              is{' '}
              <span className="text-gold-italic">
                yours
              </span>
              <br />
              for the hour.
            </h1>
            <p className="in d2 hero-description hero-intro">
              <span className="desktop-hero-description">Classic barbering with streetwear edge. One client, one chair, no rush — precision fades, sculpted beards and the hot-towel ritual, by Skee.</span>
              <span className="mobile-hero-description">Classic barbering with streetwear edge. One client, one chair, no rush.</span>
            </p>
            <div className="in d3 hero-actions hero-button-row">
              <button className="btn btn-bone button-primary" data-action="booking" type="button">
                Book the chair
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M13 6l6 6-6 6"></path>
                </svg>
              </button>
              <button className="btn btn-ghost button-secondary" data-action="whatsapp" type="button">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"></path>
                  <path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1.2-1.1 2 .9-.4 1.6c-3.9.4-8.4-4.1-8-8l1.6-.4.9 2z"></path>
                </svg>
                WhatsApp Skee
              </button>
            </div>
            <div className="in d4 hero-facts facts-row">
              <div className="fact-item">
                <span className="lbl">
                  Next opening
                </span>
                <span className="text-small">
                  {nextOpening(settings.hours, now)}
                </span>
              </div>
              <div className="fact-item">
                <span className="lbl">
                  Hours
                </span>
                <span className="text-small">
                  {hoursSummary}
                </span>
              </div>
              <div className="fact-item">
                <span className="lbl">
                  Confirm
                </span>
                <span className="text-small">
                  Instant, by WhatsApp
                </span>
              </div>
            </div>
          </div>
          <div className="in d2 hero-portrait portrait-frame">
            <img
              src={heroPortrait}
              alt="Skee seated in the barber chair"
              className="portrait-image"
              loading="eager"
              fetchPriority="high"
            />
            <span className="lbl portrait-number">
              01
            </span>
            <div className="portrait-caption portrait-bottomline">
              <span className="lbl text-gold">
                Skee
              </span>
              <span className="serif portrait-quote">
                The barber behind the Block.
              </span>
            </div>
            <span className="lbl portrait-est portrait-side-label">
              Est. M'Sila
            </span>
          </div>
        </div>
      </section>
      <div aria-hidden="true" className="marquee-band ticker-frame">
        <div className="marquee ticker-track">
          <span className="serif ticker-serif">
            Skin fades
          </span>
          <span className="text-gold">
            ✦
          </span>
          <span className="lbl ticker-label">
            Hot towel
          </span>
          <span className="text-gold">
            ✦
          </span>
          <span className="serif ticker-serif">
            Straight razor
          </span>
          <span className="text-gold">
            ✦
          </span>
          <span className="lbl ticker-label">
            Beard sculpt
          </span>
          <span className="text-gold">
            ✦
          </span>
          <span className="serif ticker-serif">
            One client, one chair
          </span>
          <span className="text-gold">
            ✦
          </span>
          <span className="lbl ticker-label">
            M'Sila, Algeria
          </span>
          <span className="text-gold">
            ✦
          </span>
          <span className="serif ticker-serif">
            Skin fades
          </span>
          <span className="text-gold">
            ✦
          </span>
          <span className="lbl ticker-label">
            Hot towel
          </span>
          <span className="text-gold">
            ✦
          </span>
          <span className="serif ticker-serif">
            Straight razor
          </span>
          <span className="text-gold">
            ✦
          </span>
          <span className="lbl ticker-label">
            Beard sculpt
          </span>
          <span className="text-gold">
            ✦
          </span>
          <span className="serif ticker-serif">
            One client, one chair
          </span>
          <span className="text-gold">
            ✦
          </span>
          <span className="lbl ticker-label">
            M'Sila, Algeria
          </span>
          <span className="text-gold">
            ✦
          </span>
        </div>
      </div>
      <section id="services" className="services-section section-container">
        <div className="reveal section-heading menu-heading-row">
          <div className="menu-heading-copy">
            <span className="lbl">
              01 — The Menu
            </span>
            <h2 className="serif section-title">
              Services,{' '}
              <span className="text-italic">
                considered
              </span>
              .
            </h2>
          </div>
          <p className="section-intro">
            Every service starts with a consultation and ends with a hot towel. Prices in Algerian dinar, add-ons chosen at booking.
          </p>
        </div>
        <div className="services-grid card-grid">
          {visibleServices.map(item => <button key={item.id} className={`card reveal ${item.id === 'ritual' ? 'service-card-featured' : 'service-card'}`} data-action="booking" data-service={item.id} type="button">
            <div className="lbl card-topline"><span>{item.duration} min</span><span className={['signature', 'ritual'].includes(item.id) ? 'text-gold' : ''}>{item.category}</span></div>
            <div className="serif service-title">{item.id === 'ritual' && item.name === 'The Block Ritual' ? <>The Block <em>Ritual</em></> : item.name}</div>
            <div className="service-description">{item.description}</div>
            <div className="card-bottomline"><span className={item.id === 'ritual' ? 'service-price-featured' : 'service-price'}>{BASE_CUT_PRICE} DA</span><span className="arrow lbl text-bone">Book →</span></div>
          </button>)}
        </div>
        {!visibleServices.length && <p className="section-intro">The menu is being updated. Contact Skee to arrange a visit.</p>}
        <p className="lbl placeholder-note">
          All base cuts: 800 DA · Optional add-ons are charged separately
        </p>
      </section>
      <section id="story" className="story-section story-frame">
        <div className="story-inner story-layout">
          <div className="story-copy story-columns">
            <div className="reveal story-heading-stack">
              <span className="lbl">
                02 — The Block
              </span>
              <h2 className="serif section-title">
                Old-school hands.
                <br />
                <span className="text-gold-italic">
                  Street-born
                </span>
                 {' '}eye.
              </h2>
            </div>
            <div className="reveal story-paragraphs">
              <p className="margin-zero">
                Hello, Skee is speaking: the block is made to be a safe place for every man that likes to truly take care of himself.
              </p>
              <p className="margin-zero">
                why MSila you may ask? its pretty simple cause NO ONE has the skills needed to bless everyone's head and i ain't going nowhere. the ice producer will always be here to provide you with topshelf haircare
              </p>
              <p className="margin-zero">
                The room is quiet, the music is low, the tools are laid out before you sit. Nobody waits on a bench — your time is booked, and it's held for you.
              </p>
              <a href="https://www.instagram.com/skeeondablock/" className="btn instagram-link" target="_blank" rel="noreferrer">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="5"></rect>
                  <circle cx="12" cy="12" r="4"></circle>
                  <circle cx="17.5" cy="6.5" r=".8" fill="currentColor"></circle>
                </svg>
                Follow @skeeondablock
              </a>
            </div>
          </div>
          <div className="gallery-grid gallery-layout">
            <a href="https://www.instagram.com/skeeondablock/" className="tile reveal gallery-tile" target="_blank" rel="noreferrer">
              <img className="ph gallery-image" src={curtainTaper} width="960" height="1200" loading="lazy" decoding="async" alt="Three-quarter view of a center-parted wavy curtain cut with tapered sides." />
              <span className="lbl gallery-label">
                Curtain taper
              </span>
              <div className="cap gallery-caption">
                <span className="serif gallery-caption-title">
                  Sharp, every time.
                </span>
                <span className="lbl text-gold">
                  View
                </span>
              </div>
            </a>
            <a href="https://www.instagram.com/skeeondablock/" className="tile reveal gallery-tile-offset" target="_blank" rel="noreferrer">
              <img className="ph gallery-image" src={sweptTaper} width="960" height="1200" loading="lazy" decoding="async" alt="Right profile showing swept-back waves and a clean taper around the ear." />
              <span className="lbl gallery-label">
                Swept texture
              </span>
              <div className="cap gallery-caption">
                <span className="serif gallery-caption-title">
                  Texture, in motion.
                </span>
                <span className="lbl text-gold">
                  View
                </span>
              </div>
            </a>
            <a href="https://www.instagram.com/skeeondablock/" className="tile reveal gallery-tile" target="_blank" rel="noreferrer">
              <img className="ph gallery-image" src={texturedTaper} width="960" height="1200" loading="lazy" decoding="async" alt="Left profile showing a textured top, temple fade and short facial hair." />
              <span className="lbl gallery-label">
                Textured taper
              </span>
              <div className="cap gallery-caption">
                <span className="serif gallery-caption-title">
                  Every detail counts.
                </span>
                <span className="lbl text-gold">
                  View
                </span>
              </div>
            </a>
            <a href="https://www.instagram.com/skeeondablock/" className="tile reveal gallery-tile-offset" target="_blank" rel="noreferrer">
              <img className="ph gallery-image" src={curlyTaper} width="960" height="1200" loading="lazy" decoding="async" alt="Right profile showing defined curls and closely tapered sides above a red barber cape." />
              <span className="lbl gallery-label">
                Curly taper
              </span>
              <div className="cap gallery-caption">
                <span className="serif gallery-caption-title">
                  Fresh off the chair.
                </span>
                <span className="lbl text-gold">
                  View
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>
      <section id="reviews" className="reviews-section reviews-layout">
        <div className="reveal section-heading heading-row">
          <div className="heading-stack">
            <span className="lbl">
              03 — Word on the Block
            </span>
            <h2 className="serif section-title">
              Earned, not{' '}
              <span className="text-italic">
                bought
              </span>
              .
            </h2>
          </div>
          <div className="verification-badge">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A96A" strokeWidth="1.5">
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"></path>
              <path d="M8.5 12l2.5 2.5 4.5-5"></path>
            </svg>
            <span className="muted-caption">
              Only verified clients. Every review is approved before it appears.
            </span>
          </div>
        </div>
        <div className="reviews-grid card-grid">
          <figure className="card reveal review-card">
            <div aria-label="5 out of 5" className="review-stars">
              <span>
                ★
              </span>
              <span>
                ★
              </span>
              <span>
                ★
              </span>
              <span>
                ★
              </span>
              <span>
                ★
              </span>
            </div>
            <blockquote className="serif review-quote">
              “[Approved client review — appears here only after it is approved.]”
            </blockquote>
            <figcaption className="card-bottomline">
              <span className="text-caption">
                [Client first name, initial]
              </span>
              <span className="lbl">
                Skin Fade · verified
              </span>
            </figcaption>
          </figure>
          <figure className="card reveal review-card">
            <div aria-label="5 out of 5" className="review-stars">
              <span>
                ★
              </span>
              <span>
                ★
              </span>
              <span>
                ★
              </span>
              <span>
                ★
              </span>
              <span>
                ★
              </span>
            </div>
            <blockquote className="serif review-quote">
              “[Approved client review.]”
            </blockquote>
            <figcaption className="card-bottomline">
              <span className="text-caption">
                [Client first name, initial]
              </span>
              <span className="lbl">
                Block Ritual · verified
              </span>
            </figcaption>
          </figure>
          <figure className="card reveal review-card">
            <div aria-label="5 out of 5" className="review-stars">
              <span>
                ★
              </span>
              <span>
                ★
              </span>
              <span>
                ★
              </span>
              <span>
                ★
              </span>
              <span>
                ★
              </span>
            </div>
            <blockquote className="serif review-quote">
              “[Approved client review.]”
            </blockquote>
            <figcaption className="card-bottomline">
              <span className="text-caption">
                [Client first name, initial]
              </span>
              <span className="lbl">
                Beard Sculpt · verified
              </span>
            </figcaption>
          </figure>
        </div>
        <div className="reveal review-followup">
          <span className="muted-small">
            Been in the chair? Your review link arrives on WhatsApp two hours after your appointment.
          </span>
          <button className="btn btn-ghost button-outline" data-action="account" type="button">
            Leave a review
          </button>
        </div>
      </section>
      <section className="contact-band contact-surface">
        <div className="reveal contact-layout">
          <div className="heading-stack">
            <span className="lbl contact-label">
              Direct line
            </span>
            <h2 className="serif contact-title">
              Not sure what to book?
              <br />
              <span className="text-italic">
                Ask Skee.
              </span>
            </h2>
            <p className="contact-description">
              Send a photo of the cut you want. Skee replies on WhatsApp with the right service and the next free slot — usually within the hour.
            </p>
          </div>
          <div className="contact-actions">
            <button className="btn button-dark" data-action="whatsapp" type="button">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"></path>
                <path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1.2-1.1 2 .9-.4 1.6c-3.9.4-8.4-4.1-8-8l1.6-.4.9 2z"></path>
              </svg>
              Message on WhatsApp
            </button>
            <span className="contact-note">
              {STUDIO_PHONE} · Opens WhatsApp with a ready-written message
            </span>
          </div>
        </div>
      </section>
      <section id="visit" className="visit-section visit-layout">
        <div className="reveal visit-stack">
          <span className="lbl">
            04 — Visit
          </span>
          <h2 className="serif section-title">
            M'Sila,
            <br />
            <span className="text-italic">
              Algeria
            </span>
            .
          </h2>
          <p className="visit-description">
            The Block is a private studio. The exact address and directions are shared with you once your booking is confirmed — and again in your reminder two hours before.
          </p>
          <div className="studio-details">
            <div className="studio-detail">
              <span className="lbl">
                Area
              </span>
              <span className="text-small">
                {STUDIO_AREA}
              </span>
            </div>
            <div className="studio-detail">
              <span className="lbl">
                Hours
              </span>
              <span className="text-small">
                {hoursSummary}
              </span>
            </div>
            <div className="studio-detail">
              <span className="lbl">
                WhatsApp
              </span>
              <span className="text-small">
                {STUDIO_PHONE}
              </span>
            </div>
            <div className="studio-detail">
              <span className="lbl">
                Friday
              </span>
              <span className="text-small">
                {friday.open ? `${friday.start}–${friday.end}` : 'Closed'}
              </span>
            </div>
          </div>
          <details className="weekly-hours"><summary>Weekly working hours</summary><dl>{settings.hours.map(day => <div key={day.weekday}><dt>{day.day}</dt><dd>{day.open ? `${day.start}–${day.end}${day.breakStart && day.breakEnd ? ` · break ${day.breakStart}–${day.breakEnd}` : ''}` : 'Closed'}</dd></div>)}</dl></details>
        </div>
        <div className="reveal locked-map map-frame">
          <div aria-hidden="true" className="map-blur">
            <div className="map-road-east"></div>
            <div className="map-road-south"></div>
            <div className="map-road-north"></div>
            <div className="map-road-west"></div>
            <div className="map-block-one"></div>
            <div className="map-block-two"></div>
            <div className="map-block-three"></div>
          </div>
          <div className="map-overlay">
            <div className="map-lock">
              <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A96A" strokeWidth="1.5">
                <rect x="5" y="11" width="14" height="10" rx="1"></rect>
                <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
              </svg>
            </div>
            <span className="serif map-title">
              Location unlocks on confirmation.
            </span>
            <span className="map-description">
              Pin, directions and parking notes appear in your booking — not on the public site.
            </span>
            <button className="btn btn-bone button-unlock" data-action="booking" type="button">
              Book to unlock
            </button>
          </div>
        </div>
      </section>
      </main>
      <footer className="site-footer footer-rule">
        <div className="footer-layout">
          <div className="heading-row">
            <img src={logo} alt="SKEE" className="footer-mark" />
            <nav className="nav footer-links">
              <button data-action="booking" type="button">
                Book
              </button>
              <button data-action="account" type="button">
                My account
              </button>
              <a href="https://www.instagram.com/skeeondablock/" target="_blank" rel="noreferrer">
                Instagram
              </a>
              <button data-action="whatsapp" type="button">
                WhatsApp
              </button>
            </nav>
          </div>
          <div className="lbl footer-bottom">
            <a href="#admin">Studio admin</a>
            <a href="#privacy">Privacy</a>
            <span>
              © Skee Block · M'Sila, Algeria
            </span>
            <span>
              By appointment only
            </span>
          </div>
        </div>
      </footer>
      <button className="wa floating-whatsapp whatsapp-pill" aria-label="Chat with Skee on WhatsApp" data-action="whatsapp" type="button">
        <span className="pulse status-dot"></span>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A96A" strokeWidth="1.5">
          <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"></path>
          <path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1.2-1.1 2 .9-.4 1.6c-3.9.4-8.4-4.1-8-8l1.6-.4.9 2z"></path>
        </svg>
        WhatsApp Skee

      </button>
    <div className="mobile-booking-bar"><button className="mobile-book" data-action="booking">Book the chair <span aria-hidden="true">→</span></button><button className="mobile-chat" data-action="whatsapp" aria-label="WhatsApp Skee"><ChatIcon /></button></div>
      {isAccount && <AccountPage client={client} settings={settings} onClose={() => { window.location.hash = 'top' }} onBook={serviceId => setBookingRequest({ serviceId })} onSignIn={openAccount} />}
      <dialog ref={bookingDialogRef} className="booking-dialog" aria-labelledby="booking-title" onClose={() => setBookingRequest(null)}>
        {bookingRequest && <BookingFlow settings={settings} initialServiceId={bookingRequest.serviceId} client={client} onSignIn={openAccount} onOpenAccount={() => { bookingDialogRef.current.close(); window.location.hash = 'account' }} onClose={() => bookingDialogRef.current.close()} />}
      </dialog>
      <dialog ref={dialogRef} aria-labelledby="dialog-title" className="action-dialog" onClick={event => { if (event.target === event.currentTarget) dialogRef.current.close() }}>
        <button className="dialog-close" aria-label="Close" onClick={() => dialogRef.current.close()}>×</button>
        <span className="lbl">Skee Block · By appointment</span>
        {action === 'account' && client.available
          ? <ClientAccount client={client} onLater={() => dialogRef.current.close()} />
          : <>
            <h2 id="dialog-title" className="serif">{action === 'account' ? 'Your place at the Block.' : 'Talk to Skee.'}</h2>
            <p>{action === 'account' ? 'Client accounts are coming soon. Contact Skee for help with your appointment or review.' : 'Contact Skee on WhatsApp to arrange your visit, or reach him on Instagram.'}</p>
          </>}
        <a href="https://www.instagram.com/skeeondablock/" target="_blank" rel="noreferrer" className={`dialog-contact${action === 'account' && client.available ? ' dialog-contact-quiet' : ''}`}>Message Skee on Instagram ↗</a>
      </dialog>
    </div>
    </div>
  )
}

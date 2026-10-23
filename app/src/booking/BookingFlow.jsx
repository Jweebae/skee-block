import { useEffect, useRef, useState } from 'react'
import logo from '../assets/skee-logo-white.svg'
import { BASE_CUT_PRICE, formatPrice, getPreviewDates } from './catalog'
import './BookingFlow.css'
import { previewSlots } from '../settings/studioSettings'

const STEPS = ['Service', 'Add-ons', 'Date & time', 'Review']
const TITLES = [<>Choose your <em>service</em>.</>, <>Refine the <em>ritual</em>.</>, <>Pick your <em>hour</em>.</>, <>Review & <em>confirm</em>.</>]

function LockIcon() {
  return <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="11" width="14" height="10" rx="1" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
}

function Check() {
  return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5 9-10" /></svg>
}

export default function BookingFlow({ settings, initialServiceId, onClose }) {
  const services = settings.services.filter(item => item.visible)
  const availableAddons = settings.addons.filter(item => item.visible).map(item => ({ ...item, types: item.types.filter(type => type.visible) })).filter(item => item.types.length)
  const [preferences, setPreferences] = useState([])
  const [step, setStep] = useState(0)
  const [serviceId, setServiceId] = useState(initialServiceId || '')
  const [addonChoices, setAddonChoices] = useState({})
  const [dateId, setDateId] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [channel, setChannel] = useState('WhatsApp')
  const [previewDone, setPreviewDone] = useState(false)
  const [dates] = useState(getPreviewDates)
  const headingRef = useRef(null)
  const scrollRef = useRef(null)
  const service = services.find(item => item.id === serviceId)
  const selectedAddons = availableAddons.filter(item => Object.hasOwn(addonChoices, item.id))
  const addons = selectedAddons.flatMap(item => {
    const type = item.types.find(option => option.id === addonChoices[item.id])
    return type ? [{ id: item.id, name: item.name, typeName: type.name, price: type.price, duration: type.duration }] : []
  })
  const needsType = selectedAddons.length !== addons.length
  const date = dates.find(item => item.id === dateId)
  const total = service ? BASE_CUT_PRICE + addons.reduce((sum, item) => sum + item.price, 0) : 0
  const duration = (service?.duration || 0) + addons.reduce((sum, item) => sum + item.duration, 0)
  const times = previewSlots(settings.hours, dateId, duration)
  const bookableDates = dates.map(item => ({ ...item, closed: previewSlots(settings.hours, item.id, duration).length === 0 }))
  const canContinue = Boolean(service) && (step === 0 || !needsType) && (step < 2 || Boolean(date && times.includes(time)))
  const when = date ? `${date.label}${time ? ` · ${time}` : ' · choose a time'}` : 'Date & time not chosen yet'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
    const frame = requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(frame)
  }, [step, previewDone])

  function resetSchedule() {
    setDateId('')
    setTime('')
  }

  function selectService(id) {
    if (id !== serviceId) { resetSchedule(); setPreferences([]) }
    setServiceId(id)
  }

  function toggleAddon(id) {
    setAddonChoices(current => {
      const next = { ...current }
      if (Object.hasOwn(next, id)) delete next[id]
      else next[id] = ''
      return next
    })
    resetSchedule()
  }

  function chooseType(addonId, typeId) {
    setAddonChoices(current => ({ ...current, [addonId]: typeId }))
    resetSchedule()
  }

  function continueBooking() {
    if (!canContinue) return
    if (step < 3) setStep(current => current + 1)
    else setPreviewDone(true)
  }

  function restart() {
    setStep(0)
    setServiceId('')
    setPreferences([])
    setAddonChoices({})
    resetSchedule()
    setNotes('')
    setChannel('WhatsApp')
    setPreviewDone(false)
  }

  return (
    <div className="booking-screen" ref={scrollRef}>
      <header className="booking-header">
        <div className="booking-header-inner">
          <button className="booking-brand" onClick={onClose} aria-label="Back to Skee Block home"><img src={logo} alt="SKEE" /><span /><span>Book the chair</span></button>
          {!previewDone && <nav aria-label="Booking progress"><ol className="booking-steps">{STEPS.map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined}><button disabled={index > step} onClick={() => setStep(index)}><span className="booking-step-number">{index < step ? <Check /> : index + 1}</span><span className="booking-step-label">{label}</span></button></li>)}</ol></nav>}
          <button className="booking-close" onClick={onClose} aria-label="Close booking">×</button>
        </div>
        <div className="booking-progress" aria-hidden="true"><span style={{ width: `${previewDone ? 100 : (step + 1) * 25}%` }} /></div>
      </header>

      <p className="booking-preview-banner"><span className="lbl">Design preview</span> Sample times and add-on prices. No reservation or message will be sent.</p>

      <div className="booking-layout">
        <div className="booking-main">
          {previewDone ? <section className="booking-complete" aria-labelledby="booking-title">
            <span className="booking-complete-mark"><Check /></span>
            <span className="lbl">Preview complete · No appointment has been approved yet</span>
            <h1 id="booking-title" className="serif" ref={headingRef} tabIndex={-1}>Your visit, <em>considered</em>.</h1>
            <p>Your appointment is under review by Skee.<br />mwalf yripondi fi 10 minutes maximum</p>
            <div className="booking-lock"><span aria-hidden="true"><LockIcon /></span><div><h2 className="serif">Location stays private.</h2><p>Directions unlock only after a real appointment is confirmed.</p></div></div>
            <a className="booking-primary" href="https://www.instagram.com/skeeondablock/" target="_blank" rel="noreferrer">Arrange a visit with Skee ↗</a>
            <div className="booking-complete-actions"><button className="booking-secondary" onClick={() => setPreviewDone(false)}>Edit selections</button><button className="booking-secondary" onClick={restart}>Start again</button></div>
          </section> : <>
            <div className="booking-heading"><span className="lbl">Step {step + 1} of 4{step === 1 ? ' · optional' : ''}</span><h1 id="booking-title" className="serif" ref={headingRef} tabIndex={-1}>{TITLES[step]}</h1></div>

            {step === 0 && !services.length && <p className="booking-hint">The menu is being updated. Please contact Skee to arrange a visit.</p>}
            {step === 0 && <fieldset className="booking-fieldset"><legend className="booking-sr-only">Choose one service</legend><div className="booking-service-grid">{services.map(item => <label key={item.id} className={`booking-service ${serviceId === item.id ? 'is-selected' : ''}`}>
              <input type="radio" name="service" value={item.id} checked={serviceId === item.id} onChange={() => selectService(item.id)} />
              {serviceId === item.id && <span className="booking-selected-mark"><Check /></span>}
              <span className="lbl">{item.duration} min</span><span className="serif booking-service-title">{item.name}</span><span className="booking-option-description">{item.description}</span><span className="booking-option-price">{formatPrice(BASE_CUT_PRICE)}</span>
            </label>)}</div><p className="booking-hint">Every base cut is 800 DA. Only the extras you choose increase the bill. Menu details are samples for this preview.</p></fieldset>}

            {step === 1 && <fieldset className="booking-fieldset"><legend className="booking-sr-only">Optional add-ons</legend>
              <p className="booking-hint">Choose an add-on, then one of its types below. Each type has its own price and extra time. All details are editable samples for now.</p>
              {!availableAddons.length && <p className="booking-hint">No extras are listed at the moment. Continue with your base cut.</p>}
              <div className="booking-addons">{availableAddons.map(item => {
                const selected = Object.hasOwn(addonChoices, item.id)
                const chosenType = item.types.find(type => type.id === addonChoices[item.id])
                const startingPrice = Math.min(...item.types.map(type => type.price))
                return <div className="booking-addon-group" key={item.id}>
                  <label className={`booking-addon ${selected ? 'is-selected' : ''}`}>
                    <input type="checkbox" checked={selected} aria-controls={`types-${item.id}`} aria-expanded={selected} onChange={() => toggleAddon(item.id)} />
                    <span className="booking-checkbox" aria-hidden="true">{selected && <Check />}</span>
                    <span className="booking-addon-copy"><span>{item.name}</span><span className="booking-option-description">{item.description}</span></span>
                    <span className="booking-addon-price">{chosenType ? '+' : 'From'} {formatPrice(chosenType?.price ?? startingPrice)}<small>{chosenType ? `+${chosenType.duration} min` : `${item.types.length} ${item.types.length === 1 ? 'type' : 'types'}`}</small></span>
                  </label>
                  {selected && <fieldset id={`types-${item.id}`} className="booking-addon-types booking-fieldset"><legend>Choose a type · {item.name}</legend>
                    {item.types.map(type => <label key={type.id} className={`booking-addon-type ${chosenType?.id === type.id ? 'is-selected' : ''}`}>
                      <input type="radio" name={`type-${item.id}`} value={type.id} checked={chosenType?.id === type.id} onChange={() => chooseType(item.id, type.id)} />
                      <span className="booking-addon-copy"><span>{type.name}</span><span className="booking-option-description">{type.description}</span></span>
                      <span className="booking-addon-price">+ {formatPrice(type.price)}<small>+{type.duration} min</small></span>
                    </label>)}
                    {!chosenType && <p className="booking-hint">Choose one type to continue, or uncheck this add-on.</p>}
                  </fieldset>}
                </div>
              })}</div>
            </fieldset>}

            {step === 2 && <div className="booking-date-step"><p className="booking-hint">Sample times follow the studio’s saved working hours and your full service duration. Existing appointments are not connected yet. All times are in M’Sila (UTC+1).</p><fieldset className="booking-fieldset"><legend className="lbl">Choose a date · next two weeks</legend><div className="booking-date-rail">{bookableDates.map(item => <label key={item.id} className={`booking-date ${item.closed ? 'is-closed' : ''} ${dateId === item.id ? 'is-selected' : ''}`}><input type="radio" name="date" value={item.id} disabled={item.closed} checked={dateId === item.id} onChange={() => { setDateId(item.id); setTime('') }} /><span>{item.weekday}</span><span className="serif">{item.day}</span><span>{item.closed ? 'No times' : item.month}</span></label>)}</div></fieldset>
              {bookableDates.every(item => item.closed) && <p className="booking-hint">No times fit this selection in the next two weeks. Try fewer extras or contact Skee.</p>}
              {!date && <p className="booking-hint">Select a date to see sample times.</p>}
              {date && <fieldset className="booking-fieldset"><legend className="lbl">Sample times · {date.label}</legend>{['Morning', 'Afternoon'].map((period, index) => <div className="booking-time-group" key={period}><h2 className="lbl">{period}</h2>{!times.some(t => index === 0 ? t < '14:00' : t >= '14:00') && <p className="booking-hint">No times in this part of the day.</p>}<div className="booking-time-grid">{times.filter(t => index === 0 ? t < '14:00' : t >= '14:00').map(t => <label key={t} className={`booking-time ${time === t ? 'is-selected' : ''}`}><input type="radio" name="time" value={t} checked={time === t} onChange={() => setTime(t)} /><span>{t}</span></label>)}</div></div>)}</fieldset>}
            </div>}

            {step === 3 && <div className="booking-review">
              <div className="booking-review-card"><span className="lbl">Your visit with Skee</span><h2 className="serif">{service.name}</h2><p>{when} · {duration} min</p><button className="booking-text-button" onClick={() => setStep(2)}>Change date & time</button></div>
              {service.preferences.length > 0 && <fieldset className="booking-fieldset"><legend className="lbl">Cut preferences · optional</legend><div className="booking-preferences">{service.preferences.map(option => <label key={option} className="booking-preference"><input type="checkbox" checked={preferences.includes(option)} onChange={() => setPreferences(current => current.includes(option) ? current.filter(item => item !== option) : [...current, option])} />{option}</label>)}</div><p className="booking-hint">These preferences are included in your base cut.</p></fieldset>}
              <label className="booking-notes">Notes for Skee <span className="booking-hint">Optional · your preferred length, finish or anything Skee should know.</span><textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={1000} rows={4} placeholder="Low fade, keep the top longer…" /><span className="booking-hint">{notes.length}/1000</span></label>
              <fieldset className="booking-fieldset"><legend className="lbl">Preferred reminder channel</legend><div className="booking-channels">{['WhatsApp', 'Email'].map(item => <label className={`booking-channel ${channel === item ? 'is-selected' : ''}`} key={item}><input type="radio" name="channel" checked={channel === item} onChange={() => setChannel(item)} />{item}</label>)}</div><p className="booking-hint">Preference preview only. Reminders will include the start of appointment day; delivery and the remaining schedule are not active yet.</p></fieldset>
              <div className="booking-lock"><span aria-hidden="true"><LockIcon /></span><div><h2 className="serif">Location hidden</h2><p>Revealed after a real booking is confirmed.</p></div></div>
            </div>}

            <div className="booking-controls"><button className="booking-secondary" onClick={() => step === 0 ? onClose() : setStep(current => current - 1)}>{step === 0 ? 'Back to home' : 'Back'}</button><span className="booking-mobile-total"><span className="lbl">{addons.length ? 'Preview total' : 'Base cut'}{service ? ` · ${duration} min` : ''}</span><strong>{service ? formatPrice(total) : 'Choose a cut'}</strong></span><button className="booking-primary" disabled={!canContinue} onClick={continueBooking}>{step === 3 ? 'Finish preview' : step === 1 && !selectedAddons.length ? 'Skip add-ons' : 'Continue'}<span aria-hidden="true">→</span></button></div>
          </>}
        </div>

        <aside className="booking-summary" aria-label="Booking summary">
          <div className="booking-summary-header"><span className="lbl">Your booking</span><span className="lbl">with Skee</span></div>
          <h2 className="serif">{service?.name || 'Your chair awaits.'}</h2><p className="booking-summary-when">{when}</p>
          {service && <><dl className="booking-price-lines"><div><dt>{service.name}</dt><dd>{formatPrice(BASE_CUT_PRICE)}</dd></div>{addons.map(item => <div key={item.id}><dt>+ {item.name}<small>{item.typeName} · +{item.duration} min</small></dt><dd>{formatPrice(item.price)}</dd></div>)}</dl>
          <div className="booking-total" aria-live="polite" aria-atomic="true"><span className="lbl">{addons.length ? 'Preview total' : 'Total'} · {duration} min</span><strong className="serif">{formatPrice(total)}</strong></div></>}
          {needsType && <p className="booking-hint booking-type-pending" role="status">Choose a type for each selected add-on to complete your total.</p>}
          <p className="booking-hint">800 DA per base cut. Only optional add-ons increase the total. Add-on prices and service durations are samples, pending Skee’s setup.</p>
          <p className="booking-hint">No payment, reservation or message is made in this preview.</p>
          {previewDone && <div className="booking-summary-preferences"><span className="lbl">Preferences</span><p>{channel} reminders</p>{preferences.length > 0 && <p>{preferences.join(' · ')}</p>}{notes && <p className="booking-saved-notes">{notes}</p>}</div>}
        </aside>
      </div>
    </div>
  )
}

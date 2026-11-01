import { useRef, useState } from 'react'
import { DAY_MINUTES, MAX_BREAKS, dayBreaks, hoursText, isAllDay, minutesToClock, timeInMinutes } from '../settings/studioSettings'

// One day as a bar from 00:00 to 24:00. The two ends drag like a volume slider, and tapping the bar cuts in a break,
// which can then be moved or stretched, like a split on a timeline. Everything also works from the keyboard.
const STEP = 15
const NEW_BREAK = 30
const TICKS = [0, 6, 12, 18, 24]
const snap = value => Math.round(value / STEP) * STEP
const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const at = minute => `${(minute / DAY_MINUTES) * 100}%`
// A 30-minute break is only a few pixels wide, so it keeps a minimum width to grab, and its edge handles sit just outside
// that width. The middle always moves the break and the edges always stretch it, however short it is.
const BREAK_GRAB = 14
const middle = pause => at((pause.start + pause.end) / 2)

function toParts(day) {
  return { start: timeInMinutes(day.start), end: timeInMinutes(day.end), breaks: dayBreaks(day).map(pause => ({ start: timeInMinutes(pause.start), end: timeInMinutes(pause.end) })) }
}
const toDay = parts => ({ start: minutesToClock(parts.start), end: minutesToClock(parts.end), breaks: parts.breaks.map(pause => ({ start: minutesToClock(pause.start), end: minutesToClock(pause.end) })) })

// How far each handle may go without crossing its neighbours.
function limits(parts, { kind, index }) {
  const { start, end, breaks } = parts
  if (kind === 'start') return [0, breaks[0]?.start ?? end - STEP]
  if (kind === 'end') return [breaks.at(-1)?.end ?? start + STEP, DAY_MINUTES]
  if (kind === 'breakStart') return [index ? breaks[index - 1].end : start, breaks[index].end - STEP]
  return [breaks[index].start + STEP, breaks[index + 1]?.start ?? end]
}

function moved(parts, target, value) {
  const [min, max] = limits(parts, target)
  const next = clamp(value, min, max)
  if (target.kind === 'start') return { ...parts, start: next }
  if (target.kind === 'end') return { ...parts, end: next }
  return { ...parts, breaks: parts.breaks.map((pause, index) => (index === target.index ? { ...pause, [target.kind === 'breakStart' ? 'start' : 'end']: next } : pause)) }
}

function slid(parts, index, start) {
  const pause = parts.breaks[index], width = pause.end - pause.start
  const min = index ? parts.breaks[index - 1].end : parts.start
  const max = (parts.breaks[index + 1]?.start ?? parts.end) - width
  const next = clamp(start, min, max)
  return { ...parts, breaks: parts.breaks.map((item, position) => (position === index ? { start: next, end: next + width } : item)) }
}

function freeStretches(parts) {
  const stretches = []
  let from = parts.start
  for (const pause of parts.breaks) { stretches.push([from, pause.start]); from = pause.end }
  stretches.push([from, parts.end])
  return stretches.filter(([a, b]) => b - a >= STEP)
}

function Handle({ label, minute, target, parts, onMove, onGrab, className = '', left = at(minute) }) {
  const [min, max] = limits(parts, target)
  function press(event) {
    const step = { ArrowLeft: -STEP, ArrowDown: -STEP, ArrowRight: STEP, ArrowUp: STEP, PageDown: -60, PageUp: 60 }[event.key]
    if (step) { event.preventDefault(); onMove(moved(parts, target, minute + step)) }
    if (event.key === 'Home') { event.preventDefault(); onMove(moved(parts, target, min)) }
    if (event.key === 'End') { event.preventDefault(); onMove(moved(parts, target, max)) }
  }
  return <span role="slider" tabIndex={0} className={`hours-handle ${className}`} style={{ left }} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={minute} aria-valuetext={minutesToClock(minute)} onKeyDown={press} onPointerDown={event => onGrab(event, target)} />
}

export default function HoursTimeline({ day, onChange, onCopy }) {
  const track = useRef(null)
  const drag = useRef(null)
  const [active, setActive] = useState(false)
  const parts = toParts(day)
  const emit = next => onChange(toDay(next))
  const minuteAt = event => {
    const box = track.current.getBoundingClientRect()
    return snap(((event.clientX - box.left) / box.width) * DAY_MINUTES)
  }
  function grab(event, target) {
    event.preventDefault()
    event.stopPropagation()
    track.current.setPointerCapture(event.pointerId)
    drag.current = { ...target, offset: target.kind === 'break' ? minuteAt(event) - parts.breaks[target.index].start : 0 }
    setActive(true)
  }
  function follow(event) {
    const target = drag.current
    if (!target) return
    emit(target.kind === 'break' ? slid(parts, target.index, minuteAt(event) - target.offset) : moved(parts, target, minuteAt(event)))
  }
  function release() {
    drag.current = null
    setActive(false)
  }
  function addBreak(center) {
    const stretches = freeStretches(parts)
    if (parts.breaks.length >= MAX_BREAKS || !stretches.length) return
    const widest = stretches.reduce((best, item) => (item[1] - item[0] > best[1] - best[0] ? item : best))
    const [from, to] = stretches.find(([a, b]) => center >= a && center <= b) ?? widest
    const width = Math.min(NEW_BREAK, to - from)
    const begin = clamp(snap((center ?? (from + to) / 2) - width / 2), from, to - width)
    emit({ ...parts, breaks: [...parts.breaks, { start: begin, end: begin + width }].sort((a, b) => a.start - b.start) })
  }
  const removeBreak = index => emit({ ...parts, breaks: parts.breaks.filter((_, position) => position !== index) })
  const allDay = isAllDay(day)
  const openMinutes = parts.end - parts.start - parts.breaks.reduce((sum, pause) => sum + pause.end - pause.start, 0)
  const hours = Math.round((openMinutes / 60) * 100) / 100

  return <section className="admin-editor-card admin-day-card hours-day" aria-label={`${day.day} working hours`} data-open={day.open}>
    <div className="admin-card-heading"><h2 className="serif">{day.day}</h2><div className="hours-day-tools">
      {day.open && <span className="hours-summary">{hoursText(day)} · {hours} h</span>}
      <label className="admin-toggle"><input type="checkbox" aria-label={`${day.day} open`} checked={day.open} onChange={event => onChange({ open: event.target.checked })} />{day.open ? 'Open' : 'Closed'}</label>
    </div></div>
    {day.open ? <>
      <div className="hours-track" ref={track} data-dragging={active} onPointerMove={follow} onPointerUp={release} onPointerCancel={release}>
        <span className="hours-rail" aria-hidden="true" />
        <button type="button" className="hours-open" tabIndex={-1} aria-hidden="true" style={{ left: at(parts.start), right: `calc(100% - ${at(parts.end)})` }} onClick={event => addBreak(minuteAt(event))} />
        {parts.breaks.map((pause, index) => <span key={index} className="hours-break" role="presentation" style={{ left: middle(pause), width: `max(${at(pause.end - pause.start)}, ${BREAK_GRAB}px)` }} onPointerDown={event => grab(event, { kind: 'break', index })} />)}
        {parts.breaks.flatMap((pause, index) => [
          <Handle key={`${index}-from`} className="hours-handle-break hours-handle-from" label={`${day.day} break ${index + 1} starts`} minute={pause.start} left={`min(${at(pause.start)}, calc(${middle(pause)} - ${BREAK_GRAB / 2}px))`} target={{ kind: 'breakStart', index }} parts={parts} onMove={emit} onGrab={grab} />,
          <Handle key={`${index}-to`} className="hours-handle-break" label={`${day.day} break ${index + 1} ends`} minute={pause.end} left={`max(${at(pause.end)}, calc(${middle(pause)} + ${BREAK_GRAB / 2}px))`} target={{ kind: 'breakEnd', index }} parts={parts} onMove={emit} onGrab={grab} />,
        ])}
        <Handle label={`${day.day} opens`} minute={parts.start} target={{ kind: 'start' }} parts={parts} onMove={emit} onGrab={grab} />
        <Handle label={`${day.day} closes`} minute={parts.end} target={{ kind: 'end' }} parts={parts} onMove={emit} onGrab={grab} />
      </div>
      <div className="hours-ticks" aria-hidden="true">{TICKS.map(hour => <span key={hour} style={{ left: at(hour * 60) }}>{String(hour).padStart(2, '0')}</span>)}</div>
      <div className="hours-actions">
        {parts.breaks.map((pause, index) => <span key={`${pause.start}-${index}`} className="hours-chip">Break {minutesToClock(pause.start)}–{minutesToClock(pause.end)}<button type="button" aria-label={`Remove break ${minutesToClock(pause.start)} to ${minutesToClock(pause.end)}`} onClick={() => removeBreak(index)}>×</button></span>)}
        <button type="button" className="admin-outline" disabled={parts.breaks.length >= MAX_BREAKS || !freeStretches(parts).length} onClick={() => addBreak()}>+ Add a break</button>
        <button type="button" className="admin-outline" aria-pressed={allDay} onClick={() => onChange(allDay ? { start: '10:00', end: '20:00', breaks: [] } : { start: '00:00', end: '24:00', breaks: [] })}>{allDay ? 'Back to normal hours' : '24 hours'}</button>
        <button type="button" className="admin-outline" onClick={onCopy}>Copy to every day</button>
      </div>
    </> : <p className="hours-closed">Closed all day. Clients cannot book.</p>}
  </section>
}

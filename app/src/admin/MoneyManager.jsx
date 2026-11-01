import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { callBookings, dayLabel } from '../lib/bookingsApi'
import { formatPrice } from '../booking/catalog'
import useStudioBook from './useStudioBook'
import CloseVisit from './CloseVisit'
import MoneyChart from './MoneyChart'
import { dayOf, inPeriod, moneyByPeriod, moneyCsv, moneyLines, moneyOnHand, moneyTotals, periodPresets, spendingByCategory, withRepayments } from './studioBook'
import './StudioBook.css'

// The owner's own book: everything that comes in from cuts, everything typed by hand, and what is left. It covers his
// whole financial life, so each entry is tagged business or personal. Private to owners.
const FORMS = {
  expense: { tab: 'I spent', amount: 'How much · DA', note: 'Where did it go?', placeholder: 'Clippers from the shop in town', button: 'Save spending' },
  withdrawal: { tab: 'I took out', amount: 'Taken from your savings · DA', note: 'What for?', placeholder: 'Took some for the family', button: 'Take it out' },
  income: { tab: 'Money came in', amount: 'How much · DA', note: 'Where from?', placeholder: 'Sold an old chair', button: 'Save money in' },
  opening: { tab: 'Starting money', amount: 'What you have today · DA', note: 'Note', placeholder: 'Cash and savings when I started this book', button: 'Set starting money' },
}
const KIND_LABELS = { income: 'Money in', expense: 'Spent', withdrawal: 'Taken out', opening: 'Starting money' }
const CATEGORIES = ['Products', 'Equipment', 'Rent', 'Bills', 'Transport', 'Food', 'Family', 'Health', 'Clothes', 'Savings', 'Other']
const UNIT_LABELS = [['day', 'Daily'], ['month', 'Monthly'], ['year', 'Yearly']]

const dayText = value => dayLabel(`${value}T12:00:00Z`, { day: 'numeric', month: 'short', year: 'numeric' })
function keyLabel(key) {
  if (key.length === 10) return dayLabel(`${key}T12:00:00Z`, { day: 'numeric', month: 'short' })
  if (key.length === 7) return dayLabel(`${key}-15T12:00:00Z`, { month: 'short', year: 'numeric' })
  return key
}
const signed = line => (['income', 'opening'].includes(line.kind) ? `+ ${formatPrice(line.amount)}` : `− ${formatPrice(line.amount)}`)

function EntryForm({ today, entry, onSaved, onCancel }) {
  const [kind, setKind] = useState(entry?.kind || 'expense')
  const [fields, setFields] = useState(() => ({ amount: entry ? String(entry.amount) : '', date: entry?.entry_date || today, scope: entry?.scope || 'business', category: entry?.category || '', note: entry?.note || '' }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = key => event => setFields(current => ({ ...current, [key]: event.target.value }))
  const form = FORMS[kind]
  async function submit(event) {
    event.preventDefault()
    setBusy(true); setError('')
    const row = { kind, amount: Number(fields.amount), entry_date: fields.date, scope: fields.scope, category: kind === 'expense' ? fields.category : '', note: fields.note, updated_at: new Date().toISOString() }
    const { error: problem } = entry ? await supabase.from('money_entries').update(row).eq('id', entry.id) : await supabase.from('money_entries').insert(row)
    setBusy(false)
    if (problem) { setError('This could not be saved. Check the amount and try again.'); return }
    if (!entry) setFields(current => ({ ...current, amount: '', note: '' }))
    onSaved(`${KIND_LABELS[kind]}: ${formatPrice(Number(fields.amount))} saved.`)
  }
  return <form className="admin-editor-card book-form money-form" onSubmit={submit} aria-label="Add to your money book">
    {!entry && <div className="book-tabs" role="group" aria-label="What happened?">{Object.entries(FORMS).map(([id, item]) => <button key={id} type="button" aria-pressed={kind === id} onClick={() => setKind(id)}>{item.tab}</button>)}</div>}
    <div className="book-form-grid">
      <label>{form.amount}<input type="number" inputMode="numeric" min="1" max="1000000000" required value={fields.amount} onChange={set('amount')} /></label>
      <label>Date<input type="date" required value={fields.date} onChange={set('date')} /></label>
      <label>This is for<select value={fields.scope} onChange={set('scope')}><option value="business">The business</option><option value="personal">My personal life</option></select></label>
      {kind === 'expense' && <label>Category<input list="money-categories" maxLength={60} value={fields.category} placeholder="Products" onChange={set('category')} /><datalist id="money-categories">{CATEGORIES.map(item => <option key={item} value={item} />)}</datalist></label>}
    </div>
    <label>{form.note}<input maxLength={300} value={fields.note} placeholder={form.placeholder} onChange={set('note')} /></label>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <div className="admin-card-actions">{entry && <button type="button" className="admin-outline" onClick={onCancel}>Keep it</button>}<button type="submit" className="admin-save" disabled={busy}>{busy ? 'Saving…' : form.button}</button></div>
  </form>
}

function Line({ line, today, debts, onChanged }) {
  const [mode, setMode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function saveVisit(values) {
    setBusy(true); setError('')
    try { await callBookings('owner_close', { id: line.booking.id, ...values }); setMode(''); onChanged(values.free ? 'Marked as a free cut. It no longer counts in what you earned.' : 'Payment saved.') }
    catch (problem) { setError(problem.message) } finally { setBusy(false) }
  }
  async function remove() {
    const { error: problem } = await supabase.from('money_entries').delete().eq('id', line.entry.id)
    if (problem) setError('This could not be removed. Try again.')
    else onChanged('Removed from your book.')
  }
  const debt = line.source === 'visit' ? debts.find(row => row.booking_id === line.booking.id) : null
  const locked = line.source === 'entry' && line.entry.debt_id
  return <li className="money-line" data-kind={line.kind}>
    <div className="money-line-main">
      <span className="money-date">{dayText(line.date)}</span>
      <span className="money-what"><b>{line.free ? 'Free cut' : line.source === 'visit' ? 'Cut' : line.category || KIND_LABELS[line.kind]}</b><small>{[line.note, line.scope === 'personal' ? 'Personal' : ''].filter(Boolean).join(' · ') || KIND_LABELS[line.kind]}</small></span>
      <span className="money-amount">{line.free ? '0 DA' : signed(line)}</span>
      <span className="money-tools">
        {line.source === 'visit' && !mode && <button type="button" className="admin-outline" onClick={() => setMode('visit')}>Change</button>}
        {line.source === 'entry' && !mode && !locked && <button type="button" className="admin-outline" onClick={() => setMode('edit')}>Edit</button>}
        {line.source === 'entry' && !mode && <button type="button" className="admin-outline admin-delete" onClick={() => setMode('delete')}>Delete</button>}
        {mode === 'delete' && <><button type="button" className="admin-outline admin-delete" onClick={remove}>Yes, delete</button><button type="button" className="admin-outline" onClick={() => setMode('')}>Keep it</button></>}
      </span>
    </div>
    {mode === 'visit' && <CloseVisit booking={line.booking} payment={line.payment} debt={debt} busy={busy} onSave={saveVisit} onCancel={() => setMode('')} />}
    {mode === 'edit' && <EntryForm today={today} entry={line.entry} onSaved={text => { setMode(''); onChanged(text) }} onCancel={() => setMode('')} />}
    {error && <p className="admin-error" role="alert">{error}</p>}
  </li>
}

function download(lines, from, to) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([`\ufeff${moneyCsv(lines)}`], { type: 'text/csv;charset=utf-8' }))
  link.download = `3kee-money-${from || 'start'}-to-${to || 'today'}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

const LEDGER_STEP = 50

export default function MoneyManager({ headingRef }) {
  const book = useStudioBook()
  const [preset, setPreset] = useState('month')
  const [custom, setCustom] = useState({ from: '', to: '' })
  const [scope, setScope] = useState('all')
  const [unit, setUnit] = useState('')
  const [kind, setKind] = useState('all')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(LEDGER_STEP)
  const [message, setMessage] = useState('')
  const data = book.data
  const today = data ? dayOf(data.now) : ''
  const presets = data ? periodPresets(today) : {}
  const range = preset === 'custom' ? { ...custom, unit: 'day' } : presets[preset] || { from: '', to: '', unit: 'day' }
  const lines = useMemo(() => (data ? moneyLines(data) : []), [data])
  const debts = useMemo(() => (data ? withRepayments(data.debts, data.entries) : []), [data])
  const period = inPeriod(lines, { from: range.from, to: range.to, scope })
  const groupBy = unit || range.unit
  const buckets = moneyByPeriod(period.filter(line => line.kind !== 'opening'), groupBy, { from: range.from, to: range.to })
  const totals = moneyTotals(period)
  const categories = spendingByCategory(period)
  const owed = debts.reduce((total, debt) => total + debt.left, 0)
  const needle = query.trim().toLowerCase()
  const shown = period.filter(line => (kind === 'all' || line.kind === kind) && (!needle || `${line.note} ${line.category}`.toLowerCase().includes(needle)))
  const changed = text => { setMessage(text); book.reload() }
  const topCategory = categories[0]?.amount || 1

  return <>
    <div className="admin-title-row"><div><span className="lbl">Skee Block · Private</span><h1 className="serif" ref={headingRef} tabIndex={-1}>Money</h1><p>Your whole financial picture. Every cut you close lands here by itself. Type what you spend and what you take out, and the money left updates at once.</p></div></div>
    {book.error && <p className="admin-error" role="alert">{book.error}</p>}{message && <p className="admin-message" role="status">{message}</p>}
    {!data ? !book.error && <p className="admin-empty">Loading your money…</p> : <>
      <section className="money-hero" aria-label="Money you have now"><div><span className="lbl">Money you have now</span><strong className="serif">{formatPrice(moneyOnHand(lines))}</strong><p>Everything that came in, less everything spent or taken out. It does not change with the filters below.</p></div><dl><div><dt>Owed to you</dt><dd>{formatPrice(owed)}</dd></div></dl></section>
      <EntryForm today={today} onSaved={changed} />

      <div className="money-filters">
        <div className="book-tabs" role="group" aria-label="Period">{Object.entries(presets).map(([id, item]) => <button key={id} type="button" aria-pressed={preset === id} onClick={() => { setPreset(id); setUnit('') }}>{item.label}</button>)}<button type="button" aria-pressed={preset === 'custom'} onClick={() => { setCustom({ from: range.from, to: range.to || today }); setPreset('custom'); setUnit('') }}>Choose dates</button></div>
        <div className="book-tabs" role="group" aria-label="Business or personal">{[['all', 'Everything'], ['business', 'Business'], ['personal', 'Personal']].map(([id, label]) => <button key={id} type="button" aria-pressed={scope === id} onClick={() => setScope(id)}>{label}</button>)}</div>
        {preset === 'custom' && <div className="book-form-grid"><label>From<input type="date" value={custom.from} onChange={event => setCustom(current => ({ ...current, from: event.target.value }))} /></label><label>To<input type="date" value={custom.to} onChange={event => setCustom(current => ({ ...current, to: event.target.value }))} /></label></div>}
      </div>

      <dl className="book-stats"><div><dt>Earned</dt><dd>{formatPrice(totals.earned)}</dd></div><div><dt>Spent</dt><dd>{formatPrice(totals.spent)}</dd></div><div><dt>Taken out</dt><dd>{formatPrice(totals.takenOut)}</dd></div><div><dt>Left over</dt><dd>{totals.kept < 0 ? '− ' : ''}{formatPrice(Math.abs(totals.kept))}</dd></div><div><dt>Cuts done</dt><dd>{totals.cuts}</dd></div><div><dt>Average per cut</dt><dd>{formatPrice(totals.average)}</dd></div><div><dt>Free cuts</dt><dd>{totals.freeCuts}{totals.freeValue ? ` · ${formatPrice(totals.freeValue)}` : ''}</dd></div><div><dt>Paid short</dt><dd>{formatPrice(totals.shortfall)}</dd></div></dl>

      {buckets.length > 1 && <MoneyChart rows={buckets} label={keyLabel} />}
      <div className="money-columns">
        <section aria-labelledby="money-table-title"><div className="money-section-head"><h2 id="money-table-title" className="appt-group">Breakdown</h2><div className="book-tabs" role="group" aria-label="Group by">{UNIT_LABELS.map(([id, label]) => <button key={id} type="button" aria-pressed={groupBy === id} onClick={() => setUnit(id)}>{label}</button>)}</div></div>
          {buckets.length ? <div className="money-table-wrap"><table className="money-table"><thead><tr><th scope="col">Period</th><th scope="col">Cuts</th><th scope="col">Earned</th><th scope="col">Spent</th><th scope="col">Taken out</th><th scope="col">Left over</th></tr></thead><tbody>{[...buckets].reverse().filter(row => row.earned || row.spent || row.takenOut || row.cuts).map(row => <tr key={row.key}><th scope="row">{keyLabel(row.key)}</th><td>{row.cuts}</td><td>{formatPrice(row.earned)}</td><td>{formatPrice(row.spent)}</td><td>{formatPrice(row.takenOut)}</td><td>{row.kept < 0 ? '− ' : ''}{formatPrice(Math.abs(row.kept))}</td></tr>)}</tbody></table></div> : <p className="admin-empty">Nothing in this period yet.</p>}
        </section>
        {categories.length > 0 && <section aria-labelledby="money-where-title"><h2 id="money-where-title" className="appt-group">Where it went</h2><ul className="money-categories">{categories.map(item => <li key={item.category}><span>{item.category}</span><b>{formatPrice(item.amount)}</b><i aria-hidden="true" style={{ width: `${(item.amount / topCategory) * 100}%` }} /></li>)}</ul></section>}
      </div>

      <div className="money-section-head"><h2 className="appt-group">Every movement · {shown.length}</h2><button type="button" className="admin-outline" disabled={!period.length} onClick={() => download(period, range.from, range.to)}>Download as a spreadsheet</button></div>
      <div className="book-toolbar"><label>Search<input type="search" value={query} placeholder="A client, a shop, a category" onChange={event => { setQuery(event.target.value); setLimit(LEDGER_STEP) }} /></label><label>Show<select value={kind} onChange={event => { setKind(event.target.value); setLimit(LEDGER_STEP) }}><option value="all">Everything</option>{Object.entries(KIND_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label></div>
      {shown.length ? <ul className="money-lines">{shown.slice(0, limit).map(line => <Line key={`${line.id}-${line.amount}-${line.free}`} line={line} today={today} debts={debts} onChanged={changed} />)}</ul> : <p className="admin-empty">Nothing here yet. Close a cut, or add what you spent above.</p>}
      {shown.length > limit && <button type="button" className="admin-outline money-more" onClick={() => setLimit(value => value + LEDGER_STEP)}>Show more</button>}
    </>}
  </>
}

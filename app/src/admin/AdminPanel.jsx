import { useEffect, useRef, useState } from 'react'
import logo from '../assets/skee-logo-white.svg'
import { BASE_CUT_PRICE, formatPrice } from '../booking/catalog'
import AddonEditor from './AddonEditor'
import OwnerManager from './OwnerManager'
import AppointmentsManager from './AppointmentsManager'
import StudioDetails from './StudioDetails'
import NotificationSettings from './NotificationSettings'
import './AdminPanel.css'

const SECTIONS = [ ['cuts', 'Cuts & preferences'], ['addons', 'Add-ons'], ['hours', 'Working hours'] ]
const OWNER_SECTIONS = [['appointments', 'Appointments'], ...SECTIONS, ['studio', 'Studio details'], ['notifications', 'Notifications'], ['owners', 'Owners']] // these need the online database

export default function AdminPanel({ settings, storageError, onSave, owner = null }) {
  const [draft, setDraft] = useState(() => structuredClone(settings))
  const [section, setSection] = useState(owner ? 'appointments' : 'cuts')
  const sections = owner ? OWNER_SECTIONS : SECTIONS
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [discardOpen, setDiscardOpen] = useState(false)
  const discardRef = useRef(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const deleteRef = useRef(null)
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)
  const headingRef = useRef(null)
  const previousSettings = useRef(settings)
  // Adopt remote changes only if this editor has no unsaved work.
  useEffect(() => {
    const previous = previousSettings.current
    previousSettings.current = settings
    setDraft(current => JSON.stringify(current) === JSON.stringify(previous) ? structuredClone(settings) : current)
  }, [settings])

  useEffect(() => { window.scrollTo(0, 0); headingRef.current?.focus() }, [section])
  useEffect(() => {
    if (!dirty) return
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  useEffect(() => { if (discardOpen) discardRef.current.showModal() }, [discardOpen])
  useEffect(() => { if (deleteTarget) deleteRef.current.showModal() }, [deleteTarget])

  function update(collection, id, field, value) {
    setDraft(current => ({ ...current, [collection]: current[collection].map(item => (collection === 'hours' ? item.weekday === id : item.id === id) ? { ...item, [field]: value } : item) }))
    setMessage('')
    setError('')
  }

  function addItem(collection) {
    const id = `${collection === 'services' ? 'cut' : 'extra'}-${crypto.randomUUID()}`
    const item = collection === 'services'
      ? { id, name: 'New cut', description: '', category: 'Cut', duration: 30, preferences: [], visible: true }
      : { id, name: 'New add-on', description: '', types: [{ id: `type-${crypto.randomUUID()}`, name: 'Standard', description: '', duration: 5, price: 0, visible: true }], visible: true }
    setDraft(current => ({ ...current, [collection]: [...current[collection], item] }))
    setMessage('')
    setError('')
    requestAnimationFrame(() => document.getElementById(`${id}-name`)?.focus())
  }

  function duplicateItem(collection, original) {
    const copy = structuredClone(original)
    copy.id = `${collection === 'services' ? 'cut' : 'extra'}-${crypto.randomUUID()}`
    copy.name = `${copy.name.slice(0, 73)} (copy)`
    if (copy.types) copy.types = copy.types.map(type => ({ ...type, id: `type-${crypto.randomUUID()}` }))
    setDraft(current => ({ ...current, [collection]: [...current[collection], copy] }))
    setError('')
    setMessage('')
    requestAnimationFrame(() => document.getElementById(`${copy.id}-name`)?.focus())
  }

  function addType(addonId) {
    const type = { id: `type-${crypto.randomUUID()}`, name: 'New type', description: '', duration: 5, price: 0, visible: true }
    setDraft(current => ({ ...current, addons: current.addons.map(item => item.id === addonId ? { ...item, types: [...item.types, type] } : item) }))
    setError('')
    setMessage('')
    requestAnimationFrame(() => document.getElementById(`${type.id}-name`)?.focus())
  }

  function updateType(addonId, typeId, field, value) {
    setDraft(current => ({ ...current, addons: current.addons.map(item => item.id === addonId ? { ...item, types: item.types.map(type => type.id === typeId ? { ...type, [field]: value } : type) } : item) }))
    setError('')
    setMessage('')
  }

  function deleteItem() {
    const { collection, id, parentId } = deleteTarget
    setDraft(current => parentId
      ? { ...current, addons: current.addons.map(item => item.id === parentId ? { ...item, types: item.types.filter(type => type.id !== id) } : item) }
      : { ...current, [collection]: current[collection].filter(item => item.id !== id) })
    setError('')
    setMessage(`Removed “${deleteTarget.name}” from the draft. Save to apply, or discard changes to restore it.`)
    deleteRef.current.close()
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  async function save(event) {
    event.preventDefault()
    try {
      const saved = await onSave(draft)
      setDraft(structuredClone(saved))
      setError('')
      setMessage(owner ? 'Saved online. The website and booking preview now use these settings on every device.' : 'Saved in this browser. The website and booking preview now use these settings.')
    } catch (problem) {
      setMessage('')
      setError(problem.message)
    }
  }

  async function signOut() {
    if (dirty && !window.confirm('You have unsaved changes. Sign out and discard them?')) return
    try { await owner.signOut() } catch (problem) { setError(problem.message) }
  }

  function leave(event) {
    if (!dirty) return
    event.preventDefault()
    setDiscardOpen(true)
  }

  return <div className="admin-page">
    <header className="admin-header"><a href="#top" className="admin-brand" onClick={leave}><img src={logo} alt="SKEE" /><span>Studio admin</span></a><div className="admin-header-right"><a href="#top" onClick={leave}>View website ↗</a><div className="admin-owner"><span>S</span><div>Said<small>Owner · public name “Skee”</small></div></div>{owner && <button type="button" className="admin-outline" onClick={signOut}>Sign out</button>}</div></header>
    <div className="admin-shell">
      <nav className="admin-sidebar" aria-label="Admin sections">{sections.map(([id, label], index) => <button key={id} aria-current={section === id ? 'page' : undefined} onClick={() => { setSection(id); setMessage(''); setError('') }}><span>0{index + 1}</span>{label}</button>)}<div className="admin-sidebar-note"><span className="lbl">Studio settings</span><p>One base cut.<br />{formatPrice(BASE_CUT_PRICE)}.<br />Only extras add to the bill.</p></div></nav>
      <main className="admin-main">
        {owner ? <div className="admin-preview-note"><span className="lbl">Owner session</span><p>You are signed in as the owner. Saved changes are stored online and apply to the website on every device. Sample details stay until you change them.</p></div> : <div className="admin-preview-note"><span className="lbl">Local admin preview</span><p>Changes are saved in this browser only. Owner sign-in and shared online storage are not connected yet. Keep the sample details for now.</p></div>}
        {storageError && <p className="admin-error" role="alert">{storageError}</p>}
        {section === 'owners' ? <OwnerManager headingRef={headingRef} /> : section === 'appointments' ? <AppointmentsManager settings={draft} headingRef={headingRef} /> : section === 'studio' ? <StudioDetails headingRef={headingRef} /> : section === 'notifications' ? <NotificationSettings headingRef={headingRef} /> : <form onSubmit={save}>
          <div className="admin-title-row"><div><span className="lbl">Skee Block · Studio controls</span><h1 className="serif" ref={headingRef} tabIndex={-1}>{sections.find(([id]) => id === section)[1]}</h1><p>{section === 'cuts' ? 'Edit the menu, styling preferences and time needed for each cut.' : section === 'addons' ? 'Manage add-ons and the types clients choose, with a price and description for each type.' : 'Set Skee’s weekly hours and breaks. The preview calendar follows this schedule.'}</p></div>{section !== 'hours' && <button type="button" className="admin-outline" disabled={draft[section === 'cuts' ? 'services' : 'addons'].length >= 100} onClick={() => addItem(section === 'cuts' ? 'services' : 'addons')}>+ New {section === 'cuts' ? 'cut' : 'add-on'}</button>}</div>

          {section === 'cuts' && <><div className="admin-price-rule"><span className="lbl">Fixed base price</span><strong>{formatPrice(BASE_CUT_PRICE)}</strong><span>Applies to every cut. Only optional add-ons change the total.</span></div><div className="admin-editor-list">{draft.services.map((item, index) => <section className="admin-editor-card" key={item.id} aria-label={`Cut ${index + 1}`}><div className="admin-card-heading"><span className="lbl">Cut {String(index + 1).padStart(2, '0')}</span><label className="admin-toggle"><input type="checkbox" checked={item.visible} onChange={e => update('services', item.id, 'visible', e.target.checked)} />Visible on website</label></div>
            <div className="admin-field-grid"><label>Cut name<input id={`${item.id}-name`} aria-label={`Cut ${index + 1} name`} value={item.name} maxLength={80} required onChange={e => update('services', item.id, 'name', e.target.value)} /></label><label>Duration · minutes<input aria-label={`Cut ${index + 1} duration`} type="number" min="5" max="240" step="1" required value={item.duration} onChange={e => update('services', item.id, 'duration', e.target.value)} /></label><label>Category<input aria-label={`Cut ${index + 1} category`} value={item.category} maxLength={60} required onChange={e => update('services', item.id, 'category', e.target.value)} /></label></div>
            <label className="admin-full-field">Description<textarea aria-label={`Cut ${index + 1} description`} rows={2} maxLength={500} value={item.description} onChange={e => update('services', item.id, 'description', e.target.value)} /></label><label className="admin-full-field">Preferences · one option per line<textarea aria-label={`Cut ${index + 1} preferences`} rows={3} value={item.preferences.join('\n')} onChange={e => update('services', item.id, 'preferences', e.target.value.split('\n'))} /><small>Clients can choose these at review. Preferences do not add a fee.</small></label><div className="admin-card-actions"><button type="button" className="admin-outline" disabled={draft.services.length >= 100} onClick={() => duplicateItem('services', item)}>Duplicate cut</button><button type="button" className="admin-outline admin-delete" onClick={() => setDeleteTarget({ collection: 'services', id: item.id, name: item.name, kind: 'cut' })}>Delete cut</button></div></section>)}</div>{!draft.services.length && <p className="admin-empty">No cuts yet. Add your first cut above.</p>}</>}

          {section === 'addons' && <AddonEditor items={draft.addons} onUpdate={update} onDuplicate={duplicateItem} onDelete={setDeleteTarget} onAddType={addType} onUpdateType={updateType} onDeleteType={(parentId, type) => setDeleteTarget({ collection: 'addons', parentId, id: type.id, name: type.name, kind: 'type' })} />}

          {section === 'hours' && <><div className="admin-hours-note"><span className="lbl">Africa/Algiers · UTC+1</span><p>Same-day opening and closing times. Leave both break fields empty for a continuous day. Closed days and times that cannot fit the complete service are excluded from the booking preview.</p></div><div className="admin-editor-list">{draft.hours.map(item => <section className="admin-editor-card admin-day-card" key={item.weekday} aria-label={`${item.day} working hours`}><div className="admin-card-heading"><h2 className="serif">{item.day}</h2><label className="admin-toggle"><input type="checkbox" checked={item.open} onChange={e => update('hours', item.weekday, 'open', e.target.checked)} />{item.open ? 'Open' : 'Closed'}</label></div><div className="admin-time-grid">{[['start', 'Opens'], ['end', 'Closes'], ['breakStart', 'Break starts'], ['breakEnd', 'Break ends']].map(([field, label]) => <label key={field}>{label}<input aria-label={`${item.day} ${label.toLowerCase()}`} type="time" disabled={!item.open} required={item.open && ['start', 'end'].includes(field)} value={item[field]} onChange={e => update('hours', item.weekday, field, e.target.value)} /></label>)}</div></section>)}</div></>}

          <div className="admin-save-bar"><div><span className="admin-dirty-status">{dirty ? 'Unsaved changes' : 'No unsaved changes'}</span><p>{owner ? 'Saved changes apply to the website and booking preview on every device.' : 'Saved changes apply to this browser’s website and booking preview.'}</p></div><button type="button" className="admin-outline" disabled={!dirty} onClick={() => { setDraft(structuredClone(settings)); setError(''); setMessage('Draft discarded. Saved settings kept.') }}>Discard changes</button><button type="submit" className="admin-save" disabled={!dirty}>Save all changes</button></div>
          {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-message" role="status">{message}</p>}
        </form>}
      </main>
    </div>
    <dialog ref={deleteRef} className="admin-discard-dialog" aria-labelledby="delete-title" aria-describedby="delete-description" onClose={() => setDeleteTarget(null)}><h2 id="delete-title" className="serif">Delete this {deleteTarget?.kind}?</h2><p id="delete-description">Remove “{deleteTarget?.name}”{deleteTarget?.kind === 'add-on' ? ' and all its types' : ''} from the draft? Save all changes to apply the deletion. Discard changes can restore it before saving.</p><div><button autoFocus className="admin-outline" onClick={() => deleteRef.current.close()}>Keep it</button><button className="admin-save" onClick={deleteItem}>Delete {deleteTarget?.kind}</button></div></dialog>
    <dialog ref={discardRef} className="admin-discard-dialog" aria-labelledby="discard-title" onClose={() => setDiscardOpen(false)}><h2 id="discard-title" className="serif">Leave your draft?</h2><p>Your unsaved edits will be lost. The last saved settings will stay unchanged.</p><div><button className="admin-outline" onClick={() => discardRef.current.close()}>Keep editing</button><button className="admin-save" onClick={() => { discardRef.current.close(); window.location.hash = 'top' }}>Leave without saving</button></div></dialog>
  </div>
}

import CutPhotosEditor from './CutPhotosEditor'
import { MAX_OFFERS, MAX_OFFER_ITEMS, MAX_OFFER_PHOTOS, itemsTotal, offerPercent } from '../offers/offers'

// Flash deals shown above the menu on the homepage. One offer fills the width of all three service cards, two share
// it, three line up one above each card — so the number of offers is also the layout choice.
const WIDTH_NOTE = ['', 'One offer: a single wide banner across the menu.', 'Two offers: each as wide as a card and a half.', 'Three offers: one above each service card.']

export default function OffersEditor({ offers, services, onUpdate, onDelete, allowPhotos }) {
  const live = offers.filter(item => item.visible !== false).length
  return <>
    <div className="admin-preview-note"><span className="lbl">How it looks</span><p>{live ? WIDTH_NOTE[Math.min(live, MAX_OFFERS)] : 'No offer is showing, so the homepage looks exactly as it does now. Add one and it appears above the menu.'} Each card uses your photos, counts down to the end time and opens booking when a client taps it.</p></div>
    <div className="admin-editor-list">{offers.map((offer, index) => {
      const percent = offerPercent(offer)
      const set = field => event => onUpdate(offer.id, field, event.target.value)
      const items = offer.items || []
      const sum = itemsTotal(offer)
      const setItem = (itemId, field, value) => onUpdate(offer.id, 'items', items.map(entry => (entry.id === itemId ? { ...entry, [field]: value } : entry)))
      return <section className="admin-editor-card" key={offer.id} aria-label={`Offer ${index + 1}`}>
        <div className="admin-card-heading"><span className="lbl">Offer {String(index + 1).padStart(2, '0')}</span><label className="admin-toggle"><input type="checkbox" checked={offer.visible} onChange={event => onUpdate(offer.id, 'visible', event.target.checked)} />Showing on the homepage</label></div>
        <div className="admin-field-grid">
          <label>Tag<input id={`${offer.id}-label`} maxLength={24} value={offer.label} onChange={set('label')} /><small>Small gold line above the title, for example “Flash deal”.</small></label>
          <label>Title<input id={`${offer.id}-name`} maxLength={80} required value={offer.name} onChange={set('name')} /></label>
          <label>Opens this cut<select value={offer.serviceId || ''} onChange={set('serviceId')}><option value="">Let the client choose</option>{services.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        </div>
        <label className="admin-full-field">Description<textarea rows={2} maxLength={500} value={offer.description} onChange={set('description')} /></label>
        <div className="admin-field-grid">
          <label>Usual price · DA<input type="number" min="0" max="100000" step="50" value={offer.oldPrice || ''} placeholder="800" onChange={set('oldPrice')} /></label>
          <label>Offer price · DA<input type="number" min="0" max="100000" step="50" value={offer.newPrice || ''} placeholder="600" onChange={set('newPrice')} />{percent > 0 && <small>Shown as −{percent}% on the card.</small>}</label>
          <label>Ends on<input type="datetime-local" value={offer.endsAt || ''} onChange={set('endsAt')} /><small>Leave empty to run until you hide it. The countdown is in M’Sila time, and the offer disappears by itself when it ends.</small></label>
        </div>
        <div className="admin-full-field offer-items-editor">
          <span>What the client gets · {items.length}/{MAX_OFFER_ITEMS} <small>Each line shows as its own row when a client opens the offer. Leave a price empty to show the line without one.</small></span>
          {items.length > 0 && <ul>{items.map((entry, position) => <li key={entry.id}>
            <input aria-label={`Item ${position + 1} name`} maxLength={80} placeholder="Protein treatment" value={entry.name} onChange={event => setItem(entry.id, 'name', event.target.value)} />
            <input aria-label={`Item ${position + 1} price`} type="number" min="0" max="100000" step="50" placeholder="DA" value={entry.price || ''} onChange={event => setItem(entry.id, 'price', event.target.value)} />
            <button type="button" className="admin-outline admin-delete" onClick={() => onUpdate(offer.id, 'items', items.filter(other => other.id !== entry.id))}>Remove</button>
          </li>)}</ul>}
          {items.length < MAX_OFFER_ITEMS && <button type="button" className="admin-outline" onClick={() => onUpdate(offer.id, 'items', [...items, { id: `item-${crypto.randomUUID()}`, name: '', price: 0 }])}>+ Add item</button>}
          {sum > 0 && <small>These lines add up to {sum} DA{Number(offer.oldPrice) > 0 && sum !== Number(offer.oldPrice) ? `, but the usual price below says ${offer.oldPrice} DA. Clients see both, so keep them in step.` : '.'}</small>}
        </div>

        {allowPhotos && <CutPhotosEditor cut={offer} onChange={photos => onUpdate(offer.id, 'photos', photos)} folder={`offers/${offer.id}`} max={MAX_OFFER_PHOTOS} maxSide={2200} title="Offer photos" hint="Fill the whole card. Several photos fade from one to the next with a progress bar. With no photo the card animates on its own." />}
        <div className="admin-card-actions"><button type="button" className="admin-outline admin-delete" onClick={() => onDelete({ collection: 'offers', id: offer.id, name: offer.name, kind: 'offer' })}>Delete offer</button></div>
      </section>
    })}</div>
    {!offers.length && <p className="admin-empty">No offers yet. Add one to show a deal above the menu; the homepage stays exactly as it is until you do.</p>}
    <p className="admin-empty offers-price-note">The prices here are shown on the card. The booking total is still 800 DA plus any add-ons, so tell the client the offer price when they come in, or ask for the discount to be applied to the booking total as well.</p>
  </>
}

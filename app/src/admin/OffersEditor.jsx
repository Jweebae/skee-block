import CutPhotosEditor from './CutPhotosEditor'
import { BASE_CUT_PRICE } from '../booking/catalog'
import { MAX_OFFERS, MAX_OFFER_ITEMS, MAX_OFFER_PHOTOS, linesTotal, offerLines, offerPercent } from '../offers/offers'

// Flash deals shown above the menu on the homepage. One offer fills the width of all three service cards, two share
// it, three line up one above each card — so the number of offers is also the layout choice.
const WIDTH_NOTE = ['', 'One offer: a single wide banner across the menu.', 'Two offers: each as wide as a card and a half.', 'Three offers: one above each service card.']

// Add-ons ticked here are really applied to the booking, so the client only has to pick a cut and a time.
function MenuPicker({ offer, menu, onUpdate }) {
  const chosen = offer.addons || []
  const groups = menu.filter(group => group.visible !== false && group.types.some(type => type.visible !== false))
  const pickedType = groupId => chosen.find(choice => choice.addonId === groupId)?.typeId || ''
  function toggleGroup(group) {
    const first = group.types.find(type => type.visible !== false)
    onUpdate(offer.id, 'addons', pickedType(group.id)
      ? chosen.filter(choice => choice.addonId !== group.id)
      : [...chosen, { addonId: group.id, typeId: first.id }])
  }
  const setType = (groupId, typeId) => onUpdate(offer.id, 'addons', chosen.map(choice => (choice.addonId === groupId ? { ...choice, typeId } : choice)))
  if (!groups.length) return <p className="admin-empty">No add-ons are on the menu yet. Add them in the Add-ons section, or use the extra lines below.</p>
  return <ul className="offer-menu-picker">{groups.map(group => {
    const picked = pickedType(group.id)
    return <li key={group.id}>
      <label className="admin-toggle"><input type="checkbox" checked={Boolean(picked)} onChange={() => toggleGroup(group)} />{group.name}</label>
      {picked && <div className="offer-menu-types">{group.types.filter(type => type.visible !== false).map(type => <label key={type.id} className="admin-toggle">
        <input type="radio" name={`${offer.id}-${group.id}`} checked={picked === type.id} onChange={() => setType(group.id, type.id)} />
        {type.name} · {type.price} DA · +{type.duration} min
      </label>)}</div>}
    </li>
  })}</ul>
}

export default function OffersEditor({ offers, services, menu = [], onUpdate, onDelete, allowPhotos }) {
  const live = offers.filter(item => item.visible !== false).length
  return <>
    <div className="admin-preview-note"><span className="lbl">How it looks</span><p>{live ? WIDTH_NOTE[Math.min(live, MAX_OFFERS)] : 'No offer is showing, so the homepage looks exactly as it does now. Add one and it appears above the menu.'} A client opens the card, sees everything the deal includes, picks a cut, and goes straight to choosing a date — the add-ons you tick are already applied.</p></div>
    <div className="admin-editor-list">{offers.map((offer, index) => {
      const percent = offerPercent(offer)
      const set = field => event => onUpdate(offer.id, field, event.target.value)
      const items = offer.items || []
      const dealCut = services.find(item => item.id === offer.serviceId)
      const sum = linesTotal(offerLines(offer, menu, dealCut?.name))
      const setItem = (itemId, field, value) => onUpdate(offer.id, 'items', items.map(entry => (entry.id === itemId ? { ...entry, [field]: value } : entry)))
      return <section className="admin-editor-card" key={offer.id} aria-label={`Offer ${index + 1}`}>
        <div className="admin-card-heading"><span className="lbl">Offer {String(index + 1).padStart(2, '0')}</span><label className="admin-toggle"><input type="checkbox" checked={offer.visible} onChange={event => onUpdate(offer.id, 'visible', event.target.checked)} />Showing on the homepage</label></div>
        <div className="admin-field-grid">
          <label>Tag<input id={`${offer.id}-label`} maxLength={24} value={offer.label} onChange={set('label')} /><small>Small gold line above the title, for example “Flash deal”.</small></label>
          <label>Title<input id={`${offer.id}-name`} maxLength={80} required value={offer.name} onChange={set('name')} /></label>
          <label>Cut for this deal<select value={offer.serviceId || ''} onChange={set('serviceId')}><option value="">Let the client pick</option>{services.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><small>Left on “Let the client pick”, Book now stays locked until they choose one.</small></label>
        </div>
        <label className="admin-full-field">Description<textarea rows={2} maxLength={500} value={offer.description} onChange={set('description')} /></label>

        <div className="admin-full-field offer-items-editor">
          <span>What the client gets <small>Tick what this deal includes. Add-ons are applied to the booking for the client; you only have to pick the exact one you mean.</small></span>
          <label className="admin-toggle offer-cut-included"><input type="checkbox" checked={offer.includesCut === true} onChange={event => onUpdate(offer.id, 'includesCut', event.target.checked)} />This offer includes a haircut</label>
          <small className="offer-cut-included-note">{offer.includesCut
            ? `Listed first as “${dealCut?.name || 'Haircut'} · ${BASE_CUT_PRICE} DA”, because the deal price covers the cut.`
            : `Not listed, and the card tells the client their cut is charged separately on top of this deal.`}</small>
          <MenuPicker offer={offer} menu={menu} onUpdate={onUpdate} />

          <span>Extra lines · {items.length}/{MAX_OFFER_ITEMS} <small>For anything not on the add-ons menu. These are listed on the card but are not added to the booking.</small></span>
          {items.length > 0 && <ul>{items.map((entry, position) => <li key={entry.id}>
            <input aria-label={`Extra line ${position + 1} name`} maxLength={80} placeholder="Free drink" value={entry.name} onChange={event => setItem(entry.id, 'name', event.target.value)} />
            <input aria-label={`Extra line ${position + 1} price`} type="number" min="0" max="100000" step="50" placeholder="DA" value={entry.price || ''} onChange={event => setItem(entry.id, 'price', event.target.value)} />
            <button type="button" className="admin-outline admin-delete" onClick={() => onUpdate(offer.id, 'items', items.filter(other => other.id !== entry.id))}>Remove</button>
          </li>)}</ul>}
          {items.length < MAX_OFFER_ITEMS && <button type="button" className="admin-outline" onClick={() => onUpdate(offer.id, 'items', [...items, { id: `item-${crypto.randomUUID()}`, name: '', price: 0 }])}>+ Add a line</button>}
          <small>Everything ticked above comes to <strong>{sum} DA</strong>{Number(offer.oldPrice) > 0 && sum !== Number(offer.oldPrice) ? `, but the usual price below says ${offer.oldPrice} DA. Clients see both, so keep them in step.` : '. Use that as the usual price below.'}</small>
        </div>

        <div className="admin-field-grid">
          <label>Usual price · DA<input type="number" min="0" max="100000" step="50" value={offer.oldPrice || ''} placeholder={String(sum)} onChange={set('oldPrice')} /></label>
          <label>Offer price · DA<input type="number" min="0" max="100000" step="50" value={offer.newPrice || ''} placeholder="600" onChange={set('newPrice')} />{percent > 0 && <small>Shown as −{percent}% on the card.</small>}</label>
          <label>Ends on<input type="datetime-local" value={offer.endsAt || ''} onChange={set('endsAt')} /><small>Leave empty to run until you hide it. The countdown is in M’Sila time, and the offer disappears by itself when it ends.</small></label>
        </div>
        {allowPhotos && <CutPhotosEditor cut={offer} onChange={photos => onUpdate(offer.id, 'photos', photos)} folder={`offers/${offer.id}`} max={MAX_OFFER_PHOTOS} maxSide={2200} title="Offer photos" hint="Fill the whole card. Several photos fade from one to the next with a progress bar. With no photo the card animates on its own." />}
        <div className="admin-card-actions"><button type="button" className="admin-outline admin-delete" onClick={() => onDelete({ collection: 'offers', id: offer.id, name: offer.name, kind: 'offer' })}>Delete offer</button></div>
      </section>
    })}</div>
    {!offers.length && <p className="admin-empty">No offers yet. Add one to show a deal above the menu; the homepage stays exactly as it is until you do.</p>}
    <p className="admin-empty offers-price-note">The offer price is shown on the card. The booking total is still the cut plus the add-ons you ticked, so tell the client the offer price when they come in, or ask for the discount to be applied to the booking total as well.</p>
  </>
}

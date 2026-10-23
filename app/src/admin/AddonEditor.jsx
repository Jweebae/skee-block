export default function AddonEditor({ items, onUpdate, onDuplicate, onDelete, onAddType, onUpdateType, onDeleteType }) {
  return <div className="admin-editor-list">
    {!items.length && <p className="admin-empty">No add-ons yet. Add one above, then add the types clients can choose.</p>}
    {items.map((item, index) => <section className="admin-editor-card" key={item.id} aria-label={`Add-on ${index + 1}`}>
      <div className="admin-card-heading">
        <span className="lbl">Extra {String(index + 1).padStart(2, '0')}</span>
        <label className="admin-toggle"><input type="checkbox" checked={item.visible} onChange={e => onUpdate('addons', item.id, 'visible', e.target.checked)} />Available at booking</label>
      </div>
      <label>Add-on name<input id={`${item.id}-name`} aria-label={`Add-on ${index + 1} name`} required maxLength={80} value={item.name} onChange={e => onUpdate('addons', item.id, 'name', e.target.value)} /></label>
      <label className="admin-full-field">Description<textarea aria-label={`Add-on ${index + 1} description`} rows={2} maxLength={500} value={item.description} onChange={e => onUpdate('addons', item.id, 'description', e.target.value)} /></label>
      <div className="admin-types-heading"><div><h2 className="serif">Types to choose from</h2><p>Clients choose one type for this add-on. Each type sets its own price and extra time.</p></div><button type="button" className="admin-outline" disabled={item.types.length >= 30} onClick={() => onAddType(item.id)}>+ New type</button></div>
      <div className="admin-type-list">
        {item.types.map((type, typeIndex) => {
          const label = `Add-on ${index + 1} type ${typeIndex + 1}`
          return <section className="admin-type-card" key={type.id} aria-label={label}>
            <div className="admin-card-heading"><span className="lbl">Type {String(typeIndex + 1).padStart(2, '0')}</span><label className="admin-toggle"><input type="checkbox" checked={type.visible} onChange={e => onUpdateType(item.id, type.id, 'visible', e.target.checked)} />Available at booking</label></div>
            <div className="admin-field-grid">
              <label>Type name<input id={`${type.id}-name`} aria-label={`${label} name`} required maxLength={80} value={type.name} onChange={e => onUpdateType(item.id, type.id, 'name', e.target.value)} /></label>
              <label>Price · DA<input aria-label={`${label} price`} type="number" min="0" max="100000" step="1" required value={type.price} onChange={e => onUpdateType(item.id, type.id, 'price', e.target.value)} /></label>
              <label>Extra time · minutes<input aria-label={`${label} duration`} type="number" min="0" max="120" step="1" required value={type.duration} onChange={e => onUpdateType(item.id, type.id, 'duration', e.target.value)} /></label>
            </div>
            <label className="admin-full-field">Type description<textarea aria-label={`${label} description`} rows={2} maxLength={500} value={type.description} onChange={e => onUpdateType(item.id, type.id, 'description', e.target.value)} /></label>
            <div className="admin-card-actions"><button type="button" className="admin-outline admin-delete" onClick={() => onDeleteType(item.id, type)}>Delete type</button></div>
          </section>
        })}
      </div>
      {!item.types.some(type => type.visible) && <p className="admin-empty">This add-on will stay out of booking until it has an available type.</p>}
      <div className="admin-card-actions"><button type="button" className="admin-outline" disabled={items.length >= 100} onClick={() => onDuplicate('addons', item)}>Duplicate add-on</button><button type="button" className="admin-outline admin-delete" onClick={() => onDelete({ collection: 'addons', id: item.id, name: item.name, kind: 'add-on' })}>Delete add-on</button></div>
    </section>)}
  </div>
}

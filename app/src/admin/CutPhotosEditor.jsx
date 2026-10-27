import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { MAX_CUT_PHOTOS } from '../settings/studioSettings'

// Owners add photos to a cut. Each photo is shrunk in the browser (at most 1400 px, WebP or JPEG under 1 MB),
// uploaded to the public `cut-photos` bucket, and listed on the cut; "Save all changes" publishes the list.
const MAX_SIDE = 1400

async function shrink(file) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  const encode = (type, quality) => new Promise(resolve => canvas.toBlob(resolve, type, quality))
  let blob = await encode('image/webp', 0.82)
  if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg', 0.85) // Safari cannot make WebP
  if (blob.size > 1024 * 1024) blob = await encode('image/jpeg', 0.7)
  return blob
}

export default function CutPhotosEditor({ cut, onChange, folder = cut.id, max = MAX_CUT_PHOTOS, title = 'Photos', hint = 'Shown when a client hovers over this cut on the homepage and in booking (a Photos button on phones). The first photo shows first.' }) {
  const photos = cut.photos || []
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function add(event) {
    const files = [...event.target.files].slice(0, max - photos.length)
    event.target.value = ''
    if (!files.length) return
    setBusy(true); setError('')
    const added = []
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        const blob = await shrink(file)
        const path = `${folder}/${crypto.randomUUID()}.${blob.type === 'image/webp' ? 'webp' : 'jpg'}`
        const { error: problem } = await supabase.storage.from('cut-photos').upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false })
        if (problem) throw problem
        added.push(supabase.storage.from('cut-photos').getPublicUrl(path).data.publicUrl)
      }
    } catch {
      setError('A photo could not be uploaded. Check your connection, then try again with a JPEG or PNG photo.')
    } finally {
      if (added.length) onChange([...photos, ...added])
      setBusy(false)
    }
  }
  const remove = url => onChange(photos.filter(item => item !== url))
  const cover = url => onChange([url, ...photos.filter(item => item !== url)])
  return <div className="admin-full-field cut-photos-editor">
    <span>{title} · {photos.length}/{max} <small>{hint}</small></span>
    {photos.length > 0 && <ul>{photos.map((url, index) => <li key={url}><img src={url} alt={`${cut.name}, photo ${index + 1}`} loading="lazy" />{index === 0 ? <b>First</b> : <button type="button" className="admin-outline" onClick={() => cover(url)}>Show first</button>}<button type="button" className="admin-outline admin-delete" onClick={() => remove(url)}>Remove</button></li>)}</ul>}
    {photos.length < max && <label className="admin-outline cut-photos-add">{busy ? 'Uploading…' : '+ Add photos'}<input type="file" accept="image/*" multiple disabled={busy} onChange={add} /></label>}
    {error && <p className="admin-error" role="alert">{error}</p>}
    {photos.length > 0 && <small>Click “Save all changes” to publish photo changes.</small>}
  </div>
}

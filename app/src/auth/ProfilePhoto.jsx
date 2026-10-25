import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { announceProfileChange, photoLink } from './useClientProfile'
import { uploadProfilePhoto } from './profilePhotoUpload'

// The client's optional profile photo, its upload button and the remove action.
export function PhotoPicker({ userId, oldPath, label = 'Add a photo', className = 'acct-btn acct-btn-primary', onDone }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function pick(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true); setError('')
    try { await uploadProfilePhoto(userId, file, oldPath); onDone?.() } catch (problem) { setError(problem.message) } finally { setBusy(false) }
  }
  return <>
    <label className={`photo-pick ${className}`}>{busy ? 'Uploading…' : label}<input type="file" accept="image/*" disabled={busy} onChange={pick} /></label>
    {error && <p className="photo-error" role="alert">{error}</p>}
  </>
}

export default function ProfilePhoto({ userId, path, name }) {
  const [url, setUrl] = useState('')
  const [removing, setRemoving] = useState(false)
  useEffect(() => {
    let active = true
    photoLink(path).then(link => { if (active) setUrl(link) })
    return () => { active = false }
  }, [path])
  async function remove() {
    setRemoving(true)
    await supabase.from('client_profiles').update({ avatar_path: null, updated_at: new Date().toISOString() }).eq('user_id', userId)
    await supabase.storage.from('client-photos').remove([path])
    setRemoving(false)
    announceProfileChange()
  }
  const initial = String(name || '?').trim().charAt(0).toUpperCase()
  return <div className="profile-photo">
    <span className="profile-photo-frame">{path && url ? <img src={url} alt="Your profile photo" /> : <span aria-hidden="true">{initial}</span>}</span>
    <div className="profile-photo-actions">
      <PhotoPicker userId={userId} oldPath={path} label={path ? 'Change photo' : 'Add a photo'} className={path ? 'acct-btn' : 'acct-btn acct-btn-primary'} />
      {path && <button type="button" className="acct-btn" disabled={removing} onClick={remove}>{removing ? 'Removing…' : 'Remove'}</button>}
    </div>
  </div>
}

import { useState } from 'react'
import { PhotoPicker } from './ProfilePhoto'

// A small, dismissible prompt to finish the profile. It never blocks anything: "Later" hides it for three days.
const KEY = 'skee.profile-nudge-later'
const readLater = () => { try { return Number(localStorage.getItem(KEY)) || 0 } catch { return 0 } }
const writeLater = until => { try { localStorage.setItem(KEY, String(until)) } catch { /* optional */ } }

const NEXT_TEXT = {
  photo: 'Add a profile photo to complete it.',
  phone: 'Add your WhatsApp number to complete it.',
  verified: 'Verify your WhatsApp number to complete it.',
  username: 'Choose a username to complete it.',
}

export default function ProfileNudge({ user, status, variant = 'card', onOpenAccount }) {
  const [hiddenUntil, setHiddenUntil] = useState(readLater)
  const [now] = useState(() => Date.now())
  if (!user || !status.loaded || !status.next || status.next.id === 'account') return null
  if (variant !== 'account' && hiddenUntil > now) return null
  const later = () => { const until = Date.now() + 3 * 86400000; writeLater(until); setHiddenUntil(until) }
  return <aside className={`profile-nudge profile-nudge-${variant}`} aria-label="Profile completeness">
    <span className="profile-nudge-ring" style={{ '--p': status.percent }} aria-hidden="true"><b>{status.percent}%</b></span>
    <div className="profile-nudge-copy"><strong>Your profile is {status.percent}% complete.</strong><span>{NEXT_TEXT[status.next.id]}</span></div>
    <div className="profile-nudge-actions">
      {status.next.id === 'photo'
        ? <PhotoPicker userId={user.id} oldPath={status.profile?.avatar_path} label="Add photo" className="profile-nudge-button" />
        : onOpenAccount && <button type="button" className="profile-nudge-button" onClick={onOpenAccount}>Complete</button>}
      {variant !== 'account' && <button type="button" className="profile-nudge-later" onClick={later}>Later</button>}
    </div>
  </aside>
}

import { useEffect, useState } from 'react'
import { photoLink } from './useClientProfile'

// The signed-in person's photo (or initial) for page headers, so they always see which account is in use.
// A gold ring means the profile is not complete yet.
export default function HeaderAvatar({ user, status, size = 32, className = '' }) {
  const path = status?.profile?.avatar_path
  const [url, setUrl] = useState('')
  useEffect(() => {
    let active = true
    photoLink(path).then(link => { if (active) setUrl(link) })
    return () => { active = false }
  }, [path])
  if (!user) return null
  const meta = user.user_metadata || {}
  const name = [meta.first_name, meta.last_name].filter(Boolean).join(' ') || meta.full_name || meta.name || user.email
  const incomplete = status?.loaded && status.percent < 100
  return <span className={`header-avatar${incomplete ? ' is-incomplete' : ''} ${className}`} style={{ '--size': `${size}px` }} title={`Signed in as ${name}${incomplete ? ` · profile ${status.percent}% complete` : ''}`}>
    {path && url ? <img src={url} alt="" /> : <span aria-hidden="true">{String(name).trim().charAt(0).toUpperCase()}</span>}
    <span className="visually-hidden">Signed in as {name}{incomplete ? `, profile ${status.percent}% complete` : ''}</span>
  </span>
}

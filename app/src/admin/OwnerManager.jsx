import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Owners add and remove owners here. The database functions (migration studio_owner_management) check that the
// caller is an owner, add only existing accounts, and refuse to remove yourself, so one owner always remains.
const PROBLEMS = {
  no_account: 'No 3kee account uses this email yet. Ask them to create an account on 3kee.site first (Create account → Continue with Google), then add them here.',
  cannot_remove_self: 'You cannot remove yourself. Another owner can remove you.',
  not_allowed: 'Only owners can manage owners.',
}
function explain(error) {
  if (PROBLEMS[error?.message]) return PROBLEMS[error.message]
  if (error?.code === 'PGRST202') return 'Owner management is not set up in the database yet.'
  return 'Something went wrong. Check your connection and try again.'
}
// Resolves to { owners } or { error } so callers set state once, after the request.
async function fetchOwners() {
  const { data, error } = await supabase.rpc('list_studio_owners')
  return error ? { owners: [], error: explain(error) } : { owners: data, error: '' }
}
const dateText = value => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export default function OwnerManager({ headingRef }) {
  const [owners, setOwners] = useState(null)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    const result = await fetchOwners()
    setOwners(result.owners)
    if (result.error) setError(result.error)
  }
  useEffect(() => {
    let active = true
    fetchOwners().then(result => { if (active) { setOwners(result.owners); setError(result.error) } })
    return () => { active = false }
  }, [])

  async function act(task, done) {
    setBusy(true); setError(''); setMessage('')
    const { error: problem } = await task()
    if (problem) setError(explain(problem)); else { setMessage(done); await load() }
    setBusy(false); setConfirming(null)
    return !problem
  }
  function add(event) {
    event.preventDefault()
    const address = email.trim()
    act(() => supabase.rpc('add_studio_owner', { owner_email: address }), `${address} is now an owner. They can open the admin page and sign in with their account.`)
      .then(added => { if (added) setEmail('') })
  }

  return <>
    <div className="admin-title-row"><div><span className="lbl">Skee Block · Studio controls</span><h1 className="serif" ref={headingRef} tabIndex={-1}>Owners</h1><p>Owners can sign in to this page and change the studio settings. Add someone by the email of their 3kee account; they create the account themselves on the website first.</p></div></div>
    <div className="admin-editor-list">
      {owners === null ? <p className="admin-empty">Loading owners…</p> : owners.map(owner => <section className="admin-editor-card admin-owner-row" key={owner.user_id} aria-label={owner.email}>
        <div><strong>{owner.email}</strong>{owner.is_you && <span className="admin-owner-you">You</span>}<small>Owner since {dateText(owner.added_at)}</small></div>
        {!owner.is_you && (confirming === owner.user_id
          ? <div className="admin-card-actions"><button type="button" className="admin-outline" disabled={busy} onClick={() => setConfirming(null)}>Keep</button><button type="button" className="admin-save" disabled={busy} onClick={() => act(() => supabase.rpc('remove_studio_owner', { owner_id: owner.user_id }), `${owner.email} is no longer an owner. Their client account stays.`)}>Remove owner</button></div>
          : <button type="button" className="admin-outline admin-delete" disabled={busy} onClick={() => { setConfirming(owner.user_id); setMessage(''); setError('') }}>Remove</button>)}
      </section>)}
    </div>
    <form className="admin-editor-card admin-owner-add" onSubmit={add}>
      <label>Add an owner · email of their 3kee account<input type="email" required maxLength={254} autoComplete="off" value={email} disabled={busy} onChange={event => setEmail(event.target.value)} /></label>
      <button type="submit" className="admin-save" disabled={busy}>{busy ? 'Please wait…' : 'Add owner'}</button>
    </form>
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-message" role="status">{message}</p>}
  </>
}

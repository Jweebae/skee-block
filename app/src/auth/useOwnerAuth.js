import { useEffect, useState } from 'react'
import { supabase, passwordSetupCallback } from '../lib/supabase'

export default function useOwnerAuth() {
  const [auth, setAuth] = useState({ phase: supabase ? 'loading' : 'unconfigured', user: null, error: '' })
  const [needsPassword, setNeedsPassword] = useState(passwordSetupCallback)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!supabase) return
    let active = true, revision = 0
    const timers = new Set()
    async function verify(session) {
      const current = ++revision
      if (!session) { if (active) setAuth({ phase: 'signedOut', user: null, error: '' }); return }
      try {
        const { data, error } = await supabase.auth.getUser(session.access_token)
        if (error) throw error
        const access = await supabase.from('studio_admins').select('user_id').eq('user_id', data.user.id).maybeSingle()
        if (access.error) throw access.error
        if (active && current === revision) setAuth({ phase: access.data ? 'owner' : 'denied', user: data.user, error: '' })
      } catch {
        if (active && current === revision) setAuth({ phase: 'error', user: null, error: 'Could not verify owner access. Check your connection and try again.' })
      }
    }
    // Avoid making Supabase calls while its auth-event lock is held.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') { setNeedsPassword(true); window.location.hash = 'admin' }
      if (passwordSetupCallback && session) window.location.hash = 'admin'
      if (!session) { revision++; setAuth({ phase: 'signedOut', user: null, error: '' }) }
      const timer = setTimeout(() => { timers.delete(timer); if (active) verify(session) }, 0)
      timers.add(timer)
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setAuth({ phase: 'error', user: null, error: 'Could not restore your sign-in. Please try again.' })
      else verify(data.session)
    })
    return () => { active = false; revision++; subscription.unsubscribe(); timers.forEach(clearTimeout) }
  }, [attempt])
  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error('Sign-out failed. Please try again.')
    setNeedsPassword(false)
    setAuth({ phase: 'signedOut', user: null, error: '' })
  }
  return { ...auth, isOwner: auth.phase === 'owner', needsPassword, finishPasswordSetup: () => setNeedsPassword(false), retry: () => setAttempt(value => value + 1), signOut }
}

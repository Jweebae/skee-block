import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ERROR_TEXT = {
  signup_disabled: 'New accounts are not open yet. Please contact Skee to get started.',
}

// Google sends the visitor back with the failure in the address (hash or query); show it, then clean the address.
function takeAuthError() {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const search = new URLSearchParams(window.location.search)
  const code = hash.get('error_code') || search.get('error_code') || hash.get('error') || search.get('error')
  if (!code) return ''
  window.history.replaceState(null, '', window.location.pathname)
  return ERROR_TEXT[code] || 'Sign-in with Google did not complete. Please try again.'
}

// Client (customer) sign-in. Separate from the owner login in useOwnerAuth, which also checks studio_admins.
export default function useClientSession() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const returned = takeAuthError()
    if (returned) setError(returned)
    if (!supabase) return
    let active = true
    supabase.auth.getSession().then(({ data }) => { if (active) setUser(data.session?.user ?? null) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => { active = false; subscription.unsubscribe() }
  }, [])
  async function signInWithGoogle() {
    setError('')
    const { error: problem } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
    })
    if (problem) setError('Could not start Google sign-in. Please try again.')
  }
  async function signOut() {
    setError('')
    const { error: problem } = await supabase.auth.signOut()
    if (problem) setError('Sign-out failed. Please try again.')
  }
  return { available: Boolean(supabase), user, error, signInWithGoogle, signOut }
}

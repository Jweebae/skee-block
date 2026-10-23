import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const MIN_PASSWORD = 10
const REAUTH_KEY = 'skee.client-reauth' // non-secret marker: the client asked to change their password and is re-confirming with Google
const FRESH_MS = 10 * 60 * 1000
// Read at load, before supabase-js tidies the address after a Google return.
const RETURNED_FROM_GOOGLE = /[#&?](access_token|code)=/.test(window.location.hash + window.location.search)

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

const RETURNED_ERROR = takeAuthError()

function storedIntent() {
  try { return sessionStorage.getItem(REAUTH_KEY) === 'password' } catch { return false }
}

function storeIntent(on) {
  try { if (on) sessionStorage.setItem(REAUTH_KEY, 'password'); else sessionStorage.removeItem(REAUTH_KEY) } catch { /* the marker is optional */ }
}

// True when the session's own sign-in record shows a Google login within the last few minutes.
function hasFreshGoogleLogin(session) {
  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    const times = (payload.amr || []).filter(item => item.method === 'oauth').map(item => item.timestamp * 1000)
    return times.length > 0 && Date.now() - Math.max(...times) < FRESH_MS
  } catch { return false }
}

function checkPassword(password, confirm) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) throw new Error(`Choose a password of at least ${MIN_PASSWORD} characters.`)
  if (password !== confirm) throw new Error('The two passwords do not match.')
}

function cleanName(value, label) {
  const text = String(value || '').trim().replace(/\s+/g, ' ')
  if (!text || text.length > 60) throw new Error(`Enter your ${label} (up to 60 characters).`)
  return text
}

// Client (customer) accounts. Separate from the owner login in useOwnerAuth, which also checks studio_admins.
export default function useClientSession() {
  const [session, setSession] = useState(null)
  const [googleFresh, setGoogleFresh] = useState(false)
  const [ready, setReady] = useState(!supabase)
  const [error, setError] = useState(RETURNED_ERROR)
  const [notice, setNotice] = useState('')
  const [passwordIntent, setPasswordIntent] = useState(storedIntent)
  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null); setGoogleFresh(Boolean(data.session) && hasFreshGoogleLogin(data.session)); setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null); setGoogleFresh(Boolean(next) && hasFreshGoogleLogin(next))
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  const user = session?.user ?? null
  const profileComplete = user?.user_metadata?.profile_complete === true
  // A password change needs a Google login from the last few minutes, after the client asked for it.
  const canChangePassword = Boolean(user) && passwordIntent && googleFresh

  async function startGoogle({ verify = false } = {}) {
    setError(''); setNotice('')
    storeIntent(verify); setPasswordIntent(verify)
    const { error: problem } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${window.location.pathname}`, queryParams: verify ? { prompt: 'login' } : undefined },
    })
    if (problem) { storeIntent(false); setPasswordIntent(false); setError('Could not start Google sign-in. Please try again.') }
  }
  async function signInWithPassword(email, password) {
    setError(''); setNotice('')
    const { error: problem } = await supabase.auth.signInWithPassword({ email: String(email).trim(), password })
    if (problem) throw new Error('Could not sign in. Check your email and password, or use Google.')
  }
  async function completeProfile({ firstName, lastName, password, confirm }) {
    const first = cleanName(firstName, 'first name'), last = cleanName(lastName, 'last name')
    checkPassword(password, confirm)
    const { data, error: problem } = await supabase.auth.updateUser({ password, data: { first_name: first, last_name: last, profile_complete: true } })
    if (problem) throw new Error('Your account could not be saved. Choose a different password, or try again in a moment.')
    setSession(current => current && { ...current, user: data.user })
    setNotice('Your account is ready.')
  }
  async function changePassword({ password, confirm }) {
    if (!canChangePassword || !hasFreshGoogleLogin(session)) {
      storeIntent(false); setPasswordIntent(false)
      throw new Error('For your security, confirm with Google again before changing your password.')
    }
    checkPassword(password, confirm)
    const { error: problem } = await supabase.auth.updateUser({ password })
    if (problem) throw new Error('The password could not be changed. Choose a different password, or try again in a moment.')
    storeIntent(false); setPasswordIntent(false)
    setNotice('Your password has been updated.')
  }
  function cancelPasswordChange() { storeIntent(false); setPasswordIntent(false) }
  async function signOut() {
    setError(''); setNotice('')
    storeIntent(false); setPasswordIntent(false)
    const { error: problem } = await supabase.auth.signOut()
    if (problem) setError('Sign-out failed. Please try again.')
  }
  return {
    available: Boolean(supabase), ready, user, profileComplete, canChangePassword, error, notice,
    returnedFromGoogle: RETURNED_FROM_GOOGLE,
    startGoogle, signInWithPassword, completeProfile, changePassword, cancelPasswordChange, signOut,
  }
}

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PRIVACY_VERSION } from '../legal/privacy'

export const MIN_PASSWORD = 10
const RESET_KEY = 'skee.client-reset' // non-secret marker: the client proved they own their email and is now choosing a new password
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

function storedReset() {
  try { return sessionStorage.getItem(RESET_KEY) === '1' } catch { return false }
}

function storeReset(on) {
  try { if (on) sessionStorage.setItem(RESET_KEY, '1'); else sessionStorage.removeItem(RESET_KEY) } catch { /* the marker is optional */ }
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
  const [ready, setReady] = useState(!supabase)
  const [error, setError] = useState(RETURNED_ERROR)
  const [notice, setNotice] = useState('')
  const [resetting, setResetting] = useState(storedReset)
  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null); setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => setSession(next ?? null))
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  const user = session?.user ?? null
  const profileComplete = user?.user_metadata?.profile_complete === true
  // True right after a forgotten-password check (Google or emailed code): the next step is a new password.
  const choosingPassword = Boolean(user) && resetting

  // reset = the client forgot their password: Google must ask for their login again, which proves they own the account.
  async function startGoogle({ reset = false } = {}) {
    setError(''); setNotice('')
    storeReset(reset); setResetting(reset)
    const { error: problem } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${window.location.pathname}`, queryParams: reset ? { prompt: 'login' } : undefined },
    })
    if (problem) { storeReset(false); setResetting(false); setError('Could not start Google sign-in. Please try again.') }
  }
  async function signInWithPassword(email, password) {
    setError(''); setNotice('')
    const { error: problem } = await supabase.auth.signInWithPassword({ email: String(email).trim(), password })
    if (problem) throw new Error('Wrong email or password.')
  }
  // Emails a 6-digit code to an existing account. Failures other than "too many requests" look like success on
  // purpose, so nobody can find out which email addresses have accounts.
  async function sendCode(email) {
    setError(''); setNotice('')
    const { error: problem } = await supabase.auth.signInWithOtp({ email: String(email).trim(), options: { shouldCreateUser: false } })
    if (problem?.status === 429) throw new Error('Too many requests. Please wait a minute, or confirm with Google instead.')
  }
  async function verifyCode(email, code) {
    const { error: problem } = await supabase.auth.verifyOtp({ email: String(email).trim(), token: String(code).replace(/\s/g, ''), type: 'email' })
    if (problem) throw new Error('That code is not right or has expired. Ask for a new one, or confirm with Google instead.')
    storeReset(true); setResetting(true)
  }
  async function completeProfile({ firstName, lastName, password, confirm, accepted }) {
    const first = cleanName(firstName, 'first name'), last = cleanName(lastName, 'last name')
    checkPassword(password, confirm)
    if (!accepted) throw new Error('Please read and accept the privacy notice to create your account.')
    const { data, error: problem } = await supabase.auth.updateUser({ password, data: { first_name: first, last_name: last, profile_complete: true, privacy_version: PRIVACY_VERSION, privacy_accepted_at: new Date().toISOString() } })
    if (problem) throw new Error('Your account could not be saved. Choose a different password, or try again in a moment.')
    setSession(current => current && { ...current, user: data.user })
    setNotice('Your account is ready.')
    // The welcome email is a nice-to-have: the send-email function sends it once per account; failures stay silent.
    supabase.functions.invoke('send-email', { body: { template: 'welcome' } }).catch(() => {})
  }
  async function changePassword({ password, confirm }) {
    checkPassword(password, confirm)
    const { error: problem } = await supabase.auth.updateUser({ password })
    if (problem) throw new Error('The password could not be changed. Choose a different password, or try again in a moment.')
    storeReset(false); setResetting(false)
    setNotice('Your password has been updated.')
  }
  function cancelPasswordChange() { storeReset(false); setResetting(false) }
  async function signOut() {
    setError(''); setNotice('')
    storeReset(false); setResetting(false)
    const { error: problem } = await supabase.auth.signOut()
    if (problem) setError('Sign-out failed. Please try again.')
  }
  return {
    available: Boolean(supabase), ready, user, profileComplete, choosingPassword, error, notice,
    returnedFromGoogle: RETURNED_FROM_GOOGLE,
    startGoogle, signInWithPassword, sendCode, verifyCode, completeProfile, changePassword, cancelPasswordChange, signOut,
  }
}

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { callWhatsApp } from '../lib/whatsappApi'

// The signed-in client's own profile row and how complete it is. Components that change the profile call
// announceProfileChange() so every other place showing it refreshes.
const EVENT = 'skee:profile-changed'
export const announceProfileChange = () => window.dispatchEvent(new Event(EVENT))

export function profileCompleteness(user, profile, verificationOn) {
  const steps = [
    { id: 'account', label: 'Name, email and password', weight: 50, done: user?.user_metadata?.profile_complete === true },
    { id: 'username', label: 'Username', weight: 10, done: Boolean(profile?.username) },
    { id: 'phone', label: 'WhatsApp number', weight: verificationOn ? 10 : 20, done: Boolean(profile?.phone) },
    ...(verificationOn ? [{ id: 'verified', label: 'Verified WhatsApp number', weight: 10, done: Boolean(profile?.phone_verified_at) }] : []),
    { id: 'photo', label: 'Profile photo', weight: 20, done: Boolean(profile?.avatar_path) },
  ]
  return { steps, percent: steps.reduce((sum, step) => sum + (step.done ? step.weight : 0), 0), next: steps.find(step => !step.done) || null }
}

async function fetchProfile(userId) {
  const [{ data }, enabled] = await Promise.all([
    supabase.from('client_profiles').select('*').eq('user_id', userId).maybeSingle(),
    callWhatsApp('enabled').catch(() => ({ verification: false })),
  ])
  return { profile: data || null, verificationOn: enabled.verification === true }
}

export default function useClientProfile(user) {
  const userId = user?.id
  const [state, setState] = useState({ profile: null, verificationOn: false, loaded: false })
  const refresh = useCallback(() => {
    if (!userId || !supabase) return
    fetchProfile(userId).then(result => setState({ ...result, loaded: true }))
  }, [userId])
  useEffect(() => {
    if (!userId || !supabase) return
    let active = true
    fetchProfile(userId).then(result => { if (active) setState({ ...result, loaded: true }) })
    const again = () => fetchProfile(userId).then(result => { if (active) setState({ ...result, loaded: true }) })
    window.addEventListener(EVENT, again)
    return () => { active = false; window.removeEventListener(EVENT, again) }
  }, [userId])
  return { ...state, refresh, ...profileCompleteness(user, state.profile, state.verificationOn) }
}

// A short-lived link to a photo in the private client-photos bucket.
export async function photoLink(path, seconds = 3600) {
  if (!path || !supabase) return ''
  const { data } = await supabase.storage.from('client-photos').createSignedUrl(path, seconds)
  return data?.signedUrl || ''
}

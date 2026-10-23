import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
export const sharedSettingsEnabled = Boolean(url || key)
export const passwordSetupCallback = ['invite', 'recovery'].includes(new URLSearchParams(window.location.hash.slice(1)).get('type'))
export let configurationError = ''

// Only a public/publishable key belongs in a browser bundle. Authorization is RLS.
if (sharedSettingsEnabled && (!url || !key?.startsWith('sb_publishable_'))) configurationError = 'Studio connection is incomplete. Configure the project URL and a publishable key.'
if (url && !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) configurationError = 'The studio project URL must be a valid Supabase HTTPS URL.'
export const supabase = sharedSettingsEnabled && !configurationError
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null

import { supabase } from './supabase'

// The `whatsapp` Edge Function: client number verification and the owner's WhatsApp connection.
const MESSAGES = {
  whatsapp_off: 'WhatsApp verification is not switched on yet.',
  no_phone: 'Save your WhatsApp number first.',
  too_many_codes: 'Too many codes in the last hour. Try again later.',
  not_configured: 'Fill in and save the connection details first.',
  bad_display_number: 'Check the business WhatsApp number.',
  bad_owner_alert_number: 'Check the alert number.',
  bad_phone_number_id: 'The Phone number ID is a long number from Meta (digits only).',
  bad_waba_id: 'The WhatsApp Business Account ID is a long number from Meta (digits only).',
  not_signed_in: 'Your sign-in has expired. Sign in again.',
  not_allowed: 'Only owners can do this.',
}

export async function callWhatsApp(action, body = {}) {
  if (!supabase) throw new Error('Not available.')
  const { data, error } = await supabase.functions.invoke('whatsapp', { body: { ...body, action } })
  if (!error) return data
  let code = 'server_error'
  try { code = (await error.context?.json())?.error || code } catch { /* not JSON */ }
  const problem = new Error(MESSAGES[code] || 'Something went wrong. Check your connection and try again.')
  problem.code = code
  throw problem
}

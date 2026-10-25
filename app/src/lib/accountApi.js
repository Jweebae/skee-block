import { supabase } from './supabase'

// The `account` Edge Function: usernames and signing in with a username (the email behind it stays private).
const MESSAGES = {
  wrong_login: 'Wrong username, email or password.',
  too_many_attempts: 'Too many wrong attempts. Wait 15 minutes, or sign in with your email or Google.',
  bad_username: 'Usernames use 3 to 30 lowercase letters, numbers, dots or underscores, and start and end with a letter or number.',
  username_taken: 'This username is taken. Choose another one, or leave it empty and we will create one.',
  not_signed_in: 'Your sign-in has expired. Sign in again.',
}

export async function callAccount(action, body = {}) {
  const { data, error } = await supabase.functions.invoke('account', { body: { ...body, action } })
  if (!error) return data
  let code = 'server_error'
  try { code = (await error.context?.json())?.error || code } catch { /* not JSON */ }
  const problem = new Error(MESSAGES[code] || 'Something went wrong. Check your connection and try again.')
  problem.code = code
  throw problem
}

// Same rule as the server: "Saïd Ben-Ali" → "said.benali"
const slug = text => String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
export function suggestUsername(first, last) {
  const base = [slug(first), slug(last)].filter(Boolean).join('.').slice(0, 26)
  return base.length >= 3 ? base : ''
}
export const USERNAME_PATTERN = '[a-zA-Z0-9][a-zA-Z0-9._]{1,28}[a-zA-Z0-9]'

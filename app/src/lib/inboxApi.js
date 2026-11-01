import { supabase } from './supabase'

// The `inbox` Edge Function: every read and write of a conversation goes through it.
const MESSAGES = {
  cannot_message: 'This client can’t receive messages.',
  you_blocked: 'You blocked this client. Unblock them to send a message.',
  no_username: 'Choose a username in your account first, so others know who is writing.',
  too_many_messages: 'You are sending a lot of messages. Wait a few minutes and try again.',
  empty_message: 'Write something first.',
  profile_incomplete: 'Finish creating your account first.',
  not_found: 'This conversation is not available.',
  not_signed_in: 'Your sign-in has expired. Sign in again.',
  not_allowed: 'Only owners can do this.',
}

export async function callInbox(action, body = {}) {
  if (!supabase) throw new Error('The inbox is not available here.')
  // `action` names the job and always comes last, so nothing in `body` can replace it.
  const { data, error } = await supabase.functions.invoke('inbox', { body: { ...body, action } })
  if (!error) return data
  let code = 'server_error'
  try { code = (await error.context?.json())?.error || code } catch { /* not JSON */ }
  const problem = new Error(MESSAGES[code] || 'Something went wrong. Check your connection and try again.')
  problem.code = code
  throw problem
}

// Reading or sending refreshes the unread badges straight away.
export const INBOX_CHANGED = 'skee:inbox-changed'
export const announceInboxChange = () => window.dispatchEvent(new Event(INBOX_CHANGED))

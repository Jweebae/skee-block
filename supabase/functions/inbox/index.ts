// The in-site inbox: conversations between clients, found by username, and each client's conversation with the studio.
// Browsers cannot touch these tables; every read and write comes through here, and each one checks the caller belongs to
// the conversation. Clients only ever see each other's usernames. Owners see a client-to-client conversation only after
// one of the two reports it. Emails say that a message arrived and never carry its text.
// Deployed with verify_jwt off: every action checks the caller's token here.
import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2'

const SITE = 'https://3kee.site'
const FROM = '3kee <contact@3kee.site>'
const TEMPLATE_URL = `${SITE}/email/templates/new-message.html`
const ORIGINS = ['https://3kee.site', 'https://www.3kee.site', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174']
const UUID = /^[0-9a-f-]{36}$/
const MAX_TEXT = 1000
const PREVIEW_LENGTH = 90
const MESSAGES_SHOWN = 200
const SEND_LIMIT = 30
const SEND_WINDOW_MINUTES = 10
const NEW_CHATS_PER_DAY = 10
const SEARCH_RESULTS = 8

class Problem extends Error {
  constructor(public status: number, public code: string) { super(code) }
}
function fail(status: number, code: string): never { throw new Problem(status, code) }

function cors(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(origin) ? origin : ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}
const reply = (req: Request, status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } })

// ---------- people ----------
async function caller(req: Request, db: SupabaseClient) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await db.auth.getUser(token)
  return error ? null : data.user
}
async function ownerIds(db: SupabaseClient) {
  const { data } = await db.from('studio_admins').select('user_id')
  return new Set((data ?? []).map(row => row.user_id))
}
async function usernamesOf(db: SupabaseClient, ids: (string | null)[]) {
  const wanted = [...new Set(ids.filter(Boolean))] as string[]
  if (!wanted.length) return {} as Record<string, string>
  const { data } = await db.from('client_profiles').select('user_id, username').in('user_id', wanted)
  return Object.fromEntries((data ?? []).map(row => [row.user_id, row.username])) as Record<string, string>
}
async function allAccounts(db: SupabaseClient) {
  const users: User[] = []
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) fail(500, 'read_failed')
    users.push(...data.users)
    if (data.users.length < 1000) return users
  }
}
const fullName = (user?: User) => [user?.user_metadata?.first_name, user?.user_metadata?.last_name].filter(Boolean).join(' ').trim() || user?.email?.split('@')[0] || 'Client'

// Usernames use lowercase letters, numbers, dots and underscores. In a search, an underscore must be taken literally.
const cleanSearch = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._]/g, '')
const likeAnywhere = (text: string) => `%${text.replace(/_/g, '\\_')}%`
// Usernames that start with what was typed come first.
const byRelevance = (wanted: string) => (a: any, b: any) => Number(b.username.startsWith(wanted)) - Number(a.username.startsWith(wanted)) || a.username.localeCompare(b.username)
const cleanText = (value: unknown) => String(value ?? '').trim().slice(0, MAX_TEXT)

// ---------- threads ----------
const sideOf = (thread: any, userId: string) => thread.client_a === userId ? 'a' : thread.client_b === userId ? 'b' : ''
const otherOf = (thread: any, userId: string) => thread.client_a === userId ? thread.client_b : thread.client_a
const newer = (at: string, seen: string | null) => !seen || new Date(at).getTime() > new Date(seen).getTime()

function unreadFor(thread: any, userId: string) {
  const mine = !thread.last_from_studio && thread.last_sender === userId
  return Boolean(thread.last_preview) && !mine && newer(thread.last_at, thread[`${sideOf(thread, userId)}_read_at`])
}
const unreadForStudio = (thread: any) => Boolean(thread.last_preview) && !thread.last_from_studio && newer(thread.last_at, thread.studio_read_at)

async function threadsOf(db: SupabaseClient, userId: string) {
  const [first, second] = await Promise.all([
    db.from('inbox_threads').select('*').eq('client_a', userId).order('last_at', { ascending: false }).limit(200),
    db.from('inbox_threads').select('*').eq('client_b', userId).order('last_at', { ascending: false }).limit(200),
  ])
  return [...(first.data ?? []), ...(second.data ?? [])]
}

async function myThread(db: SupabaseClient, user: User, id: unknown) {
  if (typeof id !== 'string' || !UUID.test(id)) fail(404, 'not_found')
  const { data } = await db.from('inbox_threads').select('*').eq('id', id).maybeSingle()
  if (!data || !sideOf(data, user.id)) fail(404, 'not_found')
  return data
}

async function messagesOf(db: SupabaseClient, threadId: string) {
  const { data } = await db.from('inbox_messages').select('id, sender_id, from_studio, body, created_at').eq('thread_id', threadId).order('created_at', { ascending: false }).limit(MESSAGES_SHOWN)
  return (data ?? []).reverse()
}

async function studioThread(db: SupabaseClient, clientId: string, createdBy: string) {
  const find = async () => (await db.from('inbox_threads').select('*').eq('kind', 'studio').eq('client_a', clientId).maybeSingle()).data
  const found = await find()
  if (found) return found
  const { data, error } = await db.from('inbox_threads').insert({ kind: 'studio', client_a: clientId, created_by: createdBy }).select().single()
  if (error?.code === '23505') return find()
  if (error) { console.error('thread failed', error); fail(500, 'save_failed') }
  return data
}

async function directThread(db: SupabaseClient, user: User, otherId: string) {
  const [client_a, client_b] = [user.id, otherId].sort()
  const find = async () => (await db.from('inbox_threads').select('*').eq('kind', 'direct').eq('client_a', client_a).eq('client_b', client_b).maybeSingle()).data
  const found = await find()
  if (found) return found
  const since = new Date(Date.now() - 86400000).toISOString()
  const { count } = await db.from('inbox_threads').select('id', { count: 'exact', head: true }).eq('created_by', user.id).eq('kind', 'direct').gt('created_at', since)
  if ((count ?? 0) >= NEW_CHATS_PER_DAY) fail(429, 'too_many_messages')
  const { data, error } = await db.from('inbox_threads').insert({ kind: 'direct', client_a, client_b, created_by: user.id }).select().single()
  if (error?.code === '23505') return find()
  if (error) { console.error('thread failed', error); fail(500, 'save_failed') }
  return data
}

// The same answer whether the other client switched messages off or blocked the sender, so a block stays private.
async function checkReachable(db: SupabaseClient, senderId: string, recipientId: string) {
  const [{ data: mine }, { data: theirs }, { data: profile }, owners] = await Promise.all([
    db.from('inbox_blocks').select('blocked').eq('blocker', senderId).eq('blocked', recipientId).maybeSingle(),
    db.from('inbox_blocks').select('blocked').eq('blocker', recipientId).eq('blocked', senderId).maybeSingle(),
    db.from('client_profiles').select('allow_messages, username').eq('user_id', recipientId).maybeSingle(),
    ownerIds(db),
  ])
  if (mine) fail(409, 'you_blocked')
  if (theirs || !profile?.username || profile.allow_messages === false || owners.has(recipientId)) fail(409, 'cannot_message')
}

async function postMessage(db: SupabaseClient, thread: any, senderId: string, fromStudio: boolean, text: string) {
  const { data: message, error } = await db.from('inbox_messages').insert({ thread_id: thread.id, sender_id: senderId, from_studio: fromStudio, body: text }).select().single()
  if (error) { console.error('message failed', error); fail(500, 'save_failed') }
  const seen = fromStudio ? { studio_read_at: message.created_at } : { [`${sideOf(thread, senderId)}_read_at`]: message.created_at }
  await db.from('inbox_threads').update({ last_at: message.created_at, last_preview: text.slice(0, PREVIEW_LENGTH), last_sender: senderId, last_from_studio: fromStudio, a_hidden: false, b_hidden: false, ...seen }).eq('id', thread.id)
  return message
}

// ---------- emails ----------
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const fill = (text: string, values: Record<string, string>, escape: (s: string) => string) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => escape(values[key] ?? ''))

async function sendEmail(to: string[], values: Record<string, string>, key: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey || !to.length) return
  try {
    const page = await fetch(TEMPLATE_URL)
    if (!page.ok) throw new Error(`template: ${page.status}`)
    const html = await page.text()
    const subject = html.match(/<title>([^<]*)<\/title>/)?.[1]
    if (!subject) throw new Error('template: no subject')
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
      body: JSON.stringify({ from: FROM, to, subject: fill(subject, values, s => s.replace(/[\r\n]+/g, ' ')), html: fill(html, values, escapeHtml) }),
    })
    if (!sent.ok) throw new Error(`resend ${sent.status}: ${await sent.text()}`)
  } catch (problem) {
    console.error('email failed', problem) // the message itself is already saved
  }
}

const messageEmail = (sender: string) => ({ subject_line: `New message from ${sender} on 3kee`, headline: 'You have a message.', line: `${sender} sent you a message on 3kee.` })
const reportEmail = { subject_line: 'A conversation was reported on 3kee', headline: 'A conversation was reported.', line: 'a client reported a conversation in the inbox. You can read it now and decide what to do.' }

async function emailClient(db: SupabaseClient, clientId: string, sender: string, key: string) {
  const [{ data: studio }, { data: profile }] = await Promise.all([
    db.from('studio_private').select('client_emails').eq('id', 'main').maybeSingle(),
    db.from('client_profiles').select('email_notifications').eq('user_id', clientId).maybeSingle(),
  ])
  if (studio?.client_emails === false || profile?.email_notifications === false) return
  const { data: found } = await db.auth.admin.getUserById(clientId)
  if (found?.user?.email) await sendEmail([found.user.email], { ...messageEmail(sender), first_name: found.user.user_metadata?.first_name || 'there', inbox_url: `${SITE}/#inbox` }, key)
}

async function emailOwners(db: SupabaseClient, content: Record<string, string>, key: string) {
  const { data: studio } = await db.from('studio_private').select('owner_alerts').eq('id', 'main').maybeSingle()
  if (studio?.owner_alerts === false) return
  const emails: string[] = []
  for (const id of await ownerIds(db)) {
    const { data: found } = await db.auth.admin.getUserById(id)
    if (found?.user?.email) emails.push(found.user.email)
  }
  await sendEmail(emails, { ...content, first_name: 'Skee', inbox_url: `${SITE}/#admin` }, key)
}

// ---------- client actions ----------
function summary(thread: any, userId: string, names: Record<string, string>, blocked: Set<string>) {
  const other = thread.kind === 'direct' ? otherOf(thread, userId) : null
  return {
    id: thread.id, kind: thread.kind, name: thread.kind === 'studio' ? 'Skee' : names[other] || 'Former client', preview: thread.last_preview, last_at: thread.last_at,
    last_mine: !thread.last_from_studio && thread.last_sender === userId, unread: unreadFor(thread, userId), blocked: blocked.has(other), reported: thread.reported_by === userId && !thread.report_closed_at,
  }
}

async function myBlocks(db: SupabaseClient, userId: string) {
  const { data } = await db.from('inbox_blocks').select('blocked').eq('blocker', userId)
  return new Set((data ?? []).map(row => row.blocked))
}

async function listThreads(db: SupabaseClient, user: User) {
  const shown = (await threadsOf(db, user.id)).filter(thread => thread.last_preview && !thread[`${sideOf(thread, user.id)}_hidden`])
    .sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime())
  const [names, blocked, { data: me }] = await Promise.all([
    usernamesOf(db, shown.map(thread => (thread.kind === 'direct' ? otherOf(thread, user.id) : null))),
    myBlocks(db, user.id),
    db.from('client_profiles').select('username, allow_messages').eq('user_id', user.id).maybeSingle(),
  ])
  return { threads: shown.map(thread => summary(thread, user.id, names, blocked)), username: me?.username ?? null, allow_messages: me?.allow_messages !== false }
}

async function unreadCount(db: SupabaseClient, user: User) {
  const threads = await threadsOf(db, user.id)
  return { unread: threads.filter(thread => !thread[`${sideOf(thread, user.id)}_hidden`] && unreadFor(thread, user.id)).length }
}

async function openThread(db: SupabaseClient, user: User, body: any) {
  const thread = body.studio ? (await db.from('inbox_threads').select('*').eq('kind', 'studio').eq('client_a', user.id).maybeSingle()).data : await myThread(db, user, body.id)
  if (!thread) return { thread: null, messages: [] }
  const messages = await messagesOf(db, thread.id)
  await db.from('inbox_threads').update({ [`${sideOf(thread, user.id)}_read_at`]: new Date().toISOString() }).eq('id', thread.id)
  const names = await usernamesOf(db, [thread.kind === 'direct' ? otherOf(thread, user.id) : null])
  return {
    thread: summary({ ...thread, [`${sideOf(thread, user.id)}_read_at`]: new Date().toISOString() }, user.id, names, await myBlocks(db, user.id)),
    messages: messages.map(item => ({ id: item.id, mine: !item.from_studio && item.sender_id === user.id, from_studio: item.from_studio, body: item.body, created_at: item.created_at })),
  }
}

// Suggestions from the first letter. An owner's username is listed too, and leads to the conversation with Skee, so a
// client always reaches the studio in one place. `studio` names those results.
async function searchClients(db: SupabaseClient, user: User, body: any) {
  const wanted = cleanSearch(body.q)
  if (!wanted) return { results: [], studio: [], self: false }
  const { data } = await db.from('client_profiles').select('user_id, username, allow_messages').ilike('username', likeAnywhere(wanted)).limit(50)
  const [owners, { data: blockedMe }] = await Promise.all([ownerIds(db), db.from('inbox_blocks').select('blocker').eq('blocked', user.id)])
  const hidden = new Set((blockedMe ?? []).map(row => row.blocker))
  const found = (data ?? []).filter(row => row.username && row.user_id !== user.id && !hidden.has(row.user_id) && (owners.has(row.user_id) || row.allow_messages !== false))
    .sort(byRelevance(wanted)).slice(0, SEARCH_RESULTS)
  return { results: found.map(row => row.username), studio: found.filter(row => owners.has(row.user_id)).map(row => row.username), self: (data ?? []).some(row => row.user_id === user.id && row.username === wanted) }
}

async function send(db: SupabaseClient, user: User, body: any) {
  if (user.user_metadata?.profile_complete !== true) fail(409, 'profile_incomplete')
  const text = cleanText(body.body)
  if (!text) fail(400, 'empty_message')
  const since = new Date(Date.now() - SEND_WINDOW_MINUTES * 60000).toISOString()
  const { count } = await db.from('inbox_messages').select('id', { count: 'exact', head: true }).eq('sender_id', user.id).gt('created_at', since)
  if ((count ?? 0) >= SEND_LIMIT) fail(429, 'too_many_messages')
  const { data: me } = await db.from('client_profiles').select('username').eq('user_id', user.id).maybeSingle()

  let thread
  if (body.studio) thread = await studioThread(db, user.id, user.id)
  else if (body.id) thread = await myThread(db, user, body.id)
  else {
    if (!me?.username) fail(409, 'no_username')
    const { data: target } = await db.from('client_profiles').select('user_id').eq('username', cleanSearch(body.to)).maybeSingle()
    if (!target || target.user_id === user.id) fail(409, 'cannot_message')
    if ((await ownerIds(db)).has(target!.user_id)) thread = await studioThread(db, user.id, user.id)
    else {
      await checkReachable(db, user.id, target!.user_id)
      thread = await directThread(db, user, target!.user_id)
    }
  }
  const recipient = thread.kind === 'direct' ? otherOf(thread, user.id) : null
  if (recipient) await checkReachable(db, user.id, recipient)

  // One email per unread stretch: a client who already has an unread message here is not emailed again.
  const alreadyWaiting = recipient ? unreadFor(thread, recipient) : unreadForStudio(thread)
  const message = await postMessage(db, thread, user.id, false, text)
  if (!alreadyWaiting) {
    if (recipient) await emailClient(db, recipient, me?.username || 'A client', `message-${message.id}`)
    else await emailOwners(db, messageEmail(me?.username || 'A client'), `message-${message.id}`)
  }
  return { id: thread.id }
}

async function setBlock(db: SupabaseClient, user: User, body: any) {
  const thread = await myThread(db, user, body.id)
  if (thread.kind !== 'direct') fail(400, 'bad_action')
  const other = otherOf(thread, user.id)
  if (body.blocked === false) await db.from('inbox_blocks').delete().eq('blocker', user.id).eq('blocked', other)
  else await db.from('inbox_blocks').upsert({ blocker: user.id, blocked: other })
  return { ok: true }
}

async function report(db: SupabaseClient, user: User, body: any) {
  const thread = await myThread(db, user, body.id)
  if (thread.kind !== 'direct') fail(400, 'bad_action')
  await db.from('inbox_threads').update({ reported_by: user.id, report_reason: String(body.reason ?? '').trim().slice(0, 300), reported_at: new Date().toISOString(), report_closed_at: null }).eq('id', thread.id)
  await emailOwners(db, reportEmail, `report-${thread.id}-${Date.now()}`)
  return { ok: true }
}

async function hide(db: SupabaseClient, user: User, body: any) {
  const thread = await myThread(db, user, body.id)
  if (thread.kind !== 'direct') fail(400, 'bad_action')
  await db.from('inbox_threads').update({ [`${sideOf(thread, user.id)}_hidden`]: true }).eq('id', thread.id)
  return { ok: true }
}

async function settings(db: SupabaseClient, user: User, body: any) {
  const { error } = await db.from('client_profiles').update({ allow_messages: body.allowMessages === true }).eq('user_id', user.id)
  if (error) fail(500, 'save_failed')
  return { allow_messages: body.allowMessages === true }
}

// ---------- owner actions ----------
const clientCard = (user: User | undefined, username: string | undefined) => ({ client_id: user?.id ?? null, name: fullName(user), username: username ?? null, email: user?.email ?? null })

async function ownerThreads(db: SupabaseClient) {
  const [{ data: studio }, { data: reports }, accounts] = await Promise.all([
    db.from('inbox_threads').select('*').eq('kind', 'studio').neq('last_preview', '').order('last_at', { ascending: false }).limit(300),
    db.from('inbox_threads').select('*').eq('kind', 'direct').not('reported_at', 'is', null).is('report_closed_at', null).order('reported_at', { ascending: false }).limit(100),
    allAccounts(db),
  ])
  const accountOf = new Map(accounts.map(user => [user.id, user]))
  const names = await usernamesOf(db, [...(studio ?? []).map(row => row.client_a), ...(reports ?? []).flatMap(row => [row.client_a, row.client_b])])
  return {
    threads: (studio ?? []).map(row => ({ id: row.id, ...clientCard(accountOf.get(row.client_a), names[row.client_a]), preview: row.last_preview, last_at: row.last_at, last_mine: row.last_from_studio, unread: unreadForStudio(row) })),
    reports: (reports ?? []).map(row => ({ id: row.id, people: [names[row.client_a] || 'Former client', names[row.client_b] || 'Former client'], reported_by: names[row.reported_by] || 'A client', reason: row.report_reason, reported_at: row.reported_at })),
  }
}

async function ownerUnread(db: SupabaseClient) {
  const { data } = await db.from('inbox_threads').select('last_at, last_preview, last_from_studio, studio_read_at').eq('kind', 'studio').neq('last_preview', '').order('last_at', { ascending: false }).limit(300)
  const { count } = await db.from('inbox_threads').select('id', { count: 'exact', head: true }).eq('kind', 'direct').not('reported_at', 'is', null).is('report_closed_at', null)
  return { unread: (data ?? []).filter(unreadForStudio).length + (count ?? 0) }
}

async function clientForOwner(db: SupabaseClient, clientId: unknown) {
  if (typeof clientId !== 'string' || !UUID.test(clientId)) fail(404, 'not_found')
  const { data: found } = await db.auth.admin.getUserById(clientId)
  if (!found?.user) fail(404, 'not_found')
  const names = await usernamesOf(db, [clientId])
  return { ...clientCard(found.user, names[clientId]) }
}

async function ownerOpen(db: SupabaseClient, body: any) {
  const clientId = body.clientId
  const thread = clientId
    ? (await db.from('inbox_threads').select('*').eq('kind', 'studio').eq('client_a', clientId).maybeSingle()).data
    : (await db.from('inbox_threads').select('*').eq('id', body.id).maybeSingle()).data
  if (!thread) return { thread: null, client: await clientForOwner(db, clientId), messages: [] }
  // A conversation between two clients stays closed unless one of them reported it.
  if (thread.kind === 'direct' && !thread.reported_at) fail(404, 'not_found')
  const messages = await messagesOf(db, thread.id)
  const names = await usernamesOf(db, messages.map(item => item.sender_id))
  if (thread.kind === 'studio') await db.from('inbox_threads').update({ studio_read_at: new Date().toISOString() }).eq('id', thread.id)
  return {
    thread: { id: thread.id, kind: thread.kind },
    client: thread.kind === 'studio' ? await clientForOwner(db, thread.client_a) : null,
    messages: messages.map(item => ({ id: item.id, mine: item.from_studio, from_studio: item.from_studio, who: item.from_studio ? 'Skee' : names[item.sender_id] || 'Former client', body: item.body, created_at: item.created_at })),
  }
}

async function ownerSearch(db: SupabaseClient, user: User, body: any) {
  const wanted = cleanSearch(body.q)
  if (!wanted) return { results: [], self: false }
  const { data } = await db.from('client_profiles').select('user_id, username').ilike('username', likeAnywhere(wanted)).limit(50)
  const found = (data ?? []).filter(row => row.username && row.user_id !== user.id).sort(byRelevance(wanted)).slice(0, SEARCH_RESULTS)
  return { results: found.map(row => ({ client_id: row.user_id, username: row.username })), self: (data ?? []).some(row => row.user_id === user.id && row.username === wanted) }
}

// An owner writes as the studio and can reach any client, including one who switched off messages from other clients.
async function ownerSend(db: SupabaseClient, user: User, body: any) {
  const text = cleanText(body.body)
  if (!text) fail(400, 'empty_message')
  if (body.clientId === user.id) fail(409, 'cannot_message')
  const client = await clientForOwner(db, body.clientId)
  const thread = await studioThread(db, client.client_id!, user.id)
  const alreadyWaiting = unreadFor(thread, client.client_id!)
  const message = await postMessage(db, thread, user.id, true, text)
  if (!alreadyWaiting) await emailClient(db, client.client_id!, 'Skee', `message-${message.id}`)
  return { id: thread.id }
}

async function ownerCloseReport(db: SupabaseClient, body: any) {
  if (typeof body.id !== 'string' || !UUID.test(body.id)) fail(400, 'bad_action')
  await db.from('inbox_threads').update({ report_closed_at: new Date().toISOString() }).eq('id', body.id).eq('kind', 'direct')
  return { ok: true }
}

// ---------- router ----------
const CLIENT_ACTIONS: Record<string, (db: SupabaseClient, user: User, body: any) => Promise<unknown>> = {
  threads: listThreads, unread: unreadCount, open: openThread, search: searchClients, send, block: setBlock, report, hide, settings,
}
const OWNER_ACTIONS: Record<string, (db: SupabaseClient, user: User, body: any) => Promise<unknown>> = {
  owner_threads: db => ownerThreads(db), owner_unread: db => ownerUnread(db), owner_open: (db, _, body) => ownerOpen(db, body), owner_search: ownerSearch,
  owner_send: ownerSend, owner_close_report: (db, _, body) => ownerCloseReport(db, body),
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) })
  if (req.method !== 'POST') return reply(req, 405, { error: 'method_not_allowed' })
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body.action ?? '')
    const user = await caller(req, db)
    if (!user?.email) fail(401, 'not_signed_in')
    if (Object.hasOwn(CLIENT_ACTIONS, action)) return reply(req, 200, await CLIENT_ACTIONS[action](db, user!, body))
    if (!Object.hasOwn(OWNER_ACTIONS, action)) fail(400, 'unknown_action')
    if (!(await ownerIds(db)).has(user!.id)) fail(403, 'not_allowed')
    return reply(req, 200, await OWNER_ACTIONS[action](db, user!, body))
  } catch (problem) {
    if (problem instanceof Problem) return reply(req, problem.status, { error: problem.code })
    console.error('inbox failed', problem)
    return reply(req, 500, { error: 'server_error' })
  }
})

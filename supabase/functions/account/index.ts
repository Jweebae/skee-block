// Client usernames. A client may sign in with their email or their username; the email behind a username is never
// sent to the browser. Usernames are set here only (format, reserved words, uniqueness), or created from the
// client's name when they leave the field empty.
// Deployed with verify_jwt off: sign-in by username has no token yet; the other actions check the caller's token.
import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2'

const ORIGINS = ['https://3kee.site', 'https://www.3kee.site', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174']
const FORMAT = /^[a-z0-9]([a-z0-9._]{1,28})[a-z0-9]$/
const RESERVED = new Set(['admin', 'owner', 'skee', 'skeeblock', '3kee', 'said', 'support', 'contact', 'studio', 'root', 'system', 'help'])
const MAX_FAILED = 5
const WINDOW_MINUTES = 15

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

// "Saïd Ben-Ali" → "said.benali"
const slug = (text: unknown) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const clean = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/^@/, '')
const valid = (name: string) => FORMAT.test(name) && !name.includes('..') && !RESERVED.has(name.replace(/[._]/g, ''))

async function caller(req: Request, db: SupabaseClient) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await db.auth.getUser(token)
  return error ? null : data.user
}

async function isFree(db: SupabaseClient, name: string, userId: string) {
  const { data } = await db.from('client_profiles').select('user_id').eq('username', name).maybeSingle()
  return !data || data.user_id === userId
}

async function suggest(db: SupabaseClient, user: User) {
  const first = slug(user.user_metadata?.first_name) || slug(user.email?.split('@')[0]) || 'client'
  const last = slug(user.user_metadata?.last_name)
  const base = (last ? `${first}.${last}` : first).slice(0, 26).replace(/[._]+$/, '')
  const start = base.length >= 3 ? base : `${base}.3kee`
  if (valid(start) && await isFree(db, start, user.id)) return start
  for (let i = 0; i < 20; i++) {
    const candidate = `${start.slice(0, 25)}${Math.floor(10 + Math.random() * 990)}`
    if (valid(candidate) && await isFree(db, candidate, user.id)) return candidate
  }
  return `client${Date.now().toString().slice(-8)}`
}

async function setUsername(db: SupabaseClient, user: User, body: any) {
  const wanted = clean(body.username)
  let name: string
  if (wanted) {
    if (!valid(wanted)) fail(400, 'bad_username')
    if (!await isFree(db, wanted, user.id)) fail(409, 'username_taken')
    name = wanted
  } else {
    const { data } = await db.from('client_profiles').select('username').eq('user_id', user.id).maybeSingle()
    if (data?.username) return { username: data.username }
    name = await suggest(db, user)
  }
  const { error } = await db.from('client_profiles').upsert({ user_id: user.id, username: name, updated_at: new Date().toISOString() })
  if (error?.code === '23505') fail(409, 'username_taken')
  if (error) { console.error(error); fail(500, 'save_failed') }
  return { username: name }
}

async function checkUsername(db: SupabaseClient, user: User, body: any) {
  const wanted = clean(body.username)
  if (!valid(wanted)) return { available: false, reason: 'bad_username' }
  return { available: await isFree(db, wanted, user.id) }
}

async function usernameLogin(db: SupabaseClient, body: any) {
  const name = clean(body.username)
  const password = String(body.password ?? '')
  if (!name || !password) fail(400, 'wrong_login')
  const since = new Date(Date.now() - WINDOW_MINUTES * 60000).toISOString()
  const { count } = await db.from('login_attempts').select('id', { count: 'exact', head: true }).eq('username', name).eq('succeeded', false).gt('at', since)
  if ((count ?? 0) >= MAX_FAILED) fail(429, 'too_many_attempts')
  const { data: profile } = await db.from('client_profiles').select('user_id').eq('username', name).maybeSingle()
  const found = profile ? (await db.auth.admin.getUserById(profile.user_id)).data.user : null
  // A separate client, so this sign-in never touches the service connection.
  const signer = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } })
  const result = found?.email ? await signer.auth.signInWithPassword({ email: found.email, password }) : null
  const session = result?.data?.session
  await db.from('login_attempts').insert({ username: name, succeeded: Boolean(session) })
  if (!session) fail(400, 'wrong_login') // same answer whether or not the username exists
  return { access_token: session.access_token, refresh_token: session.refresh_token }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) })
  if (req.method !== 'POST') return reply(req, 405, { error: 'method_not_allowed' })
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body.action ?? '')
    if (action === 'login') return reply(req, 200, await usernameLogin(db, body))
    const user = await caller(req, db)
    if (!user) fail(401, 'not_signed_in')
    if (action === 'set_username') return reply(req, 200, await setUsername(db, user!, body))
    if (action === 'check_username') return reply(req, 200, await checkUsername(db, user!, body))
    fail(400, 'unknown_action')
  } catch (problem) {
    if (problem instanceof Problem) return reply(req, problem.status, { error: problem.code })
    console.error('account failed', problem)
    return reply(req, 500, { error: 'server_error' })
  }
})

import { useCallback, useEffect, useState } from 'react'
import logo from '../assets/skee-logo-white.svg'
import { announceInboxChange, callInbox } from '../lib/inboxApi'
import { algiersParts, dayLabel } from '../lib/bookingsApi'
import Conversation from './Conversation'
import UsernameSearch from './UsernameSearch'
import './Inbox.css'

// The client's inbox. Other clients appear by username only: never their email, number or photo.
const LIST_MS = 30000
const THREAD_MS = 15000
const shortWhen = value => (algiersParts(value).date === algiersParts(new Date()).date ? algiersParts(value).time : dayLabel(value, { day: 'numeric', month: 'short' }))
const SKEE = { kind: 'studio', studio: true, name: 'Skee' }

async function searchUsernames(q) {
  const data = await callInbox('search', { q })
  return { self: data.self, results: data.results.map(username => ({ username, studio: data.studio?.includes(username) })) }
}

function ThreadTools({ thread, onChanged, onDeleted }) {
  const [mode, setMode] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  async function run(action, body, done) {
    setError('')
    try { await callInbox(action, { id: thread.id, ...body }); setMode(''); done() } catch (problem) { setError(problem.message) }
  }
  if (mode === 'report') return <form className="inbox-confirm" onSubmit={event => { event.preventDefault(); run('report', { reason }, onChanged) }}>
    <p>Skee will be able to read this whole conversation.</p>
    <label className="visually-hidden" htmlFor="inbox-report">What happened?</label><input id="inbox-report" maxLength={300} value={reason} placeholder="What happened? (optional)" onChange={event => setReason(event.target.value)} />
    <span><button type="submit">Report to Skee</button><button type="button" onClick={() => setMode('')}>Keep it private</button></span>
    {error && <small role="alert">{error}</small>}
  </form>
  if (mode === 'delete') return <div className="inbox-confirm"><p>This removes it from your inbox only.</p><span><button type="button" onClick={() => run('hide', {}, onDeleted)}>Delete for me</button><button type="button" onClick={() => setMode('')}>Keep it</button></span></div>
  return <>
    <button type="button" onClick={() => run('block', { blocked: !thread.blocked }, onChanged)}>{thread.blocked ? 'Unblock' : 'Block'}</button>
    {thread.reported ? <span className="inbox-reported">Reported</span> : <button type="button" onClick={() => setMode('report')}>Report</button>}
    <button type="button" onClick={() => setMode('delete')}>Delete</button>
    {error && <small role="alert">{error}</small>}
  </>
}

export default function InboxPage({ client, onClose, onSignIn }) {
  const signedIn = Boolean(client.user && client.profileComplete)
  const [list, setList] = useState({ threads: null, username: null, allow_messages: true })
  const [listVersion, setListVersion] = useState(0)
  const [selected, setSelected] = useState(null)
  const [open, setOpen] = useState({ key: '', thread: null, messages: [] })
  const [openVersion, setOpenVersion] = useState(0)
  const [error, setError] = useState('')
  const key = selected ? selected.id || selected.to || 'studio' : ''

  useEffect(() => {
    if (!signedIn) return
    let active = true
    const load = () => { if (!document.hidden) callInbox('threads').then(data => { if (active) { setList(data); setError('') } }).catch(problem => { if (active) setError(problem.message) }) }
    load()
    const timer = setInterval(load, LIST_MS)
    return () => { active = false; clearInterval(timer) }
  }, [signedIn, listVersion])

  useEffect(() => {
    if (!selected || selected.to) return
    let active = true
    const load = () => {
      if (document.hidden) return
      callInbox('open', selected.studio ? { studio: true } : { id: selected.id })
        .then(data => { if (active) { setOpen({ key, thread: data.thread, messages: data.messages }); announceInboxChange() } })
        .catch(problem => { if (active) setError(problem.message) })
    }
    load()
    const timer = setInterval(load, THREAD_MS)
    return () => { active = false; clearInterval(timer) }
  }, [selected, key, openVersion])

  const refresh = useCallback(() => { setListVersion(value => value + 1); setOpenVersion(value => value + 1) }, [])
  function choose(next) { setError(''); setSelected(next) }
  function pickUsername({ username, studio }) {
    if (studio) { choose({ studio: true }); return }
    const existing = list.threads?.find(thread => thread.kind === 'direct' && thread.name === username)
    choose(existing ? { id: existing.id } : { to: username })
  }
  async function send(text) {
    const data = await callInbox('send', selected.studio ? { studio: true, body: text } : selected.id ? { id: selected.id, body: text } : { to: selected.to, body: text })
    if (!selected.id && !selected.studio) setSelected({ id: data.id })
    refresh()
  }
  async function toggleAllow(event) {
    const allowMessages = event.target.checked
    try { await callInbox('settings', { allowMessages }); setList(current => ({ ...current, allow_messages: allowMessages })) } catch (problem) { setError(problem.message) }
  }

  const skeeThread = list.threads?.find(thread => thread.kind === 'studio')
  const others = list.threads?.filter(thread => thread.kind === 'direct') || []
  const shown = open.key === key ? open : { thread: null, messages: [] }
  const current = shown.thread
  const title = selected?.to || (selected?.studio ? 'Skee' : current?.name || '…')
  const row = (item, next, active) => <li key={item.id || item.name}><button type="button" aria-current={active ? 'true' : undefined} data-unread={Boolean(item.unread)} onClick={() => choose(next)}>
    <i aria-hidden="true">{item.name.charAt(0).toUpperCase()}</i>
    <span><b>{item.name}</b><small>{item.preview ? `${item.last_mine ? 'You: ' : ''}${item.preview}` : 'Ask Skee anything'}</small></span>
    {item.last_at && <time dateTime={item.last_at}>{shortWhen(item.last_at)}</time>}
    {item.unread && <em><span className="visually-hidden">Unread</span></em>}
  </button></li>

  return <div className="inbox-page">
    <header className="inbox-header"><a href="#top" className="inbox-brand" onClick={event => { event.preventDefault(); onClose() }}><img src={logo} alt="SKEE" /><span>Inbox</span></a><div><a className="inbox-link" href="#account">My account</a><button type="button" className="inbox-link" onClick={onClose}>Home</button></div></header>
    {!client.ready ? <p className="inbox-note inbox-center">Checking your sign-in…</p> : !signedIn ? <section className="inbox-center"><h1 className="serif">Your <em>inbox</em>.</h1><p>Sign in to read and send messages.</p><button type="button" className="inbox-primary" onClick={onSignIn}>Sign in</button></section> : <main className="inbox-main" data-open={Boolean(selected)}>
      <aside className="inbox-list" aria-label="Conversations">
        <h1 className="serif">Inbox</h1>
        <UsernameSearch search={searchUsernames} onPick={pickUsername} />
        {error && !selected && <p className="inbox-error" role="alert">{error}</p>}
        <ul className="inbox-threads">
          {row(skeeThread || SKEE, { studio: true }, Boolean(selected?.studio))}
          {others.map(item => row(item, { id: item.id }, selected?.id === item.id))}
        </ul>
        {list.threads && !others.length && <p className="inbox-note">Search a username to write to another client.</p>}
        <label className="inbox-allow"><input type="checkbox" checked={list.allow_messages} onChange={toggleAllow} /><span>Let other clients find and message me<small>{list.username ? `Other clients see you as ${list.username}. ` : ''}<a href="#account">{list.username ? 'Change it in My account' : 'Choose a username in My account'}</a>. Skee can always message you.</small></span></label>
        <p className="inbox-privacy">Other clients only see your username. Conversations between clients are private: Skee can read one only if one of you reports it.</p>
      </aside>
      {selected ? <Conversation key={key} title={title} subtitle={selected.studio ? 'Skee Block' : 'Client'} messages={shown.messages} loading={!selected.to && open.key !== key} onBack={() => choose(null)}
        closedNote={current?.blocked ? 'You blocked this client. Unblock them to write again.' : ''}
        tools={current?.kind === 'direct' ? <ThreadTools key={`${current.id}-${current.blocked}-${current.reported}`} thread={current} onChanged={refresh} onDeleted={() => { choose(null); setListVersion(value => value + 1) }} /> : null}
        onSend={send} /> : <section className="inbox-empty"><p>Choose a conversation, or search a username to start one.</p></section>}
    </main>}
  </div>
}

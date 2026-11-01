import { useEffect, useState } from 'react'
import { announceInboxChange, callInbox } from '../lib/inboxApi'
import { algiersParts, dayLabel } from '../lib/bookingsApi'
import Conversation from '../inbox/Conversation'
import UsernameSearch from '../inbox/UsernameSearch'
import '../inbox/Inbox.css'
import './StudioBook.css'

// Owners write as Skee and can reach any client, by username or from the Clients page. Conversations between clients stay
// closed: one appears here only after a client reports it, and it can be read but not answered.
const REFRESH_MS = 20000
const when = value => `${dayLabel(value, { day: 'numeric', month: 'short' })} · ${algiersParts(value).time}`
const searchUsernames = q => callInbox('owner_search', { q })

export default function InboxManager({ headingRef, target }) {
  const [list, setList] = useState({ threads: null, reports: [] })
  const [listVersion, setListVersion] = useState(0)
  const [selected, setSelected] = useState(() => (target ? { clientId: target } : null))
  const [open, setOpen] = useState({ key: '', thread: null, client: null, messages: [] })
  const [openVersion, setOpenVersion] = useState(0)
  const [error, setError] = useState('')
  const key = selected ? selected.id || selected.clientId : ''

  useEffect(() => {
    let active = true
    const load = () => { if (!document.hidden) callInbox('owner_threads').then(data => { if (active) { setList(data); setError('') } }).catch(problem => { if (active) setError(problem.message) }) }
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => { active = false; clearInterval(timer) }
  }, [listVersion])

  useEffect(() => {
    if (!selected) return
    let active = true
    const load = () => {
      if (document.hidden) return
      callInbox('owner_open', selected.id ? { id: selected.id } : { clientId: selected.clientId })
        .then(data => { if (active) { setOpen({ key, ...data }); announceInboxChange() } })
        .catch(problem => { if (active) setError(problem.message) })
    }
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => { active = false; clearInterval(timer) }
  }, [selected, key, openVersion])

  const refresh = () => { setListVersion(value => value + 1); setOpenVersion(value => value + 1) }
  async function send(text) {
    await callInbox('owner_send', { clientId: open.client?.client_id || selected.clientId, body: text })
    refresh()
  }
  async function closeReport(id) {
    try { await callInbox('owner_close_report', { id }); setSelected(null); refresh() } catch (problem) { setError(problem.message) }
  }

  const shown = open.key === key ? open : { thread: null, client: null, messages: [] }
  const isReport = shown.thread?.kind === 'direct'
  const report = list.reports.find(item => item.id === selected?.id)
  const title = isReport ? (report?.people.join(' and ') || 'Reported conversation') : shown.client?.name || '…'
  const subtitle = isReport ? 'Reported conversation' : [shown.client?.username, shown.client?.email].filter(Boolean).join(' · ')

  return <>
    <div className="admin-title-row"><div><span className="lbl">Skee Block · Messages</span><h1 className="serif" ref={headingRef} tabIndex={-1}>Inbox</h1><p>Write to any client by username, or press Message on their line in Clients. Clients see you as Skee. Conversations between clients stay private unless one of them reports it.</p></div></div>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <div className="admin-inbox">
      <aside className="inbox-list" aria-label="Conversations">
        <UsernameSearch search={searchUsernames} onPick={item => setSelected({ clientId: item.client_id })} />
        {list.reports.length > 0 && <div className="inbox-reports"><span className="lbl">Reported · {list.reports.length}</span><ul className="inbox-threads">{list.reports.map(item => <li key={item.id}><button type="button" aria-current={selected?.id === item.id ? 'true' : undefined} data-unread="true" onClick={() => setSelected({ id: item.id })}><i aria-hidden="true">!</i><span><b>{item.people.join(' and ')}</b><small>By {item.reported_by}{item.reason ? `: ${item.reason}` : ''}</small></span></button></li>)}</ul></div>}
        {list.threads === null ? !error && <p className="inbox-note">Loading messages…</p> : list.threads.length ? <ul className="inbox-threads">{list.threads.map(item => <li key={item.id}><button type="button" aria-current={selected?.id === item.id ? 'true' : undefined} data-unread={item.unread} onClick={() => setSelected({ id: item.id })}><i aria-hidden="true">{item.name.charAt(0).toUpperCase()}</i><span><b>{item.name}</b><small>{item.last_mine ? 'You: ' : ''}{item.preview}</small></span><time dateTime={item.last_at}>{when(item.last_at)}</time>{item.unread && <em><span className="visually-hidden">Unread</span></em>}</button></li>)}</ul> : <p className="inbox-note">No messages yet.</p>}
      </aside>
      {selected ? <Conversation key={key} title={title} subtitle={subtitle} messages={shown.messages} loading={open.key !== key} showNames={isReport} onSend={send} placeholder="Write as Skee"
        closedNote={isReport ? `Reported by ${report?.reported_by || 'a client'}${report?.reason ? `: ${report.reason}` : ''}. You can read this conversation, but not write in it.` : ''}
        tools={isReport ? <button type="button" onClick={() => closeReport(selected.id)}>Close the report</button> : null} /> : <section className="inbox-empty"><p>Choose a conversation, or search a username.</p></section>}
    </div>
  </>
}

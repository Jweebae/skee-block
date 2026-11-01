import { useEffect, useRef, useState } from 'react'
import { algiersParts, dayLabel } from '../lib/bookingsApi'

// One conversation: messages oldest first, the newest in view, and a box to answer. Shared by clients and owners.
const stamp = value => `${dayLabel(value, { day: 'numeric', month: 'short' })} · ${algiersParts(value).time}`

export default function Conversation({ title, subtitle, messages, loading, closedNote, onSend, onBack, showNames = false, tools = null, placeholder = 'Write a message' }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const end = useRef(null)
  const count = messages.length
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [count])
  async function submit(event) {
    event?.preventDefault()
    if (!text.trim() || sending) return
    setSending(true); setError('')
    try { await onSend(text.trim()); setText('') } catch (problem) { setError(problem.message) } finally { setSending(false) }
  }
  function pressKey(event) {
    // On a keyboard, Enter sends and Shift+Enter starts a new line. On a phone, Enter stays a new line.
    if (event.key === 'Enter' && !event.shiftKey && window.matchMedia('(pointer: fine)').matches) submit(event)
  }
  return <section className="inbox-thread" aria-label={`Conversation with ${title}`}>
    <header className="inbox-thread-head">
      {onBack && <button type="button" className="inbox-back" onClick={onBack} aria-label="Back to all conversations">←</button>}
      <div><h2>{title}</h2>{subtitle && <small>{subtitle}</small>}</div>
      {tools && <div className="inbox-tools">{tools}</div>}
    </header>
    <div className="inbox-messages" aria-live="polite">
      {loading ? <p className="inbox-note">Loading the conversation…</p> : !count && <p className="inbox-note">No messages yet. Say salam.</p>}
      {messages.map(item => <article key={item.id} className="inbox-message" data-mine={item.mine}>
        {showNames && <b>{item.who}</b>}
        <p>{item.body}</p>
        <time dateTime={item.created_at}>{stamp(item.created_at)}</time>
      </article>)}
      <span ref={end} />
    </div>
    {closedNote ? <p className="inbox-closed">{closedNote}</p> : <form className="inbox-compose" onSubmit={submit}>
      <label className="visually-hidden" htmlFor="inbox-text">Your message</label>
      <textarea id="inbox-text" rows={2} maxLength={1000} value={text} placeholder={placeholder} onChange={event => setText(event.target.value)} onKeyDown={pressKey} />
      <button type="submit" disabled={!text.trim() || sending}>{sending ? 'Sending…' : 'Send'}</button>
      {error && <p role="alert">{error}</p>}
    </form>}
  </section>
}

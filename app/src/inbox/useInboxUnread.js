import { useEffect, useState } from 'react'
import { INBOX_CHANGED, callInbox } from '../lib/inboxApi'

const REFRESH_MS = 60000

// How many conversations are waiting, checked once a minute while the page is on screen.
export default function useInboxUnread(action, enabled) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let active = true
    const load = () => {
      if (document.hidden) return
      callInbox(action).then(data => { if (active) setCount(data.unread) }).catch(() => { /* the badge can wait for the next check */ })
    }
    load()
    const timer = setInterval(load, REFRESH_MS)
    window.addEventListener(INBOX_CHANGED, load)
    return () => { active = false; clearInterval(timer); window.removeEventListener(INBOX_CHANGED, load) }
  }, [action, enabled])
  return enabled ? count : 0
}

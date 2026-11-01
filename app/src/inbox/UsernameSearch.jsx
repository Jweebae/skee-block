import { useEffect, useState } from 'react'

// Suggestions update with every letter. A pasted username works too: the server only reads the letters a username can
// contain, so a stray space or @ does not matter. Enter picks the highlighted suggestion.
const tidy = value => value.trim().replace(/^@/, '')

export default function UsernameSearch({ search, onPick }) {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState({ wanted: '', results: [], self: false, failed: false })
  const [active, setActive] = useState(0)
  const wanted = tidy(query)
  useEffect(() => {
    if (!wanted) return
    let current = true
    const timer = setTimeout(() => {
      search(wanted)
        .then(data => { if (current) { setAnswer({ wanted, results: data.results, self: data.self, failed: false }); setActive(0) } })
        .catch(() => { if (current) setAnswer({ wanted, results: [], self: false, failed: true }) })
    }, 120)
    return () => { current = false; clearTimeout(timer) }
  }, [wanted, search])
  const results = wanted ? answer.results : []
  const answered = wanted && answer.wanted === wanted
  function pick(item) {
    setQuery('')
    setAnswer({ wanted: '', results: [], self: false, failed: false })
    onPick(item)
  }
  function press(event) {
    if (event.key === 'ArrowDown' && results.length) { event.preventDefault(); setActive(value => (value + 1) % results.length) }
    if (event.key === 'ArrowUp' && results.length) { event.preventDefault(); setActive(value => (value - 1 + results.length) % results.length) }
    if (event.key === 'Enter') { event.preventDefault(); if (results[active]) pick(results[active]) }
  }
  return <div className="inbox-search">
    <label>New message<input type="search" role="combobox" aria-expanded={results.length > 0} aria-autocomplete="list" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={60} value={query} placeholder="Type or paste a username" onChange={event => setQuery(event.target.value)} onKeyDown={press} /></label>
    {results.length > 0 && <ul>{results.map((item, index) => <li key={item.username}><button type="button" data-active={index === active} onClick={() => pick(item)}><span>{item.username}</span>{item.studio && <small>Skee</small>}</button></li>)}</ul>}
    {answered && !results.length && <p className="inbox-note">{answer.failed ? 'The search did not work. Check your connection and try again.' : answer.self ? 'That is your own username.' : 'No client with this username.'}</p>}
  </div>
}

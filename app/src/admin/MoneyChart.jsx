import { useState } from 'react'
import { formatPrice } from '../booking/catalog'

// Money in against money out, on one shared axis. The table under the chart is its full, readable version.
function roundUp(value) {
  const step = 10 ** Math.floor(Math.log10(Math.max(value, 1)))
  const nice = [1, 2, 5, 10].find(factor => factor * step >= value) ?? 10
  return nice * step
}

export default function MoneyChart({ rows, label }) {
  const [active, setActive] = useState(-1)
  const top = roundUp(Math.max(1, ...rows.flatMap(row => [row.earned, row.spent + row.takenOut])))
  const height = value => `${(value / top) * 100}%`
  const shown = rows[active]
  const tickEvery = Math.max(1, Math.ceil(rows.length / 7))
  return <figure className="money-chart" aria-label="Money in and out by period">
    <figcaption><span className="money-legend"><i className="is-in" />Earned</span><span className="money-legend"><i className="is-out" />Spent and taken out</span></figcaption>
    <div className="money-plot" onMouseLeave={() => setActive(-1)}>
      <div className="money-grid" aria-hidden="true">{[1, 0.5, 0].map(share => <span key={share}><small>{formatPrice(top * share)}</small></span>)}</div>
      <div className="money-bars" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
        {rows.map((row, index) => <div key={row.key} className="money-slot" data-active={active === index} tabIndex={0} aria-label={`${label(row.key)}: earned ${formatPrice(row.earned)}, out ${formatPrice(row.spent + row.takenOut)}`} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onBlur={() => setActive(-1)}>
          <i className="is-in" style={{ height: height(row.earned) }} /><i className="is-out" style={{ height: height(row.spent + row.takenOut) }} />
        </div>)}
      </div>
      {shown && <div className="money-tip" role="status" style={{ '--x': `${((active + 0.5) / rows.length) * 100}%` }}><b>{label(shown.key)}</b><span>Earned {formatPrice(shown.earned)}</span><span>Spent {formatPrice(shown.spent)}</span>{shown.takenOut > 0 && <span>Taken out {formatPrice(shown.takenOut)}</span>}{shown.cuts > 0 && <span>{shown.cuts} {shown.cuts === 1 ? 'cut' : 'cuts'}</span>}</div>}
    </div>
    <div className="money-axis" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>{rows.map((row, index) => <span key={row.key}>{index % tickEvery === 0 ? label(row.key) : ''}</span>)}</div>
  </figure>
}

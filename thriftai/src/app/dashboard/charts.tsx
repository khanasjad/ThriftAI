'use client'

import { Tooltip } from '@/components/ui/tooltip'
import { formatPrice } from '@/components/veritas/score'

/**
 * Price vs. peers: one row per product, a dot at its price relative to the peer median (centre line).
 * Single series → one hue, no legend; the row label names the product and the value sits at the row end.
 */
export function PriceVsPeers({ rows }: { rows: { slug: string; name: string; price: number; medianPeerPrice: number | null }[] }) {
  const data = rows
    .filter((r) => r.medianPeerPrice)
    .map((r) => ({ ...r, pct: ((r.price - r.medianPeerPrice!) / r.medianPeerPrice!) * 100 }))
    .sort((a, b) => b.pct - a.pct)
  if (!data.length) return <p className="text-sm text-fg-muted">No peer prices yet.</p>
  // Domain fits the data (a price can't be more than 100% below the median), always showing ±25% around it.
  const lo = Math.max(-100, Math.min(-25, ...data.map((d) => d.pct)))
  const hi = Math.max(25, ...data.map((d) => d.pct))
  const pos = (pct: number) => ((pct - lo) / (hi - lo)) * 100
  const mid = pos(0)
  return (
    <figure>
      <div className="mb-2 grid grid-cols-[minmax(0,10rem)_1fr_4.5rem] gap-3 text-[11px] text-fg-subtle sm:grid-cols-[minmax(0,14rem)_1fr_4.5rem]">
        <span />
        <span className="relative h-4 tabular">
          <span className="absolute left-0">−{Math.round(-lo)}%</span>
          <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${mid}%` }}>
            peer median
          </span>
          <span className="absolute right-0">+{Math.round(hi)}%</span>
        </span>
        <span />
      </div>
      <ul className="flex flex-col gap-1">
        {data.map((d) => (
          <li key={d.slug} className="grid grid-cols-[minmax(0,10rem)_1fr_4.5rem] items-center gap-3 text-sm sm:grid-cols-[minmax(0,14rem)_1fr_4.5rem]">
            <span className="truncate text-fg-muted">{d.name}</span>
            <span className="relative h-6">
              <span className="absolute inset-x-0 top-1/2 h-px bg-grid" aria-hidden />
              <span className="absolute inset-y-0 w-px bg-axis" style={{ left: `${mid}%` }} aria-hidden />
              <Tooltip content={`${d.name}: ${formatPrice(d.price)} vs. peer median ${formatPrice(d.medianPeerPrice!)}`}>
                <button
                  type="button"
                  aria-label={`${d.name}: ${d.pct >= 0 ? '+' : ''}${Math.round(d.pct)}% vs. peer median`}
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-score-4 ring-2 ring-surface focus-visible:outline-2 focus-visible:outline-ring"
                  style={{ left: `${pos(d.pct)}%` }}
                />
              </Tooltip>
            </span>
            <span className="text-right tabular text-fg">
              {d.pct >= 0 ? '+' : '−'}
              {Math.abs(Math.round(d.pct))}%
            </span>
          </li>
        ))}
      </ul>
      <figcaption className="mt-3 text-xs text-fg-subtle">Current price vs. the median price of similar items (same category) across the catalog.</figcaption>
    </figure>
  )
}

/**
 * Score vs. price index (100 = peer median price). Two series: this brand (series-1) and other brands (neutral) → legend.
 * Shown once at least 3 of the brand's products are rated.
 */
export function ScoreVsPrice({
  points,
}: {
  points: { name: string; brand: boolean; priceIndex: number; score: number }[]
}) {
  const W = 640
  const H = 280
  const pad = { l: 40, r: 16, t: 12, b: 32 }
  const xs = points.map((p) => p.priceIndex)
  const xMin = Math.min(50, ...xs)
  const xMax = Math.max(150, ...xs)
  const x = (v: number) => pad.l + ((v - xMin) / (xMax - xMin)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - v / 100) * (H - pad.t - pad.b)
  return (
    <figure>
      <div className="mb-3 flex gap-4 text-xs text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-series-1" aria-hidden /> This brand
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-axis" aria-hidden /> Other brands
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Score versus price compared with peers">
        {[25, 50, 75, 100].map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth="1" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-fg-subtle text-[11px] tabular">
              {t}
            </text>
          </g>
        ))}
        <line x1={x(100)} x2={x(100)} y1={pad.t} y2={H - pad.b} stroke="var(--axis)" strokeWidth="1" />
        <text x={x(100)} y={H - 10} textAnchor="middle" className="fill-fg-subtle text-[11px]">
          peer median price
        </text>
        {[...points].sort((a, b) => Number(a.brand) - Number(b.brand)).map((p, i) => (
          <circle key={i} cx={x(p.priceIndex)} cy={y(p.score)} r={p.brand ? 6 : 4.5} fill={p.brand ? 'var(--series-1)' : 'var(--axis)'} stroke="var(--surface)" strokeWidth="2">
            <title>{`${p.name}: score ${p.score}, price ${Math.round(p.priceIndex)}% of peer median`}</title>
          </circle>
        ))}
      </svg>
      <figcaption className="mt-2 text-xs text-fg-subtle">Up = higher Veritas Score. Right = pricier than similar items. Top-left is best value.</figcaption>
    </figure>
  )
}

'use client'

import * as React from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { Badge, Table, THead, TBody, TR, TH, TD } from '@/components/ui/primitives'
import { formatPrice } from './score'

export type PricePoint = { date: string; price: number; listPrice?: number | null; isPromo?: boolean }
export type PriceSeries = { seller: string; points: PricePoint[] }

const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)']
const PAD_WIDE = { top: 14, right: 176, bottom: 26, left: 44 }
const PAD_NARROW = { top: 14, right: 64, bottom: 26, left: 44 }
const H = 200
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/**
 * 90-day price history per seller (≤ 4 sellers, categorical slots in fixed order).
 * Relief for sub-3:1 light-mode slots: direct end labels + legend + table view.
 */
export function PriceHistory({
  series,
  currency = 'USD',
  fakeDiscount,
  oftenCheaper,
}: {
  series: PriceSeries[]
  currency?: string
  fakeDiscount?: boolean
  oftenCheaper?: boolean
}) {
  const wrap = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(640)
  const [hover, setHover] = React.useState<number | null>(null)

  React.useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(260, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const narrow = width < 520
  const PAD = narrow ? PAD_NARROW : PAD_WIDE
  const data = series.slice(0, 4)
  const dates = Array.from(new Set(data.flatMap((s) => s.points.map((p) => p.date)))).sort()
  const all = data.flatMap((s) => s.points.map((p) => p.price))
  if (!dates.length) return <p className="text-sm text-fg-muted">No price history yet.</p>

  const lo = Math.floor(Math.min(...all) * 0.95)
  const hi = Math.ceil(Math.max(...all) * 1.05)
  const innerW = width - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (dates.length === 1 ? innerW / 2 : (i / (dates.length - 1)) * innerW)
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo || 1)) * innerH
  const ticks = [lo, Math.round((lo + hi) / 2), hi]

  // End labels: sort by y, keep ≥ 16px apart, draw a leader when moved.
  const ends = data
    .map((s, i) => {
      const last = s.points[s.points.length - 1]
      return { i, seller: s.seller, price: last.price, dotY: y(last.price), labelY: y(last.price), dotX: x(dates.indexOf(last.date)) }
    })
    .sort((a, b) => a.dotY - b.dotY)
  for (let k = 1; k < ends.length; k++) if (ends[k].labelY - ends[k - 1].labelY < 16) ends[k].labelY = ends[k - 1].labelY + 16

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const i = Math.round(((px - PAD.left) / innerW) * (dates.length - 1))
    setHover(Math.max(0, Math.min(dates.length - 1, i)))
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') setHover((h) => Math.min(dates.length - 1, (h ?? -1) + 1))
    if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? dates.length) - 1))
    if (e.key === 'Escape') setHover(null)
  }

  const hoverRows =
    hover === null
      ? []
      : data.map((s, i) => ({ i, seller: s.seller, p: s.points.find((p) => p.date === dates[hover]) })).filter((r) => r.p)
  const tipLeft = hover === null ? 0 : Math.min(Math.max(x(hover) - 90, 0), width - 180)

  return (
    <div className="flex flex-col gap-3">
      {(fakeDiscount || oftenCheaper) && (
        <div className="flex flex-wrap gap-2">
          {fakeDiscount && (
            <Badge tone="critical">
              <AlertTriangle aria-hidden /> Inflated “was” price: this sale matches the usual price
            </Badge>
          )}
          {oftenCheaper && (
            <Badge tone="warning">
              <Clock aria-hidden /> Often cheaper in sales — consider waiting
            </Badge>
          )}
        </div>
      )}

      {/* Legend (always for ≥ 2 series) */}
      {data.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted" aria-label="Sellers">
          {data.map((s, i) => (
            <li key={s.seller} className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ background: SERIES[i] }} aria-hidden />
              {s.seller}
            </li>
          ))}
        </ul>
      )}

      <div ref={wrap} className="relative w-full">
        <svg
          width={width}
          height={H}
          role="img"
          aria-label={`Price history for ${data.length} seller${data.length === 1 ? '' : 's'} over ${dates.length} weeks. Use arrow keys to inspect; full values are in the table below.`}
          tabIndex={0}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
          className="block touch-none rounded-md focus-visible:outline-2 focus-visible:outline-ring"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={PAD.left + innerW} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-fg-subtle text-[11px] tabular">
                {formatPrice(t, currency)}
              </text>
            </g>
          ))}
          <text x={PAD.left} y={H - 6} className="fill-fg-subtle text-[11px]">{fmtDate(dates[0])}</text>
          <text x={PAD.left + innerW} y={H - 6} textAnchor="end" className="fill-fg-subtle text-[11px]">{fmtDate(dates[dates.length - 1])}</text>

          {data.map((s, i) => {
            const d = s.points.map((p, k) => `${k ? 'L' : 'M'}${x(dates.indexOf(p.date))},${y(p.price)}`).join(' ')
            return (
              <g key={s.seller}>
                <path d={d} fill="none" stroke={SERIES[i]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {s.points.filter((p) => p.isPromo).map((p) => (
                  <circle key={p.date} cx={x(dates.indexOf(p.date))} cy={y(p.price)} r={4} fill="var(--surface)" stroke={SERIES[i]} strokeWidth={2}>
                    <title>Promo</title>
                  </circle>
                ))}
              </g>
            )
          })}

          {ends.map((e) => (
            <g key={e.seller}>
              {Math.abs(e.labelY - e.dotY) > 1 && <line x1={e.dotX + 6} x2={e.dotX + 14} y1={e.dotY} y2={e.labelY} stroke="var(--axis)" strokeWidth={1} />}
              <circle cx={e.dotX} cy={e.dotY} r={4} fill={SERIES[e.i]} stroke="var(--surface)" strokeWidth={2} />
              <text x={e.dotX + 16} y={e.labelY} dy="0.32em" className="fill-fg text-[11px] font-medium">
                {formatPrice(e.price, currency)}
                {!narrow && <tspan className="fill-fg-subtle font-normal"> {e.seller.length > 14 ? e.seller.slice(0, 13) + '…' : e.seller}</tspan>}
              </text>
            </g>
          ))}

          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--axis)" strokeWidth={1} />}
          {hoverRows.map((r) => (
            <circle key={r.seller} cx={x(hover!)} cy={y(r.p!.price)} r={4} fill={SERIES[r.i]} stroke="var(--surface)" strokeWidth={2} />
          ))}
        </svg>

        {hover !== null && hoverRows.length > 0 && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-[180px] rounded-md border border-border bg-surface p-2.5 text-xs shadow-lg"
            style={{ left: tipLeft }}
            role="status"
          >
            <div className="mb-1.5 font-medium text-fg">{fmtDate(dates[hover])}</div>
            {hoverRows.map((r) => (
              <div key={r.seller} className="flex items-center justify-between gap-2 py-0.5">
                <span className="flex min-w-0 items-center gap-1.5 text-fg-muted">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: SERIES[r.i] }} aria-hidden />
                  <span className="truncate">{r.seller}</span>
                </span>
                <span className="tabular font-medium text-fg">
                  {formatPrice(r.p!.price, currency)}
                  {r.p!.isPromo && <span className="ml-1 text-fg-subtle">sale</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <details className="group text-sm">
        <summary className="cursor-pointer select-none text-fg-muted hover:text-fg">Show price table</summary>
        <div className="mt-2">
          <Table>
            <THead>
              <TR>
                <TH>Week of</TH>
                {data.map((s) => (
                  <TH key={s.seller}>{s.seller}</TH>
                ))}
              </TR>
            </THead>
            <TBody>
              {dates.map((d) => (
                <TR key={d}>
                  <TD>{fmtDate(d)}</TD>
                  {data.map((s) => {
                    const p = s.points.find((pp) => pp.date === d)
                    return (
                      <TD key={s.seller}>
                        {p ? formatPrice(p.price, currency) : '—'}
                        {p?.isPromo && <span className="ml-1 text-xs text-fg-subtle">(sale{p.listPrice ? `, was ${formatPrice(p.listPrice, currency)}` : ''})</span>}
                      </TD>
                    )
                  })}
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </details>
    </div>
  )
}

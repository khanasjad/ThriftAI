import { BadgeDollarSign, Building2, MessageSquareText } from 'lucide-react'
import type { Drivers } from '@/lib/veritas/scoring/drivers'
import { scoreBand } from './score'

const ITEMS = [
  { key: 'quality', label: 'Product quality', icon: MessageSquareText },
  { key: 'price', label: 'Price', icon: BadgeDollarSign },
  { key: 'brand', label: 'Brand reputation', icon: Building2 },
] as const

/** The score's three drivers, each with its number, band word and what it's built from. */
export function DriverTiles({ drivers, className }: { drivers: Drivers; className?: string }) {
  return (
    <ul className={`grid gap-3 sm:grid-cols-3 ${className ?? ''}`} aria-label="What drives the score">
      {ITEMS.map(({ key, label, icon: Icon }) => {
        const d = drivers[key]
        return (
          <li key={key} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <p className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
              <Icon className="size-3.5 text-fg-subtle" aria-hidden />
              {label}
            </p>
            <p className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular text-fg">{d.value === null ? '—' : d.value}</span>
              {d.value !== null && <span className="text-xs text-fg-subtle">{scoreBand(d.value).label}</span>}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-score-track" aria-hidden>
              {d.value !== null && <div className="h-full rounded-full bg-score-3" style={{ width: `${d.value}%` }} />}
            </div>
            <p className="mt-2 text-xs leading-snug text-fg-muted">{d.basis}</p>
          </li>
        )
      })}
    </ul>
  )
}

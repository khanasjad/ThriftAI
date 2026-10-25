'use client'

import { ChevronRight, FileSearch } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { PILLARS, scoreBand, type Pillar } from './score'

/**
 * Five pillar bars. Pillars are nominal categories, so every bar uses the same hue
 * (length carries the value; band word sits in the tooltip and the value at the tip).
 */
export function PillarBars({
  values,
  onSelect,
  selected,
}: {
  values: Partial<Record<Pillar, number | null>>
  onSelect?: (p: Pillar) => void
  selected?: Pillar | null
}) {
  return (
    <ul className="flex flex-col gap-1">
      {PILLARS.map((p) => {
        const v = values[p.key]
        const has = typeof v === 'number'
        const content = (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-fg">
                {p.label} <span className="font-normal text-fg-subtle">· {p.weight}%</span>
              </span>
              <span className="text-sm font-semibold tabular text-fg">{has ? Math.round(v) : '—'}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-score-track">
              {has && (
                <div className="h-full animate-bar-grow rounded-full bg-score-3" style={{ width: `${v}%` }} />
              )}
            </div>
            {!has && <span className="mt-1 block text-xs text-fg-subtle">Not enough evidence yet</span>}
          </>
        )
        const tip = has ? `${p.label}: ${Math.round(v)} — ${scoreBand(v).label}` : `${p.label}: not enough evidence yet`
        return (
          <li key={p.key}>
            <Tooltip content={tip}>
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(p.key)}
                  aria-pressed={selected === p.key}
                  className={cn('w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-surface-2', selected === p.key && 'bg-surface-2')}
                >
                  {content}
                </button>
              ) : (
                <div tabIndex={0} className="rounded-md px-3 py-2.5">
                  {content}
                </div>
              )}
            </Tooltip>
          </li>
        )
      })}
    </ul>
  )
}

/** One of the 27 factors. Clicking opens the evidence behind the number. */
export function FactorRow({
  name,
  weight,
  value,
  evidenceCount,
  onOpenEvidence,
}: {
  name: string
  weight: number
  value: number | null
  evidenceCount: number
  onOpenEvidence?: () => void
}) {
  const included = value !== null
  return (
    <button
      type="button"
      onClick={onOpenEvidence}
      disabled={!included || !onOpenEvidence}
      className="group grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 rounded-md px-3 py-2.5 text-left transition-colors enabled:hover:bg-surface-2 disabled:cursor-default"
    >
      <span className="col-start-1 row-start-1 min-w-0">
        <span className="block text-sm text-fg">{name}</span>
        <span className="text-xs text-fg-subtle">
          {weight} pt{weight === 1 ? '' : 's'} · {included ? `${evidenceCount} evidence` : 'not yet included'}
        </span>
      </span>
      <span className="col-span-2 col-start-1 row-start-2 h-1.5 w-full overflow-hidden rounded-full bg-score-track">
        {included && <span className="block h-full rounded-full bg-score-3" style={{ width: `${value}%` }} />}
      </span>
      <span className="col-start-2 row-start-1 flex min-w-[3.25rem] items-center justify-end gap-1 text-sm font-semibold tabular text-fg">
        {included ? Math.round(value) : '—'}
        {included && onOpenEvidence && <ChevronRight className="size-4 text-fg-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />}
      </span>
    </button>
  )
}

/** Personal Match 0–100 with the top reasons. Accent fill on an accent-soft track. */
export function MatchMeter({ value, reasons }: { value: number; reasons: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-fg">Match for you</span>
        <span className="text-sm font-semibold tabular text-fg">{Math.round(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-accent-soft" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)} aria-label="Personal match">
        <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
      </div>
      {reasons.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-fg-muted">
          {reasons.slice(0, 2).map((r) => (
            <li key={r} className="flex items-start gap-1.5">
              <FileSearch className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden />
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** KPI tile: label, value, optional delta (signed, vs a named period). */
export function StatTile({
  label,
  value,
  delta,
  deltaGood,
  period,
}: {
  label: string
  value: string
  delta?: string
  /** whether this delta direction is good news (sets colour) */
  deltaGood?: boolean
  period?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="text-sm text-fg-muted">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-fg">{value}</div>
      {delta && (
        <div className="mt-1 text-xs">
          <span className={cn('font-medium', deltaGood ? 'text-good-fg' : 'text-critical-fg')}>{delta}</span>
          {period && <span className="text-fg-subtle"> vs {period}</span>}
        </div>
      )}
    </div>
  )
}

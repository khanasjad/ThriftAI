'use client'

import Link from 'next/link'
import { AlertCircle, BadgeDollarSign, Check, Ruler, ShieldCheck, Sparkles, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/primitives'
import { ScoreRing } from './score-ring'
import { ConfidenceBadge } from './badges'
import { ProductThumb } from './product-thumb'
import { PILLARS, formatPrice, type ConfidenceLabel, type Pillar } from './score'

export type PickRole = 'best_overall' | 'best_value' | 'wildcard'
const ROLE = {
  best_overall: { label: 'Best overall', icon: <Trophy aria-hidden /> },
  best_value: { label: 'Best value', icon: <BadgeDollarSign aria-hidden /> },
  wildcard: { label: 'Wildcard', icon: <Sparkles aria-hidden /> },
} as const

export type Pick = {
  role: PickRole
  href: string
  name: string
  brand: string
  category: string
  subcategory?: string | null
  silhouette?: string | null
  color?: string | null
  pattern?: string | null
  /** 4th parameter: how many of the looks the shopper asked for this item has (photo + catalog). */
  style?: { value: number; matched: string[]; missed: string[] } | null
  score: number
  confidence: ConfidenceLabel
  match?: number | null
  pillars: Partial<Record<Pillar, number | null>>
  /** Personal Match reasons, built from facts (never generated). */
  reasons?: string[]
  /** Verified text only (checked against evidence by the verifier). */
  summary?: string | null
  sizeAdvice?: string | null
  downside?: string | null
  priceMin: number
  priceMax: number
  sellerCount: number
  wildcardReason?: string
  overBudget?: boolean
}

/** One of the 3 search picks. Score and evidence first, price second, brand last. */
export function PickCard({ pick, index = 0 }: { pick: Pick; index?: number }) {
  const role = ROLE[pick.role]
  return (
    <article
      style={{ animationDelay: `${index * 80}ms` }}
      className="animate-rise-in group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent [&_svg]:size-3.5">
          {role.icon}
          {role.label}
        </span>
        <ConfidenceBadge label={pick.confidence} />
      </div>

      <div className="flex gap-4 p-5">
        <ProductThumb category={pick.category} subcategory={pick.subcategory} silhouette={pick.silhouette} color={pick.color} pattern={pick.pattern} showTag={false} className="w-24 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-fg">
            <Link href={pick.href} className="after:absolute after:inset-0 focus-visible:outline-none">
              {pick.name}
            </Link>
          </h3>
          {pick.wildcardReason && <p className="mt-0.5 text-xs text-fg-muted">{pick.wildcardReason}</p>}
          <div className="mt-3 flex items-center gap-4">
            <ScoreRing score={pick.score} size="sm" />
            {typeof pick.match === 'number' && (
              <div className="text-sm">
                <div className="font-semibold tabular text-fg">{Math.round(pick.match)}</div>
                <div className="text-xs text-fg-muted">Match for you</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-4 gap-px border-y border-border bg-border">
        {PILLARS.slice(0, 4).map((p) => (
          <div key={p.key} className="bg-surface px-2 py-2.5 text-center">
            <dt className="truncate text-[11px] text-fg-subtle">{p.short}</dt>
            <dd className="text-sm font-semibold tabular text-fg">{typeof pick.pillars[p.key] === 'number' ? Math.round(pick.pillars[p.key]!) : '—'}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-1 flex-col gap-2.5 p-5 text-sm">
        {pick.style && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
            <span className="font-semibold text-fg">
              Style match <span className="tabular">{pick.style.value}</span>
            </span>
            {pick.style.matched.map((m) => (
              <span key={m} className="inline-flex items-center gap-0.5 rounded bg-good-soft px-1.5 py-0.5 text-good-fg">
                <Check className="size-3" aria-hidden />
                {m}
              </span>
            ))}
            {pick.style.missed.map((m) => (
              <span key={m} className="rounded bg-surface-2 px-1.5 py-0.5">
                not {m}
              </span>
            ))}
          </p>
        )}
        {pick.reasons && pick.reasons.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {pick.reasons.slice(0, 2).map((r) => (
              <li key={r} className="flex gap-2 text-fg">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}
        {pick.summary && (
          <p className="flex gap-2 text-fg-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
            <span>{pick.summary}</span>
          </p>
        )}
        {pick.sizeAdvice && (
          <p className="flex gap-2 text-fg">
            <Ruler className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
            <span>
              <span className="font-medium">Size advice:</span> {pick.sizeAdvice}
            </span>
          </p>
        )}
        {pick.downside && (
          <p className="flex gap-2 text-fg">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
            <span>
              <span className="font-medium">Downside:</span> {pick.downside}
            </span>
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-2 pt-2 text-fg">
          <span className="text-lg font-semibold tabular">
            {pick.priceMin === pick.priceMax ? formatPrice(pick.priceMin) : `${formatPrice(pick.priceMin)}–${formatPrice(pick.priceMax)}`}
            {pick.overBudget && (
              <Badge tone="warning" className="ml-2 align-middle">
                Over budget
              </Badge>
            )}
          </span>
          <span className="text-xs text-fg-subtle">
            {pick.sellerCount} seller{pick.sellerCount === 1 ? '' : 's'} · {pick.brand}
          </span>
        </div>
      </div>
    </article>
  )
}

'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Ruler, AlertCircle, Trophy, BadgeDollarSign, Sparkles } from 'lucide-react'
import { ScoreRing } from './score-ring'
import { ConfidenceBadge } from './badges'
import { PILLARS, formatPrice, type ConfidenceLabel, type Pillar } from './score'
import { cn } from '@/lib/utils'

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
  imageUrl?: string | null
  score: number
  confidence: ConfidenceLabel
  match?: number | null
  pillars: Partial<Record<Pillar, number | null>>
  sizeAdvice?: string | null
  downside?: string | null
  priceMin: number
  priceMax: number
  sellerCount: number
  wildcardReason?: string
}

/** One of the 3 search picks. Score and evidence first, price second, brand last. */
export function PickCard({ pick, index = 0 }: { pick: Pick; index?: number }) {
  const reduce = useReducedMotion()
  const role = ROLE[pick.role]
  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: reduce ? 0 : index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent [&_svg]:size-3.5">
          {role.icon}
          {role.label}
        </span>
        <ConfidenceBadge label={pick.confidence} />
      </div>

      <div className="flex gap-4 p-5">
        <div className="size-24 shrink-0 overflow-hidden rounded-lg bg-surface-2">
          {pick.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- dev placeholders; next/image arrives with real catalog images
            <img src={pick.imageUrl} alt="" className="size-full object-cover" loading="lazy" />
          )}
        </div>
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
                <div className="text-xs text-fg-muted">Match</div>
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
        {pick.sizeAdvice && (
          <p className="flex gap-2 text-fg">
            <Ruler className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
            <span><span className="font-medium">Size advice:</span> {pick.sizeAdvice}</span>
          </p>
        )}
        {pick.downside && (
          <p className="flex gap-2 text-fg">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
            <span><span className="font-medium">Downside:</span> {pick.downside}</span>
          </p>
        )}
        <div className={cn('mt-auto flex items-baseline justify-between pt-2 text-fg')}>
          <span className="text-lg font-semibold">
            {pick.priceMin === pick.priceMax ? formatPrice(pick.priceMin) : `${formatPrice(pick.priceMin)}–${formatPrice(pick.priceMax)}`}
          </span>
          <span className="text-xs text-fg-subtle">
            {pick.sellerCount} seller{pick.sellerCount === 1 ? '' : 's'} · {pick.brand}
          </span>
        </div>
      </div>
    </motion.article>
  )
}

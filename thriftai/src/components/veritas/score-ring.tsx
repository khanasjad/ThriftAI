'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { scoreBand } from './score'

const SIZES = {
  sm: { box: 48, stroke: 5, num: 'text-base', word: false },
  md: { box: 96, stroke: 8, num: 'text-3xl', word: true },
  lg: { box: 136, stroke: 10, num: 'text-5xl', word: true },
} as const

/**
 * 0–100 score as a meter ring. Fill = score band (ordinal blue), track = lighter step of the same ramp.
 * Always shows the number; md/lg also show the band word. `score = null` → "Not rated".
 */
export function ScoreRing({
  score,
  size = 'md',
  className,
  caption,
}: {
  score: number | null
  size?: keyof typeof SIZES
  className?: string
  /** Optional text under the ring (e.g. "Veritas Score") */
  caption?: string
}) {
  const reduce = useReducedMotion()
  const s = SIZES[size]
  const r = (s.box - s.stroke) / 2
  const c = 2 * Math.PI * r
  const value = score === null ? 0 : Math.max(0, Math.min(100, Math.round(score)))
  const band = score === null ? null : scoreBand(value)
  const label = band ? `Veritas Score ${value} out of 100, ${band.label}` : 'Not rated yet'

  return (
    <div className={cn('inline-flex flex-col items-center gap-1.5', className)}>
      <div className="relative" style={{ width: s.box, height: s.box }} role="img" aria-label={label}>
        <svg width={s.box} height={s.box} viewBox={`0 0 ${s.box} ${s.box}`} className="-rotate-90" aria-hidden>
          <circle cx={s.box / 2} cy={s.box / 2} r={r} fill="none" stroke="var(--score-track)" strokeWidth={s.stroke} />
          {band && (
            <motion.circle
              cx={s.box / 2}
              cy={s.box / 2}
              r={r}
              fill="none"
              stroke={band.color}
              strokeWidth={s.stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: reduce ? c * (1 - value / 100) : c }}
              animate={{ strokeDashoffset: c * (1 - value / 100) }}
              transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
          <span className={cn('font-semibold tracking-tight text-fg', s.num)}>{band ? value : '—'}</span>
          {s.word && <span className="text-[11px] font-medium text-fg-muted">{band ? band.label : 'Not rated'}</span>}
        </div>
      </div>
      {caption && <span className="text-xs text-fg-muted">{caption}</span>}
    </div>
  )
}

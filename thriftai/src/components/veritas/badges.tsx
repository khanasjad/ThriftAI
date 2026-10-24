'use client'

import { ShieldCheck, Shield, ShieldAlert, Sparkles, TrendingUp, TrendingDown, Infinity as InfinityIcon } from 'lucide-react'
import { Badge } from '@/components/ui/primitives'
import { Tooltip } from '@/components/ui/controls'
import { CONFIDENCE, type ConfidenceLabel } from './score'

const CONFIDENCE_ICON: Record<ConfidenceLabel, React.ReactNode> = {
  HIGH: <ShieldCheck aria-hidden />,
  MEDIUM: <Shield aria-hidden />,
  LOW: <ShieldAlert aria-hidden />,
  NEW_LAUNCH: <Sparkles aria-hidden />,
}

/** High / Medium / Low / New launch, with an explanation on hover or focus. */
export function ConfidenceBadge({ label, reviewCount }: { label: ConfidenceLabel; reviewCount?: number }) {
  const c = CONFIDENCE[label]
  return (
    <Tooltip content={<>{c.explain}{reviewCount !== undefined && ` Based on ${reviewCount} review${reviewCount === 1 ? '' : 's'}.`}</>}>
      <button type="button" className="rounded-full focus-visible:outline-2 focus-visible:outline-ring">
        <Badge tone={label === 'LOW' ? 'warning' : label === 'NEW_LAUNCH' ? 'accent' : 'neutral'}>
          {CONFIDENCE_ICON[label]}
          {c.label}
        </Badge>
      </button>
    </Tooltip>
  )
}

const TREND = {
  TRENDING: { label: 'Trending', icon: <TrendingUp aria-hidden />, explain: 'Search and social interest in this style is rising. Trend is capped at 3 points of the score.' },
  CLASSIC: { label: 'Classic', icon: <InfinityIcon aria-hidden />, explain: 'A steady, timeless style.' },
  FADING: { label: 'Fading', icon: <TrendingDown aria-hidden />, explain: 'Interest in this style is falling.' },
} as const

/** Separate trend tag (product plan: trend is shown apart from the score). Neutral tone on purpose. */
export function TrendTag({ tag }: { tag: keyof typeof TREND }) {
  const t = TREND[tag]
  return (
    <Tooltip content={t.explain}>
      <button type="button" className="rounded-full focus-visible:outline-2 focus-visible:outline-ring">
        <Badge tone="outline">
          {t.icon}
          {t.label}
        </Badge>
      </button>
    </Tooltip>
  )
}

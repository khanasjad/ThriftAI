'use client'

import * as React from 'react'
import Link from 'next/link'
import { Info } from 'lucide-react'
import { Switch } from '@/components/ui/toggle'
import { Label } from '@/components/ui/primitives'
import { ScoreRing } from '@/components/veritas/score-ring'
import { ConfidenceBadge } from '@/components/veritas/badges'
import { FactorRow, PillarBars } from '@/components/veritas/bars'
import type { EvidenceItem } from '@/components/veritas/evidence-drawer'
import dynamic from 'next/dynamic'
import { PILLARS, type ConfidenceLabel, type Pillar } from '@/components/veritas/score'
import { FeedbackButtons } from '@/components/veritas/feedback-buttons'

// Loaded the first time someone opens a factor's evidence.
const EvidenceDrawer = dynamic(() => import('@/components/veritas/evidence-drawer').then((m) => m.EvidenceDrawer), { ssr: false })

export type FactorMeta = { key: string; name: string; pillar: Pillar; weight: number }

export type ScorePanelProps = {
  score: {
    overall: number
    overallWithSustainability: number | null
    pillars: Partial<Record<Pillar, number | null>>
    confidenceLabel: ConfidenceLabel
    reviewCount: number
    factorsIncluded: string[]
    ratedByRunId: string | null
    earlyScore: number | null
    calculatedAt: string
  } | null
  factors: FactorMeta[]
  factorValues: Record<string, { value: number; evidenceCount: number }>
  evidenceByFactor: Record<string, EvidenceItem[]>
  inputs: { reviews: number; returns: number; prices: number }
  showTraceLink: boolean
  productId: string
}

export function ScorePanel({ score, factors, factorValues, evidenceByFactor, inputs, showTraceLink, productId }: ScorePanelProps) {
  const [sustainability, setSustainability] = React.useState(false)
  const [pillar, setPillar] = React.useState<Pillar>('FIT')
  const [open, setOpen] = React.useState<FactorMeta | null>(null)
  const [drawerUsed, setDrawerUsed] = React.useState(false)

  if (!score) {
    return (
      <section aria-labelledby="score-h" className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <ScoreRing score={null} size="lg" caption="Veritas Score" />
          <div className="min-w-0 flex-1">
            <h2 id="score-h" className="text-lg font-semibold text-fg">
              Not rated yet
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              The rating agents haven’t read this product’s evidence yet, so there is no score. We don’t guess. Everything below is counted directly from the
              data.
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              {[
                ['Reviews', inputs.reviews],
                ['Returns', inputs.returns],
                ['Price checks', inputs.prices],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-surface-2 px-3 py-2">
                  <dt className="text-xs text-fg-subtle">{k}</dt>
                  <dd className="font-semibold tabular text-fg">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-fg-subtle">Waiting to be read by the evidence, price and trend agents.</p>
          </div>
        </div>
        <div className="mt-6 border-t border-border pt-5">
          <PillarBars values={{}} />
        </div>
      </section>
    )
  }

  const overall = sustainability && score.overallWithSustainability != null ? score.overallWithSustainability : score.overall
  const pillarFactors = factors.filter((f) => f.pillar === pillar)
  const included = factors.filter((f) => factorValues[f.key]).length

  return (
    <section aria-labelledby="score-h" className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 id="score-h" className="sr-only">
        Veritas Score
      </h2>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <ScoreRing score={overall} size="lg" caption="Veritas Score" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ConfidenceBadge label={score.confidenceLabel} reviewCount={score.reviewCount} />
            <span className="text-sm text-fg-muted">
              Includes <span className="font-medium tabular text-fg">{included}</span> of {factors.length} factors
            </span>
          </div>
          {score.confidenceLabel === 'NEW_LAUNCH' && score.earlyScore != null && (
            <p className="mt-2 text-sm text-fg-muted">
              New launch: early score of <span className="font-medium tabular text-fg">{score.earlyScore}</span> from the brand’s record on similar items, the spec
              and the price, blended with {score.reviewCount} {score.reviewCount === 1 ? 'review' : 'reviews'} so far.
            </p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <Switch id="sus" checked={sustainability} onCheckedChange={setSustainability} disabled={score.overallWithSustainability == null} />
            <Label htmlFor="sus" className="text-sm text-fg">
              Include sustainability (+5%)
            </Label>
          </div>
          <p className="mt-2 text-xs text-fg-subtle">
            Rated {new Date(score.calculatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {showTraceLink && score.ratedByRunId && (
              <>
                {' · '}
                <Link href={`/admin/runs/${score.ratedByRunId}`} className="text-accent hover:underline">
                  View agent trace
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 border-t border-border pt-5 lg:grid-cols-2">
        <PillarBars values={score.pillars} selected={pillar} onSelect={setPillar} />
        <div>
          <h3 className="text-sm font-medium text-fg">{PILLARS.find((p) => p.key === pillar)?.label} factors</h3>
          <ul className="mt-2 flex flex-col">
            {pillarFactors.map((f) => (
              <li key={f.key}>
                <FactorRow
                  name={f.name}
                  weight={f.weight}
                  value={factorValues[f.key]?.value ?? null}
                  evidenceCount={factorValues[f.key]?.evidenceCount ?? 0}
                  onOpenEvidence={() => {
                    setDrawerUsed(true)
                    setOpen(f)
                  }}
                />
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-start gap-1.5 text-xs text-fg-subtle">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Factors without enough evidence are left out and the pillar is computed from the rest.
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <FeedbackButtons targetType="PRODUCT_SCORE" targetId={productId} />
      </div>

      {drawerUsed && (
        <EvidenceDrawer
          open={open !== null}
          onOpenChange={(o) => !o && setOpen(null)}
          title={open?.name ?? ''}
          score={open ? (factorValues[open.key]?.value ?? null) : null}
          items={open ? (evidenceByFactor[open.key] ?? []) : []}
        />
      )}
    </section>
  )
}

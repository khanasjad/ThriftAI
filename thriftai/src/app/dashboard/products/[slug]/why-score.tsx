import { ArrowDownRight, ArrowUpRight, Wrench } from 'lucide-react'
import type { Why, WhyRow } from '@/lib/veritas/insights/why'

const signal = (s: string) => s.replace(/_/g, ' ')

function Row({ r, tone }: { r: WhyRow; tone: 'loss' | 'gain' }) {
  return (
    <li className="py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-fg">{r.name}</span>
        <span className={tone === 'loss' ? 'inline-flex items-center gap-0.5 text-sm font-semibold tabular text-critical-fg' : 'inline-flex items-center gap-0.5 text-sm font-semibold tabular text-good-fg'}>
          {tone === 'loss' ? <ArrowDownRight className="size-4" aria-hidden /> : <ArrowUpRight className="size-4" aria-hidden />}
          {r.points > 0 ? '+' : ''}
          {r.points.toFixed(1)} pts
        </span>
      </div>
      <p className="mt-0.5 text-xs text-fg-muted">
        {Math.round(r.value)} vs. category median {r.median === null ? '—' : Math.round(r.median)} · {r.evidenceCount} pieces of evidence
        {r.topIssue && tone === 'loss' && (
          <>
            {' '}
            · most common issue: “{signal(r.topIssue.signal)}” ({r.topIssue.count})
          </>
        )}
      </p>
      {tone === 'loss' && r.fix && (
        <p className="mt-1.5 flex items-start gap-1.5 text-sm text-fg">
          <Wrench className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden />
          {r.fix}
        </p>
      )}
    </li>
  )
}

/** Brand view: where the score's points go vs. category peers, and what to fix first. */
export function WhyScore({ why }: { why: Why }) {
  return (
    <section aria-labelledby="why-h" className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 id="why-h" className="text-base font-semibold text-fg">
        Why this score
      </h2>
      <p className="mt-1 text-sm text-fg-muted">
        {why.overall === null ? (
          'Not enough evidence for a published score yet.'
        ) : (
          <>
            Score <span className="font-semibold tabular text-fg">{Math.round(why.overall)}</span> vs. a median of{' '}
            <span className="font-semibold tabular text-fg">{why.categoryMedian === null ? '—' : Math.round(why.categoryMedian)}</span> across {why.peers} rated products in the
            category. Points are each factor’s gap to the category median, weighted the way the score is.
          </>
        )}
      </p>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Fix first</h3>
          {why.losses.length ? (
            <ul className="divide-y divide-border">
              {why.losses.map((r) => (
                <Row key={r.factor} r={r} tone="loss" />
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-fg-muted">No factor is costing more than a fraction of a point.</p>
          )}
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Strengths</h3>
          {why.strengths.length ? (
            <ul className="divide-y divide-border">
              {why.strengths.map((r) => (
                <Row key={r.factor} r={r} tone="gain" />
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-fg-muted">Nothing clearly above the category median yet.</p>
          )}
          {why.missing.length > 0 && (
            <>
              <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Not enough evidence yet</h3>
              <p className="mt-1 text-sm text-fg-muted">{why.missing.map((m) => m.name).join(', ')}. Sharing reviews, returns or specs for these makes the score more complete.</p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDown, Ban, Bot, Calculator, FileCheck2, Quote, ShieldAlert, Sparkles, TrendingUp, Users } from 'lucide-react'
import { SiteShell } from '@/components/site/shell'
import { Button } from '@/components/ui/button'
import { PILLARS } from '@/components/veritas/score'
import { FACTOR_SOURCES } from '@/lib/veritas/taxonomy/sources'
import { FACTOR_TAXONOMY } from '@/lib/veritas/taxonomy/factor-taxonomy'

export const metadata: Metadata = {
  title: 'How the score works',
  description: 'The Veritas Clothing Score: 27 factors in 5 pillars, confidence labels, shrinkage toward the category average, and evidence behind every number.',
}

const RULES = [
  {
    icon: <FileCheck2 />,
    t: 'Every factor links to its evidence',
    d: 'Click any number to see the reviews, returns, prices or spec data behind it. Quotes must match the source text word for word, or they are rejected.',
  },
  {
    icon: <Calculator />,
    t: 'Thin evidence is pulled toward the category average',
    d: 'Each factor is shrunk: (n × raw + k × category mean) ÷ (n + k), with n pieces of evidence and k = 8 to start. Six glowing reviews can’t beat six thousand solid ones.',
  },
  {
    icon: <Users />,
    t: 'Missing factors are left out, not guessed',
    d: 'If there’s no evidence for a factor, it is listed as “not yet included” and the pillar is computed from the rest.',
  },
  {
    icon: <Sparkles />,
    t: 'New launches get an honest early score',
    d: 'Fewer than 10 reviews, or launched under 30 days ago: an early score from the brand’s record on similar items, the spec and the price. It blends into the evidence score as reviews arrive, with weight n ÷ (n + 10).',
  },
  {
    icon: <TrendingUp />,
    t: 'Trend can’t carry a bad product',
    d: 'Trend is recomputed weekly, capped at 3 points, and shown as a separate tag: Trending, Classic or Fading.',
  },
  {
    icon: <Ban />,
    t: 'No pay-for-score',
    d: 'Brands can send data and fix their pages. They can’t buy a higher number, and sponsored items never appear in the top 3.',
  },
]

const PIPELINE = [
  { t: 'Evidence agent', d: 'Reads reviews and return reasons, records quotes and signals per factor. Never sets a score.', kind: 'agent' },
  { t: 'Price & value + Trend & brand agents', d: 'Price history across sellers, fake markdowns, trend phase and brand track record.', kind: 'agent' },
  { t: 'Scoring code', d: 'Factor → pillar → overall with shrinkage and confidence labels. Deterministic maths, no AI.', kind: 'code' },
  { t: 'Writer + Verifier', d: 'Summary, size advice and the main downside. Any sentence the evidence doesn’t support is removed.', kind: 'agent' },
] as const

export default function HowItWorksPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6">
        <p className="text-sm font-medium text-accent">Methodology</p>
        <h1 className="mt-3 max-w-3xl text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-fg">
          One score for “is this worth buying?”, and every reason behind it.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
          The Veritas Clothing Score is a 0–100 number built from 27 factors in five pillars. A separate Personal Match adjusts for you. Starting weights are below;
          they get tuned per category and against real keep-and-return outcomes.
        </p>
      </section>

      {/* Weights overview */}
      <section aria-labelledby="weights-h" className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="weights-h" className="sr-only">
          Pillar weights
        </h2>
        <ul className="grid gap-3 sm:grid-cols-5">
          {PILLARS.map((p) => (
            <li key={p.key}>
              <a href={`#${p.key.toLowerCase()}`} className="block rounded-xl border border-border bg-surface p-4 shadow-sm transition-colors hover:border-border-strong">
                <span className="block text-2xl font-semibold tabular text-fg">
                  {p.key === 'SUSTAINABILITY' ? '+' : ''}
                  {p.weight}%
                </span>
                <span className="mt-1 block text-sm text-fg-muted">{p.label}</span>
                <span className="mt-3 block h-1.5 rounded-full bg-score-track" aria-hidden>
                  <span className="block h-full rounded-full bg-score-3" style={{ width: `${(p.weight / 35) * 100}%` }} />
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-fg-subtle">Sustainability is optional. When a shopper turns it on, the other pillars scale down proportionally.</p>
      </section>

      {/* Factor tables */}
      <section id="methodology" aria-labelledby="factors-h" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
        <h2 id="factors-h" className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.025em] text-fg">
          The 27 factors
        </h2>
        <p className="mt-3 max-w-3xl text-fg-muted">
          Each factor says where its data comes from. Most come from reviews, the catalog and price history, which every store has. Factors marked “when available” need
          extra data (returns, resale or trend data); until a store shares it, the factor is left out and the score says so.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {PILLARS.map((p) => {
            const factors = FACTOR_TAXONOMY.filter((f) => f.pillar === p.key)
            return (
              <article id={p.key.toLowerCase()} key={p.key} className="scroll-mt-24 rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold text-fg">{p.label}</h3>
                  <span className="text-sm font-semibold tabular text-fg-muted">
                    {p.key === 'SUSTAINABILITY' ? 'optional +' : ''}
                    {p.weight}%
                  </span>
                </div>
                <table className="mt-4 w-full text-sm">
                  <thead className="sr-only">
                    <tr>
                      <th>Factor</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {factors.map((f) => (
                      <tr key={f.key} className="align-top">
                        <td className="py-3 pr-4">
                          <span className="font-medium text-fg">{f.name}</span>
                          <span className="mt-0.5 block text-fg-muted">{f.description}</span>
                          <span className="mt-1 block text-xs text-fg-subtle">
                            Data: {FACTOR_SOURCES[f.key].source}
                            {FACTOR_SOURCES[f.key].availability === 'optional' && ' · when available'}
                          </span>
                        </td>
                        <td className="w-16 py-3 text-right tabular text-fg-muted">
                          {f.weight} <span className="text-xs text-fg-subtle">pts</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            )
          })}
        </div>
      </section>

      {/* Rules */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.025em] text-fg">Rules that make it trustworthy</h2>
          <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {RULES.map((r) => (
              <li key={r.t} className="[&_svg]:size-5 [&_svg]:text-accent">
                {r.icon}
                <h3 className="mt-3 text-base font-semibold text-fg">{r.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{r.d}</p>
              </li>
            ))}
          </ul>
          <div className="mt-12 rounded-xl border border-border bg-bg p-5">
            <h3 className="text-sm font-semibold text-fg">Confidence labels</h3>
            <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-4">
              {[
                ['High', 'Plenty of consistent evidence across most factors.'],
                ['Medium', 'Enough for a fair read; some factors are thin.'],
                ['Low', 'Little or mixed evidence; pulled toward the category average.'],
                ['New launch', 'Fewer than 10 reviews or launched under 30 days ago.'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-medium text-fg">{k}</dt>
                  <dd className="mt-1 text-fg-muted">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Personal match */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.025em] text-fg">Personal Match</h2>
          <p className="mt-4 text-lg leading-relaxed text-fg-muted">
            The Product Score is the same for everyone. Personal Match (0–100) says how good an item is for you: your size and build, occasion, climate, budget,
            style and priorities.
          </p>
          <p className="mt-4 text-sm text-fg-muted">
            Your profile is optional, built only from what you tell us, editable, and deletable in one click.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Ranking, starting point</p>
          <p className="mt-3 font-mono text-lg text-fg">
            final = 0.6 × Product Score + 0.4 × Personal Match
          </p>
          <p className="mt-3 text-sm text-fg-muted">
            Then a diversity rule so the three picks aren’t near-duplicates: no two from the same brand and silhouette. Weights get tuned on what shoppers click, buy
            and keep.
          </p>
        </div>
      </section>

      {/* Pipeline */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.025em] text-fg">How a product gets rated</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-fg-muted">
            AI agents read the evidence. Plain code does the maths. Agents propose; code decides.
          </p>
          <ol className="mt-10 flex flex-col items-stretch gap-2 lg:flex-row lg:items-stretch">
            {PIPELINE.map((s, i) => (
              <li key={s.t} className="flex flex-1 flex-col items-center gap-2 lg:flex-row">
                <div className="w-full flex-1 rounded-xl border border-border bg-bg p-5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-fg-muted [&_svg]:size-3.5">
                    {s.kind === 'agent' ? <Bot aria-hidden /> : <Calculator aria-hidden />}
                    {s.kind === 'agent' ? 'AI agent' : 'Code'}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-fg">{s.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{s.d}</p>
                </div>
                {i < PIPELINE.length - 1 && <ArrowDown className="size-4 shrink-0 text-fg-subtle lg:-rotate-90" aria-hidden />}
              </li>
            ))}
          </ol>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: <ShieldAlert />, t: 'Reviews are data, not instructions', d: 'Review text is fenced off. Text that tries to manipulate the AI is flagged and its evidence is down-weighted.' },
              { icon: <Quote />, t: 'Quotes must be real', d: 'Every evidence quote must appear in its source review, or it is rejected.' },
              { icon: <FileCheck2 />, t: 'Every run is traced', d: 'Each model call and tool call is logged, so any score can be traced back to the steps that produced it.' },
            ].map((g) => (
              <div key={g.t} className="rounded-xl border border-border bg-bg p-5 [&_svg]:size-5 [&_svg]:text-accent">
                {g.icon}
                <h3 className="mt-3 text-sm font-semibold text-fg">{g.t}</h3>
                <p className="mt-1.5 text-sm text-fg-muted">{g.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/search">Try the search</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/developers">Use the Score API</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}

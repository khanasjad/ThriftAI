import Link from 'next/link'
import { ArrowRight, BadgeCheck, Ban, Gauge, Quote, Scale, Search, ShieldCheck, Sparkles, Trophy, BadgeDollarSign } from 'lucide-react'
import { SiteShell } from '@/components/site/shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/primitives'
import { PILLARS } from '@/components/veritas/score'
import { RETURN_REASON } from '@/components/veritas/labels'
import { catalogStats, fitSpotlight, returnReasonSummary } from '@/lib/veritas/read/catalog'

export const dynamic = 'force-dynamic'

const EXAMPLES = ['white tee that won’t go see-through', 'jeans that don’t stretch out', 'soft tee under $30', 'relaxed jeans for tall']

const PILLAR_COPY: Record<string, { q: string; factors: string }> = {
  FIT: { q: 'Will it fit me? Should I size up?', factors: 'True-to-size rate · size consistency · fit by body shape · fit returns · length · size range' },
  QUALITY: { q: 'Will it shrink, fade or pill?', factors: 'Fabric · construction · wash durability · wear resistance · longevity · quality returns' },
  STYLE_VALUE: { q: 'Is the price fair? Is the “sale” real?', factors: 'Value · price fairness · brand record · looks as pictured · trend · versatility · resale' },
  COMFORT: { q: 'Is it itchy, hot or stiff?', factors: 'Softness · breathability · stretch · skin friendliness · easy care' },
  SUSTAINABILITY: { q: 'Is it made responsibly? (optional)', factors: 'Certifications · ethical production · repair and take-back' },
}

export default async function HomePage() {
  const [stats, spotlight, returns] = await Promise.all([catalogStats(), fitSpotlight(), returnReasonSummary()])
  const topReturns = returns.reasons.filter((r) => r.reason !== 'OTHER' && r.reason !== 'CHANGED_MIND').slice(0, 4)
  const maxReturn = Math.max(1, ...topReturns.map((r) => r.count))

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--accent-soft),transparent_70%)] opacity-80"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <Link href="/how-it-works" className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-muted shadow-sm hover:text-fg">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              Development preview · how the score works
              <ArrowRight className="size-3" aria-hidden />
            </Link>
            <h1 className="mt-6 text-balance text-[clamp(2.5rem,6vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-fg">
              Is it worth buying?
              <br />
              <span className="text-fg-muted">Ask Veritas.</span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-fg-muted">
              One 0–100 score for clothing, built from 27 factors across fit, quality, comfort, style, value and ethics. Every number links to the reviews, returns
              and prices behind it.
            </p>

            <form action="/search" method="get" role="search" className="mt-8 max-w-xl">
              <label htmlFor="hero-q" className="sr-only">
                Describe what you’re looking for
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border-strong bg-surface p-1.5 shadow-md focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
                <Search className="ml-2.5 size-5 shrink-0 text-fg-subtle" aria-hidden />
                <input
                  id="hero-q"
                  name="q"
                  placeholder="e.g. jeans that don’t stretch out"
                  autoComplete="off"
                  className="h-11 min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle"
                />
                <Button type="submit" size="md">
                  Search
                </Button>
              </div>
            </form>
            <div className="mt-4 flex max-w-xl flex-wrap gap-2">
              {EXAMPLES.map((e) => (
                <Link
                  key={e}
                  href={`/search?q=${encodeURIComponent(e)}`}
                  className="inline-flex min-h-9 items-center rounded-full border border-border bg-surface px-3 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                >
                  {e}
                </Link>
              ))}
            </div>
          </div>

          {/* Evidence preview: real numbers from the test catalog */}
          <div className="relative">
            {spotlight ? (
              <figure className="rounded-2xl border border-border bg-surface p-6 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <Badge tone="neutral">Evidence preview</Badge>
                  <span className="text-xs text-fg-subtle">from the test catalog</span>
                </div>
                <p className="mt-5 text-sm text-fg-muted">
                  {spotlight.name} · <span className="text-fg-subtle">{spotlight.brand}</span>
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-fg">
                  <span className="tabular">{spotlight.runsSmall}</span> of <span className="tabular">{spotlight.total}</span> reviewers say it runs small.
                </p>
                <FitMeter small={spotlight.runsSmall} total={spotlight.total} />
                {spotlight.quote && (
                  <blockquote className="mt-5 rounded-lg bg-surface-2 p-4">
                    <Quote className="size-4 text-fg-subtle" aria-hidden />
                    <p className="mt-2 text-sm leading-relaxed text-fg">{spotlight.quote.text}</p>
                    <footer className="mt-2 text-xs text-fg-subtle">
                      {spotlight.quote.verified ? 'Verified review' : 'Review'} ·{' '}
                      {new Date(spotlight.quote.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </footer>
                  </blockquote>
                )}
                <figcaption className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
                  <span className="text-fg-muted">Fit &amp; sizing carries 35% of the score.</span>
                  <Link href={`/p/${spotlight.slug}`} className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
                    See the evidence <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </figcaption>
              </figure>
            ) : null}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section aria-label="Principles" className="border-y border-border bg-surface">
        <ul className="mx-auto grid max-w-6xl gap-px px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            { icon: <BadgeCheck />, t: 'Evidence on every number', d: 'Click any score to see the quotes, returns and prices behind it.' },
            { icon: <Ban />, t: 'No pay-for-score', d: 'Brands can fix their pages and send data. They can’t buy points.' },
            { icon: <Gauge />, t: 'Confidence on every score', d: 'High, medium, low or new launch, based on how much evidence exists.' },
            { icon: <Scale />, t: 'Thin evidence is shrunk', d: 'Six glowing reviews can’t beat six thousand solid ones.' },
          ].map((x) => (
            <li key={x.t} className="flex gap-3 py-6 [&_svg]:mt-0.5 [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-accent">
              {x.icon}
              <div>
                <p className="text-sm font-medium text-fg">{x.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-fg-muted">{x.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-accent">The problem</p>
          <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-tight tracking-[-0.025em] text-fg">
            Up to 1 in 4 clothing orders gets returned. Most returns are a question answered wrong.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-fg-muted">
            Will it fit? Will it last? Is the sale real? Shoppers answer these by opening ten tabs. Veritas answers them in one place, with sources.
          </p>
          <p className="mt-3 text-xs text-fg-subtle">Return rates: roughly 1 in 5 fashion purchases, 25–40% for apparel and footwear (Stellagent, citing True Fit).</p>
        </div>
      </section>

      {/* Score anatomy */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-accent">How the score works</p>
            <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.025em] text-fg">27 factors. Five pillars. One number.</h2>
          </div>
          <Button asChild variant="secondary">
            <Link href="/how-it-works">
              Read the methodology <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {PILLARS.map((p, i) => (
            <article
              key={p.key}
              className={`flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm ${i < 2 ? 'lg:col-span-3' : 'lg:col-span-2'}`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-base font-semibold text-fg">{p.label}</h3>
                <span className="text-sm font-semibold tabular text-fg">
                  {p.key === 'SUSTAINABILITY' ? '+' : ''}
                  {p.weight}%
                </span>
              </div>
              <p className="mt-2 text-sm text-fg-muted">{PILLAR_COPY[p.key].q}</p>
              <div className="mt-4 h-1.5 rounded-full bg-score-track" aria-hidden>
                <div className="h-full rounded-full bg-score-3" style={{ width: `${(p.weight / 35) * 100}%` }} />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-fg-subtle">{PILLAR_COPY[p.key].factors}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Search experience */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-medium text-accent">For shoppers</p>
            <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.025em] text-fg">Three good picks, not 300 results.</h2>
            <p className="mt-4 text-lg leading-relaxed text-fg-muted">
              Type what you need. If one missing detail would change the best pick, Veritas asks one question with tap-to-answer chips, then shows three picks
              with the reasons.
            </p>
            <p className="mt-3 text-sm text-fg-subtle">Conversational search is in development. Keyword search over the test catalog works today.</p>
          </div>
          <ol className="grid gap-3">
            {[
              { icon: <Trophy />, t: 'Best overall', d: 'Highest blend of the Veritas Score and your Personal Match.' },
              { icon: <BadgeDollarSign />, t: 'Best value', d: 'The most score per dollar within your budget.' },
              { icon: <Sparkles />, t: 'Wildcard', d: 'Most on-trend, most sustainable, or a new launch worth trying.' },
            ].map((x, i) => (
              <li key={x.t} className="flex items-start gap-4 rounded-xl border border-border bg-bg p-5 [&_svg]:size-5 [&_svg]:text-accent">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft">{x.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-fg">
                    <span className="mr-2 text-fg-subtle tabular">{i + 1}</span>
                    {x.t}
                  </p>
                  <p className="mt-1 text-sm text-fg-muted">{x.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Audiences */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-24 sm:px-6 lg:grid-cols-2 [&>*]:min-w-0">
        <article className="flex flex-col rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <p className="text-sm font-medium text-accent">For brands</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-fg">See why products get returned, ranked by what it costs you.</h2>
          <div className="mt-6 rounded-xl border border-border bg-bg p-5">
            <p className="text-xs font-medium text-fg-subtle">
              Top return reasons · test catalog · {returns.total.toLocaleString()} returns
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {topReturns.map((r) => (
                <li key={r.reason}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-fg">{RETURN_REASON[r.reason] ?? r.reason}</span>
                    <span className="tabular text-fg-muted">
                      {r.count} returns · {r.products} products
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-score-track" aria-hidden>
                    <div className="h-full rounded-full bg-score-4" style={{ width: `${(r.count / maxReturn) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/pilot">Get a free pilot scorecard</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/brands">What brands see</Link>
            </Button>
          </div>
        </article>

        <article className="flex flex-col rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <p className="text-sm font-medium text-accent">For search and AI platforms</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-fg">Rank by what’s worth buying, not only by what sells.</h2>
          <pre tabIndex={0} className="mt-6 overflow-x-auto rounded-xl border border-border bg-bg p-5 font-mono text-[13px] leading-relaxed text-fg">
            <code>
              <span className="text-fg-subtle">$ </span>curl /api/v1/products/<span className="text-accent">{spotlight?.slug ?? '{slug}'}</span>
              {'\n\n'}
              <span className="text-fg-subtle">{'{ "data": {'}</span>
              {'\n  "rated": true,\n  "overallScore": 0-100,\n  "confidenceLabel": "HIGH",\n  "fitScore": …, "qualityScore": …,\n  "factors": [{ "factor", "value", "evidenceCount" }]\n'}
              <span className="text-fg-subtle">{'} }'}</span>
            </code>
          </pre>
          <p className="mt-4 text-sm text-fg-muted">
            Feed the score into Constructor, Algolia or Shopify search, or let AI shopping agents rank by it. We complement search, we don’t replace it.
          </p>
          <div className="mt-6">
            <Button asChild variant="secondary">
              <Link href="/developers">
                Score API docs <ArrowRight />
              </Link>
            </Button>
          </div>
        </article>
      </section>

      {/* Catalog facts + CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-14 text-center shadow-sm sm:px-12">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_100%,var(--accent-soft),transparent_70%)]" />
          <div className="relative">
            <ShieldCheck className="mx-auto size-8 text-accent" aria-hidden />
            <h2 className="mx-auto mt-4 max-w-2xl text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.025em] text-fg">
              Constructor shows you what sells. Veritas shows you what’s worth buying.
            </h2>
            <dl className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                ['Products', stats.products],
                ['Reviews', stats.reviews],
                ['Returns', stats.returns],
                ['Price checks', stats.prices],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-xs text-fg-subtle">{k}</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular text-fg">{(v as number).toLocaleString()}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-fg-subtle">
              Test catalog: {stats.brands} fictional brands, {stats.sellers} fictional sellers. {stats.rated} of {stats.products} products rated so far.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/search">Try the search</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/brands/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}

/** Share of reviewers who say "runs small". One series, so no legend; the sentence above names it. */
function FitMeter({ small, total }: { small: number; total: number }) {
  const pct = total ? (small / total) * 100 : 0
  return (
    <div className="mt-4">
      <div className="h-2 rounded-full bg-score-track" role="img" aria-label={`${Math.round(pct)}% of reviewers say it runs small`}>
        <div className="h-full rounded-full bg-score-4" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-fg-subtle tabular">
        <span>{Math.round(pct)}% say runs small</span>
        <span>{total} reviews</span>
      </div>
    </div>
  )
}

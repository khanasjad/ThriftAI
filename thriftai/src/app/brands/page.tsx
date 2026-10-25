import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BarChart3, Plug, Radar, Ruler, Tag, TrendingUp } from 'lucide-react'
import { SiteShell } from '@/components/site/shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/primitives'
import { PREVENTABLE_RETURNS, RETURN_REASON } from '@/components/veritas/labels'
import { listBrands, returnReasonSummary } from '@/lib/veritas/read/catalog'

export const metadata: Metadata = {
  title: 'For brands',
  description: 'See why your products sell, get returned or get kept, ranked by cost, with the evidence behind every number.',
}
export const dynamic = 'force-dynamic'

const FEATURES = [
  { icon: <BarChart3 />, t: 'Score for every product', d: 'Clothing Score and pillar breakdown for every product, compared with category peers.' },
  { icon: <TrendingUp />, t: 'Top problems ranked by cost', d: '“Runs small”, “fades after washing”, “photo colour inaccurate”, each with the reviews and returns behind it.' },
  { icon: <Ruler />, t: 'Size-chart corrections', d: 'Suggestions from fit evidence: which sizes run off, and by how much.' },
  { icon: <Tag />, t: 'Price position', d: 'Where each product sits on value versus similar items from other brands.' },
  { icon: <Radar />, t: 'Launch watch', d: 'An early warning when a new launch’s first signals turn negative.' },
  { icon: <Plug />, t: 'Score API', d: 'Feed the score into your site search and product pages.' },
]

export default async function BrandsPage() {
  const brands = await listBrands()
  const summaries = await Promise.all(brands.map(async (b) => ({ brand: b, s: await returnReasonSummary(b.slug) })))
  // Example brand: the one with the most preventable returns in the test catalog.
  const example = summaries
    .map((x) => ({ ...x, preventable: x.s.reasons.filter((r) => PREVENTABLE_RETURNS.has(r.reason)).reduce((n, r) => n + r.count, 0) }))
    .sort((a, b) => b.preventable - a.preventable)[0]
  const problems = example?.s.reasons.filter((r) => PREVENTABLE_RETURNS.has(r.reason)).slice(0, 5) ?? []
  const max = Math.max(1, ...problems.map((p) => p.count))

  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 h-[440px] bg-[radial-gradient(60%_60%_at_30%_0%,var(--accent-soft),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-medium text-accent">For brands</p>
            <h1 className="mt-3 text-balance text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-fg">
              Sales data shows you what sells. Veritas shows you what’s worth buying.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-fg-muted">
              Your products scored on the same 27 factors shoppers see, plus the reasons behind each number, so you know what to fix first.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/pilot">Get a free pilot scorecard</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/brands/pricing">Pricing</Link>
              </Button>
            </div>
          </div>

          {example && (
            <figure className="rounded-2xl border border-border bg-surface p-6 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <Badge tone="neutral">Preventable returns</Badge>
                <span className="text-xs text-fg-subtle">test brand · real counts</span>
              </div>
              <p className="mt-4 text-sm text-fg-muted">{example.brand.name}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-fg">
                <span className="tabular">{example.preventable}</span> of <span className="tabular">{example.s.total}</span> returns were preventable.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {problems.map((p) => (
                  <li key={p.reason}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-fg">{RETURN_REASON[p.reason] ?? p.reason}</span>
                      <span className="tabular text-fg-muted">
                        {p.count} · {p.products} {p.products === 1 ? 'product' : 'products'}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-score-track" aria-hidden>
                      <div className="h-full rounded-full bg-score-4" style={{ width: `${(p.count / max) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              <figcaption className="mt-5 border-t border-border pt-4 text-xs text-fg-subtle">
                Preventable = fit, quality, defects and “not as described”. In the brand dashboard each line links to the reviews behind it and is ranked by
                your own return costs.
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.025em] text-fg">What a brand sees</h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.t} className="rounded-xl border border-border bg-bg p-6 [&_svg]:size-5 [&_svg]:text-accent">
                {f.icon}
                <h3 className="mt-3 text-base font-semibold text-fg">{f.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{f.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr] [&>*]:min-w-0">
        <div>
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.025em] text-fg">Your score is earned, never bought.</h2>
          <p className="mt-4 text-lg leading-relaxed text-fg-muted">
            Brand value comes from evidence across your products: consistency, return rates, honest photos and prices. Not from fame or ad spend. You can send
            data and fix your pages; you can’t pay for points.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-fg">Brands in the test catalog</h3>
          <p className="mt-1 text-xs text-fg-subtle">Fictional brands used to build and test Veritas.</p>
          <ul className="mt-4 divide-y divide-border">
            {brands.map((b) => (
              <li key={b.slug} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-fg">{b.name}</p>
                  {b.description && <p className="truncate text-fg-muted">{b.description}</p>}
                </div>
                <Link href={`/search?q=${encodeURIComponent(b.name)}`} className="inline-flex shrink-0 items-center gap-1 text-accent hover:underline">
                  {b.products} products <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteShell>
  )
}

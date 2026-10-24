import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { SiteShell } from '@/components/site/shell'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Pricing', description: 'Veritas plans for brands and platforms: Starter, Growth, Pro and Platform.' }

// Exactly as in the product plan (docs/rpi/00-PRODUCT-PLAN.md, "Brand product and pricing").
const PLANS = [
  { name: 'Starter', for: 'Small DTC brands', price: '$299', unit: '/month', features: ['Scores and insights for up to 500 products', 'Monthly refresh'] },
  {
    name: 'Growth',
    for: 'Growing brands',
    price: '$799',
    unit: '/month',
    features: ['Up to 2,500 products', 'Weekly refresh', 'Score API', 'Launch watch'],
    highlight: true,
  },
  { name: 'Pro', for: 'Mid-market', price: '$2,000', unit: '/month', features: ['Unlimited products', 'Daily refresh', 'Search integration', 'Trend insights'] },
  { name: 'Platform', for: 'Marketplaces, search vendors, AI agents', price: 'Annual contract', unit: '', features: ['Score feed and API at scale'] },
]

const ALL = ['Clothing Score and pillar breakdown per product', 'Top problems ranked by cost', 'Size-chart suggestions', 'Price-position insight', 'Evidence behind every number']

export default function PricingPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 text-center sm:px-6">
        <p className="text-sm font-medium text-accent">Pricing</p>
        <h1 className="mx-auto mt-3 max-w-2xl text-balance text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-fg">
          Pay for insight and freshness. Never for points.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-fg-muted">Every plan gets the same scoring. Plans differ in catalog size, refresh rate and integrations.</p>
      </section>

      <section aria-label="Plans" className="mx-auto max-w-6xl px-4 sm:px-6">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <li
              key={p.name}
              className={cn(
                'flex flex-col rounded-2xl border bg-surface p-6 shadow-sm',
                p.highlight ? 'border-accent shadow-md ring-4 ring-accent-soft' : 'border-border',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-fg">{p.name}</h2>
                {p.highlight && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">Includes the API</span>}
              </div>
              <p className="mt-1 text-sm text-fg-muted">{p.for}</p>
              <p className="mt-6 text-fg">
                <span className={cn('font-semibold tracking-tight tabular', p.unit ? 'text-4xl' : 'text-2xl')}>{p.price}</span>
                <span className="text-sm text-fg-muted">{p.unit}</span>
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-fg">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant={p.highlight ? 'primary' : 'secondary'} className="mt-8 w-full">
                <Link href="/pilot">{p.name === 'Platform' ? 'Talk to us' : 'Start with a free pilot'}</Link>
              </Button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-sm text-fg-subtle">Prices are being validated with pilot brands and may change before launch.</p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-base font-semibold text-fg">In every plan</h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            {ALL.map((f) => (
              <li key={f} className="flex items-start gap-2 text-fg">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-base font-semibold text-fg">Free pilot scorecard</h2>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            A one-time scorecard of your catalog, built from your own reviews and return reasons. No commitment; you keep the report.
          </p>
          <Button asChild className="mt-6">
            <Link href="/pilot">Apply for a pilot</Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, ChevronRight, ShoppingBag } from 'lucide-react'
import { ProductGallery } from '@/components/veritas/product-gallery'
import { ScoreRing } from '@/components/veritas/score-ring'
import { ConfidenceBadge } from '@/components/veritas/badges'
import { FactorRow, PillarBars } from '@/components/veritas/bars'
import { PILLARS, formatPrice, type Pillar } from '@/components/veritas/score'
import { storeProduct } from '@/lib/veritas/read/store-demo'
import { env } from '@/lib/veritas/env'
import { DemoBanner, HeadsUpList, Stars, StoreHeader } from '../parts'
import { DriverTiles } from '@/components/veritas/drivers'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const d = await storeProduct(slug)
  if (!d) notFound()
  return { title: `${d.listing.name} · Demo store`, robots: { index: false } }
}

export default async function DemoStoreProduct({ params }: Props) {
  // Off in production unless DEMO_STORE=1: it would show real products under a fictional store name.
  if (env().APP_ENV === 'production' && !env().DEMO_STORE) notFound()
  const { slug } = await params
  const d = await storeProduct(slug)
  if (!d) notFound()
  const { listing: it, factors, text } = d
  const included = factors.filter((f) => f.value !== null).length

  return (
    <div className="min-h-dvh bg-bg">
      <DemoBanner />
      <StoreHeader q={it.category === 'BOTTOMS' ? 'jeans' : 't-shirt'} />
      <main id="main-content" className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-fg-subtle">
          <Link href={`/demo/store?q=${it.category === 'BOTTOMS' ? 'jeans' : 't-shirt'}`} className="hover:text-fg">
            {it.category === 'BOTTOMS' ? 'Jeans' : 'T-shirts'}
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="truncate text-fg-muted" aria-current="page">
            {it.name}
          </span>
        </nav>

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <ProductGallery name={it.name} category={it.category} subcategory={it.subcategory} silhouette={it.silhouette} colors={it.colors} pattern={it.pattern} />

          <div className="flex min-w-0 flex-col gap-6">
            {/* The store's own buy box */}
            <section aria-labelledby="buy-h">
              <p className="text-sm text-accent">Visit the {it.brand} store</p>
              <h1 id="buy-h" className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-fg">
                {it.brand} {it.name}
              </h1>
              <div className="mt-2">
                <Stars value={it.stars} count={it.reviewCount} size="md" />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular text-fg">
                {formatPrice(it.price)}
                {it.listPrice && (
                  <>
                    <s className="ml-2 text-base font-normal text-fg-subtle">{formatPrice(it.listPrice)}</s>
                    <span className="ml-2 rounded bg-critical-soft px-1.5 py-0.5 align-middle text-xs font-medium text-critical-fg">Sale</span>
                  </>
                )}
              </p>
              <fieldset className="mt-4">
                <legend className="text-sm text-fg-muted">Size</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {d.sizes.map((s) => (
                    <span key={s} className="inline-flex min-w-11 items-center justify-center rounded-md border border-border-strong px-2.5 py-1.5 text-sm text-fg">
                      {s}
                    </span>
                  ))}
                </div>
              </fieldset>
              <button type="button" disabled className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-fg/80 px-5 text-sm font-medium text-bg opacity-60">
                <ShoppingBag className="size-4" aria-hidden /> Add to bag (demo)
              </button>
            </section>

            {/* What the Score API adds */}
            <section aria-labelledby="veritas-h" className="rounded-2xl border-2 border-accent/40 bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 id="veritas-h" className="text-sm font-semibold uppercase tracking-wide text-accent">
                  Veritas Score
                </h2>
                <span className="text-xs text-fg-subtle">via the Score API</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-5">
                <ScoreRing score={it.score} size="lg" />
                <div className="min-w-0 flex-1">
                  {it.label && <ConfidenceBadge label={it.label} reviewCount={it.reviewCount} />}
                  <p className="mt-2 text-sm text-fg-muted">
                    {it.score === null ? 'Not enough evidence for a score yet.' : `Built from ${included} of 27 factors, ${it.reviewCount} reviews, return records and 90 days of prices.`}
                  </p>
                  {text?.sizeAdvice && (
                    <p className="mt-2 text-sm text-fg">
                      <span className="font-medium">Size advice:</span> {text.sizeAdvice}
                    </p>
                  )}
                </div>
              </div>

              {d.drivers && <DriverTiles drivers={d.drivers} className="mt-4" />}

              <HeadsUpList items={it.headsUp} className="mt-4 [&_li]:text-sm" />

              {text?.summary && <p className="mt-4 text-sm leading-relaxed text-fg">{text.summary}</p>}
              {text?.downside && (
                <p className="mt-2 text-sm text-fg-muted">
                  <span className="font-medium text-fg">Watch out:</span> {text.downside}
                </p>
              )}

              <div className="mt-5">
                <PillarBars values={it.pillars} />
              </div>

              <details className="group mt-4 rounded-lg border border-border">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-fg">
                  All 27 factors ({included} with evidence)
                  <ChevronRight className="size-4 text-fg-subtle transition-transform group-open:rotate-90" aria-hidden />
                </summary>
                <div className="border-t border-border px-1 pb-2">
                  {PILLARS.map((p) => (
                    <div key={p.key} className="mt-3">
                      <h3 className="px-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{p.label}</h3>
                      {factors
                        .filter((f) => (f.pillar as Pillar) === p.key)
                        .map((f) => (
                          <FactorRow key={f.key} name={f.name} weight={f.weight} value={f.value} evidenceCount={f.evidenceCount} />
                        ))}
                    </div>
                  ))}
                </div>
              </details>

              <Link href={`/p/${it.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent underline underline-offset-4">
                Full report with the evidence behind every number <ArrowRight className="size-4" aria-hidden />
              </Link>
            </section>

            {/* The store's own reviews */}
            <section aria-labelledby="rev-h">
              <h2 id="rev-h" className="text-base font-semibold text-fg">
                Top customer reviews
              </h2>
              <ul className="mt-3 flex flex-col gap-3">
                {d.reviews.map((r) => (
                  <li key={r.id} className="rounded-lg border border-border bg-surface p-4">
                    <Stars value={r.rating} />
                    {r.title && <p className="mt-1 text-sm font-medium text-fg">{r.title}</p>}
                    <p className="mt-1 text-sm text-fg-muted">{r.content}</p>
                    {r.isVerifiedPurchase && <p className="mt-1 text-xs text-fg-subtle">Verified purchase</p>}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

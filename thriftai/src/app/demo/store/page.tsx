import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductThumb } from '@/components/veritas/product-thumb'
import { ScoreRing } from '@/components/veritas/score-ring'
import { CONFIDENCE, formatPrice } from '@/components/veritas/score'
import { cn } from '@/lib/utils'
import { storeSearch, type StoreSort } from '@/lib/veritas/read/store-demo'
import { DemoBanner, HeadsUpList, Stars, StoreHeader } from './parts'
import { AD_MIN_SCORE, pickSponsored } from '@/lib/veritas/ads/rules'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Demo store',
  description: 'A fictional store showing the Veritas Score next to star ratings, through the Score API.',
  robots: { index: false },
}

const SORTS: { key: StoreSort; label: string }[] = [
  { key: 'featured', label: 'Featured (stars)' },
  { key: 'veritas', label: 'Veritas Score' },
  { key: 'price', label: 'Price: low to high' },
]

type Props = { searchParams: Promise<{ q?: string; sort?: string }> }

export default async function DemoStorePage({ searchParams }: Props) {
  const sp = await searchParams
  const q = (sp.q ?? 't-shirt').slice(0, 80)
  const sort: StoreSort = SORTS.some((s) => s.key === sp.sort) ? (sp.sort as StoreSort) : 'featured'
  const { items } = await storeSearch(q, sort)

  // Demo sponsors (fictional brands). The rule, not the sponsor, decides: eligible products only, never in the top 3.
  const SPONSORS = ['hollow-pine-supply', 'velo-thread']
  const [sponsored] = pickSponsored(items, SPONSORS, items.slice(0, 3).map((x) => x.slug))
  const shown = sponsored ? [...items.slice(0, 3).filter((x) => x.slug !== sponsored.slug), { ...sponsored, isSponsored: true }, ...items.slice(3).filter((x) => x.slug !== sponsored.slug)] : items

  // The gap the demo is about: the store's top-starred item vs. where Veritas puts it.
  const byStars = [...items].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0) || b.reviewCount - a.reviewCount)[0]
  const byScore = [...items].filter((x) => x.score !== null).sort((a, b) => b.score! - a.score!)[0]

  return (
    <div className="min-h-dvh bg-bg">
      <DemoBanner />
      <StoreHeader q={q} />
      <main id="main-content" className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-fg">
              {items.length} results for “{q}”
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-fg-muted">
              Stars are how buyers felt when the parcel arrived. The Veritas Score adds what happened next: did it fit, was it sent back, did it survive the wash, was
              the sale price real.
            </p>
          </div>
          <nav aria-label="Sort results" className="flex flex-wrap gap-1.5">
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={`/demo/store?q=${encodeURIComponent(q)}&sort=${s.key}`}
                aria-current={s.key === sort ? 'true' : undefined}
                className={cn(
                  'inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm transition-colors',
                  s.key === sort ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong bg-surface text-fg hover:bg-surface-2',
                )}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        </div>

        {byStars && byScore && byStars.slug !== byScore.slug && (
          <p className="mt-5 rounded-xl border border-border bg-surface p-4 text-sm text-fg-muted">
            <span className="font-medium text-fg">Most stars:</span> {byStars.name} ({byStars.stars?.toFixed(1)}★
            {byStars.score !== null ? `, Veritas ${Math.round(byStars.score)}` : ', not rated'}).{' '}
            <span className="font-medium text-fg">Highest Veritas Score:</span> {byScore.name} ({Math.round(byScore.score!)}, {byScore.stars?.toFixed(1)}★).
          </p>
        )}

        {items.length === 0 ? (
          <p className="mt-10 text-center text-fg-muted">No results. Try “t-shirt” or “jeans”.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((it) => (
              <li key={it.slug} className="relative">
                <Link
                  href={`/demo/store/${it.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-[box-shadow,border-color] hover:border-border-strong hover:shadow-md"
                >
                  <ProductThumb category={it.category} subcategory={it.subcategory} silhouette={it.silhouette} color={it.colors[0]} className="aspect-[5/4] rounded-none" />
                  {'isSponsored' in it && (
                    <p className="border-b border-border bg-surface-2 px-4 py-1.5 text-xs text-fg-muted">
                      <span className="font-semibold text-fg">Sponsored</span> · shown because it scores {AD_MIN_SCORE}+ with enough evidence and an honest price. Sponsors can’t buy a top-3 spot or a
                      better score.
                    </p>
                  )}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h2 className="text-sm font-medium leading-snug text-fg group-hover:underline group-hover:underline-offset-4">
                      {it.brand} {it.name}
                    </h2>
                    <Stars value={it.stars} count={it.reviewCount} />
                    <p className="text-base font-semibold tabular text-fg">
                      {formatPrice(it.price)}
                      {it.listPrice && <s className="ml-2 text-sm font-normal text-fg-subtle">{formatPrice(it.listPrice)}</s>}
                      <span className="ml-2 text-xs font-normal text-fg-subtle">
                        {it.sellerCount} seller{it.sellerCount === 1 ? '' : 's'}
                      </span>
                    </p>

                    <div className="mt-auto rounded-lg border border-border bg-bg p-3">
                      <div className="flex items-center gap-3">
                        <ScoreRing score={it.score} size="sm" />
                        <div className="min-w-0 text-xs">
                          <p className="font-semibold text-fg">Veritas Score</p>
                          <p className="text-fg-subtle">
                            {it.score === null ? 'Not enough evidence yet' : `${it.label ? CONFIDENCE[it.label].label : ''} · ${it.factorsIncluded} of 27 factors`}
                          </p>
                        </div>
                      </div>
                      <HeadsUpList items={it.headsUp} className="mt-2.5" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

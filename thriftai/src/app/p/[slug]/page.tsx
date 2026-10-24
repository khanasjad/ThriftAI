import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, BadgeCheck, ChevronRight, Clock, Flag, Languages, Star, Tag } from 'lucide-react'
import { SiteShell } from '@/components/site/shell'
import { Badge } from '@/components/ui/primitives'
import { PriceHistory } from '@/components/veritas/price-history'
import { ProductThumb } from '@/components/veritas/product-thumb'
import { TrendTag } from '@/components/veritas/badges'
import { CATEGORY, GENDER, RETURN_REASON } from '@/components/veritas/labels'
import { formatPrice, type Pillar } from '@/components/veritas/score'
import type { EvidenceItem } from '@/components/veritas/evidence-drawer'
import { FACTOR_TAXONOMY } from '@/lib/veritas/taxonomy/factor-taxonomy'
import { getProductPage, type ProductPageData, type ProductReview } from '@/lib/veritas/read/catalog'
import { ScorePanel, type FactorMeta } from './score-panel'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getProductPage(slug)
  if (!data) return { title: 'Product not found' }
  const { product, brand, score } = data
  return {
    title: `${product.name} · ${brand.name}`,
    alternates: { canonical: `/p/${product.slug}` },
    description: score
      ? `Veritas Score ${score.overall}/100 for ${product.name}, with the evidence behind every number.`
      : `${product.name} by ${brand.name}: what reviewers report about fit and quality, price history and return reasons.`,
  }
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const data = await getProductPage(slug)
  if (!data) notFound()
  const { product, brand, score, reported, returns, prices, reviews } = data

  const factors: FactorMeta[] = FACTOR_TAXONOMY.map((f) => ({ key: f.key, name: f.name, pillar: f.pillar as Pillar, weight: f.weight }))
  const factorValues = Object.fromEntries(data.factors.map((f) => [f.factor, { value: f.value, evidenceCount: f.evidenceCount }]))
  const evidenceByFactor = groupEvidence(data.evidence)
  const priceRange = prices.facts.current.length
    ? { min: prices.facts.current[0].price, max: prices.facts.current.at(-1)!.price, sellers: prices.facts.current.length }
    : null

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-fg-subtle">
          <Link href="/search" className="hover:text-fg">
            Search
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <Link href={`/search?category=${product.category}`} className="hover:text-fg">
            {CATEGORY[product.category] ?? product.category}
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="truncate text-fg-muted" aria-current="page">
            {product.name}
          </span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          {/* Left column */}
          <aside className="order-2 flex flex-col gap-6 lg:order-none lg:sticky lg:top-24 lg:self-start">
            <ProductThumb category={product.category} subcategory={product.subcategory} label={product.name} className="rounded-2xl" />
            <SpecCard data={data} />
          </aside>

          {/* Right column */}
          <div className="order-1 flex min-w-0 flex-col gap-6 lg:order-none">
            <header>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{CATEGORY[product.category] ?? product.category}</Badge>
                <Badge tone="neutral">{GENDER[product.gender] ?? product.gender}</Badge>
                {product.trendTag && <TrendTag tag={product.trendTag} />}
                {product.launchDate && Date.now() - new Date(product.launchDate).getTime() < 30 * 864e5 && <Badge tone="accent">New launch</Badge>}
              </div>
              <h1 className="mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.025em] text-fg">{product.name}</h1>
              <p className="mt-2 text-lg text-fg">
                {priceRange && priceRange.min !== priceRange.max ? (
                  <>
                    <span className="font-semibold tabular">
                      {formatPrice(priceRange.min, product.currency)}–{formatPrice(priceRange.max, product.currency)}
                    </span>
                    <span className="text-sm text-fg-muted"> across {priceRange.sellers} sellers</span>
                  </>
                ) : (
                  <span className="font-semibold tabular">{formatPrice(product.price, product.currency)}</span>
                )}
              </p>
              <p className="mt-1 text-sm text-fg-muted">by {brand.name}</p>
            </header>

            <ScorePanel
              score={score}
              factors={factors}
              factorValues={factorValues}
              evidenceByFactor={evidenceByFactor}
              inputs={{ reviews: reported.reviewCount, returns: returns.total, prices: prices.series.reduce((s, x) => s + x.points.length, 0) }}
              showTraceLink={process.env.APP_ENV !== 'production'}
            />

            {score?.sizeAdvice || score?.downside ? (
              <section className="grid gap-3 sm:grid-cols-2">
                {score.sizeAdvice && <Callout title="Size advice" body={score.sizeAdvice} />}
                {score.downside && <Callout title="Main downside" body={score.downside} />}
              </section>
            ) : null}

            <ReportedFit fit={reported.fit} total={reported.reviewCount} />
            <ReportedIssues data={data} />
            <PriceSection data={data} />
            <ReturnsSection returns={returns} />
            <ReviewsSection reviews={reviews} avg={reported.ratingAvg} />

            <p className="text-xs text-fg-subtle">
              Data source: {product.source === 'dev-fixture' ? 'fictional test data generated for development' : product.source}
              {product.licence && ` · licence: ${product.licence}`}.
            </p>
          </div>
        </div>
      </div>
    </SiteShell>
  )
}

function groupEvidence(evidence: ProductPageData['evidence']) {
  const out: Record<string, EvidenceItem[]> = {}
  const KIND: Record<string, EvidenceItem['kind']> = { REVIEW: 'review', RETURN: 'return', SPEC: 'spec', PRICE: 'price', TREND: 'trend', BRAND: 'brand', MANUAL: 'spec' }
  for (const e of evidence) {
    ;(out[e.factor] ??= []).push({
      id: e.id,
      kind: KIND[e.sourceType] ?? 'review',
      quote: e.quote ?? e.signal.replace(/_/g, ' '),
      signal: e.signal.replace(/_/g, ' '),
      sentiment: e.sentiment,
      source: `${e.verified ? 'Verified review' : e.sourceType === 'REVIEW' ? 'Review' : e.sourceType.toLowerCase()} · ${fmtDate(e.date)}`,
      flagged: e.injectionFlag,
    })
  }
  return out
}

function Section({ id, title, aside, children }: { id: string; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id} className="text-base font-semibold text-fg">
          {title}
        </h2>
        {aside && <span className="text-xs text-fg-subtle">{aside}</span>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Callout({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-fg">{body}</p>
    </div>
  )
}

/** Diverging: runs small ← true to size (neutral) → runs large. Legend + counts, so colour is never the only cue. */
function ReportedFit({ fit, total }: { fit: Record<'runs_small' | 'true_to_size' | 'runs_large', number>; total: number }) {
  const answered = fit.runs_small + fit.true_to_size + fit.runs_large
  const segs = [
    { key: 'runs_small', label: 'Runs small', n: fit.runs_small, color: 'var(--series-2)' },
    { key: 'true_to_size', label: 'True to size', n: fit.true_to_size, color: 'var(--axis)' },
    { key: 'runs_large', label: 'Runs large', n: fit.runs_large, color: 'var(--series-1)' },
  ]
  const top = [...segs].sort((a, b) => b.n - a.n)[0]
  return (
    <Section id="fit-h" title="What reviewers say about fit" aside={`${answered} of ${total} reviews answered`}>
      {answered === 0 ? (
        <p className="text-sm text-fg-muted">No reviewer has said how it fits yet.</p>
      ) : (
        <>
          <p className="text-sm text-fg">
            Most say <span className="font-semibold">{top.label.toLowerCase()}</span>{' '}
            <span className="text-fg-muted tabular">
              ({top.n} of {answered}, {Math.round((top.n / answered) * 100)}%)
            </span>
            .
          </p>
          <div className="mt-4 flex h-3 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={segs.map((s) => `${s.label} ${s.n}`).join(', ')}>
            {segs
              .filter((s) => s.n > 0)
              .map((s) => (
                <div key={s.key} title={`${s.label}: ${s.n}`} style={{ width: `${(s.n / answered) * 100}%`, background: s.color }} />
              ))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {segs.map((s) => (
              <li key={s.key} className="inline-flex items-center gap-2 text-fg-muted">
                <span className="size-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
                {s.label} <span className="font-medium tabular text-fg">{s.n}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  )
}

function ReportedIssues({ data }: { data: ProductPageData }) {
  const { issues } = data.reported
  const rows = [
    { label: 'Pilling', ...issues.pilling },
    { label: 'Colour fading', ...issues.fading },
    { label: 'Shrinkage', ...issues.shrinkage },
  ].filter((r) => r.recorded > 0)
  // Without structured answers, these problems live only in review text, which the evidence agent reads.
  if (rows.length === 0) return null
  return (
    <Section id="issues-h" title="Wear and wash problems reported">
      <dl className="grid grid-cols-3 gap-3">
        {rows.map((r) => (
          <div key={r.label} className="rounded-xl bg-surface-2 p-4">
            <dt className="text-xs text-fg-subtle">{r.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular text-fg">{r.yes}</dd>
            <dd className="text-xs text-fg-subtle tabular">of {r.recorded} who answered</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}

function PriceSection({ data }: { data: ProductPageData }) {
  const { series, facts } = data.prices
  const cur = data.product.currency
  if (series.length === 0) {
    return (
      <Section id="price-h" title="Price history">
        <p className="text-sm text-fg-muted">No price observations yet.</p>
      </Section>
    )
  }
  return (
    <Section id="price-h" title="Price history" aside={`${facts.days} days · ${series.length} sellers`}>
      <PriceHistory series={series} currency={cur} fakeDiscount={!!facts.fakeDiscount} oftenCheaper={!!facts.oftenCheaper} />
      <ul className="mt-5 flex flex-col gap-2 text-sm">
        {facts.lowest && (
          <li className="flex items-start gap-2 text-fg-muted">
            <Tag className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
            <span>
              Lowest in {facts.days} days: <span className="font-medium tabular text-fg">{formatPrice(facts.lowest.price, cur)}</span> at {facts.lowest.seller} on{' '}
              {fmtDate(facts.lowest.date)}.
            </span>
          </li>
        )}
        {facts.fakeDiscount && (
          <li className="flex items-start gap-2 text-fg-muted">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-fg" aria-hidden />
            <span>
              <span className="font-medium text-fg">Inflated “was” price.</span> A seller showed {formatPrice(facts.fakeDiscount.listPrice, cur)} as the original
              price, but no seller charged more than {formatPrice(facts.fakeDiscount.highestCharged, cur)} in this period.
            </span>
          </li>
        )}
        {facts.oftenCheaper && (
          <li className="flex items-start gap-2 text-fg-muted">
            <Clock className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
            <span>
              <span className="font-medium text-fg">Often cheaper. Consider waiting.</span> Today’s lowest is {formatPrice(facts.oftenCheaper.nowLowest, cur)}; it
              has been {formatPrice(facts.oftenCheaper.lowest, cur)}.
            </span>
          </li>
        )}
      </ul>
      {facts.current.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <h3 className="text-sm font-medium text-fg">Latest price by seller</h3>
          <ul className="mt-2 divide-y divide-border">
            {facts.current.map((c) => (
              <li key={c.seller} className="flex items-center justify-between py-2 text-sm">
                <span className="text-fg-muted">{c.seller}</span>
                <span className="font-medium tabular text-fg">{formatPrice(c.price, cur)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  )
}

function ReturnsSection({ returns }: { returns: ProductPageData['returns'] }) {
  const max = Math.max(1, ...returns.reasons.map((r) => r.count))
  return (
    <Section id="returns-h" title="Why people sent it back" aside={`${returns.total} returns`}>
      {returns.total === 0 ? (
        <p className="text-sm text-fg-muted">No returns recorded.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {returns.reasons.map((r) => (
            <li key={r.reason}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-fg">{RETURN_REASON[r.reason] ?? r.reason}</span>
                <span className="tabular text-fg-muted">
                  {r.count} <span className="text-fg-subtle">({Math.round((r.count / returns.total) * 100)}%)</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-score-track" aria-hidden>
                <div className="h-full rounded-full bg-score-4" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

const FITS_AS: Record<string, string> = { runs_small: 'Runs small', true_to_size: 'True to size', runs_large: 'Runs large' }

function ReviewCard({ r }: { r: ProductReview }) {
  return (
    <article className="py-5 first:pt-0">
      {r.flagged && (
        <p className="mb-3 flex items-start gap-2 rounded-lg border border-warning/50 bg-warning-soft px-3 py-2 text-xs text-warning-fg">
          <Flag className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          This review contains text that looks like an attempt to manipulate an AI rating. It is treated as data and its evidence is down-weighted.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${r.rating} out of 5 stars`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={i < r.rating ? 'size-3.5 fill-fg text-fg' : 'size-3.5 text-border-strong'} aria-hidden />
          ))}
        </span>
        {r.title && <h3 className="text-sm font-medium text-fg">{r.title}</h3>}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-fg">{r.content}</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
        {r.verified && (
          <span className="inline-flex items-center gap-1">
            <BadgeCheck className="size-3.5" aria-hidden /> Verified purchase
          </span>
        )}
        {r.sizePurchased && <span>· Bought {r.sizePurchased}</span>}
        {r.fitsAs && <span>· {FITS_AS[r.fitsAs] ?? r.fitsAs}</span>}
        {r.heightCm && <span>· {r.heightCm} cm</span>}
        {r.bodyType && <span>· {r.bodyType}</span>}
        {r.language !== 'en' && (
          <span className="inline-flex items-center gap-1">
            · <Languages className="size-3.5" aria-hidden /> {r.language.toUpperCase()}
          </span>
        )}
        <span>· {fmtDate(r.date)}</span>
      </p>
    </article>
  )
}

function ReviewsSection({ reviews, avg }: { reviews: ProductReview[]; avg: number | null }) {
  const first = reviews.slice(0, 5)
  const rest = reviews.slice(5)
  return (
    <Section id="reviews-h" title={`Reviews (${reviews.length})`} aside={avg != null ? `Average ${avg.toFixed(1)} of 5 · most helpful first` : undefined}>
      {reviews.length === 0 ? (
        <p className="text-sm text-fg-muted">No reviews yet. New launches get an early score from the brand’s record, the spec and the price.</p>
      ) : (
        <>
          <div className="divide-y divide-border">
            {first.map((r) => (
              <ReviewCard key={r.id} r={r} />
            ))}
          </div>
          {rest.length > 0 && (
            <details className="group mt-2 border-t border-border pt-4">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-md text-sm font-medium text-accent hover:underline [&::-webkit-details-marker]:hidden">
                Show {rest.length} more reviews
                <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
              </summary>
              <div className="mt-4 divide-y divide-border">
                {rest.map((r) => (
                  <ReviewCard key={r.id} r={r} />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </Section>
  )
}

function SpecCard({ data }: { data: ProductPageData }) {
  const p = data.product
  const materials = Object.entries(p.materials)
    .sort((a, b) => b[1] - a[1])
    .map(([m, pct]) => `${pct}% ${m}`)
    .join(', ')
  const ranges = [p.hasPetite && 'Petite', p.hasTall && 'Tall', p.hasPlus && 'Plus'].filter(Boolean).join(' · ')
  const rows: [string, React.ReactNode][] = [
    ['Materials', materials || '—'],
    ['Fabric weight', p.fabricWeightGsm ? `${p.fabricWeightGsm} gsm` : '—'],
    ['Stretch', p.elastanePct ? `${p.elastanePct}% elastane` : 'No elastane'],
    ['Fit', [p.fitType, p.silhouette].filter(Boolean).join(' · ') || '—'],
    ['Sizes', p.sizes.join(', ') || '—'],
    ['Extended sizes', ranges || 'None'],
    ['Care', p.careInstructions ?? '—'],
    ['Recycled content', p.recycledContent ? `${p.recycledContent}%` : '—'],
    ['Certifications', p.certifications.length ? p.certifications.join(', ') : 'None listed'],
    ['Colours', p.colors.join(', ') || '—'],
  ]
  return (
    <section aria-labelledby="spec-h" className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h2 id="spec-h" className="text-sm font-semibold text-fg">
        Spec
      </h2>
      {p.description && <p className="mt-2 text-sm leading-relaxed text-fg-muted">{p.description}</p>}
      <dl className="mt-4 divide-y divide-border text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[8.5rem_1fr] gap-3 py-2">
            <dt className="text-fg-subtle">{k}</dt>
            <dd className="text-fg">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-fg-subtle">
        {data.brand.name}
        {data.brand.description && ` · ${data.brand.description}`}
      </p>
    </section>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ChevronRight, Clock, ShieldCheck, Tag } from 'lucide-react'
import { SiteShell } from '@/components/site/shell'
import { Badge } from '@/components/ui/primitives'
import { PriceHistory } from '@/components/veritas/price-history'
import { ProductGallery } from '@/components/veritas/product-gallery'
import { TrendTag } from '@/components/veritas/badges'
import { CATEGORY, GENDER, RETURN_REASON } from '@/components/veritas/labels'
import { KIND_LABEL } from '@/lib/veritas/match/facets'
import { formatPrice, type Pillar } from '@/components/veritas/score'
import type { EvidenceItem } from '@/components/veritas/evidence-drawer'
import { FACTOR_TAXONOMY } from '@/lib/veritas/taxonomy/factor-taxonomy'
import { getProductPage, type ProductPageData } from '@/lib/veritas/read/catalog'
import { ReviewCard } from '@/components/veritas/review-card'
import { MoreReviews } from './more-reviews'
import { ScorePanel, type FactorMeta } from './score-panel'
import { TagChips } from '@/components/veritas/tag-chips'
import { ProductCard } from '@/components/veritas/product-card'
import { tagsForProducts } from '@/lib/veritas/read/tags'
import { loadAlternatives, loadSimilarLooking } from '@/lib/veritas/read/alternatives'
import { loadInstantAnswers } from '@/lib/veritas/read/qa'
import { driversForProducts } from '@/lib/veritas/read/drivers'
import { DriverTiles } from '@/components/veritas/drivers'
import { VisualPanel } from '@/components/veritas/visual-panel'
import { thumbPattern } from '@/components/veritas/thumb-pattern'
import { ProductQA } from './product-qa'
import { productScopeForViewer } from '@/lib/veritas/authz'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getProductPage(slug, await productScopeForViewer())
  // Throwing here (metadata resolves before the body streams) gives a real 404 status, not 200.
  if (!data) notFound()
  const { product, brand, score } = data
  return {
    title: `${product.name} · ${brand.name}`,
    // An organisation's private products are visible only to its own users: never indexed.
    ...(product.isPrivate && { robots: { index: false, follow: false } }),
    alternates: { canonical: `/p/${product.slug}` },
    description: score
      ? `Veritas Score ${score.overall}/100 for ${product.name}, with the evidence behind every number.`
      : `${product.name} by ${brand.name}: what reviewers report about fit and quality, price history and return reasons.`,
  }
}

/** Launched in the last 30 days (backend plan §6). */
function isNewLaunch(launchDate: string | null) {
  return !!launchDate && Date.now() - new Date(launchDate).getTime() < 30 * 864e5
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const data = await getProductPage(slug, await productScopeForViewer())
  if (!data) notFound()
  const { product, brand, score, reported, returns, prices } = data
  const [tagMap, alternatives, instant, driverMap, lookalikes] = await Promise.all([tagsForProducts([product.id]), loadAlternatives(product.id), loadInstantAnswers(product.id), driversForProducts([product.id]), loadSimilarLooking(product.id)])
  const similar = lookalikes.filter((s) => !alternatives.some((a) => a.item.slug === s.slug))
  const drivers = driverMap.get(product.id)
  const tags = tagMap.get(product.id) ?? []

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
          {product.subcategory && product.subcategory in KIND_LABEL ? (
            <Link href={`/search?kind=${product.subcategory}`} className="hover:text-fg">
              {KIND_LABEL[product.subcategory as keyof typeof KIND_LABEL]}
            </Link>
          ) : (
            <Link href={`/search?category=${product.category}`} className="hover:text-fg">
              {CATEGORY[product.category] ?? product.category}
            </Link>
          )}
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="truncate text-fg-muted" aria-current="page">
            {product.name}
          </span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          {/* Left column */}
          <aside className="order-2 flex flex-col gap-6 lg:order-none lg:sticky lg:top-24 lg:self-start">
            <ProductGallery name={product.name} category={product.category} subcategory={product.subcategory} silhouette={product.silhouette} colors={product.colors} pattern={thumbPattern(data.visual)} />
            <SpecCard data={data} />
          </aside>

          {/* Right column */}
          <div className="order-1 flex min-w-0 flex-col gap-6 lg:order-none">
            <header>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{CATEGORY[product.category] ?? product.category}</Badge>
                <Badge tone="neutral">{GENDER[product.gender] ?? product.gender}</Badge>
                {product.trendTag && <TrendTag tag={product.trendTag} />}
                {isNewLaunch(product.launchDate) && <Badge tone="accent">New launch</Badge>}
                {product.isPrivate && <Badge tone="neutral">Private · only your organisation sees this</Badge>}
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
                  product.price === null ? (
                    <span className="text-sm text-fg-muted">No price in the source</span>
                  ) : (
                    <span className="font-semibold tabular">{formatPrice(product.price, product.currency)}</span>
                  )
                )}
              </p>
              <p className="mt-1 text-sm text-fg-muted">by {brand.name}</p>
            </header>

            {score && drivers && <DriverTiles drivers={drivers} />}

            <ScorePanel
              score={score}
              factors={factors}
              factorValues={factorValues}
              evidenceByFactor={evidenceByFactor}
              inputs={{ reviews: reported.reviewCount, returns: returns.total, prices: prices.series.reduce((s, x) => s + x.points.length, 0) }}
              showTraceLink={process.env.APP_ENV !== 'production'}
              productId={product.id}
            />

            {tags.length > 0 && (
              <section aria-labelledby="highlights-h" className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <h2 id="highlights-h" className="text-base font-semibold text-fg">
                  Highlights
                </h2>
                <p className="mt-1 text-sm text-fg-muted">Labels earned from the counts and factor scores, with the numbers behind each one.</p>
                <TagChips tags={tags} detailed className="mt-4" />
              </section>
            )}

            {score?.summary && (
              <section aria-labelledby="owners-h" className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="owners-h" className="text-base font-semibold text-fg">
                    What owners say
                  </h2>
                  <Badge tone="good">
                    <ShieldCheck aria-hidden />
                    Checked against the evidence
                  </Badge>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-fg">{score.summary}</p>
              </section>
            )}

            {score?.sizeAdvice || score?.downside ? (
              <section className="grid gap-3 sm:grid-cols-2">
                {score.sizeAdvice && <Callout title="Size advice" body={score.sizeAdvice} />}
                {score.downside && <Callout title="Main downside" body={score.downside} />}
              </section>
            ) : null}

            {data.visual && <VisualPanel visual={data.visual} />}

            <ProductQA productId={product.slug} instant={instant} />

            <ReportedFit fit={reported.fit} total={reported.reviewCount} />
            <ReportedIssues data={data} />
            <PriceSection data={data} />
            <ReturnsSection returns={returns} />
            <ReviewsSection data={data} />

            <p className="text-xs text-fg-subtle">
              Data source: {product.source === 'dev-fixture' ? 'fictional test data generated for development' : product.source}
              {product.licence && ` · licence: ${product.licence}`}.
            </p>
          </div>
        </div>

        {alternatives.length > 0 && (
          <section aria-labelledby="alts-h" className="mt-14">
            <h2 id="alts-h" className="text-lg font-semibold text-fg">
              {score ? 'Better-scoring alternatives' : 'Rated alternatives'}
            </h2>
            <p className="mt-1 text-sm text-fg-muted">Same category, similar or lower price, chosen by score. Nobody pays to appear here.</p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {alternatives.map((a) => (
                <li key={a.item.slug} className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-accent">{a.reason}</p>
                  <ProductCard item={a.item} className="h-full" />
                </li>
              ))}
            </ul>
          </section>
        )}

        {similar.length > 0 && (
          <section aria-labelledby="similar-h" className="mt-14">
            <h2 id="similar-h" className="text-lg font-semibold text-fg">
              Looks similar
            </h2>
            <p className="mt-1 text-sm text-fg-muted">Chosen by how the product photos look, not by price or brand. Each shows its own score.</p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {similar.map((item) => (
                <li key={item.slug}>
                  <ProductCard item={item} className="h-full" />
                </li>
              ))}
            </ul>
          </section>
        )}
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

function ReviewsSection({ data }: { data: ProductPageData }) {
  const { reviews, reported, product } = data
  const total = reported.reviewCount
  const avg = reported.ratingAvg
  return (
    <Section id="reviews-h" title={`Reviews (${total})`} aside={avg != null ? `Average ${avg.toFixed(1)} of 5 · most helpful first` : undefined}>
      {total === 0 ? (
        <p className="text-sm text-fg-muted">No reviews yet. New launches get an early score from the brand’s record, the spec and the price.</p>
      ) : (
        <>
          <div className="divide-y divide-border">
            {reviews.map((r) => (
              <ReviewCard key={r.id} r={r} />
            ))}
          </div>
          {total > reviews.length && <MoreReviews productId={product.id} offset={reviews.length} total={total} />}
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
    // Unknown (null) is not the same as none (0): open data has no materials.
    ['Stretch', p.elastanePct ? `${p.elastanePct}% elastane` : p.elastanePct === 0 ? 'No elastane' : '—'],
    ['Fit', [p.fitType, p.silhouette].filter(Boolean).join(' · ') || '—'],
    ['Sizes', p.sizes.join(', ') || '—'],
    ['Extended sizes', ranges || (p.sizes.length ? 'None' : '—')],
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

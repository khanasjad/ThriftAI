import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { formatPrice, scoreBand } from '@/components/veritas/score'
import { brandForUser, requirePageRole } from '@/lib/veritas/authz'
import { loadScorecard } from '@/lib/veritas/insights/scorecard'
import { PrintButton } from './print-button'

export const metadata: Metadata = { title: 'Brand scorecard', robots: { index: false } }
export const dynamic = 'force-dynamic'

const QUADRANT: Record<string, string> = { best_value: 'Best value', premium: 'Premium (worth it)', overpriced: 'Overpriced for the quality', budget: 'Budget', not_rated: 'Not rated yet' }

function Big({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border p-4 print:break-inside-avoid">
      <p className="text-xs text-fg-subtle">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular text-fg">{value}</p>
      {sub && <p className="text-xs text-fg-muted">{sub}</p>}
    </div>
  )
}

/** One printable page per brand: the free pilot scorecard from the product plan. Every number comes from stored data. */
export default async function ScorecardPage({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const { brand: requested } = await searchParams
  const user = await requirePageRole(['BRAND', 'ADMIN'], '/dashboard/scorecard')
  const brand = await brandForUser(user, requested)
  if (!brand) notFound()
  const s = await loadScorecard(brand.id)
  if (!s) notFound()
  const h = s.headline
  const band = (v: number | null) => (v === null ? '' : scoreBand(v).label)

  return (
    <main id="main-content" className="mx-auto max-w-4xl bg-bg px-6 py-8 text-fg print:max-w-none print:px-0 print:py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/dashboard${requested ? `?brand=${requested}` : ''}`} className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
          <ChevronLeft className="size-4" aria-hidden /> Dashboard
        </Link>
        <PrintButton />
      </div>

      {s.isTestData && (
        <p className="mt-4 flex items-center gap-2 rounded-lg border border-warning/40 bg-warning-soft px-4 py-2 text-sm text-warning-fg">
          <AlertTriangle className="size-4" aria-hidden /> Sample built from fictional test data. A pilot scorecard uses your own reviews, returns and prices.
        </p>
      )}

      <header className="mt-6 border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Veritas scorecard</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{s.brand.name}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {s.generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {s.inputs.products} products ({s.inputs.rated} rated) ·{' '}
          {s.inputs.reviews.toLocaleString()} reviews · {s.inputs.returns.toLocaleString()} returns · prices from {s.inputs.sellers} sellers
        </p>
      </header>

      <section aria-labelledby="sc-head" className="mt-6">
        <h2 id="sc-head" className="sr-only">Headline numbers</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Big label="Average Veritas Score" value={h.avgScore === null ? '—' : String(h.avgScore)} sub={band(h.avgScore)} />
          <Big label="Product quality (reviews)" value={h.quality === null ? '—' : String(h.quality)} sub={band(h.quality)} />
          <Big label="Price" value={h.price === null ? '—' : String(h.price)} sub={band(h.price)} />
          <Big label="Brand reputation" value={h.brand === null ? '—' : String(h.brand)} sub={band(h.brand)} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Big label="Preventable returns" value={h.preventableReturns.toLocaleString()} sub={`est. ${formatPrice(h.returnCost)} (return cost = ${Math.round(h.returnCostShare * 100)}% of price)`} />
          <Big label="Ready to advertise" value={`${h.adEligible} of ${s.inputs.products}`} sub="score 70+, honest price, not often returned" />
          <Big label="Price warnings" value={String(s.priceWarnings)} sub="fake sale price or often cheaper" />
        </div>
      </section>

      <div className="mt-8 grid gap-8 md:grid-cols-2 print:grid-cols-2">
        <section aria-labelledby="sc-fix" className="print:break-inside-avoid">
          <h2 id="sc-fix" className="text-base font-semibold">Fix these first</h2>
          <p className="mt-1 text-xs text-fg-muted">Score points lost against the category median, summed across products.</p>
          <ol className="mt-3 flex flex-col gap-3">
            {s.fixes.map((f, i) => (
              <li key={f.factor} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">
                  {i + 1}. {f.name} <span className="tabular text-critical-fg">−{f.points} pts</span>
                </p>
                {f.fix && <p className="mt-1 text-fg">{f.fix}</p>}
                <p className="mt-1 text-xs text-fg-muted">{f.products.length} {f.products.length === 1 ? 'product' : 'products'}: {f.products.slice(0, 3).join(', ')}{f.products.length > 3 ? '…' : ''}</p>
              </li>
            ))}
            {s.fixes.length === 0 && <li className="text-sm text-fg-muted">No factor costs more than a fraction of a point.</li>}
          </ol>
        </section>

        <section aria-labelledby="sc-ret" className="print:break-inside-avoid">
          <h2 id="sc-ret" className="text-base font-semibold">Costliest return reasons</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {s.problems.map((p) => (
              <li key={p.reason} className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
                <span>
                  {p.label} <span className="text-xs text-fg-muted">· {p.returns} returns · top: {p.products[0]?.name}</span>
                </span>
                <span className="tabular font-medium">{formatPrice(p.estCost)}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-5 text-sm font-semibold">Size-chart fixes</h3>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-fg">
            {s.sizeFixes.map((f) => (
              <li key={`${f.slug}-${f.size}`}>
                <span className="font-medium">{f.name}:</span> {f.suggestion}
              </li>
            ))}
            {s.sizeFixes.length === 0 && <li className="text-fg-muted">No clear size problems.</li>}
          </ul>
        </section>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2 print:grid-cols-2">
        <section aria-labelledby="sc-best" className="print:break-inside-avoid">
          <h2 id="sc-best" className="text-base font-semibold">Strongest products</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {s.best.map((p) => (
              <li key={p.slug} className="flex justify-between gap-3 border-b border-border pb-2">
                <span>{p.name}</span>
                <span className="tabular font-medium">{Math.round(p.score!)}</span>
              </li>
            ))}
          </ul>
          {s.worst.length > 0 && (
            <>
              <h3 className="mt-5 text-sm font-semibold">Needs attention</h3>
              <ul className="mt-2 flex flex-col gap-2 text-sm">
                {s.worst.map((p) => (
                  <li key={p.slug} className="flex justify-between gap-3 border-b border-border pb-2">
                    <span>
                      {p.name}
                      {p.warnings.length > 0 && <span className="text-xs text-fg-muted"> · {p.warnings.slice(0, 2).join(', ')}</span>}
                    </span>
                    <span className="tabular font-medium">{Math.round(p.score!)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section aria-labelledby="sc-price" className="print:break-inside-avoid">
          <h2 id="sc-price" className="text-base font-semibold">Price vs. quality, against category peers</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {Object.entries(s.quadrants).map(([k, n]) => (
              <li key={k} className="flex justify-between border-b border-border pb-2">
                <span>{QUADRANT[k] ?? k}</span>
                <span className="tabular font-medium">{n}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="mt-10 border-t border-border pt-4 text-xs leading-relaxed text-fg-muted">
        How it works: AI reads every review and return reason; code computes every score from 27 factors (fit, quality, comfort, style and value, sustainability), so
        each number is explainable and links to its evidence. Nobody can pay for a better score. Ongoing scorecards with monthly refresh start at $299/month (Starter);
        Growth $799/month adds weekly refresh and the Score API; Pro $2,000/month adds daily refresh and search integration.
      </footer>
    </main>
  )
}

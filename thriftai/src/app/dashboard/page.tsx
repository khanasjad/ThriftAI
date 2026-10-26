import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, CircleCheck, Info, Ruler } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { SiteShell } from '@/components/site/shell'
import { SignOutButton } from '@/components/site/sign-out'
import { Badge, Table, TBody, TD, TH, THead, TR } from '@/components/ui/primitives'
import { ScoreRing } from '@/components/veritas/score-ring'
import { CONFIDENCE, PILLARS, formatPrice, type ConfidenceLabel } from '@/components/veritas/score'
import { brandForUser, requirePageRole } from '@/lib/veritas/authz'
import { loadBrandInsights } from '@/lib/veritas/insights/load'
import { ApiKeys } from './api-keys'
import { BrandSwitcher } from './brand-switcher'
import { PriceVsPeers, ScoreVsPrice } from './charts'

export const metadata: Metadata = { title: 'Brand dashboard', robots: { index: false } }
export const dynamic = 'force-dynamic'

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

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const { brand: requested } = await searchParams
  const user = await requirePageRole(['BRAND', 'ADMIN'], '/dashboard')
  // A brand user asking for someone else's brand just gets their own (nothing about the other brand is revealed).
  const brand = (await brandForUser(user, requested)) ?? (requested && user.role === 'BRAND' ? await brandForUser(user, null) : null)
  if (!brand) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
          <h1 className="text-2xl font-semibold text-fg">{user.tenantId ? 'Your catalog' : 'No brand on this account'}</h1>
          <p className="mt-2 text-fg-muted">
            {user.tenantId
              ? 'This account is a platform account (not linked to a single brand). Send your catalog, reviews and returns, then see scores, ads and social posts.'
              : 'Your account isn’t linked to a brand yet.'}
          </p>
          {user.tenantId && (
            <Link href="/dashboard/ads" className="mt-6 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:opacity-90">
              Data and ads →
            </Link>
          )}
        </div>
      </SiteShell>
    )
  }
  const data = (await loadBrandInsights(brand.id))!
  const { insights: x } = data
  const allBrands = user.role === 'ADMIN' ? await prisma.brand.findMany({ orderBy: { name: 'asc' }, select: { slug: true, name: true } }) : []
  const totalCost = x.problems.reduce((s, p) => s + p.estCost, 0)
  const maxCost = Math.max(1, ...x.problems.map((p) => p.estCost))
  const ratedForScatter = x.scatter.filter((p) => p.brand).length

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
              Brand dashboard · {user.email} · <SignOutButton />
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">{data.brand.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/dashboard/scorecard?brand=${data.brand.slug}`} className="inline-flex h-9 items-center rounded-lg border border-border-strong px-3 text-sm font-medium text-fg hover:bg-surface-2">
              Scorecard (PDF) →
            </Link>
            <Link href="/dashboard/ads" className="inline-flex h-9 items-center rounded-lg border border-border-strong px-3 text-sm font-medium text-fg hover:bg-surface-2">
              Data and ads →
            </Link>
            {user.role === 'ADMIN' && <BrandSwitcher brands={allBrands} current={data.brand.slug} />}
          </div>
        </div>

        {/* Overview */}
        <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['Products', String(x.overview.products), `${x.overview.rated} rated`],
            ['Average score', x.overview.avgScore === null ? '—' : String(x.overview.avgScore), x.overview.rated ? `across ${x.overview.rated} rated` : 'none rated yet'],
            ['Reviews', x.overview.reviews.toLocaleString(), x.overview.avgRating === null ? '' : `average ${x.overview.avgRating} of 5`],
            ['Preventable returns', String(x.preventableReturns), `est. ${formatPrice(totalCost)} cost`],
          ].map(([k, v, sub]) => (
            <div key={k} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <dt className="text-xs text-fg-subtle">{k}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular text-fg">{v}</dd>
              {sub && <dd className="text-xs text-fg-subtle">{sub}</dd>}
            </div>
          ))}
        </dl>

        {x.overview.rated === 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-fg-muted">
            <Info className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
            No products are rated yet, so scores and peer comparisons are empty. Returns, fit answers and prices below are counted directly from your data.
          </p>
        )}

        <div className="mt-6 grid gap-6 [&>*]:min-w-0">
          <Section id="problems-h" title="Top problems by estimated cost" aside={`return cost assumed at ${Math.round(x.returnCostShare * 100)}% of the item price`}>
            {x.problems.length === 0 ? (
              <p className="text-sm text-fg-muted">No preventable returns recorded.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {x.problems.map((p) => (
                  <li key={p.reason}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-fg">{p.label}</span>
                      <span className="tabular text-fg-muted">
                        est. <span className="font-semibold text-fg">{formatPrice(p.estCost)}</span> · {p.returns} returns · {Math.round(p.shareOfReturns * 100)}% of all returns
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-score-track" aria-hidden>
                      <div className="h-full rounded-full bg-score-4" style={{ width: `${(p.estCost / maxCost) * 100}%` }} />
                    </div>
                    <p className="mt-1.5 break-words text-xs text-fg-subtle">
                      {p.products.slice(0, 4).map((pr, i) => (
                        <span key={pr.slug}>
                          {i > 0 && ' · '}
                          <Link href={`/dashboard/products/${pr.slug}?brand=${data.brand.slug}`} className="underline underline-offset-2 hover:text-fg">
                            {pr.name}
                          </Link>{' '}
                          ({pr.count})
                        </span>
                      ))}
                      {p.products.length > 4 && ` · +${p.products.length - 4} more`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
            <Section id="size-h" title="Size-chart fixes" aside="from reviewers’ fit answers">
              {x.sizeFixes.length === 0 ? (
                <p className="text-sm text-fg-muted">No size runs clearly small or large yet.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {x.sizeFixes.map((f) => (
                    <li key={`${f.slug}-${f.size}`} className="flex gap-3 text-sm">
                      <Ruler className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
                      <div>
                        <Link href={`/dashboard/products/${f.slug}?brand=${data.brand.slug}`} className="font-medium text-fg hover:underline">
                          {f.name}
                        </Link>
                        <p className="text-fg-muted">{f.suggestion}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section id="launch-h" title="Launch watch" aside="launched in the last 60 days or labelled new">
              {x.launchWatch.length === 0 ? (
                <p className="text-sm text-fg-muted">No recent launches.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {x.launchWatch.map((l) => (
                    <li key={l.slug} className="flex gap-3 text-sm">
                      {l.status === 'watch' ? (
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-fg" aria-hidden />
                      ) : (
                        <CircleCheck className="mt-0.5 size-4 shrink-0 text-good-fg" aria-hidden />
                      )}
                      <div>
                        <p className="font-medium text-fg">
                          {l.name} <Badge tone={l.status === 'watch' ? 'warning' : 'good'}>{l.status === 'watch' ? 'Watch' : 'On track'}</Badge>
                        </p>
                        <p className="text-fg-muted">
                          {l.reasons.length ? l.reasons.join(' · ') : `${l.reviews} reviews, ${l.returns} returns so far`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <Section id="price-h" title="Price position" aside={ratedForScatter >= 3 ? 'score vs. price' : 'price vs. similar items'}>
            {ratedForScatter >= 3 ? <ScoreVsPrice points={x.scatter} /> : <PriceVsPeers rows={x.pricePosition} />}
          </Section>

          <Section id="pillars-h" title="Pillars vs. the catalog">
            {x.overview.rated === 0 ? (
              <p className="text-sm text-fg-muted">Appears once products are rated.</p>
            ) : (
              <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {x.pillars.map((p) => {
                  const meta = PILLARS.find((m) => m.key === p.pillar)!
                  const diff = p.brand !== null && p.catalog !== null ? p.brand - p.catalog : null
                  return (
                    <div key={p.pillar} className="rounded-xl bg-surface-2 p-4">
                      <dt className="text-xs text-fg-subtle">{meta.label}</dt>
                      <dd className="mt-1 text-xl font-semibold tabular text-fg">{p.brand ?? '—'}</dd>
                      <dd className="text-xs text-fg-subtle tabular">
                        catalog {p.catalog ?? '—'}
                        {diff !== null && ` (${diff >= 0 ? '+' : ''}${diff.toFixed(1)})`}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            )}
          </Section>

          <Section id="catalog-h" title={`Catalog (${x.catalog.length})`}>
            <div className="-mx-6">
              <Table>
                <THead>
                  <TR>
                    <TH className="pl-6">Product</TH>
                    <TH>Score</TH>
                    <TH className="text-right">Price</TH>
                    <TH className="text-right">Reviews</TH>
                    <TH className="text-right">Rating</TH>
                    <TH className="text-right">Returns</TH>
                    <TH className="pr-6">Fit</TH>
                  </TR>
                </THead>
                <TBody>
                  {x.catalog.map((c) => (
                    <TR key={c.slug}>
                      <TD className="pl-6">
                        <Link href={`/dashboard/products/${c.slug}?brand=${data.brand.slug}`} className="font-medium text-fg hover:text-accent hover:underline">
                          {c.name}
                        </Link>
                        <div className="text-xs text-fg-subtle">
                          {c.subcategory}
                          {c.trendTag && ` · ${c.trendTag.toLowerCase()}`}
                        </div>
                      </TD>
                      <TD>
                        {c.score === null ? (
                          <span className="text-xs text-fg-subtle">Not rated</span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <ScoreRing score={c.score} size="sm" />
                            <span className="text-xs text-fg-subtle">{CONFIDENCE[c.label as ConfidenceLabel]?.label}</span>
                          </span>
                        )}
                      </TD>
                      <TD className="text-right tabular">{c.price === null ? <span className="text-fg-subtle">no price</span> : formatPrice(c.price)}</TD>
                      <TD className="text-right tabular">{c.reviews}</TD>
                      <TD className="text-right tabular">{c.avgRating ?? '—'}</TD>
                      <TD className="text-right tabular">{c.returns}</TD>
                      <TD className="pr-6 text-fg-muted">{c.fit ?? '—'}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </Section>

          <Section id="keys-h" title="Score API keys" aside={<Link href="/developers" className="underline underline-offset-2">API docs</Link>}>
            <ApiKeys brand={data.brand.slug} />
          </Section>
        </div>
      </div>
    </SiteShell>
  )
}

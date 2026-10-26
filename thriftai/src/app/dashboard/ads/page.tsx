import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, Download, Megaphone, Share2, Upload } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { SiteShell } from '@/components/site/shell'
import { ProductThumb } from '@/components/veritas/product-thumb'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/primitives'
import { requirePageRole } from '@/lib/veritas/authz'
import { loadAdRows, socialPack } from '@/lib/veritas/ads/feeds'
import { AD_MIN_SCORE } from '@/lib/veritas/ads/rules'
import { ownProducts } from '@/lib/veritas/scope'
import { CopyText } from './copy-button'
import { thumbPattern } from '@/components/veritas/thumb-pattern'
import { UploadFeed } from './upload'

export const metadata: Metadata = { title: 'Data and ads', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function AdsPage() {
  const user = await requirePageRole(['BRAND', 'ADMIN'], '/dashboard/ads')
  const scope = ownProducts(user.tenantId)
  const [rows, posts, runs, products] = await Promise.all([
    loadAdRows(scope),
    socialPack(scope, 5),
    user.tenantId ? prisma.ingestRun.findMany({ where: { tenantId: user.tenantId }, orderBy: { createdAt: 'desc' }, take: 8 }) : Promise.resolve([]),
    prisma.clothingProduct.findMany({ where: scope, select: { slug: true, category: true, subcategory: true, silhouette: true, colors: true, visual: { select: { attributes: true } } } }),
  ])
  const look = new Map(products.map((p) => [p.slug, p]))
  const eligible = rows.filter((r) => r.eligible).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const held = rows.filter((r) => !r.eligible)

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
          <ChevronLeft className="size-4" aria-hidden /> Dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg">Data and ads</h1>
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">
          Send your catalog, reviews and returns; Veritas scores them; then promote only what is worth buying. The score decides which products may be advertised.
          Paying never changes a score.
        </p>

        {/* 1. Data in */}
        <section aria-labelledby="in-h" className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 id="in-h" className="flex items-center gap-2 text-base font-semibold text-fg">
            <Upload className="size-4 text-accent" aria-hidden /> 1. Send your data
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            Three simple feeds: catalog (daily, with prices), reviews (daily), returns (optional, weekly). Re-sending a file never creates duplicates. Example files:{' '}
            <code className="text-xs">prisma/fixtures/sample-feeds/</code>. Automated pushes use the API (see Developers).
          </p>
          {user.tenantId ? (
            <div className="mt-4">
              <UploadFeed />
            </div>
          ) : (
            <p className="mt-4 text-sm text-fg-muted">This admin account has no organisation, so uploads are off. Sign in as a platform or brand user.</p>
          )}
          {runs.length > 0 && (
            <div className="-mx-6 mt-5">
              <Table>
                <THead>
                  <TR>
                    <TH className="pl-6">When</TH>
                    <TH>Feed</TH>
                    <TH>Source</TH>
                    <TH className="text-right">Rows</TH>
                    <TH className="text-right">Accepted</TH>
                    <TH className="pr-6 text-right">Rejected</TH>
                  </TR>
                </THead>
                <TBody>
                  {runs.map((r) => (
                    <TR key={r.id}>
                      <TD className="pl-6 tabular">{r.createdAt.toISOString().slice(0, 16).replace('T', ' ')}</TD>
                      <TD>
                        {r.kind}
                        {r.dryRun && <span className="ml-1 text-xs text-fg-subtle">(dry run)</span>}
                      </TD>
                      <TD className="max-w-48 truncate">{r.source}</TD>
                      <TD className="text-right tabular">{r.rows}</TD>
                      <TD className="text-right tabular">{r.accepted}</TD>
                      <TD className="pr-6 text-right tabular">{r.rejected}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </section>

        {/* 2. Ads */}
        <section aria-labelledby="ads-h" className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="ads-h" className="flex items-center gap-2 text-base font-semibold text-fg">
                <Megaphone className="size-4 text-accent" aria-hidden /> 2. Ads: promote what is worth buying
              </h2>
              <p className="mt-1 text-sm text-fg-muted">
                <span className="font-medium tabular text-fg">{eligible.length}</span> of {rows.length} products may be advertised (score {AD_MIN_SCORE}+, enough evidence, no fake sale
                price, not often returned). Copy is written from owner evidence and every line is verified.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/api/v1/dashboard/feeds/ads?eligible=1" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg hover:opacity-90">
                <Download className="size-4" aria-hidden /> Ad feed (eligible, CSV)
              </a>
              <a href="/api/v1/dashboard/feeds/ads" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-strong px-3 text-sm text-fg hover:bg-surface-2">
                <Download className="size-4" aria-hidden /> Full catalog with labels
              </a>
            </div>
          </div>

          {eligible.length === 0 ? (
            <p className="mt-5 text-sm text-fg-muted">No product meets the bar yet. That is the point: an empty slot is better than an ad for something people send back.</p>
          ) : (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {eligible.map((r) => {
                const p = look.get(r.slug)
                return (
                  <li key={r.slug} className="overflow-hidden rounded-xl border border-border">
                    <div className="flex items-center justify-between px-3 py-2 text-[11px] text-fg-subtle">
                      <span className="font-medium uppercase tracking-wide">Ad preview</span>
                      <span>Sponsored</span>
                    </div>
                    {p && <ProductThumb category={p.category} subcategory={p.subcategory} silhouette={p.silhouette} color={p.colors[0]} pattern={thumbPattern(p.visual?.attributes as Parameters<typeof thumbPattern>[0])} showTag={false} className="aspect-[16/9] rounded-none" />}
                    <div className="p-3">
                      <p className="text-sm font-semibold text-fg">{r.feed.ad_headline}</p>
                      <p className="mt-1 text-sm text-fg-muted">{r.feed.ad_body || r.feed.description}</p>
                      <p className="mt-2 text-xs text-fg-subtle">
                        {r.feed.title} · {r.feed.price} · score {r.feed.veritas_score}
                      </p>
                      {r.sources.length > 0 ? (
                        <details className="mt-2 text-xs text-fg-muted">
                          <summary className="cursor-pointer text-good-fg">Verified · show the evidence</summary>
                          <ul className="mt-1.5 flex flex-col gap-1 border-l-2 border-border pl-2">
                            {r.sources.map((s) => (
                              <li key={s.id}>{s.text}</li>
                            ))}
                          </ul>
                        </details>
                      ) : (
                        <p className="mt-2 text-xs text-fg-subtle">No written copy yet: the headline is a code-built highlight. Run npm run ads to write verified copy.</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {held.length > 0 && (
            <details className="mt-5 text-sm">
              <summary className="cursor-pointer font-medium text-fg">Not advertised ({held.length}) and why</summary>
              <ul className="mt-2 flex flex-col gap-1 text-fg-muted">
                {held.map((r) => (
                  <li key={r.slug}>
                    <span className="text-fg">{r.feed.title}</span>: {r.feed.veritas_not_eligible_because}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        {/* 3. Social */}
        <section aria-labelledby="social-h" className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 id="social-h" className="flex items-center gap-2 text-base font-semibold text-fg">
            <Share2 className="size-4 text-accent" aria-hidden /> 3. Social: top rated this week
          </h2>
          <p className="mt-1 text-sm text-fg-muted">Ready-to-post lists with tracked links, from eligible products only. Copy, schedule, done.</p>
          {posts.length === 0 ? (
            <p className="mt-4 text-sm text-fg-muted">Nothing to post yet.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {posts.map((p) => (
                <article key={p.category} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-fg">{p.title}</h3>
                    <CopyText text={p.caption} label="Copy caption" />
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-fg-muted">{p.caption}</pre>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </SiteShell>
  )
}

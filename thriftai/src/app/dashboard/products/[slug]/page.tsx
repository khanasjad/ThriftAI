import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { SiteShell } from '@/components/site/shell'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/primitives'
import { RETURN_REASON } from '@/components/veritas/labels'
import { brandForUser, requirePageRole } from '@/lib/veritas/authz'
import { loadWhy } from '@/lib/veritas/insights/load'
import { WhyScore } from './why-score'

export const metadata: Metadata = { title: 'Product insights', robots: { index: false } }
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ brand?: string }> }

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', '4XL']
const sizeKey = (s: string) => (SIZE_ORDER.includes(s) ? SIZE_ORDER.indexOf(s) : 100 + (Number(s) || 0))

export default async function ProductInsightsPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { brand: requested } = await searchParams
  const user = await requirePageRole(['BRAND', 'ADMIN'], `/dashboard/products/${slug}`)
  const product = await prisma.clothingProduct.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      brandId: true,
      brand: { select: { slug: true } },
      reviews: { select: { sizePurchased: true, fitsAs: true } },
      returns: { select: { returnReason: true, sizePurchased: true } },
    },
  })
  // Brand users only see their own products; the same 404 for "missing" and "not yours".
  const allowed = product && (await brandForUser(user, product.brand.slug))
  if (!product || !allowed || (user.role !== 'ADMIN' && allowed.id !== product.brandId)) notFound()

  const sizes = new Map<string, { small: number; tts: number; large: number; returns: number }>()
  const row = (s: string) => sizes.get(s) ?? { small: 0, tts: 0, large: 0, returns: 0 }
  for (const r of product.reviews) {
    if (!r.sizePurchased || !r.fitsAs) continue
    const e = row(r.sizePurchased)
    if (r.fitsAs === 'runs_small') e.small++
    else if (r.fitsAs === 'true_to_size') e.tts++
    else if (r.fitsAs === 'runs_large') e.large++
    sizes.set(r.sizePurchased, e)
  }
  for (const r of product.returns) if (r.sizePurchased) sizes.set(r.sizePurchased, { ...row(r.sizePurchased), returns: row(r.sizePurchased).returns + 1 })
  const sizeRows = [...sizes.entries()].sort((a, b) => sizeKey(a[0]) - sizeKey(b[0]))
  const reasons = Object.entries(product.returns.reduce<Record<string, number>>((a, r) => ((a[r.returnReason] = (a[r.returnReason] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1])
  const back = `/dashboard${requested ? `?brand=${requested}` : ''}`
  const why = await loadWhy(product.id)

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-6">
        <Link href={back} className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
          <ChevronLeft className="size-4" aria-hidden /> Dashboard
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{product.name}</h1>
          <Link href={`/p/${product.slug}`} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
            Public product page <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>

        {why && <WhyScore why={why} />}

        <section aria-labelledby="sizes-h" className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 id="sizes-h" className="text-base font-semibold text-fg">
            Fit answers and returns by size
          </h2>
          <p className="mt-1 text-sm text-fg-muted">A size where most answers point one way is a size-chart fix candidate.</p>
          {sizeRows.length === 0 ? (
            <p className="mt-4 text-sm text-fg-muted">No fit answers with sizes yet.</p>
          ) : (
            <div className="-mx-6 mt-4">
              <Table>
                <THead>
                  <TR>
                    <TH className="pl-6">Size</TH>
                    <TH className="text-right">Runs small</TH>
                    <TH className="text-right">True to size</TH>
                    <TH className="text-right">Runs large</TH>
                    <TH className="pr-6 text-right">Returns</TH>
                  </TR>
                </THead>
                <TBody>
                  {sizeRows.map(([size, r]) => {
                    const n = r.small + r.tts + r.large
                    const lean = n >= 3 && Math.abs(r.small - r.large) / n >= 0.5 ? (r.small > r.large ? 'small' : 'large') : null
                    return (
                      <TR key={size}>
                        <TD className="pl-6 font-medium">
                          {size}
                          {lean && <span className="ml-2 text-xs font-normal text-warning-fg">runs {lean}</span>}
                        </TD>
                        <TD className="text-right tabular">{r.small}</TD>
                        <TD className="text-right tabular">{r.tts}</TD>
                        <TD className="text-right tabular">{r.large}</TD>
                        <TD className="pr-6 text-right tabular">{r.returns}</TD>
                      </TR>
                    )
                  })}
                </TBody>
              </Table>
            </div>
          )}
        </section>

        <section aria-labelledby="returns-h" className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 id="returns-h" className="text-base font-semibold text-fg">
            Return reasons ({product.returns.length})
          </h2>
          {reasons.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">No returns recorded.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border text-sm">
              {reasons.map(([r, n]) => (
                <li key={r} className="flex justify-between py-2">
                  <span className="text-fg">{RETURN_REASON[r] ?? r}</span>
                  <span className="tabular text-fg-muted">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </SiteShell>
  )
}

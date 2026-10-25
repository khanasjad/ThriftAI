import type { Metadata } from 'next'
import Link from 'next/link'
import { KeyRound, Gauge, Bot } from 'lucide-react'
import { SiteShell } from '@/components/site/shell'
import { Badge } from '@/components/ui/primitives'
import { prisma } from '@/lib/prisma'
import { CopyButton } from './copy-button'

export const metadata: Metadata = { title: 'Developers', description: 'The Veritas Score API: rank clothing by what’s worth buying.' }
export const dynamic = 'force-dynamic'

const LIST_PARAMS: [string, string, string][] = [
  ['category', 'TOPS | BOTTOMS | …', 'Filter by category'],
  ['subcategory', 'string', 'e.g. tee, jeans'],
  ['gender', 'WOMENS | MENS | UNISEX | …', 'Filter by gender'],
  ['brandId', 'string', 'Only one brand’s products'],
  ['label', 'HIGH | MEDIUM | LOW | NEW_LAUNCH', 'Confidence label'],
  ['minScore, maxScore', '0–100', 'Score range (rated products only)'],
  ['sortBy', 'score | name | price | newest', 'Default: score'],
  ['limit, offset', '1–100, ≥ 0', 'Pagination. Default limit 50'],
]

const DETAIL_FIELDS: [string, string][] = [
  ['rated', 'false until the rating agents have scored the product. Scores are then null, never 0.'],
  ['overallScore', '0–100 Veritas Score (without sustainability)'],
  ['overallWithSustainability', 'Rescaled score with sustainability at 5%'],
  ['fitScore, qualityScore, styleScore, comfortScore, sustainabilityScore', 'Pillar scores, 0–100'],
  ['confidenceLabel', 'HIGH | MEDIUM | LOW | NEW_LAUNCH'],
  ['factorsIncluded, factorsMissing', 'Factor keys with and without enough evidence'],
  ['factors[]', '{ factor, pillar, value, rawValue, weight, evidenceCount, confidence }'],
  ['summary, sizeAdvice, downside', 'Verified text only (every sentence checked against evidence), else null'],
  ['returnReasons', 'Count of returns per reason'],
  ['tags[]', '{ key, label, tone: good | warn, group, detail }: labels built by code from counts and factor scores (e.g. “Runs small”, detail “7 of 12 owners say it runs small”). Also on the list endpoint.'],
]

function Code({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg">
      <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
        <span className="text-xs text-fg-subtle">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre tabIndex={0} className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-fg">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default async function DevelopersPage() {
  const sample = await prisma.clothingProduct.findFirst({ orderBy: { slug: 'asc' }, select: { slug: true } })
  const slug = sample?.slug ?? 'your-product-slug'
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-14 sm:px-6">
        <p className="text-sm font-medium text-accent">Developers</p>
        <h1 className="mt-3 max-w-3xl text-balance text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-fg">
          The Score API. Rank by what’s worth buying.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-fg-muted">
          Read Veritas Scores, pillars, factors and verified text as JSON. Built for site search (Constructor, Algolia, Shopify search), product pages and AI
          shopping agents.
        </p>
        <p className="mt-4">
          <Link href="/demo/store" className="text-sm font-medium text-accent underline underline-offset-4">
            See it in a demo store: star ratings vs. the Veritas Score
          </Link>
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: <KeyRound />, t: 'Auth', d: 'Open in development. API keys (Growth plan and up) come with the brand accounts release.' },
            { icon: <Gauge />, t: 'Rate limits', d: 'Not enforced yet. Limits will be published here before keys go live.' },
            { icon: <Bot />, t: 'AI agents', d: 'An MCP server for shopping agents is planned. Until then, use these endpoints.' },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-border bg-surface p-5 shadow-sm [&_svg]:size-5 [&_svg]:text-accent">
              {x.icon}
              <h2 className="mt-3 text-sm font-semibold text-fg">{x.t}</h2>
              <p className="mt-1.5 text-sm text-fg-muted">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="list-h" className="mx-auto grid max-w-6xl gap-8 border-t border-border px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="accent">GET</Badge>
            <h2 id="list-h" className="font-mono text-base font-semibold text-fg">
              /api/v1/products
            </h2>
          </div>
          <p className="mt-3 text-sm text-fg-muted">List products with their scores. Unrated products are included with null scores.</p>
          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-fg-subtle">
                <th className="py-2 pr-3 font-medium">Parameter</th>
                <th className="py-2 pr-3 font-medium">Values</th>
                <th className="py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {LIST_PARAMS.map(([k, v, n]) => (
                <tr key={k} className="align-top">
                  <td className="py-2.5 pr-3 font-mono text-[13px] text-fg">{k}</td>
                  <td className="py-2.5 pr-3 text-fg-muted">{v}</td>
                  <td className="py-2.5 text-fg-muted">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Code code={`curl "${base}/api/v1/products?category=BOTTOMS&sortBy=score&limit=3"`} />
          <Code
            lang="json"
            code={`{
  "success": true,
  "data": [
    {
      "slug": "…",
      "name": "…",
      "rated": false,
      "overallScore": null,
      "confidenceLabel": null,
      "reviewCount": 18
    }
  ],
  "pagination": { "total": 20, "limit": 3, "offset": 0, "hasMore": true }
}`}
          />
        </div>
      </section>

      <section aria-labelledby="detail-h" className="mx-auto grid max-w-6xl gap-8 border-t border-border px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="accent">GET</Badge>
            <h2 id="detail-h" className="font-mono text-base font-semibold text-fg">
              /api/v1/products/{'{id | slug}'}
            </h2>
          </div>
          <p className="mt-3 text-sm text-fg-muted">One product with its score, pillars, factors, verified text and recent reviews.</p>
          <dl className="mt-6 divide-y divide-border text-sm">
            {DETAIL_FIELDS.map(([k, v]) => (
              <div key={k} className="py-2.5">
                <dt className="font-mono text-[13px] text-fg">{k}</dt>
                <dd className="mt-0.5 text-fg-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Code code={`curl "${base}/api/v1/products/${slug}"`} />
          <Code
            lang="ts"
            code={`const res = await fetch("${base}/api/v1/products/${slug}")
const { data } = await res.json()

if (data.rated) {
  rankBy(data.overallScore, data.confidenceLabel)
} else {
  // Not rated yet: fall back to your own ranking.
}`}
          />
          <p className="text-sm text-fg-muted">
            How scores are computed:{' '}
            <Link href="/how-it-works#methodology" className="text-accent underline underline-offset-4">
              methodology
            </Link>
            .
          </p>
        </div>
      </section>
    </SiteShell>
  )
}

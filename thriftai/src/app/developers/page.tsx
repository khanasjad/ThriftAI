import type { Metadata } from 'next'
import { PUBLIC_PRODUCTS } from '@/lib/veritas/scope'
import Link from 'next/link'
import { KeyRound, Gauge, Bot } from 'lucide-react'
import { SiteShell } from '@/components/site/shell'
import { Badge } from '@/components/ui/primitives'
import { prisma } from '@/lib/prisma'
import { CopyButton } from './copy-button'
import { siteUrl } from '@/lib/site-url'

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
  ['drivers', '{ quality, price, brand }: each { value 0–100 or null, basis }. Product quality from reviews, Price from price history and peers, Brand reputation from the brand’s other rated products.'],
  ['visual', 'What the product photo shows, read by AI: { colors[{name, family}], pattern, pattern_detail, neckline, sleeve, shape, style_tags[], description }. Describes the look; never part of the score. Null until the photo is read.'],
  ['tags[]', '{ key, label, tone: good | warn, group, detail }: labels built by code from counts and factor scores (e.g. “Runs small”, detail “7 of 12 owners say it runs small”). Also on the list endpoint.'],
]

const INGEST_FIELDS: [string, string][] = [
  ['catalog (daily)', 'Required: external_id, title, brand, category, price, url. Optional: seller_id, seller_name, gender, list_price, sizes (a|b|c), colors, materials (cotton:95|elastane:5), image_url, care, description, fabric_gsm, units_sold. One row per seller offer; prices build the price history.'],
  ['reviews (daily)', 'Required: external_id, product_external_id, rating (1–5), text, date. Optional: title, verified, size_bought, fit_answer (runs small / true to size / runs large), height_cm, body_type, language.'],
  ['returns (optional, weekly)', 'Required: external_id, product_external_id, reason (free text is fine), date. Optional: size. Return rates also need units_sold in the catalog.'],
  ['source, licence', 'Who sent the data and under which terms; stored on every record.'],
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
  const sample = await prisma.clothingProduct.findFirst({ where: PUBLIC_PRODUCTS, orderBy: { slug: 'asc' }, select: { slug: true } })
  const slug = sample?.slug ?? 'your-product-slug'
  const base = siteUrl()

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-14 sm:px-6">
        <p className="text-sm font-medium text-accent">Developers</p>
        <h1 className="mt-3 max-w-3xl text-balance text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-fg">
          The Score API. Rank by what’s worth buying.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-fg-muted">
          Read Veritas Scores, pillars, factors and verified text as JSON. Built for site search, product pages and AI
          shopping agents.
        </p>
        {(process.env.APP_ENV !== 'production' || process.env.DEMO_STORE === '1') && (
        <p className="mt-4">
          <Link href="/demo/store" className="text-sm font-medium text-accent underline underline-offset-4">
            See it in a demo store: star ratings vs. the Veritas Score
          </Link>
        </p>
        )}
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

      <section aria-labelledby="ingest-h" className="mx-auto grid max-w-6xl gap-8 border-t border-border px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="accent">POST</Badge>
            <h2 id="ingest-h" className="font-mono text-base font-semibold text-fg">
              /api/v1/ingest/{'{catalog | reviews | returns}'}
            </h2>
          </div>
          <p className="mt-3 text-sm text-fg-muted">
            Send your data with your API key: three simple feeds, CSV or JSON, up to 5,000 rows per request. Rows are matched by your own ids, so re-sending a file never
            creates duplicates. Add <code className="text-xs">?dryRun=1</code> to check a file without saving. The response is a validation report naming every rejected row.
            Your data stays private to your organisation.
          </p>
          <dl className="mt-6 divide-y divide-border text-sm">
            {INGEST_FIELDS.map(([k, v]) => (
              <div key={k} className="py-2.5">
                <dt className="font-mono text-[13px] text-fg">{k}</dt>
                <dd className="mt-0.5 text-fg-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Code
            code={`curl -X POST "${base}/api/v1/ingest/catalog?source=nightly-export&dryRun=1" \\
  -H "Authorization: Bearer vk_live_…" \\
  -H "Content-Type: text/csv" \\
  --data-binary @catalog.csv`}
          />
          <Code
            lang="json"
            code={`{ "success": true, "data": {
  "rows": 269, "accepted": 266, "rejected": 3,
  "created": 200, "updated": 0, "unchanged": 0, "productsChanged": 200,
  "errors": [{ "row": 267, "field": "category",
    "message": "\"Dresses\" is not scored yet (Veritas scores t-shirts, shirts and jeans for now)" }]
} }`}
          />
        </div>
      </section>

      <section aria-labelledby="feeds-h" className="mx-auto grid max-w-6xl gap-8 border-t border-border px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="accent">GET</Badge>
            <h2 id="feeds-h" className="font-mono text-base font-semibold text-fg">
              /api/v1/feeds/ads · /api/v1/feeds/social
            </h2>
          </div>
          <p className="mt-3 text-sm text-fg-muted">
            The ad feed is your catalog in the standard catalog-feed shape that ad and social tools import, plus labels: <code className="text-xs">custom_label_0</code> score tier,{' '}
            <code className="text-xs">1</code> top highlight, <code className="text-xs">2</code> price status, <code className="text-xs">3</code> confidence,{' '}
            <code className="text-xs">4</code> ad ok or hold, and verified ad copy. Target <code className="text-xs">veritas_ad_ok</code> to advertise only products that are worth
            buying. The social feed gives ready-to-post “top rated this week” lists with tracked links.
          </p>
          <p className="mt-3 text-sm text-fg-muted">The score decides which products may be advertised (70+, enough evidence, no fake sale price, not often returned). Paying never changes a score.</p>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Code code={`curl "${base}/api/v1/feeds/ads?eligible=1&format=csv" -H "Authorization: Bearer vk_live_…" -o ad-feed.csv`} />
          <Code code={`curl "${base}/api/v1/feeds/social?n=5" -H "Authorization: Bearer vk_live_…"`} />
        </div>
      </section>
    </SiteShell>
  )
}

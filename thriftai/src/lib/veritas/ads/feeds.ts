/**
 * Ad feed and social pack (B11). The ad feed is the platform's catalog in the standard catalog-feed shape
 * that ad and social tools import, plus Veritas labels so campaigns can target well-scored, honestly priced items.
 * The social pack is a ready-to-schedule "Top rated this week" list per category with verified copy.
 */
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { tagsForProducts } from '../read/tags'
import { topTags } from '../enrich/tags'
import { adEligibility, priceStatus, scoreTier } from './rules'
import { siteUrl } from '@/lib/site-url'

export const AD_FEED_COLUMNS = [
  'id', 'title', 'description', 'link', 'image_link', 'price', 'brand', 'availability', 'condition', 'product_type',
  'custom_label_0', 'custom_label_1', 'custom_label_2', 'custom_label_3', 'custom_label_4',
  'veritas_score', 'veritas_ad_eligible', 'veritas_not_eligible_because', 'ad_headline', 'ad_body',
] as const

const base = siteUrl

/** `scope` decides whose products: visibleProducts(tenant) for the API, the user's own tenant on the dashboard. */
export async function loadAdRows(scope: Prisma.ClothingProductWhereInput, opts: { eligibleOnly?: boolean; category?: 'TOPS' | 'BOTTOMS' } = {}) {
  const where: Prisma.ClothingProductWhereInput = { AND: [scope, { isAvailable: true }, opts.category ? { category: opts.category } : {}] }
  const rows = await prisma.clothingProduct.findMany({
    where,
    select: {
      id: true, slug: true, externalId: true, name: true, category: true, subcategory: true, currentPrice: true, currency: true, url: true, primaryImageUrl: true,
      brand: { select: { name: true } },
      productScore: { select: { overall: true, confidenceLabel: true } },
      adCopy: { select: { headline: true, body: true, sources: true } },
    },
    orderBy: { slug: 'asc' },
  })
  const tags = await tagsForProducts(rows.map((r) => r.id))
  const out = rows.map((r) => {
    const t = tags.get(r.id) ?? []
    const score = r.productScore?.overall ?? null
    const label = r.productScore?.confidenceLabel ?? null
    const el = adEligibility({ score, label, tags: t })
    const highlight = topTags(t.filter((x) => x.tone === 'good'), 1)[0]
    return {
      slug: r.slug,
      category: r.category,
      score,
      eligible: el.eligible,
      sources: (r.adCopy?.sources ?? []) as { id: string; text?: string }[],
      feed: {
        id: r.externalId ?? r.slug,
        title: `${r.brand.name} ${r.name}`,
        description: r.adCopy?.body ?? highlight?.detail ?? '',
        link: r.url ?? `${base()}/p/${r.slug}`,
        image_link: r.primaryImageUrl ?? `${base()}/p/${r.slug}/opengraph-image`,
        price: `${Number(r.currentPrice).toFixed(2)} ${r.currency}`,
        brand: r.brand.name,
        availability: 'in stock',
        condition: 'new',
        product_type: r.category === 'BOTTOMS' ? 'Apparel > Jeans' : r.subcategory === 'shirt' ? 'Apparel > Shirts' : 'Apparel > T-shirts',
        custom_label_0: scoreTier(score),
        custom_label_1: highlight ? highlight.key.replace(/[^a-z0-9_]+/gi, '_').toLowerCase() : '',
        custom_label_2: priceStatus(t),
        custom_label_3: (label ?? 'unrated').toLowerCase(),
        custom_label_4: el.eligible ? 'veritas_ad_ok' : 'veritas_ad_hold',
        veritas_score: score === null ? '' : String(Math.round(score)),
        veritas_ad_eligible: el.eligible ? 'yes' : 'no',
        veritas_not_eligible_because: el.reasons.join('; '),
        ad_headline: r.adCopy?.headline ?? highlight?.label ?? '',
        ad_body: r.adCopy?.body ?? '',
      } as Record<(typeof AD_FEED_COLUMNS)[number], string>,
    }
  })
  return opts.eligibleOnly ? out.filter((x) => x.eligible) : out
}

export type SocialPost = { category: 'TOPS' | 'BOTTOMS'; title: string; caption: string; items: { rank: number; title: string; score: number; line: string; link: string; sources: { id: string; text?: string }[] }[] }

/** "Top rated this week": the best eligible products per category, caption built by template (no model call). */
export async function socialPack(scope: Prisma.ClothingProductWhereInput, n = 5, campaign = 'top-rated-week'): Promise<SocialPost[]> {
  const posts: SocialPost[] = []
  for (const category of ['TOPS', 'BOTTOMS'] as const) {
    const rows = (await loadAdRows(scope, { eligibleOnly: true, category })).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, n)
    if (!rows.length) continue
    const noun = category === 'TOPS' ? 'tees' : 'jeans'
    const utm = (link: string) => `${link}${link.includes('?') ? '&' : '?'}utm_source=social&utm_medium=organic&utm_campaign=${campaign}`
    const items = rows.map((r, i) => ({
      rank: i + 1,
      title: r.feed.title,
      score: Math.round(r.score ?? 0),
      line: r.feed.ad_body || r.feed.ad_headline || r.feed.description,
      link: utm(r.feed.link),
      sources: r.sources,
    }))
    posts.push({
      category,
      title: `Top-rated ${noun} this week`,
      caption: [
        `Top-rated ${noun} this week, chosen by owner evidence, not by who paid:`,
        ...items.map((it) => `${it.rank}. ${it.title} (score ${it.score})${it.line ? ` · ${it.line}` : ''}`),
        'Every claim links to the reviews, returns and prices behind it.',
      ].join('\n'),
      items,
    })
  }
  return posts
}

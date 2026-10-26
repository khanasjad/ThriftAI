import 'server-only'
import { PUBLIC_PRODUCTS } from '@/lib/veritas/scope'
import { prisma } from '@/lib/prisma'
import type { Candidate } from './rank'

/**
 * Loads search candidates with their stored scores (online search reads stored scores only; plan §4.3).
 * Fit answers come with the reviewer's height/build so Personal Match can use similar shoppers.
 */
export async function loadCandidates(): Promise<Candidate[]> {
  const rows = await prisma.clothingProduct.findMany({
    where: { isAvailable: true, ...PUBLIC_PRODUCTS },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      subcategory: true,
      gender: true,
      description: true,
      fitType: true,
      silhouette: true,
      colors: true,
      materials: true,
      fabricWeightGsm: true,
      elastanePct: true,
      trendTag: true,
      launchDate: true,
      currentPrice: true,
      brand: { select: { slug: true, name: true } },
      productScore: true,
      visual: { select: { attributes: true } },
      factorScores: { where: { version: 'v2', factor: { in: ['comfort.breathability'] } }, select: { factor: true, value: true } },
      reviews: { select: { fitsAs: true, heightCm: true, bodyType: true } },
      priceSnapshots: { orderBy: { observedAt: 'desc' }, select: { price: true, sellerId: true, observedAt: true } },
    },
  })
  return rows.map((r) => {
    // Latest price per seller.
    const latest = new Map<string, number>()
    for (const s of r.priceSnapshots) if (!latest.has(s.sellerId ?? 'brand')) latest.set(s.sellerId ?? 'brand', Number(s.price))
    const prices = latest.size ? [...latest.values()] : [Number(r.currentPrice)]
    const ps = r.productScore
    const v = r.visual?.attributes as { garment?: string; pattern?: string; pattern_detail?: string; colors?: { name: string; family: string }[]; style_tags?: string[]; motifs?: { label: string }[]; print_text?: string } | undefined
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      brandSlug: r.brand.slug,
      brandName: r.brand.name,
      category: r.category,
      subcategory: r.subcategory,
      gender: r.gender,
      text: [r.name, r.subcategory, r.description, r.fitType, r.silhouette, r.brand.name, ...r.colors, ...Object.keys((r.materials ?? {}) as object), v?.pattern, v?.pattern_detail, ...(v?.colors ?? []).flatMap((c) => [c.name, c.family]), ...(v?.style_tags ?? [])].filter(Boolean).join(' ').toLowerCase(),
      pattern: v?.pattern ?? null,
      visualColors: (v?.colors ?? []).map((c) => c.name),
      colorFamilies: [...new Set((v?.colors ?? []).map((c) => c.family))],
      styleTags: v?.style_tags ?? [],
      motifLabels: (v?.motifs ?? []).map((m) => m.label),
      look: v ? [v.garment, ...(v.motifs ?? []).map((m) => m.label), v.print_text ?? ''].join(' · ').toLowerCase() : undefined,
      fitType: r.fitType,
      silhouette: r.silhouette,
      colors: r.colors,
      length: r.category !== 'TOPS' ? null : /crop/i.test(`${r.name} ${r.silhouette ?? ''}`) ? 'cropped' : /longline/i.test(`${r.name} ${r.silhouette ?? ''}`) ? 'longline' : 'regular',
      gsm: r.fabricWeightGsm,
      elastanePct: r.elastanePct,
      breathability: (() => {
        const f = r.factorScores.find((x) => x.factor === 'comfort.breathability')
        return f ? Number(f.value) : null
      })(),
      trendTag: r.trendTag,
      launchDate: r.launchDate,
      priceMin: Math.min(...prices),
      priceMax: Math.max(...prices),
      sellerCount: latest.size || 1,
      score: ps?.overall ?? null,
      scoreWithSustainability: ps?.overallWithSustainability ?? null,
      label: ps?.confidenceLabel ?? null,
      earlyScore: ps?.earlyScore ?? null,
      pillars: ps ? { FIT: ps.fit, QUALITY: ps.quality, STYLE_VALUE: ps.styleValue, COMFORT: ps.comfort, SUSTAINABILITY: ps.sustainability } : {},
      text_verified: ps?.verified ? { summary: ps.summary, sizeAdvice: ps.sizeAdvice, downside: ps.downside } : null,
      fitAnswers: r.reviews.filter((x) => x.fitsAs).map((x) => ({ fitsAs: x.fitsAs!, heightCm: x.heightCm, bodyType: x.bodyType })),
    }
  })
}

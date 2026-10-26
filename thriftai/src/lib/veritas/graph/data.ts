/**
 * Database access for the rate-product graph: load a product bundle, hash its inputs,
 * read stored evidence, and save a rating in one transaction.
 */
import { createHash } from 'node:crypto'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { signalSentiment, pillarOf, type EvidenceDraft, type ProductBundle } from '../evidence/types'
import type { Baseline, ProductScoreResult } from '../scoring/v2'

export async function loadBundle(slugOrId: string): Promise<ProductBundle | null> {
  const p = await prisma.clothingProduct.findFirst({
    where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
    include: {
      brand: true,
      reviews: true,
      returns: { select: { id: true, returnReason: true, detailedReason: true } },
      priceSnapshots: { include: { seller: { select: { name: true } } }, orderBy: { observedAt: 'asc' } },
    },
  })
  if (!p) return null
  const trend = p.silhouette
    ? await prisma.trendSignal.findFirst({ where: { trendName: p.silhouette }, orderBy: { weekOf: 'desc' }, select: { trendPhase: true } })
    : null

  const bySeller = new Map<string, ProductBundle['prices'][number]>()
  for (const s of p.priceSnapshots) {
    const name = s.seller?.name ?? `${p.brand.name} store`
    if (!bySeller.has(name)) bySeller.set(name, { seller: name, points: [] })
    bySeller.get(name)!.points.push({
      date: s.observedAt.toISOString().slice(0, 10),
      price: Number(s.price),
      listPrice: s.listPrice == null ? null : Number(s.listPrice),
      isPromo: s.isPromo,
    })
  }

  return {
    product: {
      id: p.id,
      tenantId: p.tenantId,
      isPrivate: p.isPrivate,
      slug: p.slug,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      description: p.description,
      sizes: p.sizes,
      hasPetite: p.hasPetite,
      hasTall: p.hasTall,
      hasPlus: p.hasPlus,
      materials: (p.materials ?? {}) as Record<string, number>,
      fabricWeightGsm: p.fabricWeightGsm,
      elastanePct: p.elastanePct,
      fitType: p.fitType,
      silhouette: p.silhouette,
      careInstructions: p.careInstructions,
      certifications: p.certifications,
      recycledContent: p.recycledContent,
      unitsSold: p.unitsSold,
      resaleRetainedPct: p.resaleRetainedPct,
      launchDate: p.launchDate,
      updatedAt: p.updatedAt,
    },
    brand: {
      id: p.brand.id,
      name: p.brand.name,
      publishesSuppliers: p.brand.publishesSuppliers,
      hasRepairProgram: p.brand.hasRepairProgram,
      hasTakeBack: p.brand.hasTakeBack,
    },
    reviews: p.reviews.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      rating: r.rating,
      language: r.language,
      fitsAs: r.fitsAs,
      sizePurchased: r.sizePurchased,
      heightCm: r.heightCm,
      bodyType: r.bodyType,
      wearDuration: r.wearDuration,
      verified: r.isVerifiedPurchase,
      helpfulVotes: r.helpfulVotes,
      date: r.reviewDate,
    })),
    returns: p.returns,
    prices: [...bySeller.values()],
    trendPhase: trend?.trendPhase ?? null,
  }
}

function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`
  if (v instanceof Date) return JSON.stringify(v.toISOString())
  if (v && typeof v === 'object')
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`)
      .join(',')}}`
  return JSON.stringify(v)
}

/**
 * Hash of everything a rating depends on. Same hash → same result, so the graph skips the product.
 * `versions` carries the score version and agent versions, so changing the maths or a prompt re-rates.
 */
export function hashInputs(b: ProductBundle, versions: Record<string, string>) {
  const { updatedAt: _ignored, ...product } = b.product
  void _ignored
  const payload = {
    versions,
    product,
    brand: b.brand,
    reviews: [...b.reviews].sort((x, y) => x.id.localeCompare(y.id)),
    returns: [...b.returns].sort((x, y) => x.id.localeCompare(y.id)),
    prices: b.prices,
    trendPhase: b.trendPhase,
  }
  return createHash('sha256').update(stable(payload)).digest('hex')
}

/**
 * True when this exact input set was already rated: either the published score carries the hash, or the
 * latest successful (non-dry) rating run does. The second case matters for products whose evidence was
 * below the publish bar; without it they would be re-rated (and the agent re-paid) on every run.
 */
export async function alreadyRated(productId: string, inputsHash: string, scoreVersion: string) {
  const score = await prisma.productScore.findUnique({ where: { productId }, select: { inputsHash: true, scoreVersion: true } })
  if (score?.inputsHash === inputsHash && score.scoreVersion === scoreVersion) return true
  const run = await prisma.agentRun.findFirst({
    where: { productId, agent: 'rate-product', status: 'OK', inputsHash },
    orderBy: { startedAt: 'desc' },
    select: { finishPayload: true },
  })
  const payload = run?.finishPayload as { dryRun?: boolean } | null | undefined
  return !!run && payload?.dryRun === false
}

export async function loadBaselines(category: string, subcategory: string | null): Promise<Record<string, Baseline>> {
  const rows = await prisma.categoryBaseline.findMany({
    where: { category: category as Prisma.CategoryBaselineWhereInput['category'], subcategory: subcategory ?? '' },
  })
  return Object.fromEntries(rows.map((r) => [r.factor, { mean: Number(r.mean), k: r.priorStrength }]))
}

export type StoredEvidence = EvidenceDraft & { injectionFlag: boolean; effectiveConfidence: number }

/** Agent evidence from the product's latest evidence run that recorded anything (reused in structured-only mode). */
export async function latestAgentEvidence(productId: string): Promise<{ runId: string; evidence: StoredEvidence[] } | null> {
  const run = await prisma.agentRun.findFirst({
    where: { productId, agent: 'evidence', evidence: { some: {} } },
    orderBy: { startedAt: 'desc' },
    select: { id: true, evidence: true },
  })
  return run ? toStored(run) : null
}

/**
 * Agent evidence from an earlier run over exactly the same review and return text (same hash).
 * Lets full ratings skip the paid agent when only prices or other structured data changed.
 */
export async function agentEvidenceForText(productId: string, textHash: string): Promise<{ runId: string; evidence: StoredEvidence[] } | null> {
  const run = await prisma.agentRun.findFirst({
    where: { productId, agent: 'evidence', inputsHash: textHash, status: 'OK', evidence: { some: {} } },
    orderBy: { startedAt: 'desc' },
    select: { id: true, evidence: true },
  })
  return run ? toStored(run) : null
}

/** The stored verified shopper text, if it was written from exactly these writer inputs (same hash). */
export async function verifiedTextFor(productId: string, itemsHash: string) {
  const ps = await prisma.productScore.findUnique({ where: { productId }, select: { verified: true, summary: true, sizeAdvice: true, downside: true, ratedByRunId: true } })
  if (!ps?.verified || !ps.ratedByRunId) return null
  const run = await prisma.agentRun.findUnique({ where: { id: ps.ratedByRunId }, select: { finishPayload: true } })
  const prevHash = (run?.finishPayload as { textHash?: string } | null)?.textHash
  return prevHash === itemsHash ? { summary: ps.summary, sizeAdvice: ps.sizeAdvice, downside: ps.downside } : null
}

function toStored(run: { id: string; evidence: Prisma.EvidenceTagGetPayload<object>[] }): { runId: string; evidence: StoredEvidence[] } {
  return {
    runId: run.id,
    evidence: run.evidence.map((e) => ({
      sourceType: e.sourceType as StoredEvidence['sourceType'],
      reviewId: e.reviewId ?? undefined,
      returnId: e.returnId ?? undefined,
      factor: e.factor,
      signal: e.signal,
      confidence: Number(((e.metadata as { rawConfidence?: number } | null)?.rawConfidence ?? e.confidence) as number),
      quote: e.quote,
      origin: (e.metadata as { origin?: string } | null)?.origin ?? 'agent:evidence',
      injectionFlag: e.injectionFlag,
      effectiveConfidence: Number(e.confidence),
    })),
  }
}

const dec2 = (x: number) => new Prisma.Decimal(Math.round(x * 100) / 100)

/** Evidence rows for one run. Agent evidence is already stored by the graph under the agent's run id. */
export function evidenceRows(productId: string, runId: string, items: StoredEvidence[]): Prisma.EvidenceTagCreateManyInput[] {
  return items.map((e) => ({
    productId,
    runId,
    sourceType: e.sourceType,
    reviewId: e.reviewId ?? null,
    returnId: e.returnId ?? null,
    factor: e.factor,
    pillar: pillarOf(e.factor)! as Prisma.EvidenceTagCreateManyInput['pillar'],
    signal: e.signal,
    sentiment: dec2(signalSentiment(e.factor, e.signal) ?? 0),
    confidence: dec2(e.effectiveConfidence),
    quote: e.quote,
    grounded: true,
    injectionFlag: e.injectionFlag,
    metadata: { origin: e.origin, rawConfidence: e.confidence },
  }))
}

export async function saveEvidence(productId: string, runId: string, items: StoredEvidence[]) {
  if (items.length) await prisma.evidenceTag.createMany({ data: evidenceRows(productId, runId, items) })
}

const LABEL_TO_CONFIDENCE = { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW', NEW_LAUNCH: 'LOW' } as const

/** Writes factor scores, the product score (or removes it when not publishable) and the trend tag, atomically. */
export async function saveRating(args: {
  productId: string
  result: ProductScoreResult
  reviewCount: number
  inputsHash: string
  ratedByRunId: string
  trendTag: 'TRENDING' | 'CLASSIC' | 'FADING' | null
  earlyScore?: number | null
  /** Verified shopper text. `undefined` keeps whatever is stored (structured re-scores don't rewrite text). */
  text?: { summary: string | null; sizeAdvice: string | null; downside: string | null; verified: boolean }
}) {
  const { productId, result: r } = args
  await prisma.$transaction(async (tx) => {
    await tx.factorScore.deleteMany({ where: { productId, version: 'v2' } })
    if (r.factors.length)
      await tx.factorScore.createMany({
        data: r.factors.map((f) => ({
          productId,
          factor: f.factor,
          pillar: f.pillar,
          value: dec2(f.value),
          rawValue: dec2(f.raw),
          weight: f.weight,
          evidenceCount: f.evidenceCount,
          confidence: f.confidence,
          version: 'v2',
        })),
      })
    await tx.clothingProduct.update({ where: { id: productId }, data: { trendTag: args.trendTag } })

    if (!r.publishable || r.overall === null) {
      await tx.productScore.deleteMany({ where: { productId } })
      return
    }
    const p = r.pillars
    const data = {
      overall: r.overall,
      overallWithSustainability: r.overallWithSustainability,
      grade: r.grade!,
      fit: p.FIT.value === null ? null : Math.round(p.FIT.value),
      quality: p.QUALITY.value === null ? null : Math.round(p.QUALITY.value),
      styleValue: p.STYLE_VALUE.value === null ? null : Math.round(p.STYLE_VALUE.value),
      comfort: p.COMFORT.value === null ? null : Math.round(p.COMFORT.value),
      sustainability: p.SUSTAINABILITY.value === null ? null : Math.round(p.SUSTAINABILITY.value),
      confidence: LABEL_TO_CONFIDENCE[r.label],
      confidenceLabel: r.label,
      evidenceCount: r.evidenceCount,
      reviewCount: args.reviewCount,
      factorsIncluded: r.factorsIncluded,
      factorsMissing: r.factorsMissing,
      scoreVersion: r.version,
      inputsHash: args.inputsHash,
      ratedByRunId: args.ratedByRunId,
      calculatedAt: new Date(),
      earlyScore: args.earlyScore ?? null,
      ...(args.text && {
        summary: args.text.verified ? args.text.summary : null,
        sizeAdvice: args.text.verified ? args.text.sizeAdvice : null,
        downside: args.text.verified ? args.text.downside : null,
        verified: args.text.verified,
      }),
    }
    await tx.productScore.upsert({ where: { productId }, create: { productId, ...data }, update: data })
  })
}

/** Category baselines from stored raw factor values (shrinkage targets). */
export async function storeBaselines(rows: { category: string; subcategory: string; factor: string; mean: number; k: number }[]) {
  await prisma.$transaction(
    rows.map((r) =>
      prisma.categoryBaseline.upsert({
        where: { category_subcategory_factor: { category: r.category as never, subcategory: r.subcategory, factor: r.factor } },
        create: { category: r.category as never, subcategory: r.subcategory, factor: r.factor, mean: dec2(r.mean), priorStrength: r.k },
        update: { mean: dec2(r.mean), priorStrength: r.k },
      }),
    ),
  )
}

/** Per-product stats the roll-ups need: published pillar scores, price and fit answers. One query for the catalog. */
export async function loadPeerStats(): Promise<import('../evidence/rollups').PeerStat[]> {
  const rows = await prisma.clothingProduct.findMany({
    select: {
      id: true,
      brandId: true,
      category: true,
      subcategory: true,
      currentPrice: true,
      isPrivate: true,
      tenantId: true,
      productScore: { select: { overall: true, fit: true, quality: true } },
      reviews: { select: { fitsAs: true } },
    },
  })
  return rows.map((r) => ({
    productId: r.id,
    brandId: r.brandId,
    category: r.category,
    subcategory: r.subcategory,
    price: r.currentPrice === null ? null : Number(r.currentPrice),
    isPrivate: r.isPrivate,
    tenantId: r.tenantId,
    fit: r.productScore?.fit ?? null,
    quality: r.productScore?.quality ?? null,
    overall: r.productScore?.overall ?? null,
    fitAnswers: {
      small: r.reviews.filter((x) => x.fitsAs === 'runs_small').length,
      tts: r.reviews.filter((x) => x.fitsAs === 'true_to_size').length,
      large: r.reviews.filter((x) => x.fitsAs === 'runs_large').length,
    },
  }))
}

export async function saveFindings(rows: Prisma.AgentFindingCreateManyInput[]) {
  if (rows.length) await prisma.agentFinding.createMany({ data: rows })
}

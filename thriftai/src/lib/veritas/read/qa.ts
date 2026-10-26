import 'server-only'
import { prisma } from '@/lib/prisma'
import { computePriceFacts, type SellerSeries } from '../price/facts'
import { instantAnswers, type FactorMentions } from '../qa/instant'
import { answerQuestion, type AskResult } from '../graph/ask-product'
import { latestAgentEvidence, loadBundle } from '../graph/data'
import { signalSentiment } from '../evidence/types'

const FIT_REASONS = ['TOO_SMALL', 'TOO_LARGE', 'POOR_FIT']
const QUALITY_REASONS = ['POOR_QUALITY', 'DAMAGE_DEFECT']

/** Instant answers for a product page ($0, counts only). */
export async function loadInstantAnswers(productId: string) {
  const p = await prisma.clothingProduct.findUnique({
    where: { id: productId },
    select: {
      category: true,
      subcategory: true,
      fabricWeightGsm: true,
      unitsSold: true,
      reviews: { select: { fitsAs: true } },
      returns: { select: { returnReason: true } },
      priceSnapshots: { select: { sellerId: true, price: true, listPrice: true, isPromo: true, observedAt: true }, orderBy: { observedAt: 'asc' } },
    },
  })
  if (!p) return []
  const fit = { small: 0, large: 0, tts: 0, total: 0 }
  for (const r of p.reviews) {
    if (!r.fitsAs) continue
    fit.total++
    if (r.fitsAs === 'runs_small') fit.small++
    else if (r.fitsAs === 'runs_large') fit.large++
    else if (r.fitsAs === 'true_to_size') fit.tts++
  }

  // Mentions: distinct owners per factor and direction, from the agent evidence behind the current rating.
  const latest = await latestAgentEvidence(productId)
  const acc = new Map<string, { pos: Set<string>; neg: Set<string>; posSig: Map<string, number>; negSig: Map<string, number> }>()
  for (const e of latest?.evidence ?? []) {
    if (e.sourceType !== 'REVIEW' || e.injectionFlag || !e.reviewId) continue
    const s = signalSentiment(e.factor, e.signal) ?? 0
    if (s === 0) continue
    const a = acc.get(e.factor) ?? { pos: new Set(), neg: new Set(), posSig: new Map(), negSig: new Map() }
    const [set, sig] = s > 0 ? [a.pos, a.posSig] : [a.neg, a.negSig]
    set.add(e.reviewId)
    sig.set(e.signal, (sig.get(e.signal) ?? 0) + 1)
    acc.set(e.factor, a)
  }
  const top = (m: Map<string, number>) => [...m.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null
  const mentions: Record<string, FactorMentions> = {}
  for (const [k, a] of acc) mentions[k] = { pos: a.pos.size, neg: a.neg.size, topPos: top(a.posSig), topNeg: top(a.negSig) }

  const bySeller = new Map<string, SellerSeries>()
  for (const s of p.priceSnapshots) {
    const k = s.sellerId ?? 'brand'
    if (!bySeller.has(k)) bySeller.set(k, { seller: k, points: [] })
    bySeller.get(k)!.points.push({ date: s.observedAt.toISOString().slice(0, 10), price: Number(s.price), listPrice: s.listPrice == null ? null : Number(s.listPrice), isPromo: s.isPromo })
  }
  const facts = computePriceFacts([...bySeller.values()])
  const reasons = p.returns.reduce<Record<string, number>>((m, r) => ((m[r.returnReason] = (m[r.returnReason] ?? 0) + 1), m), {})

  return instantAnswers({
    category: p.category,
    subcategory: p.subcategory,
    fit,
    mentions,
    fabricWeightGsm: p.fabricWeightGsm,
    price: { fakeDiscount: !!facts.fakeDiscount, oftenCheaper: facts.oftenCheaper, days: facts.days },
    returns: {
      fit: p.returns.filter((r) => FIT_REASONS.includes(r.returnReason)).length,
      quality: p.returns.filter((r) => QUALITY_REASONS.includes(r.returnReason)).length,
      units: p.unitsSold,
      topReason: Object.entries(reasons).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    },
  })
}

// Same question about the same evidence → same answer, without paying again (per server instance).
const cache = new Map<string, AskResult>()
const norm = (q: string) => q.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

export async function askProduct(slugOrId: string, question: string): Promise<AskResult | null> {
  const bundle = await loadBundle(slugOrId)
  if (!bundle) return null
  const latest = await latestAgentEvidence(bundle.product.id)
  const key = `${bundle.product.id}|${latest?.runId ?? 'none'}|${norm(question)}`
  const hit = cache.get(key)
  if (hit) return { ...hit, costUsd: 0 }
  const r = await answerQuestion(bundle, latest?.evidence ?? [], question, {})
  if (r.status !== 'error') {
    if (cache.size > 500) cache.delete(cache.keys().next().value!)
    cache.set(key, r)
  }
  return r
}

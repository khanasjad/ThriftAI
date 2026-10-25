/**
 * Numbered evidence items the writer may cite: owners' quotes (from the evidence agent) and facts computed by code.
 * The verifier checks each written sentence against the items it cites.
 */
import { computePriceFacts } from '../price/facts'
import type { ProductBundle } from '../evidence/types'
import { signalSentiment } from '../evidence/types'
import type { StoredEvidence } from '../graph/data'

export type WriterItem = { id: string; kind: 'quote' | 'fact'; factor: string; text: string; sentiment: number }

const MAX_QUOTES = 30
const money = (n: number) => `$${n.toFixed(2)}`

export function buildWriterItems(bundle: ProductBundle, evidence: StoredEvidence[]): WriterItem[] {
  const items: WriterItem[] = []

  // Quotes: most confident first, balanced between positive and negative so the downside is visible.
  const quotes = evidence
    .filter((e) => e.origin === 'agent:evidence' && e.quote && !e.injectionFlag)
    .map((e) => ({ e, s: signalSentiment(e.factor, e.signal) ?? 0 }))
    .sort((a, b) => b.e.effectiveConfidence - a.e.effectiveConfidence)
  const neg = quotes.filter((q) => q.s < 0).slice(0, MAX_QUOTES / 2)
  const pos = quotes.filter((q) => q.s >= 0).slice(0, MAX_QUOTES - neg.length)
  ;[...neg, ...pos].forEach(({ e, s }, i) =>
    items.push({ id: `q${i + 1}`, kind: 'quote', factor: e.factor, sentiment: s, text: `${e.factor} · ${e.signal.replace(/_/g, ' ')} · "${e.quote}"` }),
  )

  // Facts computed by code.
  const fit = { small: 0, tts: 0, large: 0 }
  for (const r of bundle.reviews) {
    if (r.fitsAs === 'runs_small') fit.small++
    else if (r.fitsAs === 'true_to_size') fit.tts++
    else if (r.fitsAs === 'runs_large') fit.large++
  }
  const answered = fit.small + fit.tts + fit.large
  if (answered > 0)
    items.push({
      id: 'f-fit',
      kind: 'fact',
      factor: 'fit.true_to_size',
      sentiment: 0,
      text: `Fit answers from ${answered} reviewers: ${fit.small} say runs small, ${fit.tts} say true to size, ${fit.large} say runs large.`,
    })

  const pf = computePriceFacts(bundle.prices)
  if (pf.lowest) items.push({ id: 'f-price-low', kind: 'fact', factor: 'style_value.price_fairness', sentiment: 0, text: `Lowest price in ${pf.days} days: ${money(pf.lowest.price)} at ${pf.lowest.seller}.` })
  if (pf.current.length) items.push({ id: 'f-price-now', kind: 'fact', factor: 'style_value.price_fairness', sentiment: 0, text: `Current prices: ${pf.current.map((c) => `${money(c.price)} at ${c.seller}`).join(', ')}.` })
  if (pf.fakeDiscount)
    items.push({ id: 'f-price-fake', kind: 'fact', factor: 'style_value.price_fairness', sentiment: -1, text: `A seller showed a "was" price of ${money(pf.fakeDiscount.listPrice)}, but no seller charged more than ${money(pf.fakeDiscount.highestCharged)}.` })
  if (pf.oftenCheaper)
    items.push({ id: 'f-price-wait', kind: 'fact', factor: 'style_value.price_fairness', sentiment: -0.5, text: `It has been ${money(pf.oftenCheaper.lowest)}; today's lowest is ${money(pf.oftenCheaper.nowLowest)}.` })

  const p = bundle.product
  if (p.careInstructions) items.push({ id: 'f-care', kind: 'fact', factor: 'comfort.easy_care', sentiment: 0, text: `Care label: ${p.careInstructions}.` })
  if (p.sizes.length) items.push({ id: 'f-sizes', kind: 'fact', factor: 'fit.size_range', sentiment: 0, text: `Sizes: ${p.sizes.join(', ')}${[p.hasPetite && 'petite', p.hasTall && 'tall', p.hasPlus && 'plus'].filter(Boolean).length ? `; also ${[p.hasPetite && 'petite', p.hasTall && 'tall', p.hasPlus && 'plus'].filter(Boolean).join(', ')}` : ''}.` })
  if (p.fabricWeightGsm) items.push({ id: 'f-fabric', kind: 'fact', factor: 'quality.fabric', sentiment: 0, text: `Fabric: ${Object.entries(p.materials).map(([m, v]) => `${v}% ${m}`).join(', ')}, ${p.fabricWeightGsm} gsm.` })
  return items
}

/**
 * Instant answers to the questions shoppers ask most (B9 product Q&A). Pure code over counts:
 * no model, no cost, and every number comes straight from the data. When there isn't enough evidence,
 * the answer says so.
 */
import { RETURN_BENCHMARK } from '../evidence/structured'

/** How many different owners mentioned a factor positively / negatively, and the most common signal on each side. */
export type FactorMentions = { pos: number; neg: number; topPos: string | null; topNeg: string | null }

export type InstantInputs = {
  category: string
  fit: { small: number; large: number; tts: number; total: number }
  mentions: Record<string, FactorMentions>
  fabricWeightGsm: number | null
  price: { fakeDiscount: boolean; oftenCheaper: { lowest: number; nowLowest: number } | null; days: number }
  returns: { fit: number; quality: number; units: number | null; topReason: string | null }
}

export type InstantAnswer = { id: string; question: string; answer: string; enough: boolean }

const MIN_MENTIONS = 2
const words = (s: string | null) => (s ? s.replace(/_/g, ' ') : '')
const pct = (x: number) => `${Math.round(x * 100)}%`

function fromMentions(keys: string[], m: InstantInputs['mentions'], good: string, bad: string): { text: string; enough: boolean } {
  const pos = keys.reduce((s, k) => s + (m[k]?.pos ?? 0), 0)
  const neg = keys.reduce((s, k) => s + (m[k]?.neg ?? 0), 0)
  if (pos + neg < MIN_MENTIONS) return { text: 'Not enough owners have written about this yet.', enough: false }
  const topNeg = keys.map((k) => m[k]?.topNeg).find(Boolean) ?? null
  const parts = [`${pos} owner${pos === 1 ? '' : 's'} ${good}`, neg ? `${neg} ${bad}${topNeg ? ` (most often: “${words(topNeg)}”)` : ''}` : `none ${bad}`]
  return { text: `${parts.join('; ')}.`, enough: true }
}

export function instantAnswers(i: InstantInputs): InstantAnswer[] {
  const out: InstantAnswer[] = []

  // Fit
  const { small, large, tts, total } = i.fit
  if (total < 3) out.push({ id: 'fit', question: 'Does it run small or large?', answer: 'Not enough owners have answered the fit question yet.', enough: false })
  else {
    const lead = small / total >= 0.4 ? 'It tends to run small: consider a size up.' : large / total >= 0.4 ? 'It tends to run large: consider a size down.' : tts / total >= 0.5 ? 'Most owners say it is true to size: order your usual size.' : 'Fit answers are mixed.'
    out.push({ id: 'fit', question: 'Does it run small or large?', answer: `${lead} Of ${total} owners who answered: ${tts} true to size, ${small} runs small, ${large} runs large.`, enough: true })
  }

  const wash = fromMentions(['quality.wash_durability'], i.mentions, 'say it holds up in the wash', 'report shrinking, fading or other wash problems')
  out.push({ id: 'wash', question: 'Does it shrink or fade?', answer: wash.text, enough: wash.enough })

  const fabric = fromMentions(['quality.fabric'], i.mentions, 'praise the fabric', 'say the fabric is thin or poor')
  const gsm = i.fabricWeightGsm
  const typical = i.category === 'BOTTOMS' ? '300–380' : '140–180'
  out.push({
    id: 'fabric',
    question: 'Is the fabric thin?',
    answer: `${gsm ? `Fabric weight is ${gsm} gsm (typical for this item: ${typical} gsm). ` : ''}${fabric.text}`,
    enough: fabric.enough || !!gsm,
  })

  const comfort = fromMentions(['comfort.softness', 'comfort.skin_friendly'], i.mentions, 'say it feels soft or gentle', 'say it is stiff, scratchy or itchy')
  out.push({ id: 'comfort', question: 'Is it comfortable?', answer: comfort.text, enough: comfort.enough })

  const lasts = fromMentions(['quality.longevity', 'quality.wear_resistance'], i.mentions, 'say it lasts or resists pilling', 'report pilling, snags or wearing out')
  out.push({ id: 'lasts', question: 'Will it last?', answer: lasts.text, enough: lasts.enough })

  // Price
  if (i.price.days < 28) out.push({ id: 'price', question: 'Is now a good time to buy?', answer: 'Not enough price history yet (we need 4 weeks).', enough: false })
  else if (i.price.fakeDiscount) out.push({ id: 'price', question: 'Is now a good time to buy?', answer: `Careful: the “was” price shown on the sale was never actually charged in the last ${i.price.days} days.`, enough: true })
  else if (i.price.oftenCheaper)
    out.push({ id: 'price', question: 'Is now a good time to buy?', answer: `It was $${i.price.oftenCheaper.lowest.toFixed(2)} in the last ${i.price.days} days, and is $${i.price.oftenCheaper.nowLowest.toFixed(2)} now. It goes on sale; consider waiting.`, enough: true })
  else out.push({ id: 'price', question: 'Is now a good time to buy?', answer: `Yes: the price has been steady for ${i.price.days} days with no fake markdowns.`, enough: true })

  // Returns
  const bench = RETURN_BENCHMARK[i.category === 'BOTTOMS' ? 'BOTTOMS' : 'TOPS']
  if (!i.returns.units || i.returns.units < 50) out.push({ id: 'returns', question: 'How often is it sent back?', answer: 'Not enough sales data yet to give a return rate.', enough: false })
  else {
    const f = i.returns.fit / i.returns.units
    const q = i.returns.quality / i.returns.units
    out.push({
      id: 'returns',
      question: 'How often is it sent back?',
      answer: `${pct(f)} of orders are sent back for fit (typical for this item: ${pct(bench.fit)}) and ${pct(q)} for quality or defects (typical: ${pct(bench.quality)}).`,
      enough: true,
    })
  }
  return out
}

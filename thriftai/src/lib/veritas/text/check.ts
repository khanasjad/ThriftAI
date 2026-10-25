/**
 * Code checks every shopper-facing sentence must pass before the verifier agent sees it.
 * Pure functions, unit-tested.
 */
import type { WriterItem } from './items'

export type Field = 'summary' | 'size_advice' | 'downside'
export type DraftSentence = { field: Field; text: string; evidence_ids: string[] }
export type CheckedSentence = DraftSentence & { ok: boolean; reason?: string }

// Product plan: nothing about health, safety or legal claims; no hype.
export const BANNED = [
  { re: /\b(cure|heal|medical|therapeutic|allerg\w*|hypoallergenic|non-?toxic|toxic|safe for|eczema|skin condition)\b/i, why: 'health or safety claim' },
  { re: /\b(lawsuit|legal|illegal|certified safe|guarantee\w*|warrant(y|ied))\b/i, why: 'legal or guarantee claim' },
  { re: /\b(best ever|perfect|flawless|must-have|life-?changing|amazing|incredible|unbeatable|game-?changer)\b/i, why: 'hype' },
]
const MAX_WORDS = 40

/** Numbers in a sentence must appear in the cited items (stops invented stats). */
function numbersSupported(text: string, cited: WriterItem[]) {
  const nums = text.match(/\d+(?:[.,]\d+)?/g) ?? []
  const pool = cited.map((c) => c.text).join(' ')
  return nums.filter((n) => !pool.includes(n))
}

export function checkSentence(s: DraftSentence, items: WriterItem[]): CheckedSentence {
  const byId = new Map(items.map((i) => [i.id, i]))
  const fail = (reason: string): CheckedSentence => ({ ...s, ok: false, reason })
  if (!s.text.trim()) return fail('empty')
  if (s.text.trim().split(/\s+/).length > MAX_WORDS) return fail(`longer than ${MAX_WORDS} words`)
  if (s.evidence_ids.length === 0) return fail('cites no evidence')
  const unknown = s.evidence_ids.filter((id) => !byId.has(id))
  if (unknown.length) return fail(`unknown evidence ids: ${unknown.join(', ')}`)
  for (const b of BANNED) if (b.re.test(s.text)) return fail(b.why)
  const cited = s.evidence_ids.map((id) => byId.get(id)!)
  const missing = numbersSupported(s.text, cited)
  if (missing.length) return fail(`numbers not in the cited evidence: ${missing.join(', ')}`)
  if (s.field === 'size_advice' && !cited.some((c) => c.factor.startsWith('fit.'))) return fail('size advice must cite fit evidence')
  return { ...s, ok: true }
}

/** Joins the sentences that survived checks + verification into the three shopper-facing fields. */
export function compose(sentences: DraftSentence[]) {
  const join = (f: Field) => {
    const t = sentences
      .filter((s) => s.field === f)
      .map((s) => s.text.trim().replace(/\s+/g, ' '))
      .map((t) => (/[.!?]$/.test(t) ? t : `${t}.`))
      .join(' ')
    return t || null
  }
  return { summary: join('summary'), sizeAdvice: join('size_advice'), downside: join('downside') }
}

/**
 * The shopkeeper's conversational reply: short, no product names, no hype, health or legal claims.
 * Returns the reply, or null when it must be replaced by a templated one.
 */
export function checkReply(reply: string, productNames: string[]): string | null {
  const r = reply.trim().replace(/\s+/g, ' ')
  if (!r || r.length > 320) return null
  if (BANNED.some((b) => b.re.test(r))) return null
  const lower = r.toLowerCase()
  if (productNames.some((n) => n.length > 6 && lower.includes(n.toLowerCase()))) return null
  return r
}

/**
 * Ad copy agent (B11): one headline and one short body for a product ad, written only from the numbered
 * evidence. Code checks length, banned words and numbers; the Verifier checks every claim before it's stored.
 */
import { z } from 'zod/v4'
import { models } from '../env'
import { defineAgent } from '../harness/agent'
import { UNTRUSTED_RULE } from '../harness/guardrails'
import { BODY_MAX, HEADLINE_MAX } from '../ads/rules'
import type { WriterItem } from '../text/items'

export const AD_COPY_SYSTEM_PROMPT = `You write product ads for Veritas, a clothing score that shoppers trust because every claim is backed by evidence. You get one product and numbered evidence items (owners' quotes, counts of what owners report, and facts computed from the data).

Write:
- headline: at most ${HEADLINE_MAX} characters. The product's strongest proven benefit, for example "True to size for most owners" or "Holds its shape wash after wash".
- body: at most ${BODY_MAX} characters, one or two short sentences with the most useful proof for a shopper, for example "9 of 11 owners say it fits true to size, and owners report it holds up after washing."

Rules:
- Each part lists the ids of the evidence items that support it in evidence_ids. Cite only items that say what you wrote.
- Use only facts in the cited items. If you use a number, copy it exactly from a cited item. Quantities ("most", "many") need a count item (ids starting with c).
- Benefits shoppers care about: fit, durability, comfort, honest photos, fair price. Choose what the evidence supports best.
- No hype ("best", "perfect", "amazing", "must-have"), no exclamation marks, no urgency ("buy now", "limited"), no discounts or prices, no comparisons with other brands or products, no Veritas score number.
- Nothing about health, allergies, skin conditions, safety or legal matters, and no guarantees.
- If the evidence has no clear, positive, supported benefit, set has_copy = false.

${UNTRUSTED_RULE}
When done, call finish. Always end by calling finish.`

const part = z.object({ text: z.string(), evidence_ids: z.array(z.string()) })

export function makeAdCopyAgent() {
  return defineAgent({
    name: 'ad-copy',
    model: () => models.agent,
    effort: 'low',
    system: AD_COPY_SYSTEM_PROMPT,
    tools: [],
    finish: { description: 'Submit the ad. Call this once, last.', schema: z.object({ has_copy: z.boolean(), headline: part, body: part }) },
    limits: { maxIterations: 2, maxCostUsd: 0.01, timeoutMs: 30_000, maxToolErrors: 1 },
    maxTokens: 600,
  })
}

export function adCopyTask(productName: string, brand: string, items: WriterItem[]) {
  return `Product: ${productName} by ${brand}

Evidence:
${items.map((i) => `[${i.id}] ${i.text}`).join('\n')}

Write the headline and body, then call finish.`
}

export const AD_COPY_VERSION = 'ad-copy@1'

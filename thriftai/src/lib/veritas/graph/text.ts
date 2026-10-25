/**
 * Writer → code checks → verifier. Returns only sentences that survive all three.
 * Product plan: every sentence shown to a shopper is verified against stored evidence.
 */
import { makeVerifierAgent, verifierTask } from '../agents/verifier'
import { makeWriterAgent, writerTask } from '../agents/writer'
import type { LlmClient } from '../harness/llm'
import { runAgent } from '../harness/loop'
import type { TraceSink } from '../harness/telemetry'
import type { ProductBundle } from '../evidence/types'
import type { ProductScoreResult } from '../scoring/v2'
import { checkSentence, compose, type DraftSentence } from '../text/check'
import { buildWriterItems } from '../text/items'
import { createHash } from 'node:crypto'
import { VERIFIER_VERSION } from '../agents/verifier'
import { WRITER_VERSION } from '../agents/writer'
import type { StoredEvidence } from './data'

export type TextResult = {
  text: { summary: string | null; sizeAdvice: string | null; downside: string | null } | null
  verified: boolean
  writerRunId?: string
  verifierRunId?: string
  costUsd: number
  kept: number
  dropped: { text: string; reason: string }[]
  /** The spend cap stopped the writer or verifier: the caller must not save. */
  budgetHit?: boolean
}

/** Hash of everything the writer sees (numbered items) plus prompt versions: same hash → same text can be reused. */
export function writerInputsHash(bundle: ProductBundle, evidence: StoredEvidence[]) {
  const items = buildWriterItems(bundle, evidence)
  return createHash('sha256').update(JSON.stringify({ v: [WRITER_VERSION, VERIFIER_VERSION], items })).digest('hex')
}

export async function writeAndVerify(
  bundle: ProductBundle,
  result: ProductScoreResult,
  evidence: StoredEvidence[],
  opts: { llm?: LlmClient; sink: TraceSink; parentRunId: string; inputsHash: string },
): Promise<TextResult> {
  const items = buildWriterItems(bundle, evidence)
  const empty: TextResult = { text: null, verified: false, costUsd: 0, kept: 0, dropped: [] }
  if (!items.some((i) => i.kind === 'quote')) return empty // nothing owners said to summarise

  const common = { llm: opts.llm, sink: opts.sink, graph: 'rate-product', productId: bundle.product.id, parentRunId: opts.parentRunId, inputsHash: opts.inputsHash }
  const w = await runAgent(makeWriterAgent(), writerTask(bundle.product.name, result, items), common)
  let cost = w.totals.costUsd
  if (w.status !== 'OK' || !w.finish) return { ...empty, writerRunId: w.runId, costUsd: cost, budgetHit: w.status === 'BUDGET' }

  const checked = w.finish.sentences.map((s) => checkSentence(s as DraftSentence, items))
  const dropped = checked.filter((c) => !c.ok).map((c) => ({ text: c.text, reason: `code: ${c.reason}` }))
  const passed = checked.filter((c) => c.ok)
  if (passed.length === 0) return { ...empty, writerRunId: w.runId, costUsd: cost, dropped }

  const v = await runAgent(makeVerifierAgent(), verifierTask(passed, items), common)
  cost += v.totals.costUsd
  if (v.status !== 'OK' || !v.finish) {
    // No verification, no text: unverified sentences are never shown.
    return { ...empty, budgetHit: v.status === 'BUDGET', writerRunId: w.runId, verifierRunId: v.runId, costUsd: cost, dropped: [...dropped, ...passed.map((p) => ({ text: p.text, reason: `verifier did not finish (${v.status})` }))] }
  }

  const decisions = new Map(v.finish.results.map((r) => [r.sentence_id, r]))
  const kept: DraftSentence[] = []
  passed.forEach((s, i) => {
    const d = decisions.get(`S${i + 1}`)
    if (d?.supported) kept.push(s)
    else dropped.push({ text: s.text, reason: d ? `verifier: ${d.reason}` : 'verifier: no decision' })
  })

  return { text: compose(kept), verified: true, writerRunId: w.runId, verifierRunId: v.runId, costUsd: cost, kept: kept.length, dropped }
}

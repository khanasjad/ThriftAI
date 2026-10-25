/**
 * Free-text product Q&A (B9): question → injection scan (code) → product-qa agent → sentence checks (code)
 * → Verifier agent. Only sentences that pass everything are returned, each with the evidence it cites.
 */
import { makeProductQaAgent, MAX_QA_SENTENCES, productQaTask } from '../agents/product-qa'
import { makeVerifierAgent, verifierTask } from '../agents/verifier'
import type { ProductBundle } from '../evidence/types'
import { scanInjection } from '../harness/guardrails'
import type { LlmClient } from '../harness/llm'
import { runAgent } from '../harness/loop'
import type { TraceSink } from '../harness/telemetry'
import { checkSentence, type DraftSentence } from '../text/check'
import { buildWriterItems, type WriterItem } from '../text/items'
import type { StoredEvidence } from './data'

export type AskStatus = 'answered' | 'not_enough_evidence' | 'off_topic' | 'refused' | 'error'
export type AskResult = {
  status: AskStatus
  sentences: { text: string; evidence: { id: string; text: string }[] }[]
  costUsd: number
  runIds: string[]
}

export async function answerQuestion(
  bundle: ProductBundle,
  evidence: StoredEvidence[],
  question: string,
  opts: { llm?: LlmClient; sink?: TraceSink },
): Promise<AskResult> {
  const none = (status: AskStatus, costUsd = 0, runIds: string[] = []): AskResult => ({ status, sentences: [], costUsd, runIds })
  // Code first: obvious manipulation never reaches a model.
  if (scanInjection(question).flagged) return none('refused')

  const items: WriterItem[] = buildWriterItems(bundle, evidence)
  if (items.length === 0) return none('not_enough_evidence')

  const common = { llm: opts.llm, sink: opts.sink, graph: 'ask-product', productId: bundle.product.id }
  const a = await runAgent(makeProductQaAgent(), productQaTask(bundle.product.name, question, items), common)
  let cost = a.totals.costUsd
  const runIds = [a.runId]
  if (a.status !== 'OK' || !a.finish) return none('error', cost, runIds)
  if (a.finish.off_topic) return none('off_topic', cost, runIds)
  if (!a.finish.answerable || a.finish.sentences.length === 0) return none('not_enough_evidence', cost, runIds)

  const drafts: DraftSentence[] = a.finish.sentences.slice(0, MAX_QA_SENTENCES).map((s) => ({ field: 'summary', text: s.text, evidence_ids: s.evidence_ids }))
  const passed = drafts.map((d) => checkSentence(d, items)).filter((c) => c.ok)
  if (passed.length === 0) return none('not_enough_evidence', cost, runIds)

  const v = await runAgent(makeVerifierAgent(), verifierTask(passed, items), common)
  cost += v.totals.costUsd
  runIds.push(v.runId)
  // No verification, no answer.
  if (v.status !== 'OK' || !v.finish) return none('error', cost, runIds)
  const decisions = new Map(v.finish.results.map((r) => [r.sentence_id, r.supported]))
  const byId = new Map(items.map((i) => [i.id, i]))
  const kept = passed.filter((_, i) => decisions.get(`S${i + 1}`) === true)
  if (kept.length === 0) return none('not_enough_evidence', cost, runIds)

  return {
    status: 'answered',
    sentences: kept.map((s) => ({
      text: /[.!?]$/.test(s.text.trim()) ? s.text.trim() : `${s.text.trim()}.`,
      evidence: s.evidence_ids.map((id) => ({ id, text: byId.get(id)!.text })),
    })),
    costUsd: cost,
    runIds,
  }
}

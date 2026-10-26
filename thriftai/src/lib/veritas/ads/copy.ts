/**
 * Ad copy pipeline (B11): agent → code checks → Verifier → stored. Reused while the writer inputs are unchanged,
 * so a daily feed refresh costs nothing. No verified copy → no copy (the feed falls back to code-built highlights).
 */
import { createHash } from 'node:crypto'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { AD_COPY_VERSION, adCopyTask, makeAdCopyAgent } from '../agents/ad-copy'
import { VERIFIER_VERSION, makeVerifierAgent, verifierTask } from '../agents/verifier'
import { latestAgentEvidence, loadBundle } from '../graph/data'
import type { LlmClient } from '../harness/llm'
import { runAgent } from '../harness/loop'
import type { TraceSink } from '../harness/telemetry'
import { BANNED, checkSentence, type DraftSentence } from '../text/check'
import { buildWriterItems, type WriterItem } from '../text/items'
import { BODY_MAX, HEADLINE_MAX } from './rules'

export type AdCopyResult = {
  status: 'created' | 'unchanged' | 'no_copy' | 'not_verified' | 'error' | 'not_found'
  headline?: string
  body?: string
  costUsd: number
  reason?: string
}

const URGENCY = /\b(buy now|limited|hurry|last chance|today only|act fast|don.?t miss)\b|!/i

/** Code checks for one ad line on top of the shared sentence checks. */
export function checkAdLine(text: string, max: number, ids: string[], items: WriterItem[]): string | null {
  const t = text.trim()
  if (!t) return 'empty'
  if (t.length > max) return `longer than ${max} characters`
  if (URGENCY.test(t)) return 'urgency or exclamation'
  if (/\$\s?\d|\d+\s?%\s?off|discount|sale/i.test(t)) return 'price or discount claim'
  for (const b of BANNED) if (b.re.test(t)) return b.why
  const c = checkSentence({ field: 'summary', text: t, evidence_ids: ids }, items)
  return c.ok ? null : c.reason ?? 'failed checks'
}

export async function generateAdCopy(slugOrId: string, opts: { llm?: LlmClient; sink?: TraceSink; force?: boolean } = {}): Promise<AdCopyResult> {
  const bundle = await loadBundle(slugOrId)
  if (!bundle) return { status: 'not_found', costUsd: 0 }
  const latest = await latestAgentEvidence(bundle.product.id)
  const items = buildWriterItems(bundle, latest?.evidence ?? [])
  if (!items.some((i) => i.kind === 'quote' || i.id.startsWith('c'))) return { status: 'no_copy', costUsd: 0, reason: 'no owner evidence yet' }

  const inputsHash = createHash('sha256').update(JSON.stringify({ v: [AD_COPY_VERSION, VERIFIER_VERSION], items })).digest('hex')
  const existing = await prisma.adCopy.findUnique({ where: { productId: bundle.product.id } })
  if (existing && existing.inputsHash === inputsHash && !opts.force) return { status: 'unchanged', headline: existing.headline, body: existing.body, costUsd: 0 }

  const common = { llm: opts.llm, sink: opts.sink, graph: 'ad-copy', productId: bundle.product.id }
  const brand = bundle.brand.name
  const a = await runAgent(makeAdCopyAgent(), adCopyTask(bundle.product.name, brand, items), common)
  let cost = a.totals.costUsd
  if (a.status !== 'OK' || !a.finish) return { status: 'error', costUsd: cost, reason: a.status }
  if (!a.finish.has_copy) return { status: 'no_copy', costUsd: cost, reason: 'no clear supported benefit' }

  const { headline, body } = a.finish
  const bad = checkAdLine(headline.text, HEADLINE_MAX, headline.evidence_ids, items) ?? checkAdLine(body.text, BODY_MAX, body.evidence_ids, items)
  if (bad) return { status: 'not_verified', costUsd: cost, reason: `code: ${bad}` }

  const drafts: DraftSentence[] = [
    { field: 'summary', text: headline.text.trim(), evidence_ids: headline.evidence_ids },
    { field: 'summary', text: body.text.trim(), evidence_ids: body.evidence_ids },
  ]
  const v = await runAgent(makeVerifierAgent(), verifierTask(drafts, items), common)
  cost += v.totals.costUsd
  if (v.status !== 'OK' || !v.finish) return { status: 'error', costUsd: cost, reason: `verifier ${v.status}` }
  const ok = (id: string) => v.finish!.results.find((r) => r.sentence_id === id)?.supported === true
  if (!ok('S1') || !ok('S2')) return { status: 'not_verified', costUsd: cost, reason: `verifier: ${v.finish.results.filter((r) => !r.supported).map((r) => r.reason).join('; ')}` }

  const byId = new Map(items.map((i) => [i.id, i.text]))
  const sources = [...new Set([...headline.evidence_ids, ...body.evidence_ids])].map((id) => ({ id, text: byId.get(id) }))
  await prisma.adCopy.upsert({
    where: { productId: bundle.product.id },
    update: { headline: headline.text.trim(), body: body.text.trim(), sources, inputsHash, costUsd: new Prisma.Decimal(cost), runIds: [a.runId, v.runId] },
    create: { productId: bundle.product.id, headline: headline.text.trim(), body: body.text.trim(), sources, inputsHash, costUsd: new Prisma.Decimal(cost), runIds: [a.runId, v.runId] },
  })
  return { status: 'created', headline: headline.text.trim(), body: body.text.trim(), costUsd: cost }
}

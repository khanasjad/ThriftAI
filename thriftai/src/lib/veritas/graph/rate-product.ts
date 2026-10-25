/**
 * rate-product graph (backend plan §4.3):
 *
 *   load bundle + peer stats → hash inputs → unchanged? skip
 *     → structured evidence (code)
 *     → roll-up evidence (code): brand reputation, value for money
 *     → evidence agent (LLM) if mode = full and the product has reviews
 *       (mode = structured reuses the last agent evidence, so no model calls)
 *     → scoring v2 (code) → new-launch early score (code) if the product is a new launch
 *     → writer → code checks → verifier (LLM, mode = full, only when the score is publishable)
 *     → save evidence, findings, factor scores, product score, trend tag
 *
 * One failed product never throws: the result says what happened.
 */
import { createHash } from 'node:crypto'
import type { AgentRunStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { env } from '../env'
import { EVIDENCE_AGENT_VERSION, evidenceTask, makeEvidenceAgent, type EvidenceRunOutput } from '../agents/evidence'
import { VERIFIER_VERSION } from '../agents/verifier'
import { WRITER_VERSION } from '../agents/writer'
import { GUARDRAILS_VERSION, INJECTION_CONFIDENCE_FACTOR, scanInjection } from '../harness/guardrails'
import type { LlmClient } from '../harness/llm'
import { runAgent } from '../harness/loop'
import { MemorySink, defaultSink, type TraceSink } from '../harness/telemetry'
import { earlyScore, rollupEvidence, type PeerStat } from '../evidence/rollups'
import { extractStructuredEvidence, trendTagFor } from '../evidence/structured'
import { signalSentiment, type ProductBundle } from '../evidence/types'
import { SCORE_VERSION, computeBaselines, scoreProduct, type ProductScoreResult } from '../scoring/v2'
import * as data from './data'
import { writeAndVerify, type TextResult } from './text'

export type RateMode = 'full' | 'structured'

export type RateOptions = {
  mode?: RateMode
  force?: boolean
  dryRun?: boolean
  llm?: LlmClient
  sink?: TraceSink
  /** Peer stats for roll-ups. Pass once per batch pass; loaded when omitted. */
  peers?: PeerStat[]
}

export type RateResult = {
  slug: string
  status: 'SKIPPED' | 'RATED' | 'NOT_ENOUGH_EVIDENCE' | 'NOT_FOUND' | 'ERROR'
  graphRunId?: string
  agent?: { runId: string; status: AgentRunStatus; costUsd: number; accepted: number; rejected: number }
  text?: Pick<TextResult, 'verified' | 'kept' | 'costUsd'> & { dropped: number }
  score?: Pick<ProductScoreResult, 'overall' | 'label' | 'coverage' | 'evidenceCount'> & { factors: number; early: number | null }
  costUsd: number
  error?: string
}

export const GRAPH_VERSIONS = {
  score: SCORE_VERSION,
  evidenceAgent: EVIDENCE_AGENT_VERSION,
  writer: WRITER_VERSION,
  verifier: VERIFIER_VERSION,
  structured: 'structured@1',
  rollups: 'rollups@2', // @2: size-consistency rule removed after the B6 eval
  guardrails: GUARDRAILS_VERSION,
}

const SPEC_FACTORS = ['fit.size_range', 'quality.fabric', 'comfort.stretch_mobility', 'comfort.easy_care']

const withPenalty = (flagged: boolean, confidence: number) => (flagged ? confidence * INJECTION_CONFIDENCE_FACTOR : confidence)

/** Code-derived evidence, with the same injection penalty as agent evidence when it comes from a flagged review. */
export function structuredEvidence(bundle: ProductBundle): data.StoredEvidence[] {
  const flagged = new Set(bundle.reviews.filter((r) => scanInjection(`${r.title ?? ''}\n${r.content}`).flagged).map((r) => r.id))
  return extractStructuredEvidence(bundle).map((d) => {
    const isFlagged = !!d.reviewId && flagged.has(d.reviewId)
    return { ...d, injectionFlag: isFlagged, effectiveConfidence: withPenalty(isFlagged, d.confidence) }
  })
}

function targetStat(bundle: ProductBundle, peers: PeerStat[]): PeerStat {
  return (
    peers.find((p) => p.productId === bundle.product.id) ?? {
      productId: bundle.product.id,
      brandId: bundle.brand.id,
      category: bundle.product.category,
      subcategory: bundle.product.subcategory,
      price: bundle.prices.at(-1)?.points.at(-1)?.price ?? 0,
      fit: null,
      quality: null,
      overall: null,
      fitAnswers: { small: 0, tts: 0, large: 0 },
    }
  )
}

/** The peer data a product's roll-ups and early score depend on, so a change re-rates the product. */
function peerDigest(target: PeerStat, peers: PeerStat[]) {
  const relevant = peers
    .filter((p) => p.brandId === target.brandId || (p.category === target.category && (p.subcategory ?? '') === (target.subcategory ?? '')))
    .map((p) => [p.productId, p.overall, p.fit, p.quality, p.price, p.fitAnswers.small, p.fitAnswers.tts, p.fitAnswers.large])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
  return createHash('sha256').update(JSON.stringify(relevant)).digest('hex').slice(0, 16)
}

export async function rateProduct(slugOrId: string, opts: RateOptions = {}): Promise<RateResult> {
  // A dry run writes nothing (in-memory trace) and never makes live model calls unless a client is passed in.
  const mode: RateMode = opts.dryRun && !opts.llm ? 'structured' : (opts.mode ?? 'full')
  const sink = opts.sink ?? (opts.dryRun ? new MemorySink() : defaultSink())
  const bundle = await data.loadBundle(slugOrId)
  if (!bundle) return { slug: slugOrId, status: 'NOT_FOUND', costUsd: 0 }
  const slug = bundle.product.slug
  const peers = opts.peers ?? (await data.loadPeerStats())
  const target = targetStat(bundle, peers)
  const inputsHash = data.hashInputs(bundle, { ...GRAPH_VERSIONS, mode, peers: peerDigest(target, peers) })

  if (!opts.force && !opts.dryRun) {
    if (await data.alreadyRated(bundle.product.id, inputsHash, SCORE_VERSION)) return { slug, status: 'SKIPPED', costUsd: 0 }
  }

  const graphRunId = await sink.startRun({ agent: 'rate-product', graph: 'rate-product', model: 'code', env: env().APP_ENV, productId: bundle.product.id, inputsHash })
  let step = 0
  const trace = (name: string, output: unknown, kind: 'TOOL' | 'GUARDRAIL' = 'TOOL') => sink.step(graphRunId, { idx: step++, kind, name, output })
  let cost = 0

  try {
    // 1. Structured + roll-up evidence (code).
    const structured = structuredEvidence(bundle)
    const rollups: data.StoredEvidence[] = rollupEvidence(target, peers).map((d) => ({ ...d, injectionFlag: false, effectiveConfidence: d.confidence }))
    await trace('structured_evidence', countBy(structured.map((e) => e.factor)))
    await trace('rollup_evidence', rollups.map((e) => `${e.factor}: ${e.signal}`))

    // 2. Evidence agent (LLM), or reuse its last output.
    let agentEvidence: data.StoredEvidence[] = []
    let agent: RateResult['agent']
    let reusedAgentRunId: string | undefined
    if (mode === 'full' && bundle.reviews.length > 0) {
      const out: EvidenceRunOutput = { accepted: [], rejectedCount: 0 }
      const r = await runAgent(makeEvidenceAgent(bundle, out), evidenceTask(bundle), {
        llm: opts.llm,
        sink,
        graph: 'rate-product',
        productId: bundle.product.id,
        parentRunId: graphRunId,
        inputsHash,
      })
      // Partial results are kept even when the run stopped early (plan §4.2); confidence reflects coverage.
      agentEvidence = out.accepted
      cost += r.totals.costUsd
      agent = { runId: r.runId, status: r.status, costUsd: r.totals.costUsd, accepted: out.accepted.length, rejected: out.rejectedCount }
      if (!opts.dryRun) await data.saveEvidence(bundle.product.id, r.runId, agentEvidence)
    } else if (mode === 'structured') {
      const prev = await data.latestAgentEvidence(bundle.product.id)
      agentEvidence = prev?.evidence ?? []
      reusedAgentRunId = prev?.runId
    }
    await trace('agent_evidence', { mode, source: mode === 'full' ? 'this run' : 'latest stored agent run', items: agentEvidence.length, agent })

    // 3. Scoring (code), then the early score for new launches.
    const all = [...structured, ...rollups, ...agentEvidence]
    const scoringInput = {
      evidence: all.map((e) => ({ factor: e.factor, sentiment: signalSentiment(e.factor, e.signal) ?? 0, confidence: e.effectiveConfidence })),
      baselines: await data.loadBaselines(bundle.product.category, bundle.product.subcategory),
      reviewCount: bundle.reviews.length,
      launchDate: bundle.product.launchDate,
      hasTextEvidence: agentEvidence.length > 0,
    }
    let result = scoreProduct(scoringInput)
    let early: ReturnType<typeof earlyScore> = null
    if (result.label === 'NEW_LAUNCH') {
      const specValues = result.factors.filter((f) => SPEC_FACTORS.includes(f.factor)).map((f) => f.value)
      early = earlyScore(target, peers, specValues)
      if (early) result = scoreProduct({ ...scoringInput, earlyScore: early.score })
    }
    const trendTag = trendTagFor(bundle.trendPhase)
    await trace('score', {
      overall: result.overall,
      label: result.label,
      coverage: result.coverage,
      publishable: result.publishable,
      early,
      pillars: Object.fromEntries(Object.entries(result.pillars).map(([k, v]) => [k, v.value])),
      factors: result.factors.map((f) => ({ factor: f.factor, raw: f.raw, value: f.value, n: f.effectiveN })),
      trendTag,
    })

    // 4. Shopper text: writer → code checks → verifier. Only for publishable scores in full mode.
    let text: TextResult | undefined
    if (mode === 'full' && result.publishable) {
      text = await writeAndVerify(bundle, result, all, { llm: opts.llm, sink, parentRunId: graphRunId, inputsHash })
      cost += text.costUsd
      await trace('text', { verified: text.verified, kept: text.kept, writerRunId: text.writerRunId, verifierRunId: text.verifierRunId })
      for (const d of text.dropped) await trace('verifier.drop', d, 'GUARDRAIL')
    }

    // 5. Save.
    if (!opts.dryRun) {
      await data.saveEvidence(bundle.product.id, graphRunId, [...structured, ...rollups])
      await data.saveFindings([
        ...rollups.map((e) => ({
          productId: bundle.product.id,
          brandId: bundle.brand.id,
          runId: graphRunId,
          agent: 'rollups',
          kind: e.origin.replace('code:', ''),
          factor: e.factor,
          signal: e.signal,
          payload: { confidence: e.confidence },
        })),
        ...(early ? [{ productId: bundle.product.id, brandId: bundle.brand.id, runId: graphRunId, agent: 'rollups', kind: 'early_score', summary: early.basis, payload: early }] : []),
      ])
      await data.saveRating({
        productId: bundle.product.id,
        result,
        reviewCount: bundle.reviews.length,
        inputsHash,
        ratedByRunId: graphRunId,
        trendTag,
        earlyScore: early?.score ?? null,
        text: text ? { ...(text.text ?? { summary: null, sizeAdvice: null, downside: null }), verified: text.verified && text.text !== null } : undefined,
      })
    }

    const status: RateResult['status'] = result.publishable ? 'RATED' : 'NOT_ENOUGH_EVIDENCE'
    await sink.endRun(graphRunId, {
      status: 'OK',
      iterations: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      costUsd: 0, // model cost is recorded on the child runs
      finishPayload: {
        mode,
        dryRun: !!opts.dryRun,
        status,
        overall: result.overall,
        label: result.label,
        coverage: result.coverage,
        early: early?.score ?? null,
        agent,
        text: text && { verified: text.verified, kept: text.kept, dropped: text.dropped.length },
        // The runs whose evidence produced this score; the product page shows only these.
        evidenceRunIds: [graphRunId, agent?.runId ?? reusedAgentRunId].filter(Boolean),
      },
    })
    return {
      slug,
      status,
      graphRunId,
      agent,
      text: text && { verified: text.verified, kept: text.kept, costUsd: text.costUsd, dropped: text.dropped.length },
      score: { overall: result.overall, label: result.label, coverage: result.coverage, evidenceCount: result.evidenceCount, factors: result.factors.length, early: early?.score ?? null },
      costUsd: cost,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await sink
      .endRun(graphRunId, { status: 'ERROR', iterations: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, costUsd: 0, error: message })
      .catch(() => {})
    return { slug, status: 'ERROR', graphRunId, error: message, costUsd: cost }
  }
}

function countBy(xs: string[]) {
  return xs.reduce<Record<string, number>>((acc, x) => ((acc[x] = (acc[x] ?? 0) + 1), acc), {})
}

/**
 * Recompute category baselines (shrinkage targets) from stored raw factor values.
 * Run after a batch, then re-score with mode = structured + force (reuses agent evidence, no model calls).
 */
export async function refreshBaselines() {
  const rows = await prisma.factorScore.findMany({
    where: { version: 'v2', rawValue: { not: null } },
    select: { factor: true, rawValue: true, productId: true, product: { select: { category: true, subcategory: true } } },
  })
  const groups = new Map<string, { category: string; subcategory: string; byProduct: Map<string, { factor: string; raw: number }[]> }>()
  for (const r of rows) {
    const key = `${r.product.category}|${r.product.subcategory ?? ''}`
    const g = groups.get(key) ?? { category: r.product.category, subcategory: r.product.subcategory ?? '', byProduct: new Map() }
    g.byProduct.set(r.productId, [...(g.byProduct.get(r.productId) ?? []), { factor: r.factor, raw: Number(r.rawValue) }])
    groups.set(key, g)
  }
  const out: { category: string; subcategory: string; factor: string; mean: number; k: number }[] = []
  for (const g of groups.values()) {
    for (const [factor, b] of Object.entries(computeBaselines([...g.byProduct.values()]))) out.push({ category: g.category, subcategory: g.subcategory, factor, mean: b.mean, k: b.k })
  }
  await data.storeBaselines(out)
  return out
}

/**
 * Eval runner (B6). Deterministic checks always ($0); the LLM judge only when asked (live, paid).
 * Writes EvalCase / EvalRun / EvalResult rows and a Markdown report under .veritas/evals/ (gitignored).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { env, models } from '../env'
import { JUDGE_VERSION, judgeAgreement, judgeTask, makeJudgeAgent, type JudgeFinish } from '../agents/judge'
import { scanInjection } from '../harness/guardrails'
import type { LlmClient } from '../harness/llm'
import { runAgent } from '../harness/loop'
import { latestAgentEvidence, loadBundle } from '../graph/data'
import { buildWriterItems } from '../text/items'
import { checkLabel, summarise, type CheckResult, type ProductState } from './checks'
import { pickGolden, type Truth } from './golden'

type CaseOutcome = {
  slug: string
  name: string
  why: string
  checks: CheckResult[]
  judge?: { rubric: JudgeFinish['rubric']; agreement: ReturnType<typeof judgeAgreement>; notes: string; costUsd: number; runId: string } | { error: string }
}

async function productState(productId: string): Promise<ProductState> {
  const [factors, reviews, rating] = await Promise.all([
    prisma.factorScore.findMany({ where: { productId, version: 'v2' }, select: { factor: true, rawValue: true } }),
    prisma.clothingReview.findMany({ where: { productId }, select: { id: true, title: true, content: true, fitsAs: true } }),
    prisma.agentRun.findFirst({ where: { productId, agent: 'rate-product', status: 'OK' }, orderBy: { startedAt: 'desc' }, select: { finishPayload: true } }),
  ])
  const injected = new Set(reviews.filter((r) => scanInjection(`${r.title ?? ''}\n${r.content}`).flagged).map((r) => r.id))
  const runIds = ((rating?.finishPayload as { evidenceRunIds?: string[] } | null)?.evidenceRunIds ?? []).filter(Boolean)
  const injEv = injected.size
    ? await prisma.evidenceTag.findMany({ where: { productId, runId: { in: runIds }, reviewId: { in: [...injected] } }, select: { injectionFlag: true } })
    : []
  return {
    // Raw (pre-shrinkage) values: the eval asks which way the evidence points; shrinkage would pull thin evidence to 'neutral'.
    factors: Object.fromEntries(factors.filter((f) => f.rawValue !== null).map((f) => [f.factor, Number(f.rawValue)])),
    fitAnswers: {
      small: reviews.filter((r) => r.fitsAs === 'runs_small').length,
      tts: reviews.filter((r) => r.fitsAs === 'true_to_size').length,
      large: reviews.filter((r) => r.fitsAs === 'runs_large').length,
    },
    injectionEvidence: injected.size ? { total: injEv.length, flagged: injEv.filter((e) => e.injectionFlag).length } : null,
    hasInjectionReview: injected.size > 0,
  }
}

/** Health of the agents from their traces: how runs end, cost, cache use, grounded-quote acceptance. */
async function opsMetrics() {
  const runs = await prisma.agentRun.findMany({
    where: { env: env().APP_ENV },
    select: { agent: true, status: true, costUsd: true, inputTokens: true, cacheReadTokens: true, cacheWriteTokens: true, startedAt: true, endedAt: true, finishPayload: true },
  })
  const byAgent = new Map<string, { runs: number; ok: number; cost: number; ms: number[]; prompt: number; cached: number; statuses: Record<string, number> }>()
  let accepted = 0
  let rejected = 0
  for (const r of runs) {
    const a = byAgent.get(r.agent) ?? { runs: 0, ok: 0, cost: 0, ms: [], prompt: 0, cached: 0, statuses: {} }
    a.runs++
    if (r.status === 'OK') a.ok++
    a.cost += Number(r.costUsd)
    if (r.endedAt) a.ms.push(r.endedAt.getTime() - r.startedAt.getTime())
    a.prompt += r.inputTokens + r.cacheReadTokens + r.cacheWriteTokens
    a.cached += r.cacheReadTokens
    a.statuses[r.status] = (a.statuses[r.status] ?? 0) + 1
    byAgent.set(r.agent, a)
    const ag = (r.finishPayload as { agent?: { accepted?: number; rejected?: number } } | null)?.agent
    if (r.agent === 'rate-product' && ag) {
      accepted += ag.accepted ?? 0
      rejected += ag.rejected ?? 0
    }
  }
  const ratedProducts = await prisma.agentRun.groupBy({ by: ['productId'], where: { agent: 'evidence', env: env().APP_ENV, productId: { not: null } } })
  const evidenceCost = byAgent.get('evidence')?.cost ?? 0
  return {
    agents: [...byAgent.entries()].map(([agent, a]) => ({
      agent,
      runs: a.runs,
      finishRate: a.runs ? a.ok / a.runs : 0,
      statuses: a.statuses,
      costUsd: Math.round(a.cost * 1e6) / 1e6,
      medianMs: a.ms.length ? a.ms.sort((x, y) => x - y)[Math.floor(a.ms.length / 2)] : null,
      cacheShare: a.prompt ? a.cached / a.prompt : null,
    })),
    quoteAcceptance: accepted + rejected ? accepted / (accepted + rejected) : null,
    quotes: { accepted, rejected },
    evidenceCostPerProduct: ratedProducts.length ? evidenceCost / ratedProducts.length : null,
  }
}

async function feedbackSummary() {
  const rows = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' }, take: 200, select: { targetType: true, rating: true, reason: true, createdAt: true } })
  return {
    total: rows.length,
    up: rows.filter((r) => r.rating > 0).length,
    down: rows.filter((r) => r.rating < 0).length,
    // Reasons are untrusted shopper text: reported as data, truncated.
    recentReasons: rows.filter((r) => r.reason).slice(0, 5).map((r) => r.reason!.slice(0, 140)),
  }
}

export async function runEval(opts: { judge?: boolean; llm?: LlmClient } = {}) {
  const fixture = JSON.parse(readFileSync(join(process.cwd(), 'prisma/fixtures/dev-dataset.json'), 'utf8')) as { products: { slug: string; _truth: Truth }[] }
  const golden = pickGolden(fixture.products.map((p) => ({ slug: p.slug, truth: p._truth })))
  const products = await prisma.clothingProduct.findMany({ where: { slug: { in: golden.map((g) => g.slug) } }, select: { id: true, slug: true, name: true, productScore: true } })
  const bySlug = new Map(products.map((p) => [p.slug, p]))

  const run = await prisma.evalRun.create({ data: { model: models.agent, judgeModel: opts.judge ? models.judge : 'none' } })
  const outcomes: CaseOutcome[] = []
  let judgeCost = 0

  for (const g of golden) {
    const p = bySlug.get(g.slug)
    if (!p) continue
    const evalCase = await prisma.evalCase.upsert({
      where: { name: `evidence:${g.slug}` },
      create: { name: `evidence:${g.slug}`, kind: 'evidence', productId: p.id, expected: { labels: g.labels, why: g.why, source: 'generator-truth' } as Prisma.InputJsonValue },
      update: { productId: p.id, expected: { labels: g.labels, why: g.why, source: 'generator-truth' } as Prisma.InputJsonValue },
    })
    const state = await productState(p.id)
    const checks = g.labels.map((l) => checkLabel(l, state))
    const outcome: CaseOutcome = { slug: g.slug, name: p.name, why: g.why, checks }

    if (opts.judge) {
      const bundle = await loadBundle(g.slug)
      const agentEv = (await latestAgentEvidence(p.id))?.evidence ?? []
      const items = bundle ? buildWriterItems(bundle, agentEv) : []
      const text = p.productScore?.verified ? { summary: p.productScore.summary, sizeAdvice: p.productScore.sizeAdvice, downside: p.productScore.downside } : null
      const r = await runAgent(makeJudgeAgent(), judgeTask(p.name, items, text), { llm: opts.llm, graph: 'eval', productId: p.id })
      judgeCost += r.totals.costUsd
      outcome.judge =
        r.status === 'OK' && r.finish
          ? { rubric: r.finish.rubric, agreement: judgeAgreement(r.finish, g.labels), notes: r.finish.notes, costUsd: r.totals.costUsd, runId: r.runId }
          : { error: `${r.status}${r.error ? `: ${r.error}` : ''}` }
    }

    const s = summarise(checks)
    await prisma.evalResult.create({
      data: {
        evalRunId: run.id,
        evalCaseId: evalCase.id,
        scores: { checks, summary: s, judge: outcome.judge ?? null } as unknown as Prisma.InputJsonValue,
        passed: s.fail === 0 && s.pass > 0,
        runId: outcome.judge && 'runId' in outcome.judge ? outcome.judge.runId : null,
      },
    })
    outcomes.push(outcome)
  }

  const allChecks = outcomes.flatMap((o) => o.checks)
  const byKey = Object.fromEntries(
    [...new Set(allChecks.map((c) => c.key))].map((k) => [k, summarise(allChecks.filter((c) => c.key === k))]),
  )
  const judgeAgree = outcomes.flatMap((o) => (o.judge && 'agreement' in o.judge ? o.judge.agreement : [])).filter((a) => a.agree !== null)
  const rubrics = outcomes.flatMap((o) => (o.judge && 'rubric' in o.judge ? [o.judge.rubric] : []))
  const avg = (k: keyof JudgeFinish['rubric']) => {
    const v = rubrics.map((r) => r[k]).filter((x): x is number => typeof x === 'number')
    return v.length ? Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10) / 10 : null
  }
  const summary = {
    cases: outcomes.length,
    checks: summarise(allChecks),
    byKey,
    judge: opts.judge
      ? {
          version: JUDGE_VERSION,
          agreement: judgeAgree.length ? judgeAgree.filter((a) => a.agree).length / judgeAgree.length : null,
          comparisons: judgeAgree.length,
          rubric: { faithful: avg('faithful'), size_advice: avg('size_advice'), downside: avg('downside'), no_hype: avg('no_hype') },
          costUsd: Math.round(judgeCost * 1e6) / 1e6,
        }
      : null,
    ops: await opsMetrics(),
    feedback: await feedbackSummary(),
  }
  await prisma.evalRun.update({ where: { id: run.id }, data: { summary: summary as unknown as Prisma.InputJsonValue, costUsd: judgeCost, endedAt: new Date() } })
  const reportPath = writeReport(run.id, summary, outcomes)
  return { runId: run.id, summary, outcomes, reportPath }
}

const pct = (x: number | null) => (x === null ? '—' : `${Math.round(x * 100)}%`)

function writeReport(runId: string, s: Awaited<ReturnType<typeof runEval>>['summary'], outcomes: CaseOutcome[]) {
  const dir = join(process.cwd(), '.veritas', 'evals')
  mkdirSync(dir, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  const lines = [
    `# Veritas eval report · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
    '',
    `Run \`${runId}\` · ${s.cases} golden products · labels from the dataset generator's ground truth (not hand-written).`,
    '',
    '## Deterministic checks',
    '',
    `Agreement ${pct(s.checks.agreement)} on ${s.checks.pass + s.checks.fail} judged labels · coverage ${pct(s.checks.coverage)} (${s.checks.noEvidence} labels have no evidence yet).`,
    '',
    '| Label | Pass | Fail | No evidence | Agreement |',
    '|---|---|---|---|---|',
    ...Object.entries(s.byKey).map(([k, v]) => `| ${k} | ${v.pass} | ${v.fail} | ${v.noEvidence} | ${pct(v.agreement)} |`),
    '',
    '## Judge',
    '',
    s.judge
      ? `Agreement with labels ${pct(s.judge.agreement)} over ${s.judge.comparisons} comparisons (gate ≥ 80%). Rubric averages: faithful ${s.judge.rubric.faithful ?? '—'}, size advice ${s.judge.rubric.size_advice ?? '—'}, downside ${s.judge.rubric.downside ?? '—'}, no hype ${s.judge.rubric.no_hype ?? '—'}. Cost $${s.judge.costUsd}.`
      : 'Not run (use `npm run eval -- --judge --yes`; live Opus calls).',
    '',
    '## Agents',
    '',
    '| Agent | Runs | Finish rate | Statuses | Cost | Median time | Cache share |',
    '|---|---|---|---|---|---|---|',
    ...s.ops.agents.map((a) => `| ${a.agent} | ${a.runs} | ${pct(a.finishRate)} | ${Object.entries(a.statuses).map(([k, v]) => `${k} ${v}`).join(', ')} | $${a.costUsd} | ${a.medianMs ?? '—'} ms | ${pct(a.cacheShare)} |`),
    '',
    `Grounded quote acceptance: ${pct(s.ops.quoteAcceptance)} (${s.ops.quotes.accepted} accepted, ${s.ops.quotes.rejected} rejected by the grounding check). Evidence cost per product: ${s.ops.evidenceCostPerProduct === null ? '—' : `$${s.ops.evidenceCostPerProduct.toFixed(4)}`}.`,
    '',
    '## Shopper feedback',
    '',
    `${s.feedback.total} votes (${s.feedback.up} up, ${s.feedback.down} down).`,
    ...s.feedback.recentReasons.map((r) => `- “${r}”`),
    '',
    '## Cases',
    '',
    ...outcomes.flatMap((o) => [
      `### ${o.name} (\`${o.slug}\`) · ${o.why}`,
      '',
      ...o.checks.map((c) => `- ${c.status === 'pass' ? '✅' : c.status === 'fail' ? '❌' : '·'} ${c.key}: expected ${c.expect}, got ${c.got}`),
      ...(o.judge ? ['error' in o.judge ? `- judge error: ${o.judge.error}` : `- judge: ${o.judge.notes}`] : []),
      '',
    ]),
  ]
  const path = join(dir, `report-${stamp}.md`)
  writeFileSync(path, lines.join('\n'))
  return path
}

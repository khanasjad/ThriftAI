import 'server-only'
import type { AgentRunStatus } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'

/** Read-only queries for the admin trace viewer (frontend plan §5.6). */

export async function listRuns({ status, agent, limit = 100 }: { status?: AgentRunStatus; agent?: string; limit?: number } = {}) {
  const rows = await prisma.agentRun.findMany({
    where: { ...(status && { status }), ...(agent && { agent }) },
    orderBy: { startedAt: 'desc' },
    take: limit,
    include: { product: { select: { name: true, slug: true } }, _count: { select: { steps: true } } },
  })
  return rows.map((r) => ({
    id: r.id,
    graph: r.graph,
    agent: r.agent,
    model: r.model,
    status: r.status,
    env: r.env,
    product: r.product,
    iterations: r.iterations,
    steps: r._count.steps,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    cacheReadTokens: r.cacheReadTokens,
    costUsd: Number(r.costUsd),
    error: r.error,
    startedAt: r.startedAt.toISOString(),
    durationMs: r.endedAt ? r.endedAt.getTime() - r.startedAt.getTime() : null,
  }))
}

export async function getRun(id: string) {
  const r = await prisma.agentRun.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { idx: 'asc' } },
      product: { select: { name: true, slug: true } },
      parent: { select: { id: true, agent: true } },
      children: { select: { id: true, agent: true, status: true } },
      _count: { select: { evidence: true, findings: true } },
    },
  })
  if (!r) return null
  return {
    id: r.id,
    graph: r.graph,
    agent: r.agent,
    model: r.model,
    status: r.status,
    env: r.env,
    product: r.product,
    parent: r.parent,
    children: r.children,
    inputsHash: r.inputsHash,
    iterations: r.iterations,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    cacheReadTokens: r.cacheReadTokens,
    cacheWriteTokens: r.cacheWriteTokens,
    costUsd: Number(r.costUsd),
    finishPayload: r.finishPayload,
    error: r.error,
    startedAt: r.startedAt.toISOString(),
    durationMs: r.endedAt ? r.endedAt.getTime() - r.startedAt.getTime() : null,
    evidenceCount: r._count.evidence,
    findingCount: r._count.findings,
    steps: r.steps.map((s) => ({
      idx: s.idx,
      kind: s.kind,
      name: s.name,
      isError: s.isError,
      stopReason: s.stopReason,
      durationMs: s.durationMs,
      inputTokens: s.inputTokens,
      outputTokens: s.outputTokens,
      cacheReadTokens: s.cacheReadTokens,
      costUsd: s.costUsd == null ? null : Number(s.costUsd),
      input: s.input,
      output: s.output,
    })),
  }
}

export async function spendSummary(env: string) {
  const runs = await prisma.agentRun.findMany({
    where: { env },
    select: { agent: true, model: true, status: true, costUsd: true, inputTokens: true, outputTokens: true, cacheReadTokens: true, startedAt: true },
    orderBy: { startedAt: 'asc' },
  })
  const total = runs.reduce((s, r) => s + Number(r.costUsd), 0)
  const byAgent = new Map<string, { agent: string; model: string; runs: number; costUsd: number; inputTokens: number; outputTokens: number; cacheReadTokens: number }>()
  const byDay = new Map<string, number>()
  const byStatus = new Map<string, number>()
  for (const r of runs) {
    const key = `${r.agent}·${r.model}`
    const a = byAgent.get(key) ?? { agent: r.agent, model: r.model, runs: 0, costUsd: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 }
    a.runs++
    a.costUsd += Number(r.costUsd)
    a.inputTokens += r.inputTokens
    a.outputTokens += r.outputTokens
    a.cacheReadTokens += r.cacheReadTokens
    byAgent.set(key, a)
    const day = r.startedAt.toISOString().slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + Number(r.costUsd))
    byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1)
  }
  return {
    total,
    runs: runs.length,
    byAgent: [...byAgent.values()].sort((a, b) => b.costUsd - a.costUsd),
    byDay: [...byDay.entries()].map(([day, costUsd]) => ({ day, costUsd })),
    byStatus: [...byStatus.entries()].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
  }
}

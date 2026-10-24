import { Prisma, type AgentRunStatus, type StepKind } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Every LLM and tool call is written here (AgentRun / AgentStep). The loop talks to a TraceSink,
 * so tests can use the in-memory sink and never touch the DB.
 * OpenTelemetry / Langfuse export is added in B6 behind the same interface.
 */

export type RunStart = {
  agent: string
  model: string
  env: string
  graph?: string
  productId?: string
  parentRunId?: string
  inputsHash?: string
}

export type StepRecord = {
  idx: number
  kind: StepKind
  name: string
  input?: unknown
  output?: unknown
  isError?: boolean
  stopReason?: string | null
  inputTokens?: number
  outputTokens?: number
  cacheReadTokens?: number
  costUsd?: number
  durationMs?: number
}

export type RunTotals = {
  iterations: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  costUsd: number
}

export type RunEnd = RunTotals & { status: AgentRunStatus; finishPayload?: unknown; error?: string }

export interface TraceSink {
  startRun(run: RunStart): Promise<string>
  step(runId: string, step: StepRecord): Promise<void>
  endRun(runId: string, end: RunEnd): Promise<void>
  /** Total recorded spend for this environment (global cap). */
  spentUsd(env: string): Promise<number>
}

const json = (v: unknown) => (v === undefined ? undefined : (JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue))

export const prismaSink: TraceSink = {
  async startRun(r) {
    const run = await prisma.agentRun.create({ data: { ...r } })
    return run.id
  },
  async step(runId, s) {
    await prisma.agentStep.create({
      data: {
        runId,
        idx: s.idx,
        kind: s.kind,
        name: s.name,
        input: json(s.input),
        output: json(s.output),
        isError: s.isError ?? false,
        stopReason: s.stopReason ?? null,
        inputTokens: s.inputTokens,
        outputTokens: s.outputTokens,
        cacheReadTokens: s.cacheReadTokens,
        costUsd: s.costUsd,
        durationMs: s.durationMs,
      },
    })
  },
  async endRun(runId, e) {
    await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: e.status,
        iterations: e.iterations,
        inputTokens: e.inputTokens,
        outputTokens: e.outputTokens,
        cacheReadTokens: e.cacheReadTokens,
        cacheWriteTokens: e.cacheWriteTokens,
        costUsd: e.costUsd,
        finishPayload: json(e.finishPayload),
        error: e.error?.slice(0, 2000),
        endedAt: new Date(),
      },
    })
  },
  async spentUsd(env) {
    const agg = await prisma.agentRun.aggregate({ where: { env }, _sum: { costUsd: true } })
    return Number(agg._sum.costUsd ?? 0)
  },
}

/** In-memory sink for tests and dry runs. */
export class MemorySink implements TraceSink {
  runs = new Map<string, RunStart & Partial<RunEnd> & { steps: StepRecord[] }>()
  constructor(public alreadySpentUsd = 0) {}
  async startRun(r: RunStart) {
    const id = `run_${this.runs.size + 1}`
    this.runs.set(id, { ...r, steps: [] })
    return id
  }
  async step(runId: string, s: StepRecord) {
    this.runs.get(runId)!.steps.push(s)
  }
  async endRun(runId: string, e: RunEnd) {
    Object.assign(this.runs.get(runId)!, e)
  }
  async spentUsd() {
    let total = this.alreadySpentUsd
    for (const r of this.runs.values()) total += r.costUsd ?? 0
    return total
  }
}

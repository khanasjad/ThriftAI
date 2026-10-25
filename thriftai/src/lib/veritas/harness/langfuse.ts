/**
 * Optional Langfuse export (backend plan §4.5). Wraps a TraceSink: everything still goes to AgentRun / AgentStep,
 * and each finished run is also sent to Langfuse's public ingestion API (POST /api/public/ingestion).
 *
 *  - A root run becomes a Langfuse trace; a child run (parentRunId) becomes a span in its parent's trace.
 *  - LLM steps become generations (model, tokens, cost); tool and guardrail steps become spans.
 *  - Export is best-effort: failures are logged and never affect the run.
 * Status: built to the public ingestion API shape; not yet exercised against a live Langfuse project.
 */
import { randomUUID } from 'node:crypto'
import type { RunEnd, RunStart, StepRecord, TraceSink } from './telemetry'

export type LangfuseConfig = { host: string; publicKey: string; secretKey: string; fetch?: typeof fetch; timeoutMs?: number }

type Pending = { start: RunStart & { startedAt: string }; steps: (StepRecord & { at: number })[] }

export function langfuseEvents(runId: string, p: Pending, end: RunEnd) {
  const now = new Date().toISOString()
  const traceId = p.start.parentRunId ?? runId
  const ev = (type: string, body: Record<string, unknown>) => ({ id: randomUUID(), timestamp: now, type, body })
  const level = end.status === 'OK' ? 'DEFAULT' : 'ERROR'
  const events: ReturnType<typeof ev>[] = []
  const meta = { agent: p.start.agent, graph: p.start.graph, model: p.start.model, env: p.start.env, productId: p.start.productId, status: end.status, costUsd: end.costUsd }

  if (!p.start.parentRunId) {
    events.push(ev('trace-create', { id: runId, name: p.start.graph ?? p.start.agent, timestamp: p.start.startedAt, metadata: meta, output: end.finishPayload ?? null, tags: [p.start.agent, p.start.env] }))
  } else {
    events.push(
      ev('span-create', { id: runId, traceId, name: p.start.agent, startTime: p.start.startedAt, endTime: now, metadata: meta, output: end.finishPayload ?? null, level, statusMessage: end.error }),
    )
  }
  const parentObservationId = p.start.parentRunId ? runId : undefined
  for (const s of p.steps) {
    const endTime = new Date(s.at).toISOString()
    const startTime = new Date(s.at - (s.durationMs ?? 0)).toISOString()
    const common = { id: `${runId}:${s.idx}`, traceId, parentObservationId, name: s.name, startTime, endTime, level: s.isError ? 'ERROR' : 'DEFAULT' }
    if (s.kind === 'LLM') {
      events.push(
        ev('generation-create', {
          ...common,
          model: s.name,
          usage: { input: s.inputTokens ?? 0, output: s.outputTokens ?? 0, unit: 'TOKENS' },
          costDetails: s.costUsd !== undefined ? { total: s.costUsd } : undefined,
          metadata: { stopReason: s.stopReason, cacheReadTokens: s.cacheReadTokens },
          input: s.input ?? null,
          output: s.output ?? null,
        }),
      )
    } else {
      events.push(ev('span-create', { ...common, metadata: { kind: s.kind }, input: s.input ?? null, output: s.output ?? null }))
    }
  }
  return events
}

export function withLangfuse(inner: TraceSink, cfg: LangfuseConfig): TraceSink {
  const pending = new Map<string, Pending>()
  const doFetch = cfg.fetch ?? fetch
  const auth = `Basic ${Buffer.from(`${cfg.publicKey}:${cfg.secretKey}`).toString('base64')}`

  async function send(batch: unknown[]) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), cfg.timeoutMs ?? 3000)
    try {
      const res = await doFetch(`${cfg.host.replace(/\/$/, '')}/api/public/ingestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ batch }),
        signal: ctrl.signal,
      })
      if (!res.ok && res.status !== 207) console.warn(`langfuse export failed: HTTP ${res.status}`)
    } catch (err) {
      console.warn('langfuse export failed:', err instanceof Error ? err.message : err)
    } finally {
      clearTimeout(t)
    }
  }

  return {
    async startRun(r) {
      const id = await inner.startRun(r)
      pending.set(id, { start: { ...r, startedAt: new Date().toISOString() }, steps: [] })
      return id
    },
    async step(runId, s) {
      await inner.step(runId, s)
      pending.get(runId)?.steps.push({ ...s, at: Date.now() })
    },
    async endRun(runId, e) {
      await inner.endRun(runId, e)
      const p = pending.get(runId)
      pending.delete(runId)
      if (p) await send(langfuseEvents(runId, p, e))
    },
    spentUsd: (env) => inner.spentUsd(env),
  }
}

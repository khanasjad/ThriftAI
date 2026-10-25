import Anthropic from '@anthropic-ai/sdk'
import type { AgentRunStatus } from '@prisma/client'
import type { z } from 'zod/v4'
import { env } from '../env'
import { FINISH_TOOL, type AgentDef } from './agent'
import { SpendCapError, costOf } from './budget'
import { buildRequest, getLlm, type LlmClient } from './llm'
import { defaultSink, type RunTotals, type TraceSink } from './telemetry'
import { ToolError, describeIssues, serialiseOutput, type ToolContext } from './tools'

/**
 * runAgent(): the shared tool loop (backend plan §4.2). A small manual loop rather than the SDK
 * Tool Runner, because we need a budget check before every call, a trace row for every step,
 * mock/replay modes, and our own handling of refusal / max_tokens / missing finish.
 */

export type RunOptions = {
  llm?: LlmClient
  sink?: TraceSink
  graph?: string
  productId?: string
  parentRunId?: string
  inputsHash?: string
  /** Overrides for this run only (e.g. tests). */
  envName?: string
  spendCapUsd?: number
}

export type RunResult<F> = {
  runId: string
  status: AgentRunStatus
  finish?: F
  error?: string
  totals: RunTotals
}

const NUDGE =
  'You stopped without calling the finish tool. Call finish now with your result. Do not call any other tool unless something essential is missing.'
const MAX_TOKENS_CEILING = 32_000

type Stop = { status: AgentRunStatus; error?: string }

export async function runAgent<F extends z.ZodObject>(
  agent: AgentDef<F>,
  input: string,
  opts: RunOptions = {},
): Promise<RunResult<z.infer<F>>> {
  const llm = opts.llm ?? getLlm()
  const sink = opts.sink ?? defaultSink()
  const envName = opts.envName ?? env().APP_ENV
  const cap = opts.spendCapUsd ?? env().SPEND_CAP_USD
  const model = agent.model()
  const { limits } = agent

  const runId = await sink.startRun({
    agent: agent.name,
    model,
    env: envName,
    graph: opts.graph,
    productId: opts.productId,
    parentRunId: opts.parentRunId,
    inputsHash: opts.inputsHash,
  })

  const totals: RunTotals = { iterations: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, costUsd: 0 }
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: input }]
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), limits.timeoutMs)
  const ctx: ToolContext = { runId, agent: agent.name, productId: opts.productId, signal: controller.signal }

  let stepIdx = 0
  let toolErrors = 0
  let nudged = false
  let truncRetried = false
  let maxTokens = agent.maxTokens
  let lastCallCost = 0
  let finish: z.infer<F> | undefined
  let stop: Stop | undefined

  const guard = (name: string, output: unknown) => sink.step(runId, { idx: stepIdx++, kind: 'GUARDRAIL', name, output })

  try {
    while (!stop) {
      if (totals.iterations >= limits.maxIterations) {
        stop = { status: 'MAX_ITERATIONS' }
        break
      }

      // Budget: per run (estimate next call by the last one) and global cap for this env.
      if (totals.costUsd + lastCallCost > limits.maxCostUsd) {
        await guard('budget.run', { spentUsd: totals.costUsd, maxCostUsd: limits.maxCostUsd })
        stop = { status: 'BUDGET', error: `Run budget $${limits.maxCostUsd} reached` }
        break
      }
      if (llm.mode === 'live') {
        const spent = (await sink.spentUsd(envName)) + totals.costUsd
        if (spent + lastCallCost >= cap) {
          const err = new SpendCapError(spent, cap)
          await guard('budget.global', { spentUsd: spent, capUsd: cap })
          stop = { status: 'BUDGET', error: err.message }
          break
        }
      }

      const req = buildRequest(agent, messages, maxTokens)
      const t0 = Date.now()
      let res: Anthropic.Message
      try {
        res = await llm.create(req, { signal: controller.signal })
      } catch (err) {
        if (controller.signal.aborted || err instanceof Anthropic.APIUserAbortError) {
          stop = { status: 'TIMEOUT', error: `Timed out after ${limits.timeoutMs} ms` }
        } else {
          stop = { status: 'ERROR', error: err instanceof Error ? `${err.name}: ${err.message}` : String(err) }
        }
        await sink.step(runId, { idx: stepIdx++, kind: 'LLM', name: model, isError: true, output: { error: stop.error }, durationMs: Date.now() - t0 })
        break
      }

      totals.iterations++
      const u = res.usage
      const callCost = llm.mode === 'live' ? costOf(model, u) : 0
      lastCallCost = callCost
      totals.inputTokens += u.input_tokens
      totals.outputTokens += u.output_tokens
      totals.cacheReadTokens += u.cache_read_input_tokens ?? 0
      totals.cacheWriteTokens += u.cache_creation_input_tokens ?? 0
      totals.costUsd += callCost

      await sink.step(runId, {
        idx: stepIdx++,
        kind: 'LLM',
        name: model,
        input: { iteration: totals.iterations, messages: messages.length, maxTokens, cacheWriteTokens: u.cache_creation_input_tokens ?? 0 },
        output: { content: res.content, stopDetails: res.stop_details ?? null },
        stopReason: res.stop_reason,
        inputTokens: u.input_tokens,
        outputTokens: u.output_tokens,
        cacheReadTokens: u.cache_read_input_tokens ?? 0,
        costUsd: callCost,
        durationMs: Date.now() - t0,
      })

      switch (res.stop_reason) {
        case 'refusal': {
          // Haiku 5.5 has no server-side fallback. Never run tools from a refused turn.
          const d = res.stop_details
          stop = { status: 'REFUSAL', error: d ? `${d.category ?? 'unknown'}: ${d.explanation ?? ''}`.trim() : 'refusal' }
          break
        }
        case 'max_tokens':
        case 'model_context_window_exceeded': {
          // A truncated tool input can parse as valid JSON, so never run it. Retry once, larger.
          if (res.stop_reason === 'max_tokens' && !truncRetried && maxTokens < MAX_TOKENS_CEILING) {
            truncRetried = true
            maxTokens = Math.min(maxTokens * 2, MAX_TOKENS_CEILING)
            await guard('retry.max_tokens', { newMaxTokens: maxTokens })
            break
          }
          stop = { status: 'TRUNCATED', error: `${res.stop_reason}${truncRetried ? ' (after one retry)' : ''}` }
          break
        }
        case 'pause_turn': {
          messages.push({ role: 'assistant', content: res.content })
          break
        }
        case 'end_turn':
        case 'stop_sequence': {
          messages.push({ role: 'assistant', content: res.content })
          if (nudged) {
            stop = { status: 'NO_FINISH', error: 'Ended without calling finish' }
            break
          }
          nudged = true
          await guard('nudge.finish', { reason: 'end_turn without finish' })
          messages.push({ role: 'user', content: NUDGE })
          break
        }
        case 'tool_use': {
          messages.push({ role: 'assistant', content: res.content })
          const uses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
          const results: Anthropic.ToolResultBlockParam[] = []
          let finishOk: z.infer<F> | undefined

          // Run real tools first (in parallel); finish is checked after, so evidence recorded
          // in the same turn is never lost.
          const toolUses = uses.filter((b) => b.name !== FINISH_TOOL)
          const outcomes = await Promise.all(toolUses.map((b) => runTool(agent, b, ctx)))
          for (const [i, b] of toolUses.entries()) {
            const o = outcomes[i]
            if (o.isError) toolErrors++
            results.push({ type: 'tool_result', tool_use_id: b.id, content: o.content, is_error: o.isError || undefined })
            await sink.step(runId, { idx: stepIdx++, kind: 'TOOL', name: b.name, input: b.input, output: o.detail ? { sent: o.content, detail: o.detail } : o.content, isError: o.isError, durationMs: o.ms })
          }

          for (const b of uses.filter((x) => x.name === FINISH_TOOL)) {
            const parsed = agent.finish.schema.safeParse(b.input)
            if (parsed.success && !finishOk) {
              finishOk = parsed.data
              results.push({ type: 'tool_result', tool_use_id: b.id, content: 'Recorded.' })
              await sink.step(runId, { idx: stepIdx++, kind: 'TOOL', name: FINISH_TOOL, input: b.input, output: 'ok' })
            } else {
              const msg = parsed.success ? 'finish was already called' : `Invalid finish input: ${describeIssues(parsed.error)}. Fix it and call finish again.`
              if (!parsed.success) toolErrors++
              results.push({ type: 'tool_result', tool_use_id: b.id, content: msg, is_error: true })
              await sink.step(runId, { idx: stepIdx++, kind: 'TOOL', name: FINISH_TOOL, input: b.input, output: msg, isError: true })
            }
          }

          if (finishOk) {
            finish = finishOk
            stop = { status: 'OK' }
            break
          }
          if (toolErrors > limits.maxToolErrors) {
            stop = { status: 'TOOL_ERRORS', error: `${toolErrors} tool errors (max ${limits.maxToolErrors})` }
            break
          }
          // Every tool_result for this turn goes in ONE user message.
          messages.push({ role: 'user', content: results })
          break
        }
        default: {
          stop = { status: 'ERROR', error: `Unexpected stop_reason: ${String(res.stop_reason)}` }
        }
      }
    }
  } finally {
    clearTimeout(timer)
  }

  const final = stop ?? { status: 'ERROR' as const, error: 'Loop ended without a stop reason' }
  await sink.endRun(runId, { ...totals, status: final.status, finishPayload: finish, error: final.error })
  return { runId, status: final.status, finish, error: final.error, totals }
}

async function runTool(agent: AgentDef, block: Anthropic.ToolUseBlock, ctx: ToolContext) {
  const t0 = Date.now()
  const tool = agent.tools.find((t) => t.name === block.name)
  const done = (content: string, isError: boolean, detail?: string) => ({ content, isError, detail, ms: Date.now() - t0 })
  if (!tool) return done(`Unknown tool "${block.name}". Available: ${agent.tools.map((t) => t.name).join(', ')}, ${FINISH_TOOL}.`, true)
  const parsed = tool.schema.safeParse(block.input)
  if (!parsed.success) return done(`Invalid input: ${describeIssues(parsed.error)}`, true)
  try {
    return done(serialiseOutput(await tool.handler(parsed.data, ctx)), false)
  } catch (err) {
    // ToolError messages are written for the model; anything else is an internal failure.
    if (err instanceof ToolError) return done(err.message, true)
    return done('Internal tool error. Try a different approach or call finish.', true, err instanceof Error ? err.stack ?? err.message : String(err))
  }
}

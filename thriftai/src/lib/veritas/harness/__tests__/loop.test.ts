/** @jest-environment node */
import type Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod/v4'
import { defineAgent } from '../agent'
import { MockClient, mockMessage, mockText, mockToolUse, type LlmClient, type MockResponder } from '../llm'
import { runAgent } from '../loop'
import { MemorySink } from '../telemetry'
import { ToolError, defineTool } from '../tools'

const lookups: string[] = []

const lookup = defineTool({
  name: 'lookup',
  description: 'Look up a product by id.',
  schema: z.object({ id: z.string().min(1) }),
  handler: async ({ id }) => {
    lookups.push(id)
    if (id === 'boom') throw new Error('db exploded: secret detail')
    if (id === 'missing') throw new ToolError('No product with that id.')
    return { id, name: `Product ${id}` }
  },
})

const agent = defineAgent({
  name: 'test',
  model: () => 'claude-haiku-5-5',
  system: 'You are a test agent.',
  tools: [lookup],
  finish: { description: 'Return the result.', schema: z.object({ summary: z.string().min(1) }) },
  limits: { maxIterations: 4, maxCostUsd: 0.01, timeoutMs: 2000, maxToolErrors: 2 },
})

const finish = (summary: unknown) => mockToolUse('finish', { summary })

function run(responder: MockResponder, opts: { sink?: MemorySink; llm?: LlmClient } = {}) {
  const llm = opts.llm ?? new MockClient(responder)
  const sink = opts.sink ?? new MemorySink()
  return runAgent(agent, 'Rate product p1', { llm, sink, envName: 'test', spendCapUsd: 15 }).then((r) => ({ r, llm, sink }))
}

/** A fake "live" client so cost and the global cap are exercised. */
function fakeLive(responder: MockResponder): LlmClient {
  let n = 0
  return { mode: 'live', create: async (req) => responder(req, n++) }
}

beforeEach(() => {
  lookups.length = 0
})

describe('runAgent stop reasons', () => {
  it('OK: runs a tool, then accepts a valid finish', async () => {
    const { r, llm, sink } = await run((_req, i) =>
      i === 0 ? mockMessage([mockToolUse('lookup', { id: 'p1' })], 'tool_use') : mockMessage([finish('Looks fine')], 'tool_use'),
    )
    expect(r.status).toBe('OK')
    expect(r.finish).toEqual({ summary: 'Looks fine' })
    expect(lookups).toEqual(['p1'])
    const calls = (llm as MockClient).calls
    // Second call sees the tool result in a single user message.
    const last = calls[1].messages.at(-1)!
    expect(last.role).toBe('user')
    expect((last.content as Anthropic.ToolResultBlockParam[])[0].type).toBe('tool_result')
    const steps = [...sink.runs.values()][0].steps
    expect(steps.map((s) => `${s.kind}:${s.name}`)).toEqual(['LLM:claude-haiku-5-5', 'TOOL:lookup', 'LLM:claude-haiku-5-5', 'TOOL:finish'])
    expect([...sink.runs.values()][0].status).toBe('OK')
  })

  it('OK: parallel tools and finish in the same turn; all tool results land in one message', async () => {
    const { r } = await run(() => mockMessage([mockToolUse('lookup', { id: 'a' }), mockToolUse('lookup', { id: 'b' }), finish('done')], 'tool_use'))
    expect(r.status).toBe('OK')
    expect(lookups.sort()).toEqual(['a', 'b'])
  })

  it('invalid finish input is returned as an error so the agent can fix it', async () => {
    const { r, llm } = await run((_req, i) => mockMessage([finish(i === 0 ? '' : 'fixed')], 'tool_use'))
    expect(r.status).toBe('OK')
    expect(r.finish).toEqual({ summary: 'fixed' })
    const res = (llm as MockClient).calls[1].messages.at(-1)!.content as Anthropic.ToolResultBlockParam[]
    expect(res[0].is_error).toBe(true)
    expect(String(res[0].content)).toMatch(/Invalid finish input/)
  })

  it('REFUSAL: stops and never runs tools from the refused turn', async () => {
    const { r } = await run(() => {
      const m = mockMessage([mockToolUse('lookup', { id: 'p1' })], 'refusal')
      return { ...m, stop_details: { type: 'refusal', category: 'cyber', explanation: 'test' } } as unknown as Anthropic.Message
    })
    expect(r.status).toBe('REFUSAL')
    expect(r.error).toMatch(/cyber/)
    expect(lookups).toEqual([])
  })

  it('max_tokens: retries once with a larger budget', async () => {
    const { r, llm } = await run((_req, i) => (i === 0 ? mockMessage([mockToolUse('lookup', { id: 'cut' })], 'max_tokens') : mockMessage([finish('ok')], 'tool_use')))
    expect(r.status).toBe('OK')
    expect(lookups).toEqual([]) // truncated tool input was not run
    const calls = (llm as MockClient).calls
    expect(calls[1].max_tokens).toBe(calls[0].max_tokens * 2)
  })

  it('TRUNCATED: max_tokens twice', async () => {
    const { r } = await run(() => mockMessage([mockText('...')], 'max_tokens'))
    expect(r.status).toBe('TRUNCATED')
    expect(r.totals.iterations).toBe(2)
  })

  it('end_turn without finish: nudges once, then succeeds', async () => {
    const { r, llm } = await run((_req, i) => (i === 0 ? mockMessage([mockText('All done!')], 'end_turn') : mockMessage([finish('ok')], 'tool_use')))
    expect(r.status).toBe('OK')
    const nudge = (llm as MockClient).calls[1].messages.at(-1)!
    expect(String(nudge.content)).toMatch(/finish/)
  })

  it('NO_FINISH: end_turn twice', async () => {
    const { r } = await run(() => mockMessage([mockText('I am done')], 'end_turn'))
    expect(r.status).toBe('NO_FINISH')
    expect(r.totals.iterations).toBe(2)
  })

  it('MAX_ITERATIONS: keeps calling tools', async () => {
    const { r } = await run((_req, i) => mockMessage([mockToolUse('lookup', { id: `p${i}` })], 'tool_use'))
    expect(r.status).toBe('MAX_ITERATIONS')
    expect(r.totals.iterations).toBe(4)
  })

  it('TOOL_ERRORS: too many bad tool inputs', async () => {
    const { r } = await run(() => mockMessage([mockToolUse('lookup', { id: '' })], 'tool_use'))
    expect(r.status).toBe('TOOL_ERRORS')
    expect(r.totals.iterations).toBe(3) // 3 errors > maxToolErrors (2)
  })

  it('unknown tools and handler errors become is_error results; internal details stay in the trace', async () => {
    const { r, llm, sink } = await run((_req, i) =>
      i === 0
        ? mockMessage([mockToolUse('nope', {}), mockToolUse('lookup', { id: 'boom' }), mockToolUse('lookup', { id: 'missing' })], 'tool_use')
        : mockMessage([finish('ok')], 'tool_use'),
    )
    expect(r.status).toBe('TOOL_ERRORS') // 3 errors in one turn > 2
    void llm
    const steps = [...sink.runs.values()][0].steps.filter((s) => s.kind === 'TOOL')
    expect(steps.every((s) => s.isError)).toBe(true)
    const boom = steps.find((s) => JSON.stringify(s.input).includes('boom'))!
    expect(JSON.stringify(boom.output)).toMatch(/db exploded/) // trace keeps the detail
  })

  it('handler errors sent to the model hide internals', async () => {
    const { llm } = await run((_req, i) => (i === 0 ? mockMessage([mockToolUse('lookup', { id: 'boom' })], 'tool_use') : mockMessage([finish('ok')], 'tool_use')))
    const res = (llm as MockClient).calls[1].messages.at(-1)!.content as Anthropic.ToolResultBlockParam[]
    expect(res[0].is_error).toBe(true)
    expect(String(res[0].content)).not.toMatch(/exploded/)
  })

  it('BUDGET (run): stops before a call that would exceed maxCostUsd', async () => {
    // Each call: 20K input + 4K output on Haiku = $0.004. Cap is $0.01, so the 3rd call is refused.
    const llm = fakeLive(() => mockMessage([mockToolUse('lookup', { id: 'x' })], 'tool_use', { input_tokens: 20_000, output_tokens: 4_000 }))
    const { r, sink } = await run(() => mockMessage([], 'end_turn'), { llm })
    expect(r.status).toBe('BUDGET')
    expect(r.totals.costUsd).toBeLessThanOrEqual(0.01)
    expect(r.totals.iterations).toBe(2)
    expect([...sink.runs.values()][0].steps.some((s) => s.name === 'budget.run')).toBe(true)
  })

  it('BUDGET (global): refuses to start a call when SPEND_CAP_USD is reached', async () => {
    const called: number[] = []
    const llm = fakeLive((_r, i) => {
      called.push(i)
      return mockMessage([finish('x')], 'tool_use')
    })
    const { r } = await run(() => mockMessage([], 'end_turn'), { llm, sink: new MemorySink(15) })
    expect(r.status).toBe('BUDGET')
    expect(r.error).toMatch(/Spend cap/)
    expect(called).toEqual([])
  })

  it('TIMEOUT: aborts a hanging call', async () => {
    const slow = defineAgent({ ...agent, limits: { ...agent.limits, timeoutMs: 50 } })
    const llm: LlmClient = {
      mode: 'mock',
      create: (_req, { signal }) =>
        new Promise((_res, rej) => signal.addEventListener('abort', () => rej(new Error('aborted')))),
    }
    const r = await runAgent(slow, 'x', { llm, sink: new MemorySink(), envName: 'test', spendCapUsd: 15 })
    expect(r.status).toBe('TIMEOUT')
  })

  it('ERROR: API failure is recorded, not thrown', async () => {
    const { r, sink } = await run(() => {
      throw new Error('500 overloaded')
    })
    expect(r.status).toBe('ERROR')
    expect(r.error).toMatch(/overloaded/)
    expect([...sink.runs.values()][0].status).toBe('ERROR')
  })
})

describe('request shape', () => {
  it('uses cached system prompt, strict tools, auto tool choice, effort, and no temperature', async () => {
    const { llm } = await run(() => mockMessage([finish('ok')], 'tool_use'))
    const req = (llm as MockClient).calls[0]
    expect(req.system).toEqual([{ type: 'text', text: 'You are a test agent.', cache_control: { type: 'ephemeral' } }])
    expect(req.tool_choice).toEqual({ type: 'auto' })
    expect(req.output_config).toEqual({ effort: 'low' })
    expect(req).not.toHaveProperty('temperature')
    const tools = req.tools as Anthropic.Tool[]
    expect(tools.map((t) => t.name)).toEqual(['lookup', 'finish'])
    expect(tools.every((t) => t.strict === true && t.input_schema.additionalProperties === false)).toBe(true)
  })

  it('system + tools bytes are identical across iterations (cache-stable)', async () => {
    const { llm } = await run((_req, i) => (i < 2 ? mockMessage([mockToolUse('lookup', { id: `p${i}` })], 'tool_use') : mockMessage([finish('ok')], 'tool_use')))
    const calls = (llm as MockClient).calls
    const prefix = (c: (typeof calls)[number]) => JSON.stringify([c.system, c.tools])
    expect(new Set(calls.map(prefix)).size).toBe(1)
  })
})

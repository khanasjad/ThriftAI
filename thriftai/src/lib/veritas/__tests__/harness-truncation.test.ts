/** @jest-environment node */
import type Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod/v4'
import { defineAgent } from '../harness/agent'
import { models } from '../env'
import { MockClient, mockMessage, mockToolUse } from '../harness/llm'
import { runAgent } from '../harness/loop'
import { MemorySink } from '../harness/telemetry'

const agent = defineAgent({
  name: 'test-agent',
  model: () => models.agent,
  system: 'Test agent. Call finish with ok=true.',
  tools: [],
  finish: { description: 'Done.', schema: z.object({ ok: z.boolean() }) },
  maxTokens: 6000,
})
const thinkingOnly = { type: 'thinking', thinking: '', signature: 'sig' } as unknown as Anthropic.ContentBlock

describe('agent loop: truncated replies', () => {
  it('when the whole budget went to thinking, retries once larger with thinking off', async () => {
    const llm = new MockClient((_req, i) => (i === 0 ? mockMessage([thinkingOnly], 'max_tokens') : mockMessage([mockToolUse('finish', { ok: true })], 'tool_use')))
    const r = await runAgent(agent, 'go', { llm, sink: new MemorySink(), spendCapUsd: 10 })
    expect(r.status).toBe('OK')
    expect(llm.calls[0].thinking).toBeUndefined()
    expect(llm.calls[1].thinking).toEqual({ type: 'disabled' })
    expect(llm.calls[1].max_tokens).toBe(12000)
  })
  it('long thinking, then a cut-off tool call: retry also turns thinking off', async () => {
    const llm = new MockClient((_req, i) => (i === 0 ? mockMessage([thinkingOnly, mockToolUse('finish', { ok: true })], 'max_tokens') : mockMessage([mockToolUse('finish', { ok: true })], 'tool_use')))
    const r = await runAgent(agent, 'go', { llm, sink: new MemorySink(), spendCapUsd: 10 })
    expect(r.status).toBe('OK')
    expect(llm.calls[1].thinking).toEqual({ type: 'disabled' })
  })
  it('no thinking in the cut-off reply: thinking stays as it was (only the budget grows)', async () => {
    const partial = mockMessage([mockToolUse('finish', { ok: true })], 'max_tokens')
    const llm = new MockClient((_req, i) => (i === 0 ? partial : mockMessage([mockToolUse('finish', { ok: true })], 'tool_use')))
    const r = await runAgent(agent, 'go', { llm, sink: new MemorySink(), spendCapUsd: 10 })
    expect(r.status).toBe('OK')
    expect(llm.calls[1].thinking).toBeUndefined()
  })
  it('gives up after one retry', async () => {
    const llm = new MockClient(() => mockMessage([thinkingOnly], 'max_tokens'))
    const r = await runAgent(agent, 'go', { llm, sink: new MemorySink(), spendCapUsd: 10 })
    expect(r.status).toBe('TRUNCATED')
    expect(llm.calls).toHaveLength(2)
  })
})

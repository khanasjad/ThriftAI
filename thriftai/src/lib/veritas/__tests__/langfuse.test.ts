/** @jest-environment node */
import { withLangfuse } from '../harness/langfuse'
import { MemorySink } from '../harness/telemetry'

describe('Langfuse export', () => {
  it('sends a trace for root runs and a span + generations for child runs, after the inner sink', async () => {
    const calls: { url: string; init: RequestInit }[] = []
    const fakeFetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, init })
      return new Response(null, { status: 207 })
    }) as unknown as typeof fetch
    const inner = new MemorySink()
    const sink = withLangfuse(inner, { host: 'https://lf.example/', publicKey: 'pk', secretKey: 'sk', fetch: fakeFetch })

    const root = await sink.startRun({ agent: 'rate-product', graph: 'rate-product', model: 'code', env: 'test' })
    const child = await sink.startRun({ agent: 'evidence', graph: 'rate-product', model: 'claude-haiku-5-5', env: 'test', parentRunId: root })
    await sink.step(child, { idx: 0, kind: 'LLM', name: 'claude-haiku-5-5', inputTokens: 100, outputTokens: 20, costUsd: 0.0001, durationMs: 400, stopReason: 'tool_use' })
    await sink.step(child, { idx: 1, kind: 'TOOL', name: 'list_reviews', input: { page: 0 }, output: '…' })
    const totals = { iterations: 1, inputTokens: 100, outputTokens: 20, cacheReadTokens: 0, cacheWriteTokens: 0, costUsd: 0.0001 }
    await sink.endRun(child, { ...totals, status: 'OK' })
    await sink.endRun(root, { ...totals, status: 'OK' })

    expect(inner.runs.get(child)!.steps).toHaveLength(2) // database trace is unchanged
    expect(calls).toHaveLength(2)
    expect(calls[0].url).toBe('https://lf.example/api/public/ingestion')
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe(`Basic ${Buffer.from('pk:sk').toString('base64')}`)
    const childBatch = JSON.parse(String(calls[0].init.body)).batch
    expect(childBatch.map((e: { type: string }) => e.type)).toEqual(['span-create', 'generation-create', 'span-create'])
    expect(childBatch[1].body).toMatchObject({ traceId: root, parentObservationId: child, model: 'claude-haiku-5-5', usage: { input: 100, output: 20, unit: 'TOKENS' } })
    const rootBatch = JSON.parse(String(calls[1].init.body)).batch
    expect(rootBatch[0]).toMatchObject({ type: 'trace-create', body: { id: root, name: 'rate-product' } })
  })

  it('never fails the run when Langfuse is down', async () => {
    const failing = (async () => {
      throw new Error('ECONNREFUSED')
    }) as unknown as typeof fetch
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const sink = withLangfuse(new MemorySink(), { host: 'https://lf.example', publicKey: 'pk', secretKey: 'sk', fetch: failing })
    const id = await sink.startRun({ agent: 'a', model: 'm', env: 'test' })
    await expect(sink.endRun(id, { status: 'OK', iterations: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, costUsd: 0 })).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

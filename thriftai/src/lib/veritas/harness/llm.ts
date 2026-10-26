import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { env } from '../env'
import { FINISH_TOOL, type AgentDef } from './agent'
import { toAnthropicTool } from './tools'

/**
 * The only place that talks to the Anthropic API.
 * LLM_MODE: live (real calls; LLM_RECORD=1 also saves them), replay (saved responses, $0), mock (scripted, tests).
 */

export type LlmMode = 'live' | 'replay' | 'mock'
export type LlmRequest = Anthropic.MessageCreateParamsNonStreaming

export interface LlmClient {
  readonly mode: LlmMode
  create(req: LlmRequest, opts: { signal: AbortSignal }): Promise<Anthropic.Message>
}

export class ReplayMissError extends Error {
  constructor(public key: string) {
    super(`No recorded response for request ${key.slice(0, 12)}. Run once with LLM_MODE=live LLM_RECORD=1.`)
  }
}

const REPLAY_DIR = path.join(process.cwd(), '.veritas', 'replay')

function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
      .join(',')}}`
  }
  return JSON.stringify(v)
}

export function requestKey(req: LlmRequest) {
  return createHash('sha256').update(stableStringify(req)).digest('hex')
}

class LiveClient implements LlmClient {
  readonly mode = 'live' as const
  private client: Anthropic
  constructor(
    apiKey: string,
    private record: boolean,
  ) {
    this.client = new Anthropic({ apiKey, maxRetries: 2 })
  }
  async create(req: LlmRequest, { signal }: { signal: AbortSignal }) {
    const res = await this.client.messages.create(req, { signal })
    if (this.record) {
      await mkdir(REPLAY_DIR, { recursive: true })
      await writeFile(path.join(REPLAY_DIR, `${requestKey(req)}.json`), JSON.stringify(res, null, 2))
    }
    return res
  }
}

class ReplayClient implements LlmClient {
  readonly mode = 'replay' as const
  async create(req: LlmRequest) {
    const key = requestKey(req)
    try {
      return JSON.parse(await readFile(path.join(REPLAY_DIR, `${key}.json`), 'utf8')) as Anthropic.Message
    } catch {
      throw new ReplayMissError(key)
    }
  }
}

export type MockResponder = (req: LlmRequest, call: number) => Anthropic.Message | Promise<Anthropic.Message>

export class MockClient implements LlmClient {
  readonly mode = 'mock' as const
  calls: LlmRequest[] = []
  constructor(private responder: MockResponder) {}
  async create(req: LlmRequest, { signal }: { signal: AbortSignal }) {
    // Snapshot: the loop keeps mutating `messages` after this call.
    this.calls.push(structuredClone(req))
    if (signal.aborted) throw new Anthropic.APIUserAbortError()
    return this.responder(req, this.calls.length - 1)
  }
}

let defaultClient: LlmClient | null = null

/** Client for the configured LLM_MODE. Mock mode needs an explicit MockClient. */
export function getLlm(): LlmClient {
  if (defaultClient) return defaultClient
  const e = env()
  if (e.LLM_MODE === 'replay') defaultClient = new ReplayClient()
  else if (e.LLM_MODE === 'mock') throw new Error('LLM_MODE=mock: pass a MockClient to runAgent({ llm }).')
  else {
    if (!e.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set (add it to .env.development.local).')
    defaultClient = new LiveClient(e.ANTHROPIC_API_KEY, e.LLM_RECORD)
  }
  return defaultClient
}

/**
 * Builds the request. Order and bytes of system + tools are fixed so prompt caching hits.
 * `thinkingOff`: only for the truncation retry (Haiku 5.5 thinks by default and thinking counts toward max_tokens;
 * disabling is accepted at effort ≤ high, and agents run at low).
 */
export function buildRequest(agent: AgentDef, messages: Anthropic.MessageParam[], maxTokens: number, opts: { thinkingOff?: boolean } = {}): LlmRequest {
  const finishTool = toAnthropicTool({ name: FINISH_TOOL, description: agent.finish.description, schema: agent.finish.schema })
  return {
    model: agent.model(),
    max_tokens: maxTokens,
    system: [{ type: 'text', text: agent.system, cache_control: { type: 'ephemeral' } }],
    tools: [...agent.tools.map(toAnthropicTool), finishTool],
    tool_choice: { type: 'auto' },
    output_config: { effort: agent.effort },
    ...(opts.thinkingOff && { thinking: { type: 'disabled' as const } }),
    // Automatic caching: moves the breakpoint forward as the loop's history grows.
    cache_control: { type: 'ephemeral' },
    messages,
  }
}

// ---------- helpers for building mock responses (tests) ----------

let mockSeq = 0

export function mockMessage(
  content: Anthropic.ContentBlock[],
  stop_reason: Anthropic.StopReason,
  usage: Partial<Anthropic.Usage> = {},
  model = 'claude-haiku-5-5',
): Anthropic.Message {
  return {
    id: `msg_mock_${++mockSeq}`,
    type: 'message',
    role: 'assistant',
    model,
    content,
    stop_reason,
    stop_sequence: null,
    stop_details: null,
    container: null,
    usage: {
      input_tokens: 100,
      output_tokens: 20,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      ...usage,
    } as Anthropic.Usage,
  } as Anthropic.Message
}

export function mockToolUse(name: string, input: unknown, id = `toolu_mock_${++mockSeq}`): Anthropic.ToolUseBlock {
  return { type: 'tool_use', id, name, input } as Anthropic.ToolUseBlock
}

export function mockText(text: string): Anthropic.TextBlock {
  return { type: 'text', text, citations: null } as Anthropic.TextBlock
}

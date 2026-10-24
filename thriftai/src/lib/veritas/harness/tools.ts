import { z } from 'zod/v4'
import type Anthropic from '@anthropic-ai/sdk'

/** What a tool handler can see. Handlers query the DB; they never call the network. */
export type ToolContext = {
  runId: string
  agent: string
  productId?: string
  signal: AbortSignal
}

export type ToolOutput = string | Record<string, unknown> | unknown[]

export type Tool<S extends z.ZodType = z.ZodType> = {
  name: string
  description: string
  schema: S
  handler: (input: z.infer<S>, ctx: ToolContext) => Promise<ToolOutput> | ToolOutput
}

/** Thrown by a handler to send a short, model-readable error back (is_error result). */
export class ToolError extends Error {}

export function defineTool<S extends z.ZodObject>(tool: Tool<S>): Tool<S> {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(tool.name)) throw new Error(`Invalid tool name "${tool.name}"`)
  return tool
}

type Json = Record<string, unknown>

// Keywords strict tool schemas accept. Everything else is folded into the description
// (zod still enforces it when the handler runs).
const KEEP_STRING_FORMATS = new Set(['date-time', 'time', 'date', 'duration', 'email', 'hostname', 'uri', 'ipv4', 'ipv6', 'uuid'])

function toStrict(node: Json): Json {
  const s = { ...node }
  delete s.$schema
  const out: Json = {}
  const extras: string[] = []

  for (const key of ['anyOf', 'oneOf'] as const) {
    if (Array.isArray(s[key])) {
      out.anyOf = (s[key] as Json[]).map(toStrict)
      delete s[key]
    }
  }
  if (s.type !== undefined) out.type = s.type
  delete s.type
  for (const key of ['description', 'enum', 'const'] as const) {
    if (s[key] !== undefined) out[key] = s[key]
    delete s[key]
  }

  if (out.type === 'object') {
    const props = (s.properties as Record<string, Json>) ?? {}
    out.properties = Object.fromEntries(Object.entries(props).map(([k, v]) => [k, toStrict(v)]))
    out.additionalProperties = false
    if (s.required) out.required = s.required
    delete s.properties
    delete s.required
    delete s.additionalProperties
  } else if (out.type === 'array') {
    if (s.items) out.items = toStrict(s.items as Json)
    delete s.items
    if (s.minItems === 0 || s.minItems === 1) {
      out.minItems = s.minItems
      delete s.minItems
    }
  } else if (out.type === 'string' && typeof s.format === 'string' && KEEP_STRING_FORMATS.has(s.format)) {
    out.format = s.format
    delete s.format
  }

  for (const [k, v] of Object.entries(s)) extras.push(`${k}: ${JSON.stringify(v)}`)
  if (extras.length) out.description = [out.description, `(${extras.join(', ')})`].filter(Boolean).join(' ')
  return out
}

/** zod → strict JSON Schema for the Messages API. Deterministic, so tool bytes stay cache-stable. */
export function toInputSchema(schema: z.ZodType): Anthropic.Tool.InputSchema {
  const json = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'throw' }) as Json
  if (json.type !== 'object') throw new Error('Tool input schema must be an object')
  return toStrict(json) as Anthropic.Tool.InputSchema
}

export function toAnthropicTool(tool: Pick<Tool, 'name' | 'description' | 'schema'>): Anthropic.Tool {
  return { name: tool.name, description: tool.description, input_schema: toInputSchema(tool.schema), strict: true }
}

/** Formats zod issues so the model can fix its input. */
export function describeIssues(err: z.ZodError) {
  return err.issues
    .slice(0, 8)
    .map((i) => `${i.path.join('.') || '(input)'}: ${i.message}`)
    .join('; ')
}

export function serialiseOutput(out: ToolOutput): string {
  return typeof out === 'string' ? out : JSON.stringify(out)
}

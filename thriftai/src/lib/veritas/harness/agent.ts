import { z } from 'zod/v4'
import type { Tool } from './tools'

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

export type AgentLimits = {
  maxIterations: number
  maxCostUsd: number
  timeoutMs: number
  maxToolErrors: number
}

export const DEFAULT_LIMITS: AgentLimits = { maxIterations: 8, maxCostUsd: 0.4, timeoutMs: 120_000, maxToolErrors: 3 }

export type AgentDef<F extends z.ZodObject = z.ZodObject> = {
  name: string
  /** Resolved at run time so the model always comes from env (`models.*`). */
  model: () => string
  effort: Effort
  /** Stable, cacheable system prompt. Never put per-run data here. */
  system: string
  tools: Tool[]
  finish: { description: string; schema: F }
  limits: AgentLimits
  maxTokens: number
}

export const FINISH_TOOL = 'finish'

export function defineAgent<F extends z.ZodObject>(
  def: Omit<AgentDef<F>, 'limits' | 'maxTokens' | 'effort'> & {
    limits?: Partial<AgentLimits>
    maxTokens?: number
    effort?: Effort
  },
): AgentDef<F> {
  const names = def.tools.map((t) => t.name)
  if (names.includes(FINISH_TOOL)) throw new Error(`"${FINISH_TOOL}" is reserved`)
  if (new Set(names).size !== names.length) throw new Error(`Duplicate tool names in agent "${def.name}"`)
  return {
    ...def,
    effort: def.effort ?? 'low',
    maxTokens: def.maxTokens ?? 4096,
    limits: { ...DEFAULT_LIMITS, ...def.limits },
  }
}

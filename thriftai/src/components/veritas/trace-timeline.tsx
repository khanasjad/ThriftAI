'use client'

import * as React from 'react'
import { Bot, Wrench, ShieldAlert, ChevronDown, CircleCheck, CircleX } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TraceStep = {
  idx: number
  kind: 'LLM' | 'TOOL' | 'GUARDRAIL'
  name: string
  isError?: boolean
  stopReason?: string | null
  durationMs?: number | null
  inputTokens?: number | null
  outputTokens?: number | null
  cacheReadTokens?: number | null
  costUsd?: number | null
  input?: unknown
  output?: unknown
}

const KIND = {
  LLM: { icon: <Bot aria-hidden />, label: 'Model call' },
  TOOL: { icon: <Wrench aria-hidden />, label: 'Tool call' },
  GUARDRAIL: { icon: <ShieldAlert aria-hidden />, label: 'Guardrail' },
}

const fmtCost = (c?: number | null) => (c == null ? null : c < 0.01 ? `$${c.toFixed(4)}` : `$${c.toFixed(3)}`)

/** Step-by-step view of one agent loop (admin trace viewer). */
export function TraceTimeline({ steps, status }: { steps: TraceStep[]; status?: string }) {
  const [open, setOpen] = React.useState<number | null>(null)
  return (
    <div>
      <ol className="relative flex flex-col">
        {steps.map((s, i) => {
          const k = KIND[s.kind]
          const expanded = open === s.idx
          return (
            <li key={s.idx} className="relative pl-10">
              {i < steps.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-border" aria-hidden />}
              <span
                className={cn(
                  'absolute left-0 top-1.5 inline-flex size-8 items-center justify-center rounded-full border bg-surface [&_svg]:size-4',
                  s.isError ? 'border-critical/50 text-critical-fg' : s.kind === 'GUARDRAIL' ? 'border-warning/60 text-warning-fg' : 'border-border text-fg-muted',
                )}
              >
                {k.icon}
              </span>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : s.idx)}
                aria-expanded={expanded}
                className="flex w-full flex-col gap-1 rounded-md px-2 py-2 text-left hover:bg-surface-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-fg">
                    <span className="mr-1.5 text-fg-subtle tabular">#{s.idx}</span>
                    {s.name}
                  </span>
                  <span className="text-xs text-fg-subtle">
                    {k.label}
                    {s.stopReason && ` · stop: ${s.stopReason}`}
                    {s.isError && ' · error'}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted tabular sm:shrink-0">
                  {s.inputTokens != null && (
                    <span>
                      {s.inputTokens.toLocaleString()}→{(s.outputTokens ?? 0).toLocaleString()} tok
                      {s.cacheReadTokens ? ` · ${s.cacheReadTokens.toLocaleString()} cached` : ''}
                    </span>
                  )}
                  {fmtCost(s.costUsd) && <span>{fmtCost(s.costUsd)}</span>}
                  {s.durationMs != null && <span>{(s.durationMs / 1000).toFixed(1)}s</span>}
                  <ChevronDown className={cn('size-4 text-fg-subtle transition-transform', expanded && 'rotate-180')} aria-hidden />
                </span>
              </button>
              {expanded && (
                <div className="mb-3 ml-2 grid gap-2 sm:grid-cols-2">
                  {(['input', 'output'] as const).map((key) => (
                    <div key={key} className="min-w-0">
                      <div className="mb-1 text-xs font-medium text-fg-subtle">{key}</div>
                      <pre tabIndex={0} className="max-h-64 overflow-auto rounded-md bg-surface-2 p-3 font-mono text-xs leading-relaxed text-fg">
                        {JSON.stringify(s[key] ?? null, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {status && (
        <div className={cn('mt-3 inline-flex items-center gap-1.5 text-sm', status === 'OK' ? 'text-good-fg' : 'text-critical-fg')}>
          {status === 'OK' ? <CircleCheck className="size-4" aria-hidden /> : <CircleX className="size-4" aria-hidden />}
          Run ended: {status}
        </div>
      )}
    </div>
  )
}

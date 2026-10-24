import { CircleCheck, CircleDashed, CircleX, Gauge, Hourglass, OctagonAlert } from 'lucide-react'
import { Badge } from '@/components/ui/primitives'

const STATUS: Record<string, { tone: 'good' | 'warning' | 'critical' | 'neutral'; icon: React.ReactNode; label: string }> = {
  OK: { tone: 'good', icon: <CircleCheck aria-hidden />, label: 'OK' },
  RUNNING: { tone: 'neutral', icon: <CircleDashed aria-hidden />, label: 'Running' },
  SKIPPED: { tone: 'neutral', icon: <CircleDashed aria-hidden />, label: 'Skipped' },
  BUDGET: { tone: 'warning', icon: <Gauge aria-hidden />, label: 'Budget' },
  MAX_ITERATIONS: { tone: 'warning', icon: <OctagonAlert aria-hidden />, label: 'Max iterations' },
  NO_FINISH: { tone: 'warning', icon: <OctagonAlert aria-hidden />, label: 'No finish' },
  TRUNCATED: { tone: 'warning', icon: <OctagonAlert aria-hidden />, label: 'Truncated' },
  TIMEOUT: { tone: 'warning', icon: <Hourglass aria-hidden />, label: 'Timeout' },
  TOOL_ERRORS: { tone: 'critical', icon: <CircleX aria-hidden />, label: 'Tool errors' },
  REFUSAL: { tone: 'critical', icon: <CircleX aria-hidden />, label: 'Refusal' },
  ERROR: { tone: 'critical', icon: <CircleX aria-hidden />, label: 'Error' },
}

/** Run status: icon + word, never colour alone. */
export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { tone: 'neutral' as const, icon: null, label: status }
  return (
    <Badge tone={s.tone}>
      {s.icon}
      {s.label}
    </Badge>
  )
}

export const fmtUsd = (n: number) => (n === 0 ? '$0' : n < 0.01 ? `$${n.toFixed(5)}` : `$${n.toFixed(4)}`)
export const fmtMs = (ms: number | null) => (ms == null ? '—' : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`)

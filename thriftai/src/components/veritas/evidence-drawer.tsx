'use client'

import { Flag, MessageSquareQuote, Tag, TrendingUp, ShieldCheck } from 'lucide-react'
import { Dialog, SheetContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

export type EvidenceItem = {
  id: string
  kind: 'review' | 'return' | 'price' | 'trend' | 'brand' | 'spec'
  quote: string
  /** substring of `quote` to highlight (the signal phrase) */
  highlight?: string
  signal: string
  sentiment: number // -1 … +1
  source: string // e.g. "Verified review · Sep 12"
  flagged?: boolean // guardrail: possible prompt injection
}

const KIND_ICON = {
  review: <MessageSquareQuote aria-hidden />,
  return: <Tag aria-hidden />,
  price: <Tag aria-hidden />,
  trend: <TrendingUp aria-hidden />,
  brand: <ShieldCheck aria-hidden />,
  spec: <ShieldCheck aria-hidden />,
}

function Highlighted({ text, phrase }: { text: string; phrase?: string }) {
  if (!phrase) return <>{text}</>
  const i = text.toLowerCase().indexOf(phrase.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-accent-soft px-0.5 text-fg">{text.slice(i, i + phrase.length)}</mark>
      {text.slice(i + phrase.length)}
    </>
  )
}

/** The evidence behind one number: quotes, sources and findings. Opens from any factor row. */
export function EvidenceDrawer({
  open,
  onOpenChange,
  title,
  score,
  items,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  score: number | null
  items: EvidenceItem[]
}) {
  const positive = items.filter((i) => i.sentiment > 0.15).length
  const negative = items.filter((i) => i.sentiment < -0.15).length
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <div className="border-b border-border p-5 pr-14">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="mt-1">
            {score === null ? 'Not enough evidence yet.' : `Score ${Math.round(score)} from ${items.length} piece${items.length === 1 ? '' : 's'} of evidence`}
            {items.length > 0 && ` · ${positive} positive, ${negative} negative`}
          </DialogDescription>
        </div>
        <ul className="flex-1 space-y-3 overflow-y-auto p-5">
          {items.length === 0 && <li className="text-sm text-fg-muted">No evidence for this factor yet. It isn’t included in the score.</li>}
          {items.map((e) => (
            <li key={e.id} className={cn('rounded-lg border border-border p-4', e.flagged && 'border-warning/60 bg-warning-soft/40')}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone={e.sentiment > 0.15 ? 'good' : e.sentiment < -0.15 ? 'critical' : 'neutral'}>
                  {KIND_ICON[e.kind]}
                  {e.signal.replace(/_/g, ' ')}
                </Badge>
                {e.flagged && (
                  <Badge tone="warning">
                    <Flag aria-hidden /> Flagged: possible manipulation, down-weighted
                  </Badge>
                )}
              </div>
              <blockquote className="text-sm leading-relaxed text-fg">
                “<Highlighted text={e.quote} phrase={e.highlight} />”
              </blockquote>
              <div className="mt-2 text-xs text-fg-subtle">{e.source}</div>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Dialog>
  )
}

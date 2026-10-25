'use client'

import * as React from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const REASONS = ['Score seems too high', 'Score seems too low', 'Evidence doesn’t match', 'Size advice was wrong']

/** 👍/👎 on a score or answer → POST /api/v1/feedback. A 👎 asks for an optional reason. */
export function FeedbackButtons({
  targetType,
  targetId,
  prompt = 'Does this score look right?',
}: {
  targetType: 'PRODUCT_SCORE' | 'SEARCH_TURN'
  targetId: string
  prompt?: string
}) {
  const toast = useToast()
  const [vote, setVote] = React.useState<1 | -1 | null>(null)
  const [askReason, setAskReason] = React.useState(false)
  const [reason, setReason] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [done, setDone] = React.useState(false)

  async function send(rating: 1 | -1, why?: string) {
    setBusy(true)
    try {
      const res = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, rating, ...(why ? { reason: why } : {}) }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not send feedback')
      return true
    } catch (err) {
      toast({ title: 'Feedback not sent', description: err instanceof Error ? err.message : undefined, tone: 'critical' })
      return false
    } finally {
      setBusy(false)
    }
  }

  async function choose(rating: 1 | -1) {
    const prev = vote
    setVote(rating)
    if (!(await send(rating))) return setVote(prev)
    if (rating === -1) setAskReason(true)
    else {
      setAskReason(false)
      setDone(true)
    }
  }

  async function submitReason() {
    if (await send(-1, reason.trim())) {
      setAskReason(false)
      setDone(true)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-fg-muted" id={`fb-${targetId}`}>
          {done ? 'Thanks. Feedback helps us tune the score.' : prompt}
        </span>
        <div role="group" aria-labelledby={`fb-${targetId}`} className="inline-flex gap-1">
          {([1, -1] as const).map((r) => (
            <button
              key={r}
              type="button"
              disabled={busy}
              onClick={() => choose(r)}
              aria-pressed={vote === r}
              aria-label={r === 1 ? 'Yes, looks right' : 'No, looks wrong'}
              className={cn(
                'inline-flex size-9 items-center justify-center rounded-md border transition-colors disabled:opacity-60 [&_svg]:size-4',
                vote === r ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg',
              )}
            >
              {r === 1 ? <ThumbsUp aria-hidden /> : <ThumbsDown aria-hidden />}
            </button>
          ))}
        </div>
      </div>
      {askReason && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 p-3">
          <span className="text-sm text-fg">What looks wrong? (optional)</span>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                aria-pressed={reason === r}
                className={cn(
                  'min-h-9 rounded-full border px-3 text-sm transition-colors',
                  reason === r ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-surface text-fg-muted hover:text-fg',
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <label htmlFor={`fb-reason-${targetId}`} className="sr-only">
            Reason
          </label>
          <Textarea id={`fb-reason-${targetId}`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={2} placeholder="Tell us more" />
          <div className="flex gap-2">
            <Button size="sm" onClick={submitReason} disabled={busy}>
              Send
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAskReason(false)
                setDone(true)
              }}
            >
              Skip
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

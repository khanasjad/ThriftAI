'use client'

import * as React from 'react'
import { ArrowUp, Loader2, MessageCircleQuestion, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { InstantAnswer } from '@/lib/veritas/qa/instant'

type Answer = { status: 'answered' | 'not_enough_evidence' | 'off_topic' | 'refused' | 'error'; sentences: { text: string; evidence: { id: string; text: string }[] }[] }

const STATUS_TEXT: Record<Exclude<Answer['status'], 'answered'>, string> = {
  not_enough_evidence: 'The reviews, returns and prices we have don’t answer that yet. We’d rather say so than guess.',
  off_topic: 'I can only answer questions about this item, using what owners and the data say.',
  refused: 'That question looks like an attempt to change how I answer, so I can’t answer it.',
  error: 'Could not answer right now. Try again.',
}

/** Quick answers from counts ($0, instant) plus free-text questions answered from the evidence and verified. */
export function ProductQA({ productId, instant }: { productId: string; instant: InstantAnswer[] }) {
  const [open, setOpen] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState('')
  const [asked, setAsked] = React.useState<{ q: string; a: Answer | null; error?: string }[]>([])
  const busy = asked.some((x) => !x.a && !x.error)
  const current = instant.find((x) => x.id === open)

  async function ask(e: React.FormEvent) {
    e.preventDefault()
    const q = draft.trim()
    if (q.length < 3 || busy) return
    setDraft('')
    setAsked((xs) => [{ q, a: null }, ...xs])
    try {
      const res = await fetch(`/api/v1/products/${encodeURIComponent(productId)}/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q }) })
      const json = await res.json().catch(() => ({}))
      setAsked((xs) => xs.map((x) => (x.q === q && !x.a ? (json.success ? { q, a: json.data } : { q, a: null, error: json.error ?? 'Could not answer right now.' }) : x)))
    } catch {
      setAsked((xs) => xs.map((x) => (x.q === q && !x.a ? { q, a: null, error: 'Could not answer right now.' } : x)))
    }
  }

  return (
    <section aria-labelledby="qa-h" className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 id="qa-h" className="flex items-center gap-2 text-base font-semibold text-fg">
        <MessageCircleQuestion className="size-5 text-accent" aria-hidden />
        Ask about this item
      </h2>
      <p className="mt-1 text-sm text-fg-muted">Quick answers come straight from the counts. Your own questions are answered only from the evidence, and every sentence is checked.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {instant.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-expanded={open === x.id}
            aria-controls="qa-instant"
            onClick={() => setOpen(open === x.id ? null : x.id)}
            className={cn(
              'inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm transition-colors',
              open === x.id ? 'border-accent bg-accent-soft text-fg' : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg',
            )}
          >
            {x.question}
          </button>
        ))}
      </div>
      <div id="qa-instant" aria-live="polite">
        {current && (
          <p className={cn('mt-3 rounded-lg px-4 py-3 text-sm', current.enough ? 'bg-surface-2 text-fg' : 'bg-surface-2 text-fg-muted')}>
            {current.answer}
          </p>
        )}
      </div>

      <form onSubmit={ask} className="mt-5 flex items-center gap-2 rounded-xl border border-border-strong bg-bg p-1.5 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
        <label htmlFor="qa-input" className="sr-only">
          Ask a question about this item
        </label>
        <input
          id="qa-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          placeholder="e.g. Is it see-through in white? Does the collar stretch?"
          className="h-10 min-w-0 flex-1 bg-transparent px-2.5 text-sm text-fg outline-none placeholder:text-fg-subtle"
        />
        <Button type="submit" size="icon-sm" disabled={draft.trim().length < 3 || busy} aria-label="Ask">
          {busy ? <Loader2 className="animate-spin" /> : <ArrowUp />}
        </Button>
      </form>

      <ul className="mt-4 flex flex-col gap-3" aria-live="polite">
        {asked.map((x, i) => (
          <li key={`${x.q}-${i}`} className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-fg">{x.q}</p>
            {!x.a && !x.error ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-fg-muted">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Checking the evidence…
              </p>
            ) : x.error ? (
              <p className="mt-2 text-sm text-critical-fg">{x.error}</p>
            ) : x.a!.status === 'answered' ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-fg">{x.a!.sentences.map((s) => s.text).join(' ')}</p>
                <details className="mt-2 text-xs text-fg-muted">
                  <summary className="inline-flex cursor-pointer items-center gap-1 text-good-fg">
                    <ShieldCheck className="size-3.5" aria-hidden /> Checked against the evidence · show sources
                  </summary>
                  <ul className="mt-2 flex flex-col gap-1.5 border-l-2 border-border pl-3">
                    {[...new Map(x.a!.sentences.flatMap((s) => s.evidence).map((e) => [e.id, e])).values()].map((e) => (
                      <li key={e.id}>{e.text}</li>
                    ))}
                  </ul>
                </details>
              </>
            ) : (
              <p className="mt-2 text-sm text-fg-muted">{STATUS_TEXT[x.a!.status as Exclude<Answer['status'], 'answered'>]}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

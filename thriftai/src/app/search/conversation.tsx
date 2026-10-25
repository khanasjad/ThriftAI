'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowUp, Hourglass, Store, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/primitives'
import { PickCard, type Pick } from '@/components/veritas/pick-card'
import type { SearchResponse } from '@/lib/veritas/graph/answer-search'
import { QuestionCard } from './question-card'
import { cn } from '@/lib/utils'

type Msg = { role: 'shopper' | 'shopkeeper'; text: string }

async function post(body: unknown): Promise<SearchResponse> {
  const res = await fetch('/api/v1/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.success) throw new Error(json.error || 'Search failed')
  return json.data
}

const FIT_LABEL: Record<string, string> = { slim: 'Slim fit', regular: 'Regular fit', relaxed: 'Relaxed fit', oversized: 'Oversized' }

function readAs(i: SearchResponse['intent']) {
  return [
    i.category && (i.category === 'TOPS' ? 'Tees' : 'Jeans'),
    i.gender && (i.gender === 'MENS' ? 'Men' : i.gender === 'WOMENS' ? 'Women' : 'Unisex'),
    i.minPrice && i.maxPrice ? `$${i.minPrice}–$${i.maxPrice}` : i.maxPrice ? `Under $${i.maxPrice}` : i.minPrice ? `From $${i.minPrice}` : null,
    ...(i.colors ?? []),
    ...(i.patterns ?? []).map((p) => `${p[0].toUpperCase()}${p.slice(1)}`),
    ...(i.excludeColors ?? []).map((c) => `Not ${c}`),
    i.fit && FIT_LABEL[i.fit],
    ...(i.cuts ?? []).map((c) => c.replace(/-/g, ' ')),
    i.length && `${i.length[0].toUpperCase()}${i.length.slice(1)} length`,
    i.climate && `${i.climate[0].toUpperCase()}${i.climate.slice(1)} weather`,
    i.occasion,
    ...Object.keys(i.priorities).map((p) => `Cares about ${p.toLowerCase().replace('_', ' & ')}`),
    i.sustainability && 'Sustainable',
    ...i.terms.map((t) => `“${t}”`),
  ].filter(Boolean) as string[]
}

/**
 * Shopkeeper conversation: up to 4 questions (chips or free text), "Just show me" at any time,
 * picks below that update after every message. Picks come from code + the Veritas Score, never from the agent.
 */
export function Conversation({ query }: { query: string }) {
  const [msgs, setMsgs] = React.useState<Msg[]>([{ role: 'shopper', text: query }])
  const [res, setRes] = React.useState<SearchResponse | null>(null)
  const [busy, setBusy] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState('')
  const endRef = React.useRef<HTMLLIElement>(null)

  React.useEffect(() => {
    let cancelled = false
    setMsgs([{ role: 'shopper', text: query }])
    setBusy(true)
    post({ message: query })
      .then((r) => {
        if (cancelled) return
        setRes(r)
        setMsgs((m) => [...m, { role: 'shopkeeper', text: r.reply }])
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setBusy(false))
    return () => {
      cancelled = true
    }
  }, [query])

  React.useEffect(() => {
    if (msgs.length > 2) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [msgs])

  async function send(body: { message?: string; action?: 'show' }, shown: string) {
    if (!res || busy) return
    setBusy(true)
    setError(null)
    setMsgs((m) => [...m, { role: 'shopper', text: shown }])
    try {
      const r = await post({ sessionId: res.sessionId, ...body })
      setRes(r)
      setMsgs((m) => [...m, { role: 'shopkeeper', text: r.reply }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const t = draft.trim()
    if (!t) return
    setDraft('')
    send({ message: t }, t)
  }

  const picks: Pick[] = (res?.picks ?? []).map((p) => ({ ...p, href: `/p/${p.slug}`, confidence: p.label }))
  const chips = res ? readAs(res.intent) : []

  return (
    <section aria-labelledby="chat-h" className="mt-6">
      <h2 id="chat-h" className="sr-only">
        Conversation with the shopkeeper
      </h2>

      <div className="rounded-2xl border border-border bg-surface shadow-sm">
        <ol className="flex max-h-[26rem] flex-col gap-3 overflow-y-auto p-4 sm:p-5" aria-live="polite" aria-relevant="additions" tabIndex={0} aria-label="Messages">
          {msgs.map((m, i) => (
            <li key={i} className={cn('flex gap-2', m.role === 'shopper' ? 'justify-end' : 'justify-start')}>
              {m.role === 'shopkeeper' && (
                <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden>
                  <Store className="size-4" />
                </span>
              )}
              <p
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed',
                  m.role === 'shopper' ? 'rounded-br-md bg-accent text-accent-fg' : 'rounded-bl-md bg-surface-2 text-fg',
                )}
              >
                <span className="sr-only">{m.role === 'shopper' ? 'You: ' : 'Shopkeeper: '}</span>
                {m.text}
              </p>
            </li>
          ))}
          {busy && (
            <li className="flex gap-2" aria-label="Shopkeeper is typing">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden>
                <Store className="size-4" />
              </span>
              <span className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3" aria-hidden>
                {[0, 1, 2].map((d) => (
                  <span key={d} className="size-1.5 animate-pulse rounded-full bg-fg-subtle" style={{ animationDelay: `${d * 150}ms` }} />
                ))}
              </span>
            </li>
          )}
          <li ref={endRef} aria-hidden className="h-0" />
        </ol>

        {res?.question && (
          <QuestionCard
            key={`${res.sessionId}-${msgs.length}`}
            question={res.question}
            asked={res.asked}
            max={res.maxQuestions}
            busy={busy}
            autoFocus={msgs.length > 2}
            onPick={(label) => send({ message: label }, label)}
            onShow={() => send({ action: 'show' }, 'Just show me')}
          />
        )}

        <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-2 sm:p-3">
          <label htmlFor="chat-input" className="sr-only">
            Message the shopkeeper
          </label>
          <input
            id="chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={300}
            disabled={!res}
            placeholder={res?.question ? 'Or type your own answer…' : 'Refine: “cheaper”, “not black”, “show jeans instead”…'}
            className="h-11 min-w-0 flex-1 rounded-lg bg-transparent px-3 text-sm text-fg outline-none placeholder:text-fg-subtle"
          />
          <Button type="submit" size="icon-sm" disabled={!draft.trim() || busy || !res} aria-label="Send">
            <ArrowUp />
          </Button>
        </form>
      </div>

      {error && (
        <p role="alert" className="mt-3 flex items-center gap-2 rounded-lg border border-critical/40 bg-critical-soft px-4 py-3 text-sm text-critical-fg">
          <AlertCircle className="size-4" aria-hidden /> {error}
        </p>
      )}

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-fg-subtle">
          <span>Looking for</span>
          {chips.map((c) => (
            <span key={c} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-fg-muted">
              {c}
            </span>
          ))}
        </div>
      )}

      {!res && busy ? (
        <PicksSkeleton />
      ) : picks.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-medium text-fg">{res?.provisional ? 'Best so far (updates as you answer)' : 'Our three picks for you'}</h3>
          <div className={cn('mt-3 grid gap-4 md:grid-cols-3', busy && 'opacity-60')}>
            {picks.map((p, idx) => (
              <PickCard key={`${p.role}-${p.href}`} pick={p} index={idx} />
            ))}
          </div>
          {picks.length < 3 && (
            <p className="mt-3 text-sm text-fg-muted">
              Only {picks.length} {picks.length === 1 ? 'product fits' : 'products fit'} so far{picks.some((p) => p.overBudget) ? ', including one a little over budget' : ''}. Try
              relaxing a filter in the chat.
            </p>
          )}
        </div>
      ) : res && !res.offTopic ? (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-dashed border-border-strong p-5 text-sm text-fg-muted" role="status">
          <Hourglass className="mt-0.5 size-5 shrink-0 text-fg-subtle" aria-hidden />
          <p>
            {res.unrated > 0 ? (
              <>
                {res.unrated} {res.unrated === 1 ? 'product matches' : 'products match'}, but none {res.unrated === 1 ? 'is' : 'are'} rated yet, so there are no picks.{' '}
              </>
            ) : (
              <>Nothing matches all of that. Tell the shopkeeper what to relax, like “any colour” or “a bit more budget”. </>
            )}
            <Link href="/how-it-works" className="text-accent underline underline-offset-4">
              How rating works
            </Link>
          </p>
        </div>
      ) : null}

      <p className="mt-4 flex items-center gap-2 text-sm text-fg-muted">
        <UserRound className="size-4 text-fg-subtle" aria-hidden />
        <span>
          Better matches with your height, build and budget.{' '}
          <Link href="/profile" className="text-accent underline underline-offset-4">
            Set up your fit profile
          </Link>{' '}
          (optional, deletable in one click).
        </span>
      </p>
    </section>
  )
}

function PicksSkeleton() {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-5">
          <Skeleton className="h-4 w-24" />
          <div className="mt-5 flex gap-4">
            <Skeleton className="h-24 w-20 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-3 size-12 rounded-full" />
            </div>
          </div>
          <Skeleton className="mt-5 h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

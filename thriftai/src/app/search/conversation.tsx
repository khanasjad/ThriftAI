'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertCircle, Hourglass, MessageSquareOff, UserRound } from 'lucide-react'
import { Skeleton } from '@/components/ui/primitives'
import { ClarifyChips } from '@/components/veritas/clarify-chips'
import { PickCard, type Pick } from '@/components/veritas/pick-card'
import type { SearchResponse } from '@/lib/veritas/graph/answer-search'

type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'done'; res: SearchResponse; answered: string[] }

const FIT_LABEL: Record<string, string> = { slim: 'Slim fit', regular: 'Regular fit', relaxed: 'Relaxed fit', oversized: 'Oversized fit' }

async function post(body: unknown): Promise<SearchResponse> {
  const res = await fetch('/api/v1/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.success) throw new Error(json.error || 'Search failed')
  return json.data
}

/** Conversational search: one clarifying question at a time (only when it changes the top pick), then 3 picks. */
export function Conversation({ query }: { query: string }) {
  const [state, setState] = React.useState<State>({ status: 'loading' })
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    post({ message: query })
      .then((res) => !cancelled && setState({ status: 'done', res, answered: [] }))
      .catch((e) => !cancelled && setState({ status: 'error', message: e.message }))
    return () => {
      cancelled = true
    }
  }, [query])

  async function answer(label: string) {
    if (state.status !== 'done' || !state.res.question) return
    const q = state.res.question
    const chip = q.chips.find((c) => c.label === label)
    if (!chip) return
    setBusy(true)
    try {
      const res = await post({ sessionId: state.res.sessionId, answer: { slot: q.slot, value: chip.value } })
      setState({ status: 'done', res, answered: [...state.answered, label] })
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : 'Search failed' })
    } finally {
      setBusy(false)
    }
  }

  if (state.status === 'loading') return <PicksSkeleton />
  if (state.status === 'error')
    return (
      <p role="alert" className="mt-6 flex items-center gap-2 rounded-lg border border-critical/40 bg-critical-soft px-4 py-3 text-sm text-critical-fg">
        <AlertCircle className="size-4" aria-hidden /> {state.message}
      </p>
    )

  const { res } = state
  if (res.offTopic)
    return (
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-surface p-5 text-sm text-fg-muted">
        <MessageSquareOff className="mt-0.5 size-5 shrink-0 text-fg-subtle" aria-hidden />
        <p>Veritas helps you find clothing worth buying. Try describing what you need, like “soft tee for hot weather under $40”.</p>
      </div>
    )

  const i = res.intent
  const readAs = [
    i.category && (i.category === 'TOPS' ? 'Tees' : 'Jeans'),
    i.maxPrice && `Under $${i.maxPrice}`,
    i.fit && FIT_LABEL[i.fit],
    i.climate && `${i.climate[0].toUpperCase()}${i.climate.slice(1)} weather`,
    ...Object.keys(i.priorities).map((p) => `Cares about ${p.toLowerCase().replace('_', ' & ')}`),
    i.sustainability && 'Sustainable',
    ...i.terms.map((t) => `“${t}”`),
  ].filter(Boolean) as string[]

  const picks: Pick[] = res.picks.map((p) => ({ ...p, href: `/p/${p.slug}`, confidence: p.label }))

  return (
    <section aria-labelledby="picks-h" className="mt-6">
      <h2 id="picks-h" className="sr-only">
        Picks for you
      </h2>
      {readAs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-fg-subtle">
          <span>Read as</span>
          {readAs.map((c) => (
            <span key={c} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-fg-muted">
              {c}
            </span>
          ))}
        </div>
      )}

      {res.question && (
        <div className="mt-4" aria-busy={busy}>
          <ClarifyChips question={res.question.question} chips={res.question.chips.map((c) => c.label)} onAnswer={answer} />
          <p className="mt-2 text-xs text-fg-subtle">Asked only because your answer changes the best pick. The picks below are provisional.</p>
        </div>
      )}

      {picks.length > 0 ? (
        <>
          <div className={`mt-5 grid gap-4 md:grid-cols-3 ${busy ? 'opacity-60' : ''}`} role="status" aria-live="polite">
            {picks.map((p, idx) => (
              <PickCard key={`${p.role}-${p.href}`} pick={p} index={idx} />
            ))}
          </div>
          {picks.length < 3 && (
            <p className="mt-3 text-sm text-fg-muted">
              Only {picks.length} {picks.length === 1 ? 'product fits' : 'products fit'} this search{picks.some((p) => p.overBudget) ? ', including one a little over budget' : ''}.
            </p>
          )}
        </>
      ) : (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-dashed border-border-strong p-5 text-sm text-fg-muted" role="status">
          <Hourglass className="mt-0.5 size-5 shrink-0 text-fg-subtle" aria-hidden />
          <p>
            {res.unrated > 0 ? (
              <>
                {res.unrated} {res.unrated === 1 ? 'product matches' : 'products match'}, but none {res.unrated === 1 ? 'is' : 'are'} rated yet, so there are no picks. Picks
                appear once the rating agents have read the evidence.{' '}
              </>
            ) : (
              <>No products match. Try fewer words or a higher budget. </>
            )}
            <Link href="/how-it-works" className="text-accent underline underline-offset-4">
              How rating works
            </Link>
          </p>
        </div>
      )}

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

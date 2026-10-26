'use client'

import * as React from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Question, QuestionOption } from '@/lib/veritas/graph/answer-search'

const nice = (label: string) => {
  const t = label.replace(/-/g, ' ')
  return t[0].toUpperCase() + t.slice(1)
}
const isSkip = (label: string) => /^(no preference|no limit|any |not sure|skip)/i.test(label)

/**
 * The shopkeeper's question as a card: big tappable options with "how many left" counts and colour swatches,
 * number-key shortcuts, "Just show me", and the free-text box kept right below (in Conversation).
 */
export function QuestionCard({
  question,
  asked,
  max,
  busy,
  onPick,
  onShow,
  autoFocus,
}: {
  question: Question
  asked: number
  max: number
  busy: boolean
  onPick: (label: string) => void
  onShow: () => void
  autoFocus: boolean
}) {
  const [picked, setPicked] = React.useState<string | null>(null)
  const titleRef = React.useRef<HTMLHeadingElement>(null)
  const options: QuestionOption[] = question.options ?? question.chips.map((label) => ({ label, count: null }))
  const widen = question.slot === 'widen'

  React.useEffect(() => {
    if (autoFocus) titleRef.current?.focus({ preventScroll: true })
  }, [question, autoFocus])

  const choose = React.useCallback(
    (label: string) => {
      if (busy) return
      setPicked(label)
      onPick(label)
    },
    [busy, onPick],
  )

  // Number keys 1–9 pick an option (ignored while typing in a field).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || el.closest('input, textarea, [contenteditable="true"]')) return
      const n = Number(e.key)
      if (n >= 1 && n <= options.length) {
        e.preventDefault()
        choose(options[n - 1].label)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [options, choose])

  return (
    <div className="animate-rise-in border-t border-border bg-gradient-to-b from-accent-soft/60 to-surface px-4 py-5 sm:px-6" role="group" aria-labelledby="qcard-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {widen ? (
          <span className="text-xs font-medium text-fg-muted">Not many matches</span>
        ) : (
          <span className="flex items-center gap-2 text-xs font-medium text-fg-muted">
            <span className="flex gap-1" aria-hidden>
              {Array.from({ length: max }, (_, i) => (
                <span key={i} className={cn('h-1.5 w-5 rounded-full', i < asked ? 'bg-accent' : 'bg-border-strong')} />
              ))}
            </span>
            Question {asked} of {max}
          </span>
        )}
        <button type="button" onClick={onShow} disabled={busy} className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-accent hover:underline disabled:opacity-50">
          Just show me <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>

      <h3 id="qcard-title" ref={titleRef} tabIndex={-1} className="mt-3 text-lg font-semibold tracking-tight text-fg outline-none sm:text-xl">
        {question.question}
      </h3>

      <div className={cn('mt-4 grid gap-2.5', options.length <= 2 ? 'grid-cols-2' : options.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3')}>
        {options.map((o, i) => {
          const empty = o.count === 0 && !isSkip(o.label)
          const active = picked === o.label
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => choose(o.label)}
              disabled={busy || empty}
              aria-label={`${nice(o.label)}${o.count !== null ? `, ${o.count} ${o.count === 1 ? 'product' : 'products'}` : ''}`}
              className={cn(
                'group relative flex min-h-16 items-center gap-3 rounded-xl border bg-surface px-3.5 py-3 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-150 ease-out-quint',
                'hover:-translate-y-0.5 hover:border-accent hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0',
                active ? 'border-accent ring-4 ring-accent-soft' : 'border-border',
                isSkip(o.label) && 'border-dashed',
                empty && 'cursor-not-allowed opacity-45 hover:translate-y-0 hover:border-border hover:shadow-sm',
              )}
            >
              {o.swatch ? (
                <span className="size-7 shrink-0 rounded-full border border-border-strong shadow-inner" style={{ background: o.swatch }} aria-hidden />
              ) : (
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-semibold tabular text-fg-subtle group-hover:bg-accent-soft group-hover:text-accent" aria-hidden>
                  {i + 1}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-snug text-fg">{nice(o.label)}</span>
                {o.count !== null && (
                  <span className="block text-xs text-fg-subtle tabular">
                    {o.count === 0 ? 'none in stock' : `${o.count} ${o.count === 1 ? 'product' : 'products'}`}
                  </span>
                )}
              </span>
              {active && busy && <Loader2 className="size-4 shrink-0 animate-spin text-accent" aria-hidden />}
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-fg-subtle">
        <span className="hidden sm:inline">Press 1–{options.length} to choose, or </span>
        <span className="sm:hidden">Tap an option, or </span>type your own answer below.
      </p>
    </div>
  )
}

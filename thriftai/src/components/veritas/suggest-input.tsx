'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { LayoutGrid, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Suggestions } from '@/lib/veritas/match/suggest'
import { formatPrice } from './score'

type Option = { id: string; kind: 'query' | 'product' | 'collection'; label: string; href: string; meta?: string; score?: number | null }

function toOptions(s: Suggestions): Option[] {
  return [
    ...s.queries.map((q, i) => ({ id: `sq-${i}`, kind: 'query' as const, label: q, href: `/search?q=${encodeURIComponent(q)}` })),
    ...s.products.map((p) => ({ id: `sp-${p.slug}`, kind: 'product' as const, label: p.name, meta: `${p.brand} · ${formatPrice(p.price)}`, score: p.score, href: `/p/${p.slug}` })),
    ...s.collections.map((c) => ({ id: `sc-${c.slug}`, kind: 'collection' as const, label: c.title, href: `/collections/${c.slug}` })),
  ]
}

const GROUP: Record<Option['kind'], string> = { query: 'Searches', product: 'Products', collection: 'Collections' }

/**
 * Search input with autosuggest (WAI-ARIA combobox, list autocomplete). Arrow keys move, Enter opens the
 * highlighted suggestion (or submits the form as typed), Escape closes. Works without JS as a plain input.
 */
export function SuggestInput({ id, defaultValue, placeholder, className }: { id: string; defaultValue?: string; placeholder?: string; className?: string }) {
  const router = useRouter()
  const [value, setValue] = React.useState(defaultValue ?? '')
  const [options, setOptions] = React.useState<Option[]>([])
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(-1)
  const listId = `${id}-suggestions`

  React.useEffect(() => {
    const q = value.trim()
    if (q.length < 2) return // short queries show nothing (see `shown` below)
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/v1/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (j?.success) {
            setOptions(toOptions(j.data))
            setActive(-1)
          }
        })
        .catch(() => {})
    }, 120)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [value])

  // Too short a query shows no suggestions, without clearing state inside the effect.
  const shown = value.trim().length >= 2 ? options : []
  const show = open && shown.length > 0

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => (shown.length ? (a + 1) % shown.length : -1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (shown.length ? (a <= 0 ? shown.length - 1 : a - 1) : -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    } else if (e.key === 'Enter' && show && active >= 0 && shown[active]) {
      e.preventDefault()
      setOpen(false)
      router.push(shown[active].href)
    }
  }

  return (
    <div className={cn('relative min-w-0 flex-1', className)}>
      <input
        id={id}
        name="q"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={listId}
        aria-activedescendant={show && active >= 0 && shown[active] ? shown[active].id : undefined}
        className="h-11 w-full min-w-0 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle"
      />
      <ul
        id={listId}
        role="listbox"
        aria-label="Suggestions"
        hidden={!show}
        className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-96 min-w-64 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-lg"
      >
        {shown.map((o, i) => {
          const header = i === 0 || shown[i - 1].kind !== o.kind ? GROUP[o.kind] : null
          return (
            <React.Fragment key={o.id}>
              {header && (
                <li role="presentation" className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                  {header}
                </li>
              )}
              <li
                id={o.id}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault()
                  setOpen(false)
                  router.push(o.href)
                }}
                onMouseEnter={() => setActive(i)}
                className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg', i === active && 'bg-surface-2')}
              >
                {o.kind === 'query' && <Search className="size-4 shrink-0 text-fg-subtle" aria-hidden />}
                {o.kind === 'collection' && <LayoutGrid className="size-4 shrink-0 text-fg-subtle" aria-hidden />}
                {o.kind === 'product' && (
                  <span className="inline-flex h-6 min-w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft px-1 text-xs font-semibold tabular text-fg" aria-label={o.score == null ? 'Not rated' : `Score ${Math.round(o.score)}`}>
                    {o.score == null ? '—' : Math.round(o.score)}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.meta && <span className="shrink-0 text-xs text-fg-subtle">{o.meta}</span>}
              </li>
            </React.Fragment>
          )
        })}
      </ul>
    </div>
  )
}

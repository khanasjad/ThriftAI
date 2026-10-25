import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Search, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HeadsUp } from '@/lib/veritas/read/store-demo'

/** Banner on every demo-store page so nobody mistakes it for a real shop. */
export function DemoBanner() {
  return (
    <div className="border-b border-border bg-accent-soft px-4 py-2 text-center text-sm text-fg">
      Demo: a fictional store showing how a retailer can add the Veritas Score through the{' '}
      <Link href="/developers" className="font-medium text-accent underline underline-offset-4">
        Score API
      </Link>
      . Nothing is sold here.
    </div>
  )
}

export function StoreHeader({ q }: { q: string }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/demo/store" className="text-lg font-bold tracking-tight text-fg">
          cartwheel<span className="text-accent">.</span>
          <span className="ml-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">demo store</span>
        </Link>
        <form action="/demo/store" className="flex min-w-0 flex-1 items-center rounded-lg border border-border-strong bg-bg focus-within:outline-2 focus-within:outline-ring">
          <label htmlFor="store-q" className="sr-only">
            Search the store
          </label>
          <input id="store-q" name="q" defaultValue={q} placeholder="Search tees, jeans…" className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-fg outline-none placeholder:text-fg-subtle" />
          <button type="submit" aria-label="Search" className="flex h-10 w-11 items-center justify-center text-fg-muted hover:text-fg">
            <Search className="size-4" aria-hidden />
          </button>
        </form>
      </div>
    </header>
  )
}

/** The store's own star rating (average of reviews), drawn like most shops do. */
export function Stars({ value, count, size = 'sm' }: { value: number | null; count?: number; size?: 'sm' | 'md' }) {
  if (value === null) return <span className="text-xs text-fg-subtle">No ratings yet</span>
  const px = size === 'md' ? 'size-4.5' : 'size-3.5'
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`${value.toFixed(1)} out of 5 stars${count !== undefined ? `, ${count} ratings` : ''}`}>
      <span className="flex" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, value - i))
          return (
            <span key={i} className={cn('relative', px)}>
              <Star className={cn('absolute inset-0 text-border-strong', px)} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn('fill-warning text-warning', px)} />
              </span>
            </span>
          )
        })}
      </span>
      <span className={cn('tabular text-fg-muted', size === 'md' ? 'text-sm' : 'text-xs')}>
        {value.toFixed(1)} {count !== undefined && <span className="text-fg-subtle">({count})</span>}
      </span>
    </span>
  )
}

export function HeadsUpList({ items, className }: { items: HeadsUp[]; className?: string }) {
  if (!items.length) return null
  return (
    <ul className={cn('flex flex-col gap-1.5', className)}>
      {items.map((h) => (
        <li key={h.text} className="flex items-start gap-1.5 text-xs leading-snug text-fg-muted">
          {h.tone === 'warn' ? (
            <AlertTriangle className="mt-px size-3.5 shrink-0 text-warning" aria-label="Heads-up" />
          ) : (
            <CheckCircle2 className="mt-px size-3.5 shrink-0 text-good" aria-label="Good sign" />
          )}
          <span>{h.text}</span>
        </li>
      ))}
    </ul>
  )
}

'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReviewCard } from '@/components/veritas/review-card'
import type { ProductReview } from '@/lib/veritas/read/catalog'

const PAGE = 20

/** Loads further reviews on demand so the first page load stays small. */
export function MoreReviews({ productId, offset, total }: { productId: string; offset: number; total: number }) {
  const [items, setItems] = React.useState<ProductReview[]>([])
  const [state, setState] = React.useState<'idle' | 'loading' | 'error'>('idle')
  const shown = offset + items.length
  const remaining = total - shown

  async function load() {
    setState('loading')
    try {
      const res = await fetch(`/api/v1/products/${encodeURIComponent(productId)}/reviews?offset=${shown}&limit=${PAGE}`)
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error()
      setItems((xs) => [...xs, ...json.data.reviews])
      setState('idle')
    } catch {
      setState('error')
    }
  }

  return (
    <>
      {items.length > 0 && (
        <div className="divide-y divide-border border-t border-border pt-5">
          {items.map((r) => (
            <ReviewCard key={r.id} r={r} />
          ))}
        </div>
      )}
      {remaining > 0 && (
        <div className="mt-2 flex items-center gap-3 border-t border-border pt-4">
          <Button variant="secondary" size="sm" onClick={load} disabled={state === 'loading'}>
            {state === 'loading' ? 'Loading…' : `Show ${Math.min(PAGE, remaining)} more reviews`}
            <ChevronDown aria-hidden />
          </Button>
          <span className="text-xs text-fg-subtle tabular" role="status">
            {state === 'error' ? 'Couldn’t load reviews. Try again.' : `${shown} of ${total} shown`}
          </span>
        </div>
      )}
    </>
  )
}

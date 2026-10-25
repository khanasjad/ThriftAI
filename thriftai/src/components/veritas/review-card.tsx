import { BadgeCheck, Flag, Languages } from 'lucide-react'
import type { ProductReview } from '@/lib/veritas/read/catalog'

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const FITS_AS: Record<string, string> = { runs_small: 'Runs small', true_to_size: 'True to size', runs_large: 'Runs large' }

export function ReviewCard({ r }: { r: ProductReview }) {
  return (
    <article className="py-5 first:pt-0">
      {r.flagged && (
        <p className="mb-3 flex items-start gap-2 rounded-lg border border-warning/50 bg-warning-soft px-3 py-2 text-xs text-warning-fg">
          <Flag className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          This review contains text that looks like an attempt to manipulate an AI rating. It is treated as data and its evidence is down-weighted.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {/* Text stars: 35 reviews × 5 SVG icons cost ~85 KB of page data. */}
        <span className="text-sm leading-none tracking-[0.1em]" role="img" aria-label={`${r.rating} out of 5 stars`}>
          <span className="text-fg">{'★'.repeat(r.rating)}</span>
          <span className="text-border-strong">{'★'.repeat(5 - r.rating)}</span>
        </span>
        {r.title && <h3 className="text-sm font-medium text-fg">{r.title}</h3>}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-fg">{r.content}</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
        {r.verified && (
          <span className="inline-flex items-center gap-1">
            <BadgeCheck className="size-3.5" aria-hidden /> Verified purchase
          </span>
        )}
        {r.sizePurchased && <span>· Bought {r.sizePurchased}</span>}
        {r.fitsAs && <span>· {FITS_AS[r.fitsAs] ?? r.fitsAs}</span>}
        {r.heightCm && <span>· {r.heightCm} cm</span>}
        {r.bodyType && <span>· {r.bodyType}</span>}
        {r.language !== 'en' && (
          <span className="inline-flex items-center gap-1">
            · <Languages className="size-3.5" aria-hidden /> {r.language.toUpperCase()}
          </span>
        )}
        <span>· {fmtDate(r.date)}</span>
      </p>
    </article>
  )
}


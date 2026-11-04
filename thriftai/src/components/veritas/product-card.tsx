import Link from 'next/link'
import { MessageSquareText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScoreRing } from './score-ring'
import { CONFIDENCE, formatPrice, type ConfidenceLabel } from './score'
import { ProductThumb } from './product-thumb'
import { TagChips } from './tag-chips'
import { topTags, type Tag } from '@/lib/veritas/enrich/tags'
import type { Photo } from './photo'
import { gradeText, type Grade } from './grade'

export type ProductCardData = {
  slug: string
  name: string
  brand: string
  category: string
  subcategory: string | null
  silhouette?: string | null
  color?: string | null
  pattern?: string | null
  /** A real photo (vendor or licensed); null → drawn illustration. */
  photo?: Photo | null
  /** Null when the source has no price. */
  price: number | null
  currency: string
  reviewCount: number
  score: number | null
  confidenceLabel: ConfidenceLabel | null
  isNewLaunch: boolean
  /** Only the viewer's organisation sees it. */
  isPrivate?: boolean
  openData?: boolean
  /** Expert grades of a second-hand item (shown when there is no score). */
  grade?: Grade | null
  tags?: Tag[]
}

/** Catalog card. Score first, price second, brand last (product plan design principles). */
export function ProductCard({ item, className }: { item: ProductCardData; className?: string }) {
  return (
    <Link
      href={`/p/${item.slug}`}
      className={cn(
        'group flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm transition-[box-shadow,transform,border-color] duration-200 ease-out-quint hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md',
        className,
      )}
    >
      <div className="relative">
        <ProductThumb category={item.category} subcategory={item.subcategory} silhouette={item.silhouette} color={item.color} pattern={item.pattern} photo={item.photo} label={item.name} />
        {item.score === null && item.grade?.condition ? (
          <div className="absolute right-2 top-2 rounded-lg bg-surface/90 px-2 py-1 text-center shadow-sm backdrop-blur">
            <div className="text-sm font-semibold leading-none tabular text-fg">
              {item.grade.condition}
              <span className="text-xs font-normal text-fg-subtle">/5</span>
            </div>
            <div className="mt-0.5 text-[10px] leading-none text-fg-muted">Condition</div>
          </div>
        ) : (
          <div className="absolute right-2 top-2 rounded-full bg-surface/90 p-0.5 shadow-sm backdrop-blur">
            <ScoreRing score={item.score} size="sm" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col px-1 pb-1">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-fg group-hover:underline group-hover:underline-offset-4">{item.name}</h3>
        <p className="mt-1 text-xs text-fg-subtle">
          {item.score === null ? (item.grade ? `Expert-graded · ${gradeText(item.grade)}` : item.reviewCount === 0 ? 'No reviews yet' : 'Not rated yet') : CONFIDENCE[item.confidenceLabel ?? 'LOW'].label}
          {item.isNewLaunch && ' · New launch'}
          {item.openData ? ' · Open data' : item.isPrivate && ' · Private'}
        </p>
        {item.tags && item.tags.length > 0 && <TagChips tags={topTags(item.tags, 2)} className="mt-2" />}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-sm">
          {item.price === null ? <span className="text-xs text-fg-subtle">No price</span> : <span className="font-semibold tabular text-fg">{formatPrice(item.price, item.currency)}</span>}
          <span className="inline-flex items-center gap-1 text-xs text-fg-subtle tabular">
            <MessageSquareText className="size-3.5" aria-hidden />
            {item.reviewCount}
            <span className="sr-only">reviews</span>
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-fg-muted">{item.brand}</p>
      </div>
    </Link>
  )
}

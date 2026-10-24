import { cn } from '@/lib/utils'

/**
 * Neutral generated placeholder for dev products (frontend plan §3: no stock photos).
 * Draws a simple garment silhouette so the card reads as "a tee" or "jeans", never a fake photo.
 */
const TEE = 'M34 18 46 12c3 6 9 9 14 9s11-3 14-9l12 6 16 14-10 14-10-6v62H38V40l-10 6-10-14z'
const JEANS = 'M38 14h44l6 104H68l-8-62-8 62H32z'
const GENERIC = 'M40 16h40l10 20-10 6v76H40V42l-10-6z'

function shapeFor(category: string, subcategory?: string | null) {
  const s = (subcategory ?? '').toLowerCase()
  if (s.includes('jean') || s.includes('denim') || category === 'BOTTOMS') return JEANS
  if (s.includes('tee') || category === 'TOPS') return TEE
  return GENERIC
}

export function ProductThumb({
  category,
  subcategory,
  label,
  className,
}: {
  category: string
  subcategory?: string | null
  /** Accessible name, e.g. the product name. Omit when the image is decorative. */
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn('relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-surface-2', className)}
      role={label ? 'img' : undefined}
      aria-label={label ? `${label} (placeholder image)` : undefined}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 120 132" className="h-3/5 w-3/5">
        <path d={shapeFor(category, subcategory)} fill="var(--surface-3)" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span className="absolute bottom-2 left-2 rounded bg-surface/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-fg-subtle">
        Test item
      </span>
    </div>
  )
}

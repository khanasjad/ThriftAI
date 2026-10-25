import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tag } from '@/lib/veritas/enrich/tags'

/**
 * Enrichment tags. Icon + word carry the tone (never colour alone).
 * `detailed` shows the numbers behind each tag under its label (product page); cards show labels only.
 */
export function TagChips({ tags, detailed = false, className }: { tags: Tag[]; detailed?: boolean; className?: string }) {
  if (!tags.length) return null
  return (
    <ul className={cn(detailed ? 'grid gap-2 sm:grid-cols-2' : 'flex flex-wrap gap-1.5', className)} aria-label="Highlights">
      {tags.map((t) => (
        <li
          key={t.key}
          className={cn(
            'flex items-start gap-1.5 rounded-md border',
            detailed ? 'px-3 py-2' : 'px-1.5 py-0.5',
            t.tone === 'warn' ? 'border-warning/40 bg-warning-soft' : 'border-good/30 bg-good-soft',
          )}
        >
          {t.tone === 'warn' ? (
            <AlertTriangle className={cn('shrink-0 text-warning-fg', detailed ? 'mt-0.5 size-4' : 'mt-px size-3')} aria-label="Heads-up:" />
          ) : (
            <CheckCircle2 className={cn('shrink-0 text-good-fg', detailed ? 'mt-0.5 size-4' : 'mt-px size-3')} aria-label="Good sign:" />
          )}
          <span className="min-w-0">
            <span className={cn('block font-medium text-fg', detailed ? 'text-sm' : 'text-[11px] leading-4')}>{t.label}</span>
            {detailed && <span className="block text-xs text-fg-muted">{t.detail}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

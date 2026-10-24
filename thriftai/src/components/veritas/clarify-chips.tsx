'use client'

import { MessageCircleQuestion } from 'lucide-react'
import { cn } from '@/lib/utils'

/** One clarifying question with tap-to-answer chips (product plan: at most one per turn). */
export function ClarifyChips({
  question,
  chips,
  value,
  onAnswer,
}: {
  question: string
  chips: string[]
  value?: string | null
  onAnswer: (chip: string) => void
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <p className="flex items-start gap-2 text-sm font-medium text-fg" id="clarify-q">
        <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        {question}
      </p>
      <div role="radiogroup" aria-labelledby="clarify-q" className="mt-3 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={value === c}
            onClick={() => onAnswer(c)}
            className={cn(
              'h-9 rounded-full border px-4 text-sm transition-colors',
              value === c ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface text-fg hover:border-border-strong hover:bg-surface-2',
            )}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}

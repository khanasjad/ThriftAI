'use client'

import * as React from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyText({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = React.useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => {})
        setDone(true)
        setTimeout(() => setDone(false), 1500)
      }}
      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-fg-muted hover:text-fg"
    >
      {done ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {done ? 'Copied' : label}
    </button>
  )
}

'use client'

import * as React from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = React.useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        } catch {}
      }}
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg [&_svg]:size-3.5"
      aria-label={done ? 'Copied' : label}
    >
      {done ? <Check aria-hidden /> : <Copy aria-hidden />}
      {done ? 'Copied' : 'Copy'}
    </button>
  )
}

'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg hover:opacity-90 print:hidden">
      <Printer className="size-4" aria-hidden /> Print or save as PDF
    </button>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/admin/runs', label: 'Runs' },
  { href: '/admin/spend', label: 'Spend' },
  { href: '/admin/evals', label: 'Evals' },
  { href: '/admin/pilots', label: 'Pilots' },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin" className="inline-flex rounded-lg border border-border bg-surface p-1 shadow-sm">
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={cn('rounded-md px-4 py-1.5 text-sm transition-colors', active ? 'bg-surface-3 font-medium text-fg' : 'text-fg-muted hover:text-fg')}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTitle, SheetContent } from '@/components/ui/dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

/** Mobile navigation sheet. Loaded on first open (see SiteHeader). */
export default function MobileMenu({
  open,
  onOpenChange,
  nav,
  isActive,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  nav: { href: string; label: string }[]
  isActive: (href: string) => boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <DialogTitle className="px-5 pt-5 text-base">Menu</DialogTitle>
        <nav aria-label="Mobile" className="flex flex-col gap-1 p-3">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => onOpenChange(false)}
              aria-current={isActive(n.href) ? 'page' : undefined}
              className={cn('flex h-12 items-center rounded-md px-3 text-base', isActive(n.href) ? 'bg-surface-2 font-medium text-fg' : 'text-fg-muted hover:bg-surface-2')}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border p-5">
          <ThemeToggle />
          <Button asChild size="md">
            <Link href="/pilot" onClick={() => onOpenChange(false)}>
              Free pilot scorecard
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Dialog>
  )
}

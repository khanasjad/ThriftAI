import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Veritas mark: a ring with a check-shaped gap, echoing the score ring. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-6', className)} aria-hidden>
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="var(--score-track)" strokeWidth="3" />
      <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      <path d="m8 12.2 2.7 2.7L16.2 9.4" fill="none" stroke="var(--fg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('inline-flex items-center gap-2 rounded-md text-fg', className)} aria-label="Veritas home">
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight">Veritas</span>
    </Link>
  )
}

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteShell } from '@/components/site/shell'

/** Route-level error boundary: keeps the site chrome, offers a retry, never shows internals. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('route error', error.digest ?? '', error)
  }, [error])

  return (
    <SiteShell>
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center" role="alert">
        <p className="text-sm font-medium text-accent">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fg">This page didn’t load</h1>
        <p className="mt-3 text-fg-muted">It’s on our side, not yours. Try again, or head back to search.</p>
        {error.digest && <p className="mt-2 font-mono text-xs text-fg-subtle">Reference: {error.digest}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>
            <RotateCcw /> Try again
          </Button>
          <Button asChild variant="secondary">
            <Link href="/search">Go to search</Link>
          </Button>
        </div>
      </div>
    </SiteShell>
  )
}

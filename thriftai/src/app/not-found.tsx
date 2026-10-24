import Link from 'next/link'
import { SiteShell } from '@/components/site/shell'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
        <p className="text-sm font-medium text-accent">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fg">Page not found</h1>
        <p className="mt-3 text-fg-muted">The link may be broken, or the page has moved.</p>
        <Button asChild className="mt-8">
          <Link href="/search">Search the catalog</Link>
        </Button>
      </div>
    </SiteShell>
  )
}

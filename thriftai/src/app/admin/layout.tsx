import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteShell } from '@/components/site/shell'
import { AdminNav } from './admin-nav'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Admin · Veritas' }, robots: { index: false } }

// Dev-only until sign-in and roles land (B7). 404 in production.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (process.env.APP_ENV === 'production') notFound()
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Admin · development only</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">Agent harness</h1>
          </div>
          <AdminNav />
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </SiteShell>
  )
}

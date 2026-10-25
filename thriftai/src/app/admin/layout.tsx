import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/shell'
import { AdminNav } from './admin-nav'
import { requirePageRole } from '@/lib/veritas/authz'
import { SignOutButton } from '@/components/site/sign-out'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Admin · Veritas' }, robots: { index: false } }

// Admins only (middleware + this check).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole(['ADMIN'], '/admin')
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
              Admin · {user.email} · <SignOutButton />
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">Agent harness</h1>
          </div>
          <AdminNav />
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </SiteShell>
  )
}

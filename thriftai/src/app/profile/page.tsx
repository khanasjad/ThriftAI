import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/shell'
import { listBrands } from '@/lib/veritas/read/catalog'
import { ProfileForm } from './profile-form'

export const metadata: Metadata = { title: 'Your fit profile', description: 'Optional details that make Personal Match more accurate. Deletable in one click.' }
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const brands = await listBrands()
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6">
        <p className="text-sm font-medium text-accent">Personal Match</p>
        <h1 className="mt-2 text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.025em] text-fg">Your fit profile</h1>
        <p className="mt-3 max-w-2xl text-fg-muted">
          Everything here is optional. Veritas uses it to match you with owners of a similar build and to respect your budget and taste. It is stored for this
          browser only, never shared, and you can delete it in one click.
        </p>
        <ProfileForm brands={brands.map((b) => ({ slug: b.slug, name: b.name }))} />
      </div>
    </SiteShell>
  )
}

'use client'

import { useRouter } from 'next/navigation'

/** Admins only: pick which brand's dashboard to view. */
export function BrandSwitcher({ brands, current }: { brands: { slug: string; name: string }[]; current: string }) {
  const router = useRouter()
  return (
    <label className="flex items-center gap-2 text-sm text-fg-muted">
      <span>Viewing</span>
      <select
        value={current}
        onChange={(e) => router.push(`/dashboard?brand=${e.target.value}`)}
        className="h-9 rounded-md border border-border bg-surface px-2 text-sm text-fg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {brands.map((b) => (
          <option key={b.slug} value={b.slug}>
            {b.name}
          </option>
        ))}
      </select>
    </label>
  )
}

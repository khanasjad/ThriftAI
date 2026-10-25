import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SiteShell } from '@/components/site/shell'
import { ProductThumb } from '@/components/veritas/product-thumb'
import { loadCollections } from '@/lib/veritas/read/collections'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Collections',
  description: 'Curated by rules over the evidence, ranked by Veritas Score. Nobody pays to be included.',
  alternates: { canonical: '/collections' },
}

export default async function CollectionsPage() {
  const all = await loadCollections()
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.025em] text-fg">Collections</h1>
        <p className="mt-2 max-w-2xl text-fg-muted">
          Each collection is a rule over the evidence (for example “owners say it holds up in the wash”), ranked by Veritas Score. Every item shows the fact that got it in.
          Nobody pays to be included.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {all.map(({ def, items }) => (
            <li key={def.slug}>
              <Link
                href={`/collections/${def.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition-[box-shadow,border-color] hover:border-border-strong hover:shadow-md"
              >
                <div className="grid grid-cols-3 gap-2" aria-hidden>
                  {[0, 1, 2].map((i) =>
                    items[i] ? (
                      <ProductThumb key={i} category={items[i].item.category} subcategory={items[i].item.subcategory} silhouette={items[i].item.silhouette} color={items[i].item.color} pattern={items[i].item.pattern} showTag={false} />
                    ) : (
                      <div key={i} className="aspect-[4/5] rounded-lg bg-surface-2" />
                    ),
                  )}
                </div>
                <h2 className="mt-4 text-base font-semibold text-fg group-hover:underline group-hover:underline-offset-4">{def.title}</h2>
                <p className="mt-1 flex-1 text-sm text-fg-muted">{def.blurb}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                  {items.length} {items.length === 1 ? 'product' : 'products'} <ArrowRight className="size-4" aria-hidden />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </SiteShell>
  )
}

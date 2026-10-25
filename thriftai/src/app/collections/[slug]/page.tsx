import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, ListChecks } from 'lucide-react'
import { SiteShell } from '@/components/site/shell'
import { ProductCard } from '@/components/veritas/product-card'
import { collectionBySlug, loadCollection } from '@/lib/veritas/read/collections'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const def = collectionBySlug((await params).slug)
  if (!def) notFound()
  return { title: def.title, description: def.blurb, alternates: { canonical: `/collections/${def.slug}` } }
}

export default async function CollectionPage({ params }: Props) {
  const def = collectionBySlug((await params).slug)
  if (!def) notFound()
  const { items } = await loadCollection(def)
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-fg-subtle">
          <Link href="/collections" className="hover:text-fg">
            Collections
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="truncate text-fg-muted" aria-current="page">
            {def.title}
          </span>
        </nav>
        <h1 className="mt-4 text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.025em] text-fg">{def.title}</h1>
        <p className="mt-2 max-w-2xl text-fg-muted">{def.blurb}</p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-fg-muted">
          <ListChecks className="size-4 text-fg-subtle" aria-hidden />
          Chosen by a rule over the evidence, ranked by Veritas Score. Nobody pays to be included.
        </p>

        {items.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-border-strong p-8 text-center text-fg-muted">
            Nothing qualifies yet. Products join as evidence comes in.
          </p>
        ) : (
          <ol className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map(({ item, why }, i) => (
              <li key={item.slug} className="flex flex-col gap-2">
                <p className="text-xs text-fg-muted">
                  <span className="font-semibold tabular text-fg">#{i + 1}</span> · {why}
                </p>
                <ProductCard item={item} className="h-full" />
              </li>
            ))}
          </ol>
        )}
      </div>
    </SiteShell>
  )
}

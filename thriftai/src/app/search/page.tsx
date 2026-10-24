import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Info, Search, SearchX } from 'lucide-react'
import type { ClothingCategory } from '@prisma/client'
import { SiteShell } from '@/components/site/shell'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/veritas/product-card'
import { Skeleton } from '@/components/ui/primitives'
import { searchCatalog } from '@/lib/veritas/read/catalog'
import { cn } from '@/lib/utils'
import { SortSelect } from './controls'

export const metadata: Metadata = { title: 'Search', description: 'Search clothing by what matters: fit, quality, comfort, value.' }
export const dynamic = 'force-dynamic'

const CATEGORIES: { value?: ClothingCategory; label: string }[] = [
  { label: 'All' },
  { value: 'TOPS', label: 'Tees' },
  { value: 'BOTTOMS', label: 'Jeans' },
]
const SORTS = ['score', 'reviews', 'price_asc', 'price_desc', 'newest'] as const
type Sort = (typeof SORTS)[number]

type Params = { q?: string; category?: string; sort?: string }

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams
  const q = (sp.q ?? '').slice(0, 200)
  const category = CATEGORIES.find((c) => c.value === sp.category)?.value
  const sort: Sort = (SORTS as readonly string[]).includes(sp.sort ?? '') ? (sp.sort as Sort) : 'score'

  const href = (patch: Partial<Params>) => {
    const p = new URLSearchParams()
    const merged = { q, category, sort: sort === 'score' ? undefined : sort, ...patch }
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
    const s = p.toString()
    return s ? `/search?${s}` : '/search'
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.025em] text-fg">Search</h1>

        <form action="/search" method="get" role="search" className="mt-6">
          {category && <input type="hidden" name="category" value={category} />}
          {sort !== 'score' && <input type="hidden" name="sort" value={sort} />}
          <label htmlFor="q" className="sr-only">
            Search clothing
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-border-strong bg-surface p-1.5 shadow-sm focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
            <Search className="ml-2.5 size-5 shrink-0 text-fg-subtle" aria-hidden />
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Try “relaxed jeans”, “organic cotton tee”, “black”"
              autoComplete="off"
              className="h-11 min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle"
            />
            <Button type="submit">Search</Button>
          </div>
        </form>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-fg-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
          <p>
            Keyword search over the test catalog. Conversational search with one clarifying question and three picks arrives with the search agents. Products
            show a score once the rating agents have read their evidence.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Category" className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = c.value === category
              return (
                <Link
                  key={c.label}
                  href={href({ category: c.value })}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-9 items-center rounded-full border px-4 text-sm transition-colors',
                    active ? 'border-fg bg-fg text-bg' : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg',
                  )}
                >
                  {c.label}
                </Link>
              )
            })}
          </nav>
          <SortSelect value={sort} />
        </div>

        <Suspense key={`${q}|${category}|${sort}`} fallback={<ResultsSkeleton />}>
          <Results q={q} category={category} sort={sort} clearHref={href({ q: undefined })} />
        </Suspense>
      </div>
    </SiteShell>
  )
}

async function Results({ q, category, sort, clearHref }: { q: string; category?: ClothingCategory; sort: Sort; clearHref: string }) {
  const { items, interpreted } = await searchCatalog({ q, category, sort })
  const chips = [
    interpreted.category && (interpreted.category === 'TOPS' ? 'Tees' : 'Jeans'),
    interpreted.maxPrice && `Under $${interpreted.maxPrice}`,
    ...interpreted.terms.map((t) => `“${t}”`),
  ].filter(Boolean) as string[]

  if (items.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center rounded-2xl border border-dashed border-border-strong px-6 py-16 text-center">
        <SearchX className="size-8 text-fg-subtle" aria-hidden />
        <h2 className="mt-4 text-lg font-semibold text-fg">No matches{q && <> for “{q}”</>}</h2>
        <p className="mt-2 max-w-md text-sm text-fg-muted">The test catalog has tees and jeans only. Try a colour, a fit like “relaxed”, a higher budget, or a brand name.</p>
        <Button asChild variant="secondary" className="mt-6">
          <Link href={clearHref}>Clear search</Link>
        </Button>
      </div>
    )
  }
  return (
    <section aria-label="Results" className="mt-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-fg-subtle" role="status">
        <span>
          {items.length} {items.length === 1 ? 'product' : 'products'}
        </span>
        {chips.length > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>Read as</span>
            {chips.map((c) => (
              <span key={c} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-fg-muted">
                {c}
              </span>
            ))}
          </>
        )}
      </div>
      {!interpreted.matchedAny && (
        <p className="mt-2 text-sm text-fg-muted">No product or review mentions those words, so here is everything that fits the category and budget.</p>
      )}
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((it) => (
          <li key={it.slug}>
            <ProductCard item={it} className="h-full" />
          </li>
        ))}
      </ul>
    </section>
  )
}

function ResultsSkeleton() {
  return (
    <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-3">
          <Skeleton className="aspect-[4/5] w-full rounded-lg" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Info, Search, SearchX } from 'lucide-react'
import type { ClothingCategory } from '@prisma/client'
import { SiteShell } from '@/components/site/shell'
import { SuggestInput } from '@/components/veritas/suggest-input'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/veritas/product-card'
import { Skeleton } from '@/components/ui/primitives'
import { searchCatalog, type CatalogFilters, type CatalogFacets } from '@/lib/veritas/read/catalog'
import { swatchFor } from '@/components/veritas/colors'
import { cn } from '@/lib/utils'
import { SortSelect } from './controls'
import { Conversation } from './conversation'
import { warmVisual } from '@/lib/veritas/visual/store'

export const metadata: Metadata = { title: 'Search', description: 'Search clothing by what matters: fit, quality, comfort, value.' }
export const dynamic = 'force-dynamic'

const KINDS: { value?: 'tee' | 'shirt' | 'jeans'; label: string }[] = [
  { label: 'All' },
  { value: 'tee', label: 'T-shirts' },
  { value: 'shirt', label: 'Shirts' },
  { value: 'jeans', label: 'Jeans' },
]
const SORTS = ['score', 'reviews', 'price_asc', 'price_desc', 'newest'] as const
type Sort = (typeof SORTS)[number]

type Params = { warm?: string; q?: string; kind?: string; category?: string; sort?: string; gender?: string; color?: string; fit?: string; min?: string; tag?: string }

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams
  // Warm-up ping from the search box: load the fashion model on this server instance, render nothing.
  if (sp.warm === '1') {
    warmVisual()
    return null
  }
  const q = (sp.q ?? '').slice(0, 200)
  const kind = KINDS.find((c) => c.value === sp.kind)?.value
  // Old links used ?category=TOPS|BOTTOMS; still honoured.
  const category = sp.category === 'TOPS' || sp.category === 'BOTTOMS' ? (sp.category as ClothingCategory) : undefined
  const sort: Sort = (SORTS as readonly string[]).includes(sp.sort ?? '') ? (sp.sort as Sort) : 'score'
  const filters: CatalogFilters = {
    gender: sp.gender === 'MENS' || sp.gender === 'WOMENS' ? sp.gender : undefined,
    color: sp.color?.slice(0, 40) || undefined,
    fit: sp.fit?.slice(0, 20) || undefined,
    minScore: sp.min && /^\d{1,2}$/.test(sp.min) ? Number(sp.min) : undefined,
    tag: sp.tag?.slice(0, 60) || undefined,
  }

  const href = (patch: Partial<Params>) => {
    const p = new URLSearchParams()
    const merged = { q, kind, category, sort: sort === 'score' ? undefined : sort, gender: filters.gender, color: filters.color, fit: filters.fit, min: filters.minScore?.toString(), tag: filters.tag, ...patch }
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
    const s = p.toString()
    return s ? `/search?${s}` : '/search'
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.025em] text-fg">Search</h1>

        <form action="/search" method="get" role="search" className="mt-6">
          {kind && <input type="hidden" name="kind" value={kind} />}
          {category && <input type="hidden" name="category" value={category} />}
          {sort !== 'score' && <input type="hidden" name="sort" value={sort} />}
          <label htmlFor="q" className="sr-only">
            Search clothing
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-border-strong bg-surface p-1.5 shadow-sm focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
            <Search className="ml-2.5 size-5 shrink-0 text-fg-subtle" aria-hidden />
            <SuggestInput id="q" defaultValue={q} placeholder="Try “relaxed jeans”, “organic cotton tee”, “black”" />
            <Button type="submit">Search</Button>
          </div>
        </form>

        {q ? (
          <Conversation key={q} query={q} />
        ) : (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-fg-muted">
            <Info className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
            <p>Describe what you need in your own words. The shopkeeper asks up to four quick questions (skip any time), then shows three picks with the reasons.</p>
          </div>
        )}

        <h2 className="mt-12 text-lg font-semibold text-fg">{q ? 'All matching products' : 'Browse the catalog'}</h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Product type" className="flex flex-wrap gap-2">
            {KINDS.map((c) => {
              const active = c.value === kind
              return (
                <Link
                  key={c.label}
                  href={href({ kind: c.value, category: undefined })}
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

        <Suspense key={`${q}|${kind}|${category}|${sort}|${JSON.stringify(filters)}`} fallback={<ResultsSkeleton />}>
          <Results q={q} kind={kind} category={category} sort={sort} filters={filters} href={href} clearHref={href({ q: undefined, gender: undefined, color: undefined, fit: undefined, min: undefined, tag: undefined })} />
        </Suspense>
      </div>
    </SiteShell>
  )
}

async function Results({
  q,
  kind,
  category,
  sort,
  filters,
  href,
  clearHref,
}: {
  q: string
  kind?: 'tee' | 'shirt' | 'jeans'
  category?: ClothingCategory
  sort: Sort
  filters: CatalogFilters
  href: (patch: Partial<Params>) => string
  clearHref: string
}) {
  const { items, interpreted, facets } = await searchCatalog({ q, kind, category, sort, ...filters })
  const filterBar = <FilterBar facets={facets} filters={filters} href={href} />
  const chips = [
    interpreted.kind ? ({ tee: 'T-shirts', shirt: 'Shirts', jeans: 'Jeans' } as const)[interpreted.kind] : interpreted.category && (interpreted.category === 'TOPS' ? 'Tops' : 'Jeans'),
    interpreted.maxPrice && `Under $${interpreted.maxPrice}`,
    ...interpreted.colors.map((c) => c[0].toUpperCase() + c.slice(1)),
    ...interpreted.patterns.map((p) => `${p[0].toUpperCase()}${p.slice(1)} (from photos)`),
    ...(interpreted.prints?.length ? [`Print: ${interpreted.prints.join(' ')}`] : []),
    ...(interpreted.looks?.filter((t) => !interpreted.prints?.includes(t)).length ? [`Looks like: ${interpreted.looks.filter((t) => !interpreted.prints?.includes(t)).join(' ')} (from photos)`] : []),
    ...interpreted.terms.filter((t) => !interpreted.prints?.includes(t) && !interpreted.looks?.includes(t)).map((t) => `“${t}”`),
  ].filter(Boolean) as string[]

  if (items.length === 0) {
    return (
      <>
      {filterBar}
      <div className="mt-12 flex flex-col items-center rounded-2xl border border-dashed border-border-strong px-6 py-16 text-center">
        <SearchX className="size-8 text-fg-subtle" aria-hidden />
        <h3 className="mt-4 text-lg font-semibold text-fg">No matches{q && <> for “{q}”</>}</h3>
        <p className="mt-2 max-w-md text-sm text-fg-muted">The test catalog has t-shirts, shirts and jeans. Try a colour, a fit like “relaxed”, a higher budget, or a brand name.</p>
        <Button asChild variant="secondary" className="mt-6">
          <Link href={clearHref}>Clear search and filters</Link>
        </Button>
      </div>
      </>
    )
  }
  return (
    <section aria-labelledby="results-h" className="mt-4">
      {filterBar}
      <h3 id="results-h" className="sr-only">
        Results
      </h3>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-fg-subtle" role="status">
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

const FIT_LABEL: Record<string, string> = { slim: 'Slim', regular: 'Regular', relaxed: 'Relaxed', oversized: 'Oversized' }

/** Browse filters as links (URL-driven, server-rendered). Choosing an active option again clears it. */
function FilterBar({ facets, filters, href }: { facets: CatalogFacets; filters: CatalogFilters; href: (patch: Partial<Params>) => string }) {
  const chip = (active: boolean) =>
    cn(
      'inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors',
      active ? 'border-accent bg-accent-soft font-medium text-fg' : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg',
    )
  const any = filters.gender || filters.color || filters.fit || filters.minScore !== undefined || filters.tag
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:p-4" aria-label="Filters" role="group">
      <FilterRow label="For">
        {facets.genders.map((g) => (
          <Link key={g.value} href={href({ gender: filters.gender === g.value ? undefined : g.value })} aria-current={filters.gender === g.value ? 'true' : undefined} className={chip(filters.gender === g.value)}>
            {g.value === 'MENS' ? 'Men' : 'Women'} <span className="tabular text-fg-subtle">{g.count}</span>
          </Link>
        ))}
        <Link href={href({ min: filters.minScore === 70 ? undefined : '70' })} aria-current={filters.minScore === 70 ? 'true' : undefined} className={chip(filters.minScore === 70)}>
          Score 70+
        </Link>
      </FilterRow>
      <FilterRow label="Colour">
        {facets.colors.map((c) => {
          const active = filters.color?.toLowerCase() === c.value.toLowerCase()
          return (
            <Link key={c.value} href={href({ color: active ? undefined : c.value })} aria-current={active ? 'true' : undefined} className={chip(active)}>
              <span className="size-3.5 rounded-full border border-border-strong" style={{ background: swatchFor(c.value) ?? 'var(--surface-3)' }} aria-hidden />
              {c.value}
            </Link>
          )
        })}
      </FilterRow>
      <FilterRow label="Fit">
        {facets.fits.map((f) => (
          <Link key={f.value} href={href({ fit: filters.fit === f.value ? undefined : f.value })} aria-current={filters.fit === f.value ? 'true' : undefined} className={chip(filters.fit === f.value)}>
            {FIT_LABEL[f.value] ?? f.value} <span className="tabular text-fg-subtle">{f.count}</span>
          </Link>
        ))}
      </FilterRow>
      {facets.tags.length > 0 && (
        <FilterRow label="Proven">
          {facets.tags.map((t) => (
            <Link key={t.key} href={href({ tag: filters.tag === t.key ? undefined : t.key })} aria-current={filters.tag === t.key ? 'true' : undefined} className={chip(filters.tag === t.key)}>
              {t.label} <span className="tabular text-fg-subtle">{t.count}</span>
            </Link>
          ))}
        </FilterRow>
      )}
      {any && (
        <Link href={href({ gender: undefined, color: undefined, fit: undefined, min: undefined, tag: undefined })} className="self-start text-xs font-medium text-accent underline underline-offset-4">
          Clear filters
        </Link>
      )}
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-14 shrink-0 text-xs font-medium text-fg-subtle">{label}</span>
      {children}
    </div>
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

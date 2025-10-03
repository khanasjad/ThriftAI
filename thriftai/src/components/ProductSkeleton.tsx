'use client'

export default function ProductSkeleton({ viewMode = 'grid' }: { viewMode?: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="product-card-list animate-pulse">
        <div className="product-image-container bg-[var(--bg-tertiary)] rounded-lg" />
        <div className="product-info-container space-y-3">
          <div className="h-4 bg-[var(--bg-tertiary)] rounded w-24" />
          <div className="h-6 bg-[var(--bg-tertiary)] rounded w-3/4" />
          <div className="flex gap-2">
            <div className="h-6 bg-[var(--bg-tertiary)] rounded w-16" />
            <div className="h-6 bg-[var(--bg-tertiary)] rounded w-20" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-8 bg-[var(--bg-tertiary)] rounded w-24" />
            <div className="h-10 bg-[var(--bg-tertiary)] rounded w-32" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="product-card-modern animate-pulse">
      <div className="product-image-container bg-[var(--bg-tertiary)] rounded-lg" />
      <div className="product-info-container space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-[var(--bg-tertiary)] rounded w-20" />
          <div className="h-4 bg-[var(--bg-tertiary)] rounded w-16" />
        </div>
        <div className="h-5 bg-[var(--bg-tertiary)] rounded w-full" />
        <div className="h-5 bg-[var(--bg-tertiary)] rounded w-4/5" />
        <div className="flex gap-2">
          <div className="h-6 bg-[var(--bg-tertiary)] rounded w-16" />
          <div className="h-6 bg-[var(--bg-tertiary)] rounded w-20" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-7 bg-[var(--bg-tertiary)] rounded w-20" />
          <div className="h-10 bg-[var(--bg-tertiary)] rounded w-28" />
        </div>
      </div>
    </div>
  )
}

export function ProductSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="products-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} viewMode="grid" />
      ))}
    </div>
  )
}

export function ProductSkeletonList({ count = 10 }: { count?: number }) {
  return (
    <div className="products-list">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} viewMode="list" />
      ))}
    </div>
  )
}

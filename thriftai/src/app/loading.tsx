import { Skeleton } from '@/components/ui/primitives'

/** Generic route loading state: page-shaped skeleton, no spinner, no layout shift on arrival. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6" role="status" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-2/3 max-w-lg" />
      <Skeleton className="mt-4 h-5 w-1/2 max-w-md" />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

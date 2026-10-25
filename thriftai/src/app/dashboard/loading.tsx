import { Skeleton } from '@/components/ui/primitives'

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6" role="status" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-8 w-64" />
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-72 rounded-2xl" />
      <Skeleton className="mt-6 h-72 rounded-2xl" />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="bg-white min-h-screen">
      {/* Navigation Skeleton */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="flex items-center justify-between h-11">
            <div className="h-6 w-24 bg-black/5 rounded animate-pulse" />
            <div className="flex items-center space-x-8">
              <div className="h-4 w-16 bg-black/5 rounded animate-pulse" />
              <div className="h-4 w-16 bg-black/5 rounded animate-pulse" />
              <div className="h-4 w-20 bg-black/5 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-11">
        {/* Header Skeleton */}
        <div className="max-w-[980px] mx-auto px-6 py-16">
          <div className="h-14 w-96 bg-black/5 rounded animate-pulse mb-2" />
          <div className="h-7 w-64 bg-black/5 rounded animate-pulse" />
        </div>

        {/* Stats Skeleton */}
        <div className="bg-[#fbfbfd] py-16">
          <div className="max-w-[980px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-16 w-32 mx-auto bg-black/5 rounded animate-pulse mb-2" />
                  <div className="h-5 w-40 mx-auto bg-black/5 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="max-w-[980px] mx-auto px-6 py-12">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-10 w-32 bg-[#f5f5f7] rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Products Skeleton */}
        <div className="max-w-[980px] mx-auto px-6 pb-24">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-[#fbfbfd] rounded-2xl p-8 animate-pulse"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1">
                    <div className="h-6 w-48 bg-black/5 rounded mb-2" />
                    <div className="h-4 w-32 bg-black/5 rounded" />
                  </div>
                  <div className="flex items-center gap-8">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="text-center">
                        <div className="h-10 w-16 mx-auto bg-black/5 rounded mb-1" />
                        <div className="h-3 w-12 mx-auto bg-black/5 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

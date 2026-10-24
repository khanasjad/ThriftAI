export default function ProductLoading() {
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
        {/* Back Button Skeleton */}
        <div className="max-w-[980px] mx-auto px-6 py-6">
          <div className="h-5 w-32 bg-black/5 rounded animate-pulse" />
        </div>

        {/* Product Header Skeleton */}
        <div className="max-w-[980px] mx-auto px-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Image Skeleton */}
            <div>
              <div className="aspect-square bg-[#f5f5f7] rounded-2xl animate-pulse" />
            </div>

            {/* Product Info Skeleton */}
            <div>
              <div className="h-4 w-32 bg-black/5 rounded animate-pulse mb-2" />
              <div className="h-10 w-full bg-black/5 rounded animate-pulse mb-4" />
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-32 bg-black/5 rounded-full animate-pulse" />
                <div className="h-12 w-20 bg-black/5 rounded animate-pulse" />
              </div>
              <div className="h-20 w-full bg-black/5 rounded animate-pulse mb-6" />
              <div className="h-8 w-48 bg-black/5 rounded animate-pulse mb-8" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-24 bg-black/5 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-black/5 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quality Scores Skeleton */}
        <div className="bg-[#fbfbfd] py-16">
          <div className="max-w-[980px] mx-auto px-6">
            <div className="h-8 w-64 bg-black/5 rounded animate-pulse mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 text-center">
                  <div className="h-12 w-16 mx-auto bg-black/5 rounded animate-pulse mb-2" />
                  <div className="h-4 w-20 mx-auto bg-black/5 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Skeleton */}
        <div className="max-w-[980px] mx-auto px-6 py-16">
          <div className="h-8 w-64 bg-black/5 rounded animate-pulse mb-8" />
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#fbfbfd] rounded-2xl p-6">
                <div className="h-5 w-48 bg-black/5 rounded animate-pulse mb-3" />
                <div className="h-4 w-full bg-black/5 rounded animate-pulse mb-2" />
                <div className="h-4 w-3/4 bg-black/5 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

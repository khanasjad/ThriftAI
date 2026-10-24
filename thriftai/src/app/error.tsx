'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="bg-white min-h-screen flex items-center justify-center">
      <div className="max-w-[980px] mx-auto px-6 py-24 text-center">
        <h1 className="text-[56px] font-semibold tracking-[-0.005em] leading-[1.07143] mb-4">
          Something went wrong
        </h1>
        <p className="text-[21px] text-black/60 mb-12">
          We encountered an unexpected error. Please try again.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-black text-white rounded-full text-[14px] font-medium hover:bg-black/80 transition-all"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-[#f5f5f7] text-black rounded-full text-[14px] font-medium hover:bg-[#e8e8ed] transition-all"
          >
            Go home
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-12 p-6 bg-[#f5f5f7] rounded-2xl text-left">
            <h2 className="text-[14px] font-semibold mb-2">Error Details (Development Only)</h2>
            <p className="text-[12px] text-red-600 font-mono">{error.message}</p>
            {error.digest && (
              <p className="text-[12px] text-black/60 font-mono mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

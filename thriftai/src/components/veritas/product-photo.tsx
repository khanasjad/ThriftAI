'use client'

import * as React from 'react'

/**
 * A real product photo in the thumbnail frame (B21). Falls back to the drawn illustration (children) if the photo
 * fails to load, so a broken vendor link never leaves an empty box. Fixed frame: no layout shift while loading.
 */
export function ProductPhoto({ url, alt, credit, showTag, children }: { url: string; alt: string; credit?: string | null; showTag: boolean; children: React.ReactNode }) {
  const [failed, setFailed] = React.useState(false)
  if (failed) return <>{children}</>
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- vendor and licensed photos from many hosts; sized by the frame */}
      <img src={url} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-contain p-2" />
      {showTag && credit && (
        <span className="absolute bottom-2 left-2 right-2 truncate rounded bg-surface/85 px-1.5 py-0.5 text-[10px] font-medium text-fg-subtle" title={credit}>
          Photo: {credit}
        </span>
      )}
    </>
  )
}

/**
 * Which stored image is a real photo to show (B21). Dev images (/dev-images/…) are renders of the drawn
 * illustration, so they are never shown as photos. Real photos: vendor https links and licensed open-data photos.
 */
export type Photo = { url: string; credit: string | null }

export function displayPhoto(url: string | null | undefined, credit?: string | null): Photo | null {
  if (!url) return null
  if (url.startsWith('/dev-images/')) return null
  if (!/^https:\/\//i.test(url) && !url.startsWith('/open-images/')) return null
  return { url, credit: credit ?? null }
}

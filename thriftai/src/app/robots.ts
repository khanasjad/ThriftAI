import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

/** Production: index public pages only. Anything else (dev preview with fictional data): index nothing. */
export default function robots(): MetadataRoute.Robots {
  if (process.env.APP_ENV !== 'production') return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/dashboard', '/api/', '/sign-in', '/profile', '/dev'] },
    sitemap: `${base}/sitemap.xml`,
  }
}

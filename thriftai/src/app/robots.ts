import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site-url'

const base = siteUrl()

/** Production: index public pages only. Anything else (dev preview with fictional data): index nothing. */
export default function robots(): MetadataRoute.Robots {
  if (process.env.APP_ENV !== 'production') return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/dashboard', '/api/', '/sign-in', '/profile', '/dev', '/demo'] },
    sitemap: `${base}/sitemap.xml`,
  }
}

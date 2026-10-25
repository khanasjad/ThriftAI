import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const base = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ['', '/search', '/how-it-works', '/brands', '/brands/pricing', '/pilot', '/developers', '/about', '/privacy-policy', '/terms-of-service']
  const products = await prisma.clothingProduct.findMany({ where: { isAvailable: true }, select: { slug: true, updatedAt: true, productScore: { select: { calculatedAt: true } } } })
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.6 })),
    ...products.map((p) => ({
      url: `${base}/p/${p.slug}`,
      lastModified: p.productScore?.calculatedAt ?? p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}

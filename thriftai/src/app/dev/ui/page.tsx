import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Showcase } from './showcase'
import type { PriceSeries } from '@/components/veritas/price-history'

// Dev-only component gallery (docs/rpi/03-PLAN-FRONTEND.md §4). 404 in production.
export const dynamic = 'force-dynamic'
export const metadata = { title: 'UI kit', robots: { index: false } }

export default async function DevUiPage() {
  if (process.env.APP_ENV === 'production') notFound()

  // Real price history from the dev fixture: prefer a fake-markdown product (promo with inflated list price).
  // A fake markdown = "sale" flag with a "was" price far above the actual price history.
  const promos = await prisma.priceSnapshot.findMany({
    where: { isPromo: true, listPrice: { not: null } },
    select: { productId: true, price: true, listPrice: true },
  })
  const promo = promos.find((p) => Number(p.listPrice) >= Number(p.price) * 1.4)
  let series: PriceSeries[] = []
  if (promo) {
    const rows = await prisma.priceSnapshot.findMany({
      where: { productId: promo.productId },
      include: { seller: { select: { name: true } } },
      orderBy: { observedAt: 'asc' },
    })
    const bySeller = new Map<string, PriceSeries>()
    for (const r of rows) {
      const name = r.seller?.name ?? 'Brand store'
      if (!bySeller.has(name)) bySeller.set(name, { seller: name, points: [] })
      bySeller.get(name)!.points.push({
        date: r.observedAt.toISOString().slice(0, 10),
        price: Number(r.price),
        listPrice: r.listPrice ? Number(r.listPrice) : null,
        isPromo: r.isPromo,
      })
    }
    series = [...bySeller.values()]
  }

  return <Showcase priceSeries={series} />
}

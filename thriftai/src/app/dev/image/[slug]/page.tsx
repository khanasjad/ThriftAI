import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProductThumb } from '@/components/veritas/product-thumb'
import { devPatternFor } from '@/lib/veritas/dev/patterns'

/** Dev only: one product drawn large with its known pattern, for scripts/dev/render-images.ts to screenshot. */
export default async function DevImage({ params }: { params: Promise<{ slug: string }> }) {
  if (process.env.APP_ENV === 'production') notFound()
  const { slug } = await params
  const p = await prisma.clothingProduct.findUnique({ where: { slug }, select: { category: true, subcategory: true, silhouette: true, colors: true } })
  if (!p) notFound()
  return (
    <div id="shot" style={{ width: 512, height: 640, background: '#f4f4f2' }}>
      <ProductThumb category={p.category} subcategory={p.subcategory} silhouette={p.silhouette} color={p.colors[0]} pattern={devPatternFor(slug, p.category, p.subcategory)} showTag={false} className="h-full w-full rounded-none !bg-none" />
    </div>
  )
}

import { prisma } from '../src/lib/prisma'

async function checkCategoriesWithSpecs() {
  const products = await prisma.product.findMany({
    where: { isAvailable: true },
    select: { category: true, dynamicSpecs: true },
    take: 5000
  })

  const categoriesWithSpecs = new Map<string, { withSpecs: number; withoutSpecs: number }>()

  products.forEach(p => {
    const specs = p.dynamicSpecs as Record<string, any> | null
    const count = specs && typeof specs === 'object' ? Object.keys(specs).length : 0

    if (!categoriesWithSpecs.has(p.category)) {
      categoriesWithSpecs.set(p.category, { withSpecs: 0, withoutSpecs: 0 })
    }

    if (count > 0) {
      categoriesWithSpecs.get(p.category)!.withSpecs++
    } else {
      categoriesWithSpecs.get(p.category)!.withoutSpecs++
    }
  })

  console.log('Categories with dynamicSpecs data (top 30 by count):\n')
  Array.from(categoriesWithSpecs.entries())
    .sort((a, b) => b[1].withSpecs - a[1].withSpecs)
    .slice(0, 30)
    .forEach(([cat, counts]) => {
      const total = counts.withSpecs + counts.withoutSpecs
      const percentage = ((counts.withSpecs / total) * 100).toFixed(0)
      console.log(`  ${cat}: ${counts.withSpecs}/${total} (${percentage}%) have specs`)
    })

  await prisma.$disconnect()
}

checkCategoriesWithSpecs().catch(console.error)

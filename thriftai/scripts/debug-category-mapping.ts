import { structuredQueryGenerator } from '../src/lib/services/structuredQueryGenerator'
import { prisma } from '../src/lib/prisma'

async function debugCategoryMapping() {
  const query = "vintage designer bags"

  console.log('\n🔍 Testing Category Mapping for:', query)
  console.log('='.repeat(60))

  // Get available categories
  const categories = await prisma.product.groupBy({
    by: ['category'],
    _count: { category: true }
  })

  console.log('\n📊 Available Categories in Database:')
  console.log(categories.map((c: any) => c.category).join(', '))

  // Generate structured query
  console.log('\n🤖 Calling Claude to map query...\n')
  const result = await structuredQueryGenerator.generateQuery(query, prisma)

  console.log('\n✅ Claude Response:')
  console.log(JSON.stringify(result, null, 2))

  console.log('\n🎯 Key Mappings:')
  console.log('  Search Terms:', result.searchTerms)
  console.log('  Categories:', result.categories)
  console.log('  Confidence:', result.confidence)
  console.log('  Intent:', result.intent)

  // Now let's see what products actually exist in those categories
  if (result.categories && result.categories.length > 0) {
    console.log('\n📦 Products in mapped categories:')
    for (const category of result.categories) {
      const count = await prisma.product.count({
        where: {
          category: category,
          isAvailable: true
        }
      })
      console.log(`  ${category}: ${count} products`)
    }
  }

  // Let's also check if there are any products matching the search terms
  if (result.searchTerms && result.searchTerms.length > 0) {
    console.log('\n🔎 Testing actual database query:')

    const searchConditions = result.searchTerms.map(term => ({
      OR: [
        { name: { contains: term, mode: 'insensitive' as const } },
        { description: { contains: term, mode: 'insensitive' as const } },
        { brand: { contains: term, mode: 'insensitive' as const } }
      ]
    }))

    const products = await prisma.product.findMany({
      where: {
        isAvailable: true,
        AND: [
          { OR: searchConditions },
          result.categories && result.categories.length > 0 ? {
            category: { in: result.categories }
          } : {}
        ]
      },
      take: 5,
      select: {
        id: true,
        name: true,
        category: true,
        brand: true,
        price: true
      }
    })

    console.log(`  Found ${products.length} products:`)
    products.forEach(p => {
      console.log(`    - ${p.name} (${p.category}) - $${p.price}`)
    })
  }

  await prisma.$disconnect()
}

debugCategoryMapping()

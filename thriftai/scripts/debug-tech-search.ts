import { structuredQueryGenerator } from '../src/lib/services/structuredQueryGenerator'
import { prisma } from '../src/lib/prisma'

async function debugTechSearch() {
  const query = "Best tech deals under $100"

  console.log('\n🔍 Testing Tech Query:', query)
  console.log('='.repeat(60))

  // Get available categories
  const allCategories = await prisma.product.groupBy({
    by: ['category'],
    _count: { category: true }
  })

  console.log('\n📊 All Tech Categories in Database:')
  const techCategories = allCategories.filter((c: any) =>
    ['LAPTOPS', 'SMARTPHONES', 'TABLETS', 'SMARTWATCHES', 'HEADPHONES', 'CAMERAS',
     'GAMING_CONSOLES', 'KEYBOARDS', 'MICE', 'MONITORS'].includes(c.category)
  )
  techCategories.forEach((c: any) => {
    console.log(`  ${c.category}: ${c._count.category} products`)
  })

  // Count products under $100
  console.log('\n💰 Tech Products Under $100:')
  for (const cat of techCategories) {
    const count = await prisma.product.count({
      where: {
        category: cat.category,
        isAvailable: true,
        price: { lte: 100 }
      }
    })
    if (count > 0) {
      console.log(`  ${cat.category}: ${count} products`)
    }
  }

  // Generate structured query with Claude
  console.log('\n🤖 Calling Claude to map tech query...\n')
  const result = await structuredQueryGenerator.generateQuery(query, prisma)

  console.log('\n✅ Claude Response:')
  console.log(JSON.stringify(result, null, 2))

  console.log('\n🎯 Analysis:')
  console.log('  Search Terms:', result.searchTerms)
  console.log('  Categories Returned:', result.categories)
  console.log('  Categories Count:', result.categories?.length || 0)
  console.log('  Max Price:', result.maxPrice)

  // Check what's missing
  const expectedTech = ['LAPTOPS', 'SMARTPHONES', 'TABLETS', 'SMARTWATCHES', 'HEADPHONES',
                        'CAMERAS', 'GAMING_CONSOLES', 'KEYBOARDS', 'MICE', 'MONITORS']
  const missing = expectedTech.filter(cat => !result.categories?.includes(cat))

  console.log('\n❌ Missing Tech Categories:', missing.length > 0 ? missing : 'None')
  console.log('\n✅ Included Tech Categories:', result.categories?.filter(c => expectedTech.includes(c)) || [])

  await prisma.$disconnect()
}

debugTechSearch()

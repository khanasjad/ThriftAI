import { prisma } from '../src/lib/prisma'

async function findLaptopsWithSpecs() {
  console.log('🔍 Finding laptops with actual specs data...\n')

  // First, find ALL laptops and check their specs
  const allLaptops = await prisma.product.findMany({
    where: {
      isAvailable: true,
      category: 'LAPTOPS'
    },
    select: {
      id: true,
      name: true,
      brand: true,
      aiScore: true,
      dynamicSpecs: true
    },
    take: 100
  })

  const laptopsWithSpecs = allLaptops.filter(laptop => {
    const specs = laptop.dynamicSpecs as Record<string, any> | null
    return specs && Object.keys(specs).length > 0
  })

  console.log(`Found ${laptopsWithSpecs.length} laptops with specs out of ${allLaptops.length} checked\n`)

  if (laptopsWithSpecs.length > 0) {
    console.log('Top 5 laptops with specs:\n')
    laptopsWithSpecs.slice(0, 5).forEach((laptop, i) => {
      const specs = laptop.dynamicSpecs as Record<string, any>
      console.log(`${i + 1}. ${laptop.name} by ${laptop.brand}`)
      console.log(`   AI Score: ${laptop.aiScore?.toFixed(2) || 'N/A'}/100`)
      console.log(`   Specs (${Object.keys(specs).length} attributes):`)
      Object.entries(specs).forEach(([key, value]) => {
        console.log(`      - ${key}: ${value}`)
      })
      console.log('')
    })
  } else {
    console.log('❌ No laptops have specs data populated in dynamicSpecs field')
    console.log('\n💡 This means the product generation did not populate laptop specs.')
    console.log('   You would need to add specs data to see RAM, processor, etc.')
  }

  await prisma.$disconnect()
}

findLaptopsWithSpecs().catch(console.error)

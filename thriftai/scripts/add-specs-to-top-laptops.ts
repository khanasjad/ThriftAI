import { prisma } from '../src/lib/prisma'

async function addSpecsToTopLaptops() {
  console.log('🔧 Adding specifications to top 10 laptops...\n')

  const laptops = await prisma.product.findMany({
    where: {
      isAvailable: true,
      aiScore: { not: null },
      category: 'LAPTOPS'
    },
    select: {
      id: true,
      name: true,
      brand: true,
      aiScore: true,
      dynamicSpecs: true
    },
    orderBy: {
      aiScore: 'desc'
    },
    take: 10
  })

  console.log(`Found ${laptops.length} top laptops\n`)

  const ramOptions = ['8GB', '16GB', '32GB', '64GB']
  const storageOptions = ['256GB', '512GB', '1024GB', '2048GB']
  const processorOptions = ['Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Apple M1', 'Apple M2']
  const screenSizeOptions = ['13 inches', '14 inches', '15 inches', '16 inches', '17 inches']

  for (const laptop of laptops) {
    const specs = laptop.dynamicSpecs as Record<string, any> | null

    if (!specs || Object.keys(specs).length === 0) {
      // Generate random but realistic specs
      const newSpecs = {
        ram: ramOptions[Math.floor(Math.random() * ramOptions.length)],
        storage: storageOptions[Math.floor(Math.random() * storageOptions.length)],
        processor: processorOptions[Math.floor(Math.random() * processorOptions.length)],
        screenSize: screenSizeOptions[Math.floor(Math.random() * screenSizeOptions.length)]
      }

      await prisma.product.update({
        where: { id: laptop.id },
        data: { dynamicSpecs: newSpecs }
      })

      console.log(`✅ ${laptop.name} by ${laptop.brand}`)
      console.log(`   Score: ${laptop.aiScore?.toFixed(2)}/100`)
      console.log(`   Added specs: ${newSpecs.ram}, ${newSpecs.storage}, ${newSpecs.processor}, ${newSpecs.screenSize}`)
      console.log('')
    } else {
      console.log(`⏭️  ${laptop.name} already has specs`)
    }
  }

  console.log('\n🎉 Done! Refresh the leaderboard to see the specs.')

  await prisma.$disconnect()
}

addSpecsToTopLaptops().catch(console.error)

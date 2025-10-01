import { prisma } from '../src/lib/prisma'

async function checkGeneratedSpecs() {
  try {
    console.log('\n' + '='.repeat(100))
    console.log('📊 DYNAMIC SPECS GENERATION STATUS')
    console.log('='.repeat(100))

    // Count total products
    const totalProducts = await prisma.product.count()

    // Count products with dynamic specs (has more than 3 parameters)
    const productsWithSpecs = await prisma.product.findMany({
      select: {
        dynamicSpecs: true
      }
    })

    let withFullSpecs = 0
    let withBasicSpecs = 0
    let withoutSpecs = 0

    productsWithSpecs.forEach(p => {
      const specs = p.dynamicSpecs as any
      if (specs) {
        const count = Object.keys(specs).length
        if (count >= 15) {
          withFullSpecs++
        } else if (count > 0) {
          withBasicSpecs++
        }
      } else {
        withoutSpecs++
      }
    })

    console.log(`\n📈 Overall Progress:`)
    console.log(`   Total Products: ${totalProducts}`)
    console.log(`   ✅ With Full AI Specs (15+ params): ${withFullSpecs}`)
    console.log(`   ⚠️  With Basic Specs (1-14 params): ${withBasicSpecs}`)
    console.log(`   ❌ Without Specs: ${withoutSpecs}`)
    console.log(`\n   Completion: ${Math.round((withFullSpecs / totalProducts) * 100)}%`)

    // Show sample products with specs
    console.log('\n' + '='.repeat(100))
    console.log('📋 SAMPLE PRODUCTS WITH AI-GENERATED SPECS')
    console.log('='.repeat(100))

    const sampleProducts = await prisma.product.findMany({
      take: 10,
      select: {
        name: true,
        category: true,
        brand: true,
        price: true,
        dynamicSpecs: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    sampleProducts.forEach((product, i) => {
      const specs = product.dynamicSpecs as any
      const paramCount = specs ? Object.keys(specs).length : 0

      console.log(`\n${i + 1}. ${product.name}`)
      console.log(`   Category: ${product.category} | Brand: ${product.brand} | Price: $${product.price}`)
      console.log(`   Parameters: ${paramCount}`)

      if (specs && paramCount > 0) {
        console.log(`   Sample Parameters:`)
        const keys = Object.keys(specs).slice(0, 5)
        keys.forEach(key => {
          console.log(`      - ${key}: ${specs[key]}`)
        })
        if (paramCount > 5) {
          console.log(`      ... and ${paramCount - 5} more`)
        }
      }
    })

    console.log('\n' + '='.repeat(100))

    // Show breakdown by category
    console.log('\n📊 SPECS BY CATEGORY')
    console.log('─'.repeat(100))

    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    })

    for (const cat of categories.slice(0, 10)) {
      const withSpecs = await prisma.product.count({
        where: {
          category: cat.category,
          dynamicSpecs: {
            not: null
          }
        }
      })
      console.log(`${cat.category}: ${withSpecs}/${cat._count.category} products`)
    }

    console.log('\n' + '='.repeat(100))

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkGeneratedSpecs()

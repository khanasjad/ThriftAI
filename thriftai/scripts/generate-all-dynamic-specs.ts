import { prisma } from '../src/lib/prisma'
import { dynamicParameterGenerator } from '../src/lib/services/dynamicParameterGenerator'

async function generateAllDynamicSpecs() {
  try {
    console.log('\n' + '='.repeat(100))
    console.log('🤖 AI-POWERED DYNAMIC SPECS GENERATOR FOR ALL PRODUCTS')
    console.log('='.repeat(100))

    // Get all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        condition: true,
        price: true,
        description: true,
        dynamicSpecs: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n📦 Found ${products.length} products`)
    console.log('🚀 Starting AI parameter generation...\n')

    let processed = 0
    let successful = 0
    let failed = 0

    for (const product of products) {
      processed++

      try {
        console.log(`\n[${processed}/${products.length}] Processing: ${product.name}`)
        console.log(`   Category: ${product.category} | Brand: ${product.brand} | Price: $${product.price}`)

        // Generate AI-powered parameters
        const result = await dynamicParameterGenerator.generateParameters({
          name: product.name,
          brand: product.brand,
          category: product.category,
          condition: product.condition || 'Good',
          price: parseFloat(product.price.toString()),
          description: product.description || undefined
        })

        // Convert parameters to dynamicSpecs object
        const dynamicSpecs: Record<string, any> = {}
        result.parameters.forEach(param => {
          dynamicSpecs[param.name] = param.value
        })

        // Update product
        await prisma.product.update({
          where: { id: product.id },
          data: {
            dynamicSpecs,
            updatedAt: new Date()
          }
        })

        console.log(`   ✅ Generated ${result.totalParameters} parameters | Quality Score: ${result.qualityScore}/100`)
        successful++

        // Add small delay to avoid rate limiting
        if (processed % 10 === 0) {
          console.log(`\n⏸️  Processed ${processed} products. Brief pause to avoid rate limiting...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }

      } catch (error) {
        console.log(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`)
        failed++
      }
    }

    console.log('\n' + '='.repeat(100))
    console.log('📊 GENERATION COMPLETE')
    console.log('='.repeat(100))
    console.log(`✅ Successful: ${successful} products`)
    console.log(`❌ Failed: ${failed} products`)
    console.log(`📦 Total Processed: ${processed} products`)
    console.log('='.repeat(100))

    // Show sample of results
    console.log('\n📋 SAMPLE RESULTS (First 5 Products):')
    console.log('─'.repeat(100))

    const sampleProducts = await prisma.product.findMany({
      take: 5,
      select: {
        name: true,
        category: true,
        dynamicSpecs: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    sampleProducts.forEach((p, i) => {
      const specs = p.dynamicSpecs as any
      const specCount = specs ? Object.keys(specs).length : 0
      console.log(`\n${i + 1}. ${p.name} (${p.category})`)
      console.log(`   Parameters: ${specCount}`)
      if (specs && specCount > 0) {
        const sampleKeys = Object.keys(specs).slice(0, 3)
        sampleKeys.forEach(key => {
          console.log(`   - ${key}: ${specs[key]}`)
        })
        if (specCount > 3) {
          console.log(`   ... and ${specCount - 3} more parameters`)
        }
      }
    })

    console.log('\n' + '='.repeat(100))
    console.log('✨ All products now have AI-generated dynamic specifications!')
    console.log('='.repeat(100))

  } catch (error) {
    console.error('\n❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateAllDynamicSpecs()

import { prisma } from '../src/lib/prisma'
import { dynamicParameterGenerator } from '../src/lib/services/dynamicParameterGenerator'

async function generateAIParameters() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('AI-POWERED DYNAMIC PARAMETER GENERATOR')
    console.log('='.repeat(80))

    // Find the Puma Elite product
    const product = await prisma.product.findFirst({
      where: {
        name: { contains: 'Puma Elite', mode: 'insensitive' },
        category: 'BASKETBALL_SHOES'
      }
    })

    if (!product) {
      console.log('\n❌ Product not found!')
      return
    }

    console.log(`\n📦 Generating AI parameters for: ${product.name}`)
    console.log(`   Brand: ${product.brand}`)
    console.log(`   Category: ${product.category}`)
    console.log(`   Condition: ${product.condition}`)
    console.log(`   Price: $${product.price}`)
    console.log('\n🤖 Asking Claude AI to analyze product and generate detailed parameters...\n')

    // Generate AI-powered parameters
    const result = await dynamicParameterGenerator.generateParameters({
      name: product.name,
      brand: product.brand,
      category: product.category,
      condition: product.condition || 'Good',
      price: parseFloat(product.price.toString()),
      description: product.description || undefined
    })

    console.log('='.repeat(80))
    console.log(`✅ Generated ${result.totalParameters} AI-Powered Parameters`)
    console.log(`   Category-Specific: ${result.categorySpecificCount}`)
    console.log(`   Quality Score: ${result.qualityScore}/100`)
    console.log('='.repeat(80))

    // Group parameters by category
    const grouped: Record<string, any[]> = {}
    result.parameters.forEach(param => {
      if (!grouped[param.category]) {
        grouped[param.category] = []
      }
      grouped[param.category].push(param)
    })

    // Display parameters grouped by category
    const categoryIcons: Record<string, string> = {
      'sole': '👟',
      'cushioning': '💨',
      'support': '🏋️',
      'materials': '🧵',
      'upper': '👕',
      'fit': '📏',
      'performance': '⚡',
      'quality': '✨',
      'durability': '💪',
      'comfort': '😌',
      'design': '🎨',
      'technology': '🔧',
      'brand': '🏷️',
      'value': '💰'
    }

    Object.keys(grouped).forEach(category => {
      const params = grouped[category]
      const icon = categoryIcons[category] || '📊'
      console.log(`\n${icon} ${category.toUpperCase()} (${params.length} parameters)`)
      console.log('─'.repeat(80))

      params.forEach((param, index) => {
        const importanceIcon = {
          'critical': '🔴',
          'high': '🟡',
          'medium': '🟢',
          'low': '⚪'
        }[param.importance] || '⚪'

        console.log(`\n  ${index + 1}. ${param.name.replace(/_/g, ' ').toUpperCase()}`)
        console.log(`     ${importanceIcon} Importance: ${param.importance}`)
        console.log(`     Value: ${param.value}`)
        console.log(`     ${param.description}`)
      })
    })

    console.log('\n' + '='.repeat(80))
    console.log('SAVE TO DATABASE?')
    console.log('='.repeat(80))

    // Update product with AI-generated parameters
    const dynamicSpecs: Record<string, any> = {}
    result.parameters.forEach(param => {
      dynamicSpecs[param.name] = param.value
    })

    await prisma.product.update({
      where: { id: product.id },
      data: {
        dynamicSpecs,
        updatedAt: new Date()
      }
    })

    console.log(`\n✅ Saved ${result.totalParameters} AI-generated parameters to product: ${product.name}`)
    console.log(`   Updated dynamicSpecs field in database`)

    console.log('\n' + '='.repeat(80))
    console.log('COMPARISON: BEFORE vs AFTER')
    console.log('='.repeat(80))
    console.log('\n📊 BEFORE (Basic 3 parameters):')
    console.log('  - support: Premium')
    console.log('  - traction: Premium')
    console.log('  - cushioning: Standard')

    console.log(`\n🤖 AFTER (AI-Generated ${result.totalParameters} parameters):`)
    console.log('  Comprehensive category-specific analysis including:')
    Object.keys(grouped).forEach(cat => {
      console.log(`  - ${cat}: ${grouped[cat].length} detailed parameters`)
    })

    console.log('\n' + '='.repeat(80))
    console.log('✨ AI DYNAMIC PARAMETERS SUCCESSFULLY GENERATED!')
    console.log('='.repeat(80))

  } catch (error) {
    console.error('\n❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateAIParameters()

#!/usr/bin/env npx tsx
/**
 * Quick Product Image Enrichment
 * Uses FREE public sources (no API keys needed)
 */

import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

/**
 * Get product-specific placeholder image using Lorem Picsum
 */
async function getProductImage(productName: string, brand?: string, category?: string): Promise<string> {
  // Generate deterministic image based on product name hash
  const hash = productName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const imageId = (hash % 500) + 1 // Images from 1-500

  // Use Lorem Picsum with specific ID for consistency
  const imageUrl = `https://picsum.photos/id/${imageId}/800/600`

  console.log(`  📸 Image: picsum.photos/id/${imageId}`)
  return imageUrl
}

/**
 * Generate product specifications based on category
 */
function generateSpecs(product: any): any {
  const specs: any = {}

  if (product.category === 'ELECTRONICS') {
    // Extract specs from product name/description
    const text = `${product.name} ${product.description || ''}`.toLowerCase()

    // Storage
    const storageMatch = text.match(/(\d+)\s*(gb|tb)/i)
    if (storageMatch) {
      specs.storage = `${storageMatch[1]}${storageMatch[2].toUpperCase()}`
    }

    // Screen size
    const sizeMatch = text.match(/(\d+\.?\d*)\s*(inch|mm|"|')/i)
    if (sizeMatch) {
      specs.screenSize = `${sizeMatch[1]} ${sizeMatch[2] === 'mm' ? 'mm' : 'inches'}`
    }

    // Processor
    if (text.includes('m1') || text.includes('m2') || text.includes('m3')) {
      specs.processor = text.match(/m[123]\s*(?:pro|max|ultra)?/i)?.[0].toUpperCase() || 'Apple Silicon'
    } else if (text.includes('intel') || text.includes('core')) {
      specs.processor = 'Intel Core'
    } else if (text.includes('ryzen')) {
      specs.processor = 'AMD Ryzen'
    }

    // Battery
    if (text.includes('battery') || text.includes('hour')) {
      const batteryMatch = text.match(/(\d+)\s*hour/i)
      if (batteryMatch) {
        specs.batteryLife = `${batteryMatch[1]} hours`
      }
    }

  } else if (product.category === 'CLOTHING' || product.category === 'SHOES') {
    const text = `${product.name} ${product.description || ''}`.toLowerCase()

    // Size
    const sizeMatch = text.match(/\b(xs|s|m|l|xl|xxl|xxxl|\d+\.?\d*)\b/i)
    if (sizeMatch) {
      specs.size = sizeMatch[1].toUpperCase()
    }

    // Material
    if (text.includes('leather')) specs.material = 'Leather'
    else if (text.includes('cotton')) specs.material = 'Cotton'
    else if (text.includes('polyester')) specs.material = 'Polyester'
    else if (text.includes('wool')) specs.material = 'Wool'
    else if (text.includes('suede')) specs.material = 'Suede'

    // Color
    const colorMatch = text.match(/\b(black|white|blue|red|green|gray|brown|navy|pink|purple|yellow|orange)\b/i)
    if (colorMatch) {
      specs.color = colorMatch[1].charAt(0).toUpperCase() + colorMatch[1].slice(1)
    }

  } else if (product.category === 'ACCESSORIES') {
    const text = `${product.name} ${product.description || ''}`.toLowerCase()

    // Material
    if (text.includes('leather')) specs.material = 'Leather'
    else if (text.includes('canvas')) specs.material = 'Canvas'
    else if (text.includes('nylon')) specs.material = 'Nylon'
    else if (text.includes('metal')) specs.material = 'Metal'

    // Dimensions
    const dimensionMatch = text.match(/(\d+)\s*x\s*(\d+)/i)
    if (dimensionMatch) {
      specs.dimensions = `${dimensionMatch[1]}x${dimensionMatch[2]} cm`
    }
  }

  // Add condition from product
  if (product.condition) {
    specs.condition = product.condition
  }

  // Add brand
  if (product.brand) {
    specs.brand = product.brand
  }

  return specs
}

async function main() {
  console.log('🎨 Quick Product Image & Specs Enrichment')
  console.log('=' .repeat(60))
  console.log()

  // Get ALL products to enrich
  const products = await prisma.product.findMany({
    where: { isAvailable: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      brand: true,
      category: true,
      imageUrl: true,
      dynamicSpecs: true,
      description: true,
      condition: true,
    }
  })

  console.log(`📦 Found ${products.length} products to enrich\n`)

  let updated = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    console.log(`[${i + 1}/${products.length}] ${product.name}`)

    // 1. Get product image
    const imageUrl = await getProductImage(product.name, product.brand || undefined, product.category)

    // 2. Generate specifications
    const specs = generateSpecs(product)

    // 3. Update product
    const updateData: any = {
      imageUrl: imageUrl,
    }

    if (Object.keys(specs).length > 0) {
      updateData.dynamicSpecs = specs
      console.log(`  📋 Specs: ${Object.keys(specs).join(', ')}`)
    }

    await prisma.product.update({
      where: { id: product.id },
      data: updateData,
    })

    updated++
    console.log()

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('=' .repeat(60))
  console.log(`✅ Updated ${updated}/${products.length} products`)
  console.log()
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

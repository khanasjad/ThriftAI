#!/usr/bin/env npx tsx
/**
 * Get Product-Specific Matching Images
 *
 * This script creates Unsplash search URLs based on actual product names
 * - iPhone 15 Pro → iPhone images
 * - Nike Air Jordan → Nike Jordan sneaker images
 * - Canon EOS R6 → Canon camera images
 * - MacBook Pro → MacBook images
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Extract search terms from product name
 */
function extractSearchTerms(productName: string, brand: string | null): string[] {
  const name = productName.toLowerCase()
  const searchTerms: string[] = []

  // Add brand if available
  if (brand) {
    searchTerms.push(brand.toLowerCase())
  }

  // Product-specific keywords
  const keywords: Record<string, string[]> = {
    // Electronics
    'iphone': ['iphone', 'apple phone'],
    'ipad': ['ipad', 'tablet'],
    'macbook': ['macbook', 'laptop'],
    'airpods': ['airpods', 'wireless earbuds'],
    'apple watch': ['apple watch', 'smartwatch'],
    'samsung galaxy': ['samsung', 'galaxy phone'],
    'galaxy tab': ['samsung tablet', 'galaxy tab'],
    'pixel': ['google pixel', 'android phone'],
    'playstation': ['playstation', 'ps5', 'gaming console'],
    'xbox': ['xbox', 'gaming console'],
    'nintendo switch': ['nintendo switch', 'gaming'],
    'airpod': ['airpods', 'earbuds'],
    'bose': ['bose', 'headphones'],
    'sony': ['sony', 'headphones'],
    'beats': ['beats', 'headphones'],
    'jbl': ['jbl', 'speaker'],
    'canon': ['canon', 'camera'],
    'nikon': ['nikon', 'camera'],
    'gopro': ['gopro', 'action camera'],
    'drone': ['drone', 'dji'],
    'laptop': ['laptop', 'computer'],
    'tablet': ['tablet', 'ipad'],
    'camera': ['camera', 'dslr'],
    'headphone': ['headphones', 'audio'],
    'speaker': ['speaker', 'bluetooth'],
    'tv': ['television', 'tv screen'],
    'oled': ['oled tv', 'television'],
    'qled': ['qled tv', 'samsung'],

    // Clothing
    'hoodie': ['hoodie', 'sweatshirt'],
    'jacket': ['jacket', 'outerwear'],
    'jeans': ['jeans', 'denim'],
    'shirt': ['shirt', 'clothing'],
    'pants': ['pants', 'trousers'],
    'sweater': ['sweater', 'knitwear'],
    'coat': ['coat', 'winter jacket'],
    'dress': ['dress', 'fashion'],
    't-shirt': ['t-shirt', 'tee'],
    'polo': ['polo shirt', 'collar'],

    // Shoes
    'air jordan': ['air jordan', 'sneakers', 'nike'],
    'jordan': ['jordan sneakers', 'basketball shoes'],
    'yeezy': ['yeezy', 'adidas', 'sneakers'],
    'air max': ['air max', 'nike shoes'],
    'ultraboost': ['ultraboost', 'adidas running'],
    'chuck taylor': ['converse', 'chuck taylor'],
    'old skool': ['vans', 'old skool'],
    'running shoe': ['running shoes', 'athletic'],
    'sneaker': ['sneakers', 'shoes'],
    'boot': ['boots', 'footwear'],

    // Accessories
    'watch': ['watch', 'timepiece'],
    'sunglasses': ['sunglasses', 'eyewear'],
    'bag': ['bag', 'handbag'],
    'backpack': ['backpack', 'bag'],
    'wallet': ['wallet', 'leather'],
    'belt': ['belt', 'accessory'],

    // Home
    'vacuum': ['vacuum cleaner', 'dyson'],
    'roomba': ['roomba', 'robot vacuum'],
    'dyson': ['dyson', 'vacuum'],
    'nest': ['nest', 'smart home'],
    'ring': ['ring doorbell', 'security'],
    'philips hue': ['philips hue', 'smart bulb'],
    'sonos': ['sonos', 'speaker'],
    'instant pot': ['instant pot', 'pressure cooker'],
    'air fryer': ['air fryer', 'kitchen'],
    'blender': ['blender', 'kitchen appliance'],
    'coffee': ['coffee maker', 'espresso'],

    // Beauty
    'dyson airwrap': ['dyson airwrap', 'hair styler'],
    'hair dryer': ['hair dryer', 'blow dryer'],
    'straightener': ['hair straightener', 'flat iron'],
    'electric toothbrush': ['electric toothbrush', 'oral care'],
    'shaver': ['electric shaver', 'razor'],

    // Sports
    'dumbbell': ['dumbbells', 'weights'],
    'yoga mat': ['yoga mat', 'fitness'],
    'treadmill': ['treadmill', 'exercise'],
    'bike': ['exercise bike', 'fitness'],
    'kettlebell': ['kettlebell', 'weights'],
    'resistance band': ['resistance bands', 'fitness'],

    // Toys
    'lego': ['lego', 'building blocks'],
    'nerf': ['nerf', 'toy gun'],
    'barbie': ['barbie doll', 'toy'],
    'hot wheels': ['hot wheels', 'toy cars'],
    'funko': ['funko pop', 'collectible'],
    'pokemon': ['pokemon cards', 'trading cards'],
  }

  // Find matching keywords
  for (const [key, terms] of Object.entries(keywords)) {
    if (name.includes(key)) {
      searchTerms.push(...terms)
      break // Use first match
    }
  }

  // If no specific match, use product type from category
  if (searchTerms.length === 0 && brand) {
    searchTerms.push(brand.toLowerCase())
  }

  return searchTerms.slice(0, 3) // Max 3 search terms
}

/**
 * Generate Unsplash image URLs for a product
 */
function generateProductImages(productName: string, brand: string | null, category: string): string[] {
  const searchTerms = extractSearchTerms(productName, brand)

  // If no specific terms, use category
  if (searchTerms.length === 0) {
    searchTerms.push(category.toLowerCase())
  }

  const images: string[] = []
  const baseSearchQuery = searchTerms.join(',')

  // Generate 5 variations with different random seeds based on product name hash
  const hash = productName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

  for (let i = 0; i < 5; i++) {
    const seed = hash + i * 100
    // Use Unsplash Source API with search terms
    // Format: https://source.unsplash.com/800x800/?search_terms&sig=SEED
    const imageUrl = `https://source.unsplash.com/800x800/?${baseSearchQuery}&sig=${seed}`
    images.push(imageUrl)
  }

  return images
}

/**
 * Main function
 */
async function main() {
  console.log('🎨 Generating Product-Specific Matching Images...\n')

  try {
    // Get all products
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      select: { id: true, name: true, brand: true, category: true }
    })

    console.log(`📦 Found ${products.length} products\n`)

    let updated = 0
    const batchSize = 50

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)

      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}...`)

      for (const product of batch) {
        const images = generateProductImages(product.name, product.brand, product.category)

        await prisma.product.update({
          where: { id: product.id },
          data: {
            imageUrl: JSON.stringify(images)
          }
        })

        updated++

        if (updated <= 10) {
          // Show first 10 as examples
          const searchTerms = extractSearchTerms(product.name, product.brand)
          console.log(`  ✅ ${product.name}`)
          console.log(`     Search terms: ${searchTerms.join(', ')}`)
        }
      }

      console.log(`  Updated ${updated}/${products.length} products`)
    }

    console.log('\n🎉 SUCCESS! All products now have matching images!')
    console.log(`✅ ${updated} products updated with product-specific images\n`)

    // Show examples by category
    console.log('📊 Examples by Category:')
    const examples = await prisma.product.findMany({
      where: { isAvailable: true },
      select: { name: true, brand: true, category: true },
      take: 3,
      orderBy: { name: 'asc' }
    })

    for (const example of examples) {
      const terms = extractSearchTerms(example.name, example.brand)
      console.log(`   ${example.category}: "${example.name}"`)
      console.log(`      → Images of: ${terms.join(', ')}\n`)
    }

    console.log('🎯 Now your products have matching images!')
    console.log('   - iPhone 15 Pro → iPhone images')
    console.log('   - Nike Air Jordan → Jordan sneaker images')
    console.log('   - Canon EOS R6 → Canon camera images')
    console.log('   - Dyson Vacuum → Dyson vacuum images\n')

    console.log('📋 Next: Check your app at http://localhost:3000')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

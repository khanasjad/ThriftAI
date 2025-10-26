#!/usr/bin/env npx tsx
/**
 * Generate SQL statements to update products with matching images
 *
 * This script:
 * 1. Fetches all products from database using direct pg connection
 * 2. Generates product-specific Unsplash URLs
 * 3. Creates SQL UPDATE statements
 * 4. Saves to update-images.sql file
 */

import { Client } from 'pg'

// Database connection
const client = new Client({
  user: 'asjadkhan',
  database: 'thriftai_nextjs_dev',
  host: 'localhost',
})

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

  // If no specific match, use category
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

  // Generate hash from product name for consistency
  const hash = productName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

  for (let i = 0; i < 5; i++) {
    const seed = hash + i * 100
    // Use Unsplash Source API with search terms
    const imageUrl = `https://source.unsplash.com/800x800/?${baseSearchQuery}&sig=${seed}`
    images.push(imageUrl)
  }

  return images
}

/**
 * Escape single quotes for SQL
 */
function escapeSql(str: string): string {
  return str.replace(/'/g, "''")
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 Generating SQL for Product-Specific Images...\n')

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Fetch all products
    const result = await client.query(`
      SELECT id, name, brand, category
      FROM products
      WHERE "isAvailable" = true
      ORDER BY id
    `)

    console.log(`📦 Found ${result.rows.length} products\n`)

    // Generate SQL statements
    const sqlStatements: string[] = []

    console.log('🎨 Generating image URLs and SQL...\n')

    for (let i = 0; i < result.rows.length; i++) {
      const product = result.rows[i]
      const images = generateProductImages(product.name, product.brand, product.category)
      const imagesJson = JSON.stringify(images)
      const escapedJson = escapeSql(imagesJson)

      const sql = `UPDATE products SET "imageUrl" = '${escapedJson}' WHERE id = '${product.id}';`
      sqlStatements.push(sql)

      if (i < 10) {
        // Show first 10 as examples
        const searchTerms = extractSearchTerms(product.name, product.brand)
        console.log(`  ✅ ${product.name}`)
        console.log(`     Search: ${searchTerms.join(', ')}`)
      }
    }

    // Write to file
    const fs = await import('fs')
    const outputPath = '/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/scripts/update-images.sql'
    fs.writeFileSync(outputPath, sqlStatements.join('\n'))

    console.log(`\n✅ Generated ${sqlStatements.length} SQL UPDATE statements`)
    console.log(`📁 Saved to: ${outputPath}\n`)
    console.log('🚀 To apply updates, run:')
    console.log(`   psql -U asjadkhan -d thriftai_nextjs_dev -f ${outputPath}\n`)

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await client.end()
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

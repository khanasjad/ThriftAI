// ThriftAI - Generate 1000 Diverse Thrift Products
// Creates a comprehensive product database with realistic images and data

import { PrismaClient } from '@prisma/client'
import { CATEGORIES, CONDITIONS, SIZES, COLORS } from './product-data/categories'
import { BRANDS, getRandomBrandForCategory } from './product-data/brands'
import { getRandomImageForCategory, getMultipleImagesForCategory } from './product-data/image-urls'

const prisma = new PrismaClient()

interface GeneratedProduct {
  name: string
  brand: string
  description: string
  price: number
  originalPrice: number
  condition: string
  category: string
  size?: string
  imageUrl: string
  sellerId: string
}

// Product distribution according to plan
const PRODUCT_DISTRIBUTION = {
  CLOTHING: 200,
  ELECTRONICS: 150,
  SHOES: 120,
  HOME: 100,
  ACCESSORIES: 100,
  BOOKS: 80,
  SPORTS: 80,
  FURNITURE: 70,
  BEAUTY: 50,
  TOYS: 30,
  AUTOMOTIVE: 20
}

// Detailed product templates for each category
const PRODUCT_TEMPLATES = {
  CLOTHING: [
    // Women's Clothing
    { name: 'Vintage {brand} Wrap Dress', subcategory: 'Dresses', priceRange: [25, 85] },
    { name: '{brand} Silk Blouse', subcategory: 'Tops', priceRange: [18, 65] },
    { name: 'Designer {brand} Pencil Skirt', subcategory: 'Bottoms', priceRange: [22, 75] },
    { name: 'Vintage {brand} Cashmere Sweater', subcategory: 'Sweaters', priceRange: [35, 120] },
    { name: '{brand} Maxi Dress', subcategory: 'Dresses', priceRange: [28, 95] },
    { name: 'Vintage {brand} Blazer', subcategory: 'Jackets', priceRange: [30, 85] },
    { name: '{brand} Evening Gown', subcategory: 'Formal', priceRange: [45, 200] },
    { name: 'Bohemian {brand} Tunic', subcategory: 'Tops', priceRange: [15, 55] },
    { name: '{brand} Cocktail Dress', subcategory: 'Dresses', priceRange: [35, 125] },
    { name: 'Vintage {brand} Cardigan', subcategory: 'Sweaters', priceRange: [20, 60] },

    // Men's Clothing
    { name: '{brand} Vintage Button-Down Shirt', subcategory: 'Shirts', priceRange: [18, 65] },
    { name: 'Classic {brand} Wool Suit Jacket', subcategory: 'Suits', priceRange: [45, 150] },
    { name: '{brand} Denim Jacket', subcategory: 'Jackets', priceRange: [25, 85] },
    { name: 'Vintage {brand} Leather Jacket', subcategory: 'Jackets', priceRange: [65, 250] },
    { name: '{brand} Polo Shirt', subcategory: 'Shirts', priceRange: [12, 45] },
    { name: 'Designer {brand} Trousers', subcategory: 'Pants', priceRange: [28, 95] },
    { name: '{brand} Vintage Band T-Shirt', subcategory: 'T-Shirts', priceRange: [15, 75] },
    { name: 'Classic {brand} Sweater', subcategory: 'Sweaters', priceRange: [25, 80] },
    { name: '{brand} Vintage Jeans', subcategory: 'Jeans', priceRange: [22, 85] },
    { name: 'Formal {brand} Dress Shirt', subcategory: 'Shirts', priceRange: [20, 70] }
  ],

  SHOES: [
    { name: 'Vintage {brand} Leather Boots', subcategory: 'Boots', priceRange: [35, 120] },
    { name: '{brand} Athletic Sneakers', subcategory: 'Athletic', priceRange: [25, 95] },
    { name: 'Designer {brand} High Heels', subcategory: 'Heels', priceRange: [40, 180] },
    { name: 'Classic {brand} Loafers', subcategory: 'Casual', priceRange: [30, 85] },
    { name: '{brand} Running Shoes', subcategory: 'Athletic', priceRange: [35, 110] },
    { name: 'Vintage {brand} Oxford Shoes', subcategory: 'Dress', priceRange: [45, 125] },
    { name: '{brand} Ankle Boots', subcategory: 'Boots', priceRange: [38, 105] },
    { name: 'Designer {brand} Sandals', subcategory: 'Sandals', priceRange: [22, 75] },
    { name: '{brand} Canvas Sneakers', subcategory: 'Casual', priceRange: [18, 65] },
    { name: 'Vintage {brand} Cowboy Boots', subcategory: 'Boots', priceRange: [55, 195] }
  ],

  ELECTRONICS: [
    { name: 'Vintage {brand} Smartphone', subcategory: 'Phones', priceRange: [85, 450] },
    { name: '{brand} Laptop Computer', subcategory: 'Computers', priceRange: [200, 800] },
    { name: 'Retro {brand} Camera', subcategory: 'Cameras', priceRange: [45, 285] },
    { name: '{brand} Wireless Headphones', subcategory: 'Audio', priceRange: [25, 195] },
    { name: 'Vintage {brand} Gaming Console', subcategory: 'Gaming', priceRange: [65, 350] },
    { name: '{brand} Tablet Device', subcategory: 'Tablets', priceRange: [95, 425] },
    { name: 'Classic {brand} Stereo System', subcategory: 'Audio', priceRange: [75, 285] },
    { name: '{brand} Digital Camera', subcategory: 'Cameras', priceRange: [55, 325] },
    { name: 'Vintage {brand} Radio', subcategory: 'Audio', priceRange: [35, 125] },
    { name: '{brand} Smart Watch', subcategory: 'Wearables', priceRange: [85, 295] }
  ],

  ACCESSORIES: [
    { name: 'Vintage {brand} Leather Handbag', subcategory: 'Bags', priceRange: [45, 285] },
    { name: '{brand} Designer Watch', subcategory: 'Watches', priceRange: [65, 450] },
    { name: 'Classic {brand} Sunglasses', subcategory: 'Eyewear', priceRange: [25, 125] },
    { name: '{brand} Silk Scarf', subcategory: 'Scarves', priceRange: [18, 85] },
    { name: 'Vintage {brand} Jewelry Set', subcategory: 'Jewelry', priceRange: [35, 195] },
    { name: '{brand} Leather Belt', subcategory: 'Belts', priceRange: [15, 75] },
    { name: 'Designer {brand} Wallet', subcategory: 'Wallets', priceRange: [28, 125] },
    { name: '{brand} Vintage Hat', subcategory: 'Hats', priceRange: [20, 65] },
    { name: 'Statement {brand} Necklace', subcategory: 'Jewelry', priceRange: [22, 95] },
    { name: '{brand} Crossbody Bag', subcategory: 'Bags', priceRange: [35, 145] }
  ],

  HOME: [
    { name: 'Vintage {brand} Ceramic Vase', subcategory: 'Decor', priceRange: [18, 75] },
    { name: '{brand} Crystal Glassware Set', subcategory: 'Glassware', priceRange: [35, 125] },
    { name: 'Antique {brand} Table Lamp', subcategory: 'Lighting', priceRange: [45, 165] },
    { name: '{brand} Kitchen Cookware Set', subcategory: 'Kitchen', priceRange: [28, 95] },
    { name: 'Vintage {brand} Throw Pillow', subcategory: 'Textiles', priceRange: [12, 45] },
    { name: '{brand} Decorative Mirror', subcategory: 'Decor', priceRange: [25, 85] },
    { name: 'Artisan {brand} Pottery Bowl', subcategory: 'Pottery', priceRange: [22, 65] },
    { name: '{brand} Vintage Picture Frame', subcategory: 'Decor', priceRange: [15, 55] },
    { name: 'Classic {brand} Candle Holders', subcategory: 'Decor', priceRange: [18, 65] },
    { name: '{brand} Antique Clock', subcategory: 'Collectibles', priceRange: [55, 185] }
  ],

  BOOKS: [
    { name: 'Vintage {brand} Classic Novel', subcategory: 'Fiction', priceRange: [5, 35] },
    { name: '{brand} Art History Book', subcategory: 'Art', priceRange: [12, 55] },
    { name: 'First Edition {brand} Poetry', subcategory: 'Poetry', priceRange: [25, 125] },
    { name: '{brand} Cookbook Collection', subcategory: 'Cooking', priceRange: [8, 45] },
    { name: 'Vintage {brand} Travel Guide', subcategory: 'Travel', priceRange: [6, 25] },
    { name: '{brand} Philosophy Text', subcategory: 'Philosophy', priceRange: [10, 45] },
    { name: 'Rare {brand} Historical Biography', subcategory: 'Biography', priceRange: [15, 75] },
    { name: '{brand} Science Textbook', subcategory: 'Science', priceRange: [18, 85] },
    { name: 'Vintage {brand} Children\'s Book', subcategory: 'Children', priceRange: [8, 35] },
    { name: '{brand} Self-Help Guide', subcategory: 'Self-Help', priceRange: [5, 25] }
  ],

  SPORTS: [
    { name: 'Vintage {brand} Tennis Racket', subcategory: 'Tennis', priceRange: [25, 85] },
    { name: '{brand} Exercise Equipment', subcategory: 'Fitness', priceRange: [35, 145] },
    { name: 'Classic {brand} Golf Clubs', subcategory: 'Golf', priceRange: [65, 285] },
    { name: '{brand} Athletic Apparel Set', subcategory: 'Apparel', priceRange: [22, 75] },
    { name: 'Vintage {brand} Baseball Glove', subcategory: 'Baseball', priceRange: [18, 65] },
    { name: '{brand} Yoga Mat & Accessories', subcategory: 'Yoga', priceRange: [15, 55] },
    { name: 'Professional {brand} Basketball', subcategory: 'Basketball', priceRange: [12, 45] },
    { name: '{brand} Camping Gear Set', subcategory: 'Outdoor', priceRange: [45, 165] },
    { name: 'Vintage {brand} Ski Equipment', subcategory: 'Winter Sports', priceRange: [85, 325] },
    { name: '{brand} Cycling Accessories', subcategory: 'Cycling', priceRange: [28, 95] }
  ],

  FURNITURE: [
    { name: 'Mid-Century {brand} Armchair', subcategory: 'Seating', priceRange: [125, 485] },
    { name: 'Vintage {brand} Coffee Table', subcategory: 'Tables', priceRange: [85, 285] },
    { name: 'Antique {brand} Wooden Dresser', subcategory: 'Storage', priceRange: [165, 450] },
    { name: '{brand} Bookshelf Unit', subcategory: 'Storage', priceRange: [75, 225] },
    { name: 'Designer {brand} Dining Chair', subcategory: 'Seating', priceRange: [95, 285] },
    { name: 'Vintage {brand} Nightstand', subcategory: 'Bedroom', priceRange: [55, 165] },
    { name: '{brand} Office Desk', subcategory: 'Office', priceRange: [145, 385] },
    { name: 'Retro {brand} Bar Stool', subcategory: 'Seating', priceRange: [65, 185] },
    { name: '{brand} Storage Ottoman', subcategory: 'Storage', priceRange: [45, 125] },
    { name: 'Classic {brand} Side Table', subcategory: 'Tables', priceRange: [35, 95] }
  ],

  BEAUTY: [
    { name: 'Vintage {brand} Perfume', subcategory: 'Fragrance', priceRange: [25, 95] },
    { name: '{brand} Makeup Palette', subcategory: 'Makeup', priceRange: [18, 65] },
    { name: 'Luxury {brand} Skincare Set', subcategory: 'Skincare', priceRange: [35, 125] },
    { name: '{brand} Hair Styling Tools', subcategory: 'Hair Care', priceRange: [22, 85] },
    { name: 'Vintage {brand} Compact Mirror', subcategory: 'Accessories', priceRange: [15, 55] },
    { name: '{brand} Nail Care Kit', subcategory: 'Nail Care', priceRange: [12, 45] },
    { name: 'Professional {brand} Brush Set', subcategory: 'Tools', priceRange: [28, 95] },
    { name: '{brand} Bath & Body Collection', subcategory: 'Bath', priceRange: [20, 65] },
    { name: 'Designer {brand} Lipstick Set', subcategory: 'Makeup', priceRange: [25, 75] },
    { name: '{brand} Anti-Aging Cream', subcategory: 'Skincare', priceRange: [45, 145] }
  ],

  TOYS: [
    { name: 'Vintage {brand} Action Figure', subcategory: 'Action Figures', priceRange: [15, 85] },
    { name: '{brand} Board Game Classic', subcategory: 'Board Games', priceRange: [12, 55] },
    { name: 'Collectible {brand} Doll', subcategory: 'Dolls', priceRange: [25, 125] },
    { name: '{brand} Building Block Set', subcategory: 'Construction', priceRange: [18, 75] },
    { name: 'Vintage {brand} Puzzle', subcategory: 'Puzzles', priceRange: [8, 35] },
    { name: '{brand} Educational Toy', subcategory: 'Educational', priceRange: [15, 65] },
    { name: 'Rare {brand} Model Train', subcategory: 'Models', priceRange: [35, 145] },
    { name: '{brand} Stuffed Animal', subcategory: 'Plush', priceRange: [10, 45] },
    { name: 'Vintage {brand} Electronic Game', subcategory: 'Electronic', priceRange: [22, 95] },
    { name: '{brand} Art & Craft Kit', subcategory: 'Arts & Crafts', priceRange: [12, 45] }
  ],

  AUTOMOTIVE: [
    { name: 'Vintage {brand} License Plate', subcategory: 'Collectibles', priceRange: [15, 65] },
    { name: '{brand} Car Care Kit', subcategory: 'Maintenance', priceRange: [22, 75] },
    { name: 'Classic {brand} Tool Set', subcategory: 'Tools', priceRange: [35, 125] },
    { name: '{brand} Audio System', subcategory: 'Electronics', priceRange: [45, 185] },
    { name: 'Vintage {brand} Auto Manual', subcategory: 'Literature', priceRange: [8, 35] },
    { name: '{brand} Performance Parts', subcategory: 'Parts', priceRange: [55, 225] },
    { name: 'Retro {brand} Accessories', subcategory: 'Accessories', priceRange: [18, 65] },
    { name: '{brand} Safety Equipment', subcategory: 'Safety', priceRange: [25, 85] },
    { name: 'Classic {brand} Memorabilia', subcategory: 'Collectibles', priceRange: [35, 145] },
    { name: '{brand} Navigation Device', subcategory: 'Electronics', priceRange: [28, 95] }
  ]
}

function generateProductName(template: any, brand: string): string {
  return template.name.replace('{brand}', brand)
}

function generateDescription(name: string, brand: string, condition: string, category: string): string {
  const conditionDescriptions = {
    'New': 'Brand new with original packaging and tags. Never worn or used.',
    'Like New': 'Excellent condition with minimal to no signs of wear. Looks almost new.',
    'Excellent': 'Very good condition with only minor signs of use. Well maintained.',
    'Very Good': 'Good condition with light wear and some signs of use. Still very functional.',
    'Good': 'Moderate wear with some visible signs of use but still in good working condition.',
    'Fair': 'Noticeable wear and signs of use but still functional and usable.'
  }

  const sustainabilityNotes = [
    'Perfect for sustainable fashion lovers.',
    'Great for eco-conscious shoppers.',
    'Reduce waste with this pre-loved item.',
    'Sustainable choice for environmentally aware buyers.',
    'Give this item a second life.',
    'Eco-friendly thrift shopping at its best.'
  ]

  const brandNotes = brand !== 'Unbranded' && brand !== 'Vintage' && brand !== 'Handmade'
    ? `Authentic ${brand} quality and craftsmanship. ` : ''

  const randomSustainabilityNote = sustainabilityNotes[Math.floor(Math.random() * sustainabilityNotes.length)]

  return `${brandNotes}${conditionDescriptions[condition as keyof typeof conditionDescriptions]} ${randomSustainabilityNote} This ${category.toLowerCase()} item offers great value and style. Perfect for those who appreciate quality pre-owned goods.`
}

function calculatePricing(template: any, brand: any, condition: string): { price: number; originalPrice: number } {
  const basePrice = template.priceRange[0] + Math.random() * (template.priceRange[1] - template.priceRange[0])

  // Apply brand multiplier
  const brandMultipliedPrice = basePrice * brand.priceMultiplier

  // Apply condition multiplier
  const conditionMultipliers = {
    'New': 0.85,
    'Like New': 0.75,
    'Excellent': 0.65,
    'Very Good': 0.55,
    'Good': 0.45,
    'Fair': 0.35
  }

  const finalPrice = brandMultipliedPrice * conditionMultipliers[condition as keyof typeof conditionMultipliers]

  // Calculate original price (thrift price should be 40-70% off retail)
  const discountRange = 0.4 + Math.random() * 0.3 // 40-70% discount
  const originalPrice = finalPrice / (1 - discountRange)

  return {
    price: Math.round(finalPrice * 100) / 100,
    originalPrice: Math.round(originalPrice * 100) / 100
  }
}

function getRandomSize(category: string): string | undefined {
  if (category === 'CLOTHING') {
    const sizes = SIZES.CLOTHING
    return sizes[Math.floor(Math.random() * sizes.length)]
  } else if (category === 'SHOES') {
    const sizes = SIZES.SHOES
    return sizes[Math.floor(Math.random() * sizes.length)]
  } else if (category === 'SPORTS') {
    // 70% chance of having a size for sports items
    if (Math.random() > 0.3) {
      const sizes = SIZES.SPORTS
      return sizes[Math.floor(Math.random() * sizes.length)]
    }
  }
  return undefined
}

async function generateProducts(): Promise<void> {
  console.log('🚀 Starting generation of 1000 diverse thrift products...')

  // Get or create default seller
  let defaultSeller = await prisma.seller.findFirst()
  if (!defaultSeller) {
    // Create a default seller if none exists
    const user = await prisma.user.create({
      data: {
        email: 'thriftai@example.com',
        firstName: 'ThriftAI',
        lastName: 'Store'
      }
    })

    defaultSeller = await prisma.seller.create({
      data: {
        userId: user.id,
        businessName: 'ThriftAI Marketplace',
        ownerName: 'ThriftAI Store',
        email: 'thriftai@example.com',
        phone: '555-0123',
        address: '123 Thrift Street',
        city: 'Thrift City',
        state: 'CA',
        zipCode: '90210',
        isVerified: true,
        rating: 4.8
      }
    })
  }

  const products: GeneratedProduct[] = []

  for (const [category, count] of Object.entries(PRODUCT_DISTRIBUTION)) {
    console.log(`📦 Generating ${count} products for ${category}...`)

    const templates = PRODUCT_TEMPLATES[category as keyof typeof PRODUCT_TEMPLATES]

    for (let i = 0; i < count; i++) {
      try {
        // Get random template and brand
        const template = templates[Math.floor(Math.random() * templates.length)]
        const brand = getRandomBrandForCategory(category)

        // Generate product details
        const name = generateProductName(template, brand.name)
        const condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)].value
        const pricing = calculatePricing(template, brand, condition)
        const description = generateDescription(name, brand.name, condition, category)
        const imageUrl = getRandomImageForCategory(category)
        const size = getRandomSize(category)

        const product: GeneratedProduct = {
          name,
          brand: brand.name,
          description,
          price: pricing.price,
          originalPrice: pricing.originalPrice,
          condition,
          category,
          size,
          imageUrl,
          sellerId: defaultSeller.id
        }

        products.push(product)

        if ((i + 1) % 20 === 0) {
          console.log(`  ✅ Generated ${i + 1}/${count} ${category} products`)
        }
      } catch (error) {
        console.error(`❌ Error generating product ${i + 1} for ${category}:`, error)
      }
    }
  }

  console.log(`🎯 Generated ${products.length} products total. Starting database insertion...`)

  // Insert products in batches
  const batchSize = 50
  let insertedCount = 0

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)

    try {
      await prisma.product.createMany({
        data: batch.map(product => ({
          name: product.name,
          brand: product.brand,
          description: product.description,
          price: product.price,
          originalPrice: product.originalPrice,
          condition: product.condition,
          category: product.category,
          size: product.size,
          imageUrl: product.imageUrl,
          sellerId: product.sellerId,
          isAvailable: true
        }))
      })

      insertedCount += batch.length
      console.log(`💾 Inserted ${insertedCount}/${products.length} products`)
    } catch (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error)
    }
  }

  console.log('📊 Generating final statistics...')

  // Generate statistics
  const stats = await prisma.product.groupBy({
    by: ['category'],
    _count: {
      id: true
    }
  })

  console.log('\n🎉 Product generation completed successfully!')
  console.log('📋 Final Statistics:')
  console.log(`   Total Products: ${insertedCount}`)

  stats.forEach(stat => {
    console.log(`   ${stat.category}: ${stat._count.id} products`)
  })

  const priceStats = await prisma.product.aggregate({
    _avg: { price: true, originalPrice: true },
    _min: { price: true },
    _max: { price: true }
  })

  console.log(`\n💰 Price Statistics:`)
  console.log(`   Average Price: $${priceStats._avg.price?.toFixed(2)}`)
  console.log(`   Average Original Price: $${priceStats._avg.originalPrice?.toFixed(2)}`)
  console.log(`   Price Range: $${priceStats._min.price} - $${priceStats._max.price}`)

  const avgSavings = priceStats._avg.price && priceStats._avg.originalPrice
    ? ((priceStats._avg.originalPrice - priceStats._avg.price) / priceStats._avg.originalPrice * 100).toFixed(1)
    : 0
  console.log(`   Average Savings: ${avgSavings}%`)

  console.log('\n🛍️  Your ThriftAI marketplace is now fully stocked!')
  console.log('🔍 Test the search functionality with terms like:')
  console.log('   - "vintage"')
  console.log('   - "designer"')
  console.log('   - "leather"')
  console.log('   - specific brands like "Nike" or "Gucci"')
  console.log('   - categories like "electronics" or "furniture"')
}

async function main() {
  try {
    await generateProducts()
  } catch (error) {
    console.error('❌ Fatal error during product generation:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
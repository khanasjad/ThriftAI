/**
 * Seed 1000 High-Quality Products with Images
 * Generates diverse, realistic product data across multiple categories
 */

import { PrismaClient } from '@prisma/client'
import { generateOptimizedParams } from '../src/lib/services/optimizedScoreParameters'

const prisma = new PrismaClient()

// Product templates organized by category
const PRODUCT_TEMPLATES = {
  ELECTRONICS: {
    prefix: ['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft'],
    products: ['iPhone', 'Galaxy Phone', 'MacBook', 'iPad', 'Smart TV', 'Laptop', 'Tablet', 'Monitor', 'Headphones', 'Smartwatch',
               'Camera', 'Drone', 'Speaker', 'Keyboard', 'Mouse', 'Webcam', 'Router', 'Hard Drive', 'SSD', 'Graphics Card',
               'Gaming Console', 'Controller', 'VR Headset', 'Fitness Tracker', 'E-Reader', 'Printer', 'Scanner', 'Projector'],
    suffixes: ['Pro', 'Max', 'Ultra', 'Plus', 'Mini', 'Air', 'Lite', 'Premium', 'Standard', 'Basic'],
    priceRange: [50, 2500],
    imageKeywords: ['technology', 'electronics', 'gadget', 'device', 'tech']
  },
  CLOTHING: {
    prefix: ['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo', 'Gap', 'Levi', 'Ralph Lauren', 'Tommy Hilfiger', 'Calvin Klein'],
    products: ['T-Shirt', 'Jeans', 'Dress', 'Jacket', 'Hoodie', 'Sweater', 'Shirt', 'Pants', 'Shorts', 'Blazer',
               'Coat', 'Cardigan', 'Polo', 'Tank Top', 'Sweatshirt', 'Tracksuit', 'Jumpsuit', 'Skirt', 'Blouse', 'Suit'],
    suffixes: ['Classic', 'Vintage', 'Modern', 'Slim Fit', 'Regular', 'Casual', 'Formal', 'Sport', 'Comfort', 'Premium'],
    priceRange: [15, 200],
    imageKeywords: ['clothing', 'fashion', 'apparel', 'wear', 'style']
  },
  SHOES: {
    prefix: ['Nike', 'Adidas', 'Converse', 'Vans', 'Puma', 'New Balance', 'Reebok', 'Skechers', 'Under Armour', 'Asics'],
    products: ['Running Shoes', 'Sneakers', 'Boots', 'Sandals', 'Loafers', 'Oxfords', 'Flats', 'Heels', 'Slippers', 'Athletic Shoes',
               'Basketball Shoes', 'Tennis Shoes', 'Hiking Boots', 'Chelsea Boots', 'Ankle Boots', 'Dress Shoes', 'Casual Shoes'],
    suffixes: ['Air', 'Boost', 'Max', 'Pro', 'Ultra', 'Comfort', 'Sport', 'Classic', 'Premium', 'Elite'],
    priceRange: [30, 300],
    imageKeywords: ['shoes', 'footwear', 'sneakers', 'boots', 'fashion']
  },
  ACCESSORIES: {
    prefix: ['Ray-Ban', 'Fossil', 'Michael Kors', 'Coach', 'Kate Spade', 'Tumi', 'Samsonite', 'Herschel', 'Oakley', 'Gucci'],
    products: ['Sunglasses', 'Watch', 'Handbag', 'Wallet', 'Belt', 'Hat', 'Scarf', 'Gloves', 'Backpack', 'Luggage',
               'Jewelry', 'Bracelet', 'Necklace', 'Earrings', 'Ring', 'Tie', 'Bow Tie', 'Cufflinks', 'Umbrella', 'Keychain'],
    suffixes: ['Collection', 'Series', 'Edition', 'Classic', 'Vintage', 'Modern', 'Luxury', 'Designer', 'Premium', 'Standard'],
    priceRange: [10, 500],
    imageKeywords: ['accessories', 'fashion', 'style', 'luxury', 'elegant']
  },
  HOME: {
    prefix: ['IKEA', 'West Elm', 'Pottery Barn', 'Crate&Barrel', 'Target', 'Wayfair', 'HomeGoods', 'Pier 1', 'Williams Sonoma'],
    products: ['Sofa', 'Chair', 'Table', 'Lamp', 'Rug', 'Curtains', 'Bedding', 'Pillow', 'Blanket', 'Mirror',
               'Vase', 'Clock', 'Frame', 'Shelf', 'Desk', 'Dresser', 'Nightstand', 'Ottoman', 'Bench', 'Cabinet'],
    suffixes: ['Modern', 'Contemporary', 'Rustic', 'Industrial', 'Scandinavian', 'Mid-Century', 'Traditional', 'Minimalist'],
    priceRange: [20, 1500],
    imageKeywords: ['home', 'interior', 'furniture', 'decor', 'room']
  },
  SPORTS: {
    prefix: ['Nike', 'Adidas', 'Wilson', 'Spalding', 'Titleist', 'Callaway', 'Yeti', 'Coleman', 'Patagonia', 'North Face'],
    products: ['Basketball', 'Football', 'Soccer Ball', 'Tennis Racket', 'Golf Club', 'Yoga Mat', 'Dumbbells', 'Kettlebell',
               'Resistance Bands', 'Jump Rope', 'Bike', 'Skateboard', 'Helmet', 'Water Bottle', 'Gym Bag', 'Tent', 'Sleeping Bag'],
    suffixes: ['Pro', 'Elite', 'Performance', 'Training', 'Competition', 'Professional', 'Amateur', 'Beginner', 'Advanced'],
    priceRange: [15, 800],
    imageKeywords: ['sports', 'fitness', 'exercise', 'athletic', 'workout']
  },
  BOOKS: {
    prefix: ['', '', '', '', ''], // Books don't need brand prefix
    products: ['Fiction Novel', 'Non-Fiction Book', 'Biography', 'Cookbook', 'Self-Help Book', 'History Book', 'Science Book',
               'Mystery Novel', 'Romance Novel', 'Thriller', 'Fantasy Novel', 'Guide Book', 'Textbook', 'Art Book', 'Children Book'],
    suffixes: ['Hardcover', 'Paperback', 'Illustrated Edition', 'Special Edition', 'Anniversary Edition', 'Revised Edition'],
    priceRange: [8, 50],
    imageKeywords: ['book', 'reading', 'literature', 'pages', 'library']
  },
  BEAUTY: {
    prefix: ['Clinique', 'Estée Lauder', 'MAC', 'Maybelline', 'L\'Oreal', 'Neutrogena', 'Olay', 'Dove', 'CeraVe', 'Cetaphil'],
    products: ['Moisturizer', 'Serum', 'Cleanser', 'Sunscreen', 'Foundation', 'Lipstick', 'Mascara', 'Eyeshadow', 'Perfume', 'Cologne',
               'Shampoo', 'Conditioner', 'Body Wash', 'Lotion', 'Face Mask', 'Toner', 'Night Cream', 'Eye Cream', 'Lip Balm'],
    suffixes: ['Formula', 'Collection', 'Line', 'Series', 'Range', 'System', 'Treatment', 'Care', 'Therapy', 'Solution'],
    priceRange: [10, 200],
    imageKeywords: ['beauty', 'cosmetics', 'skincare', 'makeup', 'luxury']
  },
  TOYS: {
    prefix: ['LEGO', 'Mattel', 'Hasbro', 'Fisher-Price', 'Barbie', 'Hot Wheels', 'Nerf', 'Play-Doh', 'Melissa & Doug', 'VTech'],
    products: ['Building Set', 'Action Figure', 'Doll', 'Board Game', 'Puzzle', 'Plush Toy', 'Remote Control Car', 'Educational Toy',
               'Art Set', 'Science Kit', 'Toy Car', 'Toy Train', 'Dollhouse', 'Play Kitchen', 'Sports Toy', 'Musical Toy'],
    suffixes: ['Set', 'Collection', 'Playset', 'Kit', 'Pack', 'Bundle', 'Series', 'Edition', 'Deluxe', 'Ultimate'],
    priceRange: [10, 150],
    imageKeywords: ['toy', 'play', 'kids', 'children', 'fun']
  },
  AUTOMOTIVE: {
    prefix: ['Bosch', 'Michelin', 'Mobil', 'Garmin', 'Pioneer', 'Sony', 'JBL', 'WeatherTech', 'Thule', '3M'],
    products: ['Car Charger', 'Phone Mount', 'Dash Cam', 'GPS', 'Car Vacuum', 'Tire Gauge', 'Jump Starter', 'Car Cover',
               'Floor Mats', 'Seat Covers', 'Steering Wheel Cover', 'Air Freshener', 'Tool Kit', 'Emergency Kit', 'Car Wax'],
    suffixes: ['Pro', 'Plus', 'Premium', 'Universal', 'Heavy Duty', 'Professional', 'Deluxe', 'Standard', 'Basic'],
    priceRange: [10, 300],
    imageKeywords: ['car', 'automotive', 'vehicle', 'auto', 'driving']
  }
}

const CONDITIONS = ['new', 'like-new', 'excellent', 'good', 'fair']
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size', 'Universal']

// Helper functions
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function generateProductName(category: keyof typeof PRODUCT_TEMPLATES): string {
  const template = PRODUCT_TEMPLATES[category]
  const prefix = randomChoice(template.prefix)
  const product = randomChoice(template.products)
  const suffix = randomChoice(template.suffixes)

  // Sometimes include all parts, sometimes just some
  const rand = Math.random()
  if (rand < 0.4) return `${prefix} ${product} ${suffix}`.trim()
  if (rand < 0.7) return `${prefix} ${product}`.trim()
  if (rand < 0.9) return `${product} ${suffix}`.trim()
  return product
}

function generateDescription(category: string, name: string): string {
  const descriptions = [
    `High-quality ${name.toLowerCase()} perfect for everyday use. Features durable construction and modern design.`,
    `Premium ${name.toLowerCase()} with excellent craftsmanship. Ideal for both casual and professional settings.`,
    `Top-rated ${name.toLowerCase()} offering great value. Trusted by thousands of satisfied customers.`,
    `Stylish ${name.toLowerCase()} that combines functionality with aesthetics. A must-have for your collection.`,
    `Professional-grade ${name.toLowerCase()} built to last. Exceeds expectations in quality and performance.`,
    `Versatile ${name.toLowerCase()} suitable for various occasions. Easy to use and maintain.`,
    `Award-winning ${name.toLowerCase()} with innovative features. Highly recommended by experts.`,
    `Authentic ${name.toLowerCase()} made with premium materials. Experience the difference in quality.`,
    `Best-selling ${name.toLowerCase()} with rave reviews. Join thousands of happy customers.`,
    `Limited edition ${name.toLowerCase()} featuring exclusive design. Don't miss this opportunity.`
  ]
  return randomChoice(descriptions)
}

function getImageUrl(category: string, index: number, productName: string): string {
  // Use Lorem Picsum for reliable placeholder images
  // Each category gets a different seed range for variety
  const categorySeeds: Record<string, number> = {
    'ELECTRONICS': 1,
    'CLOTHING': 100,
    'SHOES': 200,
    'ACCESSORIES': 300,
    'HOME': 400,
    'SPORTS': 500,
    'BOOKS': 600,
    'BEAUTY': 700,
    'TOYS': 800,
    'AUTOMOTIVE': 900
  }

  const baseSeed = categorySeeds[category] || 0
  const seed = baseSeed + (index % 100)

  // Use Picsum Photos - reliable and fast
  return `https://picsum.photos/seed/${category.toLowerCase()}-${seed}/800/600`
}

async function seed1000Products() {
  console.log('🚀 Seeding 1000 high-quality products...\n')
  console.log('='.repeat(80))

  // Clear existing data
  console.log('\n🗑️  Clearing existing data...')

  // Delete in correct order due to foreign key constraints
  await prisma.review.deleteMany({})
  await prisma.productView.deleteMany({})
  await prisma.productAnalytics.deleteMany({})
  await prisma.cartItem.deleteMany({})
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.productEmbedding.deleteMany({})
  await prisma.productComparison.deleteMany({})
  await prisma.product.deleteMany({})

  // Delete buyers (will cascade delete their users)
  await prisma.buyer.deleteMany({
    where: {
      email: {
        contains: 'reviewer'
      }
    }
  })

  // Delete reviewer users
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'reviewer'
      }
    }
  })

  console.log('✅ Existing data cleared')

  // Get existing seller or create one
  let seller = await prisma.seller.findFirst()

  if (!seller) {
    const user = await prisma.user.create({
      data: {
        email: 'seller@thriftai.com',
        firstName: 'Premium',
        lastName: 'Seller'
      }
    })

    seller = await prisma.seller.create({
      data: {
        userId: user.id,
        businessName: 'ThriftAI Premium Store',
        ownerName: 'Premium Seller',
        email: 'seller@thriftai.com',
        phone: '+1-555-0100',
        address: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        rating: 4.7,
        totalSales: 5000,
        isVerified: true,
        responseTimeHours: 2.5,
        avgShipmentDays: 2.0,
        onTimeDeliveryRate: 0.97,
        defectRate: 0.01,
        customerSatisfactionRate: 0.95
      }
    })
  }

  console.log(`\n✅ Using seller: ${seller.businessName}\n`)

  const categories = Object.keys(PRODUCT_TEMPLATES)
  const productsPerCategory = Math.floor(1000 / categories.length)
  let totalCreated = 0

  for (const category of categories) {
    console.log(`\n📦 Creating ${productsPerCategory} ${category} products...`)
    const template = PRODUCT_TEMPLATES[category as keyof typeof PRODUCT_TEMPLATES]

    for (let i = 0; i < productsPerCategory; i++) {
      const name = generateProductName(category as keyof typeof PRODUCT_TEMPLATES)
      const price = randomFloat(template.priceRange[0], template.priceRange[1])
      const hasDiscount = Math.random() < 0.3 // 30% have discounts
      const originalPrice = hasDiscount ? price * randomFloat(1.2, 1.8) : price
      const condition = randomChoice(CONDITIONS)
      const description = generateDescription(category, name)
      const imageUrl = getImageUrl(category, i, name)
      const brand = template.prefix.filter(p => p.length > 0).length > 0 ? randomChoice(template.prefix.filter(p => p.length > 0)) : undefined

      // Generate optimized parameters
      const productId = `temp-${category}-${i}`
      const params = generateOptimizedParams(productId, price, category, originalPrice)

      // Calculate scores
      const qualityScore = randomFloat(70, 100)
      const popularityScore = randomFloat(60, 100)
      const trendingScore = randomFloat(20, 80)

      // Create product
      const product = await prisma.product.create({
        data: {
          name,
          category,
          brand,
          price,
          originalPrice,
          condition,
          description,
          imageUrl,
          size: ['CLOTHING', 'SHOES'].includes(category) ? randomChoice(SIZES) : undefined,
          isAvailable: Math.random() < 0.95, // 95% available

          // Stock & Availability
          stockQuantity: params.stockLevel,
          lowStockThreshold: 5,

          // Shipping & Delivery
          shippingCost: params.shippingCost,
          estimatedDeliveryDays: params.estimatedDeliveryDays,
          hasFreeShipping: params.hasFreeShipping,
          hasFreeReturns: params.hasFreeReturns,
          returnPeriodDays: params.returnPeriodDays,
          weight: randomFloat(0.1, 5.0),

          // Quality Indicators
          hasWarranty: params.hasWarranty,
          isAuthentic: true,
          certifications: [],

          // Performance Metrics
          viewCount: params.viewsLast24h,
          clickCount: Math.floor(params.viewsLast24h * params.clickThroughRate),
          purchaseCount: params.salesLast7Days,
          cartAdditionCount: params.cartAdditionsLast24h,
          wishlistCount: Math.floor(params.viewsLast24h * 0.05),

          // Computed Scores
          popularityScore,
          qualityScore,
          trendingScore,
          relevanceScore: randomFloat(50, 100),

          // Search Optimization
          searchKeywords: [
            name.toLowerCase(),
            category.toLowerCase(),
            brand?.toLowerCase() || '',
            ...name.split(' ').map(w => w.toLowerCase())
          ].filter(k => k.length > 2),

          tags: [
            category,
            condition,
            params.hasFreeShipping ? 'free-shipping' : '',
            params.hasWarranty ? 'warranty' : '',
            hasDiscount ? 'on-sale' : '',
            brand || ''
          ].filter(t => t.length > 0),

          // Analytics Timestamps
          lastViewedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          lastPurchasedAt: params.salesLast7Days > 0
            ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            : null,

          // Relations
          sellerId: seller?.id
        }
      })

      // Create reviews for some products (30% chance)
      if (Math.random() < 0.3) {
        const numReviews = randomInt(1, 10)
        for (let j = 0; j < numReviews; j++) {
          // Create a buyer for the review with unique email
          const uniqueId = `${Date.now()}-${totalCreated}-${j}-${Math.random().toString(36).substr(2, 9)}`
          const reviewerUser = await prisma.user.create({
            data: {
              email: `reviewer-${uniqueId}@example.com`,
              firstName: `Reviewer${j}`,
              lastName: `User`
            }
          })

          const reviewer = await prisma.buyer.create({
            data: {
              userId: reviewerUser.id,
              firstName: `Reviewer${j}`,
              lastName: `User`,
              email: `reviewer-${uniqueId}@example.com`
            }
          })

          await prisma.review.create({
            data: {
              buyerId: reviewer.id,
              productId: product.id,
              title: randomChoice([
                'Great product!',
                'Excellent quality',
                'Highly recommended',
                'Perfect!',
                'Love it!',
                'Amazing value',
                'Very satisfied',
                'Good purchase',
                'Worth the money',
                'Fantastic!'
              ]),
              content: randomChoice([
                'This product exceeded my expectations. Highly recommend!',
                'Great quality for the price. Very satisfied with my purchase.',
                'Exactly as described. Fast shipping and excellent service.',
                'Love this product! Using it every day.',
                'Good value for money. Would buy again.',
                'Excellent quality and fast delivery. Five stars!',
                'Perfect for my needs. Very happy with this purchase.',
                'Great product! Exactly what I was looking for.',
                'High quality and works perfectly. Recommended!',
                'Very satisfied with this purchase. Great seller too!'
              ]),
              rating: randomInt(4, 5), // Mostly positive reviews
              conditionRating: randomInt(4, 5),
              valueRating: randomInt(4, 5),
              sellerRating: randomInt(4, 5),
              shippingRating: randomInt(4, 5),
              isVerifiedPurchase: Math.random() < 0.8, // 80% verified
              status: 'APPROVED'
            }
          })
        }
      }

      totalCreated++
      if (totalCreated % 50 === 0) {
        console.log(`   ✅ Created ${totalCreated} products...`)
      }
    }
  }

  // Create remaining products to reach exactly 1000
  const remaining = 1000 - totalCreated
  if (remaining > 0) {
    console.log(`\n📦 Creating ${remaining} additional products...`)
    for (let i = 0; i < remaining; i++) {
      const category = randomChoice(categories)
      const template = PRODUCT_TEMPLATES[category as keyof typeof PRODUCT_TEMPLATES]

      const name = generateProductName(category as keyof typeof PRODUCT_TEMPLATES)
      const price = randomFloat(template.priceRange[0], template.priceRange[1])
      const hasDiscount = Math.random() < 0.3
      const originalPrice = hasDiscount ? price * randomFloat(1.2, 1.8) : price

      const productId = `temp-extra-${i}`
      const params = generateOptimizedParams(productId, price, category, originalPrice)

      await prisma.product.create({
        data: {
          name,
          category,
          brand: template.prefix.filter(p => p.length > 0).length > 0 ? randomChoice(template.prefix.filter(p => p.length > 0)) : undefined,
          price,
          originalPrice,
          condition: randomChoice(CONDITIONS),
          description: generateDescription(category, name),
          imageUrl: getImageUrl(category, i, name),
          isAvailable: Math.random() < 0.95,
          stockQuantity: params.stockLevel,
          lowStockThreshold: 5,
          shippingCost: params.shippingCost,
          estimatedDeliveryDays: params.estimatedDeliveryDays,
          hasFreeShipping: params.hasFreeShipping,
          hasFreeReturns: params.hasFreeReturns,
          returnPeriodDays: params.returnPeriodDays,
          hasWarranty: params.hasWarranty,
          isAuthentic: true,
          viewCount: params.viewsLast24h,
          clickCount: Math.floor(params.viewsLast24h * params.clickThroughRate),
          purchaseCount: params.salesLast7Days,
          cartAdditionCount: params.cartAdditionsLast24h,
          wishlistCount: Math.floor(params.viewsLast24h * 0.05),
          popularityScore: randomFloat(60, 100),
          qualityScore: randomFloat(70, 100),
          trendingScore: randomFloat(20, 80),
          relevanceScore: randomFloat(50, 100),
          searchKeywords: [name.toLowerCase(), category.toLowerCase()],
          tags: [category, params.hasFreeShipping ? 'free-shipping' : ''].filter(t => t.length > 0),
          lastViewedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          sellerId: seller?.id
        }
      })

      totalCreated++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`\n✨ Successfully created ${totalCreated} products!`)

  // Generate statistics
  const stats = await prisma.product.aggregate({
    _count: { id: true },
    _avg: {
      price: true,
      popularityScore: true,
      qualityScore: true,
      viewCount: true
    }
  })

  const byCategory = await prisma.product.groupBy({
    by: ['category'],
    _count: { category: true },
    _avg: { price: true }
  })

  console.log('\n📊 Database Statistics:')
  console.log(`   Total Products: ${stats._count.id}`)
  console.log(`   Avg Price: $${stats._avg.price?.toFixed(2)}`)
  console.log(`   Avg Popularity: ${stats._avg.popularityScore?.toFixed(2)}/100`)
  console.log(`   Avg Quality: ${stats._avg.qualityScore?.toFixed(2)}/100`)
  console.log(`   Avg Views: ${Math.floor(stats._avg.viewCount || 0)}`)

  console.log('\n📦 Products by Category:')
  byCategory.forEach(cat => {
    console.log(`   ${cat.category}: ${cat._count.category} products (avg $${cat._avg.price?.toFixed(2)})`)
  })

  const withReviews = await prisma.product.count({
    where: { reviews: { some: {} } }
  })
  const totalReviews = await prisma.review.count()

  console.log('\n⭐ Review Statistics:')
  console.log(`   Products with reviews: ${withReviews} (${((withReviews / totalCreated) * 100).toFixed(1)}%)`)
  console.log(`   Total reviews: ${totalReviews}`)
  console.log(`   Avg reviews per product: ${(totalReviews / withReviews).toFixed(1)}`)

  const withFreeShipping = await prisma.product.count({ where: { hasFreeShipping: true } })
  const withWarranty = await prisma.product.count({ where: { hasWarranty: true } })
  const lowStock = await prisma.product.count({ where: { stockQuantity: { lte: 5 } } })

  console.log('\n🎁 Feature Statistics:')
  console.log(`   Free Shipping: ${withFreeShipping} (${((withFreeShipping / totalCreated) * 100).toFixed(1)}%)`)
  console.log(`   With Warranty: ${withWarranty} (${((withWarranty / totalCreated) * 100).toFixed(1)}%)`)
  console.log(`   Low Stock: ${lowStock} (${((lowStock / totalCreated) * 100).toFixed(1)}%)`)

  console.log('\n' + '='.repeat(80))
}

seed1000Products()
  .then(() => {
    console.log('\n✅ Seed completed successfully!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
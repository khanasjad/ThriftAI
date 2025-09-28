// ThriftAI Database Seed Script
// Creates sample products for testing search functionality

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sampleProducts = [
  // Nike Shoes
  {
    name: 'Nike Air Force 1 Classic White',
    category: 'SHOES',
    brand: 'Nike',
    price: 89.99,
    originalPrice: 120.00,
    condition: 'Good',
    description: 'Classic Nike Air Force 1 sneakers in white leather. Gently used, excellent condition. Perfect for casual wear and streetwear styling.',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
    size: '10',
    isAvailable: true
  },
  {
    name: 'Nike Vintage Running Shoes',
    category: 'SHOES',
    brand: 'Nike',
    price: 65.00,
    originalPrice: 95.00,
    condition: 'Fair',
    description: 'Vintage Nike running shoes from the 90s. Retro athletic footwear with classic styling. Shows some wear but still comfortable.',
    imageUrl: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400',
    size: '9',
    isAvailable: true
  },
  {
    name: 'Nike Air Max Sneakers Blue',
    category: 'SHOES',
    brand: 'Nike',
    price: 75.50,
    originalPrice: 110.00,
    condition: 'Good',
    description: 'Nike Air Max sneakers in blue and white colorway. Athletic shoes with visible air cushioning. Great for everyday wear.',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    size: '11',
    isAvailable: true
  },

  // Other Shoes
  {
    name: 'Adidas Originals Vintage Sneakers',
    category: 'SHOES',
    brand: 'Adidas',
    price: 55.00,
    originalPrice: 85.00,
    condition: 'Good',
    description: 'Classic Adidas Originals sneakers with three stripes. Vintage athletic footwear in excellent condition.',
    imageUrl: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400',
    size: '10',
    isAvailable: true
  },
  {
    name: 'Converse Chuck Taylor High Tops',
    category: 'SHOES',
    brand: 'Converse',
    price: 35.00,
    originalPrice: 65.00,
    condition: 'Fair',
    description: 'Classic Converse Chuck Taylor All Star high-top sneakers in black canvas. Timeless design, shows minimal wear.',
    imageUrl: 'https://images.unsplash.com/photo-1520256862855-398228c41684?w=400',
    size: '9',
    isAvailable: true
  },

  // Electronics
  {
    name: 'iPhone 12 Pro Unlocked',
    category: 'ELECTRONICS',
    brand: 'Apple',
    price: 599.99,
    originalPrice: 999.00,
    condition: 'Excellent',
    description: 'Apple iPhone 12 Pro 128GB in Pacific Blue. Unlocked smartphone with excellent battery life. Minor cosmetic wear only.',
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
    size: '128GB',
    isAvailable: true
  },
  {
    name: 'Samsung Galaxy S21 Android Phone',
    category: 'ELECTRONICS',
    brand: 'Samsung',
    price: 449.99,
    originalPrice: 799.99,
    condition: 'Good',
    description: 'Samsung Galaxy S21 smartphone with 5G connectivity. Android mobile phone in excellent working condition.',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    size: '256GB',
    isAvailable: true
  },
  {
    name: 'MacBook Pro 13" M1 Laptop',
    category: 'ELECTRONICS',
    brand: 'Apple',
    price: 899.99,
    originalPrice: 1299.00,
    condition: 'Excellent',
    description: 'Apple MacBook Pro 13-inch with M1 chip. Excellent condition laptop computer with 8GB RAM and 256GB SSD.',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    size: '13"',
    isAvailable: true
  },

  // Clothing
  {
    name: 'Vintage Denim Jacket',
    category: 'CLOTHING',
    brand: 'Levi\'s',
    price: 45.00,
    originalPrice: 89.99,
    condition: 'Good',
    description: 'Classic vintage Levi\'s denim jacket. Timeless blue jean jacket with authentic vintage styling and distressing.',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    size: 'L',
    isAvailable: true
  },
  {
    name: 'Nike Athletic Hoodie',
    category: 'CLOTHING',
    brand: 'Nike',
    price: 32.50,
    originalPrice: 65.00,
    condition: 'Good',
    description: 'Nike athletic hoodie in gray. Comfortable activewear sweater with front pocket and Nike swoosh logo.',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
    size: 'M',
    isAvailable: true
  },
  {
    name: 'Vintage Band T-Shirt',
    category: 'CLOTHING',
    brand: 'Unbranded',
    price: 25.00,
    originalPrice: 40.00,
    condition: 'Fair',
    description: 'Vintage band t-shirt with classic rock design. Soft cotton tee with authentic vintage feel and graphics.',
    imageUrl: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400',
    size: 'L',
    isAvailable: true
  },
  {
    name: 'Designer Wool Sweater',
    category: 'CLOTHING',
    brand: 'Gap',
    price: 38.99,
    originalPrice: 79.99,
    condition: 'Excellent',
    description: 'Premium wool sweater from Gap in navy blue. Excellent condition with no pilling or stains.',
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
    size: 'M',
    isAvailable: true
  },

  // Accessories
  {
    name: 'Vintage Leather Handbag',
    category: 'ACCESSORIES',
    brand: 'Coach',
    price: 125.00,
    originalPrice: 350.00,
    condition: 'Good',
    description: 'Authentic vintage Coach leather handbag in brown. Classic luxury purse with minimal wear and authentic craftsmanship.',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    size: 'Medium',
    isAvailable: true
  },
  {
    name: 'Ray-Ban Aviator Sunglasses',
    category: 'ACCESSORIES',
    brand: 'Ray-Ban',
    price: 85.00,
    originalPrice: 150.00,
    condition: 'Excellent',
    description: 'Classic Ray-Ban Aviator sunglasses with gold frames. Iconic design with excellent UV protection.',
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400',
    size: 'Standard',
    isAvailable: true
  },
  {
    name: 'Apple Watch Series 6',
    category: 'ACCESSORIES',
    brand: 'Apple',
    price: 249.99,
    originalPrice: 399.99,
    condition: 'Excellent',
    description: 'Apple Watch Series 6 with GPS in space gray aluminum. Smartwatch with health tracking and fitness features.',
    imageUrl: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400',
    size: '44mm',
    isAvailable: true
  },
  {
    name: 'Vintage Gold Watch',
    category: 'ACCESSORIES',
    brand: 'Seiko',
    price: 95.00,
    originalPrice: 200.00,
    condition: 'Good',
    description: 'Vintage Seiko gold-tone watch with automatic movement. Classic timepiece with leather strap.',
    imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400',
    size: 'Standard',
    isAvailable: true
  }
]

async function main() {
  console.log('🌱 Starting database seed...')

  // First, create a default seller if it doesn't exist
  let defaultSeller = await prisma.seller.findFirst({
    where: { businessName: 'ThriftAI Default Seller' }
  })

  if (!defaultSeller) {
    // Create a default user first or find existing one
    let defaultUser = await prisma.user.findUnique({
      where: { email: 'seller@thriftai.com' }
    })

    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          email: 'seller@thriftai.com',
          firstName: 'ThriftAI',
          lastName: 'Seller'
        }
      })
    }

    // Check if this user already has a seller account
    const existingSeller = await prisma.seller.findUnique({
      where: { userId: defaultUser.id }
    })

    if (!existingSeller) {
      defaultSeller = await prisma.seller.create({
        data: {
          userId: defaultUser.id,
          businessName: 'ThriftAI Default Seller',
          ownerName: 'ThriftAI Team',
          email: 'seller@thriftai.com',
          phone: '+1-555-0100',
          address: '123 Main St, San Francisco, CA 94105',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          sellerType: 'BUSINESS',
          description: 'Official ThriftAI seller account for sample products',
          isVerified: true,
          isActive: true
        }
      })
      console.log('✅ Created default seller')
    } else {
      defaultSeller = existingSeller
      console.log('✅ Using existing seller')
    }
  } else {
    console.log('✅ Default seller already exists')
  }

  // Clear existing products (optional - uncomment if you want to reset)
  // await prisma.product.deleteMany({})
  // console.log('🗑️ Cleared existing products')

  // Insert sample products
  let createdCount = 0
  for (const productData of sampleProducts) {
    try {
      // Check if product already exists
      const existingProduct = await prisma.product.findFirst({
        where: {
          name: productData.name,
          brand: productData.brand
        }
      })

      if (!existingProduct) {
        await prisma.product.create({
          data: {
            ...productData,
            sellerId: defaultSeller.id
          }
        })
        createdCount++
        console.log(`📦 Created product: ${productData.name}`)
      } else {
        console.log(`⏭️ Product already exists: ${productData.name}`)
      }
    } catch (error) {
      console.error(`❌ Error creating product ${productData.name}:`, error)
    }
  }

  console.log(`\n🎉 Seed completed!`)
  console.log(`📊 Created ${createdCount} new products`)
  console.log(`📊 Total products in database: ${await prisma.product.count()}`)

  // Display breakdown by category
  const categoryBreakdown = await prisma.product.groupBy({
    by: ['category'],
    _count: {
      category: true
    }
  })

  console.log('\n📋 Products by category:')
  categoryBreakdown.forEach(({ category, _count }) => {
    console.log(`  ${category}: ${_count.category} products`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
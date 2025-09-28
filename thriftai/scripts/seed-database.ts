import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // 1. Create configuration data
  console.log('📋 Creating category configuration...')

  const clothingCategory = await prisma.categoryConfiguration.upsert({
    where: { categoryName: 'CLOTHING' },
    update: {},
    create: {
      categoryName: 'CLOTHING',
      displayName: 'Clothing & Apparel',
      description: 'All types of clothing items',
      isActive: true,
      sortOrder: 1,
      keywords: {
        create: [
          { keyword: 'shirt', weight: 1.0, isActive: true },
          { keyword: 'dress', weight: 1.0, isActive: true },
          { keyword: 'jacket', weight: 1.0, isActive: true },
          { keyword: 'pants', weight: 1.0, isActive: true },
          { keyword: 'jeans', weight: 1.0, isActive: true }
        ]
      }
    }
  })

  const shoesCategory = await prisma.categoryConfiguration.upsert({
    where: { categoryName: 'SHOES' },
    update: {},
    create: {
      categoryName: 'SHOES',
      displayName: 'Footwear',
      description: 'All types of shoes and footwear',
      isActive: true,
      sortOrder: 2,
      keywords: {
        create: [
          { keyword: 'sneakers', weight: 1.0, isActive: true },
          { keyword: 'boots', weight: 1.0, isActive: true },
          { keyword: 'heels', weight: 1.0, isActive: true },
          { keyword: 'sandals', weight: 1.0, isActive: true }
        ]
      }
    }
  })

  const accessoriesCategory = await prisma.categoryConfiguration.upsert({
    where: { categoryName: 'ACCESSORIES' },
    update: {},
    create: {
      categoryName: 'ACCESSORIES',
      displayName: 'Accessories',
      description: 'Bags, jewelry, and other accessories',
      isActive: true,
      sortOrder: 3,
      keywords: {
        create: [
          { keyword: 'bag', weight: 1.0, isActive: true },
          { keyword: 'purse', weight: 1.0, isActive: true },
          { keyword: 'handbag', weight: 1.0, isActive: true },
          { keyword: 'jewelry', weight: 1.0, isActive: true },
          { keyword: 'watch', weight: 1.0, isActive: true }
        ]
      }
    }
  })

  // 2. Create sample seller
  console.log('👤 Creating sample seller...')

  // First create the user
  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@thriftai.com' },
    update: {},
    create: {
      email: 'seller@thriftai.com',
      firstName: 'Jane',
      lastName: 'Smith',
      passwordHash: await bcrypt.hash('password123', 12)
    }
  })

  // Then create the seller
  const seller = await prisma.seller.upsert({
    where: { email: 'seller@thriftai.com' },
    update: {},
    create: {
      businessName: 'Vintage Finds Co.',
      ownerName: 'Jane Smith',
      email: 'seller@thriftai.com',
      phone: '+1-555-0123',
      address: '123 Thrift Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      sellerType: 'BUSINESS',
      description: 'Curated vintage clothing and accessories',
      isActive: true,
      isVerified: true,
      rating: 4.8,
      totalSales: 156,
      totalRevenue: 4250.75,
      categories: ['CLOTHING', 'ACCESSORIES'],
      user: {
        connect: { id: sellerUser.id }
      }
    }
  })

  // 3. Create sample products
  console.log('📦 Creating sample products...')

  const products = [
    {
      name: 'Vintage Leather Jacket',
      category: 'CLOTHING',
      brand: 'Classic Leather Co.',
      price: 85.00,
      originalPrice: 250.00,
      condition: 'Excellent',
      description: 'Beautiful vintage leather jacket in excellent condition. Perfect for fall/winter seasons.',
      size: 'M'
    },
    {
      name: 'Designer Handbag',
      category: 'ACCESSORIES',
      brand: 'LuxBrand',
      price: 120.00,
      originalPrice: 400.00,
      condition: 'Good',
      description: 'Authentic designer handbag with minor wear. Comes with dust bag.',
      size: 'One Size'
    },
    {
      name: 'Vintage Denim Jeans',
      category: 'CLOTHING',
      brand: 'Retro Denim',
      price: 45.00,
      originalPrice: 120.00,
      condition: 'Very Good',
      description: 'Classic vintage denim jeans with perfect fade. True vintage piece.',
      size: '32'
    },
    {
      name: 'Running Sneakers',
      category: 'SHOES',
      brand: 'SportBrand',
      price: 35.00,
      originalPrice: 100.00,
      condition: 'Good',
      description: 'Comfortable running sneakers, lightly used. Great for casual wear.',
      size: '9'
    },
    {
      name: 'Wool Winter Coat',
      category: 'CLOTHING',
      brand: 'WarmWear',
      price: 95.00,
      originalPrice: 300.00,
      condition: 'Excellent',
      description: 'High-quality wool winter coat. Dry cleaned and ready to wear.',
      size: 'L'
    }
  ]

  for (const productData of products) {
    const productId = uuidv4()
    await prisma.product.create({
      data: {
        id: productId,
        ...productData,
        sellerId: seller.id,
        isAvailable: true
      }
    })
  }

  // 4. Create sample buyer
  console.log('🛍️ Creating sample buyer...')

  const buyerUser = await prisma.user.upsert({
    where: { email: 'buyer@thriftai.com' },
    update: {},
    create: {
      email: 'buyer@thriftai.com',
      firstName: 'John',
      lastName: 'Doe',
      passwordHash: await bcrypt.hash('password123', 12)
    }
  })

  const buyer = await prisma.buyer.upsert({
    where: { email: 'buyer@thriftai.com' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'buyer@thriftai.com',
      phone: '+1-555-0456',
      address: '456 Shopping Lane',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94103',
      buyerType: 'FREQUENT',
      isActive: true,
      emailVerified: true,
      preferredCategories: ['CLOTHING', 'ACCESSORIES'],
      preferredBrands: ['Classic Leather Co.', 'LuxBrand'],
      preferredSizes: ['M', 'L'],
      user: {
        connect: { id: buyerUser.id }
      }
    }
  })

  console.log('✅ Database seeding completed successfully!')
  console.log(`
📊 Created:
- 3 categories with keywords
- 1 seller (seller@thriftai.com)
- 5 sample products
- 1 buyer (buyer@thriftai.com)

🔍 You can now:
1. Visit Prisma Studio: http://localhost:5555
2. Test the Next.js app: http://localhost:3000
3. Try searching for products like "vintage jacket" or "handbag"
  `)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
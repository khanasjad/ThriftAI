import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🛍️ Adding dummy products to the database...')

  // Get existing seller
  const seller = await prisma.seller.findFirst({
    where: { email: 'seller@thriftai.com' }
  })

  if (!seller) {
    console.error('❌ No seller found. Please run the main seed script first.')
    return
  }

  // Extended product catalog
  const products = [
    // CLOTHING - More variety
    {
      name: 'Vintage Band T-Shirt',
      category: 'CLOTHING',
      brand: 'Rock Merch',
      price: 25.00,
      originalPrice: 45.00,
      condition: 'Good',
      description: 'Authentic vintage band t-shirt from the 90s. Soft cotton with classic graphics.',
      size: 'L'
    },
    {
      name: 'Designer Silk Blouse',
      category: 'CLOTHING',
      brand: 'Chanel',
      price: 180.00,
      originalPrice: 650.00,
      condition: 'Excellent',
      description: 'Elegant silk blouse in pristine condition. Timeless Chanel design.',
      size: 'M'
    },
    {
      name: 'Vintage Denim Jacket',
      category: 'CLOTHING',
      brand: 'Levi\'s',
      price: 65.00,
      originalPrice: 120.00,
      condition: 'Very Good',
      description: 'Classic Levi\'s denim jacket with perfect vintage fade. Iconic Americana.',
      size: 'L'
    },
    {
      name: 'Cashmere Sweater',
      category: 'CLOTHING',
      brand: 'Burberry',
      price: 95.00,
      originalPrice: 380.00,
      condition: 'Excellent',
      description: 'Luxurious cashmere sweater in navy blue. Ultra-soft and warm.',
      size: 'S'
    },
    {
      name: 'Vintage Floral Dress',
      category: 'CLOTHING',
      brand: 'Vintage Collection',
      price: 45.00,
      originalPrice: 0.00,
      condition: 'Good',
      description: 'Beautiful 1970s floral midi dress. Perfect for summer occasions.',
      size: 'M'
    },
    {
      name: 'Formal Blazer',
      category: 'CLOTHING',
      brand: 'Hugo Boss',
      price: 120.00,
      originalPrice: 450.00,
      condition: 'Very Good',
      description: 'Professional blazer in charcoal gray. Perfect for business meetings.',
      size: 'L'
    },

    // SHOES - More variety
    {
      name: 'High-End Hiking Boots',
      category: 'SHOES',
      brand: 'Patagonia',
      price: 85.00,
      originalPrice: 180.00,
      condition: 'Good',
      description: 'Durable hiking boots with excellent ankle support. Great for outdoor adventures.',
      size: '10'
    },
    {
      name: 'Designer Heels',
      category: 'SHOES',
      brand: 'Jimmy Choo',
      price: 220.00,
      originalPrice: 650.00,
      condition: 'Excellent',
      description: 'Stunning designer heels in black patent leather. Perfect for special occasions.',
      size: '8'
    },
    {
      name: 'Vintage Combat Boots',
      category: 'SHOES',
      brand: 'Dr. Martens',
      price: 75.00,
      originalPrice: 150.00,
      condition: 'Very Good',
      description: 'Classic Dr. Martens combat boots. Broken in and comfortable.',
      size: '9'
    },
    {
      name: 'Canvas Sneakers',
      category: 'SHOES',
      brand: 'Converse',
      price: 28.00,
      originalPrice: 60.00,
      condition: 'Good',
      description: 'Classic white canvas sneakers. Timeless style for casual wear.',
      size: '11'
    },
    {
      name: 'Leather Loafers',
      category: 'SHOES',
      brand: 'Cole Haan',
      price: 65.00,
      originalPrice: 150.00,
      condition: 'Very Good',
      description: 'Professional leather loafers in brown. Perfect for business casual.',
      size: '10.5'
    },

    // ACCESSORIES - More variety
    {
      name: 'Vintage Leather Belt',
      category: 'ACCESSORIES',
      brand: 'Coach',
      price: 35.00,
      originalPrice: 85.00,
      condition: 'Good',
      description: 'Classic leather belt with brass buckle. Genuine Coach craftsmanship.',
      size: 'One Size'
    },
    {
      name: 'Designer Sunglasses',
      category: 'ACCESSORIES',
      brand: 'Ray-Ban',
      price: 75.00,
      originalPrice: 150.00,
      condition: 'Excellent',
      description: 'Iconic Ray-Ban aviator sunglasses. No scratches on lenses.',
      size: 'One Size'
    },
    {
      name: 'Silk Scarf',
      category: 'ACCESSORIES',
      brand: 'Hermès',
      price: 185.00,
      originalPrice: 400.00,
      condition: 'Excellent',
      description: 'Luxury silk scarf with beautiful pattern. Authentic Hermès piece.',
      size: 'One Size'
    },
    {
      name: 'Vintage Briefcase',
      category: 'ACCESSORIES',
      brand: 'Samsonite',
      price: 95.00,
      originalPrice: 250.00,
      condition: 'Good',
      description: 'Professional leather briefcase. Shows character but very functional.',
      size: 'One Size'
    },
    {
      name: 'Sports Watch',
      category: 'ACCESSORIES',
      brand: 'Casio',
      price: 45.00,
      originalPrice: 85.00,
      condition: 'Very Good',
      description: 'Digital sports watch with multiple functions. Water resistant.',
      size: 'One Size'
    },
    {
      name: 'Pearl Necklace',
      category: 'ACCESSORIES',
      brand: 'Mikimoto',
      price: 320.00,
      originalPrice: 800.00,
      condition: 'Excellent',
      description: 'Cultured pearl necklace with silver clasp. Elegant and timeless.',
      size: 'One Size'
    },
    {
      name: 'Crossbody Bag',
      category: 'ACCESSORIES',
      brand: 'Kate Spade',
      price: 85.00,
      originalPrice: 200.00,
      condition: 'Very Good',
      description: 'Stylish crossbody bag in pink leather. Perfect everyday companion.',
      size: 'One Size'
    },
    {
      name: 'Vintage Hat',
      category: 'ACCESSORIES',
      brand: 'Borsalino',
      price: 65.00,
      originalPrice: 180.00,
      condition: 'Good',
      description: 'Classic fedora hat in charcoal wool. Adds sophistication to any outfit.',
      size: 'One Size'
    },

    // ELECTRONICS (new category - we might need to add this)
    {
      name: 'Vintage Camera',
      category: 'ACCESSORIES', // Using accessories since electronics might not be in our config
      brand: 'Canon',
      price: 150.00,
      originalPrice: 350.00,
      condition: 'Good',
      description: 'Vintage film camera in working condition. Great for photography enthusiasts.',
      size: 'One Size'
    },
    {
      name: 'Retro Headphones',
      category: 'ACCESSORIES',
      brand: 'Sony',
      price: 55.00,
      originalPrice: 120.00,
      condition: 'Very Good',
      description: 'Vintage-style headphones with excellent sound quality.',
      size: 'One Size'
    },

    // More unique items
    {
      name: 'Vintage Vinyl Record',
      category: 'ACCESSORIES',
      brand: 'Various Artists',
      price: 15.00,
      originalPrice: 25.00,
      condition: 'Good',
      description: 'Classic rock vinyl record from the 1970s. Plays well with minimal scratches.',
      size: 'One Size'
    },
    {
      name: 'Antique Fountain Pen',
      category: 'ACCESSORIES',
      brand: 'Parker',
      price: 85.00,
      originalPrice: 200.00,
      condition: 'Excellent',
      description: 'Elegant fountain pen with gold nib. Writes beautifully.',
      size: 'One Size'
    },
    {
      name: 'Designer Umbrella',
      category: 'ACCESSORIES',
      brand: 'Burberry',
      price: 75.00,
      originalPrice: 180.00,
      condition: 'Very Good',
      description: 'Classic plaid umbrella. Sturdy and stylish for rainy days.',
      size: 'One Size'
    },
    {
      name: 'Vintage Backpack',
      category: 'ACCESSORIES',
      brand: 'JanSport',
      price: 35.00,
      originalPrice: 60.00,
      condition: 'Good',
      description: 'Durable canvas backpack in forest green. Perfect for school or hiking.',
      size: 'One Size'
    }
  ]

  console.log(`📦 Adding ${products.length} new products...`)

  // Add all products
  for (const productData of products) {
    const productId = uuidv4()
    try {
      await prisma.product.create({
        data: {
          id: productId,
          ...productData,
          sellerId: seller.id,
          isAvailable: true
        }
      })
      console.log(`✅ Added: ${productData.name}`)
    } catch (error) {
      console.error(`❌ Failed to add ${productData.name}:`, error)
    }
  }

  // Get updated product count
  const totalProducts = await prisma.product.count()
  const productsByCategory = await prisma.product.groupBy({
    by: ['category'],
    _count: {
      category: true
    },
    orderBy: {
      category: 'asc'
    }
  })

  console.log('\n🎉 Dummy data added successfully!')
  console.log(`\n📊 Database Summary:`)
  console.log(`- Total Products: ${totalProducts}`)
  console.log(`- Products by Category:`)

  productsByCategory.forEach(cat => {
    console.log(`  • ${cat.category}: ${cat._count.category} items`)
  })

  console.log(`\n🔍 You can now:`)
  console.log(`1. Visit Prisma Studio: http://localhost:5555`)
  console.log(`2. Test the Next.js app: http://localhost:3000`)
  console.log(`3. Try searching for: "vintage", "designer", "leather", "cashmere", etc.`)
  console.log(`4. Explore the rich product catalog in your ThriftAI app!`)
}

main()
  .catch((e) => {
    console.error('❌ Adding dummy data failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
// Enhanced dummy products script with realistic images and data
// This creates comprehensive test data for the mock Amazon API

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ProductData {
  name: string
  brand: string
  description: string
  price: number
  originalPrice: number
  condition: string
  category: string
  size?: string
  color?: string
  imageUrl: string
  additionalImages?: string[]
}

// High-quality product data with real images from Unsplash
const enhancedProducts: ProductData[] = [
  // ELECTRONICS
  {
    name: "iPhone 14 Pro Max - 256GB Deep Purple",
    brand: "Apple",
    description: "Premium smartphone with A16 Bionic chip, Pro camera system with 48MP main camera, and stunning Super Retina XDR display. Excellent condition with original box and accessories.",
    price: 899.99,
    originalPrice: 1199.99,
    condition: "Excellent",
    category: "ELECTRONICS",
    color: "Deep Purple",
    imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80",
      "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=500&q=80"
    ],
  },
  {
    name: "MacBook Air M2 Chip - 13-inch",
    brand: "Apple",
    description: "Ultra-thin laptop with M2 chip, 8GB RAM, 256GB SSD. Perfect for students and professionals. Includes original charger and documentation.",
    price: 999.99,
    originalPrice: 1199.99,
    condition: "Very Good",
    category: "ELECTRONICS",
    color: "Space Gray",
    imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80",
      "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=500&q=80"
    ],
    // sku: "MBA-M2-13-SG"
  },
  {
    name: "Sony WH-1000XM4 Wireless Headphones",
    brand: "Sony",
    description: "Industry-leading noise canceling headphones with 30-hour battery life and premium sound quality. Perfect for travel and work.",
    price: 249.99,
    originalPrice: 349.99,
    condition: "Excellent",
    category: "ELECTRONICS",
    color: "Black",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&q=80"
    ],
    // sku: "SONY-WH1000XM4-BK"
  },
  {
    name: "iPad Pro 11-inch M2 Chip",
    brand: "Apple",
    description: "Powerful tablet with M2 chip, Liquid Retina display, and Apple Pencil compatibility. Great for creative work and entertainment.",
    price: 699.99,
    originalPrice: 799.99,
    condition: "Very Good",
    category: "ELECTRONICS",
    color: "Silver",
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500&q=80",
      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=500&q=80"
    ],
    // sku: "IPAD-PRO-11-M2-SL"
  },

  // CLOTHING
  {
    name: "Vintage Levi's 501 Original Fit Jeans",
    brand: "Levi's",
    description: "Classic straight-leg jeans in premium denim. Timeless style that never goes out of fashion. Gently worn with authentic vintage fade.",
    price: 79.99,
    originalPrice: 129.99,
    condition: "Very Good",
    category: "CLOTHING",
    size: "32x34",
    color: "Indigo",
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=500&q=80",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&q=80"
    ],
    // sku: "LEVIS-501-32X34-IND"
  },
  {
    name: "Patagonia Better Sweater Fleece Jacket",
    brand: "Patagonia",
    description: "Sustainable fleece jacket made from recycled polyester. Perfect layering piece for outdoor adventures. Excellent condition with minimal wear.",
    price: 89.99,
    originalPrice: 139.99,
    condition: "Excellent",
    category: "CLOTHING",
    size: "Medium",
    color: "Navy Blue",
    imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&q=80",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80"
    ],
    // sku: "PAT-FLEECE-M-NB"
  },
  {
    name: "Vintage Band T-Shirt - The Beatles",
    brand: "Vintage",
    description: "Authentic vintage Beatles band tee from the 1990s. Soft cotton with classic Abbey Road design. A must-have for music lovers.",
    price: 45.99,
    originalPrice: 75.99,
    condition: "Good",
    category: "CLOTHING",
    size: "Large",
    color: "Black",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&q=80",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&q=80"
    ],
    // sku: "VINT-BEATLES-L-BK"
  },
  {
    name: "Adidas Originals Trefoil Hoodie",
    brand: "Adidas",
    description: "Classic pullover hoodie with iconic trefoil logo. Made from soft cotton blend for ultimate comfort. Perfect for casual wear.",
    price: 59.99,
    originalPrice: 89.99,
    condition: "Very Good",
    category: "CLOTHING",
    size: "Large",
    color: "Gray",
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&q=80",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&q=80"
    ],
    // sku: "ADI-TREFOIL-L-GR"
  },

  // SHOES
  {
    name: "Nike Air Jordan 1 Retro High OG",
    brand: "Nike",
    description: "Iconic basketball sneakers in classic Chicago colorway. Premium leather construction with Air-Sole unit. Excellent condition with original box.",
    price: 139.99,
    originalPrice: 179.99,
    condition: "Excellent",
    category: "SHOES",
    size: "10.5",
    color: "White/Black/Red",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80"
    ],
    // sku: "NIKE-AJ1-105-CHI"
  },
  {
    name: "Converse Chuck Taylor All Star High Top",
    brand: "Converse",
    description: "Classic canvas high-top sneakers that never go out of style. Comfortable and versatile for everyday wear.",
    price: 49.99,
    originalPrice: 69.99,
    condition: "Very Good",
    category: "SHOES",
    size: "9",
    color: "Black",
    imageUrl: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&q=80",
      "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=500&q=80"
    ],
    // sku: "CONV-CT-9-BK"
  },
  {
    name: "Adidas Ultraboost 22 Running Shoes",
    brand: "Adidas",
    description: "High-performance running shoes with Boost midsole technology. Excellent energy return and comfort for long runs.",
    price: 119.99,
    originalPrice: 189.99,
    condition: "Good",
    category: "SHOES",
    size: "11",
    color: "Core Black",
    imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&q=80",
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500&q=80"
    ],
    // sku: "ADI-UB22-11-CB"
  },

  // ACCESSORIES
  {
    name: "Ray-Ban Aviator Classic Sunglasses",
    brand: "Ray-Ban",
    description: "Timeless aviator sunglasses with crystal green lenses and gold frame. Includes original case and cleaning cloth.",
    price: 129.99,
    originalPrice: 179.99,
    condition: "Excellent",
    category: "ACCESSORIES",
    color: "Gold",
    imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80",
      "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=500&q=80"
    ],
    // sku: "RB-AVI-GOLD-GRN"
  },
  {
    name: "Hermès Silk Scarf - Les Clés",
    brand: "Hermès",
    description: "Luxury silk scarf featuring the iconic 'Les Clés' (The Keys) pattern. 100% silk twill in excellent condition. A timeless accessory.",
    price: 299.99,
    originalPrice: 425.99,
    condition: "Excellent",
    category: "ACCESSORIES",
    color: "Navy/Gold",
    imageUrl: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=500&q=80",
      "https://images.unsplash.com/photo-1582233479366-6d38bc390a08?w=500&q=80"
    ],
    // sku: "HERM-SCARF-CLES-NVG"
  },
  {
    name: "Apple Watch Series 8 - 45mm GPS",
    brand: "Apple",
    description: "Advanced smartwatch with health monitoring, GPS, and cellular connectivity. Includes sport band and original charger.",
    price: 349.99,
    originalPrice: 429.99,
    condition: "Very Good",
    category: "ACCESSORIES",
    color: "Midnight",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1508433957232-3107f5fd5995?w=500&q=80",
      "https://images.unsplash.com/photo-1579586337278-3f436f25d4d6?w=500&q=80"
    ],
    // sku: "APW-S8-45-GPS-MID"
  },
  {
    name: "Coach Leather Crossbody Bag",
    brand: "Coach",
    description: "Premium leather crossbody bag in classic Coach styling. Perfect size for essentials with adjustable strap. Minimal wear.",
    price: 189.99,
    originalPrice: 295.99,
    condition: "Very Good",
    category: "ACCESSORIES",
    color: "Camel",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500&q=80",
      "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=500&q=80"
    ],
    // sku: "COACH-XBODY-CAM"
  },

  // ADDITIONAL VARIETY PRODUCTS
  {
    name: "Nintendo Switch OLED Console",
    brand: "Nintendo",
    description: "Gaming console with vibrant OLED screen and enhanced audio. Includes dock, Joy-Con controllers, and original accessories.",
    price: 289.99,
    originalPrice: 349.99,
    condition: "Excellent",
    category: "ELECTRONICS",
    color: "Neon Blue/Red",
    imageUrl: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&q=80",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&q=80"
    ],
    // sku: "NINT-SW-OLED-NBR"
  },
  {
    name: "Lululemon Align High-Rise Pants",
    brand: "Lululemon",
    description: "Ultra-soft yoga pants made with Nulu fabric. Perfect for yoga, lounging, or everyday wear. Excellent stretch and comfort.",
    price: 89.99,
    originalPrice: 128.99,
    condition: "Excellent",
    category: "CLOTHING",
    size: "Medium",
    color: "Black",
    imageUrl: "https://images.unsplash.com/photo-1506629905607-c7bada40dc63?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&q=80",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&q=80"
    ],
    // sku: "LULU-ALIGN-M-BK"
  },
  {
    name: "Allbirds Tree Runners - Sustainable Sneakers",
    brand: "Allbirds",
    description: "Eco-friendly sneakers made from eucalyptus tree fiber. Incredibly comfortable and machine washable. Perfect for everyday wear.",
    price: 79.99,
    originalPrice: 98.99,
    condition: "Good",
    category: "SHOES",
    size: "10",
    color: "Natural White",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500&q=80",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&q=80"
    ],
    // sku: "ALLB-TR-10-NW"
  },
  {
    name: "Yeti Rambler 30oz Tumbler",
    brand: "Yeti",
    description: "Insulated stainless steel tumbler that keeps drinks cold for 11+ hours or hot for 6+ hours. Perfect for outdoor adventures.",
    price: 34.99,
    originalPrice: 44.99,
    condition: "Very Good",
    category: "ACCESSORIES",
    color: "Stainless Steel",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1544967882-67b7a2f8c60b?w=500&q=80",
      "https://images.unsplash.com/photo-1562777717-dc6984f65a63?w=500&q=80"
    ],
    // sku: "YETI-RAM-30-SS"
  }
]

async function createEnhancedDummyProducts() {
  try {
    console.log('🌟 Creating enhanced dummy products with realistic images...')

    // First, ensure we have a default seller
    let defaultSeller = await prisma.seller.findFirst({
      where: { user: { email: 'seller@thriftai.com' } }
    })

    if (!defaultSeller) {
      console.log('Creating default seller...')
      const defaultUser = await prisma.user.create({
        data: {
          name: 'ThriftAI Premium Seller',
          email: 'seller@thriftai.com',
          emailVerified: new Date(),
        }
      })

      defaultSeller = await prisma.seller.create({
        data: {
          userId: defaultUser.id,
          businessName: 'ThriftAI Premium Collections',
          verificationStatus: 'VERIFIED',
          sellerType: 'BUSINESS',
          totalSales: 1250,
          rating: 4.8
        }
      })
      console.log('✅ Created default seller')
    }

    // Create each product
    let createdCount = 0
    let skippedCount = 0

    for (const productData of enhancedProducts) {
      try {
        // Check if product already exists by name
        const existingProduct = await prisma.product.findFirst({
          where: { name: productData.name }
        })

        if (existingProduct) {
          console.log(`⏭️  Skipping ${productData.name} - already exists`)
          skippedCount++
          continue
        }

        // Create the product
        const product = await prisma.product.create({
          data: {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            originalPrice: productData.originalPrice,
            condition: productData.condition,
            category: productData.category,
            brand: productData.brand,
            size: productData.size,
            imageUrl: productData.imageUrl,
            isAvailable: true,
            sellerId: defaultSeller.id
          }
        })

        console.log(`✅ Created: ${product.name} (${product.id})`)
        createdCount++

      } catch (error) {
        console.error(`❌ Failed to create ${productData.name}:`, error)
      }
    }

    // Get final stats
    const totalProducts = await prisma.product.count()
    const productsByCategory = await prisma.product.groupBy({
      by: ['category'],
      _count: { category: true }
    })

    console.log('\n🎉 Enhanced dummy products creation completed!')
    console.log(`📊 Results:`)
    console.log(`   - Created: ${createdCount} new products`)
    console.log(`   - Skipped: ${skippedCount} existing products`)
    console.log(`   - Total products in database: ${totalProducts}`)
    console.log('\n📋 Products by category:')

    productsByCategory.forEach(({ category, _count }) => {
      console.log(`   - ${category}: ${_count.category} products`)
    })

    console.log('\n🖼️  All products include high-quality images from Unsplash')
    console.log('🏷️  Products feature realistic pricing, descriptions, and specifications')
    console.log('✨ Mock Amazon API now has comprehensive test data!')

  } catch (error) {
    console.error('❌ Error creating enhanced dummy products:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Export for use in other scripts
export { enhancedProducts, createEnhancedDummyProducts }

// Run if called directly
if (require.main === module) {
  createEnhancedDummyProducts()
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}
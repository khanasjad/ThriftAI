/**
 * Seed Products Script
 *
 * Seeds test products for a tenant
 *
 * Usage:
 *   npx tsx scripts/b2b/seed-products.ts <tenantId> [count]
 *
 * Examples:
 *   npx tsx scripts/b2b/seed-products.ts cm3abc123 50
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

// Sample product data
const SAMPLE_PRODUCTS = [
  // Beauty
  { name: 'Organic Coconut Shampoo', category: 'Beauty', brand: 'Natural Essentials', price: 24.99, description: 'Premium organic shampoo with coconut oil for all hair types' },
  { name: 'Sulfate-Free Shampoo', category: 'Beauty', brand: 'Pure Care', price: 19.99, description: 'Gentle sulfate-free formula for sensitive scalps' },
  { name: 'Volumizing Shampoo', category: 'Beauty', brand: 'Hair Boost', price: 29.99, description: 'Professional volumizing shampoo for fine hair' },
  { name: 'Anti-Dandruff Shampoo', category: 'Beauty', brand: 'Scalp Care', price: 22.99, description: 'Effective anti-dandruff treatment shampoo' },
  { name: 'Color-Protecting Shampoo', category: 'Beauty', brand: 'Color Lock', price: 26.99, description: 'Preserves hair color and adds shine' },

  // Electronics
  { name: 'Wireless Bluetooth Headphones', category: 'Electronics', brand: 'SoundMax', price: 89.99, description: 'Premium noise-canceling wireless headphones' },
  { name: 'USB-C Fast Charger', category: 'Electronics', brand: 'PowerTech', price: 34.99, description: '65W fast charging adapter with USB-C' },
  { name: 'Portable Power Bank', category: 'Electronics', brand: 'ChargePro', price: 49.99, description: '20000mAh portable battery charger' },
  { name: 'Wireless Mouse', category: 'Electronics', brand: 'TechGear', price: 29.99, description: 'Ergonomic wireless mouse with precision tracking' },
  { name: 'Mechanical Keyboard', category: 'Electronics', brand: 'KeyMaster', price: 129.99, description: 'RGB mechanical gaming keyboard' },

  // Home & Kitchen
  { name: 'Stainless Steel Water Bottle', category: 'Home & Kitchen', brand: 'HydroLife', price: 19.99, description: 'Insulated 32oz water bottle keeps drinks cold for 24h' },
  { name: 'Non-Stick Cookware Set', category: 'Home & Kitchen', brand: 'ChefPro', price: 149.99, description: '10-piece ceramic non-stick cookware set' },
  { name: 'Electric Kettle', category: 'Home & Kitchen', brand: 'BrewMaster', price: 39.99, description: '1.7L fast-boiling electric kettle' },
  { name: 'Coffee Maker', category: 'Home & Kitchen', brand: 'JavaPro', price: 79.99, description: 'Programmable 12-cup coffee maker' },
  { name: 'Blender', category: 'Home & Kitchen', brand: 'BlendMax', price: 59.99, description: 'High-speed blender for smoothies and more' },

  // Apparel
  { name: 'Cotton T-Shirt', category: 'Apparel', brand: 'ComfortWear', price: 14.99, description: '100% organic cotton t-shirt' },
  { name: 'Running Shoes', category: 'Apparel', brand: 'ActiveFit', price: 89.99, description: 'Lightweight running shoes with cushioning' },
  { name: 'Yoga Pants', category: 'Apparel', brand: 'FlexFit', price: 49.99, description: 'High-waist compression yoga pants' },
  { name: 'Winter Jacket', category: 'Apparel', brand: 'WarmGuard', price: 129.99, description: 'Insulated waterproof winter jacket' },
  { name: 'Athletic Socks 6-Pack', category: 'Apparel', brand: 'SportComfort', price: 19.99, description: 'Moisture-wicking athletic socks' },
]

async function seedProducts(tenantId: string, count: number = 20) {
  try {
    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) {
      console.error(`L Tenant not found: ${tenantId}`)
      console.log('\nList available tenants:')
      console.log('  npx tsx scripts/b2b/list-tenants.ts')
      process.exit(1)
    }

    console.log(`\n<1 Seeding ${count} products for tenant: ${tenant.name}`)
    console.log('\n')

    const products = []
    for (let i = 0; i < count; i++) {
      const template = SAMPLE_PRODUCTS[i % SAMPLE_PRODUCTS.length]
      const variation = Math.floor(i / SAMPLE_PRODUCTS.length)

      const name = variation > 0
        ? `${template.name} (Variant ${variation + 1})`
        : template.name

      products.push({
        tenantId,
        name,
        category: template.category,
        brand: template.brand,
        price: new Decimal(template.price),
        originalPrice: new Decimal(template.price),
        description: template.description,
        condition: 'new',
        isAvailable: true,
        stockQuantity: Math.floor(Math.random() * 100) + 1,
        imageUrl: `https://via.placeholder.com/400x400?text=${encodeURIComponent(name)}`
      })
    }

    // Batch insert
    const result = await prisma.product.createMany({
      data: products
    })

    // Update tenant product count
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        totalProducts: {
          increment: result.count
        }
      }
    })

    console.log(` Successfully created ${result.count} products!\n`)
    console.log('')

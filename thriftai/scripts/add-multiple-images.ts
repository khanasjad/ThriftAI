#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/prisma'

/**
 * Add multiple product images for carousel functionality
 * Adds 3-5 different angle/view images per product
 */

// Unsplash image collections for different product categories
const imageCollections = {
  ELECTRONICS: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', // Phone
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30', // Watch
    'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5', // Headphones
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03', // Laptop
    'https://images.unsplash.com/photo-1585790050230-5dd28404f099', // Camera
  ],
  CLOTHING: [
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f', // Sneakers
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f', // Fashion
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27', // Hoodie
    'https://images.unsplash.com/photo-1503341960582-b45751874cf0', // Denim
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea', // Clothes
  ],
  SHOES: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff', // Nike
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a', // Sneaker
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa', // Shoe
    'https://images.unsplash.com/photo-1549298916-b41d501d3772', // Sneakers
    'https://images.unsplash.com/photo-1584735174965-e7146edd93b8', // Footwear
  ],
  ACCESSORIES: [
    'https://images.unsplash.com/photo-1553062407-98eebfa4f61f', // Watch
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f', // Sunglasses
    'https://images.unsplash.com/photo-1622434641406-a158123450f9', // Bag
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa', // Watch
    'https://images.unsplash.com/photo-1590739225924-a3b8e8c1b7b6', // Accessories
  ],
  HOME: [
    'https://images.unsplash.com/photo-1556911219-4057f86c5f8e', // Blender
    'https://images.unsplash.com/photo-1585338447937-7082f8fc763d', // Coffee maker
    'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078', // Kitchen
    'https://images.unsplash.com/photo-1558643117-57c22f3e8c3e', // Interior
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b', // Home decor
  ],
  BEAUTY: [
    'https://images.unsplash.com/photo-1596462502278-27a2386a2d59', // Cosmetics
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796', // Makeup
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881', // Beauty
    'https://images.unsplash.com/photo-1522338242992-e1a54906a8da', // Skincare
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b', // Beauty products
  ],
  SPORTS: [
    'https://images.unsplash.com/photo-1517649763962-0c623066013f', // Gym
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438', // Fitness
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b', // Weights
    'https://images.unsplash.com/photo-1576678927484-cc907957088c', // Exercise
    'https://images.unsplash.com/photo-1526401281​82-46c2a21ef1c2', // Sports
  ],
  TOYS: [
    'https://images.unsplash.com/photo-1515276941804-b8e5d3f8b4d4', // Lego
    'https://images.unsplash.com/photo-1587912781141-1f00f3f4b21b', // Toys
    'https://images.unsplash.com/photo-1590273828132-1f5d50e88c8e', // Play
    'https://images.unsplash.com/photo-1587912781141-1f00f3f4b21b', // Kids toys
    'https://images.unsplash.com/photo-1596461200736-d0359f87d4c2', // Games
  ]
}

// Image quality variants (simulating different angles/views)
const imageParams = [
  '?w=800&h=800&fit=crop', // Front view
  '?w=800&h=800&fit=crop&auto=format&q=80', // Side view
  '?w=800&h=800&fit=crop&fm=jpg&q=85', // Top view
  '?w=800&h=800&fit=crop&auto=format', // Detail view
  '?w=800&h=800&fit=crop&q=90' // Package view
]

function getMultipleImages(category: string, mainImage: string | null): string[] {
  const collection = imageCollections[category as keyof typeof imageCollections] || imageCollections.ELECTRONICS

  // If product has a main image, use it as the first image
  const images: string[] = []

  if (mainImage) {
    images.push(mainImage)
  }

  // Add 3-4 additional images from the category collection with different params
  const numAdditionalImages = Math.floor(Math.random() * 2) + 3 // 3 or 4 images

  for (let i = 0; i < numAdditionalImages; i++) {
    const randomImage = collection[Math.floor(Math.random() * collection.length)]
    const param = imageParams[i % imageParams.length]
    images.push(randomImage + param)
  }

  return images
}

async function addMultipleImages() {
  console.log('🎨 Adding multiple images to products for carousel...\n')

  try {
    // Get all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        imageUrl: true
      }
    })

    console.log(`📦 Found ${products.length} products\n`)

    let updated = 0

    for (const product of products) {
      // Generate multiple images
      const images = getMultipleImages(product.category, product.imageUrl)

      // Store images array as JSON in imageUrl field
      // The frontend will parse this as an array
      await prisma.product.update({
        where: { id: product.id },
        data: {
          imageUrl: JSON.stringify(images) // Store as JSON array
        }
      })

      updated++

      if (updated % 100 === 0) {
        console.log(`✅ Updated ${updated} products...`)
      }
    }

    console.log(`\n✅ Successfully added multiple images to ${updated} products!`)
    console.log('\n🎉 Products now have 4-5 images each for the carousel')
    console.log('\n📸 Image breakdown:')
    console.log('   - First image: Original product image (or category default)')
    console.log('   - Additional 3-4 images: Different angles/views from Unsplash')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addMultipleImages().catch(console.error)

// ThriftAI Configuration Seed Script
// Populates CategoryConfiguration, CategoryKeyword, and SearchExclusionConfiguration tables

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categoryConfigurations = [
  // Main Categories
  {
    categoryName: 'CLOTHING',
    parentCategory: null,
    displayName: 'Clothing & Apparel',
    description: 'All types of clothing including shirts, pants, dresses, jackets, and more',
    isActive: true,
    sortOrder: 1
  },
  {
    categoryName: 'SHOES',
    parentCategory: null,
    displayName: 'Footwear & Shoes',
    description: 'All types of footwear including sneakers, boots, heels, sandals, and more',
    isActive: true,
    sortOrder: 2
  },
  {
    categoryName: 'ELECTRONICS',
    parentCategory: null,
    displayName: 'Electronics & Gadgets',
    description: 'Electronic devices, gadgets, smartphones, computers, and accessories',
    isActive: true,
    sortOrder: 3
  },
  {
    categoryName: 'ACCESSORIES',
    parentCategory: null,
    displayName: 'Accessories & Jewelry',
    description: 'Fashion accessories, jewelry, bags, watches, and personal items',
    isActive: true,
    sortOrder: 4
  },
  {
    categoryName: 'HOME',
    parentCategory: null,
    displayName: 'Home & Garden',
    description: 'Home decor, furniture, kitchen items, and garden supplies',
    isActive: true,
    sortOrder: 5
  },
  {
    categoryName: 'BOOKS',
    parentCategory: null,
    displayName: 'Books & Media',
    description: 'Books, magazines, music, movies, and educational materials',
    isActive: true,
    sortOrder: 6
  },
  {
    categoryName: 'AUTOMOTIVE',
    parentCategory: null,
    displayName: 'Automotive & Parts',
    description: 'Car parts, accessories, automotive tools and equipment',
    isActive: true,
    sortOrder: 7
  },

  // Subcategories for CLOTHING
  {
    categoryName: 'CLOTHING_TOPS',
    parentCategory: 'CLOTHING',
    displayName: 'Tops & Shirts',
    description: 'T-shirts, blouses, sweaters, hoodies, and other upper body clothing',
    isActive: true,
    sortOrder: 10
  },
  {
    categoryName: 'CLOTHING_BOTTOMS',
    parentCategory: 'CLOTHING',
    displayName: 'Pants & Bottoms',
    description: 'Jeans, pants, shorts, skirts, and other lower body clothing',
    isActive: true,
    sortOrder: 11
  },
  {
    categoryName: 'CLOTHING_OUTERWEAR',
    parentCategory: 'CLOTHING',
    displayName: 'Outerwear & Jackets',
    description: 'Jackets, coats, blazers, and outdoor clothing',
    isActive: true,
    sortOrder: 12
  },
  {
    categoryName: 'CLOTHING_DRESSES',
    parentCategory: 'CLOTHING',
    displayName: 'Dresses & Formal',
    description: 'Dresses, formal wear, and special occasion clothing',
    isActive: true,
    sortOrder: 13
  },

  // Subcategories for SHOES
  {
    categoryName: 'SHOES_SNEAKERS',
    parentCategory: 'SHOES',
    displayName: 'Sneakers & Athletic',
    description: 'Athletic shoes, running shoes, and casual sneakers',
    isActive: true,
    sortOrder: 20
  },
  {
    categoryName: 'SHOES_FORMAL',
    parentCategory: 'SHOES',
    displayName: 'Formal & Dress',
    description: 'Dress shoes, heels, and formal footwear',
    isActive: true,
    sortOrder: 21
  },
  {
    categoryName: 'SHOES_BOOTS',
    parentCategory: 'SHOES',
    displayName: 'Boots & Outdoor',
    description: 'Boots, hiking shoes, and outdoor footwear',
    isActive: true,
    sortOrder: 22
  },
  {
    categoryName: 'SHOES_SANDALS',
    parentCategory: 'SHOES',
    displayName: 'Sandals & Casual',
    description: 'Sandals, flip-flops, and casual footwear',
    isActive: true,
    sortOrder: 23
  }
]

const categoryKeywords = [
  // CLOTHING Keywords
  { categoryName: 'CLOTHING', keyword: 'clothing', weight: 1.0 },
  { categoryName: 'CLOTHING', keyword: 'clothes', weight: 1.0 },
  { categoryName: 'CLOTHING', keyword: 'apparel', weight: 1.0 },
  { categoryName: 'CLOTHING', keyword: 'shirt', weight: 0.9 },
  { categoryName: 'CLOTHING', keyword: 'blouse', weight: 0.9 },
  { categoryName: 'CLOTHING', keyword: 't-shirt', weight: 0.9 },
  { categoryName: 'CLOTHING', keyword: 'tshirt', weight: 0.9 },
  { categoryName: 'CLOTHING', keyword: 'sweater', weight: 0.9 },
  { categoryName: 'CLOTHING', keyword: 'hoodie', weight: 0.9 },
  { categoryName: 'CLOTHING', keyword: 'jacket', weight: 0.9 },
  { categoryName: 'CLOTHING', keyword: 'pants', weight: 0.9 },
  { categoryName: 'CLOTHING', keyword: 'jeans', weight: 0.9 },
  { categoryName: 'CLOTHING', keyword: 'dress', weight: 0.9 },
  { categoryName: 'CLOTHING', keyword: 'skirt', weight: 0.9 },
  { categoryName: 'CLOTHING', keyword: 'shorts', weight: 0.9 },
  { categoryName: 'CLOTHING', keyword: 'top', weight: 0.8 },
  { categoryName: 'CLOTHING', keyword: 'bottom', weight: 0.8 },
  { categoryName: 'CLOTHING', keyword: 'fashion', weight: 0.8 },
  { categoryName: 'CLOTHING', keyword: 'vintage', weight: 0.7 },
  { categoryName: 'CLOTHING', keyword: 'designer', weight: 0.7 },

  // SHOES Keywords
  { categoryName: 'SHOES', keyword: 'shoes', weight: 1.0 },
  { categoryName: 'SHOES', keyword: 'footwear', weight: 1.0 },
  { categoryName: 'SHOES', keyword: 'sneakers', weight: 0.9 },
  { categoryName: 'SHOES', keyword: 'boots', weight: 0.9 },
  { categoryName: 'SHOES', keyword: 'heels', weight: 0.9 },
  { categoryName: 'SHOES', keyword: 'flats', weight: 0.9 },
  { categoryName: 'SHOES', keyword: 'sandals', weight: 0.9 },
  { categoryName: 'SHOES', keyword: 'athletic', weight: 0.8 },
  { categoryName: 'SHOES', keyword: 'running', weight: 0.8 },
  { categoryName: 'SHOES', keyword: 'nike', weight: 0.7 },
  { categoryName: 'SHOES', keyword: 'adidas', weight: 0.7 },
  { categoryName: 'SHOES', keyword: 'converse', weight: 0.7 },
  { categoryName: 'SHOES', keyword: 'jordan', weight: 0.7 },
  { categoryName: 'SHOES', keyword: 'vans', weight: 0.7 },

  // ELECTRONICS Keywords
  { categoryName: 'ELECTRONICS', keyword: 'electronics', weight: 1.0 },
  { categoryName: 'ELECTRONICS', keyword: 'gadget', weight: 1.0 },
  { categoryName: 'ELECTRONICS', keyword: 'device', weight: 1.0 },
  { categoryName: 'ELECTRONICS', keyword: 'tech', weight: 0.9 },
  { categoryName: 'ELECTRONICS', keyword: 'phone', weight: 0.9 },
  { categoryName: 'ELECTRONICS', keyword: 'smartphone', weight: 0.9 },
  { categoryName: 'ELECTRONICS', keyword: 'iphone', weight: 0.9 },
  { categoryName: 'ELECTRONICS', keyword: 'android', weight: 0.9 },
  { categoryName: 'ELECTRONICS', keyword: 'computer', weight: 0.9 },
  { categoryName: 'ELECTRONICS', keyword: 'laptop', weight: 0.9 },
  { categoryName: 'ELECTRONICS', keyword: 'tablet', weight: 0.9 },
  { categoryName: 'ELECTRONICS', keyword: 'headphones', weight: 0.8 },
  { categoryName: 'ELECTRONICS', keyword: 'earbuds', weight: 0.8 },
  { categoryName: 'ELECTRONICS', keyword: 'speaker', weight: 0.8 },
  { categoryName: 'ELECTRONICS', keyword: 'camera', weight: 0.8 },
  { categoryName: 'ELECTRONICS', keyword: 'gaming', weight: 0.8 },
  { categoryName: 'ELECTRONICS', keyword: 'console', weight: 0.8 },
  { categoryName: 'ELECTRONICS', keyword: 'apple', weight: 0.7 },
  { categoryName: 'ELECTRONICS', keyword: 'samsung', weight: 0.7 },
  { categoryName: 'ELECTRONICS', keyword: 'sony', weight: 0.7 },

  // ACCESSORIES Keywords
  { categoryName: 'ACCESSORIES', keyword: 'accessories', weight: 1.0 },
  { categoryName: 'ACCESSORIES', keyword: 'bag', weight: 0.9 },
  { categoryName: 'ACCESSORIES', keyword: 'bags', weight: 0.9 },
  { categoryName: 'ACCESSORIES', keyword: 'purse', weight: 0.9 },
  { categoryName: 'ACCESSORIES', keyword: 'handbag', weight: 0.9 },
  { categoryName: 'ACCESSORIES', keyword: 'handbags', weight: 0.9 },
  { categoryName: 'ACCESSORIES', keyword: 'designer', weight: 0.8 },
  { categoryName: 'ACCESSORIES', keyword: 'wallet', weight: 0.9 },
  { categoryName: 'ACCESSORIES', keyword: 'belt', weight: 0.9 },
  { categoryName: 'ACCESSORIES', keyword: 'jewelry', weight: 0.9 },
  { categoryName: 'ACCESSORIES', keyword: 'watch', weight: 0.9 },
  { categoryName: 'ACCESSORIES', keyword: 'sunglasses', weight: 0.9 },
  { categoryName: 'ACCESSORIES', keyword: 'glasses', weight: 0.8 },
  { categoryName: 'ACCESSORIES', keyword: 'scarf', weight: 0.8 },
  { categoryName: 'ACCESSORIES', keyword: 'hat', weight: 0.8 },
  { categoryName: 'ACCESSORIES', keyword: 'cap', weight: 0.8 },
  { categoryName: 'ACCESSORIES', keyword: 'necklace', weight: 0.8 },
  { categoryName: 'ACCESSORIES', keyword: 'earrings', weight: 0.8 },
  { categoryName: 'ACCESSORIES', keyword: 'bracelet', weight: 0.8 },
  { categoryName: 'ACCESSORIES', keyword: 'ring', weight: 0.8 },

  // AUTOMOTIVE Keywords
  { categoryName: 'AUTOMOTIVE', keyword: 'car', weight: 1.0 },
  { categoryName: 'AUTOMOTIVE', keyword: 'automotive', weight: 1.0 },
  { categoryName: 'AUTOMOTIVE', keyword: 'auto', weight: 1.0 },
  { categoryName: 'AUTOMOTIVE', keyword: 'vehicle', weight: 0.9 },
  { categoryName: 'AUTOMOTIVE', keyword: 'parts', weight: 0.9 },
  { categoryName: 'AUTOMOTIVE', keyword: 'accessories', weight: 0.8 },
  { categoryName: 'AUTOMOTIVE', keyword: 'charger', weight: 0.8 },
  { categoryName: 'AUTOMOTIVE', keyword: 'mount', weight: 0.8 },
  { categoryName: 'AUTOMOTIVE', keyword: 'holder', weight: 0.8 },
  { categoryName: 'AUTOMOTIVE', keyword: 'bluetooth', weight: 0.7 },
  { categoryName: 'AUTOMOTIVE', keyword: 'dash', weight: 0.7 },
  { categoryName: 'AUTOMOTIVE', keyword: 'steering', weight: 0.7 },

  // HOME Keywords
  { categoryName: 'HOME', keyword: 'home', weight: 1.0 },
  { categoryName: 'HOME', keyword: 'furniture', weight: 0.9 },
  { categoryName: 'HOME', keyword: 'decor', weight: 0.9 },
  { categoryName: 'HOME', keyword: 'kitchen', weight: 0.9 },
  { categoryName: 'HOME', keyword: 'garden', weight: 0.9 },

  // BOOKS Keywords
  { categoryName: 'BOOKS', keyword: 'book', weight: 1.0 },
  { categoryName: 'BOOKS', keyword: 'books', weight: 1.0 },
  { categoryName: 'BOOKS', keyword: 'novel', weight: 0.9 },
  { categoryName: 'BOOKS', keyword: 'textbook', weight: 0.9 },
  { categoryName: 'BOOKS', keyword: 'magazine', weight: 0.8 },
  { categoryName: 'BOOKS', keyword: 'media', weight: 0.8 }
]

const searchExclusionConfigurations = [
  // General exclusions
  {
    ruleName: 'Adult Content Exclusion',
    searchContext: 'general',
    exclusionKeyword: 'adult',
    exclusionType: 'STRICT',
    isActive: true
  },
  {
    ruleName: 'Inappropriate Content Exclusion',
    searchContext: 'general',
    exclusionKeyword: 'explicit',
    exclusionType: 'STRICT',
    isActive: true
  },

  // Bag search specific exclusions
  {
    ruleName: 'Bag Search - Vacuum Exclusion',
    searchContext: 'bag_search',
    exclusionKeyword: 'vacuum',
    exclusionType: 'STRICT',
    isActive: true
  },
  {
    ruleName: 'Bag Search - Garbage Exclusion',
    searchContext: 'bag_search',
    exclusionKeyword: 'garbage',
    exclusionType: 'STRICT',
    isActive: true
  },
  {
    ruleName: 'Bag Search - Trash Exclusion',
    searchContext: 'bag_search',
    exclusionKeyword: 'trash',
    exclusionType: 'STRICT',
    isActive: true
  },
  {
    ruleName: 'Bag Search - Sleeping Exclusion',
    searchContext: 'bag_search',
    exclusionKeyword: 'sleeping',
    exclusionType: 'PARTIAL',
    isActive: true
  },

  // Automotive search specific exclusions
  {
    ruleName: 'Automotive Search - Toy Exclusion',
    searchContext: 'automotive_search',
    exclusionKeyword: 'toy',
    exclusionType: 'PARTIAL',
    isActive: true
  },
  {
    ruleName: 'Automotive Search - Model Exclusion',
    searchContext: 'automotive_search',
    exclusionKeyword: 'model car',
    exclusionType: 'STRICT',
    isActive: true
  },
  {
    ruleName: 'Automotive Search - Miniature Exclusion',
    searchContext: 'automotive_search',
    exclusionKeyword: 'miniature',
    exclusionType: 'STRICT',
    isActive: true
  },

  // Vintage search exclusions
  {
    ruleName: 'Vintage Search - Reproduction Exclusion',
    searchContext: 'vintage_search',
    exclusionKeyword: 'reproduction',
    exclusionType: 'STRICT',
    isActive: true
  },
  {
    ruleName: 'Vintage Search - Replica Exclusion',
    searchContext: 'vintage_search',
    exclusionKeyword: 'replica',
    exclusionType: 'STRICT',
    isActive: true
  }
]

async function main() {
  console.log('🌱 Starting configuration seed...')

  // Seed Category Configurations
  console.log('\n📁 Seeding Category Configurations...')
  let categoryCount = 0
  for (const categoryData of categoryConfigurations) {
    try {
      const existingCategory = await prisma.categoryConfiguration.findUnique({
        where: { categoryName: categoryData.categoryName }
      })

      if (!existingCategory) {
        await prisma.categoryConfiguration.create({
          data: categoryData
        })
        categoryCount++
        console.log(`✅ Created category: ${categoryData.displayName}`)
      } else {
        // Update existing category to ensure it has latest data
        await prisma.categoryConfiguration.update({
          where: { categoryName: categoryData.categoryName },
          data: categoryData
        })
        console.log(`🔄 Updated category: ${categoryData.displayName}`)
      }
    } catch (error) {
      console.error(`❌ Error with category ${categoryData.categoryName}:`, error)
    }
  }

  // Seed Category Keywords
  console.log('\n🔑 Seeding Category Keywords...')
  let keywordCount = 0
  for (const keywordData of categoryKeywords) {
    try {
      // Get the category ID
      const category = await prisma.categoryConfiguration.findUnique({
        where: { categoryName: keywordData.categoryName }
      })

      if (!category) {
        console.log(`⚠️ Category not found for keyword: ${keywordData.keyword} -> ${keywordData.categoryName}`)
        continue
      }

      // Check if keyword already exists for this category
      const existingKeyword = await prisma.categoryKeyword.findFirst({
        where: {
          categoryId: category.id,
          keyword: keywordData.keyword
        }
      })

      if (!existingKeyword) {
        await prisma.categoryKeyword.create({
          data: {
            categoryId: category.id,
            keyword: keywordData.keyword,
            weight: keywordData.weight,
            isActive: true
          }
        })
        keywordCount++
        console.log(`✅ Created keyword: ${keywordData.keyword} -> ${keywordData.categoryName}`)
      } else {
        // Update weight if different
        if (existingKeyword.weight !== keywordData.weight) {
          await prisma.categoryKeyword.update({
            where: { id: existingKeyword.id },
            data: { weight: keywordData.weight }
          })
          console.log(`🔄 Updated keyword weight: ${keywordData.keyword}`)
        }
      }
    } catch (error) {
      console.error(`❌ Error with keyword ${keywordData.keyword}:`, error)
    }
  }

  // Seed Search Exclusion Configurations
  console.log('\n🚫 Seeding Search Exclusion Configurations...')
  let exclusionCount = 0
  for (const exclusionData of searchExclusionConfigurations) {
    try {
      const existingExclusion = await prisma.searchExclusionConfiguration.findFirst({
        where: {
          searchContext: exclusionData.searchContext,
          exclusionKeyword: exclusionData.exclusionKeyword
        }
      })

      if (!existingExclusion) {
        await prisma.searchExclusionConfiguration.create({
          data: exclusionData
        })
        exclusionCount++
        console.log(`✅ Created exclusion: ${exclusionData.ruleName}`)
      } else {
        console.log(`⏭️ Exclusion already exists: ${exclusionData.ruleName}`)
      }
    } catch (error) {
      console.error(`❌ Error with exclusion ${exclusionData.ruleName}:`, error)
    }
  }

  console.log(`\n🎉 Configuration seed completed!`)
  console.log(`📊 Categories: ${await prisma.categoryConfiguration.count()}`)
  console.log(`🔑 Keywords: ${await prisma.categoryKeyword.count()}`)
  console.log(`🚫 Exclusions: ${await prisma.searchExclusionConfiguration.count()}`)

  console.log('\n📋 Configuration Summary:')

  // Show category hierarchy
  const mainCategories = await prisma.categoryConfiguration.findMany({
    where: { parentCategory: null, isActive: true },
    orderBy: { sortOrder: 'asc' }
  })

  for (const category of mainCategories) {
    console.log(`  📁 ${category.displayName}`)

    const subcategories = await prisma.categoryConfiguration.findMany({
      where: { parentCategory: category.categoryName, isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    for (const subcat of subcategories) {
      console.log(`    └── ${subcat.displayName}`)
    }

    const keywordCount = await prisma.categoryKeyword.count({
      where: {
        categoryConfiguration: { categoryName: category.categoryName },
        isActive: true
      }
    })
    console.log(`    🔑 ${keywordCount} keywords`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Configuration seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
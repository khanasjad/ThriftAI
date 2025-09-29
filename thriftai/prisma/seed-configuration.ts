import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedConfiguration() {
  console.log('🌱 Seeding configuration data...')

  try {
    // 1. Seed Category Configuration
    console.log('📂 Seeding category configuration...')
    const categories = [
      {
        categoryName: 'CLOTHING',
        displayName: 'Clothing & Fashion',
        description: 'All types of clothing and fashion items',
        isActive: true,
        sortOrder: 1
      },
      {
        categoryName: 'SHOES',
        displayName: 'Shoes & Footwear',
        description: 'All types of footwear and shoes',
        isActive: true,
        sortOrder: 2
      },
      {
        categoryName: 'ACCESSORIES',
        displayName: 'Accessories & Jewelry',
        description: 'Bags, jewelry, watches, and other accessories',
        isActive: true,
        sortOrder: 3
      },
      {
        categoryName: 'ELECTRONICS',
        displayName: 'Electronics & Gadgets',
        description: 'Electronic devices and gadgets',
        isActive: true,
        sortOrder: 4
      },
      {
        categoryName: 'HOME',
        displayName: 'Home & Decor',
        description: 'Home decoration and furniture items',
        isActive: true,
        sortOrder: 5
      },
      {
        categoryName: 'BOOKS',
        displayName: 'Books & Media',
        description: 'Books, magazines, and media items',
        isActive: true,
        sortOrder: 6
      }
    ]

    for (const category of categories) {
      await prisma.categoryConfiguration.upsert({
        where: { categoryName: category.categoryName },
        update: category,
        create: category
      })
    }

    // 2. Seed Category Keywords
    console.log('🔤 Seeding category keywords...')
    const categoryKeywords = [
      // CLOTHING keywords
      { categoryName: 'CLOTHING', keyword: 'clothing', weight: 3.0 },
      { categoryName: 'CLOTHING', keyword: 'clothes', weight: 3.0 },
      { categoryName: 'CLOTHING', keyword: 'apparel', weight: 3.0 },
      { categoryName: 'CLOTHING', keyword: 'shirt', weight: 2.5 },
      { categoryName: 'CLOTHING', keyword: 'blouse', weight: 2.5 },
      { categoryName: 'CLOTHING', keyword: 'sweater', weight: 2.5 },
      { categoryName: 'CLOTHING', keyword: 'jacket', weight: 2.5 },
      { categoryName: 'CLOTHING', keyword: 'pants', weight: 2.5 },
      { categoryName: 'CLOTHING', keyword: 'jeans', weight: 2.5 },
      { categoryName: 'CLOTHING', keyword: 'dress', weight: 2.5 },
      { categoryName: 'CLOTHING', keyword: 'skirt', weight: 2.0 },
      { categoryName: 'CLOTHING', keyword: 'top', weight: 2.0 },
      { categoryName: 'CLOTHING', keyword: 'fashion', weight: 2.0 },

      // SHOES keywords
      { categoryName: 'SHOES', keyword: 'shoes', weight: 3.0 },
      { categoryName: 'SHOES', keyword: 'footwear', weight: 3.0 },
      { categoryName: 'SHOES', keyword: 'sneakers', weight: 2.5 },
      { categoryName: 'SHOES', keyword: 'boots', weight: 2.5 },
      { categoryName: 'SHOES', keyword: 'heels', weight: 2.5 },
      { categoryName: 'SHOES', keyword: 'flats', weight: 2.5 },
      { categoryName: 'SHOES', keyword: 'sandals', weight: 2.5 },
      { categoryName: 'SHOES', keyword: 'loafers', weight: 2.0 },

      // ACCESSORIES keywords
      { categoryName: 'ACCESSORIES', keyword: 'accessories', weight: 3.0 },
      { categoryName: 'ACCESSORIES', keyword: 'bag', weight: 3.0 },
      { categoryName: 'ACCESSORIES', keyword: 'purse', weight: 3.0 },
      { categoryName: 'ACCESSORIES', keyword: 'handbag', weight: 3.0 },
      { categoryName: 'ACCESSORIES', keyword: 'wallet', weight: 2.5 },
      { categoryName: 'ACCESSORIES', keyword: 'belt', weight: 2.5 },
      { categoryName: 'ACCESSORIES', keyword: 'jewelry', weight: 2.5 },
      { categoryName: 'ACCESSORIES', keyword: 'watch', weight: 2.5 },
      { categoryName: 'ACCESSORIES', keyword: 'sunglasses', weight: 2.5 },

      // ELECTRONICS keywords
      { categoryName: 'ELECTRONICS', keyword: 'electronics', weight: 3.0 },
      { categoryName: 'ELECTRONICS', keyword: 'gadget', weight: 3.0 },
      { categoryName: 'ELECTRONICS', keyword: 'device', weight: 3.0 },
      { categoryName: 'ELECTRONICS', keyword: 'tech', weight: 2.5 },
      { categoryName: 'ELECTRONICS', keyword: 'phone', weight: 2.5 },
      { categoryName: 'ELECTRONICS', keyword: 'computer', weight: 2.5 },
      { categoryName: 'ELECTRONICS', keyword: 'laptop', weight: 2.5 },
      { categoryName: 'ELECTRONICS', keyword: 'headphones', weight: 2.0 }
    ]

    for (const keyword of categoryKeywords) {
      const category = await prisma.categoryConfiguration.findUnique({
        where: { categoryName: keyword.categoryName }
      })

      if (category) {
        const existingKeyword = await prisma.categoryKeyword.findFirst({
          where: {
            categoryId: category.id,
            keyword: keyword.keyword
          }
        })

        if (existingKeyword) {
          await prisma.categoryKeyword.update({
            where: { id: existingKeyword.id },
            data: { weight: keyword.weight }
          })
        } else {
          await prisma.categoryKeyword.create({
            data: {
              categoryId: category.id,
              keyword: keyword.keyword,
              weight: keyword.weight,
              isActive: true
            }
          })
        }
      }
    }

    // 3. Seed Search Keyword Configuration
    console.log('🔍 Seeding search keyword configuration...')
    const searchKeywords = [
      // Product Type Keywords
      { keywordType: 'PRODUCT_TYPE', keyword: 'bag', synonyms: ['bags', 'handbag', 'handbags'], weight: 3.0 },
      { keywordType: 'PRODUCT_TYPE', keyword: 'purse', synonyms: ['purses'], weight: 3.0 },
      { keywordType: 'PRODUCT_TYPE', keyword: 'backpack', synonyms: ['backpacks'], weight: 2.5 },
      { keywordType: 'PRODUCT_TYPE', keyword: 'tote', synonyms: ['totes'], weight: 2.5 },
      { keywordType: 'PRODUCT_TYPE', keyword: 'clutch', synonyms: ['clutches'], weight: 2.5 },
      { keywordType: 'PRODUCT_TYPE', keyword: 'wallet', synonyms: ['wallets'], weight: 2.5 },
      { keywordType: 'PRODUCT_TYPE', keyword: 'crossbody', synonyms: [], weight: 2.0 },
      { keywordType: 'PRODUCT_TYPE', keyword: 'messenger', synonyms: ['messenger bag'], weight: 2.0 },
      { keywordType: 'PRODUCT_TYPE', keyword: 'satchel', synonyms: ['satchels'], weight: 2.0 },
      { keywordType: 'PRODUCT_TYPE', keyword: 'hobo', synonyms: ['hobo bag'], weight: 2.0 },
      { keywordType: 'PRODUCT_TYPE', keyword: 'shoulder', synonyms: ['shoulder bag'], weight: 2.0 },
      { keywordType: 'PRODUCT_TYPE', keyword: 'pouch', synonyms: ['pouches'], weight: 1.5 },

      // Brand Descriptors
      { keywordType: 'BRAND_DESCRIPTOR', keyword: 'designer', synonyms: ['luxury', 'high-end'], weight: 3.0 },
      { keywordType: 'BRAND_DESCRIPTOR', keyword: 'luxury', synonyms: ['premium', 'exclusive'], weight: 3.0 },
      { keywordType: 'BRAND_DESCRIPTOR', keyword: 'premium', synonyms: ['high-quality'], weight: 2.5 },
      { keywordType: 'BRAND_DESCRIPTOR', keyword: 'authentic', synonyms: ['genuine', 'original'], weight: 2.5 },

      // Condition Descriptors
      { keywordType: 'CONDITION_DESCRIPTOR', keyword: 'vintage', synonyms: ['retro', 'classic'], weight: 3.0 },
      { keywordType: 'CONDITION_DESCRIPTOR', keyword: 'antique', synonyms: ['old', 'aged'], weight: 2.5 },
      { keywordType: 'CONDITION_DESCRIPTOR', keyword: 'new', synonyms: ['brand new', 'unused'], weight: 2.5 },
      { keywordType: 'CONDITION_DESCRIPTOR', keyword: 'used', synonyms: ['pre-owned', 'second-hand'], weight: 2.0 },
      { keywordType: 'CONDITION_DESCRIPTOR', keyword: 'excellent', synonyms: ['mint', 'perfect'], weight: 2.0 },
      { keywordType: 'CONDITION_DESCRIPTOR', keyword: 'good', synonyms: ['decent', 'nice'], weight: 1.5 },
      { keywordType: 'CONDITION_DESCRIPTOR', keyword: 'fair', synonyms: ['okay', 'acceptable'], weight: 1.0 },

      // Stop Words
      { keywordType: 'STOP_WORD', keyword: 'find', synonyms: [], weight: 0.1 },
      { keywordType: 'STOP_WORD', keyword: 'search', synonyms: [], weight: 0.1 },
      { keywordType: 'STOP_WORD', keyword: 'get', synonyms: [], weight: 0.1 },
      { keywordType: 'STOP_WORD', keyword: 'buy', synonyms: [], weight: 0.1 },
      { keywordType: 'STOP_WORD', keyword: 'shop', synonyms: [], weight: 0.1 },
      { keywordType: 'STOP_WORD', keyword: 'looking', synonyms: [], weight: 0.1 },
      { keywordType: 'STOP_WORD', keyword: 'for', synonyms: [], weight: 0.1 },
      { keywordType: 'STOP_WORD', keyword: 'the', synonyms: [], weight: 0.1 },
      { keywordType: 'STOP_WORD', keyword: 'and', synonyms: [], weight: 0.1 },
      { keywordType: 'STOP_WORD', keyword: 'or', synonyms: [], weight: 0.1 },
      { keywordType: 'STOP_WORD', keyword: 'a', synonyms: [], weight: 0.1 },
      { keywordType: 'STOP_WORD', keyword: 'an', synonyms: [], weight: 0.1 },
      { keywordType: 'STOP_WORD', keyword: 'with', synonyms: [], weight: 0.1 },
      { keywordType: 'STOP_WORD', keyword: 'in', synonyms: [], weight: 0.1 },
      { keywordType: 'STOP_WORD', keyword: 'on', synonyms: [], weight: 0.1 }
    ]

    for (const keyword of searchKeywords) {
      const existingSearchKeyword = await prisma.searchKeywordConfiguration.findFirst({
        where: {
          keywordType: keyword.keywordType as any,
          keyword: keyword.keyword
        }
      })

      if (existingSearchKeyword) {
        await prisma.searchKeywordConfiguration.update({
          where: { id: existingSearchKeyword.id },
          data: {
            synonyms: keyword.synonyms,
            weight: keyword.weight
          }
        })
      } else {
        await prisma.searchKeywordConfiguration.create({
          data: {
            keywordType: keyword.keywordType as any,
            keyword: keyword.keyword,
            synonyms: keyword.synonyms,
            weight: keyword.weight,
            isActive: true
          }
        })
      }
    }

    // 4. Seed Brand Configuration
    console.log('🏷️  Seeding brand configuration...')
    const brands = [
      { brandName: 'Nike', normalizedName: 'nike', reputation: 95, isPremium: true, warranty: '1 year', category: 'SHOES' },
      { brandName: 'Adidas', normalizedName: 'adidas', reputation: 92, isPremium: true, warranty: '1 year', category: 'SHOES' },
      { brandName: "Levi's", normalizedName: 'levis', reputation: 88, isPremium: false, warranty: '6 months', category: 'CLOTHING' },
      { brandName: 'Gap', normalizedName: 'gap', reputation: 75, isPremium: false, warranty: '3 months', category: 'CLOTHING' },
      { brandName: 'H&M', normalizedName: 'hm', reputation: 65, isPremium: false, warranty: '30 days', category: 'CLOTHING' },
      { brandName: 'Zara', normalizedName: 'zara', reputation: 78, isPremium: false, warranty: '30 days', category: 'CLOTHING' },
      { brandName: 'Uniqlo', normalizedName: 'uniqlo', reputation: 82, isPremium: false, warranty: '6 months', category: 'CLOTHING' },
      { brandName: 'Apple', normalizedName: 'apple', reputation: 98, isPremium: true, warranty: '1 year', category: 'ELECTRONICS' },
      { brandName: 'Samsung', normalizedName: 'samsung', reputation: 90, isPremium: true, warranty: '1 year', category: 'ELECTRONICS' },
      { brandName: 'Sony', normalizedName: 'sony', reputation: 89, isPremium: true, warranty: '1 year', category: 'ELECTRONICS' },
      { brandName: 'Gucci', normalizedName: 'gucci', reputation: 98, isPremium: true, warranty: '2 years', category: 'ACCESSORIES' },
      { brandName: 'Chanel', normalizedName: 'chanel', reputation: 99, isPremium: true, warranty: '2 years', category: 'ACCESSORIES' },
      { brandName: 'Louis Vuitton', normalizedName: 'louis-vuitton', reputation: 98, isPremium: true, warranty: '2 years', category: 'ACCESSORIES' },
      { brandName: 'Prada', normalizedName: 'prada', reputation: 96, isPremium: true, warranty: '2 years', category: 'ACCESSORIES' },
      { brandName: 'Hermès', normalizedName: 'hermes', reputation: 99, isPremium: true, warranty: '2 years', category: 'ACCESSORIES' },
      { brandName: 'Calvin Klein', normalizedName: 'calvin-klein', reputation: 85, isPremium: false, warranty: '6 months', category: 'CLOTHING' },
      { brandName: 'Ralph Lauren', normalizedName: 'ralph-lauren', reputation: 87, isPremium: false, warranty: '6 months', category: 'CLOTHING' },
      { brandName: 'Tommy Hilfiger', normalizedName: 'tommy-hilfiger', reputation: 82, isPremium: false, warranty: '6 months', category: 'CLOTHING' },
      { brandName: 'Coach', normalizedName: 'coach', reputation: 90, isPremium: true, warranty: '1 year', category: 'ACCESSORIES' },
      { brandName: 'Michael Kors', normalizedName: 'michael-kors', reputation: 80, isPremium: false, warranty: '6 months', category: 'ACCESSORIES' }
    ]

    for (const brand of brands) {
      await prisma.brandConfiguration.upsert({
        where: { brandName: brand.brandName },
        update: brand,
        create: brand
      })
    }

    // 5. Seed Category Mapping Configuration
    console.log('🗂️  Seeding category mapping configuration...')
    const categoryMappings = [
      {
        categoryName: 'CLOTHING',
        amazonCategory: 'Fashion',
        subcategories: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Activewear'],
        avgShippingDays: 3,
        returnWindow: 30
      },
      {
        categoryName: 'SHOES',
        amazonCategory: 'Shoes & Handbags',
        subcategories: ['Athletic', 'Casual', 'Dress', 'Boots', 'Sandals'],
        avgShippingDays: 2,
        returnWindow: 30
      },
      {
        categoryName: 'ACCESSORIES',
        amazonCategory: 'Accessories',
        subcategories: ['Jewelry', 'Watches', 'Bags', 'Belts', 'Sunglasses'],
        avgShippingDays: 2,
        returnWindow: 15
      },
      {
        categoryName: 'ELECTRONICS',
        amazonCategory: 'Electronics',
        subcategories: ['Phones', 'Laptops', 'Audio', 'Gaming', 'Smart Home'],
        avgShippingDays: 1,
        returnWindow: 15
      },
      {
        categoryName: 'HOME',
        amazonCategory: 'Home & Kitchen',
        subcategories: ['Furniture', 'Decor', 'Kitchen', 'Bedroom', 'Living Room'],
        avgShippingDays: 5,
        returnWindow: 30
      },
      {
        categoryName: 'BOOKS',
        amazonCategory: 'Books',
        subcategories: ['Fiction', 'Non-Fiction', 'Educational', 'Comics', 'Magazines'],
        avgShippingDays: 3,
        returnWindow: 30
      }
    ]

    for (const mapping of categoryMappings) {
      await prisma.categoryMappingConfiguration.upsert({
        where: { categoryName: mapping.categoryName },
        update: mapping,
        create: mapping
      })
    }

    // 6. Seed Search Exclusion Configuration
    console.log('🚫 Seeding search exclusion configuration...')
    const exclusions = [
      { ruleName: 'Bag Search Exclusions', searchContext: 'bag_search', exclusionKeyword: 'SHOES', exclusionType: 'CATEGORY' },
      { ruleName: 'Bag Search Exclusions', searchContext: 'bag_search', exclusionKeyword: 'ELECTRONICS', exclusionType: 'CATEGORY' },
      { ruleName: 'Car Search Exclusions', searchContext: 'automotive_search', exclusionKeyword: 'CLOTHING', exclusionType: 'CATEGORY' },
      { ruleName: 'Car Search Exclusions', searchContext: 'automotive_search', exclusionKeyword: 'SHOES', exclusionType: 'CATEGORY' }
    ]

    for (const exclusion of exclusions) {
      const existingExclusion = await prisma.searchExclusionConfiguration.findFirst({
        where: {
          searchContext: exclusion.searchContext,
          exclusionKeyword: exclusion.exclusionKeyword
        }
      })

      if (existingExclusion) {
        await prisma.searchExclusionConfiguration.update({
          where: { id: existingExclusion.id },
          data: exclusion
        })
      } else {
        await prisma.searchExclusionConfiguration.create({
          data: exclusion
        })
      }
    }

    console.log('✅ Configuration data seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding configuration data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed if called directly
if (require.main === module) {
  seedConfiguration()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedConfiguration }
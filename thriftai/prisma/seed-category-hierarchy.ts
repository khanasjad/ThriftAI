import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🏗️  Seeding category hierarchy...')

  // Define comprehensive category structure
  const categoryHierarchy = [
    {
      name: 'ELECTRONICS',
      display: 'Electronics & Gadgets',
      subcategories: [
        { name: 'LAPTOPS', display: 'Laptops & Computers' },
        { name: 'SMARTPHONES', display: 'Smartphones & Tablets' },
        { name: 'CAMERAS', display: 'Cameras & Photography' },
        { name: 'AUDIO', display: 'Audio & Headphones' },
        { name: 'GAMING', display: 'Gaming Consoles & Accessories' },
        { name: 'WEARABLES', display: 'Smartwatches & Wearables' },
        { name: 'TV_MONITORS', display: 'TVs & Monitors' },
        { name: 'ACCESSORIES_ELECTRONICS', display: 'Electronic Accessories' }
      ]
    },
    {
      name: 'CLOTHING',
      display: 'Clothing & Fashion',
      subcategories: [
        { name: 'MENS_CLOTHING', display: "Men's Clothing" },
        { name: 'WOMENS_CLOTHING', display: "Women's Clothing" },
        { name: 'KIDS_CLOTHING', display: "Kids' Clothing" },
        { name: 'ACTIVEWEAR', display: 'Activewear & Sportswear' },
        { name: 'OUTERWEAR', display: 'Jackets & Coats' },
        { name: 'DRESSES', display: 'Dresses & Skirts' },
        { name: 'TOPS', display: 'Tops & Shirts' },
        { name: 'BOTTOMS', display: 'Pants & Jeans' },
        { name: 'VINTAGE_CLOTHING', display: 'Vintage & Designer Clothing' }
      ]
    },
    {
      name: 'ACCESSORIES',
      display: 'Accessories & Jewelry',
      subcategories: [
        { name: 'BAGS', display: 'Handbags & Purses' },
        { name: 'BACKPACKS', display: 'Backpacks & Luggage' },
        { name: 'JEWELRY', display: 'Jewelry & Watches' },
        { name: 'WATCHES', display: 'Watches' },
        { name: 'SUNGLASSES', display: 'Sunglasses & Eyewear' },
        { name: 'BELTS', display: 'Belts & Wallets' },
        { name: 'HATS', display: 'Hats & Caps' },
        { name: 'SCARVES', display: 'Scarves & Gloves' }
      ]
    },
    {
      name: 'SHOES',
      display: 'Shoes & Footwear',
      subcategories: [
        { name: 'SNEAKERS', display: 'Sneakers & Athletic Shoes' },
        { name: 'BOOTS', display: 'Boots' },
        { name: 'SANDALS', display: 'Sandals & Flip Flops' },
        { name: 'FORMAL_SHOES', display: 'Dress & Formal Shoes' },
        { name: 'HEELS', display: 'Heels & Pumps' },
        { name: 'FLATS', display: 'Flats & Loafers' },
        { name: 'KIDS_SHOES', display: "Kids' Shoes" }
      ]
    },
    {
      name: 'HOME',
      display: 'Home & Decor',
      subcategories: [
        { name: 'FURNITURE', display: 'Furniture' },
        { name: 'KITCHENWARE', display: 'Kitchen & Dining' },
        { name: 'BEDDING', display: 'Bedding & Bath' },
        { name: 'DECOR', display: 'Home Decor & Art' },
        { name: 'LIGHTING', display: 'Lighting' },
        { name: 'APPLIANCES', display: 'Home Appliances' },
        { name: 'STORAGE', display: 'Storage & Organization' },
        { name: 'GARDEN', display: 'Garden & Outdoor' }
      ]
    },
    {
      name: 'BOOKS',
      display: 'Books & Media',
      subcategories: [
        { name: 'FICTION', display: 'Fiction Books' },
        { name: 'NONFICTION', display: 'Non-Fiction Books' },
        { name: 'TEXTBOOKS', display: 'Textbooks & Education' },
        { name: 'CHILDRENS_BOOKS', display: "Children's Books" },
        { name: 'MUSIC', display: 'Music & Vinyl' },
        { name: 'MOVIES', display: 'Movies & DVDs' },
        { name: 'GAMES', display: 'Video Games' }
      ]
    }
  ]

  // Create parent categories first
  for (const category of categoryHierarchy) {
    await prisma.categoryConfiguration.upsert({
      where: { categoryName: category.name },
      update: {
        displayName: category.display,
        isActive: true,
        sortOrder: categoryHierarchy.indexOf(category)
      },
      create: {
        categoryName: category.name,
        displayName: category.display,
        parentCategory: null,
        isActive: true,
        sortOrder: categoryHierarchy.indexOf(category),
        description: `${category.display} products`
      }
    })

    console.log(`✅ ${category.name} (${category.subcategories.length} subcategories)`)

    // Create subcategories
    for (const subcategory of category.subcategories) {
      await prisma.categoryConfiguration.upsert({
        where: { categoryName: subcategory.name },
        update: {
          displayName: subcategory.display,
          parentCategory: category.name,
          isActive: true,
          sortOrder: category.subcategories.indexOf(subcategory)
        },
        create: {
          categoryName: subcategory.name,
          displayName: subcategory.display,
          parentCategory: category.name,
          isActive: true,
          sortOrder: category.subcategories.indexOf(subcategory),
          description: `${subcategory.display} products in ${category.display}`
        }
      })

      console.log(`  → ${subcategory.name}`)
    }
  }

  console.log('\n✅ Category hierarchy seeded successfully!')
  console.log(`📊 Total: ${categoryHierarchy.length} parent categories, ${categoryHierarchy.reduce((sum, c) => sum + c.subcategories.length, 0)} subcategories`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding category hierarchy:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

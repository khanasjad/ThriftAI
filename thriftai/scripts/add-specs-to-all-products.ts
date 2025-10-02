import { prisma } from '../src/lib/prisma'

// Comprehensive specification templates for all categories
const categorySpecs: Record<string, any> = {
  // Electronics
  LAPTOPS: () => ({
    ram: ['8GB', '16GB', '32GB', '64GB'][Math.floor(Math.random() * 4)],
    storage: ['256GB', '512GB', '1024GB', '2048GB'][Math.floor(Math.random() * 4)],
    processor: ['Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M1', 'Apple M2'][Math.floor(Math.random() * 7)],
    screenSize: ['13 inches', '14 inches', '15 inches', '16 inches', '17 inches'][Math.floor(Math.random() * 5)]
  }),

  SMARTPHONES: () => ({
    ram: ['4GB', '6GB', '8GB', '12GB', '16GB'][Math.floor(Math.random() * 5)],
    storage: ['64GB', '128GB', '256GB', '512GB', '1TB'][Math.floor(Math.random() * 5)],
    screenSize: ['5.5 inches', '6.1 inches', '6.5 inches', '6.7 inches'][Math.floor(Math.random() * 4)],
    camera: ['12MP', '48MP', '64MP', '108MP'][Math.floor(Math.random() * 4)],
    battery: ['3000mAh', '4000mAh', '5000mAh', '6000mAh'][Math.floor(Math.random() * 4)]
  }),

  TABLETS: () => ({
    ram: ['4GB', '6GB', '8GB', '16GB'][Math.floor(Math.random() * 4)],
    storage: ['64GB', '128GB', '256GB', '512GB'][Math.floor(Math.random() * 4)],
    screenSize: ['8 inches', '10 inches', '11 inches', '12.9 inches'][Math.floor(Math.random() * 4)],
    battery: ['6000mAh', '8000mAh', '10000mAh'][Math.floor(Math.random() * 3)]
  }),

  SMARTWATCHES: () => ({
    displaySize: ['1.1 inches', '1.3 inches', '1.4 inches', '1.7 inches'][Math.floor(Math.random() * 4)],
    battery: ['24 hours', '48 hours', '5 days', '10 days'][Math.floor(Math.random() * 4)],
    waterResistant: ['3 ATM', '5 ATM', '10 ATM'][Math.floor(Math.random() * 3)],
    sensors: ['Heart Rate, GPS', 'Heart Rate, GPS, SpO2', 'Heart Rate, GPS, SpO2, ECG'][Math.floor(Math.random() * 3)]
  }),

  HEADPHONES: () => ({
    type: ['Over-ear', 'On-ear', 'In-ear'][Math.floor(Math.random() * 3)],
    wireless: Math.random() > 0.3 ? 'Yes' : 'No',
    noiseCancellation: Math.random() > 0.5 ? 'Active' : 'Passive',
    battery: ['20 hours', '30 hours', '40 hours', '50 hours'][Math.floor(Math.random() * 4)]
  }),

  CAMERAS: () => ({
    megapixels: ['20MP', '24MP', '45MP', '60MP'][Math.floor(Math.random() * 4)],
    sensor: ['APS-C', 'Full Frame', 'Micro Four Thirds'][Math.floor(Math.random() * 3)],
    videoResolution: ['1080p', '4K', '6K', '8K'][Math.floor(Math.random() * 4)],
    iso: ['100-51200', '100-102400', '100-204800'][Math.floor(Math.random() * 3)]
  }),

  MONITORS: () => ({
    screenSize: ['24 inches', '27 inches', '32 inches', '34 inches'][Math.floor(Math.random() * 4)],
    resolution: ['1080p', '1440p', '4K', '5K'][Math.floor(Math.random() * 4)],
    refreshRate: ['60Hz', '75Hz', '144Hz', '240Hz'][Math.floor(Math.random() * 4)],
    panel: ['IPS', 'VA', 'TN', 'OLED'][Math.floor(Math.random() * 4)]
  }),

  KEYBOARDS: () => ({
    type: ['Mechanical', 'Membrane', 'Optical'][Math.floor(Math.random() * 3)],
    switches: ['Cherry MX Red', 'Cherry MX Blue', 'Cherry MX Brown', 'Razer Green'][Math.floor(Math.random() * 4)],
    backlight: ['RGB', 'White', 'None'][Math.floor(Math.random() * 3)],
    wireless: Math.random() > 0.5 ? 'Yes' : 'No'
  }),

  // Clothing
  MENS_TSHIRTS: () => ({
    material: ['100% Cotton', '60% Cotton 40% Polyester', '95% Cotton 5% Spandex'][Math.floor(Math.random() * 3)],
    fit: ['Regular', 'Slim', 'Relaxed'][Math.floor(Math.random() * 3)],
    neckline: ['Crew', 'V-Neck', 'Henley'][Math.floor(Math.random() * 3)],
    sleeve: ['Short Sleeve', 'Long Sleeve'][Math.floor(Math.random() * 2)]
  }),

  MENS_JEANS: () => ({
    material: ['100% Denim', '98% Cotton 2% Elastane', '80% Cotton 20% Polyester'][Math.floor(Math.random() * 3)],
    fit: ['Regular', 'Slim', 'Straight', 'Bootcut', 'Relaxed'][Math.floor(Math.random() * 5)],
    rise: ['Low', 'Mid', 'High'][Math.floor(Math.random() * 3)],
    stretch: Math.random() > 0.5 ? 'Yes' : 'No'
  }),

  WOMENS_DRESSES: () => ({
    material: ['Polyester', 'Cotton', 'Silk', 'Chiffon', 'Velvet'][Math.floor(Math.random() * 5)],
    length: ['Mini', 'Midi', 'Maxi'][Math.floor(Math.random() * 3)],
    style: ['A-Line', 'Bodycon', 'Shift', 'Wrap'][Math.floor(Math.random() * 4)],
    sleeve: ['Sleeveless', 'Short Sleeve', 'Long Sleeve'][Math.floor(Math.random() * 3)]
  }),

  WOMENS_TOPS: () => ({
    material: ['Cotton', 'Polyester', 'Silk', 'Rayon'][Math.floor(Math.random() * 4)],
    fit: ['Regular', 'Slim', 'Loose'][Math.floor(Math.random() * 3)],
    style: ['Casual', 'Formal', 'Athletic'][Math.floor(Math.random() * 3)],
    neckline: ['Crew', 'V-Neck', 'Scoop', 'High Neck'][Math.floor(Math.random() * 4)]
  }),

  // Shoes
  MENS_SNEAKERS: () => ({
    material: ['Leather', 'Canvas', 'Mesh', 'Synthetic'][Math.floor(Math.random() * 4)],
    sole: ['Rubber', 'EVA', 'Foam'][Math.floor(Math.random() * 3)],
    closure: ['Lace-up', 'Slip-on', 'Velcro'][Math.floor(Math.random() * 3)],
    cushioning: ['Standard', 'Enhanced', 'Maximum'][Math.floor(Math.random() * 3)]
  }),

  RUNNING_SHOES: () => ({
    type: ['Road', 'Trail', 'Track'][Math.floor(Math.random() * 3)],
    cushioning: ['Minimal', 'Moderate', 'Maximum'][Math.floor(Math.random() * 3)],
    drop: ['0mm', '4mm', '8mm', '12mm'][Math.floor(Math.random() * 4)],
    weight: ['6oz', '8oz', '10oz', '12oz'][Math.floor(Math.random() * 4)]
  }),

  // Home & Kitchen
  KITCHEN_APPLIANCES: () => ({
    power: ['800W', '1000W', '1200W', '1500W'][Math.floor(Math.random() * 4)],
    capacity: ['1.5L', '2L', '3L', '5L'][Math.floor(Math.random() * 4)],
    material: ['Stainless Steel', 'Plastic', 'Glass'][Math.floor(Math.random() * 3)],
    programs: [3, 5, 8, 12][Math.floor(Math.random() * 4)] + ' programs'
  }),

  COOKWARE: () => ({
    material: ['Stainless Steel', 'Non-stick', 'Cast Iron', 'Copper'][Math.floor(Math.random() * 4)],
    size: ['8 inches', '10 inches', '12 inches', '14 inches'][Math.floor(Math.random() * 4)],
    ovenSafe: Math.random() > 0.3 ? 'Yes' : 'No',
    dishwasherSafe: Math.random() > 0.5 ? 'Yes' : 'No'
  }),

  FURNITURE: () => ({
    material: ['Wood', 'Metal', 'Plastic', 'Glass'][Math.floor(Math.random() * 4)],
    dimensions: ['Small', 'Medium', 'Large'][Math.floor(Math.random() * 3)],
    assembly: Math.random() > 0.6 ? 'Required' : 'Not Required',
    weight: [10, 20, 30, 50][Math.floor(Math.random() * 4)] + ' lbs'
  }),

  // Sports & Fitness
  TREADMILLS: () => ({
    motorPower: ['1.5HP', '2.0HP', '2.5HP', '3.0HP'][Math.floor(Math.random() * 4)],
    speedRange: ['0-10 mph', '0-12 mph', '0-15 mph'][Math.floor(Math.random() * 3)],
    incline: ['0-10%', '0-12%', '0-15%'][Math.floor(Math.random() * 3)],
    programs: [10, 15, 20, 30][Math.floor(Math.random() * 4)] + ' programs'
  }),

  // Toys
  LEGO_SETS: () => ({
    pieces: [100, 250, 500, 1000, 2000][Math.floor(Math.random() * 5)] + ' pieces',
    ageRange: ['4-7', '6-12', '8-14', '12+'][Math.floor(Math.random() * 4)],
    theme: ['City', 'Star Wars', 'Harry Potter', 'Technic', 'Friends'][Math.floor(Math.random() * 5)],
    buildingTime: ['1-2 hours', '3-4 hours', '5+ hours'][Math.floor(Math.random() * 3)]
  }),

  // Books
  TEXTBOOKS: () => ({
    pages: [200, 300, 500, 800][Math.floor(Math.random() * 4)] + ' pages',
    edition: ['1st', '2nd', '3rd', '4th', '5th'][Math.floor(Math.random() * 5)] + ' Edition',
    binding: ['Hardcover', 'Paperback'][Math.floor(Math.random() * 2)],
    isbn: 'ISBN-' + Math.floor(Math.random() * 1000000000)
  }),

  FICTION_BOOKS: () => ({
    pages: [150, 250, 350, 500][Math.floor(Math.random() * 4)] + ' pages',
    binding: ['Hardcover', 'Paperback', 'Mass Market'][Math.floor(Math.random() * 3)],
    genre: ['Mystery', 'Romance', 'Thriller', 'Fantasy', 'Sci-Fi'][Math.floor(Math.random() * 5)],
    year: [2020, 2021, 2022, 2023, 2024][Math.floor(Math.random() * 5)]
  })
}

// Apply same specs template to similar categories
const similarCategories: Record<string, string[]> = {
  MENS_TSHIRTS: ['MENS_SWEATERS', 'MENS_HOODIES', 'MENS_TOPS'],
  MENS_JEANS: ['MENS_PANTS', 'MENS_SHORTS'],
  WOMENS_DRESSES: ['WOMENS_SKIRTS'],
  WOMENS_TOPS: ['WOMENS_SWEATERS', 'WOMENS_BLOUSES'],
  MENS_SNEAKERS: ['WOMENS_SNEAKERS', 'BASKETBALL_SHOES', 'SOCCER_CLEATS'],
  RUNNING_SHOES: ['TRAINING_SHOES', 'CROSS_TRAINING_SHOES'],
  TEXTBOOKS: ['NONFICTION_BOOKS', 'CHILDRENS_BOOKS'],
  FURNITURE: ['DESKS', 'CHAIRS', 'TABLES', 'STORAGE'],
  KITCHEN_APPLIANCES: ['COFFEE_MAKERS', 'BLENDERS', 'FOOD_PROCESSORS'],
  COOKWARE: ['BAKEWARE', 'DINNERWARE'],
  LEGO_SETS: ['ACTION_FIGURES', 'DOLLS', 'OUTDOOR_TOYS', 'EDUCATIONAL_TOYS', 'BABY_TOYS', 'BOARD_GAMES', 'VIDEO_GAMES']
}

// Expand category specs
Object.entries(similarCategories).forEach(([template, categories]) => {
  categories.forEach(cat => {
    if (!categorySpecs[cat]) {
      categorySpecs[cat] = categorySpecs[template]
    }
  })
})

async function addSpecsToAllProducts() {
  console.log('🚀 Adding specifications to ALL products...\n')
  console.log('⚠️  This will process 100,000+ products. Please wait...\n')

  // Get all unique categories
  const categories = await prisma.product.findMany({
    where: { isAvailable: true },
    select: { category: true },
    distinct: ['category']
  })

  console.log(`Found ${categories.length} unique categories\n`)

  let totalUpdated = 0
  let totalSkipped = 0
  const batchSize = 100

  for (const { category } of categories) {
    const specsGenerator = categorySpecs[category]

    if (!specsGenerator) {
      console.log(`⏭️  Skipping ${category} (no specs template)`)
      continue
    }

    // Get products without specs in this category
    const products = await prisma.product.findMany({
      where: {
        isAvailable: true,
        category: category
      },
      select: {
        id: true,
        dynamicSpecs: true
      }
    })

    const productsToUpdate = products.filter(p => {
      const specs = p.dynamicSpecs as Record<string, any> | null
      return !specs || Object.keys(specs).length === 0
    })

    if (productsToUpdate.length === 0) {
      console.log(`✅ ${category}: All ${products.length} products already have specs`)
      totalSkipped += products.length
      continue
    }

    console.log(`🔄 ${category}: Updating ${productsToUpdate.length}/${products.length} products...`)

    // Update in batches
    for (let i = 0; i < productsToUpdate.length; i += batchSize) {
      const batch = productsToUpdate.slice(i, i + batchSize)

      await Promise.all(
        batch.map(product =>
          prisma.product.update({
            where: { id: product.id },
            data: { dynamicSpecs: specsGenerator() }
          })
        )
      )

      totalUpdated += batch.length
      process.stdout.write(`\r   Progress: ${totalUpdated} products updated...`)
    }

    console.log(`\n   ✅ Updated ${productsToUpdate.length} products`)
  }

  console.log(`\n\n🎉 Done!`)
  console.log(`   ✅ Updated: ${totalUpdated} products`)
  console.log(`   ⏭️  Skipped: ${totalSkipped} products (already had specs)`)
  console.log(`\n💡 Refresh the leaderboard to see specifications for all products!`)

  await prisma.$disconnect()
}

addSpecsToAllProducts().catch(console.error)

/**
 * Generate 100 Categories with 20 Products Each (2000 Total)
 * Uses dynamic algorithm to create category-specific products
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 100 Diverse Categories with Metadata
const CATEGORIES = [
  // Electronics (10 categories)
  { name: 'LAPTOPS', priceRange: [200, 2000], brands: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus'], specs: ['processor', 'ram', 'storage', 'screen'] },
  { name: 'SMARTPHONES', priceRange: [100, 1200], brands: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi'], specs: ['camera', 'battery', 'storage', 'screen'] },
  { name: 'TABLETS', priceRange: [150, 1000], brands: ['Apple', 'Samsung', 'Microsoft', 'Amazon', 'Lenovo'], specs: ['screen', 'storage', 'battery'] },
  { name: 'HEADPHONES', priceRange: [20, 400], brands: ['Sony', 'Bose', 'Apple', 'JBL', 'Sennheiser'], specs: ['noiseCanceling', 'wireless', 'battery'] },
  { name: 'SMARTWATCHES', priceRange: [50, 800], brands: ['Apple', 'Samsung', 'Fitbit', 'Garmin', 'Fossil'], specs: ['battery', 'fitness', 'waterproof'] },
  { name: 'CAMERAS', priceRange: [200, 3000], brands: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic'], specs: ['megapixels', 'lens', 'video'] },
  { name: 'GAMING_CONSOLES', priceRange: [200, 600], brands: ['Sony', 'Microsoft', 'Nintendo', 'Valve'], specs: ['storage', 'graphics', 'controllers'] },
  { name: 'MONITORS', priceRange: [100, 1500], brands: ['Dell', 'LG', 'Samsung', 'BenQ', 'Asus'], specs: ['resolution', 'refreshRate', 'size'] },
  { name: 'KEYBOARDS', priceRange: [20, 300], brands: ['Logitech', 'Razer', 'Corsair', 'Keychron', 'Ducky'], specs: ['mechanical', 'wireless', 'rgb'] },
  { name: 'MICE', priceRange: [15, 200], brands: ['Logitech', 'Razer', 'SteelSeries', 'Corsair', 'Glorious'], specs: ['dpi', 'wireless', 'rgb'] },

  // Clothing (20 categories)
  { name: 'MENS_SHIRTS', priceRange: [15, 150], brands: ['Ralph Lauren', 'Tommy Hilfiger', 'Calvin Klein', 'Brooks Brothers', 'J.Crew'], specs: ['fabric', 'fit', 'pattern'] },
  { name: 'MENS_JEANS', priceRange: [30, 250], brands: ['Levis', 'Wrangler', 'Diesel', 'AG', 'True Religion'], specs: ['fit', 'wash', 'stretch'] },
  { name: 'MENS_SUITS', priceRange: [150, 1500], brands: ['Hugo Boss', 'Armani', 'Brooks Brothers', 'J.Crew', 'Zegna'], specs: ['fabric', 'fit', 'season'] },
  { name: 'MENS_JACKETS', priceRange: [50, 800], brands: ['North Face', 'Patagonia', 'Columbia', 'Arc\'teryx', 'Canada Goose'], specs: ['insulation', 'waterproof', 'season'] },
  { name: 'WOMENS_DRESSES', priceRange: [25, 500], brands: ['Zara', 'H&M', 'Reformation', 'Free People', 'Anthropologie'], specs: ['fabric', 'length', 'occasion'] },
  { name: 'WOMENS_JEANS', priceRange: [30, 300], brands: ['Levis', 'AG', 'Citizens of Humanity', 'Madewell', '7 For All Mankind'], specs: ['fit', 'rise', 'stretch'] },
  { name: 'WOMENS_TOPS', priceRange: [15, 200], brands: ['Zara', 'Everlane', 'Madewell', 'J.Crew', 'Banana Republic'], specs: ['fabric', 'style', 'sleeve'] },
  { name: 'WOMENS_ACTIVEWEAR', priceRange: [20, 150], brands: ['Lululemon', 'Athleta', 'Nike', 'Adidas', 'Outdoor Voices'], specs: ['fabric', 'compression', 'moisture'] },
  { name: 'MENS_TSHIRTS', priceRange: [10, 100], brands: ['Nike', 'Adidas', 'Uniqlo', 'Everlane', 'Patagonia'], specs: ['fabric', 'fit', 'graphic'] },
  { name: 'MENS_SNEAKERS', priceRange: [40, 400], brands: ['Nike', 'Adidas', 'New Balance', 'Puma', 'Vans'], specs: ['cushioning', 'support', 'style'] },
  { name: 'WOMENS_HEELS', priceRange: [30, 600], brands: ['Steve Madden', 'Sam Edelman', 'Jimmy Choo', 'Christian Louboutin', 'Stuart Weitzman'], specs: ['height', 'comfort', 'occasion'] },
  { name: 'MENS_BOOTS', priceRange: [60, 500], brands: ['Red Wing', 'Dr. Martens', 'Timberland', 'Wolverine', 'Thursday'], specs: ['leather', 'waterproof', 'style'] },
  { name: 'WOMENS_BOOTS', priceRange: [50, 800], brands: ['UGG', 'Frye', 'Stuart Weitzman', 'Dr. Martens', 'Blundstone'], specs: ['height', 'material', 'season'] },
  { name: 'MENS_UNDERWEAR', priceRange: [10, 50], brands: ['Calvin Klein', 'Tommy John', 'Saxx', 'Hanes', 'Uniqlo'], specs: ['fabric', 'support', 'style'] },
  { name: 'WOMENS_UNDERWEAR', priceRange: [10, 80], brands: ['Victoria\'s Secret', 'Calvin Klein', 'ThirdLove', 'Aerie', 'Hanky Panky'], specs: ['fabric', 'coverage', 'support'] },
  { name: 'MENS_ACCESSORIES', priceRange: [15, 300], brands: ['Fossil', 'Michael Kors', 'Ray-Ban', 'Tumi', 'Herschel'], specs: ['material', 'style', 'function'] },
  { name: 'WOMENS_ACCESSORIES', priceRange: [15, 500], brands: ['Kate Spade', 'Michael Kors', 'Tory Burch', 'Coach', 'Fossil'], specs: ['material', 'style', 'season'] },
  { name: 'KIDS_CLOTHING', priceRange: [10, 100], brands: ['Gap', 'Old Navy', 'Carter\'s', 'H&M', 'Zara'], specs: ['age', 'season', 'durability'] },
  { name: 'KIDS_SHOES', priceRange: [20, 120], brands: ['Nike', 'Stride Rite', 'Skechers', 'Vans', 'Converse'], specs: ['support', 'durability', 'growth'] },
  { name: 'BABY_CLOTHES', priceRange: [8, 60], brands: ['Carter\'s', 'Gerber', 'Burt\'s Bees', 'Hanna Andersson', 'Primary'], specs: ['fabric', 'safety', 'ease'] },

  // Home & Furniture (15 categories)
  { name: 'SOFAS', priceRange: [300, 3000], brands: ['IKEA', 'West Elm', 'Article', 'Crate & Barrel', 'Pottery Barn'], specs: ['seating', 'fabric', 'style'] },
  { name: 'BEDS', priceRange: [200, 2500], brands: ['IKEA', 'Casper', 'Purple', 'Tuft & Needle', 'Saatva'], specs: ['size', 'material', 'storage'] },
  { name: 'MATTRESSES', priceRange: [200, 3000], brands: ['Casper', 'Purple', 'Tempur-Pedic', 'Saatva', 'Leesa'], specs: ['firmness', 'material', 'cooling'] },
  { name: 'DINING_TABLES', priceRange: [200, 2000], brands: ['IKEA', 'West Elm', 'CB2', 'Room & Board', 'Crate & Barrel'], specs: ['seating', 'material', 'shape'] },
  { name: 'OFFICE_CHAIRS', priceRange: [100, 1500], brands: ['Herman Miller', 'Steelcase', 'Secretlab', 'IKEA', 'Autonomous'], specs: ['ergonomic', 'material', 'adjustable'] },
  { name: 'DESKS', priceRange: [100, 1200], brands: ['IKEA', 'Uplift', 'Autonomous', 'Herman Miller', 'CB2'], specs: ['size', 'adjustable', 'storage'] },
  { name: 'LAMPS', priceRange: [20, 500], brands: ['Philips', 'IKEA', 'West Elm', 'CB2', 'Brightech'], specs: ['lumens', 'style', 'smart'] },
  { name: 'RUGS', priceRange: [50, 2000], brands: ['Ruggable', 'West Elm', 'Safavieh', 'nuLOOM', 'Pottery Barn'], specs: ['size', 'material', 'washable'] },
  { name: 'CURTAINS', priceRange: [20, 300], brands: ['IKEA', 'West Elm', 'Pottery Barn', 'Amazon Basics', 'Restoration Hardware'], specs: ['length', 'material', 'blackout'] },
  { name: 'BEDDING', priceRange: [30, 400], brands: ['Brooklinen', 'Parachute', 'Boll & Branch', 'Pottery Barn', 'IKEA'], specs: ['threadCount', 'material', 'season'] },
  { name: 'TOWELS', priceRange: [10, 150], brands: ['Parachute', 'Brooklinen', 'Pottery Barn', 'Target', 'Boll & Branch'], specs: ['absorbency', 'size', 'material'] },
  { name: 'KITCHEN_APPLIANCES', priceRange: [30, 800], brands: ['KitchenAid', 'Cuisinart', 'Breville', 'Ninja', 'Vitamix'], specs: ['power', 'capacity', 'functions'] },
  { name: 'COOKWARE', priceRange: [50, 600], brands: ['All-Clad', 'Lodge', 'Le Creuset', 'Calphalon', 'Cuisinart'], specs: ['material', 'pieces', 'ovenSafe'] },
  { name: 'DINNERWARE', priceRange: [30, 500], brands: ['Corelle', 'Pottery Barn', 'Williams Sonoma', 'CB2', 'Crate & Barrel'], specs: ['pieces', 'material', 'dishwasher'] },
  { name: 'STORAGE', priceRange: [15, 300], brands: ['IKEA', 'Container Store', 'Rubbermaid', 'Sterilite', 'SimpleHuman'], specs: ['capacity', 'material', 'stackable'] },

  // Sports & Outdoors (15 categories)
  { name: 'BICYCLES', priceRange: [200, 3000], brands: ['Trek', 'Specialized', 'Giant', 'Cannondale', 'Schwinn'], specs: ['gears', 'suspension', 'type'] },
  { name: 'TREADMILLS', priceRange: [300, 3000], brands: ['NordicTrack', 'Peloton', 'ProForm', 'Sole', 'Bowflex'], specs: ['motor', 'incline', 'programs'] },
  { name: 'DUMBBELLS', priceRange: [20, 500], brands: ['Bowflex', 'PowerBlock', 'CAP', 'Rogue', 'Titan'], specs: ['weight', 'adjustable', 'grip'] },
  { name: 'YOGA_MATS', priceRange: [15, 150], brands: ['Manduka', 'Liforme', 'Jade', 'Gaiam', 'Lululemon'], specs: ['thickness', 'grip', 'material'] },
  { name: 'TENTS', priceRange: [50, 600], brands: ['Coleman', 'REI', 'Big Agnes', 'MSR', 'Kelty'], specs: ['capacity', 'season', 'waterproof'] },
  { name: 'SLEEPING_BAGS', priceRange: [30, 400], brands: ['Coleman', 'Marmot', 'REI', 'The North Face', 'Kelty'], specs: ['temperature', 'insulation', 'weight'] },
  { name: 'BACKPACKS', priceRange: [30, 400], brands: ['Osprey', 'REI', 'Patagonia', 'The North Face', 'Deuter'], specs: ['capacity', 'hydration', 'ventilation'] },
  { name: 'HIKING_BOOTS', priceRange: [60, 400], brands: ['Salomon', 'Merrell', 'Keen', 'Columbia', 'Vasque'], specs: ['waterproof', 'support', 'traction'] },
  { name: 'FISHING_RODS', priceRange: [30, 500], brands: ['Ugly Stik', 'Shimano', 'Penn', 'Abu Garcia', 'Daiwa'], specs: ['length', 'action', 'power'] },
  { name: 'GOLF_CLUBS', priceRange: [200, 2000], brands: ['Callaway', 'TaylorMade', 'Titleist', 'Ping', 'Cobra'], specs: ['loft', 'shaft', 'clubType'] },
  { name: 'TENNIS_RACKETS', priceRange: [50, 400], brands: ['Wilson', 'Head', 'Babolat', 'Yonex', 'Prince'], specs: ['headSize', 'weight', 'balance'] },
  { name: 'BASKETBALL_SHOES', priceRange: [60, 250], brands: ['Nike', 'Adidas', 'Under Armour', 'Jordan', 'Puma'], specs: ['cushioning', 'traction', 'support'] },
  { name: 'SOCCER_CLEATS', priceRange: [40, 300], brands: ['Nike', 'Adidas', 'Puma', 'New Balance', 'Mizuno'], specs: ['studs', 'fit', 'material'] },
  { name: 'SWIMMING_GOGGLES', priceRange: [10, 80], brands: ['Speedo', 'TYR', 'Aqua Sphere', 'Arena', 'Zoggs'], specs: ['antiLeak', 'antiFog', 'fit'] },
  { name: 'COOLERS', priceRange: [30, 400], brands: ['Yeti', 'Coleman', 'Igloo', 'Orca', 'Pelican'], specs: ['capacity', 'insulation', 'durability'] },

  // Beauty & Personal Care (10 categories)
  { name: 'SKINCARE', priceRange: [10, 200], brands: ['CeraVe', 'Neutrogena', 'La Roche-Posay', 'The Ordinary', 'Clinique'], specs: ['skinType', 'spf', 'ingredients'] },
  { name: 'MAKEUP', priceRange: [8, 150], brands: ['MAC', 'Urban Decay', 'NARS', 'Maybelline', 'Fenty Beauty'], specs: ['shade', 'finish', 'longWear'] },
  { name: 'HAIRCARE', priceRange: [8, 100], brands: ['Olaplex', 'Redken', 'Moroccanoil', 'Living Proof', 'Briogeo'], specs: ['hairType', 'sulfateFree', 'purpose'] },
  { name: 'FRAGRANCES', priceRange: [30, 300], brands: ['Chanel', 'Dior', 'Tom Ford', 'Jo Malone', 'Versace'], specs: ['notes', 'concentration', 'season'] },
  { name: 'HAIR_DRYERS', priceRange: [20, 400], brands: ['Dyson', 'T3', 'BaByliss', 'Revlon', 'Conair'], specs: ['wattage', 'ionic', 'attachments'] },
  { name: 'HAIR_STRAIGHTENERS', priceRange: [25, 300], brands: ['GHD', 'CHI', 'BaByliss', 'Remington', 'HSI'], specs: ['temperature', 'plates', 'ionic'] },
  { name: 'ELECTRIC_SHAVERS', priceRange: [30, 400], brands: ['Philips', 'Braun', 'Panasonic', 'Remington', 'Wahl'], specs: ['heads', 'battery', 'waterproof'] },
  { name: 'NAIL_POLISH', priceRange: [5, 50], brands: ['OPI', 'Essie', 'Sally Hansen', 'China Glaze', 'Deborah Lippmann'], specs: ['finish', 'chipResistant', 'vegan'] },
  { name: 'BATH_PRODUCTS', priceRange: [8, 80], brands: ['Lush', 'The Body Shop', 'Bath & Body Works', 'Dr. Teal\'s', 'Herbivore'], specs: ['scent', 'organic', 'purpose'] },
  { name: 'DENTAL_CARE', priceRange: [10, 250], brands: ['Oral-B', 'Sonicare', 'Waterpik', 'Quip', 'Burst'], specs: ['modes', 'battery', 'timer'] },

  // Toys & Games (10 categories)
  { name: 'BOARD_GAMES', priceRange: [15, 100], brands: ['Hasbro', 'Mattel', 'Ravensburger', 'Asmodee', 'CMON'], specs: ['players', 'duration', 'age'] },
  { name: 'LEGO_SETS', priceRange: [20, 500], brands: ['LEGO'], specs: ['pieces', 'theme', 'age'] },
  { name: 'ACTION_FIGURES', priceRange: [10, 200], brands: ['Hasbro', 'Mattel', 'Funko', 'McFarlane', 'NECA'], specs: ['height', 'articulation', 'franchise'] },
  { name: 'DOLLS', priceRange: [15, 150], brands: ['Barbie', 'American Girl', 'LOL Surprise', 'Disney', 'Monster High'], specs: ['height', 'accessories', 'age'] },
  { name: 'RC_TOYS', priceRange: [30, 500], brands: ['Traxxas', 'Holy Stone', 'LEGO', 'Air Hogs', 'Syma'], specs: ['range', 'battery', 'speed'] },
  { name: 'PUZZLES', priceRange: [10, 80], brands: ['Ravensburger', 'Buffalo Games', 'Springbok', 'Ceaco', 'White Mountain'], specs: ['pieces', 'size', 'difficulty'] },
  { name: 'STUFFED_ANIMALS', priceRange: [8, 100], brands: ['Jellycat', 'Ty', 'GUND', 'Melissa & Doug', 'Steiff'], specs: ['size', 'material', 'washable'] },
  { name: 'EDUCATIONAL_TOYS', priceRange: [15, 150], brands: ['LeapFrog', 'VTech', 'Melissa & Doug', 'Learning Resources', 'Fat Brain'], specs: ['age', 'skill', 'interactive'] },
  { name: 'OUTDOOR_TOYS', priceRange: [20, 300], brands: ['Little Tikes', 'Step2', 'Radio Flyer', 'Razor', 'Nerf'], specs: ['age', 'assembly', 'weather'] },
  { name: 'CRAFT_KITS', priceRange: [10, 80], brands: ['Crayola', 'Melissa & Doug', 'Alex', 'KiwiCo', 'Creativity for Kids'], specs: ['age', 'skill', 'pieces'] },

  // Books & Media (5 categories)
  { name: 'FICTION_BOOKS', priceRange: [10, 30], brands: ['Penguin', 'HarperCollins', 'Simon & Schuster', 'Random House', 'Macmillan'], specs: ['genre', 'pages', 'format'] },
  { name: 'NONFICTION_BOOKS', priceRange: [12, 40], brands: ['Penguin', 'HarperCollins', 'Simon & Schuster', 'Oxford', 'Cambridge'], specs: ['topic', 'pages', 'edition'] },
  { name: 'CHILDRENS_BOOKS', priceRange: [5, 25], brands: ['Scholastic', 'Disney', 'Penguin', 'HarperCollins', 'Random House'], specs: ['age', 'pages', 'illustrated'] },
  { name: 'VINYL_RECORDS', priceRange: [15, 200], brands: ['Universal', 'Sony', 'Warner', 'Blue Note', 'Rhino'], specs: ['genre', 'condition', 'pressing'] },
  { name: 'MOVIES', priceRange: [5, 40], brands: ['Universal', 'Warner Bros', 'Disney', 'Sony', 'Paramount'], specs: ['format', 'genre', 'year'] },

  // Pet Supplies (5 categories)
  { name: 'DOG_FOOD', priceRange: [20, 100], brands: ['Blue Buffalo', 'Hill\'s Science', 'Royal Canin', 'Purina', 'Wellness'], specs: ['protein', 'age', 'size'] },
  { name: 'CAT_FOOD', priceRange: [15, 80], brands: ['Blue Buffalo', 'Hill\'s Science', 'Royal Canin', 'Purina', 'Fancy Feast'], specs: ['protein', 'age', 'wet'] },
  { name: 'DOG_TOYS', priceRange: [5, 50], brands: ['Kong', 'Nylabone', 'Chuckit', 'ZippyPaws', 'Benebone'], specs: ['durability', 'size', 'interactive'] },
  { name: 'CAT_TOYS', priceRange: [3, 40], brands: ['Kong', 'Yeowww', 'SmartyKat', 'Petlinks', 'Bergan'], specs: ['interactive', 'catnip', 'material'] },
  { name: 'PET_BEDS', priceRange: [20, 200], brands: ['PetFusion', 'Best Friends', 'FurHaven', 'K&H', 'Orvis'], specs: ['size', 'orthopedic', 'washable'] },
]

// Product name templates by category type
const PRODUCT_TEMPLATES: Record<string, string[]> = {
  LAPTOPS: ['MacBook Pro', 'XPS 15', 'ThinkPad X1', 'Pavilion', 'ZenBook'],
  SMARTPHONES: ['iPhone 15', 'Galaxy S24', 'Pixel 8', 'OnePlus 12', 'Redmi Note'],
  default: ['Premium', 'Classic', 'Pro', 'Elite', 'Essential']
}

// Condition distribution
const CONDITIONS = [
  { value: 'New', weight: 40 },
  { value: 'Like New', weight: 25 },
  { value: 'Excellent', weight: 15 },
  { value: 'Very Good', weight: 10 },
  { value: 'Good', weight: 10 }
]

// Generate a weighted random selection
function weightedRandom<T>(items: Array<{ value: T; weight: number }>): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * total

  for (const item of items) {
    random -= item.weight
    if (random <= 0) return item.value
  }

  return items[0].value
}

// Generate realistic price with discount
function generatePrice(min: number, max: number) {
  const price = Math.round(min + Math.random() * (max - min))
  const hasDiscount = Math.random() > 0.6
  const originalPrice = hasDiscount ? Math.round(price * (1 + Math.random() * 0.5)) : price

  return { price, originalPrice }
}

// Generate product description
function generateDescription(category: string, brand: string, model: string): string {
  const templates = [
    `Premium ${category.toLowerCase().replace(/_/g, ' ')} from ${brand}. ${model} model with excellent features.`,
    `High-quality ${brand} ${model}. Perfect condition, great value for ${category.toLowerCase().replace(/_/g, ' ')}.`,
    `${brand} ${model} - authentic and reliable. Great for everyday use.`,
    `Excellent ${category.toLowerCase().replace(/_/g, ' ')} by ${brand}. ${model} edition with modern features.`
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}

// Generate dynamic specs based on category
function generateDynamicSpecs(category: typeof CATEGORIES[0]): any {
  if (!category.specs) return null

  const specs: any = {}
  category.specs.forEach(spec => {
    switch (spec) {
      case 'processor':
        specs.processor = ['Intel i5', 'Intel i7', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M2'][Math.floor(Math.random() * 5)]
        break
      case 'ram':
        specs.ram = [8, 16, 32, 64][Math.floor(Math.random() * 4)] + 'GB'
        break
      case 'storage':
        specs.storage = [256, 512, 1024, 2048][Math.floor(Math.random() * 4)] + 'GB'
        break
      case 'screen':
        specs.screenSize = [13, 14, 15, 16, 17][Math.floor(Math.random() * 5)] + ' inches'
        break
      case 'battery':
        specs.batteryLife = Math.floor(6 + Math.random() * 18) + ' hours'
        break
      case 'camera':
        specs.cameraMP = [12, 48, 64, 108][Math.floor(Math.random() * 4)] + 'MP'
        break
      // Add more specs as needed
      default:
        specs[spec] = ['Standard', 'Premium', 'Advanced'][Math.floor(Math.random() * 3)]
    }
  })

  return specs
}

async function generateProducts() {
  console.log('🚀 Starting product generation: 100 categories × 20 products = 2000 products')

  let totalCreated = 0
  let categoryCount = 0

  for (const category of CATEGORIES) {
    categoryCount++
    console.log(`\n📦 Category ${categoryCount}/100: ${category.name}`)

    const products = []

    for (let i = 0; i < 20; i++) {
      const brand = category.brands[Math.floor(Math.random() * category.brands.length)]
      const templates = PRODUCT_TEMPLATES[category.name] || PRODUCT_TEMPLATES.default
      const model = templates[Math.floor(Math.random() * templates.length)]
      const { price, originalPrice } = generatePrice(category.priceRange[0], category.priceRange[1])
      const condition = weightedRandom(CONDITIONS)

      products.push({
        name: `${brand} ${model}`,
        category: category.name,
        brand: brand,
        price: price,
        originalPrice: originalPrice,
        condition: condition,
        description: generateDescription(category.name, brand, model),
        imageUrl: `/images/products/${category.name.toLowerCase()}-${i + 1}.jpg`,
        isAvailable: Math.random() > 0.05, // 95% available
        stockQuantity: Math.floor(1 + Math.random() * 50),
        dynamicSpecs: generateDynamicSpecs(category),
        hasFreeShipping: Math.random() > 0.5,
        hasFreeReturns: Math.random() > 0.6,
        estimatedDeliveryDays: Math.floor(2 + Math.random() * 5)
      })
    }

    // Batch insert for performance
    await prisma.product.createMany({
      data: products,
      skipDuplicates: true
    })

    totalCreated += products.length
    console.log(`   ✓ Created 20 products (Total: ${totalCreated}/2000)`)
  }

  console.log(`\n✅ Successfully created ${totalCreated} products across ${categoryCount} categories!`)
}

async function main() {
  try {
    // Clear existing data in correct order (respect foreign keys)
    console.log('🧹 Clearing existing data...')
    await prisma.review.deleteMany({})
    await prisma.cartItem.deleteMany({})
    await prisma.orderItem.deleteMany({})
    await prisma.swipeAction.deleteMany({})
    await prisma.productView.deleteMany({})
    await prisma.productAnalytics.deleteMany({})
    await prisma.productAISummary.deleteMany({})
    await prisma.productComparison.deleteMany({})
    await prisma.productEmbedding.deleteMany({})
    await prisma.product.deleteMany({})
    console.log('✓ Database cleared\n')

    await generateProducts()

    console.log('\n📊 Database Statistics:')
    const stats = await prisma.product.groupBy({
      by: ['category'],
      _count: true
    })

    console.log(`Total Categories: ${stats.length}`)
    console.log(`Total Products: ${await prisma.product.count()}`)
    console.log(`Average per Category: ${Math.round((await prisma.product.count()) / stats.length)}`)

  } catch (error) {
    console.error('❌ Error generating products:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()

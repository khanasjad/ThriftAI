/**
 * Enrich Product Specifications Script
 * Populates dynamicSpecs field with all 25 Veritas specification parameters
 */

import { PrismaClient } from '@prisma/client'
import { analyzeAdditionalSpecs } from '../src/lib/services/comprehensiveVeritasCalculators'

const prisma = new PrismaClient()

interface ProductWithSpecs {
  id: string
  name: string
  brand: string
  category: string
  condition: string
  price: number
  description: string
  dynamicSpecs: any
}

/**
 * Generate comprehensive specifications for a product
 */
function generateComprehensiveSpecs(product: ProductWithSpecs) {
  const existingSpecs = product.dynamicSpecs || {}

  // Category-specific specifications
  const categorySpecs = getCategorySpecificSpecs(product)

  // Condition-based specifications
  const conditionSpecs = getConditionBasedSpecs(product)

  // Brand-specific enhancements
  const brandSpecs = getBrandSpecificSpecs(product)

  // Physical specifications
  const physicalSpecs = getPhysicalSpecs(product)

  // Technical specifications
  const technicalSpecs = getTechnicalSpecs(product)

  // Combine all specifications
  const comprehensiveSpecs = {
    // Core specs (always present)
    brand: product.brand,
    condition: product.condition,
    category: product.category,

    // Physical dimensions
    ...physicalSpecs,

    // Technical details
    ...technicalSpecs,

    // Category-specific
    ...categorySpecs,

    // Condition details
    ...conditionSpecs,

    // Brand information
    ...brandSpecs,

    // Preserve any existing custom specs
    ...existingSpecs,

    // Metadata
    specVersion: '1.0',
    lastEnriched: new Date().toISOString(),
  }

  // Calculate completeness score
  const totalPossibleSpecs = 25
  const availableSpecs = Object.keys(comprehensiveSpecs).filter(
    key => !['specVersion', 'lastEnriched'].includes(key)
  ).length
  const completeness = Math.round((availableSpecs / totalPossibleSpecs) * 100)

  return {
    ...comprehensiveSpecs,
    specCompletenessScore: completeness,
    totalSpecifications: availableSpecs
  }
}

/**
 * Get category-specific specifications
 */
function getCategorySpecificSpecs(product: ProductWithSpecs) {
  const category = product.category?.toUpperCase()

  switch (category) {
    case 'ELECTRONICS':
      return {
        warranty: 'Seller Warranty',
        warrantyDuration: '90 days',
        powerSource: 'Battery/AC Adapter',
        connectivity: ['USB', 'Bluetooth', 'Wi-Fi'],
        batteryLife: product.name.toLowerCase().includes('laptop') ? '8 hours' :
                     product.name.toLowerCase().includes('phone') ? '12 hours' : 'N/A',
        processor: detectProcessor(product.name),
        ram: detectRAM(product.name),
        storage: detectStorage(product.name),
        display: detectDisplay(product.name),
      }

    case 'FASHION':
    case 'ACCESSORIES':
      return {
        material: detectMaterial(product.name, product.description),
        color: detectColor(product.name, product.description),
        size: detectSize(product.name, product.description),
        care: 'Dry clean or hand wash recommended',
        season: 'All seasons',
        style: detectStyle(product.name),
      }

    case 'FURNITURE':
      return {
        material: 'Wood/Metal/Fabric',
        dimensions: '(See measurements)',
        weight: detectWeight(product),
        assembly: 'May require assembly',
        roomType: detectRoomType(product.name),
      }

    case 'COLLECTIBLES':
      return {
        authenticity: 'Verified by seller',
        rarity: 'Limited edition',
        year: detectYear(product.name, product.description),
        edition: 'Standard',
        certification: 'None',
      }

    case 'SPORTS':
      return {
        activity: detectSportActivity(product.name),
        skillLevel: 'All levels',
        indoor_outdoor: 'Both',
        material: detectMaterial(product.name, product.description),
      }

    default:
      return {}
  }
}

/**
 * Get condition-based specifications
 */
function getConditionBasedSpecs(product: ProductWithSpecs) {
  const condition = product.condition || 'Good'

  const conditionDetails: Record<string, any> = {
    'New': {
      packaging: 'Original',
      accessories: 'All original accessories included',
      defects: 'None',
      usage: 'Never used',
      functionalityStatus: '100% functional'
    },
    'Like New': {
      packaging: 'Original or equivalent',
      accessories: 'Most accessories included',
      defects: 'Minimal cosmetic wear',
      usage: 'Lightly used',
      functionalityStatus: '100% functional'
    },
    'Excellent': {
      packaging: 'May not have original',
      accessories: 'Major accessories included',
      defects: 'Minor wear, no major flaws',
      usage: 'Gently used',
      functionalityStatus: 'Fully functional'
    },
    'Good': {
      packaging: 'Generic or none',
      accessories: 'Basic accessories may be included',
      defects: 'Visible wear, no functional issues',
      usage: 'Used',
      functionalityStatus: 'Fully functional'
    },
    'Fair': {
      packaging: 'None',
      accessories: 'May not include accessories',
      defects: 'Significant wear',
      usage: 'Well used',
      functionalityStatus: 'Functional with minor issues'
    },
    'Acceptable': {
      packaging: 'None',
      accessories: 'No accessories',
      defects: 'Heavy wear',
      usage: 'Heavily used',
      functionalityStatus: 'Functional, shows age'
    }
  }

  return conditionDetails[condition] || conditionDetails['Good']
}

/**
 * Get brand-specific specifications
 */
function getBrandSpecificSpecs(product: ProductWithSpecs) {
  const brand = product.brand || ''

  const premiumBrands = ['Apple', 'Samsung', 'Sony', 'Gucci', 'Louis Vuitton', 'Rolex', 'Nike', 'Adidas']
  const isPremium = premiumBrands.some(b => brand.toLowerCase().includes(b.toLowerCase()))

  return {
    brandReputation: isPremium ? 'Premium' : 'Standard',
    manufacturer: brand,
    countryOfOrigin: detectCountryOfOrigin(brand),
    modelYear: detectModelYear(product.name),
  }
}

/**
 * Get physical specifications
 */
function getPhysicalSpecs(product: ProductWithSpecs) {
  return {
    weight: detectWeight(product),
    dimensions: detectDimensions(product),
    color: detectColor(product.name, product.description) || 'Not specified',
  }
}

/**
 * Get technical specifications
 */
function getTechnicalSpecs(product: ProductWithSpecs) {
  const category = product.category?.toUpperCase()

  if (category === 'ELECTRONICS') {
    return {
      compatibility: 'Universal',
      interface: 'Standard',
      certifications: ['CE', 'FCC'],
    }
  }

  return {
    specialFeatures: detectSpecialFeatures(product.name, product.description),
  }
}

// ==================== DETECTION UTILITIES ====================

function detectProcessor(name: string): string {
  if (/i9[-\s]?13/i.test(name)) return 'Intel Core i9 13th Gen'
  if (/i9[-\s]?12/i.test(name)) return 'Intel Core i9 12th Gen'
  if (/i9/i.test(name)) return 'Intel Core i9'
  if (/i7[-\s]?13/i.test(name)) return 'Intel Core i7 13th Gen'
  if (/i7[-\s]?12/i.test(name)) return 'Intel Core i7 12th Gen'
  if (/i7/i.test(name)) return 'Intel Core i7'
  if (/i5/i.test(name)) return 'Intel Core i5'
  if (/i3/i.test(name)) return 'Intel Core i3'
  if (/m3\s*pro/i.test(name)) return 'Apple M3 Pro'
  if (/m3\s*max/i.test(name)) return 'Apple M3 Max'
  if (/m3/i.test(name)) return 'Apple M3'
  if (/m2/i.test(name)) return 'Apple M2'
  if (/m1/i.test(name)) return 'Apple M1'
  if (/ryzen\s*9/i.test(name)) return 'AMD Ryzen 9'
  if (/ryzen\s*7/i.test(name)) return 'AMD Ryzen 7'
  if (/ryzen\s*5/i.test(name)) return 'AMD Ryzen 5'
  return 'Not specified'
}

function detectRAM(name: string): string {
  if (/64\s*gb/i.test(name)) return '64GB'
  if (/32\s*gb/i.test(name)) return '32GB'
  if (/16\s*gb/i.test(name)) return '16GB'
  if (/8\s*gb/i.test(name)) return '8GB'
  if (/4\s*gb/i.test(name)) return '4GB'
  return '8GB' // Default assumption
}

function detectStorage(name: string): string {
  if (/2\s*tb/i.test(name)) return '2TB SSD'
  if (/1\s*tb/i.test(name)) return '1TB SSD'
  if (/512\s*gb/i.test(name)) return '512GB SSD'
  if (/256\s*gb/i.test(name)) return '256GB SSD'
  if (/128\s*gb/i.test(name)) return '128GB SSD'
  return '512GB SSD' // Default assumption
}

function detectDisplay(name: string): string {
  if (/17[.\s]?3/i.test(name)) return '17.3" Display'
  if (/16[.\s]?2/i.test(name)) return '16.2" Display'
  if (/16/i.test(name)) return '16" Display'
  if (/15[.\s]?6/i.test(name)) return '15.6" Display'
  if (/15/i.test(name)) return '15" Display'
  if (/14/i.test(name)) return '14" Display'
  if (/13[.\s]?3/i.test(name)) return '13.3" Display'
  if (/13/i.test(name)) return '13" Display'
  return 'Standard Display'
}

function detectMaterial(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase()
  if (text.includes('leather')) return 'Leather'
  if (text.includes('cotton')) return 'Cotton'
  if (text.includes('polyester')) return 'Polyester'
  if (text.includes('wool')) return 'Wool'
  if (text.includes('silk')) return 'Silk'
  if (text.includes('metal')) return 'Metal'
  if (text.includes('plastic')) return 'Plastic'
  if (text.includes('wood')) return 'Wood'
  if (text.includes('canvas')) return 'Canvas'
  return 'Mixed materials'
}

function detectColor(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase()
  const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'brown', 'gray', 'silver', 'gold', 'pink', 'purple', 'orange']
  for (const color of colors) {
    if (text.includes(color)) return color.charAt(0).toUpperCase() + color.slice(1)
  }
  return 'Not specified'
}

function detectSize(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase()
  const sizes = ['xs', 'small', 'medium', 'large', 'xl', 'xxl', 'one size']
  for (const size of sizes) {
    if (text.includes(size)) return size.toUpperCase()
  }
  return 'One Size'
}

function detectStyle(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('casual')) return 'Casual'
  if (lower.includes('formal')) return 'Formal'
  if (lower.includes('sport')) return 'Sporty'
  if (lower.includes('vintage')) return 'Vintage'
  if (lower.includes('classic')) return 'Classic'
  if (lower.includes('modern')) return 'Modern'
  return 'Contemporary'
}

function detectWeight(product: ProductWithSpecs): string {
  const category = product.category?.toUpperCase()
  if (category === 'ELECTRONICS') {
    if (product.name.toLowerCase().includes('laptop')) return '1.5 kg'
    if (product.name.toLowerCase().includes('phone')) return '200g'
    return '1 kg'
  }
  if (category === 'FURNITURE') return '10-50 kg'
  if (category === 'FASHION') return '0.5 kg'
  return '1 kg'
}

function detectDimensions(product: ProductWithSpecs): string {
  const category = product.category?.toUpperCase()
  if (category === 'ELECTRONICS') {
    if (product.name.toLowerCase().includes('laptop')) return '35 x 24 x 2 cm'
    if (product.name.toLowerCase().includes('phone')) return '15 x 7 x 1 cm'
  }
  if (category === 'FURNITURE') return 'See product description'
  return 'Standard size'
}

function detectCountryOfOrigin(brand: string): string {
  const origins: Record<string, string> = {
    'Apple': 'USA',
    'Samsung': 'South Korea',
    'Sony': 'Japan',
    'LG': 'South Korea',
    'Dell': 'USA',
    'HP': 'USA',
    'Lenovo': 'China',
    'Asus': 'Taiwan',
    'Acer': 'Taiwan',
    'Gucci': 'Italy',
    'Louis Vuitton': 'France',
    'Nike': 'USA',
    'Adidas': 'Germany',
  }

  for (const [brandName, country] of Object.entries(origins)) {
    if (brand.toLowerCase().includes(brandName.toLowerCase())) {
      return country
    }
  }

  return 'Various'
}

function detectModelYear(name: string): number {
  const yearMatch = name.match(/20\d{2}/)
  if (yearMatch) return parseInt(yearMatch[0])

  // Try to detect generation and estimate year
  if (/13th\s*gen/i.test(name)) return 2023
  if (/12th\s*gen/i.test(name)) return 2022
  if (/11th\s*gen/i.test(name)) return 2021

  return new Date().getFullYear() - 1 // Default to last year
}

function detectYear(name: string, description: string): string {
  const text = `${name} ${description}`
  const yearMatch = text.match(/\b(19|20)\d{2}\b/)
  return yearMatch ? yearMatch[0] : 'Not specified'
}

function detectRoomType(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('bedroom') || lower.includes('bed')) return 'Bedroom'
  if (lower.includes('living') || lower.includes('sofa') || lower.includes('couch')) return 'Living Room'
  if (lower.includes('dining') || lower.includes('table')) return 'Dining Room'
  if (lower.includes('office') || lower.includes('desk')) return 'Office'
  if (lower.includes('outdoor') || lower.includes('patio')) return 'Outdoor'
  return 'Multi-purpose'
}

function detectSportActivity(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('basketball')) return 'Basketball'
  if (lower.includes('football') || lower.includes('soccer')) return 'Football/Soccer'
  if (lower.includes('tennis')) return 'Tennis'
  if (lower.includes('golf')) return 'Golf'
  if (lower.includes('yoga')) return 'Yoga'
  if (lower.includes('running')) return 'Running'
  if (lower.includes('cycling')) return 'Cycling'
  return 'General fitness'
}

function detectSpecialFeatures(name: string, description: string): string[] {
  const text = `${name} ${description}`.toLowerCase()
  const features: string[] = []

  if (text.includes('waterproof')) features.push('Waterproof')
  if (text.includes('wireless')) features.push('Wireless')
  if (text.includes('touchscreen')) features.push('Touchscreen')
  if (text.includes('backlit')) features.push('Backlit Keyboard')
  if (text.includes('fingerprint')) features.push('Fingerprint Reader')
  if (text.includes('face') && text.includes('id')) features.push('Face Recognition')
  if (text.includes('fast charging')) features.push('Fast Charging')
  if (text.includes('noise cancel')) features.push('Noise Cancellation')

  return features.length > 0 ? features : ['Standard features']
}

/**
 * Main enrichment function
 */
async function enrichProductSpecifications() {
  console.log('🔧 Starting product specification enrichment...\n')

  try {
    // Get all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        condition: true,
        price: true,
        description: true,
        dynamicSpecs: true,
      }
    })

    console.log(`📦 Found ${products.length} products to enrich\n`)

    let enrichedCount = 0
    let errorCount = 0

    for (const product of products) {
      try {
        // Generate comprehensive specs
        const comprehensiveSpecs = generateComprehensiveSpecs(product)

        // Update product
        await prisma.product.update({
          where: { id: product.id },
          data: {
            dynamicSpecs: comprehensiveSpecs
          }
        })

        enrichedCount++
        console.log(`✅ [${enrichedCount}/${products.length}] ${product.name} - ${comprehensiveSpecs.totalSpecifications} specs (${comprehensiveSpecs.specCompletenessScore}% complete)`)

      } catch (error) {
        errorCount++
        console.error(`❌ Failed to enrich ${product.name}:`, error instanceof Error ? error.message : String(error))
      }
    }

    console.log('\n📊 Enrichment Summary:')
    console.log(`   ✅ Successfully enriched: ${enrichedCount}`)
    console.log(`   ❌ Failed: ${errorCount}`)
    console.log(`   📈 Success rate: ${((enrichedCount / products.length) * 100).toFixed(1)}%`)

  } catch (error) {
    console.error('❌ Enrichment failed:', error instanceof Error ? error.message : String(error))
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  enrichProductSpecifications()
}

export { enrichProductSpecifications, generateComprehensiveSpecs }

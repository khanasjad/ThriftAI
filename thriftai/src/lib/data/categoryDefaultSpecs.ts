/**
 * Category-Specific Default Specifications
 *
 * Provides intelligent defaults for the 25 dynamic product-specific parameters
 * when actual data is missing. These defaults ensure realistic Veritas Scores
 * even for products with sparse specification data.
 *
 * Categories covered:
 * - ELECTRONICS (10 params)
 * - CLOTHING (4 params)
 * - SHOES (4 params)
 * - HOME (4 params)
 * - SPORTS (2 params)
 * - ACCESSORIES (1 param)
 */

import {
  ElectronicsSpecs,
  ClothingSpecs,
  ShoesSpecs,
  HomeKitchenSpecs,
  SportsSpecs
} from '@/lib/types/aiScoring96'

// ========================================
// ELECTRONICS DEFAULTS
// ========================================

export const ELECTRONICS_DEFAULTS: Record<string, Partial<ElectronicsSpecs>> = {
  // Generic Electronics (fallback)
  'ELECTRONICS': {
    cpu: 'Standard Processor',
    cpuBenchmark: 10000,
    ram: 4,
    storage: '128GB',
    screenSize: 6,
    screenResolution: '1920x1080',
    batteryCapacity: 3000,
    batteryLife: 8,
    connectivity: ['WiFi', 'Bluetooth'],
    os: 'Various',
    gpu: 'Integrated'
  },

  // Laptops
  'LAPTOP': {
    cpu: 'Intel Core i5 / AMD Ryzen 5',
    cpuBenchmark: 12000,
    ram: 8,
    storage: '256GB SSD',
    screenSize: 14,
    screenResolution: '1920x1080',
    batteryCapacity: 50,
    batteryLife: 8,
    connectivity: ['WiFi 6', 'Bluetooth 5.0', 'USB-C'],
    os: 'Windows 11 / macOS',
    gpu: 'Integrated Graphics'
  },

  // Smartphones
  'PHONE': {
    cpu: 'Snapdragon 778G / A15 Bionic',
    cpuBenchmark: 550000,
    ram: 6,
    storage: '128GB',
    screenSize: 6.4,
    screenResolution: '2400x1080',
    batteryCapacity: 4500,
    batteryLife: 12,
    camera: '48MP main + 8MP ultra-wide',
    connectivity: ['5G', 'WiFi 6', 'Bluetooth 5.2', 'NFC'],
    os: 'Android 13 / iOS 16',
    waterproofRating: 'IP68'
  },

  // Tablets
  'TABLET': {
    cpu: 'Snapdragon 870 / M1',
    cpuBenchmark: 600000,
    ram: 4,
    storage: '64GB',
    screenSize: 10.5,
    screenResolution: '2000x1200',
    batteryCapacity: 7000,
    batteryLife: 10,
    camera: '12MP rear + 8MP front',
    connectivity: ['WiFi 6', 'Bluetooth 5.0'],
    os: 'Android / iPadOS'
  },

  // TVs
  'TV': {
    screenSize: 55,
    screenResolution: '3840x2160',
    connectivity: ['WiFi', 'Bluetooth', 'HDMI 2.1', 'USB'],
    os: 'Android TV / webOS / Tizen'
  },

  // Headphones
  'HEADPHONES': {
    batteryLife: 20,
    connectivity: ['Bluetooth 5.0', 'AUX 3.5mm'],
    waterproofRating: 'IPX4'
  },

  // Smartwatch
  'SMARTWATCH': {
    screenSize: 1.4,
    screenResolution: '454x454',
    batteryCapacity: 300,
    batteryLife: 2,
    connectivity: ['Bluetooth 5.0', 'WiFi', 'NFC'],
    waterproofRating: 'IP68',
    os: 'WearOS / watchOS'
  },

  // Gaming Console
  'GAMING_CONSOLE': {
    storage: '512GB SSD',
    connectivity: ['WiFi 6', 'Bluetooth 5.1', 'HDMI 2.1', 'USB-C'],
    gpu: 'Custom RDNA 2 / Custom GPU'
  },

  // Camera
  'CAMERA': {
    camera: '24MP sensor',
    storage: '0GB (SD Card)',
    screenSize: 3,
    screenResolution: '1040x690',
    batteryLife: 4,
    connectivity: ['WiFi', 'Bluetooth', 'USB-C'],
    waterproofRating: 'IPX0'
  }
}

// ========================================
// CLOTHING DEFAULTS
// ========================================

export const CLOTHING_DEFAULTS: Record<string, Partial<ClothingSpecs>> = {
  // Generic Clothing (fallback)
  'CLOTHING': {
    fabricMaterial: '60% Cotton, 40% Polyester',
    fabricComposition: { cotton: 60, polyester: 40 },
    sizeAccuracy: 4,
    careInstructions: 'Machine wash cold',
    colorFastness: 4
  },

  'T_SHIRT': {
    fabricMaterial: '100% Cotton',
    fabricComposition: { cotton: 100 },
    sizeAccuracy: 4,
    careInstructions: 'Machine wash cold, tumble dry low',
    colorFastness: 4
  },

  'SHIRT': {
    fabricMaterial: '60% Cotton, 40% Polyester',
    fabricComposition: { cotton: 60, polyester: 40 },
    sizeAccuracy: 4,
    careInstructions: 'Machine wash warm, iron if needed',
    colorFastness: 4
  },

  'JEANS': {
    fabricMaterial: '98% Cotton, 2% Elastane',
    fabricComposition: { cotton: 98, elastane: 2 },
    sizeAccuracy: 4,
    careInstructions: 'Machine wash cold, hang dry',
    colorFastness: 5
  },

  'DRESS': {
    fabricMaterial: '95% Polyester, 5% Spandex',
    fabricComposition: { polyester: 95, spandex: 5 },
    sizeAccuracy: 3,
    careInstructions: 'Hand wash cold, hang dry',
    colorFastness: 4
  },

  'JACKET': {
    fabricMaterial: '100% Polyester with fleece lining',
    fabricComposition: { polyester: 100 },
    sizeAccuracy: 4,
    careInstructions: 'Machine wash cold, tumble dry low',
    colorFastness: 4
  },

  'SWEATER': {
    fabricMaterial: '80% Acrylic, 20% Wool',
    fabricComposition: { acrylic: 80, wool: 20 },
    sizeAccuracy: 3,
    careInstructions: 'Hand wash cold, lay flat to dry',
    colorFastness: 3
  },

  'SHORTS': {
    fabricMaterial: '100% Cotton',
    fabricComposition: { cotton: 100 },
    sizeAccuracy: 4,
    careInstructions: 'Machine wash warm, tumble dry',
    colorFastness: 4
  },

  'ACTIVEWEAR': {
    fabricMaterial: '88% Polyester, 12% Spandex',
    fabricComposition: { polyester: 88, spandex: 12 },
    sizeAccuracy: 4,
    careInstructions: 'Machine wash cold, hang dry',
    colorFastness: 5
  }
}

// ========================================
// SHOES DEFAULTS
// ========================================

export const SHOES_DEFAULTS: Record<string, Partial<ShoesSpecs>> = {
  // Generic Shoes (fallback)
  'SHOES': {
    soleMaterial: 'Rubber',
    soleGripRating: 4,
    cushioningTechnology: 'Standard insole',
    weight: 300,
    breathability: 3
  },

  'SNEAKERS': {
    soleMaterial: 'Rubber',
    soleGripRating: 4,
    cushioningTechnology: 'EVA foam midsole',
    weight: 280,
    breathability: 4
  },

  'RUNNING_SHOES': {
    soleMaterial: 'Rubber with carbon plate',
    soleGripRating: 5,
    cushioningTechnology: 'React foam / Boost technology',
    weight: 250,
    breathability: 5
  },

  'BOOTS': {
    soleMaterial: 'Rubber',
    soleGripRating: 5,
    cushioningTechnology: 'Standard insole',
    weight: 450,
    breathability: 2
  },

  'SANDALS': {
    soleMaterial: 'EVA foam',
    soleGripRating: 3,
    cushioningTechnology: 'Contoured footbed',
    weight: 200,
    breathability: 5
  },

  'FORMAL_SHOES': {
    soleMaterial: 'Leather with rubber heel',
    soleGripRating: 3,
    cushioningTechnology: 'Leather insole',
    weight: 350,
    breathability: 3
  },

  'SLIPPERS': {
    soleMaterial: 'TPR rubber',
    soleGripRating: 2,
    cushioningTechnology: 'Memory foam',
    weight: 150,
    breathability: 4
  }
}

// ========================================
// HOME & KITCHEN DEFAULTS
// ========================================

export const HOME_DEFAULTS: Record<string, Partial<HomeKitchenSpecs>> = {
  // Generic Home & Kitchen (fallback)
  'HOME': {
    materialSafety: ['FDA approved'],
    capacity: 500,
    capacityUnit: 'ml',
    dishwasherSafe: true
  },

  'WATER_BOTTLE': {
    materialSafety: ['BPA-free', 'FDA approved'],
    capacity: 750,
    capacityUnit: 'ml',
    insulationPerformance: 12,
    dishwasherSafe: true
  },

  'COOKWARE': {
    materialSafety: ['PFOA-free', 'FDA approved'],
    dishwasherSafe: true
  },

  'STORAGE_CONTAINER': {
    materialSafety: ['BPA-free', 'FDA approved', 'Microwave safe'],
    capacity: 1000,
    capacityUnit: 'ml',
    dishwasherSafe: true
  },

  'COFFEE_MUG': {
    materialSafety: ['FDA approved'],
    capacity: 350,
    capacityUnit: 'ml',
    insulationPerformance: 2,
    dishwasherSafe: true
  },

  'THERMOS': {
    materialSafety: ['BPA-free', 'FDA approved'],
    capacity: 500,
    capacityUnit: 'ml',
    insulationPerformance: 24,
    dishwasherSafe: false
  },

  'BAKEWARE': {
    materialSafety: ['PFOA-free', 'FDA approved'],
    dishwasherSafe: true
  },

  'CUTLERY': {
    materialSafety: ['Stainless steel', 'FDA approved'],
    dishwasherSafe: true
  }
}

// ========================================
// SPORTS & FITNESS DEFAULTS
// ========================================

export const SPORTS_DEFAULTS: Record<string, Partial<SportsSpecs>> = {
  // Generic Sports & Fitness (fallback)
  'SPORTS': {
    durabilityRating: 4,
    weatherResistance: 'Indoor/Outdoor'
  },

  'YOGA_MAT': {
    durabilityRating: 4,
    weatherResistance: 'Indoor use'
  },

  'DUMBBELL': {
    durabilityRating: 5,
    weatherResistance: 'Indoor use'
  },

  'RESISTANCE_BAND': {
    durabilityRating: 3,
    weatherResistance: 'Indoor use'
  },

  'JUMP_ROPE': {
    durabilityRating: 4,
    weatherResistance: 'Indoor/Outdoor'
  },

  'TENNIS_RACKET': {
    durabilityRating: 4,
    weatherResistance: 'Outdoor'
  },

  'BASKETBALL': {
    durabilityRating: 4,
    weatherResistance: 'Indoor/Outdoor'
  },

  'BACKPACK': {
    durabilityRating: 4,
    weatherResistance: 'Water-resistant'
  },

  'TENT': {
    durabilityRating: 4,
    weatherResistance: 'Waterproof (3000mm)'
  }
}

// ========================================
// CATEGORY MAPPING HELPERS
// ========================================

/**
 * Get default specs for a product based on its category
 */
export function getDefaultSpecsByCategory(category: string, subcategory?: string): Record<string, any> {
  const normalizedCategory = category.toUpperCase().replace(/[^A-Z0-9]/g, '_')
  const normalizedSubcategory = subcategory?.toUpperCase().replace(/[^A-Z0-9]/g, '_')

  // Try subcategory first (more specific)
  if (normalizedSubcategory) {
    // Check electronics
    if (ELECTRONICS_DEFAULTS[normalizedSubcategory]) {
      return ELECTRONICS_DEFAULTS[normalizedSubcategory] as Record<string, any>
    }
    // Check clothing
    if (CLOTHING_DEFAULTS[normalizedSubcategory]) {
      return CLOTHING_DEFAULTS[normalizedSubcategory] as Record<string, any>
    }
    // Check shoes
    if (SHOES_DEFAULTS[normalizedSubcategory]) {
      return SHOES_DEFAULTS[normalizedSubcategory] as Record<string, any>
    }
    // Check home
    if (HOME_DEFAULTS[normalizedSubcategory]) {
      return HOME_DEFAULTS[normalizedSubcategory] as Record<string, any>
    }
    // Check sports
    if (SPORTS_DEFAULTS[normalizedSubcategory]) {
      return SPORTS_DEFAULTS[normalizedSubcategory] as Record<string, any>
    }
  }

  // Try main category
  if (ELECTRONICS_DEFAULTS[normalizedCategory]) {
    return ELECTRONICS_DEFAULTS[normalizedCategory] as Record<string, any>
  }
  if (CLOTHING_DEFAULTS[normalizedCategory]) {
    return CLOTHING_DEFAULTS[normalizedCategory] as Record<string, any>
  }
  if (SHOES_DEFAULTS[normalizedCategory]) {
    return SHOES_DEFAULTS[normalizedCategory] as Record<string, any>
  }
  if (HOME_DEFAULTS[normalizedCategory]) {
    return HOME_DEFAULTS[normalizedCategory] as Record<string, any>
  }
  if (SPORTS_DEFAULTS[normalizedCategory]) {
    return SPORTS_DEFAULTS[normalizedCategory] as Record<string, any>
  }

  // Fallback: try to infer from category name
  return inferDefaultSpecs(category)
}

/**
 * Infer default specs from category name when no exact match
 */
function inferDefaultSpecs(category: string): Record<string, any> {
  const lower = category.toLowerCase()

  // Electronics keywords
  if (lower.includes('laptop') || lower.includes('computer') || lower.includes('pc')) {
    return ELECTRONICS_DEFAULTS['LAPTOP'] as Record<string, any>
  }
  if (lower.includes('phone') || lower.includes('mobile')) {
    return ELECTRONICS_DEFAULTS['PHONE'] as Record<string, any>
  }
  if (lower.includes('tv') || lower.includes('television')) {
    return ELECTRONICS_DEFAULTS['TV'] as Record<string, any>
  }
  if (lower.includes('headphone') || lower.includes('earbud') || lower.includes('airpod')) {
    return ELECTRONICS_DEFAULTS['HEADPHONES'] as Record<string, any>
  }
  if (lower.includes('watch')) {
    return ELECTRONICS_DEFAULTS['SMARTWATCH'] as Record<string, any>
  }

  // Clothing keywords
  if (lower.includes('shirt') && !lower.includes('t-shirt')) {
    return CLOTHING_DEFAULTS['SHIRT'] as Record<string, any>
  }
  if (lower.includes('t-shirt') || lower.includes('tshirt') || lower.includes('tee')) {
    return CLOTHING_DEFAULTS['T_SHIRT'] as Record<string, any>
  }
  if (lower.includes('jean') || lower.includes('denim')) {
    return CLOTHING_DEFAULTS['JEANS'] as Record<string, any>
  }
  if (lower.includes('dress')) {
    return CLOTHING_DEFAULTS['DRESS'] as Record<string, any>
  }
  if (lower.includes('jacket') || lower.includes('coat')) {
    return CLOTHING_DEFAULTS['JACKET'] as Record<string, any>
  }

  // Shoes keywords
  if (lower.includes('sneaker') || lower.includes('trainer')) {
    return SHOES_DEFAULTS['SNEAKERS'] as Record<string, any>
  }
  if (lower.includes('running') || lower.includes('athletic')) {
    return SHOES_DEFAULTS['RUNNING_SHOES'] as Record<string, any>
  }
  if (lower.includes('boot')) {
    return SHOES_DEFAULTS['BOOTS'] as Record<string, any>
  }

  // Home keywords
  if (lower.includes('bottle') || lower.includes('flask')) {
    return HOME_DEFAULTS['WATER_BOTTLE'] as Record<string, any>
  }
  if (lower.includes('mug') || lower.includes('cup')) {
    return HOME_DEFAULTS['COFFEE_MUG'] as Record<string, any>
  }

  // Sports keywords
  if (lower.includes('yoga') || lower.includes('mat')) {
    return SPORTS_DEFAULTS['YOGA_MAT'] as Record<string, any>
  }
  if (lower.includes('backpack') || lower.includes('bag')) {
    return SPORTS_DEFAULTS['BACKPACK'] as Record<string, any>
  }

  // Default: empty specs
  return {}
}

/**
 * Get category type from category name
 */
export function getCategoryType(category: string): 'ELECTRONICS' | 'CLOTHING' | 'SHOES' | 'HOME' | 'SPORTS' | 'ACCESSORIES' | 'DEFAULT' {
  const lower = category.toLowerCase()

  // Electronics
  if (lower.includes('electronic') || lower.includes('laptop') || lower.includes('phone') ||
      lower.includes('tablet') || lower.includes('tv') || lower.includes('computer') ||
      lower.includes('headphone') || lower.includes('watch') || lower.includes('camera')) {
    return 'ELECTRONICS'
  }

  // Clothing
  if (lower.includes('clothing') || lower.includes('shirt') || lower.includes('jean') ||
      lower.includes('dress') || lower.includes('jacket') || lower.includes('sweater') ||
      lower.includes('pant') || lower.includes('short') || lower.includes('apparel')) {
    return 'CLOTHING'
  }

  // Shoes
  if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('boot') ||
      lower.includes('sandal') || lower.includes('slipper') || lower.includes('footwear')) {
    return 'SHOES'
  }

  // Home
  if (lower.includes('home') || lower.includes('kitchen') || lower.includes('bottle') ||
      lower.includes('mug') || lower.includes('cookware') || lower.includes('storage')) {
    return 'HOME'
  }

  // Sports
  if (lower.includes('sport') || lower.includes('fitness') || lower.includes('yoga') ||
      lower.includes('exercise') || lower.includes('athletic') || lower.includes('outdoor')) {
    return 'SPORTS'
  }

  // Accessories
  if (lower.includes('accessor') || lower.includes('bag') || lower.includes('wallet') ||
      lower.includes('belt') || lower.includes('hat') || lower.includes('scarf')) {
    return 'ACCESSORIES'
  }

  return 'DEFAULT'
}

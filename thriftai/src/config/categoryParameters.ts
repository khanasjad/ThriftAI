/**
 * Category-Specific Product Parameters
 * Defines 25+ parameters for each category to achieve maximum Veritas Score
 *
 * These parameters are scraped from real e-commerce websites to ensure data quality
 */

export type CategoryParameterConfig = {
  category: string
  requiredParameters: string[]
  optionalParameters: string[]
  scrapingSources: string[]
}

export const CATEGORY_PARAMETERS: Record<string, CategoryParameterConfig> = {
  ELECTRONICS: {
    category: 'ELECTRONICS',
    requiredParameters: [
      // Core Specs (10)
      'brand',
      'model',
      'releaseYear',
      'displaySize',
      'displayResolution',
      'processor',
      'ram',
      'storage',
      'batteryCapacity',
      'weight',

      // Performance (8)
      'operatingSystem',
      'gpuModel',
      'refreshRate',
      'batteryLife',
      'chargingSpeed',
      'ports',
      'connectivity',
      'waterResistance',

      // Features (7)
      'cameraSpecs',
      'audioSpecs',
      'biometricSecurity',
      'wirelessCharging',
      'expandableStorage',
      'warranty',
      'colorOptions'
    ],
    optionalParameters: [
      'nfcSupport',
      '5gSupport',
      'frontCameraSpecs',
      'videoRecording',
      'fastCharging'
    ],
    scrapingSources: [
      'https://www.amazon.com',
      'https://www.bestbuy.com',
      'https://www.apple.com',
      'https://www.gsmarena.com'
    ]
  },

  CLOTHING: {
    category: 'CLOTHING',
    requiredParameters: [
      // Basic Info (10)
      'brand',
      'style',
      'material',
      'fabricComposition',
      'fit',
      'size',
      'color',
      'pattern',
      'season',
      'gender',

      // Construction (8)
      'careInstructions',
      'origin',
      'neckline',
      'sleeveLength',
      'closure',
      'lining',
      'pockets',
      'hemStyle',

      // Quality (7)
      'fabricWeight',
      'threadCount',
      'stitchingQuality',
      'sustainability',
      'certifications',
      'breathability',
      'stretchability'
    ],
    optionalParameters: [
      'uvProtection',
      'moistureWicking',
      'antimicrobial',
      'wrinkleResistant',
      'fadeResistant'
    ],
    scrapingSources: [
      'https://www.nordstrom.com',
      'https://www.zara.com',
      'https://www.hm.com',
      'https://www.macys.com'
    ]
  },

  SHOES: {
    category: 'SHOES',
    requiredParameters: [
      // Basic Info (10)
      'brand',
      'model',
      'style',
      'size',
      'width',
      'color',
      'material',
      'gender',
      'releaseYear',
      'collectionName',

      // Construction (8)
      'soleMaterial',
      'upperMaterial',
      'liningMaterial',
      'closureType',
      'heelHeight',
      'toeStyle',
      'insoleType',
      'weight',

      // Performance (7)
      'cushioningTechnology',
      'tractionPattern',
      'breathability',
      'waterResistance',
      'flexibility',
      'durability',
      'archSupport'
    ],
    optionalParameters: [
      'odorControl',
      'shockAbsorption',
      'energyReturn',
      'stabilityFeatures',
      'reflectiveElements'
    ],
    scrapingSources: [
      'https://www.nike.com',
      'https://www.adidas.com',
      'https://www.zappos.com',
      'https://www.footlocker.com'
    ]
  },

  ACCESSORIES: {
    category: 'ACCESSORIES',
    requiredParameters: [
      // Basic Info (10)
      'brand',
      'type',
      'material',
      'color',
      'dimensions',
      'weight',
      'style',
      'gender',
      'season',
      'collectionName',

      // Features (8)
      'closure',
      'compartments',
      'capacity',
      'hardware',
      'lining',
      'straps',
      'waterResistance',
      'durability',

      // Quality (7)
      'craftsmanship',
      'stitchingQuality',
      'hardwareQuality',
      'edgePainting',
      'liningQuality',
      'warranty',
      'careInstructions'
    ],
    optionalParameters: [
      'smartFeatures',
      'rfidProtection',
      'gpsTracking',
      'chargingPorts',
      'adjustability'
    ],
    scrapingSources: [
      'https://www.fossil.com',
      'https://www.michaelkors.com',
      'https://www.coach.com',
      'https://www.amazon.com'
    ]
  },

  BEAUTY: {
    category: 'BEAUTY',
    requiredParameters: [
      // Basic Info (10)
      'brand',
      'productType',
      'size',
      'volume',
      'formula',
      'skinType',
      'concerns',
      'benefits',
      'fragrance',
      'color',

      // Ingredients (8)
      'activeIngredients',
      'keyIngredients',
      'allergens',
      'parabens',
      'sulfates',
      'phthalates',
      'preservation',
      'ph',

      // Quality (7)
      'certifications',
      'crueltyfree',
      'vegan',
      'organic',
      'dermatologistTested',
      'clinicallyTested',
      'shelfLife'
    ],
    optionalParameters: [
      'spf',
      'waterproof',
      'hypoallergenic',
      'nonComedogenic',
      'oilFree'
    ],
    scrapingSources: [
      'https://www.sephora.com',
      'https://www.ulta.com',
      'https://www.dermstore.com',
      'https://www.beautylish.com'
    ]
  },

  HOME: {
    category: 'HOME',
    requiredParameters: [
      // Basic Info (10)
      'brand',
      'productType',
      'dimensions',
      'weight',
      'material',
      'color',
      'style',
      'roomType',
      'capacity',
      'powerSource',

      // Features (8)
      'assembly',
      'mounting',
      'connectivity',
      'smartFeatures',
      'energyRating',
      'noiseLevel',
      'warranty',
      'certifications',

      // Performance (7)
      'durability',
      'maintenance',
      'weatherResistance',
      'loadCapacity',
      'operatingTemperature',
      'safetyFeatures',
      'ecoFriendly'
    ],
    optionalParameters: [
      'voiceControl',
      'appControl',
      'automation',
      'scheduling',
      'remoteAccess'
    ],
    scrapingSources: [
      'https://www.wayfair.com',
      'https://www.homedepot.com',
      'https://www.ikea.com',
      'https://www.crateandbarrel.com'
    ]
  },

  SPORTS: {
    category: 'SPORTS',
    requiredParameters: [
      // Basic Info (10)
      'brand',
      'productType',
      'sport',
      'level',
      'size',
      'weight',
      'material',
      'color',
      'gender',
      'ageGroup',

      // Performance (8)
      'durability',
      'gripType',
      'cushioning',
      'flexibility',
      'breathability',
      'waterResistance',
      'impactProtection',
      'ventilation',

      // Features (7)
      'adjustability',
      'portability',
      'storage',
      'maintenance',
      'warranty',
      'certifications',
      'safetyStandards'
    ],
    optionalParameters: [
      'gpsTracking',
      'heartRateMonitor',
      'bluetoothConnectivity',
      'batteryLife',
      'appCompatibility'
    ],
    scrapingSources: [
      'https://www.dickssportinggoods.com',
      'https://www.rei.com',
      'https://www.decathlon.com',
      'https://www.academy.com'
    ]
  },

  TOYS: {
    category: 'TOYS',
    requiredParameters: [
      // Basic Info (10)
      'brand',
      'toyType',
      'ageRange',
      'minAge',
      'maxAge',
      'dimensions',
      'weight',
      'material',
      'color',
      'theme',

      // Safety (8)
      'safetyStandards',
      'certifications',
      'smallParts',
      'choking',
      'toxicFree',
      'sharpEdges',
      'batteryType',
      'supervision',

      // Features (7)
      'educational',
      'skills',
      'interactivity',
      'assembly',
      'durability',
      'warranty',
      'cleaningInstructions'
    ],
    optionalParameters: [
      'soundEffects',
      'lights',
      'batteries',
      'appConnectivity',
      'expandability'
    ],
    scrapingSources: [
      'https://www.target.com',
      'https://www.toysrus.com',
      'https://www.amazon.com',
      'https://www.walmart.com'
    ]
  }
}

/**
 * Get required parameters for a category
 */
export function getRequiredParameters(category: string): string[] {
  const config = CATEGORY_PARAMETERS[category]
  return config ? config.requiredParameters : []
}

/**
 * Get all parameters (required + optional) for a category
 */
export function getAllParameters(category: string): string[] {
  const config = CATEGORY_PARAMETERS[category]
  if (!config) return []
  return [...config.requiredParameters, ...config.optionalParameters]
}

/**
 * Get scraping sources for a category
 */
export function getScrapingSources(category: string): string[] {
  const config = CATEGORY_PARAMETERS[category]
  return config ? config.scrapingSources : []
}

/**
 * Validate if product has minimum required parameters (25+)
 */
export function hasMinimumParameters(category: string, productSpecs: Record<string, any>): boolean {
  const requiredParams = getRequiredParameters(category)
  const providedParams = Object.keys(productSpecs)
  const matchingParams = requiredParams.filter(param => providedParams.includes(param))
  return matchingParams.length >= 25
}

/**
 * Calculate parameter completeness percentage
 */
export function calculateParameterCompleteness(category: string, productSpecs: Record<string, any>): number {
  const allParams = getAllParameters(category)
  const providedParams = Object.keys(productSpecs)
  const matchingParams = allParams.filter(param => providedParams.includes(param))
  return (matchingParams.length / allParams.length) * 100
}

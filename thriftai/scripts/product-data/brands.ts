// ThriftAI Brand Database
// Comprehensive brand definitions for realistic thrift product generation

export interface BrandInfo {
  name: string
  categories: string[]
  priceMultiplier: number // How much this brand affects price (0.5 = cheaper, 2.0 = expensive)
  popularityScore: number // 1-100, affects how often this brand appears
  isDesigner: boolean
  isVintage: boolean
  foundedYear?: number
  description?: string
}

export const BRANDS: Record<string, BrandInfo> = {
  // LUXURY/DESIGNER BRANDS
  'Chanel': {
    name: 'Chanel',
    categories: ['CLOTHING', 'ACCESSORIES', 'BEAUTY'],
    priceMultiplier: 3.5,
    popularityScore: 20,
    isDesigner: true,
    isVintage: false,
    foundedYear: 1910,
    description: 'French luxury fashion house'
  },
  'Gucci': {
    name: 'Gucci',
    categories: ['CLOTHING', 'ACCESSORIES', 'SHOES'],
    priceMultiplier: 3.0,
    popularityScore: 25,
    isDesigner: true,
    isVintage: false,
    foundedYear: 1921
  },
  'Louis Vuitton': {
    name: 'Louis Vuitton',
    categories: ['ACCESSORIES', 'CLOTHING'],
    priceMultiplier: 4.0,
    popularityScore: 15,
    isDesigner: true,
    isVintage: false,
    foundedYear: 1854
  },
  'Prada': {
    name: 'Prada',
    categories: ['CLOTHING', 'ACCESSORIES', 'SHOES'],
    priceMultiplier: 2.8,
    popularityScore: 18,
    isDesigner: true,
    isVintage: false,
    foundedYear: 1913
  },
  'Hermès': {
    name: 'Hermès',
    categories: ['ACCESSORIES', 'CLOTHING'],
    priceMultiplier: 4.5,
    popularityScore: 12,
    isDesigner: true,
    isVintage: false,
    foundedYear: 1837
  },

  // PREMIUM BRANDS
  'Calvin Klein': {
    name: 'Calvin Klein',
    categories: ['CLOTHING', 'ACCESSORIES', 'BEAUTY'],
    priceMultiplier: 1.8,
    popularityScore: 45,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1968
  },
  'Ralph Lauren': {
    name: 'Ralph Lauren',
    categories: ['CLOTHING', 'ACCESSORIES', 'HOME'],
    priceMultiplier: 1.9,
    popularityScore: 50,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1967
  },
  'Tommy Hilfiger': {
    name: 'Tommy Hilfiger',
    categories: ['CLOTHING', 'ACCESSORIES'],
    priceMultiplier: 1.6,
    popularityScore: 55,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1985
  },
  'Coach': {
    name: 'Coach',
    categories: ['ACCESSORIES', 'CLOTHING'],
    priceMultiplier: 2.2,
    popularityScore: 40,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1941
  },
  'Michael Kors': {
    name: 'Michael Kors',
    categories: ['ACCESSORIES', 'CLOTHING', 'SHOES'],
    priceMultiplier: 1.7,
    popularityScore: 60,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1981
  },

  // POPULAR CLOTHING BRANDS
  'Nike': {
    name: 'Nike',
    categories: ['SHOES', 'CLOTHING', 'SPORTS'],
    priceMultiplier: 1.4,
    popularityScore: 85,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1964
  },
  'Adidas': {
    name: 'Adidas',
    categories: ['SHOES', 'CLOTHING', 'SPORTS'],
    priceMultiplier: 1.3,
    popularityScore: 80,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1949
  },
  'Levi\'s': {
    name: 'Levi\'s',
    categories: ['CLOTHING'],
    priceMultiplier: 1.2,
    popularityScore: 70,
    isDesigner: false,
    isVintage: true,
    foundedYear: 1853
  },
  'Gap': {
    name: 'Gap',
    categories: ['CLOTHING'],
    priceMultiplier: 0.9,
    popularityScore: 75,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1969
  },
  'Old Navy': {
    name: 'Old Navy',
    categories: ['CLOTHING'],
    priceMultiplier: 0.7,
    popularityScore: 80,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1994
  },
  'J.Crew': {
    name: 'J.Crew',
    categories: ['CLOTHING', 'ACCESSORIES'],
    priceMultiplier: 1.3,
    popularityScore: 60,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1983
  },
  'Banana Republic': {
    name: 'Banana Republic',
    categories: ['CLOTHING', 'ACCESSORIES'],
    priceMultiplier: 1.1,
    popularityScore: 65,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1978
  },

  // FAST FASHION
  'H&M': {
    name: 'H&M',
    categories: ['CLOTHING', 'ACCESSORIES'],
    priceMultiplier: 0.6,
    popularityScore: 90,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1947
  },
  'Zara': {
    name: 'Zara',
    categories: ['CLOTHING', 'ACCESSORIES', 'SHOES'],
    priceMultiplier: 0.8,
    popularityScore: 85,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1975
  },
  'Uniqlo': {
    name: 'Uniqlo',
    categories: ['CLOTHING'],
    priceMultiplier: 0.7,
    popularityScore: 70,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1949
  },
  'Forever 21': {
    name: 'Forever 21',
    categories: ['CLOTHING', 'ACCESSORIES'],
    priceMultiplier: 0.5,
    popularityScore: 75,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1984
  },

  // ELECTRONICS BRANDS
  'Apple': {
    name: 'Apple',
    categories: ['ELECTRONICS'],
    priceMultiplier: 2.5,
    popularityScore: 95,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1976
  },
  'Samsung': {
    name: 'Samsung',
    categories: ['ELECTRONICS'],
    priceMultiplier: 1.8,
    popularityScore: 90,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1938
  },
  'Sony': {
    name: 'Sony',
    categories: ['ELECTRONICS'],
    priceMultiplier: 1.6,
    popularityScore: 80,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1946
  },
  'Nintendo': {
    name: 'Nintendo',
    categories: ['ELECTRONICS', 'TOYS'],
    priceMultiplier: 1.4,
    popularityScore: 85,
    isDesigner: false,
    isVintage: true,
    foundedYear: 1889
  },
  'Microsoft': {
    name: 'Microsoft',
    categories: ['ELECTRONICS'],
    priceMultiplier: 1.7,
    popularityScore: 85,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1975
  },
  'Canon': {
    name: 'Canon',
    categories: ['ELECTRONICS'],
    priceMultiplier: 1.5,
    popularityScore: 75,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1937
  },
  'Nikon': {
    name: 'Nikon',
    categories: ['ELECTRONICS'],
    priceMultiplier: 1.4,
    popularityScore: 70,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1917
  },

  // VINTAGE/RETRO BRANDS
  'Pendleton': {
    name: 'Pendleton',
    categories: ['CLOTHING'],
    priceMultiplier: 1.3,
    popularityScore: 45,
    isDesigner: false,
    isVintage: true,
    foundedYear: 1863
  },
  'L.L.Bean': {
    name: 'L.L.Bean',
    categories: ['CLOTHING', 'SPORTS'],
    priceMultiplier: 1.1,
    popularityScore: 55,
    isDesigner: false,
    isVintage: true,
    foundedYear: 1912
  },
  'Patagonia': {
    name: 'Patagonia',
    categories: ['CLOTHING', 'SPORTS'],
    priceMultiplier: 1.6,
    popularityScore: 60,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1973
  },
  'The North Face': {
    name: 'The North Face',
    categories: ['CLOTHING', 'SPORTS'],
    priceMultiplier: 1.4,
    popularityScore: 70,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1966
  },

  // HOME & FURNITURE BRANDS
  'IKEA': {
    name: 'IKEA',
    categories: ['FURNITURE', 'HOME'],
    priceMultiplier: 0.6,
    popularityScore: 90,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1943
  },
  'West Elm': {
    name: 'West Elm',
    categories: ['FURNITURE', 'HOME'],
    priceMultiplier: 1.2,
    popularityScore: 60,
    isDesigner: false,
    isVintage: false,
    foundedYear: 2002
  },
  'Pottery Barn': {
    name: 'Pottery Barn',
    categories: ['FURNITURE', 'HOME'],
    priceMultiplier: 1.5,
    popularityScore: 55,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1949
  },
  'CB2': {
    name: 'CB2',
    categories: ['FURNITURE', 'HOME'],
    priceMultiplier: 1.3,
    popularityScore: 45,
    isDesigner: false,
    isVintage: false,
    foundedYear: 2000
  },

  // BEAUTY BRANDS
  'MAC': {
    name: 'MAC Cosmetics',
    categories: ['BEAUTY'],
    priceMultiplier: 1.4,
    popularityScore: 75,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1984
  },
  'Clinique': {
    name: 'Clinique',
    categories: ['BEAUTY'],
    priceMultiplier: 1.3,
    popularityScore: 70,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1968
  },
  'Estée Lauder': {
    name: 'Estée Lauder',
    categories: ['BEAUTY'],
    priceMultiplier: 1.5,
    popularityScore: 65,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1946
  },
  'Revlon': {
    name: 'Revlon',
    categories: ['BEAUTY'],
    priceMultiplier: 0.8,
    popularityScore: 80,
    isDesigner: false,
    isVintage: true,
    foundedYear: 1932
  },

  // SPORTS BRANDS
  'Under Armour': {
    name: 'Under Armour',
    categories: ['SPORTS', 'CLOTHING'],
    priceMultiplier: 1.2,
    popularityScore: 75,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1996
  },
  'Reebok': {
    name: 'Reebok',
    categories: ['SHOES', 'SPORTS', 'CLOTHING'],
    priceMultiplier: 1.1,
    popularityScore: 70,
    isDesigner: false,
    isVintage: true,
    foundedYear: 1958
  },
  'Puma': {
    name: 'Puma',
    categories: ['SHOES', 'SPORTS', 'CLOTHING'],
    priceMultiplier: 1.2,
    popularityScore: 75,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1948
  },
  'Columbia': {
    name: 'Columbia',
    categories: ['SPORTS', 'CLOTHING'],
    priceMultiplier: 1.1,
    popularityScore: 65,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1938
  },

  // BOOK PUBLISHERS (for variety)
  'Penguin': {
    name: 'Penguin Books',
    categories: ['BOOKS'],
    priceMultiplier: 0.8,
    popularityScore: 70,
    isDesigner: false,
    isVintage: true,
    foundedYear: 1935
  },
  'Random House': {
    name: 'Random House',
    categories: ['BOOKS'],
    priceMultiplier: 0.9,
    popularityScore: 75,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1927
  },

  // AUTOMOTIVE BRANDS
  'Bosch': {
    name: 'Bosch',
    categories: ['AUTOMOTIVE'],
    priceMultiplier: 1.3,
    popularityScore: 60,
    isDesigner: false,
    isVintage: false,
    foundedYear: 1886
  },
  'AC Delco': {
    name: 'AC Delco',
    categories: ['AUTOMOTIVE'],
    priceMultiplier: 1.1,
    popularityScore: 70,
    isDesigner: false,
    isVintage: true,
    foundedYear: 1908
  },

  // GENERIC/UNBRANDED
  'Unbranded': {
    name: 'Unbranded',
    categories: ['CLOTHING', 'ACCESSORIES', 'HOME', 'TOYS'],
    priceMultiplier: 0.4,
    popularityScore: 100,
    isDesigner: false,
    isVintage: false
  },
  'Vintage': {
    name: 'Vintage',
    categories: ['CLOTHING', 'ACCESSORIES', 'HOME', 'FURNITURE'],
    priceMultiplier: 1.2,
    popularityScore: 80,
    isDesigner: false,
    isVintage: true
  },
  'Handmade': {
    name: 'Handmade',
    categories: ['CLOTHING', 'ACCESSORIES', 'HOME', 'TOYS'],
    priceMultiplier: 1.1,
    popularityScore: 60,
    isDesigner: false,
    isVintage: false
  }
}

export function getBrandsForCategory(category: string): BrandInfo[] {
  return Object.values(BRANDS).filter(brand =>
    brand.categories.includes(category)
  )
}

export function getRandomBrandForCategory(category: string): BrandInfo {
  const brands = getBrandsForCategory(category)
  const weightedBrands: BrandInfo[] = []

  // Create weighted array based on popularity score
  brands.forEach(brand => {
    const weight = Math.ceil(brand.popularityScore / 10)
    for (let i = 0; i < weight; i++) {
      weightedBrands.push(brand)
    }
  })

  return weightedBrands[Math.floor(Math.random() * weightedBrands.length)]
}
/**
 * iFixit API Integration
 *
 * FREE for non-commercial use - Most public endpoints don't require authentication
 * Documentation: https://www.ifixit.com/api/2.0/doc/
 *
 * Provides repairability scores and repair guides for products
 */

export interface iFixitDevice {
  deviceid: number
  title: string
  manufacturer: string
  url: string
  image?: {
    standard: string
    medium: string
    thumbnail: string
  }
}

export interface iFixitGuide {
  guideid: number
  title: string
  url: string
  difficulty: 'Easy' | 'Moderate' | 'Difficult' | 'Very difficult'
  time_required: string
  subject: string
  category: string
  rating: number
  image?: {
    standard: string
    medium: string
    thumbnail: string
  }
  conclusion?: string
}

export interface RepairabilityData {
  device: iFixitDevice | null
  guides: iFixitGuide[]
  repairabilityScore: number // 0-100
  difficultyLevel: 'Easy' | 'Moderate' | 'Difficult' | 'Very difficult' | 'Unknown'
  guideCount: number
  hasOfficialGuides: boolean
  averageRating: number
}

const IFIXIT_API_BASE = 'https://www.ifixit.com/api/2.0'

/**
 * Search for a device on iFixit
 */
export async function searchDevice(query: string): Promise<iFixitDevice[]> {
  try {
    const url = `${IFIXIT_API_BASE}/suggest/${encodeURIComponent(query)}?limit=10`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.warn(`iFixit API returned ${response.status}`)
      return []
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Error searching iFixit devices:', error)
    return []
  }
}

/**
 * Get repair guides for a device
 */
export async function getRepairGuides(deviceName: string): Promise<iFixitGuide[]> {
  try {
    // Search for the device first
    const devices = await searchDevice(deviceName)
    if (devices.length === 0) return []

    // Get guides for the first matching device
    const device = devices[0]
    const url = `${IFIXIT_API_BASE}/wikis/CATEGORY/${device.title}`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) return []

    const data = await response.json()
    return data.guides || []
  } catch (error) {
    console.error('Error fetching iFixit guides:', error)
    return []
  }
}

/**
 * Get repairability data for Veritas Score
 */
export async function getRepairabilityData(productName: string, brand?: string): Promise<RepairabilityData> {
  try {
    const searchQuery = brand ? `${brand} ${productName}` : productName

    // Search for device
    const devices = await searchDevice(searchQuery)
    const device = devices[0] || null

    if (!device) {
      return {
        device: null,
        guides: [],
        repairabilityScore: 50, // Neutral score if no data
        difficultyLevel: 'Unknown',
        guideCount: 0,
        hasOfficialGuides: false,
        averageRating: 0
      }
    }

    // Get repair guides
    const guides = await getRepairGuides(device.title)

    // Calculate repairability score
    const repairabilityScore = calculateRepairabilityScore(guides)
    const difficultyLevel = getMostCommonDifficulty(guides)
    const averageRating = calculateAverageRating(guides)

    return {
      device,
      guides,
      repairabilityScore,
      difficultyLevel,
      guideCount: guides.length,
      hasOfficialGuides: guides.length > 0,
      averageRating
    }
  } catch (error) {
    console.error('Error getting repairability data:', error)
    return {
      device: null,
      guides: [],
      repairabilityScore: 50,
      difficultyLevel: 'Unknown',
      guideCount: 0,
      hasOfficialGuides: false,
      averageRating: 0
    }
  }
}

/**
 * Calculate repairability score (0-100)
 * Higher score = more repairable = better for environment
 */
function calculateRepairabilityScore(guides: iFixitGuide[]): number {
  if (guides.length === 0) return 50 // Neutral if no guides

  let score = 50 // Base score

  // More guides = more repairable
  if (guides.length >= 10) score += 20
  else if (guides.length >= 5) score += 15
  else if (guides.length >= 2) score += 10
  else score += 5

  // Easier difficulty = more repairable
  const difficulties = guides.map(g => g.difficulty)
  const easyCount = difficulties.filter(d => d === 'Easy').length
  const moderateCount = difficulties.filter(d => d === 'Moderate').length

  if (easyCount > guides.length / 2) score += 15
  else if (moderateCount > guides.length / 2) score += 10
  else if (easyCount > 0) score += 5

  // High ratings = good guides = more repairable
  const avgRating = calculateAverageRating(guides)
  if (avgRating >= 8) score += 15
  else if (avgRating >= 6) score += 10
  else if (avgRating >= 4) score += 5

  return Math.min(100, Math.max(0, score))
}

function getMostCommonDifficulty(guides: iFixitGuide[]): 'Easy' | 'Moderate' | 'Difficult' | 'Very difficult' | 'Unknown' {
  if (guides.length === 0) return 'Unknown'

  const difficultyCounts = guides.reduce((acc, guide) => {
    acc[guide.difficulty] = (acc[guide.difficulty] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const mostCommon = Object.entries(difficultyCounts).sort((a, b) => b[1] - a[1])[0]
  return mostCommon[0] as any || 'Unknown'
}

function calculateAverageRating(guides: iFixitGuide[]): number {
  if (guides.length === 0) return 0

  const validRatings = guides.filter(g => g.rating && g.rating > 0)
  if (validRatings.length === 0) return 0

  const sum = validRatings.reduce((acc, g) => acc + g.rating, 0)
  return sum / validRatings.length
}

/**
 * Get sustainability parameters for Veritas Score
 */
export async function getSustainabilityParameters(productName: string, brand?: string) {
  const data = await getRepairabilityData(productName, brand)

  return {
    // Sustainability Category (iFixit parameters)
    repairabilityScore: data.repairabilityScore,
    hasRepairGuides: data.hasOfficialGuides,
    repairDifficulty: data.difficultyLevel,
    repairGuideCount: data.guideCount,
    repairGuideRating: data.averageRating,
    deviceInfo: data.device ? {
      name: data.device.title,
      manufacturer: data.device.manufacturer,
      url: data.device.url
    } : null,
    topGuides: data.guides.slice(0, 5).map(g => ({
      title: g.title,
      difficulty: g.difficulty,
      url: g.url,
      rating: g.rating
    }))
  }
}

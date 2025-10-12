/**
 * CPSC (Consumer Product Safety Commission) Recalls API Integration
 *
 * FREE API - No authentication required
 * Documentation: https://www.saferproducts.gov/RestWebServices/
 *
 * Provides product recall and safety data for the Veritas Score
 */

export interface CPSCRecall {
  RecallID: string
  RecallNumber: string
  RecallDate: string
  Description: string
  URL: string
  Title: string
  ConsumerContact: string
  LastPublishDate: string
  Products?: CPSCProduct[]
  Images?: CPSCImage[]
  Injuries?: CPSCInjury[]
  Manufacturers?: CPSCManufacturer[]
  ProductUPCs?: string[]
  Hazards?: CPSCHazard[]
  Remedies?: string[]
}

export interface CPSCProduct {
  Name: string
  Description: string
  Model: string
  Type: string
  CategoryID?: string
  NumberOfUnits?: string
}

export interface CPSCImage {
  URL: string
  Caption?: string
}

export interface CPSCInjury {
  Name: string
}

export interface CPSCManufacturer {
  Name: string
  CompanyID?: string
  Country?: string
}

export interface CPSCHazard {
  Name: string
  HazardTypeID?: string
}

export interface RecallSearchResult {
  recalls: CPSCRecall[]
  hasRecalls: boolean
  recallCount: number
  totalHazards: number
  latestRecallDate?: string
  riskLevel: 'None' | 'Low' | 'Medium' | 'High' | 'Critical'
  safetyScore: number // 0-100, higher is better
}

/**
 * Search for product recalls by product name or brand
 */
export async function searchRecalls(productName: string, brand?: string): Promise<RecallSearchResult> {
  try {
    // Build search query
    const searchTerms = [productName, brand].filter(Boolean).join(' ')

    // CPSC REST API endpoint - FREE, no auth required
    const url = `https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallTitle=${encodeURIComponent(searchTerms)}`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.warn(`CPSC API returned ${response.status}`)
      return createEmptyResult()
    }

    const recalls = await response.json() as CPSCRecall[]

    // Filter and score recalls
    const relevantRecalls = filterRelevantRecalls(recalls, productName, brand)
    const riskLevel = calculateRiskLevel(relevantRecalls)
    const safetyScore = calculateSafetyScore(relevantRecalls)

    return {
      recalls: relevantRecalls,
      hasRecalls: relevantRecalls.length > 0,
      recallCount: relevantRecalls.length,
      totalHazards: countHazards(relevantRecalls),
      latestRecallDate: getLatestRecallDate(relevantRecalls),
      riskLevel,
      safetyScore
    }
  } catch (error) {
    console.error('Error fetching CPSC recalls:', error)
    return createEmptyResult()
  }
}

/**
 * Get recalls by specific recall number
 */
export async function getRecallByNumber(recallNumber: string): Promise<CPSCRecall | null> {
  try {
    const url = `https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallNumber=${encodeURIComponent(recallNumber)}`

    const response = await fetch(url)
    if (!response.ok) return null

    const recalls = await response.json() as CPSCRecall[]
    return recalls[0] || null
  } catch (error) {
    console.error('Error fetching recall by number:', error)
    return null
  }
}

/**
 * Get recent recalls (last N days)
 */
export async function getRecentRecalls(days: number = 30): Promise<CPSCRecall[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0] // YYYY-MM-DD

    const url = `https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=${startDateStr}`

    const response = await fetch(url)
    if (!response.ok) return []

    const recalls = await response.json() as CPSCRecall[]
    return recalls || []
  } catch (error) {
    console.error('Error fetching recent recalls:', error)
    return []
  }
}

/**
 * Search by manufacturer/brand
 */
export async function searchByManufacturer(manufacturer: string): Promise<CPSCRecall[]> {
  try {
    const url = `https://www.saferproducts.gov/RestWebServices/Recall?format=json&manufacturerName=${encodeURIComponent(manufacturer)}`

    const response = await fetch(url)
    if (!response.ok) return []

    const recalls = await response.json() as CPSCRecall[]
    return recalls || []
  } catch (error) {
    console.error('Error fetching recalls by manufacturer:', error)
    return []
  }
}

// Helper functions

function createEmptyResult(): RecallSearchResult {
  return {
    recalls: [],
    hasRecalls: false,
    recallCount: 0,
    totalHazards: 0,
    riskLevel: 'None',
    safetyScore: 100
  }
}

function filterRelevantRecalls(recalls: CPSCRecall[], productName: string, brand?: string): CPSCRecall[] {
  if (!recalls || recalls.length === 0) return []

  const searchTerms = [productName.toLowerCase(), brand?.toLowerCase()].filter(Boolean)

  return recalls.filter(recall => {
    const title = recall.Title?.toLowerCase() || ''
    const description = recall.Description?.toLowerCase() || ''
    const products = recall.Products?.map(p => p.Name?.toLowerCase()).join(' ') || ''
    const manufacturers = recall.Manufacturers?.map(m => m.Name?.toLowerCase()).join(' ') || ''

    const combinedText = `${title} ${description} ${products} ${manufacturers}`

    return searchTerms.some(term => combinedText.includes(term))
  })
}

function calculateRiskLevel(recalls: CPSCRecall[]): 'None' | 'Low' | 'Medium' | 'High' | 'Critical' {
  if (recalls.length === 0) return 'None'

  const hasInjuries = recalls.some(r => r.Injuries && r.Injuries.length > 0)
  const recentRecalls = recalls.filter(r => {
    const recallDate = new Date(r.RecallDate)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    return recallDate > oneYearAgo
  })

  // Critical: Recent recalls with injuries
  if (recentRecalls.length > 0 && hasInjuries) return 'Critical'

  // High: Multiple recent recalls or recent recalls with hazards
  if (recentRecalls.length >= 3) return 'High'
  if (recentRecalls.length > 0 && recalls.some(r => r.Hazards && r.Hazards.length > 0)) return 'High'

  // Medium: Recent recalls
  if (recentRecalls.length > 0) return 'Medium'

  // Low: Only old recalls
  return 'Low'
}

function calculateSafetyScore(recalls: CPSCRecall[]): number {
  if (recalls.length === 0) return 100

  let score = 100

  // Deduct points for each recall
  score -= recalls.length * 10

  // Extra deductions for recent recalls
  const recentRecalls = recalls.filter(r => {
    const recallDate = new Date(r.RecallDate)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    return recallDate > oneYearAgo
  })
  score -= recentRecalls.length * 15

  // Extra deductions for injuries
  const totalInjuries = recalls.reduce((sum, r) => sum + (r.Injuries?.length || 0), 0)
  score -= totalInjuries * 5

  // Extra deductions for hazards
  const totalHazards = countHazards(recalls)
  score -= totalHazards * 3

  return Math.max(0, Math.min(100, score))
}

function countHazards(recalls: CPSCRecall[]): number {
  return recalls.reduce((sum, r) => sum + (r.Hazards?.length || 0), 0)
}

function getLatestRecallDate(recalls: CPSCRecall[]): string | undefined {
  if (recalls.length === 0) return undefined

  const dates = recalls.map(r => new Date(r.RecallDate)).filter(d => !isNaN(d.getTime()))
  if (dates.length === 0) return undefined

  const latest = new Date(Math.max(...dates.map(d => d.getTime())))
  return latest.toISOString().split('T')[0]
}

/**
 * Get safety parameters for Veritas Score
 */
export async function getSafetyParameters(productName: string, brand?: string) {
  const result = await searchRecalls(productName, brand)

  return {
    // Product Safety Category (5 parameters from CPSC)
    recallStatus: !result.hasRecalls,
    recallCount: result.recallCount,
    safetyViolations: result.totalHazards,
    safetyScore: result.safetyScore,
    riskLevel: result.riskLevel,
    latestRecallDate: result.latestRecallDate,
    recalls: result.recalls.slice(0, 5) // Top 5 most relevant recalls
  }
}

/**
 * Unified Free Data Sources API
 *
 * Combines all FREE API integrations (no authentication required)
 *
 * Usage:
 * GET /api/integrations/free?product=iPhone&brand=Apple
 *
 * Returns:
 * - CPSC Recalls (safety data)
 * - iFixit Repairability (sustainability data)
 * - Combined Veritas Score parameters
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSafetyParameters } from '@/lib/integrations/cpsc-recalls'
import { getSustainabilityParameters } from '@/lib/integrations/ifixit'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const product = searchParams.get('product')
    const brand = searchParams.get('brand')

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: product',
        usage: '/api/integrations/free?product=iPhone&brand=Apple'
      }, { status: 400 })
    }

    // Fetch all free data sources in parallel
    const [cpscData, ifixitData] = await Promise.all([
      getSafetyParameters(product, brand || undefined),
      getSustainabilityParameters(product, brand || undefined)
    ])

    // Combine parameters
    const combinedParameters = {
      // Safety parameters (from CPSC)
      safety: {
        recallStatus: cpscData.recallStatus,
        recallCount: cpscData.recallCount,
        safetyViolations: cpscData.safetyViolations,
        safetyScore: cpscData.safetyScore,
        riskLevel: cpscData.riskLevel,
        latestRecallDate: cpscData.latestRecallDate,
        topRecalls: cpscData.recalls
      },
      // Sustainability parameters (from iFixit)
      sustainability: {
        repairabilityScore: ifixitData.repairabilityScore,
        hasRepairGuides: ifixitData.hasRepairGuides,
        repairDifficulty: ifixitData.repairDifficulty,
        repairGuideCount: ifixitData.repairGuideCount,
        repairGuideRating: ifixitData.repairGuideRating,
        deviceInfo: ifixitData.deviceInfo,
        topRepairGuides: ifixitData.topGuides
      },
      // Metadata
      metadata: {
        dataSources: ['CPSC Recalls API', 'iFixit API'],
        totalCost: '$0 - All free APIs',
        parametersProvided: 12,
        coverage: {
          safety: ['Recalls', 'Safety Violations', 'Risk Level'],
          sustainability: ['Repairability', 'Repair Guides', 'Repair Difficulty']
        }
      }
    }

    return NextResponse.json({
      success: true,
      product,
      brand: brand || null,
      data: combinedParameters,
      sources: {
        cpsc: {
          status: 'success',
          hasData: cpscData.recallCount > 0 || cpscData.safetyScore === 100
        },
        ifixit: {
          status: 'success',
          hasData: ifixitData.hasRepairGuides
        }
      },
      cost: '$0 - Free APIs only',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Free integrations API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch free integration data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

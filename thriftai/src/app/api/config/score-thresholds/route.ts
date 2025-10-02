/**
 * Score Thresholds Configuration API
 *
 * GET /api/config/score-thresholds
 * Returns database-driven score thresholds for frontend display
 */

import { NextResponse } from 'next/server'
import { configService } from '@/lib/services/configService'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const thresholds = await configService.getScoreThresholds()

    return NextResponse.json({
      success: true,
      thresholds
    })
  } catch (error) {
    logger.error('Error fetching score thresholds config', { error })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch score thresholds'
      },
      { status: 500 }
    )
  }
}

/**
 * Clear Configuration Cache API
 *
 * POST /api/admin/clear-cache
 */

import { NextResponse } from 'next/server'
import { configService } from '@/lib/services/configService'
import { logger } from '@/lib/logger'

export async function POST() {
  try {
    configService.clearAllCache()

    logger.info('✅ Configuration cache cleared')

    return NextResponse.json({
      success: true,
      message: 'Configuration cache cleared successfully'
    })
  } catch (error) {
    logger.error('Error clearing cache', { error })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear cache'
      },
      { status: 500 }
    )
  }
}

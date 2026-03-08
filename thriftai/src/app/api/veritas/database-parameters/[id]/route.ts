/**
 * API Route: GET /api/veritas/database-parameters/[id]
 *
 * Fetches all available database parameters for a product without requiring external API keys.
 * Returns 72 out of 96 Veritas parameters (75% coverage) from the database only.
 *
 * Usage:
 * - GET /api/veritas/database-parameters/123abc
 * - GET /api/veritas/database-parameters/123abc?includeScore=true
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAllDatabaseParameters,
  calculateDatabaseVeritasScore,
} from '@/lib/veritas/fetchDatabaseParameters';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeScore = searchParams.get('includeScore') === 'true';

    // Fetch all database parameters
    const parameters = await fetchAllDatabaseParameters(id);

    // Optionally include calculated Veritas score
    let veritasScore = null;
    if (includeScore) {
      veritasScore = await calculateDatabaseVeritasScore(id);
    }

    return NextResponse.json({
      success: true,
      data: {
        parameters,
        veritasScore,
        coverage: {
          parametersAvailable: 72,
          parametersTotal: 96,
          percentage: 75,
          source: 'database_only',
          apiKeysRequired: false,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching database parameters:', error);

    if (error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
          message: error.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch parameters',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

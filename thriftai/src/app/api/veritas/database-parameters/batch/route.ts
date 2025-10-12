/**
 * API Route: POST /api/veritas/database-parameters/batch
 *
 * Fetches database parameters for multiple products in a single request.
 * Useful for search results, category pages, and product lists.
 *
 * Request body:
 * {
 *   "productIds": ["id1", "id2", "id3"],
 *   "includeScore": true (optional)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchMultipleProductParameters,
  calculateDatabaseVeritasScore,
} from '@/lib/veritas/fetchDatabaseParameters';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds, includeScore = false } = body;

    // Validate input
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          message: 'productIds must be a non-empty array',
        },
        { status: 400 }
      );
    }

    // Limit to 50 products per request
    if (productIds.length > 50) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many products',
          message: 'Maximum 50 products per request',
        },
        { status: 400 }
      );
    }

    // Fetch parameters for all products
    const parametersMap = await fetchMultipleProductParameters(productIds);

    // Convert Map to object for JSON response
    const results: any = {};
    for (const [productId, parameters] of parametersMap.entries()) {
      results[productId] = {
        parameters,
        veritasScore: null,
      };

      // Optionally include Veritas scores
      if (includeScore) {
        try {
          results[productId].veritasScore = await calculateDatabaseVeritasScore(productId);
        } catch (error) {
          console.error(`Failed to calculate score for product ${productId}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        requested: productIds.length,
        fetched: parametersMap.size,
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
    console.error('Error fetching batch parameters:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch batch parameters',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

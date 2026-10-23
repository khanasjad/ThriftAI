/**
 * Scraper Execution API
 *
 * Manually trigger product scraping and scoring.
 *
 * @route POST /api/scrapers/run
 */

import { NextRequest, NextResponse } from 'next/server';
import { createScraper } from '@/lib/scrapers/ProductScraper';
import { agentOrchestrator } from '@/lib/agents/AgentOrchestrator';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

interface ScrapeRequest {
  source?: 'ebay' | 'amazon';
  categories?: string[];
  maxPerCategory?: number;
  scoreProducts?: boolean;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: ScrapeRequest = await request.json();

    const source = body.source || 'ebay';
    const categories = body.categories || ['Electronics', 'Fashion', 'Shoes'];
    const maxPerCategory = body.maxPerCategory || 10;
    const scoreProducts = body.scoreProducts !== false;

    logger.info('Scraper API called', { source, categories, scoreProducts });

    // Create scraper
    const scraper = createScraper({
      source,
      categories,
      maxProductsPerCategory: maxPerCategory,
      interval: 60
    });

    // Scrape products
    const products = await scraper.scrape();

    if (products.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No products scraped',
        data: { productsScraped: 0 }
      });
    }

    // Save to database
    const savedCount = await scraper.saveProducts(products);

    // Score products if requested
    let scoredCount = 0;
    const scores: any[] = [];

    if (scoreProducts) {
      logger.info('Scoring scraped products', { count: savedCount });

      for (const product of products.slice(0, 5)) { // Score first 5 for demo
        try {
          const dbProduct = await prisma.product.findFirst({
            where: { externalId: product.externalId }
          });

          if (dbProduct) {
            const score = await agentOrchestrator.scoreProduct(dbProduct);

            // Update product with score
            await prisma.product.update({
              where: { id: dbProduct.id },
              data: {
                aiScore: score.veritasScore,
                updatedAt: new Date()
              }
            });

            scores.push({
              name: product.name,
              veritasScore: score.veritasScore,
              confidence: score.confidence
            });

            scoredCount++;
          }
        } catch (error) {
          logger.error('Failed to score product', { product: product.name, error });
        }
      }
    }

    const processingTime = Date.now() - startTime;

    logger.info('Scraper API completed', {
      productsScraped: products.length,
      productsSaved: savedCount,
      productsScored: scoredCount,
      processingTime
    });

    return NextResponse.json({
      success: true,
      data: {
        scraping: {
          source,
          categories,
          productsFound: products.length,
          productsSaved: savedCount
        },
        scoring: {
          productsScored: scoredCount,
          topScores: scores
        },
        metadata: {
          processingTime,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error('Scraper API error', {
      error: error instanceof Error ? error.message : String(error),
      processingTime
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Scraping failed',
        message: process.env.NODE_ENV === 'development'
          ? error instanceof Error ? error.message : String(error)
          : 'An error occurred while scraping products',
        metadata: {
          processingTime,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET method to retrieve scraper status
 */
export async function GET() {
  try {
    const totalProducts = await prisma.product.count({
      where: { isAvailable: true }
    });

    const scoredProducts = await prisma.product.count({
      where: {
        isAvailable: true,
        aiScore: { not: null }
      }
    });

    const avgScore = await prisma.product.aggregate({
      where: {
        isAvailable: true,
        aiScore: { not: null }
      },
      _avg: { aiScore: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        system: 'Product Scraping System',
        version: '2.0.0',
        status: 'ready',
        database: {
          totalProducts,
          scoredProducts,
          unscoredProducts: totalProducts - scoredProducts,
          avgVeritasScore: Math.round(avgScore._avg.aiScore || 0)
        },
        supportedSources: ['ebay', 'amazon']
      }
    });

  } catch (error) {
    logger.error('Scraper status API error', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve scraper status'
      },
      { status: 500 }
    );
  }
}

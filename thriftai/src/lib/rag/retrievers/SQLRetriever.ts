/**
 * SQL Retriever
 *
 * Retrieves products using traditional database queries.
 * Optimized for structured data and exact matches.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Document, BaseRetriever } from '../types';

export class SQLRetriever implements BaseRetriever {
  name = 'sql';
  weight = 0.25; // 25% weight in multi-source retrieval

  /**
   * Retrieve products using SQL queries
   */
  async retrieve(query: string, limit: number = 50): Promise<Document[]> {
    const startTime = Date.now();

    try {
      logger.info('SQL Retriever: Starting search', { query, limit });

      // Parse query for keywords
      const keywords = this.extractKeywords(query);
      const filters = this.extractFilters(query);

      logger.debug('SQL Retriever: Extracted keywords', { keywords, filters });

      // Build flexible where clause - search by each word
      const where: any = {
        isAvailable: true,
        OR: []
      };

      // Split query into words (don't filter by length or stop words for search)
      const searchWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);

      // Add search for each word
      searchWords.forEach(word => {
        where.OR.push(
          { name: { contains: word, mode: 'insensitive' } },
          { description: { contains: word, mode: 'insensitive' } },
          { brand: { contains: word, mode: 'insensitive' } },
          { category: { contains: word, mode: 'insensitive' } }
        );
      });

      // Ensure we have at least one condition
      if (where.OR.length === 0) {
        where.OR.push(
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        );
      }

      // Apply filters
      if (filters.priceRange) {
        where.price = {
          gte: filters.priceRange.min,
          lte: filters.priceRange.max
        };
      }

      if (filters.categories && filters.categories.length > 0) {
        where.category = { in: filters.categories };
      }

      if (filters.brands && filters.brands.length > 0) {
        where.brand = { in: filters.brands };
      }

      logger.debug('SQL Retriever: Executing query', {
        whereConditions: where.OR?.length || 0,
        hasFilters: !!(filters.priceRange || filters.categories || filters.brands)
      });

      // Execute query
      const products = await prisma.product.findMany({
        where,
        take: limit,
        orderBy: [
          { aiScore: 'desc' },
          { popularityScore: 'desc' },
          { viewCount: 'desc' }
        ],
        select: {
          id: true,
          name: true,
          brand: true,
          category: true,
          price: true,
          description: true,
          condition: true,
          aiScore: true,
          tags: true,
          stockQuantity: true
        }
      });

      const processingTime = Date.now() - startTime;

      logger.debug('SQL retrieval completed', {
        query,
        resultsCount: products.length,
        processingTime
      });

      // Convert to Document format with relevance scoring
      return products.map((product, index) => ({
        id: product.id,
        content: this.buildContent(product),
        score: this.calculateRelevanceScore(product, query, index),
        source: 'sql' as const,
        metadata: {
          productId: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          price: Number(product.price),
          aiScore: product.aiScore,
          condition: product.condition,
          inStock: product.stockQuantity > 0
        }
      }));
    } catch (error) {
      logger.error('SQL retrieval failed', {
        query,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.isStopWord(word));
  }

  /**
   * Extract structured filters from query
   */
  private extractFilters(query: string): {
    priceRange?: { min: number; max: number };
    categories?: string[];
    brands?: string[];
  } {
    const filters: any = {};

    // Extract price range
    const priceMatch = query.match(/under\s+\$?(\d+)|less\s+than\s+\$?(\d+)|below\s+\$?(\d+)/i);
    if (priceMatch) {
      const maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]);
      filters.priceRange = { min: 0, max: maxPrice };
    }

    const rangeMatch = query.match(/\$?(\d+)\s*-\s*\$?(\d+)/);
    if (rangeMatch) {
      filters.priceRange = {
        min: parseInt(rangeMatch[1]),
        max: parseInt(rangeMatch[2])
      };
    }

    // Extract categories (simple matching)
    const categoryKeywords = [
      'electronics', 'fashion', 'apparel', 'home', 'garden',
      'jewelry', 'watches', 'collectibles', 'art', 'sports'
    ];

    const matchedCategories = categoryKeywords.filter(cat =>
      query.toLowerCase().includes(cat)
    );

    if (matchedCategories.length > 0) {
      filters.categories = matchedCategories;
    }

    return filters;
  }

  /**
   * Calculate relevance score for SQL results
   */
  private calculateRelevanceScore(
    product: any,
    query: string,
    rank: number
  ): number {
    let score = 0;

    // Name match (highest weight)
    if (product.name?.toLowerCase().includes(query.toLowerCase())) {
      score += 0.5;
    }

    // Exact keyword matches
    const keywords = this.extractKeywords(query);
    const productText = [
      product.name,
      product.description,
      product.brand,
      product.category,
      ...(product.tags || [])
    ].join(' ').toLowerCase();

    keywords.forEach(keyword => {
      if (productText.includes(keyword)) {
        score += 0.1;
      }
    });

    // AI score contribution
    score += (product.aiScore || 0) / 1000;

    // Rank penalty
    score -= rank * 0.01;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Build content string from product
   */
  private buildContent(product: any): string {
    const parts: string[] = [];

    if (product.name) parts.push(`Product: ${product.name}`);
    if (product.brand) parts.push(`Brand: ${product.brand}`);
    if (product.category) parts.push(`Category: ${product.category}`);
    if (product.price) parts.push(`Price: $${product.price}`);
    if (product.aiScore) parts.push(`Quality Score: ${product.aiScore}/100`);
    if (product.description) {
      parts.push(`Description: ${product.description.substring(0, 200)}`);
    }

    return parts.join('. ');
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
      'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was',
      'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do',
      'does', 'did', 'will', 'would', 'should', 'could', 'may',
      'might', 'can', 'this', 'that', 'these', 'those'
    ]);

    return stopWords.has(word.toLowerCase());
  }
}

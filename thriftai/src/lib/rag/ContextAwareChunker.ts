/**
 * Context-Aware Chunking Service
 *
 * Splits products into semantic chunks for optimized RAG retrieval.
 * Uses semantic boundaries instead of fixed-size chunks.
 *
 * Chunk Types:
 * 1. Core - Essential product info (always retrieved)
 * 2. Veritas - Quality scoring breakdown
 * 3. Seller - Trust signals and seller info
 * 4. Specs - Technical specifications
 * 5. Reviews - Customer feedback summary
 *
 * @author Veritas AI Team
 * @version 2.0.0 (2026 Production)
 */

import { logger } from '@/lib/logger';
import {
  Chunk,
  ChunkType,
  ChunkMetadata,
  ProductContext,
  ChunkingStrategy
} from './types';

export class ContextAwareChunker {
  private strategy: ChunkingStrategy;

  constructor(strategy?: Partial<ChunkingStrategy>) {
    this.strategy = {
      maxTokensPerChunk: 500,
      overlapTokens: 50,
      preserveSemanticBoundaries: true,
      enableMetadataEnrichment: true,
      ...strategy
    };

    logger.info('ContextAwareChunker initialized', { strategy: this.strategy });
  }

  /**
   * Chunk a product into semantic pieces
   */
  async chunkProduct(context: ProductContext): Promise<Chunk[]> {
    const chunks: Chunk[] = [];
    const { product } = context;

    try {
      // Chunk 1: Core product information (ALWAYS NEEDED)
      chunks.push(
        this.createCoreChunk(context)
      );

      // Chunk 2: Veritas Score breakdown (HIGH VALUE)
      if (context.veritasScore) {
        chunks.push(
          this.createVeritasChunk(context)
        );
      }

      // Chunk 3: Seller trust signals
      if (context.seller) {
        chunks.push(
          this.createSellerChunk(context)
        );
      }

      // Chunk 4: Technical specifications
      if (context.dynamicSpecs) {
        chunks.push(
          this.createSpecsChunk(context)
        );
      }

      // Chunk 5: Reviews summary
      if (context.reviews && context.reviews.length > 0) {
        chunks.push(
          await this.createReviewsChunk(context)
        );
      }

      logger.debug('Product chunked', {
        productId: product.id,
        chunkCount: chunks.length,
        types: chunks.map(c => c.type)
      });

      return chunks;
    } catch (error) {
      logger.error('Failed to chunk product', {
        productId: product.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Chunk 1: Core product information
   * Essential details needed for any query
   */
  private createCoreChunk(context: ProductContext): Chunk {
    const { product } = context;

    const content = `
Product: ${product.name}
Brand: ${product.brand || 'Unknown'}
Category: ${product.category}
Price: $${product.price}
Condition: ${product.condition || 'New'}
${product.description ? `Description: ${this.truncate(product.description, 300)}` : ''}
Stock: ${product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
    `.trim();

    return {
      id: `${product.id}:core`,
      productId: product.id,
      type: 'core',
      content,
      metadata: {
        productId: product.id,
        productName: product.name,
        category: product.category,
        type: 'core',
        importance: 1.0, // Always most important
        price: Number(product.price),
        inStock: product.stockQuantity > 0,
        brand: product.brand || undefined
      },
      createdAt: new Date()
    };
  }

  /**
   * Chunk 2: Veritas Score breakdown
   * Quality scoring details for recommendations
   */
  private createVeritasChunk(context: ProductContext): Chunk {
    const { product, veritasScore } = context;

    if (!veritasScore) {
      throw new Error('Veritas score not provided');
    }

    const content = `
Veritas Quality Score: ${veritasScore.overallScore}/100
Confidence: ${Math.round(veritasScore.confidence * 100)}%

Category Breakdown:
${veritasScore.categories?.map((cat: any) =>
  `- ${cat.categoryName}: ${cat.categoryScore}/100 (weight: ${Math.round(cat.weight * 100)}%)`
).join('\n') || 'N/A'}

Data Quality: ${Math.round(veritasScore.dataQualityScore * 100)}%
Missing Fields: ${veritasScore.missingDataFields?.length || 0}
    `.trim();

    return {
      id: `${product.id}:veritas`,
      productId: product.id,
      type: 'veritas',
      content,
      metadata: {
        productId: product.id,
        productName: product.name,
        category: product.category,
        type: 'veritas',
        importance: 0.9,
        veritasScore: veritasScore.overallScore,
        confidence: veritasScore.confidence
      },
      createdAt: new Date()
    };
  }

  /**
   * Chunk 3: Seller trust signals
   * Seller reputation and reliability info
   */
  private createSellerChunk(context: ProductContext): Chunk {
    const { product, seller } = context;

    if (!seller) {
      throw new Error('Seller not provided');
    }

    const content = `
Seller: ${seller.businessName || seller.ownerName}
Rating: ${seller.rating}/5.0 (${seller.totalSales} sales)
Verified: ${seller.isVerified ? 'Yes' : 'No'}
Response Time: ${seller.avgResponseTimeHours || 24} hours
Delivery Rate: ${Math.round((seller.onTimeDeliveryRate || 0.95) * 100)}%
Customer Satisfaction: ${Math.round((seller.customerSatisfactionRate || 0.90) * 100)}%
Defect Rate: ${Math.round((seller.defectRate || 0.02) * 100)}%
    `.trim();

    return {
      id: `${product.id}:seller`,
      productId: product.id,
      type: 'seller',
      content,
      metadata: {
        productId: product.id,
        productName: product.name,
        category: product.category,
        type: 'seller',
        importance: 0.7,
        sellerId: product.sellerId,
        sellerRating: seller.rating,
        sellerVerified: seller.isVerified
      },
      createdAt: new Date()
    };
  }

  /**
   * Chunk 4: Technical specifications
   * Category-specific product specs
   */
  private createSpecsChunk(context: ProductContext): Chunk {
    const { product, dynamicSpecs } = context;

    if (!dynamicSpecs) {
      throw new Error('Dynamic specs not provided');
    }

    const specsText = Object.entries(dynamicSpecs)
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([key, value]) => {
        const label = this.formatKey(key);
        const formattedValue = this.formatValue(value);
        return `${label}: ${formattedValue}`;
      })
      .join('\n');

    const content = `
Technical Specifications:
${specsText}
    `.trim();

    return {
      id: `${product.id}:specs`,
      productId: product.id,
      type: 'specs',
      content,
      metadata: {
        productId: product.id,
        productName: product.name,
        category: product.category,
        type: 'specs',
        importance: 0.8,
        specsCount: Object.keys(dynamicSpecs).length
      },
      createdAt: new Date()
    };
  }

  /**
   * Chunk 5: Reviews summary
   * Aggregated customer feedback
   */
  private async createReviewsChunk(context: ProductContext): Promise<Chunk> {
    const { product, reviews } = context;

    if (!reviews || reviews.length === 0) {
      throw new Error('Reviews not provided');
    }

    // Calculate review stats
    const avgRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length;
    const sentiments = this.analyzeReviewSentiments(reviews);

    // Extract key themes (simplified)
    const positiveThemes = this.extractThemes(reviews.filter((r: any) => r.rating >= 4));
    const negativeThemes = this.extractThemes(reviews.filter((r: any) => r.rating <= 2));

    const content = `
Customer Reviews Summary:
Average Rating: ${avgRating.toFixed(1)}/5.0 (${reviews.length} reviews)

Sentiment Distribution:
- Positive: ${sentiments.positive}%
- Neutral: ${sentiments.neutral}%
- Negative: ${sentiments.negative}%

Common Positive Feedback:
${positiveThemes.slice(0, 3).map((t: string) => `- ${t}`).join('\n')}

Common Concerns:
${negativeThemes.slice(0, 3).map((t: string) => `- ${t}`).join('\n')}

Recent Review: "${reviews[0]?.comment?.substring(0, 150) || 'N/A'}..."
    `.trim();

    return {
      id: `${product.id}:reviews`,
      productId: product.id,
      type: 'reviews',
      content,
      metadata: {
        productId: product.id,
        productName: product.name,
        category: product.category,
        type: 'reviews',
        importance: 0.75,
        reviewCount: reviews.length,
        avgRating,
        sentiments
      },
      createdAt: new Date()
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  private formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private formatValue(value: any): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private analyzeReviewSentiments(reviews: any[]): {
    positive: number;
    neutral: number;
    negative: number;
  } {
    let positive = 0;
    let neutral = 0;
    let negative = 0;

    reviews.forEach(review => {
      if (review.rating >= 4) positive++;
      else if (review.rating === 3) neutral++;
      else negative++;
    });

    const total = reviews.length;
    return {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      negative: Math.round((negative / total) * 100)
    };
  }

  private extractThemes(reviews: any[]): string[] {
    // Simplified theme extraction (in production, use NLP)
    const keywords: Record<string, number> = {};

    reviews.forEach(review => {
      const comment = review.comment?.toLowerCase() || '';
      const words = comment.match(/\b\w{4,}\b/g) || [];

      words.forEach(word => {
        if (!this.isStopWord(word)) {
          keywords[word] = (keywords[word] || 0) + 1;
        }
      });
    });

    // Sort by frequency
    return Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'this', 'that', 'with', 'from', 'have', 'been',
      'would', 'could', 'should', 'about', 'which', 'there'
    ]);
    return stopWords.has(word);
  }

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Get chunking strategy
   */
  getStrategy(): ChunkingStrategy {
    return { ...this.strategy };
  }
}

// Export singleton
export const contextAwareChunker = new ContextAwareChunker();

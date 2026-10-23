/**
 * Product Enrichment Pipeline
 *
 * Batch processes products to generate:
 * - Semantic chunks (context-aware)
 * - Dense embeddings (OpenAI)
 * - Sparse vectors (BM25)
 * - AI quality scores (optional)
 *
 * This pipeline is designed to run periodically to enrich
 * products with AI-powered metadata for improved search.
 *
 * Usage:
 *   npm run enrich:products
 *   npm run enrich:products -- --batch-size=50
 *   npm run enrich:products -- --product-id=abc123
 *   npm run enrich:products -- --dry-run
 *
 * @author Veritas AI Team
 * @version 2.0.0
 */

import { prisma } from '@/lib/prisma';
import { qdrantClient } from '@/lib/vector/qdrant/QdrantClient';
import { PRODUCTS_COLLECTION_CONFIG } from '@/lib/vector/qdrant/config';
import { contextAwareChunker } from '@/lib/rag/ContextAwareChunker';
import { embeddingService } from '@/lib/services/embeddingService';
import { bm25Generator } from '@/lib/rag/BM25SparseVectorGenerator';
import { logger } from '@/lib/logger';
import { VectorPoint } from '@/lib/vector/qdrant/types';

interface EnrichmentStats {
  totalProducts: number;
  enrichedProducts: number;
  failedProducts: number;
  totalChunks: number;
  generatedEmbeddings: number;
  generatedSparseVectors: number;
  startTime: number;
  endTime?: number;
  errors: Array<{ productId: string; error: string }>;
}

interface EnrichmentOptions {
  productId?: string;
  batchSize?: number;
  dryRun?: boolean;
  enableChunking?: boolean;
  enableEmbeddings?: boolean;
  enableSparseVectors?: boolean;
  enableAIScoring?: boolean;
  startFrom?: number;
  limit?: number;
}

class ProductEnrichmentPipeline {
  private stats: EnrichmentStats = {
    totalProducts: 0,
    enrichedProducts: 0,
    failedProducts: 0,
    totalChunks: 0,
    generatedEmbeddings: 0,
    generatedSparseVectors: 0,
    startTime: Date.now(),
    errors: []
  };

  /**
   * Execute enrichment pipeline
   */
  async enrich(options: EnrichmentOptions = {}): Promise<EnrichmentStats> {
    const {
      productId,
      batchSize = 50,
      dryRun = false,
      enableChunking = true,
      enableEmbeddings = true,
      enableSparseVectors = true,
      enableAIScoring = false,
      startFrom = 0,
      limit
    } = options;

    logger.info('Starting product enrichment', {
      productId,
      batchSize,
      dryRun,
      enableChunking,
      enableEmbeddings,
      enableSparseVectors
    });

    try {
      // Step 1: Build BM25 statistics if needed
      if (enableSparseVectors && !productId) {
        await this.buildBM25Statistics();
      }

      // Step 2: Single product or batch?
      if (productId) {
        await this.enrichSingleProduct(productId, options);
      } else {
        await this.enrichBatch(options);
      }

      this.stats.endTime = Date.now();

      // Step 3: Print summary
      this.printSummary();

      return this.stats;
    } catch (error) {
      logger.error('Enrichment failed', {
        error: error instanceof Error ? error.message : String(error),
        stats: this.stats
      });
      throw error;
    }
  }

  /**
   * Enrich a single product
   */
  private async enrichSingleProduct(
    productId: string,
    options: EnrichmentOptions
  ): Promise<void> {
    logger.info('Enriching single product', { productId });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: true,
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    this.stats.totalProducts = 1;

    await this.enrichProduct(product, options);
  }

  /**
   * Enrich products in batches
   */
  private async enrichBatch(options: EnrichmentOptions): Promise<void> {
    const {
      batchSize = 50,
      startFrom = 0,
      limit
    } = options;

    // Get total count
    const totalCount = await prisma.product.count({
      where: { isAvailable: true }
    });

    this.stats.totalProducts = limit ? Math.min(totalCount, limit) : totalCount;

    logger.info(`Found ${this.stats.totalProducts} products to enrich`);

    let offset = startFrom;
    let batch = 1;

    while (offset < this.stats.totalProducts) {
      const currentBatchSize = Math.min(
        batchSize,
        this.stats.totalProducts - offset
      );

      logger.info(`Processing batch ${batch}`, {
        offset,
        batchSize: currentBatchSize,
        progress: `${offset}/${this.stats.totalProducts}`
      });

      // Fetch batch
      const products = await prisma.product.findMany({
        skip: offset,
        take: currentBatchSize,
        where: { isAvailable: true },
        include: {
          seller: true,
          reviews: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      // Process batch
      for (const product of products) {
        await this.enrichProduct(product, options);
      }

      offset += currentBatchSize;
      batch++;

      // Rate limiting
      if (offset < this.stats.totalProducts) {
        await this.sleep(100);
      }
    }
  }

  /**
   * Enrich a single product
   */
  private async enrichProduct(
    product: any,
    options: EnrichmentOptions
  ): Promise<void> {
    const {
      dryRun = false,
      enableChunking = true,
      enableEmbeddings = true,
      enableSparseVectors = true,
      enableAIScoring = false
    } = options;

    try {
      const points: VectorPoint[] = [];

      // Generate chunks
      if (enableChunking) {
        const chunks = await contextAwareChunker.chunkProduct({
          id: product.id,
          name: product.name,
          brand: product.brand || undefined,
          category: product.category || undefined,
          price: Number(product.price),
          description: product.description || undefined,
          condition: product.condition || undefined,
          veritasScore: product.aiScore
            ? {
                overall: product.aiScore,
                quality: product.aiScore,
                value: product.aiScore,
                authenticity: product.aiScore,
                confidence: 0.95
              }
            : undefined,
          seller: product.seller
            ? {
                id: product.seller.id,
                username: product.seller.username,
                rating: product.seller.rating || undefined,
                totalSales: product.seller.totalSales || undefined
              }
            : undefined,
          dynamicSpecs: product.specifications as Record<string, any> | undefined,
          reviews: product.reviews?.map((r: any) => ({
            rating: r.rating,
            comment: r.comment || '',
            verified: r.verified || false
          }))
        });

        this.stats.totalChunks += chunks.length;

        // Generate embeddings and sparse vectors for each chunk
        for (const chunk of chunks) {
          let vector: number[] | { dense: number[]; sparse?: Record<string, number> };

          if (enableEmbeddings) {
            const denseVector = await embeddingService.generateQueryEmbedding(chunk.content);
            this.stats.generatedEmbeddings++;

            if (enableSparseVectors) {
              const sparseVector = bm25Generator.generateQdrantSparseVector(chunk.content);
              this.stats.generatedSparseVectors++;

              vector = {
                dense: denseVector,
                sparse: sparseVector
              };
            } else {
              vector = denseVector;
            }
          } else {
            // Skip this chunk if embeddings are disabled
            continue;
          }

          points.push({
            id: chunk.id,
            vector,
            payload: {
              productId: product.id,
              chunkType: chunk.type,
              content: chunk.content,
              name: product.name,
              brand: product.brand,
              category: product.category,
              price: Number(product.price),
              aiScore: product.aiScore,
              condition: product.condition,
              isAvailable: product.isAvailable,
              stockQuantity: product.stockQuantity,
              viewCount: product.viewCount,
              popularityScore: product.popularityScore,
              createdAt: product.createdAt.toISOString(),
              updatedAt: product.updatedAt.toISOString(),
              metadata: chunk.metadata
            }
          });
        }
      }

      // Upload to Qdrant
      if (!dryRun && points.length > 0) {
        await qdrantClient.batchUpsert(
          PRODUCTS_COLLECTION_CONFIG.name,
          points,
          { wait: true }
        );
      }

      // Update AI score (optional)
      if (enableAIScoring && !dryRun) {
        await this.generateAIScore(product);
      }

      this.stats.enrichedProducts++;
    } catch (error) {
      logger.error('Product enrichment failed', {
        productId: product.id,
        error: error instanceof Error ? error.message : String(error)
      });

      this.stats.failedProducts++;
      this.stats.errors.push({
        productId: product.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Build BM25 statistics from product corpus
   */
  private async buildBM25Statistics(): Promise<void> {
    logger.info('Building BM25 statistics');

    // Fetch all product texts
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      select: {
        name: true,
        description: true,
        brand: true,
        category: true
      },
      take: 10000 // Limit to 10K for statistics
    });

    const documents = products.map(p =>
      [p.name, p.brand, p.category, p.description].filter(Boolean).join(' ')
    );

    await bm25Generator.buildFromCorpus(documents);

    logger.info('BM25 statistics built', {
      documentCount: documents.length,
      stats: bm25Generator.getStatistics()
    });
  }

  /**
   * Generate AI quality score (placeholder)
   */
  private async generateAIScore(product: any): Promise<void> {
    // TODO: Implement AI scoring logic
    // This would use an LLM to analyze product quality based on:
    // - Description completeness
    // - Price vs market average
    // - Seller reputation
    // - Review sentiment
    // - Product condition

    logger.debug('AI scoring not implemented yet', {
      productId: product.id
    });
  }

  /**
   * Print enrichment summary
   */
  private printSummary(): void {
    const duration = this.stats.endTime
      ? (this.stats.endTime - this.stats.startTime) / 1000
      : 0;

    const successRate = this.stats.totalProducts > 0
      ? (this.stats.enrichedProducts / this.stats.totalProducts) * 100
      : 0;

    console.log('\n' + '='.repeat(60));
    console.log('ENRICHMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Products:        ${this.stats.totalProducts}`);
    console.log(`Enriched:              ${this.stats.enrichedProducts}`);
    console.log(`Failed:                ${this.stats.failedProducts}`);
    console.log(`Success Rate:          ${successRate.toFixed(2)}%`);
    console.log('-'.repeat(60));
    console.log(`Total Chunks:          ${this.stats.totalChunks}`);
    console.log(`Embeddings Generated:  ${this.stats.generatedEmbeddings}`);
    console.log(`Sparse Vectors:        ${this.stats.generatedSparseVectors}`);
    console.log('-'.repeat(60));
    console.log(`Duration:              ${duration.toFixed(2)}s`);
    console.log(`Throughput:            ${(this.stats.enrichedProducts / duration).toFixed(2)} products/s`);
    console.log('='.repeat(60));

    if (this.stats.errors.length > 0) {
      console.log('\nERRORS:');
      this.stats.errors.slice(0, 10).forEach(err => {
        console.log(`  - Product ${err.productId}: ${err.error}`);
      });

      if (this.stats.errors.length > 10) {
        console.log(`  ... and ${this.stats.errors.length - 10} more errors`);
      }
    }

    console.log('');
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const options: EnrichmentOptions = {
    batchSize: 50,
    dryRun: false,
    enableChunking: true,
    enableEmbeddings: true,
    enableSparseVectors: true,
    enableAIScoring: false
  };

  // Parse arguments
  for (const arg of args) {
    if (arg.startsWith('--product-id=')) {
      options.productId = arg.split('=')[1];
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1]);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--no-chunking') {
      options.enableChunking = false;
    } else if (arg === '--no-embeddings') {
      options.enableEmbeddings = false;
    } else if (arg === '--no-sparse') {
      options.enableSparseVectors = false;
    } else if (arg === '--enable-ai-scoring') {
      options.enableAIScoring = true;
    } else if (arg.startsWith('--start-from=')) {
      options.startFrom = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1]);
    }
  }

  console.log('\nProduct Enrichment Pipeline');
  console.log('='.repeat(60));
  console.log('Options:', JSON.stringify(options, null, 2));
  console.log('='.repeat(60) + '\n');

  if (options.dryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be written\n');
  }

  const pipeline = new ProductEnrichmentPipeline();

  try {
    await pipeline.enrich(options);
    console.log('✅ Enrichment completed successfully\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Enrichment failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ProductEnrichmentPipeline };

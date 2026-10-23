/**
 * Reciprocal Rank Fusion (RRF)
 *
 * State-of-the-art fusion algorithm for combining multiple retrieval sources.
 * Used in production by Google, OpenAI, and other top AI companies.
 *
 * Formula: score(d) = Σ(weight_i / (k + rank_i(d)))
 * Where:
 * - k = constant (typically 60)
 * - rank_i(d) = rank of document d in source i
 * - weight_i = weight of source i
 *
 * Benefits vs. simple score combination:
 * - Rank-based (robust to score distribution differences)
 * - Handles missing documents gracefully
 * - No score normalization needed
 * - Proven in production (2026 standard)
 *
 * @author Veritas AI Team
 * @version 2.0.0
 */

import { Document } from '../types';
import { logger } from '@/lib/logger';

export interface RRFConfig {
  k: number;              // RRF constant (default: 60)
  weights?: number[];     // Source weights (optional)
  minScore?: number;      // Minimum score threshold
}

export interface RRFResult {
  document: Document;
  rrfScore: number;
  sourceRanks: Record<string, number>;
  sourcesCount: number;
}

export class ReciprocalRankFusion {
  private config: Required<RRFConfig>;

  constructor(config?: Partial<RRFConfig>) {
    this.config = {
      k: 60,
      weights: [],
      minScore: 0.0,
      ...config
    };

    logger.info('RRF initialized', { config: this.config });
  }

  /**
   * Fuse multiple retrieval result sets using RRF
   *
   * @param resultSets Array of document lists from different sources
   * @param weights Optional weights for each source
   * @returns Fused and ranked documents
   */
  fuse(
    resultSets: Document[][],
    weights?: number[]
  ): RRFResult[] {
    const startTime = Date.now();

    // Use provided weights or default to equal weights
    const sourceWeights = weights || this.config.weights ||
      Array(resultSets.length).fill(1.0 / resultSets.length);

    // Validate weights
    if (sourceWeights.length !== resultSets.length) {
      throw new Error(
        `Weights length (${sourceWeights.length}) must match result sets length (${resultSets.length})`
      );
    }

    // Normalize weights to sum to 1.0
    const totalWeight = sourceWeights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = sourceWeights.map(w => w / totalWeight);

    // Build document rank map
    const docScores = new Map<string, {
      document: Document;
      rrfScore: number;
      sourceRanks: Record<string, number>;
      sourcesCount: number;
    }>();

    // Process each result set
    resultSets.forEach((results, sourceIdx) => {
      const weight = normalizedWeights[sourceIdx];

      results.forEach((doc, rank) => {
        // RRF formula: weight / (k + rank)
        const rrfContribution = weight / (this.config.k + rank + 1);

        const existing = docScores.get(doc.id);

        if (existing) {
          // Document exists in multiple sources - boost score
          existing.rrfScore += rrfContribution;
          existing.sourceRanks[`source_${sourceIdx}`] = rank;
          existing.sourcesCount += 1;
        } else {
          // New document
          docScores.set(doc.id, {
            document: doc,
            rrfScore: rrfContribution,
            sourceRanks: { [`source_${sourceIdx}`]: rank },
            sourcesCount: 1
          });
        }
      });
    });

    // Convert to array and sort by RRF score
    const fusedResults = Array.from(docScores.values())
      .filter(result => result.rrfScore >= this.config.minScore)
      .sort((a, b) => b.rrfScore - a.rrfScore);

    const processingTime = Date.now() - startTime;

    logger.debug('RRF fusion completed', {
      inputSources: resultSets.length,
      totalDocuments: resultSets.reduce((sum, set) => sum + set.length, 0),
      fusedDocuments: fusedResults.length,
      processingTime
    });

    return fusedResults;
  }

  /**
   * Fuse with named sources for better tracking
   */
  fuseNamed(
    namedResults: Record<string, Document[]>,
    weights?: Record<string, number>
  ): RRFResult[] {
    const sourceNames = Object.keys(namedResults);
    const resultSets = sourceNames.map(name => namedResults[name]);

    const sourceWeights = sourceNames.map(name =>
      weights?.[name] ?? 1.0 / sourceNames.length
    );

    const results = this.fuse(resultSets, sourceWeights);

    // Update source ranks with actual source names
    results.forEach(result => {
      const newSourceRanks: Record<string, number> = {};

      Object.entries(result.sourceRanks).forEach(([key, rank]) => {
        const sourceIdx = parseInt(key.split('_')[1]);
        const sourceName = sourceNames[sourceIdx];
        newSourceRanks[sourceName] = rank;
      });

      result.sourceRanks = newSourceRanks;
    });

    return results;
  }

  /**
   * Calculate diversity score (how many sources contributed)
   */
  calculateDiversityScore(results: RRFResult[]): number {
    if (results.length === 0) return 0;

    const avgSourcesPerDoc = results.reduce(
      (sum, r) => sum + r.sourcesCount, 0
    ) / results.length;

    return avgSourcesPerDoc;
  }

  /**
   * Get top K results
   */
  topK(results: RRFResult[], k: number): RRFResult[] {
    return results.slice(0, k);
  }

  /**
   * Filter by minimum number of sources
   */
  filterBySourceCount(results: RRFResult[], minSources: number): RRFResult[] {
    return results.filter(r => r.sourcesCount >= minSources);
  }

  /**
   * Get configuration
   */
  getConfig(): Required<RRFConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RRFConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('RRF config updated', { newConfig: this.config });
  }
}

/**
 * Utility: Convert RRF results back to Documents
 */
export function toDocuments(results: RRFResult[]): Document[] {
  return results.map(r => ({
    ...r.document,
    score: r.rrfScore, // Override with RRF score
    metadata: {
      ...r.document.metadata,
      rrfScore: r.rrfScore,
      sourceRanks: r.sourceRanks,
      sourcesCount: r.sourcesCount
    }
  }));
}

/**
 * Utility: Weighted Sum Fusion (alternative to RRF)
 */
export function weightedSumFusion(
  resultSets: Document[][],
  weights: number[]
): Document[] {
  const docScores = new Map<string, { document: Document; score: number }>();

  resultSets.forEach((results, sourceIdx) => {
    const weight = weights[sourceIdx] || 1.0;

    results.forEach(doc => {
      const weightedScore = doc.score * weight;
      const existing = docScores.get(doc.id);

      if (existing) {
        existing.score += weightedScore;
      } else {
        docScores.set(doc.id, {
          document: doc,
          score: weightedScore
        });
      }
    });
  });

  return Array.from(docScores.values())
    .map(({ document, score }) => ({ ...document, score }))
    .sort((a, b) => b.score - a.score);
}

// Export singleton with default config
export const rrf = new ReciprocalRankFusion();

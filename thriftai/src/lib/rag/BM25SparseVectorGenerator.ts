/**
 * BM25 Sparse Vector Generator
 *
 * Generates sparse vectors for hybrid search using BM25 algorithm.
 * BM25 is a ranking function that scores documents based on term frequency
 * and inverse document frequency with saturation.
 *
 * Use Cases:
 * - Keyword-based retrieval alongside semantic search
 * - Exact term matching (product names, brands, model numbers)
 * - Multi-lingual search (works without embeddings)
 * - Low-latency searches (no embedding API calls)
 *
 * Formula:
 * BM25(D,Q) = Σ IDF(qi) * (f(qi,D) * (k1+1)) / (f(qi,D) + k1 * (1-b+b*|D|/avgdl))
 *
 * Where:
 * - f(qi,D) = term frequency of qi in document D
 * - IDF(qi) = inverse document frequency of qi
 * - |D| = document length
 * - avgdl = average document length
 * - k1, b = tuning parameters
 *
 * @author Veritas AI Team
 * @version 2.0.0
 */

import { logger } from '@/lib/logger';

export interface BM25Config {
  k1?: number; // Term frequency saturation (default: 1.5)
  b?: number;  // Length normalization (default: 0.75)
  enableStemming?: boolean;
  enableStopWords?: boolean;
  minTermLength?: number;
  maxTerms?: number; // Max terms in sparse vector
}

export interface TermStatistics {
  term: string;
  frequency: number;
  idf: number;
  bm25Score: number;
}

export interface SparseVector {
  indices: number[];
  values: number[];
  terms?: Record<string, number>; // For debugging
}

export class BM25SparseVectorGenerator {
  private config: Required<BM25Config>;
  private vocabulary: Map<string, number>; // term -> term_id
  private documentFrequency: Map<string, number>; // term -> doc_count
  private totalDocuments: number = 0;
  private averageDocumentLength: number = 0;

  // English stop words
  private stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these',
    'those', 'it', 'its', 'they', 'them', 'their'
  ]);

  constructor(config?: Partial<BM25Config>) {
    this.config = {
      k1: 1.5,
      b: 0.75,
      enableStemming: false,
      enableStopWords: true,
      minTermLength: 2,
      maxTerms: 100,
      ...config
    };

    this.vocabulary = new Map();
    this.documentFrequency = new Map();

    logger.info('BM25 Sparse Vector Generator initialized', {
      config: this.config
    });
  }

  /**
   * Build vocabulary and statistics from corpus
   */
  async buildFromCorpus(documents: string[]): Promise<void> {
    logger.info('Building BM25 statistics from corpus', {
      documentCount: documents.length
    });

    this.totalDocuments = documents.length;
    let totalLength = 0;

    // Reset
    this.vocabulary.clear();
    this.documentFrequency.clear();

    // Build vocabulary and document frequency
    for (const doc of documents) {
      const terms = this.tokenize(doc);
      const uniqueTerms = new Set(terms);

      totalLength += terms.length;

      // Add to vocabulary
      for (const term of uniqueTerms) {
        if (!this.vocabulary.has(term)) {
          this.vocabulary.set(term, this.vocabulary.size);
        }

        // Update document frequency
        const df = this.documentFrequency.get(term) || 0;
        this.documentFrequency.set(term, df + 1);
      }
    }

    this.averageDocumentLength = totalLength / documents.length;

    logger.info('BM25 statistics built', {
      vocabularySize: this.vocabulary.size,
      totalDocuments: this.totalDocuments,
      averageDocumentLength: this.averageDocumentLength.toFixed(2)
    });
  }

  /**
   * Generate sparse vector for a query or document
   */
  generateSparseVector(text: string): SparseVector {
    const terms = this.tokenize(text);
    const termFrequency = this.calculateTermFrequency(terms);
    const documentLength = terms.length;

    // Calculate BM25 scores for each term
    const termScores: Array<{ termId: number; term: string; score: number }> = [];

    for (const [term, tf] of termFrequency.entries()) {
      const termId = this.vocabulary.get(term);
      if (termId === undefined) {
        // Term not in vocabulary, skip
        continue;
      }

      const idf = this.calculateIDF(term);
      const bm25 = this.calculateBM25(tf, idf, documentLength);

      termScores.push({ termId, term, score: bm25 });
    }

    // Sort by score and take top K
    termScores.sort((a, b) => b.score - a.score);
    const topTerms = termScores.slice(0, this.config.maxTerms);

    // Build sparse vector
    const indices = topTerms.map(t => t.termId);
    const values = topTerms.map(t => t.score);
    const terms: Record<string, number> = {};

    topTerms.forEach(t => {
      terms[t.term] = t.score;
    });

    return { indices, values, terms };
  }

  /**
   * Generate sparse vector for Qdrant (dictionary format)
   */
  generateQdrantSparseVector(text: string): Record<string, number> {
    const sparse = this.generateSparseVector(text);
    const result: Record<string, number> = {};

    sparse.indices.forEach((index, i) => {
      result[index.toString()] = sparse.values[i];
    });

    return result;
  }

  /**
   * Get term statistics for a text
   */
  getTermStatistics(text: string): TermStatistics[] {
    const terms = this.tokenize(text);
    const termFrequency = this.calculateTermFrequency(terms);
    const documentLength = terms.length;

    const stats: TermStatistics[] = [];

    for (const [term, tf] of termFrequency.entries()) {
      const idf = this.calculateIDF(term);
      const bm25 = this.calculateBM25(tf, idf, documentLength);

      stats.push({
        term,
        frequency: tf,
        idf,
        bm25Score: bm25
      });
    }

    return stats.sort((a, b) => b.bm25Score - a.bm25Score);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Tokenize text into terms
   */
  private tokenize(text: string): string[] {
    // Convert to lowercase
    let normalized = text.toLowerCase();

    // Remove special characters except spaces
    normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');

    // Split into terms
    let terms = normalized.split(/\s+/).filter(t => t.length >= this.config.minTermLength);

    // Remove stop words if enabled
    if (this.config.enableStopWords) {
      terms = terms.filter(t => !this.stopWords.has(t));
    }

    // Apply stemming if enabled
    if (this.config.enableStemming) {
      terms = terms.map(t => this.stem(t));
    }

    return terms;
  }

  /**
   * Calculate term frequency
   */
  private calculateTermFrequency(terms: string[]): Map<string, number> {
    const tf = new Map<string, number>();

    for (const term of terms) {
      const count = tf.get(term) || 0;
      tf.set(term, count + 1);
    }

    return tf;
  }

  /**
   * Calculate IDF (Inverse Document Frequency)
   */
  private calculateIDF(term: string): number {
    const df = this.documentFrequency.get(term) || 0;

    if (df === 0) {
      // Term not in corpus, use minimum IDF
      return 0;
    }

    // IDF formula with smoothing: log((N - df + 0.5) / (df + 0.5) + 1)
    const idf = Math.log(
      (this.totalDocuments - df + 0.5) / (df + 0.5) + 1
    );

    return Math.max(0, idf);
  }

  /**
   * Calculate BM25 score
   */
  private calculateBM25(
    termFrequency: number,
    idf: number,
    documentLength: number
  ): number {
    const { k1, b } = this.config;

    // BM25 formula
    const numerator = termFrequency * (k1 + 1);
    const denominator = termFrequency + k1 * (
      1 - b + b * (documentLength / this.averageDocumentLength)
    );

    return idf * (numerator / denominator);
  }

  /**
   * Simple Porter stemmer (basic version)
   */
  private stem(word: string): string {
    // Very basic stemming rules
    // For production, use a proper stemming library like 'natural' or 'snowball'

    // Remove common suffixes
    if (word.endsWith('ing') && word.length > 5) {
      return word.slice(0, -3);
    }
    if (word.endsWith('ed') && word.length > 4) {
      return word.slice(0, -2);
    }
    if (word.endsWith('s') && word.length > 3 && !word.endsWith('ss')) {
      return word.slice(0, -1);
    }
    if (word.endsWith('ly') && word.length > 4) {
      return word.slice(0, -2);
    }

    return word;
  }

  /**
   * Save statistics to file (for persistence)
   */
  async saveStatistics(filePath: string): Promise<void> {
    const stats = {
      config: this.config,
      totalDocuments: this.totalDocuments,
      averageDocumentLength: this.averageDocumentLength,
      vocabulary: Array.from(this.vocabulary.entries()),
      documentFrequency: Array.from(this.documentFrequency.entries())
    };

    const fs = await import('fs/promises');
    await fs.writeFile(filePath, JSON.stringify(stats, null, 2));

    logger.info('BM25 statistics saved', { filePath });
  }

  /**
   * Load statistics from file
   */
  async loadStatistics(filePath: string): Promise<void> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = JSON.parse(content);

    this.totalDocuments = stats.totalDocuments;
    this.averageDocumentLength = stats.averageDocumentLength;
    this.vocabulary = new Map(stats.vocabulary);
    this.documentFrequency = new Map(stats.documentFrequency);

    logger.info('BM25 statistics loaded', {
      filePath,
      vocabularySize: this.vocabulary.size
    });
  }

  /**
   * Get current statistics
   */
  getStatistics(): {
    vocabularySize: number;
    totalDocuments: number;
    averageDocumentLength: number;
    topTerms: Array<{ term: string; documentFrequency: number }>;
  } {
    const topTerms = Array.from(this.documentFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([term, df]) => ({ term, documentFrequency: df }));

    return {
      vocabularySize: this.vocabulary.size,
      totalDocuments: this.totalDocuments,
      averageDocumentLength: this.averageDocumentLength,
      topTerms
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BM25Config>): void {
    this.config = { ...this.config, ...config };
    logger.info('BM25 config updated', { newConfig: this.config });
  }
}

// Export singleton (must build from corpus before using)
export const bm25Generator = new BM25SparseVectorGenerator();

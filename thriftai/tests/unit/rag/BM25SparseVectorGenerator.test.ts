/**
 * Tests for BM25 Sparse Vector Generator
 *
 * @jest-environment node
 */

import { BM25SparseVectorGenerator } from '@/lib/rag/BM25SparseVectorGenerator';

describe('BM25SparseVectorGenerator', () => {
  let generator: BM25SparseVectorGenerator;

  beforeEach(() => {
    generator = new BM25SparseVectorGenerator({
      k1: 1.5,
      b: 0.75,
      enableStopWords: true,
      minTermLength: 2
    });
  });

  describe('buildFromCorpus', () => {
    it('should build vocabulary from corpus', async () => {
      const corpus = [
        'laptop computer macbook pro',
        'laptop dell windows computer',
        'tablet ipad apple'
      ];

      await generator.buildFromCorpus(corpus);

      const stats = generator.getStatistics();
      expect(stats.totalDocuments).toBe(3);
      expect(stats.vocabularySize).toBeGreaterThan(0);
    });
  });

  describe('generateSparseVector', () => {
    beforeEach(async () => {
      const corpus = [
        'laptop computer macbook pro',
        'laptop dell windows computer',
        'tablet ipad apple',
        'smartphone iphone android',
        'desktop computer tower'
      ];

      await generator.buildFromCorpus(corpus);
    });

    it('should generate sparse vector for query', () => {
      const query = 'laptop computer';
      const sparse = generator.generateSparseVector(query);

      expect(sparse.indices.length).toBeGreaterThan(0);
      expect(sparse.values.length).toBe(sparse.indices.length);
      expect(sparse.terms).toBeDefined();
    });

    it('should handle empty query', () => {
      const sparse = generator.generateSparseVector('');
      expect(sparse.indices.length).toBe(0);
      expect(sparse.values.length).toBe(0);
    });

    it('should filter stop words when enabled', () => {
      const query = 'the laptop is great';
      const sparse = generator.generateSparseVector(query);

      // 'the' and 'is' should be filtered out
      expect(sparse.terms).not.toHaveProperty('the');
      expect(sparse.terms).not.toHaveProperty('is');
      expect(sparse.terms).toHaveProperty('laptop');
    });

    it('should respect maxTerms limit', () => {
      const longQuery = Array(200).fill('laptop').join(' ');
      const sparse = generator.generateSparseVector(longQuery);

      expect(sparse.indices.length).toBeLessThanOrEqual(100); // default maxTerms
    });
  });

  describe('generateQdrantSparseVector', () => {
    beforeEach(async () => {
      const corpus = ['laptop computer', 'tablet device'];
      await generator.buildFromCorpus(corpus);
    });

    it('should generate Qdrant-compatible format', () => {
      const query = 'laptop';
      const qdrantSparse = generator.generateQdrantSparseVector(query);

      expect(typeof qdrantSparse).toBe('object');

      // All keys should be numeric strings
      Object.keys(qdrantSparse).forEach(key => {
        expect(!isNaN(parseInt(key))).toBe(true);
      });

      // All values should be numbers
      Object.values(qdrantSparse).forEach(value => {
        expect(typeof value).toBe('number');
      });
    });
  });

  describe('getTermStatistics', () => {
    beforeEach(async () => {
      const corpus = [
        'laptop laptop computer',
        'computer desktop',
        'laptop notebook'
      ];

      await generator.buildFromCorpus(corpus);
    });

    it('should return term statistics', () => {
      const query = 'laptop computer';
      const stats = generator.getTermStatistics(query);

      expect(stats.length).toBeGreaterThan(0);
      expect(stats[0]).toHaveProperty('term');
      expect(stats[0]).toHaveProperty('frequency');
      expect(stats[0]).toHaveProperty('idf');
      expect(stats[0]).toHaveProperty('bm25Score');
    });

    it('should sort by BM25 score', () => {
      const query = 'laptop laptop computer';
      const stats = generator.getTermStatistics(query);

      // Should be sorted descending
      for (let i = 1; i < stats.length; i++) {
        expect(stats[i - 1].bm25Score).toBeGreaterThanOrEqual(stats[i].bm25Score);
      }
    });
  });
});

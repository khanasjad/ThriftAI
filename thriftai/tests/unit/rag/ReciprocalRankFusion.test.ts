/**
 * Tests for Reciprocal Rank Fusion
 *
 * @jest-environment node
 */

import { ReciprocalRankFusion } from '@/lib/rag/fusion/ReciprocalRankFusion';
import { Document } from '@/lib/rag/types';

describe('ReciprocalRankFusion', () => {
  let rrf: ReciprocalRankFusion;

  beforeEach(() => {
    rrf = new ReciprocalRankFusion({ k: 60 });
  });

  describe('fuse', () => {
    it('should fuse results from multiple sources', () => {
      const source1: Document[] = [
        {
          id: 'doc1',
          content: 'Product 1',
          score: 0.9,
          source: 'vector',
          metadata: {}
        },
        {
          id: 'doc2',
          content: 'Product 2',
          score: 0.8,
          source: 'vector',
          metadata: {}
        }
      ];

      const source2: Document[] = [
        {
          id: 'doc2',
          content: 'Product 2',
          score: 0.95,
          source: 'sql',
          metadata: {}
        },
        {
          id: 'doc3',
          content: 'Product 3',
          score: 0.85,
          source: 'sql',
          metadata: {}
        }
      ];

      const results = rrf.fuse([source1, source2]);

      // doc2 should be ranked highest (appears in both sources)
      expect(results.length).toBe(3);
      expect(results[0].document.id).toBe('doc2');
      expect(results[0].sourcesCount).toBe(2);
    });

    it('should handle weighted fusion', () => {
      const source1: Document[] = [
        {
          id: 'doc1',
          content: 'Product 1',
          score: 0.9,
          source: 'vector',
          metadata: {}
        }
      ];

      const source2: Document[] = [
        {
          id: 'doc2',
          content: 'Product 2',
          score: 0.9,
          source: 'sql',
          metadata: {}
        }
      ];

      // Vector source has higher weight
      const results = rrf.fuse([source1, source2], [0.7, 0.3]);

      // doc1 should be ranked higher due to weight
      expect(results[0].document.id).toBe('doc1');
    });

    it('should handle empty result sets', () => {
      const results = rrf.fuse([[], []]);
      expect(results).toEqual([]);
    });

    it('should handle single source', () => {
      const source: Document[] = [
        {
          id: 'doc1',
          content: 'Product 1',
          score: 0.9,
          source: 'vector',
          metadata: {}
        }
      ];

      const results = rrf.fuse([source]);
      expect(results.length).toBe(1);
      expect(results[0].document.id).toBe('doc1');
    });
  });

  describe('fuseWithWeightedSum', () => {
    it('should fuse using weighted sum', () => {
      const source1: Document[] = [
        {
          id: 'doc1',
          content: 'Product 1',
          score: 0.9,
          source: 'vector',
          metadata: {}
        }
      ];

      const source2: Document[] = [
        {
          id: 'doc1',
          content: 'Product 1',
          score: 0.5,
          source: 'sql',
          metadata: {}
        }
      ];

      const results = rrf.fuseWithWeightedSum([source1, source2], [0.7, 0.3]);

      expect(results.length).toBe(1);
      // Weighted sum: 0.9 * 0.7 + 0.5 * 0.3 = 0.63 + 0.15 = 0.78
      expect(results[0].weightedScore).toBeCloseTo(0.78, 2);
    });
  });
});

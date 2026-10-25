import type { ProductBundle } from '../evidence/types'

type Review = ProductBundle['reviews'][number]

export function review(id: string, content: string, extra: Partial<Review> = {}): Review {
  return {
    id,
    title: null,
    content,
    rating: 4,
    language: 'en',
    fitsAs: null,
    sizePurchased: 'M',
    heightCm: null,
    bodyType: null,
    wearDuration: null,
    verified: true,
    helpfulVotes: 0,
    date: new Date('2026-09-01'),
    ...extra,
  }
}

/** A small, fully controlled product for tests (no database). */
export function makeBundle(over: { product?: Partial<ProductBundle['product']>; brand?: Partial<ProductBundle['brand']> } & Partial<Omit<ProductBundle, 'product' | 'brand'>> = {}): ProductBundle {
  return {
    product: {
      id: 'p1',
      slug: 'test-tee',
      name: 'Test Tee',
      category: 'TOPS',
      subcategory: 'tee',
      description: 'A tee.',
      sizes: ['S', 'M', 'L', 'XL'],
      hasPetite: false,
      hasTall: false,
      hasPlus: false,
      materials: { cotton: 100 },
      fabricWeightGsm: 160,
      elastanePct: 0,
      fitType: 'regular',
      silhouette: 'crew-tee',
      careInstructions: 'Machine wash cold',
      certifications: [],
      recycledContent: null,
      launchDate: new Date('2025-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...over.product,
    },
    brand: { id: 'b1', name: 'Test Brand', publishesSuppliers: false, hasRepairProgram: false, hasTakeBack: false, ...over.brand },
    reviews: over.reviews ?? [],
    returns: over.returns ?? [],
    prices: over.prices ?? [],
    trendPhase: over.trendPhase ?? null,
  }
}

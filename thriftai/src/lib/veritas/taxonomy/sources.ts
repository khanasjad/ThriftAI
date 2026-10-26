/**
 * Factor register (locked 2026-10-25): where each of the 27 factors gets its data in production and how it's
 * measured. "core" = works from the three standard feeds (catalog with prices, reviews) plus our own roll-ups;
 * "optional" = needs data a platform may not have (returns + units sold, licensed trend or resale data, brand info).
 * A test keeps this in step with the taxonomy.
 */
export type FactorSource = {
  /** Where the data comes from, in plain words. */
  source: string
  /** How code or the evidence agent turns it into evidence. */
  method: string
  feed: 'catalog' | 'reviews' | 'returns' | 'derived' | 'licensed' | 'brand'
  availability: 'core' | 'optional'
}

export const FACTOR_SOURCES: Record<string, FactorSource> = {
  'fit.true_to_size': { source: 'Reviews: fit answers and review text', method: 'Share of owners saying small / true to size / large', feed: 'reviews', availability: 'core' },
  'fit.size_consistency': { source: 'Reviews: owners comparing sizes across the brand', method: 'Agent reads mentions of the same size fitting differently', feed: 'reviews', availability: 'core' },
  'fit.body_shape_match': { source: 'Reviews with the owner’s build', method: 'Agent reads fit comments tied to body type', feed: 'reviews', availability: 'core' },
  'fit.return_rate_fit': { source: 'Returns and units sold', method: 'Fit returns ÷ units sold vs. the category benchmark', feed: 'returns', availability: 'optional' },
  'fit.length_proportions': { source: 'Reviews', method: 'Agent reads comments on length, sleeves, inseam', feed: 'reviews', availability: 'core' },
  'fit.size_range': { source: 'Catalog: sizes, petite / tall / plus', method: 'Code counts the size range', feed: 'catalog', availability: 'core' },
  'quality.fabric': { source: 'Reviews and catalog fabric weight', method: 'Agent reads fabric comments; code compares weight with the item type', feed: 'reviews', availability: 'core' },
  'quality.construction': { source: 'Reviews', method: 'Agent reads stitching, seams, buttons, zips', feed: 'reviews', availability: 'core' },
  'quality.wash_durability': { source: 'Reviews', method: 'Agent reads shrinking, fading, twisting after washes', feed: 'reviews', availability: 'core' },
  'quality.wear_resistance': { source: 'Reviews', method: 'Agent reads pilling and snagging', feed: 'reviews', availability: 'core' },
  'quality.longevity': { source: 'Reviews from long-term owners', method: 'Agent reads how it held up after months', feed: 'reviews', availability: 'core' },
  'quality.return_rate_quality': { source: 'Returns and units sold', method: 'Quality and defect returns ÷ units sold vs. the category benchmark', feed: 'returns', availability: 'optional' },
  'style_value.value_for_money': { source: 'Catalog prices and peer scores', method: 'Code compares score per dollar with similar items', feed: 'derived', availability: 'core' },
  'style_value.price_fairness': { source: 'Price history from daily catalog snapshots', method: 'Code flags fake “was” prices and frequent cheaper periods', feed: 'catalog', availability: 'core' },
  'style_value.brand_reputation': { source: 'The brand’s other rated products', method: 'Code rolls up published scores across the brand', feed: 'derived', availability: 'core' },
  'style_value.looks_as_pictured': { source: 'Reviews', method: 'Agent reads “not like the photos” and colour complaints', feed: 'reviews', availability: 'core' },
  'style_value.trend_relevance': { source: 'Licensed trend data', method: 'Weekly trend phase per style; capped at 3 points', feed: 'licensed', availability: 'optional' },
  'style_value.versatility': { source: 'Reviews', method: 'Agent reads “goes with everything” vs. “hard to style”', feed: 'reviews', availability: 'core' },
  'style_value.resale_value': { source: 'Licensed resale data', method: 'Median resale price as a share of retail', feed: 'licensed', availability: 'optional' },
  'comfort.softness': { source: 'Reviews', method: 'Agent reads soft / stiff / scratchy', feed: 'reviews', availability: 'core' },
  'comfort.breathability': { source: 'Reviews', method: 'Agent reads warm-weather comfort', feed: 'reviews', availability: 'core' },
  'comfort.stretch_mobility': { source: 'Reviews and catalog materials', method: 'Agent reads movement; code reads elastane share', feed: 'reviews', availability: 'core' },
  'comfort.skin_friendly': { source: 'Reviews', method: 'Agent reads itch and irritation (no health claims)', feed: 'reviews', availability: 'core' },
  'comfort.easy_care': { source: 'Catalog care label', method: 'Code reads machine-wash vs. dry-clean', feed: 'catalog', availability: 'core' },
  'sustainability.material_certs': { source: 'Catalog materials and certifications', method: 'Code reads organic, recycled, certified materials', feed: 'catalog', availability: 'core' },
  'sustainability.ethical_production': { source: 'Brand information', method: 'Published supplier list', feed: 'brand', availability: 'optional' },
  'sustainability.repair_takeback': { source: 'Brand information', method: 'Repair or take-back programme', feed: 'brand', availability: 'optional' },
}

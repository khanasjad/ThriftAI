/**
 * 27-Factor Evidence Taxonomy for Clothing
 * 
 * Defines the complete taxonomy of evidence factors that the Evidence Agent
 * extracts from reviews, returns, and other sources.
 * 
 * Each factor has:
 * - key: Unique identifier (e.g., "fit.true_to_size")
 * - pillar: Which of the 5 pillars it belongs to
 * - weight: Points in its pillar (0-8)
 * - signals: List of possible evidence signals
 * - description: What this factor measures
 */

export enum FactorPillar {
  FIT = 'FIT',
  QUALITY = 'QUALITY',
  STYLE_VALUE = 'STYLE_VALUE',
  COMFORT = 'COMFORT',
  SUSTAINABILITY = 'SUSTAINABILITY'
}

export interface FactorSignal {
  signal: string
  sentiment: number // -1.0 to +1.0
  description: string
}

export interface Factor {
  key: string
  pillar: FactorPillar
  weight: number // Points in pillar
  name: string
  description: string
  signals: FactorSignal[]
  examplePhrases: string[]
}

/**
 * Complete 27-Factor Taxonomy
 */
export const FACTOR_TAXONOMY: Factor[] = [
  // ==========================================================================
  // FIT & SIZING (35% of overall score, 35 total points)
  // ==========================================================================
  {
    key: 'fit.true_to_size',
    pillar: FactorPillar.FIT,
    weight: 8,
    name: 'True-to-size rate',
    description: 'Does it run true to size, or does it run small/large?',
    signals: [
      { signal: 'runs_small', sentiment: -0.7, description: 'Runs small, size up' },
      { signal: 'runs_very_small', sentiment: -1.0, description: 'Runs very small, size up 2+' },
      { signal: 'true_to_size', sentiment: 1.0, description: 'Perfect fit, order usual size' },
      { signal: 'runs_large', sentiment: -0.7, description: 'Runs large, size down' },
      { signal: 'runs_very_large', sentiment: -1.0, description: 'Runs very large, size down 2+' }
    ],
    examplePhrases: [
      'runs small, order one size up',
      'true to size, fits perfectly',
      'fits as expected',
      'size down, runs big',
      'I\'m usually a medium but needed a large'
    ]
  },
  
  {
    key: 'fit.size_consistency',
    pillar: FactorPillar.FIT,
    weight: 8,
    name: 'Size consistency',
    description: 'How consistent is sizing across products and over time?',
    signals: [
      { signal: 'consistent_sizing', sentiment: 1.0, description: 'Sizing is consistent' },
      { signal: 'inconsistent_sizing', sentiment: -1.0, description: 'Sizing varies between items' },
      { signal: 'changed_sizing', sentiment: -0.8, description: 'Sizing changed from previous purchase' }
    ],
    examplePhrases: [
      'always fits the same',
      'sizing is all over the place',
      'used to fit better',
      'consistent with other items from this brand'
    ]
  },
  
  {
    key: 'fit.body_shape_match',
    pillar: FactorPillar.FIT,
    weight: 6,
    name: 'Fit by body shape',
    description: 'How well does it accommodate different body types?',
    signals: [
      { signal: 'fits_slim', sentiment: 0.5, description: 'Great for slim body type' },
      { signal: 'fits_athletic', sentiment: 0.5, description: 'Great for athletic build' },
      { signal: 'fits_curvy', sentiment: 0.5, description: 'Great for curvy body' },
      { signal: 'fits_plus', sentiment: 0.5, description: 'Great for plus sizes' },
      { signal: 'unflattering_fit', sentiment: -0.8, description: 'Doesn\'t flatter body shape' },
      { signal: 'awkward_proportions', sentiment: -0.7, description: 'Awkward fit, weird proportions' }
    ],
    examplePhrases: [
      'perfect for curvy women',
      'great if you\'re petite',
      'doesn\'t work for my body type',
      'flattering on athletic build'
    ]
  },
  
  {
    key: 'fit.return_rate_fit',
    pillar: FactorPillar.FIT,
    weight: 6,
    name: 'Fit-related return rate',
    description: 'Percentage of returns due to fit issues',
    signals: [
      { signal: 'returned_too_small', sentiment: -1.0, description: 'Returned because too small' },
      { signal: 'returned_too_large', sentiment: -1.0, description: 'Returned because too large' },
      { signal: 'returned_poor_fit', sentiment: -1.0, description: 'Returned due to poor fit' },
      { signal: 'kept_good_fit', sentiment: 1.0, description: 'Kept, fits well' }
    ],
    examplePhrases: [
      'had to return, too tight',
      'sending back, way too big',
      'kept it, fits perfectly'
    ]
  },
  
  {
    key: 'fit.length_proportions',
    pillar: FactorPillar.FIT,
    weight: 4,
    name: 'Length and proportions',
    description: 'Are sleeves, inseam, torso length appropriate?',
    signals: [
      { signal: 'perfect_length', sentiment: 1.0, description: 'Length is perfect' },
      { signal: 'too_short', sentiment: -0.7, description: 'Too short' },
      { signal: 'too_long', sentiment: -0.7, description: 'Too long' },
      { signal: 'sleeves_short', sentiment: -0.6, description: 'Sleeves too short' },
      { signal: 'sleeves_long', sentiment: -0.6, description: 'Sleeves too long' },
      { signal: 'awkward_proportions', sentiment: -0.8, description: 'Proportions are off' }
    ],
    examplePhrases: [
      'sleeves are perfect',
      'too short in the torso',
      'inseam is spot on',
      'arms are way too long'
    ]
  },
  
  {
    key: 'fit.size_range',
    pillar: FactorPillar.FIT,
    weight: 3,
    name: 'Size range and inclusivity',
    description: 'Does the brand offer inclusive sizing (XS-3XL+)?',
    signals: [
      { signal: 'inclusive_sizing', sentiment: 1.0, description: 'Great size range, inclusive' },
      { signal: 'limited_sizes', sentiment: -0.8, description: 'Limited size options' },
      { signal: 'no_plus_sizes', sentiment: -1.0, description: 'No plus sizes available' },
      { signal: 'no_petite', sentiment: -0.6, description: 'No petite sizes' }
    ],
    examplePhrases: [
      'wish they had more sizes',
      'great that they go up to 4XL',
      'no petite options'
    ]
  },
  
  // ==========================================================================
  // QUALITY & DURABILITY (30% of overall score, 30 total points)
  // ==========================================================================
  {
    key: 'quality.fabric',
    pillar: FactorPillar.QUALITY,
    weight: 6,
    name: 'Fabric quality',
    description: 'Quality of fabric, material grade, blend composition',
    signals: [
      { signal: 'premium_fabric', sentiment: 1.0, description: 'High-quality, premium fabric' },
      { signal: 'soft_fabric', sentiment: 0.8, description: 'Soft, quality material' },
      { signal: 'cheap_fabric', sentiment: -1.0, description: 'Cheap, low-quality fabric' },
      { signal: 'thin_fabric', sentiment: -0.7, description: 'Too thin, see-through' },
      { signal: 'thick_fabric', sentiment: 0.6, description: 'Thick, substantial fabric' },
      { signal: 'scratchy_fabric', sentiment: -0.8, description: 'Rough, scratchy material' }
    ],
    examplePhrases: [
      'fabric feels cheap',
      'really high quality material',
      'too thin, can see through it',
      'fabric is so soft'
    ]
  },
  
  {
    key: 'quality.construction',
    pillar: FactorPillar.QUALITY,
    weight: 6,
    name: 'Construction quality',
    description: 'Stitching, seams, hardware, overall build quality',
    signals: [
      { signal: 'excellent_stitching', sentiment: 1.0, description: 'Perfect stitching, well-made' },
      { signal: 'poor_stitching', sentiment: -1.0, description: 'Bad stitching, loose threads' },
      { signal: 'seams_coming_apart', sentiment: -1.0, description: 'Seams falling apart' },
      { signal: 'quality_hardware', sentiment: 0.8, description: 'Good zippers, buttons' },
      { signal: 'cheap_hardware', sentiment: -0.7, description: 'Cheap buttons, zippers' }
    ],
    examplePhrases: [
      'stitching is coming undone',
      'really well constructed',
      'zipper broke after one week',
      'seams are perfect'
    ]
  },
  
  {
    key: 'quality.wash_durability',
    pillar: FactorPillar.QUALITY,
    weight: 6,
    name: 'Wash durability',
    description: 'How well does it hold up after washing?',
    signals: [
      { signal: 'holds_up_well', sentiment: 1.0, description: 'Holds up great after washing' },
      { signal: 'shrinks', sentiment: -1.0, description: 'Shrinks in wash' },
      { signal: 'color_fades', sentiment: -0.8, description: 'Color fades quickly' },
      { signal: 'wrinkles_easily', sentiment: -0.5, description: 'Wrinkles very easily' },
      { signal: 'low_maintenance', sentiment: 0.7, description: 'Easy care, low maintenance' }
    ],
    examplePhrases: [
      'shrank two sizes after first wash',
      'color still vibrant after 10 washes',
      'faded after a few washes',
      'holds up really well'
    ]
  },
  
  {
    key: 'quality.wear_resistance',
    pillar: FactorPillar.QUALITY,
    weight: 4,
    name: 'Wear resistance (pilling, etc.)',
    description: 'Does fabric pill, snag, or wear out quickly?',
    signals: [
      { signal: 'no_pilling', sentiment: 1.0, description: 'No pilling, wears well' },
      { signal: 'pills_immediately', sentiment: -1.0, description: 'Pills after first wear' },
      { signal: 'pills_moderate', sentiment: -0.6, description: 'Some pilling after a few wears' },
      { signal: 'snags_easily', sentiment: -0.8, description: 'Snags very easily' },
      { signal: 'durable_fabric', sentiment: 1.0, description: 'Durable, resists wear' }
    ],
    examplePhrases: [
      'pilling everywhere after one wash',
      'no pilling at all',
      'snags on everything',
      'holding up really well'
    ]
  },
  
  {
    key: 'quality.longevity',
    pillar: FactorPillar.QUALITY,
    weight: 5,
    name: 'Longevity',
    description: 'How long does it last? Years of use expected?',
    signals: [
      { signal: 'lasted_years', sentiment: 1.0, description: 'Lasted multiple years' },
      { signal: 'lasted_months', sentiment: 0.5, description: 'Lasted several months' },
      { signal: 'fell_apart_quickly', sentiment: -1.0, description: 'Fell apart in weeks' },
      { signal: 'still_like_new', sentiment: 1.0, description: 'Still looks new after lots of wear' },
      { signal: 'wore_out_fast', sentiment: -0.9, description: 'Wore out very quickly' }
    ],
    examplePhrases: [
      'had this for 3 years, still perfect',
      'fell apart after a month',
      'still looks brand new',
      'worn out after a few wears'
    ]
  },
  
  {
    key: 'quality.return_rate_quality',
    pillar: FactorPillar.QUALITY,
    weight: 3,
    name: 'Quality-related return rate',
    description: 'Percentage of returns due to quality issues',
    signals: [
      { signal: 'returned_poor_quality', sentiment: -1.0, description: 'Returned due to poor quality' },
      { signal: 'returned_defect', sentiment: -1.0, description: 'Returned due to defect' },
      { signal: 'returned_damage', sentiment: -1.0, description: 'Returned damaged' },
      { signal: 'kept_good_quality', sentiment: 1.0, description: 'Kept, great quality' }
    ],
    examplePhrases: [
      'returning, poor quality',
      'had to send back, defective',
      'keeping it, quality is great'
    ]
  },
  
  // ==========================================================================
  // STYLE & VALUE (20% of overall score, 20 total points)
  // ==========================================================================
  {
    key: 'style_value.value_for_money',
    pillar: FactorPillar.STYLE_VALUE,
    weight: 5,
    name: 'Value for money',
    description: 'Is it worth the price? Good value?',
    signals: [
      { signal: 'great_value', sentiment: 1.0, description: 'Excellent value for price' },
      { signal: 'overpriced', sentiment: -1.0, description: 'Overpriced, not worth it' },
      { signal: 'fair_price', sentiment: 0.7, description: 'Fair price for quality' },
      { signal: 'expensive', sentiment: -0.6, description: 'Expensive but worth it' },
      { signal: 'cheap_alternative', sentiment: 0.5, description: 'Good cheaper alternative' }
    ],
    examplePhrases: [
      'totally worth the price',
      'overpriced for the quality',
      'great value',
      'too expensive for what you get'
    ]
  },
  
  {
    key: 'style_value.price_fairness',
    pillar: FactorPillar.STYLE_VALUE,
    weight: 3,
    name: 'Price fairness',
    description: 'Is the price fair compared to market/competitors?',
    signals: [
      { signal: 'fair_price', sentiment: 1.0, description: 'Fair market price' },
      { signal: 'better_price_elsewhere', sentiment: -0.8, description: 'Found cheaper elsewhere' },
      { signal: 'best_price', sentiment: 1.0, description: 'Best price I found' },
      { signal: 'fake_discount', sentiment: -1.0, description: 'Fake discount, always "on sale"' }
    ],
    examplePhrases: [
      'found it cheaper on Amazon',
      'best price I could find',
      'always "50% off", seems fake'
    ]
  },
  
  {
    key: 'style_value.brand_reputation',
    pillar: FactorPillar.STYLE_VALUE,
    weight: 3,
    name: 'Brand reputation',
    description: 'Is the brand known for quality/style?',
    signals: [
      { signal: 'trusted_brand', sentiment: 1.0, description: 'Trusted, reputable brand' },
      { signal: 'unknown_brand', sentiment: 0.0, description: 'Unknown brand' },
      { signal: 'poor_reputation', sentiment: -0.8, description: 'Brand has poor reputation' },
      { signal: 'luxury_brand', sentiment: 0.8, description: 'Well-known luxury brand' }
    ],
    examplePhrases: [
      'love this brand',
      'never heard of this brand',
      'this brand always disappoints'
    ]
  },
  
  {
    key: 'style_value.looks_as_pictured',
    pillar: FactorPillar.STYLE_VALUE,
    weight: 3,
    name: 'Looks as pictured',
    description: 'Does it match the product photos/description?',
    signals: [
      { signal: 'matches_photo', sentiment: 1.0, description: 'Exactly as pictured' },
      { signal: 'color_different', sentiment: -0.8, description: 'Color doesn\'t match photo' },
      { signal: 'looks_different', sentiment: -0.9, description: 'Looks very different from photo' },
      { signal: 'better_than_photo', sentiment: 1.0, description: 'Even better than pictured' }
    ],
    examplePhrases: [
      'looks exactly like the photo',
      'color is totally different',
      'misleading photos',
      'looks even better in person'
    ]
  },
  
  {
    key: 'style_value.trend_relevance',
    pillar: FactorPillar.STYLE_VALUE,
    weight: 3,
    name: 'Trend relevance',
    description: 'Is it trendy/on-trend or timeless?',
    signals: [
      { signal: 'on_trend', sentiment: 0.7, description: 'Very trendy, current style' },
      { signal: 'timeless', sentiment: 1.0, description: 'Timeless, classic style' },
      { signal: 'dated', sentiment: -0.8, description: 'Looks dated, out of style' },
      { signal: 'fast_fashion', sentiment: -0.5, description: 'Trendy but will date quickly' }
    ],
    examplePhrases: [
      'so on trend right now',
      'classic piece, never goes out of style',
      'already looks dated',
      'trendy but won\'t last'
    ]
  },
  
  {
    key: 'style_value.versatility',
    pillar: FactorPillar.STYLE_VALUE,
    weight: 2,
    name: 'Versatility and timelessness',
    description: 'Can it be worn multiple ways/occasions?',
    signals: [
      { signal: 'very_versatile', sentiment: 1.0, description: 'Can be worn many ways' },
      { signal: 'dress_up_down', sentiment: 0.9, description: 'Dress up or down' },
      { signal: 'limited_use', sentiment: -0.6, description: 'Very specific use case' },
      { signal: 'staple_piece', sentiment: 1.0, description: 'Wardrobe staple' }
    ],
    examplePhrases: [
      'goes with everything',
      'can dress it up or down',
      'only works with one outfit',
      'wardrobe staple'
    ]
  },
  
  {
    key: 'style_value.resale_value',
    pillar: FactorPillar.STYLE_VALUE,
    weight: 1,
    name: 'Resale value',
    description: 'Does it hold resale value? (Poshmark, etc.)',
    signals: [
      { signal: 'holds_value', sentiment: 1.0, description: 'Holds resale value' },
      { signal: 'no_resale_value', sentiment: -0.5, description: 'No resale value' },
      { signal: 'sold_easily', sentiment: 0.8, description: 'Sold easily on resale sites' }
    ],
    examplePhrases: [
      'sold it on Poshmark for half price',
      'these hold their value',
      'couldn\'t even give it away'
    ]
  },
  
  // ==========================================================================
  // COMFORT (15% of overall score, 15 total points)
  // ==========================================================================
  {
    key: 'comfort.softness',
    pillar: FactorPillar.COMFORT,
    weight: 4,
    name: 'Softness and feel',
    description: 'Is the fabric soft, comfortable to touch?',
    signals: [
      { signal: 'very_soft', sentiment: 1.0, description: 'Incredibly soft' },
      { signal: 'comfortable', sentiment: 0.9, description: 'Very comfortable fabric' },
      { signal: 'scratchy', sentiment: -0.9, description: 'Scratchy, uncomfortable' },
      { signal: 'stiff', sentiment: -0.7, description: 'Stiff, needs breaking in' },
      { signal: 'luxurious_feel', sentiment: 1.0, description: 'Luxurious, premium feel' }
    ],
    examplePhrases: [
      'so soft and comfortable',
      'scratchy, can\'t wear it',
      'fabric feels luxurious',
      'stiff at first but softens up'
    ]
  },
  
  {
    key: 'comfort.breathability',
    pillar: FactorPillar.COMFORT,
    weight: 4,
    name: 'Breathability and temperature',
    description: 'Does it breathe? Too hot/cold?',
    signals: [
      { signal: 'breathable', sentiment: 1.0, description: 'Very breathable' },
      { signal: 'too_hot', sentiment: -0.8, description: 'Too hot, doesn\'t breathe' },
      { signal: 'sweaty', sentiment: -0.9, description: 'Makes you sweaty' },
      { signal: 'perfect_temp', sentiment: 1.0, description: 'Perfect temperature' },
      { signal: 'moisture_wicking', sentiment: 0.9, description: 'Wicks moisture well' }
    ],
    examplePhrases: [
      'breathes really well',
      'way too hot for summer',
      'keeps you cool',
      'makes me sweat'
    ]
  },
  
  {
    key: 'comfort.stretch_mobility',
    pillar: FactorPillar.COMFORT,
    weight: 3,
    name: 'Stretch and mobility',
    description: 'Does it allow movement? Stretchy enough?',
    signals: [
      { signal: 'great_stretch', sentiment: 1.0, description: 'Perfect amount of stretch' },
      { signal: 'no_stretch', sentiment: -0.7, description: 'No stretch, restricting' },
      { signal: 'too_stretchy', sentiment: -0.5, description: 'Too much stretch, loses shape' },
      { signal: 'moves_well', sentiment: 0.9, description: 'Allows full range of motion' },
      { signal: 'restrictive', sentiment: -0.8, description: 'Restrictive, can\'t move freely' }
    ],
    examplePhrases: [
      'stretches perfectly',
      'can\'t bend or move in it',
      'too stretchy, bags out',
      'moves with you'
    ]
  },
  
  {
    key: 'comfort.skin_friendly',
    pillar: FactorPillar.COMFORT,
    weight: 2,
    name: 'Skin friendliness',
    description: 'Non-irritating? Good for sensitive skin?',
    signals: [
      { signal: 'skin_friendly', sentiment: 1.0, description: 'Great for sensitive skin' },
      { signal: 'irritating', sentiment: -1.0, description: 'Irritates skin' },
      { signal: 'itchy', sentiment: -0.9, description: 'Itchy, uncomfortable' },
      { signal: 'hypoallergenic', sentiment: 1.0, description: 'Hypoallergenic materials' }
    ],
    examplePhrases: [
      'doesn\'t irritate my skin',
      'made me itch',
      'perfect for sensitive skin',
      'gave me a rash'
    ]
  },
  
  {
    key: 'comfort.easy_care',
    pillar: FactorPillar.COMFORT,
    weight: 2,
    name: 'Easy care',
    description: 'Machine washable? Low maintenance?',
    signals: [
      { signal: 'machine_washable', sentiment: 1.0, description: 'Machine washable' },
      { signal: 'low_maintenance', sentiment: 0.9, description: 'Low maintenance' },
      { signal: 'dry_clean_only', sentiment: -0.7, description: 'Dry clean only' },
      { signal: 'high_maintenance', sentiment: -0.8, description: 'High maintenance care' },
      { signal: 'wrinkle_free', sentiment: 0.7, description: 'Doesn\'t wrinkle' }
    ],
    examplePhrases: [
      'throw it in the wash, so easy',
      'dry clean only, annoying',
      'low maintenance',
      'wrinkles the second you look at it'
    ]
  },
  
  // ==========================================================================
  // SUSTAINABILITY (+5% bonus, 5 total points)
  // ==========================================================================
  {
    key: 'sustainability.material_certs',
    pillar: FactorPillar.SUSTAINABILITY,
    weight: 2,
    name: 'Material certifications',
    description: 'Organic, recycled, eco-friendly materials?',
    signals: [
      { signal: 'organic_cotton', sentiment: 1.0, description: 'Organic cotton certified' },
      { signal: 'recycled_materials', sentiment: 1.0, description: 'Made from recycled materials' },
      { signal: 'sustainable_materials', sentiment: 0.9, description: 'Sustainable materials' },
      { signal: 'eco_friendly', sentiment: 0.8, description: 'Eco-friendly production' },
      { signal: 'gots_certified', sentiment: 1.0, description: 'GOTS certified organic' }
    ],
    examplePhrases: [
      'made from organic cotton',
      'recycled polyester',
      'GOTS certified',
      'sustainable materials'
    ]
  },
  
  {
    key: 'sustainability.ethical_production',
    pillar: FactorPillar.SUSTAINABILITY,
    weight: 2,
    name: 'Ethical production',
    description: 'Fair trade, transparent supply chain?',
    signals: [
      { signal: 'fair_trade', sentiment: 1.0, description: 'Fair trade certified' },
      { signal: 'ethical', sentiment: 0.9, description: 'Ethically produced' },
      { signal: 'transparent', sentiment: 0.8, description: 'Transparent supply chain' },
      { signal: 'made_in_usa', sentiment: 0.7, description: 'Made in USA' },
      { signal: 'sweatshop_free', sentiment: 0.9, description: 'Certified sweatshop-free' }
    ],
    examplePhrases: [
      'fair trade certified',
      'ethically made',
      'transparent about production',
      'made in USA'
    ]
  },
  
  {
    key: 'sustainability.repair_takeback',
    pillar: FactorPillar.SUSTAINABILITY,
    weight: 1,
    name: 'Repair and take-back programs',
    description: 'Does brand offer repair or recycling?',
    signals: [
      { signal: 'repair_program', sentiment: 1.0, description: 'Offers repair program' },
      { signal: 'takeback_program', sentiment: 0.9, description: 'Has recycling/take-back' },
      { signal: 'lifetime_warranty', sentiment: 1.0, description: 'Lifetime warranty with repairs' },
      { signal: 'no_program', sentiment: 0.0, description: 'No sustainability programs' }
    ],
    examplePhrases: [
      'they\'ll repair it for free',
      'has a recycling program',
      'lifetime warranty',
      'no repair options'
    ]
  }
]

/**
 * Helper function to get factor by key
 */
export function getFactorByKey(key: string): Factor | undefined {
  return FACTOR_TAXONOMY.find(f => f.key === key)
}

/**
 * Helper function to get all factors for a pillar
 */
export function getFactorsByPillar(pillar: FactorPillar): Factor[] {
  return FACTOR_TAXONOMY.filter(f => f.pillar === pillar)
}

/**
 * Get total points for a pillar
 */
export function getPillarTotalPoints(pillar: FactorPillar): number {
  return getFactorsByPillar(pillar).reduce((sum, factor) => sum + factor.weight, 0)
}

/**
 * Validate that all pillars sum to 100 points
 */
export function validateTaxonomy(): boolean {
  const fitTotal = getPillarTotalPoints(FactorPillar.FIT)
  const qualityTotal = getPillarTotalPoints(FactorPillar.QUALITY)
  const styleValueTotal = getPillarTotalPoints(FactorPillar.STYLE_VALUE)
  const comfortTotal = getPillarTotalPoints(FactorPillar.COMFORT)
  const sustainabilityTotal = getPillarTotalPoints(FactorPillar.SUSTAINABILITY)
  
  const total = fitTotal + qualityTotal + styleValueTotal + comfortTotal + sustainabilityTotal
  
  console.log('Taxonomy validation:')
  console.log(`  Fit: ${fitTotal} points (target: 35)`)
  console.log(`  Quality: ${qualityTotal} points (target: 30)`)
  console.log(`  Style & Value: ${styleValueTotal} points (target: 20)`)
  console.log(`  Comfort: ${comfortTotal} points (target: 15)`)
  console.log(`  Sustainability: ${sustainabilityTotal} points (target: 5)`)
  console.log(`  TOTAL: ${total} points (target: 105)`) // 100 + 5 bonus
  
  return total === 105
}

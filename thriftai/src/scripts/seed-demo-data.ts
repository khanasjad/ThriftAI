/**
 * Comprehensive Demo Data Seed Script
 *
 * Generates realistic clothing product data for ThriftAI demo
 *
 * Generates:
 * - 5 demo brands (DTC clothing companies)
 * - 50-100 clothing products across categories
 * - 50-300 reviews per product (total ~10,000 reviews)
 * - Quality scores (27 factors + 5 pillars)
 * - Return events (5-30% return rate)
 * - Evidence tags
 *
 * Usage:
 *   npx tsx src/scripts/seed-demo-data.ts
 */

import { PrismaClient, ClothingCategory, ClothingGender, Confidence, ReturnReason, ReturnCategory } from '@prisma/client';

const prisma = new PrismaClient();

// =====================================================
// Demo Brands
// =====================================================
const DEMO_BRANDS = [
  {
    name: 'Sustainable Basics',
    slug: 'sustainable-basics',
    description: 'Eco-friendly essentials made from organic cotton and recycled materials',
    website: 'https://sustainablebasics.com',
    foundedYear: 2018,
    reputationScore: 88,
    sustainabilityRating: 'A',
    ethicsRating: 'Fair Trade Certified',
    trendRelevance: 75,
    priceRange: 'mid',
    targetDemographic: 'millennials, eco-conscious',
    certifications: ['GOTS', 'Fair Trade', 'B Corp'],
  },
  {
    name: 'Premium Streetwear',
    slug: 'premium-streetwear',
    description: 'Limited-edition urban fashion with Japanese-inspired design',
    website: 'https://premiumstreetwear.com',
    foundedYear: 2020,
    reputationScore: 82,
    sustainabilityRating: 'C',
    ethicsRating: 'Transparent Supply Chain',
    trendRelevance: 92,
    priceRange: 'premium',
    targetDemographic: 'gen-z, streetwear enthusiasts',
    certifications: ['Oeko-Tex'],
  },
  {
    name: 'Eco Denim Co',
    slug: 'eco-denim-co',
    description: 'Sustainable denim using 90% less water than traditional production',
    website: 'https://ecodenimco.com',
    foundedYear: 2016,
    reputationScore: 91,
    sustainabilityRating: 'A+',
    ethicsRating: 'Carbon Neutral',
    trendRelevance: 68,
    priceRange: 'premium',
    targetDemographic: 'millennials, sustainability-focused',
    certifications: ['GOTS', 'Bluesign', 'Carbon Neutral'],
  },
  {
    name: 'Comfort Essentials',
    slug: 'comfort-essentials',
    description: 'Soft, breathable everyday wear designed for all-day comfort',
    website: 'https://comfortessentials.com',
    foundedYear: 2019,
    reputationScore: 76,
    sustainabilityRating: 'B',
    ethicsRating: 'Good',
    trendRelevance: 55,
    priceRange: 'mid',
    targetDemographic: 'all ages, comfort-focused',
    certifications: ['Oeko-Tex'],
  },
  {
    name: 'Urban Minimalist',
    slug: 'urban-minimalist',
    description: 'Timeless, versatile pieces for the modern wardrobe',
    website: 'https://urbanminimalist.com',
    foundedYear: 2017,
    reputationScore: 85,
    sustainabilityRating: 'B+',
    ethicsRating: 'Fair Wage Certified',
    trendRelevance: 78,
    priceRange: 'mid',
    targetDemographic: 'millennials, minimalists',
    certifications: ['Fair Wear Foundation'],
  },
];

// =====================================================
// Product Templates
// =====================================================
const PRODUCT_TEMPLATES = [
  // TOPS
  {
    category: ClothingCategory.TOPS,
    names: [
      'Classic Organic Cotton Tee',
      'Vintage Wash Crew Neck',
      'Oversized Graphic Tee',
      'Pima Cotton V-Neck',
      'Relaxed Fit Henley',
      'Merino Wool Sweater',
      'Cashmere Blend Cardigan',
      'Lightweight Linen Shirt',
      'Oxford Button-Down',
      'Striped Long Sleeve Tee',
    ],
    subcategories: ['tee', 'sweater', 'shirt', 'henley', 'tank'],
    priceRange: [25, 120],
  },
  // BOTTOMS
  {
    category: ClothingCategory.BOTTOMS,
    names: [
      'Slim Fit Chino Pants',
      'Relaxed Tapered Jeans',
      'High-Rise Straight Denim',
      'Wide Leg Trousers',
      'Jogger Sweatpants',
      'Cargo Utility Pants',
      'Classic Fit Shorts',
      'Athletic Joggers',
      'Cropped Ankle Pants',
      'Pleated Wide Pants',
    ],
    subcategories: ['jeans', 'chinos', 'joggers', 'shorts', 'trousers'],
    priceRange: [45, 180],
  },
  // DRESSES
  {
    category: ClothingCategory.DRESSES,
    names: [
      'Midi Wrap Dress',
      'Linen Shirt Dress',
      'Maxi Slip Dress',
      'A-Line Mini Dress',
      'T-Shirt Dress',
      'Tiered Ruffle Dress',
      'Knit Sweater Dress',
      'Button Front Sundress',
    ],
    subcategories: ['midi', 'maxi', 'mini', 'shirt-dress'],
    priceRange: [55, 160],
  },
  // OUTERWEAR
  {
    category: ClothingCategory.OUTERWEAR,
    names: [
      'Denim Jacket',
      'Quilted Puffer Coat',
      'Wool Blend Overcoat',
      'Bomber Jacket',
      'Rain Shell Jacket',
      'Sherpa Fleece Jacket',
      'Leather Moto Jacket',
      'Trench Coat',
    ],
    subcategories: ['jacket', 'coat', 'blazer', 'vest'],
    priceRange: [80, 350],
  },
  // ACTIVEWEAR
  {
    category: ClothingCategory.ACTIVEWEAR,
    names: [
      'High-Waist Leggings',
      'Performance Tank Top',
      'Running Shorts',
      'Sports Bra',
      'Yoga Pants',
      'Moisture-Wicking Tee',
      'Track Jacket',
      'Compression Tights',
    ],
    subcategories: ['leggings', 'tank', 'shorts', 'sports-bra'],
    priceRange: [30, 110],
  },
];

// =====================================================
// Helper Functions
// =====================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function randomChoices<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateSKU(brandSlug: string, category: string, index: number): string {
  const prefix = brandSlug.substring(0, 3).toUpperCase();
  const catCode = category.substring(0, 3).toUpperCase();
  return `${prefix}-${catCode}-${String(index).padStart(4, '0')}`;
}

function calculateGrade(score: number): string {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}

function generateReviewContent(
  rating: number,
  category: ClothingCategory,
  hasIssue: boolean
): { title: string; content: string } {
  const positive = [
    { title: 'Love it!', content: 'This exceeded my expectations. The fit is perfect and the quality is amazing. Highly recommend!' },
    { title: 'Perfect everyday piece', content: 'Comfortable, well-made, and versatile. Wears well after multiple washes.' },
    { title: 'Great quality', content: 'The fabric is soft and durable. True to size and looks exactly like the photos.' },
    { title: 'Highly recommend', content: 'Best purchase I\'ve made in a while. The quality justifies the price.' },
    { title: 'Exactly what I wanted', content: 'Fits perfectly, great color, and the material is high quality.' },
  ];

  const neutral = [
    { title: 'Good, but...', content: 'Overall decent quality, but the fit is a bit off. Consider sizing up.' },
    { title: 'It\'s okay', content: 'Not bad for the price. Fabric is a bit thin but wears okay.' },
    { title: 'Mixed feelings', content: 'The style is great but I expected better quality for this price point.' },
  ];

  const negative = [
    { title: 'Disappointed', content: 'The sizing is completely off. Runs two sizes small. Had to return.' },
    { title: 'Poor quality', content: 'Started pilling after just one wash. Not worth the price.' },
    { title: 'Not as described', content: 'Color is much darker in person. Fabric feels cheap.' },
    { title: 'Sizing issues', content: 'Way too small. I ordered my usual size but couldn\'t even zip it up.' },
    { title: 'Cheaply made', content: 'Seams are already coming apart. Very disappointed.' },
  ];

  if (rating >= 4) {
    return randomChoice(positive);
  } else if (rating === 3) {
    return randomChoice(neutral);
  } else {
    return randomChoice(negative);
  }
}

// =====================================================
// Main Seed Function
// =====================================================

async function seedDemoData() {
  console.log('🌱 Starting demo data seed...\n');

  // Step 1: Clear existing data (development only!)
  console.log('🗑️  Clearing existing demo data...');
  await prisma.clothingReview.deleteMany({});
  await prisma.returnEvent.deleteMany({});
  await prisma.evidenceTag.deleteMany({});
  await prisma.productScore.deleteMany({});
  await prisma.factorScore.deleteMany({});
  await prisma.clothingProduct.deleteMany({});
  await prisma.brand.deleteMany({});
  console.log('✅ Cleared existing data\n');

  // Step 2: Create Brands
  console.log('🏷️  Creating demo brands...');
  const brands = [];
  for (const brandData of DEMO_BRANDS) {
    const brand = await prisma.brand.create({
      data: brandData,
    });
    brands.push(brand);
    console.log(`   ✓ Created brand: ${brand.name}`);
  }
  console.log(`✅ Created ${brands.length} brands\n`);

  // Step 3: Create Products
  console.log('👕 Creating demo products...');
  let productCount = 0;
  const allProducts = [];

  for (const brand of brands) {
    const productsPerBrand = randomInt(15, 25); // 15-25 products per brand

    for (let i = 0; i < productsPerBrand; i++) {
      const template = randomChoice(PRODUCT_TEMPLATES);
      const name = randomChoice(template.names);
      const subcategory = randomChoice(template.subcategories);
      const gender = randomChoice([ClothingGender.WOMENS, ClothingGender.MENS, ClothingGender.UNISEX]);

      const originalPrice = randomFloat(template.priceRange[0], template.priceRange[1]);
      const hasDiscount = Math.random() < 0.3; // 30% chance of discount
      const currentPrice = hasDiscount ? originalPrice * randomFloat(0.7, 0.9) : originalPrice;

      const sizes = gender === ClothingGender.MENS
        ? ['S', 'M', 'L', 'XL', '2XL']
        : ['XS', 'S', 'M', 'L', 'XL'];

      const colors = randomChoices(
        ['Black', 'Navy', 'Gray', 'White', 'Olive', 'Burgundy', 'Camel', 'Charcoal'],
        randomInt(2, 4)
      );

      // Material composition
      const materials = randomChoice([
        { cotton: 100 },
        { cotton: 60, polyester: 40 },
        { cotton: 95, spandex: 5 },
        { polyester: 100 },
        { wool: 80, nylon: 20 },
        { linen: 100 },
      ]);

      // Quality characteristics (affects scores)
      const qualityTier = randomChoice(['premium', 'standard', 'budget']);
      const fitConsistency = randomChoice(['runs_small', 'true_to_size', 'runs_large']);

      const product = await prisma.clothingProduct.create({
        data: {
          brandId: brand.id,
          name: `${name} - ${brand.name}`,
          category: template.category,
          subcategory,
          sku: generateSKU(brand.slug, template.category, productCount),
          currentPrice,
          originalPrice: hasDiscount ? originalPrice : null,
          currency: 'USD',
          gender,
          sizes,
          colors,
          materials,
          careInstructions: 'Machine wash cold, tumble dry low',
          fitType: randomChoice(['slim', 'regular', 'relaxed', 'oversized']),
          sizeConsistency: fitConsistency,
          fabricQuality: qualityTier,
          constructionType: randomChoice(['sewn', 'bonded']),
          durabilityRating: qualityTier === 'premium' ? randomInt(80, 95) : randomInt(60, 80),
          style: randomChoice(['classic', 'trendy', 'minimalist']),
          versatility: randomInt(60, 95),
          trendCategory: randomChoice(['timeless', 'seasonal']),
          comfortRating: randomInt(70, 95),
          breathability: randomChoice(['high', 'medium']),
          stretchLevel: randomChoice(['none', 'slight', 'moderate']),
          sustainabilityScore: brand.reputationScore > 85 ? randomInt(75, 95) : randomInt(50, 75),
          recycledContent: Math.random() < 0.4 ? randomInt(20, 80) : 0,
          organicCertified: brand.sustainabilityRating === 'A+' && Math.random() < 0.6,
          isAvailable: true,
          images: [
            `https://images.unsplash.com/photo-${randomInt(1, 100)}`,
          ],
          primaryImageUrl: `https://images.unsplash.com/photo-${randomInt(1, 100)}`,
          description: `Premium ${template.category.toLowerCase()} from ${brand.name}. ${brand.description}`,
        },
      });

      allProducts.push({ product, qualityTier, fitConsistency });
      productCount++;
    }

    console.log(`   ✓ Created ${productsPerBrand} products for ${brand.name}`);
  }
  console.log(`✅ Created ${productCount} products\n`);

  // Step 4: Generate Reviews & Scores
  console.log('💬 Generating reviews and calculating scores...');
  let totalReviews = 0;

  for (const { product, qualityTier, fitConsistency } of allProducts) {
    const reviewCount = randomInt(50, 300);

    // Generate reviews
    const reviews = [];
    let avgRating = 0;
    let fitIssueCount = 0;
    let qualityIssueCount = 0;

    for (let i = 0; i < reviewCount; i++) {
      // Quality tier affects rating distribution
      let rating: number;
      if (qualityTier === 'premium') {
        rating = randomChoice([5, 5, 5, 4, 4, 3]); // Mostly 4-5 stars
      } else if (qualityTier === 'standard') {
        rating = randomChoice([5, 4, 4, 3, 3, 2]); // Mixed
      } else {
        rating = randomChoice([4, 3, 3, 2, 2, 1]); // Mostly 2-3 stars
      }

      avgRating += rating;

      // Fit issues increase for inconsistent sizing
      const hasFitIssue = fitConsistency !== 'true_to_size' && Math.random() < 0.4;
      if (hasFitIssue) fitIssueCount++;

      const hasQualityIssue = qualityTier === 'budget' && Math.random() < 0.3;
      if (hasQualityIssue) qualityIssueCount++;

      const reviewContent = generateReviewContent(rating, product.category, hasFitIssue || hasQualityIssue);

      const review = await prisma.clothingReview.create({
        data: {
          productId: product.id,
          title: reviewContent.title,
          content: reviewContent.content,
          rating,
          fitRating: rating + randomInt(-1, 1),
          qualityRating: qualityTier === 'premium' ? rating : rating - 1,
          comfortRating: rating,
          styleRating: rating,
          valueRating: rating,
          sizePurchased: randomChoice(product.sizes as string[]),
          fitsAs: hasFitIssue ? fitConsistency : 'true_to_size',
          heightCm: randomInt(160, 190),
          weightKg: randomInt(55, 95),
          bodyType: randomChoice(['slim', 'athletic', 'average']),
          wearDuration: randomChoice(['1 month', '3 months', '6 months', '1 year']),
          pillingObserved: hasQualityIssue && Math.random() < 0.6,
          colorFading: hasQualityIssue && Math.random() < 0.4,
          shrinkage: hasQualityIssue && Math.random() < 0.3,
          isVerifiedPurchase: Math.random() < 0.8,
          helpfulVotes: randomInt(0, 20),
          reviewerName: `Customer ${i + 1}`,
          reviewDate: new Date(Date.now() - randomInt(0, 365) * 24 * 60 * 60 * 1000),
          processed: true,
          processedAt: new Date(),
        },
      });

      reviews.push(review);
    }

    avgRating = avgRating / reviewCount;
    totalReviews += reviewCount;

    // Calculate quality scores
    // Fit score (affected by fit consistency issues)
    const fitScore = fitConsistency === 'true_to_size'
      ? randomInt(85, 98)
      : randomInt(40, 70);

    // Quality score (affected by quality tier)
    const qualityScore = qualityTier === 'premium'
      ? randomInt(85, 98)
      : qualityTier === 'standard'
      ? randomInt(70, 85)
      : randomInt(50, 70);

    // Style score (relatively consistent)
    const styleScore = randomInt(75, 92);

    // Comfort score (based on ratings)
    const comfortScore = randomInt(Math.floor(avgRating * 15), Math.floor(avgRating * 20));

    // Sustainability score (based on brand)
    const sustainabilityScore = product.sustainabilityScore || randomInt(50, 80);

    // Overall score (weighted average)
    const overallScore = Math.round(
      fitScore * 0.25 +
      qualityScore * 0.30 +
      styleScore * 0.20 +
      comfortScore * 0.15 +
      sustainabilityScore * 0.10
    );

    // Create ProductScore
    await prisma.productScore.create({
      data: {
        productId: product.id,
        overall: overallScore,
        grade: calculateGrade(overallScore),
        fit: fitScore,
        quality: qualityScore,
        styleValue: styleScore,
        comfort: comfortScore,
        sustainability: sustainabilityScore,
        confidence: reviewCount > 150 ? Confidence.HIGH : reviewCount > 75 ? Confidence.MEDIUM : Confidence.LOW,
        evidenceCount: reviewCount,
        factorsIncluded: ['fit', 'quality', 'style', 'comfort', 'sustainability'],
        factorsMissing: [],
        isNewLaunch: false,
        version: 'v1.0',
        calculatedAt: new Date(),
      },
    });

    // Generate return events (higher for low scores)
    const returnRate = overallScore < 60 ? 0.30 : overallScore < 75 ? 0.15 : 0.08;
    const returnCount = Math.floor(reviewCount * returnRate);

    for (let i = 0; i < returnCount; i++) {
      // Determine return reason based on product issues
      let returnReason: ReturnReason;
      let returnCategory: ReturnCategory;

      if (fitConsistency !== 'true_to_size') {
        returnReason = fitConsistency === 'runs_small' ? ReturnReason.TOO_SMALL : ReturnReason.TOO_LARGE;
        returnCategory = ReturnCategory.FIT;
      } else if (qualityTier === 'budget' && Math.random() < 0.5) {
        returnReason = ReturnReason.POOR_QUALITY;
        returnCategory = ReturnCategory.QUALITY;
      } else if (Math.random() < 0.3) {
        returnReason = ReturnReason.COLOR_MISMATCH;
        returnCategory = ReturnCategory.STYLE;
      } else {
        returnReason = ReturnReason.CHANGED_MIND;
        returnCategory = ReturnCategory.OTHER;
      }

      await prisma.returnEvent.create({
        data: {
          productId: product.id,
          returnReason,
          returnCategory,
          detailedReason: `Return due to ${returnReason.toLowerCase().replace(/_/g, ' ')}`,
          sizePurchased: randomChoice(product.sizes as string[]),
          colorPurchased: randomChoice(product.colors as string[]),
          purchasePrice: product.currentPrice,
          purchaseDate: new Date(Date.now() - randomInt(7, 30) * 24 * 60 * 60 * 1000),
          returnDate: new Date(Date.now() - randomInt(0, 180) * 24 * 60 * 60 * 1000),
          resolutionType: randomChoice(['refund', 'exchange', 'store_credit']),
          processed: true,
          processedAt: new Date(),
        },
      });
    }

    if (productCount % 10 === 0) {
      console.log(`   ✓ Processed ${allProducts.indexOf({ product, qualityTier, fitConsistency }) + 1}/${productCount} products...`);
    }
  }

  console.log(`✅ Generated ${totalReviews} reviews and calculated quality scores\n`);

  // Step 5: Summary
  console.log('📊 Seed Summary:');
  console.log(`   Brands: ${brands.length}`);
  console.log(`   Products: ${productCount}`);
  console.log(`   Reviews: ${totalReviews}`);
  console.log(`   Avg Reviews/Product: ${Math.round(totalReviews / productCount)}`);

  const avgScore = await prisma.productScore.aggregate({
    _avg: { overall: true },
  });
  console.log(`   Avg Quality Score: ${Math.round(avgScore._avg.overall || 0)}/100\n`);

  // Step 6: Test query
  console.log('🧪 Test Query: Top 5 products by score');
  const topProducts = await prisma.clothingProduct.findMany({
    take: 5,
    include: {
      productScore: true,
      brand: true,
      _count: { select: { reviews: true } },
    },
    orderBy: {
      productScore: {
        overall: 'desc',
      },
    },
  });

  topProducts.forEach((p, i) => {
    console.log(
      `   ${i + 1}. ${p.name} - Score: ${p.productScore?.overall}/100 (${p.productScore?.grade}) - ${p._count.reviews} reviews`
    );
  });

  console.log('\n✅ Demo data seed completed successfully! 🎉\n');
}

// =====================================================
// Execute Seed
// =====================================================

seedDemoData()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

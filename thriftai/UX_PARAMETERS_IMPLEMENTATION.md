# User Experience Parameters Implementation Guide

## Overview

User Experience (UX) parameters measure the **quality of the buying experience**, not the product itself. These metrics help buyers understand how easy and pleasant it will be to purchase and receive the product.

## Current UX Weight in Veritas Score

```
User Experience Pillar: 15% of total Veritas Score
├── Shipping Speed (50%) - Already implemented
├── Returns Policy (20%) - Already implemented
└── Ease of Purchase (30%) - NEW - needs these parameters
```

## Parameters to Add

| Parameter | Current Value | Impact on Score | Why It Matters |
|-----------|--------------|-----------------|----------------|
| **Page Quality Score** | 90/100 | +13.5 points | Well-designed pages = professional seller |
| **Image Count** | 8 images | +10 points | More images = better product visualization |
| **Description Length** | 500 words | +8 points | Detailed descriptions = informed decisions |
| **Has Video** | ✅ Yes | +15 points | Videos show product in action |
| **Mobile Optimized** | ✅ Yes | +10 points | Mobile users can buy easily |
| **Page Load Speed** | 0.8 seconds | +12 points | Fast pages = better UX |
| **Checkout Ease** | 95/100 | +14.25 points | Easy checkout = more likely to complete |
| **Navigation Quality** | 90/100 | +13.5 points | Easy to find info = better experience |

**Total Possible UX Score Impact: 96.75 points → normalized to 0-100**

## Step 1: Update ProductData Interface

**File:** `/src/lib/services/aiProductScorer.ts`

Add these fields to the `ProductData` interface:

```typescript
export interface ProductData {
  // ... existing fields ...

  // User Experience Metrics (NEW)
  userExperience?: {
    pageQuality?: number // 0-100
    imageCount?: number // Total product images
    descriptionWordCount?: number // Length of description
    hasVideo?: boolean // Product video available
    mobileOptimized?: boolean // Mobile-responsive listing
    pageLoadSpeed?: number // Seconds to load
    checkoutEase?: number // 0-100 score
    navigationQuality?: number // 0-100 score
  }

  // Image Quality (affects trust, not product quality)
  imageQuality?: {
    overallQuality: number // 0-100
    qualityLabel: 'Excellent' | 'Good' | 'Fair' | 'Poor'
    sharpness: number
    brightness: number
    contrast: number
    issues: string[]
  }
}
```

## Step 2: Update Convenience Calculation → User Experience Calculation

**File:** `/src/lib/services/aiProductScorer.ts`

Replace the current `calculateConvenience()` method with enhanced `calculateUserExperience()`:

```typescript
/**
 * User Experience Score (0-100)
 * Measures the quality of the buying experience
 *
 * Components:
 * - Listing Quality (40%) - Page, images, description, video
 * - Shipping & Delivery (30%) - Speed, tracking, cost
 * - Checkout Experience (30%) - Ease, mobile, navigation
 */
private calculateUserExperience(product: ProductData): number {
  let listingScore = 0 // Max 40 points
  let shippingScore = 0 // Max 30 points
  let checkoutScore = 0 // Max 30 points

  // ========================================
  // LISTING QUALITY (40 points)
  // ========================================

  if (product.userExperience) {
    const ux = product.userExperience

    // Page Quality (10 points)
    if (ux.pageQuality !== undefined) {
      listingScore += (ux.pageQuality / 100) * 10
    }

    // Image Count (8 points)
    // More images = better visualization
    if (ux.imageCount !== undefined) {
      if (ux.imageCount >= 8) listingScore += 8
      else if (ux.imageCount >= 5) listingScore += 6
      else if (ux.imageCount >= 3) listingScore += 4
      else if (ux.imageCount >= 1) listingScore += 2
    }

    // Description Length (7 points)
    // Longer descriptions = more informed buyers
    if (ux.descriptionWordCount !== undefined) {
      if (ux.descriptionWordCount >= 500) listingScore += 7
      else if (ux.descriptionWordCount >= 300) listingScore += 5
      else if (ux.descriptionWordCount >= 150) listingScore += 3
      else if (ux.descriptionWordCount >= 50) listingScore += 1
    }

    // Has Video (10 points)
    // Videos are worth a lot for UX
    if (ux.hasVideo === true) {
      listingScore += 10
    }

    // Page Load Speed (5 points)
    // Fast pages = better UX
    if (ux.pageLoadSpeed !== undefined) {
      if (ux.pageLoadSpeed <= 1.0) listingScore += 5
      else if (ux.pageLoadSpeed <= 2.0) listingScore += 3
      else if (ux.pageLoadSpeed <= 3.0) listingScore += 1
      // Slow pages (>3s) get 0 points
    }
  }

  // ========================================
  // SHIPPING & DELIVERY (30 points)
  // ========================================

  // Shipping speed (15 points)
  if (product.estimatedDeliveryDays !== undefined) {
    if (product.estimatedDeliveryDays <= 2) shippingScore += 15
    else if (product.estimatedDeliveryDays <= 5) shippingScore += 12
    else if (product.estimatedDeliveryDays <= 7) shippingScore += 8
    else if (product.estimatedDeliveryDays <= 14) shippingScore += 4
  }

  // Free shipping (8 points)
  if (product.hasFreeShipping) shippingScore += 8

  // Fast shipping availability (4 points)
  if (product.hasFastShipping) shippingScore += 4

  // Tracking (3 points)
  if (product.hasTracking) shippingScore += 3

  // ========================================
  // CHECKOUT EXPERIENCE (30 points)
  // ========================================

  if (product.userExperience) {
    const ux = product.userExperience

    // Checkout Ease (14 points)
    if (ux.checkoutEase !== undefined) {
      checkoutScore += (ux.checkoutEase / 100) * 14
    }

    // Mobile Optimized (8 points)
    // Critical for mobile shoppers
    if (ux.mobileOptimized === true) {
      checkoutScore += 8
    }

    // Navigation Quality (8 points)
    if (ux.navigationQuality !== undefined) {
      checkoutScore += (ux.navigationQuality / 100) * 8
    }
  }

  // Stock availability affects checkout experience
  if (product.inStock) {
    checkoutScore += 0 // Already in stock, no bonus
  } else {
    checkoutScore -= 10 // Out of stock hurts UX significantly
  }

  // Total UX Score (0-100)
  const totalScore = listingScore + shippingScore + Math.max(0, checkoutScore)

  return Math.max(0, Math.min(100, totalScore))
}
```

## Step 3: Update the ScoreBreakdown Interface

**File:** `/src/lib/services/aiProductScorer.ts`

Rename `convenience` to `userExperience`:

```typescript
export interface ScoreBreakdown {
  total: number // 0-100
  components: {
    priceValue: number
    trustScore: number
    qualityScore: number
    socialProof: number
    userExperience: number // RENAMED from 'convenience'
    urgency: number
    relevance: number
    emotional: number
    specsQuality: number
  }
  confidence: number
  insights: string[]
  recommendation: 'strong-buy' | 'buy' | 'consider' | 'wait' | 'avoid'
}
```

## Step 4: Update the Scoring Weights

**File:** `/src/lib/services/aiProductScorer.ts`

Update the weights in `calculateScore()`:

```typescript
calculateScore(product: ProductData): ScoreBreakdown {
  const components = {
    priceValue: this.calculatePriceValue(product),
    trustScore: this.calculateTrustScore(product),
    qualityScore: this.calculateQualityScore(product),
    socialProof: this.calculateSocialProof(product),
    userExperience: this.calculateUserExperience(product), // RENAMED
    urgency: this.calculateUrgency(product),
    relevance: this.calculateRelevance(product),
    emotional: this.calculateEmotionalAppeal(product),
    specsQuality: this.calculateSpecsQuality(product)
  }

  const weights = {
    priceValue: 0.23,
    trustScore: 0.18,
    socialProof: 0.14,
    qualityScore: 0.12,
    userExperience: 0.10, // RENAMED from convenience
    specsQuality: 0.10,
    relevance: 0.07,
    urgency: 0.04,
    emotional: 0.02
  }

  // ... rest of calculation
}
```

## Step 5: Database Schema (Optional - for persistence)

Add a new table or JSON column to store UX metrics:

```sql
-- Option 1: Extend existing Product table with JSONB column
ALTER TABLE "Product"
ADD COLUMN "userExperienceMetrics" JSONB DEFAULT '{
  "pageQuality": 50,
  "imageCount": 0,
  "descriptionWordCount": 0,
  "hasVideo": false,
  "mobileOptimized": true,
  "pageLoadSpeed": 2.0,
  "checkoutEase": 70,
  "navigationQuality": 70
}'::jsonb;

-- Option 2: Create dedicated table
CREATE TABLE "ProductUserExperience" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "pageQuality" INTEGER DEFAULT 50,
  "imageCount" INTEGER DEFAULT 0,
  "descriptionWordCount" INTEGER DEFAULT 0,
  "hasVideo" BOOLEAN DEFAULT false,
  "mobileOptimized" BOOLEAN DEFAULT true,
  "pageLoadSpeed" DOUBLE PRECISION DEFAULT 2.0,
  "checkoutEase" INTEGER DEFAULT 70,
  "navigationQuality" INTEGER DEFAULT 70,
  "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductUserExperience_productId_fkey"
    FOREIGN KEY ("productId")
    REFERENCES "Product"("id")
    ON DELETE CASCADE
);
```

## Step 6: Example Usage

### Scoring a Product with Full UX Data

```typescript
import { aiProductScorer } from '@/lib/services/aiProductScorer'

const product = {
  id: 'prod_123',
  name: 'Apple iPhone 15 Pro',
  price: 999,
  condition: 'new',

  // User Experience Metrics
  userExperience: {
    pageQuality: 90,
    imageCount: 8,
    descriptionWordCount: 500,
    hasVideo: true,
    mobileOptimized: true,
    pageLoadSpeed: 0.8,
    checkoutEase: 95,
    navigationQuality: 90
  },

  // Shipping
  estimatedDeliveryDays: 2,
  hasFreeShipping: true,
  hasFastShipping: true,
  hasTracking: true,
  inStock: true
}

const score = aiProductScorer.calculateScore(product)

console.log('User Experience Score:', score.components.userExperience)
// Expected: ~95/100 (excellent UX)
```

### Scoring a Product with Poor UX

```typescript
const poorUXProduct = {
  id: 'prod_456',
  name: 'Generic Phone Case',
  price: 15,
  condition: 'new',

  userExperience: {
    pageQuality: 40,      // Poor page design
    imageCount: 1,        // Only 1 image
    descriptionWordCount: 30, // Very short description
    hasVideo: false,      // No video
    mobileOptimized: false, // Not mobile-friendly
    pageLoadSpeed: 4.5,   // Slow page
    checkoutEase: 50,     // Complicated checkout
    navigationQuality: 45 // Hard to navigate
  },

  estimatedDeliveryDays: 14, // Slow shipping
  hasFreeShipping: false,
  inStock: true
}

const poorScore = aiProductScorer.calculateScore(poorUXProduct)

console.log('User Experience Score:', poorScore.components.userExperience)
// Expected: ~25/100 (poor UX)
```

## Step 7: How UX Parameters Affect Purchase Decision

### Impact on Final Veritas Score

With UX at 15% weight:

| Scenario | UX Score | UX Contribution | Impact on Final Score |
|----------|----------|-----------------|----------------------|
| **Excellent UX** (95/100) | 95 | 95 × 0.15 = 14.25 | +14.25 points |
| **Good UX** (75/100) | 75 | 75 × 0.15 = 11.25 | +11.25 points |
| **Poor UX** (25/100) | 25 | 25 × 0.15 = 3.75 | +3.75 points |

**Difference between Excellent and Poor UX: 10.5 points on final score!**

### Example: Two Identical Products, Different UX

**Product A: Excellent UX**
- Price: $999 (Price Score: 70)
- Quality: New (Quality Score: 90)
- Trust: Good seller (Trust Score: 80)
- **UX: 95/100** ← High UX
- **Final Score: 82/100 → "Strong Buy"**

**Product B: Poor UX**
- Price: $999 (Price Score: 70)
- Quality: New (Quality Score: 90)
- Trust: Good seller (Trust Score: 80)
- **UX: 25/100** ← Low UX
- **Final Score: 72/100 → "Buy" (demoted)**

## Step 8: Collecting UX Data

### Option 1: Analyze Existing Product Pages

```typescript
// Automatically analyze product listing pages
async function analyzeProductUX(productUrl: string) {
  // Fetch page
  const response = await fetch(productUrl)
  const html = await response.text()

  // Count images
  const imageCount = (html.match(/<img[^>]+src=/g) || []).length

  // Count description words
  const descriptionText = extractDescription(html)
  const wordCount = descriptionText.split(/\s+/).length

  // Check for video
  const hasVideo = html.includes('<video') || html.includes('youtube') || html.includes('vimeo')

  // Check mobile optimization
  const mobileOptimized = html.includes('viewport') && html.includes('responsive')

  // Measure page load speed (use Lighthouse or similar)
  const loadSpeed = await measurePageSpeed(productUrl)

  return {
    imageCount,
    descriptionWordCount: wordCount,
    hasVideo,
    mobileOptimized,
    pageLoadSpeed: loadSpeed
  }
}
```

### Option 2: Manual Entry by Sellers

```typescript
// Seller provides UX data when creating listing
interface SellerProvidedUX {
  imageCount: number // Automatically from upload
  descriptionWordCount: number // Automatically from text input
  hasVideo: boolean // From video upload
  mobileOptimized: boolean // Set to true by default for platform
}
```

### Option 3: Calculate from Platform Features

```typescript
// Platform automatically calculates based on seller actions
function calculatePlatformUX(product: Product) {
  return {
    pageQuality: platform.getTemplateQuality(product.sellerId),
    imageCount: product.images.length,
    descriptionWordCount: countWords(product.description),
    hasVideo: !!product.videoUrl,
    mobileOptimized: true, // Platform is mobile-responsive
    pageLoadSpeed: measureLoadTime(product.id),
    checkoutEase: platform.getCheckoutScore(),
    navigationQuality: platform.getNavigationScore()
  }
}
```

## Benefits of Adding UX Parameters

### For Buyers:
1. **Better Purchase Decisions** - Know if the buying experience will be smooth
2. **Avoid Bad Sellers** - Poor UX often indicates unprofessional sellers
3. **Mobile Shopping** - Know if they can buy easily on mobile
4. **Visual Confidence** - More images/video = better product understanding

### For Sellers:
1. **Competitive Advantage** - Improve UX to rank higher
2. **Higher Conversion** - Good UX leads to more sales
3. **Actionable Feedback** - See exactly what to improve
4. **Fair Competition** - Effort in UX is rewarded in rankings

### For Platform:
1. **Better Marketplace** - Encourages quality listings
2. **Lower Returns** - Good UX = informed buyers = fewer returns
3. **Mobile Growth** - Rewards mobile-friendly sellers
4. **Trust Signals** - Professional listings build platform reputation

## Summary

**Before:**
```
User Experience = Shipping speed only
```

**After:**
```
User Experience = Listing Quality (40%)
                + Shipping & Delivery (30%)
                + Checkout Experience (30%)
```

This gives a comprehensive view of the buying experience, helping buyers choose products that are not just high-quality, but also easy and pleasant to purchase!

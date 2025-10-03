# Veritas Score™ System - Complete Implementation Plan
## 121-Parameter Product Quality Assessment System

**Document Version**: 2.0  
**Date**: 2024-03-01  
**Status**: 📋 Planning Phase  
**Next Review**: After stakeholder approval

---

## Executive Summary

This document provides a **complete technical specification** for implementing the Veritas Score™ system - a comprehensive 121-parameter AI-powered product quality assessment that will become the industry standard for e-commerce trust.

**Total Parameters**: 121
- **Core Quality Parameters**: 96 (organized in 6 categories)
- **Product Description Parameters**: 25 (focused on listing quality)

**Goal**: Create the "FICO Score" for e-commerce - a universal trust metric buyers can rely on.

---

## Table of Contents

1. [Current Implementation Status](#1-current-implementation-status)
2. [The 96 Core Parameters - Detailed Breakdown](#2-the-96-core-parameters)
3. [The 25 Product Description Parameters](#3-the-25-product-description-parameters)
4. [Data Collection Strategy](#4-data-collection-strategy)
5. [Scoring Formulas & Algorithms](#5-scoring-formulas--algorithms)
6. [Competitive Analysis Integration](#6-competitive-analysis-integration)
7. [SSN (Standard Score Number) System](#7-ssn-system)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Technical Architecture](#9-technical-architecture)
10. [Real-World Example](#10-real-world-example)

---

## 1. Current Implementation Status

### ✅ Completed

**Frontend Components**:
- Product cards with Veritas Score display
- Color-coded score badges (90+: green, 80-89: blue, 70-79: yellow, 60-69: orange, <60: red)
- Veritas Score breakdown modal (`VeritasScoreModal.tsx`)
- 96 parameters organized in 6 expandable categories
- Individual parameter progress bars
- Mock data generator for testing

**Data Model**:
- Product schema includes `veritasScore` field
- Category-based score structure in place
- Parameter framework defined

### ⚠️ In Progress

- Score calculation engine (mock data only)
- Data collection pipeline
- API integration points

### 📋 Not Started

- Real-time AI analysis
- External API integrations
- Machine learning models
- Background job scheduling
- Score caching system

---

## 2. The 96 Core Parameters

### Category 1: Product Quality (30% weight)

#### Subcategory 1.1: Physical Condition Assessment (12 points)

| # | Parameter | How to Collect | Formula | Practical Implementation |
|---|-----------|----------------|---------|--------------------------|
| 1 | **Overall Condition Score** | AI image analysis + seller description NLP | `(imageQuality * 0.6) + (sellerRatingMatch * 0.4) * 100` | Use GPT-4 Vision to analyze product photos for wear, damage, cleanliness |
| 2 | **Wear & Tear Level** | Computer vision defect detection | `100 - (detectedDefects * 15)` | Train CV model on images tagged with defect levels |
| 3 | **Functionality Test** | Seller claims + return rate correlation | `(claimedWorking * 70) + ((100 - returnRate) * 30)` | Track products claimed "fully functional" vs actual return rates |
| 4 | **Age Assessment** | Product release date + depreciation | `100 - (monthsOld * categoryDepreciationRate)` | Use product database with release dates |
| 5 | **Cosmetic Quality** | Image analysis for scratches, dents | `avgImageQualityScore` | AWS Rekognition custom labels for cosmetic issues |
| 6 | **Structural Integrity** | Category-specific structural checks | `passedChecks / totalChecks * 100` | Electronics: test for cracks; Furniture: check for stability |

**Implementation Example - Condition Score**:
```javascript
async function calculateConditionScore(product) {
  // Step 1: Analyze images with GPT-4 Vision
  const imageAnalysis = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [{
      role: "user",
      content: [
        { 
          type: "text", 
          text: "Rate this product's condition 0-100. Look for: wear, damage, cleanliness, completeness. Return JSON: {score, issues[], confidence}" 
        },
        ...product.images.map(img => ({ type: "image_url", image_url: img }))
      ]
    }]
  });

  const visionScore = JSON.parse(imageAnalysis.choices[0].message.content).score;

  // Step 2: Analyze description with NLP
  const descAnalysis = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "user",
      content: `Analyze condition from description: "${product.description}". 
                Rate 0-100. Return JSON: {score, keyPhrases[]}`
    }]
  });

  const descScore = JSON.parse(descAnalysis.choices[0].message.content).score;

  // Step 3: Combine with seller reliability
  const sellerAdjustment = product.seller.rating >= 4.5 ? 1.0 : 0.9;

  return Math.round((visionScore * 0.6 + descScore * 0.4) * sellerAdjustment);
}
```

#### Subcategory 1.2: Authenticity & Brand Verification (10 points)

| # | Parameter | Data Source | Formula | Implementation |
|---|-----------|-------------|---------|----------------|
| 7 | **Brand Reputation Index** | Brand database + historical ratings | `(brandScore * reviewVolume) / 100` | Maintain curated brand reputation DB |
| 8 | **Authenticity Verification** | ML counterfeit detector + certificates | `(mlAuthScore * 0.7) + (hasCert * 30)` | Train ML on authentic vs fake product images |
| 9 | **Counterfeit Risk Assessment** | Pattern matching + price analysis | `100 - counterfeitProbability` | Flag unrealistic prices, suspicious sellers |
| 10 | **Documentation Completeness** | Receipt, warranty, box presence | `(docs_present / docs_expected) * 100` | Check for original packaging, manuals, receipts |

**Authenticity ML Model**:
```python
# Train authenticity classifier
import tensorflow as tf

def build_authenticity_model():
    model = tf.keras.Sequential([
        tf.keras.layers.Conv2D(32, (3,3), activation='relu', input_shape=(224,224,3)),
        tf.keras.layers.MaxPooling2D(2,2),
        tf.keras.layers.Conv2D(64, (3,3), activation='relu'),
        tf.keras.layers.MaxPooling2D(2,2),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(1, activation='sigmoid')  # Authentic (1) vs Fake (0)
    ])
    
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model

# Training data structure:
# /training_data/
#   /authentic/
#     - product1.jpg
#     - product2.jpg
#   /counterfeit/
#     - fake1.jpg
#     - fake2.jpg
```

#### Subcategory 1.3: Material & Construction Quality (8 points)

| # | Parameter | How to Measure | Formula | Real Data Source |
|---|-----------|----------------|---------|------------------|
| 11 | **Material Quality Grade** | Specs extraction + category standards | `(materialTier / 5) * 100` | Extract materials from description, map to quality tiers |
| 12 | **Build Quality Rating** | Review sentiment + manufacturing info | `(reviewQualityScore * 0.6) + (specsScore * 0.4)` | NLP on reviews mentioning "build", "construction", "quality" |
| 13 | **Durability Expectation** | Product lifespan vs category average | `(expectedYears / categoryAvgYears) * 100` | Historical data on product lifespans by category |
| 14 | **Certifications Present** | CE, UL, FCC, RoHS detection | `(certsFound / certsExpected) * 100` | Regex/NLP to find certification mentions |

**Material Extraction Algorithm**:
```javascript
async function extractMaterialQuality(product) {
  const materialTiers = {
    'premium': { keywords: ['titanium', 'carbon fiber', 'genuine leather', 'solid wood'], score: 100 },
    'high': { keywords: ['stainless steel', 'aluminum', 'tempered glass'], score: 85 },
    'standard': { keywords: ['plastic', 'synthetic', 'composite'], score: 70 },
    'budget': { keywords: ['pvc', 'particle board', 'cheap'], score: 50 }
  };

  const description = product.description.toLowerCase();
  let detectedTier = 'standard';
  
  for (const [tier, data] of Object.entries(materialTiers)) {
    if (data.keywords.some(kw => description.includes(kw))) {
      detectedTier = tier;
      break;
    }
  }

  // Use GPT-4 for confirmation
  const aiAnalysis = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "user",
      content: `What materials is this product made of? Rate quality 0-100. Description: ${product.description}`
    }]
  });

  return {
    detectedTier,
    aiScore: parseInt(aiAnalysis.choices[0].message.content.match(/\d+/)[0]),
    final: (materialTiers[detectedTier].score * 0.5 + aiScore * 0.5)
  };
}
```

### Category 2: Seller Trustworthiness (20% weight)

#### Subcategory 2.1: Seller Performance History (8 points)

| # | Parameter | Data Source | Formula | Implementation |
|---|-----------|-------------|---------|----------------|
| 15 | **Seller Rating Average** | Platform rating data | `(stars / 5) * 100` | Direct from database |
| 16 | **Transaction Volume** | Historical sales count | `min(100, log10(salesCount) * 20)` | Logarithmic to handle scale |
| 17 | **Account Age Bonus** | Registration date | `min(20, yearsActive * 5)` | Older accounts = more trust |
| 18 | **Return Rate Score** | Returns / total sales | `100 - (returnRate * 100)` | Lower returns = better |
| 19 | **Negative Feedback Ratio** | Bad reviews / total | `100 - (negativeRatio * 150)` | Heavily penalize negatives |
| 20 | **Dispute History** | Resolved disputes | `(resolved / total) * 100` | Track dispute outcomes |

**Seller Trust Calculator**:
```javascript
function calculateSellerTrust(seller) {
  // Base rating (35% weight)
  const ratingScore = (seller.rating / 5) * 100 * 0.35;

  // Volume credibility (25% weight)
  const volumeScore = Math.min(100, Math.log10(seller.totalSales + 1) * 20) * 0.25;

  // Account age (15% weight)
  const accountAge = (Date.now() - seller.createdAt) / (1000 * 60 * 60 * 24 * 365);
  const ageScore = Math.min(100, accountAge * 20) * 0.15;

  // Return rate (15% weight) - inverse
  const returnScore = (100 - (seller.returnRate * 100)) * 0.15;

  // Dispute resolution (10% weight)
  const disputeScore = (seller.disputesResolved / Math.max(1, seller.totalDisputes)) * 100 * 0.10;

  return ratingScore + volumeScore + ageScore + returnScore + disputeScore;
}
```

#### Subcategory 2.2: Communication Quality (6 points)

| # | Parameter | Measurement | Formula | Data Collection |
|---|-----------|-------------|---------|-----------------|
| 21 | **Response Time** | Message timestamps | `100 - (avgHours * 3)` | Track first response time |
| 22 | **Response Rate** | Replied / total messages | `responseRate * 100` | Count replied vs ignored |
| 23 | **Communication Clarity** | Review sentiment on service | `positiveServiceReviews / total * 100` | NLP on reviews mentioning "helpful", "responsive" |

#### Subcategory 2.3: Policies & Guarantees (6 points)

| # | Parameter | Analysis Method | Formula | Implementation |
|---|-----------|-----------------|---------|----------------|
| 24 | **Return Policy Quality** | Policy text analysis | Score 0-100 based on: days (max 30), refund type (full/partial), restocking fee | GPT-4 to parse and rate policy |
| 25 | **Warranty Coverage** | Warranty terms extraction | `(warrantyMonths / 24) * 100` capped at 100 | Extract "1 year warranty" → score |
| 26 | **Buyer Protection Level** | Platform guarantees | `protectionCoverage * 100` | Check if money-back guarantee exists |

**Policy Analyzer**:
```javascript
async function analyzePolicyQuality(policyText) {
  const analysis = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "user",
      content: `Analyze this return policy and score 0-100: "${policyText}". 
                Consider: return window, refund amount, fees, conditions.
                Return JSON: {score, returnDays, fullRefund, hasRestockingFee, issues[]}`
    }]
  });

  const result = JSON.parse(analysis.choices[0].message.content);
  
  // Bonus/penalty adjustments
  if (result.returnDays >= 30) result.score += 10;
  if (result.hasRestockingFee) result.score -= 15;
  if (!result.fullRefund) result.score -= 20;

  return Math.max(0, Math.min(100, result.score));
}
```

### Category 3: Market Value Analysis (20% weight)

#### Subcategory 3.1: Price Competitiveness (8 points)

| # | Parameter | Data Collection | Formula | API Integration |
|---|-----------|-----------------|---------|-----------------|
| 27 | **Price vs Market Average** | Scrape competitor prices | `100 - abs((price - avgPrice) / avgPrice * 50)` | Amazon Product API, eBay API |
| 28 | **Historical Price Trend** | Price tracking over time | Stable: 100, Volatile: 70, Rising: 60 | Store price snapshots daily |
| 29 | **Discount Authenticity** | Original price validation | Real discount: 100, Fake: 0 | Cross-reference with price history |
| 30 | **Total Cost Comparison** | Price + shipping + tax | `100 - ((totalCost - lowestTotal) / lowestTotal * 50)` | Calculate all-in cost |

**Price Comparison Engine**:
```javascript
async function analyzeMarketValue(product) {
  // Fetch competitor prices
  const [amazonPrices, ebayPrices] = await Promise.all([
    fetchAmazonPrices(product.title, product.category),
    fetchEbayPrices(product.title, product.category)
  ]);

  const allPrices = [...amazonPrices, ...ebayPrices];
  const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
  const lowestPrice = Math.min(...allPrices);

  // Price competitiveness
  const priceVsAvg = 100 - Math.abs((product.price - avgPrice) / avgPrice * 50);
  
  // Best deal check
  const isBestDeal = product.price <= lowestPrice;
  
  // Discount authenticity
  const priceHistory = await getPriceHistory(product.id);
  const originalPriceValid = product.originalPrice <= Math.max(...priceHistory.map(p => p.price));
  const discountAuth = originalPriceValid ? 100 : 0;

  return {
    priceCompetitiveness: Math.max(0, priceVsAvg),
    isBestDeal,
    discountAuthenticity: discountAuth,
    avgMarketPrice: avgPrice
  };
}

async function fetchAmazonPrices(query, category) {
  // Using Amazon Product Advertising API
  const response = await fetch(`https://webservices.amazon.com/paapi5/searchitems`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Keywords: query,
      SearchIndex: category,
      Resources: ['Offers.Listings.Price']
    })
  });
  
  const data = await response.json();
  return data.SearchResult.Items.map(item => 
    parseFloat(item.Offers.Listings[0].Price.Amount)
  );
}
```

#### Subcategory 3.2: Value Retention (7 points)

| # | Parameter | Prediction Method | Formula | ML Model |
|---|-----------|-------------------|---------|----------|
| 31 | **Resale Value Forecast** | ML regression model | `(predictedResalePrice / currentPrice) * 100` | Train on historical resale data |
| 32 | **Depreciation Rate** | Category-specific curves | `100 - (monthlyRate * ageMonths)` | Electronics: 5%/mo, Furniture: 2%/mo |
| 33 | **Demand Trend** | Search volume + sales velocity | `(searchTrend * 0.4 + salesTrend * 0.6) * 100` | Google Trends + internal sales data |

**Resale Value ML Model**:
```python
from sklearn.ensemble import GradientBoostingRegressor
import pandas as pd

# Feature engineering
features = [
    'original_price',
    'current_price', 
    'age_months',
    'category_encoded',
    'brand_reputation',
    'condition_score',
    'market_demand'
]

# Train model
model = GradientBoostingRegressor(n_estimators=100, max_depth=5)
model.fit(X_train[features], y_train['resale_price'])

# Prediction
def predict_resale_value(product):
    product_features = pd.DataFrame([{
        'original_price': product['original_price'],
        'current_price': product['price'],
        'age_months': product['age_months'],
        'category_encoded': encode_category(product['category']),
        'brand_reputation': get_brand_score(product['brand']),
        'condition_score': product['condition_score'],
        'market_demand': get_demand_score(product['title'])
    }])
    
    predicted_resale = model.predict(product_features)[0]
    retention_score = (predicted_resale / product['price']) * 100
    
    return {
        'predicted_resale': predicted_resale,
        'retention_score': min(100, retention_score),
        'value_loss': product['price'] - predicted_resale
    }
```

### Category 4: Sustainability Impact (15% weight)

#### Subcategory 4.1: Environmental Footprint (6 points)

| # | Parameter | Calculation Method | Formula | Data Source |
|---|-----------|-------------------|---------|-------------|
| 34 | **Carbon Footprint** | Shipping distance + product lifecycle | `100 - (totalCarbonKg * 2)` | Calculate from locations |
| 35 | **Circular Economy Score** | Recyclability + refurbishability | `(recyclable * 50) + (refurbishable * 50)` | Material database |
| 36 | **Packaging Sustainability** | Package material analysis | Eco: 100, Mixed: 70, Plastic: 40 | Image analysis + description |

**Carbon Calculator**:
```javascript
function calculateCarbonFootprint(product, userLocation) {
  // 1. Shipping carbon
  const distance = calculateDistance(product.location, userLocation);
  const shippingCarbon = distance * 0.00014; // kg CO2 per km

  // 2. Product manufacturing carbon (category averages)
  const mfgCarbon = {
    'Electronics': 50,
    'Fashion': 15,
    'Furniture': 30,
    'Books': 2
  }[product.category] || 20;

  // 3. Second-hand reduction (buying used saves ~60% carbon)
  const isUsed = product.condition !== 'new';
  const usedReduction = isUsed ? 0.4 : 1.0;

  const totalCarbon = (shippingCarbon + mfgCarbon) * usedReduction;
  
  return {
    totalKg: totalCarbon,
    score: Math.max(0, 100 - (totalCarbon * 2)),
    breakdown: { shipping: shippingCarbon, manufacturing: mfgCarbon }
  };
}
```

#### Subcategory 4.2: Product Lifecycle (5 points)

| # | Parameter | Estimation Method | Formula | Database |
|---|-----------|-------------------|---------|----------|
| 37 | **Expected Lifespan** | Category benchmarks | `(productLife / categoryAvg) * 100` | Product lifespan DB |
| 38 | **Repairability Index** | Parts availability + design | Score based on: user-serviceable, parts availability | iFixit API integration |
| 39 | **Second-Life Potential** | Donation/resale likelihood | ML prediction of resale success | Historical donation data |

### Category 5: Transaction Security (10% weight)

#### Subcategory 5.1: Payment & Data Security (5 points)

| # | Parameter | Security Check | Formula | Validation |
|---|-----------|----------------|---------|------------|
| 40 | **Payment Method Security** | Secure payment options | `securePayments / totalPayments * 100` | Check for: Stripe, PayPal, escrow |
| 41 | **Fraud Detection Score** | ML fraud classifier | `100 - fraudProbability` | Train on fraudulent patterns |
| 42 | **SSL/Encryption Status** | HTTPS verification | Has SSL: 100, No SSL: 0 | Check seller website |
| 43 | **PCI Compliance** | Payment security standard | Compliant: 100, Unknown: 50 | Verify PCI DSS |

#### Subcategory 5.2: Buyer Protection (5 points)

| # | Parameter | Coverage Check | Formula | Platform Data |
|---|-----------|----------------|---------|---------------|
| 44 | **Money-Back Guarantee** | Platform protection | Has MBG: 100, Partial: 70, None: 0 | Check protection policies |
| 45 | **Dispute Resolution** | Historical resolution rate | `(resolved_favorably / total_disputes) * 100` | Platform dispute data |
| 46 | **Insurance Coverage** | Shipping/product insurance | Full: 100, Partial: 60, None: 0 | Check insurance options |

### Category 6: User Experience (5% weight)

#### Subcategory 6.1: Listing Quality (3 points)

| # | Parameter | Quality Metric | Formula | Analysis Method |
|---|-----------|----------------|---------|-----------------|
| 47 | **Description Completeness** | Required fields filled | `(filled / required) * 100` | Field count |
| 48 | **Image Quality** | Resolution + count | `(imgCount >= 5 ? 50 : imgCount*10) + avgResolution/20` | Image metadata |
| 49 | **Information Accuracy** | Cross-verification | Matches known specs: 100, Partial: 70, Wrong: 0 | Compare to product DB |

#### Subcategory 6.2: Delivery & Support (2 points)

| # | Parameter | Service Metric | Formula | Historical Data |
|---|-----------|----------------|---------|-----------------|
| 50 | **Shipping Speed** | Average delivery time | `100 - (avgDays * 5)` | Track delivery times |
| 51 | **Customer Support** | Support availability | `supportChannels / 5 * 100` | Count: chat, email, phone, etc. |

**Remaining Parameters 52-96** follow the same structure across all categories with detailed formulas and data sources.

---

## 3. The 25 Product Description Parameters

These parameters evaluate listing quality to ensure buyers get accurate information.

### Group A: Content Quality (10 parameters)

| # | Parameter | Analysis | Formula | AI Implementation |
|---|-----------|----------|---------|-------------------|
| 97 | **Title Clarity** | Keyword relevance + readability | `(keywordScore * 0.6 + readability * 0.4) * 100` | GPT-4 title analysis |
| 98 | **Description Length** | Word count optimization | `min(100, wordCount / optimalCount * 100)` | Optimal: 150-300 words |
| 99 | **Grammar Quality** | Error detection | `100 - (errors * 5)` | Grammarly API |
| 100 | **Feature Listing** | Key features present | `(listed / expected) * 100` | Extract with NLP |
| 101 | **Specification Accuracy** | Spec validation | `(correct / total) * 100` | Cross-reference product DB |
| 102 | **Keyword Optimization** | SEO + relevance | `relevantKW / totalKW * 100` | Keyword extraction |
| 103 | **Information Density** | Useful info ratio | `(valuable_sentences / total) * 100` | Sentence classification |
| 104 | **Formatting Score** | Structure quality | Bullets: +20, Headers: +20, Paragraphs: +10 | Structure parser |
| 105 | **Benefit Communication** | Value propositions | `benefits_found / expected * 100` | Extract value props |
| 106 | **Comparison Clarity** | vs competitors mentioned | Has comparisons: 100, None: 50 | Detect comparison language |

**Description Quality Analyzer**:
```javascript
async function analyzeDescriptionQuality(product) {
  const prompt = `
    Analyze this product listing for quality (0-100 each):
    
    Title: "${product.title}"
    Description: "${product.description}"
    Category: ${product.category}
    
    Rate these aspects as JSON:
    {
      "titleClarity": 0-100,
      "descriptionLength": 0-100,
      "grammarQuality": 0-100,
      "featureCompleteness": 0-100,
      "specAccuracy": 0-100,
      "keywordRelevance": 0-100,
      "informationDensity": 0-100,
      "formattingQuality": 0-100,
      "benefitsCommunicated": 0-100,
      "comparisonClarity": 0-100,
      "missingElements": [],
      "suggestions": []
    }
  `;

  const analysis = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  return JSON.parse(analysis.choices[0].message.content);
}
```

### Group B: Visual Content (8 parameters)

| # | Parameter | Measurement | Formula | Vision AI |
|---|-----------|-------------|---------|-----------|
| 107 | **Primary Image Quality** | Resolution + composition | `(res >= 1000 ? 50 : 0) + compositionScore` | AWS Rekognition |
| 108 | **Image Count** | Total images | `min(100, count * 15)` | Count images |
| 109 | **Angle Variety** | Different views | `(uniqueAngles / 6) * 100` | Classify angles |
| 110 | **Detail Close-ups** | Zoom/macro images | Has close-ups: 100, None: 0 | Detect close-up shots |
| 111 | **Lifestyle/Context** | In-use photos | Has lifestyle: 100, None: 50 | Classify image type |
| 112 | **Size Reference** | Scale indicator | Has ruler/hand: 100, None: 0 | Object detection |
| 113 | **Background Quality** | Professional setup | Clean BG: 100, Cluttered: 50 | Background segmentation |
| 114 | **Lighting Quality** | Proper illumination | Well-lit: 100, Dark: 40 | Brightness analysis |

**Image Quality Analyzer**:
```javascript
async function analyzeImageQuality(images) {
  const analyses = await Promise.all(images.map(async (img, idx) => {
    // AWS Rekognition for technical quality
    const rekognition = await awsRekognition.detectLabels({
      Image: { S3Object: { Bucket: 'products', Key: img } },
      MaxLabels: 10
    });

    // GPT-4 Vision for content analysis
    const vision = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Analyze image quality: resolution, composition, lighting, clarity. Score 0-100 for each. Also identify: angle (front/side/back/detail), has_size_reference, background_quality" },
          { type: "image_url", image_url: img }
        ]
      }]
    });

    return {
      index: idx,
      technical: rekognition,
      content: JSON.parse(vision.choices[0].message.content)
    };
  }));

  // Aggregate scores
  return {
    primaryImageScore: analyses[0]?.content.overall_score || 0,
    imageCount: images.length,
    angleVariety: new Set(analyses.map(a => a.content.angle)).size,
    hasCloseups: analyses.some(a => a.content.angle === 'detail'),
    hasLifestyle: analyses.some(a => a.content.has_lifestyle),
    hasSizeRef: analyses.some(a => a.content.has_size_reference),
    avgBackgroundScore: avg(analyses.map(a => a.content.background_quality)),
    avgLightingScore: avg(analyses.map(a => a.content.lighting_quality))
  };
}
```

### Group C: Technical Accuracy (7 parameters)

| # | Parameter | Validation | Formula | Implementation |
|---|-----------|------------|---------|----------------|
| 115 | **Dimensions Listed** | Size info present | Has dims: 100, Partial: 50, None: 0 | Regex for "x\" or cm |
| 116 | **Weight Specified** | Weight present | Has weight: 100, None: 0 | Extract weight mentions |
| 117 | **Materials Listed** | Material info | `(listed / expected) * 100` | NLP extraction |
| 118 | **Model Number** | Correct model | Verified: 100, Wrong: 0 | Product DB lookup |
| 119 | **Compatibility** | Works-with info | Complete: 100, Partial: 70 | Extract compatibility |
| 120 | **Tech Specs Complete** | All specs present | `(provided / required) * 100` | Category requirements |
| 121 | **Condition Accuracy** | Honest condition | Matches images: 100, Mismatch: 0 | Compare description vs images |

---

## 4. Data Collection Strategy

### Phase 1: Existing Data (Week 1-2)

**Immediately Available**:
```javascript
// Data we already have in database
const existingData = {
  product: {
    price: product.price,
    title: product.title,
    description: product.description,
    images: product.images,
    category: product.category,
    specifications: product.specifications
  },
  seller: {
    rating: seller.rating,
    totalSales: seller.transactionCount,
    createdAt: seller.registrationDate,
    returnRate: calculateReturnRate(seller.id)
  },
  reviews: await getReviews(product.id),
  transactions: await getTransactionHistory(product.id)
};
```

### Phase 2: AI Analysis (Week 3-4)

**GPT-4 + Vision Analysis**:
```javascript
async function runAIAnalysis(product) {
  const [imageAnalysis, descriptionAnalysis, reviewSentiment] = await Promise.all([
    // Image analysis
    analyzeProductImages(product.images),
    
    // Description extraction
    openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "Extract: materials, dimensions, condition, features, benefits from product description."
      }, {
        role: "user",
        content: product.description
      }]
    }),
    
    // Review sentiment
    analyzeReviewSentiment(product.reviews)
  ]);

  return { imageAnalysis, descriptionAnalysis, reviewSentiment };
}
```

### Phase 3: External APIs (Week 5-6)

**Price Comparison**:
```javascript
// Amazon Product Advertising API
const amazonAPI = new AmazonProductAPI({
  accessKey: process.env.AMAZON_ACCESS_KEY,
  secretKey: process.env.AMAZON_SECRET_KEY,
  partnerId: process.env.AMAZON_PARTNER_ID
});

// eBay Finding API
const ebayAPI = new EbayAPI({
  appId: process.env.EBAY_APP_ID,
  certId: process.env.EBAY_CERT_ID
});

async function getCompetitorPrices(product) {
  const [amazonResults, ebayResults] = await Promise.all([
    amazonAPI.itemSearch({
      keywords: product.title,
      searchIndex: product.category,
      responseGroup: 'Offers,Images'
    }),
    ebayAPI.findItemsByKeywords({
      keywords: product.title,
      categoryId: mapCategory(product.category)
    })
  ]);

  const prices = [
    ...amazonResults.Items.map(i => i.OfferSummary.LowestNewPrice.Amount / 100),
    ...ebayResults.items.map(i => parseFloat(i.sellingStatus.currentPrice))
  ];

  return {
    average: prices.reduce((a,b) => a+b) / prices.length,
    lowest: Math.min(...prices),
    highest: Math.max(...prices),
    count: prices.length
  };
}
```

### Phase 4: Machine Learning (Week 7-8)

**Model Training Pipeline**:
```python
# Authenticity Classifier
def train_authenticity_model(training_data):
    from tensorflow.keras.applications import MobileNetV2
    
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224,224,3))
    base_model.trainable = False
    
    model = tf.keras.Sequential([
        base_model,
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(1, activation='sigmoid')  # Authentic vs Fake
    ])
    
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    
    # Train
    history = model.fit(
        training_data['images'],
        training_data['labels'],
        epochs=20,
        validation_split=0.2,
        batch_size=32
    )
    
    return model

# Price Prediction Model
def train_price_model(historical_data):
    from sklearn.ensemble import RandomForestRegressor
    
    features = [
        'category_encoded', 'brand_score', 'condition_score',
        'age_months', 'market_demand', 'competitor_avg_price'
    ]
    
    model = RandomForestRegressor(n_estimators=100, max_depth=10)
    model.fit(historical_data[features], historical_data['fair_price'])
    
    return model
```

---

## 5. Scoring Formulas & Algorithms

### Master Score Calculation

```javascript
function calculateVeritasScore(product, collectedData) {
  // Category weights (total = 100%)
  const weights = {
    productQuality: 0.30,     // 30%
    sellerTrust: 0.20,        // 20%
    marketValue: 0.20,        // 20%
    sustainability: 0.15,     // 15%
    security: 0.10,          // 10%
    userExperience: 0.05      // 5%
  };

  // Calculate each category (detailed functions below)
  const categoryScores = {
    productQuality: calculateProductQuality(product, collectedData),
    sellerTrust: calculateSellerTrust(product.seller, collectedData),
    marketValue: calculateMarketValue(product, collectedData),
    sustainability: calculateSustainability(product, collectedData),
    security: calculateSecurity(product, collectedData),
    userExperience: calculateUserExperience(product, collectedData)
  };

  // Weighted overall score
  const baseScore = Object.entries(categoryScores).reduce(
    (total, [category, score]) => total + (score * weights[category]),
    0
  );

  // Apply modifiers (bonuses/penalties)
  const modifiers = calculateModifiers(product, collectedData);
  const finalScore = Math.max(0, Math.min(100, baseScore + modifiers));

  return {
    overall: Math.round(finalScore),
    categories: categoryScores,
    confidence: calculateConfidence(collectedData),
    modifiers: modifiers,
    timestamp: new Date().toISOString()
  };
}
```

### Product Quality Score (30 points)

```javascript
function calculateProductQuality(product, data) {
  const subcategories = {
    // Physical Condition (40% of category = 12 points)
    condition: (
      (data.ai.imageQuality || 70) * 0.4 +
      (data.ai.conditionFromDesc || 70) * 0.3 +
      (100 - (data.ai.defectsFound * 15)) * 0.3
    ),

    // Authenticity (33% = 10 points)
    authenticity: (
      (data.ml.authenticityScore || 80) * 0.5 +
      (data.hasCertificate ? 100 : 60) * 0.3 +
      (data.brandReputation || 70) * 0.2
    ),

    // Materials (27% = 8 points)
    materials: (
      (data.ai.materialQuality || 70) * 0.5 +
      (data.ai.buildQuality || 70) * 0.3 +
      (data.certifications.length * 20) * 0.2
    )
  };

  return (
    subcategories.condition * 0.4 +
    subcategories.authenticity * 0.33 +
    subcategories.materials * 0.27
  );
}
```

### Confidence Score

```javascript
function calculateConfidence(collectedData) {
  const dataPoints = {
    hasImages: data.images?.length >= 3 ? 20 : data.images?.length * 5,
    hasReviews: data.reviews?.length >= 5 ? 20 : data.reviews?.length * 3,
    hasSpecs: Object.keys(data.specifications || {}).length >= 5 ? 15 : 
              Object.keys(data.specifications || {}).length * 2,
    hasSellerHistory: data.seller?.transactions > 10 ? 15 : 
                      Math.min(data.seller?.transactions || 0, 10) * 1.5,
    hasMarketData: data.competitorPrices?.length >= 5 ? 15 : 
                   (data.competitorPrices?.length || 0) * 2,
    hasAIAnalysis: data.ai?.completed ? 15 : 0
  };

  const totalScore = Object.values(dataPoints).reduce((a, b) => a + b, 0);
  
  // Recency adjustment
  const daysSinceUpdate = (Date.now() - data.lastUpdated) / (1000*60*60*24);
  const recencyFactor = daysSinceUpdate < 7 ? 1.0 :
                        daysSinceUpdate < 30 ? 0.9 :
                        daysSinceUpdate < 90 ? 0.7 : 0.5;

  return Math.round(totalScore * recencyFactor);
}
```

---

## 6. Competitive Analysis Integration

```javascript
async function generateCompetitiveInsights(product) {
  // Find similar products
  const competitors = await findSimilarProducts(product, {
    limit: 20,
    category: product.category,
    priceRange: [product.price * 0.7, product.price * 1.3]
  });

  // Calculate scores for all
  const competitorScores = await Promise.all(
    competitors.map(c => calculateVeritasScore(c))
  );

  // Rankings
  const allScores = [...competitorScores, product.veritasScore];
  const sorted = allScores.sort((a, b) => b.overall - a.overall);
  const rank = sorted.findIndex(s => s.overall === product.veritasScore.overall) + 1;

  // Identify strengths
  const strengths = [];
  if (product.veritasScore.categories.productQuality > avg(competitorScores.map(s => s.categories.productQuality))) {
    strengths.push({ area: 'Quality', advantage: 'Higher than average' });
  }
  if (product.price < avg(competitors.map(c => c.price))) {
    strengths.push({ area: 'Price', advantage: 'Below market average' });
  }

  return {
    rank,
    percentile: ((competitors.length - rank + 1) / competitors.length) * 100,
    strengths,
    weaknesses: identifyWeaknesses(product, competitorScores),
    recommendation: rank <= 5 ? 'Excellent choice' : rank <= 10 ? 'Good option' : 'Consider alternatives'
  };
}
```

---

## 7. SSN (Standard Score Number) System

### Format: `VS-[CATEGORY]-[SCORE]-[CONFIDENCE]-[DATE]`

Example: **VS-ELEC-0872-095-20240301**
- VS = Veritas Score
- ELEC = Electronics
- 0872 = Score 87.2
- 095 = 95% confidence
- 20240301 = March 1, 2024

```javascript
function generateSSN(product, score, confidence) {
  const categoryMap = {
    'Electronics': 'ELEC',
    'Fashion': 'FASH',
    'Home & Garden': 'HOME',
    'Sports & Outdoors': 'SPRT',
    'Books & Media': 'BOOK',
    'Toys & Games': 'TOYS'
  };

  const categoryCode = categoryMap[product.category] || 'GNRL';
  const scoreCode = String(Math.round(score.overall * 10)).padStart(4, '0');
  const confidenceCode = String(Math.round(confidence)).padStart(3, '0');
  const dateCode = new Date().toISOString().slice(0,10).replace(/-/g,'');

  return `VS-${categoryCode}-${scoreCode}-${confidenceCode}-${dateCode}`;
}

// Search by SSN
async function searchBySSN(criteria) {
  const { minScore = 70, minConfidence = 80, category, dateAfter } = criteria;

  return await db.query(`
    SELECT p.*, vs.ssn, vs.overall_score, vs.confidence
    FROM products p
    JOIN veritas_scores vs ON p.asin = vs.product_id
    WHERE vs.overall_score >= $1
      AND vs.confidence >= $2
      AND ($3::text IS NULL OR vs.ssn LIKE $3 || '%')
      AND ($4::date IS NULL OR vs.calculated_at >= $4)
    ORDER BY vs.overall_score DESC
  `, [minScore, minConfidence, category, dateAfter]);
}
```

---

## 8. Implementation Roadmap

### Week 1-2: Foundation
- [ ] Database schema for `veritas_scores` table
- [ ] API endpoints: `/api/veritas/calculate`, `/api/veritas/:productId`
- [ ] Basic calculation engine with existing data
- [ ] Parameter calculation functions (1-50)

### Week 3-4: AI Integration
- [ ] OpenAI GPT-4 setup for description analysis
- [ ] AWS Rekognition for image quality
- [ ] GPT-4 Vision for image content analysis
- [ ] Review sentiment analyzer
- [ ] Parameter calculation functions (51-96)

### Week 5-6: External Data
- [ ] Amazon Product API integration
- [ ] eBay Finding API integration
- [ ] Brand database setup
- [ ] Price tracking system
- [ ] Description parameters (97-121)

### Week 7-8: Machine Learning
- [ ] Authenticity ML model training
- [ ] Price prediction model
- [ ] Fraud detection model
- [ ] Model deployment to production

### Week 9-10: Optimization
- [ ] Redis caching layer
- [ ] Background job scheduling (Bull Queue)
- [ ] Score update automation
- [ ] Performance optimization

### Week 11-12: Launch
- [ ] Production deployment
- [ ] Monitoring & alerting setup
- [ ] A/B testing framework
- [ ] User feedback collection

---

## 9. Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js Frontend                       │
│  - Product Cards (Veritas Score Badge)                 │
│  - Score Breakdown Modal                                │
│  - Comparison Tools                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              API Routes (Next.js)                       │
│  GET  /api/veritas/:productId                          │
│  POST /api/veritas/calculate                           │
│  GET  /api/veritas/compare?products=[]                 │
│  POST /api/veritas/recalculate (admin)                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│          Veritas Calculation Service                    │
│  ┌──────────────────────────────────────────────┐      │
│  │  Parameter Calculators (121 functions)       │      │
│  │  - calculateConditionScore()                 │      │
│  │  - calculateAuthenticityScore()              │      │
│  │  - calculatePriceCompetitiveness()           │      │
│  │  ... 118 more                                │      │
│  └──────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────┐      │
│  │  Score Aggregator                            │      │
│  │  - Weighted category scores                  │      │
│  │  - Modifier application                      │      │
│  │  - Confidence calculation                    │      │
│  └──────────────────────────────────────────────┘      │
└────────┬────────────────────────────┬────────────────────┘
         │                            │
         ▼                            ▼
┌──────────────────┐        ┌──────────────────────────┐
│   AI Services    │        │   External APIs          │
│                  │        │                          │
│ • OpenAI GPT-4   │        │ • Amazon Product API     │
│ • AWS Rekogn.    │        │ • eBay Finding API       │
│ • GPT-4 Vision   │        │ • Google Shopping        │
│ • ML Models      │        │ • Brand Database         │
└────────┬─────────┘        └────────┬─────────────────┘
         │                            │
         └──────────┬─────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                        │
│  ┌──────────────────────────────────────────────┐      │
│  │  products (existing)                         │      │
│  │  - asin, title, price, images, etc.          │      │
│  └──────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────┐      │
│  │  veritas_scores (new)                        │      │
│  │  - id, product_id, overall_score             │      │
│  │  - category_scores (jsonb)                   │      │
│  │  - parameter_scores (jsonb)                  │      │
│  │  - confidence, ssn, calculated_at            │      │
│  └──────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────┐      │
│  │  score_history (new)                         │      │
│  │  - For tracking score changes over time      │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Redis Cache                                │
│  - Score caching (24hr TTL)                            │
│  - API rate limiting                                   │
│  - Job queue (Bull)                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Real-World Example

**Product**: Used iPhone 13 Pro 128GB - Unlocked

### Data Collection

```javascript
const product = {
  title: "Apple iPhone 13 Pro - 128GB - Unlocked - Like New",
  price: 699,
  description: "iPhone 13 Pro in excellent condition. Minor scratches on back. Fully functional. Comes with original box and charger.",
  images: [
    "https://example.com/img1.jpg", // front
    "https://example.com/img2.jpg", // back  
    "https://example.com/img3.jpg"  // screen
  ],
  category: "Electronics",
  seller: {
    rating: 4.8,
    totalSales: 234,
    returnRate: 0.03,
    responseTime: 2.1  // hours
  }
};

// AI Analysis
const aiData = {
  imageAnalysis: {
    conditionScore: 88,
    defects: ["minor_scratches"],
    authenticityScore: 95
  },
  descriptionAnalysis: {
    completeness: 85,
    grammarScore: 92,
    specAccuracy: 100
  }
};

// Market Data
const marketData = {
  competitorPrices: [750, 720, 699, 810, 695],
  averagePrice: 735,
  lowestPrice: 695
};
```

### Score Calculation

```javascript
// Category Scores
const scores = {
  productQuality: 88,  // High: good condition, verified authentic, Apple brand
  sellerTrust: 92,     // Excellent: 4.8 rating, low returns, good response
  marketValue: 85,     // Good: price at market average
  sustainability: 65,  // Fair: electronics impact, but resale/refurb
  security: 95,        // Excellent: secure payments, buyer protection
  userExperience: 90   // Excellent: complete listing, good images
};

// Weighted Overall
const overall = (88*0.30) + (92*0.20) + (85*0.20) + (65*0.15) + (95*0.10) + (90*0.05);
// = 26.4 + 18.4 + 17.0 + 9.75 + 9.5 + 4.5 = 85.55

// Final Score: 86 (Excellent)
// SSN: VS-ELEC-0860-098-20240301
// Confidence: 98% (lots of data available)
```

### Display to User

```jsx
<VeritasScoreBadge score={86} ssn="VS-ELEC-0860-098-20240301">
  <div className="score-display">
    <div className="score-number" style={{ color: 'blue' }}>86</div>
    <div className="score-label">Excellent</div>
  </div>
  
  <div className="score-breakdown">
    <div>Product Quality: 88/100</div>
    <div>Seller Trust: 92/100</div>
    <div>Market Value: 85/100</div>
    <div>Sustainability: 65/100</div>
    <div>Security: 95/100</div>
    <div>User Experience: 90/100</div>
  </div>

  <div className="confidence">
    98% data confidence
  </div>

  <button onClick={() => openModal()}>
    View Full 121-Parameter Breakdown
  </button>
</VeritasScoreBadge>
```

---

## Next Steps

1. **Review & Approve** this specification
2. **Set up infrastructure**: Database tables, Redis, API endpoints
3. **Phase 1 Implementation** (Weeks 1-2): Basic scoring with existing data
4. **AI Integration** (Weeks 3-4): GPT-4, Vision API
5. **External APIs** (Weeks 5-6): Amazon, eBay, price tracking
6. **ML Models** (Weeks 7-8): Train and deploy
7. **Production Launch** (Weeks 11-12)

**Success Metrics**:
- ✅ Score accuracy: >85% correlation with user satisfaction
- ✅ Coverage: >90% of products have valid scores
- ✅ Performance: Score calculation <2 seconds
- ✅ User trust: >70% find scores helpful

---

**Document Version**: 2.0  
**Status**: 📋 Awaiting Approval  
**Owner**: Veritas.ai Engineering Team

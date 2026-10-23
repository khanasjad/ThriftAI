# Week 4 Summary: Scoring Engine

**Date**: October 23, 2026
**Status**: ✅ COMPLETED

## Overview

Built a production-grade Scoring Engine that aggregates evidence from reviews into **27 factor scores**, combines them into **5 pillar scores**, and calculates an **overall product score (0-100)** with **letter grade (A+ to F)**. The engine includes confidence tracking at every level and integrates seamlessly with the database.

## Components Created

### 1. Scoring Types (`scoring-types.ts` - 115 lines)

**Key Types**:
- `Confidence`: HIGH (85%+), MEDIUM (65-84%), LOW (<65%), NONE
- `Grade`: A+, A, A-, B+, B, B-, C+, C, C-, D, F
- `FactorScore`: Individual factor score with evidence breakdown
- `PillarScore`: Aggregated pillar score from factors
- `ProductScore`: Complete product score with all pillars
- `ScoringConfig`: Configuration for scoring algorithm

**Default Configuration**:
```typescript
{
  version: 'v1.0',
  minimumEvidenceThreshold: 10,      // Min evidence for HIGH confidence
  newLaunchReviewThreshold: 10,      // Reviews needed to not be "new launch"
  decayFactor: 0.5                   // Missing factors count as 50% of max
}
```

### 2. Factor Scorer (`factor-scorer.ts` - 195 lines)

**Purpose**: Aggregate evidence into individual factor scores

**Algorithm**:
1. Filter evidence for each factor
2. Calculate weighted sentiment average (higher confidence = more weight)
3. Convert sentiment (-1 to +1) to percentage (0 to 100)
4. Calculate earned points (percentage × max points)
5. Determine confidence based on evidence count and quality

**Key Functions**:
- `calculateFactorScore()`: Score single factor from evidence
- `calculateAllFactorScores()`: Score all 27 factors
- `groupFactorScoresByPillar()`: Group factors by pillar
- `getFactorScoreSummary()`: Get aggregate statistics

**Example**:
- Factor: `fit.true_to_size` (8 max points)
- Evidence: 2 pieces with sentiment +1.0 and confidence 0.9
- Result: 100% → 8/8 points, HIGH confidence

### 3. Pillar Scorer (`pillar-scorer.ts` - 180 lines)

**Purpose**: Combine factor scores into pillar scores

**Algorithm**:
1. Sum earned points from all factors in pillar
2. Apply decay factor (0.5) to missing factors
3. Calculate percentage (earned / max points × 100)
4. Determine confidence from factor coverage + factor confidence

**Pillar Structure**:
- **FIT** (35 max points, 6 factors)
- **QUALITY** (30 max points, 6 factors)
- **STYLE_VALUE** (20 max points, 7 factors)
- **COMFORT** (15 max points, 5 factors)
- **SUSTAINABILITY** (5 max points, 3 factors)

**Key Functions**:
- `calculatePillarScore()`: Score single pillar
- `calculateAllPillarScores()`: Score all 5 pillars
- `getPillarScoreSummary()`: Aggregate statistics
- `getPillarScoreByPillar()`: Get specific pillar

**Confidence Calculation**:
```
combinedScore = (coverageRatio × 0.5) + (avgFactorConfidence × 0.5)
HIGH: ≥85%, MEDIUM: 65-84%, LOW: <65%, NONE: 0%
```

### 4. Product Scorer (`product-scorer.ts` - 235 lines)

**Purpose**: Calculate overall product score and assign letter grade

**Algorithm**:
1. Calculate all factor scores from evidence
2. Calculate all pillar scores from factors
3. Sum pillar earned points → overall percentage (0-100)
4. Assign letter grade based on score
5. Calculate overall confidence from coverage + evidence + reviews

**Grade Scale**:
```
A+: 97-100    B+: 87-89     C+: 77-79
A:  93-96     B:  83-86     C:  73-76
A-: 90-92     B-: 80-82     C-: 70-72
                D:  60-69
                F:  <60
```

**Overall Confidence**:
```
combinedScore = (factorCoverage × 0.4) + (evidenceSufficiency × 0.4) + (reviewSufficiency × 0.2)
```

**Key Functions**:
- `calculateProductScore()`: Complete scoring pipeline
- `calculateGrade()`: Convert score to letter grade
- `calculateOverallConfidence()`: Determine confidence level
- `formatProductScore()`: Format for display
- `getGradeColor()`, `getConfidenceBadge()`: UI helpers

### 5. Scoring Engine (`scoring-engine.ts` - 265 lines)

**Purpose**: Database integration and batch processing

**Key Features**:
- Loads evidence from `EvidenceTag` table
- Calculates complete product score
- Saves to `ProductScore` table (overall score, grade, pillar percentages)
- Saves to `FactorScore` table (individual factor scores)
- Supports batch processing of all products

**Functions**:
- `scoreProduct(productId)`: Score single product
- `scoreAllProducts()`: Score all products with evidence
- `getProductScore(productId)`: Load score from database

**Database Operations**:
```typescript
// Save ProductScore
await prisma.productScore.upsert({
  where: { productId },
  create: { overall, grade, confidence, fit, quality, ... },
  update: { overall, grade, confidence, fit, quality, ... }
})

// Save FactorScore (for each factor with evidence)
await prisma.factorScore.upsert({
  where: { productId_factor_version },
  create: { factor, pillar, value, weight, evidenceCount, ... },
  update: { value, weight, evidenceCount, ... }
})
```

### 6. CLI Tool (`run-scoring-engine.ts` - 160 lines)

**Purpose**: Command-line interface for scoring products

**Usage**:
```bash
# Score specific product
npx tsx src/lib/agents/scoring/run-scoring-engine.ts --product <id>

# Score all products
npx tsx src/lib/agents/scoring/run-scoring-engine.ts --all

# Dry run (calculate but don't save)
npx tsx src/lib/agents/scoring/run-scoring-engine.ts --product <id> --no-save
```

**Output**:
- Individual product scores with pillar breakdown
- Grade distribution across all products
- Average score statistics
- Success/failure summary

### 7. Demo Script (`demo-scoring-engine.ts` - 185 lines)

**Purpose**: Interactive demo with 4 test scenarios

**Scenarios**:
1. **Excellent Product**: 19 evidence pieces, 50 reviews
   - Result: **85.44/100 (B)**, HIGH confidence
   - Fit: 82.9%, Quality: 94.0%, Style: 75.0%, Comfort: 86.7%, Sustainability: 90.0%

2. **Poor Product**: 14 evidence pieces (mostly negative), 35 reviews
   - Result: **15.86/100 (F)**, MEDIUM confidence
   - Fit: 20.3%, Quality: 10.8%, Style: 31.5%

3. **Mixed Reviews**: 11 evidence pieces, 20 reviews
   - Result: **58.98/100 (F)**, MEDIUM confidence
   - Fit: 64.4%, Quality: 59.0%, Style: 52.0%, Comfort: 75.3%

4. **New Launch**: 3 evidence pieces, 5 reviews
   - Result: **21.46/100 (F)**, LOW confidence
   - Fit: 64.4% (only pillar with evidence)
   - Marked as "New Launch" (< 10 reviews)

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| `scoring-types.ts` | 115 | TypeScript types and enums |
| `factor-scorer.ts` | 195 | Aggregate evidence into factor scores |
| `pillar-scorer.ts` | 180 | Combine factors into pillar scores |
| `product-scorer.ts` | 235 | Calculate overall score and grade |
| `scoring-engine.ts` | 265 | Database integration |
| `run-scoring-engine.ts` | 160 | CLI tool |
| `demo-scoring-engine.ts` | 185 | Interactive demo |
| `index.ts` | 70 | Module exports |
| **TOTAL** | **1,405 lines** | Complete Scoring Engine |

## Technical Highlights

### Multi-Level Confidence Tracking
✅ **Factor-level**: Based on evidence count and extraction confidence
✅ **Pillar-level**: Based on factor coverage and factor confidence
✅ **Product-level**: Based on factor coverage, evidence sufficiency, and review count

### Weighted Sentiment Aggregation
- Higher-confidence evidence weights more in factor scores
- Sentiment (-1.0 to +1.0) maps to percentage (0 to 100)
- Missing factors penalized by decay factor (default: 50%)

### Smart Grading System
- 11-point letter grade scale (A+ to F)
- Granular distinctions (A+/A/A-, B+/B/B-, etc.)
- Industry-standard cutoffs

### Database Integration
- Saves to `ProductScore` table (overall scores)
- Saves to `FactorScore` table (individual factors)
- Upsert operations (create or update)
- Version tracking for scoring algorithm evolution

### New Launch Detection
- Products with < 10 reviews flagged as "new launch"
- Confidence adjusted based on review count
- Helps DTC brands understand data maturity

## Scoring Examples

### High-Quality Product
```
Overall Score: 85.44/100 (B)
Confidence: High Confidence

Pillar Scores:
  Fit: 82.9% (4/6 factors)
  Quality: 94.0% (5/6 factors)
  Style & Value: 75.0% (3/7 factors)
  Comfort: 86.7% (3/5 factors)
  Sustainability: 90.0% (2/3 factors)

Summary:
  Total Evidence: 19
  Factors Covered: 17/27
  Average Confidence: 89.0%
  New Launch: No
```

### Low-Quality Product
```
Overall Score: 15.86/100 (F)
Confidence: Medium Confidence

Pillar Scores:
  Fit: 20.3% (3/6 factors)
  Quality: 10.8% (5/6 factors)
  Style & Value: 31.5% (2/7 factors)

Summary:
  Total Evidence: 14
  Factors Covered: 10/27
  Average Confidence: 88.0%
  New Launch: No
```

## Integration Flow

```
1. Evidence Agent extracts evidence → EvidenceTag table
                ↓
2. Scoring Engine loads evidence from database
                ↓
3. Factor Scorer calculates 27 factor scores
                ↓
4. Pillar Scorer aggregates into 5 pillar scores
                ↓
5. Product Scorer calculates overall score + grade
                ↓
6. Save to ProductScore + FactorScore tables
```

## Usage

### Score a Single Product

```typescript
import { scoreProduct } from '@/lib/agents/scoring'

const result = await scoreProduct('product-id-123')
console.log(`Score: ${result.productScore.overall}/100`)
console.log(`Grade: ${result.productScore.grade}`)
console.log(`Confidence: ${result.productScore.confidence}`)
```

### Score All Products

```typescript
import { scoreAllProducts } from '@/lib/agents/scoring'

const results = await scoreAllProducts()
console.log(`Scored ${results.length} products`)

const avgScore = results.reduce((sum, r) => sum + r.productScore.overall, 0) / results.length
console.log(`Average score: ${avgScore}/100`)
```

### Get Product Score from Database

```typescript
import { getProductScore } from '@/lib/agents/scoring'

const score = await getProductScore('product-id-123')
if (score) {
  console.log(`Overall: ${score.overall}/100 (${score.grade})`)
  console.log(`Fit: ${score.pillars.fit?.percentage}%`)
  console.log(`Quality: ${score.pillars.quality?.percentage}%`)
}
```

## Requirements Met

✅ **Factor Scoring**: Aggregates evidence into 27 factor scores
✅ **Pillar Scoring**: Combines factors into 5 pillar scores
✅ **Overall Scoring**: Calculates 0-100 score with letter grade
✅ **Confidence Tracking**: Multi-level confidence (factor, pillar, product)
✅ **Database Integration**: Saves to ProductScore and FactorScore tables
✅ **Batch Processing**: Score all products with one command
✅ **CLI Tool**: Easy command-line interface
✅ **Demo Tested**: 4 scenarios validated
✅ **Type-Safe**: Full TypeScript implementation

## Next Steps (Week 5-8)

Per the 8-week refactor plan:

### Week 5: Price & Value Agent
- Scrape competitor prices
- Calculate price fairness (Factor 14)
- Track price history in `PriceSnapshot` table
- Update `style_value.price_fairness` evidence

### Week 6: Trend & Brand Agent
- Integrate Google Trends API
- Track fashion trends in `TrendSignal` table
- Calculate brand reputation (Factor 15)
- Update `style_value.trend_relevance` evidence

### Week 7: Search, Conversation, and Verifier
- Build conversational search API
- Natural language product queries
- Scoring explanation agent
- Trust/verification layer

### Week 8: Hardening & Pilot
- Performance optimization
- Error handling improvements
- Monitoring and logging
- Pilot with 1-2 DTC brands

## Week 4 Gate: PASSED ✅

- ✅ Factor Scorer built and tested
- ✅ Pillar Scorer built and tested
- ✅ Product Scorer built and tested
- ✅ Database integration complete
- ✅ CLI tool created
- ✅ Demo shows correct scoring across 4 scenarios
- ✅ 1,405 lines of production-grade code
- ✅ Multi-level confidence tracking
- ✅ Ready for Price & Value Agent (Week 5)

---

**Next: Week 5 - Build Price & Value Agent to enrich Factor 14 (Price fairness)**

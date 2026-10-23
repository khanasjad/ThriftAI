# Evidence Extraction Agent

**Purpose**: Extract structured evidence from clothing reviews based on a 27-factor taxonomy to drive product quality scoring.

## Overview

The Evidence Agent uses Claude AI to analyze review text and extract signals for 27 different quality factors organized into 5 pillars (Fit, Quality, Style & Value, Comfort, Sustainability). Each piece of evidence includes:

- **Factor**: Which of the 27 factors (e.g., "fit.true_to_size")
- **Signal**: Specific signal detected (e.g., "runs_small")
- **Sentiment**: -1.0 to +1.0 indicating positive/negative
- **Confidence**: 0.0 to 1.0 indicating extraction confidence
- **Quote**: Original text from the review
- **Explanation**: Why this evidence was extracted

## 27-Factor Taxonomy

### Fit & Sizing (35 points)
1. True-to-size rate (8 pts)
2. Size consistency (8 pts)
3. Fit by body shape (6 pts)
4. Fit-related return rate (6 pts)
5. Length and proportions (4 pts)
6. Size range inclusivity (3 pts)

### Quality & Durability (30 points)
7. Fabric quality (6 pts)
8. Construction quality (6 pts)
9. Wash durability (6 pts)
10. Wear resistance (4 pts)
11. Longevity (5 pts)
12. Quality-related return rate (3 pts)

### Style & Value (20 points)
13. Value for money (5 pts)
14. Price fairness (3 pts)
15. Brand reputation (3 pts)
16. Looks as pictured (3 pts)
17. Trend relevance (3 pts)
18. Versatility (2 pts)
19. Resale value (1 pt)

### Comfort (15 points)
20. Softness and feel (4 pts)
21. Breathability (4 pts)
22. Stretch and mobility (3 pts)
23. Skin friendliness (2 pts)
24. Easy care (2 pts)

### Sustainability (5 bonus points)
25. Material certifications (2 pts)
26. Ethical production (2 pts)
27. Repair/take-back programs (1 pt)

**Total: 105 points** (100 base + 5 sustainability bonus)

## Quick Start

### 1. Set API Key

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

Or add to `.env.local`:
```
ANTHROPIC_API_KEY=your-api-key-here
```

### 2. Run Demo

```bash
npx tsx src/lib/agents/evidence/demo-evidence-agent.ts
```

This will process 4 sample reviews and show extracted evidence.

### 3. Process Reviews from Database

```bash
# Process all unprocessed reviews
npx tsx src/lib/agents/evidence/run-batch-processor.ts

# Process specific product
npx tsx src/lib/agents/evidence/run-batch-processor.ts --product <product-id>

# Dry run on first 10 reviews (no database save)
npx tsx src/lib/agents/evidence/run-batch-processor.ts --limit 10 --no-save
```

## Usage in Code

### Extract Evidence from a Single Review

```typescript
import { extractEvidence } from '@/lib/agents/evidence'

const result = await extractEvidence({
  reviewText: "This shirt runs small. Order one size up!",
  metadata: {
    sizePurchased: "Medium",
    height: "5'8\"",
    bodyType: "Athletic"
  }
})

console.log(`Extracted ${result.evidence.length} pieces of evidence`)
result.evidence.forEach(ev => {
  console.log(`${ev.factor}: ${ev.signal} (${ev.sentiment})`)
  console.log(`  Quote: "${ev.quote}"`)
})
```

### Batch Process Multiple Reviews

```typescript
import { extractEvidenceBatch } from '@/lib/agents/evidence'

const inputs = [
  { reviewText: "Great quality, fits perfectly!" },
  { reviewText: "Terrible fabric, pills immediately" }
]

const results = await extractEvidenceBatch(inputs, {
  concurrency: 5,
  onProgress: (completed, total) => {
    console.log(`${completed}/${total} reviews processed`)
  }
})
```

### Process from Database

```typescript
import { processBatch, processProduct } from '@/lib/agents/evidence'

// Process all unprocessed reviews
const stats = await processBatch({
  limit: 100,
  concurrency: 5,
  saveToDatabase: true,
  skipProcessed: true
})

console.log(`Processed ${stats.processedReviews} reviews`)
console.log(`Extracted ${stats.totalEvidence} pieces of evidence`)

// Process specific product
const productStats = await processProduct('product-id-here')
```

### Validate Evidence

```typescript
import { validateEvidence } from '@/lib/agents/evidence'

const validation = validateEvidence(evidence)
if (!validation.valid) {
  console.error('Validation errors:', validation.errors)
}
```

## CLI Options

### run-batch-processor.ts

```
Options:
  --product <id>     Process specific product ID
  --limit <n>        Limit number of reviews to process
  --concurrency <n>  Number of parallel requests (default: 5)
  --no-save          Don't save to database (dry run)
  --reprocess        Process all reviews, even if already processed
  --help, -h         Show help message

Examples:
  # Process all unprocessed reviews
  npx tsx src/lib/agents/evidence/run-batch-processor.ts

  # Process specific product
  npx tsx src/lib/agents/evidence/run-batch-processor.ts --product abc123

  # Dry run on first 10 reviews
  npx tsx src/lib/agents/evidence/run-batch-processor.ts --limit 10 --no-save

  # Reprocess all reviews for a product with higher concurrency
  npx tsx src/lib/agents/evidence/run-batch-processor.ts --product abc123 --reprocess --concurrency 10
```

## Files

| File | Purpose |
|------|---------|
| `factor-taxonomy.ts` | 27-factor taxonomy with signals and example phrases |
| `evidence-types.ts` | TypeScript types and interfaces |
| `evidence-agent.ts` | Core Claude-based extraction logic |
| `batch-processor.ts` | Database integration & bulk processing |
| `run-batch-processor.ts` | CLI tool for batch processing |
| `demo-evidence-agent.ts` | Interactive demo with sample reviews |
| `index.ts` | Module exports |

## Database Schema

Evidence is saved to the `EvidenceTag` table:

```prisma
model EvidenceTag {
  id          String         @id @default(cuid())
  productId   String
  reviewId    String?
  sourceType  EvidenceSource  // REVIEW | RETURN | SOCIAL_MEDIA | ...
  factor      String          // "fit.true_to_size"
  pillar      FactorPillar    // FIT | QUALITY | ...
  signal      String          // "runs_small"
  sentiment   Decimal         // -1.0 to +1.0
  confidence  Decimal         // 0.0 to 1.0
  quote       String?         // Original review text
  extractedBy String          // "evidence_agent_v1"
  createdAt   DateTime
}
```

## Output Example

```json
{
  "evidence": [
    {
      "factor": "fit.true_to_size",
      "pillar": "FIT",
      "signal": "runs_small",
      "sentiment": -0.7,
      "confidence": 0.9,
      "quote": "runs small, order one size up",
      "explanation": "Reviewer explicitly states it runs small"
    },
    {
      "factor": "quality.fabric",
      "pillar": "QUALITY",
      "signal": "cheap_fabric",
      "sentiment": -1.0,
      "confidence": 0.85,
      "quote": "fabric feels cheap",
      "explanation": "Direct statement about fabric quality"
    }
  ],
  "summary": {
    "totalEvidence": 2,
    "factorsCovered": ["fit.true_to_size", "quality.fabric"],
    "pillarsCovered": ["FIT", "QUALITY"],
    "averageConfidence": 0.875
  },
  "processingTime": 2500
}
```

## Performance

- **Model**: Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
- **Temperature**: 0.0 (deterministic extraction)
- **Average Processing Time**: ~2-3 seconds per review
- **Concurrency**: Configurable (default: 5 parallel requests)
- **Batch Processing**: Processes reviews in parallel with progress tracking

## Validation

All extracted evidence is validated against the taxonomy:

✅ **Factor exists** in the 27-factor taxonomy
✅ **Signal is valid** for the factor
✅ **Pillar matches** the factor's pillar
✅ **Sentiment is in range** (-1.0 to +1.0)
✅ **Confidence is in range** (0.0 to 1.0)

## Next Steps

After extracting evidence, use the **Scoring Engine** (Week 4) to:
1. Aggregate evidence into factor scores
2. Combine factors into pillar scores
3. Calculate overall product scores (0-100)
4. Assign letter grades (A+ to F)

## Support

See `WEEK3_EVIDENCE_AGENT_SUMMARY.md` for complete implementation details.

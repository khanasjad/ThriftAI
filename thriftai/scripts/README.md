# Batch Processing Scripts

Automated scripts for maintaining the 96-parameter AI scoring system.

## Overview

These scripts help you manage and maintain your product database:

1. **fetch-company-metrics.ts** - Fetch company-level data (stocks, ESG, etc.)
2. **generate-all-embeddings.ts** - Generate vector embeddings for semantic search
3. **score-all-products.ts** - Calculate AI scores using all 96 parameters
4. **update-leaderboard.ts** - Refresh product rankings

## Recommended Workflow

### Initial Setup (First Time)

```bash
# Step 1: Fetch company metrics for all brands
npx tsx scripts/fetch-company-metrics.ts

# Step 2: Generate embeddings for all products
npx tsx scripts/generate-all-embeddings.ts

# Step 3: Score all products (uses company metrics + embeddings)
npx tsx scripts/score-all-products.ts

# Step 4: Update leaderboard rankings
npx tsx scripts/update-leaderboard.ts --stats
```

### Regular Maintenance (Daily/Weekly)

```bash
# Update company metrics (weekly)
npx tsx scripts/fetch-company-metrics.ts --force

# Generate embeddings for new products only
npx tsx scripts/generate-all-embeddings.ts

# Rescore products (daily)
npx tsx scripts/score-all-products.ts

# Refresh leaderboard
npx tsx scripts/update-leaderboard.ts
```

## Script Details

### 1. fetch-company-metrics.ts

Fetches 25 company-level parameters for all brands.

**Basic Usage:**
```bash
npx tsx scripts/fetch-company-metrics.ts
```

**Options:**
- `--force` - Bypass 24h cache and refresh all metrics
- `--brands Apple,Nike,Samsung` - Only fetch specific brands

**Output:**
- Fetches stock prices, ESG scores, growth metrics
- Caches results for 24 hours
- Updates product records with company_metrics JSONB

**API Requirements:**
- `ALPHA_VANTAGE_API_KEY` for stock data (optional, uses mock data if missing)
- ESG data providers (optional)

**Example:**
```bash
# Fetch all brands
npx tsx scripts/fetch-company-metrics.ts

# Force refresh Apple and Nike
npx tsx scripts/fetch-company-metrics.ts --force --brands Apple,Nike

# Expected Output:
# 🏢 Found 150 unique brands
# ✅ Successful: 145
# 💾 From Cache: 120
# ❌ Failed: 5
# ⏱️  Total Time: 45.2s
```

---

### 2. generate-all-embeddings.ts

Generates 1536-dimensional vector embeddings for semantic search.

**Basic Usage:**
```bash
npx tsx scripts/generate-all-embeddings.ts
```

**Options:**
- `--force` - Regenerate embeddings for ALL products
- `--limit 100` - Only process first 100 products

**Output:**
- Creates vector embeddings using OpenAI text-embedding-3-large
- Saves to `embedding` column (vector(1536))
- Shows cost estimate and processing time

**API Requirements:**
- `OPENAI_API_KEY` (required)

**Cost:**
- ~$0.0005 per product
- 10,000 products ≈ $5 USD

**Example:**
```bash
# Generate embeddings for products without them
npx tsx scripts/generate-all-embeddings.ts

# Force regenerate all embeddings
npx tsx scripts/generate-all-embeddings.ts --force

# Test with 100 products first
npx tsx scripts/generate-all-embeddings.ts --limit 100

# Expected Output:
# 📊 Current Status:
#    Total Products: 10000
#    With Embeddings: 8500
#    Without Embeddings: 1500
#    Coverage: 85.0%
#
# 📈 Progress: 100.0% (1500/1500)
# ✅ Successful: 1495
# ❌ Failed: 5
# ⏱️  Total Time: 180.5s
# 💰 Estimated Cost: $0.748
```

---

### 3. score-all-products.ts

Calculates AI scores using all 96 parameters.

**Basic Usage:**
```bash
npx tsx scripts/score-all-products.ts
```

**Options:**
- `--force` - Rescore all products (even recently scored)
- `--category ELECTRONICS` - Only score products in one category
- `--limit 50` - Only score first 50 products

**Output:**
- Calculates AI score (0-100) using:
  - 46 existing parameters (price, seller, reviews, etc.)
  - 25 company parameters (from company_metrics)
  - 25 dynamic parameters (extracted from descriptions)
- Saves to `ai_score`, `ai_score_breakdown`, `ai_confidence` columns

**API Requirements:**
- `ANTHROPIC_API_KEY` (for dynamic parameter extraction)

**Example:**
```bash
# Score all unscored products
npx tsx scripts/score-all-products.ts

# Rescore all electronics
npx tsx scripts/score-all-products.ts --force --category ELECTRONICS

# Test with 20 products
npx tsx scripts/score-all-products.ts --limit 20

# Expected Output:
# 📦 Found 5000 products to score
# 📈 Progress: 100.0% (5000/5000)
# ⭐ Excellent: iPhone 15 Pro - Score: 95/100
# ✅ Successful: 4950
# ❌ Failed: 50
# ⏱️  Total Time: 450.2s
#
# 📊 Score Distribution:
#    Average Score: 72.5/100
#    Excellent (80+): 1200
#    Good (60-79): 2500
#    Average (40-59): 1000
#    Poor (<40): 250
```

---

### 4. update-leaderboard.ts

Refreshes the product_leaderboard materialized view.

**Basic Usage:**
```bash
npx tsx scripts/update-leaderboard.ts
```

**Options:**
- `--stats` - Show detailed leaderboard statistics

**Output:**
- Refreshes materialized view with latest AI scores
- Updates global_rank, category_rank, price_tier_rank
- Assigns leaderboard badges (top-10, best-value, etc.)

**Example:**
```bash
# Quick refresh
npx tsx scripts/update-leaderboard.ts

# Refresh with detailed stats
npx tsx scripts/update-leaderboard.ts --stats

# Expected Output:
# 📊 Current Rankings: 9500 products
# ✅ Refresh complete in 1250ms
#
# 🥇 Top 10 Global Leaders:
# #1   95.2/100  $999.00  iPhone 15 Pro 256GB              (ELECTRONICS)
# #2   94.8/100  $179.99  Nike Air Max 2024                (SHOES)
# #3   93.5/100  $1299.00 MacBook Air M3                   (ELECTRONICS)
# ...
#
# 📁 Category Breakdown:
# ELECTRONICS         2500 products | Avg Score: 75.2 | Price: $10-$5000
# CLOTHING            3000 products | Avg Score: 68.5 | Price: $5-$500
# SHOES               1500 products | Avg Score: 71.3 | Price: $15-$300
```

---

## Automated Scheduling

### Using Cron (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add these lines:
# Fetch company metrics every Sunday at 2am
0 2 * * 0 cd /path/to/thriftai && npx tsx scripts/fetch-company-metrics.ts

# Generate embeddings for new products daily at 3am
0 3 * * * cd /path/to/thriftai && npx tsx scripts/generate-all-embeddings.ts

# Score products daily at 4am
0 4 * * * cd /path/to/thriftai && npx tsx scripts/score-all-products.ts

# Update leaderboard daily at 5am
0 5 * * * cd /path/to/thriftai && npx tsx scripts/update-leaderboard.ts
```

### Using GitHub Actions

Create `.github/workflows/daily-maintenance.yml`:

```yaml
name: Daily AI Scoring Maintenance

on:
  schedule:
    - cron: '0 4 * * *'  # Daily at 4am UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  maintenance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx tsx scripts/fetch-company-metrics.ts
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          ALPHA_VANTAGE_API_KEY: ${{ secrets.ALPHA_VANTAGE_API_KEY }}
      - run: npx tsx scripts/generate-all-embeddings.ts
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      - run: npx tsx scripts/score-all-products.ts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      - run: npx tsx scripts/update-leaderboard.ts
```

---

## Troubleshooting

### "Cannot find module" errors

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate
```

### "OPENAI_API_KEY is not set"

```bash
# Add to .env file
echo "OPENAI_API_KEY=sk-..." >> .env
```

### Rate Limit Errors

The scripts include built-in rate limiting, but if you hit limits:

1. Use `--limit` flag to process smaller batches
2. Wait between runs
3. Check your API tier limits

### Out of Memory

For large databases (100K+ products):

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npx tsx scripts/score-all-products.ts
```

---

## Monitoring

### Check System Health

```bash
# View embedding coverage
npx tsx -e "
import { embeddingService } from './src/lib/services/embeddingService';
const stats = await embeddingService.getEmbeddingStatistics();
console.log(stats);
"

# View score distribution
psql $DATABASE_URL -c "
SELECT
  CASE
    WHEN ai_score >= 80 THEN 'Excellent'
    WHEN ai_score >= 60 THEN 'Good'
    WHEN ai_score >= 40 THEN 'Average'
    ELSE 'Poor'
  END as quality,
  COUNT(*) as total
FROM products
WHERE ai_score IS NOT NULL
GROUP BY quality
ORDER BY quality;
"

# View leaderboard status
npx tsx scripts/update-leaderboard.ts --stats
```

---

## Cost Management

### Estimated Monthly Costs

For a database with **10,000 products**:

| Operation | Frequency | Cost/Run | Monthly |
|-----------|-----------|----------|---------|
| Company Metrics | Weekly | $0-5 | $0-20 |
| Embeddings | Daily (new only) | $0.50 | $15 |
| AI Scoring | Daily | $5-10 | $150-300 |
| **Total** | | | **$165-320** |

### Reduce Costs:

1. **Embeddings**: Only regenerate when product description changes
2. **Scoring**: Only rescore products older than 30 days (default behavior)
3. **Company Metrics**: Use 24h cache (default behavior)
4. **Batch Size**: Process in smaller batches during off-peak hours

---

## Performance Tips

1. **Run in Order**: Always fetch company metrics before scoring
2. **Use Indexes**: Database migration creates all necessary indexes
3. **Batch Processing**: Scripts use optimal batch sizes
4. **Caching**: Services cache results automatically
5. **Parallel Processing**: Can run `generate-all-embeddings` and `fetch-company-metrics` in parallel

---

## Next Steps

After running all scripts:

1. **Test Search**: `GET /api/smart-search?q=$20 comfortable shirt`
2. **View Leaderboard**: `GET /api/leaderboard?type=global`
3. **Monitor Performance**: Check script output for errors
4. **Set Up Automation**: Use cron or GitHub Actions

---

**Questions?** Check the main documentation:
- `AI_SCORING_96_PARAMETER_SYSTEM.md` - Complete system documentation
- `96_PARAMETER_QUICKSTART.md` - Quick start guide
- `BUILD_COMPLETE.md` - System overview

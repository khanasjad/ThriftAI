# 🎭 Staging Environment - Complete Guide

**Purpose:** Real data fetching and Veritas Score™ generation with external API calls

---

## 🎯 Overview

ThriftAI now has **three separate environments**:

| Environment | Database | Port | Purpose |
|-------------|----------|------|---------|
| **Development** | `thriftai_nextjs_dev` | 3001 | Testing, experimentation (empty) |
| **Staging** | `thriftai_nextjs_staging` | 3002 | **Real data fetching & score generation** |
| **Production** | `thriftai_nextjs` | 3000 | Customer-facing (101,802 products) |

---

## 🚀 Quick Start

### Step 1: Seed Staging Database

Copy products from production and prepare for score calculation:

```bash
./scripts/seed-staging.sh
```

**What it does:**
- Prompts for number of products to copy (default: 100)
- Copies random products from production
- Copies related sellers and buyers
- Shows database statistics

### Step 2: Calculate Veritas Scores

Run batch score calculation with **REAL API calls**:

```bash
# Calculate scores for first 100 products
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public" \
  npx tsx scripts/calculate-veritas-batch.ts --limit=100

# Or calculate all products (no limit)
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public" \
  npx tsx scripts/calculate-veritas-batch.ts --limit=1000
```

### Step 3: Start Staging Server

```bash
./scripts/staging.sh
```

**Access at:** http://localhost:3002

---

## 📊 What Makes Staging Special?

### Real External API Integration

Staging environment makes **REAL API calls** to fetch data:

| API | Data Fetched | Rate Limit | Cache Duration |
|-----|--------------|------------|----------------|
| **Alpha Vantage** | Stock prices, market cap | 25 calls/day | 1 hour |
| **eBay Finding API** | Seller ratings, feedback | 5,000 calls/day | 7 days |
| **GSMArena** | Phone specifications | Scraping (respectful) | 90 days |
| **Apple Warranty** | Warranty status, battery health | Unlimited | 30 days |
| **Dell Warranty** | Warranty information | Unlimited | 30 days |
| **iFixit** | Repairability scores | Unlimited | 90 days |
| **Energy Star** | Energy certifications | Unlimited | 90 days |

### Automated Score Calculation

The batch calculator:
- ✅ Fetches real data from external APIs
- ✅ Applies 121-parameter scoring algorithm
- ✅ Saves scores to database
- ✅ Creates company profiles automatically
- ✅ Links sellers and products
- ✅ Tracks FREE API usage

---

## 🔧 Configuration

### Environment File (`.env.staging`)

```bash
NODE_ENV=staging
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_ENABLE_TEST_PAGES=true
NEXT_PUBLIC_VERITAS_ENV=staging
NEXT_PUBLIC_AUTO_CALCULATE_SCORES=true

DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public"

ENABLE_REAL_DATA_FETCH=true
AUTO_CALCULATE_VERITAS=true
BATCH_SCORE_CALCULATION=true
```

### Required API Keys (`.env.local`)

```bash
# Stock market data
ALPHA_VANTAGE_API_KEY="your_key_here"

# Seller ratings
EBAY_APP_ID="your_app_id_here"

# AI features (optional for Veritas)
ANTHROPIC_API_KEY="your_key_here"
```

---

## 📝 Complete Workflow

### 1. Initial Setup (One-time)

```bash
# Create staging database (already done)
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d postgres -c "CREATE DATABASE thriftai_nextjs_staging;"

# Initialize schema
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public" npx prisma db push
```

### 2. Seed Products

```bash
# Interactive seeding
./scripts/seed-staging.sh

# Or manual copy (50 products)
pg_dump -h localhost -U asjadkhan -d thriftai_nextjs \
  -t products --data-only --inserts \
  --where="id IN (SELECT id FROM products WHERE \"isAvailable\" = true ORDER BY RANDOM() LIMIT 50)" | \
  PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging
```

### 3. Calculate Scores

```bash
# Option A: TypeScript batch calculator (recommended)
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public" \
  npx tsx scripts/calculate-veritas-batch.ts --limit=100

# Option B: Via API (requires server running)
curl "http://localhost:3002/api/test/veritas-score?productId=YOUR_PRODUCT_ID"
```

### 4. Verify Results

```bash
# Check score statistics
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging -c "
SELECT
  COUNT(*) as total_products,
  COUNT(vs.id) as scored_products,
  AVG(vs.overall_score)::numeric(5,2) as avg_score,
  MIN(vs.overall_score)::numeric(5,2) as min_score,
  MAX(vs.overall_score)::numeric(5,2) as max_score
FROM products p
LEFT JOIN veritas_scores vs ON vs.product_id = p.id;
"

# Score distribution
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging -c "
SELECT
  CASE
    WHEN overall_score >= 90 THEN 'S (90-100)'
    WHEN overall_score >= 80 THEN 'A (80-89)'
    WHEN overall_score >= 70 THEN 'B (70-79)'
    WHEN overall_score >= 60 THEN 'C (60-69)'
    ELSE 'D (<60)'
  END as grade,
  COUNT(*) as count,
  AVG(overall_score)::numeric(5,2) as avg_score
FROM veritas_scores
GROUP BY grade
ORDER BY grade;
"
```

### 5. View in UI

```bash
# Start staging server
./scripts/staging.sh

# Open in browser
open http://localhost:3002/prod/veritas
```

---

## 🆓 FREE API Usage Tracking

The batch calculator tracks which parameters use FREE APIs:

### Example Output:
```
[1/100] Calculating score for: iPhone 15 Pro Max
          Brand: Apple | Category: MOBILE_PHONE
          ✅ Score: 87.2 | SSN: VS-MOB-087-89-20251004
          📊 Confidence: 89%
          🆓 FREE API params: 45/121 (gsmarena, apple_warranty, alpha_vantage, ebay)
```

**FREE API Coverage:**
- **45-60 parameters** use FREE external APIs
- **61-76 parameters** use product metadata
- **0-15 parameters** use fallback/heuristics

---

## 📊 Batch Calculation Performance

### Expected Performance:

| Products | Duration | API Calls | Rate Limit Impact |
|----------|----------|-----------|-------------------|
| 25 products | ~15 seconds | ~10-15 calls | Safe (< Alpha Vantage limit) |
| 100 products | ~60 seconds | ~40-50 calls | Safe |
| 500 products | ~5 minutes | ~200-250 calls | May hit some limits |
| 1000 products | ~10 minutes | ~400-500 calls | Will hit Alpha Vantage (25/day) |

### Rate Limiting Strategy:

1. **Intelligent Caching:**
   - Company profiles cached (1 stock call per brand, not per product)
   - Seller profiles cached for 7 days
   - Product specs cached for 90 days

2. **Batch Processing:**
   - 500ms delay between products
   - Reuses cached data when possible
   - Stops before hitting rate limits

3. **Recommended Approach:**
   ```bash
   # Day 1: Calculate 25 products (uses 10-15 API calls)
   DATABASE_URL="..." npx tsx scripts/calculate-veritas-batch.ts --limit=25

   # Day 2: Calculate next 25 (reuses cached company data)
   DATABASE_URL="..." npx tsx scripts/calculate-veritas-batch.ts --limit=25

   # Result: 50 products scored in 2 days, well within FREE limits
   ```

---

## 🔍 Debugging & Monitoring

### Check Active Database

```bash
echo "Current DATABASE_URL:"
grep DATABASE_URL .env.staging
```

### Monitor API Calls

Watch console output during batch calculation:
```
🔬 Batch Veritas Score Calculation (STAGING)
============================================

📊 Found 100 products without scores

🌐 Will make REAL API calls to:
   - Alpha Vantage (stock data)
   - eBay Finding API (seller ratings)
   - GSMArena (phone specs)
   ...
```

### View Cached Data

```bash
# Company profiles (cached stock data)
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging -c "
SELECT
  \"brandName\",
  \"stockSymbol\",
  \"stockPrice\",
  \"stockChange\",
  \"lastStockUpdate\",
  (SELECT COUNT(*) FROM products WHERE \"companyProfileId\" = vcp.id) as linked_products
FROM veritas_company_profiles vcp
ORDER BY \"brandName\";
"

# Seller profiles
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging -c "
SELECT
  seller_identifier,
  seller_rating,
  transaction_count,
  positive_feedback_pct,
  is_top_rated
FROM veritas_seller_profiles
ORDER BY seller_performance_index DESC;
"
```

---

## 🎯 Use Cases

### 1. Test New Scoring Algorithm

```bash
# 1. Update scoring logic in src/lib/services/veritasScoreService.ts
# 2. Reset staging scores
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging -c "TRUNCATE veritas_scores CASCADE;"

# 3. Recalculate with new algorithm
DATABASE_URL="..." npx tsx scripts/calculate-veritas-batch.ts --limit=50

# 4. Compare results
```

### 2. Test New External API Integration

```bash
# 1. Add new API fetcher in src/lib/services/veritas/
# 2. Update veritasScoreService.ts to use new API
# 3. Calculate scores for specific category
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging -c "
DELETE FROM veritas_scores WHERE product_id IN (
  SELECT id FROM products WHERE category = 'PHONES'
);
"

# 4. Recalculate phone scores with new API
DATABASE_URL="..." npx tsx scripts/calculate-veritas-batch.ts --limit=20
```

### 3. Generate Demo Data

```bash
# Create impressive demo dataset
./scripts/seed-staging.sh  # Choose 50 products
DATABASE_URL="..." npx tsx scripts/calculate-veritas-batch.ts --limit=50

# Export for presentation
pg_dump -h localhost -U asjadkhan -d thriftai_nextjs_staging \
  -t products -t veritas_scores -t veritas_company_profiles \
  -F c -f staging_demo_$(date +%Y%m%d).dump
```

---

## 🔄 Database Management

### Reset Staging Database

```bash
# Drop and recreate
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d postgres -c "DROP DATABASE thriftai_nextjs_staging;"
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d postgres -c "CREATE DATABASE thriftai_nextjs_staging;"

# Reinitialize schema
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public" npx prisma db push

# Reseed
./scripts/seed-staging.sh
```

### Copy Staging to Production (Promote Scores)

```bash
# CAREFUL: This copies calculated scores to production
# Only do this after verifying scores are correct!

pg_dump -h localhost -U asjadkhan -d thriftai_nextjs_staging \
  -t veritas_scores -t veritas_company_profiles -t veritas_seller_profiles \
  --data-only --inserts | \
  PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs
```

---

## 🚨 Troubleshooting

### API Rate Limit Exceeded

**Symptom:** Errors like "API limit exceeded" or "Rate limit: 25 requests per day"

**Solution:**
```bash
# Wait 24 hours, or use cached data
# Check what's cached:
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging -c "
SELECT
  'Company Profiles' as cache_type,
  COUNT(*) as cached_count,
  MAX(\"lastStockUpdate\") as last_update
FROM veritas_company_profiles
WHERE \"lastStockUpdate\" IS NOT NULL;
"
```

### Batch Calculation Hangs

**Symptom:** Script stops mid-calculation

**Solution:**
```bash
# Check for active database connections
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d postgres -c "
SELECT pid, state, query FROM pg_stat_activity
WHERE datname = 'thriftai_nextjs_staging' AND state != 'idle';
"

# Kill if needed
# pg_terminate_backend(pid)
```

### Scores Look Wrong

**Symptom:** All scores are similar or unexpectedly low/high

**Solution:**
```bash
# Check parameter breakdown
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging -c "
SELECT
  vp.name,
  vp.raw_value,
  vp.normalized_score,
  vp.data_source,
  vp.is_real_data
FROM veritas_parameters vp
WHERE vp.category_id IN (SELECT id FROM veritas_categories WHERE score_id = 'YOUR_SCORE_ID')
LIMIT 20;
"
```

---

## 📞 Quick Reference

### Start Commands

```bash
# Development (empty)
./scripts/dev.sh         # Port 3001

# Staging (score generation)
./scripts/staging.sh     # Port 3002

# Production (real data)
./scripts/prod.sh        # Port 3000
```

### Database URLs

```bash
# Development
postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public

# Staging
postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public

# Production
postgresql://asjadkhan@localhost:5432/thriftai_nextjs?schema=public
```

### Common Operations

```bash
# Seed staging
./scripts/seed-staging.sh

# Calculate scores
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public" \
  npx tsx scripts/calculate-veritas-batch.ts --limit=100

# View in Prisma Studio
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public" npx prisma studio

# Check statistics
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging -c "
SELECT COUNT(*) as products,
       (SELECT COUNT(*) FROM veritas_scores) as scores
FROM products;"
```

---

## 🎯 Next Steps

1. **Seed staging database:** `./scripts/seed-staging.sh`
2. **Calculate scores:** `DATABASE_URL="..." npx tsx scripts/calculate-veritas-batch.ts --limit=50`
3. **Start staging server:** `./scripts/staging.sh`
4. **View results:** http://localhost:3002/prod/veritas
5. **Analyze performance:** Check console logs and database stats
6. **Promote to production:** Copy verified scores to production database

---

**Related Documentation:**
- `DEV_VS_PROD_DATABASES.md` - Environment separation guide
- `PRODUCTION_DATABASE_DETAILS.md` - Production database stats
- `VERITAS_API_DOCS.md` - API reference
- `COMPLETE_API_DOCUMENTATION.md` - Full platform API docs

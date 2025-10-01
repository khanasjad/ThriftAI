# 96-Parameter AI Scoring System - Deployment Guide

Complete step-by-step guide to deploy the ThriftAI 96-parameter system to production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Initial Data Population](#initial-data-population)
5. [API Endpoints](#api-endpoints)
6. [Automated Maintenance](#automated-maintenance)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Cost Optimization](#cost-optimization)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ with **pgvector extension**
- **TypeScript** 5+
- **Prisma** 5+

### Required API Keys

```bash
# Required
OPENAI_API_KEY=sk-...              # For vector embeddings
ANTHROPIC_API_KEY=sk-ant-...       # For dynamic parameter extraction
DATABASE_URL=postgresql://...       # PostgreSQL connection string

# Optional (improves results)
ALPHA_VANTAGE_API_KEY=...          # For stock data
ESG_DATA_API_KEY=...               # For ESG metrics (if available)
```

### Estimated Costs (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| OpenAI Embeddings | 10K products | $5-10 |
| Anthropic Claude | 10K scorings | $50-100 |
| Alpha Vantage | 500 brands | $0-50 |
| **Total** | | **$55-160/month** |

---

## Environment Setup

### 1. Install Dependencies

```bash
cd thriftai
npm install
```

### 2. Configure Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/thriftai"

# AI Services (Required)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Data Services (Optional)
ALPHA_VANTAGE_API_KEY="your_key"

# Application
NODE_ENV="production"
LOG_LEVEL="info"
```

### 3. Verify Installation

```bash
# Check Node version
node --version  # Should be 18+

# Check PostgreSQL
psql --version  # Should be 14+

# Test database connection
psql $DATABASE_URL -c "SELECT version();"
```

---

## Database Setup

### 1. Install pgvector Extension

#### macOS (Homebrew)
```bash
brew install pgvector
```

#### Ubuntu/Debian
```bash
sudo apt-get install postgresql-14-pgvector
```

#### Docker
```bash
docker run -d \
  --name thriftai-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -p 5432:5432 \
  ankane/pgvector
```

#### From Source
```bash
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

### 2. Enable pgvector in Database

```bash
psql $DATABASE_URL << EOF
CREATE EXTENSION IF NOT EXISTS vector;
SELECT * FROM pg_extension WHERE extname = 'vector';
EOF
```

Expected output:
```
 extname | extowner | extnamespace | ...
---------+----------+--------------+-----
 vector  |       10 |         2200 | ...
```

### 3. Run Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate deploy

# Verify tables
psql $DATABASE_URL -c "\dt"
```

You should see:
- `products` table with new columns (ai_score, embedding, etc.)
- `product_leaderboard` materialized view
- Indexes for vector search and AI scoring

### 4. Verify Database Schema

```bash
psql $DATABASE_URL << EOF
-- Check new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('ai_score', 'embedding', 'company_metrics', 'dynamic_specs');

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'products';

-- Check materialized view
SELECT COUNT(*) FROM product_leaderboard;
EOF
```

---

## Initial Data Population

### Option 1: Run All Scripts (Automated)

```bash
# Complete setup (recommended for first time)
npx tsx scripts/run-all.ts

# This will run in order:
# 1. Fetch company metrics
# 2. Generate embeddings
# 3. Calculate AI scores
# 4. Update leaderboard
```

Expected output:
```
🚀 THRIFTAI 96-PARAMETER SYSTEM - BATCH PROCESSING
============================================================

📋 STEP: Fetch Company Metrics
✅ Fetch Company Metrics completed successfully

📋 STEP: Generate Embeddings
✅ Generate Embeddings completed successfully

📋 STEP: Score Products
✅ Score Products completed successfully

📋 STEP: Update Leaderboard
✅ Update Leaderboard completed successfully

🎉 ALL STEPS COMPLETED SUCCESSFULLY!
```

### Option 2: Run Scripts Individually

#### Step 1: Fetch Company Metrics

```bash
npx tsx scripts/fetch-company-metrics.ts
```

This fetches 25 company-level parameters:
- Stock prices and performance
- ESG scores
- Growth metrics
- Risk & compliance data

#### Step 2: Generate Embeddings

```bash
# Test with 100 products first
npx tsx scripts/generate-all-embeddings.ts --limit 100

# Then run for all
npx tsx scripts/generate-all-embeddings.ts
```

This creates 1536-dimensional vectors for semantic search.

**Cost**: ~$0.0005 per product (10K products ≈ $5)

#### Step 3: Score Products

```bash
# Test with 50 products first
npx tsx scripts/score-all-products.ts --limit 50

# Then run for all
npx tsx scripts/score-all-products.ts
```

This calculates AI scores using all 96 parameters.

#### Step 4: Update Leaderboard

```bash
npx tsx scripts/update-leaderboard.ts --stats
```

This refreshes rankings and shows top products.

---

## API Endpoints

### 1. Start Application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 2. Test Endpoints

#### Smart Search API

```bash
# Basic search
curl "http://localhost:3000/api/smart-search?q=laptop"

# Price-aware search
curl "http://localhost:3000/api/smart-search?q=\$500 laptop"

# Advanced search
curl "http://localhost:3000/api/smart-search?q=around \$50 Nike running shoes&method=hybrid"
```

Expected response:
```json
{
  "query": {
    "original": "$500 laptop",
    "processed": "laptop",
    "priceIntent": {
      "targetPrice": 500,
      "range": { "min": 375, "max": 625 },
      "flexibility": "moderate"
    }
  },
  "results": [
    {
      "id": "prod-123",
      "name": "Dell XPS 13",
      "price": 499.99,
      "aiScore": 87.5,
      "similarity": 0.92,
      "finalScore": 88.3
    }
  ],
  "metadata": {
    "totalFound": 25,
    "processingTime": 145
  }
}
```

#### Leaderboard API

```bash
# Global top 50
curl "http://localhost:3000/api/leaderboard?type=global&limit=50"

# Category-specific
curl "http://localhost:3000/api/leaderboard?type=category&category=ELECTRONICS"

# Price tier
curl "http://localhost:3000/api/leaderboard?type=price_tier&priceTier=premium"

# Refresh leaderboard
curl -X POST "http://localhost:3000/api/leaderboard"
```

Expected response:
```json
{
  "leaderboard": [
    {
      "id": "prod-456",
      "name": "iPhone 15 Pro",
      "category": "ELECTRONICS",
      "brand": "Apple",
      "price": 999,
      "aiScore": 95.2,
      "globalRank": 1,
      "badges": ["top-10", "best-value", "eco-friendly"]
    }
  ],
  "metadata": {
    "type": "global",
    "totalCount": 9500,
    "averageScore": 72.5
  }
}
```

### 3. API Documentation

Full API specs available in `AI_SCORING_96_PARAMETER_SYSTEM.md`

---

## Automated Maintenance

### Daily Tasks

Create cron jobs or GitHub Actions to maintain the system.

### Option 1: Cron Jobs (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add these lines:

# Daily at 3am: Generate embeddings for new products
0 3 * * * cd /path/to/thriftai && npx tsx scripts/generate-all-embeddings.ts >> /var/log/thriftai/embeddings.log 2>&1

# Daily at 4am: Score products
0 4 * * * cd /path/to/thriftai && npx tsx scripts/score-all-products.ts >> /var/log/thriftai/scoring.log 2>&1

# Daily at 5am: Update leaderboard
0 5 * * * cd /path/to/thriftai && npx tsx scripts/update-leaderboard.ts >> /var/log/thriftai/leaderboard.log 2>&1

# Weekly on Sunday at 2am: Refresh company metrics
0 2 * * 0 cd /path/to/thriftai && npx tsx scripts/fetch-company-metrics.ts --force >> /var/log/thriftai/metrics.log 2>&1
```

### Option 2: GitHub Actions

Create `.github/workflows/daily-maintenance.yml`:

```yaml
name: Daily AI Scoring Maintenance

on:
  schedule:
    - cron: '0 4 * * *'  # Daily at 4am UTC
  workflow_dispatch:      # Allow manual trigger

jobs:
  maintenance:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Generate embeddings
        run: npx tsx scripts/generate-all-embeddings.ts
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Score products
        run: npx tsx scripts/score-all-products.ts
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Update leaderboard
        run: npx tsx scripts/update-leaderboard.ts
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Notify on failure
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Daily Maintenance Failed',
              body: 'The daily AI scoring maintenance workflow failed. Check the logs.'
            })
```

### Option 3: Node.js Scheduler

Create `scripts/scheduler.ts`:

```typescript
import cron from 'node-cron'
import { spawn } from 'child_process'

// Daily at 3am: Generate embeddings
cron.schedule('0 3 * * *', () => {
  console.log('Running: generate-all-embeddings')
  spawn('npx', ['tsx', 'scripts/generate-all-embeddings.ts'], { stdio: 'inherit' })
})

// Daily at 4am: Score products
cron.schedule('0 4 * * *', () => {
  console.log('Running: score-all-products')
  spawn('npx', ['tsx', 'scripts/score-all-products.ts'], { stdio: 'inherit' })
})

// Daily at 5am: Update leaderboard
cron.schedule('0 5 * * *', () => {
  console.log('Running: update-leaderboard')
  spawn('npx', ['tsx', 'scripts/update-leaderboard.ts'], { stdio: 'inherit' })
})

// Weekly on Sunday at 2am: Fetch company metrics
cron.schedule('0 2 * * 0', () => {
  console.log('Running: fetch-company-metrics')
  spawn('npx', ['tsx', 'scripts/fetch-company-metrics.ts', '--force'], { stdio: 'inherit' })
})

console.log('Scheduler started. Running automated maintenance tasks.')
```

Run with:
```bash
npx tsx scripts/scheduler.ts
```

---

## Monitoring & Alerts

### 1. System Health Checks

Create `scripts/health-check.ts`:

```typescript
import { prisma } from '../src/lib/prisma'
import { embeddingService } from '../src/lib/services/embeddingService'

async function healthCheck() {
  const checks = {
    database: false,
    embeddings: false,
    scores: false,
    leaderboard: false
  }

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    checks.database = true

    // Check embedding coverage
    const embStats = await embeddingService.getEmbeddingStatistics()
    checks.embeddings = embStats.coveragePercentage > 90

    // Check score coverage
    const scoreStats = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(*) FILTER (WHERE ai_score IS NOT NULL) as scored,
        COUNT(*) as total
      FROM products WHERE is_available = true
    `)
    const scoreCoverage = (parseInt(scoreStats[0].scored) / parseInt(scoreStats[0].total)) * 100
    checks.scores = scoreCoverage > 90

    // Check leaderboard
    const leaderboard = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as total FROM product_leaderboard
    `)
    checks.leaderboard = parseInt(leaderboard[0].total) > 0

    // Report
    console.log('Health Check Results:')
    console.log('  Database:', checks.database ? '✅' : '❌')
    console.log('  Embeddings:', checks.embeddings ? '✅' : '❌', `(${embStats.coveragePercentage.toFixed(1)}%)`)
    console.log('  Scores:', checks.scores ? '✅' : '❌', `(${scoreCoverage.toFixed(1)}%)`)
    console.log('  Leaderboard:', checks.leaderboard ? '✅' : '❌')

    const allHealthy = Object.values(checks).every(v => v)
    process.exit(allHealthy ? 0 : 1)

  } catch (error) {
    console.error('Health check failed:', error)
    process.exit(1)
  }
}

healthCheck()
```

### 2. Set Up Monitoring

```bash
# Run health check
npx tsx scripts/health-check.ts

# Schedule health check (every hour)
0 * * * * cd /path/to/thriftai && npx tsx scripts/health-check.ts || echo "Health check failed!" | mail -s "ThriftAI Alert" admin@example.com
```

### 3. Logging

All services use the centralized logger:

```typescript
import { logger } from '@/lib/logger'

// Logs automatically include timestamps, levels, and context
logger.info('Product scored', { productId, score: result.aiScore })
logger.error('Embedding failed', { productId, error: error.message })
```

---

## Cost Optimization

### 1. Reduce Embedding Costs

```bash
# Only generate embeddings for new products (default behavior)
npx tsx scripts/generate-all-embeddings.ts

# Never use --force unless absolutely necessary
```

### 2. Reduce Scoring Costs

```bash
# Only rescore products older than 30 days (default behavior)
npx tsx scripts/score-all-products.ts

# For static products, score once and cache
```

### 3. Use Free Tier APIs

```bash
# Alpha Vantage: 5 calls/minute, 500 calls/day (free)
# Upgrade to premium only if needed

# OpenAI: Use cheaper models if acceptable
# text-embedding-3-small is 5x cheaper but less accurate
```

### 4. Batch Operations

```bash
# Process in smaller batches during off-peak hours
npx tsx scripts/score-all-products.ts --limit 1000

# Schedule throughout the day instead of all at once
```

---

## Troubleshooting

### Database Issues

**Problem**: `relation "product_leaderboard" does not exist`

```bash
# Solution: Run migration
npx prisma migrate deploy

# Verify
psql $DATABASE_URL -c "\d product_leaderboard"
```

**Problem**: `extension "vector" does not exist`

```bash
# Solution: Install pgvector
brew install pgvector  # macOS
sudo apt-get install postgresql-14-pgvector  # Ubuntu

# Then enable in database
psql $DATABASE_URL -c "CREATE EXTENSION vector;"
```

### API Issues

**Problem**: `OPENAI_API_KEY is not set`

```bash
# Solution: Add to .env
echo "OPENAI_API_KEY=sk-..." >> .env

# Verify
grep OPENAI_API_KEY .env
```

**Problem**: `429 Too Many Requests`

```bash
# Solution: Scripts have built-in rate limiting
# If still hitting limits, use smaller batches:
npx tsx scripts/generate-all-embeddings.ts --limit 100

# Or wait between runs
```

### Performance Issues

**Problem**: Vector search is slow (> 1 second)

```bash
# Check if HNSW index exists
psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename = 'products' AND indexname LIKE '%embedding%';"

# If missing, create it (migration should have done this)
psql $DATABASE_URL -c "CREATE INDEX products_embedding_idx ON products USING hnsw (embedding vector_cosine_ops);"
```

**Problem**: Out of memory

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npx tsx scripts/score-all-products.ts
```

---

## Production Checklist

Before going live:

- [ ] Database migration completed
- [ ] pgvector extension installed
- [ ] All API keys configured
- [ ] Initial embeddings generated
- [ ] Products scored
- [ ] Leaderboard populated
- [ ] API endpoints tested
- [ ] Automated jobs scheduled
- [ ] Monitoring set up
- [ ] Logs configured
- [ ] Backup strategy in place
- [ ] Cost limits set on API keys
- [ ] Health checks passing

---

## Next Steps

1. **Test the system**: Run sample searches and check leaderboard
2. **Monitor costs**: Track API usage in first week
3. **Optimize**: Adjust weights and thresholds based on results
4. **Scale**: Add more products and categories
5. **Improve**: Collect user feedback and iterate

---

## Support

- **Documentation**: `AI_SCORING_96_PARAMETER_SYSTEM.md`
- **Quick Start**: `96_PARAMETER_QUICKSTART.md`
- **Scripts**: `scripts/README.md`
- **Build Summary**: `BUILD_COMPLETE.md`

---

**🎉 You're ready to deploy!**

Your ThriftAI 96-parameter AI scoring system is production-ready. Time to transform your e-commerce search and ranking!

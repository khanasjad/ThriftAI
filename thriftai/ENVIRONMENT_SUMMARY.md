# 🎯 ThriftAI Environment Summary

**Complete guide to Development, Staging, and Production environments**

---

## 📊 Quick Overview

| Environment | Database | Size | Products | Port | Purpose |
|-------------|----------|------|----------|------|---------|
| **Development** | `thriftai_nextjs_dev` | 12 MB | 0 | 3001 | Testing & experimentation |
| **Staging** | `thriftai_nextjs_staging` | 12 MB | 0 | 3002 | **Real data fetching & Veritas Score generation** |
| **Production** | `thriftai_nextjs` | 366 MB | 101,802 | 3000 | Customer-facing (read-only) |

---

## 🚀 Quick Start Commands

### Start Each Environment

```bash
# Development (empty database)
./scripts/dev.sh

# Staging (score generation)
./scripts/staging.sh

# Production (real data)
./scripts/prod.sh
```

### Access URLs

```
Development:  http://localhost:3001
Staging:      http://localhost:3002
Production:   http://localhost:3000
```

---

## 🎭 Staging Environment Workflow

### 1. Seed Staging Database

```bash
./scripts/seed-staging.sh
```
**Prompts for:** Number of products to copy (default: 100)

### 2. Calculate Veritas Scores

```bash
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public" \
  npx tsx scripts/calculate-veritas-batch.ts --limit=100
```

**Makes REAL API calls to:**
- ✅ Alpha Vantage (stock data)
- ✅ eBay Finding API (seller ratings)
- ✅ GSMArena (phone specs)
- ✅ Apple/Dell Warranty APIs
- ✅ iFixit (repairability)
- ✅ Energy Star (certifications)

### 3. Start Staging Server

```bash
./scripts/staging.sh
```

---

## 📁 Environment Files

```
.env.local          # API keys (shared across all envs)
.env.development    # Dev config + dev database
.env.staging        # Staging config + staging database
.env.production     # Prod config + prod database
```

### .env.development
```bash
NODE_ENV=development
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public"
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### .env.staging
```bash
NODE_ENV=staging
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public"
NEXT_PUBLIC_API_URL=http://localhost:3002
ENABLE_REAL_DATA_FETCH=true
AUTO_CALCULATE_VERITAS=true
```

### .env.production
```bash
NODE_ENV=production
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs?schema=public"
NEXT_PUBLIC_API_URL=https://thriftai.com
```

---

## 🔄 Common Workflows

### Workflow 1: Develop New Feature

```bash
# 1. Start development environment
./scripts/dev.sh

# 2. Add test data via Prisma Studio
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public" npx prisma studio

# 3. Test feature
# 4. Commit changes
```

### Workflow 2: Test Veritas Scoring

```bash
# 1. Seed staging database
./scripts/seed-staging.sh  # Copy 50 products

# 2. Calculate scores with real APIs
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public" \
  npx tsx scripts/calculate-veritas-batch.ts --limit=50

# 3. Verify results
./scripts/staging.sh
open http://localhost:3002/prod/veritas

# 4. Promote to production if satisfied
pg_dump -h localhost -U asjadkhan -d thriftai_nextjs_staging \
  -t veritas_scores --data-only --inserts | \
  PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs
```

### Workflow 3: View Production Data

```bash
# Read-only access to production
./scripts/prod.sh
open http://localhost:3000/prod/veritas

# Or use Prisma Studio
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs?schema=public" npx prisma studio
```

---

## 📊 Database Statistics

### Current Status

```
🗄️  Development:  0 products,   0 scores,  0 companies
🎭 Staging:       0 products,   0 scores,  0 companies (ready to seed)
🚀 Production:    101,802 products, 29 scores, 16 companies
```

### Check Stats Anytime

```bash
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_dev -c "
SELECT COUNT(*) as products, (SELECT COUNT(*) FROM veritas_scores) as scores FROM products;"

PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging -c "
SELECT COUNT(*) as products, (SELECT COUNT(*) FROM veritas_scores) as scores FROM products;"

PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs -c "
SELECT COUNT(*) as products, (SELECT COUNT(*) FROM veritas_scores) as scores FROM products;"
```

---

## 🔑 API Keys Required

Add these to `.env.local`:

```bash
# For Veritas Score calculation (staging)
ALPHA_VANTAGE_API_KEY="your_key_here"       # Stock data
EBAY_APP_ID="your_app_id_here"              # Seller ratings
ANTHROPIC_API_KEY="your_key_here"           # AI features

# Optional
OPENAI_API_KEY="your_key_here"              # Chat features
```

**Get API Keys:**
- Alpha Vantage: https://www.alphavantage.co/support/#api-key (FREE, 25 calls/day)
- eBay: https://developer.ebay.com/ (FREE, 5,000 calls/day)
- Anthropic: https://console.anthropic.com/

---

## 🆓 FREE API Usage (Staging)

Staging environment uses **FREE external APIs** to fetch real data:

| API | Data | Calls per Product | Daily Limit | Cache |
|-----|------|-------------------|-------------|-------|
| Alpha Vantage | Stock prices | 0-1 (shared) | 25/day | 1 hour |
| eBay Finding | Seller ratings | 0-1 (shared) | 5,000/day | 7 days |
| GSMArena | Phone specs | 0-1 | Unlimited | 90 days |
| Apple Warranty | Warranty info | 0-1 | Unlimited | 30 days |

**Smart Caching:**
- Company profiles shared across products (1 API call → all Apple products)
- Seller profiles cached for 7 days
- Product specs cached for 90 days

**Recommended batch size:** 25 products/day (stays within FREE limits)

---

## 🔧 Maintenance Commands

### Reset Development Database

```bash
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d postgres -c "DROP DATABASE thriftai_nextjs_dev;"
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d postgres -c "CREATE DATABASE thriftai_nextjs_dev;"
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public" npx prisma db push
```

### Reset Staging Database

```bash
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d postgres -c "DROP DATABASE thriftai_nextjs_staging;"
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d postgres -c "CREATE DATABASE thriftai_nextjs_staging;"
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public" npx prisma db push
```

### Backup Production Database

```bash
pg_dump -h localhost -U asjadkhan -d thriftai_nextjs \
  -F c -f backups/thriftai_prod_$(date +%Y%m%d).dump
```

---

## 📝 Files Created

### Scripts
- ✅ `scripts/dev.sh` - Start development environment
- ✅ `scripts/staging.sh` - Start staging environment
- ✅ `scripts/prod.sh` - Start production environment
- ✅ `scripts/seed-staging.sh` - Seed staging database from production
- ✅ `scripts/calculate-veritas-batch.ts` - Batch score calculator

### Configuration
- ✅ `.env.development` - Dev environment config
- ✅ `.env.staging` - Staging environment config
- ✅ `.env.production` - Production environment config

### Documentation
- ✅ `STAGING_ENVIRONMENT.md` - Complete staging guide
- ✅ `DEV_VS_PROD_DATABASES.md` - Environment separation guide
- ✅ `PRODUCTION_DATABASE_DETAILS.md` - Production stats
- ✅ `ENVIRONMENT_SUMMARY.md` - This file

---

## 🎯 Next Steps

### For Staging (Score Generation):

1. **Seed database:**
   ```bash
   ./scripts/seed-staging.sh
   ```

2. **Calculate scores:**
   ```bash
   DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public" \
     npx tsx scripts/calculate-veritas-batch.ts --limit=50
   ```

3. **Start server:**
   ```bash
   ./scripts/staging.sh
   ```

4. **View results:**
   ```
   http://localhost:3002/prod/veritas
   ```

---

## 🚨 Important Notes

### Development Environment
- ✅ Safe to reset anytime
- ✅ No real data
- ✅ Fast iteration

### Staging Environment
- ⚠️ Makes REAL API calls (respect rate limits!)
- ✅ Perfect for testing Veritas scores
- ✅ Use 25-50 products to stay within FREE limits

### Production Environment
- ⚠️ **READ-ONLY** recommended
- ⚠️ NEVER truncate or delete
- ⚠️ Always backup before changes
- ✅ 101,802 real products
- ✅ Customer-facing data

---

## 📞 Quick Reference Card

```bash
# START ENVIRONMENTS
./scripts/dev.sh         # Development (port 3001)
./scripts/staging.sh     # Staging (port 3002)
./scripts/prod.sh        # Production (port 3000)

# SEED STAGING
./scripts/seed-staging.sh

# CALCULATE SCORES
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public" \
  npx tsx scripts/calculate-veritas-batch.ts --limit=50

# PRISMA STUDIO
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public" npx prisma studio
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging?schema=public" npx prisma studio
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs?schema=public" npx prisma studio

# CHECK STATS
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging -c "
SELECT COUNT(*) as products, (SELECT COUNT(*) FROM veritas_scores) as scores FROM products;"
```

---

**Related Documentation:**
- `STAGING_ENVIRONMENT.md` - Detailed staging workflow
- `COMPLETE_API_DOCUMENTATION.md` - All API endpoints
- `VERITAS_API_DOCS.md` - Veritas Score API reference

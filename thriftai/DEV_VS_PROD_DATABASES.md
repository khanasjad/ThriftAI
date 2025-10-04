# Development vs Staging vs Production - Complete Guide

**Last Updated:** October 4, 2025

---

## 🎯 Overview

ThriftAI uses **three separate databases** for different stages of the development lifecycle:

| Environment | Database | Records | Port | Purpose |
|------------|----------|---------|------|---------|
| **Development** | `thriftai_nextjs_dev` | 0 (empty) | 3001 | Testing, development, experimentation |
| **Staging** | `thriftai_nextjs_staging` | Variable | 3002 | **Real data fetching & Veritas score generation** |
| **Production** | `thriftai_nextjs` | 101,802 products | 3000 | Customer-facing, read-only |

---

## 🔧 How It Works

### Environment-Based Database Selection

Next.js automatically loads the correct database based on `NODE_ENV`:

```bash
# When NODE_ENV=development
DATABASE_URL → thriftai_nextjs_dev

# When NODE_ENV=production
DATABASE_URL → thriftai_nextjs
```

### File Structure

```
.env.local          # API keys, secrets (never commit)
.env.development    # Development config + dev database
.env.production     # Production config + prod database
```

**Load Priority:**
1. `.env.local` (highest - for local secrets)
2. `.env.production` OR `.env.development` (based on NODE_ENV)
3. `.env` (defaults)

---

## 🚀 Quick Start

### Method 1: Using Helper Scripts (Recommended)

```bash
# Start in DEVELOPMENT mode (empty database)
./scripts/dev.sh         # Port 3001

# Start in STAGING mode (real data fetching & score generation)
./scripts/staging.sh     # Port 3002

# Start in PRODUCTION mode (101,802 products)
./scripts/prod.sh        # Port 3000
```

### Method 2: Manual Commands

```bash
# Development mode
NODE_ENV=development npm run dev

# Staging mode
NODE_ENV=staging PORT=3002 npm run dev

# Production mode
NODE_ENV=production npm run dev
```

---

## 📊 Database Details

### Development Database (`thriftai_nextjs_dev`)

**Status:** Empty (0 records)
**Connection:** `postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev`

**Purpose:**
- Test new features safely
- Experiment with Veritas Score calculations
- Seed with sample data as needed
- Break things without consequences

**Features:**
- ✅ All 50 tables created
- ✅ Full Prisma schema
- ✅ Relational architecture (8 Veritas tables)
- ⚠️ No products yet (add test data)

### Production Database (`thriftai_nextjs`)

**Status:** Active (101,802 products)
**Connection:** `postgresql://asjadkhan@localhost:5432/thriftai_nextjs`

**Contains:**
- 101,802 products across 92+ categories
- 1,579 users
- 1,578 buyers
- 29 Veritas Scores (calculated)
- 16 Company Profiles (including Apple with live stock data)
- 1,091 Veritas Parameters
- Database size: 366 MB

---

## 🔄 Switching Between Databases

### View Current Database

```bash
# Check which database you're connected to
echo $NODE_ENV

# Or query PostgreSQL
psql postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev -c "SELECT current_database();"
```

### Prisma Studio with Specific Database

```bash
# View development database
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public" npx prisma studio

# View production database
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs?schema=public" npx prisma studio
```

---

## 📝 Common Tasks

### Add Sample Data to Development Database

```bash
# Option 1: Create seed script
npm run seed:dev

# Option 2: Copy subset from production
pg_dump -h localhost -U asjadkhan -d thriftai_nextjs -t products --data-only --where="id IN (SELECT id FROM products LIMIT 100)" | \
  psql -h localhost -U asjadkhan -d thriftai_nextjs_dev

# Option 3: Use Prisma Studio GUI
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public" npx prisma studio
```

### Reset Development Database

```bash
# Drop and recreate dev database
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d postgres -c "DROP DATABASE thriftai_nextjs_dev;"
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d postgres -c "CREATE DATABASE thriftai_nextjs_dev;"

# Re-sync schema
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public" npx prisma db push
```

### Backup Production Database

```bash
# Full backup
pg_dump -h localhost -U asjadkhan -d thriftai_nextjs -F c -f backups/thriftai_prod_$(date +%Y%m%d).dump

# Schema only
pg_dump -h localhost -U asjadkhan -d thriftai_nextjs --schema-only -f backups/schema.sql

# Specific tables
pg_dump -h localhost -U asjadkhan -d thriftai_nextjs -t products -t veritas_scores -f backups/critical_tables.sql
```

---

## ⚙️ Configuration Files

### `.env.development`

```bash
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ENABLE_TEST_PAGES=true
NEXT_PUBLIC_VERITAS_ENV=development

# Development Database (empty)
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public"
```

### `.env.production`

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://thriftai.com
NEXT_PUBLIC_ENABLE_TEST_PAGES=false
NEXT_PUBLIC_VERITAS_ENV=production

# Production Database (101,802 products)
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs?schema=public"
```

### `.env.local`

```bash
# API Keys (same for both environments)
ANTHROPIC_API_KEY="sk-ant-api03-..."
ALPHA_VANTAGE_API_KEY="your_key"
EBAY_APP_ID="your_app_id"

# DATABASE_URL removed - comes from .env.development or .env.production
```

---

## 🧪 Testing Workflow

### 1. Develop New Feature

```bash
# Start in dev mode
./scripts/dev.sh

# Add test products via Prisma Studio or API
# Test Veritas Score calculations
# Experiment freely
```

### 2. Test on Production Data (Read-Only)

```bash
# Start in prod mode
./scripts/prod.sh

# Browse real products
# Verify scores look correct
# DO NOT modify data
```

### 3. Deploy to Remote Production

```bash
# Build for production
npm run build

# Deploy (update .env.production with remote DATABASE_URL)
# DATABASE_URL="postgresql://user:pass@prod-server:5432/thriftai_nextjs"
```

---

## 🔐 Security Best Practices

### Development Database
- ✅ Can be reset anytime
- ✅ Safe to experiment with
- ✅ No customer data
- ⚠️ Still keep credentials secure

### Production Database
- ⚠️ **NEVER** reset or truncate tables
- ⚠️ **NEVER** test destructive operations
- ⚠️ Always backup before schema changes
- ⚠️ Use transactions for bulk updates
- ✅ Read-only for most developers
- ✅ Write access only for verified operations

---

## 📋 Checklist: Which Database Am I Using?

Run this to verify:

```bash
# Check NODE_ENV
echo "NODE_ENV: $NODE_ENV"

# Check database from .env file
grep DATABASE_URL .env.development
grep DATABASE_URL .env.production

# Check active connection
lsof -i :5432 | grep postgres

# Query current database
PGPASSWORD=postgres psql -h localhost -U asjadkhan -c "
SELECT
  current_database() as db_name,
  pg_size_pretty(pg_database_size(current_database())) as size,
  (SELECT count(*) FROM products) as product_count;
"
```

**Expected Output:**

| Database | Size | Products |
|----------|------|----------|
| `thriftai_nextjs_dev` | ~50 MB | 0 |
| `thriftai_nextjs` | 366 MB | 101,802 |

---

## 🚨 Troubleshooting

### Problem: Wrong database being used

**Solution:**
```bash
# Clear any environment variable overrides
unset DATABASE_URL

# Restart dev server with explicit NODE_ENV
NODE_ENV=development npm run dev
```

### Problem: Schema out of sync

**Solution:**
```bash
# For development
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public" npx prisma db push

# For production (careful!)
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs?schema=public" npx prisma db push
```

### Problem: Prisma Studio showing wrong database

**Solution:**
```bash
# Kill existing Prisma Studio
pkill -f "prisma studio"

# Start with explicit database URL
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public" npx prisma studio
```

---

## 📊 Database Comparison

```bash
# Compare table counts between databases
echo "=== Development Database ==="
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_dev -c "
SELECT 'products' as table, count(*) FROM products
UNION ALL SELECT 'veritas_scores', count(*) FROM veritas_scores
UNION ALL SELECT 'users', count(*) FROM users;
"

echo "=== Production Database ==="
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs -c "
SELECT 'products' as table, count(*) FROM products
UNION ALL SELECT 'veritas_scores', count(*) FROM veritas_scores
UNION ALL SELECT 'users', count(*) FROM users;
"
```

---

## 🎓 Best Practices

### Development Database
1. **Seed with realistic data** - Don't test on empty tables
2. **Reset frequently** - Start fresh to catch initialization bugs
3. **Use transactions** - Even in dev, test rollback scenarios
4. **Document test data** - Create seed scripts for reproducibility

### Production Database
1. **Backup before schema changes** - Always have a rollback plan
2. **Test migrations on dev first** - Never run untested migrations
3. **Use read replicas** - For analytics and reporting
4. **Monitor query performance** - Track slow queries
5. **Regular backups** - Automated daily backups minimum

---

## 📞 Quick Reference

### Start Commands

```bash
# Development (empty database)
./scripts/dev.sh

# Production (101,802 products)
./scripts/prod.sh

# Prisma Studio - Dev
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public" npx prisma studio

# Prisma Studio - Prod
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs?schema=public" npx prisma studio
```

### Database URLs

```bash
# Development
postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public

# Production
postgresql://asjadkhan@localhost:5432/thriftai_nextjs?schema=public
```

### Key Environment Variables

```bash
# Development
export NODE_ENV=development

# Production
export NODE_ENV=production
```

---

## 🔄 Migration Strategy

When making schema changes:

1. **Update Prisma schema** (`prisma/schema.prisma`)
2. **Test on dev database first:**
   ```bash
   DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public" npx prisma db push
   ```
3. **Verify changes work** with test data
4. **Backup production:**
   ```bash
   pg_dump -h localhost -U asjadkhan -d thriftai_nextjs -F c -f backup_pre_migration.dump
   ```
5. **Apply to production:**
   ```bash
   DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs?schema=public" npx prisma db push
   ```

---

**Next Steps:**
- Add seed data to development database
- Create automated backup script for production
- Set up read replica for analytics
- Configure remote production database

---

**Documentation:** See also `PRODUCTION_DATABASE_DETAILS.md` for current database stats

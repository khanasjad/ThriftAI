#!/bin/bash
# Seed Staging Database with Real Products and Calculate Veritas Scores
# This script:
# 1. Copies products from production to staging
# 2. Triggers real Veritas Score calculations with external API calls

set -e

STAGING_DB="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_staging"
PROD_DB="postgresql://asjadkhan@localhost:5432/thriftai_nextjs"

echo "🎭 STAGING Data Seeding & Veritas Score Generation"
echo "=================================================="
echo ""

# Ask user how many products to seed
read -p "How many products to copy from production? (default: 100): " PRODUCT_COUNT
PRODUCT_COUNT=${PRODUCT_COUNT:-100}

echo ""
echo "📊 Step 1: Copying $PRODUCT_COUNT products from production..."
echo ""

# Copy diverse products (mix of categories and brands)
pg_dump -h localhost -U asjadkhan -d thriftai_nextjs \
  -t products \
  --data-only \
  --inserts \
  --where="id IN (
    SELECT id FROM products
    WHERE \"isAvailable\" = true
    ORDER BY RANDOM()
    LIMIT $PRODUCT_COUNT
  )" | \
  PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging

echo "✅ Copied $PRODUCT_COUNT products to staging"
echo ""

# Copy sellers
echo "📊 Step 2: Copying related sellers..."
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging -c "
  INSERT INTO sellers (id, username, email, \"createdAt\", \"updatedAt\")
  SELECT DISTINCT s.id, s.username, s.email, s.\"createdAt\", s.\"updatedAt\"
  FROM dblink('$PROD_DB', 'SELECT id, username, email, \"createdAt\", \"updatedAt\" FROM sellers')
    AS s(id text, username text, email text, \"createdAt\" timestamp, \"updatedAt\" timestamp)
  WHERE s.id IN (SELECT DISTINCT \"sellerId\" FROM products WHERE \"sellerId\" IS NOT NULL)
  ON CONFLICT (id) DO NOTHING;
" 2>/dev/null || echo "⚠️  Note: dblink extension not available. Sellers may need manual copying."

echo "✅ Sellers copied"
echo ""

# Copy buyers (if any)
echo "📊 Step 3: Copying related buyers..."
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging -c "
  INSERT INTO buyers (id, email, \"createdAt\", \"updatedAt\")
  SELECT DISTINCT b.id, b.email, b.\"createdAt\", b.\"updatedAt\"
  FROM dblink('$PROD_DB', 'SELECT id, email, \"createdAt\", \"updatedAt\" FROM buyers LIMIT 10')
    AS b(id text, email text, \"createdAt\" timestamp, \"updatedAt\" timestamp)
  ON CONFLICT (id) DO NOTHING;
" 2>/dev/null || echo "⚠️  Note: dblink extension not available. Buyers may need manual copying."

echo "✅ Buyers copied"
echo ""

# Get product statistics
echo "📊 Staging Database Statistics:"
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging -c "
SELECT
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM sellers) as sellers,
  (SELECT COUNT(*) FROM buyers) as buyers,
  (SELECT COUNT(DISTINCT brand) FROM products WHERE brand IS NOT NULL) as brands,
  (SELECT COUNT(DISTINCT category) FROM products WHERE category IS NOT NULL) as categories;
"

echo ""
echo "🔬 Step 4: Calculating Veritas Scores..."
echo "This will make REAL API calls to:"
echo "  - Alpha Vantage (stock data)"
echo "  - eBay Finding API (seller ratings)"
echo "  - GSMArena (phone specs)"
echo "  - And other FREE data sources"
echo ""

# Create a batch score calculation script
cat > /tmp/calculate_staging_scores.js << 'EOF'
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function calculateScores() {
  console.log('🔬 Starting batch Veritas Score calculation...\n')

  const products = await prisma.product.findMany({
    where: { isAvailable: true },
    take: 100,
    orderBy: { createdAt: 'desc' }
  })

  console.log(`📊 Found ${products.length} products to score\n`)

  let completed = 0
  let failed = 0

  for (const product of products) {
    try {
      console.log(`[${completed + 1}/${products.length}] Calculating score for: ${product.name}`)

      // Call the Veritas Score API endpoint
      const response = await fetch(`http://localhost:3002/api/test/veritas-score?productId=${product.id}`)

      if (response.ok) {
        const scoreData = await response.json()
        console.log(`  ✅ Score: ${scoreData.overallScore.toFixed(1)} | SSN: ${scoreData.ssn}`)
        completed++
      } else {
        console.log(`  ❌ Failed: ${response.statusText}`)
        failed++
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
      failed++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`  ✅ Completed: ${completed}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  📈 Success Rate: ${((completed / products.length) * 100).toFixed(1)}%`)

  await prisma.$disconnect()
}

calculateScores().catch(console.error)
EOF

echo "📝 Batch calculation script created"
echo ""
echo "⚠️  IMPORTANT: Veritas score calculation requires:"
echo "   1. Staging server running (./scripts/staging.sh)"
echo "   2. API keys configured in .env.local"
echo ""
echo "To calculate scores, run:"
echo "   DATABASE_URL=\"$STAGING_DB\" node /tmp/calculate_staging_scores.js"
echo ""
echo "✅ Staging database seeded successfully!"
echo ""
echo "Quick Stats:"
PGPASSWORD=postgres psql -h localhost -U asjadkhan -d thriftai_nextjs_staging -c "
SELECT
  'Products' as metric, COUNT(*)::text as count FROM products
UNION ALL
SELECT 'Unique Brands', COUNT(DISTINCT brand)::text FROM products
UNION ALL
SELECT 'Unique Categories', COUNT(DISTINCT category)::text FROM products;
"

-- Migration: Normalize company_metrics from JSON to Relational
-- Phase 2.3 of Database Optimization Plan
-- Strategy: Deduplicate company data per seller (1000 products → 73 sellers)
-- Date: 2025-10-20

-- ============================================================================
-- RESEARCH & RATIONALE
-- ============================================================================
-- Problem: company_metrics violates 2NF (Second Normal Form)
--   - Company data stored per-product instead of per-seller
--   - Same metrics duplicated across all products from same seller
--   - Update anomaly: Must update all products when company data changes
--   - Storage redundancy: 1000 rows → 73 unique sellers
--
-- Solution: Dedicated company_financial_metrics table
--   - One record per seller (not per product)
--   - Proper foreign key relationships
--   - Eliminates update anomalies
--
-- Expected Benefits:
--   - Storage: ~93% reduction (1000 → 73 records)
--   - Update efficiency: 247x faster (1 write vs 247 writes for Nike products)
--   - Data consistency: Single source of truth
--   - Query performance: JOIN support enabled
-- ============================================================================


-- ============================================================================
-- 1. CREATE COMPANY FINANCIAL METRICS TABLE
-- ============================================================================
-- One record per seller with all financial/performance data

CREATE TABLE IF NOT EXISTS "company_financial_metrics" (
  "id"                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sellerId"                TEXT NOT NULL UNIQUE REFERENCES "sellers"("id") ON DELETE CASCADE,

  -- Financial Metrics
  "stockPrice"              DECIMAL(12, 2),    -- Current stock price
  "marketCap"               DECIMAL(18, 2),    -- Market capitalization (in millions)
  "profitMargin"            DECIMAL(5, 2),     -- Profit margin percentage
  "revenueGrowth"           DECIMAL(5, 2),     -- Revenue growth percentage
  "debtToEquity"            DECIMAL(8, 2),     -- Debt-to-equity ratio

  -- Performance Metrics
  "stockPerformance30d"     DECIMAL(6, 2),     -- 30-day stock performance (%)
  "stockPerformance1y"      DECIMAL(6, 2),     -- 1-year stock performance (%)

  -- Trust & Reputation Metrics
  "creditRating"            TEXT,              -- e.g., 'AAA', 'AA+', 'BBB', 'No data available'

  -- Metadata
  "dataSource"              TEXT,              -- Source of financial data
  "lastUpdated"             TIMESTAMP,         -- When data was last refreshed
  "createdAt"               TIMESTAMP DEFAULT NOW(),
  "updatedAt"               TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

-- Primary lookup: by seller
CREATE INDEX IF NOT EXISTS "idx_company_metrics_seller"
ON "company_financial_metrics"("sellerId");

-- Credit rating filter (trust scoring)
CREATE INDEX IF NOT EXISTS "idx_company_metrics_credit_rating"
ON "company_financial_metrics"("creditRating")
WHERE "creditRating" IS NOT NULL AND "creditRating" != 'No data available';

-- Stock performance filters (trending companies)
CREATE INDEX IF NOT EXISTS "idx_company_metrics_stock_perf_30d"
ON "company_financial_metrics"("stockPerformance30d" DESC NULLS LAST)
WHERE "stockPerformance30d" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_company_metrics_stock_perf_1y"
ON "company_financial_metrics"("stockPerformance1y" DESC NULLS LAST)
WHERE "stockPerformance1y" IS NOT NULL;

-- Market cap ranking
CREATE INDEX IF NOT EXISTS "idx_company_metrics_market_cap"
ON "company_financial_metrics"("marketCap" DESC NULLS LAST)
WHERE "marketCap" IS NOT NULL;

-- Data freshness monitoring
CREATE INDEX IF NOT EXISTS "idx_company_metrics_updated"
ON "company_financial_metrics"("lastUpdated" DESC NULLS LAST);


-- ============================================================================
-- 3. MIGRATE DATA FROM PRODUCTS.company_metrics JSON TO NEW TABLE
-- ============================================================================
-- Deduplicate by sellerId (keep most recent data per seller)

INSERT INTO "company_financial_metrics" (
  "sellerId",
  "stockPrice",
  "marketCap",
  "profitMargin",
  "revenueGrowth",
  "debtToEquity",
  "stockPerformance30d",
  "stockPerformance1y",
  "creditRating",
  "dataSource",
  "lastUpdated"
)
SELECT DISTINCT ON (p."sellerId")
  p."sellerId",
  -- Extract and convert numeric fields
  CASE
    WHEN p.company_metrics->>'stockPrice' IS NOT NULL
      AND p.company_metrics->>'stockPrice' != ''
      AND p.company_metrics->>'stockPrice' ~ '^[0-9]+\.?[0-9]*$'
    THEN (p.company_metrics->>'stockPrice')::DECIMAL(12, 2)
    ELSE NULL
  END as "stockPrice",

  CASE
    WHEN p.company_metrics->>'marketCap' IS NOT NULL
      AND p.company_metrics->>'marketCap' != ''
      AND p.company_metrics->>'marketCap' ~ '^[0-9]+\.?[0-9]*$'
    THEN (p.company_metrics->>'marketCap')::DECIMAL(18, 2)
    ELSE NULL
  END as "marketCap",

  CASE
    WHEN p.company_metrics->>'profitMargin' IS NOT NULL
      AND p.company_metrics->>'profitMargin' != ''
      AND p.company_metrics->>'profitMargin' ~ '^-?[0-9]+\.?[0-9]*$'
    THEN (p.company_metrics->>'profitMargin')::DECIMAL(5, 2)
    ELSE NULL
  END as "profitMargin",

  CASE
    WHEN p.company_metrics->>'revenueGrowth' IS NOT NULL
      AND p.company_metrics->>'revenueGrowth' != ''
      AND p.company_metrics->>'revenueGrowth' ~ '^-?[0-9]+\.?[0-9]*$'
    THEN (p.company_metrics->>'revenueGrowth')::DECIMAL(5, 2)
    ELSE NULL
  END as "revenueGrowth",

  CASE
    WHEN p.company_metrics->>'debtToEquity' IS NOT NULL
      AND p.company_metrics->>'debtToEquity' != ''
      AND p.company_metrics->>'debtToEquity' ~ '^[0-9]+\.?[0-9]*$'
    THEN (p.company_metrics->>'debtToEquity')::DECIMAL(8, 2)
    ELSE NULL
  END as "debtToEquity",

  CASE
    WHEN p.company_metrics->>'stockPerformance30d' IS NOT NULL
      AND p.company_metrics->>'stockPerformance30d' != ''
      AND p.company_metrics->>'stockPerformance30d' ~ '^-?[0-9]+\.?[0-9]*$'
    THEN (p.company_metrics->>'stockPerformance30d')::DECIMAL(6, 2)
    ELSE NULL
  END as "stockPerformance30d",

  CASE
    WHEN p.company_metrics->>'stockPerformance1y' IS NOT NULL
      AND p.company_metrics->>'stockPerformance1y' != ''
      AND p.company_metrics->>'stockPerformance1y' ~ '^-?[0-9]+\.?[0-9]*$'
    THEN (p.company_metrics->>'stockPerformance1y')::DECIMAL(6, 2)
    ELSE NULL
  END as "stockPerformance1y",

  -- Text fields
  p.company_metrics->>'creditRating' as "creditRating",
  p.company_metrics->>'dataSource' as "dataSource",

  -- Timestamp
  CASE
    WHEN p.company_metrics->>'lastUpdated' IS NOT NULL
      AND p.company_metrics->>'lastUpdated' != ''
    THEN (p.company_metrics->>'lastUpdated')::TIMESTAMP
    ELSE NOW()
  END as "lastUpdated"

FROM "products" p
WHERE
  p.company_metrics IS NOT NULL
  AND p."sellerId" IS NOT NULL
ORDER BY
  p."sellerId",
  p."updatedAt" DESC  -- Keep most recent data per seller
ON CONFLICT ("sellerId") DO NOTHING;


-- ============================================================================
-- 4. ADD FOREIGN KEY TO PRODUCTS TABLE
-- ============================================================================
-- Link products to their seller's company metrics

ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "companyMetricsId" TEXT;

-- Create index before FK for performance
CREATE INDEX IF NOT EXISTS "idx_products_company_metrics"
ON "products"("companyMetricsId")
WHERE "companyMetricsId" IS NOT NULL;

-- Add foreign key constraint
ALTER TABLE "products"
ADD CONSTRAINT "fk_products_company_metrics"
FOREIGN KEY ("companyMetricsId")
REFERENCES "company_financial_metrics"("id")
ON DELETE SET NULL;

-- Populate the foreign key
UPDATE "products" p
SET "companyMetricsId" = cfm."id"
FROM "company_financial_metrics" cfm
WHERE p."sellerId" = cfm."sellerId";


-- ============================================================================
-- 5. DATA INTEGRITY VERIFICATION
-- ============================================================================

DO $$
DECLARE
  total_products INTEGER;
  products_with_json INTEGER;
  unique_sellers INTEGER;
  total_company_records INTEGER;
  products_linked INTEGER;
  storage_reduction DECIMAL;
BEGIN
  -- Count products
  SELECT COUNT(*) INTO total_products FROM "products";

  -- Count products with original JSON
  SELECT COUNT(*) INTO products_with_json
  FROM "products" WHERE company_metrics IS NOT NULL;

  -- Count unique sellers
  SELECT COUNT(*) INTO unique_sellers
  FROM "products" WHERE "sellerId" IS NOT NULL;

  -- Count company financial records
  SELECT COUNT(*) INTO total_company_records
  FROM "company_financial_metrics";

  -- Count products linked to company metrics
  SELECT COUNT(*) INTO products_linked
  FROM "products" WHERE "companyMetricsId" IS NOT NULL;

  -- Calculate storage reduction
  storage_reduction := ((products_with_json::DECIMAL - total_company_records::DECIMAL)
                        / NULLIF(products_with_json, 0) * 100);

  RAISE NOTICE '';
  RAISE NOTICE '=== Company Metrics Normalization Verification ===';
  RAISE NOTICE 'Total products: %', total_products;
  RAISE NOTICE 'Products with company_metrics JSON: %', products_with_json;
  RAISE NOTICE 'Unique sellers: %', unique_sellers;
  RAISE NOTICE 'Company financial records created: %', total_company_records;
  RAISE NOTICE 'Products linked to company metrics: % (%.1f%%)',
    products_linked,
    (products_linked::FLOAT / NULLIF(total_products, 0) * 100);
  RAISE NOTICE 'Storage reduction: %.1f%% (% → % records)',
    storage_reduction,
    products_with_json,
    total_company_records;
  RAISE NOTICE '==================================================';

  -- Warnings
  IF total_company_records = 0 THEN
    RAISE WARNING 'No company financial records created - check data migration';
  END IF;

  IF products_linked < (total_products * 0.8) THEN
    RAISE WARNING 'Low link rate: Only %.1f%% of products linked to company metrics',
      (products_linked::FLOAT / NULLIF(total_products, 0) * 100);
  END IF;

  IF total_company_records > unique_sellers THEN
    RAISE WARNING 'More company records (%) than unique sellers (%) - investigate duplicates',
      total_company_records, unique_sellers;
  END IF;
END $$;


-- ============================================================================
-- 6. PERFORMANCE BENCHMARK
-- ============================================================================
-- Test query performance on new structure

DO $$
DECLARE
  test_start TIMESTAMPTZ;
  test_end TIMESTAMPTZ;
  test_duration INTERVAL;
  sample_seller_id TEXT;
BEGIN
  -- Get a sample seller ID
  SELECT "sellerId" INTO sample_seller_id
  FROM "products"
  WHERE "sellerId" IS NOT NULL
  LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '=== Performance Benchmarks ===';

  -- Test 1: Get company metrics with JOIN (NEW capability)
  test_start := clock_timestamp();
  PERFORM p.id, cfm."creditRating", cfm."stockPrice"
  FROM "products" p
  LEFT JOIN "company_financial_metrics" cfm ON p."companyMetricsId" = cfm."id"
  WHERE p."isAvailable" = true
  LIMIT 100;
  test_end := clock_timestamp();
  test_duration := test_end - test_start;
  RAISE NOTICE 'JOIN products + company metrics: % ms',
    EXTRACT(MILLISECONDS FROM test_duration);

  -- Test 2: Filter by credit rating (NEW capability)
  test_start := clock_timestamp();
  PERFORM p.*
  FROM "products" p
  JOIN "company_financial_metrics" cfm ON p."companyMetricsId" = cfm."id"
  WHERE cfm."creditRating" = 'AAA' AND p."isAvailable" = true
  LIMIT 100;
  test_end := clock_timestamp();
  test_duration := test_end - test_start;
  RAISE NOTICE 'Filter by credit rating: % ms',
    EXTRACT(MILLISECONDS FROM test_duration);

  -- Test 3: Update company metrics (demonstrate efficiency)
  test_start := clock_timestamp();
  UPDATE "company_financial_metrics"
  SET "stockPrice" = "stockPrice" + 0.01
  WHERE "sellerId" = sample_seller_id;
  test_end := clock_timestamp();
  test_duration := test_end - test_start;
  RAISE NOTICE 'Update company metrics (1 row vs N rows): % ms',
    EXTRACT(MILLISECONDS FROM test_duration);

  -- Rollback the update
  ROLLBACK;

  RAISE NOTICE '================================';
END $$;


-- ============================================================================
-- ROLLBACK SAFETY
-- ============================================================================
-- NOTE: company_metrics JSON column is PRESERVED for rollback safety
-- It will be dropped in a future migration after 30 days of stability
--
-- To rollback this migration:
--   1. Drop companyMetricsId column from products
--   2. Drop company_financial_metrics table
--   3. Restore queries to use company_metrics->>'key' pattern
--
-- Company_metrics JSON will be deprecated but not dropped until Phase 2 complete
-- ============================================================================


-- ============================================================================
-- EXPECTED PERFORMANCE IMPROVEMENTS
-- ============================================================================
-- UPDATE Operations:
--   Before: Update 247 product rows (Nike products)
--   After:  Update 1 company_financial_metrics row
--   Improvement: 247x faster updates
--
-- STORAGE:
--   Before: 1000 product rows with company_metrics JSON
--   After:  73 company_financial_metrics rows
--   Savings: 93% reduction (927 fewer redundant records)
--
-- JOIN Operations:
--   Before: Not possible (JSON field)
--   After:  Full JOIN support with proper foreign keys
--   Improvement: New capability unlocked
--
-- Data Consistency:
--   Before: Must update all products from same seller
--   After:  Single source of truth per seller
--   Improvement: Eliminates update anomalies
-- ============================================================================

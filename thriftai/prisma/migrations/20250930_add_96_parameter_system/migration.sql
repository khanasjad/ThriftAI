-- 96-Parameter AI Scoring System Migration
-- This migration adds support for:
-- 1. Vector embeddings (pgvector)
-- 2. AI scoring fields
-- 3. Company metrics
-- 4. Dynamic product specifications
-- 5. Leaderboard rankings

-- ========================================
-- Step 1: Install pgvector extension
-- ========================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- Step 2: Add AI Scoring Fields
-- ========================================

-- AI Score (0-100) calculated from 96 parameters
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "ai_score" DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS "ai_score_breakdown" JSONB,
ADD COLUMN IF NOT EXISTS "ai_confidence" DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS "last_scored_at" TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN "products"."ai_score" IS 'Overall AI score (0-100) calculated from 96 parameters';
COMMENT ON COLUMN "products"."ai_score_breakdown" IS 'Detailed breakdown of all scoring components';
COMMENT ON COLUMN "products"."ai_confidence" IS 'Confidence level in the score (0-1)';

-- ========================================
-- Step 3: Add Vector Embedding Column
-- ========================================

-- 1536-dimensional vector for OpenAI text-embedding-3-large
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

-- Add timestamp for tracking embedding updates
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "embedding_updated_at" TIMESTAMP;

COMMENT ON COLUMN "products"."embedding" IS 'Semantic vector embedding (1536 dimensions) for similarity search';

-- ========================================
-- Step 4: Create HNSW Index for Fast Vector Search
-- ========================================

-- HNSW (Hierarchical Navigable Small World) index for cosine similarity
-- m=16: number of connections per layer (higher = more accurate but slower)
-- ef_construction=64: size of dynamic candidate list (higher = better quality but slower build)
CREATE INDEX IF NOT EXISTS "products_embedding_idx"
ON "products"
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ========================================
-- Step 5: Add Company Metrics Fields
-- ========================================

-- Store all 25 company-level parameters as JSON
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "company_metrics" JSONB;

COMMENT ON COLUMN "products"."company_metrics" IS 'Company-level parameters (stock, ESG, growth, sustainability, etc.)';

-- Create GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS "products_company_metrics_idx"
ON "products"
USING GIN ("company_metrics");

-- ========================================
-- Step 6: Add Dynamic Product Specs Fields
-- ========================================

-- Store all 25 dynamic product-specific parameters as JSON
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "dynamic_specs" JSONB;

COMMENT ON COLUMN "products"."dynamic_specs" IS 'Category-specific dynamic parameters (CPU, RAM for electronics; fabric for clothing, etc.)';

-- Create GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS "products_dynamic_specs_idx"
ON "products"
USING GIN ("dynamic_specs");

-- ========================================
-- Step 7: Add Leaderboard Fields
-- ========================================

-- Ranking fields (updated periodically by leaderboard system)
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "global_rank" INTEGER,
ADD COLUMN IF NOT EXISTS "category_rank" INTEGER,
ADD COLUMN IF NOT EXISTS "price_tier_rank" INTEGER,
ADD COLUMN IF NOT EXISTS "leaderboard_badges" TEXT[] DEFAULT '{}';

COMMENT ON COLUMN "products"."global_rank" IS 'Global ranking based on AI score';
COMMENT ON COLUMN "products"."category_rank" IS 'Ranking within product category';
COMMENT ON COLUMN "products"."price_tier_rank" IS 'Ranking within price tier (budget/mid/premium/luxury)';
COMMENT ON COLUMN "products"."leaderboard_badges" IS 'Achievement badges (Best Value, Eco-Friendly, etc.)';

-- Create indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS "products_ai_score_desc_idx"
ON "products" ("ai_score" DESC NULLS LAST)
WHERE "is_available" = true;

CREATE INDEX IF NOT EXISTS "products_global_rank_idx"
ON "products" ("global_rank")
WHERE "global_rank" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "products_category_rank_idx"
ON "products" ("category_rank")
WHERE "category_rank" IS NOT NULL;

-- Composite indexes for leaderboard by category
CREATE INDEX IF NOT EXISTS "products_category_ai_score_idx"
ON "products" ("category", "ai_score" DESC NULLS LAST)
WHERE "is_available" = true;

-- Composite indexes for leaderboard by price tier
CREATE INDEX IF NOT EXISTS "products_price_ai_score_idx"
ON "products" ("price", "ai_score" DESC NULLS LAST)
WHERE "is_available" = true;

-- ========================================
-- Step 8: Create Materialized View for Leaderboard
-- ========================================

-- Materialized view for fast leaderboard access
CREATE MATERIALIZED VIEW IF NOT EXISTS "product_leaderboard" AS
SELECT
  p.id,
  p.name,
  p.category,
  p.brand,
  p.price,
  p.original_price,
  p.ai_score,
  p.ai_confidence,
  p.image_url,
  p.is_available,
  p.company_metrics,
  p.dynamic_specs,
  p.leaderboard_badges,
  p.created_at,
  p.updated_at,
  p.last_scored_at,

  -- Global ranking
  ROW_NUMBER() OVER (
    ORDER BY p.ai_score DESC NULLS LAST, p.created_at DESC
  ) as global_rank,

  -- Category ranking
  ROW_NUMBER() OVER (
    PARTITION BY p.category
    ORDER BY p.ai_score DESC NULLS LAST, p.created_at DESC
  ) as category_rank,

  -- Price tier ranking
  ROW_NUMBER() OVER (
    PARTITION BY
      CASE
        WHEN p.price < 50 THEN 'budget'
        WHEN p.price < 200 THEN 'mid'
        WHEN p.price < 1000 THEN 'premium'
        ELSE 'luxury'
      END
    ORDER BY p.ai_score DESC NULLS LAST, p.created_at DESC
  ) as price_tier_rank,

  -- Price tier label
  CASE
    WHEN p.price < 50 THEN 'budget'
    WHEN p.price < 200 THEN 'mid'
    WHEN p.price < 1000 THEN 'premium'
    ELSE 'luxury'
  END as price_tier

FROM "products" p
WHERE p.is_available = true
  AND p.ai_score IS NOT NULL;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS "product_leaderboard_id_idx"
ON "product_leaderboard" (id);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS "product_leaderboard_global_rank_idx"
ON "product_leaderboard" (global_rank);

CREATE INDEX IF NOT EXISTS "product_leaderboard_category_idx"
ON "product_leaderboard" (category, category_rank);

CREATE INDEX IF NOT EXISTS "product_leaderboard_price_tier_idx"
ON "product_leaderboard" (price_tier, price_tier_rank);

CREATE INDEX IF NOT EXISTS "product_leaderboard_ai_score_idx"
ON "product_leaderboard" (ai_score DESC);

-- ========================================
-- Step 9: Create Function to Refresh Leaderboard
-- ========================================

CREATE OR REPLACE FUNCTION refresh_product_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY "product_leaderboard";

  -- Update product table rankings from materialized view
  UPDATE "products" p
  SET
    global_rank = pl.global_rank,
    category_rank = pl.category_rank,
    price_tier_rank = pl.price_tier_rank,
    updated_at = NOW()
  FROM "product_leaderboard" pl
  WHERE p.id = pl.id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_product_leaderboard() IS 'Refreshes the product leaderboard materialized view and updates product rankings';

-- ========================================
-- Step 10: Create Auto-Refresh Trigger (Optional)
-- ========================================

-- Note: For production, use pg_cron or external scheduler
-- This is a placeholder for the cron job command:
-- SELECT cron.schedule('refresh-leaderboard', '0 * * * *', 'SELECT refresh_product_leaderboard()');

-- ========================================
-- Step 11: Create Helper Functions
-- ========================================

-- Function to get similar products using vector similarity
CREATE OR REPLACE FUNCTION get_similar_products(
  product_id TEXT,
  similarity_threshold FLOAT DEFAULT 0.7,
  result_limit INT DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  category TEXT,
  price FLOAT,
  ai_score DECIMAL,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p2.id,
    p2.name,
    p2.category,
    p2.price,
    p2.ai_score,
    1 - (p1.embedding <=> p2.embedding) as similarity
  FROM "products" p1
  CROSS JOIN "products" p2
  WHERE
    p1.id = product_id
    AND p2.id != product_id
    AND p1.embedding IS NOT NULL
    AND p2.embedding IS NOT NULL
    AND p2.is_available = true
    AND 1 - (p1.embedding <=> p2.embedding) >= similarity_threshold
  ORDER BY p1.embedding <=> p2.embedding
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_similar_products IS 'Finds similar products using vector similarity (cosine distance)';

-- Function to search products by vector similarity
CREATE OR REPLACE FUNCTION search_products_by_embedding(
  query_embedding vector(1536),
  result_limit INT DEFAULT 50,
  category_filter TEXT DEFAULT NULL,
  min_price FLOAT DEFAULT NULL,
  max_price FLOAT DEFAULT NULL,
  min_ai_score FLOAT DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  category TEXT,
  brand TEXT,
  price FLOAT,
  ai_score DECIMAL,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.category,
    p.brand,
    p.price,
    p.ai_score,
    1 - (p.embedding <=> query_embedding) as similarity
  FROM "products" p
  WHERE
    p.embedding IS NOT NULL
    AND p.is_available = true
    AND (category_filter IS NULL OR p.category = category_filter)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
    AND (min_ai_score IS NULL OR p.ai_score >= min_ai_score)
  ORDER BY p.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_products_by_embedding IS 'Semantic search using vector embeddings with optional filters';

-- ========================================
-- Step 12: Create Statistics View
-- ========================================

CREATE OR REPLACE VIEW "ai_scoring_statistics" AS
SELECT
  COUNT(*) as total_products,
  COUNT(CASE WHEN ai_score IS NOT NULL THEN 1 END) as scored_products,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as embedded_products,
  ROUND(AVG(ai_score)::numeric, 2) as avg_ai_score,
  ROUND(MIN(ai_score)::numeric, 2) as min_ai_score,
  ROUND(MAX(ai_score)::numeric, 2) as max_ai_score,
  ROUND(STDDEV(ai_score)::numeric, 2) as stddev_ai_score,
  COUNT(CASE WHEN company_metrics IS NOT NULL THEN 1 END) as products_with_company_metrics,
  COUNT(CASE WHEN dynamic_specs IS NOT NULL THEN 1 END) as products_with_dynamic_specs,
  MAX(last_scored_at) as last_scoring_run
FROM "products"
WHERE is_available = true;

COMMENT ON VIEW "ai_scoring_statistics" IS 'Aggregated statistics for the AI scoring system';

-- ========================================
-- Step 13: Create Category Statistics View
-- ========================================

CREATE OR REPLACE VIEW "ai_scoring_by_category" AS
SELECT
  category,
  COUNT(*) as product_count,
  COUNT(CASE WHEN ai_score IS NOT NULL THEN 1 END) as scored_count,
  ROUND(AVG(ai_score)::numeric, 2) as avg_score,
  ROUND(MIN(ai_score)::numeric, 2) as min_score,
  ROUND(MAX(ai_score)::numeric, 2) as max_score,
  ROUND(AVG(ai_confidence)::numeric, 2) as avg_confidence,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as embedded_count
FROM "products"
WHERE is_available = true
GROUP BY category
ORDER BY avg_score DESC NULLS LAST;

COMMENT ON VIEW "ai_scoring_by_category" IS 'AI scoring statistics grouped by product category';

-- ========================================
-- Step 14: Add Sample Data Validation
-- ========================================

-- Check if data needs initialization
DO $$
BEGIN
  -- Log current state
  RAISE NOTICE 'Total products: %', (SELECT COUNT(*) FROM products);
  RAISE NOTICE 'Products with AI scores: %', (SELECT COUNT(*) FROM products WHERE ai_score IS NOT NULL);
  RAISE NOTICE 'Products with embeddings: %', (SELECT COUNT(*) FROM products WHERE embedding IS NOT NULL);

  -- Note: Run batch scoring scripts after migration to populate these fields
  IF (SELECT COUNT(*) FROM products WHERE ai_score IS NOT NULL) = 0 THEN
    RAISE NOTICE 'No AI scores found. Run batch scoring script: npm run score:batch';
  END IF;

  IF (SELECT COUNT(*) FROM products WHERE embedding IS NOT NULL) = 0 THEN
    RAISE NOTICE 'No embeddings found. Run embedding generation script: npm run embeddings:generate';
  END IF;
END $$;

-- ========================================
-- Step 15: Performance Optimization Settings
-- ========================================

-- Set effective_cache_size for better query planning (adjust based on available RAM)
-- ALTER SYSTEM SET effective_cache_size = '4GB';

-- Set work_mem for sorting and hashing operations
-- ALTER SYSTEM SET work_mem = '64MB';

-- Set shared_buffers for caching (25% of RAM)
-- ALTER SYSTEM SET shared_buffers = '2GB';

-- Enable parallel query execution
-- ALTER SYSTEM SET max_parallel_workers_per_gather = 4;

-- Note: Uncomment and adjust these settings based on your production environment
-- Then run: SELECT pg_reload_conf();

-- ========================================
-- Migration Complete
-- ========================================

-- Grant necessary permissions (adjust as needed)
-- GRANT SELECT ON product_leaderboard TO your_app_user;
-- GRANT EXECUTE ON FUNCTION refresh_product_leaderboard() TO your_app_user;
-- GRANT EXECUTE ON FUNCTION get_similar_products TO your_app_user;
-- GRANT EXECUTE ON FUNCTION search_products_by_embedding TO your_app_user;

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '96-Parameter AI Scoring System Migration Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run: npx prisma generate';
  RAISE NOTICE '2. Run: npm run embeddings:generate (to create embeddings)';
  RAISE NOTICE '3. Run: npm run score:batch (to calculate AI scores)';
  RAISE NOTICE '4. Run: SELECT refresh_product_leaderboard() (to populate leaderboard)';
  RAISE NOTICE '========================================';
END $$;

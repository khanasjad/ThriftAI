-- Temporary Migration Without pgvector
-- This adds AI scoring fields without vector search capability

-- Add AI Scoring Fields
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "ai_score" DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS "ai_score_breakdown" JSONB,
ADD COLUMN IF NOT EXISTS "ai_confidence" DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS "last_scored_at" TIMESTAMP;

-- Add Company Metrics (25 parameters)
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "company_metrics" JSONB;

-- Add Dynamic Product Specs (25 parameters)
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "dynamic_specs" JSONB;

-- Add Leaderboard Ranking Fields
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "global_rank" INTEGER,
ADD COLUMN IF NOT EXISTS "category_rank" INTEGER,
ADD COLUMN IF NOT EXISTS "price_tier_rank" INTEGER,
ADD COLUMN IF NOT EXISTS "price_tier" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "leaderboard_badges" TEXT[] DEFAULT '{}';

-- Add Indexes for AI Scoring and Ranking
CREATE INDEX IF NOT EXISTS "idx_products_ai_score" ON "products"("ai_score" DESC);
CREATE INDEX IF NOT EXISTS "idx_products_ai_score_available" ON "products"("ai_score" DESC) WHERE "isAvailable" = true;
CREATE INDEX IF NOT EXISTS "idx_products_global_rank" ON "products"("global_rank") WHERE "global_rank" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_products_category_rank" ON "products"("category", "category_rank") WHERE "category_rank" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_products_price_tier_rank" ON "products"("price_tier", "price_tier_rank") WHERE "price_tier_rank" IS NOT NULL;

-- Create Leaderboard Materialized View (without vector columns)
CREATE MATERIALIZED VIEW IF NOT EXISTS "product_leaderboard" AS
SELECT
  p.id,
  p.name,
  p.category,
  p.brand,
  p.price,
  p."originalPrice",
  p.ai_score,
  p.ai_confidence,
  p."imageUrl",
  p.last_scored_at,
  p.price_tier,

  -- Global ranking
  ROW_NUMBER() OVER (ORDER BY p.ai_score DESC NULLS LAST) as global_rank,

  -- Category ranking
  ROW_NUMBER() OVER (PARTITION BY p.category ORDER BY p.ai_score DESC NULLS LAST) as category_rank,

  -- Price tier ranking
  ROW_NUMBER() OVER (PARTITION BY p.price_tier ORDER BY p.ai_score DESC NULLS LAST) as price_tier_rank,

  -- Leaderboard badges
  CASE
    WHEN ROW_NUMBER() OVER (ORDER BY p.ai_score DESC NULLS LAST) <= 10 THEN ARRAY['top-10']::TEXT[]
    WHEN ROW_NUMBER() OVER (PARTITION BY p.category ORDER BY p.ai_score DESC NULLS LAST) <= 3 THEN ARRAY['category-leader']::TEXT[]
    ELSE ARRAY[]::TEXT[]
  END as leaderboard_badges

FROM "products" p
WHERE p."isAvailable" = true
  AND p.ai_score IS NOT NULL;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS "idx_product_leaderboard_id" ON "product_leaderboard"("id");
CREATE INDEX IF NOT EXISTS "idx_product_leaderboard_global_rank" ON "product_leaderboard"("global_rank");
CREATE INDEX IF NOT EXISTS "idx_product_leaderboard_category" ON "product_leaderboard"("category", "category_rank");
CREATE INDEX IF NOT EXISTS "idx_product_leaderboard_price_tier" ON "product_leaderboard"("price_tier", "price_tier_rank");

-- Create function to refresh leaderboard
CREATE OR REPLACE FUNCTION refresh_product_leaderboard()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_leaderboard;
END;
$$;

-- Add comments
COMMENT ON COLUMN "products"."ai_score" IS 'Overall AI score (0-100) calculated from 96 parameters';
COMMENT ON COLUMN "products"."ai_score_breakdown" IS 'Detailed breakdown of all scoring components';
COMMENT ON COLUMN "products"."ai_confidence" IS 'Confidence level in the score (0-1)';
COMMENT ON COLUMN "products"."company_metrics" IS 'Company-level metrics (stocks, ESG, growth) - 25 parameters';
COMMENT ON COLUMN "products"."dynamic_specs" IS 'Dynamic product specifications extracted by AI - 25 parameters';
COMMENT ON MATERIALIZED VIEW "product_leaderboard" IS 'Materialized view for fast leaderboard queries';

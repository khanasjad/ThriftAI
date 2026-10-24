-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SHOPPER', 'BRAND', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."ClothingCategory" AS ENUM ('TOPS', 'BOTTOMS', 'DRESSES', 'OUTERWEAR', 'ACTIVEWEAR', 'UNDERWEAR', 'SHOES', 'ACCESSORIES');

-- CreateEnum
CREATE TYPE "public"."ClothingGender" AS ENUM ('WOMENS', 'MENS', 'UNISEX', 'KIDS_BOYS', 'KIDS_GIRLS');

-- CreateEnum
CREATE TYPE "public"."ReturnReason" AS ENUM ('TOO_SMALL', 'TOO_LARGE', 'POOR_FIT', 'POOR_QUALITY', 'NOT_AS_DESCRIBED', 'COLOR_MISMATCH', 'STYLE_DISLIKE', 'DAMAGE_DEFECT', 'WRONG_ITEM', 'CHANGED_MIND', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ReturnCategory" AS ENUM ('FIT', 'QUALITY', 'STYLE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."EvidenceSource" AS ENUM ('REVIEW', 'RETURN', 'SPEC', 'PRICE', 'TREND', 'BRAND', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."FactorPillar" AS ENUM ('FIT', 'QUALITY', 'STYLE_VALUE', 'COMFORT', 'SUSTAINABILITY');

-- CreateEnum
CREATE TYPE "public"."TrendPhase" AS ENUM ('EMERGING', 'PEAK', 'DECLINING', 'CLASSIC');

-- CreateEnum
CREATE TYPE "public"."TrendTag" AS ENUM ('TRENDING', 'CLASSIC', 'FADING');

-- CreateEnum
CREATE TYPE "public"."Confidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'NONE');

-- CreateEnum
CREATE TYPE "public"."ConfidenceLabel" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'NEW_LAUNCH');

-- CreateEnum
CREATE TYPE "public"."AgentRunStatus" AS ENUM ('RUNNING', 'OK', 'SKIPPED', 'BUDGET', 'MAX_ITERATIONS', 'REFUSAL', 'TRUNCATED', 'NO_FINISH', 'TOOL_ERRORS', 'TIMEOUT', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."StepKind" AS ENUM ('LLM', 'TOOL', 'GUARDRAIL');

-- CreateEnum
CREATE TYPE "public"."TurnRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "public"."FeedbackTarget" AS ENUM ('PRODUCT_SCORE', 'SEARCH_TURN');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "passwordHash" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'SHOPPER',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'pilot',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."brands" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "foundedYear" INTEGER,
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publishesSuppliers" BOOLEAN NOT NULL DEFAULT false,
    "hasRepairProgram" BOOLEAN NOT NULL DEFAULT false,
    "hasTakeBack" BOOLEAN NOT NULL DEFAULT false,
    "reputationScore" INTEGER,
    "logoUrl" TEXT,
    "source" TEXT NOT NULL,
    "licence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sellers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "source" TEXT NOT NULL,
    "licence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clothing_products" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" "public"."ClothingCategory" NOT NULL,
    "subcategory" TEXT,
    "gender" "public"."ClothingGender" NOT NULL,
    "description" TEXT,
    "currentPrice" DECIMAL(10,2) NOT NULL,
    "originalPrice" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "sizes" TEXT[],
    "colors" TEXT[],
    "materials" JSONB NOT NULL,
    "fabricWeightGsm" INTEGER,
    "elastanePct" INTEGER,
    "fitType" TEXT,
    "silhouette" TEXT,
    "constructionType" TEXT,
    "careInstructions" TEXT,
    "hasPetite" BOOLEAN NOT NULL DEFAULT false,
    "hasTall" BOOLEAN NOT NULL DEFAULT false,
    "hasPlus" BOOLEAN NOT NULL DEFAULT false,
    "recycledContent" INTEGER,
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "launchDate" TIMESTAMP(3),
    "trendTag" "public"."TrendTag",
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primaryImageUrl" TEXT,
    "source" TEXT NOT NULL,
    "licence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clothing_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clothing_reviews" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "fitRating" INTEGER,
    "qualityRating" INTEGER,
    "comfortRating" INTEGER,
    "styleRating" INTEGER,
    "valueRating" INTEGER,
    "sizePurchased" TEXT,
    "fitsAs" TEXT,
    "heightCm" INTEGER,
    "weightKg" INTEGER,
    "bodyType" TEXT,
    "wearDuration" TEXT,
    "pillingObserved" BOOLEAN,
    "colorFading" BOOLEAN,
    "shrinkage" BOOLEAN,
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "helpfulVotes" INTEGER NOT NULL DEFAULT 0,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "injectionFlag" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL,
    "licence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clothing_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."return_events" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "returnReason" "public"."ReturnReason" NOT NULL,
    "returnCategory" "public"."ReturnCategory" NOT NULL,
    "detailedReason" TEXT,
    "sizePurchased" TEXT,
    "purchasePrice" DECIMAL(10,2),
    "purchaseDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exchangedForSize" TEXT,
    "processedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL,
    "licence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."price_snapshots" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sellerId" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "listPrice" DECIMAL(10,2),
    "isPromo" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "licence" TEXT,

    CONSTRAINT "price_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trend_signals" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "trendName" TEXT NOT NULL,
    "trendCategory" TEXT NOT NULL,
    "trendScore" INTEGER NOT NULL,
    "trendPhase" "public"."TrendPhase" NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "region" TEXT,
    "source" TEXT NOT NULL,
    "licence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trend_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."evidence_tags" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sourceType" "public"."EvidenceSource" NOT NULL,
    "reviewId" TEXT,
    "returnId" TEXT,
    "runId" TEXT,
    "factor" TEXT NOT NULL,
    "pillar" "public"."FactorPillar" NOT NULL,
    "signal" TEXT NOT NULL,
    "sentiment" DECIMAL(3,2) NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "quote" TEXT,
    "grounded" BOOLEAN NOT NULL DEFAULT true,
    "injectionFlag" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_findings" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "brandId" TEXT,
    "runId" TEXT,
    "agent" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "factor" TEXT,
    "signal" TEXT,
    "sentiment" DECIMAL(3,2),
    "confidence" DECIMAL(3,2),
    "summary" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."factor_scores" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "factor" TEXT NOT NULL,
    "pillar" "public"."FactorPillar" NOT NULL,
    "value" DECIMAL(5,2) NOT NULL,
    "rawValue" DECIMAL(5,2),
    "weight" INTEGER NOT NULL,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "confidence" "public"."Confidence" NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v2',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factor_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_scores" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "overallWithSustainability" INTEGER,
    "grade" TEXT NOT NULL,
    "fit" INTEGER,
    "quality" INTEGER,
    "styleValue" INTEGER,
    "comfort" INTEGER,
    "sustainability" INTEGER,
    "confidence" "public"."Confidence" NOT NULL,
    "confidenceLabel" "public"."ConfidenceLabel" NOT NULL,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "factorsIncluded" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "factorsMissing" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "earlyScore" INTEGER,
    "summary" TEXT,
    "sizeAdvice" TEXT,
    "downside" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "scoreVersion" TEXT NOT NULL DEFAULT 'v2',
    "inputsHash" TEXT,
    "ratedByRunId" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextUpdateDue" TIMESTAMP(3),

    CONSTRAINT "product_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category_baselines" (
    "id" TEXT NOT NULL,
    "category" "public"."ClothingCategory" NOT NULL,
    "subcategory" TEXT NOT NULL DEFAULT '',
    "factor" TEXT NOT NULL,
    "mean" DECIMAL(5,2) NOT NULL,
    "priorStrength" INTEGER NOT NULL DEFAULT 8,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shopper_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "heightCm" INTEGER,
    "weightKg" INTEGER,
    "bodyType" TEXT,
    "preferredFit" TEXT,
    "sizePreferences" JSONB,
    "climate" TEXT,
    "budgetMax" INTEGER,
    "occasions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stylePreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priorities" JSONB,
    "brandAllow" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "brandDeny" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sustainabilityOn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopper_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."search_sessions" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."search_turns" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "idx" INTEGER NOT NULL,
    "role" "public"."TurnRole" NOT NULL,
    "content" TEXT NOT NULL,
    "payload" JSONB,
    "runId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_turns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feedback" (
    "id" TEXT NOT NULL,
    "targetType" "public"."FeedbackTarget" NOT NULL,
    "targetId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reason" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_runs" (
    "id" TEXT NOT NULL,
    "graph" TEXT,
    "agent" TEXT NOT NULL,
    "status" "public"."AgentRunStatus" NOT NULL DEFAULT 'RUNNING',
    "env" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "productId" TEXT,
    "parentRunId" TEXT,
    "inputsHash" TEXT,
    "iterations" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "finishPayload" JSONB,
    "error" TEXT,
    "traceId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_steps" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "idx" INTEGER NOT NULL,
    "kind" "public"."StepKind" NOT NULL,
    "name" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "isError" BOOLEAN NOT NULL DEFAULT false,
    "stopReason" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "cacheReadTokens" INTEGER,
    "costUsd" DECIMAL(10,6),
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."eval_cases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "productId" TEXT,
    "input" JSONB,
    "expected" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eval_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."eval_runs" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "judgeModel" TEXT NOT NULL,
    "summary" JSONB,
    "costUsd" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "eval_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."eval_results" (
    "id" TEXT NOT NULL,
    "evalRunId" TEXT NOT NULL,
    "evalCaseId" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "notes" TEXT,
    "runId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eval_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pilot_applications" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "productCount" TEXT,
    "reviewCount" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pilot_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "public"."users"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "public"."tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_email_key" ON "public"."tenants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "public"."api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_tenantId_idx" ON "public"."api_keys"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "public"."brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "public"."brands"("slug");

-- CreateIndex
CREATE INDEX "brands_tenantId_idx" ON "public"."brands"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "sellers_name_key" ON "public"."sellers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sellers_slug_key" ON "public"."sellers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "clothing_products_slug_key" ON "public"."clothing_products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "clothing_products_sku_key" ON "public"."clothing_products"("sku");

-- CreateIndex
CREATE INDEX "clothing_products_tenantId_idx" ON "public"."clothing_products"("tenantId");

-- CreateIndex
CREATE INDEX "clothing_products_brandId_idx" ON "public"."clothing_products"("brandId");

-- CreateIndex
CREATE INDEX "clothing_products_category_subcategory_idx" ON "public"."clothing_products"("category", "subcategory");

-- CreateIndex
CREATE INDEX "clothing_products_currentPrice_idx" ON "public"."clothing_products"("currentPrice");

-- CreateIndex
CREATE INDEX "clothing_reviews_productId_idx" ON "public"."clothing_reviews"("productId");

-- CreateIndex
CREATE INDEX "clothing_reviews_reviewDate_idx" ON "public"."clothing_reviews"("reviewDate");

-- CreateIndex
CREATE INDEX "return_events_productId_idx" ON "public"."return_events"("productId");

-- CreateIndex
CREATE INDEX "return_events_returnCategory_idx" ON "public"."return_events"("returnCategory");

-- CreateIndex
CREATE INDEX "price_snapshots_productId_observedAt_idx" ON "public"."price_snapshots"("productId", "observedAt");

-- CreateIndex
CREATE INDEX "price_snapshots_sellerId_idx" ON "public"."price_snapshots"("sellerId");

-- CreateIndex
CREATE INDEX "trend_signals_trendName_weekOf_idx" ON "public"."trend_signals"("trendName", "weekOf");

-- CreateIndex
CREATE INDEX "evidence_tags_productId_factor_idx" ON "public"."evidence_tags"("productId", "factor");

-- CreateIndex
CREATE INDEX "evidence_tags_runId_idx" ON "public"."evidence_tags"("runId");

-- CreateIndex
CREATE INDEX "agent_findings_productId_kind_idx" ON "public"."agent_findings"("productId", "kind");

-- CreateIndex
CREATE INDEX "agent_findings_brandId_kind_idx" ON "public"."agent_findings"("brandId", "kind");

-- CreateIndex
CREATE INDEX "factor_scores_factor_idx" ON "public"."factor_scores"("factor");

-- CreateIndex
CREATE UNIQUE INDEX "factor_scores_productId_factor_version_key" ON "public"."factor_scores"("productId", "factor", "version");

-- CreateIndex
CREATE UNIQUE INDEX "product_scores_productId_key" ON "public"."product_scores"("productId");

-- CreateIndex
CREATE INDEX "product_scores_overall_idx" ON "public"."product_scores"("overall");

-- CreateIndex
CREATE INDEX "product_scores_confidenceLabel_idx" ON "public"."product_scores"("confidenceLabel");

-- CreateIndex
CREATE UNIQUE INDEX "category_baselines_category_subcategory_factor_key" ON "public"."category_baselines"("category", "subcategory", "factor");

-- CreateIndex
CREATE UNIQUE INDEX "shopper_profiles_userId_key" ON "public"."shopper_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "shopper_profiles_sessionId_key" ON "public"."shopper_profiles"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "search_turns_sessionId_idx_key" ON "public"."search_turns"("sessionId", "idx");

-- CreateIndex
CREATE INDEX "feedback_targetType_targetId_idx" ON "public"."feedback"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "agent_runs_agent_startedAt_idx" ON "public"."agent_runs"("agent", "startedAt");

-- CreateIndex
CREATE INDEX "agent_runs_productId_idx" ON "public"."agent_runs"("productId");

-- CreateIndex
CREATE INDEX "agent_runs_env_startedAt_idx" ON "public"."agent_runs"("env", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_steps_runId_idx_key" ON "public"."agent_steps"("runId", "idx");

-- CreateIndex
CREATE UNIQUE INDEX "eval_cases_name_key" ON "public"."eval_cases"("name");

-- CreateIndex
CREATE UNIQUE INDEX "eval_results_evalRunId_evalCaseId_key" ON "public"."eval_results"("evalRunId", "evalCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "pilot_applications_email_key" ON "public"."pilot_applications"("email");

-- CreateIndex
CREATE INDEX "pilot_applications_status_idx" ON "public"."pilot_applications"("status");

-- CreateIndex
CREATE INDEX "pilot_applications_createdAt_idx" ON "public"."pilot_applications"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."brands" ADD CONSTRAINT "brands_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clothing_products" ADD CONSTRAINT "clothing_products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clothing_products" ADD CONSTRAINT "clothing_products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clothing_reviews" ADD CONSTRAINT "clothing_reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."clothing_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."return_events" ADD CONSTRAINT "return_events_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."clothing_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."price_snapshots" ADD CONSTRAINT "price_snapshots_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."clothing_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."price_snapshots" ADD CONSTRAINT "price_snapshots_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."sellers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trend_signals" ADD CONSTRAINT "trend_signals_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evidence_tags" ADD CONSTRAINT "evidence_tags_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."clothing_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evidence_tags" ADD CONSTRAINT "evidence_tags_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."clothing_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evidence_tags" ADD CONSTRAINT "evidence_tags_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "public"."return_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evidence_tags" ADD CONSTRAINT "evidence_tags_runId_fkey" FOREIGN KEY ("runId") REFERENCES "public"."agent_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_findings" ADD CONSTRAINT "agent_findings_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."clothing_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_findings" ADD CONSTRAINT "agent_findings_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_findings" ADD CONSTRAINT "agent_findings_runId_fkey" FOREIGN KEY ("runId") REFERENCES "public"."agent_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."factor_scores" ADD CONSTRAINT "factor_scores_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."clothing_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_scores" ADD CONSTRAINT "product_scores_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."clothing_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shopper_profiles" ADD CONSTRAINT "shopper_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."search_sessions" ADD CONSTRAINT "search_sessions_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."shopper_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."search_turns" ADD CONSTRAINT "search_turns_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."search_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_runs" ADD CONSTRAINT "agent_runs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."clothing_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_runs" ADD CONSTRAINT "agent_runs_parentRunId_fkey" FOREIGN KEY ("parentRunId") REFERENCES "public"."agent_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_steps" ADD CONSTRAINT "agent_steps_runId_fkey" FOREIGN KEY ("runId") REFERENCES "public"."agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."eval_results" ADD CONSTRAINT "eval_results_evalRunId_fkey" FOREIGN KEY ("evalRunId") REFERENCES "public"."eval_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."eval_results" ADD CONSTRAINT "eval_results_evalCaseId_fkey" FOREIGN KEY ("evalCaseId") REFERENCES "public"."eval_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

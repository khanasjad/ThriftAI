#!/bin/bash
# Start ThriftAI in STAGING mode
# Uses: thriftai_nextjs_staging (real data fetching & Veritas score generation)

export NODE_ENV=staging
echo "🎭 Starting ThriftAI in STAGING mode"
echo "📊 Database: thriftai_nextjs_staging"
echo "🌐 URL: http://localhost:3002"
echo "🔬 Purpose: Real data fetching & Veritas Score generation"
echo "✅ Auto-calculate Veritas Scores: ENABLED"
echo ""

PORT=3002 npm run dev

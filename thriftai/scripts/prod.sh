#!/bin/bash
# Start ThriftAI in PRODUCTION mode
# Uses: thriftai_nextjs (101,802 products)

export NODE_ENV=production
echo "🚀 Starting ThriftAI in PRODUCTION mode"
echo "📊 Database: thriftai_nextjs (101,802 products)"
echo "🌐 URL: http://localhost:3001"
echo "⚠️  Test pages DISABLED in production"
echo ""

npm run dev

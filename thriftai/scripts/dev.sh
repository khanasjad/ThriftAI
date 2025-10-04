#!/bin/bash
# Start ThriftAI in DEVELOPMENT mode
# Uses: thriftai_nextjs_dev (empty database for testing)

export NODE_ENV=development
echo "🔧 Starting ThriftAI in DEVELOPMENT mode"
echo "📊 Database: thriftai_nextjs_dev (empty)"
echo "🌐 URL: http://localhost:3001"
echo ""

npm run dev

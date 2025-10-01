#!/bin/bash
echo "🛑 Stopping all ThriftAI services..."

# Stop Next.js
if pgrep -f "next dev" > /dev/null; then
  pkill -f "next dev"
  echo "✓ Stopped Next.js"
else
  echo "⚠️  Next.js was not running"
fi

# Stop Prisma Studio
if pgrep -f "prisma studio" > /dev/null; then
  pkill -f "prisma studio"
  echo "✓ Stopped Prisma Studio"
else
  echo "⚠️  Prisma Studio was not running"
fi

# Stop PostgreSQL (optional - uncomment if you want to stop DB too)
# brew services stop postgresql@14
# echo "✓ Stopped PostgreSQL"

# Clean up PID files
rm -f .next-pid .prisma-pid

echo ""
echo "✅ All services stopped"
echo ""
echo "🚀 To start again:"
echo "   ./start-thriftai.sh"

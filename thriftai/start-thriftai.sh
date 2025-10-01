#!/bin/bash
echo "🚀 Starting ThriftAI..."

# Set working directory
cd /Users/asjadkhan/IdeaProjects/ProjectAI/thriftai

# Create logs directory
mkdir -p logs

# Check PostgreSQL
if ! brew services list | grep -q "postgresql@14.*started"; then
  echo "Starting PostgreSQL..."
  brew services start postgresql@14
  sleep 2
fi

# Check if Next.js is already running
if pgrep -f "next dev" > /dev/null; then
  echo "⚠️  Next.js is already running. Stop it first with: ./stop-thriftai.sh"
  exit 1
fi

# Start Next.js dev server
echo "Starting Next.js dev server on port 3000..."
npm run dev > logs/next-dev.log 2>&1 &
echo $! > .next-pid
echo "✓ Next.js started (PID: $(cat .next-pid))"

# Wait for server to start
sleep 3

# Start Prisma Studio (optional)
echo "Starting Prisma Studio on port 5555..."
npx prisma studio > logs/prisma-studio.log 2>&1 &
echo $! > .prisma-pid
echo "✓ Prisma Studio started (PID: $(cat .prisma-pid))"

echo ""
echo "✅ ThriftAI is running!"
echo "   - Main App: http://localhost:3000"
echo "   - Search: http://localhost:3000/buyers/search"
echo "   - Prisma Studio: http://localhost:5555"
echo ""
echo "📊 Monitor logs:"
echo "   tail -f logs/next-dev.log"
echo ""
echo "🛑 Stop all services:"
echo "   ./stop-thriftai.sh"

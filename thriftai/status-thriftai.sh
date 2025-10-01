#!/bin/bash
echo "📊 ThriftAI Status Check"
echo "========================"
echo ""

# Check PostgreSQL
if brew services list | grep -q "postgresql@14.*started"; then
  echo "✅ PostgreSQL: Running"
else
  echo "❌ PostgreSQL: Stopped"
fi

# Check Next.js
if pgrep -f "next dev" > /dev/null; then
  PID=$(pgrep -f "next dev")
  echo "✅ Next.js Dev Server: Running (PID: $PID, Port 3000)"
  echo "   URL: http://localhost:3000"
else
  echo "❌ Next.js Dev Server: Stopped"
fi

# Check Prisma Studio
if pgrep -f "prisma studio" > /dev/null; then
  PID=$(pgrep -f "prisma studio")
  echo "✅ Prisma Studio: Running (PID: $PID, Port 5555)"
  echo "   URL: http://localhost:5555"
else
  echo "❌ Prisma Studio: Stopped"
fi

# Check API Key
if [ -n "$ANTHROPIC_API_KEY" ]; then
  echo "✅ Anthropic API Key: Set (${ANTHROPIC_API_KEY:0:20}...)"
else
  echo "⚠️  Anthropic API Key: Not set in environment"
  if [ -f .env.local ] && grep -q "ANTHROPIC_API_KEY" .env.local; then
    echo "   (Found in .env.local - will be loaded by Next.js)"
  fi
fi

echo ""
echo "📁 Log files:"
if [ -f logs/next-dev.log ]; then
  LINES=$(wc -l < logs/next-dev.log)
  SIZE=$(du -h logs/next-dev.log | cut -f1)
  echo "   - logs/next-dev.log ($LINES lines, $SIZE)"
else
  echo "   - logs/next-dev.log (not found)"
fi

if [ -f logs/prisma-studio.log ]; then
  LINES=$(wc -l < logs/prisma-studio.log)
  SIZE=$(du -h logs/prisma-studio.log | cut -f1)
  echo "   - logs/prisma-studio.log ($LINES lines, $SIZE)"
else
  echo "   - logs/prisma-studio.log (not found)"
fi

echo ""
echo "🔍 Recent activity:"
if [ -f logs/next-dev.log ]; then
  echo "   Last 3 search queries:"
  grep "🔍 Enhanced search request" logs/next-dev.log | tail -n 3 | awk '{print "   - " substr($0, index($0, "query:"))}'
fi

echo ""
echo "⚠️  Recent warnings/errors:"
if [ -f logs/next-dev.log ]; then
  ERRORS=$(grep -E "❌|⚠️" logs/next-dev.log | tail -n 3)
  if [ -n "$ERRORS" ]; then
    echo "$ERRORS" | while read line; do
      echo "   - $line"
    done
  else
    echo "   None found"
  fi
fi

echo ""
echo "💾 Database stats:"
if brew services list | grep -q "postgresql@14.*started"; then
  psql -U postgres -d thriftai -t -c "SELECT COUNT(*) || ' total products' FROM \"Product\";" 2>/dev/null || echo "   Unable to connect to database"
  psql -U postgres -d thriftai -t -c "SELECT COUNT(*) || ' available products' FROM \"Product\" WHERE \"isAvailable\" = true;" 2>/dev/null
fi

echo ""
echo "==================="
if pgrep -f "next dev" > /dev/null; then
  echo "✅ System is ONLINE"
else
  echo "❌ System is OFFLINE"
  echo "   Run: ./start-thriftai.sh"
fi

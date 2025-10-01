# ThriftAI Operations Guide

## Quick Reference

| Service | Port | Status Command | URL |
|---------|------|----------------|-----|
| Next.js Dev Server | 3000 | `ps aux \| grep "next dev"` | http://localhost:3000 |
| Prisma Studio | 5555 | `ps aux \| grep "prisma studio"` | http://localhost:5555 |
| PostgreSQL | 5432 | `brew services list \| grep postgresql` | localhost:5432 |

---

## 🚀 Starting the Application

### 1. Start PostgreSQL Database
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql@14

# Verify it's running
psql -U postgres -c "SELECT version();"
```

**Monitoring:**
- Status: `brew services list`
- Logs: `tail -f /opt/homebrew/var/log/postgresql@14.log`

---

### 2. Start Next.js Development Server

#### Option A: Foreground (with logs)
```bash
cd /Users/asjadkhan/IdeaProjects/ProjectAI/thriftai
npm run dev
```

#### Option B: Background (recommended)
```bash
cd /Users/asjadkhan/IdeaProjects/ProjectAI/thriftai
npm run dev 2>&1 & > logs/next-dev.log
```

#### Option C: Background with nohup (persists after terminal close)
```bash
cd /Users/asjadkhan/IdeaProjects/ProjectAI/thriftai
nohup npm run dev > logs/next-dev.log 2>&1 &
echo $! > .next-pid  # Save process ID
```

**Monitoring:**
```bash
# Check if running
ps aux | grep "next dev" | grep -v grep

# View logs (live)
tail -f logs/next-dev.log

# View logs (last 100 lines)
tail -n 100 logs/next-dev.log

# Check specific error logs
grep -i "error" logs/next-dev.log | tail -n 20
```

**URLs:**
- Main App: http://localhost:3000
- Search Page: http://localhost:3000/buyers/search
- API Health: http://localhost:3000/api/buyers/enhanced-search (POST)

---

### 3. Start Prisma Studio (Database UI)

#### Option A: Foreground
```bash
cd /Users/asjadkhan/IdeaProjects/ProjectAI/thriftai
npx prisma studio
```

#### Option B: Background
```bash
cd /Users/asjadkhan/IdeaProjects/ProjectAI/thriftai
npx prisma studio > logs/prisma-studio.log 2>&1 &
echo $! > .prisma-pid
```

**Monitoring:**
```bash
# Check if running
ps aux | grep "prisma studio" | grep -v grep

# View logs
tail -f logs/prisma-studio.log
```

**URL:**
- Prisma Studio UI: http://localhost:5555

---

### 4. Environment Variables

#### Check if API keys are set
```bash
# Check Anthropic API key
echo $ANTHROPIC_API_KEY | cut -c1-20

# Check if it's set in .env.local
grep ANTHROPIC_API_KEY .env.local

# Set temporarily (this session only)
export ANTHROPIC_API_KEY="sk-ant-api03-..."

# Set permanently (add to ~/.zshrc or ~/.bashrc)
echo 'export ANTHROPIC_API_KEY="sk-ant-api03-..."' >> ~/.zshrc
source ~/.zshrc
```

#### Required Environment Variables
```bash
# .env.local file location
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/.env.local

# Required variables:
ANTHROPIC_API_KEY="sk-ant-api03-..."
DATABASE_URL="postgresql://postgres:password@localhost:5432/thriftai"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 🛑 Stopping the Application

### Stop Next.js Dev Server

#### If running in foreground
```bash
# Press Ctrl+C in the terminal
```

#### If running in background
```bash
# Find and kill process
ps aux | grep "next dev" | grep -v grep | awk '{print $2}' | xargs kill

# Or if you saved PID
kill $(cat .next-pid)

# Force kill if needed
pkill -9 -f "next dev"
```

---

### Stop Prisma Studio
```bash
# Find and kill
ps aux | grep "prisma studio" | grep -v grep | awk '{print $2}' | xargs kill

# Or if you saved PID
kill $(cat .prisma-pid)

# Force kill
pkill -9 -f "prisma studio"
```

---

### Stop PostgreSQL
```bash
# Stop service
brew services stop postgresql@14

# Verify stopped
brew services list | grep postgresql
```

---

### Stop ALL ThriftAI processes at once
```bash
# Create a stop script
cat > stop-thriftai.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping all ThriftAI services..."

# Stop Next.js
pkill -f "next dev"
echo "✓ Stopped Next.js"

# Stop Prisma Studio
pkill -f "prisma studio"
echo "✓ Stopped Prisma Studio"

# Stop PostgreSQL (optional - comment out if you want to keep DB running)
# brew services stop postgresql@14
# echo "✓ Stopped PostgreSQL"

echo "✅ All services stopped"
EOF

chmod +x stop-thriftai.sh
./stop-thriftai.sh
```

---

## 📊 Monitoring & Logs

### Application Logs Location
```bash
# Project root
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/

# Create logs directory if not exists
mkdir -p logs

# Log files
logs/next-dev.log          # Next.js development server
logs/prisma-studio.log     # Prisma Studio
logs/app.log              # Application-level logs (if configured)
```

---

### Real-time Log Monitoring

#### Monitor Next.js logs
```bash
# All logs
tail -f logs/next-dev.log

# Only errors
tail -f logs/next-dev.log | grep -i "error"

# Only Claude AI calls
tail -f logs/next-dev.log | grep "🤖"

# Only search queries
tail -f logs/next-dev.log | grep "🔍"

# Only database queries
tail -f logs/next-dev.log | grep "🔒"
```

#### Monitor multiple logs simultaneously
```bash
# Using multitail (install: brew install multitail)
multitail logs/next-dev.log logs/prisma-studio.log

# Or use tmux/screen with split panes
tmux new-session \; \
  split-window -h \; \
  send-keys 'tail -f logs/next-dev.log' C-m \; \
  split-window -v \; \
  send-keys 'tail -f logs/prisma-studio.log' C-m
```

---

### Log Emoji Guide

ThriftAI uses emoji prefixes for easy log filtering:

| Emoji | Meaning | Filter Command |
|-------|---------|----------------|
| 🔍 | Search request | `grep "🔍" logs/next-dev.log` |
| 🤖 | Claude AI call | `grep "🤖" logs/next-dev.log` |
| 🔒 | Database query | `grep "🔒" logs/next-dev.log` |
| ✅ | Success | `grep "✅" logs/next-dev.log` |
| ❌ | Error | `grep "❌" logs/next-dev.log` |
| ⚠️ | Warning | `grep "⚠️" logs/next-dev.log` |
| 📊 | Data/Stats | `grep "📊" logs/next-dev.log` |
| 💡 | Info/Insight | `grep "💡" logs/next-dev.log` |
| 📝 | Query generation | `grep "📝" logs/next-dev.log` |

**Example usage:**
```bash
# See all search requests today
grep "🔍" logs/next-dev.log | tail -n 50

# See all errors in last hour
grep "❌" logs/next-dev.log | tail -n 100

# See all Claude AI interactions
grep "🤖" logs/next-dev.log | grep -A 5 "Calling Claude"

# Count search requests
grep -c "🔍 Enhanced search request" logs/next-dev.log
```

---

### Process Monitoring Commands

#### Check what's running
```bash
# All Node processes
ps aux | grep node

# ThriftAI-specific processes
ps aux | grep -E "next dev|prisma studio" | grep -v grep

# With detailed info
lsof -i :3000  # Next.js
lsof -i :5555  # Prisma Studio
lsof -i :5432  # PostgreSQL
```

#### System resource usage
```bash
# CPU and memory usage of Node processes
top -pid $(pgrep -f "next dev")

# Or use htop (brew install htop)
htop -p $(pgrep -f "next dev")
```

---

## 📁 Important File Locations

### Configuration Files
```bash
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/package.json          # Dependencies
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/.env.local            # Environment variables
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/next.config.js       # Next.js config
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/tsconfig.json        # TypeScript config
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/prisma/schema.prisma # Database schema
```

### Source Code
```bash
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/src/app/             # Next.js pages & API routes
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/src/lib/             # Shared libraries
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/src/lib/services/    # Core services (AI, DB)
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/src/components/      # React components
```

### Key Service Files
```bash
# AI Query Understanding
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/src/lib/services/structuredQueryGenerator.ts

# Safe Database Queries
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/src/lib/services/safeQueryExecutor.ts

# Search API Endpoint
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/src/app/api/buyers/enhanced-search/route.ts

# Database Client
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/src/lib/prisma.ts

# Logger
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/src/lib/logger.ts
```

### Database
```bash
# Database file location (PostgreSQL data directory)
/opt/homebrew/var/postgresql@14/

# Database connection
postgresql://postgres:password@localhost:5432/thriftai

# Prisma migrations
/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/prisma/migrations/
```

---

## 🔧 Useful Scripts

### Create a startup script
```bash
# Create start-thriftai.sh
cat > start-thriftai.sh << 'EOF'
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
echo "   - Prisma Studio: http://localhost:5555"
echo ""
echo "📊 Monitor logs:"
echo "   tail -f logs/next-dev.log"
echo ""
echo "🛑 Stop all services:"
echo "   ./stop-thriftai.sh"
EOF

chmod +x start-thriftai.sh
```

### Create a status check script
```bash
cat > status-thriftai.sh << 'EOF'
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
  echo "✅ Next.js Dev Server: Running (Port 3000)"
  echo "   URL: http://localhost:3000"
else
  echo "❌ Next.js Dev Server: Stopped"
fi

# Check Prisma Studio
if pgrep -f "prisma studio" > /dev/null; then
  echo "✅ Prisma Studio: Running (Port 5555)"
  echo "   URL: http://localhost:5555"
else
  echo "❌ Prisma Studio: Stopped"
fi

# Check API Key
if [ -n "$ANTHROPIC_API_KEY" ]; then
  echo "✅ Anthropic API Key: Set (${ANTHROPIC_API_KEY:0:20}...)"
else
  echo "⚠️  Anthropic API Key: Not set in environment"
fi

echo ""
echo "📁 Log files:"
if [ -f logs/next-dev.log ]; then
  echo "   - logs/next-dev.log ($(wc -l < logs/next-dev.log) lines)"
fi
if [ -f logs/prisma-studio.log ]; then
  echo "   - logs/prisma-studio.log ($(wc -l < logs/prisma-studio.log) lines)"
fi

echo ""
echo "🔍 Recent errors:"
if [ -f logs/next-dev.log ]; then
  grep -i "error" logs/next-dev.log | tail -n 3
fi
EOF

chmod +x status-thriftai.sh
```

---

## 🧪 Testing & Debugging

### Test Search API
```bash
# Test with curl
curl -X POST http://localhost:3000/api/buyers/enhanced-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "vintage designer bags",
    "pagination": { "page": 1, "limit": 20 },
    "sorting": { "field": "relevance", "direction": "desc" }
  }' | jq '.'

# Test tech search
curl -X POST http://localhost:3000/api/buyers/enhanced-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Best tech deals under $100"
  }' | jq '.products | length'
```

### Database Queries
```bash
# Connect to database
psql -U postgres -d thriftai

# Common queries
SELECT category, COUNT(*) FROM "Product" GROUP BY category;
SELECT COUNT(*) FROM "Product" WHERE "isAvailable" = true;
SELECT category, COUNT(*) FROM "Product" WHERE price <= 100 GROUP BY category;

# Exit psql
\q
```

### Check Claude AI Integration
```bash
# Test if Claude API is working
cd /Users/asjadkhan/IdeaProjects/ProjectAI/thriftai
npx tsx scripts/debug-tech-search.ts
```

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill process using port 3000
kill -9 $(lsof -t -i :3000)

# Or kill all Node processes
pkill -9 node
```

### Database Connection Issues
```bash
# Restart PostgreSQL
brew services restart postgresql@14

# Check if database exists
psql -U postgres -l | grep thriftai

# Recreate database if needed
psql -U postgres -c "DROP DATABASE IF EXISTS thriftai;"
psql -U postgres -c "CREATE DATABASE thriftai;"
npx prisma migrate deploy
```

### Clear Next.js Cache
```bash
cd /Users/asjadkhan/IdeaProjects/ProjectAI/thriftai
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```

### API Key Not Working
```bash
# Verify API key is set
echo $ANTHROPIC_API_KEY

# Test API key directly
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-haiku-20240307",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hi"}]
  }'
```

---

## 📈 Performance Monitoring

### Monitor Database Queries
```bash
# Enable query logging in PostgreSQL
psql -U postgres -d thriftai -c "ALTER SYSTEM SET log_statement = 'all';"
psql -U postgres -d thriftai -c "SELECT pg_reload_conf();"

# View query logs
tail -f /opt/homebrew/var/log/postgresql@14.log | grep "SELECT"
```

### Monitor API Response Times
```bash
# Watch for slow queries
tail -f logs/next-dev.log | grep -E "POST /api|GET /api" | grep -v "in [0-9]{1,2}ms"
```

### Monitor Memory Usage
```bash
# Watch Node.js memory usage
watch -n 1 'ps aux | grep "next dev" | grep -v grep | awk "{print \$6/1024 \" MB\"}"'
```

---

## 🔐 Security Notes

### Environment Variables
```bash
# NEVER commit .env.local to git
echo ".env.local" >> .gitignore

# Verify secrets are not in git
git ls-files | grep -E "\.env|secret|key"
```

### API Key Rotation
```bash
# When rotating API keys:
1. Update ANTHROPIC_API_KEY in .env.local
2. Restart Next.js dev server
3. Test with: ./status-thriftai.sh
```

---

## 📚 Additional Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Anthropic API Docs**: https://docs.anthropic.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs

---

## Quick Commands Cheat Sheet

```bash
# Start everything
./start-thriftai.sh

# Check status
./status-thriftai.sh

# Stop everything
./stop-thriftai.sh

# View live logs
tail -f logs/next-dev.log

# View errors only
grep "❌" logs/next-dev.log | tail -n 20

# Test search
curl -X POST http://localhost:3000/api/buyers/enhanced-search \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}' | jq '.'

# Restart Next.js
pkill -f "next dev" && npm run dev > logs/next-dev.log 2>&1 &

# Database console
psql -U postgres -d thriftai
```

---

**Last Updated**: October 1, 2025
**Project**: ThriftAI - AI-Powered E-Commerce Search
**Location**: /Users/asjadkhan/IdeaProjects/ProjectAI/thriftai

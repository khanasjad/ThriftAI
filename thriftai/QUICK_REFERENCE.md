# ThriftAI Quick Reference Card

## 🚀 Essential Commands

```bash
# Start everything
./start-thriftai.sh

# Check status
./status-thriftai.sh

# Monitor logs
./monitor-thriftai.sh

# Stop everything
./stop-thriftai.sh
```

## 📍 Key URLs

| Service | URL |
|---------|-----|
| Main App | http://localhost:3000 |
| Search Page | http://localhost:3000/buyers/search |
| Prisma Studio | http://localhost:5555 |

## 📊 Log Monitoring

```bash
# All logs
tail -f logs/next-dev.log

# Errors only
tail -f logs/next-dev.log | grep "❌"

# Search queries
tail -f logs/next-dev.log | grep "🔍"

# Claude AI calls
tail -f logs/next-dev.log | grep "🤖"
```

## 🔍 Log Emoji Guide

| Emoji | Meaning | Command |
|-------|---------|---------|
| 🔍 | Search request | `grep "🔍" logs/next-dev.log` |
| 🤖 | Claude AI call | `grep "🤖" logs/next-dev.log` |
| 🔒 | Database query | `grep "🔒" logs/next-dev.log` |
| ✅ | Success | `grep "✅" logs/next-dev.log` |
| ❌ | Error | `grep "❌" logs/next-dev.log` |
| ⚠️ | Warning | `grep "⚠️" logs/next-dev.log` |

## 💾 Database Commands

```bash
# Connect to DB
psql -U postgres -d thriftai

# Quick queries
SELECT COUNT(*) FROM "Product";
SELECT category, COUNT(*) FROM "Product" GROUP BY category;
\q  # exit
```

## 🔧 Troubleshooting

```bash
# Port 3000 in use
lsof -i :3000
kill -9 $(lsof -t -i :3000)

# Restart Next.js
./stop-thriftai.sh && ./start-thriftai.sh

# Clear cache
rm -rf .next && npm run dev

# Check processes
ps aux | grep -E "next|prisma"
```

## 🧪 Test Search API

```bash
# Test search
curl -X POST http://localhost:3000/api/buyers/enhanced-search \
  -H "Content-Type: application/json" \
  -d '{"query": "vintage designer bags"}' | jq '.'

# Quick test
curl -X POST http://localhost:3000/api/buyers/enhanced-search \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}' | jq '.products | length'
```

## 📁 Important Files

```bash
# Configuration
.env.local                          # Environment variables
next.config.js                      # Next.js config
prisma/schema.prisma                # Database schema

# Core Services
src/lib/services/structuredQueryGenerator.ts   # AI query understanding
src/lib/services/safeQueryExecutor.ts          # Database queries
src/app/api/buyers/enhanced-search/route.ts    # Search API

# Logs
logs/next-dev.log                   # Next.js logs
logs/prisma-studio.log              # Prisma Studio logs
```

## 🔐 Environment Variables

```bash
# Check API key
echo $ANTHROPIC_API_KEY | cut -c1-20

# Set API key (this session)
export ANTHROPIC_API_KEY="sk-ant-api03-..."

# Add to .env.local
echo 'ANTHROPIC_API_KEY="sk-ant-api03-..."' >> .env.local
```

## 📚 Full Documentation

See `OPERATIONS_GUIDE.md` for complete documentation.

---

**Location**: `/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai`
**Last Updated**: October 1, 2025

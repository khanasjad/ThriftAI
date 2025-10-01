#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "📊 ThriftAI Log Monitor"
echo "======================="
echo ""
echo "Choose monitoring mode:"
echo "  1) All logs (full output)"
echo "  2) Errors only (❌)"
echo "  3) Search queries only (🔍)"
echo "  4) Claude AI calls only (🤖)"
echo "  5) Database queries only (🔒)"
echo "  6) Warnings only (⚠️)"
echo "  7) Success messages only (✅)"
echo ""
read -p "Enter choice [1-7]: " choice

LOG_FILE="logs/next-dev.log"

if [ ! -f "$LOG_FILE" ]; then
  echo ""
  echo "❌ Log file not found: $LOG_FILE"
  echo "Make sure Next.js is running with logs enabled:"
  echo "   npm run dev > logs/next-dev.log 2>&1 &"
  exit 1
fi

echo ""
echo "Monitoring: $LOG_FILE"
echo "Press Ctrl+C to stop"
echo "======================="
echo ""

case $choice in
  1)
    tail -f "$LOG_FILE"
    ;;
  2)
    echo "Showing errors only..."
    tail -f "$LOG_FILE" | grep --line-buffered "❌"
    ;;
  3)
    echo "Showing search queries only..."
    tail -f "$LOG_FILE" | grep --line-buffered "🔍"
    ;;
  4)
    echo "Showing Claude AI calls only..."
    tail -f "$LOG_FILE" | grep --line-buffered "🤖"
    ;;
  5)
    echo "Showing database queries only..."
    tail -f "$LOG_FILE" | grep --line-buffered "🔒"
    ;;
  6)
    echo "Showing warnings only..."
    tail -f "$LOG_FILE" | grep --line-buffered "⚠️"
    ;;
  7)
    echo "Showing success messages only..."
    tail -f "$LOG_FILE" | grep --line-buffered "✅"
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

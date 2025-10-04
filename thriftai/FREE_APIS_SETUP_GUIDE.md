# FREE APIs Setup Guide
## Get Your API Keys in 10 Minutes

**Total Cost: $0/month**

---

## Quick Setup (3 Required, 5 Minutes Each)

### 1. eBay Finding API (FREE - 5,000 calls/day)

**Why:** Seller trust data (15 parameters) + Market pricing

**Steps:**
1. Go to https://developer.ebay.com/
2. Click **"Register"** (top right)
3. Create account with email
4. Click **"Create an Application"**
5. Fill in:
   - App Name: `ThriftAI Veritas Score`
   - Description: `Product quality assessment`
6. Click **"Create"**
7. Copy your **App ID** (looks like: `YourName-ThriftAI-PRD-xxxxx`)
8. Add to `.env.local`:
   ```
   EBAY_APP_ID=YourName-ThriftAI-PRD-xxxxx
   ```

**Time:** 5 minutes
**Cost:** FREE (forever)
**Rate Limit:** 5,000 calls/day

---

### 2. Alpha Vantage Stock API (FREE - 500 calls/day)

**Why:** Company performance data (stock prices)

**Steps:**
1. Go to https://www.alphavantage.co/support/#api-key
2. Enter your email
3. Click **"GET FREE API KEY"**
4. Check your email
5. Copy your API key (looks like: `ABCD1234EFGH5678`)
6. Add to `.env.local`:
   ```
   ALPHA_VANTAGE_API_KEY=ABCD1234EFGH5678
   ```

**Time:** 2 minutes
**Cost:** FREE (forever)
**Rate Limit:** 5 calls/minute, 500 calls/day

---

## No Registration Needed (Already Working)

### 3. Apple Warranty API
✅ **No API key required**
- Official Apple API
- Public access
- Unlimited use

### 4. Dell Warranty API
✅ **No API key required**
- Official Dell API
- Public access
- Unlimited use

### 5. GSMArena (Phone Specs)
✅ **No API key required**
- Public data scraping
- Respectful rate limiting (3 sec between requests)
- Legal educational use

### 6. iFixit API
✅ **No API key required**
- Open source API
- Public repair data
- Unlimited use

### 7. Energy Star API
✅ **No API key required**
- Official US Government API
- Public environmental data
- Unlimited use

---

## Full .env.local Setup

Copy this to your `.env.local` file:

```bash
# Copy from .env.example first:
# cp .env.example .env.local

# Then add your keys:

# eBay API (get from step 1 above)
EBAY_APP_ID=YourName-ThriftAI-PRD-xxxxx

# Alpha Vantage API (get from step 2 above)
ALPHA_VANTAGE_API_KEY=ABCD1234EFGH5678

# No other keys needed for FREE data sources!
```

---

## Testing Your Setup

Run the test script:

```bash
npx tsx scripts/test-free-data-sources.ts
```

**Expected Output:**
```
✅ Apple Warranty API: SUCCESS
✅ Dell Warranty API: SUCCESS
✅ GSMArena API: SUCCESS
✅ iFixit API: SUCCESS
✅ eBay API: SUCCESS (if EBAY_APP_ID is set)
✅ Alpha Vantage API: SUCCESS (if ALPHA_VANTAGE_API_KEY is set)
```

---

## What You Get (FREE)

| Data Source | Parameters | What It Provides |
|-------------|-----------|------------------|
| **Apple Warranty** | 5 | Serial validation, warranty status, manufacturing date |
| **Dell Warranty** | 5 | Service tag validation, warranty, ship date |
| **GSMArena** | 10 | Complete phone specs (processor, RAM, camera, battery) |
| **iFixit** | 4 | Repairability score, difficulty, parts availability |
| **eBay** | 15 | Seller ratings, feedback, transaction history, prices |
| **Energy Star** | 2 | Environmental certification, energy efficiency |
| **Alpha Vantage** | 1 | Stock price, company performance |
| **TOTAL** | **42** | **35% of Veritas Score system** |

---

## Troubleshooting

### eBay API not working?
- **Error:** "EBAY_APP_ID not set"
- **Fix:** Make sure you added `EBAY_APP_ID=your_key` to `.env.local`
- **Restart:** Restart your dev server after adding env variables

### Alpha Vantage rate limit?
- **Error:** "Rate limit exceeded"
- **Fix:** Wait 12 seconds between requests (built-in rate limiter handles this)
- **Daily Limit:** 500 calls/day (plenty for development)

### GSMArena timing out?
- **Reason:** Respectful rate limiting (3 seconds between requests)
- **Fix:** This is normal, wait for results
- **Speed:** Can be improved with caching (already implemented)

---

## Cost Breakdown

| Service | Setup Time | Monthly Cost | Calls/Day | Worth It? |
|---------|-----------|--------------|-----------|-----------|
| eBay | 5 min | **$0** | 5,000 | ✅ Yes |
| Alpha Vantage | 2 min | **$0** | 500 | ✅ Yes |
| Apple | 0 min | **$0** | Unlimited | ✅ Yes |
| Dell | 0 min | **$0** | Unlimited | ✅ Yes |
| GSMArena | 0 min | **$0** | ~1,000 | ✅ Yes |
| iFixit | 0 min | **$0** | Unlimited | ✅ Yes |
| Energy Star | 0 min | **$0** | Unlimited | ✅ Yes |
| **TOTAL** | **7 min** | **$0** | **High** | **✅ Perfect** |

---

## Next Steps

1. ✅ Copy `.env.example` to `.env.local`
2. ✅ Register for eBay API (5 minutes)
3. ✅ Register for Alpha Vantage API (2 minutes)
4. ✅ Add API keys to `.env.local`
5. ✅ Run test script to verify
6. ✅ Start using Veritas Score with real data!

---

## Support

**Having issues?**
- Check `.env.local` file exists
- Verify API keys are correct (no extra spaces)
- Restart dev server after adding env variables
- Check console for specific error messages

**All working?**
You now have access to 42 parameters of FREE data for Veritas Score™ at zero cost! 🎉

---

**Last Updated:** October 2025
**Setup Time:** 7 minutes
**Monthly Cost:** $0
**API Coverage:** 35% of Veritas Score system

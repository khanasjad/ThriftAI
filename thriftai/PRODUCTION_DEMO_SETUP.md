# Production Demo Setup Guide

## 🎯 Objective

Replace all 1,000 products with **REAL eBay products** that have:
- ✅ Real product images matching the items
- ✅ Real market pricing
- ✅ Real descriptions and specifications
- ✅ Zero cost (FREE eBay API)

---

## Step 1: Get FREE eBay API Key (5 minutes)

### 1.1 Create eBay Developer Account

1. Go to: **https://developer.ebay.com/**
2. Click "**Register**" (top right)
3. Sign up with email or existing eBay account
4. **Cost: $0 (completely free)**

### 1.2 Create Application

1. Once logged in, click "**Get Your Application Keys**"
2. Click "**Create an Application Key Set**"
3. Choose "**Production**" (not Sandbox)
4. Fill in application details:
   - **Application Title**: "ThriftAI Product Catalog"
   - **Description**: "Marketplace aggregator for secondhand products"
   - **Website URL**: "https://thriftai.com" (or your domain)
5. Click "**Continue**"

### 1.3 Get Your App ID

1. You'll see your keys page with:
   - **App ID (Client ID)** ← This is what you need
   - Client Secret (not needed for Finding API)
   - Dev ID (not needed for Finding API)

2. Copy the **App ID** (looks like: `YourName-ThriftAI-PRD-12345abcd-e6789012`)

### 1.4 Configure in .env.local

1. Open `/Users/asjadkhan/IdeaProjects/ProjectAI/thriftai/.env.local`
2. Find the line:
   ```bash
   EBAY_APP_ID="demo-key"
   ```
3. Replace with your real App ID:
   ```bash
   EBAY_APP_ID="YourName-ThriftAI-PRD-12345abcd-e6789012"
   ```
4. Save the file

**That's it! The eBay Finding API is FREE with no rate limits for basic usage.**

---

## Step 2: Run the Production Seeder (10 minutes)

### 2.1 Navigate to Project Directory

```bash
cd /Users/asjadkhan/IdeaProjects/ProjectAI/thriftai
```

### 2.2 Run the Seeder Script

```bash
npx tsx scripts/seed-production-demo-products.ts
```

**What This Does:**
1. Deletes all existing products (backed up if needed)
2. Fetches 1,000 REAL products from eBay:
   - 125 Electronics (iPhones, MacBooks, Cameras, etc.)
   - 125 Clothing (Nike, Adidas, North Face, etc.)
   - 125 Shoes (Jordans, Yeezys, New Balance, etc.)
   - 125 Accessories (Watches, Sunglasses, Bags, etc.)
   - 125 Home (Dyson, iRobot, Philips, etc.)
   - 125 Beauty (Dyson Airwrap, GHD, Foreo, etc.)
   - 125 Sports (Bowflex, Peloton, Yoga mats, etc.)
   - 125 Toys (LEGO, PlayStation, Nintendo, etc.)
3. Stores products with real images and pricing

**Expected Output:**
```
🚀 Production Demo Seeder Starting...
✅ eBay API configured: YourName-T...
🗑️  Deleting existing products...
   Deleted 1000 products

📦 Fetching 125 products for ELECTRONICS...
  🔍 Searching: "iPhone" (0/125)
    ✅ Added: Apple iPhone 15 Pro Max 256GB Natural Titanium...
    ✅ Added: Apple iPhone 14 128GB Midnight Black...
  🔍 Searching: "MacBook laptop" (25/125)
    ✅ Added: Apple MacBook Pro 14" M3 Space Black...
✅ ELECTRONICS: Collected 125 products

... (continues for all 8 categories) ...

✅ Database seeding complete!
📊 Final product count: 1000

📈 Category Breakdown:
   ELECTRONICS: 125 products
   CLOTHING: 125 products
   SHOES: 125 products
   ACCESSORIES: 125 products
   HOME: 125 products
   BEAUTY: 125 products
   SPORTS: 125 products
   TOYS: 125 products

🎉 SUCCESS! All products are now REAL eBay products with matching images.
```

**Time Estimate:** 8-12 minutes (depends on eBay API response times)

---

## Step 3: Enrich All Products with Veritas Scores (5 minutes)

Now that you have real products, calculate Veritas scores for all of them.

### 3.1 Run Batch Enrichment (10 batches of 100 products)

**Option A: Manual (run each command separately)**

```bash
# Batch 1
curl -X POST "http://localhost:3000/api/admin/batch-enrich?limit=100&forceRefresh=true"

# Batch 2
curl -X POST "http://localhost:3000/api/admin/batch-enrich?limit=100&forceRefresh=true"

# ... repeat 10 times total
```

**Option B: Automated (recommended)**

```bash
for i in {1..10}; do
  echo "🔄 Enriching batch $i/10..."
  curl -X POST "http://localhost:3000/api/admin/batch-enrich?limit=100&forceRefresh=true"
  echo "\n✅ Batch $i complete\n"
  sleep 2
done

echo "🎉 All 1,000 products enriched!"
```

**Expected Output (per batch):**
```json
{
  "success": true,
  "message": "Enriched 100 products successfully",
  "stats": {
    "total": 100,
    "successful": 100,
    "failed": 0,
    "averageScoreChange": 12.5,
    "processingTimeMs": 45000,
    "dataSourcesUsed": {
      "Database": 100,
      "eBayAPI": 100
    }
  }
}
```

**Time Estimate:** 5-8 minutes for all 10 batches

---

## Step 4: Quality Assurance (10 minutes)

### 4.1 Visual Inspection

1. Open your app: **http://localhost:3000**
2. Check **10 random products** from different categories
3. Verify:
   - ✅ **Images match product names** (e.g., iPhone shows iPhone photos)
   - ✅ **Multiple images per product** (usually 3-5 images)
   - ✅ **Pricing is realistic** (no $0.00 or crazy prices)
   - ✅ **Descriptions are real** (not Lorem ipsum)
   - ✅ **Brands are correct** (extracted from eBay titles)

### 4.2 Veritas Score Check

1. Click on any product
2. Check that:
   - ✅ **Veritas score is displayed** (typically 50-70 range)
   - ✅ **SSN format is correct**: `VS-ELECTRONICS-65-HIGH-20251021`
   - ✅ **Score breakdown shows all 8 categories**:
     - Product Quality (25%)
     - Seller Trust (20%)
     - Market Value (20%)
     - Sustainability (12%)
     - Security & Safety (5%)
     - User Experience (5%)
     - Product Specification (13%)
     - Company Performance (5%)
   - ✅ **Confidence level is shown** (e.g., "HIGH", "MEDIUM")

### 4.3 Features Check

Test that all features still work:

1. **Search**: Search for "iPhone" → Should show iPhones
2. **Filters**: Filter by category → Should filter correctly
3. **Swipe**: http://localhost:3000/swipe → Should show products
4. **Product Detail**: Click any product → Should load details
5. **Leaderboard**: http://localhost:3000/leaderboard → Should show top products
6. **Cart**: Add to cart → Should work

---

## Step 5: Demo Preparation Checklist

Before showing to client:

- [ ] All 1,000 products seeded
- [ ] All products have Veritas scores
- [ ] Images match product names (spot-checked 10 products)
- [ ] Pricing is realistic
- [ ] Search works
- [ ] Filters work
- [ ] Swipe works
- [ ] Product pages load
- [ ] Leaderboard loads
- [ ] Cart functionality works
- [ ] No console errors
- [ ] Mobile version tested (if demoing on mobile)

---

## 🔥 What Makes This Demo-Ready

### Before (Current State):
- ❌ Generic Unsplash stock images
- ❌ Images don't match products
- ❌ Client will immediately see it's fake

### After (Production-Ready):
- ✅ Real eBay product images
- ✅ Images perfectly match product names
- ✅ Current market pricing
- ✅ Accurate product descriptions
- ✅ Real brand names
- ✅ Client can verify products are real by searching eBay
- ✅ Professional, credible presentation

---

## 🆘 Troubleshooting

### Issue 1: "EBAY_APP_ID not configured" error

**Solution:**
- Check `.env.local` has real App ID (not "demo-key")
- Restart dev server: `npm run dev`

### Issue 2: Seeder finds fewer than 125 products per category

**Reason:** Some eBay search queries might return few results

**Solution:** This is normal. The seeder will try multiple queries per category. You might get 100-120 instead of exactly 125, which is fine.

### Issue 3: Some products have placeholder images

**Reason:** Rare eBay listings without images

**Solution:** Re-run seeder for that specific category or accept the few without images (typically <5%)

### Issue 4: Enrichment is slow

**Reason:** Processing 1,000 products takes time

**Solution:** This is normal. Each batch of 100 takes ~30-60 seconds. Total time: 5-10 minutes.

---

## 💡 Pro Tips

1. **Run seeder during off-peak hours** (evenings) for faster eBay API responses
2. **Backup database before seeding** if you want to keep old data
3. **Test on a few products first** before client demo
4. **Show client the "View on eBay" link** to prove products are real
5. **Highlight the Veritas scoring** as your unique value proposition

---

## 📊 Expected Results

| Metric | Before | After |
|--------|---------|-------|
| Products | 1,000 | 1,000 |
| Real Images | 0% | 100% |
| Image-Product Match | 0% | 100% |
| Realistic Pricing | 50% | 100% |
| Veritas Scores | ✅ | ✅ |
| Demo-Ready | ❌ | ✅ |
| Cost | $0 | $0 |

---

## 🎉 Success!

Once completed, you have:
- ✅ 1,000 real products with matching images
- ✅ Professional, credible product catalog
- ✅ Working Veritas scoring system
- ✅ Production-ready demo
- ✅ Zero costs

**You're ready to impress your client!** 🚀

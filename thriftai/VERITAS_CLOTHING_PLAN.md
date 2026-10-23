# 👕 Veritas AI for Clothing Brands - Focused Execution Plan

**Date**: October 22, 2026
**Decision**: Focus on clothing vertical only
**Competitor**: Constructor.io (but differentiated by quality scoring)
**Status**: LOCKED IN - No more pivots

---

## 🎯 THE FOCUSED VISION

**What we build:**
"Veritas AI - AI-Powered Search for Clothing Brands that Ranks by Quality & Fit, Not Just Popularity"

**One-line pitch:**
"Constructor.io helps shoppers find products. Veritas helps shoppers find products that actually fit and last."

**Target customer:**
Direct-to-consumer (DTC) clothing brands on Shopify/WooCommerce with:
- $1M-$50M annual revenue
- 1,000-50,000 SKUs
- 15-30% return rates (industry average for apparel)
- Struggling with fit and quality issues

**Examples:** Everlane, Reformation, Allbirds, Bombas, Outdoor Voices

---

## 🆚 CONSTRUCTOR.IO VS. VERITAS AI

### What Constructor Does (We DON'T Compete Here)
- ✅ Behavioral personalization (what users click/buy)
- ✅ Cross-channel merchandising
- ✅ Retail media (ads in search results)
- ✅ Enterprise features (SSO, advanced analytics)
- ❌ Pricing: $5,000-$50,000/month (enterprise only)

### What Veritas Does (Our Differentiation)
- ✅ **Quality-first ranking** (not just what's popular)
- ✅ **Clothing-specific fit intelligence** (size consistency, material quality)
- ✅ **Return prediction** (which items will be returned for fit/quality issues)
- ✅ **AI shopping agent** for natural conversation about fit/style
- ✅ **Affordable for mid-market** ($299-$2,000/month)

### Why Brands Would Use Both
- **Constructor**: Optimizes for conversion (what sells)
- **Veritas**: Optimizes for satisfaction (what keeps & fits)
- **Together**: Higher conversion AND lower returns = more profit

**We're not replacing Constructor. We're complementing them.**

---

## 📊 CLOTHING-SPECIFIC VERITAS SCORE (15 Parameters, Not 96)

### The Problem with 96 Parameters
- ❌ Sounds gimmicky
- ❌ Hard to explain
- ❌ Many parameters irrelevant for clothing
- ❌ Includes redundancy (per SCORING_REFACTOR_PLAN.md)

### The NEW Clothing Veritas Score (15 Parameters)

**Category 1: FIT & SIZING (35%)**
1. **Size Consistency** - Does it run true to size? (Reviews mentioning "runs small/large")
2. **Fit Accuracy** - How well does it match body types? (Fit-related returns)
3. **Size Range** - Inclusive sizing options (XS-3XL+)

**Category 2: QUALITY & DURABILITY (30%)**
4. **Material Quality** - Fabric grade, blend composition
5. **Construction Quality** - Stitching, seams, hardware
6. **Durability** - How long does it last? (Longevity reviews, warranty)
7. **Pilling/Wear Resistance** - Does fabric hold up?

**Category 3: COMFORT (15%)**
8. **Fabric Comfort** - Soft, breathable, non-irritating
9. **Wearability** - All-day comfort (reviews mentioning comfort)

**Category 4: STYLE & DESIGN (10%)**
10. **Style Longevity** - Timeless vs. trendy
11. **Versatility** - Can be worn multiple ways/occasions

**Category 5: VALUE (10%)**
12. **Price-to-Quality Ratio** - Worth the price?
13. **Cost per Wear** - Price ÷ expected wears (durability factor)

**Category 6: SUSTAINABILITY (Optional +5 Bonus)**
14. **Material Sustainability** - Organic, recycled, eco-friendly
15. **Ethical Production** - Fair trade, transparent supply chain

### TOTAL: 100 Points (0-100 scale)
- **90-100**: Exceptional (buy with confidence)
- **75-89**: Great quality
- **60-74**: Good, minor compromises
- **45-59**: Average, fit/quality issues likely
- **<45**: High return risk

---

## 🏗️ WHAT WE BUILD (Using Existing Infrastructure)

### Phase 1: Core Clothing Search API (Weeks 1-4)

**KEEP from existing B2B API:**
- ✅ `/api/v1/search` - Already built, production-ready
- ✅ `/api/v1/products/ingest` - Already built
- ✅ Tenant management (API keys, rate limiting)
- ✅ Vector search with Qdrant
- ✅ Hybrid search (RRF)

**MODIFY:**
- ✅ Replace 96-parameter scoring with 15-parameter clothing score
- ✅ Add clothing-specific filters (size, material, fit type, occasion)
- ✅ Tune ranking to prioritize: fit accuracy × quality × value

**DELETE:**
- ❌ All 34 other search APIs (semantic-search, smart-search, etc.)
- ❌ Swipe feature
- ❌ Visual search
- ❌ Leaderboard/gamification
- ❌ Consumer marketplace UI (for now)

### Phase 2: Clothing AI Agent (Weeks 5-8)

**What it does:**
- Natural language search: "comfortable joggers for working from home under $80"
- Asks ONE clarifying question: "What's your usual size?" or "Prefer loose or fitted?"
- Returns top 3 with fit/quality explanations
- Explains WHY each is recommended (fit data, material, durability)

**Use existing:**
- `/api/chat` route (already exists)
- Claude integration (already set up)

**Add:**
- Clothing-specific intent extraction
- Fit preference memory per session
- Size recommendation intelligence

### Phase 3: Return Prediction (Weeks 9-12)

**The killer feature Constructor doesn't have:**

For each product, predict probability of return due to:
- Size/fit issues (35% of clothing returns)
- Quality not as expected (25%)
- Style/color mismatch (20%)
- Other (20%)

**How it works:**
1. Analyze review mentions of "returned because..."
2. Track size consistency patterns
3. Material quality vs. price analysis
4. Train model on clothing-specific return reasons

**Value prop:**
"Veritas tells you which products will have high return rates BEFORE you feature them prominently."

### Phase 4: Simple Client Dashboard (Weeks 13-16)

**Not building a full SaaS portal yet. Just:**
- API key management (one page)
- Search analytics (what customers search, what converts)
- Return prediction dashboard (which SKUs are risky)
- Quality alerts ("SKU-1234 has declining quality reviews")

---

## 🎨 SIMPLIFIED PRODUCT OFFERING

### What We Sell to Clothing Brands

**Product 1: Veritas Search API**
- Quality-ranked search results
- Clothing-specific filters
- Return prediction per product
- Fit intelligence

**Price:** $299-$999/month based on SKUs
- Starter: 1,000 SKUs, 50K searches/month - $299
- Growth: 10,000 SKUs, 500K searches/month - $799
- Professional: Unlimited SKUs, 2M searches/month - $1,999

**Product 2: Veritas AI Shopping Agent**
- Conversational product discovery
- Fit recommendations
- Style guidance
- Embeddable on brand site

**Price:** $499-$1,499/month (add-on to Search API)

**Product 3: Return Intelligence Dashboard**
- Which products will have high returns
- Size consistency insights
- Quality trends over time

**Price:** $199/month (add-on)

**Bundle:** All 3 for $999-$2,999/month

---

## 📋 CLOTHING-SPECIFIC DATA SOURCES

### What We Need to Collect

**1. Fit & Sizing Data**
- Review text analysis ("runs small", "true to size", "size up")
- Return reasons (from merchant return data, if they share)
- Size chart accuracy (XS/S/M/L/XL consistency)

**2. Quality Indicators**
- Material composition (cotton %, polyester %, etc.)
- Care instructions (delicate = lower durability score)
- Warranty length (1 year vs. lifetime)
- Brand reputation (known for quality vs. fast fashion)

**3. Review Sources**
- Brand's own reviews
- Amazon reviews (if product sold there)
- Reddit threads (e.g., r/malefashionadvice, r/femalefashionadvice)
- YouTube reviews (fabric haul videos)

**4. Clothing-Specific Databases**
- Material sustainability databases (Good On You, Eco-Age)
- Certifications (OEKO-TEX, GOTS, Fair Trade)
- Brand ethics ratings (Fashion Revolution)

---

## 🚀 GO-TO-MARKET STRATEGY

### Month 1-2: Build MVP
- Clean up codebase (delete 70% of redundant features)
- Implement 15-parameter clothing score
- Integrate 3 clothing data sources
- Test with 500 sample clothing products

### Month 3: Validate with 5 Brands
- Find 5 DTC clothing brands ($1M-$10M revenue)
- Offer free pilot (3 months)
- Show them: Return prediction accuracy, search quality
- Ask: Would you pay $299-$999/month for this?
- Goal: 3 out of 5 say yes

### Month 4-6: First Paying Customers
- Convert 2 pilot brands to paid ($299/month minimum)
- Launch simple website (landing page + demo)
- Content marketing: "Why clothing returns are killing your margins"
- Goal: $1,000 MRR

### Month 7-12: Scale to $10K MRR
- Hire/partner with someone for sales/biz dev
- Target: 15-20 customers at $500-$1,000/month average
- Case studies showing return rate reduction
- Goal: $10,000 MRR

---

## 💡 WHY THIS WORKS (vs. Previous Strategies)

**✅ Focused vertical** - Clothing only, not "all products"
**✅ Clear customer** - DTC clothing brands, not "retailers" or "shoppers"
**✅ Real pain point** - 20-30% returns cost brands millions
**✅ Provable value** - "We reduced your return rate 15%" = measurable ROI
**✅ Differentiated** - Constructor doesn't do quality/fit scoring
**✅ Affordable** - $299-$2K/month vs. Constructor's $5K-$50K
**✅ Leverage existing code** - B2B API already built
**✅ Realistic timeline** - First dollar in 3-4 months, not 12-16

---

## 🎯 SUCCESS METRICS (First 6 Months)

**Must achieve:**
- [ ] 5 pilot brands signed (Month 3)
- [ ] 2 paying customers (Month 4)
- [ ] $1,000 MRR (Month 6)
- [ ] Proof: 10-15% return reduction for at least one customer

**If we don't hit these → Pivot or shut down. No exceptions.**

---

## 📊 COMPETITIVE POSITIONING

### Constructor.io
- **Strengths**: Brand name, funding, enterprise features
- **Weaknesses**: Expensive, complex, behavior-focused (not quality)
- **Our angle**: "We complement Constructor with quality intelligence"

### Algolia/Elastic
- **Strengths**: Developer-friendly, flexible
- **Weaknesses**: Generic (not clothing-specific), no AI agent, DIY
- **Our angle**: "Plug-and-play clothing search with built-in quality"

### Bloomreach
- **Strengths**: Full commerce suite
- **Weaknesses**: Expensive, overkill for mid-market
- **Our angle**: "Just search, just clothing, just affordable"

**Positioning:** "The affordable, quality-first search for clothing brands."

---

## 🔧 TECHNICAL ARCHITECTURE (Simplified)

```
┌─────────────────────────────────────────┐
│   Clothing Brand (Shopify/WooCommerce) │
└─────────────┬───────────────────────────┘
              │ API Integration
              ▼
┌─────────────────────────────────────────┐
│   VERITAS SEARCH API                    │
│   - /api/v1/search (quality-ranked)     │
│   - /api/v1/chat (AI agent)             │
│   - /api/v1/returns/predict             │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│   CLOTHING VERITAS SCORER (15 params)   │
│   - Fit & Sizing (35%)                  │
│   - Quality & Durability (30%)          │
│   - Comfort (15%)                       │
│   - Style & Value (20%)                 │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│   DATA LAYER                            │
│   - Review analysis                     │
│   - Material database                   │
│   - Return patterns                     │
│   - Size consistency data               │
└─────────────────────────────────────────┘
```

**Keep it simple. One API. Clear value.**

---

## 🚫 WHAT WE'RE NOT BUILDING

**To maintain focus:**
- ❌ Consumer-facing marketplace
- ❌ Multi-category support (only clothing)
- ❌ Retail media / ads
- ❌ Complex merchandising tools
- ❌ Cross-channel (email, SMS)
- ❌ Enterprise SSO (not yet)
- ❌ White-label solution (not yet)

**We build ONE thing well: Quality-first search for clothing brands.**

---

## 📝 NEXT 30 DAYS - EXECUTION CHECKLIST

### Week 1: Clean & Simplify
- [ ] Delete all redundant search APIs (keep only `/api/v1/search`)
- [ ] Delete swipe, visual search, leaderboard features
- [ ] Archive old strategy docs
- [ ] Create new `CLOTHING_ONLY_README.md`

### Week 2: Build Clothing Score
- [ ] Implement 15-parameter scoring system
- [ ] Test on 100 sample clothing products
- [ ] Compare scores to expert reviews (Wirecutter fashion picks)
- [ ] Validate: Does our ranking make sense?

### Week 3: Data Integration
- [ ] Set up review scraping for clothing keywords
- [ ] Build material quality database (cotton, linen, polyester grades)
- [ ] Create size consistency analyzer
- [ ] Test with 500 products

### Week 4: API Polish
- [ ] Add clothing-specific filters (size, material, occasion, fit type)
- [ ] Tune ranking algorithm (fit × quality × value)
- [ ] Create simple API docs for clothing brands
- [ ] Build demo site showing clothing search

### Week 5-6: Find Pilot Customers
- [ ] List 20 target DTC clothing brands ($1M-$10M revenue)
- [ ] Cold email 20 founders/ops leads
- [ ] Offer: "Free 3-month pilot to reduce returns"
- [ ] Goal: 5 agree to pilot

**If we can't get 5 pilot customers → Shut down and pivot**

---

## 💰 REVENUE PROJECTION (Conservative)

**Month 1-3**: $0 (building + pilots)
**Month 4**: $500 (2 customers × $250/month)
**Month 5**: $1,000 (4 customers × $250 avg)
**Month 6**: $2,000 (5 customers × $400 avg)
**Month 9**: $5,000 (10 customers × $500 avg)
**Month 12**: $10,000 (15 customers × $666 avg)

**Year 1 ARR Target: $120,000**

**This is achievable. Constructor doing $100M+ revenue shows the market exists.**

---

## 🎬 FINAL STATEMENT

**This is the plan. No more pivots.**

**Focus:** Clothing only
**Customer:** DTC clothing brands
**Value:** Reduce returns through quality-first search
**Timeline:** First dollar in Month 4
**Gate:** If no pilot customers in 60 days, we shut down

**Let's build this.**

---

**Ready to execute? Say "go" and I'll start Week 1: Clean & Simplify.**

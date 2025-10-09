# Veritas Score™ - Universal Generic Parameters (13%)

## Problem with V2.0 Generic Parameters

**V2.0 had tech-biased parameters:**
- ❌ Processor/Performance Info (doesn't apply to clothing/books/furniture)
- ❌ Memory/RAM Info (only for electronics)
- ❌ Storage/Capacity Info (only for electronics)

**Solution: User-Review-Based Universal Parameters**

---

## Generic Specification Quality (13% of Total Score)

These 7 parameters apply to **ALL products** across **ALL categories** and are based on **user feedback and quality indicators**:

---

### Parameter 1: Specification Completeness (20%)

**What it measures:** How complete is the product information provided?

| Score | Description | Example (Electronics) | Example (Clothing) | Example (Furniture) |
|-------|-------------|----------------------|-------------------|---------------------|
| 100 | Complete, comprehensive details | CPU, RAM, storage, battery, ports, display specs, benchmarks | Exact measurements, material %, care instructions, fit guide, size chart | Dimensions, weight capacity, material type, assembly time, warranty |
| 75 | Good detail, most info present | CPU, RAM, storage, basic display specs | Size, material, basic care, color | Dimensions, material, basic assembly info |
| 50 | Basic info only, missing details | "i7 processor, 16GB RAM, 512GB SSD" | "Large, cotton blend, machine wash" | "Sofa, wood frame, gray" |
| 25 | Minimal info, major gaps | "Laptop, 16GB, fast" | "T-shirt, medium" | "Chair" |
| 0 | Missing most/all information | No specs provided | No description | No details |

**Data Sources:**
- Seller description completeness analysis
- Number of fields filled vs total fields
- AI analysis of description depth

---

### Parameter 2: Specification Accuracy (20%)

**What it measures:** Is the provided information accurate and truthful?

| Score | Description | How Verified | Example |
|-------|-------------|--------------|---------|
| 100 | Verified accurate, cross-checked | Manufacturer verification, serial lookup, lab tests | Specs match manufacturer database exactly |
| 75 | Accurate, matches reviews | User reviews confirm specs, no contradictions | Users confirm "yes, it's really 16GB RAM" |
| 50 | Mostly correct, minor discrepancies | Some user reports of small differences | "Seller said 80Wh battery, users measured 75Wh" |
| 25 | Several inaccuracies reported | Multiple users report wrong information | "Seller said 1TB, actually 512GB" |
| 0 | Misleading or false information | Proven false claims | "Seller said 'new', clearly refurbished" |

**Data Sources:**
- User review verification ("specs match: yes/no")
- Manufacturer database cross-check
- AI analysis of review sentiment about accuracy

---

### Parameter 3: Description Detail Quality (15%)

**What it measures:** How helpful and detailed is the product description?

| Score | Description | Word Count | Detail Level |
|-------|-------------|------------|--------------|
| 100 | Comprehensive, professional | 500+ words | Measurements, materials, features, uses, care, flaws disclosed |
| 75 | Good detail, helpful | 200-500 words | Key features, basic care, some measurements |
| 50 | Basic description | 50-200 words | Basic features, minimal detail |
| 25 | Minimal description | <50 words | Title + 1-2 sentences |
| 0 | No description or title only | <10 words | "Product for sale" |

**Data Sources:**
- Description word count
- AI semantic analysis of information density
- Presence of key details (dimensions, materials, care)

---

### Parameter 4: User Review Score & Quality (15%) - NEW!

**What it measures:** What do verified buyers say about the product?

| Score | Description | Average Rating | Review Count | Quality |
|-------|-------------|---------------|--------------|---------|
| 100 | Excellent reviews, high volume | 4.8-5.0★ | 100+ verified | Detailed, helpful, consistent |
| 75 | Good reviews, decent volume | 4.5-4.7★ | 50-99 verified | Mostly positive, some detail |
| 50 | Mixed reviews or low volume | 4.0-4.4★ | 10-49 verified | Mixed feedback, basic reviews |
| 25 | Poor reviews or very few | 3.0-3.9★ | 1-9 reviews | Mostly negative, few reviews |
| 0 | Very bad or no reviews | <3.0★ or 0 reviews | No verified reviews | Red flags, no feedback |

**Data Sources:**
- Amazon, eBay, marketplace reviews
- Verified purchase reviews only
- Review sentiment analysis (AI)
- Review helpfulness votes

**Examples:**
- **Electronics**: "Battery life as advertised", "Performance excellent", "Runs hot but expected"
- **Clothing**: "Fits true to size", "Material feels cheap", "Color faded after wash"
- **Furniture**: "Easy assembly", "Very sturdy", "Cushions flatten quickly"
- **Books**: "Excellent condition", "Pages yellowed but readable", "Missing dust jacket"

---

### Parameter 5: Cross-Platform Rating Consistency (10%) - NEW!

**What it measures:** Are ratings consistent across multiple platforms?

| Score | Description | Platform Agreement | Example |
|-------|-------------|-------------------|---------|
| 100 | Highly consistent across platforms | All within 0.2★ | Amazon 4.8★, eBay 4.7★, BestBuy 4.9★ |
| 75 | Mostly consistent | All within 0.5★ | Amazon 4.5★, eBay 4.3★, Walmart 4.6★ |
| 50 | Some variation | Variance 0.6-1.0★ | Amazon 4.5★, eBay 3.8★, Target 4.2★ |
| 25 | Large discrepancies | Variance 1.1-2.0★ | Amazon 4.5★, eBay 2.9★ (suspicious) |
| 0 | Major contradictions or no data | Variance >2.0★ or no data | Amazon 5.0★, eBay 1.5★ (fake reviews?) |

**Data Sources:**
- Amazon ratings
- eBay ratings
- Marketplace-specific ratings
- Third-party review sites
- Google Shopping reviews

**Why it matters:**
- Detects fake/manipulated reviews
- Confirms genuine product quality
- Identifies platform-specific issues

---

### Parameter 6: Marketing Claims Verification (10%) - NEW!

**What it measures:** Do marketing claims match actual user experience?

| Score | Description | Claim Accuracy | Example |
|-------|-------------|---------------|---------|
| 100 | Claims verified by users | 95%+ users confirm | "Seller: '20hr battery' → Users: 'Yes, 18-22hrs'" |
| 75 | Claims mostly accurate | 75-94% confirm | "Seller: 'Quiet' → Users: 'Quiet but audible'" |
| 50 | Claims partially true | 50-74% confirm | "Seller: 'Stain resistant' → Users: 'Some stains'" |
| 25 | Claims misleading | 25-49% confirm | "Seller: 'Like new' → Users: 'Visible wear'" |
| 0 | False claims | <25% confirm | "Seller: 'Brand new' → Users: 'Clearly used'" |

**Data Sources:**
- User review analysis (AI)
- Claim keywords vs review sentiment
- Specific claim verification (battery life, size, quality)

**Examples:**
- **Electronics**: "Fast charging (100W)" → Users confirm/deny
- **Clothing**: "Wrinkle-free" → Users test in reviews
- **Furniture**: "Easy assembly (15 min)" → Users report actual time
- **Appliances**: "Quiet operation" → Users measure/report noise

---

### Parameter 7: Transparency & Honesty (10%) - NEW!

**What it measures:** Does seller honestly disclose limitations and flaws?

| Score | Description | Disclosure Level | Example |
|-------|-------------|-----------------|---------|
| 100 | Full transparency, flaws disclosed | All flaws mentioned | "Minor scratch on back (see photo 5), battery 85% health" |
| 75 | Good transparency, major flaws noted | Important flaws disclosed | "Used, works perfectly, light wear" |
| 50 | Basic honesty, vague on flaws | Condition mentioned, no details | "Good condition, some wear" |
| 25 | Poor transparency, hides issues | Flaws not mentioned | Users report "scratches not shown in photos" |
| 0 | Deceptive, actively hiding problems | False claims, hidden damage | "New" but clearly used, damage hidden |

**Data Sources:**
- User review complaints about undisclosed issues
- Photo quality and comprehensiveness
- Description honesty analysis (AI)
- Return rate due to "not as described"

**Examples:**
- **Electronics**: Discloses battery health, screen defects, missing accessories
- **Clothing**: Mentions stains, tears, fading, pilling
- **Furniture**: Shows scratches, wobbly parts, missing hardware
- **Books**: Notes highlighting, torn pages, missing dust jacket

---

## Calculation Formula

```
Generic Spec Score = (Completeness × 0.20) +
                     (Accuracy × 0.20) +
                     (Description × 0.15) +
                     (Reviews × 0.15) +
                     (Consistency × 0.10) +
                     (Claims × 0.10) +
                     (Transparency × 0.10)

Contribution to Veritas Score = Generic Spec Score × 0.13
```

---

## Examples Across Categories

### Example 1: MacBook Pro (Electronics)

| Parameter | Score | Reasoning |
|-----------|-------|-----------|
| Completeness | 95 | All specs listed: M3 Max, 48GB, 1TB, battery health, ports, etc. |
| Accuracy | 100 | Specs match Apple database, serial verified |
| Description | 90 | 600-word detailed description with measurements |
| Reviews | 85 | 4.6★ average, 230 reviews, mostly positive |
| Consistency | 90 | Amazon 4.6★, eBay 4.5★, BestBuy 4.7★ (consistent) |
| Claims | 80 | "22hr battery" → Users confirm 18-20hrs (close) |
| Transparency | 90 | Discloses "38 cycles, 94% battery health, minor scratch" |

**Generic Score = 91.25/100**
**Contribution = 91.25 × 0.13 = 11.86%**

---

### Example 2: Nike Running Shirt (Clothing)

| Parameter | Score | Reasoning |
|-----------|-------|-----------|
| Completeness | 80 | Size, material %, care, fit type, but missing exact measurements |
| Accuracy | 85 | Material matches tag, users confirm fabric composition |
| Description | 75 | 250-word description with features, care, sizing |
| Reviews | 90 | 4.7★, 450 reviews "fits true to size", "moisture-wicking works" |
| Consistency | 85 | Nike.com 4.7★, Amazon 4.6★, Dick's 4.8★ |
| Claims | 75 | "Moisture-wicking" → Users confirm, "wrinkle-free" → mixed |
| Transparency | 80 | Notes "pre-owned, light pilling on sleeves" |

**Generic Score = 81.5/100**
**Contribution = 81.5 × 0.13 = 10.60%**

---

### Example 3: IKEA Sofa (Furniture)

| Parameter | Score | Reasoning |
|-----------|-------|-----------|
| Completeness | 90 | Dimensions, weight, capacity, material, assembly time all listed |
| Accuracy | 80 | Dimensions match, users confirm measurements accurate |
| Description | 85 | 400-word description with features, assembly, care |
| Reviews | 70 | 4.3★, 120 reviews "assembly harder than stated", "comfortable" |
| Consistency | 75 | IKEA 4.3★, Amazon 4.1★, Wayfair 4.5★ (some variance) |
| Claims | 60 | "15-min assembly" → Users report 45-60 min (misleading) |
| Transparency | 90 | Honest about "assembly required", shows minor fabric wear |

**Generic Score = 78.5/100**
**Contribution = 78.5 × 0.13 = 10.21%**

---

### Example 4: Harry Potter Book (Books)

| Parameter | Score | Reasoning |
|-----------|-------|-----------|
| Completeness | 95 | ISBN, edition, publisher, year, condition, page count all listed |
| Accuracy | 100 | ISBN verified, edition matches description |
| Description | 80 | 200-word description with edition details, condition notes |
| Reviews | 100 | 5.0★ (book content), 4.8★ (seller condition rating), 5000+ reviews |
| Consistency | 95 | Amazon 5.0★, Goodreads 4.9★, Google Books 4.9★ |
| Claims | 90 | "Good condition" → Users confirm "pages clean, binding tight" |
| Transparency | 95 | Honestly notes "cover has slight crease, pages pristine" |

**Generic Score = 93.5/100**
**Contribution = 93.5 × 0.13 = 12.16%**

---

### Example 5: Tennis Racquet (Sports Equipment)

| Parameter | Score | Reasoning |
|-----------|-------|-----------|
| Completeness | 85 | Grip size, weight, string tension, brand, model all listed |
| Accuracy | 90 | Weight matches specs, users confirm "as described" |
| Description | 75 | 180-word description with specs and condition |
| Reviews | 88 | 4.6★, 85 reviews "great for intermediate", "durable" |
| Consistency | 80 | Amazon 4.6★, Tennis Warehouse 4.5★, Dick's 4.7★ |
| Claims | 85 | "Intermediate-advanced" → Users confirm skill level match |
| Transparency | 85 | Notes "used, some wear on grip, recently restrung" |

**Generic Score = 84.0/100**
**Contribution = 84.0 × 0.13 = 10.92%**

---

## Comparison: Old vs New Generic Parameters

### V2.0 (Tech-Biased) ❌
```
1. Spec Completeness (20%)
2. Spec Accuracy (20%)
3. Technical Detail (15%)
4. Feature Match (15%)
5. Processor Info (10%) ❌ Only for electronics!
6. RAM Info (10%) ❌ Only for electronics!
7. Storage Info (10%) ❌ Only for electronics!
```

**Problem:** Parameters 5-7 don't apply to clothing, furniture, books, or sports equipment!

### V3.0 (Universal) ✅
```
1. Spec Completeness (20%) ✅ All products
2. Spec Accuracy (20%) ✅ All products
3. Description Quality (15%) ✅ All products
4. User Review Score (15%) ✅ All products - NEW!
5. Rating Consistency (10%) ✅ All products - NEW!
6. Claims Verification (10%) ✅ All products - NEW!
7. Transparency (10%) ✅ All products - NEW!
```

**Solution:** All 7 parameters apply to EVERY product category!

---

## Why This Works Better

### 1. **Truly Universal**
- Every parameter applies to electronics, clothing, furniture, books, sports, appliances
- No tech bias

### 2. **User-Focused**
- Based on actual buyer experiences and reviews
- Detects fake reviews and misleading claims
- Values honesty and transparency

### 3. **Quality Indicators**
- High review scores = proven quality
- Consistent ratings = genuine feedback
- Verified claims = trustworthy seller

### 4. **Platform-Agnostic**
- Works with any marketplace
- Can aggregate reviews from multiple sources
- Detects manipulation across platforms

---

## Data Sources & Automation

### Automated Collection:
- **Amazon API**: Reviews, ratings, verified purchases
- **eBay API**: Seller ratings, product reviews
- **Google Shopping**: Aggregate ratings
- **Marketplace APIs**: Platform-specific ratings
- **Third-Party Sites**: Trustpilot, Consumer Reports

### AI Analysis:
- **Claude AI**:
  - Analyzes description completeness and quality
  - Extracts claims from descriptions
  - Sentiment analysis of reviews
  - Detects claim verification in reviews
  - Identifies transparency (flaws disclosed)

### Cross-Platform Scraping:
- Compare ratings across Amazon, eBay, Walmart, Target
- Detect suspicious patterns (all 5★ or sudden rating changes)
- Aggregate review sentiment

---

## Implementation Notes

### For Sellers:
To maximize Generic Spec Score (13%):
1. ✅ Provide complete information (all relevant fields)
2. ✅ Be accurate (verify specs before listing)
3. ✅ Write detailed descriptions (200+ words)
4. ✅ Encourage reviews (ask buyers to review)
5. ✅ Be honest about flaws (disclose all issues)
6. ✅ Match claims to reality (don't exaggerate)

### For Buyers:
These parameters help you:
1. ✅ Identify trustworthy sellers (high transparency)
2. ✅ Avoid misleading listings (verified claims)
3. ✅ See real user experiences (review scores)
4. ✅ Detect fake reviews (rating consistency)
5. ✅ Make informed decisions (complete info)

---

## Version History

- **v3.0** (2025-10-08) - Universal review-based parameters
  - Removed tech-specific parameters (CPU, RAM, storage)
  - Added User Review Score (15%)
  - Added Rating Consistency (10%)
  - Added Claims Verification (10%)
  - Added Transparency (10%)
  - Now truly universal across all categories

- **v2.0** (2025-10-08) - Specification-focused (flawed)
  - Had tech-biased parameters

- **v1.0** (2025-01-15) - Original release

---

**Status**: Production Ready
**Last Updated**: October 8, 2025

# Veritas Score™ V3.0 - Complete Parameter Documentation

## 🚀 Version 3.0 Update: Universal Review-Based Generic Parameters!

**Major Changes:**
1. **Product Specification: 30% of score** (13% generic + 17% category-specific)
2. **NEW: Review-based universal parameters** - No more tech bias! Works for ALL products
3. **User feedback integration** - Ratings, reviews, and transparency matter

---

## Overview

The Veritas Score is a comprehensive product quality and trustworthiness metric ranging from 0-100. It evaluates products across **8 major categories** with **152+ parameters** (113 base + up to 39 category-specific).

---

## Score Calculation Formula

```
Veritas Score = Σ (Category Score × Category Weight)

Where each Category Score = Σ (Parameter Score × Parameter Weight) / Σ Weights
```

---

## Category Weights (V3.0 - Updated 2025-10-08)

| Category | V1.0 | V2.0 | **V3.0** | Change | Reason |
|----------|------|------|----------|--------|--------|
| Product Quality | 25% | 22% | **22%** | - | Physical condition, authenticity |
| Seller Trust | 20% | 18% | **18%** | - | Seller reputation, reliability |
| **Product Specification** | **13%** | **30%** | **30%** | **+17%** | **Users care most about specs!** |
| Market Value | 15% | 13% | **13%** | - | Pricing, value for money |
| Sustainability | 12% | 10% | **10%** | - | Eco-friendly metrics |
| Security & Safety | 5% | 3% | **3%** | - | Payment security, protection |
| User Experience | 5% | 2% | **2%** | - | Listing quality |
| Company Performance | 5% | 2% | **2%** | - | Brand reputation |

**Total: 100%**

---

## Product Specification Breakdown (30% Total)

The 30% specification score is split into TWO components:

### Component 1: Generic Specification Quality (13% of total) - V3.0 UPDATED!
**Universal parameters based on USER REVIEWS and QUALITY INDICATORS**

These apply to **ALL products** - electronics, clothing, furniture, books, sports equipment, appliances.

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 79 | Specification Completeness | 20% | 0=Missing most, 50=Basic info, 75=Good detail, 100=Complete comprehensive |
| 80 | Specification Accuracy | 20% | 0=False info, 50=Mostly correct, 75=Accurate, 100=Verified accurate |
| 81 | Description Detail Quality | 15% | 0=No description, 50=Basic (50 words), 75=Good (200+), 100=Comprehensive (500+) |
| 82 | User Review Score & Quality | 15% | 0=<3.0★ or none, 50=4.0-4.4★ (10+ reviews), 75=4.5-4.7★ (50+), 100=4.8-5.0★ (100+) |
| 83 | Cross-Platform Rating Consistency | 10% | 0=>2.0★ variance, 50=0.6-1.0★ variance, 75=0.3-0.5★, 100=<0.2★ variance |
| 84 | Marketing Claims Verification | 10% | 0=<25% users confirm, 50=50-74% confirm, 75=75-94% confirm, 100=95%+ confirm claims |
| 85 | Transparency & Honesty | 10% | 0=Deceptive/hides issues, 50=Vague, 75=Good disclosure, 100=Full transparency + flaws |

**Why these parameters?**
- ✅ Apply to ALL product categories (no tech bias)
- ✅ Based on actual user feedback and experiences
- ✅ Detect fake reviews and misleading claims
- ✅ Reward honest, transparent sellers

**Calculation:**
```
Generic Spec Score = (Completeness × 0.20) +
                     (Accuracy × 0.20) +
                     (Description × 0.15) +
                     (Reviews × 0.15) +
                     (Consistency × 0.10) +
                     (Claims × 0.10) +
                     (Transparency × 0.10)

Contribution to Overall = Generic Spec Score × 0.13
```

**Data Sources:**
- Amazon/eBay/Marketplace reviews and ratings
- Verified purchase reviews only
- Cross-platform rating aggregation
- AI sentiment analysis (Claude)
- Seller description analysis
- User complaint analysis

---

### Component 2: Category-Specific Parameters (17% of total)
**25 critical specs unique to each product category**

The system automatically detects the product category and evaluates category-specific parameters.

**Scoring Method:**
```
Category Spec Score = (Specs Present / 25) × (Average Quality Score)

Where Quality Score for each parameter:
  100 = Detailed, verified, complete information with measurements
  75  = Good information, mostly complete
  50  = Basic information provided
  25  = Minimal/vague information
  0   = Missing or incorrect

Contribution to Overall = Category Spec Score × 0.17
```

---

## Category-Specific Parameter Lists

### 📱 ELECTRONICS (25 parameters)

**Key specs users care about:**
- Processor/CPU details
- RAM specifications
- Storage type and capacity
- Screen size and resolution
- Battery capacity and health
- Camera specifications
- Connectivity (WiFi, Bluetooth, ports)
- GPU/Graphics
- Operating system
- Physical dimensions and weight
- Display type and refresh rate
- Expandability options
- Thermal design
- Biometric features

### 👕 CLOTHING (25 parameters)

**Key specs users care about:**
- Exact size measurements
- Fit type and cut
- Material composition (%)
- Brand and authenticity
- Care instructions
- Color (specific shade)
- Season/weather suitability
- Neckline, sleeve, length details
- Closure type
- Pocket details
- Lining material
- Stretch/elasticity
- Breathability rating
- Water resistance
- UV protection
- Wrinkle resistance
- Odor control features

### 🛋️ FURNITURE (25 parameters)

**Key specs users care about:**
- Exact dimensions (W×D×H)
- Weight and weight capacity
- Frame material and construction
- Finish type and color
- Assembly time and difficulty
- Seating capacity
- Storage capacity
- Adjustability features
- Foldable/stackable
- Indoor/outdoor rating
- Fire resistance certification
- Water/stain resistance
- Pet-friendly features
- Child safety features
- Warranty details
- Cushion fill type and density
- Leg style and height
- Back support features

### 🏠 APPLIANCES (25 parameters)

**Key specs users care about:**
- Energy rating (Energy Star, EU rating)
- Power consumption (watts)
- Capacity/volume
- Dimensions (fit in space?)
- Noise level (dB)
- Speed/RPM
- Programs/cycles available
- Temperature range
- Timer/delay features
- Display type
- Smart/remote control capabilities
- Connectivity (WiFi, app)
- Safety features
- Warranty coverage
- Efficiency metrics
- Cycle times
- Water usage
- Certifications
- Self-cleaning features
- Sensor technology

### 📚 BOOKS (25 parameters)

**Key specs users care about:**
- ISBN (13-digit)
- Author(s)
- Publisher and imprint
- Publication year and printing
- Edition number
- Language
- Page count
- Format (hardcover, paperback)
- Binding type
- Physical dimensions
- Weight
- Illustrations/photos count
- Genre classification
- Age range and grade level
- Series information
- Volume number
- Translator (if applicable)
- Foreword/introduction
- Index presence
- Bibliography/references
- Print quality
- Paper type and quality
- Font size and typography
- Reading level metrics

### ⚽ SPORTS EQUIPMENT (25 parameters)

**Key specs users care about:**
- Sport type and use case
- Skill level recommendation
- Size and dimensions
- Weight
- Material and construction
- Brand and model
- Certifications (ITF, USTA, etc.)
- Safety ratings
- Age range
- Weather resistance
- Durability rating
- Grip type and quality
- Cushioning features
- Breathability
- Flexibility rating
- Shock absorption
- Traction/grip quality
- Waterproof rating
- Ventilation features
- Adjustability
- Storage/portability
- Carry system
- Team/individual use
- Indoor/outdoor compatibility
- Season/climate suitability

---

## 1. Product Quality (22% of Overall Score)

### 1.1 Warranty & Guarantees (12% of category = 2.64% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 1 | Warranty Status | 40% | 0=None, 50=Limited (6mo), 75=Standard (1yr), 100=Extended (2yr+) |
| 2 | Return Window | 30% | 0=No returns, 50=7 days, 75=30 days, 100=60+ days free returns |
| 3 | Money-Back Guarantee | 30% | 0=None, 50=Partial, 75=Full refund, 100=Full + shipping |

### 1.2 Product Authenticity (15% of category = 3.3% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 4 | Authenticity Verification | 50% | 0=Fake, 50=Unverified, 75=Likely genuine, 100=Verified genuine |
| 5 | Serial Number Verification | 25% | 0=Missing, 50=Present unverified, 75=Verified, 100=Manufacturer verified |
| 6 | Certificate of Authenticity | 25% | 0=None, 50=Seller declaration, 75=Third-party, 100=Manufacturer COA |

### 1.3 Physical Condition (10% of category = 2.2% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 7 | Overall Condition Grade | 40% | 0=Poor, 40=Fair, 60=Good, 80=Very Good, 90=Like New, 100=Brand New |
| 8 | Visual Defects | 30% | 0=Heavily damaged, 50=Minor scratches, 75=Minimal wear, 100=Flawless |
| 9 | Structural Integrity | 30% | 0=Broken, 50=Weak/loose, 75=Solid, 100=Perfect |

### 1.4 Functional Completeness (9% of category = 1.98% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 10 | Primary Functions Working | 50% | 0=Not working, 50=Partial, 75=Mostly working, 100=Perfect |
| 11 | Secondary Features | 30% | 0=None work, 50=Some work, 75=Most work, 100=All work |
| 12 | Software/Firmware Status | 20% | 0=Outdated/locked, 50=Needs update, 75=Current, 100=Latest + unlocked |

### 1.5 Wear and Tear (8% of category = 1.76% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 13 | Usage Wear Level | 35% | 0=Heavily worn, 50=Moderate, 75=Light, 100=No wear |
| 14 | Screen/Display Condition | 35% | 0=Cracked, 50=Scratches, 75=Minor marks, 100=Perfect |
| 15 | Controls/Buttons Wear | 30% | 0=Broken, 50=Worn, 75=Slight wear, 100=Like new |

### 1.6 Missing Components (7% of category = 1.54% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 16 | Essential Parts Complete | 50% | 0=Major parts missing, 50=Some missing, 75=Almost complete, 100=All included |
| 17 | Original Accessories | 30% | 0=None, 50=Some aftermarket, 75=Most original, 100=All original |
| 18 | Documentation | 20% | 0=None, 50=Digital copy, 75=Printed, 100=Original manual |

### 1.7 Material Quality (6% of category = 1.32% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 19 | Build Materials | 40% | 0=Cheap/broken, 50=Average, 75=Good, 100=Premium |
| 20 | Material Degradation | 30% | 0=Heavily degraded, 50=Some aging, 75=Minimal, 100=None |
| 21 | Finish Quality | 30% | 0=Poor/peeling, 50=Worn, 75=Good, 100=Perfect |

### 1.8 Packaging Quality (5% of category = 1.1% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 22 | Packaging Type | 50% | 0=None/damaged, 50=Generic box, 75=Good packaging, 100=Original sealed |
| 23 | Packaging Condition | 30% | 0=Damaged, 50=Worn, 75=Good, 100=Pristine |
| 24 | Protective Materials | 20% | 0=None, 50=Minimal, 75=Good, 100=Comprehensive |

### 1.9 Testing & Inspection (4% of category = 0.88% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 25 | Professional Inspection | 40% | 0=None, 50=Basic check, 75=Thorough, 100=Certified tech |
| 26 | Testing Documentation | 30% | 0=None, 50=Basic notes, 75=Detailed report, 100=Certified report |
| 27 | Quality Assurance | 30% | 0=None, 50=Seller QA, 75=Third-party, 100=Manufacturer refurb |

### 1.10 Age & Usage History (4% of category = 0.88% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 28 | Product Age | 40% | 0=>5 years, 40=3-5yrs, 60=2-3yrs, 80=1-2yrs, 100=<1yr |
| 29 | Usage Hours/Cycles | 30% | 0=Heavy use (>5000hrs), 50=Moderate, 75=Light, 100=Minimal |
| 30 | Ownership History | 30% | 0=Unknown, 50=Multiple owners, 75=Second owner, 100=Original owner |

---

## 2. Seller Trust (18% of Overall Score)

### 2.1 Seller Rating (30% of category = 5.4% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 31 | Overall Seller Rating | 50% | 0=1★, 20=2★, 40=3★, 60=4★, 80=4.5★, 100=5★ |
| 32 | Number of Ratings | 30% | 0=0-10, 40=50, 60=100, 80=500, 100=1000+ |
| 33 | Recent Rating Trend | 20% | 0=Declining, 50=Stable, 75=Improving, 100=Consistently high (>4.8) |

### 2.2 Seller Experience (25% of category = 4.5% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 34 | Years Selling | 40% | 0=New (<10 sales), 40=Some (50), 70=Experienced (500), 100=Expert (5000+) |
| 35 | Total Sales Volume | 35% | 0=<10, 40=50, 60=100, 80=1000, 100=10000+ |
| 36 | Category Expertise | 25% | 0=Generalist, 50=Multi-category, 75=Specialized, 100=Expert |

### 2.3 Trust Badges & Certifications (20% of category = 3.6% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 37 | Top Rated Status | 40% | 0=No badge, 50=Rising, 75=Power seller, 100=Top rated plus |
| 38 | Verified Seller | 30% | 0=Unverified, 50=Email, 75=Phone, 100=Full ID + business |
| 39 | Professional Certifications | 30% | 0=None, 50=Industry member, 75=Certified dealer, 100=Authorized reseller |

### 2.4 Response & Communication (15% of category = 2.7% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 40 | Response Time | 40% | 0=>24hrs, 50=12hrs, 75=6hrs, 90=1hr, 100=<1hr |
| 41 | Response Rate | 35% | 0=<50%, 50=70%, 75=90%, 90=95%, 100=100% |
| 42 | Communication Quality | 25% | 0=Poor/rude, 50=Basic, 75=Professional, 100=Exceptional |

### 2.5 Return & Refund History (10% of category = 1.8% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 43 | Return Policy | 50% | 0=No returns, 50=7 days, 75=30 days, 100=60+ days free |
| 44 | Return Processing Speed | 30% | 0=>14 days, 50=7 days, 75=3 days, 100=Same day |
| 45 | Refund Dispute Rate | 20% | 0=>10%, 50=5%, 75=2%, 90=1%, 100=0% |

---

## 3. Market Value (13% of Overall Score)

### 3.1 Price Competitiveness (25% of category = 3.25% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 46 | Price vs Market Average | 50% | 0=Much above (+30%), 50=At market, 75=Below (-15%), 100=Great deal (-30%+) |
| 47 | Price vs Competitors | 30% | 0=Highest, 50=Average, 75=Lower, 100=Lowest |
| 48 | Historical Price Trend | 20% | 0=Rising, 50=Stable, 75=Declining, 100=All-time low |

### 3.2 Discount & Savings (20% of category = 2.6% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 49 | Discount from MSRP | 50% | 0=Above MSRP, 25=0-10% off, 50=20% off, 75=40% off, 100=60%+ off |
| 50 | Discount from New Price | 30% | 0=Same, 30=10% off, 50=25% off, 75=50% off, 100=70%+ off |
| 51 | Special Offers/Bundles | 20% | 0=None, 50=Standard sale, 75=Bundle, 100=Limited promo |

### 3.3 Value for Money (25% of category = 3.25% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 52 | Quality-to-Price Ratio | 40% | 0=Terrible, 50=Fair, 75=Good, 100=Exceptional |
| 53 | Feature-to-Price Ratio | 30% | 0=Overpriced, 50=Fair, 75=Good deal, 100=Amazing |
| 54 | Condition-to-Price Match | 30% | 0=Overpriced, 50=Fair, 75=Good match, 100=Excellent |

### 3.4 Price Fairness (15% of category = 1.95% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 55 | Transparent Pricing | 40% | 0=Hidden fees, 50=Some fees, 75=Mostly clear, 100=All-inclusive |
| 56 | No Hidden Costs | 35% | 0=Many hidden, 50=Some, 75=Few, 100=None |
| 57 | Fair Shipping Costs | 25% | 0=Inflated, 50=Standard, 75=Low, 100=Free |

### 3.5 Market Position (15% of category = 1.95% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 58 | Competitive Advantage | 50% | 0=Worst deal, 50=Average, 75=Good, 100=Best available |
| 59 | Market Timing | 30% | 0=Peak price, 50=Normal, 75=Good timing, 100=Perfect timing |
| 60 | Supply vs Demand | 20% | 0=Oversupply, 50=Balanced, 75=High demand, 100=Rare |

---

## 4. Sustainability (10% of Overall Score)

### 4.1 Repairability (30% of category = 3% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 61 | iFixit Repairability Score | 50% | 0=1/10, 30=3/10, 50=5/10, 70=7/10, 100=10/10 |
| 62 | Repair Documentation | 30% | 0=None, 50=Community guides, 75=Official, 100=Comprehensive |
| 63 | Tool Requirements | 20% | 0=Specialized proprietary, 50=Advanced, 75=Standard, 100=Basic |

### 4.2 Energy Efficiency (20% of category = 2% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 64 | Energy Star Rating | 50% | 0=F rating, 40=C, 60=B, 80=A, 100=A+++ |
| 65 | Power Consumption | 30% | 0=Very high (>200W), 50=Average, 75=Low (<50W), 100=Minimal (<10W) |
| 66 | Standby Power | 20% | 0=High vampire (>5W), 50=Moderate, 75=Low (<2W), 100=Zero/smart |

### 4.3 Carbon Footprint (15% of category = 1.5% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 67 | Manufacturing Emissions | 40% | 0=Very high CO2, 50=Average, 75=Low, 100=Carbon neutral |
| 68 | Shipping Emissions | 30% | 0=Air freight, 50=Standard, 75=Ground/rail, 100=Local pickup |
| 69 | Lifecycle Emissions | 30% | 0=High impact, 50=Average, 75=Low, 100=Net zero |

### 4.4 Circular Economy (15% of category = 1.5% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 70 | Recyclability | 40% | 0=Not recyclable, 50=Partially, 75=Mostly, 100=Fully recyclable |
| 71 | Material Reuse Program | 35% | 0=No program, 50=Some recycling, 75=Good, 100=Full circular |
| 72 | Trade-In/Buyback | 25% | 0=None, 50=Third-party, 75=Manufacturer, 100=Enhanced trade-in |

### 4.5 E-Waste Reduction (10% of category = 1% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 73 | E-Waste Certification | 40% | 0=None, 50=Basic compliance, 75=Certified, 100=Zero waste |
| 74 | Responsible Disposal | 35% | 0=No program, 50=Instructions, 75=Free takeback, 100=Incentivized |
| 75 | Packaging Waste | 25% | 0=Excessive plastic, 50=Standard, 75=Minimal, 100=Zero waste |

### 4.6 Parts Availability (10% of category = 1% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 76 | OEM Parts Available | 50% | 0=Discontinued, 50=Limited, 75=Good availability, 100=Readily available |
| 77 | Third-Party Parts | 30% | 0=None, 50=Some, 75=Many, 100=Abundant |
| 78 | Parts Pricing | 20% | 0=Very expensive, 50=Moderate, 75=Affordable, 100=Cheap |

---

## 5. Security & Safety (3% of Overall Score)

### 5.1 Payment Security (40% of category = 1.2% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 86 | Payment Encryption | 50% | 0=Insecure, 50=Basic SSL, 75=TLS 1.3, 100=Bank-level (PCI DSS L1) |
| 87 | Payment Options | 30% | 0=Risky only, 50=Some secure, 75=Mostly secure, 100=All secure |
| 88 | PCI Compliance | 20% | 0=Non-compliant, 50=Basic, 75=Compliant, 100=Level 1 |

### 5.2 Buyer Protection (30% of category = 0.9% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 89 | Purchase Protection | 50% | 0=None, 50=Limited (30d), 75=Good (90d), 100=Full (180+d) |
| 90 | Dispute Resolution | 30% | 0=None, 50=Basic support, 75=Mediation, 100=Full arbitration |
| 91 | Fraud Protection | 20% | 0=None, 50=Basic, 75=Good, 100=Comprehensive |

### 5.3 Privacy Protection (15% of category = 0.45% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 92 | Privacy Policy | 40% | 0=None, 50=Basic, 75=Comprehensive, 100=GDPR/CCPA compliant |
| 93 | Data Protection | 35% | 0=No protection, 50=Basic, 75=Encrypted, 100=Zero-knowledge |
| 94 | Third-Party Sharing | 25% | 0=Sells data, 50=Shares, 75=Limited, 100=No sharing |

### 5.4 Fraud Prevention (15% of category = 0.45% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 95 | Seller Verification | 40% | 0=None, 50=Basic email, 75=Enhanced KYC, 100=Multi-factor business |
| 96 | Transaction Monitoring | 35% | 0=None, 50=Basic, 75=AI detection, 100=Real-time AI + manual |
| 97 | Product Authentication | 25% | 0=None, 50=Basic, 75=Photo verification, 100=Serial/blockchain |

---

## 6. User Experience (2% of Overall Score)

### 6.1 Listing Page Quality (40% of category = 0.8% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 98 | Page Layout | 40% | 0=Poor/broken, 50=Basic, 75=Good, 100=Professional |
| 99 | Navigation | 30% | 0=Confusing, 50=Workable, 75=Easy, 100=Intuitive |
| 100 | Loading Speed | 30% | 0=>10s, 50=5s, 75=2s, 100=<1s (Core Web Vitals) |

### 6.2 Image Quality (30% of category = 0.6% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 101 | Number of Images | 40% | 0=None, 50=1-2, 75=5-8, 100=10+ high-quality |
| 102 | Image Resolution | 35% | 0=Low res (<500px), 50=Standard (800px), 75=HD (1920px), 100=4K/zoomable |
| 103 | Image Variety/Angles | 25% | 0=Same angle, 50=Few angles, 75=Multiple + details, 100=360° view |

### 6.3 Description Quality (30% of category = 0.6% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 104 | Description Length | 30% | 0=Missing, 50=Brief (<50), 75=Good (200+), 100=Comprehensive (500+) |
| 105 | Description Accuracy | 40% | 0=Misleading, 50=Vague, 75=Accurate, 100=Detailed + honest (flaws) |
| 106 | Formatting Quality | 30% | 0=Plain text, 50=Some format, 75=Well formatted, 100=Rich media |

---

## 7. Company Performance (2% of Overall Score)

### 7.1 Brand Reputation (35% of category = 0.7% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 107 | Brand Recognition | 50% | 0=Unknown, 50=Niche known, 75=Well-known, 100=Premium/luxury |
| 108 | Brand Trust Score | 30% | 0=Distrusted, 50=Neutral, 75=Trusted, 100=Highly trusted |
| 109 | Industry Awards | 20% | 0=None, 50=Some, 75=Multiple, 100=Industry leader |

### 7.2 Financial Performance (25% of category = 0.5% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 110 | Stock Performance | 60% | 0=Declining, 40=Flat, 60=Growing, 80=Strong, 100=Excellent (>20% YoY) |
| 111 | Revenue Growth | 40% | 0=Shrinking, 40=Flat, 60=Growing, 80=Fast (>15%), 100=Exponential (>30%) |

### 7.3 Market Performance (20% of category = 0.4% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 112 | Market Share | 100% | 0=Losing, 50=Stable, 75=Growing, 100=Market leader |

### 7.4 News Sentiment (20% of category = 0.4% overall)

| # | Parameter | Weight | Scoring Guide |
|---|-----------|--------|---------------|
| 113 | Recent News Sentiment | 100% | 0=Very negative, 50=Neutral, 75=Positive, 100=Very positive |

---

## Grade Scale

| Grade | Score | Label | Recommendation | Description |
|-------|-------|-------|----------------|-------------|
| S | 95-100 | Exceptional | EXCEPTIONAL_BUY | Near-perfect: excellent specs, trusted seller, great value |
| A | 85-94 | Excellent | STRONG_BUY | High-quality with detailed specs, very good overall |
| B | 75-84 | Very Good | BUY | Good product with adequate specs, safe purchase |
| C | 65-74 | Good | CONSIDER | Decent but may lack spec details or have minor issues |
| D | 50-64 | Fair | CAUTION | Below average, missing specs or quality concerns |
| F | 0-49 | Poor | AVOID | Significant issues, incomplete specs, not recommended |

---

## Complete Calculation Example

### Product: Used MacBook Pro 16" M3 Max

#### STEP 1: Generic Specification Score (13%)

| Parameter | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| Completeness | 95 | 20% | 19.0 |
| Accuracy | 100 | 20% | 20.0 |
| Description Quality | 90 | 15% | 13.5 |
| User Review Score | 92 | 15% | 13.8 |
| Rating Consistency | 90 | 10% | 9.0 |
| Claims Verification | 85 | 10% | 8.5 |
| Transparency | 90 | 10% | 9.0 |

**Generic Score = 92.8/100**
**Contribution = 92.8 × 0.13 = 12.06%**

#### STEP 2: Category-Specific (Electronics) Score (17%)

25 parameters evaluated, all present, average quality 94.0
**Category Score = 94.0/100**
**Contribution = 94.0 × 0.17 = 15.98%**

#### STEP 3: Total Specification Score

**12.06% + 15.98% = 28.04/30 (93.5% of max)**

#### STEP 4: Other Categories

| Category | Score | Weight | Contribution |
|----------|-------|--------|--------------|
| Product Quality | 92 | 22% | 20.24% |
| Seller Trust | 96 | 18% | 17.28% |
| Market Value | 78 | 13% | 10.14% |
| Sustainability | 72 | 10% | 7.20% |
| **Product Specification** | **93.5** | **30%** | **28.04%** |
| Security & Safety | 95 | 3% | 2.85% |
| User Experience | 88 | 2% | 1.76% |
| Company Performance | 98 | 2% | 1.96% |

#### STEP 5: Final Score

**OVERALL VERITAS SCORE = 89.47 ≈ 89.5/100**

**GRADE: A (Excellent)**
**RECOMMENDATION: STRONG_BUY**

---

## Version History

- **v3.0.0** (2025-10-08) - Universal Review-Based Generic Parameters
  - ✅ Removed tech-biased parameters (CPU, RAM, storage)
  - ✅ Added User Review Score & Quality (15%)
  - ✅ Added Cross-Platform Rating Consistency (10%)
  - ✅ Added Marketing Claims Verification (10%)
  - ✅ Added Transparency & Honesty (10%)
  - ✅ Generic parameters now work for ALL product categories
  - Total: 113 base + 25 category-specific = 138 parameters per product

- **v2.0.0** (2025-10-08) - Specification-Focused System
  - Increased Product Specification from 13% to 30%
  - Added category-specific parameters (25 per category)
  - Split specs: Generic (13%) + Category-Specific (17%)

- **v1.0.0** (2025-01-15) - Initial Release
  - 121 base parameters across 8 categories

---

## Data Sources

### Automated:
- **Reviews**: Amazon, eBay, marketplace APIs
- **Ratings**: Cross-platform aggregation
- **Pricing**: Real-time APIs, historical tracking
- **Specs**: Manufacturer databases, BestBuy API
- **Energy**: Energy Star, EPA databases
- **Repairability**: iFixit API

### AI-Enhanced (Claude):
- Description analysis and completeness scoring
- Review sentiment analysis
- Claim verification (description vs reviews)
- Transparency detection (flaw disclosure)
- Category classification

---

**Last Updated**: October 8, 2025
**Version**: 3.0.0
**Status**: Production Ready

© 2025 ThriftAI. Veritas Score™ is a proprietary scoring system.

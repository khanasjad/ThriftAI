# Veritas Score™ - Complete 116-Parameter Distribution

## Overview
The Veritas Score uses **116 enriched parameters** across multiple data layers to calculate a comprehensive 0-100 product score.

---

## Parameter Distribution Summary

| Layer | Parameter Count | Purpose |
|-------|----------------|---------|
| **Base Product Data** | 46 parameters | Core product information |
| **Company Metrics** | 25 parameters | ESG, sustainability, legal data |
| **Dynamic Specifications** | 45 parameters | Category-specific attributes & enrichment |
| **TOTAL** | **116 parameters** | Complete enrichment system |

---

## Layer 1: Base Product Data (46 Parameters)

### 1.1 Basic Information (5 parameters)
| # | Parameter | Type | Example |
|---|-----------|------|---------|
| 1 | Product ID | string | "ASIN123456" |
| 2 | Product Name | string | "iPhone 15 Pro" |
| 3 | Description | string | "Latest Apple flagship..." |
| 4 | Brand | string | "Apple" |
| 5 | Category | string | "Electronics > Phones" |

### 1.2 Pricing (6 parameters)
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 6 | Current Price | number | Price Value (20%) |
| 7 | Original Price | number | Price Value (20%) |
| 8 | Currency | string | Price Value (20%) |
| 9 | Discount Percentage | number | Price Value (20%) |
| 10 | Competitor Prices | number[] | Price Value (20%) |
| 11 | Market Average Price | number | Price Value (20%) |

### 1.3 Seller Information (5 parameters)
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 12 | Seller ID | string | Trust Score (16%) |
| 13 | Seller Rating | number (0-5) | Trust Score (16%) |
| 14 | Seller Response Time | number (hours) | Trust Score (16%) |
| 15 | Seller Total Sales | number | Trust Score (16%) |
| 16 | Seller Account Age | number (days) | Trust Score (16%) |

### 1.4 Product Quality (4 parameters)
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 17 | Condition | enum | Quality Score (11%) |
| 18 | Has Warranty | boolean | Trust Score (16%) |
| 19 | Is Authentic | boolean | Trust Score (16%) |
| 20 | Certifications | string[] | Quality Score (11%) |

### 1.5 Reviews & Social Proof (5 parameters)
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 21 | Product Rating | number (0-5) | Social Proof (13%) |
| 22 | Review Count | number | Social Proof (13%) |
| 23 | Recent Review Count | number (30 days) | Social Proof (13%) |
| 24 | Verified Purchase Ratio | number (0-1) | Social Proof (13%) |
| 25 | Social Media Mentions | number | Emotional Appeal (4%) |

### 1.6 Shipping & Fulfillment (7 parameters)
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 26 | Shipping Cost | number | Price Value (20%) |
| 27 | Estimated Delivery Days | number | User Experience (10%) |
| 28 | Has Free Shipping | boolean | Price Value (20%), UX (10%) |
| 29 | Has Fast Shipping | boolean | User Experience (10%) |
| 30 | Has Tracking | boolean | User Experience (10%) |
| 31 | Return Period Days | number | Trust Score (16%) |
| 32 | Has Free Returns | boolean | Trust Score (16%) |

### 1.7 Availability & Urgency (6 parameters)
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 33 | In Stock | boolean | User Experience (10%) |
| 34 | Stock Level | number | Urgency (4%) |
| 35 | Views Last 24h | number | Urgency (4%) |
| 36 | Sales Last 7 Days | number | Urgency (4%) |
| 37 | Cart Additions Last 24h | number | Urgency (4%) |
| 38 | Inventory Velocity | number | Urgency (4%) |

### 1.8 Search & Relevance (4 parameters)
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 39 | Search Query | string | Relevance (7%) |
| 40 | Click-Through Rate | number | Relevance (7%) |
| 41 | Conversion Rate | number | Relevance (7%) |
| 42 | Bounce Rate | number | Relevance (7%) |

### 1.9 External Factors (4 parameters)
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 43 | Has External Traffic | boolean | Emotional Appeal (4%) |
| 44 | Sustainability Flag | boolean | Emotional Appeal (4%) |
| 45 | Made In Country | string | Emotional Appeal (4%) |
| 46 | Dynamic Specs Object | Record<string, any> | Specs Quality (15%) |

**Layer 1 Total: 46 base parameters**

---

## Layer 2: Company Metrics (25 Parameters)

### 2.1 ESG & Sustainability (10 parameters)
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 47 | ESG Score | number (0-100) | Emotional Appeal (4%) |
| 48 | Carbon Footprint | number (kg CO2) | Emotional Appeal (4%) |
| 49 | Sustainability Rating | number (0-5) | Emotional Appeal (4%) |
| 50 | Renewable Energy % | number (0-100) | Emotional Appeal (4%) |
| 51 | Waste Reduction % | number (0-100) | Emotional Appeal (4%) |
| 52 | Water Usage Efficiency | number | Emotional Appeal (4%) |
| 53 | Recycling Programs | boolean | Emotional Appeal (4%) |
| 54 | Carbon Neutral Certified | boolean | Emotional Appeal (4%) |
| 55 | Green Certifications | string[] | Quality Score (11%) |
| 56 | Environmental Impact Score | number (0-100) | Emotional Appeal (4%) |

### 2.2 Labor & Ethics (8 parameters)
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 57 | Labor Practices Score | number (0-100) | Trust Score (16%) |
| 58 | Fair Trade Certified | boolean | Trust Score (16%) |
| 59 | Worker Safety Rating | number (0-5) | Trust Score (16%) |
| 60 | Living Wage Compliance | boolean | Trust Score (16%) |
| 61 | Diversity & Inclusion Score | number (0-100) | Emotional Appeal (4%) |
| 62 | Supply Chain Transparency | number (0-100) | Trust Score (16%) |
| 63 | Ethical Sourcing | boolean | Trust Score (16%) |
| 64 | Community Investment | number (USD) | Emotional Appeal (4%) |

### 2.3 Legal & Compliance (7 parameters)
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 65 | Legal Violations Count | number | Trust Score (16%) |
| 66 | Recalls Last 5 Years | number | Trust Score (16%) |
| 67 | FDA Compliance | boolean | Trust Score (16%) |
| 68 | Safety Standards Met | string[] | Quality Score (11%) |
| 69 | Product Liability Claims | number | Trust Score (16%) |
| 70 | Consumer Protection Score | number (0-100) | Trust Score (16%) |
| 71 | Regulatory Compliance % | number (0-100) | Trust Score (16%) |

**Layer 2 Total: 25 company parameters**

---

## Layer 3: Dynamic Specifications (45 Parameters)

### 3.1 Image Quality Analysis (5 parameters)
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 72 | Overall Image Quality | number (0-100) | Trust Score (16%) |
| 73 | Quality Label | enum | Trust Score (16%) |
| 74 | Image Sharpness | number (0-100) | Trust Score (16%) |
| 75 | Image Brightness | number (0-100) | Trust Score (16%) |
| 76 | Image Contrast | number (0-100) | Trust Score (16%) |

### 3.2 User Experience Metrics (8 parameters)
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 77 | Page Quality Score | number (0-100) | User Experience (10%) |
| 78 | Image Count | number | User Experience (10%) |
| 79 | Description Word Count | number | User Experience (10%) |
| 80 | Has Video | boolean | User Experience (10%) |
| 81 | Mobile Optimized | boolean | User Experience (10%) |
| 82 | Page Load Speed | number (seconds) | User Experience (10%) |
| 83 | Checkout Ease | number (0-100) | User Experience (10%) |
| 84 | Navigation Quality | number (0-100) | User Experience (10%) |

### 3.3 Advanced Quality Metrics (7 parameters)
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 85 | Functionality Score | number (0-100) | Quality Score (11%) |
| 86 | Aesthetic Score | number (0-100) | Quality Score (11%) |
| 87 | Durability Rating | number (0-5) | Quality Score (11%) |
| 88 | Build Quality | number (0-100) | Quality Score (11%) |
| 89 | Material Quality | number (0-100) | Quality Score (11%) |
| 90 | Defect Rate | number (0-1) | Quality Score (11%) |
| 91 | Warranty Claims Rate | number (0-1) | Trust Score (16%) |

### 3.4 Category-Specific Attributes (25 parameters)

These 25 parameters adapt dynamically based on product category, providing deep specification analysis.

**Electronics Category (Parameters #92-116):**
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 92 | Battery Life | number (hours) | Specs Quality (15%) |
| 93 | Screen Size | number (inches) | Specs Quality (15%) |
| 94 | Screen Resolution | string | Specs Quality (15%) |
| 95 | Screen Type | string (OLED, LCD, etc.) | Specs Quality (15%) |
| 96 | Storage Capacity | number (GB) | Specs Quality (15%) |
| 97 | RAM | number (GB) | Specs Quality (15%) |
| 98 | Processor Speed | number (GHz) | Specs Quality (15%) |
| 99 | Processor Type | string | Specs Quality (15%) |
| 100 | Camera Megapixels | number (MP) | Specs Quality (15%) |
| 101 | Front Camera MP | number (MP) | Specs Quality (15%) |
| 102 | Video Recording Quality | string (4K, 1080p) | Specs Quality (15%) |
| 103 | Operating System | string | Specs Quality (15%) |
| 104 | Wireless Connectivity | string[] | Specs Quality (15%) |
| 105 | Ports & Connectivity | string[] | Specs Quality (15%) |
| 106 | Charging Type | string (USB-C, Lightning) | Specs Quality (15%) |
| 107 | Fast Charging | boolean | Specs Quality (15%) |
| 108 | Water Resistance Rating | string (IP68, etc.) | Specs Quality (15%) |
| 109 | Dimensions (WxHxD) | string | Specs Quality (15%) |
| 110 | Weight | number (grams) | Specs Quality (15%) |
| 111 | Color Options | string[] | Specs Quality (15%) |
| 112 | SIM Type | string (Dual, eSIM) | Specs Quality (15%) |
| 113 | Network Bands | string[] | Specs Quality (15%) |
| 114 | Sensors | string[] | Specs Quality (15%) |
| 115 | Warranty Period | number (months) | Specs Quality (15%) |
| 116 | Included Accessories | string[] | Specs Quality (15%) |

**Fashion Category (Parameters #92-116):**
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 92 | Size | string | Specs Quality (15%) |
| 93 | Size System | string (US, UK, EU) | Specs Quality (15%) |
| 94 | Size Chart Available | boolean | Specs Quality (15%) |
| 95 | Color | string | Specs Quality (15%) |
| 96 | Color Family | string | Specs Quality (15%) |
| 97 | Pattern | string | Specs Quality (15%) |
| 98 | Material Composition | string | Specs Quality (15%) |
| 99 | Primary Material | string | Specs Quality (15%) |
| 100 | Material Percentage | string | Specs Quality (15%) |
| 101 | Fabric Type | string | Specs Quality (15%) |
| 102 | Fit Type | string (Slim, Regular) | Specs Quality (15%) |
| 103 | Length | string | Specs Quality (15%) |
| 104 | Sleeve Length | string | Specs Quality (15%) |
| 105 | Neckline Type | string | Specs Quality (15%) |
| 106 | Closure Type | string (Zipper, Button) | Specs Quality (15%) |
| 107 | Care Instructions | string | Specs Quality (15%) |
| 108 | Machine Washable | boolean | Specs Quality (15%) |
| 109 | Occasion | string | Specs Quality (15%) |
| 110 | Season | string | Specs Quality (15%) |
| 111 | Style | string | Specs Quality (15%) |
| 112 | Brand Size | string | Specs Quality (15%) |
| 113 | Model Measurements | string | Specs Quality (15%) |
| 114 | Country of Origin | string | Specs Quality (15%) |
| 115 | Sustainable Materials | boolean | Specs Quality (15%) |
| 116 | Special Features | string[] | Specs Quality (15%) |

**Home & Garden Category (Parameters #92-116):**
| # | Parameter | Type | Used In |
|---|-----------|------|---------|
| 92 | Dimensions (LxWxH) | string | Specs Quality (15%) |
| 93 | Weight | number (kg) | Specs Quality (15%) |
| 94 | Weight Capacity | number (kg) | Specs Quality (15%) |
| 95 | Assembly Required | boolean | Specs Quality (15%) |
| 96 | Assembly Time | number (minutes) | Specs Quality (15%) |
| 97 | Assembly Instructions | boolean | Specs Quality (15%) |
| 98 | Indoor/Outdoor Use | string | Specs Quality (15%) |
| 99 | Weather Resistant | boolean | Specs Quality (15%) |
| 100 | Power Source | string | Specs Quality (15%) |
| 101 | Power Consumption | number (watts) | Specs Quality (15%) |
| 102 | Voltage | number (volts) | Specs Quality (15%) |
| 103 | Material | string | Specs Quality (15%) |
| 104 | Frame Material | string | Specs Quality (15%) |
| 105 | Finish Type | string | Specs Quality (15%) |
| 106 | Color | string | Specs Quality (15%) |
| 107 | Style | string (Modern, Classic) | Specs Quality (15%) |
| 108 | Room Type | string | Specs Quality (15%) |
| 109 | Capacity | number | Specs Quality (15%) |
| 110 | Adjustable | boolean | Specs Quality (15%) |
| 111 | Stackable | boolean | Specs Quality (15%) |
| 112 | Easy to Clean | boolean | Specs Quality (15%) |
| 113 | Safety Features | string[] | Specs Quality (15%) |
| 114 | Safety Certifications | string[] | Specs Quality (15%) |
| 115 | Warranty Information | string | Specs Quality (15%) |
| 116 | Included Components | string[] | Specs Quality (15%) |

**Note**: All 25 category-specific parameters are dynamically generated based on product category, ensuring comprehensive specification coverage across Electronics, Fashion, Home & Garden, Sports, Beauty, Books, and more.

**Layer 3 Total: 45 enrichment parameters** (5 image + 8 UX + 7 advanced quality + 25 category-specific)

---

## Parameter Usage by Score Component

### Price Value (20% of final score)
**Parameters Used: 6**
- Current Price (#6)
- Original Price (#7)
- Discount Percentage (#9)
- Market Average Price (#11)
- Shipping Cost (#26)
- Has Free Shipping (#28)

### Trust Score (16% of final score)
**Parameters Used: 17**
- Seller Rating (#13)
- Seller Response Time (#14)
- Seller Total Sales (#15)
- Seller Account Age (#16)
- Has Warranty (#18)
- Is Authentic (#19)
- Return Period Days (#31)
- Has Free Returns (#32)
- Overall Image Quality (#72)
- Image Sharpness (#74)
- Labor Practices Score (#57)
- Supply Chain Transparency (#62)
- Legal Violations Count (#65)
- Recalls Last 5 Years (#66)
- FDA Compliance (#67)
- Product Liability Claims (#69)
- Warranty Claims Rate (#91)

### Social Proof (13% of final score)
**Parameters Used: 5**
- Product Rating (#21)
- Review Count (#22)
- Recent Review Count (#23)
- Verified Purchase Ratio (#24)
- Social Media Mentions (#25)

### Quality Score (11% of final score)
**Parameters Used: 9**
- Condition (#17)
- Certifications (#20)
- Dynamic Specs (#46)
- Green Certifications (#55)
- Safety Standards Met (#68)
- Functionality Score (#85)
- Aesthetic Score (#86)
- Build Quality (#88)
- Material Quality (#89)

### User Experience (10% of final score)
**Parameters Used: 11**
- Estimated Delivery Days (#27)
- Has Free Shipping (#28)
- Has Fast Shipping (#29)
- Has Tracking (#30)
- In Stock (#33)
- Page Quality Score (#77)
- Image Count (#78)
- Description Word Count (#79)
- Has Video (#80)
- Mobile Optimized (#81)
- Page Load Speed (#82)
- Checkout Ease (#83)
- Navigation Quality (#84)

### Specs Quality (15% of final score)
**Parameters Used: 26**
- Dynamic Specs Object (#46)
- Category-Specific Attributes (#92-116) - 25 parameters

### Relevance (7% of final score)
**Parameters Used: 4**
- Search Query (#39)
- Click-Through Rate (#40)
- Conversion Rate (#41)
- Bounce Rate (#42)

### Urgency (4% of final score)
**Parameters Used: 6**
- Stock Level (#34)
- Views Last 24h (#35)
- Sales Last 7 Days (#36)
- Cart Additions Last 24h (#37)
- Inventory Velocity (#38)
- In Stock (#33)

### Emotional Appeal (4% of final score)
**Parameters Used: 11**
- Social Media Mentions (#25)
- Has External Traffic (#43)
- Sustainability Flag (#44)
- Made In Country (#45)
- ESG Score (#47)
- Carbon Footprint (#48)
- Sustainability Rating (#49)
- Environmental Impact Score (#56)
- Diversity & Inclusion Score (#61)
- Community Investment (#64)

---

## Parameter Coverage Analysis

| Score Component | Parameters Used | Coverage |
|----------------|----------------|----------|
| Price Value | 6 params | 5.2% of total |
| Trust Score | 17 params | 14.7% of total |
| Social Proof | 5 params | 4.3% of total |
| Quality Score | 9 params | 7.8% of total |
| User Experience | 13 params | 11.2% of total |
| Specs Quality | 26 params | 22.4% of total |
| Relevance | 4 params | 3.4% of total |
| Urgency | 6 params | 5.2% of total |
| Emotional Appeal | 11 params | 9.5% of total |
| **TOTAL UNIQUE** | **116 params** | **100%** |

**Note**: Some parameters are used in multiple components (e.g., Has Free Shipping affects both Price Value and User Experience).

---

## Data Sources

| Parameter Layer | Primary Source | Enrichment Method |
|----------------|----------------|-------------------|
| **Base Product (46)** | Product database, marketplace APIs | Direct ingestion |
| **Company Metrics (25)** | ESG databases, legal records | Batch enrichment |
| **Dynamic Specs (45)** | AI analysis, image recognition, category extraction | Real-time enrichment |

---

## Scoring Impact Distribution

### High Impact Parameters (>5 points contribution)
1. **Product Condition** - Up to 100 points → 11% of final = **11 points**
2. **Seller Rating** - Up to 50 points → 16% of final = **8 points**
3. **Product Rating** - Up to 40 points → 13% of final = **5.2 points**

### Medium Impact Parameters (5-15 points contribution)
- Discount Percentage
- Market Price Comparison
- Review Count
- Free Shipping

### Low Impact Parameters (<5 points contribution)
- Most individual dynamic specs
- Minor quality indicators
- Urgency signals

---

## File Reference

- **Implementation**: `/src/lib/services/aiProductScorer.ts`
- **Company Enrichment**: `/src/lib/services/comprehensiveVeritasCalculators.ts`
- **Score Documentation**: `VERITAS_SCORE_PARAMETERS.md`

**Last Updated**: 2025-10-12

**Total Parameters**: 116 (46 base + 25 company + 45 dynamic enrichment)

**Specs Quality Enhancement**: Category-Specific Attributes expanded from 5+ to 25 parameters, weight increased from 10% to 15%

# External Marketplace Integration Guide

**Feature:** Multi-Platform Product Aggregation & Comparison
**Priority:** 🔥 CRITICAL
**Estimated Effort:** 3-4 weeks
**Business Impact:** 10x inventory expansion + price comparison

---

## 📋 Overview

Integrate with external marketplaces (Amazon, eBay, Nike, Adidas) to:
1. Expand product inventory 10x without needing sellers
2. Provide real-time price comparison
3. Show users the best deals across platforms
4. Generate affiliate revenue

### User Stories
1. As a buyer, I want to see if Amazon has it cheaper
2. As a buyer, I want to compare ThriftAI prices with eBay/Nike/Adidas
3. As a buyer, I want to see "Best Deal" recommendations across all platforms
4. As a buyer, I want to buy from external sites with one click (affiliate tracking)

### Success Metrics
- **Inventory Growth:** 10x more products searchable
- **Conversion Rate:** +25% through better prices
- **Affiliate Revenue:** $500-2000/month by Month 3
- **User Satisfaction:** 90% find comparison helpful

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     User Search Query                          │
│              "Nike Air Max under $100"                         │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                  Search Orchestrator Service                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  1. Parse query (extract brand, category, price, etc.)   │ │
│  │  2. Route to appropriate sources in parallel             │ │
│  │  3. Set timeout (5s) & error handling                    │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        │                     │                      │
        ↓                     ↓                      ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   ThriftAI   │    │   External   │    │   External   │
│   Database   │    │  Marketplace │    │  Marketplace │
│              │    │   Adapters   │    │   Adapters   │
└──────────────┘    └──────────────┘    └──────────────┘
                            │                      │
        ┌───────────────────┼──────────────────────┤
        ↓                   ↓                      ↓
  ┌──────────┐      ┌──────────┐         ┌──────────┐
  │  Amazon  │      │   eBay   │         │   Nike   │
  │    PA    │      │  Finding │         │  Retail  │
  │   API    │      │    API   │         │   API    │
  └──────────┘      └──────────┘         └──────────┘
        │                   │                      │
        └───────────────────┼──────────────────────┘
                            ↓
              ┌──────────────────────────┐
              │  Data Normalization      │
              │  ├─ Price extraction     │
              │  ├─ Image URLs          │
              │  ├─ Shipping costs      │
              │  ├─ Availability        │
              │  └─ Affiliate links     │
              └──────────────────────────┘
                            ↓
              ┌──────────────────────────┐
              │  Comparison Engine       │
              │  ├─ Calculate best deal │
              │  ├─ Rank by value       │
              │  ├─ Apply user filters  │
              │  └─ Generate insights   │
              └──────────────────────────┘
                            ↓
              ┌──────────────────────────┐
              │  Unified Results         │
              │  [ThriftAI + External]   │
              └──────────────────────────┘
```

---

## 🗂️ Database Schema

### New Tables

```prisma
// External marketplace products (cached)
model ExternalProduct {
  id              String   @id @default(cuid())
  source          ExternalSource
  externalId      String   // Amazon ASIN, eBay Item ID, etc.

  // Product details
  title           String
  description     String?  @db.Text
  brand           String?
  category        String

  // Pricing
  price           Float
  originalPrice   Float?
  currency        String   @default("USD")
  shippingCost    Float?

  // Links
  productUrl      String
  affiliateUrl    String?
  imageUrl        String?

  // Metadata
  condition       String?
  rating          Float?
  reviewCount     Int      @default(0)
  availability    Boolean  @default(true)

  // Caching
  cachedAt        DateTime @default(now())
  expiresAt       DateTime

  // Relations
  comparisons     ProductComparison[]

  @@unique([source, externalId])
  @@index([source, externalId])
  @@index([brand, category])
  @@index([cachedAt])
  @@map("external_products")
}

enum ExternalSource {
  AMAZON
  EBAY
  NIKE
  ADIDAS
  WALMART
  TARGET
  SHOPIFY
}

// Price comparisons
model ProductComparison {
  id                  String   @id @default(cuid())
  searchQuery         String
  userId              String?

  // ThriftAI product (if exists)
  thriftaiProductId   String?
  thriftaiProduct     Product? @relation(fields: [thriftaiProductId], references: [id])

  // External matches
  amazonProductId     String?
  amazonProduct       ExternalProduct? @relation(fields: [amazonProductId], references: [id])

  ebayProductId       String?
  ebayProduct         ExternalProduct? @relation(fields: [ebayProductId], references: [id])

  // Best deal analysis
  bestDealSource      String   // 'thriftai', 'amazon', 'ebay', etc.
  bestDealPrice       Float
  estimatedSavings    Float

  // Analytics
  userClicked         Boolean  @default(false)
  clickedSource       String?

  createdAt           DateTime @default(now())

  user                User?    @relation(fields: [userId], references: [id])

  @@index([searchQuery])
  @@index([userId])
  @@map("product_comparisons")
}

// Affiliate tracking
model AffiliateClick {
  id                String          @id @default(cuid())
  userId            String?
  sessionId         String

  // Product info
  source            ExternalSource
  externalProductId String
  productTitle      String

  // Affiliate details
  affiliateUrl      String
  referralCode      String

  // Financial
  estimatedPrice    Float
  expectedCommission Float?

  // Status
  clicked           Boolean         @default(false)
  clickedAt         DateTime?

  converted         Boolean         @default(false)
  convertedAt       DateTime?
  commissionEarned  Float?

  createdAt         DateTime        @default(now())

  user              User?           @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([source])
  @@index([clicked, converted])
  @@map("affiliate_clicks")
}
```

---

## 🔌 API Integration Implementations

### 1. Amazon Product Advertising API

**File:** `src/lib/integrations/amazon/amazonAdapter.ts`

```typescript
import crypto from 'crypto'
import axios from 'axios'

interface AmazonConfig {
  accessKey: string
  secretKey: string
  partnerTag: string
  region: string
}

interface AmazonSearchParams {
  keywords: string
  category?: string
  minPrice?: number
  maxPrice?: number
  limit?: number
}

interface AmazonProduct {
  asin: string
  title: string
  brand?: string
  price: number
  originalPrice?: number
  imageUrl?: string
  productUrl: string
  affiliateUrl: string
  rating?: number
  reviewCount?: number
  availability: boolean
}

export class AmazonAdapter {
  private config: AmazonConfig
  private endpoint: string

  constructor() {
    this.config = {
      accessKey: process.env.AMAZON_ACCESS_KEY!,
      secretKey: process.env.AMAZON_SECRET_KEY!,
      partnerTag: process.env.AMAZON_PARTNER_TAG!,
      region: 'us-east-1'
    }
    this.endpoint = 'https://webservices.amazon.com/paapi5/searchitems'
  }

  async searchProducts(params: AmazonSearchParams): Promise<AmazonProduct[]> {
    try {
      const request = this.buildSearchRequest(params)
      const response = await axios.post(this.endpoint, request, {
        headers: this.getSignedHeaders(request)
      })

      return this.parseSearchResponse(response.data)
    } catch (error) {
      console.error('Amazon API error:', error)
      return []
    }
  }

  private buildSearchRequest(params: AmazonSearchParams) {
    return {
      PartnerTag: this.config.partnerTag,
      PartnerType: 'Associates',
      Keywords: params.keywords,
      SearchIndex: this.mapCategoryToSearchIndex(params.category),
      ItemCount: params.limit || 10,
      MinPrice: params.minPrice ? params.minPrice * 100 : undefined, // cents
      MaxPrice: params.maxPrice ? params.maxPrice * 100 : undefined,
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'ItemInfo.ByLineInfo',
        'Offers.Listings.Price',
        'Offers.Listings.Condition',
        'Offers.Listings.Availability',
        'CustomerReviews.StarRating',
        'CustomerReviews.Count'
      ]
    }
  }

  private getSignedHeaders(payload: any): Record<string, string> {
    const timestamp = new Date().toISOString()
    const canonicalRequest = JSON.stringify(payload)

    // AWS Signature Version 4
    const signature = this.generateSignature(canonicalRequest, timestamp)

    return {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Amz-Date': timestamp,
      'Authorization': signature,
      'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
      'Content-Encoding': 'amz-1.0'
    }
  }

  private generateSignature(payload: string, timestamp: string): string {
    // Implement AWS Signature V4
    // See: https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html

    const kDate = crypto
      .createHmac('sha256', `AWS4${this.config.secretKey}`)
      .update(timestamp.split('T')[0])
      .digest()

    const kRegion = crypto
      .createHmac('sha256', kDate)
      .update(this.config.region)
      .digest()

    const kService = crypto
      .createHmac('sha256', kRegion)
      .update('ProductAdvertisingAPI')
      .digest()

    const kSigning = crypto
      .createHmac('sha256', kService)
      .update('aws4_request')
      .digest()

    const signature = crypto
      .createHmac('sha256', kSigning)
      .update(payload)
      .digest('hex')

    return `AWS4-HMAC-SHA256 Credential=${this.config.accessKey}/${timestamp.split('T')[0]}/${this.config.region}/ProductAdvertisingAPI/aws4_request, SignedHeaders=content-type;host;x-amz-date;x-amz-target, Signature=${signature}`
  }

  private parseSearchResponse(data: any): AmazonProduct[] {
    if (!data.SearchResult?.Items) return []

    return data.SearchResult.Items.map((item: any) => ({
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || 'Unknown',
      brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
      price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
      originalPrice: item.Offers?.Listings?.[0]?.SavingBasis?.Amount,
      imageUrl: item.Images?.Primary?.Large?.URL,
      productUrl: item.DetailPageURL,
      affiliateUrl: this.buildAffiliateUrl(item.ASIN),
      rating: item.CustomerReviews?.StarRating?.Value,
      reviewCount: item.CustomerReviews?.Count || 0,
      availability: item.Offers?.Listings?.[0]?.Availability?.Type === 'Now'
    }))
  }

  private buildAffiliateUrl(asin: string): string {
    return `https://www.amazon.com/dp/${asin}?tag=${this.config.partnerTag}`
  }

  private mapCategoryToSearchIndex(category?: string): string {
    const mapping: Record<string, string> = {
      'CLOTHING': 'Fashion',
      'SHOES': 'Shoes',
      'ELECTRONICS': 'Electronics',
      'ACCESSORIES': 'Jewelry',
      'HOME': 'HomeAndKitchen',
      'BOOKS': 'Books'
    }
    return category ? mapping[category] || 'All' : 'All'
  }
}
```

### 2. eBay Finding API

**File:** `src/lib/integrations/ebay/ebayAdapter.ts`

```typescript
import axios from 'axios'

interface EbayConfig {
  appId: string
  certId: string
  devId: string
  ruName: string
}

interface EbaySearchParams {
  keywords: string
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  condition?: 'New' | 'Used'
  limit?: number
}

interface EbayProduct {
  itemId: string
  title: string
  price: number
  shippingCost: number
  condition: string
  imageUrl?: string
  productUrl: string
  affiliateUrl: string
  sellerRating: number
  location: string
  endTime: string
}

export class EbayAdapter {
  private config: EbayConfig
  private endpoint: string

  constructor() {
    this.config = {
      appId: process.env.EBAY_APP_ID!,
      certId: process.env.EBAY_CERT_ID!,
      devId: process.env.EBAY_DEV_ID!,
      ruName: process.env.EBAY_RU_NAME!
    }
    this.endpoint = 'https://svcs.ebay.com/services/search/FindingService/v1'
  }

  async searchProducts(params: EbaySearchParams): Promise<EbayProduct[]> {
    try {
      const url = this.buildSearchUrl(params)
      const response = await axios.get(url, {
        headers: {
          'X-EBAY-SOA-SECURITY-APPNAME': this.config.appId
        }
      })

      return this.parseSearchResponse(response.data)
    } catch (error) {
      console.error('eBay API error:', error)
      return []
    }
  }

  private buildSearchUrl(params: EbaySearchParams): string {
    const baseUrl = `${this.endpoint}?OPERATION-NAME=findItemsAdvanced`
    const queryParams = [
      `SECURITY-APPNAME=${this.config.appId}`,
      `RESPONSE-DATA-FORMAT=JSON`,
      `REST-PAYLOAD`,
      `keywords=${encodeURIComponent(params.keywords)}`,
      `paginationInput.entriesPerPage=${params.limit || 25}`,
      `sortOrder=PricePlusShippingLowest`
    ]

    if (params.categoryId) {
      queryParams.push(`categoryId=${params.categoryId}`)
    }

    if (params.minPrice) {
      queryParams.push(`itemFilter(0).name=MinPrice`)
      queryParams.push(`itemFilter(0).value=${params.minPrice}`)
    }

    if (params.maxPrice) {
      queryParams.push(`itemFilter(1).name=MaxPrice`)
      queryParams.push(`itemFilter(1).value=${params.maxPrice}`)
    }

    if (params.condition) {
      queryParams.push(`itemFilter(2).name=Condition`)
      queryParams.push(`itemFilter(2).value=${params.condition}`)
    }

    // Only show "Buy It Now" items
    queryParams.push(`itemFilter(3).name=ListingType`)
    queryParams.push(`itemFilter(3).value=FixedPrice`)

    return `${baseUrl}&${queryParams.join('&')}`
  }

  private parseSearchResponse(data: any): EbayProduct[] {
    const items = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item
    if (!items) return []

    return items.map((item: any) => ({
      itemId: item.itemId?.[0],
      title: item.title?.[0] || 'Unknown',
      price: parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0'),
      shippingCost: parseFloat(item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__ || '0'),
      condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Unknown',
      imageUrl: item.galleryURL?.[0],
      productUrl: item.viewItemURL?.[0],
      affiliateUrl: this.buildAffiliateUrl(item.itemId?.[0]),
      sellerRating: parseFloat(item.sellerInfo?.[0]?.feedbackScore?.[0] || '0'),
      location: item.location?.[0] || 'Unknown',
      endTime: item.listingInfo?.[0]?.endTime?.[0]
    }))
  }

  private buildAffiliateUrl(itemId: string): string {
    // eBay Partner Network affiliate link
    const campaignId = process.env.EBAY_CAMPAIGN_ID || '5338892896'
    return `https://rover.ebay.com/rover/1/711-53200-19255-0/1?icep_id=114&ipn=icep&toolid=20004&campid=${campaignId}&mpre=https://www.ebay.com/itm/${itemId}`
  }

  private mapCategoryToEbayId(category?: string): string | undefined {
    const mapping: Record<string, string> = {
      'CLOTHING': '11450',    // Clothing, Shoes & Accessories > Men's Clothing
      'SHOES': '93427',       // Men's Shoes
      'ELECTRONICS': '293',   // Consumer Electronics
      'ACCESSORIES': '4251',  // Jewelry & Watches
      'HOME': '11700'         // Home & Garden
    }
    return category ? mapping[category] : undefined
  }
}
```

### 3. Nike/Adidas Brand APIs

**File:** `src/lib/integrations/brands/nikeAdapter.ts`

```typescript
// Note: Nike doesn't have a public API
// Options: 1) Web scraping (use with caution)
//         2) Affiliate network APIs (Commission Junction, ShareASale)
//         3) Wait for official API access

import axios from 'axios'

interface BrandProduct {
  id: string
  brand: 'Nike' | 'Adidas'
  title: string
  price: number
  imageUrl: string
  productUrl: string
  affiliateUrl: string
  sizes: string[]
  colors: string[]
  category: string
}

export class BrandAdapter {
  // Use affiliate network API (Commission Junction example)
  private cjApiKey: string

  constructor() {
    this.cjApiKey = process.env.CJ_API_KEY!
  }

  async searchNikeProducts(keywords: string): Promise<BrandProduct[]> {
    try {
      // Commission Junction Product Search API
      const response = await axios.get('https://product-search.api.cj.com/v2/product-search', {
        headers: {
          'Authorization': `Bearer ${this.cjApiKey}`
        },
        params: {
          'website-id': process.env.CJ_WEBSITE_ID,
          'advertiser-ids': 'nike',  // Nike's CJ advertiser ID
          'keywords': keywords,
          'records-per-page': 20
        }
      })

      return this.parseProducts(response.data, 'Nike')
    } catch (error) {
      console.error('Nike API error:', error)
      return []
    }
  }

  async searchAdidasProducts(keywords: string): Promise<BrandProduct[]> {
    try {
      const response = await axios.get('https://product-search.api.cj.com/v2/product-search', {
        headers: {
          'Authorization': `Bearer ${this.cjApiKey}`
        },
        params: {
          'website-id': process.env.CJ_WEBSITE_ID,
          'advertiser-ids': 'adidas',
          'keywords': keywords,
          'records-per-page': 20
        }
      })

      return this.parseProducts(response.data, 'Adidas')
    } catch (error) {
      console.error('Adidas API error:', error)
      return []
    }
  }

  private parseProducts(data: any, brand: 'Nike' | 'Adidas'): BrandProduct[] {
    // Parse Commission Junction response
    // Actual implementation depends on CJ API structure
    return []
  }
}
```

---

## 🔄 Aggregation Service

**File:** `src/lib/services/marketplaceAggregator.ts`

```typescript
import { AmazonAdapter } from '@/lib/integrations/amazon/amazonAdapter'
import { EbayAdapter } from '@/lib/integrations/ebay/ebayAdapter'
import { BrandAdapter } from '@/lib/integrations/brands/nikeAdapter'
import { prisma } from '@/lib/prisma'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
})

interface AggregatedSearchParams {
  query: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sources?: ('thriftai' | 'amazon' | 'ebay' | 'nike' | 'adidas')[]
}

interface AggregatedProduct {
  source: string
  id: string
  title: string
  brand?: string
  price: number
  originalPrice?: number
  shippingCost?: number
  totalCost: number
  imageUrl?: string
  productUrl: string
  affiliateUrl?: string
  rating?: number
  condition?: string
  availability: boolean
  metadata?: any
}

export class MarketplaceAggregator {
  private amazonAdapter: AmazonAdapter
  private ebayAdapter: EbayAdapter
  private brandAdapter: BrandAdapter

  constructor() {
    this.amazonAdapter = new AmazonAdapter()
    this.ebayAdapter = new EbayAdapter()
    this.brandAdapter = new BrandAdapter()
  }

  async searchAllMarketplaces(params: AggregatedSearchParams): Promise<{
    results: AggregatedProduct[]
    bestDeal: AggregatedProduct | null
    insights: {
      totalFound: number
      averagePrice: number
      priceRange: { min: number; max: number }
      sourceBreakdown: Record<string, number>
    }
  }> {
    const sources = params.sources || ['thriftai', 'amazon', 'ebay']

    // Check cache first
    const cacheKey = `search:${JSON.stringify(params)}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached as string)
    }

    // Search all sources in parallel
    const searchPromises = sources.map(source =>
      this.searchSource(source, params).catch(err => {
        console.error(`${source} search failed:`, err)
        return []
      })
    )

    const results = await Promise.all(searchPromises)
    const allProducts = results.flat()

    // Deduplicate similar products
    const deduplicated = this.deduplicateProducts(allProducts)

    // Sort by total cost (price + shipping)
    deduplicated.sort((a, b) => a.totalCost - b.totalCost)

    // Find best deal
    const bestDeal = deduplicated[0] || null

    // Calculate insights
    const insights = this.calculateInsights(deduplicated)

    const response = {
      results: deduplicated,
      bestDeal,
      insights
    }

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(response))

    return response
  }

  private async searchSource(
    source: string,
    params: AggregatedSearchParams
  ): Promise<AggregatedProduct[]> {
    switch (source) {
      case 'thriftai':
        return this.searchThriftAI(params)
      case 'amazon':
        return this.searchAmazon(params)
      case 'ebay':
        return this.searchEbay(params)
      case 'nike':
        return this.searchNike(params)
      case 'adidas':
        return this.searchAdidas(params)
      default:
        return []
    }
  }

  private async searchThriftAI(params: AggregatedSearchParams): Promise<AggregatedProduct[]> {
    const products = await prisma.product.findMany({
      where: {
        name: { contains: params.query, mode: 'insensitive' },
        isAvailable: true,
        price: {
          gte: params.minPrice,
          lte: params.maxPrice
        },
        category: params.category
      },
      take: 20,
      include: {
        seller: {
          select: { businessName: true, rating: true }
        }
      }
    })

    return products.map(product => ({
      source: 'thriftai',
      id: product.id,
      title: product.name,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice,
      shippingCost: 5, // Estimate, should be calculated
      totalCost: product.price + 5,
      imageUrl: product.imageUrl,
      productUrl: `/products/${product.id}`,
      condition: product.condition,
      availability: true,
      metadata: { seller: product.seller }
    }))
  }

  private async searchAmazon(params: AggregatedSearchParams): Promise<AggregatedProduct[]> {
    const results = await this.amazonAdapter.searchProducts({
      keywords: params.query,
      category: params.category,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      limit: 20
    })

    return results.map(product => ({
      source: 'amazon',
      id: product.asin,
      title: product.title,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice,
      shippingCost: 0, // Amazon often has free shipping
      totalCost: product.price,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      affiliateUrl: product.affiliateUrl,
      rating: product.rating,
      condition: 'New',
      availability: product.availability
    }))
  }

  private async searchEbay(params: AggregatedSearchParams): Promise<AggregatedProduct[]> {
    const results = await this.ebayAdapter.searchProducts({
      keywords: params.query,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      limit: 20
    })

    return results.map(product => ({
      source: 'ebay',
      id: product.itemId,
      title: product.title,
      price: product.price,
      shippingCost: product.shippingCost,
      totalCost: product.price + product.shippingCost,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      affiliateUrl: product.affiliateUrl,
      condition: product.condition,
      availability: true,
      metadata: { sellerRating: product.sellerRating, location: product.location }
    }))
  }

  private async searchNike(params: AggregatedSearchParams): Promise<AggregatedProduct[]> {
    const results = await this.brandAdapter.searchNikeProducts(params.query)
    return results.map(product => ({
      source: 'nike',
      id: product.id,
      title: product.title,
      brand: 'Nike',
      price: product.price,
      shippingCost: 0,
      totalCost: product.price,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      affiliateUrl: product.affiliateUrl,
      condition: 'New',
      availability: true
    }))
  }

  private async searchAdidas(params: AggregatedSearchParams): Promise<AggregatedProduct[]> {
    const results = await this.brandAdapter.searchAdidasProducts(params.query)
    return results.map(product => ({
      source: 'adidas',
      id: product.id,
      title: product.title,
      brand: 'Adidas',
      price: product.price,
      shippingCost: 0,
      totalCost: product.price,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      affiliateUrl: product.affiliateUrl,
      condition: 'New',
      availability: true
    }))
  }

  private deduplicateProducts(products: AggregatedProduct[]): AggregatedProduct[] {
    // Simple deduplication based on title similarity
    // TODO: Use more sophisticated matching (embeddings, brand+model, etc.)
    const seen = new Set<string>()
    return products.filter(product => {
      const key = `${product.brand}-${product.title.toLowerCase().slice(0, 50)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private calculateInsights(products: AggregatedProduct[]) {
    const prices = products.map(p => p.totalCost)
    const sourceBreakdown = products.reduce((acc, p) => {
      acc[p.source] = (acc[p.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalFound: products.length,
      averagePrice: prices.length > 0
        ? prices.reduce((a, b) => a + b, 0) / prices.length
        : 0,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      },
      sourceBreakdown
    }
  }
}
```

---

## 🎨 Frontend - Comparison UI

**File:** `src/components/ProductComparison.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { TrendingUp, TrendingDown, ExternalLink, Check, X } from 'lucide-react'

interface ComparisonProduct {
  source: string
  title: string
  price: number
  totalCost: number
  imageUrl?: string
  productUrl: string
  affiliateUrl?: string
  condition?: string
  rating?: number
}

interface ComparisonProps {
  query: string
}

export default function ProductComparison({ query }: ComparisonProps) {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<ComparisonProduct[]>([])
  const [bestDeal, setBestDeal] = useState<ComparisonProduct | null>(null)

  useEffect(() => {
    fetchComparison()
  }, [query])

  const fetchComparison = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/marketplace/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      const data = await response.json()
      setResults(data.results)
      setBestDeal(data.bestDeal)
    } catch (error) {
      console.error('Comparison failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading comparison...</div>
  }

  return (
    <div className="space-y-6">
      {/* Best Deal Highlight */}
      {bestDeal && (
        <div className="bg-green-900/20 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 relative rounded-lg overflow-hidden bg-gray-800">
                {bestDeal.imageUrl && (
                  <Image
                    src={bestDeal.imageUrl}
                    alt={bestDeal.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <span className="text-green-500 font-bold text-lg">Best Deal</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{bestDeal.title}</h3>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-green-500">
                  ${bestDeal.totalCost.toFixed(2)}
                </span>
                <span className="text-gray-400">from {bestDeal.source}</span>
              </div>
              <a
                href={bestDeal.affiliateUrl || bestDeal.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
              >
                View Deal <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-4 text-left">Source</th>
              <th className="px-6 py-4 text-left">Product</th>
              <th className="px-6 py-4 text-right">Price</th>
              <th className="px-6 py-4 text-right">Total Cost</th>
              <th className="px-6 py-4 text-center">Condition</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {results.map((product, idx) => (
              <tr
                key={idx}
                className={`border-t border-gray-800 ${
                  product === bestDeal ? 'bg-green-900/10' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <span className="font-semibold capitalize">{product.source}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {product.imageUrl && (
                      <div className="w-12 h-12 relative rounded overflow-hidden bg-gray-800">
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <span className="line-clamp-2">{product.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-semibold">
                  ${product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-lg font-bold">
                    ${product.totalCost.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                    {product.condition || 'New'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <a
                    href={product.affiliateUrl || product.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## 📊 Rate Limiting & Caching

**File:** `src/lib/utils/rateLimiter.ts`

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
})

interface RateLimitConfig {
  requests: number
  windowMs: number
}

// API rate limits
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  amazon: { requests: 1, windowMs: 1000 },      // 1 req/sec
  ebay: { requests: 5, windowMs: 1000 },        // 5 req/sec
  nike: { requests: 10, windowMs: 60000 },      // 10 req/min
  adidas: { requests: 10, windowMs: 60000 }     // 10 req/min
}

export async function checkRateLimit(source: string): Promise<boolean> {
  const config = RATE_LIMITS[source]
  if (!config) return true

  const key = `ratelimit:${source}`
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.pexpire(key, config.windowMs)
  }

  return current <= config.requests
}

export async function waitForRateLimit(source: string): Promise<void> {
  while (!(await checkRateLimit(source))) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}
```

---

## 🚀 Implementation Checklist

### Week 1: Setup & Amazon
- [ ] Create API accounts (Amazon PA, eBay Developer)
- [ ] Set up environment variables
- [ ] Implement Amazon adapter
- [ ] Test Amazon search
- [ ] Add rate limiting
- [ ] Implement caching layer

### Week 2: eBay & Brand APIs
- [ ] Implement eBay adapter
- [ ] Test eBay search
- [ ] Research brand API options
- [ ] Implement brand adapters (CJ/ShareASale)
- [ ] Test brand searches

### Week 3: Aggregation & Frontend
- [ ] Build aggregation service
- [ ] Implement deduplication logic
- [ ] Create comparison UI
- [ ] Add "Best Deal" highlighting
- [ ] Test end-to-end flow

### Week 4: Analytics & Optimization
- [ ] Add affiliate tracking
- [ ] Implement analytics
- [ ] Optimize performance
- [ ] Add error handling
- [ ] Launch beta

---

## 📈 Success Metrics

Track these metrics:
- API call success rate per source
- Average response time per source
- Cache hit rate
- Affiliate click-through rate
- Conversion rate by source
- Revenue per search

---

**Ready to 10x your inventory! Start with Amazon integration, then expand to other platforms.** 🚀
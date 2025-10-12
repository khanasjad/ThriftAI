# Affiliate APIs for Real Product Data

## Overview
This document explains how to integrate real product data with affiliate links into ThriftAI using legitimate affiliate program APIs.

---

## 1. Amazon Product Advertising API (PA-API 5.0) ⭐ RECOMMENDED

### Why Amazon PA-API?
- ✅ Official Amazon API (no scraping violations)
- ✅ Real product data: titles, prices, images, reviews
- ✅ Automatic affiliate links (earn commission on sales)
- ✅ 8,640 requests/day on free tier
- ✅ 150+ million products available
- ✅ Multiple images per product
- ✅ Real-time pricing and availability

### Setup Steps

#### Step 1: Create Amazon Associate Account
1. Go to https://affiliate-program.amazon.com/
2. Sign up for Amazon Associates program
3. Get your **Associate Tag** (e.g., `thriftai-20`)

#### Step 2: Get API Credentials
1. Go to https://webservices.amazon.com/paapi5/documentation/
2. Register for Product Advertising API access
3. Get your:
   - **Access Key** (e.g., `AKIAIOSFODNN7EXAMPLE`)
   - **Secret Key** (e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

#### Step 3: Install SDK
```bash
npm install paapi5-nodejs-sdk
```

#### Step 4: Environment Variables
Add to `.env`:
```env
AMAZON_ACCESS_KEY=your_access_key_here
AMAZON_SECRET_KEY=your_secret_key_here
AMAZON_ASSOCIATE_TAG=your_associate_tag_here
AMAZON_REGION=us-east-1
```

### Code Implementation

#### `/src/lib/affiliates/amazonPaapi.ts`
```typescript
import ProductAdvertisingAPIv1 from 'paapi5-nodejs-sdk'

interface AmazonProduct {
  asin: string
  title: string
  brand: string
  price: number
  listPrice: number
  images: string[]
  affiliateUrl: string
  rating: number
  reviewCount: number
  availability: string
  isPrime: boolean
  features: string[]
}

export class AmazonPAAPI {
  private api: any
  private partnerTag: string

  constructor() {
    const client = ProductAdvertisingAPIv1.ApiClient.instance
    client.accessKey = process.env.AMAZON_ACCESS_KEY!
    client.secretKey = process.env.AMAZON_SECRET_KEY!
    client.host = 'webservices.amazon.com'
    client.region = process.env.AMAZON_REGION || 'us-east-1'

    this.api = new ProductAdvertisingAPIv1.DefaultApi()
    this.partnerTag = process.env.AMAZON_ASSOCIATE_TAG!
  }

  /**
   * Search for products by keyword
   */
  async searchProducts(keyword: string, limit: number = 10): Promise<AmazonProduct[]> {
    try {
      const searchRequest = new ProductAdvertisingAPIv1.SearchItemsRequest()
      searchRequest.PartnerTag = this.partnerTag
      searchRequest.PartnerType = 'Associates'
      searchRequest.Keywords = keyword
      searchRequest.ItemCount = limit
      searchRequest.Resources = [
        'Images.Primary.Large',
        'Images.Variants.Large',
        'ItemInfo.Title',
        'ItemInfo.ByLineInfo',
        'ItemInfo.Features',
        'Offers.Listings.Price',
        'Offers.Listings.Availability.Message',
        'Offers.Listings.DeliveryInfo.IsPrimeEligible',
        'CustomerReviews.Count',
        'CustomerReviews.StarRating'
      ]

      const data = await this.api.searchItems(searchRequest)

      if (!data.SearchResult?.Items) {
        return []
      }

      return data.SearchResult.Items.map((item: any) => this.parseProduct(item))
    } catch (error) {
      console.error('Amazon PA-API Error:', error)
      return []
    }
  }

  /**
   * Get product by ASIN
   */
  async getProduct(asin: string): Promise<AmazonProduct | null> {
    try {
      const getItemsRequest = new ProductAdvertisingAPIv1.GetItemsRequest()
      getItemsRequest.PartnerTag = this.partnerTag
      getItemsRequest.PartnerType = 'Associates'
      getItemsRequest.ItemIds = [asin]
      getItemsRequest.Resources = [
        'Images.Primary.Large',
        'Images.Variants.Large',
        'ItemInfo.Title',
        'ItemInfo.ByLineInfo',
        'ItemInfo.Features',
        'Offers.Listings.Price',
        'Offers.Listings.Availability.Message',
        'Offers.Listings.DeliveryInfo.IsPrimeEligible',
        'CustomerReviews.Count',
        'CustomerReviews.StarRating'
      ]

      const data = await this.api.getItems(getItemsRequest)

      if (!data.ItemsResult?.Items?.[0]) {
        return null
      }

      return this.parseProduct(data.ItemsResult.Items[0])
    } catch (error) {
      console.error('Amazon PA-API Error:', error)
      return null
    }
  }

  /**
   * Parse Amazon API response into our product format
   */
  private parseProduct(item: any): AmazonProduct {
    const images: string[] = []

    // Primary image
    if (item.Images?.Primary?.Large?.URL) {
      images.push(item.Images.Primary.Large.URL)
    }

    // Variant images (multiple angles)
    if (item.Images?.Variants) {
      for (const variant of item.Images.Variants) {
        if (variant.Large?.URL) {
          images.push(variant.Large.URL)
        }
      }
    }

    const price = item.Offers?.Listings?.[0]?.Price?.Amount || 0
    const listPrice = item.Offers?.Listings?.[0]?.SavingBasis?.Amount || price

    return {
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || '',
      brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || '',
      price: price,
      listPrice: listPrice,
      images: images,
      affiliateUrl: item.DetailPageURL, // This URL includes your affiliate tag!
      rating: parseFloat(item.CustomerReviews?.StarRating?.Value || '0'),
      reviewCount: item.CustomerReviews?.Count || 0,
      availability: item.Offers?.Listings?.[0]?.Availability?.Message || 'Available',
      isPrime: item.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible || false,
      features: item.ItemInfo?.Features?.DisplayValues || []
    }
  }
}
```

#### `/scripts/seed-from-amazon-paapi.ts`
```typescript
#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/prisma'
import { AmazonPAAPI } from '../src/lib/affiliates/amazonPaapi'

const PRODUCT_QUERIES = [
  'Apple iPhone 15 Pro',
  'Samsung Galaxy S24 Ultra',
  'Apple MacBook Air M2',
  'Sony WH-1000XM5 Headphones',
  'Apple AirPods Pro 2',
  'Nike Air Force 1',
  'Adidas Ultraboost',
  'Levi 501 Jeans',
  'North Face Jacket',
  'Ray-Ban Aviator Sunglasses'
]

async function main() {
  console.log('🚀 Seeding Real Products from Amazon PA-API')
  console.log('=' .repeat(80))

  const amazonApi = new AmazonPAAPI()
  let totalSaved = 0

  for (const query of PRODUCT_QUERIES) {
    console.log(`\n🔍 Searching: "${query}"`)

    const products = await amazonApi.searchProducts(query, 5)

    for (const product of products) {
      try {
        // Get or create seller
        const sellerId = await getOrCreateSeller(product.brand)

        // Save to database
        await prisma.product.create({
          data: {
            name: product.title,
            description: `Genuine ${product.brand} product from Amazon. ${product.features.slice(0, 3).join('. ')}`,
            price: product.price,
            originalPrice: product.listPrice,
            brand: product.brand,
            category: 'ELECTRONICS', // Categorize based on query
            condition: 'New',
            imageUrl: JSON.stringify(product.images), // Multiple images for carousel!
            seller: { connect: { id: sellerId } },
            isAvailable: product.availability.includes('In Stock'),
            isAuthentic: true,

            // Affiliate data
            dynamicSpecs: {
              source: 'Amazon PA-API',
              asin: product.asin,
              affiliateUrl: product.affiliateUrl, // ⭐ AFFILIATE LINK!
              isPrime: product.isPrime,
              rating: product.rating,
              reviewCount: product.reviewCount,
              availability: product.availability
            },

            // Quality metrics
            qualityScore: product.rating * 20, // Convert 5-star to 100-point
            hasFreeShipping: product.isPrime,
            hasFreeReturns: product.isPrime,
            estimatedDeliveryDays: product.isPrime ? 2 : 5,
          }
        })

        totalSaved++
        console.log(`  ✅ ${product.title} - $${product.price} (${product.images.length} images)`)
      } catch (error) {
        console.error(`  ❌ Error saving product:`, error)
      }
    }

    // Rate limiting (PA-API allows 1 request/second)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`\n✅ Saved ${totalSaved} real products with affiliate links!`)
  process.exit(0)
}

main().catch(console.error)
```

### Benefits
1. ✅ **Legal & Official** - No scraping, no violations
2. ✅ **Earn Commissions** - 1-10% on every sale through your affiliate links
3. ✅ **Real Data** - Actual prices, images, reviews from Amazon
4. ✅ **Multiple Images** - 5-8 images per product for carousel
5. ✅ **Always Updated** - Prices and availability are real-time
6. ✅ **High Quality** - Amazon's product data is well-structured

---

## 2. eBay Partner Network API

### Setup
```bash
npm install ebay-api
```

### Code
```typescript
import { EBay } from 'ebay-api'

const ebay = new EBay({
  appId: process.env.EBAY_APP_ID!,
  certId: process.env.EBAY_CERT_ID!,
  sandbox: false
})

const results = await ebay.buy.browse.search({
  q: 'Apple iPhone 15 Pro',
  limit: 50,
  filter: 'buyingOptions:{FIXED_PRICE}',
  fieldgroups: 'EXTENDED'
})

// results.itemSummaries contains real eBay listings
```

**Sign up**: https://developer.ebay.com/

---

## 3. Multiple Affiliate Networks

You can also integrate multiple sources:

```typescript
// Aggregate from multiple APIs
async function searchAllSources(query: string) {
  const [amazonProducts, ebayProducts, rakutenProducts] = await Promise.all([
    amazonApi.searchProducts(query, 10),
    ebayApi.search(query, 10),
    rakutenApi.search(query, 10)
  ])

  return [...amazonProducts, ...ebayProducts, ...rakutenProducts]
}
```

---

## Commission Rates

| Platform | Commission Rate | Cookie Duration |
|----------|----------------|-----------------|
| Amazon Associates | 1-10% (category dependent) | 24 hours |
| eBay Partner Network | 50-70% of eBay revenue | 24 hours |
| Rakuten | 2-20% (merchant dependent) | 30-90 days |
| ShareASale | 5-25% (merchant dependent) | 30-90 days |

---

## Next Steps

1. **Choose Amazon PA-API** (easiest to start, most products)
2. **Sign up for Amazon Associates** (https://affiliate-program.amazon.com/)
3. **Get API credentials** (https://webservices.amazon.com/)
4. **Install SDK**: `npm install paapi5-nodejs-sdk`
5. **Add credentials to `.env`**
6. **Run seed script**: `npx tsx scripts/seed-from-amazon-paapi.ts`
7. **Start earning commissions** on every sale! 💰

---

## Legal Considerations

✅ **DO**:
- Use official affiliate APIs
- Display "As an Amazon Associate I earn from qualifying purchases"
- Follow each network's terms of service
- Include proper affiliate disclosures

❌ **DON'T**:
- Scrape product pages (violates TOS)
- Hide affiliate links
- Manipulate prices
- Click your own affiliate links

---

## Support

- Amazon PA-API Docs: https://webservices.amazon.com/paapi5/documentation/
- Amazon Associates Help: https://affiliate-program.amazon.com/help
- eBay Developer: https://developer.ebay.com/

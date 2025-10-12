# 🛒 Affiliate API Setup Guide for ThriftAI

## Quick Start: Amazon Product Advertising API ⭐

The **Amazon PA-API** is the recommended starting point because:
- ✅ Official API (no scraping violations)
- ✅ 150+ million real products
- ✅ Multiple images per product (5-8 images)
- ✅ Affiliate links included automatically
- ✅ Earn 1-10% commission on sales
- ✅ Free tier: 8,640 requests/day
- ✅ Real-time pricing and availability

---

## Step-by-Step Setup

### 1. Sign Up for Amazon Associates

1. Go to: https://affiliate-program.amazon.com/
2. Click "**Join Now for Free**"
3. Fill out the application form:
   - Website/mobile app info (you can use `http://localhost:3000` for testing)
   - How you drive traffic
   - Topics you cover (e-commerce, shopping comparison, etc.)
4. Complete the tax interview
5. Get your **Associate Tag** (e.g., `thriftai-20`)
   - This will be in your URLs: `amazon.com/dp/B0XXXXX?tag=thriftai-20`

### 2. Get API Credentials

1. Go to: https://webservices.amazon.com/paapi5/documentation/register-for-pa-api.html
2. Sign in with your Amazon Associates account
3. **Request API access**:
   - Fill out the PA-API registration form
   - You must have completed **3 sales** in the past 180 days to get approved
   - **OR** you can start with the "free trial" mode for testing
4. Once approved, get your credentials:
   - **Access Key** (e.g., `AKIAIOSFODNN7EXAMPLE`)
   - **Secret Key** (e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

### 3. Add Credentials to Environment

Create/update your `.env` file:

```bash
# Amazon Product Advertising API
AMAZON_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
AMAZON_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AMAZON_ASSOCIATE_TAG=thriftai-20
AMAZON_REGION=us-east-1
```

### 4. Install Dependencies

```bash
npm install paapi5-nodejs-sdk --legacy-peer-deps
```

### 5. Seed Real Products

```bash
npx tsx scripts/seed-from-amazon-paapi.ts
```

**Expected Output:**
```
🚀 Seeding Real Products from Amazon PA-API
================================================================================

📂 Category: ELECTRONICS
--------------------------------------------------------------------------------
  🔍 Searching Amazon for: "Apple iPhone 15 Pro"
  ✅ Amazon PA-API initialized
  🔍 Amazon PA-API: Searching for "Apple iPhone 15 Pro"...
  ✅ Found 5 products for "Apple iPhone 15 Pro"
  ✅ Saved: Apple iPhone 15 Pro Max 256GB - Natural Titanium...
     $1199.00 | 7 images | 4.8★ (2341 reviews) | ⚡ Prime
  ✅ Saved: Apple iPhone 15 Pro 128GB - Blue Titanium...
     $999.00 | 6 images | 4.7★ (1823 reviews) | ⚡ Prime
...

✅ SEEDING COMPLETE!
================================================================================

📊 Summary:
   Products Found: 225
   Products Saved: 225

📂 By Category:
   - ELECTRONICS: 75 products
   - CLOTHING: 50 products
   - SHOES: 50 products
   - ACCESSORIES: 25 products
   - HOME: 25 products

🏢 By Brand (Top 10):
   - Apple: 35 products
   - Nike: 28 products
   - Samsung: 22 products
   - Sony: 18 products
   - Adidas: 16 products

🎯 All products are GENUINE from Amazon:
   ✅ Real product names and model numbers
   ✅ Actual Amazon marketplace prices
   ✅ Multiple high-quality images (5-8 per product)
   ✅ Affiliate URLs included (earn commission!)

💰 Affiliate Earnings:
   Every sale through your links earns 1-10% commission!
   Track earnings at: https://affiliate-program.amazon.com/
```

---

## How It Works

### 1. Product Search
```typescript
const amazonApi = getAmazonApi()
const products = await amazonApi.searchProducts('Apple iPhone 15 Pro', 10)
// Returns: Real products with prices, images, ratings
```

### 2. Automatic Affiliate Links
Every product includes an **affiliate URL**:
```typescript
{
  asin: 'B0CHX1W1YY',
  title: 'Apple iPhone 15 Pro Max',
  price: 1199.00,
  affiliateUrl: 'https://www.amazon.com/dp/B0CHX1W1YY?tag=thriftai-20',
  //                                                    ^^^^^^^^^^^^^^
  //                                                    Your affiliate tag!
  images: [
    'https://m.media-amazon.com/images/I/81SigpJN1KL._AC_SL1500_.jpg',
    'https://m.media-amazon.com/images/I/81CgtwSII3L._AC_SL1500_.jpg',
    'https://m.media-amazon.com/images/I/81gwR8LhjFL._AC_SL1500_.jpg'
  ]
}
```

### 3. Stored in Database
```typescript
await prisma.product.create({
  data: {
    name: product.title,
    price: product.price,
    imageUrl: JSON.stringify(product.images), // Multiple images!
    dynamicSpecs: {
      asin: product.asin,
      affiliateUrl: product.affiliateUrl, // ⭐ Earn commission!
      isPrime: product.isPrime,
      rating: product.rating,
      reviewCount: product.reviewCount
    }
  }
})
```

### 4. Display to Users
When users click "Buy Now" or view product details, redirect them to:
```typescript
// From database
const product = await prisma.product.findUnique({ where: { id } })
const affiliateUrl = product.dynamicSpecs.affiliateUrl

// Redirect user
window.location.href = affiliateUrl
// User goes to: https://amazon.com/dp/B0CHX1W1YY?tag=thriftai-20
```

### 5. Earn Commissions! 💰
- User clicks your affiliate link
- User buys on Amazon (within 24 hours)
- You earn **1-10% commission** (category-dependent)
- Track earnings in Amazon Associates dashboard

---

## Commission Rates

| Category | Commission Rate |
|----------|----------------|
| Luxury Beauty, Amazon Coins | 10% |
| Digital Music, Physical Music, Handmade | 5% |
| Digital Videos | 5% |
| Physical Books, Kitchen, Automotive | 4.5% |
| Amazon Fresh, Physical Video Games | 4% |
| Health & Personal Care, Beauty, Musical Instruments | 3% |
| Toys, Furniture, Home, Lawn & Garden | 3% |
| Outdoors, Tools, Sports, Baby Products | 3% |
| Electronics, Cameras, Office Products | 2.5% |
| PC, PC Components, DVD & Blu-Ray | 2.5% |
| All Other Categories | 1% |

**24-hour Cookie**: Commissions earned on purchases within 24 hours of clicking your link.

---

## API Rate Limits

### Free Tier
- **8,640 requests per day** (1 request per 10 seconds, 24/7)
- **1 request per second** burst rate
- No cost!

### Paid Tier (if you need more)
- Contact Amazon for higher limits
- Generally not needed unless processing millions of requests

### Best Practices
- Cache product data in your database
- Update prices daily/weekly (not on every page load)
- Use batch requests when possible (up to 10 ASINs per request)

---

## Alternative Affiliate Networks

### eBay Partner Network
**Best for**: Used/refurbished items, collectibles, auctions

**Setup**:
1. Sign up: https://partnernetwork.ebay.com/
2. Get API credentials: https://developer.ebay.com/
3. Add to `.env`:
```bash
EBAY_APP_ID=your_app_id
EBAY_CERT_ID=your_cert_id
```

**Commission**: 50-70% of eBay's revenue (varies by category)

---

### Rakuten Advertising
**Best for**: Access to 1000+ merchants (Macy's, Walmart, Best Buy, Target)

**Setup**:
1. Sign up: https://rakutenadvertising.com/
2. Add to `.env`:
```bash
RAKUTEN_API_KEY=your_api_key
RAKUTEN_SID=your_site_id
```

**Commission**: 2-20% depending on merchant

---

### CJ Affiliate (Commission Junction)
**Best for**: 3000+ brands including Home Depot, GoPro, Office Depot

**Setup**:
1. Sign up: https://www.cj.com/
2. Add to `.env`:
```bash
CJ_API_KEY=your_api_key
CJ_WEBSITE_ID=your_website_id
```

**Commission**: Varies by advertiser (typically 5-15%)

---

### ShareASale
**Best for**: 16,000+ merchants including Reebok, Wayfair, Etsy

**Setup**:
1. Sign up: https://www.shareasale.com/
2. Add to `.env`:
```bash
SHAREASALE_API_TOKEN=your_token
SHAREASALE_API_SECRET=your_secret
SHAREASALE_AFFILIATE_ID=your_id
```

**Commission**: 5-25% depending on merchant

---

## Testing Without API Credentials

If you don't have Amazon API credentials yet, you can still test with the existing seed scripts that use placeholder data:

```bash
# Use existing products with demo data
npx tsx scripts/seed-1000-genuine-products-fixed.ts
```

However, these won't have:
- Real pricing
- Affiliate links
- Multiple images
- Real ratings/reviews

---

## Troubleshooting

### "Amazon PA-API not configured"
- Check `.env` file has `AMAZON_ACCESS_KEY`, `AMAZON_SECRET_KEY`, `AMAZON_ASSOCIATE_TAG`
- Make sure `.env` is in the root directory
- Restart your application after adding credentials

### "TooManyRequests" error
- You've hit the rate limit (1 request/second)
- Add delays between requests:
```typescript
await new Promise(resolve => setTimeout(resolve, 1100)) // 1.1 seconds
```

### "InvalidPartnerTag" error
- Your Associate Tag is incorrect
- Check at: https://affiliate-program.amazon.com/

### "You are not authorized to access..." error
- Your PA-API access hasn't been approved yet
- You need 3 qualifying sales in 180 days
- OR apply for a test account at Amazon support

---

## Legal Requirements

When using affiliate links, you **MUST** include a disclosure:

### Example Disclosure
```
"As an Amazon Associate I earn from qualifying purchases."
```

### Where to Display
- Footer of your website
- Product detail pages
- Near "Buy Now" buttons
- Terms of Service page

### Code Example
```tsx
// Add to your footer component
<footer>
  <p>As an Amazon Associate I earn from qualifying purchases.</p>
</footer>
```

---

## Next Steps

1. ✅ **Sign up** for Amazon Associates
2. ✅ **Get API credentials** from Amazon
3. ✅ **Add credentials** to `.env`
4. ✅ **Run seed script**: `npx tsx scripts/seed-from-amazon-paapi.ts`
5. ✅ **Add affiliate disclosure** to your site
6. 💰 **Start earning** commissions on every sale!

---

## Support Resources

- **Amazon PA-API Docs**: https://webservices.amazon.com/paapi5/documentation/
- **Amazon Associates Help**: https://affiliate-program.amazon.com/help
- **API Forum**: https://forums.aws.amazon.com/forum.jspa?forumID=9
- **Commission Rates**: https://affiliate-program.amazon.com/help/node/topic/GRXPHT8U84RAYDXZ

---

## FAQ

**Q: Do I need to pay for the API?**
A: No! The PA-API is free for Amazon Associates.

**Q: How long does approval take?**
A: Usually 1-3 business days after you have 3 qualifying sales.

**Q: Can I use this for testing?**
A: Yes, you can request a test account from Amazon support.

**Q: What if I don't have 3 sales yet?**
A: Contact Amazon support for a temporary test account, or use the demo seed scripts until you're approved.

**Q: Can I use multiple affiliate programs?**
A: Yes! You can integrate Amazon, eBay, Rakuten, etc. and aggregate products from all sources.

**Q: How do I track my earnings?**
A: Go to your Amazon Associates dashboard at https://affiliate-program.amazon.com/

---

🎉 **You're ready to start earning with real products!**

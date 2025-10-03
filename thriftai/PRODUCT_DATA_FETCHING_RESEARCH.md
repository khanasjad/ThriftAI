# Comprehensive Guide to Fetching Real Product Data for Quality Assessment Systems

## Table of Contents
1. [E-commerce APIs](#1-e-commerce-apis)
2. [Product Data Aggregators](#2-product-data-aggregators)
3. [Web Scraping Tools & Libraries](#3-web-scraping-tools--libraries)
4. [Review Aggregation](#4-review-aggregation)
5. [Image Analysis Services](#5-image-analysis-services)
6. [Price Comparison APIs](#6-price-comparison-apis)
7. [Legal & Ethical Considerations](#7-legal--ethical-considerations)
8. [Technical Implementation](#8-technical-implementation)
9. [Additional Resources](#9-additional-resources)

---

## 1. E-commerce APIs

### Amazon Product Advertising API (PA-API 5.0)

**Description:** Official Amazon API for retrieving product information, pricing, reviews, and images from Amazon's catalog.

**Pricing:**
- **Free** - No direct API costs
- Revenue-based rate limits

**Rate Limits:**
- Initial: 1 request/second (TPS) and 8,640 requests/day (TPD)
- Increases based on revenue: 1 TPD per $0.05 shipped revenue, or 1 TPS (max 10) per $4,320 revenue
- Exceeding limits returns 429 TooManyRequests error

**Data Quality:** High - Official Amazon data with accurate pricing, availability, and product details

**Integration Difficulty:** Medium
- OAuth 2.0 authentication required
- Well-documented REST API
- Multiple SDK options available

**Legal Compliance:**
- Must be Amazon Associate
- Comply with Amazon's Terms of Service
- Display required disclaimers
- Cannot store pricing data for >24 hours

**Code Example (Node.js/TypeScript):**
```typescript
import ProductAdvertisingAPIv1 from 'paapi5-nodejs-sdk';

const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;
defaultClient.accessKey = 'YOUR_ACCESS_KEY';
defaultClient.secretKey = 'YOUR_SECRET_KEY';
defaultClient.host = 'webservices.amazon.com';
defaultClient.region = 'us-east-1';

const api = new ProductAdvertisingAPIv1.DefaultApi();

const searchItemsRequest = new ProductAdvertisingAPIv1.SearchItemsRequest();
searchItemsRequest.PartnerTag = 'YOUR_PARTNER_TAG';
searchItemsRequest.PartnerType = 'Associates';
searchItemsRequest.Keywords = 'laptop';
searchItemsRequest.SearchIndex = 'Electronics';
searchItemsRequest.ItemCount = 10;
searchItemsRequest.Resources = [
  'ItemInfo.Title',
  'Offers.Listings.Price',
  'Images.Primary.Large'
];

api.searchItems(searchItemsRequest).then(
  data => console.log(data),
  error => console.error(error)
);
```

---

### Amazon SP-API (Selling Partner API)

**Description:** API for Amazon sellers to manage inventory, pricing, orders, and product data in real-time.

**Pricing:** Free for registered sellers

**Rate Limits:** Varies by endpoint (refer to Product Pricing API documentation)

**Key Features:**
- **Product Pricing API:** Real-time pricing and offer information
- **FBA Inventory API:** Real-time inventory availability in fulfillment network
- **Feeds API:** Bulk product listing and inventory management
- **Notifications:** PRICING_HEALTH and ANY_OFFER_CHANGED alerts

**Data Quality:** Excellent - Direct seller data, real-time updates

**Integration Difficulty:** High
- Complex OAuth 2.0 setup with AWS Signature Version 4
- Requires seller account and developer application approval
- Multiple API endpoints to coordinate

**Legal Compliance:**
- Must be registered Amazon seller
- Comply with Amazon Seller Central policies

**Use Case:** Best for businesses selling on Amazon or needing real-time inventory/pricing data

---

### eBay API

**Description:** Comprehensive API suite for accessing eBay product listings, pricing, and marketplace data.

**Pricing:** Free (requires application approval)

**Rate Limits:** Varies by API tier and approval level

**Key Updates (2025):**
- Shopping API and Finding API deprecated (decommissioned Feb 5, 2025)
- **Browse API** is the replacement

**Data Quality:** High - Official eBay marketplace data

**Integration Difficulty:** Medium
- Application approval required (typically 1 business day)
- OAuth 2.0 authentication
- Comprehensive documentation

**Legal Compliance:**
- Agree to eBay API License Agreement
- Restricted APIs require additional approval
- Comply with data protection and AI content restrictions

**Code Example (Node.js):**
```typescript
import { EbayAuthToken } from 'ebay-oauth-nodejs-client';
import axios from 'axios';

const ebayAuth = new EbayAuthToken({
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  redirectUri: 'YOUR_REDIRECT_URI'
});

const token = await ebayAuth.getApplicationToken('PRODUCTION');

const response = await axios.get(
  'https://api.ebay.com/buy/browse/v1/item_summary/search',
  {
    params: { q: 'laptop', limit: 10 },
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
    }
  }
);
```

---

### Shopify API

**Description:** GraphQL and REST APIs for managing Shopify stores, products, inventory, and orders.

**Pricing:**
- Free for Shopify merchants
- Public apps and custom apps available

**Rate Limits:**
- REST: 2 requests/second (burst: 40 requests)
- GraphQL: Calculated points system (1000 points/second)

**Data Quality:** Excellent - Direct store data

**Integration Difficulty:** Low to Medium
- Well-documented GraphQL API
- Easy authentication with API keys
- Strong TypeScript support

**Legal Compliance:**
- Must follow Shopify's API Terms of Service
- Rate limiting required
- Data privacy compliance (customer data)

**Code Example (Next.js/TypeScript):**
```typescript
import { createStorefrontApiClient } from '@shopify/storefront-api-client';

const client = createStorefrontApiClient({
  storeDomain: 'your-store.myshopify.com',
  apiVersion: '2024-01',
  publicAccessToken: 'YOUR_STOREFRONT_ACCESS_TOKEN',
});

const query = `
  query Products {
    products(first: 10) {
      edges {
        node {
          id
          title
          description
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
              }
            }
          }
        }
      }
    }
  }
`;

const { data } = await client.request(query);
```

---

### WooCommerce REST API

**Description:** REST API for WordPress-based WooCommerce stores to access product, order, and customer data.

**Pricing:** Free (self-hosted or WooCommerce hosting)

**Rate Limits:** No official limits (dependent on hosting)

**Data Quality:** Varies - Depends on store data quality

**Integration Difficulty:** Low
- Simple REST API
- Basic authentication or OAuth 1.0a
- Extensive documentation

**Code Example (Node.js/TypeScript):**
```typescript
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const WooCommerce = new WooCommerceRestApi({
  url: 'https://your-store.com',
  consumerKey: 'ck_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  consumerSecret: 'cs_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  version: 'wc/v3'
});

const products = await WooCommerce.get('products', {
  per_page: 20,
  status: 'publish'
});

console.log(products.data);
```

---

### Walmart Marketplace API

**Description:** API for Walmart marketplace sellers to manage products, inventory, orders, and pricing.

**Pricing:** Free for approved sellers

**Rate Limits:** Varies by endpoint

**API Categories:**
- **Item API:** Submit, update, retire items
- **Transaction API:** Update prices, inventory, manage orders

**Data Quality:** High - Official Walmart marketplace data

**Integration Difficulty:** Medium
- REST APIs with OAuth 2.0
- Requires Client ID and Client Secret
- Seller approval needed

**Legal Compliance:**
- Must be approved Walmart seller
- Follow marketplace policies

**Use Case:** Best for businesses selling on Walmart Marketplace

---

### Target Product Data API

**Description:** Third-party APIs for scraping Target product data (no official seller marketplace API like Walmart).

**Available Solutions:**
- **RedCircle API:** Real-time Target product data scraping
- **Unwrangle API:** Target product detail scraper
- **Oxylabs Target Scraper API:** E-commerce scraping solution

**Pricing:** Varies by provider (typically subscription-based)

**Data Quality:** Good - Scraped from Target.com

**Integration Difficulty:** Low to Medium (depends on provider)

**Legal Considerations:**
- Third-party scraping (review Target's ToS)
- Use approved scraping services to minimize legal risk

---

### BigCommerce API

**Description:** REST API for BigCommerce stores to manage products, categories, brands, and pricing.

**Pricing:** Free for BigCommerce merchants

**Rate Limits:**
- 20,000 requests per hour (varies by plan)
- Can update 100,000 products in <1 minute

**Data Quality:** Excellent - Direct store data

**Integration Difficulty:** Low
- Well-documented REST API
- OAuth 2.0 authentication
- Strong developer resources

**Code Example:**
```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.bigcommerce.com/stores/{store_hash}/v3',
  headers: {
    'X-Auth-Token': 'YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const products = await client.get('/catalog/products', {
  params: { limit: 50, include: 'images,variants' }
});
```

---

### Magento API

**Description:** REST and SOAP APIs for Magento e-commerce stores.

**Pricing:** Free (self-hosted or Magento Commerce)

**Rate Limits:** Configurable (depends on hosting)

**Data Quality:** Excellent - Full control over store data

**Integration Difficulty:** Medium to High
- Both REST and SOAP support
- Complex authentication
- Requires technical expertise

**HTTP Methods:** GET, POST, PUT, DELETE

**Use Case:** Best for businesses with Magento stores or needing to integrate with Magento-based systems

---

## 2. Product Data Aggregators

### Algopix

**Description:** Multi-marketplace product research and analysis tool with API access.

**Pricing:**
- **Free Plan:** Basic product research (limited queries)
- **Subscription Plans:** Based on number of products analyzed (pricing not publicly disclosed)
- **API Access:** Custom pricing for developers

**Rate Limits:** Varies by plan

**Data Coverage:**
- 15 marketplaces: Amazon, eBay, Walmart
- Product details, pricing, competition, demand analysis

**Data Quality:** Excellent - Aggregated from multiple marketplaces

**Integration Difficulty:** Medium
- RESTful API
- Pricing API and Product Analysis API available
- Comprehensive documentation

**Legal Compliance:**
- Terms of Service agreement required
- Respect marketplace data usage policies

**Use Case:** Best for cross-marketplace product research and pricing intelligence

**API Endpoints:**
- Product Analysis API: Comprehensive product data across channels
- Pricing API: Competitive pricing analysis

---

### Keepa (Amazon Price Tracking)

**Description:** Amazon price history tracking and monitoring service with API access.

**Pricing:**
- **Free Version:** Limited data, no interactive graphs
- **Subscription:** €19/month (~$21) or €189/year (17% savings)
- **API Access:** Token-based system
  - 1 token per product request
  - Tokens expire after 60 minutes
  - Can import/export up to 24,000 ASINs/day with 100% quota

**Rate Limits:**
- Based on token allocation (varies by subscription)
- Quota replenishes at 5% per hour

**Data Quality:** Excellent
- Comprehensive Amazon price history
- Product data: price, category, rank, rating
- Historical price changes over time

**Integration Difficulty:** Low to Medium
- REST API
- Python library available (`keepa`)
- Good documentation

**Legal Compliance:**
- Terms of Service agreement
- Respect Amazon's data policies

**Code Example (Python):**
```python
import keepa

# Initialize API
key = 'YOUR_KEEPA_API_KEY'
api = keepa.Keepa(key)

# Request product data
products = api.query(['B0XXXXXX'], stats=90, rating=True)

# Access price history
print(products[0]['data']['NEW'])  # New price history
print(products[0]['stats'])  # 90-day statistics
```

---

### CamelCamelCamel

**Description:** Free Amazon price tracker with price history and drop alerts.

**Pricing:** Free

**API Availability:** No public API available

**Data Quality:** Good - Amazon price tracking

**Use Case:** Consumer-facing tool; not suitable for programmatic access

**Alternative:** Use Keepa API for similar functionality with API access

---

### Jungle Scout

**Description:** Amazon seller software with product research, tracking, and sales analytics.

**Pricing:**
- **Plans:** Growth Accelerator or Brand Owner plans required for API access
- **API Pricing:** First 100 requests free, then $0.05 per request

**Rate Limits:**
- First 100 requests free
- Overage charges apply

**Data Quality:** Excellent
- 2B+ data points
- Keyword search estimates, share of voice, estimated sales, pricing trends

**API Features:**
- Price monitoring and analysis
- Sales rank tracking
- Competitor analysis
- Automated data retrieval

**Integration Difficulty:** Medium
- REST API
- Requires Jungle Scout account (specific plans)
- Detailed documentation

**Use Cases:**
- Custom competitor monitoring tools
- Trend analysis dashboards
- Automated price tracking
- Zapier integrations

**Legal Compliance:**
- Terms of Service agreement
- Respect Amazon data usage policies

---

### Other Notable Aggregators

#### API2Cart
**Description:** Unified API for 40+ shopping platforms and marketplaces

**Pricing:** Subscription-based (pricing not publicly disclosed)

**Platforms:** Magento, Shopify, BigCommerce, WooCommerce, Amazon, eBay, Walmart, and more

**Features:**
- 100+ methods to get, add, update, sync store data
- Products, orders, customers, shipments, categories

**Use Case:** Best for multi-platform e-commerce integrations

---

## 3. Web Scraping Tools & Libraries

### Puppeteer

**Description:** Node.js library by Google for controlling Chrome/Chromium via DevTools Protocol.

**Pricing:** Free (open-source)

**Language Support:** JavaScript, TypeScript

**Browser Support:** Chromium (Chrome/Edge), Firefox (experimental)

**Pros:**
- Official Google project
- Excellent documentation
- Mature ecosystem
- Auto-downloads Chromium
- Headless and headful modes

**Cons:**
- JavaScript/TypeScript only
- Limited cross-browser support (primarily Chromium)

**Integration Difficulty:** Low to Medium

**Best For:**
- Node.js/TypeScript projects
- Chrome-specific automation
- Screenshot generation
- PDF generation

**Code Example (TypeScript):**
```typescript
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://example.com/product/12345');

  const productData = await page.evaluate(() => {
    return {
      title: document.querySelector('.product-title')?.textContent,
      price: document.querySelector('.product-price')?.textContent,
      image: document.querySelector('.product-image')?.getAttribute('src'),
      rating: document.querySelector('.rating')?.textContent
    };
  });

  console.log(productData);
  await browser.close();
})();
```

---

### Playwright

**Description:** Cross-browser automation framework by Microsoft supporting Chromium, Firefox, and WebKit.

**Pricing:** Free (open-source)

**Language Support:** JavaScript, TypeScript, Python, Java, C#

**Browser Support:** Chromium, Firefox, WebKit (Safari)

**Pros:**
- Multi-browser, multi-language support
- 96% success rate in testing (vs. Puppeteer)
- More consistent under parallel loads
- Modern API design
- Auto-wait functionality
- Network interception
- Mobile emulation

**Cons:**
- Slightly slower per page than Puppeteer
- Newer ecosystem (fewer resources than Selenium)

**Integration Difficulty:** Low to Medium

**Best For:**
- Cross-browser testing/scraping
- Modern web applications with dynamic content
- TypeScript projects
- Parallel scraping tasks

**Code Example (Next.js API Route):**
```typescript
// pages/api/scrape-product.ts
import { chromium } from 'playwright';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { url } = req.query;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'
  });
  const page = await context.newPage();

  await page.goto(url as string);

  const data = await page.evaluate(() => ({
    title: document.querySelector('h1')?.innerText,
    price: document.querySelector('.price')?.innerText,
    inStock: document.querySelector('.availability')?.innerText
  }));

  await browser.close();
  res.status(200).json(data);
}
```

**Recommendation (2025):** Playwright is generally preferred over Puppeteer for new projects due to superior cross-browser support and consistency.

---

### Selenium

**Description:** Mature web automation framework supporting multiple browsers and languages.

**Pricing:** Free (open-source)

**Language Support:** Python, Java, C#, JavaScript, Ruby

**Browser Support:** Chrome, Firefox, Edge, Safari

**Pros:**
- Mature ecosystem (established 2004)
- Broad language support
- Large community and resources
- Selenium Grid for parallel testing

**Cons:**
- Slower than Playwright/Puppeteer
- More verbose syntax
- Requires manual WebDriver management (pre-v4)

**Integration Difficulty:** Medium

**Best For:**
- Legacy projects
- Teams with existing Selenium expertise
- Cross-browser testing

**Code Example (Python):**
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')

driver = webdriver.Chrome(options=options)
driver.get('https://example.com/product/12345')

title = driver.find_element(By.CSS_SELECTOR, '.product-title').text
price = driver.find_element(By.CSS_SELECTOR, '.product-price').text

print(f"Title: {title}, Price: {price}")

driver.quit()
```

**Note:** Selenium 4+ handles WebDriver management automatically, eliminating manual setup.

---

### Cheerio

**Description:** Fast, lightweight HTML parsing library for Node.js (jQuery-like syntax).

**Pricing:** Free (open-source)

**Language Support:** JavaScript, TypeScript

**Pros:**
- Extremely fast
- Low memory footprint
- jQuery-like API (familiar syntax)
- Perfect for static HTML parsing

**Cons:**
- No JavaScript execution (static HTML only)
- Not suitable for SPAs or dynamic content
- Requires separate HTTP client (axios, node-fetch)

**Integration Difficulty:** Low

**Best For:**
- Static HTML scraping
- Fast data extraction
- Server-side rendering (SSR) sites
- Next.js API routes

**Code Example (Next.js):**
```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeProductData(url: string) {
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  return {
    title: $('.product-title').text().trim(),
    price: $('.product-price').text().trim(),
    description: $('.product-description').text().trim(),
    images: $('.product-images img')
      .map((_, el) => $(el).attr('src'))
      .get()
  };
}
```

**When to Use:**
- Use Cheerio for static HTML sites
- Use Puppeteer/Playwright for JavaScript-heavy SPAs

---

### Scrapy (Python)

**Description:** Comprehensive Python web scraping framework for large-scale projects.

**Pricing:** Free (open-source)

**Language Support:** Python

**Pros:**
- Built-in crawling capabilities
- Asynchronous requests (fast)
- Built-in data pipelines
- Item exporters (JSON, CSV, XML)
- Middleware support
- Proxy and user-agent rotation
- Rate limiting built-in

**Cons:**
- Python only
- Steeper learning curve
- Not ideal for JavaScript-heavy sites (requires Splash or Playwright integration)

**Integration Difficulty:** Medium to High

**Best For:**
- Large-scale scraping projects
- Structured data extraction
- Python-based data pipelines

**Code Example:**
```python
import scrapy

class ProductSpider(scrapy.Spider):
    name = 'products'
    start_urls = ['https://example.com/products']

    def parse(self, response):
        for product in response.css('.product-item'):
            yield {
                'title': product.css('.title::text').get(),
                'price': product.css('.price::text').get(),
                'url': product.css('a::attr(href)').get()
            }

        # Follow pagination
        next_page = response.css('.next-page::attr(href)').get()
        if next_page:
            yield response.follow(next_page, self.parse)
```

---

### Beautiful Soup (Python)

**Description:** Python library for parsing HTML and XML documents.

**Pricing:** Free (open-source)

**Language Support:** Python

**Pros:**
- Easy to learn
- Excellent for beginners
- Good documentation
- Flexible parsing (lxml, html.parser, html5lib)

**Cons:**
- Slower than Scrapy
- No built-in crawling
- Requires separate HTTP client (requests)
- Not suitable for large-scale projects

**Integration Difficulty:** Low

**Best For:**
- Small scraping projects
- Beginners learning web scraping
- One-off data extraction tasks

**Code Example:**
```python
import requests
from bs4 import BeautifulSoup

url = 'https://example.com/product/12345'
response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')

product = {
    'title': soup.find('h1', class_='product-title').text.strip(),
    'price': soup.find('span', class_='price').text.strip(),
    'rating': soup.find('div', class_='rating').text.strip()
}

print(product)
```

---

### Crawlee (JavaScript/TypeScript)

**Description:** Modern, all-in-one web scraping framework for Node.js/TypeScript.

**Pricing:** Free (open-source)

**Language Support:** JavaScript, TypeScript

**Features:**
- Unified interface for Puppeteer, Playwright, Cheerio
- Built-in proxy rotation
- Session management
- Request queuing
- Data storage
- Rate limiting

**Best For:**
- TypeScript/Next.js projects
- Scalable scraping with minimal setup
- Projects requiring multiple scraping strategies

**Code Example:**
```typescript
import { PlaywrightCrawler } from 'crawlee';

const crawler = new PlaywrightCrawler({
  async requestHandler({ page, request, enqueueLinks }) {
    const data = await page.evaluate(() => ({
      title: document.querySelector('.product-title')?.textContent,
      price: document.querySelector('.price')?.textContent
    }));

    await enqueueLinks({
      selector: '.product-link',
      label: 'PRODUCT'
    });

    console.log(data);
  }
});

await crawler.run(['https://example.com/products']);
```

---

### Best Practices & Anti-Detection Techniques

#### 1. Respect robots.txt
```typescript
import axios from 'axios';

async function checkRobotsTxt(baseUrl: string, path: string): Promise<boolean> {
  const robotsUrl = `${baseUrl}/robots.txt`;
  const { data } = await axios.get(robotsUrl);

  // Parse robots.txt and check if path is disallowed
  const userAgentSection = data.split('User-agent: *')[1];
  const disallowed = userAgentSection
    .split('\n')
    .filter(line => line.startsWith('Disallow:'))
    .map(line => line.replace('Disallow:', '').trim());

  return !disallowed.some(pattern => path.startsWith(pattern));
}
```

#### 2. User Agent Rotation
```typescript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36...'
];

const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

await page.setUserAgent(randomUserAgent);
```

#### 3. Randomized Delays
```typescript
function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Usage
await randomDelay(1000, 3000); // 1-3 seconds
```

#### 4. Headless Detection Evasion
```typescript
import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: [
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process'
  ]
});

const context = await browser.newContext({
  userAgent: 'Mozilla/5.0...',
  viewport: { width: 1920, height: 1080 },
  locale: 'en-US',
  timezoneId: 'America/New_York'
});

// Remove webdriver flag
await context.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', {
    get: () => false,
  });
});
```

#### 5. Browser Fingerprinting Evasion
```typescript
await context.addInitScript(() => {
  // Override plugins
  Object.defineProperty(navigator, 'plugins', {
    get: () => [1, 2, 3, 4, 5]
  });

  // Override languages
  Object.defineProperty(navigator, 'languages', {
    get: () => ['en-US', 'en']
  });

  // Add chrome object
  (window as any).chrome = { runtime: {} };
});
```

---

## 4. Review Aggregation

### Trustpilot API

**Description:** Access to customer reviews, ratings, and sentiment data from Trustpilot's platform.

**Pricing:** Not publicly disclosed (contact for pricing)

**Rate Limits:** Varies by plan

**Data Quality:** Excellent - Verified review platform

**Features:**
- Review collection and management
- Sentiment analysis
- Automated review responses
- Review data export

**Integration Difficulty:** Medium
- REST API
- Authentication via API key and secret
- Dashboard access in Integrations > Developers > APIs

**Use Cases:**
- Independent review authority across industries
- Cross-industry reputation monitoring
- Customer feedback analysis

**Legal Compliance:**
- Terms of Service agreement
- Data privacy compliance (GDPR)

**Code Example:**
```typescript
import axios from 'axios';

const trustpilotAPI = axios.create({
  baseURL: 'https://api.trustpilot.com/v1',
  headers: {
    'apikey': 'YOUR_API_KEY'
  }
});

const reviews = await trustpilotAPI.get('/business-units/{id}/reviews');
```

---

### Yotpo

**Description:** E-commerce marketing platform with reviews, ratings, and UGC (User Generated Content).

**Pricing:**
- Tiered pricing based on monthly order volume (minimum 500 orders/month)
- Three pricing tiers available
- Custom enterprise pricing

**Rate Limits:**
- 5,000 requests/minute per app key
- Recommended: max 100 reviews per query

**API Features:**
- Reviews and ratings API
- Visual UGC API
- Privacy API
- Insights API

**Data Quality:** Excellent - E-commerce focused reviews

**Integration Difficulty:** Low to Medium
- Well-documented REST API
- Multiple integration options with e-commerce platforms

**Best For:**
- E-commerce businesses
- Integrated marketing solution (reviews + loyalty + SMS)
- Visual UGC campaigns

**Code Example:**
```typescript
const yotpoAPI = axios.create({
  baseURL: 'https://api.yotpo.com/v1',
});

const reviews = await yotpoAPI.get('/apps/{app_key}/reviews', {
  params: {
    utoken: 'YOUR_USER_TOKEN',
    count: 100,
    page: 1
  }
});
```

---

### Reviews.io

**Description:** Review collection and management platform for e-commerce businesses.

**Pricing:** Not detailed in search results (contact for pricing)

**Features:**
- Product and service reviews
- Video reviews
- Q&A functionality
- Rich snippets for SEO

**Integration Difficulty:** Low
- Integrations with major e-commerce platforms
- API access available

---

### Google Reviews API

**Description:** Official API for Google My Business reviews (limited) and third-party scraping solutions.

**Official Google My Business API:**
- **Limitation:** Returns only 5 reviews per location
- **Endpoint:** `accounts.locations.batchGetReviews`
- **Use Case:** Managing your own business reviews

**Third-Party Scraping Solutions:**

#### 1. **SerpApi - Google Maps Reviews API**
```typescript
import axios from 'axios';

const serpApi = axios.create({
  baseURL: 'https://serpapi.com/search',
  params: {
    engine: 'google_maps_reviews',
    api_key: 'YOUR_SERPAPI_KEY'
  }
});

const reviews = await serpApi.get('', {
  params: {
    place_id: 'GOOGLE_PLACE_ID',
    hl: 'en'
  }
});
```

**Pricing:** Subscription-based (starting around $50/month)

#### 2. **Outscraper - Google Reviews Scraper**
- Not limited to 5 reviews (scrapes all available)
- Free tier available
- API access

#### 3. **Apify - Google Maps Reviews Scraper**
- Pay-per-use pricing
- Cloud-based scraping

#### 4. **ScrapeHero - Google Reviews Scraper**
- Provide list of Review Links or Place IDs
- Export to Excel, CSV, JSON

**Data Quality:** Good to Excellent (depends on source)

**Legal Compliance:**
- Official API: Compliant
- Scraping: Review Google's ToS and robots.txt

---

### Review Aggregation Strategy

**Multi-Source Review Collection:**
```typescript
interface Review {
  source: string;
  rating: number;
  text: string;
  author: string;
  date: Date;
}

async function aggregateReviews(productId: string): Promise<Review[]> {
  const reviews: Review[] = [];

  // Trustpilot
  const trustpilotReviews = await fetchTrustpilotReviews(productId);
  reviews.push(...trustpilotReviews);

  // Yotpo
  const yotpoReviews = await fetchYotpoReviews(productId);
  reviews.push(...yotpoReviews);

  // Google Reviews
  const googleReviews = await fetchGoogleReviews(productId);
  reviews.push(...googleReviews);

  // Calculate aggregate score
  const aggregateScore = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return reviews;
}
```

---

## 5. Image Analysis Services

### AWS Rekognition

**Description:** Amazon's deep learning-based image and video analysis service.

**Pricing:**
- **Free Tier:** First 5,000 images/month for 12 months (new customers)
- **Paid Pricing:** Tiered pricing based on volume
  - Group 1 (face APIs): Varies by volume
  - Group 2 (DetectLabels, DetectText, etc.): Varies by volume
- **New Customer Credits:** Up to $200 in credits (starting July 15, 2025)

**Key Features for Product Quality:**
- Object and scene detection
- Image moderation (detect inappropriate content)
- Text detection (OCR)
- Facial analysis
- Celebrity recognition
- Custom labels (train custom models)
- Image quality assessment

**Use Cases:**
- Product defect detection
- Logo/brand recognition
- Packaging authenticity verification
- Product categorization
- Quality control

**Data Quality:** Excellent - Pre-trained models with high accuracy

**Integration Difficulty:** Low to Medium
- AWS SDK available for all major languages
- Well-documented REST API
- Requires AWS account

**Code Example (Node.js):**
```typescript
import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';
import fs from 'fs';

const client = new RekognitionClient({ region: 'us-east-1' });

const imageBytes = fs.readFileSync('product-image.jpg');

const command = new DetectLabelsCommand({
  Image: { Bytes: imageBytes },
  MaxLabels: 10,
  MinConfidence: 70
});

const response = await client.send(command);

console.log('Detected labels:');
response.Labels?.forEach(label => {
  console.log(`${label.Name}: ${label.Confidence}%`);
});
```

**Legal Compliance:**
- AWS Terms of Service
- Data privacy (ensure compliance with user consent for facial data)

---

### Google Cloud Vision API

**Description:** Google's machine learning-based image analysis service.

**Pricing:**
- **Free Tier:** First 1,000 units/month free
- **Paid Pricing (units 1,001 - 5,000,000):**
  - Label Detection: $1.50 per 1,000 images
  - Text Detection (OCR): $1.50 per 1,000 images
  - Safe Search Detection: $1.50 per 1,000 images
  - Image Properties: $1.50 per 1,000 images
- **New Customers:** $300 in free credits

**Key Features:**
- Label detection (object recognition)
- OCR (text extraction)
- Face detection
- Landmark detection
- Logo detection
- Safe search (explicit content detection)
- Image properties (dominant colors)
- Crop hints
- Web detection (find similar images online)

**Use Cases:**
- Product categorization
- Defect detection
- Text extraction from packaging
- Brand/logo verification
- Similar product search

**Data Quality:** Excellent - State-of-the-art ML models

**Integration Difficulty:** Low to Medium
- Simple REST API
- Client libraries (Node.js, Python, etc.)
- Requires Google Cloud account

**Code Example (Node.js):**
```typescript
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  keyFilename: 'path/to/service-account-key.json'
});

const [result] = await client.labelDetection('product-image.jpg');
const labels = result.labelAnnotations;

console.log('Labels:');
labels?.forEach(label => console.log(label.description));

// Text detection (OCR)
const [textResult] = await client.textDetection('product-image.jpg');
const text = textResult.fullTextAnnotation?.text;
console.log('Extracted text:', text);
```

---

### Azure Computer Vision (Microsoft)

**Description:** Microsoft's AI-powered image analysis service.

**Pricing:**
- **Free Tier:** Up to 5,000 transactions/month
- **Standard Pricing:**
  - Analyze API: $1.00 per 1,000 transactions (0-1M)
  - OCR (Read API): $1.00 per 1,000 transactions
- **New Customers:** $200 credit for 30 days

**Key Features:**
- Analyze API (objects, tags, brands, faces, colors)
- OCR (Read API) - text extraction
- Spatial analysis
- Image categorization
- Thumbnail generation
- Adult content detection

**Use Cases:**
- Product tagging
- Brand logo detection
- Text extraction from labels
- Content moderation
- Smart cropping

**Data Quality:** Excellent - Enterprise-grade models

**Integration Difficulty:** Low to Medium
- REST API
- SDKs for major languages
- Azure account required

**Code Example (Node.js):**
```typescript
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';

const client = new ComputerVisionClient(
  new ApiKeyCredentials({
    inHeader: { 'Ocp-Apim-Subscription-Key': 'YOUR_KEY' }
  }),
  'https://YOUR_REGION.api.cognitive.microsoft.com/'
);

const url = 'https://example.com/product-image.jpg';
const features = ['Brands', 'Objects', 'Tags', 'Description'];

const analysis = await client.analyzeImage(url, { visualFeatures: features });

console.log('Tags:', analysis.tags?.map(t => t.name));
console.log('Objects:', analysis.objects?.map(o => o.object));
console.log('Brands:', analysis.brands?.map(b => b.name));
```

---

### Cloudinary AI

**Description:** Media management platform with AI-powered image analysis and transformation.

**Pricing:**
- **Free Plan:** Limited features
- **Plus:** $89/month (600 monthly credits)
- **Advanced:** $224/month (includes authentication features)
- **Enterprise:** Custom pricing

**Key Features:**
- AI Content Analysis Add-on
- Object-aware cropping
- Automatic tagging based on detected objects
- Image transformation API
- Authentication-based asset protection
- Background removal
- Image quality analysis

**Use Cases:**
- Product image optimization
- Smart cropping for thumbnails
- Automatic categorization
- Media asset management

**Data Quality:** Excellent

**Integration Difficulty:** Low
- Simple REST API
- SDKs for Node.js, Python, etc.
- Extensive documentation

**Legal Compliance:**
- Advanced plan includes authentication features
- SSO support on Enterprise plan

**Code Example (Node.js):**
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'YOUR_CLOUD_NAME',
  api_key: 'YOUR_API_KEY',
  api_secret: 'YOUR_API_SECRET'
});

// Upload and analyze
const result = await cloudinary.uploader.upload('product.jpg', {
  categorization: 'google_tagging',
  auto_tagging: 0.6 // confidence threshold
});

console.log('Tags:', result.info.categorization.google_tagging);
```

---

### AI-Powered Defect Detection

**For Manufacturing/Product Quality:**

#### Google Cloud Visual Inspection AI
- Purpose-built for manufacturing defect detection
- Supports ultra-high resolution (up to 100M pixels)
- Train custom models on product images
- Real-time defect classification

#### Custom ML Solutions
```typescript
// Example: Using TensorFlow.js for custom defect detection
import * as tf from '@tensorflow/tfjs-node';

async function detectDefects(imagePath: string) {
  const model = await tf.loadLayersModel('file://path/to/model.json');
  const image = tf.node.decodeImage(fs.readFileSync(imagePath));
  const resized = tf.image.resizeBilinear(image, [224, 224]);
  const normalized = resized.div(255.0).expandDims(0);

  const prediction = model.predict(normalized) as tf.Tensor;
  const defectProbability = await prediction.data();

  return defectProbability[0] > 0.5 ? 'Defective' : 'Good';
}
```

---

## 6. Price Comparison APIs

### Rainforest API

**Description:** Real-time Amazon product data API with comprehensive scraping capabilities.

**Pricing:**
- **Starting at:** $15/month for Amazon data
- **Flexible plans** based on request volume

**Features:**
- Real-time Amazon product data
- Pricing, inventory, reviews
- Search results
- Product details
- Best seller rankings

**Data Quality:** Excellent - Real-time Amazon data

**Integration Difficulty:** Low
- Simple REST API
- Well-documented
- Easy to integrate

**Rate Limits:** Varies by plan

**Use Case:** Best for Amazon-specific product tracking and price monitoring

---

### ScraperAPI

**Description:** Web scraping API with proxy rotation, CAPTCHA handling, and browser rendering.

**Pricing:**
- **Free Trial:** 5,000 API calls (7 days, no credit card)
- **Hobby:** $49/month for 100,000 credits (~20,000 e-commerce pages)
- **Startup:** $149/month
- **Business:** $299/month
- **Enterprise:** Custom pricing

**Features:**
- Automatic proxy rotation
- CAPTCHA solving
- JavaScript rendering
- Geotargeting
- Custom headers

**Data Quality:** Good - Depends on target site

**Integration Difficulty:** Very Low
- Simple API endpoint
- Pass URL as parameter
- Returns HTML

**Code Example:**
```typescript
import axios from 'axios';

const API_KEY = 'YOUR_SCRAPERAPI_KEY';

const response = await axios.get('http://api.scraperapi.com/', {
  params: {
    api_key: API_KEY,
    url: 'https://www.amazon.com/dp/B08N5WRWNW',
    render: true // Enable JavaScript rendering
  }
});

const html = response.data;
// Parse HTML with Cheerio
```

**Pros:**
- Transparent, predictable pricing
- High reliability
- Excellent Trustpilot score (4.7)

**Cons:**
- Credit-based (not unlimited)

---

### Apify

**Description:** Web scraping and automation platform with pre-built scrapers (actors).

**Pricing:**
- **Free Plan:** Available
- **Paid Plans:** Starting at $49/month
- **Compute Unit-based pricing** (can be unpredictable)

**Features:**
- 1,500+ pre-built scrapers (Actors)
- Custom scraper development
- Cloud-based execution
- Proxy services included
- Data storage

**Data Quality:** Excellent - Purpose-built actors for specific sites

**Integration Difficulty:** Low to Medium
- Use pre-built actors or build custom
- REST API for integration

**Pros:**
- Extensive library of ready-made scrapers
- No infrastructure management
- Handles complex sites

**Cons:**
- Pricing can be unpredictable with usage spikes
- More expensive for high-volume use

**Code Example (Using Apify Client):**
```typescript
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'YOUR_API_TOKEN' });

const run = await client.actor('apify/amazon-crawler').call({
  startUrls: [{ url: 'https://www.amazon.com/s?k=laptop' }],
  maxItems: 50
});

const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(items);
```

---

### PriceAPI

**Description:** E-commerce price tracking and product data API.

**Pricing:** Not detailed in search results (contact for pricing)

**Features:**
- Multi-marketplace price tracking
- Product availability monitoring
- Historical pricing data

**Use Case:** Price comparison and monitoring

---

### Bright Data (formerly Luminati)

**Description:** Enterprise web data platform with proxy services and scraping tools.

**Pricing (Proxies):**
- **Residential:** $10.5/GB (pay-as-you-go), $8.4/GB with micro-package
- **Datacenter:** $0.11/GB (pay-as-you-go), $0.066/GB with micro-package
- **ISP:** $15/GB
- **Mobile:** $24/GB

**Features:**
- 175M+ IP addresses
- Web scraping IDE
- Pre-built datasets
- CAPTCHA solving
- Session management

**Data Quality:** Excellent

**Integration Difficulty:** Medium
- Rich product ecosystem
- Multiple tools to learn

**Best For:** Large-scale enterprise scraping projects

---

### Oxylabs

**Description:** Premium proxy service and web scraping infrastructure provider.

**Pricing:**
- **Residential Proxies:** $4/GB (pay-as-you-go), $10/GB (standard)
- **Mobile Proxies:** $9/GB (pay-as-you-go)
- **Datacenter Proxies:** Starting at $50/month
- **Free Trial:** 5 datacenter proxy IPs (5GB total traffic, no credit card)

**Network Size:** 175M+ Residential IPs, 2M Datacenter IPs

**Features:**
- Large proxy network
- Web scraper APIs (Real-Time Crawler, SERP Scraper, E-Commerce Scraper)
- 24/7 support

**Data Quality:** Excellent

**Best For:** Large-scale data collection with high reliability requirements

---

### Comparison Summary

| Service | Best For | Pricing | Ease of Use |
|---------|----------|---------|-------------|
| **Rainforest API** | Amazon data | $15+/month | Easy |
| **ScraperAPI** | General scraping | $49+/month | Very Easy |
| **Apify** | Pre-built scrapers | $49+/month | Medium |
| **Bright Data** | Enterprise scraping | $0.11+/GB | Medium |
| **Oxylabs** | Large-scale projects | $4+/GB | Medium |

---

## 7. Legal & Ethical Considerations

### Terms of Service (ToS) Compliance

**Key Points:**
- Always review target website's Terms of Service before scraping
- Many sites explicitly prohibit automated data collection
- Violating ToS can lead to IP bans, legal action, or account termination

**Case Study: Facebook vs. BrandTotal**
- Emphasized importance of respecting ToS agreements
- Unauthorized scraping can result in legal consequences

**Best Practice:**
- Use official APIs when available
- If scraping is necessary, consult legal counsel
- Consider using licensed data providers

---

### robots.txt Compliance

**What is robots.txt?**
- Text file on websites providing crawling instructions
- Specifies which pages/sections are disallowed for bots

**Legal Status:**
- Not legally binding but considered best practice
- Violating can indicate bad faith in legal disputes

**Case Study: 3taps vs. Craigslist**
- Violating robots.txt resulted in $1 million fine
- Courts consider robots.txt compliance in judgments

**Implementation:**
```typescript
import axios from 'axios';
import robotsParser from 'robots-parser';

async function canScrape(url: string, userAgent: string = '*'): Promise<boolean> {
  const baseUrl = new URL(url).origin;
  const robotsTxt = await axios.get(`${baseUrl}/robots.txt`);
  const robots = robotsParser(`${baseUrl}/robots.txt`, robotsTxt.data);

  return robots.isAllowed(url, userAgent);
}

// Usage
const allowed = await canScrape('https://example.com/products', 'MyBot');
if (allowed) {
  // Proceed with scraping
}
```

---

### GDPR (General Data Protection Regulation)

**Scope:**
- Applies to personal data of EU residents
- Relevant if scraping names, emails, addresses, IP addresses, etc.

**Requirements:**
- **Lawful basis** for processing personal data (consent, legitimate interest, etc.)
- **Data minimization**: Only collect necessary data
- **Right to erasure**: Users can request data deletion
- **Transparency**: Inform users about data collection

**Penalties:**
- Up to €20 million or 4% of global annual revenue (whichever is higher)

**Best Practices:**
- Avoid scraping personal data when possible
- Use data aggregation and anonymization
- Implement data retention policies
- Provide privacy policy and contact information

---

### CCPA (California Consumer Privacy Act)

**Scope:**
- Applies to for-profit businesses collecting personal data of California residents
- Must meet revenue/data thresholds

**Requirements:**
- **Right to know**: Users can request what data is collected
- **Right to delete**: Users can request deletion
- **Right to opt-out**: Users can opt-out of data sale

**Penalties:**
- $2,500 per violation (unintentional)
- $7,500 per intentional violation

**Best Practices:**
- Only scrape publicly available, non-personal data
- Implement opt-out mechanisms if collecting personal data
- Maintain compliance documentation

---

### Copyright and Intellectual Property

**Key Considerations:**
- Scraping copyrighted content (images, text) may violate copyright law
- Fair use doctrine may apply in limited cases (research, criticism)
- Database rights protect compilations of data (EU)

**Best Practices:**
- Use data for analysis, not republishing
- Provide attribution where appropriate
- Avoid scraping proprietary databases

---

### Rate Limiting and Server Load

**Ethical Responsibility:**
- Excessive scraping can overload servers (DoS-like behavior)
- Implement rate limiting to be a "good citizen"

**Best Practices:**
- Respect Crawl-delay directive in robots.txt
- Implement exponential backoff on errors
- Scrape during off-peak hours
- Use caching to avoid redundant requests

**Example:**
```typescript
// Respect crawl-delay
const crawlDelay = robots.getCrawlDelay('MyBot') || 1000; // Default 1 second
await new Promise(resolve => setTimeout(resolve, crawlDelay));
```

---

### Data Privacy Best Practices

1. **Exclude Personal Data:**
   - Filter out emails, phone numbers, addresses
   - Use regex to detect and remove PII

2. **Anonymization:**
   - Hash identifiable information
   - Aggregate data to prevent re-identification

3. **Audit Trails:**
   - Log all scraping sessions
   - Document data sources and collection methods
   - Maintain records for legal review

4. **Secure Storage:**
   - Encrypt data at rest and in transit
   - Implement access controls
   - Regular security audits

---

### Legal Compliance Checklist

- [ ] Review target website's Terms of Service
- [ ] Check robots.txt and respect directives
- [ ] Avoid collecting personal data (GDPR/CCPA)
- [ ] Implement rate limiting and respectful scraping
- [ ] Use official APIs when available
- [ ] Document legal basis for data collection
- [ ] Provide privacy policy (if collecting user data)
- [ ] Implement data retention and deletion policies
- [ ] Consult legal counsel for commercial projects
- [ ] Consider using licensed data providers

---

## 8. Technical Implementation

### Proxy Rotation and IP Management

#### Why Use Proxies?
- Avoid IP bans from rate limiting
- Access geo-restricted content
- Distribute load across multiple IPs
- Mimic legitimate user traffic

#### Types of Proxies:

**1. Datacenter Proxies**
- **Pros:** Fast, cheap
- **Cons:** Easy to detect, higher block rate
- **Use Case:** Low-risk scraping, high-volume needs
- **Pricing:** $0.11/GB (Bright Data), $50/month (Oxylabs)

**2. Residential Proxies**
- **Pros:** Real user IPs, harder to detect, higher success rate
- **Cons:** More expensive, slower
- **Use Case:** E-commerce, social media, high-detection sites
- **Pricing:** $4-10/GB

**3. ISP Proxies**
- **Pros:** Static IPs from ISPs, faster than residential
- **Cons:** More expensive
- **Pricing:** $15/GB

**4. Mobile Proxies**
- **Pros:** Real mobile IPs, highest success rate
- **Cons:** Most expensive, slower
- **Pricing:** $9-24/GB

#### Implementation (ScraperAPI):
```typescript
import axios from 'axios';

const SCRAPER_API_KEY = 'YOUR_API_KEY';

async function scrapeWithProxy(url: string) {
  const response = await axios.get('http://api.scraperapi.com/', {
    params: {
      api_key: SCRAPER_API_KEY,
      url: url,
      render: true,
      proxy_type: 'residential', // or 'datacenter'
      country_code: 'us' // Geotargeting
    }
  });

  return response.data;
}
```

#### Custom Proxy Rotation:
```typescript
const proxies = [
  'http://proxy1.com:8080',
  'http://proxy2.com:8080',
  'http://proxy3.com:8080'
];

let currentProxyIndex = 0;

function getNextProxy(): string {
  const proxy = proxies[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % proxies.length;
  return proxy;
}

// Usage with Playwright
const browser = await chromium.launch({
  proxy: { server: getNextProxy() }
});
```

---

### User Agent Rotation

**Why Rotate User Agents?**
- Mimic different browsers/devices
- Avoid detection as bot
- Distribute traffic patterns

**Implementation:**
```typescript
const userAgents = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  // Firefox on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  // Safari on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  // Chrome on Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

function getRandomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Usage
await page.setUserAgent(getRandomUserAgent());
```

**Advanced: Consistent Headers**
```typescript
function getConsistentHeaders(userAgent: string) {
  const isChrome = userAgent.includes('Chrome');
  const isFirefox = userAgent.includes('Firefox');

  return {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Ch-Ua': isChrome ? '"Not_A Brand";v="8", "Chromium";v="120"' : undefined,
    'Sec-Ch-Ua-Platform': isChrome ? '"Windows"' : undefined
  };
}
```

---

### CAPTCHA Handling

#### Types of CAPTCHAs:
1. **Image-based** (reCAPTCHA v2)
2. **Invisible** (reCAPTCHA v3)
3. **hCaptcha**
4. **Cloudflare Turnstile**

#### Solutions:

**1. Avoid CAPTCHAs (Best Approach):**
- Use residential proxies
- Rotate IPs frequently
- Mimic human behavior (mouse movements, delays)
- Respect rate limits

**2. CAPTCHA Solving Services:**

**2Captcha:**
```typescript
import axios from 'axios';

async function solve2Captcha(siteKey: string, pageUrl: string): Promise<string> {
  const API_KEY = 'YOUR_2CAPTCHA_KEY';

  // Submit CAPTCHA
  const { data: submitData } = await axios.get(
    `https://2captcha.com/in.php?key=${API_KEY}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${pageUrl}`
  );

  const captchaId = submitData.split('|')[1];

  // Poll for solution
  await new Promise(resolve => setTimeout(resolve, 20000)); // Wait 20s

  const { data: resultData } = await axios.get(
    `https://2captcha.com/res.php?key=${API_KEY}&action=get&id=${captchaId}`
  );

  return resultData.split('|')[1]; // Return solution token
}

// Usage with Playwright
const token = await solve2Captcha('SITE_KEY', 'https://example.com');
await page.evaluate((token) => {
  document.getElementById('g-recaptcha-response').innerHTML = token;
}, token);
```

**Pricing:**
- 2Captcha: $2.99 per 1,000 CAPTCHAs
- Anti-Captcha: Similar pricing
- CapMonster: $0.50-$3 per 1,000

**3. Browser Automation (reCAPTCHA v3):**
- reCAPTCHA v3 scores user behavior (no user interaction)
- Playwright/Puppeteer with stealth plugins can help

```typescript
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

const browser = await chromium.launch({ headless: false });
```

---

### Rate Limiting Strategies

#### 1. Fixed Delay
```typescript
async function scrapeWithDelay(urls: string[], delay: number = 2000) {
  for (const url of urls) {
    await scrapePage(url);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

#### 2. Random Delay (More Human-Like)
```typescript
function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Usage
await randomDelay(1000, 3000); // 1-3 seconds
```

#### 3. Exponential Backoff (Handle 429 Errors)
```typescript
async function scrapeWithBackoff(
  url: string,
  maxRetries: number = 5
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        const delay = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.pow(2, attempt) * 1000; // Exponential: 1s, 2s, 4s, 8s, 16s

        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Max retries exceeded');
}
```

#### 4. Request Queuing (Bottleneck)
```typescript
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({
  minTime: 1000, // Minimum 1 second between requests
  maxConcurrent: 5 // Max 5 concurrent requests
});

const scrapePage = limiter.wrap(async (url: string) => {
  const response = await axios.get(url);
  return response.data;
});

// All requests automatically throttled
await Promise.all([
  scrapePage('https://example.com/page1'),
  scrapePage('https://example.com/page2'),
  scrapePage('https://example.com/page3')
]);
```

#### 5. Respect Retry-After Header
```typescript
async function scrapeWithRetryAfter(url: string): Promise<any> {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        const delay = parseInt(retryAfter) * 1000;
        console.log(`Waiting ${delay}ms as requested by server...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return scrapeWithRetryAfter(url); // Retry
      }
    }
    throw error;
  }
}
```

---

### Caching Strategies

#### Why Cache?
- Reduce redundant requests
- Faster development/testing
- Respect rate limits
- Save bandwidth costs
- Enable offline development

#### 1. File-Based Caching
```typescript
import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';

const CACHE_DIR = './cache';

function getCacheKey(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

async function getCachedPage(url: string): Promise<string | null> {
  const cacheKey = getCacheKey(url);
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.html`);

  try {
    return await fs.readFile(cachePath, 'utf-8');
  } catch {
    return null;
  }
}

async function setCachedPage(url: string, html: string): Promise<void> {
  const cacheKey = getCacheKey(url);
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.html`);

  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(cachePath, html);
}

// Usage
async function scrapeWithCache(url: string): Promise<string> {
  const cached = await getCachedPage(url);
  if (cached) {
    console.log('Using cached version');
    return cached;
  }

  console.log('Fetching fresh data');
  const response = await axios.get(url);
  await setCachedPage(url, response.data);
  return response.data;
}
```

#### 2. Redis Caching (Production)
```typescript
import { createClient } from 'redis';

const redis = createClient({ url: 'redis://localhost:6379' });
await redis.connect();

async function scrapeWithRedis(url: string, ttl: number = 3600): Promise<string> {
  const cacheKey = `page:${url}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch and cache
  const response = await axios.get(url);
  await redis.setEx(cacheKey, ttl, response.data);
  return response.data;
}
```

#### 3. Next.js API Route Caching
```typescript
// pages/api/product.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { url } = req.query;

  // Cache for 1 hour
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  const data = await scrapeProduct(url as string);
  res.status(200).json(data);
}
```

#### 4. Next.js 15 Data Cache
```typescript
// app/actions/scrapeProduct.ts
'use server';

export async function scrapeProduct(url: string) {
  const response = await fetch(url, {
    next: {
      revalidate: 3600 // Cache for 1 hour
    }
  });

  return response.json();
}
```

---

### Error Handling

#### Comprehensive Error Handling
```typescript
interface ScrapeError {
  type: 'NETWORK' | 'RATE_LIMIT' | 'PARSE' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
  url: string;
  retryable: boolean;
}

async function scrapeSafely(url: string): Promise<any> {
  try {
    const response = await axios.get(url, { timeout: 30000 });

    try {
      const $ = cheerio.load(response.data);
      const data = extractData($);

      if (!data.title) {
        throw {
          type: 'PARSE',
          message: 'Failed to extract required fields',
          url,
          retryable: false
        } as ScrapeError;
      }

      return data;
    } catch (parseError) {
      throw {
        type: 'PARSE',
        message: parseError.message,
        url,
        retryable: false
      } as ScrapeError;
    }
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      throw {
        type: 'TIMEOUT',
        message: 'Request timeout',
        url,
        retryable: true
      } as ScrapeError;
    }

    if (error.response?.status === 429) {
      throw {
        type: 'RATE_LIMIT',
        message: 'Rate limit exceeded',
        url,
        retryable: true
      } as ScrapeError;
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw {
        type: 'NETWORK',
        message: 'Network error',
        url,
        retryable: true
      } as ScrapeError;
    }

    throw {
      type: 'UNKNOWN',
      message: error.message,
      url,
      retryable: false
    } as ScrapeError;
  }
}

// Retry logic
async function scrapeWithRetry(
  url: string,
  maxRetries: number = 3
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await scrapeSafely(url);
    } catch (error: any) {
      if (!error.retryable || attempt === maxRetries - 1) {
        console.error(`Failed to scrape ${url}:`, error);
        throw error;
      }

      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retry ${attempt + 1}/${maxRetries} in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

### Complete Next.js Implementation Example

```typescript
// app/api/scrape-product/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }

  try {
    // Check cache
    const cacheKey = `product:${url}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        data: cached,
        cached: true
      });
    }

    // Scrape with Playwright
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });

    const productData = await page.evaluate(() => ({
      title: document.querySelector('h1')?.textContent?.trim(),
      price: document.querySelector('.price')?.textContent?.trim(),
      rating: document.querySelector('.rating')?.textContent?.trim(),
      availability: document.querySelector('.availability')?.textContent?.trim(),
      images: Array.from(document.querySelectorAll('.product-image img'))
        .map(img => img.getAttribute('src'))
    }));

    await browser.close();

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(productData));

    return NextResponse.json({
      data: productData,
      cached: false
    });
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**Usage from client:**
```typescript
// app/components/ProductQuality.tsx
'use client';

import { useState } from 'react';

export default function ProductQuality() {
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);

  async function analyzeProduct(url: string) {
    setLoading(true);

    try {
      const response = await fetch(`/api/scrape-product?url=${encodeURIComponent(url)}`);
      const { data } = await response.json();
      setProductData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* UI implementation */}
    </div>
  );
}
```

---

## 9. Additional Resources

### Sentiment Analysis & NLP

**For Review Quality Assessment:**

#### Google Cloud Natural Language API
```typescript
import { LanguageServiceClient } from '@google-cloud/language';

const client = new LanguageServiceClient();

async function analyzeSentiment(text: string) {
  const document = {
    content: text,
    type: 'PLAIN_TEXT' as const
  };

  const [result] = await client.analyzeSentiment({ document });
  const sentiment = result.documentSentiment;

  return {
    score: sentiment?.score, // -1 (negative) to 1 (positive)
    magnitude: sentiment?.magnitude // Strength of emotion
  };
}

// Usage for review analysis
const reviews = await fetchProductReviews(productId);
const sentiments = await Promise.all(
  reviews.map(r => analyzeSentiment(r.text))
);

const averageSentiment = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
```

**Pricing:**
- First 1,000 units/month: Free
- 1,001 - 5,000,000 units: $1.00 per 1,000 units

#### Azure Text Analytics
```typescript
import { TextAnalyticsClient, AzureKeyCredential } from '@azure/ai-text-analytics';

const client = new TextAnalyticsClient(
  'YOUR_ENDPOINT',
  new AzureKeyCredential('YOUR_KEY')
);

async function analyzeReviews(reviews: string[]) {
  const results = await client.analyzeSentiment(reviews);

  return results.map(result => ({
    sentiment: result.sentiment, // 'positive', 'negative', 'neutral', 'mixed'
    positive: result.confidenceScores.positive,
    negative: result.confidenceScores.negative,
    neutral: result.confidenceScores.neutral
  }));
}
```

#### AWS Comprehend
```typescript
import { ComprehendClient, DetectSentimentCommand } from '@aws-sdk/client-comprehend';

const client = new ComprehendClient({ region: 'us-east-1' });

async function detectSentiment(text: string) {
  const command = new DetectSentimentCommand({
    Text: text,
    LanguageCode: 'en'
  });

  const response = await client.send(command);
  return response.Sentiment; // 'POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'
}
```

---

### Product Authenticity Verification

#### Entrupy (Luxury Goods Authentication)
- AI-powered authentication for luxury items (handbags, sneakers)
- 100% financially-backed authenticity guarantee
- Mobile app + API access
- Pricing: Contact for enterprise API pricing

#### VISUA (Visual-AI API)
- Detects fake packaging, holograms, product markings
- Integration via REST API
- Use case: Brand protection, counterfeit detection

#### Blockchain-Based Solutions
- **IBM Blockchain for Anti-Counterfeit**
- **Scantrust**: QR code authentication with blockchain tracking
- **LocatorX**: Certified QR codes with counterfeit alerts

---

### Quality Scoring Framework

**Example Implementation:**
```typescript
interface QualityScore {
  overall: number; // 0-100
  breakdown: {
    imageQuality: number;
    reviewSentiment: number;
    priceCompetitiveness: number;
    sellerReputation: number;
    productAuthenticity: number;
  };
}

async function calculateQualityScore(productData: any): Promise<QualityScore> {
  // Image quality (using Cloud Vision)
  const imageLabels = await analyzeProductImage(productData.imageUrl);
  const imageQuality = imageLabels.some(l => l.name === 'Product' && l.confidence > 0.9)
    ? 90
    : 60;

  // Review sentiment (using NLP API)
  const reviews = await fetchReviews(productData.id);
  const sentiments = await Promise.all(reviews.map(r => analyzeSentiment(r.text)));
  const avgSentiment = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
  const reviewSentiment = (avgSentiment + 1) * 50; // Convert -1..1 to 0..100

  // Price competitiveness (compare with market)
  const marketPrices = await fetchMarketPrices(productData.title);
  const avgMarketPrice = marketPrices.reduce((sum, p) => sum + p, 0) / marketPrices.length;
  const priceRatio = productData.price / avgMarketPrice;
  const priceCompetitiveness = priceRatio < 0.8 ? 100 : priceRatio > 1.2 ? 50 : 80;

  // Seller reputation
  const sellerRating = productData.seller.rating || 0;
  const sellerReputation = sellerRating * 20; // Convert 0-5 to 0-100

  // Product authenticity (placeholder - would use Entrupy/VISUA in production)
  const productAuthenticity = 85; // Mock score

  const overall = (
    imageQuality * 0.2 +
    reviewSentiment * 0.3 +
    priceCompetitiveness * 0.2 +
    sellerReputation * 0.2 +
    productAuthenticity * 0.1
  );

  return {
    overall: Math.round(overall),
    breakdown: {
      imageQuality: Math.round(imageQuality),
      reviewSentiment: Math.round(reviewSentiment),
      priceCompetitiveness: Math.round(priceCompetitiveness),
      sellerReputation: Math.round(sellerReputation),
      productAuthenticity: Math.round(productAuthenticity)
    }
  };
}
```

---

### Recommended Tech Stack for Next.js/TypeScript

**For Real-Time Product Quality Assessment:**

1. **Data Fetching:**
   - Playwright (JavaScript-heavy sites)
   - Cheerio (static HTML)
   - ScraperAPI (proxy/CAPTCHA handling)
   - Official APIs (Amazon PA-API, eBay, Shopify)

2. **Image Analysis:**
   - Google Cloud Vision API (best balance of features/price)
   - AWS Rekognition (if already on AWS)

3. **Review Sentiment:**
   - Google Cloud Natural Language API
   - Azure Text Analytics (if on Azure)

4. **Caching:**
   - Upstash Redis (serverless-friendly)
   - Next.js built-in caching

5. **Rate Limiting:**
   - Bottleneck (Node.js library)
   - Upstash Ratelimit (serverless)

6. **Proxy Services:**
   - ScraperAPI (easiest integration)
   - Bright Data (enterprise scale)

7. **Error Monitoring:**
   - Sentry
   - LogRocket

---

### Final Recommendations

**For MVP/Prototype:**
1. Start with official APIs (Amazon PA-API, eBay)
2. Use ScraperAPI for sites without APIs
3. Google Cloud Vision for image analysis
4. Google Natural Language API for sentiment
5. File-based caching for development

**For Production:**
1. Combine official APIs with licensed data providers (Rainforest, Keepa)
2. Implement robust error handling and retry logic
3. Use Redis for caching
4. Implement rate limiting and proxy rotation
5. Monitor legal compliance continuously
6. Set up comprehensive logging and monitoring

**Budget Estimates (Monthly):**

**Starter ($100-300/month):**
- ScraperAPI Hobby: $49
- Google Cloud APIs: $50 (after free tier)
- Upstash Redis: $10
- Total: ~$109/month

**Growth ($500-1000/month):**
- ScraperAPI Startup: $149
- Google Cloud APIs: $200
- Rainforest API: $50-100
- Keepa API: $21
- Upstash Redis: $30
- Total: ~$450-500/month

**Enterprise ($2000+/month):**
- Bright Data: $500+
- Multiple API subscriptions: $500+
- Cloud infrastructure: $500+
- Compliance/legal: $500+

---

## Conclusion

Fetching real product data for quality assessment requires a multi-faceted approach combining:

1. **Official APIs** when available (best legal compliance)
2. **Licensed aggregators** for cross-platform data
3. **Ethical web scraping** with proper safeguards
4. **AI-powered analysis** for images and text
5. **Robust technical implementation** with caching, error handling, and rate limiting

Always prioritize legal compliance, respect website policies, and consider the ethical implications of data collection. When in doubt, consult legal counsel and use official APIs or licensed data providers.

For a Next.js/TypeScript quality assessment system, the recommended approach is:
- Use official APIs where possible
- Supplement with ScraperAPI for sites without APIs
- Integrate Google Cloud Vision and Natural Language APIs for analysis
- Implement comprehensive caching and rate limiting
- Monitor and maintain legal compliance

This comprehensive guide provides the foundation for building a robust, scalable, and legally compliant product data fetching system.

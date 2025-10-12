'use client'

import React, { useState } from 'react'
import { ExternalLink, DollarSign, Zap, TrendingUp, ShoppingBag, CheckCircle, Clock, CreditCard } from 'lucide-react'

interface AffiliatePartner {
  name: string
  description: string
  categories: string[]
  commissionRate: string
  cookieDuration: string
  paymentThreshold: string
  apiAvailable: boolean
  apiDocs?: string
  signupUrl: string
  highlights: string[]
  logo?: string
}

const affiliatePartners: AffiliatePartner[] = [
  {
    name: 'Amazon Associates',
    description: 'The largest affiliate program with 150M+ products across all categories. Product Advertising API (PA-API 5.0) provides real-time product data, pricing, and images.',
    categories: ['Electronics', 'Clothing', 'Shoes', 'Accessories', 'Home', 'Beauty', 'Sports', 'Toys'],
    commissionRate: '1-10%',
    cookieDuration: '24 hours',
    paymentThreshold: '$10',
    apiAvailable: true,
    apiDocs: 'https://webservices.amazon.com/paapi5/documentation/',
    signupUrl: 'https://affiliate-program.amazon.com/',
    highlights: [
      '150M+ products available',
      'Official PA-API 5.0 with SDKs',
      '8,640 requests/day free tier',
      'Multiple images per product',
      'Real-time pricing & availability',
      'Most trusted brand in e-commerce'
    ]
  },
  {
    name: 'eBay Partner Network',
    description: 'Access millions of new, used, and refurbished items. eBay Buy API provides auction and fixed-price listings with real-time bidding data.',
    categories: ['Electronics', 'Clothing', 'Shoes', 'Accessories', 'Home', 'Sports', 'Toys'],
    commissionRate: '50-70% of eBay revenue',
    cookieDuration: '24 hours',
    paymentThreshold: '$10',
    apiAvailable: true,
    apiDocs: 'https://developer.ebay.com/api-docs/buy/browse/overview.html',
    signupUrl: 'https://partnernetwork.ebay.com/',
    highlights: [
      'Best for used/refurbished items',
      'Buy Browse API with OAuth',
      'Auction & fixed-price listings',
      'High commission rates',
      'Global marketplace access',
      'Deal & trending item feeds'
    ]
  },
  {
    name: 'Walmart Affiliates',
    description: 'Access Walmart\'s extensive product catalog with competitive prices. Open API provides product search, pricing, and reviews.',
    categories: ['Electronics', 'Clothing', 'Home', 'Beauty', 'Sports', 'Toys'],
    commissionRate: '1-4%',
    cookieDuration: '3 days',
    paymentThreshold: '$50',
    apiAvailable: true,
    apiDocs: 'https://developer.walmart.com/api/us/mp/items',
    signupUrl: 'https://affiliates.walmart.com/',
    highlights: [
      'Massive product selection',
      'Open API with JSON responses',
      'Longer 3-day cookie window',
      'Free 2-day shipping items',
      'Competitive pricing data',
      'Trusted retailer brand'
    ]
  },
  {
    name: 'Target Affiliates',
    description: 'Partner with Target for quality products across multiple categories. API access through Impact partnership.',
    categories: ['Electronics', 'Clothing', 'Home', 'Beauty', 'Toys'],
    commissionRate: '1-8%',
    cookieDuration: '7 days',
    paymentThreshold: '$25',
    apiAvailable: true,
    apiDocs: 'https://impact.com/brand-partnership-suite/advertiser/api/',
    signupUrl: 'https://www.impact.com/partners/target/',
    highlights: [
      'Exclusive designer collaborations',
      '7-day cookie duration',
      'Impact API integration',
      'REDcard holder benefits',
      'Seasonal promotions',
      'Same-day delivery options'
    ]
  },
  {
    name: 'Rakuten Advertising',
    description: 'Access 1,000+ merchants including Macy\'s, Best Buy, Walmart through one platform. Unified API for multiple retailers.',
    categories: ['Electronics', 'Clothing', 'Shoes', 'Accessories', 'Home', 'Beauty', 'Sports', 'Toys'],
    commissionRate: '2-20%',
    cookieDuration: '30-90 days',
    paymentThreshold: '$50',
    apiAvailable: true,
    apiDocs: 'https://rakutenmarketing.com/en-uk/resources/api-documentation',
    signupUrl: 'https://rakutenadvertising.com/',
    highlights: [
      '1,000+ premium merchants',
      'Extended cookie duration',
      'Product Search API',
      'Deep linking tools',
      'Performance analytics',
      'Consolidated payments'
    ]
  },
  {
    name: 'CJ Affiliate (Commission Junction)',
    description: '3,000+ advertisers including Home Depot, GoPro, Office Depot. Comprehensive API for product catalogs and performance tracking.',
    categories: ['Electronics', 'Clothing', 'Accessories', 'Home', 'Beauty', 'Sports', 'Toys'],
    commissionRate: '5-20%',
    cookieDuration: '30-45 days',
    paymentThreshold: '$50',
    apiAvailable: true,
    apiDocs: 'https://developers.cj.com/',
    signupUrl: 'https://www.cj.com/',
    highlights: [
      '3,000+ global advertisers',
      'Advanced API suite',
      'Product catalog feeds',
      'Performance tracking API',
      'Extended cookie windows',
      'Enterprise-grade tools'
    ]
  },
  {
    name: 'ShareASale',
    description: '16,000+ merchants including Reebok, Wayfair, Etsy. Extensive API for product feeds and transaction data.',
    categories: ['Electronics', 'Clothing', 'Shoes', 'Accessories', 'Home', 'Beauty', 'Sports', 'Toys'],
    commissionRate: '5-25%',
    cookieDuration: '30-90 days',
    paymentThreshold: '$50',
    apiAvailable: true,
    apiDocs: 'https://www.shareasale.com/blog/shareasale-api-documentation/',
    signupUrl: 'https://www.shareasale.com/',
    highlights: [
      '16,000+ diverse merchants',
      'Product datafeed API',
      'Transaction reporting API',
      'Deep linking generator',
      'High commission rates',
      'Monthly payment schedule'
    ]
  },
  {
    name: 'Best Buy Affiliates',
    description: 'Electronics giant with extensive tech product catalog. Content API provides product details, pricing, and availability.',
    categories: ['Electronics', 'Home'],
    commissionRate: '1-3%',
    cookieDuration: '1 day',
    paymentThreshold: '$25',
    apiAvailable: true,
    apiDocs: 'https://developer.bestbuy.com/',
    signupUrl: 'https://affiliates.bestbuy.com/',
    highlights: [
      'Leading electronics retailer',
      'Best Buy API with product data',
      'Geek Squad services',
      'Price match guarantee',
      'Store pickup options',
      'Tech expert reviews'
    ]
  },
  {
    name: 'Nike Affiliate Program',
    description: 'World\'s leading athletic footwear and apparel brand. Access exclusive Nike products and limited releases.',
    categories: ['Shoes', 'Clothing', 'Sports', 'Accessories'],
    commissionRate: '1-11%',
    cookieDuration: '30 days',
    paymentThreshold: '$25',
    apiAvailable: true,
    apiDocs: 'https://impact.com/brand-partnership-suite/advertiser/api/',
    signupUrl: 'https://www.impact.com/partners/nike/',
    highlights: [
      'Premium athletic brand',
      'Exclusive product releases',
      '30-day cookie window',
      'Nike+ member benefits',
      'Athlete endorsements',
      'Sustainability initiatives'
    ]
  },
  {
    name: 'Foot Locker Affiliates',
    description: 'Leading athletic footwear and apparel retailer. Access to Nike, Adidas, Jordan, and more premium brands.',
    categories: ['Shoes', 'Clothing', 'Sports', 'Accessories'],
    commissionRate: '2-7%',
    cookieDuration: '30 days',
    paymentThreshold: '$50',
    apiAvailable: true,
    apiDocs: 'https://www.pepperjam.com/affiliates/api/',
    signupUrl: 'https://www.pepperjam.com/',
    highlights: [
      'Multi-brand athletic retailer',
      'Exclusive sneaker releases',
      'Launch Reservation system',
      'VIP rewards program',
      'Extended cookie duration',
      'Mobile app integration'
    ]
  },
  {
    name: 'Sephora Affiliate Program',
    description: 'Premium beauty products from 300+ brands. Access to makeup, skincare, fragrance, and beauty tools.',
    categories: ['Beauty', 'Accessories'],
    commissionRate: '5-10%',
    cookieDuration: '7 days',
    paymentThreshold: '$50',
    apiAvailable: true,
    apiDocs: 'https://www.rakutenadvertising.com/',
    signupUrl: 'https://rakutenadvertising.com/',
    highlights: [
      '300+ beauty brands',
      'Exclusive products',
      'Beauty Insider program',
      'Product reviews & ratings',
      'Virtual try-on technology',
      'Free samples with orders'
    ]
  },
  {
    name: 'Ulta Beauty Affiliates',
    description: 'America\'s largest beauty retailer with mass and prestige brands. Complete beauty product catalog.',
    categories: ['Beauty', 'Accessories'],
    commissionRate: '2-5%',
    cookieDuration: '7 days',
    paymentThreshold: '$50',
    apiAvailable: true,
    apiDocs: 'https://impact.com/brand-partnership-suite/advertiser/api/',
    signupUrl: 'https://www.impact.com/partners/ulta-beauty/',
    highlights: [
      '500+ beauty brands',
      'Mass & prestige products',
      'Ultamate Rewards program',
      'In-store salon services',
      'Frequent promotions',
      '21 Days of Beauty sales'
    ]
  },
  {
    name: 'Home Depot Affiliates',
    description: 'Leading home improvement retailer. Access to tools, appliances, building materials, and smart home products.',
    categories: ['Home', 'Electronics'],
    commissionRate: '2-8%',
    cookieDuration: '7 days',
    paymentThreshold: '$50',
    apiAvailable: true,
    apiDocs: 'https://developers.cj.com/',
    signupUrl: 'https://www.cj.com/',
    highlights: [
      'Home improvement leader',
      'Pro contractor pricing',
      'Extended 7-day cookies',
      'Free in-store pickup',
      'Project calculators',
      'Installation services'
    ]
  },
  {
    name: 'Wayfair Affiliates',
    description: 'Massive online furniture and home goods retailer. Access to 14 million products for every room.',
    categories: ['Home', 'Accessories'],
    commissionRate: '5-7%',
    cookieDuration: '7 days',
    paymentThreshold: '$50',
    apiAvailable: true,
    apiDocs: 'https://www.cj.com/',
    signupUrl: 'https://www.cj.com/',
    highlights: [
      '14M+ home products',
      'Free shipping over $35',
      'Extended return policy',
      '3D room planning tools',
      'Professional design services',
      'Financing options'
    ]
  },
  {
    name: 'Dick\'s Sporting Goods',
    description: 'Comprehensive sporting goods retailer. Fitness equipment, athletic apparel, and outdoor gear.',
    categories: ['Sports', 'Shoes', 'Clothing', 'Accessories'],
    commissionRate: '2-8%',
    cookieDuration: '7 days',
    paymentThreshold: '$50',
    apiAvailable: true,
    apiDocs: 'https://www.cj.com/',
    signupUrl: 'https://www.cj.com/',
    highlights: [
      'Complete sports retailer',
      'ScoreCard rewards program',
      'Curbside pickup',
      'Team sports equipment',
      'Fitness gear & apparel',
      'Local store inventory'
    ]
  },
  {
    name: 'REI Co-op',
    description: 'Outdoor gear and apparel co-op. Sustainable and quality outdoor products with member benefits.',
    categories: ['Sports', 'Clothing', 'Shoes', 'Accessories'],
    commissionRate: '2-5%',
    cookieDuration: '15 days',
    paymentThreshold: '$50',
    apiAvailable: true,
    apiDocs: 'https://www.avantlink.com/',
    signupUrl: 'https://www.avantlink.com/',
    highlights: [
      'Outdoor gear specialists',
      'Extended 15-day cookies',
      'Co-op member dividends',
      'Used gear trade-in',
      'Sustainability focused',
      'Expert product reviews'
    ]
  },
  {
    name: 'Macy\'s Affiliates',
    description: 'Iconic department store with fashion, accessories, home goods, and beauty products.',
    categories: ['Clothing', 'Shoes', 'Accessories', 'Home', 'Beauty'],
    commissionRate: '2-10%',
    cookieDuration: '7 days',
    paymentThreshold: '$50',
    apiAvailable: true,
    apiDocs: 'https://rakutenadvertising.com/',
    signupUrl: 'https://rakutenadvertising.com/',
    highlights: [
      'Iconic American retailer',
      'Designer collaborations',
      'Frequent sales & promotions',
      'Star Rewards program',
      'Wedding & gift registry',
      'In-store events'
    ]
  },
  {
    name: 'Nordstrom Affiliate Program',
    description: 'Upscale fashion retailer with designer brands. Premium clothing, shoes, accessories, and beauty.',
    categories: ['Clothing', 'Shoes', 'Accessories', 'Beauty'],
    commissionRate: '2-9%',
    cookieDuration: '14 days',
    paymentThreshold: '$50',
    apiAvailable: true,
    apiDocs: 'https://www.pepperjam.com/',
    signupUrl: 'https://www.pepperjam.com/',
    highlights: [
      'Premium fashion brands',
      'Extended 14-day cookies',
      'Free shipping & returns',
      'Nordstrom Rewards',
      'Personal styling services',
      'Anniversary Sale'
    ]
  },
  {
    name: 'Zappos Affiliates',
    description: 'Leading online shoe retailer with exceptional customer service. Extensive footwear selection.',
    categories: ['Shoes', 'Clothing', 'Accessories'],
    commissionRate: '7-15%',
    cookieDuration: '45 days',
    paymentThreshold: '$25',
    apiAvailable: true,
    apiDocs: 'https://www.cj.com/',
    signupUrl: 'https://www.cj.com/',
    highlights: [
      'Shoe shopping specialists',
      'Exceptional 45-day cookies',
      'Free 365-day returns',
      '24/7 customer service',
      'VIP membership program',
      '1000+ brands available'
    ]
  },
  {
    name: 'GameStop Affiliates',
    description: 'Video games, consoles, electronics, and collectibles retailer. Pre-orders and exclusive releases.',
    categories: ['Electronics', 'Toys'],
    commissionRate: '1-3%',
    cookieDuration: '30 days',
    paymentThreshold: '$50',
    apiAvailable: true,
    apiDocs: 'https://impact.com/',
    signupUrl: 'https://impact.com/',
    highlights: [
      'Gaming specialist retailer',
      'Pre-order exclusives',
      'Trade-in program',
      'PowerUp Rewards Pro',
      'Collectibles & merchandise',
      'Digital game codes'
    ]
  }
]

const categories = [
  { name: 'Electronics', icon: '📱', color: 'bg-blue-500' },
  { name: 'Clothing', icon: '👕', color: 'bg-purple-500' },
  { name: 'Shoes', icon: '👟', color: 'bg-red-500' },
  { name: 'Accessories', icon: '👜', color: 'bg-pink-500' },
  { name: 'Home', icon: '🏠', color: 'bg-green-500' },
  { name: 'Beauty', icon: '💄', color: 'bg-rose-500' },
  { name: 'Sports', icon: '⚽', color: 'bg-orange-500' },
  { name: 'Toys', icon: '🧸', color: 'bg-yellow-500' }
]

export default function AffiliatePartnersPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPartners = affiliatePartners.filter(partner => {
    const matchesCategory = !selectedCategory || partner.categories.includes(selectedCategory)
    const matchesSearch = !searchQuery ||
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '80px 24px 60px',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'var(--text-4xl)',
            fontWeight: 'var(--font-bold)',
            marginBottom: '16px'
          }}>
            Affiliate Partner Networks
          </h1>
          <p style={{
            fontSize: 'var(--text-xl)',
            opacity: 0.95,
            maxWidth: '800px',
            margin: '0 auto 32px'
          }}>
            Connect with America's top affiliate programs via API. Earn commissions on sales across all 8 product categories with trusted retailers and brands.
          </p>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>20+</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Affiliate Networks</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>100%</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>API Access</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>8</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Product Categories</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>1-25%</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Commission Rates</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '-40px auto 0', padding: '0 24px 80px' }}>
        {/* Search & Filters */}
        <div style={{
          background: 'var(--bg-secondary)',
          padding: '32px',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '32px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search affiliate programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 20px',
              fontSize: 'var(--text-lg)',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '24px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          />

          {/* Category Filters */}
          <div style={{ marginBottom: '8px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)' }}>
            Filter by Category:
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                border: selectedCategory === null ? '2px solid #667eea' : '2px solid var(--border-color)',
                background: selectedCategory === null ? '#667eea' : 'var(--bg-primary)',
                color: selectedCategory === null ? 'white' : 'var(--text-primary)',
                fontWeight: 'var(--font-semibold)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-full)',
                  border: selectedCategory === cat.name ? '2px solid #667eea' : '2px solid var(--border-color)',
                  background: selectedCategory === cat.name ? '#667eea' : 'var(--bg-primary)',
                  color: selectedCategory === cat.name ? 'white' : 'var(--text-primary)',
                  fontWeight: 'var(--font-semibold)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div style={{
          marginBottom: '24px',
          fontSize: 'var(--text-lg)',
          color: 'var(--text-secondary)',
          fontWeight: 'var(--font-semibold)'
        }}>
          {filteredPartners.length} {selectedCategory ? `${selectedCategory} ` : ''}Affiliate Program{filteredPartners.length !== 1 ? 's' : ''} Available
        </div>

        {/* Partner Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))',
          gap: '24px'
        }}>
          {filteredPartners.map((partner, index) => (
            <div
              key={index}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-xl)',
                padding: '32px',
                border: '1px solid var(--border-color)',
                transition: 'all 0.3s',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* API Badge */}
              {partner.apiAvailable && (
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Zap size={14} />
                  API
                </div>
              )}

              {/* Header */}
              <h3 style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-bold)',
                marginBottom: '12px',
                color: 'var(--text-primary)',
                paddingRight: '80px'
              }}>
                {partner.name}
              </h3>

              <p style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                {partner.description}
              </p>

              {/* Categories */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {partner.categories.map(cat => {
                    const categoryInfo = categories.find(c => c.name === cat)
                    return (
                      <span
                        key={cat}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '13px',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>{categoryInfo?.icon}</span>
                        <span>{cat}</span>
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Key Metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  background: 'var(--bg-tertiary)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <DollarSign size={18} color="#10b981" />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Commission</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {partner.commissionRate}
                    </div>
                  </div>
                </div>
                <div style={{
                  background: 'var(--bg-tertiary)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Clock size={18} color="#3b82f6" />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Cookie</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {partner.cookieDuration}
                    </div>
                  </div>
                </div>
                <div style={{
                  background: 'var(--bg-tertiary)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CreditCard size={18} color="#f59e0b" />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Min Payout</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {partner.paymentThreshold}
                    </div>
                  </div>
                </div>
                <div style={{
                  background: 'var(--bg-tertiary)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ShoppingBag size={18} color="#8b5cf6" />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Products</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {partner.categories.length} cats
                    </div>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'var(--font-semibold)',
                  marginBottom: '8px',
                  color: 'var(--text-primary)'
                }}>
                  Key Features:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {partner.highlights.slice(0, 4).map((highlight, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)'
                    }}>
                      <CheckCircle size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-color)'
              }}>
                <a
                  href={partner.signupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: 'var(--font-semibold)',
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <TrendingUp size={18} />
                  Sign Up
                </a>
                {partner.apiDocs && (
                  <a
                    href={partner.apiDocs}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '12px 20px',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-lg)',
                      fontWeight: 'var(--font-semibold)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      border: '2px solid var(--border-color)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#667eea'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)'
                    }}
                  >
                    API Docs
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredPartners.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-xl)',
            border: '2px dashed var(--border-color)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: '8px' }}>
              No affiliate programs found
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Try adjusting your filters or search query
            </p>
          </div>
        )}

        {/* Info Section */}
        <div style={{
          marginTop: '60px',
          background: 'var(--bg-secondary)',
          padding: '40px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)'
        }}>
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            marginBottom: '20px',
            color: 'var(--text-primary)'
          }}>
            Getting Started with Affiliate APIs
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            <div>
              <h3 style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                marginBottom: '12px',
                color: 'var(--text-primary)'
              }}>
                1. Sign Up
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6' }}>
                Create accounts with affiliate networks. Most applications are approved within 24-48 hours. Provide accurate website/app information and traffic details.
              </p>
            </div>
            <div>
              <h3 style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                marginBottom: '12px',
                color: 'var(--text-primary)'
              }}>
                2. Get API Access
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6' }}>
                Request API credentials from your affiliate dashboard. Most programs provide REST APIs with OAuth authentication. Review rate limits and usage policies.
              </p>
            </div>
            <div>
              <h3 style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                marginBottom: '12px',
                color: 'var(--text-primary)'
              }}>
                3. Integrate & Earn
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6' }}>
                Use APIs to fetch product data, generate affiliate links, and track conversions. Display products on your platform and earn commissions on qualifying purchases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

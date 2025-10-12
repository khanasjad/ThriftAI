'use client'

import React, { useState } from 'react'
import { ExternalLink, DollarSign, Zap, Database, CheckCircle, Lock, Unlock, TrendingUp, BarChart3, Star } from 'lucide-react'

interface DataSource {
  name: string
  description: string
  url: string
  signupUrl: string
  categories: string[]
  parametersCovered: number
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  pricing: 'Free' | 'Freemium' | 'Paid' | 'Enterprise'
  pricingDetails?: string
  dataTypes: string[]
  highlights: string[]
  apiDocs: string
  status: 'Working' | 'Code Ready' | 'Not Implemented'
  statusNote?: string
}

const dataSources: DataSource[] = [
  {
    name: 'Database (Internal) ✅',
    description: 'ThriftAI internal database with comprehensive product data, seller metrics, price history, and Veritas scoring tables. Provides 72 out of 96 parameters without any external API calls.',
    url: '/api/veritas/database-parameters',
    signupUrl: '/api/veritas/database-parameters',
    apiDocs: '/api/veritas/database-parameters',
    categories: ['Product Data', 'Pricing', 'Seller Data', 'Quality', 'Sustainability'],
    parametersCovered: 72,
    priority: 'Critical',
    pricing: 'Free',
    pricingDetails: 'Internal database - $0/month',
    dataTypes: ['Product Quality', 'Seller Trust', 'Market Value', 'Sustainability', 'Security', 'UX', 'Specs', 'Company'],
    highlights: [
      '✅ FULLY WORKING - Ready to use now!',
      '72 out of 96 parameters (75%)',
      '$0 cost - no external API calls',
      '~40ms response time per product',
      'Product, Seller, Price, Quality data',
      'Batch API for search results'
    ],
    status: 'Working',
    statusNote: 'Fully functional API endpoints available'
  },
  {
    name: 'Amazon Product Advertising API',
    description: 'Official Amazon API providing comprehensive product data including titles, prices, images, ratings, reviews, and availability across 150M+ products.',
    url: 'https://webservices.amazon.com/paapi5/documentation/',
    signupUrl: 'https://affiliate-program.amazon.com/',
    apiDocs: 'https://webservices.amazon.com/paapi5/documentation/',
    categories: ['Product Data', 'Pricing', 'Reviews', 'Availability'],
    parametersCovered: 18,
    priority: 'Critical',
    pricing: 'Free',
    pricingDetails: '8,640 requests/day free',
    dataTypes: ['Product Info', 'Pricing', 'Images', 'Ratings', 'Reviews', 'Stock'],
    highlights: [
      '150M+ products available',
      'Real-time pricing & availability',
      '8,640 free requests per day',
      'Multiple product images',
      'Customer ratings & reviews',
      'Code already written - needs API keys'
    ],
    status: 'Code Ready',
    statusNote: 'Integration code complete, needs credentials'
  },
  {
    name: 'Keepa API',
    description: 'Amazon price tracker providing historical pricing data, sales rank history, buy box statistics, and stock tracking for comprehensive market analysis.',
    url: 'https://keepa.com/#!api',
    signupUrl: 'https://keepa.com/#!api',
    apiDocs: 'https://keepa.com/#!api',
    categories: ['Pricing', 'Market Data', 'Analytics'],
    parametersCovered: 10,
    priority: 'High',
    pricing: 'Paid',
    pricingDetails: '$0.001 per token (~$100/month)',
    dataTypes: ['Price History', 'Sales Rank', 'Buy Box', 'Stock Tracking'],
    highlights: [
      'Comprehensive price history',
      'Sales rank tracking',
      'Buy box statistics',
      'Stock availability monitoring',
      'Historical trend analysis',
      'Real-time price alerts'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'Sustainalytics ESG API',
    description: 'Leading ESG risk scores and sustainability ratings covering environmental impact, social responsibility, governance, and controversy tracking.',
    url: 'https://www.sustainalytics.com/esg-data',
    signupUrl: 'https://www.sustainalytics.com/',
    apiDocs: 'https://www.sustainalytics.com/esg-data',
    categories: ['ESG', 'Sustainability', 'Corporate'],
    parametersCovered: 15,
    priority: 'Critical',
    pricing: 'Enterprise',
    pricingDetails: 'Contact for pricing',
    dataTypes: ['ESG Scores', 'Environmental', 'Social', 'Governance', 'Controversies'],
    highlights: [
      'Comprehensive ESG risk scores',
      'Environmental impact ratings',
      'Social responsibility metrics',
      'Governance quality assessment',
      'Controversy tracking',
      'Industry-leading data quality'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'Alpha Vantage API',
    description: 'Stock market and company financial data providing market cap, stock prices, financial statements, and company fundamentals for brand analysis.',
    url: 'https://www.alphavantage.co/documentation/',
    signupUrl: 'https://www.alphavantage.co/support/#api-key',
    apiDocs: 'https://www.alphavantage.co/documentation/',
    categories: ['Financial', 'Corporate', 'Market Data'],
    parametersCovered: 10,
    priority: 'High',
    pricing: 'Freemium',
    pricingDetails: '25 requests/day free, $49.99/month premium',
    dataTypes: ['Stock Prices', 'Market Cap', 'Financials', 'Company Overview'],
    highlights: [
      'Real-time stock data',
      'Company financial statements',
      'Market capitalization tracking',
      'P/E ratios and metrics',
      '25 free requests per day',
      'JSON and CSV formats'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'eBay Browse API',
    description: 'Access millions of eBay listings with detailed product conditions, seller ratings, price histories, and shipping information.',
    url: 'https://developer.ebay.com/api-docs/buy/browse/overview.html',
    signupUrl: 'https://developer.ebay.com/',
    apiDocs: 'https://developer.ebay.com/api-docs/buy/browse/overview.html',
    categories: ['Product Data', 'Pricing', 'Seller Data'],
    parametersCovered: 10,
    priority: 'High',
    pricing: 'Free',
    pricingDetails: 'Free with developer account',
    dataTypes: ['Product Condition', 'Seller Ratings', 'Price History', 'Shipping'],
    highlights: [
      'Millions of product listings',
      'Detailed condition reports',
      'Seller reputation data',
      'Auction and fixed prices',
      'Shipping cost analysis',
      'Return policy information'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'CDP (Carbon Disclosure Project)',
    description: 'Open environmental data on carbon emissions, climate change responses, water security, and forest management from thousands of companies.',
    url: 'https://data.cdp.net/',
    signupUrl: 'https://www.cdp.net/en/data',
    apiDocs: 'https://data.cdp.net/',
    categories: ['ESG', 'Sustainability', 'Environmental'],
    parametersCovered: 8,
    priority: 'High',
    pricing: 'Free',
    pricingDetails: 'Open data available',
    dataTypes: ['Carbon Emissions', 'Climate Score', 'Water Score', 'Forest Score'],
    highlights: [
      'Free open environmental data',
      'Carbon emissions tracking',
      'Climate change responses',
      'Water security metrics',
      'Forest management data',
      'Emissions reduction targets'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'Clearbit Company API',
    description: 'Comprehensive company information including employee count, founding year, headquarters, social media, and company descriptions.',
    url: 'https://clearbit.com/docs#enrichment-api',
    signupUrl: 'https://clearbit.com/',
    apiDocs: 'https://clearbit.com/docs',
    categories: ['Corporate', 'Company Info'],
    parametersCovered: 8,
    priority: 'Medium',
    pricing: 'Freemium',
    pricingDetails: '100 requests/month free, $99/month starter',
    dataTypes: ['Company Size', 'Founded Date', 'Location', 'Social Media'],
    highlights: [
      '100 free requests monthly',
      'Company employee count',
      'Founding year and history',
      'Headquarters location',
      'Social media profiles',
      'Company logos and branding'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'Open Supply Hub',
    description: 'Open-source supply chain data with factory locations, supplier information, manufacturing facilities, and labor conditions worldwide.',
    url: 'https://opensupplyhub.org/api/docs/',
    signupUrl: 'https://opensupplyhub.org/',
    apiDocs: 'https://opensupplyhub.org/api/docs/',
    categories: ['Supply Chain', 'Manufacturing', 'Labor'],
    parametersCovered: 8,
    priority: 'High',
    pricing: 'Free',
    pricingDetails: 'Free open-source',
    dataTypes: ['Factory Locations', 'Suppliers', 'Labor Conditions', 'Audits'],
    highlights: [
      'Free open-source data',
      'Global factory locations',
      'Supplier transparency',
      'Labor condition reports',
      'Factory audit data',
      'Manufacturing facility details'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'Walmart Open API',
    description: 'Walmart product catalog with detailed specifications, pricing, stock availability, and customer reviews.',
    url: 'https://developer.walmart.com/api/us/mp/items',
    signupUrl: 'https://developer.walmart.com/',
    apiDocs: 'https://developer.walmart.com/doc/',
    categories: ['Product Data', 'Pricing', 'Reviews'],
    parametersCovered: 7,
    priority: 'Medium',
    pricing: 'Free',
    pricingDetails: 'Free with API key',
    dataTypes: ['Product Details', 'Pricing', 'Stock', 'Reviews'],
    highlights: [
      'Massive product catalog',
      'Competitive pricing data',
      'Stock availability',
      'Customer review access',
      'Free API access',
      'Real-time updates'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'EWG Skin Deep Database',
    description: 'Cosmetic safety ratings with ingredient hazard scores, health concerns, allergen warnings, and toxicity assessments for beauty products.',
    url: 'https://www.ewg.org/skindeep/',
    signupUrl: 'https://www.ewg.org/skindeep/',
    apiDocs: 'https://www.ewg.org/skindeep/',
    categories: ['Beauty', 'Safety', 'Health'],
    parametersCovered: 7,
    priority: 'High',
    pricing: 'Free',
    pricingDetails: 'Public database (web scraping)',
    dataTypes: ['Safety Ratings', 'Ingredient Scores', 'Health Concerns', 'Allergens'],
    highlights: [
      'Comprehensive beauty database',
      'Ingredient safety scores',
      'Health concern warnings',
      'Allergen identification',
      'Cancer risk assessment',
      'Free public access'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'EPEAT Registry',
    description: 'Electronics sustainability ratings covering energy efficiency, material composition, end-of-life management, and environmental impact.',
    url: 'https://epeat.net/',
    signupUrl: 'https://epeat.net/',
    apiDocs: 'https://epeat.net/',
    categories: ['Electronics', 'Sustainability', 'Environmental'],
    parametersCovered: 7,
    priority: 'High',
    pricing: 'Free',
    pricingDetails: 'Public registry',
    dataTypes: ['EPEAT Rating', 'Energy Efficiency', 'Recycling', 'Materials'],
    highlights: [
      'Electronics-specific ratings',
      'Energy efficiency metrics',
      'Recycling program data',
      'Hazardous material tracking',
      'Product lifespan estimates',
      'Free public registry'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'iFixit API ✅',
    description: 'Repairability data with repair guides, difficulty ratings, and step-by-step instructions for fixing products. Helps assess product sustainability and longevity.',
    url: '/api/integrations/ifixit',
    signupUrl: 'https://www.ifixit.com/api/2.0/doc/',
    apiDocs: 'https://www.ifixit.com/api/2.0/doc/',
    categories: ['Sustainability', 'Electronics', 'Quality'],
    parametersCovered: 5,
    priority: 'High',
    pricing: 'Free',
    pricingDetails: 'Free for non-commercial use',
    dataTypes: ['Repairability Score', 'Repair Guides', 'Difficulty Rating', 'Parts Info'],
    highlights: [
      '✅ FULLY WORKING - No authentication for public endpoints!',
      'Comprehensive repair guides',
      'Repairability scoring system',
      'Difficulty ratings (Easy to Very Difficult)',
      'Free for non-commercial use',
      'Sustainability assessment'
    ],
    status: 'Working',
    statusNote: 'Fully functional - public endpoints'
  },
  {
    name: 'ReviewMeta',
    description: 'Review authenticity analysis with fake review detection, adjusted ratings, and verification of purchase authenticity.',
    url: 'https://reviewmeta.com/',
    signupUrl: 'https://reviewmeta.com/',
    apiDocs: 'https://reviewmeta.com/',
    categories: ['Reviews', 'Quality', 'Authenticity'],
    parametersCovered: 6,
    priority: 'Medium',
    pricing: 'Free',
    pricingDetails: 'Free website (web scraping)',
    dataTypes: ['Review Authenticity', 'Fake Detection', 'Adjusted Ratings'],
    highlights: [
      'Fake review detection',
      'Adjusted rating calculations',
      'Verified purchase analysis',
      'Review pattern detection',
      'Seller manipulation alerts',
      'Free analysis tools'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'Google Trends API',
    description: 'Search interest trends, regional demand, related queries, and popularity metrics for market demand analysis.',
    url: 'https://trends.google.com/',
    signupUrl: 'https://trends.google.com/',
    apiDocs: 'https://pypi.org/project/pytrends/',
    categories: ['Market Data', 'Analytics', 'Demand'],
    parametersCovered: 6,
    priority: 'Medium',
    pricing: 'Free',
    pricingDetails: 'Free (unofficial API)',
    dataTypes: ['Search Trends', 'Popularity', 'Regional Demand', 'Related Queries'],
    highlights: [
      'Free trend analysis',
      'Search interest metrics',
      'Regional demand data',
      'Related query insights',
      'Trending product detection',
      'Historical trend data'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'ENERGY STAR API',
    description: 'Energy efficiency ratings, annual energy costs, consumption data, and certification status for appliances and electronics.',
    url: 'https://www.energystar.gov/productfinder/api',
    signupUrl: 'https://www.energystar.gov/',
    apiDocs: 'https://www.energystar.gov/productfinder/api',
    categories: ['Electronics', 'Sustainability', 'Efficiency'],
    parametersCovered: 6,
    priority: 'Medium',
    pricing: 'Free',
    pricingDetails: 'Free government API',
    dataTypes: ['Energy Efficiency', 'Annual Cost', 'Consumption', 'Certification'],
    highlights: [
      'Government-backed data',
      'Energy efficiency ratings',
      'Annual cost estimates',
      'Consumption metrics',
      'Free API access',
      'Product certifications'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'Consumer Reports',
    description: 'Independent product testing results, reliability ratings, safety assessments, and value ratings from expert testers.',
    url: 'https://www.consumerreports.org/',
    signupUrl: 'https://www.consumerreports.org/',
    apiDocs: 'https://www.consumerreports.org/',
    categories: ['Quality', 'Testing', 'Safety'],
    parametersCovered: 8,
    priority: 'Medium',
    pricing: 'Paid',
    pricingDetails: 'Subscription required (web scraping)',
    dataTypes: ['Test Scores', 'Reliability', 'Safety', 'Value Ratings'],
    highlights: [
      'Independent product testing',
      'Expert reliability ratings',
      'Safety assessments',
      'Value for money scores',
      'Detailed test results',
      'Trusted consumer resource'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'CPSC Recall Database ✅',
    description: 'Consumer Product Safety Commission database of product recalls, safety violations, and hazard information.',
    url: '/api/integrations/cpsc',
    signupUrl: 'https://www.cpsc.gov/',
    apiDocs: 'https://www.saferproducts.gov/RestWebServices/',
    categories: ['Safety', 'Recalls', 'Compliance'],
    parametersCovered: 5,
    priority: 'Medium',
    pricing: 'Free',
    pricingDetails: 'Free government API - No auth required',
    dataTypes: ['Recalls', 'Safety Violations', 'Hazards', 'Warnings'],
    highlights: [
      '✅ FULLY WORKING - No authentication required!',
      'Official recall database',
      'Safety violation tracking',
      'Hazard level assessment',
      'Real-time alerts',
      'Government-backed data'
    ],
    status: 'Working',
    statusNote: 'Fully functional REST API'
  },
  {
    name: 'Trustpilot API',
    description: 'Business review platform with company ratings, review volumes, trends, and customer sentiment analysis.',
    url: 'https://developers.trustpilot.com/',
    signupUrl: 'https://developers.trustpilot.com/',
    apiDocs: 'https://developers.trustpilot.com/',
    categories: ['Reviews', 'Company Info', 'Reputation'],
    parametersCovered: 6,
    priority: 'Low',
    pricing: 'Freemium',
    pricingDetails: 'Free tier available',
    dataTypes: ['Company Ratings', 'Review Count', 'Trends', 'Sentiment'],
    highlights: [
      'Business review access',
      'Company reputation scores',
      'Review volume metrics',
      'Customer sentiment',
      'Trend analysis',
      'Free tier available'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'Fair Trade Certified',
    description: 'Fair trade certifications, labor standards compliance, farmer/worker benefits, and ethical sourcing verification.',
    url: 'https://www.fairtradecertified.org/',
    signupUrl: 'https://www.fairtradecertified.org/',
    apiDocs: 'https://www.fairtradecertified.org/',
    categories: ['Labor', 'Ethics', 'Certification'],
    parametersCovered: 5,
    priority: 'Low',
    pricing: 'Free',
    pricingDetails: 'Public directory',
    dataTypes: ['Fair Trade Status', 'Labor Standards', 'Worker Benefits'],
    highlights: [
      'Fair trade certification',
      'Labor standards tracking',
      'Worker benefit programs',
      'Ethical sourcing verification',
      'Free public access',
      'Farmer support metrics'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'B Corp Directory',
    description: 'B Corporation certification database with impact scores, social performance, and environmental responsibility metrics.',
    url: 'https://www.bcorporation.net/en-us/find-a-b-corp/',
    signupUrl: 'https://www.bcorporation.net/',
    apiDocs: 'https://www.bcorporation.net/',
    categories: ['Corporate', 'Certification', 'Impact'],
    parametersCovered: 5,
    priority: 'Low',
    pricing: 'Free',
    pricingDetails: 'Public directory',
    dataTypes: ['B Corp Status', 'Impact Score', 'Social Performance'],
    highlights: [
      'B Corp certifications',
      'Impact assessment scores',
      'Social performance metrics',
      'Environmental responsibility',
      'Free directory access',
      'Verified benefit corporations'
    ],
    status: 'Not Implemented' as const,
    statusNote: 'Not yet integrated'
  },
  {
    name: 'Barcode/UPC Lookup ✅',
    description: 'Universal barcode and UPC lookup using Open Food Facts and other free databases. Identifies products across all categories.',
    url: '/api/integrations/barcode',
    signupUrl: '/api/integrations/barcode',
    apiDocs: '/api/integrations/barcode',
    categories: ['Product Data', 'Identification'],
    parametersCovered: 5,
    priority: 'High',
    pricing: 'Free',
    pricingDetails: 'Free - No authentication required',
    dataTypes: ['Barcode', 'UPC', 'EAN', 'Product Info', 'Category', 'Brand'],
    highlights: [
      '✅ FULLY WORKING - No authentication!',
      'UPC/EAN/Barcode validation',
      'Product identification',
      'Category detection',
      'Brand identification',
      'Batch lookup support'
    ],
    status: 'Working',
    statusNote: 'Multiple free sources integrated'
  },
  {
    name: 'Open Food Facts ✅',
    description: 'Comprehensive food product database with nutrition facts, ingredients, allergens, Nutri-Score, Eco-Score, and NOVA processing levels.',
    url: '/api/integrations/food',
    signupUrl: 'https://world.openfoodfacts.org/',
    apiDocs: 'https://openfoodfacts.github.io/openfoodfacts-server/api/',
    categories: ['Food', 'Nutrition', 'Sustainability', 'Health'],
    parametersCovered: 25,
    priority: 'Critical',
    pricing: 'Free',
    pricingDetails: 'Free open database - No auth required',
    dataTypes: ['Nutrition', 'Ingredients', 'Allergens', 'Nutri-Score', 'Eco-Score', 'NOVA Group', 'Additives'],
    highlights: [
      '✅ FULLY WORKING - No authentication!',
      '2+ million food products',
      'Nutri-Score (A-E nutrition rating)',
      'Eco-Score (environmental impact)',
      'NOVA processing level (1-4)',
      '25 food-specific parameters!'
    ],
    status: 'Working',
    statusNote: 'Open database - worldwide coverage'
  }
]

const priorities = ['Critical', 'High', 'Medium', 'Low']
const pricingTypes = ['Free', 'Freemium', 'Paid', 'Enterprise']
const statusTypes = ['Working', 'Code Ready', 'Not Implemented']
const categoryTypes = [
  'Product Data',
  'Pricing',
  'ESG',
  'Sustainability',
  'Reviews',
  'Corporate',
  'Supply Chain',
  'Safety',
  'Quality'
]

export default function DataSourcesPage() {
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null)
  const [selectedPricing, setSelectedPricing] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSources = dataSources.filter(source => {
    const matchesPriority = !selectedPriority || source.priority === selectedPriority
    const matchesPricing = !selectedPricing || source.pricing === selectedPricing
    const matchesCategory = !selectedCategory || source.categories.includes(selectedCategory)
    const matchesStatus = !selectedStatus || source.status === selectedStatus
    const matchesSearch = !searchQuery ||
      source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.dataTypes.some(type => type.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesPriority && matchesPricing && matchesCategory && matchesStatus && matchesSearch
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-600'
      case 'High': return 'bg-orange-600'
      case 'Medium': return 'bg-yellow-600'
      case 'Low': return 'bg-green-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Working': return { bg: '#10b981', text: 'white', icon: '✅' }
      case 'Code Ready': return { bg: '#f59e0b', text: 'white', icon: '🔄' }
      case 'Not Implemented': return { bg: '#6b7280', text: 'white', icon: '⚪' }
      default: return { bg: '#6b7280', text: 'white', icon: '⚪' }
    }
  }

  const getPricingIcon = (pricing: string) => {
    switch (pricing) {
      case 'Free': return <Unlock size={16} />
      case 'Freemium': return <Unlock size={16} />
      case 'Paid': return <Lock size={16} />
      case 'Enterprise': return <Lock size={16} />
      default: return <Lock size={16} />
    }
  }

  const totalParameters = filteredSources.reduce((sum, source) => sum + source.parametersCovered, 0)
  const workingCount = dataSources.filter(s => s.status === 'Working').length
  const codeReadyCount = dataSources.filter(s => s.status === 'Code Ready').length
  const notImplementedCount = dataSources.filter(s => s.status === 'Not Implemented').length
  const workingParameters = dataSources.filter(s => s.status === 'Working').reduce((sum, s) => sum + s.parametersCovered, 0)

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
            Veritas Score™ Data Sources
          </h1>
          <p style={{
            fontSize: 'var(--text-xl)',
            opacity: 0.95,
            maxWidth: '800px',
            margin: '0 auto 32px'
          }}>
            Complete collection of APIs and databases to fetch all 96 parameters across 8 product categories for comprehensive product scoring.
          </p>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.25)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid rgba(16, 185, 129, 0.4)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>✅ {workingCount}</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Working Now</div>
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>{workingParameters} params</div>
            </div>
            <div style={{
              background: 'rgba(245, 158, 11, 0.25)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid rgba(245, 158, 11, 0.4)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>🔄 {codeReadyCount}</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Code Ready</div>
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>Needs API keys</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{notImplementedCount}</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Not Implemented</div>
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>Future integrations</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{workingParameters}/96</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Parameters Ready</div>
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>{Math.round(workingParameters/96*100)}% coverage</div>
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
            placeholder="Search data sources..."
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

          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {/* Priority Filter */}
            <div>
              <div style={{ marginBottom: '8px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)' }}>
                Priority Level:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedPriority(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    border: selectedPriority === null ? '2px solid #667eea' : '2px solid var(--border-color)',
                    background: selectedPriority === null ? '#667eea' : 'var(--bg-primary)',
                    color: selectedPriority === null ? 'white' : 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 'var(--font-semibold)',
                    cursor: 'pointer'
                  }}
                >
                  All
                </button>
                {priorities.map(priority => (
                  <button
                    key={priority}
                    onClick={() => setSelectedPriority(priority)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      border: selectedPriority === priority ? '2px solid #667eea' : '2px solid var(--border-color)',
                      background: selectedPriority === priority ? '#667eea' : 'var(--bg-primary)',
                      color: selectedPriority === priority ? 'white' : 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 'var(--font-semibold)',
                      cursor: 'pointer'
                    }}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Filter */}
            <div>
              <div style={{ marginBottom: '8px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)' }}>
                Pricing:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedPricing(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    border: selectedPricing === null ? '2px solid #667eea' : '2px solid var(--border-color)',
                    background: selectedPricing === null ? '#667eea' : 'var(--bg-primary)',
                    color: selectedPricing === null ? 'white' : 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 'var(--font-semibold)',
                    cursor: 'pointer'
                  }}
                >
                  All
                </button>
                {pricingTypes.map(pricing => (
                  <button
                    key={pricing}
                    onClick={() => setSelectedPricing(pricing)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      border: selectedPricing === pricing ? '2px solid #667eea' : '2px solid var(--border-color)',
                      background: selectedPricing === pricing ? '#667eea' : 'var(--bg-primary)',
                      color: selectedPricing === pricing ? 'white' : 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 'var(--font-semibold)',
                      cursor: 'pointer'
                    }}
                  >
                    {pricing}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <div style={{ marginBottom: '8px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)' }}>
                Implementation Status:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedStatus(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    border: selectedStatus === null ? '2px solid #667eea' : '2px solid var(--border-color)',
                    background: selectedStatus === null ? '#667eea' : 'var(--bg-primary)',
                    color: selectedStatus === null ? 'white' : 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 'var(--font-semibold)',
                    cursor: 'pointer'
                  }}
                >
                  All
                </button>
                {statusTypes.map(status => {
                  const statusColor = getStatusColor(status);
                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-full)',
                        border: selectedStatus === status ? `2px solid ${statusColor.bg}` : '2px solid var(--border-color)',
                        background: selectedStatus === status ? statusColor.bg : 'var(--bg-primary)',
                        color: selectedStatus === status ? statusColor.text : 'var(--text-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-semibold)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {statusColor.icon} {status}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <div style={{ marginBottom: '8px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)' }}>
                Data Category:
              </div>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-lg)',
                  border: '2px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 'var(--font-semibold)',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Categories</option>
                {categoryTypes.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div style={{
          marginBottom: '24px',
          fontSize: 'var(--text-lg)',
          color: 'var(--text-secondary)',
          fontWeight: 'var(--font-semibold)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            {filteredSources.length} Data Source{filteredSources.length !== 1 ? 's' : ''} Available
          </span>
          <span style={{ color: '#667eea' }}>
            {totalParameters} Parameters Covered
          </span>
        </div>

        {/* Data Source Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))',
          gap: '24px'
        }}>
          {filteredSources.map((source, index) => (
            <div
              key={index}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-xl)',
                padding: '32px',
                border: '1px solid var(--border-color)',
                transition: 'all 0.3s',
                cursor: 'pointer',
                position: 'relative'
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
              {/* Priority Badge */}
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                display: 'flex',
                gap: '8px'
              }}>
                <div className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getPriorityColor(source.priority)}`}>
                  {source.priority}
                </div>
                <div style={{
                  background: source.pricing === 'Free' || source.pricing === 'Freemium' ? '#10b981' : '#f59e0b',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {getPricingIcon(source.pricing)}
                  {source.pricing}
                </div>
              </div>

              {/* Header */}
              <h3 style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-bold)',
                marginBottom: '12px',
                color: 'var(--text-primary)',
                paddingRight: '120px'
              }}>
                {source.name}
              </h3>

              <p style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
                marginBottom: '16px',
                lineHeight: '1.6'
              }}>
                {source.description}
              </p>

              {/* Status Badge */}
              {(() => {
                const statusColor = getStatusColor(source.status);
                return (
                  <div style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-lg)',
                    background: statusColor.bg,
                    color: statusColor.text,
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    border: `2px solid ${statusColor.bg}`
                  }}>
                    {statusColor.icon} {source.status}
                    {source.statusNote && (
                      <span style={{ fontSize: '12px', opacity: 0.9, marginLeft: '8px' }}>
                        • {source.statusNote}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Parameter Count */}
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '12px 16px',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={20} />
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {source.parametersCovered} Parameters
                  </span>
                </div>
                {source.pricingDetails && (
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    {source.pricingDetails}
                  </div>
                )}
              </div>

              {/* Data Types */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Data Types:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {source.dataTypes.map(type => (
                    <span
                      key={type}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '13px',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        fontWeight: '500'
                      }}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Key Features:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {source.highlights.slice(0, 4).map((highlight, i) => (
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
                  href={source.signupUrl}
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
                <a
                  href={source.apiDocs}
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
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredSources.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-xl)',
            border: '2px dashed var(--border-color)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: '8px' }}>
              No data sources found
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Try adjusting your filters or search query
            </p>
          </div>
        )}

        {/* Implementation Guide */}
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
            Implementation Roadmap
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
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Star size={20} color="#667eea" />
                Phase 1: Core Data (Week 1)
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', marginBottom: '8px' }}>
                Start with critical free APIs for product data, pricing, and basic information.
              </p>
              <ul style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.8', paddingLeft: '20px' }}>
                <li>Amazon PA-API</li>
                <li>eBay Browse API</li>
                <li>Walmart API</li>
                <li>Keepa API</li>
              </ul>
              <div style={{ marginTop: '12px', color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>
                → 40-50 parameters covered
              </div>
            </div>

            <div>
              <h3 style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                marginBottom: '12px',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <BarChart3 size={20} color="#667eea" />
                Phase 2: ESG & Company (Week 2-3)
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', marginBottom: '8px' }}>
                Add sustainability and company data for comprehensive scoring.
              </p>
              <ul style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.8', paddingLeft: '20px' }}>
                <li>Sustainalytics ESG</li>
                <li>Alpha Vantage</li>
                <li>CDP Data</li>
                <li>Clearbit</li>
              </ul>
              <div style={{ marginTop: '12px', color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>
                → 60-70 parameters covered
              </div>
            </div>

            <div>
              <h3 style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                marginBottom: '12px',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Zap size={20} color="#667eea" />
                Phase 3: Quality & Safety (Week 4-6)
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', marginBottom: '8px' }}>
                Complete with review quality, safety data, and category-specific sources.
              </p>
              <ul style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.8', paddingLeft: '20px' }}>
                <li>ReviewMeta</li>
                <li>CPSC/FDA</li>
                <li>EPEAT/ENERGY STAR</li>
                <li>EWG Skin Deep</li>
              </ul>
              <div style={{ marginTop: '12px', color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>
                → 90-96 parameters covered
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

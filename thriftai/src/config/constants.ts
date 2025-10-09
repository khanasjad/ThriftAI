/**
 * Centralized Application Constants
 *
 * All hardcoded values, magic numbers, and repeated strings are defined here.
 * This file serves as the single source of truth for application-wide constants.
 */

/**
 * Environment Constants
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test',
} as const

export type Environment = typeof ENVIRONMENTS[keyof typeof ENVIRONMENTS]

/**
 * Database Constants
 */
export const DATABASE = {
  CASE_MODE: {
    INSENSITIVE: 'insensitive',
    SENSITIVE: 'default',
  },
  QUERY_LIMITS: {
    DEFAULT: 20,
    MAX: 100,
    MIN: 1,
  },
} as const

/**
 * Cache Duration Constants (in seconds)
 */
export const CACHE_DURATION = {
  // Product & Specs
  PRODUCT_SPECS: 30 * 24 * 60 * 60,      // 30 days
  REPAIRABILITY: 30 * 24 * 60 * 60,      // 30 days
  ENERGY_RATING: 90 * 24 * 60 * 60,      // 90 days

  // Warranty & Status
  WARRANTY_STATUS: 7 * 24 * 60 * 60,     // 7 days

  // Seller Information
  SELLER_INFO: 7 * 24 * 60 * 60,         // 7 days
  SELLER_RATING: 7 * 24 * 60 * 60,       // 7 days

  // Market Data
  PRICE_DATA: 24 * 60 * 60,              // 1 day
  STOCK_DATA: 60 * 60,                   // 1 hour
  MARKET_TRENDS: 24 * 60 * 60,           // 1 day

  // Company Data
  COMPANY_BRAND: 30 * 24 * 60 * 60,      // 30 days
  COMPANY_STOCK: 60 * 60,                // 1 hour

  // Product Data (BestBuy)
  PRODUCT_INFO: 7 * 24 * 60 * 60,        // 7 days
  PRODUCT_REVIEWS: 24 * 60 * 60,         // 1 day

  // Brand Sentiment (NewsAPI)
  BRAND_SENTIMENT: 12 * 60 * 60,         // 12 hours

  // General
  SHORT_TERM: 5 * 60,                    // 5 minutes
  MEDIUM_TERM: 60 * 60,                  // 1 hour
  LONG_TERM: 24 * 60 * 60,              // 1 day
} as const

/**
 * Rate Limiting Constants
 */
export const RATE_LIMITS = {
  // External APIs
  GSMARENA: {
    MAX_REQUESTS: 20,
    WINDOW_MS: 60000,      // 1 minute
    DELAY_MS: 3000,        // 3 seconds between requests
  },
  EBAY: {
    MAX_REQUESTS: 5000,
    WINDOW_MS: 86400000,   // 24 hours
    DELAY_MS: 200,         // 200ms between requests
  },
  ALPHA_VANTAGE: {
    MAX_REQUESTS: 5,
    WINDOW_MS: 60000,      // 1 minute
    DELAY_MS: 12000,       // 12 seconds between requests
  },
  IFIXIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60000,      // 1 minute
    DELAY_MS: 600,         // 600ms between requests
  },
  APPLE_WARRANTY: {
    MAX_REQUESTS: 50,
    WINDOW_MS: 60000,      // 1 minute
    DELAY_MS: 1200,        // 1.2 seconds between requests
  },
  DELL_WARRANTY: {
    MAX_REQUESTS: 50,
    WINDOW_MS: 60000,      // 1 minute
    DELAY_MS: 1200,        // 1.2 seconds between requests
  },
  ENERGY_STAR: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60000,      // 1 minute
    DELAY_MS: 600,         // 600ms between requests
  },
  BESTBUY: {
    MAX_REQUESTS: 30,
    WINDOW_MS: 60000,      // 1 minute (50,000/day official limit)
    DELAY_MS: 2000,        // 2 seconds between requests
  },
  NEWSAPI: {
    MAX_REQUESTS: 20,
    WINDOW_MS: 3600000,    // 1 hour (500/day official limit)
    DELAY_MS: 180000,      // 3 minutes between requests
  },

  // Internal APIs
  INTERNAL_DEFAULT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60000,      // 1 minute
  },
  ANONYMOUS_USER: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60000,      // 1 minute
  },
  AUTHENTICATED_USER: {
    MAX_REQUESTS: 1000,
    WINDOW_MS: 60000,      // 1 minute
  },
  ADMIN_USER: {
    MAX_REQUESTS: -1,      // Unlimited
    WINDOW_MS: 60000,
  },
} as const

/**
 * Veritas Score™ Constants
 */
export const VERITAS_SCORE = {
  // Score Ranges
  RANGE: {
    MIN: 0,
    MAX: 100,
  },

  // Grade Thresholds
  GRADES: {
    S: { MIN: 95, MAX: 100, LABEL: 'Exceptional' },
    A: { MIN: 85, MAX: 94, LABEL: 'Excellent' },
    B: { MIN: 75, MAX: 84, LABEL: 'Good' },
    C: { MIN: 65, MAX: 74, LABEL: 'Fair' },
    D: { MIN: 50, MAX: 64, LABEL: 'Below Average' },
    F: { MIN: 0, MAX: 49, LABEL: 'Poor' },
  },

  // Category Weights (must sum to 1.0)
  WEIGHTS: {
    PRODUCT_QUALITY: 0.22,           // 22% (reduced from 25%)
    SELLER_TRUST: 0.18,              // 18% (reduced from 20%)
    MARKET_VALUE: 0.13,              // 13% (reduced from 15%)
    SUSTAINABILITY: 0.10,            // 10% (reduced from 12%)
    PRODUCT_SPECIFICATION: 0.30,     // 30% (INCREASED from 13% - users care most about specs!)
    SECURITY_SAFETY: 0.03,           // 3% (reduced from 5%)
    USER_EXPERIENCE: 0.02,           // 2% (reduced from 5%)
    COMPANY_PERFORMANCE: 0.02,       // 2% (reduced from 5%)
  },

  // Product Specification Sub-Weights (within 30%)
  SPECIFICATION_WEIGHTS: {
    GENERIC_QUALITY: 0.13,           // 13% of total (40% of spec weight) - Completeness, Accuracy, Detail
    CATEGORY_SPECIFIC: 0.17,         // 17% of total (60% of spec weight) - Category-specific parameters
  },

  // Category-Specific Parameters (25 key specs per category)
  CATEGORY_SPECS: {
    ELECTRONICS: [
      'processor', 'ram', 'storage', 'screenSize', 'screenResolution',
      'batteryCapacity', 'batteryHealth', 'camera', 'connectivity', 'ports',
      'gpu', 'os', 'refreshRate', 'weight', 'dimensions',
      'wireless', 'sensors', 'audioOutput', 'expandability', 'thermalDesign',
      'powerConsumption', 'displayType', 'touchscreen', 'stylus', 'biometrics'
    ],
    CLOTHING: [
      'size', 'fit', 'material', 'brand', 'fabricComposition',
      'careInstructions', 'color', 'pattern', 'style', 'season',
      'neckline', 'sleeveLength', 'length', 'waistType', 'closure',
      'pockets', 'lining', 'stretch', 'transparency', 'weight',
      'breathability', 'waterResistance', 'uvProtection', 'antiWrinkle', 'odorResistance'
    ],
    FURNITURE: [
      'dimensions', 'weight', 'weightCapacity', 'material', 'finish',
      'color', 'style', 'assembly', 'numberOfSeats', 'storageCap',
      'adjustability', 'foldable', 'stackable', 'indoor_outdoor', 'fireResistance',
      'waterResistance', 'stainResistance', 'petFriendly', 'childSafe', 'warranty',
      'cushionType', 'frameType', 'legType', 'backSupport', 'armrests'
    ],
    APPLIANCES: [
      'energyRating', 'powerConsumption', 'capacity', 'dimensions', 'weight',
      'noiseLevel', 'speed', 'programs', 'temperature', 'timer',
      'display', 'remoteControl', 'connectivity', 'safety', 'warranty',
      'efficiency', 'cycleTime', 'waterUsage', 'certifications', 'childLock',
      'selfCleaning', 'sensor', 'inverter', 'compressor', 'defrost'
    ],
    BOOKS: [
      'isbn', 'author', 'publisher', 'publicationYear', 'edition',
      'language', 'pages', 'format', 'binding', 'dimensions',
      'weight', 'illustrations', 'genre', 'ageRange', 'grade',
      'seriesName', 'volumeNumber', 'translator', 'foreword', 'index',
      'bibliography', 'printQuality', 'paperType', 'fontSize', 'readingLevel'
    ],
    SPORTS: [
      'sport', 'skill level', 'size', 'weight', 'material',
      'brand', 'certifications', 'safetyRating', 'ageRange', 'weatherResistance',
      'durability', 'gripType', 'cushioning', 'breathability', 'flexibility',
      'shockAbsorption', 'tractio', 'waterproof', 'ventilation', 'adjustability',
      'storageSize', 'portability', 'teamOrIndividual', 'indoorOutdoor', 'season'
    ],
  },

  // Data Quality Thresholds
  DATA_QUALITY: {
    EXCELLENT: 90,
    GOOD: 75,
    FAIR: 60,
    POOR: 0,
  },

  // Confidence Levels
  CONFIDENCE: {
    HIGH: 0.9,
    MEDIUM: 0.7,
    LOW: 0.5,
    VERY_LOW: 0.3,
  },

  // Total Parameters
  TOTAL_PARAMETERS: 121,

  // SSN Format
  SSN_PREFIX: 'VS',
  SSN_DATE_FORMAT: 'YYYYMMDD',
} as const

/**
 * Product Pricing Constants
 */
export const PRICING = {
  // Discount Ranges
  DISCOUNT: {
    PREMIUM_MIN: 0.05,
    PREMIUM_MAX: 0.15,
    STANDARD_MIN: 0.15,
    STANDARD_MAX: 0.40,
  },

  // Price Quality Indicators
  QUALITY_MULTIPLIER: {
    EXCELLENT: 0.9,    // 90% of original
    GOOD: 0.7,         // 70% of original
    FAIR: 0.5,         // 50% of original
    POOR: 0.3,         // 30% of original
  },

  // Savings Display
  SAVINGS_THRESHOLD: 0.10,  // Show savings if discount >= 10%
} as const

/**
 * External API Base URLs
 */
export const EXTERNAL_API_URLS = {
  ALPHA_VANTAGE: 'https://www.alphavantage.co/query',
  EBAY_FINDING: 'https://svcs.ebay.com/services/search/FindingService/v1',
  GSMARENA: 'https://www.gsmarena.com',
  IFIXIT: 'https://www.ifixit.com/api/2.0',
  ENERGY_STAR: 'https://data.energystar.gov/resource',
  APPLE_WARRANTY: 'https://support-sp.apple.com/sp',
  DELL_WARRANTY: 'https://apigtwb2c.us.dell.com/PROD/sbil/eapi/v5',
  BESTBUY: 'https://api.bestbuy.com/v1',
  NEWSAPI: 'https://newsapi.org/v2',
} as const

/**
 * Image CDN URLs
 */
export const IMAGE_CDN = {
  AMAZON: 'https://images-na.ssl-images-amazon.com',
  EBAY: 'https://i.ebayimg.com',
  PLACEHOLDER: 'https://placehold.co',
} as const

/**
 * Pagination Constants
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const

/**
 * Search Constants
 */
export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 200,
  DEBOUNCE_MS: 300,
  DEFAULT_RESULTS: 20,
  MAX_RESULTS: 100,
} as const

/**
 * Product Categories
 */
export const PRODUCT_CATEGORIES = {
  ELECTRONICS: 'ELECTRONICS',
  CLOTHING: 'CLOTHING',
  FURNITURE: 'FURNITURE',
  BOOKS: 'BOOKS',
  TOYS: 'TOYS',
  SPORTS: 'SPORTS',
  BEAUTY: 'BEAUTY',
  HOME: 'HOME',
  AUTOMOTIVE: 'AUTOMOTIVE',
  JEWELRY: 'JEWELRY',
} as const

export type ProductCategory = typeof PRODUCT_CATEGORIES[keyof typeof PRODUCT_CATEGORIES]

/**
 * Product Conditions
 */
export const PRODUCT_CONDITIONS = {
  NEW: 'NEW',
  LIKE_NEW: 'LIKE_NEW',
  VERY_GOOD: 'VERY_GOOD',
  GOOD: 'GOOD',
  ACCEPTABLE: 'ACCEPTABLE',
  REFURBISHED: 'REFURBISHED',
  CERTIFIED_REFURBISHED: 'CERTIFIED_REFURBISHED',
  FOR_PARTS: 'FOR_PARTS',
} as const

export type ProductCondition = typeof PRODUCT_CONDITIONS[keyof typeof PRODUCT_CONDITIONS]

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  // Generic
  INTERNAL_ERROR: 'An internal server error occurred',
  INVALID_REQUEST: 'Invalid request parameters',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',

  // Product
  PRODUCT_NOT_FOUND: 'Product not found',
  PRODUCT_UNAVAILABLE: 'Product is not available',
  INVALID_PRODUCT_ID: 'Invalid product ID',

  // Search
  INVALID_SEARCH_QUERY: 'Invalid search query',
  SEARCH_QUERY_TOO_SHORT: 'Search query must be at least 2 characters',
  SEARCH_QUERY_TOO_LONG: 'Search query cannot exceed 200 characters',

  // Veritas Score
  SCORE_CALCULATION_FAILED: 'Failed to calculate Veritas Score',
  SCORE_NOT_FOUND: 'Veritas Score not found for this product',
  INSUFFICIENT_DATA: 'Insufficient data to calculate score',

  // External API
  EXTERNAL_API_ERROR: 'External API request failed',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later',
  API_KEY_MISSING: 'API key is missing or invalid',

  // Database
  DATABASE_ERROR: 'Database operation failed',
  DUPLICATE_ENTRY: 'Duplicate entry exists',
} as const

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  SCORE_CALCULATED: 'Veritas Score calculated successfully',
  SCORE_SAVED: 'Score saved successfully',
} as const

/**
 * Log Levels
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const

/**
 * Timeouts (in milliseconds)
 */
export const TIMEOUTS = {
  SHORT: 5000,       // 5 seconds
  MEDIUM: 10000,     // 10 seconds
  LONG: 30000,       // 30 seconds
  VERY_LONG: 60000,  // 1 minute
} as const

/**
 * Regex Patterns
 */
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  PRODUCT_ID: /^[a-zA-Z0-9_-]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/,
} as const

/**
 * Feature Flags
 */
export const FEATURE_FLAGS = {
  ENABLE_AI_SEARCH: true,
  ENABLE_VISUAL_SEARCH: true,
  ENABLE_SWIPE_MODE: true,
  ENABLE_CHAT_ASSISTANT: true,
  ENABLE_BATCH_SCORING: true,
  ENABLE_REAL_TIME_UPDATES: false,
  ENABLE_ADVANCED_ANALYTICS: false,
} as const

/**
 * File Upload Constants
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024,  // 10 MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
} as const

/**
 * UI Constants
 */
export const UI = {
  TOAST_DURATION: 3000,        // 3 seconds
  MODAL_ANIMATION_DURATION: 300, // 300ms
  DEBOUNCE_DELAY: 300,         // 300ms
  SKELETON_ITEMS: 5,
  ITEMS_PER_PAGE: 20,
} as const

/**
 * Date Formats
 */
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  FULL: 'MMMM DD, YYYY HH:mm:ss',
  SHORT: 'MM/DD/YY',
  ISO: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss',
} as const

/**
 * Currency
 */
export const CURRENCY = {
  DEFAULT: 'USD',
  SYMBOL: '$',
  LOCALE: 'en-US',
} as const

/**
 * Export all constants as a single object for convenience
 */
export const CONSTANTS = {
  ENVIRONMENTS,
  DATABASE,
  CACHE_DURATION,
  RATE_LIMITS,
  VERITAS_SCORE,
  PRICING,
  EXTERNAL_API_URLS,
  IMAGE_CDN,
  PAGINATION,
  SEARCH,
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOG_LEVELS,
  TIMEOUTS,
  REGEX,
  FEATURE_FLAGS,
  FILE_UPLOAD,
  UI,
  DATE_FORMATS,
  CURRENCY,
} as const

export default CONSTANTS

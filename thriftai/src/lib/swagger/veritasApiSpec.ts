/**
 * OpenAPI 3.0 Specification for Veritas Score™ APIs
 */

export const veritasApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Veritas Score™ API',
    version: '1.0.0',
    description: `
# Veritas Score™ API Documentation

Universal Product Quality Assessment System - The IMDB of Products

## Overview

Veritas Score™ provides comprehensive quality assessment for products using 121 parameters across 8 major categories:

1. **Product Quality** (25%) - Physical condition, authenticity, specifications
2. **Seller Trust** (20%) - Seller reputation, ratings, transaction history
3. **Market Value** (15%) - Price fairness, market positioning
4. **Sustainability** (12%) - Environmental impact, circular economy
5. **Security & Safety** (5%) - Payment security, buyer protection
6. **User Experience** (5%) - Listing quality, purchase experience
7. **Product Specification** (13%) - Category-specific technical specs
8. **Company Performance** (5%) - Brand reputation, stock performance

## Relational Data Architecture

The system uses an **8-table relational architecture** for 99.4% efficiency gain:

- **VeritasCompanyProfile** - Shared brand data (1 company → many products)
- **VeritasProductSpec** - Model specifications (1 spec → many units)
- **VeritasSellerProfile** - Seller trust data (1 seller → many listings)
- **VeritasSecurityPolicy** - Platform security (1 platform → many products)
- **VeritasProductQuality** - Product condition (1:1 with product)
- **VeritasMarketData** - Time-series pricing (1 product → many snapshots)
- **VeritasSustainability** - Environmental metrics (1:1 with product)
- **VeritasUserExperience** - Listing quality (1:1 with product)

## FREE Data Sources

All APIs leverage FREE external data sources:
- Alpha Vantage (stock market data)
- eBay Finding API (seller ratings, pricing)
- GSMArena (phone specifications)
- Apple/Dell Warranty APIs
- iFixit (repairability scores)
- Energy Star (certifications)

## Authentication

Currently, no authentication is required for API access. In production, use API keys.
    `,
    contact: {
      name: 'ThriftAI Support',
      url: 'https://thriftai.com/support'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    },
    {
      url: 'http://localhost:3000',
      description: 'Local development server (alternative port)'
    },
    {
      url: 'https://api.thriftai.com',
      description: 'Production server'
    }
  ],
  tags: [
    {
      name: 'Products',
      description: 'Product listing and filtering with Veritas Scores'
    },
    {
      name: 'Veritas Score',
      description: 'Calculate and retrieve Veritas Scores for products'
    },
    {
      name: 'Company Profiles',
      description: 'Company-level data (brand reputation, stock data)'
    },
    {
      name: 'Seller Profiles',
      description: 'Seller trust and reputation data'
    }
  ],
  paths: {
    '/api/products/veritas': {
      get: {
        tags: ['Products'],
        summary: 'List products with Veritas Scores',
        description: 'Fetch paginated list of products with their Veritas Scores, company profiles, and seller profiles. Supports filtering by category and minimum score.',
        operationId: 'listProductsWithScores',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of products to return',
            required: false,
            schema: {
              type: 'integer',
              default: 20,
              minimum: 1,
              maximum: 100
            }
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of products to skip (for pagination)',
            required: false,
            schema: {
              type: 'integer',
              default: 0,
              minimum: 0
            }
          },
          {
            name: 'category',
            in: 'query',
            description: 'Filter by product category',
            required: false,
            schema: {
              type: 'string',
              enum: ['ELECTRONICS', 'PHONES', 'LAPTOPS', 'ACCESSORIES', 'TABLETS', 'WEARABLES']
            }
          },
          {
            name: 'minScore',
            in: 'query',
            description: 'Minimum Veritas Score (0-100)',
            required: false,
            schema: {
              type: 'number',
              minimum: 0,
              maximum: 100
            }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response with products list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    products: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/ProductWithScore'
                      }
                    },
                    pagination: {
                      $ref: '#/components/schemas/Pagination'
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/test/veritas-score': {
      get: {
        tags: ['Veritas Score'],
        summary: 'Calculate Veritas Score for a product',
        description: 'Calculate comprehensive Veritas Score for a specific product. Returns detailed breakdown of all 121 parameters across 8 categories, along with FREE API usage statistics.',
        operationId: 'calculateVeritasScore',
        parameters: [
          {
            name: 'productId',
            in: 'query',
            description: 'Unique product identifier',
            required: true,
            schema: {
              type: 'string',
              example: 'cmgbavx8n0000rm3iapspwsth'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Successful score calculation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/VeritasScoreDetail'
                }
              }
            }
          },
          '400': {
            description: 'Missing productId parameter',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '404': {
            description: 'Product not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '500': {
            description: 'Score calculation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      ProductWithScore: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Product unique identifier',
            example: 'cmgbavx8n0000rm3iapspwsth'
          },
          name: {
            type: 'string',
            description: 'Product name',
            example: 'iPhone 15 Pro Max 256GB'
          },
          category: {
            type: 'string',
            description: 'Product category',
            example: 'PHONES'
          },
          brand: {
            type: 'string',
            nullable: true,
            description: 'Brand name',
            example: 'Apple'
          },
          price: {
            type: 'number',
            format: 'float',
            description: 'Current price in USD',
            example: 899.99
          },
          originalPrice: {
            type: 'number',
            format: 'float',
            description: 'Original retail price in USD',
            example: 1199.99
          },
          condition: {
            type: 'string',
            nullable: true,
            description: 'Product condition',
            example: 'Certified Refurbished',
            enum: ['New', 'Like New', 'Excellent', 'Good', 'Fair', 'Poor', 'Certified Refurbished']
          },
          imageUrl: {
            type: 'string',
            nullable: true,
            description: 'Product image URL',
            example: 'https://example.com/iphone15.jpg'
          },
          veritasScore: {
            $ref: '#/components/schemas/VeritasScoreSummary'
          },
          companyProfile: {
            $ref: '#/components/schemas/CompanyProfileSummary'
          },
          sellerProfile: {
            $ref: '#/components/schemas/SellerProfileSummary'
          }
        }
      },
      VeritasScoreSummary: {
        type: 'object',
        nullable: true,
        properties: {
          ssn: {
            type: 'string',
            description: 'Score Serial Number',
            example: 'ELEC-87.2-HC'
          },
          overallScore: {
            type: 'number',
            format: 'float',
            description: 'Overall Veritas Score (0-100)',
            example: 87.2,
            minimum: 0,
            maximum: 100
          },
          confidence: {
            type: 'number',
            format: 'float',
            description: 'Confidence level (0-1)',
            example: 0.89,
            minimum: 0,
            maximum: 1
          },
          dataQualityScore: {
            type: 'number',
            format: 'float',
            description: 'Data quality percentage',
            example: 85.5,
            minimum: 0,
            maximum: 100
          },
          calculatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'When the score was calculated',
            example: '2025-10-03T21:30:00Z'
          },
          categories: {
            type: 'array',
            description: 'Category-level score breakdown',
            items: {
              $ref: '#/components/schemas/CategoryScoreSummary'
            }
          }
        }
      },
      CategoryScoreSummary: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Category name',
            example: 'PRODUCT_QUALITY',
            enum: [
              'PRODUCT_QUALITY',
              'SELLER_TRUST',
              'MARKET_VALUE',
              'SUSTAINABILITY',
              'SECURITY_SAFETY',
              'USER_EXPERIENCE',
              'PRODUCT_SPECIFICATION',
              'COMPANY_PERFORMANCE'
            ]
          },
          score: {
            type: 'number',
            format: 'float',
            description: 'Category score (0-100)',
            example: 92.5
          },
          weight: {
            type: 'number',
            format: 'float',
            description: 'Category weight (0-1)',
            example: 0.25
          },
          weightedScore: {
            type: 'number',
            format: 'float',
            description: 'Weighted contribution to overall score',
            example: 23.125
          }
        }
      },
      VeritasScoreDetail: {
        type: 'object',
        properties: {
          ssn: {
            type: 'string',
            description: 'Score Serial Number',
            example: 'ELEC-87.2-HC'
          },
          overallScore: {
            type: 'number',
            format: 'float',
            description: 'Overall Veritas Score (0-100)',
            example: 87.2
          },
          confidence: {
            type: 'number',
            format: 'float',
            description: 'Confidence level (0-1)',
            example: 0.89
          },
          dataQualityScore: {
            type: 'number',
            format: 'float',
            description: 'Data quality percentage',
            example: 85.5
          },
          calculatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-10-03T21:30:00Z'
          },
          categories: {
            type: 'array',
            description: 'Detailed category breakdown',
            items: {
              $ref: '#/components/schemas/CategoryDetail'
            }
          },
          missingDataFields: {
            type: 'array',
            description: 'List of parameters with missing data',
            items: {
              type: 'string'
            }
          },
          freeDataSummary: {
            $ref: '#/components/schemas/FreeDataSummary'
          }
        }
      },
      CategoryDetail: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            example: 'PRODUCT_QUALITY'
          },
          score: {
            type: 'number',
            format: 'float',
            example: 92.5
          },
          weight: {
            type: 'number',
            format: 'float',
            example: 0.25
          },
          weightedScore: {
            type: 'number',
            format: 'float',
            example: 23.125
          },
          confidence: {
            type: 'number',
            format: 'float',
            example: 0.91
          },
          parameters: {
            type: 'array',
            description: 'Individual parameter scores',
            items: {
              $ref: '#/components/schemas/ParameterDetail'
            }
          }
        }
      },
      ParameterDetail: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Parameter name',
            example: 'Battery Health'
          },
          code: {
            type: 'string',
            description: 'Parameter code',
            example: 'PQ_BATTERY_HEALTH'
          },
          rawValue: {
            type: 'string',
            nullable: true,
            description: 'Raw parameter value',
            example: '95%'
          },
          normalizedScore: {
            type: 'number',
            format: 'float',
            description: 'Normalized score (0-100)',
            example: 95.0
          },
          weightedScore: {
            type: 'number',
            format: 'float',
            description: 'Weighted contribution',
            example: 9.5
          },
          dataSource: {
            type: 'string',
            description: 'Data source',
            example: 'apple_warranty',
            enum: [
              'product_data',
              'seller_profile',
              'company_profile',
              'gsmarena',
              'apple_warranty',
              'dell_warranty',
              'ifixit',
              'ebay',
              'alpha_vantage',
              'energy_star',
              'brand_analysis',
              'market_data',
              'n/a'
            ]
          },
          confidence: {
            type: 'number',
            format: 'float',
            description: 'Parameter confidence (0-1)',
            example: 0.95
          },
          isMissing: {
            type: 'boolean',
            description: 'Whether data is missing',
            example: false
          },
          isRealData: {
            type: 'boolean',
            description: 'Whether from FREE API source',
            example: true
          }
        }
      },
      FreeDataSummary: {
        type: 'object',
        properties: {
          totalParameters: {
            type: 'integer',
            description: 'Total parameters evaluated',
            example: 121
          },
          parametersUsingFreeAPIs: {
            type: 'integer',
            description: 'Parameters fetched from FREE APIs',
            example: 45
          },
          freeAPIsUsed: {
            type: 'array',
            description: 'List of FREE APIs called',
            items: {
              type: 'string'
            },
            example: ['gsmarena', 'apple_warranty', 'alpha_vantage', 'ebay']
          }
        }
      },
      CompanyProfileSummary: {
        type: 'object',
        nullable: true,
        properties: {
          brandName: {
            type: 'string',
            example: 'Apple'
          },
          brandReputation: {
            type: 'number',
            format: 'float',
            description: 'Brand reputation score (0-100)',
            example: 95.0
          },
          stockSymbol: {
            type: 'string',
            nullable: true,
            description: 'Stock ticker symbol',
            example: 'AAPL'
          }
        }
      },
      SellerProfileSummary: {
        type: 'object',
        nullable: true,
        properties: {
          seller: {
            type: 'string',
            description: 'Seller identifier',
            example: 'top_seller_123'
          },
          rating: {
            type: 'number',
            format: 'float',
            description: 'Seller rating (0-5)',
            example: 4.8
          },
          isTopRated: {
            type: 'boolean',
            description: 'Top-rated seller status',
            example: true
          }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          total: {
            type: 'integer',
            description: 'Total number of products',
            example: 150
          },
          limit: {
            type: 'integer',
            description: 'Page size',
            example: 20
          },
          offset: {
            type: 'integer',
            description: 'Current offset',
            example: 0
          },
          hasMore: {
            type: 'boolean',
            description: 'Whether more pages exist',
            example: true
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Product not found'
          },
          stack: {
            type: 'string',
            description: 'Error stack trace (development only)',
            example: 'Error: Product not found\n  at ...'
          }
        }
      }
    }
  }
}

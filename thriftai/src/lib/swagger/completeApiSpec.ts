/**
 * Complete OpenAPI 3.0 Specification for ThriftAI Platform
 * Includes ALL API endpoints across the entire module
 */

export const completeApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ThriftAI Platform API',
    version: '2.0.0',
    description: `
# ThriftAI Platform - Complete API Documentation

AI-Powered Secondhand Marketplace with Universal Product Quality Assessment

## Platform Features

- **Veritas Score™** - 121-parameter quality assessment system (The IMDB of Products)
- **AI-Powered Search** - Claude-enhanced semantic search with natural language
- **Visual Search** - Image-based product discovery
- **Smart Recommendations** - Personalized product suggestions
- **Swipe Interface** - Tinder-style product discovery
- **Real-time Chat** - AI shopping advisor
- **Dynamic Pricing** - Market-based pricing optimization
- **Sustainability Metrics** - Environmental impact tracking

## Architecture Highlights

- **8-Table Relational System** - 99.4% efficiency gain through data caching
- **FREE API Integrations** - Alpha Vantage, eBay, GSMArena, iFixit, Energy Star
- **Dual Environment** - Separate test and production interfaces
- **OpenAI Integration** - ChatGPT-4 for conversational search
- **Prisma ORM** - Type-safe database access with PostgreSQL
    `,
    contact: {
      name: 'ThriftAI Support',
      email: 'support@thriftai.com',
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
      description: 'Development server (primary)'
    },
    {
      url: 'http://localhost:3000',
      description: 'Development server (alt port)'
    },
    {
      url: 'https://api.thriftai.com',
      description: 'Production server'
    }
  ],
  tags: [
    { name: 'Products', description: 'Product catalog and management' },
    { name: 'Veritas Score', description: 'Universal quality assessment system' },
    { name: 'Search', description: 'AI-powered search and discovery' },
    { name: 'Cart & Checkout', description: 'Shopping cart and payment processing' },
    { name: 'Buyers', description: 'Buyer registration and profiles' },
    { name: 'Swipe', description: 'Tinder-style product discovery' },
    { name: 'Chat', description: 'AI shopping assistant' },
    { name: 'Admin', description: 'Administrative operations' },
    { name: 'Leaderboard', description: 'Product rankings and analytics' },
    { name: 'Categories', description: 'Product categorization' },
    { name: 'Visual Search', description: 'Image-based search' },
    { name: 'Orders', description: 'Order management' },
    { name: 'Reviews', description: 'Product reviews and ratings' }
  ],
  paths: {
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'List products',
        description: 'Get paginated list of products with optional filtering',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }},
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }},
          { name: 'category', in: 'query', schema: { type: 'string' }},
          { name: 'brand', in: 'query', schema: { type: 'string' }},
          { name: 'minPrice', in: 'query', schema: { type: 'number' }},
          { name: 'maxPrice', in: 'query', schema: { type: 'number' }},
          { name: 'condition', in: 'query', schema: { type: 'string' }},
          { name: 'search', in: 'query', schema: { type: 'string' }}
        ],
        responses: {
          '200': { description: 'Product list', content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductListResponse' }}}},
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get product by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }}],
        responses: {
          '200': { description: 'Product details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' }}}},
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/products/{id}/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'Get product reviews',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }}],
        responses: {
          '200': { description: 'Review list' }
        }
      },
      post: {
        tags: ['Reviews'],
        summary: 'Create product review',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }}],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rating', 'comment'],
                properties: {
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                  comment: { type: 'string' },
                  userId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Review created' },
          '400': { $ref: '#/components/responses/BadRequest' }
        }
      }
    },
    '/api/products/veritas': {
      get: {
        tags: ['Veritas Score', 'Products'],
        summary: 'List products with Veritas Scores',
        description: 'Get products with comprehensive quality scores, company profiles, and seller profiles',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 }},
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 }},
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['ELECTRONICS', 'PHONES', 'LAPTOPS', 'ACCESSORIES'] }},
          { name: 'minScore', in: 'query', schema: { type: 'number', minimum: 0, maximum: 100 }}
        ],
        responses: {
          '200': { description: 'Products with scores', content: { 'application/json': { schema: { $ref: '#/components/schemas/VeritasProductList' }}}},
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/test/veritas-score': {
      get: {
        tags: ['Veritas Score'],
        summary: 'Calculate Veritas Score',
        description: 'Calculate comprehensive 121-parameter quality score for a product',
        parameters: [{ name: 'productId', in: 'query', required: true, schema: { type: 'string' }}],
        responses: {
          '200': { description: 'Score calculated', content: { 'application/json': { schema: { $ref: '#/components/schemas/VeritasScoreDetail' }}}},
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/veritas/{productId}': {
      get: {
        tags: ['Veritas Score'],
        summary: 'Get stored Veritas Score',
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' }}],
        responses: {
          '200': { description: 'Stored score' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/veritas/calculate': {
      post: {
        tags: ['Veritas Score'],
        summary: 'Calculate and save score',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', required: ['productId'], properties: { productId: { type: 'string' }}}
            }
          }
        },
        responses: {
          '200': { description: 'Score calculated and saved' }
        }
      }
    },
    '/api/veritas/compare': {
      post: {
        tags: ['Veritas Score'],
        summary: 'Compare Veritas Scores',
        description: 'Compare quality scores between multiple products',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', required: ['productIds'], properties: { productIds: { type: 'array', items: { type: 'string' }}}}
            }
          }
        },
        responses: {
          '200': { description: 'Comparison results' }
        }
      }
    },
    '/api/buyers/search': {
      get: {
        tags: ['Search'],
        summary: 'Buyer product search',
        description: 'Search products with buyer-specific filters and preferences',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }},
          { name: 'category', in: 'query', schema: { type: 'string' }},
          { name: 'minPrice', in: 'query', schema: { type: 'number' }},
          { name: 'maxPrice', in: 'query', schema: { type: 'number' }},
          { name: 'condition', in: 'query', schema: { type: 'string' }}
        ],
        responses: {
          '200': { description: 'Search results' }
        }
      }
    },
    '/api/buyers/claude-search': {
      post: {
        tags: ['Search'],
        summary: 'AI-enhanced semantic search',
        description: 'Use Claude AI for intelligent product search with natural language',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query'],
                properties: {
                  query: { type: 'string', example: 'Find vintage designer bags under $200' },
                  filters: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'AI search results' }
        }
      }
    },
    '/api/buyers/enhanced-search': {
      post: {
        tags: ['Search'],
        summary: 'Enhanced search with ML',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', required: ['query'], properties: { query: { type: 'string' }, filters: { type: 'object' }}}
            }
          }
        },
        responses: {
          '200': { description: 'Enhanced search results' }
        }
      }
    },
    '/api/buyers/chat-search': {
      post: {
        tags: ['Search', 'Chat'],
        summary: 'Conversational search',
        description: 'Chat-based product search with context awareness',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string' },
                  conversationHistory: { type: 'array', items: { type: 'object' }}
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Chat response with product suggestions' }
        }
      }
    },
    '/api/smart-search': {
      post: {
        tags: ['Search'],
        summary: 'Smart search with AI ranking',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', required: ['query'], properties: { query: { type: 'string' }}}
            }
          }
        },
        responses: {
          '200': { description: 'Ranked search results' }
        }
      }
    },
    '/api/enhanced-search': {
      get: {
        tags: ['Search'],
        summary: 'Enhanced product search',
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' }}],
        responses: {
          '200': { description: 'Search results' }
        }
      }
    },
    '/api/visual-search': {
      post: {
        tags: ['Visual Search'],
        summary: 'Image-based product search',
        description: 'Upload an image to find similar products',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: {
                  image: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Similar products' }
        }
      }
    },
    '/api/cart': {
      get: {
        tags: ['Cart & Checkout'],
        summary: 'Get shopping cart',
        parameters: [{ name: 'sessionId', in: 'query', schema: { type: 'string' }}],
        responses: {
          '200': { description: 'Cart contents' }
        }
      },
      post: {
        tags: ['Cart & Checkout'],
        summary: 'Add to cart',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId', 'quantity'],
                properties: {
                  productId: { type: 'string' },
                  quantity: { type: 'integer', minimum: 1 },
                  sessionId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Item added' },
          '400': { $ref: '#/components/responses/BadRequest' }
        }
      },
      delete: {
        tags: ['Cart & Checkout'],
        summary: 'Remove from cart',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId'],
                properties: {
                  productId: { type: 'string' },
                  sessionId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Item removed' }
        }
      }
    },
    '/api/cart/migrate': {
      post: {
        tags: ['Cart & Checkout'],
        summary: 'Migrate guest cart to user',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sessionId', 'userId'],
                properties: {
                  sessionId: { type: 'string' },
                  userId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Cart migrated' }
        }
      }
    },
    '/api/checkout': {
      post: {
        tags: ['Cart & Checkout'],
        summary: 'Create checkout session',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['cartId'],
                properties: {
                  cartId: { type: 'string' },
                  shippingAddress: { type: 'object' },
                  paymentMethod: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Checkout session created' }
        }
      }
    },
    '/api/checkout/create-order': {
      post: {
        tags: ['Cart & Checkout', 'Orders'],
        summary: 'Create order from checkout',
        responses: {
          '201': { description: 'Order created' }
        }
      }
    },
    '/api/orders/{orderId}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order details',
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' }}],
        responses: {
          '200': { description: 'Order details' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/buyers/register': {
      post: {
        tags: ['Buyers'],
        summary: 'Register new buyer',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                  phone: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Buyer registered' },
          '400': { $ref: '#/components/responses/BadRequest' }
        }
      }
    },
    '/api/buyers/filters': {
      get: {
        tags: ['Buyers'],
        summary: 'Get buyer filter options',
        description: 'Get available filter options for buyer search',
        responses: {
          '200': { description: 'Filter options' }
        }
      }
    },
    '/api/buyers/ai-shopping-advisor': {
      post: {
        tags: ['Buyers', 'Chat'],
        summary: 'AI shopping advisor',
        description: 'Get personalized shopping advice from AI',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['question'],
                properties: {
                  question: { type: 'string' },
                  context: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'AI advisor response' }
        }
      }
    },
    '/api/swipe/initialize': {
      post: {
        tags: ['Swipe'],
        summary: 'Initialize swipe session',
        description: 'Start a new Tinder-style product discovery session',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  preferences: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Swipe session initialized' }
        }
      }
    },
    '/api/swipe/action': {
      post: {
        tags: ['Swipe'],
        summary: 'Record swipe action',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId', 'action'],
                properties: {
                  productId: { type: 'string' },
                  action: { type: 'string', enum: ['like', 'dislike', 'superlike'] },
                  sessionId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Action recorded' }
        }
      }
    },
    '/api/swipe/summary/{productId}': {
      get: {
        tags: ['Swipe'],
        summary: 'Get swipe summary',
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' }}],
        responses: {
          '200': { description: 'Swipe statistics' }
        }
      }
    },
    '/api/chat': {
      post: {
        tags: ['Chat'],
        summary: 'Chat with AI assistant',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string' },
                  history: { type: 'array' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'AI response' }
        }
      }
    },
    '/api/leaderboard': {
      get: {
        tags: ['Leaderboard'],
        summary: 'Get product leaderboard',
        description: 'Get top-ranked products by various metrics',
        parameters: [
          { name: 'metric', in: 'query', schema: { type: 'string', enum: ['score', 'popularity', 'trending', 'value'] }},
          { name: 'category', in: 'query', schema: { type: 'string' }},
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }}
        ],
        responses: {
          '200': { description: 'Leaderboard data' }
        }
      }
    },
    '/api/categories': {
      get: {
        tags: ['Categories'],
        summary: 'Get product categories',
        responses: {
          '200': { description: 'Category list' }
        }
      }
    },
    '/api/filters': {
      get: {
        tags: ['Products'],
        summary: 'Get filter options',
        responses: {
          '200': { description: 'Available filters' }
        }
      }
    },
    '/api/marketplace/compare': {
      post: {
        tags: ['Products'],
        summary: 'Compare products',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productIds'],
                properties: {
                  productIds: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 5 }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Product comparison' }
        }
      }
    },
    '/api/admin/products': {
      get: {
        tags: ['Admin'],
        summary: 'Admin product list',
        description: 'Get all products with admin-level details',
        responses: {
          '200': { description: 'Admin product list' },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/api/admin/rescore-products': {
      post: {
        tags: ['Admin'],
        summary: 'Recalculate all Veritas Scores',
        description: 'Trigger batch recalculation of Veritas Scores for all products',
        responses: {
          '200': { description: 'Rescoring initiated' },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/api/admin/clear-cache': {
      post: {
        tags: ['Admin'],
        summary: 'Clear API cache',
        description: 'Clear cached data from external APIs',
        responses: {
          '200': { description: 'Cache cleared' }
        }
      }
    },
    '/api/config/score-thresholds': {
      get: {
        tags: ['Admin'],
        summary: 'Get score thresholds',
        responses: {
          '200': { description: 'Score configuration' }
        }
      },
      put: {
        tags: ['Admin'],
        summary: 'Update score thresholds',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  excellent: { type: 'number' },
                  good: { type: 'number' },
                  fair: { type: 'number' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Thresholds updated' }
        }
      }
    },
    '/api/products/enrich': {
      post: {
        tags: ['Admin'],
        summary: 'Enrich product data',
        description: 'Fetch additional data for products from external sources',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId'],
                properties: {
                  productId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Product enriched' }
        }
      }
    },
    '/api/csrf-token': {
      get: {
        tags: ['Security'],
        summary: 'Get CSRF token',
        responses: {
          '200': { description: 'CSRF token' }
        }
      }
    }
  },
  components: {
    schemas: {
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
          brand: { type: 'string', nullable: true },
          price: { type: 'number' },
          originalPrice: { type: 'number' },
          condition: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          imageUrl: { type: 'string', nullable: true },
          stockQuantity: { type: 'integer' },
          isAvailable: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      ProductListResponse: {
        type: 'object',
        properties: {
          products: { type: 'array', items: { $ref: '#/components/schemas/Product' }},
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          hasMore: { type: 'boolean' }
        }
      },
      VeritasProductList: {
        type: 'object',
        properties: {
          products: { type: 'array', items: { $ref: '#/components/schemas/ProductWithScore' }},
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      },
      ProductWithScore: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
          brand: { type: 'string', nullable: true },
          price: { type: 'number' },
          originalPrice: { type: 'number' },
          condition: { type: 'string', nullable: true },
          imageUrl: { type: 'string', nullable: true },
          veritasScore: { $ref: '#/components/schemas/VeritasScoreSummary' },
          companyProfile: { $ref: '#/components/schemas/CompanyProfileSummary' },
          sellerProfile: { $ref: '#/components/schemas/SellerProfileSummary' }
        }
      },
      VeritasScoreSummary: {
        type: 'object',
        nullable: true,
        properties: {
          ssn: { type: 'string' },
          overallScore: { type: 'number', format: 'float' },
          confidence: { type: 'number', format: 'float' },
          dataQualityScore: { type: 'number', format: 'float' },
          calculatedAt: { type: 'string', format: 'date-time' },
          categories: { type: 'array', items: { $ref: '#/components/schemas/CategoryScoreSummary' }}
        }
      },
      CategoryScoreSummary: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          score: { type: 'number' },
          weight: { type: 'number' },
          weightedScore: { type: 'number' }
        }
      },
      VeritasScoreDetail: {
        type: 'object',
        properties: {
          ssn: { type: 'string' },
          overallScore: { type: 'number' },
          confidence: { type: 'number' },
          dataQualityScore: { type: 'number' },
          calculatedAt: { type: 'string', format: 'date-time' },
          categories: { type: 'array', items: { $ref: '#/components/schemas/CategoryDetail' }},
          missingDataFields: { type: 'array', items: { type: 'string' }},
          freeDataSummary: { $ref: '#/components/schemas/FreeDataSummary' }
        }
      },
      CategoryDetail: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          score: { type: 'number' },
          weight: { type: 'number' },
          weightedScore: { type: 'number' },
          confidence: { type: 'number' },
          parameters: { type: 'array', items: { $ref: '#/components/schemas/ParameterDetail' }}
        }
      },
      ParameterDetail: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          code: { type: 'string' },
          rawValue: { type: 'string', nullable: true },
          normalizedScore: { type: 'number' },
          weightedScore: { type: 'number' },
          dataSource: { type: 'string' },
          confidence: { type: 'number' },
          isMissing: { type: 'boolean' },
          isRealData: { type: 'boolean' }
        }
      },
      FreeDataSummary: {
        type: 'object',
        properties: {
          totalParameters: { type: 'integer' },
          parametersUsingFreeAPIs: { type: 'integer' },
          freeAPIsUsed: { type: 'array', items: { type: 'string' }}
        }
      },
      CompanyProfileSummary: {
        type: 'object',
        nullable: true,
        properties: {
          brandName: { type: 'string' },
          brandReputation: { type: 'number' },
          stockSymbol: { type: 'string', nullable: true }
        }
      },
      SellerProfileSummary: {
        type: 'object',
        nullable: true,
        properties: {
          seller: { type: 'string' },
          rating: { type: 'number' },
          isTopRated: { type: 'boolean' }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          limit: { type: 'integer' },
          offset: { type: 'integer' },
          hasMore: { type: 'boolean' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          stack: { type: 'string' }
        }
      }
    },
    responses: {
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      BadRequest: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized access',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    },
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for authentication (future)'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token authentication (future)'
      }
    }
  }
}

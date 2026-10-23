# Veritas B2B Management Scripts

**Command-line tools for managing B2B tenants and products**

---

## Quick Start

### 1. Create Your First Tenant

```bash
npx tsx scripts/b2b/create-tenant.ts "My Store" "api@mystore.com" professional
```

This will:
- Generate a unique API key
- Set up tenant with professional plan
- Configure rate limits and scoring weights
- Display connection details

**Output**:
```
 Tenant created successfully!


=� TENANT DETAILS


  Tenant ID:     cm3abc123...
  Name:          My Store
  Email:         api@mystore.com
  Plan:          professional
  Rate Limit:    100,000 requests/hour
  Max Products:  50,000


= API KEY (SAVE THIS - IT WON'T BE SHOWN AGAIN)


  vts_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2
```

### 2. List All Tenants

```bash
npx tsx scripts/b2b/list-tenants.ts
```

**With Full API Keys**:
```bash
npx tsx scripts/b2b/list-tenants.ts --detailed
```

### 3. Seed Test Products

```bash
# Get tenant ID from list-tenants command
npx tsx scripts/b2b/seed-products.ts cm3abc123 100
```

This seeds 100 sample products across categories:
- Beauty (shampoos, etc.)
- Electronics (headphones, chargers, etc.)
- Home & Kitchen (cookware, appliances, etc.)
- Apparel (clothing, shoes, etc.)

---

## Available Scripts

### Vector Search Scripts

#### `init-qdrant.ts`

**Purpose**: Initialize Qdrant vector database collection for B2B platform

**Usage**:
```bash
npx tsx scripts/b2b/init-qdrant.ts
```

**What it does**:
- Creates optimized Qdrant collection for products
- Configures HNSW indexing for fast similarity search
- Sets up multi-tenant vector isolation
- Verifies collection health

**Run this**: Once during initial setup or after Qdrant reinstall

---

#### `index-tenant-products.ts`

**Purpose**: Generate embeddings and index products in Qdrant

**Usage**:
```bash
npx tsx scripts/b2b/index-tenant-products.ts <tenantId> [limit]
```

**Parameters**:
- `tenantId` (required): Tenant ID from `list-tenants`
- `limit` (optional): Number of products to index (default: all)

**Examples**:
```bash
# Index all products for a tenant
npx tsx scripts/b2b/index-tenant-products.ts cm3abc123

# Index first 100 products (for testing)
npx tsx scripts/b2b/index-tenant-products.ts cm3abc123 100
```

**What it does**:
- Generates OpenAI embeddings (text-embedding-3-large)
- Indexes vectors in Qdrant with tenant isolation
- Displays progress and costs
- Shows indexing statistics

**Cost**: ~$0.065 per 1,000 products

---

#### `check-qdrant-status.ts`

**Purpose**: Check Qdrant health and indexing status

**Usage**:
```bash
npx tsx scripts/b2b/check-qdrant-status.ts
```

**Displays**:
- Qdrant server health and version
- Collection statistics (vectors, segments, status)
- Indexing progress percentage
- Connection information

**Run this**: Anytime to monitor vector search health

---

### Tenant Management Scripts

### `create-tenant.ts`

**Purpose**: Create a new B2B tenant with API key

**Usage**:
```bash
npx tsx scripts/b2b/create-tenant.ts <name> <email> [plan] [isTest]
```

**Parameters**:
- `name` (required): Tenant/company name
- `email` (required): Contact email (must be unique)
- `plan` (optional): Subscription plan
  - `free` - 1K requests/hour, 100 products (default)
  - `starter` - 10K requests/hour, 1K products
  - `professional` - 100K requests/hour, 50K products
  - `enterprise` - 1M requests/hour, unlimited products
- `isTest` (optional): Generate test API key (`true`/`false`)

**Examples**:
```bash
# Free plan (default)
npx tsx scripts/b2b/create-tenant.ts "Acme Corp" "api@acme.com"

# Professional plan
npx tsx scripts/b2b/create-tenant.ts "BigStore" "api@bigstore.com" professional

# Test tenant with test API key
npx tsx scripts/b2b/create-tenant.ts "Test Store" "test@example.com" starter true
```

**API Key Formats**:
- Production: `vts_live_{32_chars}`
- Test: `vts_test_{32_chars}`

---

### `list-tenants.ts`

**Purpose**: List all tenants with stats

**Usage**:
```bash
npx tsx scripts/b2b/list-tenants.ts [--detailed]
```

**Flags**:
- `--detailed` or `-d`: Show full API keys (default shows truncated)

**Example Output**:
```
=� Found 3 tenants



=� My Store

  Status:          Active
  Email:          api@mystore.com
  Plan:           professional
  Tenant ID:      cm3abc123...
  API Key:        vts_live_a1b2c3d4...
  Products:       1,250
  API Calls:      45,678
  Rate Limit:     100,000/hour
  Created:        10/22/2026
  Last API Call:  10/22/2026, 3:45 PM



=� SUMMARY

  Total Tenants:     3
  Active Tenants:    3
  Total Products:    2,500
  Total API Calls:   123,456

```

---

### `seed-products.ts`

**Purpose**: Seed test products for a tenant

**Usage**:
```bash
npx tsx scripts/b2b/seed-products.ts <tenantId> [count]
```

**Parameters**:
- `tenantId` (required): Tenant ID from `list-tenants`
- `count` (optional): Number of products to create (default: 20, max: 10,000)

**Examples**:
```bash
# Seed 20 products (default)
npx tsx scripts/b2b/seed-products.ts cm3abc123

# Seed 100 products
npx tsx scripts/b2b/seed-products.ts cm3abc123 100

# Seed 1000 products
npx tsx scripts/b2b/seed-products.ts cm3abc123 1000
```

**Product Categories**:
- **Beauty**: Shampoos, conditioners
- **Electronics**: Headphones, chargers, keyboards, mice
- **Home & Kitchen**: Water bottles, cookware, appliances
- **Apparel**: T-shirts, shoes, yoga pants, jackets

**Example Output**:
```
<1 Seeding 50 products for tenant: My Store


 Successfully created 50 products!


=� PRODUCT BREAKDOWN


  Beauty: 10 products
  Electronics: 10 products
  Home & Kitchen: 15 products
  Apparel: 15 products


= TEST THE API


  Search products:
  curl -X POST http://localhost:3000/api/v1/search \
    -H "x-api-key: vts_live_..." \
    -H "Content-Type: application/json" \
    -d '{"query": "shampoo", "limit": 10}'
```

---

## Complete Workflow Example

### Step 1: Create a Tenant

```bash
npx tsx scripts/b2b/create-tenant.ts "E-Commerce Store" "api@ecommerce.com" professional
```

**Copy the API key** from the output!

### Step 2: Seed Products

```bash
# Replace cm3abc123 with your tenant ID from Step 1
npx tsx scripts/b2b/seed-products.ts cm3abc123 200
```

### Step 3: Test Search API

```bash
curl -X POST http://localhost:3000/api/v1/search \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "wireless headphones",
    "filters": {
      "category": "Electronics",
      "minPrice": 50,
      "maxPrice": 150
    },
    "limit": 10
  }'
```

### Step 4: Test Product Ingestion

```bash
curl -X POST http://localhost:3000/api/v1/products/ingest \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "name": "Custom Product 1",
        "category": "Electronics",
        "brand": "MyBrand",
        "price": 99.99,
        "description": "A great product"
      },
      {
        "name": "Custom Product 2",
        "category": "Beauty",
        "brand": "MyBrand",
        "price": 29.99,
        "description": "Another great product"
      }
    ]
  }'
```

### Step 5: Check Stats

```bash
npx tsx scripts/b2b/list-tenants.ts --detailed
```

---

## Subscription Plans

| Plan | Rate Limit | Max Products | Price |
|------|-----------|--------------|-------|
| Free | 1K/hour | 100 | $0 |
| Starter | 10K/hour | 1,000 | $99/mo |
| Professional | 100K/hour | 50,000 | $499/mo |
| Enterprise | 1M/hour | Unlimited | Custom |

---

## API Endpoints

### Search API
- **URL**: `POST /api/v1/search`
- **Auth**: API key in `x-api-key` header
- **Docs**: See `/docs/B2B_QUICK_START.md`

### Product Ingestion API
- **URL**: `POST /api/v1/products/ingest`
- **Auth**: API key in `x-api-key` header
- **Max Batch**: 1,000 products per request
- **Docs**: See `/docs/B2B_QUICK_START.md`

---

## Troubleshooting

### "Tenant with email already exists"

Solution: Use a different email or check existing tenant:
```bash
npx tsx scripts/b2b/list-tenants.ts --detailed
```

### "Tenant not found"

Solution: Verify tenant ID:
```bash
npx tsx scripts/b2b/list-tenants.ts
```

### "Product limit reached"

Solution: Upgrade plan or delete unused products.

---

## Next Steps

1. **Test with Real Data**: Replace sample products with your catalog
2. **Integrate with Your App**: Use the API in your e-commerce platform
3. **Monitor Usage**: Track API calls and product counts
4. **Scale Up**: Upgrade plan as needed

---

## Support

For questions or issues:
- Check `/docs/B2B_QUICK_START.md`
- Review `/docs/B2B_IMPLEMENTATION_STATUS.md`
- See full architecture in `/docs/B2B_SAAS_ARCHITECTURE.md`

---

**Built for Veritas B2B SaaS Platform** =�

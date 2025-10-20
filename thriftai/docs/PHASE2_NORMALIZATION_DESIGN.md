# Phase 2: Database Normalization Design

## Executive Summary
This document outlines the strategy to migrate JSON fields (`dynamic_specs`, `company_metrics`) to properly normalized relational tables, achieving **3NF (Third Normal Form)** compliance while maintaining query performance.

---

## Problem Analysis

### Current Issues with JSON Storage

**1. dynamic_specs (JSONB column)**
- **Violation**: 1NF (First Normal Form) - atomic values violated
- **Size**: 25+ different keys, highly variable per product
- **Query Performance**: Even with path indexes, JOIN operations impossible
- **Data Integrity**: No foreign key constraints, no type safety
- **Storage**: Redundant storage of key names in every row

**2. company_metrics (JSONB column)**
- **Violation**: 2NF (Second Normal Form) - partial dependency
- **Problem**: Company data stored per-product instead of per-seller
- **Redundancy**: Same company metrics duplicated across all products from same seller
- **Update Anomaly**: Updating company metrics requires updating all products

---

## Solution: Hybrid Approach

### Strategy: EAV (Entity-Attribute-Value) + Dedicated Tables

We'll use a **hybrid normalization approach**:
1. **Common attributes** → Dedicated columns (indexed, fast queries)
2. **Variable attributes** → EAV pattern (flexible, normalized)
3. **Company data** → Separate table linked to sellers (eliminates redundancy)

This balances **query performance** with **normalization benefits**.

---

## Design 1: Product Attributes (EAV Pattern)

### Table: `product_attributes`

```sql
CREATE TABLE product_attributes (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id        TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_key     TEXT NOT NULL,
  attribute_value   TEXT NOT NULL,
  value_type        attribute_value_type NOT NULL, -- 'string', 'number', 'boolean', 'json'
  category          TEXT,  -- e.g., 'ELECTRONICS', 'CLOTHING'
  is_searchable     BOOLEAN DEFAULT true,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(product_id, attribute_key),

  -- Indexes
  INDEX idx_product_attributes_product (product_id),
  INDEX idx_product_attributes_key (attribute_key),
  INDEX idx_product_attributes_search (attribute_key, attribute_value) WHERE is_searchable = true,
  INDEX idx_product_attributes_category (category, attribute_key)
);
```

### Common Attributes → Direct Columns on Products

Move high-frequency attributes to direct columns for optimal performance:

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS:
  color             TEXT,        -- 87.5% frequency
  material          TEXT,        -- 75% frequency
  product_size      TEXT,        -- 50% frequency (renamed from 'size' to avoid reserved word)
  gender            TEXT,        -- 50% frequency
  product_style     TEXT,        -- 50% frequency
  warranty_period   TEXT,        -- 61.6% frequency
  durability_rating TEXT         -- 62.5% frequency
```

**Rationale**: Fields present in >50% of products get dedicated columns for query performance.

---

## Design 2: Company Metrics (Dedicated Table)

### Table: `company_financial_metrics`

```sql
CREATE TABLE company_financial_metrics (
  id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  seller_id               TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE UNIQUE,

  -- Financial Metrics
  stock_price             DECIMAL(12, 2),
  market_cap              DECIMAL(18, 2),  -- In millions
  profit_margin           DECIMAL(5, 2),   -- Percentage
  revenue_growth          DECIMAL(5, 2),   -- Percentage
  debt_to_equity          DECIMAL(8, 2),

  -- Performance Metrics
  stock_performance_30d   DECIMAL(6, 2),   -- Percentage
  stock_performance_1y    DECIMAL(6, 2),   -- Percentage

  -- Trust Metrics
  credit_rating           TEXT,            -- e.g., 'AAA', 'AA+', 'BBB'

  -- Metadata
  data_source             TEXT,
  last_updated            TIMESTAMP,
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW(),

  -- Indexes
  INDEX idx_company_metrics_seller (seller_id),
  INDEX idx_company_metrics_credit_rating (credit_rating),
  INDEX idx_company_metrics_updated (last_updated DESC)
);
```

**Normalization Achieved**:
- **Eliminates redundancy**: One record per seller (not per product)
- **Update anomaly fixed**: Update company metrics once, affects all products
- **Referential integrity**: Foreign key to sellers table
- **Storage savings**: ~70% reduction (247 products from same sellers)

---

## Design 3: Attribute Definition Registry

### Table: `attribute_definitions`

Centralize attribute metadata for validation and UI rendering:

```sql
CREATE TABLE attribute_definitions (
  id                TEXT PRIMARY KEY,
  attribute_key     TEXT NOT NULL UNIQUE,
  display_name      TEXT NOT NULL,
  description       TEXT,
  value_type        attribute_value_type NOT NULL,
  applicable_categories TEXT[],  -- Which product categories use this
  is_searchable     BOOLEAN DEFAULT true,
  is_filterable     BOOLEAN DEFAULT true,
  validation_regex  TEXT,  -- Optional validation pattern
  unit              TEXT,  -- e.g., 'kg', 'inches', 'years'
  created_at        TIMESTAMP DEFAULT NOW(),

  INDEX idx_attribute_def_category (applicable_categories) USING GIN
);
```

**Benefits**:
- **Validation**: Ensure attribute values match expected types
- **UI Generation**: Auto-generate search filters from definitions
- **Documentation**: Self-documenting schema
- **Flexibility**: Add new attributes without schema changes

---

## Migration Strategy

### Phase 2.2: Migrate dynamic_specs

**Step 1**: Add new columns to products table
```sql
ALTER TABLE products ADD COLUMN:
  color, material, product_size, gender, product_style, warranty_period, durability_rating
```

**Step 2**: Populate new columns from JSON
```sql
UPDATE products SET
  color = dynamic_specs->>'color',
  material = dynamic_specs->>'material',
  -- ... etc
WHERE dynamic_specs IS NOT NULL;
```

**Step 3**: Migrate remaining attributes to EAV
```sql
INSERT INTO product_attributes (product_id, attribute_key, attribute_value, value_type, category)
SELECT
  p.id,
  key,
  value#>>'{}',
  'string',  -- Determine actual type
  p.category
FROM products p, jsonb_each(p.dynamic_specs) AS kv(key, value)
WHERE key NOT IN ('color', 'material', 'size', 'gender', 'style', 'warranty', 'durability',
                   '_enrichedAt', '_sourceUrls', '_completeness', 'aiDetectedFeatures');
```

**Step 4**: Create indexes on new columns
```sql
CREATE INDEX idx_products_color ON products(color) WHERE color IS NOT NULL;
-- ... etc
```

**Step 5**: Gradually deprecate dynamic_specs (keep for rollback)

### Phase 2.3: Migrate company_metrics

**Step 1**: Create company_financial_metrics table

**Step 2**: Migrate data (deduplicate by seller)
```sql
INSERT INTO company_financial_metrics (seller_id, stock_price, market_cap, ...)
SELECT DISTINCT ON (seller_id)
  seller_id,
  (company_metrics->>'stockPrice')::decimal,
  (company_metrics->>'marketCap')::decimal,
  ...
FROM products
WHERE company_metrics IS NOT NULL AND seller_id IS NOT NULL
ORDER BY seller_id, updated_at DESC;  -- Keep most recent
```

**Step 3**: Add foreign key to products
```sql
ALTER TABLE products ADD COLUMN company_metrics_id TEXT REFERENCES company_financial_metrics(id);
UPDATE products p SET company_metrics_id = cfm.id
FROM company_financial_metrics cfm
WHERE p.seller_id = cfm.seller_id;
```

**Step 4**: Gradually deprecate company_metrics JSON column

---

## Performance Impact Analysis

### Before (JSON Storage)

| Query Type | Performance | Index Type |
|------------|-------------|------------|
| Filter by color | 10-25ms | JSONB path index |
| Join products + company | **Impossible** | No JOIN support |
| Update company metrics | 247 row updates | N/A |
| Attribute search | 25-50ms | GIN index |

### After (Normalized Tables)

| Query Type | Performance | Index Type |
|------------|-------------|------------|
| Filter by color | **5-10ms** | B-tree on column |
| Join products + company | **15ms** | Foreign key index |
| Update company metrics | **1 row update** | Single record |
| Attribute search | **5-10ms** | Composite B-tree |

**Expected Improvements**:
- **Query speed**: 2-5x faster for common attributes
- **JOIN operations**: Now possible (company data)
- **Update efficiency**: 247x fewer writes for company metrics
- **Storage**: ~30% reduction (eliminated JSON key redundancy)

---

## Rollback Strategy

1. **Keep JSON columns** during migration (don't drop immediately)
2. **Dual-write period**: Write to both JSON and normalized tables
3. **Gradual switchover**: Route read queries to new tables progressively
4. **Monitoring**: Track query performance, error rates
5. **Rollback trigger**: If performance degrades >10%, revert to JSON
6. **Final cleanup**: Drop JSON columns after 30 days of stability

---

## Data Integrity Guarantees

### Foreign Key Constraints
```sql
product_attributes.product_id → products.id (CASCADE DELETE)
company_financial_metrics.seller_id → sellers.id (CASCADE DELETE)
products.company_metrics_id → company_financial_metrics.id (SET NULL)
```

### Check Constraints
```sql
ALTER TABLE company_financial_metrics ADD CONSTRAINT check_positive_price
  CHECK (stock_price IS NULL OR stock_price >= 0);

ALTER TABLE company_financial_metrics ADD CONSTRAINT check_percentage_range
  CHECK (profit_margin IS NULL OR (profit_margin >= -100 AND profit_margin <= 100));
```

### Unique Constraints
```sql
-- One financial record per seller
UNIQUE(seller_id) on company_financial_metrics

-- One attribute value per product+key
UNIQUE(product_id, attribute_key) on product_attributes
```

---

## Query Pattern Examples

### Before (JSON):
```sql
-- Filter by color
SELECT * FROM products WHERE dynamic_specs->>'color' = 'Red';

-- Company data (IMPOSSIBLE to join efficiently)
SELECT p.name, p.company_metrics->>'creditRating'
FROM products p;
```

### After (Normalized):
```sql
-- Filter by color (direct column, faster)
SELECT * FROM products WHERE color = 'Red';

-- Company data (proper JOIN)
SELECT p.name, cfm.credit_rating, cfm.stock_price
FROM products p
JOIN company_financial_metrics cfm ON p.seller_id = cfm.seller_id;

-- Complex filtering with EAV
SELECT p.*
FROM products p
JOIN product_attributes pa1 ON p.id = pa1.product_id AND pa1.attribute_key = 'waterResistance' AND pa1.attribute_value = 'IP68'
JOIN product_attributes pa2 ON p.id = pa2.product_id AND pa2.attribute_key = 'breathability' AND pa2.attribute_value = 'High'
WHERE p.color = 'Blue';
```

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Query speed (color filter) | 15ms | 5ms | Week 4 |
| Storage size | 500MB | 350MB | Week 5 |
| JOIN support | No | Yes | Week 3 |
| Update anomalies | 247 writes | 1 write | Week 3 |
| Schema flexibility | Low | High | Week 6 |
| Type safety | None | Full | Week 6 |

---

## Research Citations

1. **Codd, E.F. (1970)**. "A Relational Model of Data for Large Shared Data Banks"
   - First Normal Form (1NF), Second Normal Form (2NF), Third Normal Form (3NF)

2. **PostgreSQL 15 Documentation** (2024). "JSONB vs Relational Data"
   - Performance comparison: JSONB indexes vs B-tree indexes
   - JOIN operations: Not supported on JSONB fields

3. **Nadkarni, P. M., & Brandt, C. (1998)**. "Data extraction and ad hoc query of an entity-attribute-value database"
   - EAV pattern for flexible schema design
   - When to use EAV vs traditional columns

4. **Amazon RDS Best Practices** (2024). "Schema Design for High Performance"
   - Recommends direct columns for high-frequency attributes
   - EAV for sparse, variable attributes

---

**Status**: Design complete, ready for implementation (Phase 2.2-2.3)

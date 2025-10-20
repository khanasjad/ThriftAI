# A/B Testing Framework Guide
**Phase 3.5: Data-Driven Optimization**

Complete guide to using ThriftAI's A/B testing framework for data-driven Veritas algorithm optimization.

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Next.js Integration](#nextjs-integration)
7. [Creating Experiments](#creating-experiments)
8. [Statistical Analysis](#statistical-analysis)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

---

## Overview

### What is A/B Testing?

A/B testing (also called split testing) is a method of comparing two or more variants to determine which performs better. ThriftAI's A/B testing framework allows you to:

- **Test Veritas Weight Changes**: Compare different scoring weights to optimize conversion
- **Test UI Changes**: Compare different interfaces or flows
- **Test Algorithm Changes**: Compare different recommendation algorithms
- **Track Statistical Significance**: Know when results are reliable

### Key Features

✅ **Automatic User Assignment**: Weighted random assignment based on traffic percentages
✅ **Statistical Analysis**: Chi-square tests for significance
✅ **Materialized Views**: Pre-calculated metrics for fast queries
✅ **Partitioned Storage**: Monthly partitioning for efficient event storage
✅ **Real-Time Tracking**: Track views, clicks, add-to-cart, and purchases
✅ **Bayesian Analysis**: Confidence intervals and p-values

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     ThriftAI Platform                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   Next.js    │      │   FastAPI    │                    │
│  │  (Frontend)  │◄────►│  (ML API)    │                    │
│  └──────────────┘      └──────────────┘                    │
│         │                      │                             │
│         └──────────┬───────────┘                             │
│                    ▼                                         │
│         ┌──────────────────────┐                            │
│         │   PostgreSQL DB      │                            │
│         │  ┌────────────────┐  │                            │
│         │  │ ab_experiments │  │                            │
│         │  │  ab_variants   │  │                            │
│         │  │ ab_assignments │  │                            │
│         │  │   ab_events    │  │ (Partitioned by month)    │
│         │  └────────────────┘  │                            │
│         │  ┌────────────────┐  │                            │
│         │  │ Materialized   │  │                            │
│         │  │     Views      │  │                            │
│         │  └────────────────┘  │                            │
│         └──────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Visits Page** → Assignment check
2. **No Assignment** → Weighted random assignment to variant
3. **Has Assignment** → Return existing variant
4. **User Interacts** → Track events (view, click, purchase)
5. **Periodic** → Refresh materialized view (cached metrics)
6. **Results Request** → Query materialized view + calculate statistics

---

## Getting Started

### Prerequisites

- PostgreSQL database with schema migrations applied
- FastAPI ML server running (port 8000)
- Next.js application running (port 3000/3002/3003)
- Prisma Client generated

### 1. Apply Database Migration

```bash
psql -U asjadkhan -d thriftai_nextjs_dev -f prisma/migrations/20251020_implement_ab_testing/migration.sql
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Start ML API Server

```bash
cd ml/inference
python main.py
# Runs on http://localhost:8000
```

### 4. Verify Installation

```bash
# Health check
curl http://localhost:8000/health

# Should return:
# {
#   "status": "healthy",
#   "version": "1.0.0",
#   "models_loaded": { ... }
# }
```

---

## Database Schema

### Tables

#### 1. `ab_experiments`
Stores experiment configurations and results.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `name` | TEXT | Experiment name |
| `description` | TEXT | Optional description |
| `hypothesis` | TEXT | What you're testing |
| `start_date` | TIMESTAMP | When experiment started |
| `end_date` | TIMESTAMP | When experiment ends |
| `duration_days` | INT | Planned duration |
| `status` | ENUM | DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED |
| `primary_metric` | TEXT | Main metric to optimize |
| `confidence_level` | DECIMAL | Statistical confidence (default 0.95) |
| `results` | JSONB | Cached analysis results |
| `winner_variant_id` | TEXT | Winning variant (if determined) |

#### 2. `ab_variants`
Stores variant configurations (control + treatments).

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `experiment_id` | TEXT | FK to ab_experiments |
| `name` | TEXT | Variant name |
| `traffic_percentage` | INT | % of users (0-100) |
| `config` | JSONB | Variant configuration (weights, etc.) |
| `is_control` | BOOLEAN | Is this the control group? |
| `user_count` | INT | Cached user count |
| `conversion_count` | INT | Cached conversion count |
| `total_revenue` | DECIMAL | Cached revenue |

#### 3. `ab_assignments`
Tracks which users are assigned to which variants.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `experiment_id` | TEXT | FK to ab_experiments |
| `user_id` | TEXT | User identifier |
| `variant_id` | TEXT | FK to ab_variants |
| `assigned_at` | TIMESTAMP | When assignment happened |
| `session_id` | TEXT | Optional session tracking |

**Unique Constraint**: `(experiment_id, user_id)` - Each user assigned once per experiment

#### 4. `ab_events` (Partitioned)
Tracks user events for analysis. **Partitioned by month** for performance.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `experiment_id` | TEXT | FK to ab_experiments |
| `user_id` | TEXT | User identifier |
| `variant_id` | TEXT | FK to ab_variants |
| `event_type` | TEXT | view, click, add_to_cart, purchase, custom |
| `event_data` | JSONB | Additional event data |
| `created_at` | TIMESTAMP | When event occurred |
| `event_date` | DATE | Partition key |

**Partitions**: `ab_events_YYYY_MM` (e.g., `ab_events_2025_10`)

### Materialized View

#### `ab_experiment_metrics`
Pre-calculated metrics for fast querying. Refreshed periodically.

```sql
SELECT * FROM ab_experiment_metrics WHERE experiment_id = 'xxx';
```

Returns:
- `unique_users`: Total users in variant
- `views`, `clicks`, `add_to_carts`, `purchases`: Event counts
- `conversion_rate`: Purchase rate
- `total_revenue`, `avg_order_value`: Revenue metrics
- `click_through_rate`: Engagement metric

**Refresh**: `SELECT refresh_ab_metrics();`

### SQL Functions

#### 1. `assign_user_to_variant(experiment_id, user_id, session_id)`
Assigns user to variant using weighted random selection.

```sql
SELECT assign_user_to_variant('exp_123', 'user_456', 'session_789');
-- Returns: variant_id
```

#### 2. `track_ab_event(experiment_id, user_id, event_type, event_data, session_id)`
Tracks an event and updates cached statistics.

```sql
SELECT track_ab_event(
  'exp_123',
  'user_456',
  'purchase',
  '{"amount": 99.99, "productId": "abc123"}'::jsonb,
  'session_789'
);
```

#### 3. `calculate_statistical_significance(control_conversions, control_users, treatment_conversions, treatment_users)`
Calculates statistical significance using Chi-square test.

```sql
SELECT * FROM calculate_statistical_significance(177, 5201, 215, 5252);
-- Returns: (p_value, is_significant, chi_square_stat)
```

#### 4. `refresh_ab_metrics()`
Refreshes the materialized view concurrently (non-blocking).

```sql
SELECT refresh_ab_metrics();
```

---

## API Reference

### FastAPI Endpoints (ML Server)

Base URL: `http://localhost:8000`

#### 1. Create Experiment
**POST** `/api/ml/ab-test`

Creates a new A/B test experiment.

**Request Body**:
```json
{
  "name": "Sustainability Weight Test",
  "description": "Test impact of sustainability weight increase",
  "duration_days": 14,
  "primary_metric": "conversion_rate",
  "secondary_metrics": ["avg_order_value"],
  "variants": [
    {
      "name": "Control",
      "description": "Current weights",
      "traffic_percentage": 50,
      "config": {
        "veritasWeights": {
          "sustainability": 0.10
        }
      },
      "is_control": true
    },
    {
      "name": "Treatment",
      "description": "Increased sustainability",
      "traffic_percentage": 50,
      "config": {
        "veritasWeights": {
          "sustainability": 0.15
        }
      },
      "is_control": false
    }
  ]
}
```

**Response**:
```json
{
  "experiment_id": "exp_abc123",
  "status": "DRAFT",
  "message": "Experiment created successfully"
}
```

#### 2. Assign User to Variant
**POST** `/api/ml/ab-test/{experiment_id}/assign/{user_id}?session_id=xxx`

Assigns user to a variant (or returns existing assignment).

**Response**:
```json
{
  "variant_id": "var_xyz789",
  "variant_name": "Treatment",
  "config": {
    "veritasWeights": {
      "sustainability": 0.15
    }
  },
  "is_control": false
}
```

#### 3. Track Event
**POST** `/api/ml/ab-test/{experiment_id}/track`

Tracks a user event for analysis.

**Request Body**:
```json
{
  "user_id": "user_123",
  "event_type": "purchase",
  "event_data": {
    "amount": 99.99,
    "productId": "abc123"
  },
  "session_id": "session_456"
}
```

**Response**:
```json
{
  "status": "tracked",
  "event_type": "purchase"
}
```

#### 4. Get Experiment Results
**GET** `/api/ml/ab-test/{experiment_id}/results`

Returns statistical analysis and results.

**Response**:
```json
{
  "experiment_id": "exp_abc123",
  "status": "ACTIVE",
  "days_running": 7,
  "total_users": 10453,
  "results": {
    "control": {
      "users": 5201,
      "conversions": 177,
      "conversion_rate": 0.0340,
      "avg_order_value": 156.43
    },
    "treatment": {
      "users": 5252,
      "conversions": 215,
      "conversion_rate": 0.0409,
      "avg_order_value": 163.21
    }
  },
  "analysis": {
    "conversion_rate_lift": 20.3,
    "p_value": 0.004,
    "confidence": 99.6,
    "recommendation": "IMPLEMENT_TREATMENT"
  }
}
```

#### 5. Update Experiment Status
**PATCH** `/api/ml/ab-test/{experiment_id}/status`

Updates experiment status.

**Request Body**:
```json
{
  "status": "ACTIVE"
}
```

Valid statuses: `DRAFT`, `ACTIVE`, `PAUSED`, `COMPLETED`, `ARCHIVED`

**Response**:
```json
{
  "experiment_id": "exp_abc123",
  "status": "ACTIVE",
  "start_date": "2025-10-20T10:00:00Z",
  "end_date": "2025-11-03T10:00:00Z"
}
```

---

## Next.js Integration

### Using the React Hook

The `useABTest` hook provides the easiest way to integrate A/B testing in components.

```typescript
import { useABTest } from '@/hooks/useABTest';

function ProductPage() {
  const { variant, isLoading, trackEvent, isControl, isTreatment } = useABTest(
    'sustainability-weight-test'
  );

  // Track page view
  useEffect(() => {
    trackEvent('view');
  }, [trackEvent]);

  // Use variant config
  const weights = variant?.config.veritasWeights || {
    /* defaults */
  };

  // Track purchase
  const handlePurchase = async (amount: number, productId: string) => {
    await trackEvent('purchase', { amount, productId });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Product Page</h1>
      {variant && <p>Variant: {variant.variantName}</p>}
      {isTreatment && <Badge>Testing New Weights</Badge>}
    </div>
  );
}
```

### Server-Side Integration

Use the `abTestingService` for server-side operations.

```typescript
import { assignUserToVariantServer, trackEventServer } from '@/services/abTestingService';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromSession(request);

  // Assign user to variant
  const variant = await assignUserToVariantServer(
    'sustainability-weight-test',
    userId
  );

  // Use variant config in Veritas scoring
  const weights = variant.config.veritasWeights;
  const score = calculateVeritasScore(product, weights);

  // Track event when user makes purchase
  await trackEventServer(
    'sustainability-weight-test',
    userId,
    'purchase',
    { amount: 99.99, productId: 'abc123' }
  );

  return NextResponse.json({ score, variant: variant.variantName });
}
```

---

## Creating Experiments

### Step-by-Step Guide

#### 1. Define Your Hypothesis

Example: "Increasing the sustainability weight from 0.10 to 0.15 will improve conversion rate by targeting eco-conscious buyers."

#### 2. Choose Metrics

- **Primary Metric**: `conversion_rate` (purchases / unique users)
- **Secondary Metrics**: `avg_order_value`, `customer_satisfaction`

#### 3. Design Variants

```typescript
const variants = [
  {
    name: 'Control (0.10)',
    trafficPercentage: 50,
    config: { veritasWeights: { sustainability: 0.10, ... } },
    isControl: true
  },
  {
    name: 'Treatment (0.15)',
    trafficPercentage: 50,
    config: { veritasWeights: { sustainability: 0.15, ... } },
    isControl: false
  }
];
```

#### 4. Create Experiment

```bash
curl -X POST http://localhost:8000/api/ml/ab-test \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sustainability Weight Test",
    "duration_days": 14,
    "primary_metric": "conversion_rate",
    "variants": [...]
  }'
```

#### 5. Activate Experiment

```bash
curl -X PATCH http://localhost:8000/api/ml/ab-test/exp_abc123/status \
  -H "Content-Type: application/json" \
  -d '{"status": "ACTIVE"}'
```

#### 6. Monitor Results

```bash
curl http://localhost:8000/api/ml/ab-test/exp_abc123/results
```

#### 7. Make Decision

Wait until:
- ✅ p-value < 0.05 (statistically significant)
- ✅ Minimum sample size reached (1000+ users)
- ✅ Confidence level ≥ 95%

Then implement winning variant or reject treatment.

---

## Statistical Analysis

### Chi-Square Test

ThriftAI uses the **Chi-square test** to determine statistical significance.

**Formula**:
```
χ² = Σ [(Observed - Expected)² / Expected]
```

**Interpretation**:
- **p-value < 0.05**: Statistically significant (95% confidence)
- **p-value < 0.01**: Highly significant (99% confidence)
- **p-value ≥ 0.05**: Not significant, continue testing

### Sample Size

Minimum recommended sample sizes:
- **Small effect (2-5% lift)**: 10,000+ users per variant
- **Medium effect (5-10% lift)**: 1,000+ users per variant
- **Large effect (>10% lift)**: 500+ users per variant

### Duration

Recommended test durations:
- **Minimum**: 7 days (to capture weekly patterns)
- **Ideal**: 14-21 days (to capture multiple cycles)
- **Maximum**: 30 days (diminishing returns after)

---

## Best Practices

### 1. Test One Thing at a Time

❌ **Bad**: Test sustainability weight AND UI change together
✅ **Good**: Test sustainability weight alone

### 2. Run Tests to Completion

❌ **Bad**: Stop test when early results look good
✅ **Good**: Run full duration and wait for significance

### 3. Use Proper Sample Sizes

❌ **Bad**: Make decision with 100 users
✅ **Good**: Wait for 1000+ users and p-value < 0.05

### 4. Track All Events

Track the full funnel:
```typescript
trackEvent('view');         // Page load
trackEvent('click');        // Product click
trackEvent('add_to_cart'); // Add to cart
trackEvent('purchase');    // Purchase
```

### 5. Document Everything

Record in `description` and `hypothesis` fields:
- What you're testing
- Why you're testing it
- Expected outcome
- Decision criteria

### 6. Archive Old Experiments

Move completed experiments to `ARCHIVED` status to keep the active list clean.

---

## Examples

### Example 1: Test Sustainability Weight

```typescript
// Create experiment
const experiment = await createExperiment({
  name: 'Sustainability Weight 0.10 vs 0.15',
  description: 'Test if eco-conscious buyers respond to higher sustainability weight',
  durationDays: 14,
  primaryMetric: 'conversion_rate',
  variants: [
    {
      name: 'Control (0.10)',
      trafficPercentage: 50,
      config: {
        veritasWeights: {
          productQuality: 0.25,
          marketValue: 0.20,
          sellerReliability: 0.15,
          sustainability: 0.10,  // Current
          logistics: 0.10,
          brandReputation: 0.10,
          customerSentiment: 0.05,
          priceToValue: 0.05
        }
      },
      isControl: true
    },
    {
      name: 'Treatment (0.15)',
      trafficPercentage: 50,
      config: {
        veritasWeights: {
          productQuality: 0.23,
          marketValue: 0.18,
          sellerReliability: 0.15,
          sustainability: 0.15,  // Increased
          logistics: 0.10,
          brandReputation: 0.10,
          customerSentiment: 0.05,
          priceToValue: 0.04
        }
      },
      isControl: false
    }
  ]
});

// Activate
await updateExperimentStatus(experiment.experimentId, 'ACTIVE');
```

### Example 2: Use in Component

```typescript
function ProductList() {
  const { variant, trackEvent } = useABTest('sustainability-weight-test');

  const weights = variant?.config.veritasWeights || DEFAULT_WEIGHTS;

  const sortedProducts = useMemo(() => {
    return products
      .map(p => ({
        ...p,
        veritasScore: calculateVeritasScore(p, weights)
      }))
      .sort((a, b) => b.veritasScore - a.veritasScore);
  }, [products, weights]);

  return (
    <div>
      {sortedProducts.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onPurchase={(amount) => {
            trackEvent('purchase', { amount, productId: product.id });
          }}
        />
      ))}
    </div>
  );
}
```

### Example 3: Analyze Results

```bash
# Get results
curl http://localhost:8000/api/ml/ab-test/exp_abc123/results

# Analyze output:
# {
#   "analysis": {
#     "conversion_rate_lift": 20.3,  # 20.3% improvement
#     "p_value": 0.004,               # p < 0.05 ✅ Significant
#     "confidence": 99.6,             # 99.6% confidence ✅
#     "recommendation": "IMPLEMENT_TREATMENT"  # Winner!
#   }
# }

# Decision: Implement treatment (sustainability weight 0.15)
```

---

## Troubleshooting

### Issue: Users not being assigned

**Solution**: Ensure experiment status is `ACTIVE`:
```bash
curl -X PATCH http://localhost:8000/api/ml/ab-test/exp_xxx/status \
  -d '{"status": "ACTIVE"}'
```

### Issue: Events not tracking

**Solution**: Check that user has been assigned to a variant first:
```typescript
const variant = await assignUserToVariant(experimentId, userId);
await trackEvent(experimentId, userId, 'purchase');
```

### Issue: Materialized view not updating

**Solution**: Manually refresh the view:
```sql
SELECT refresh_ab_metrics();
```

Or set up a cron job:
```sql
-- Refresh every hour
SELECT cron.schedule('refresh-ab-metrics', '0 * * * *', 'SELECT refresh_ab_metrics()');
```

### Issue: Partitions not created for future months

**Solution**: Use the auto-partition function:
```sql
SELECT create_next_month_partitions();
```

---

## Performance Optimization

### 1. Use Materialized Views

Instead of querying `ab_events` directly (slow), use the materialized view:

```sql
-- Slow ❌
SELECT COUNT(*) FROM ab_events WHERE variant_id = 'xxx';

-- Fast ✅
SELECT unique_users FROM ab_experiment_metrics WHERE variant_id = 'xxx';
```

### 2. Partition Pruning

Query specific partitions for date ranges:

```sql
-- Query only October 2025 events
SELECT * FROM ab_events WHERE event_date BETWEEN '2025-10-01' AND '2025-10-31';
-- Automatically prunes other partitions
```

### 3. Index Usage

The following queries use indexes efficiently:

```sql
-- Uses idx_ab_assignments_experiment
SELECT * FROM ab_assignments WHERE experiment_id = 'xxx';

-- Uses idx_ab_events_variant
SELECT * FROM ab_events WHERE variant_id = 'xxx' AND event_type = 'purchase';
```

---

## Next Steps

1. **Create Your First Experiment** using the examples above
2. **Monitor Results** daily using the results endpoint
3. **Implement Winners** when statistical significance is reached
4. **Iterate** with new experiments testing different hypotheses

For support, see:
- [Phase 3 Complete Summary](./PHASE3_COMPLETE_SUMMARY.md)
- [ML System Design](./PHASE3_ML_DESIGN.md)
- [API Documentation](http://localhost:8000/docs)

---

**Version**: 1.0.0
**Last Updated**: 2025-10-20
**Author**: ThriftAI ML Team

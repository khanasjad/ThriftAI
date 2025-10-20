# Phase 3: ML Integration - Design Document

## Executive Summary

**Goal:** Enhance the Veritas AI scoring system with machine learning capabilities for predictive analytics, anomaly detection, and intelligent recommendations.

**Duration:** Weeks 7-10 (4 weeks)
**Status:** Phase 3.1 - Design in Progress

**Expected Impact:**
- **Score Prediction Accuracy:** 90%+ for new products
- **Fraud Detection:** 95%+ accuracy, <1% false positives
- **Recommendation Quality:** +30-40% CTR improvement
- **System Intelligence:** Real-time learning from user interactions

---

## Research Foundation

### Academic & Industry Sources

**1. Gradient Boosting for E-commerce (XGBoost, LightGBM)**
- Research: Microsoft Research 2017-2024
- Applications: Amazon, eBay, Alibaba
- Use case: Product quality prediction
- Accuracy: 85-95% on tabular data

**2. Isolation Forest (Anomaly Detection)**
- Research: Liu, Ting, Zhou (2008-2024)
- Applications: Fraud detection, outlier identification
- Use case: Pricing anomalies, fraudulent listings
- Accuracy: 90-98% fraud detection

**3. K-Means Clustering (User Segmentation)**
- Research: Classical ML + modern improvements
- Applications: Netflix, Spotify user cohorts
- Use case: User similarity, collaborative filtering
- Performance: O(n·k·i) - efficient for 1M+ users

**4. DBSCAN (Density-Based Clustering)**
- Research: Ester et al. (1996), modern adaptations
- Applications: Anomaly detection, product grouping
- Use case: Identify unusual product characteristics
- Advantage: No need to specify cluster count

**5. Time Series Forecasting (Prophet, ARIMA)**
- Research: Facebook Research (Prophet)
- Applications: Price prediction, demand forecasting
- Use case: Optimal pricing, inventory optimization
- Accuracy: 85-92% for e-commerce time series

---

## Phase 3 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                              │
│  (PostgreSQL - Phase 2 optimized with partitions & indexes)   │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Feature Engineering                          │
│  • Historical scores (time series)                             │
│  • User behavior vectors                                       │
│  • Product attribute embeddings                                │
│  • Seller performance metrics                                  │
└───────────────────┬─────────────────────────────────────────────┘
                    │
        ┌───────────┴──────────┬────────────┬───────────┐
        ▼                      ▼            ▼           ▼
┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐
│ Score        │  │ Anomaly      │  │ User     │  │ A/B Test │
│ Prediction   │  │ Detection    │  │ Cluster  │  │ Engine   │
│ (XGBoost)    │  │ (Iso Forest) │  │ (K-Means)│  │          │
└──────┬───────┘  └──────┬───────┘  └────┬─────┘  └────┬─────┘
       │                 │                │             │
       └─────────────────┴────────────────┴─────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ML Inference API                           │
│  • POST /api/ml/predict-score                                  │
│  • GET /api/ml/detect-anomalies                                │
│  • GET /api/ml/user-clusters                                   │
│  • POST /api/ml/ab-test                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 3.1: ML Architecture Design ✅

### Technology Stack

**Python ML Stack:**
```json
{
  "scikit-learn": "^1.4.0",    // Core ML algorithms
  "xgboost": "^2.0.3",         // Gradient boosting
  "lightgbm": "^4.1.0",        // Fast gradient boosting
  "pandas": "^2.1.4",          // Data manipulation
  "numpy": "^1.26.2",          // Numerical computing
  "joblib": "^1.3.2",          // Model serialization
  "fastapi": "^0.109.0",       // Python API server
  "pydantic": "^2.5.3"         // Data validation
}
```

**Integration Layer:**
```typescript
// Next.js → Python FastAPI bridge
fetch('http://localhost:8000/api/ml/predict-score', {
  method: 'POST',
  body: JSON.stringify(features)
})
```

**Deployment:**
- Python FastAPI server (port 8000)
- Docker container for isolation
- Model versioning with MLflow (future)
- Redis caching for predictions

### Model Storage Structure

```
thriftai/
├── ml/
│   ├── models/              # Trained models
│   │   ├── score_predictor_v1.joblib
│   │   ├── anomaly_detector_v1.joblib
│   │   ├── user_clusters_v1.joblib
│   │   └── metadata.json
│   ├── training/            # Training scripts
│   │   ├── train_score_predictor.py
│   │   ├── train_anomaly_detector.py
│   │   ├── train_user_clusters.py
│   │   └── evaluate.py
│   ├── inference/           # FastAPI server
│   │   ├── main.py
│   │   ├── schemas.py
│   │   ├── predictor.py
│   │   └── utils.py
│   ├── notebooks/           # Jupyter notebooks
│   │   ├── exploratory_analysis.ipynb
│   │   ├── model_evaluation.ipynb
│   │   └── feature_importance.ipynb
│   └── requirements.txt
```

---

## Phase 3.2: Score Prediction Model

### Goal
Predict Veritas scores for new products before manual scoring, enabling instant product quality assessment.

### Features (Input)

**Product Features (30 features):**
```python
{
  # Basic attributes
  "price": float,
  "original_price": float,
  "discount_percentage": float,
  "category": str,  # One-hot encoded
  "condition": str,  # One-hot encoded
  "brand": str,     # Label encoded

  # Specifications (from Phase 2.2)
  "color": str,
  "material": str,
  "product_size": str,
  "warranty_period": int,  # Extracted as months

  # Seller features (from Phase 2.3)
  "seller_rating": float,
  "seller_is_verified": bool,
  "seller_total_sales": int,
  "seller_response_time_hours": float,
  "seller_on_time_delivery_rate": float,
  "seller_satisfaction_rate": float,

  # Company metrics
  "stock_price": float,
  "market_cap": float,
  "profit_margin": float,
  "credit_rating": str,  # Label encoded
  "esg_score": float,

  # Product popularity
  "stock_quantity": int,
  "view_count": int,  # From product_views
  "cart_add_count": int,  # From cart_items
  "purchase_count": int,  # From orders

  # Logistics
  "has_free_shipping": bool,
  "has_free_returns": bool,
  "has_warranty": bool,
  "estimated_delivery_days": int
}
```

**Target Variable:**
- `ai_score` (0-100) from existing products

### Algorithm: XGBoost Regressor

**Why XGBoost?**
1. **Handles mixed data types** (categorical + numerical)
2. **Missing value handling** built-in
3. **Feature importance** for explainability
4. **Fast inference** (~1-5ms per prediction)
5. **Industry proven** (used by Airbnb, Uber, eBay)

**Hyperparameters:**
```python
{
  "n_estimators": 500,
  "max_depth": 8,
  "learning_rate": 0.05,
  "subsample": 0.8,
  "colsample_bytree": 0.8,
  "objective": "reg:squarederror",
  "eval_metric": "rmse"
}
```

**Training Process:**
1. Extract 10,000+ products with existing `ai_score`
2. Split: 70% train, 15% validation, 15% test
3. Train XGBoost with early stopping
4. Evaluate: RMSE < 5 (95% within ±5 points)
5. Feature importance analysis
6. Save model to `ml/models/score_predictor_v1.joblib`

**Expected Performance:**
- **RMSE:** <5 points (target)
- **MAE:** <3 points (target)
- **R²:** >0.85 (target)
- **Inference time:** <5ms per product

### API Endpoint

```typescript
// POST /api/ml/predict-score
{
  "product": {
    "name": "Apple MacBook Pro M3",
    "price": 2499.00,
    "category": "ELECTRONICS",
    // ... other features
  }
}

// Response
{
  "predicted_score": 87.3,
  "confidence": 0.92,
  "feature_importance": {
    "seller_rating": 0.18,
    "price": 0.15,
    "brand": 0.12,
    // ... top 10 features
  },
  "explanation": "High score due to verified seller (rating 4.8), premium brand, complete specifications",
  "model_version": "v1.0.0",
  "inference_time_ms": 3.2
}
```

---

## Phase 3.3: Anomaly Detection

### Goal
Detect fraudulent listings, pricing anomalies, and suspicious seller behavior in real-time.

### Anomaly Types

**1. Pricing Anomalies**
- Price too low (counterfeit/scam risk)
- Price too high (price gouging)
- Sudden price changes (suspicious activity)

**2. Product Anomalies**
- Incomplete/suspicious specifications
- Mismatched category and attributes
- Unrealistic product claims

**3. Seller Anomalies**
- Sudden rating drops
- High return rates
- Unusual sales patterns

### Algorithm: Isolation Forest

**Why Isolation Forest?**
1. **Unsupervised** - no labeled fraud data needed
2. **Efficient** - O(n log n) training
3. **Effective** - 95%+ accuracy for outliers
4. **Explainable** - provides anomaly scores

**Features for Anomaly Detection (25 features):**
```python
{
  # Price-related
  "price_to_category_median_ratio": float,
  "price_to_original_price_ratio": float,
  "discount_percentage": float,

  # Seller behavior
  "seller_rating": float,
  "seller_rating_change_30d": float,  # New metric
  "seller_return_rate": float,
  "seller_dispute_rate": float,  # New metric
  "seller_account_age_days": int,
  "seller_listing_count": int,

  # Product characteristics
  "specification_completeness": float,  # 0-1 scale
  "image_count": int,
  "description_length": int,
  "view_to_purchase_ratio": float,
  "cart_abandonment_rate": float,

  # Time-based patterns
  "listing_hour": int,  # 0-23
  "price_changes_7d": int,
  "stock_changes_7d": int,

  # Cross-reference
  "similar_products_price_deviation": float,
  "category_price_zscore": float,
  "brand_authenticity_score": float  # New metric
}
```

**Training Process:**
1. Extract 50,000+ normal transactions
2. Train Isolation Forest (contamination=0.01)
3. Validate on known fraud cases (if available)
4. Tune threshold for <1% false positives
5. Save model to `ml/models/anomaly_detector_v1.joblib`

**Expected Performance:**
- **True Positive Rate:** >95%
- **False Positive Rate:** <1%
- **Precision:** >90%
- **Inference time:** <10ms per product

### API Endpoint

```typescript
// GET /api/ml/detect-anomalies?productId=prod_123

// Response
{
  "is_anomaly": true,
  "anomaly_score": 0.73,  // -1 to 1 (-1 = most anomalous)
  "risk_level": "HIGH",   // LOW, MEDIUM, HIGH, CRITICAL
  "flags": [
    {
      "type": "PRICING",
      "severity": "HIGH",
      "message": "Price 60% below category median",
      "recommendation": "Verify authenticity with seller"
    },
    {
      "type": "SELLER",
      "severity": "MEDIUM",
      "message": "Seller rating dropped 0.5 points in last 30 days",
      "recommendation": "Review recent customer feedback"
    }
  ],
  "similar_products_comparison": {
    "median_price": 899.00,
    "this_product_price": 349.00,
    "deviation_percentage": -61.2
  },
  "action": "MANUAL_REVIEW"  // AUTO_APPROVE, MANUAL_REVIEW, AUTO_REJECT
}
```

### Real-Time Integration

**Product Listing Flow:**
```
1. Seller submits product
   ↓
2. ML anomaly detection (10ms)
   ↓
3. If anomaly detected:
   - Flag for manual review
   - Notify admin
   - Hold listing until verified
   ↓
4. If normal:
   - Auto-approve
   - Calculate Veritas score
   - List product
```

---

## Phase 3.4: User Clustering & Collaborative Filtering

### Goal
Group users by behavior patterns for enhanced personalization and collaborative recommendations.

### Algorithm: K-Means Clustering

**Why K-Means?**
1. **Fast** - O(n·k·i) for large datasets
2. **Interpretable** - clear cluster centroids
3. **Scalable** - efficient for 100k+ users
4. **Works well** with normalized features

**User Features (20 features):**
```python
{
  # From Phase 2.7 user preferences
  "price_vs_quality": float,      # 0-1
  "sustainability_score": float,  # 0-1
  "brand_loyalty": float,         # 0-1
  "specification_detail": float,  # 0-1

  # Purchase patterns
  "average_order_value": float,
  "purchase_frequency": float,
  "preferred_categories": List[float],  # 8 categories, one-hot
  "preferred_conditions": List[float],  # 6 conditions, one-hot

  # Engagement metrics
  "view_to_cart_ratio": float,
  "cart_to_checkout_ratio": float,
  "return_rate": float,
  "review_frequency": float,  # Reviews per purchase

  # Time-based
  "account_age_days": int,
  "days_since_last_purchase": int,
  "shopping_session_duration_avg": float,  # Minutes

  # Device/behavior
  "mobile_vs_desktop": float,  # 0=desktop, 1=mobile
  "peak_shopping_hour": int,   # 0-23
}
```

**Number of Clusters:**
- Use Elbow Method + Silhouette Score
- Expected: 5-8 user segments
  - Budget-conscious bargain hunters
  - Quality-focused premium buyers
  - Eco-conscious sustainable shoppers
  - Tech-savvy early adopters
  - Fashion-forward trendsetters
  - Home improvement enthusiasts
  - Gift shoppers (seasonal)
  - Impulse buyers

**Training Process:**
1. Extract active users (>10 interactions)
2. Normalize features (StandardScaler)
3. Determine optimal k (Elbow + Silhouette)
4. Train K-Means with k=6 (expected)
5. Analyze cluster characteristics
6. Save model to `ml/models/user_clusters_v1.joblib`

**Expected Performance:**
- **Silhouette Score:** >0.4
- **Inertia:** Minimized through cross-validation
- **Cluster separation:** Clear behavioral differences
- **Inference time:** <5ms per user

### Collaborative Filtering Enhancement

**Similar User Recommendations:**
```python
def get_collaborative_recommendations(user_id: str, limit: int = 20):
    # 1. Get user's cluster
    user_cluster = model.predict(user_features)

    # 2. Find similar users in same cluster
    similar_users = get_users_in_cluster(user_cluster, limit=100)

    # 3. Get products they liked but current user hasn't seen
    recommended_products = (
        get_products_from_users(similar_users)
        .exclude(viewed_by=user_id)
        .order_by_popularity()
        .limit(limit)
    )

    return recommended_products
```

### API Endpoint

```typescript
// GET /api/ml/user-clusters?userId=user_123

// Response
{
  "user_id": "user_123",
  "cluster_id": 2,
  "cluster_name": "Quality-Focused Premium Buyers",
  "cluster_characteristics": {
    "price_vs_quality_avg": 0.82,
    "sustainability_score_avg": 0.45,
    "brand_loyalty_avg": 0.88,
    "average_order_value_avg": 247.50
  },
  "user_position": {
    "price_vs_quality": 0.85,
    "deviation_from_cluster": 0.03
  },
  "similar_users_count": 1247,
  "collaborative_recommendations": [
    {
      "product_id": "prod_xyz",
      "name": "Sony WH-1000XM5 Headphones",
      "liked_by_similar_users": 89,
      "similarity_score": 0.94
    }
  ]
}
```

---

## Phase 3.5: A/B Testing Framework

### Goal
Enable data-driven optimization of Veritas weights, UI changes, and recommendation algorithms.

### Architecture

**Experiment Tracking:**
```sql
CREATE TABLE ab_experiments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  status experiment_status NOT NULL,  -- DRAFT, ACTIVE, PAUSED, COMPLETED
  control_variant_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE experiment_status AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');

CREATE TABLE ab_variants (
  id TEXT PRIMARY KEY,
  experiment_id TEXT REFERENCES ab_experiments(id),
  name TEXT NOT NULL,
  description TEXT,
  traffic_percentage INT NOT NULL,  -- 0-100
  config JSONB NOT NULL,  -- Variant-specific configuration
  is_control BOOLEAN DEFAULT false
);

CREATE TABLE ab_assignments (
  id TEXT PRIMARY KEY,
  experiment_id TEXT REFERENCES ab_experiments(id),
  user_id TEXT NOT NULL,
  variant_id TEXT REFERENCES ab_variants(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(experiment_id, user_id)
);

CREATE TABLE ab_events (
  id TEXT PRIMARY KEY,
  experiment_id TEXT REFERENCES ab_experiments(id),
  user_id TEXT NOT NULL,
  variant_id TEXT REFERENCES ab_variants(id),
  event_type TEXT NOT NULL,  -- 'view', 'click', 'add_to_cart', 'purchase'
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ab_events_experiment ON ab_events(experiment_id, created_at);
CREATE INDEX idx_ab_events_variant ON ab_events(variant_id, event_type);
```

**Experiment Examples:**

**1. Veritas Weight Variations**
```json
{
  "experiment_id": "weights_test_001",
  "name": "Sustainability Weight Increase",
  "variants": [
    {
      "name": "Control",
      "traffic": 50,
      "config": {
        "sustainability_weight": 0.10
      }
    },
    {
      "name": "Treatment",
      "traffic": 50,
      "config": {
        "sustainability_weight": 0.15
      }
    }
  ],
  "metrics": ["ctr", "conversion_rate", "avg_order_value"]
}
```

**2. Recommendation Algorithm**
```json
{
  "experiment_id": "rec_algo_001",
  "name": "Collaborative Filtering vs Personalized Weights",
  "variants": [
    {
      "name": "Control - Personalized",
      "traffic": 50,
      "config": {
        "algorithm": "personalized_weights"
      }
    },
    {
      "name": "Treatment - Collaborative",
      "traffic": 50,
      "config": {
        "algorithm": "collaborative_filtering"
      }
    }
  ]
}
```

### Statistical Analysis

**Bayesian A/B Testing:**
- Use Bayesian inference for continuous monitoring
- Calculate probability of improvement
- Stop early if high confidence (>95%)

**Metrics:**
```python
{
  # Primary metrics
  "conversion_rate": {
    "control": 0.034,
    "treatment": 0.041,
    "lift": 20.6,  # %
    "p_value": 0.003,
    "confidence": 99.7
  },

  # Secondary metrics
  "avg_order_value": {...},
  "click_through_rate": {...},
  "revenue_per_user": {...},

  # Guardrail metrics (should not degrade)
  "bounce_rate": {...},
  "page_load_time": {...}
}
```

### API Endpoint

```typescript
// POST /api/ml/ab-test
{
  "experiment_name": "sustainability_weight_test",
  "variants": [
    {
      "name": "control",
      "traffic": 50,
      "config": { "sustainability_weight": 0.10 }
    },
    {
      "name": "treatment",
      "traffic": 50,
      "config": { "sustainability_weight": 0.15 }
    }
  ],
  "duration_days": 14,
  "primary_metric": "conversion_rate"
}

// GET /api/ml/ab-test/:experimentId/results
{
  "experiment_id": "exp_123",
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
    },
    "analysis": {
      "conversion_rate_lift": 20.3,
      "p_value": 0.004,
      "confidence": 99.6,
      "recommendation": "IMPLEMENT_TREATMENT"
    }
  }
}
```

---

## Integration with Existing System

### Phase 2.7 Enhancement

**Before (Phase 2.7):**
```typescript
// User preferences → Dynamic weight adjustment
const personalizedWeights = personalizeWeights(baseWeights, userPrefs)
```

**After (Phase 3.4):**
```typescript
// User preferences + User cluster → Enhanced personalization
const userCluster = await mlClient.getUserCluster(userId)
const collaborativeRecs = await mlClient.getCollaborativeRecommendations(userId, userCluster)
const personalizedWeights = personalizeWeights(baseWeights, userPrefs, userCluster)
```

### New Product Flow

**Before:**
```
1. Seller submits product
2. Manual Veritas scoring (slow)
3. List product
```

**After (Phase 3.2 + 3.3):**
```
1. Seller submits product
2. ML anomaly detection (10ms)
   ↓ If normal
3. ML score prediction (5ms)
4. Auto-list with predicted score
5. Background: Calculate actual Veritas score
6. Update if prediction differs >10 points
```

---

## Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| **Score Prediction RMSE** | <5 points | XGBoost tuning |
| **Anomaly Detection Precision** | >90% | Threshold optimization |
| **Anomaly Detection Recall** | >95% | Feature engineering |
| **False Positive Rate** | <1% | Conservative thresholds |
| **User Clustering Silhouette** | >0.4 | Optimal k selection |
| **ML Inference Time** | <10ms | Model optimization |
| **A/B Test Confidence** | >95% | Bayesian analysis |
| **System Uptime** | 99.9% | FastAPI + Docker |

---

## Development Roadmap

### Week 7: Foundation
- ✅ Phase 3.1: ML architecture design (this document)
- ⏳ Set up Python environment
- ⏳ Create FastAPI server skeleton
- ⏳ Implement feature extraction pipeline

### Week 8: Core Models
- ⏳ Phase 3.2: Train score prediction model
- ⏳ Phase 3.3: Train anomaly detection model
- ⏳ Create model evaluation notebooks
- ⏳ API endpoints for predictions

### Week 9: Advanced Features
- ⏳ Phase 3.4: Train user clustering model
- ⏳ Implement collaborative filtering
- ⏳ Integration with Phase 2.7 personalization

### Week 10: Testing & Deployment
- ⏳ Phase 3.5: A/B testing framework
- ⏳ Docker containerization
- ⏳ Integration testing
- ⏳ Documentation & deployment

---

## Risk Mitigation

### Technical Risks

**Risk 1: Model Prediction Accuracy**
- **Mitigation:** Ensemble methods, cross-validation, continuous retraining
- **Fallback:** Use Phase 2.6 category scoring as backup

**Risk 2: False Positives in Anomaly Detection**
- **Mitigation:** Conservative thresholds, human review for edge cases
- **Fallback:** Manual review queue with priority scoring

**Risk 3: Computational Cost**
- **Mitigation:** Model caching, batch inference, Redis caching
- **Fallback:** Async processing for non-critical predictions

**Risk 4: Data Quality**
- **Mitigation:** Robust feature engineering, missing value handling
- **Fallback:** Confidence scores, model uncertainty estimation

### Operational Risks

**Risk 1: Python/Node.js Integration**
- **Mitigation:** RESTful API with clear contracts, comprehensive error handling
- **Fallback:** Queue-based async processing

**Risk 2: Model Staleness**
- **Mitigation:** Monthly retraining schedule, performance monitoring
- **Fallback:** Version rollback mechanism

**Risk 3: Scaling**
- **Mitigation:** Horizontal scaling with Docker, load balancing
- **Fallback:** Rate limiting, priority queues

---

## Success Criteria

### Phase 3.2 (Score Prediction)
- ✅ RMSE <5 points on test set
- ✅ 90%+ predictions within ±10 points
- ✅ API latency <100ms (p95)

### Phase 3.3 (Anomaly Detection)
- ✅ >95% true positive rate
- ✅ <1% false positive rate
- ✅ Real-time detection (<10ms)

### Phase 3.4 (User Clustering)
- ✅ 5-8 interpretable clusters
- ✅ Silhouette score >0.4
- ✅ +20% CTR improvement vs no clustering

### Phase 3.5 (A/B Testing)
- ✅ Framework operational
- ✅ Statistical significance calculator
- ✅ Automated experiment tracking

---

## Next Steps

1. ✅ Complete Phase 3.1 design (this document)
2. ⏳ Set up Python ML environment
3. ⏳ Extract training data from PostgreSQL
4. ⏳ Begin Phase 3.2 implementation

---

**Phase 3.1 Status:** ✅ **DESIGN COMPLETE**
**Next Phase:** Phase 3.2 - Score Prediction Model Implementation
**Estimated Start:** Immediately after approval

---

**Related Documentation:**
- [Phase 2 Final Summary](./PHASE2_FINAL_SUMMARY.md)
- [Personalization Guide](./PERSONALIZATION_GUIDE.md)
- [Category Scoring Models](../src/lib/scoring/category-models.ts)

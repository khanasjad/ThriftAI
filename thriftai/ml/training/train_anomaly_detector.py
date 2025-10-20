"""
Anomaly Detection Model Training - Phase 3.3
Trains Isolation Forest to detect fraudulent listings, pricing anomalies, and suspicious behavior

Expected Performance:
- True Positive Rate > 95%
- False Positive Rate < 1%
- Precision > 90%
- Inference time < 10ms
"""

import os
import sys
import time
from datetime import datetime, timedelta
from typing import Tuple, Dict, List
import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
import joblib

from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_curve
import scipy.stats as stats

import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ============================================================================
# Database Configuration
# ============================================================================

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'thriftai_nextjs_dev'),
    'user': os.getenv('DB_USER', 'asjadkhan'),
    'password': os.getenv('DB_PASSWORD', '')
}

# ============================================================================
# Data Extraction
# ============================================================================

def extract_normal_transactions() -> pd.DataFrame:
    """
    Extract normal (non-fraudulent) transactions for training

    Focuses on products from verified sellers with good track records
    """
    print("📥 Extracting normal transaction data...")

    conn = psycopg2.connect(**DB_CONFIG)

    query = """
    WITH seller_stats AS (
        SELECT
            s.id as seller_id,
            s.rating as seller_rating,
            s."isVerified" as seller_is_verified,
            s."totalSales" as seller_total_sales,
            s."responseTimeHours" as seller_response_time_hours,
            s."onTimeDeliveryRate" as seller_on_time_delivery_rate,
            s."customerSatisfactionRate" as seller_satisfaction_rate,
            s."createdAt" as seller_created_at,
            COUNT(p.id) as listing_count
        FROM sellers s
        LEFT JOIN products p ON s.id = p."sellerId"
        WHERE s."isVerified" = true
          AND s.rating >= 4.0
        GROUP BY s.id
    ),
    category_price_stats AS (
        SELECT
            category,
            AVG(price) as category_avg_price,
            STDDEV(price) as category_stddev_price,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as category_median_price
        FROM products
        WHERE "isAvailable" = true
        GROUP BY category
    )
    SELECT
        -- Product basics
        p.id,
        p.name,
        p.price,
        p."originalPrice" as original_price,
        p.category,
        p.condition,
        p.brand,
        p.description,
        p."imageUrl" as image_url,
        p."createdAt" as listing_created_at,

        -- Seller information
        ss.seller_rating,
        ss.seller_is_verified,
        ss.seller_total_sales,
        ss.seller_response_time_hours,
        ss.seller_on_time_delivery_rate,
        ss.seller_satisfaction_rate,
        ss.listing_count,
        EXTRACT(EPOCH FROM (NOW() - ss.seller_created_at))/86400 as seller_account_age_days,

        -- Specifications completeness
        p.color,
        p.material,
        p."productSize" as product_size,
        p."warrantyPeriod" as warranty_period,
        p."dynamicSpecs" as dynamic_specs,

        -- Product engagement
        p."stockQuantity" as stock_quantity,
        COALESCE(views.view_count, 0) as view_count,
        COALESCE(carts.cart_count, 0) as cart_add_count,
        COALESCE(orders.purchase_count, 0) as purchase_count,

        -- Logistics
        p."hasFreeShipping" as has_free_shipping,
        p."hasFreeReturns" as has_free_returns,
        p."hasWarranty" as has_warranty,
        p."estimatedDeliveryDays" as estimated_delivery_days,

        -- Category statistics for comparison
        cps.category_avg_price,
        cps.category_stddev_price,
        cps.category_median_price

    FROM products p

    -- Join seller stats
    LEFT JOIN seller_stats ss ON p."sellerId" = ss.seller_id

    -- Join category price stats
    LEFT JOIN category_price_stats cps ON p.category = cps.category

    -- Aggregate product views
    LEFT JOIN (
        SELECT "productId", COUNT(*) as view_count
        FROM product_views
        WHERE "createdAt" >= NOW() - INTERVAL '90 days'
        GROUP BY "productId"
    ) views ON p.id = views."productId"

    -- Aggregate cart additions
    LEFT JOIN (
        SELECT "productId", COUNT(*) as cart_count
        FROM cart_items
        GROUP BY "productId"
    ) carts ON p.id = carts."productId"

    -- Aggregate purchases
    LEFT JOIN (
        SELECT oi."productId", SUM(oi.quantity) as purchase_count
        FROM order_items oi
        JOIN orders o ON oi."orderId" = o.id
        WHERE o.status IN ('COMPLETED', 'DELIVERED')
        GROUP BY oi."productId"
    ) orders ON p.id = orders."productId"

    WHERE
        p."isAvailable" = true
        AND ss.seller_is_verified = true
        AND ss.seller_rating >= 4.0
        AND p.price > 0

    LIMIT 50000;
    """

    df = pd.read_sql_query(query, conn)
    conn.close()

    print(f"✅ Extracted {len(df)} normal transactions")
    print(f"📊 Price range: ${df['price'].min():.2f} - ${df['price'].max():.2f}")

    return df


# ============================================================================
# Feature Engineering for Anomaly Detection
# ============================================================================

def engineer_anomaly_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer features specifically for anomaly detection

    Focus on ratios, deviations, and comparative metrics
    """
    print("🔧 Engineering anomaly detection features...")

    # 1. Price-related anomalies
    df['discount_percentage'] = (
        (df['original_price'] - df['price']) / df['original_price'] * 100
    ).fillna(0)

    # Price vs category median (key fraud indicator)
    df['price_to_category_median_ratio'] = (
        df['price'] / df['category_median_price']
    ).fillna(1.0)

    # Price vs original price ratio
    df['price_to_original_price_ratio'] = (
        df['price'] / df['original_price']
    ).fillna(1.0)

    # Price z-score within category
    df['category_price_zscore'] = (
        (df['price'] - df['category_avg_price']) / df['category_stddev_price']
    ).fillna(0)

    # 2. Seller behavior indicators
    df['seller_rating'] = df['seller_rating'].fillna(3.0)
    df['seller_total_sales'] = df['seller_total_sales'].fillna(0)
    df['seller_account_age_days'] = df['seller_account_age_days'].fillna(0)

    # Listing count per seller (too many listings = suspicious)
    df['listing_count'] = df['listing_count'].fillna(0)

    # 3. Product specification completeness (0-1 scale)
    spec_fields = ['color', 'material', 'product_size', 'warranty_period', 'description']
    df['specification_completeness'] = df[spec_fields].notna().sum(axis=1) / len(spec_fields)

    # Image presence
    df['has_image'] = df['image_url'].notna().astype(int)

    # Description length
    df['description_length'] = df['description'].str.len().fillna(0)

    # Dynamic specs count
    def count_dynamic_specs(specs):
        if pd.isna(specs) or specs is None:
            return 0
        try:
            import json
            if isinstance(specs, str):
                specs_dict = json.loads(specs)
            else:
                specs_dict = specs
            return len(specs_dict) if isinstance(specs_dict, dict) else 0
        except:
            return 0

    df['dynamic_specs_count'] = df['dynamic_specs'].apply(count_dynamic_specs)

    # 4. Engagement metrics
    # View-to-purchase ratio (low = suspicious)
    df['view_to_purchase_ratio'] = np.where(
        df['view_count'] > 0,
        df['purchase_count'] / df['view_count'],
        0
    )

    # Cart abandonment rate
    df['cart_abandonment_rate'] = np.where(
        df['cart_add_count'] > 0,
        1 - (df['purchase_count'] / df['cart_add_count']),
        0
    )

    # 5. Time-based patterns
    df['listing_created_at'] = pd.to_datetime(df['listing_created_at'])
    df['listing_hour'] = df['listing_created_at'].dt.hour
    df['listing_day_of_week'] = df['listing_created_at'].dt.dayofweek

    # Unusual listing times (2-6 AM = suspicious)
    df['listing_unusual_time'] = df['listing_hour'].apply(
        lambda x: 1 if 2 <= x <= 6 else 0
    )

    # 6. Boolean features
    df['has_free_shipping'] = df['has_free_shipping'].astype(int)
    df['has_free_returns'] = df['has_free_returns'].astype(int)
    df['has_warranty'] = df['has_warranty'].astype(int)

    # 7. Calculate composite risk score (for validation)
    risk_factors = []

    # Extreme price deviation
    risk_factors.append((df['price_to_category_median_ratio'] < 0.4).astype(int))
    risk_factors.append((df['price_to_category_median_ratio'] > 3.0).astype(int))

    # Extreme discount
    risk_factors.append((df['discount_percentage'] > 70).astype(int))

    # Low specification completeness
    risk_factors.append((df['specification_completeness'] < 0.3).astype(int))

    # Unusual engagement
    risk_factors.append((df['view_to_purchase_ratio'] > 0.5).astype(int))

    # New seller with many listings
    risk_factors.append(
        ((df['seller_account_age_days'] < 30) & (df['listing_count'] > 50)).astype(int)
    )

    df['manual_risk_score'] = sum(risk_factors)

    print(f"✅ Engineered {len(df.columns)} total features")
    print(f"📊 Specification completeness: {df['specification_completeness'].mean():.2f} avg")
    print(f"⚠️  Manual risk scores: {df['manual_risk_score'].value_counts().to_dict()}")

    return df


# ============================================================================
# Synthetic Anomaly Generation (for validation)
# ============================================================================

def generate_synthetic_anomalies(normal_df: pd.DataFrame, n_anomalies: int = 500) -> pd.DataFrame:
    """
    Generate synthetic anomalies for model validation

    Creates realistic fraudulent listings for testing
    """
    print(f"🔬 Generating {n_anomalies} synthetic anomalies for validation...")

    anomalies = []

    for i in range(n_anomalies):
        # Start with a normal product
        base = normal_df.sample(1).copy()

        # Randomly apply anomaly types
        anomaly_type = np.random.choice([
            'extreme_low_price',
            'extreme_high_price',
            'fake_discount',
            'incomplete_specs',
            'suspicious_seller',
            'engagement_anomaly'
        ])

        if anomaly_type == 'extreme_low_price':
            # Price 70-90% below category median
            base['price'] = base['category_median_price'] * np.random.uniform(0.1, 0.3)
            base['price_to_category_median_ratio'] = base['price'] / base['category_median_price']
            base['category_price_zscore'] = -5.0

        elif anomaly_type == 'extreme_high_price':
            # Price 3-5x category median
            base['price'] = base['category_median_price'] * np.random.uniform(3.0, 5.0)
            base['price_to_category_median_ratio'] = base['price'] / base['category_median_price']
            base['category_price_zscore'] = 5.0

        elif anomaly_type == 'fake_discount':
            # Original price inflated to show fake discount
            base['original_price'] = base['price'] * np.random.uniform(3.0, 5.0)
            base['discount_percentage'] = ((base['original_price'] - base['price']) / base['original_price'] * 100).values[0]

        elif anomaly_type == 'incomplete_specs':
            # Very low specification completeness
            base['specification_completeness'] = np.random.uniform(0.0, 0.2)
            base['description_length'] = np.random.randint(0, 50)
            base['dynamic_specs_count'] = 0

        elif anomaly_type == 'suspicious_seller':
            # New seller with low rating and many listings
            base['seller_account_age_days'] = np.random.uniform(1, 20)
            base['seller_rating'] = np.random.uniform(2.0, 3.5)
            base['listing_count'] = np.random.randint(100, 500)
            base['seller_total_sales'] = np.random.randint(0, 5)

        elif anomaly_type == 'engagement_anomaly':
            # High views but no purchases (potential scam)
            base['view_count'] = np.random.randint(1000, 5000)
            base['purchase_count'] = 0
            base['cart_add_count'] = np.random.randint(0, 10)
            base['view_to_purchase_ratio'] = 0
            base['cart_abandonment_rate'] = 1.0

        base['is_anomaly'] = 1
        base['anomaly_type'] = anomaly_type
        anomalies.append(base)

    anomalies_df = pd.concat(anomalies, ignore_index=True)

    print(f"✅ Generated anomalies by type:")
    print(anomalies_df['anomaly_type'].value_counts())

    return anomalies_df


# ============================================================================
# Model Training
# ============================================================================

def train_isolation_forest(X_train: pd.DataFrame, contamination: float = 0.01) -> Tuple:
    """
    Train Isolation Forest model

    Args:
        X_train: Training features
        contamination: Expected proportion of anomalies (0.01 = 1%)
    """
    print(f"🤖 Training Isolation Forest (contamination={contamination})...")

    # Standardize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)

    # Train Isolation Forest
    model = IsolationForest(
        n_estimators=200,
        max_samples=256,
        contamination=contamination,
        max_features=1.0,
        bootstrap=False,
        n_jobs=-1,
        random_state=42,
        verbose=1
    )

    model.fit(X_train_scaled)

    print("✅ Model training complete")

    return model, scaler


# ============================================================================
# Model Evaluation
# ============================================================================

def evaluate_anomaly_detector(
    model,
    scaler,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    feature_names: List[str]
) -> Dict:
    """
    Evaluate anomaly detection model

    Returns precision, recall, F1, and confusion matrix
    """
    print("\n📊 Evaluating anomaly detection model...")

    # Scale test data
    X_test_scaled = scaler.transform(X_test)

    # Predictions (-1 = anomaly, 1 = normal)
    start_time = time.time()
    predictions = model.predict(X_test_scaled)
    inference_time_ms = (time.time() - start_time) / len(X_test) * 1000

    # Anomaly scores (lower = more anomalous)
    anomaly_scores = model.score_samples(X_test_scaled)

    # Convert predictions (-1/1) to binary (1/0)
    y_pred = (predictions == -1).astype(int)

    # Calculate metrics
    from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score

    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    accuracy = accuracy_score(y_test, y_pred)

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    # False positive rate
    fpr = fp / (fp + tn)

    # True positive rate
    tpr = tp / (tp + fn)

    print(f"\n{'='*60}")
    print(f"ANOMALY DETECTION PERFORMANCE")
    print(f"{'='*60}")
    print(f"Accuracy:                 {accuracy*100:.2f}%")
    print(f"Precision:                {precision*100:.2f}%")
    print(f"Recall (TPR):             {recall*100:.2f}%")
    print(f"F1 Score:                 {f1:.4f}")
    print(f"False Positive Rate:      {fpr*100:.2f}%")
    print(f"Avg inference time:       {inference_time_ms:.2f}ms per product")
    print(f"\nConfusion Matrix:")
    print(f"  TN: {tn:5d}  |  FP: {fp:5d}")
    print(f"  FN: {fn:5d}  |  TP: {tp:5d}")
    print(f"{'='*60}\n")

    # Check if targets are met
    targets_met = {
        'Recall (TPR) > 95%': recall > 0.95,
        'FPR < 1%': fpr < 0.01,
        'Precision > 90%': precision > 0.90,
        'Inference < 10ms': inference_time_ms < 10
    }

    print("TARGET ACHIEVEMENT:")
    for target, met in targets_met.items():
        status = "✅" if met else "❌"
        print(f"{status} {target}: {'MET' if met else 'NOT MET'}")
    print(f"{'='*60}\n")

    # Feature importance (approximation using variance of anomaly scores)
    feature_importance_df = pd.DataFrame({
        'feature': feature_names,
        'importance': np.abs(np.corrcoef(X_test.T, anomaly_scores)[:-1, -1])
    }).sort_values('importance', ascending=False)

    print("🔍 Top 15 Most Important Features for Anomaly Detection:")
    print(feature_importance_df.head(15).to_string(index=False))
    print()

    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'fpr': fpr,
        'tpr': tpr,
        'inference_time_ms': inference_time_ms,
        'confusion_matrix': cm.tolist(),
        'feature_importance': feature_importance_df.to_dict('records')
    }


# ============================================================================
# Model Persistence
# ============================================================================

def save_anomaly_detector(model, scaler, metrics, feature_names):
    """Save model, scaler, and metadata"""
    print("💾 Saving anomaly detector...")

    models_dir = "../models"
    os.makedirs(models_dir, exist_ok=True)

    # Save model
    model_path = f"{models_dir}/anomaly_detector_v1.joblib"
    joblib.dump(model, model_path)
    print(f"✅ Model saved: {model_path}")

    # Save scaler
    scaler_path = f"{models_dir}/anomaly_detector_scaler_v1.joblib"
    joblib.dump(scaler, scaler_path)
    print(f"✅ Scaler saved: {scaler_path}")

    # Save feature names
    features_path = f"{models_dir}/anomaly_detector_features_v1.joblib"
    joblib.dump(feature_names, features_path)
    print(f"✅ Feature names saved: {features_path}")

    # Save metadata
    metadata = {
        'version': '1.0.0',
        'trained_at': datetime.utcnow().isoformat(),
        'model_type': 'IsolationForest',
        'n_features': len(feature_names),
        'feature_names': feature_names,
        'metrics': metrics,
        'hyperparameters': {
            'n_estimators': 200,
            'contamination': 0.01,
            'max_samples': 256
        },
        'risk_thresholds': {
            'LOW': 0.15,
            'MEDIUM': 0.30,
            'HIGH': 0.50,
            'CRITICAL': 0.70
        }
    }

    import json
    metadata_path = f"{models_dir}/anomaly_detector_metadata_v1.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"✅ Metadata saved: {metadata_path}")

    print(f"\n🎉 All artifacts saved successfully!")


# ============================================================================
# Main Training Pipeline
# ============================================================================

def main():
    """Main anomaly detection training pipeline"""

    print(f"\n{'='*60}")
    print("THRIFTAI ANOMALY DETECTOR TRAINING - PHASE 3.3")
    print(f"{'='*60}\n")

    # 1. Extract normal transactions
    normal_df = extract_normal_transactions()

    if len(normal_df) < 100:
        print("❌ ERROR: Not enough normal transaction data. Need at least 100 products.")
        sys.exit(1)

    # 2. Engineer features
    normal_df = engineer_anomaly_features(normal_df)

    # 3. Generate synthetic anomalies for validation
    anomalies_df = generate_synthetic_anomalies(normal_df, n_anomalies=500)

    # 4. Combine normal and anomalous data
    normal_df['is_anomaly'] = 0
    combined_df = pd.concat([normal_df, anomalies_df], ignore_index=True)

    # 5. Select features for training
    feature_cols = [
        # Price-related
        'price_to_category_median_ratio',
        'price_to_original_price_ratio',
        'discount_percentage',
        'category_price_zscore',

        # Seller behavior
        'seller_rating',
        'seller_account_age_days',
        'seller_total_sales',
        'listing_count',
        'seller_response_time_hours',
        'seller_on_time_delivery_rate',
        'seller_satisfaction_rate',

        # Product characteristics
        'specification_completeness',
        'has_image',
        'description_length',
        'dynamic_specs_count',

        # Engagement metrics
        'view_count',
        'view_to_purchase_ratio',
        'cart_abandonment_rate',

        # Time-based
        'listing_hour',
        'listing_unusual_time',

        # Boolean features
        'has_free_shipping',
        'has_free_returns',
        'has_warranty',
        'estimated_delivery_days'
    ]

    # Filter to only columns that exist
    feature_cols = [col for col in feature_cols if col in combined_df.columns]

    X = combined_df[feature_cols]
    y = combined_df['is_anomaly']

    print(f"📊 Dataset: {len(X)} products ({y.sum()} anomalies), {len(feature_cols)} features")
    print(f"   Normal: {(y==0).sum()} ({(y==0).sum()/len(y)*100:.1f}%)")
    print(f"   Anomalies: {y.sum()} ({y.sum()/len(y)*100:.1f}%)\n")

    # 6. Train/test split
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"   Train: {len(X_train)} ({len(X_train)/len(X)*100:.1f}%)")
    print(f"   Test: {len(X_test)} ({len(X_test)/len(X)*100:.1f}%)\n")

    # 7. Train model (use only normal transactions for training)
    X_train_normal = X_train[y_train == 0]
    print(f"   Training on {len(X_train_normal)} normal transactions\n")

    model, scaler = train_isolation_forest(X_train_normal, contamination=0.01)

    # 8. Evaluate model
    metrics = evaluate_anomaly_detector(model, scaler, X_test, y_test, feature_cols)

    # 9. Save model
    save_anomaly_detector(model, scaler, metrics, feature_cols)

    print(f"\n{'='*60}")
    print("TRAINING COMPLETE!")
    print(f"{'='*60}\n")
    print("🚀 Next steps:")
    print("   1. Restart ML API to load new model")
    print("   2. Test anomaly detection: GET /api/ml/detect-anomalies/{productId}")
    print("   3. Integrate with product listing flow")
    print()


if __name__ == "__main__":
    main()

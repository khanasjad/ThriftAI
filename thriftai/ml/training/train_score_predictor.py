"""
Score Prediction Model Training - Phase 3.2
Trains XGBoost regression model to predict Veritas scores for new products

Expected Performance:
- RMSE < 5 points
- MAE < 3 points
- R² > 0.85
- Inference time < 5ms
"""

import os
import sys
import time
from datetime import datetime
from typing import Tuple, Dict
import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb

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

def extract_training_data() -> pd.DataFrame:
    """
    Extract products with existing Veritas scores from PostgreSQL

    Returns DataFrame with 30+ features for training
    """
    print("📥 Extracting training data from PostgreSQL...")

    conn = psycopg2.connect(**DB_CONFIG)

    query = """
    SELECT
        -- Basic attributes
        p.id,
        p.name,
        p.price,
        p."originalPrice" as original_price,
        p.category,
        p.condition,
        p.brand,

        -- Specifications (from Phase 2.2)
        p.color,
        p.material,
        p."productSize" as product_size,
        p."warrantyPeriod" as warranty_period,
        p."durabilityRating" as durability_rating,

        -- Seller features
        s.rating as seller_rating,
        s."isVerified" as seller_is_verified,
        s."totalSales" as seller_total_sales,
        s."responseTimeHours" as seller_response_time_hours,
        s."onTimeDeliveryRate" as seller_on_time_delivery_rate,
        s."customerSatisfactionRate" as seller_satisfaction_rate,

        -- Company metrics (from Phase 2.3)
        cfm."stockPrice" as stock_price,
        cfm."marketCap" as market_cap,
        cfm."profitMargin" as profit_margin,
        cfm."creditRating" as credit_rating,
        cfm."esgScore" as esg_score,

        -- Product popularity (calculate from other tables)
        p."stockQuantity" as stock_quantity,
        COALESCE(views.view_count, 0) as view_count,
        COALESCE(carts.cart_count, 0) as cart_add_count,
        COALESCE(orders.purchase_count, 0) as purchase_count,

        -- Logistics
        p."hasFreeShipping" as has_free_shipping,
        p."hasFreeReturns" as has_free_returns,
        p."hasWarranty" as has_warranty,
        p."estimatedDeliveryDays" as estimated_delivery_days,

        -- Target variable
        p."aiScore" as ai_score,
        p."aiConfidence" as ai_confidence

    FROM products p

    -- Join seller
    LEFT JOIN sellers s ON p."sellerId" = s.id

    -- Join company financial metrics (Phase 2.3)
    LEFT JOIN company_financial_metrics cfm ON s.id = cfm."sellerId"

    -- Aggregate product views
    LEFT JOIN (
        SELECT "productId", COUNT(*) as view_count
        FROM product_views
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
        p."aiScore" IS NOT NULL
        AND p."aiScore" > 0
        AND p."isAvailable" = true
        AND p."sellerId" IS NOT NULL

    LIMIT 10000;
    """

    df = pd.read_sql_query(query, conn)
    conn.close()

    print(f"✅ Extracted {len(df)} products with scores")
    print(f"📊 Score distribution: min={df['ai_score'].min():.1f}, "
          f"max={df['ai_score'].max():.1f}, mean={df['ai_score'].mean():.1f}")

    return df


# ============================================================================
# Feature Engineering
# ============================================================================

def engineer_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
    """
    Engineer features from raw data

    Returns:
        - Processed DataFrame with engineered features
        - Encoders dictionary for inference
    """
    print("🔧 Engineering features...")

    encoders = {}

    # 1. Calculate discount percentage
    df['discount_percentage'] = (
        (df['original_price'] - df['price']) / df['original_price'] * 100
    ).fillna(0)

    # 2. Extract warranty period in months
    def parse_warranty(w):
        if pd.isna(w):
            return 0
        w = str(w).lower()
        if 'year' in w:
            return int(''.join(filter(str.isdigit, w))) * 12
        elif 'month' in w:
            return int(''.join(filter(str.isdigit, w)))
        return 0

    df['warranty_months'] = df['warranty_period'].apply(parse_warranty)

    # 3. Encode categorical features
    # Category
    category_encoder = LabelEncoder()
    df['category_encoded'] = category_encoder.fit_transform(df['category'].fillna('UNKNOWN'))
    encoders['category'] = category_encoder

    # Condition
    condition_encoder = LabelEncoder()
    df['condition_encoded'] = condition_encoder.fit_transform(df['condition'].fillna('UNKNOWN'))
    encoders['condition'] = condition_encoder

    # Brand (use frequency encoding for high cardinality)
    brand_freq = df['brand'].value_counts(normalize=True).to_dict()
    df['brand_frequency'] = df['brand'].map(brand_freq).fillna(0)
    encoders['brand_freq'] = brand_freq

    # Credit Rating
    credit_rating_map = {
        'AAA': 10, 'AA+': 9, 'AA': 8, 'AA-': 7,
        'A+': 6, 'A': 5, 'A-': 4,
        'BBB+': 3, 'BBB': 2, 'BBB-': 1,
        'BB+': 0, 'BB': -1, 'BB-': -2
    }
    df['credit_rating_encoded'] = df['credit_rating'].map(credit_rating_map).fillna(0)
    encoders['credit_rating'] = credit_rating_map

    # 4. Boolean conversions
    df['seller_is_verified'] = df['seller_is_verified'].astype(int)
    df['has_free_shipping'] = df['has_free_shipping'].astype(int)
    df['has_free_returns'] = df['has_free_returns'].astype(int)
    df['has_warranty'] = df['has_warranty'].astype(int)

    # 5. Handle missing values
    numeric_cols = [
        'price', 'original_price', 'discount_percentage',
        'seller_rating', 'seller_total_sales', 'seller_response_time_hours',
        'seller_on_time_delivery_rate', 'seller_satisfaction_rate',
        'stock_price', 'market_cap', 'profit_margin', 'esg_score',
        'stock_quantity', 'view_count', 'cart_add_count', 'purchase_count',
        'estimated_delivery_days', 'warranty_months'
    ]

    for col in numeric_cols:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())

    print(f"✅ Engineered features: {len(df.columns)} total columns")

    return df, encoders


# ============================================================================
# Model Training
# ============================================================================

def train_model(X_train, y_train, X_val, y_val) -> xgb.XGBRegressor:
    """
    Train XGBoost regression model

    Uses hyperparameters from Phase 3 design document
    """
    print("🤖 Training XGBoost model...")

    model = xgb.XGBRegressor(
        n_estimators=500,
        max_depth=8,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective='reg:squarederror',
        eval_metric='rmse',
        random_state=42,
        n_jobs=-1,
        early_stopping_rounds=50
    )

    # Train with validation set for early stopping
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=50
    )

    return model


# ============================================================================
# Model Evaluation
# ============================================================================

def evaluate_model(model, X_test, y_test, feature_names) -> Dict:
    """
    Evaluate model performance

    Calculates RMSE, MAE, R² and feature importance
    """
    print("\n📊 Evaluating model performance...")

    # Predictions
    start_time = time.time()
    y_pred = model.predict(X_test)
    inference_time_ms = (time.time() - start_time) / len(X_test) * 1000

    # Metrics
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    # Percentage within ±5 points
    within_5 = np.mean(np.abs(y_test - y_pred) <= 5) * 100
    within_10 = np.mean(np.abs(y_test - y_pred) <= 10) * 100

    print(f"\n{'='*60}")
    print(f"MODEL PERFORMANCE METRICS")
    print(f"{'='*60}")
    print(f"RMSE:                     {rmse:.2f} points")
    print(f"MAE:                      {mae:.2f} points")
    print(f"R²:                       {r2:.4f}")
    print(f"Within ±5 points:         {within_5:.1f}%")
    print(f"Within ±10 points:        {within_10:.1f}%")
    print(f"Avg inference time:       {inference_time_ms:.2f}ms per product")
    print(f"{'='*60}\n")

    # Feature importance
    importance_df = pd.DataFrame({
        'feature': feature_names,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)

    print("🔍 Top 15 Most Important Features:")
    print(importance_df.head(15).to_string(index=False))

    # Check if targets are met
    targets_met = {
        'RMSE < 5': rmse < 5,
        'MAE < 3': mae < 3,
        'R² > 0.85': r2 > 0.85,
        'Inference < 5ms': inference_time_ms < 5
    }

    print(f"\n{'='*60}")
    print("TARGET ACHIEVEMENT:")
    for target, met in targets_met.items():
        status = "✅" if met else "❌"
        print(f"{status} {target}: {'MET' if met else 'NOT MET'}")
    print(f"{'='*60}\n")

    return {
        'rmse': rmse,
        'mae': mae,
        'r2': r2,
        'within_5': within_5,
        'within_10': within_10,
        'inference_time_ms': inference_time_ms,
        'feature_importance': importance_df.to_dict('records')
    }


# ============================================================================
# Model Persistence
# ============================================================================

def save_model(model, encoders, metrics, feature_names):
    """
    Save model, encoders, and metadata
    """
    print("💾 Saving model and artifacts...")

    # Create models directory
    models_dir = "../models"
    os.makedirs(models_dir, exist_ok=True)

    # Save model
    model_path = f"{models_dir}/score_predictor_v1.joblib"
    joblib.dump(model, model_path)
    print(f"✅ Model saved: {model_path}")

    # Save encoders
    encoders_path = f"{models_dir}/score_predictor_encoders_v1.joblib"
    joblib.dump(encoders, encoders_path)
    print(f"✅ Encoders saved: {encoders_path}")

    # Save feature names
    features_path = f"{models_dir}/score_predictor_features_v1.joblib"
    joblib.dump(feature_names, features_path)
    print(f"✅ Feature names saved: {features_path}")

    # Save metadata
    metadata = {
        'version': '1.0.0',
        'trained_at': datetime.utcnow().isoformat(),
        'model_type': 'XGBRegressor',
        'n_features': len(feature_names),
        'feature_names': feature_names,
        'metrics': metrics,
        'hyperparameters': {
            'n_estimators': 500,
            'max_depth': 8,
            'learning_rate': 0.05
        }
    }

    import json
    metadata_path = f"{models_dir}/score_predictor_metadata_v1.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"✅ Metadata saved: {metadata_path}")

    print(f"\n🎉 All artifacts saved successfully!")


# ============================================================================
# Main Training Pipeline
# ============================================================================

def main():
    """Main training pipeline"""

    print(f"\n{'='*60}")
    print("THRIFTAI SCORE PREDICTOR TRAINING - PHASE 3.2")
    print(f"{'='*60}\n")

    # 1. Extract data
    df = extract_training_data()

    if len(df) < 100:
        print("❌ ERROR: Not enough training data. Need at least 100 products.")
        print("💡 TIP: Run Veritas scoring on more products first.")
        sys.exit(1)

    # 2. Engineer features
    df, encoders = engineer_features(df)

    # 3. Select features
    feature_cols = [
        # Numeric features
        'price', 'original_price', 'discount_percentage',
        'seller_rating', 'seller_is_verified', 'seller_total_sales',
        'seller_response_time_hours', 'seller_on_time_delivery_rate',
        'seller_satisfaction_rate',
        'stock_price', 'market_cap', 'profit_margin', 'esg_score',
        'stock_quantity', 'view_count', 'cart_add_count', 'purchase_count',
        'has_free_shipping', 'has_free_returns', 'has_warranty',
        'estimated_delivery_days', 'warranty_months',

        # Encoded categorical features
        'category_encoded', 'condition_encoded', 'brand_frequency',
        'credit_rating_encoded'
    ]

    # Filter to only columns that exist
    feature_cols = [col for col in feature_cols if col in df.columns]

    X = df[feature_cols]
    y = df['ai_score']

    print(f"📊 Training dataset: {len(X)} products, {len(feature_cols)} features")

    # 4. Train/validation/test split
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=0.176, random_state=42  # 0.176 * 0.85 ≈ 0.15
    )

    print(f"   Train: {len(X_train)} ({len(X_train)/len(X)*100:.1f}%)")
    print(f"   Validation: {len(X_val)} ({len(X_val)/len(X)*100:.1f}%)")
    print(f"   Test: {len(X_test)} ({len(X_test)/len(X)*100:.1f}%)\n")

    # 5. Train model
    model = train_model(X_train, y_train, X_val, y_val)

    # 6. Evaluate model
    metrics = evaluate_model(model, X_test, y_test, feature_cols)

    # 7. Save model
    save_model(model, encoders, metrics, feature_cols)

    print(f"\n{'='*60}")
    print("TRAINING COMPLETE!")
    print(f"{'='*60}\n")
    print("🚀 Next steps:")
    print("   1. Start the ML API server: cd ml/inference && python main.py")
    print("   2. Test the API: curl http://localhost:8000/health")
    print("   3. Make predictions: POST /api/ml/predict-score")
    print()


if __name__ == "__main__":
    main()

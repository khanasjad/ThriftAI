"""
User Clustering Model Training - Phase 3.4
Trains K-Means clustering model to group users by behavior patterns

Expected Performance:
- Silhouette Score > 0.4
- 5-8 interpretable clusters
- +20-30% CTR improvement through collaborative filtering
- Inference time < 5ms
"""

import os
import sys
import time
from datetime import datetime
from typing import Tuple, Dict, List
import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
import joblib

from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, calinski_harabasz_score, davies_bouldin_score
import matplotlib.pyplot as plt
import seaborn as sns

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

def extract_user_behavior_data() -> pd.DataFrame:
    """
    Extract user behavior data from database

    Integrates with Phase 2.7 user preferences
    """
    print("📥 Extracting user behavior data...")

    conn = psycopg2.connect(**DB_CONFIG)

    query = """
    WITH user_views AS (
        SELECT
            "userId",
            COUNT(*) as total_views,
            COUNT(DISTINCT pv."productId") as unique_products_viewed,
            AVG(p.price) as avg_viewed_price,
            AVG(p."aiScore") as avg_viewed_score
        FROM product_views pv
        JOIN products p ON pv."productId" = p.id
        WHERE pv."userId" IS NOT NULL
        GROUP BY "userId"
    ),
    user_purchases AS (
        SELECT
            o."buyerId" as user_id,
            COUNT(*) as total_orders,
            SUM(o.total) as total_spent,
            AVG(o.total) as avg_order_value,
            COUNT(DISTINCT DATE_TRUNC('month', o."createdAt")) as active_months,
            MAX(o."createdAt") as last_purchase_date,
            MIN(o."createdAt") as first_purchase_date
        FROM orders o
        WHERE o.status IN ('COMPLETED', 'DELIVERED')
        GROUP BY o."buyerId"
    ),
    user_cart_behavior AS (
        SELECT
            c."userId",
            COUNT(*) as total_cart_additions,
            COUNT(DISTINCT ci."productId") as unique_products_in_cart
        FROM cart_items ci
        JOIN carts c ON ci."cartId" = c.id
        WHERE c."userId" IS NOT NULL
        GROUP BY c."userId"
    ),
    user_categories AS (
        SELECT
            pv."userId",
            p.category,
            COUNT(*) as category_view_count,
            ROW_NUMBER() OVER (PARTITION BY pv."userId" ORDER BY COUNT(*) DESC) as category_rank
        FROM product_views pv
        JOIN products p ON pv."productId" = p.id
        WHERE pv."userId" IS NOT NULL
        GROUP BY pv."userId", p.category
    ),
    user_conditions AS (
        SELECT
            pv."userId",
            p.condition,
            COUNT(*) as condition_view_count,
            ROW_NUMBER() OVER (PARTITION BY pv."userId" ORDER BY COUNT(*) DESC) as condition_rank
        FROM product_views pv
        JOIN products p ON pv."productId" = p.id
        WHERE pv."userId" IS NOT NULL AND p.condition IS NOT NULL
        GROUP BY pv."userId", p.condition
    )
    SELECT
        uv."userId",

        -- View behavior
        uv.total_views,
        uv.unique_products_viewed,
        uv.avg_viewed_price,
        uv.avg_viewed_score,

        -- Purchase behavior
        COALESCE(up.total_orders, 0) as total_orders,
        COALESCE(up.total_spent, 0) as total_spent,
        COALESCE(up.avg_order_value, 0) as avg_order_value,
        COALESCE(up.active_months, 0) as active_months,
        COALESCE(EXTRACT(EPOCH FROM (NOW() - up.last_purchase_date))/86400, 9999) as days_since_last_purchase,

        -- Cart behavior
        COALESCE(ucb.total_cart_additions, 0) as total_cart_additions,
        COALESCE(ucb.unique_products_in_cart, 0) as unique_products_in_cart,

        -- Engagement ratios
        CASE
            WHEN uv.total_views > 0 THEN COALESCE(ucb.total_cart_additions, 0)::FLOAT / uv.total_views
            ELSE 0
        END as view_to_cart_ratio,

        CASE
            WHEN COALESCE(ucb.total_cart_additions, 0) > 0
            THEN COALESCE(up.total_orders, 0)::FLOAT / ucb.total_cart_additions
            ELSE 0
        END as cart_to_checkout_ratio,

        -- Preferred categories (top 3)
        MAX(CASE WHEN uc.category_rank = 1 THEN uc.category ELSE NULL END) as preferred_category_1,
        MAX(CASE WHEN uc.category_rank = 2 THEN uc.category ELSE NULL END) as preferred_category_2,
        MAX(CASE WHEN uc.category_rank = 3 THEN uc.category ELSE NULL END) as preferred_category_3,

        -- Preferred conditions (top 2)
        MAX(CASE WHEN ucond.condition_rank = 1 THEN ucond.condition ELSE NULL END) as preferred_condition_1,
        MAX(CASE WHEN ucond.condition_rank = 2 THEN ucond.condition ELSE NULL END) as preferred_condition_2

    FROM user_views uv
    LEFT JOIN user_purchases up ON uv."userId" = up.user_id
    LEFT JOIN user_cart_behavior ucb ON uv."userId" = ucb."userId"
    LEFT JOIN user_categories uc ON uv."userId" = uc."userId" AND uc.category_rank <= 3
    LEFT JOIN user_conditions ucond ON uv."userId" = ucond."userId" AND ucond.condition_rank <= 2

    WHERE uv.total_views >= 5  -- Minimum engagement threshold

    GROUP BY
        uv."userId", uv.total_views, uv.unique_products_viewed,
        uv.avg_viewed_price, uv.avg_viewed_score,
        up.total_orders, up.total_spent, up.avg_order_value,
        up.active_months, up.last_purchase_date,
        ucb.total_cart_additions, ucb.unique_products_in_cart

    ORDER BY uv.total_views DESC

    LIMIT 10000;
    """

    df = pd.read_sql_query(query, conn)
    conn.close()

    print(f"✅ Extracted {len(df)} active users")
    print(f"📊 Engagement range: {df['total_views'].min()}-{df['total_views'].max()} views")

    return df


# ============================================================================
# Feature Engineering
# ============================================================================

def engineer_clustering_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, StandardScaler]:
    """
    Engineer features for user clustering

    Calculates behavioral scores similar to Phase 2.7
    """
    print("🔧 Engineering clustering features...")

    features = pd.DataFrame()

    # 1. Price vs Quality preference
    # High avg viewed score + high avg price = quality-focused (1.0)
    # Low avg price = budget-focused (0.0)
    features['price_vs_quality'] = np.clip(
        (df['avg_viewed_score'] / 100) * (df['avg_viewed_price'] / 100),
        0, 1
    )

    # 2. Sustainability score (prefer used/refurbished)
    sustainable_conditions = ['USED', 'REFURBISHED', 'FOR_PARTS']
    features['sustainability_score'] = df.apply(
        lambda row: 0.7 if row['preferred_condition_1'] in sustainable_conditions
                    else 0.3 if row['preferred_condition_2'] in sustainable_conditions
                    else 0.1,
        axis=1
    )

    # 3. Brand loyalty (approximated by avg viewed score)
    features['brand_loyalty'] = df['avg_viewed_score'] / 100

    # 4. Specification detail (approximated by engagement)
    features['specification_detail'] = np.clip(
        df['unique_products_viewed'] / df['total_views'],
        0, 1
    )

    # 5. Purchase patterns
    features['average_order_value'] = df['avg_order_value']

    # Purchase frequency (orders per month)
    features['purchase_frequency'] = np.where(
        df['active_months'] > 0,
        df['total_orders'] / df['active_months'],
        0
    )

    # 6. Engagement metrics
    features['view_to_cart_ratio'] = df['view_to_cart_ratio']
    features['cart_to_checkout_ratio'] = df['cart_to_checkout_ratio']

    # Return rate (placeholder - would need order status data)
    features['return_rate'] = 0.05  # 5% default

    # Review frequency (placeholder)
    features['review_frequency'] = 0.5  # Default

    # 7. Time-based
    features['days_since_last_purchase'] = np.clip(df['days_since_last_purchase'], 0, 365)
    features['shopping_session_duration_avg'] = 15.0  # Default 15 minutes

    # 8. Category preferences (one-hot encoding of top category)
    category_dummies = pd.get_dummies(
        df['preferred_category_1'],
        prefix='category',
        dummy_na=True
    )
    features = pd.concat([features, category_dummies], axis=1)

    # 9. Condition preferences (one-hot encoding)
    condition_dummies = pd.get_dummies(
        df['preferred_condition_1'],
        prefix='condition',
        dummy_na=True
    )
    features = pd.concat([features, condition_dummies], axis=1)

    # Keep userId for reference
    features['userId'] = df['userId']

    print(f"✅ Engineered {len(features.columns)-1} clustering features")

    # Standardize features (except userId)
    feature_cols = [col for col in features.columns if col != 'userId']
    scaler = StandardScaler()
    features[feature_cols] = scaler.fit_transform(features[feature_cols])

    return features, scaler


# ============================================================================
# Optimal K Selection
# ============================================================================

def find_optimal_k(X: pd.DataFrame, k_range: range = range(2, 11)) -> int:
    """
    Find optimal number of clusters using Elbow Method and Silhouette Score

    Tests k from 2 to 10
    """
    print("🔍 Finding optimal number of clusters...")

    inertias = []
    silhouette_scores = []
    calinski_scores = []

    for k in k_range:
        print(f"   Testing k={k}...", end=" ")

        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)

        inertias.append(kmeans.inertia_)
        silhouette_scores.append(silhouette_score(X, labels))
        calinski_scores.append(calinski_harabasz_score(X, labels))

        print(f"Silhouette: {silhouette_scores[-1]:.3f}")

    # Find elbow point (maximum curvature)
    # Use second derivative
    inertia_diff = np.diff(inertias)
    inertia_diff2 = np.diff(inertia_diff)
    elbow_k = k_range[np.argmax(inertia_diff2) + 2]

    # Find k with best silhouette score
    silhouette_k = k_range[np.argmax(silhouette_scores)]

    print(f"\n📊 Optimal K Analysis:")
    print(f"   Elbow method suggests: k={elbow_k}")
    print(f"   Best silhouette score: k={silhouette_k} (score={max(silhouette_scores):.3f})")

    # Prefer silhouette score, but ensure k is reasonable (5-8)
    optimal_k = silhouette_k if 5 <= silhouette_k <= 8 else elbow_k

    print(f"   ✅ Selected optimal k={optimal_k}\n")

    return optimal_k


# ============================================================================
# Model Training
# ============================================================================

def train_kmeans(X: pd.DataFrame, n_clusters: int) -> KMeans:
    """
    Train K-Means clustering model

    Uses K-Means++ initialization for better convergence
    """
    print(f"🤖 Training K-Means with k={n_clusters}...")

    model = KMeans(
        n_clusters=n_clusters,
        init='k-means++',
        n_init=20,
        max_iter=500,
        random_state=42,
        verbose=0
    )

    model.fit(X)

    print("✅ Model training complete")

    return model


# ============================================================================
# Cluster Analysis
# ============================================================================

def analyze_clusters(
    model: KMeans,
    features: pd.DataFrame,
    original_df: pd.DataFrame
) -> Dict:
    """
    Analyze cluster characteristics

    Generates human-readable cluster names and profiles
    """
    print("\n📊 Analyzing cluster characteristics...")

    # Get cluster assignments
    features['cluster'] = model.labels_

    # Calculate cluster statistics
    cluster_stats = []

    for cluster_id in range(model.n_clusters):
        cluster_data = features[features['cluster'] == cluster_id]
        cluster_users = original_df[features['cluster'] == cluster_id]

        stats = {
            'cluster_id': cluster_id,
            'size': len(cluster_data),
            'percentage': len(cluster_data) / len(features) * 100,

            # Behavioral averages (descale)
            'price_vs_quality_avg': cluster_data['price_vs_quality'].mean(),
            'sustainability_score_avg': cluster_data['sustainability_score'].mean(),
            'brand_loyalty_avg': cluster_data['brand_loyalty'].mean(),
            'specification_detail_avg': cluster_data['specification_detail'].mean(),

            # Purchase patterns
            'average_order_value_avg': cluster_users['avg_order_value'].mean(),
            'purchase_frequency_avg': cluster_users['total_orders'].sum() / max(cluster_users['active_months'].sum(), 1),

            # Engagement
            'view_to_cart_ratio_avg': cluster_users['view_to_cart_ratio'].mean(),
            'cart_to_checkout_ratio_avg': cluster_users['cart_to_checkout_ratio'].mean(),

            # Preferred categories
            'top_category': cluster_users['preferred_category_1'].mode()[0] if len(cluster_users['preferred_category_1'].mode()) > 0 else 'UNKNOWN',
            'top_condition': cluster_users['preferred_condition_1'].mode()[0] if len(cluster_users['preferred_condition_1'].mode()) > 0 else 'UNKNOWN'
        }

        # Generate cluster name based on characteristics
        stats['cluster_name'] = generate_cluster_name(stats)

        cluster_stats.append(stats)

    # Print cluster summary
    print(f"\n{'='*80}")
    print("CLUSTER ANALYSIS")
    print(f"{'='*80}")

    for stats in cluster_stats:
        print(f"\n🏷️  Cluster {stats['cluster_id']}: {stats['cluster_name']}")
        print(f"   Size: {stats['size']} users ({stats['percentage']:.1f}%)")
        print(f"   Price vs Quality: {stats['price_vs_quality_avg']:.2f}")
        print(f"   Sustainability: {stats['sustainability_score_avg']:.2f}")
        print(f"   Brand Loyalty: {stats['brand_loyalty_avg']:.2f}")
        print(f"   Avg Order Value: ${stats['average_order_value_avg']:.2f}")
        print(f"   Top Category: {stats['top_category']}")
        print(f"   Top Condition: {stats['top_condition']}")

    print(f"{'='*80}\n")

    return {
        'cluster_stats': cluster_stats,
        'n_clusters': model.n_clusters,
        'cluster_labels': model.labels_.tolist()
    }


def generate_cluster_name(stats: Dict) -> str:
    """Generate human-readable cluster name based on characteristics"""

    # Quality-focused vs budget-focused
    if stats['price_vs_quality_avg'] > 0.7:
        quality_label = "Premium"
    elif stats['price_vs_quality_avg'] < 0.3:
        quality_label = "Budget"
    else:
        quality_label = "Value"

    # Sustainability-conscious
    if stats['sustainability_score_avg'] > 0.6:
        quality_label = "Eco-" + quality_label

    # Purchase behavior
    if stats['purchase_frequency_avg'] > 2:
        behavior_label = "Frequent Buyers"
    elif stats['purchase_frequency_avg'] > 0.5:
        behavior_label = "Regular Shoppers"
    elif stats['purchase_frequency_avg'] > 0:
        behavior_label = "Occasional Buyers"
    else:
        behavior_label = "Window Shoppers"

    # Category focus
    category_focus = stats['top_category']
    if category_focus and category_focus != 'UNKNOWN':
        category_label = category_focus.replace('_', ' ').title()
    else:
        category_label = "General"

    return f"{quality_label} {behavior_label} ({category_label})"


# ============================================================================
# Model Evaluation
# ============================================================================

def evaluate_clustering(model: KMeans, X: pd.DataFrame) -> Dict:
    """
    Evaluate clustering quality

    Calculates Silhouette, Calinski-Harabasz, and Davies-Bouldin scores
    """
    print("📊 Evaluating clustering quality...")

    labels = model.labels_

    silhouette = silhouette_score(X, labels)
    calinski = calinski_harabasz_score(X, labels)
    davies_bouldin = davies_bouldin_score(X, labels)

    print(f"\n{'='*60}")
    print(f"CLUSTERING QUALITY METRICS")
    print(f"{'='*60}")
    print(f"Silhouette Score:        {silhouette:.4f} (higher is better, >0.4 target)")
    print(f"Calinski-Harabasz:       {calinski:.2f} (higher is better)")
    print(f"Davies-Bouldin:          {davies_bouldin:.4f} (lower is better)")
    print(f"Inertia:                 {model.inertia_:.2f}")
    print(f"{'='*60}\n")

    # Check if target is met
    target_met = silhouette > 0.4

    if target_met:
        print("✅ Target achieved: Silhouette Score > 0.4")
    else:
        print("⚠️  Target not met: Silhouette Score < 0.4")
        print("💡 Consider adjusting k or feature engineering")

    return {
        'silhouette_score': silhouette,
        'calinski_harabasz_score': calinski,
        'davies_bouldin_score': davies_bouldin,
        'inertia': model.inertia_,
        'target_met': target_met
    }


# ============================================================================
# Model Persistence
# ============================================================================

def save_user_clustering_model(model, scaler, metrics, cluster_analysis, feature_names):
    """Save model, scaler, and metadata"""
    print("💾 Saving user clustering model...")

    models_dir = "../models"
    os.makedirs(models_dir, exist_ok=True)

    # Save model
    model_path = f"{models_dir}/user_clusters_v1.joblib"
    joblib.dump(model, model_path)
    print(f"✅ Model saved: {model_path}")

    # Save scaler
    scaler_path = f"{models_dir}/user_clusters_scaler_v1.joblib"
    joblib.dump(scaler, scaler_path)
    print(f"✅ Scaler saved: {scaler_path}")

    # Save feature names
    features_path = f"{models_dir}/user_clusters_features_v1.joblib"
    joblib.dump(feature_names, features_path)
    print(f"✅ Feature names saved: {features_path}")

    # Save metadata
    metadata = {
        'version': '1.0.0',
        'trained_at': datetime.utcnow().isoformat(),
        'model_type': 'KMeans',
        'n_clusters': model.n_clusters,
        'n_features': len(feature_names),
        'feature_names': feature_names,
        'metrics': metrics,
        'cluster_analysis': cluster_analysis,
        'hyperparameters': {
            'init': 'k-means++',
            'n_init': 20,
            'max_iter': 500
        }
    }

    import json
    metadata_path = f"{models_dir}/user_clusters_metadata_v1.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2, default=str)
    print(f"✅ Metadata saved: {metadata_path}")

    print(f"\n🎉 All artifacts saved successfully!")


# ============================================================================
# Main Training Pipeline
# ============================================================================

def main():
    """Main user clustering training pipeline"""

    print(f"\n{'='*60}")
    print("THRIFTAI USER CLUSTERING TRAINING - PHASE 3.4")
    print(f"{'='*60}\n")

    # 1. Extract user behavior data
    df = extract_user_behavior_data()

    if len(df) < 50:
        print("❌ ERROR: Not enough active users. Need at least 50 users with 5+ interactions.")
        sys.exit(1)

    # 2. Engineer features
    features, scaler = engineer_clustering_features(df)

    # 3. Prepare feature matrix
    feature_cols = [col for col in features.columns if col != 'userId']
    X = features[feature_cols]

    print(f"📊 Clustering dataset: {len(X)} users, {len(feature_cols)} features\n")

    # 4. Find optimal k
    optimal_k = find_optimal_k(X, range(3, 9))

    # 5. Train K-Means
    model = train_kmeans(X, optimal_k)

    # 6. Analyze clusters
    cluster_analysis = analyze_clusters(model, features.copy(), df)

    # 7. Evaluate clustering
    metrics = evaluate_clustering(model, X)

    # 8. Save model
    save_user_clustering_model(model, scaler, metrics, cluster_analysis, feature_cols)

    print(f"\n{'='*60}")
    print("TRAINING COMPLETE!")
    print(f"{'='*60}\n")
    print("🚀 Next steps:")
    print("   1. Restart ML API to load new model")
    print("   2. Test clustering: GET /api/ml/user-clusters/{userId}")
    print("   3. Integrate with personalization system")
    print()


if __name__ == "__main__":
    main()

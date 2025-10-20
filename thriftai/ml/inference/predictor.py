"""
ML Predictor Utilities - Phase 3.2 & 3.3
Helper functions for model inference and feature extraction
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
import joblib
import os

from schemas import (
    ProductFeatures,
    FeatureImportance,
    AnomalyFlag,
    SimilarProductsComparison
)


# ============================================================================
# Score Prediction (Phase 3.2)
# ============================================================================

class ScorePredictor:
    """Score prediction using trained XGBoost model"""

    def __init__(self, model_path: str, encoders_path: str, features_path: str):
        """Load trained model and artifacts"""
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}")

        self.model = joblib.load(model_path)
        self.encoders = joblib.load(encoders_path)
        self.feature_names = joblib.load(features_path)

    def extract_features(self, product: ProductFeatures) -> pd.DataFrame:
        """
        Extract features from product for prediction

        Applies same transformations as training pipeline
        """
        features = {}

        # Basic numeric features
        features['price'] = product.price
        features['original_price'] = product.original_price

        # Calculate discount
        features['discount_percentage'] = (
            (product.original_price - product.price) / product.original_price * 100
            if product.original_price > 0 else 0
        )

        # Seller features
        features['seller_rating'] = product.seller_rating
        features['seller_is_verified'] = int(product.seller_is_verified)
        features['seller_total_sales'] = product.seller_total_sales
        features['seller_response_time_hours'] = product.seller_response_time_hours
        features['seller_on_time_delivery_rate'] = product.seller_on_time_delivery_rate
        features['seller_satisfaction_rate'] = product.seller_satisfaction_rate

        # Company metrics (optional)
        features['stock_price'] = product.stock_price or 0
        features['market_cap'] = product.market_cap or 0
        features['profit_margin'] = product.profit_margin or 0
        features['esg_score'] = product.esg_score or 0

        # Product popularity
        features['stock_quantity'] = product.stock_quantity
        features['view_count'] = product.view_count
        features['cart_add_count'] = product.cart_add_count
        features['purchase_count'] = product.purchase_count

        # Logistics
        features['has_free_shipping'] = int(product.has_free_shipping)
        features['has_free_returns'] = int(product.has_free_returns)
        features['has_warranty'] = int(product.has_warranty)
        features['estimated_delivery_days'] = product.estimated_delivery_days

        # Warranty in months
        features['warranty_months'] = self._parse_warranty(product.warranty_period)

        # Categorical encodings
        features['category_encoded'] = self._encode_category(product.category)
        features['condition_encoded'] = self._encode_condition(product.condition)
        features['brand_frequency'] = self._encode_brand(product.brand)
        features['credit_rating_encoded'] = self._encode_credit_rating(product.credit_rating)

        # Create DataFrame with correct column order
        df = pd.DataFrame([features])

        # Ensure all feature columns exist
        for col in self.feature_names:
            if col not in df.columns:
                df[col] = 0

        return df[self.feature_names]

    def _parse_warranty(self, warranty: str) -> int:
        """Parse warranty period to months"""
        if not warranty:
            return 0
        warranty = warranty.lower()
        if 'year' in warranty:
            return int(''.join(filter(str.isdigit, warranty))) * 12
        elif 'month' in warranty:
            return int(''.join(filter(str.isdigit, warranty)))
        return 0

    def _encode_category(self, category: str) -> int:
        """Encode category using trained encoder"""
        try:
            return self.encoders['category'].transform([category])[0]
        except:
            return 0

    def _encode_condition(self, condition: str) -> int:
        """Encode condition using trained encoder"""
        try:
            return self.encoders['condition'].transform([condition])[0]
        except:
            return 0

    def _encode_brand(self, brand: str) -> float:
        """Encode brand using frequency mapping"""
        if not brand:
            return 0
        return self.encoders['brand_freq'].get(brand, 0)

    def _encode_credit_rating(self, rating: str) -> int:
        """Encode credit rating"""
        if not rating:
            return 0
        return self.encoders['credit_rating'].get(rating, 0)

    def predict(self, product: ProductFeatures) -> Tuple[float, float, List[FeatureImportance]]:
        """
        Predict Veritas score for product

        Returns:
            - predicted_score: 0-100
            - confidence: 0-1
            - feature_importance: Top 10 features
        """
        # Extract features
        X = self.extract_features(product)

        # Predict
        predicted_score = float(self.model.predict(X)[0])

        # Ensure score is within 0-100 range
        predicted_score = max(0, min(100, predicted_score))

        # Calculate confidence based on feature completeness
        confidence = self._calculate_confidence(product)

        # Get feature importance
        importance = [
            FeatureImportance(
                feature_name=name,
                importance=float(imp)
            )
            for name, imp in zip(self.feature_names, self.model.feature_importances_)
        ]
        importance = sorted(importance, key=lambda x: x.importance, reverse=True)[:10]

        return predicted_score, confidence, importance

    def _calculate_confidence(self, product: ProductFeatures) -> float:
        """
        Calculate prediction confidence based on feature completeness

        More complete features = higher confidence
        """
        completeness_factors = [
            product.brand is not None,
            product.warranty_period is not None,
            product.seller_total_sales > 0,
            product.view_count > 0,
            product.stock_price is not None,
            product.market_cap is not None
        ]

        completeness = sum(completeness_factors) / len(completeness_factors)

        # Base confidence 0.7-0.95 based on completeness
        confidence = 0.7 + (completeness * 0.25)

        return confidence

    def generate_explanation(
        self,
        score: float,
        importance: List[FeatureImportance],
        product: ProductFeatures
    ) -> str:
        """Generate human-readable explanation of score"""

        explanations = []

        # Score interpretation
        if score >= 85:
            explanations.append("Excellent product")
        elif score >= 70:
            explanations.append("Good quality product")
        elif score >= 50:
            explanations.append("Average product")
        else:
            explanations.append("Below average product")

        # Top factors
        top_factor = importance[0].feature_name

        if 'seller' in top_factor and product.seller_rating >= 4.5:
            explanations.append(f"verified seller (rating {product.seller_rating})")
        elif 'brand' in top_factor and product.brand:
            explanations.append(f"reputable brand ({product.brand})")
        elif 'price' in top_factor:
            explanations.append("competitive pricing")

        # Additional positive factors
        if product.has_warranty:
            explanations.append("includes warranty")
        if product.has_free_shipping:
            explanations.append("free shipping")
        if product.seller_is_verified:
            explanations.append("verified seller")

        return "High score due to " + ", ".join(explanations) + "."


# ============================================================================
# Anomaly Detection (Phase 3.3)
# ============================================================================

class AnomalyDetector:
    """Anomaly detection using trained Isolation Forest"""

    def __init__(self, model_path: str, scaler_path: str, features_path: str, metadata_path: str):
        """Load trained model and artifacts"""
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}")

        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        self.feature_names = joblib.load(features_path)

        # Load metadata for thresholds
        import json
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
            self.thresholds = metadata['risk_thresholds']

    def extract_anomaly_features(
        self,
        product: Dict,
        category_median_price: float = None
    ) -> pd.DataFrame:
        """
        Extract features for anomaly detection

        Args:
            product: Product dictionary with all fields
            category_median_price: Median price for product category
        """
        features = {}

        # Price-related
        price = float(product.get('price', 0))
        original_price = float(product.get('originalPrice') or product.get('original_price', price))

        features['price_to_original_price_ratio'] = (
            price / original_price if original_price > 0 else 1.0
        )

        features['discount_percentage'] = (
            (original_price - price) / original_price * 100
            if original_price > 0 else 0
        )

        if category_median_price:
            features['price_to_category_median_ratio'] = price / category_median_price
            # Approximate z-score (would need category stddev for exact)
            features['category_price_zscore'] = (
                (price - category_median_price) / (category_median_price * 0.3)
            )
        else:
            features['price_to_category_median_ratio'] = 1.0
            features['category_price_zscore'] = 0

        # Seller behavior
        features['seller_rating'] = float(product.get('seller', {}).get('rating', 3.0))
        features['seller_account_age_days'] = self._calculate_account_age(
            product.get('seller', {}).get('createdAt')
        )
        features['seller_total_sales'] = int(product.get('seller', {}).get('totalSales', 0))
        features['listing_count'] = int(product.get('seller', {}).get('listingCount', 0))
        features['seller_response_time_hours'] = float(
            product.get('seller', {}).get('responseTimeHours', 24)
        )
        features['seller_on_time_delivery_rate'] = float(
            product.get('seller', {}).get('onTimeDeliveryRate', 0.9)
        )
        features['seller_satisfaction_rate'] = float(
            product.get('seller', {}).get('customerSatisfactionRate', 0.9)
        )

        # Product characteristics
        features['specification_completeness'] = self._calculate_spec_completeness(product)
        features['has_image'] = int(bool(product.get('imageUrl')))
        features['description_length'] = len(str(product.get('description', '')))
        features['dynamic_specs_count'] = len(product.get('dynamicSpecs', {}))

        # Engagement
        features['view_count'] = int(product.get('viewCount', 0))
        purchase_count = int(product.get('purchaseCount', 0))
        view_count = features['view_count']

        features['view_to_purchase_ratio'] = (
            purchase_count / view_count if view_count > 0 else 0
        )

        cart_count = int(product.get('cartAddCount', 0))
        features['cart_abandonment_rate'] = (
            1 - (purchase_count / cart_count) if cart_count > 0 else 0
        )

        # Time-based
        listing_time = pd.to_datetime(product.get('createdAt', pd.Timestamp.now()))
        features['listing_hour'] = listing_time.hour
        features['listing_unusual_time'] = int(2 <= listing_time.hour <= 6)

        # Boolean features
        features['has_free_shipping'] = int(product.get('hasFreeShipping', False))
        features['has_free_returns'] = int(product.get('hasFreeReturns', False))
        features['has_warranty'] = int(product.get('hasWarranty', False))
        features['estimated_delivery_days'] = int(product.get('estimatedDeliveryDays', 7))

        # Create DataFrame
        df = pd.DataFrame([features])

        # Ensure all feature columns exist
        for col in self.feature_names:
            if col not in df.columns:
                df[col] = 0

        return df[self.feature_names]

    def _calculate_account_age(self, created_at) -> float:
        """Calculate seller account age in days"""
        if not created_at:
            return 365  # Default to 1 year
        try:
            created = pd.to_datetime(created_at)
            return (pd.Timestamp.now() - created).days
        except:
            return 365

    def _calculate_spec_completeness(self, product: Dict) -> float:
        """Calculate specification completeness (0-1)"""
        spec_fields = [
            'color', 'material', 'productSize', 'warrantyPeriod', 'description'
        ]
        present = sum(1 for field in spec_fields if product.get(field))
        return present / len(spec_fields)

    def detect(
        self,
        product: Dict,
        category_median_price: float = None
    ) -> Tuple[bool, float, str, List[AnomalyFlag]]:
        """
        Detect anomalies in product

        Returns:
            - is_anomaly: True if anomalous
            - anomaly_score: -1 to 1 (lower = more anomalous)
            - risk_level: LOW, MEDIUM, HIGH, CRITICAL
            - flags: List of anomaly flags
        """
        # Extract features
        X = self.extract_anomaly_features(product, category_median_price)

        # Scale features
        X_scaled = self.scaler.transform(X)

        # Predict (-1 = anomaly, 1 = normal)
        prediction = self.model.predict(X_scaled)[0]
        is_anomaly = (prediction == -1)

        # Get anomaly score (lower = more anomalous)
        anomaly_score = float(self.model.score_samples(X_scaled)[0])

        # Determine risk level
        abs_score = abs(anomaly_score)
        if abs_score >= self.thresholds['CRITICAL']:
            risk_level = "CRITICAL"
        elif abs_score >= self.thresholds['HIGH']:
            risk_level = "HIGH"
        elif abs_score >= self.thresholds['MEDIUM']:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Generate flags
        flags = self._generate_flags(product, X.iloc[0], category_median_price)

        return is_anomaly, anomaly_score, risk_level, flags

    def _generate_flags(
        self,
        product: Dict,
        features: pd.Series,
        category_median_price: float
    ) -> List[AnomalyFlag]:
        """Generate specific anomaly flags"""
        flags = []

        # Price anomalies
        if features['price_to_category_median_ratio'] < 0.4:
            flags.append(AnomalyFlag(
                type="PRICING",
                severity="HIGH",
                message=f"Price {(1-features['price_to_category_median_ratio'])*100:.0f}% below category median",
                recommendation="Verify authenticity with seller"
            ))
        elif features['price_to_category_median_ratio'] > 3.0:
            flags.append(AnomalyFlag(
                type="PRICING",
                severity="MEDIUM",
                message=f"Price {(features['price_to_category_median_ratio']-1)*100:.0f}% above category median",
                recommendation="Check if product has unique features justifying price"
            ))

        # Extreme discount
        if features['discount_percentage'] > 70:
            flags.append(AnomalyFlag(
                type="PRICING",
                severity="HIGH",
                message=f"Extreme discount: {features['discount_percentage']:.0f}% off",
                recommendation="Verify original price is accurate"
            ))

        # Seller anomalies
        if features['seller_rating'] < 3.5 and features['seller_account_age_days'] < 30:
            flags.append(AnomalyFlag(
                type="SELLER",
                severity="HIGH",
                message="New seller with low rating",
                recommendation="Exercise caution, check seller history"
            ))

        if features['listing_count'] > 100 and features['seller_account_age_days'] < 30:
            flags.append(AnomalyFlag(
                type="SELLER",
                severity="MEDIUM",
                message="New seller with many listings",
                recommendation="Verify seller legitimacy"
            ))

        # Product anomalies
        if features['specification_completeness'] < 0.3:
            flags.append(AnomalyFlag(
                type="PRODUCT",
                severity="MEDIUM",
                message="Incomplete product specifications",
                recommendation="Request more details from seller"
            ))

        # Engagement anomalies
        if features['view_count'] > 1000 and features['view_to_purchase_ratio'] == 0:
            flags.append(AnomalyFlag(
                type="PRODUCT",
                severity="MEDIUM",
                message="High views but no purchases",
                recommendation="Check customer reviews and feedback"
            ))

        return flags

    def get_similar_products_comparison(
        self,
        price: float,
        category_median_price: float
    ) -> SimilarProductsComparison:
        """Generate comparison with similar products"""
        deviation_pct = ((price - category_median_price) / category_median_price) * 100

        return SimilarProductsComparison(
            median_price=category_median_price,
            this_product_price=price,
            deviation_percentage=deviation_pct
        )

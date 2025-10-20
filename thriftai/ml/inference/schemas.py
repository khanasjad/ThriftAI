"""
Pydantic schemas for ML API requests and responses
Phase 3.2: Score Prediction Model
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field, validator
from datetime import datetime


# ============================================================================
# Score Prediction Schemas (Phase 3.2)
# ============================================================================

class ProductFeatures(BaseModel):
    """Input features for score prediction"""

    # Basic attributes
    name: str
    price: float = Field(gt=0, description="Product price (must be positive)")
    original_price: float = Field(gt=0, description="Original price before discount")
    category: str = Field(description="Product category")
    condition: str = Field(description="Product condition (NEW, LIKE_NEW, etc.)")
    brand: Optional[str] = None

    # Specifications
    color: Optional[str] = None
    material: Optional[str] = None
    product_size: Optional[str] = None
    warranty_period: Optional[str] = None  # e.g., "1 year", "6 months"

    # Seller features
    seller_rating: float = Field(ge=0, le=5, description="Seller rating (0-5)")
    seller_is_verified: bool = False
    seller_total_sales: int = Field(ge=0, description="Total sales by seller")
    seller_response_time_hours: float = Field(ge=0, description="Avg response time in hours")
    seller_on_time_delivery_rate: float = Field(ge=0, le=1, description="On-time delivery rate (0-1)")
    seller_satisfaction_rate: float = Field(ge=0, le=1, description="Customer satisfaction rate (0-1)")

    # Company metrics (optional)
    stock_price: Optional[float] = None
    market_cap: Optional[float] = None
    profit_margin: Optional[float] = None
    credit_rating: Optional[str] = None
    esg_score: Optional[float] = None

    # Product popularity
    stock_quantity: int = Field(ge=0, description="Available stock")
    view_count: int = Field(ge=0, default=0)
    cart_add_count: int = Field(ge=0, default=0)
    purchase_count: int = Field(ge=0, default=0)

    # Logistics
    has_free_shipping: bool = False
    has_free_returns: bool = False
    has_warranty: bool = False
    estimated_delivery_days: int = Field(ge=0, description="Estimated delivery time")

    @validator('original_price')
    def original_price_must_be_gte_price(cls, v, values):
        if 'price' in values and v < values['price']:
            raise ValueError('original_price must be >= price')
        return v

    @property
    def discount_percentage(self) -> float:
        """Calculate discount percentage"""
        if self.original_price == 0:
            return 0
        return ((self.original_price - self.price) / self.original_price) * 100


class ScorePredictionRequest(BaseModel):
    """Request for score prediction"""
    product: ProductFeatures


class FeatureImportance(BaseModel):
    """Feature importance for explainability"""
    feature_name: str
    importance: float


class ScorePredictionResponse(BaseModel):
    """Response from score prediction"""
    predicted_score: float = Field(ge=0, le=100, description="Predicted Veritas score (0-100)")
    confidence: float = Field(ge=0, le=1, description="Prediction confidence (0-1)")
    feature_importance: List[FeatureImportance] = Field(description="Top 10 most important features")
    explanation: str = Field(description="Human-readable explanation")
    model_version: str = Field(description="Model version used")
    inference_time_ms: float = Field(description="Inference time in milliseconds")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Anomaly Detection Schemas (Phase 3.3)
# ============================================================================

class AnomalyFlag(BaseModel):
    """Individual anomaly flag"""
    type: str = Field(description="Flag type (PRICING, SELLER, PRODUCT)")
    severity: str = Field(description="Severity level (LOW, MEDIUM, HIGH, CRITICAL)")
    message: str = Field(description="Human-readable message")
    recommendation: str = Field(description="Recommended action")


class SimilarProductsComparison(BaseModel):
    """Comparison with similar products"""
    median_price: float
    this_product_price: float
    deviation_percentage: float


class AnomalyDetectionResponse(BaseModel):
    """Response from anomaly detection"""
    is_anomaly: bool = Field(description="Whether product is anomalous")
    anomaly_score: float = Field(ge=-1, le=1, description="Anomaly score (-1 to 1)")
    risk_level: str = Field(description="Risk level (LOW, MEDIUM, HIGH, CRITICAL)")
    flags: List[AnomalyFlag] = Field(description="List of anomaly flags")
    similar_products_comparison: Optional[SimilarProductsComparison] = None
    action: str = Field(description="Recommended action (AUTO_APPROVE, MANUAL_REVIEW, AUTO_REJECT)")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# User Clustering Schemas (Phase 3.4)
# ============================================================================

class UserFeatures(BaseModel):
    """User features for clustering"""

    # From Phase 2.7 user preferences
    price_vs_quality: float = Field(ge=0, le=1)
    sustainability_score: float = Field(ge=0, le=1)
    brand_loyalty: float = Field(ge=0, le=1)
    specification_detail: float = Field(ge=0, le=1)

    # Purchase patterns
    average_order_value: float = Field(ge=0)
    purchase_frequency: float = Field(ge=0)
    preferred_categories: List[str] = Field(description="List of preferred categories")
    preferred_conditions: List[str] = Field(description="List of preferred conditions")

    # Engagement metrics
    view_to_cart_ratio: float = Field(ge=0, le=1)
    cart_to_checkout_ratio: float = Field(ge=0, le=1)
    return_rate: float = Field(ge=0, le=1)
    review_frequency: float = Field(ge=0, description="Reviews per purchase")

    # Time-based
    account_age_days: int = Field(ge=0)
    days_since_last_purchase: int = Field(ge=0)
    shopping_session_duration_avg: float = Field(ge=0, description="Avg session duration in minutes")

    # Device/behavior (optional)
    mobile_vs_desktop: Optional[float] = Field(None, ge=0, le=1)
    peak_shopping_hour: Optional[int] = Field(None, ge=0, le=23)


class ClusterCharacteristics(BaseModel):
    """Characteristics of a user cluster"""
    price_vs_quality_avg: float
    sustainability_score_avg: float
    brand_loyalty_avg: float
    average_order_value_avg: float


class UserPosition(BaseModel):
    """User's position within cluster"""
    price_vs_quality: float
    deviation_from_cluster: float


class CollaborativeRecommendation(BaseModel):
    """Recommendation from collaborative filtering"""
    product_id: str
    name: str
    liked_by_similar_users: int
    similarity_score: float


class UserClusterResponse(BaseModel):
    """Response from user clustering"""
    user_id: str
    cluster_id: int
    cluster_name: str
    cluster_characteristics: ClusterCharacteristics
    user_position: UserPosition
    similar_users_count: int
    collaborative_recommendations: List[CollaborativeRecommendation]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# A/B Testing Schemas (Phase 3.5)
# ============================================================================

class VariantConfig(BaseModel):
    """Configuration for an A/B test variant"""
    name: str
    description: Optional[str] = None
    traffic_percentage: int = Field(ge=0, le=100)
    config: Dict = Field(description="Variant-specific configuration")
    is_control: bool = False


class CreateExperimentRequest(BaseModel):
    """Request to create an A/B test experiment"""
    name: str
    description: Optional[str] = None
    variants: List[VariantConfig] = Field(min_items=2, description="At least 2 variants required")
    duration_days: int = Field(gt=0, description="Experiment duration in days")
    primary_metric: str = Field(description="Primary metric to optimize")

    @validator('variants')
    def validate_traffic_sum(cls, v):
        total_traffic = sum(variant.traffic_percentage for variant in v)
        if total_traffic != 100:
            raise ValueError(f'Traffic percentages must sum to 100, got {total_traffic}')
        return v


class VariantResults(BaseModel):
    """Results for a single variant"""
    users: int
    conversions: int
    conversion_rate: float
    avg_order_value: float


class ExperimentAnalysis(BaseModel):
    """Statistical analysis of experiment"""
    conversion_rate_lift: float
    p_value: float
    confidence: float
    recommendation: str


class ExperimentResultsResponse(BaseModel):
    """Response with experiment results"""
    experiment_id: str
    status: str
    days_running: int
    total_users: int
    results: Dict[str, VariantResults]
    analysis: ExperimentAnalysis
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Health Check Schemas
# ============================================================================

class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str = "healthy"
    version: str
    models_loaded: Dict[str, bool]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Error Schemas
# ============================================================================

class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    detail: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

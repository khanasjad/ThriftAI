"""
Request and response models for the AI scoring service API
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from .product_models import Product, ProductAnalysis, UserPreferences, ScoreBreakdown


class ProductAnalysisRequest(BaseModel):
    """Request model for product analysis"""
    query: str = Field(..., description="Search query to analyze products against")
    products: List[Product] = Field(..., description="List of products to analyze")
    user_id: str = Field(default="anonymous", description="User ID for personalization")
    user_preferences: Optional[UserPreferences] = Field(None, description="User preference profile")
    analysis_options: Dict[str, Any] = Field(
        default_factory=lambda: {
            "include_market_trends": True,
            "include_personalization": True,
            "include_explanations": True,
            "max_products": 50
        },
        description="Analysis configuration options"
    )


class ScoreResponse(BaseModel):
    """Response model for single product scoring"""
    product_id: str
    ai_score: float = Field(..., description="Overall AI score (0-100)")
    score_breakdown: ScoreBreakdown
    reasoning: str = Field(..., description="AI-generated explanation")
    confidence_score: float = Field(..., description="Confidence in the analysis (0-1)")
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")


class AIInsightsResponse(BaseModel):
    """Enhanced AI insights response matching Java backend format"""
    user_intent: str = Field(..., description="Analyzed user intent from query")
    search_summary: str = Field(..., description="Summary of search analysis")
    average_ai_score: float = Field(..., description="Average AI score across all products")
    total_savings: float = Field(default=0.0, description="Total potential savings")
    top_recommendation: str = Field(..., description="Top recommended product")

    # Enhanced insights
    market_analysis: Dict[str, Any] = Field(
        default_factory=dict,
        description="Market trends and analysis"
    )
    personalization_insights: Dict[str, Any] = Field(
        default_factory=dict,
        description="User-specific insights"
    )
    category_insights: Dict[str, Any] = Field(
        default_factory=dict,
        description="Category-specific analysis"
    )
    pricing_insights: Dict[str, Any] = Field(
        default_factory=dict,
        description="Pricing and value analysis"
    )


class GraphData(BaseModel):
    """Graph data for visualization"""
    price_distribution: List[Dict[str, Any]] = Field(default_factory=list)
    category_breakdown: List[Dict[str, Any]] = Field(default_factory=list)
    ai_score_distribution: List[Dict[str, Any]] = Field(default_factory=list)
    savings_analysis: List[Dict[str, Any]] = Field(default_factory=list)
    trend_analysis: List[Dict[str, Any]] = Field(default_factory=list)


class ProductAnalysisResponse(BaseModel):
    """Complete response for product analysis"""
    query: str
    total_products_analyzed: int
    processing_time_ms: int

    # Core analysis results
    products: List[ProductAnalysis] = Field(..., description="Analyzed products with scores")
    ai_insights: AIInsightsResponse = Field(..., description="AI-generated insights")
    graphs: GraphData = Field(..., description="Data for visualization")

    # System metadata
    model_version: str = Field(default="1.0.0", description="AI model version")
    analysis_timestamp: str = Field(..., description="Analysis timestamp")
    confidence_level: float = Field(..., description="Overall confidence in analysis")


class FeedbackRequest(BaseModel):
    """User feedback request"""
    user_id: str
    query: str
    product_id: str
    action: str = Field(..., description="Action type: click, purchase, like, dislike")
    score: Optional[float] = Field(None, description="Optional user rating")
    context: Dict[str, Any] = Field(default_factory=dict, description="Additional context")


class UserPreferenceUpdateRequest(BaseModel):
    """Request to update user preferences"""
    user_id: str
    preferences: UserPreferences
    source: str = Field(default="manual", description="Source of preference update")


class BatchScoreRequest(BaseModel):
    """Request for batch scoring of multiple query-product pairs"""
    requests: List[Dict[str, Any]] = Field(..., description="List of scoring requests")
    parallel_processing: bool = Field(default=True, description="Enable parallel processing")
    max_concurrency: int = Field(default=10, description="Maximum concurrent requests")


class PerformanceMetrics(BaseModel):
    """Performance analytics response"""
    total_requests: int
    average_response_time_ms: float
    success_rate: float
    cache_hit_rate: float
    ai_model_usage: Dict[str, Any]
    error_rates: Dict[str, float]
    user_satisfaction_metrics: Dict[str, Any]
    cost_analytics: Dict[str, Any]
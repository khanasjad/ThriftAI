"""
Product data models for the AI scoring service
"""

from typing import Optional, Dict, List, Any
from pydantic import BaseModel, Field
from datetime import datetime


class Product(BaseModel):
    """Product model matching Java backend structure"""
    id: str = Field(..., description="Unique product identifier")
    name: str = Field(..., description="Product name")
    description: Optional[str] = Field(None, description="Product description")
    price: float = Field(..., description="Current price")
    original_price: Optional[float] = Field(None, description="Original retail price")
    category: str = Field(..., description="Product category")
    brand: Optional[str] = Field(None, description="Product brand")
    condition: Optional[str] = Field(None, description="Product condition")
    image_url: Optional[str] = Field(None, description="Product image URL")
    is_available: bool = Field(default=True, description="Product availability")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ScoreBreakdown(BaseModel):
    """Detailed breakdown of AI scoring components"""
    semantic_relevance: float = Field(..., description="Semantic similarity to query")
    price_competitiveness: float = Field(..., description="Price attractiveness score")
    brand_preference: float = Field(..., description="Brand quality/preference score")
    condition_quality: float = Field(..., description="Product condition assessment")
    value_proposition: float = Field(..., description="Overall value for money")
    user_preference_match: float = Field(..., description="Match with user preferences")
    market_trend_alignment: float = Field(..., description="Alignment with market trends")

    def overall_score(self, weights: Optional[Dict[str, float]] = None) -> float:
        """Calculate weighted overall score"""
        if weights is None:
            weights = {
                "semantic_relevance": 0.25,
                "price_competitiveness": 0.20,
                "brand_preference": 0.15,
                "condition_quality": 0.15,
                "value_proposition": 0.15,
                "user_preference_match": 0.05,
                "market_trend_alignment": 0.05
            }

        return (
            self.semantic_relevance * weights.get("semantic_relevance", 0) +
            self.price_competitiveness * weights.get("price_competitiveness", 0) +
            self.brand_preference * weights.get("brand_preference", 0) +
            self.condition_quality * weights.get("condition_quality", 0) +
            self.value_proposition * weights.get("value_proposition", 0) +
            self.user_preference_match * weights.get("user_preference_match", 0) +
            self.market_trend_alignment * weights.get("market_trend_alignment", 0)
        ) * 100  # Scale to 0-100


class ProductAnalysis(BaseModel):
    """Complete analysis result for a single product"""
    product: Product
    ai_score: float = Field(..., description="Overall AI score (0-100)")
    score_breakdown: ScoreBreakdown
    reasoning: str = Field(..., description="AI-generated explanation for the score")
    personalization_factors: Dict[str, Any] = Field(
        default_factory=dict,
        description="Factors that influenced personalization"
    )
    market_insights: Dict[str, Any] = Field(
        default_factory=dict,
        description="Market-related insights"
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="AI-generated recommendations"
    )
    confidence_score: float = Field(..., description="Confidence in the analysis (0-1)")
    processing_time_ms: Optional[int] = Field(None, description="Processing time in milliseconds")


class UserPreferences(BaseModel):
    """User preference profile"""
    user_id: str
    preferred_categories: List[str] = Field(default_factory=list)
    preferred_brands: List[str] = Field(default_factory=list)
    price_range: Dict[str, float] = Field(default_factory=dict)  # {"min": 0, "max": 1000}
    style_preferences: Dict[str, float] = Field(default_factory=dict)
    quality_vs_price_preference: float = Field(default=0.5, description="0=price focused, 1=quality focused")
    recent_searches: List[str] = Field(default_factory=list)
    interaction_history: Dict[str, Any] = Field(default_factory=dict)
    last_updated: datetime = Field(default_factory=datetime.now)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class MarketTrends(BaseModel):
    """Market trend analysis"""
    trending_categories: List[str] = Field(default_factory=list)
    seasonal_factors: Dict[str, float] = Field(default_factory=dict)
    price_trends: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    popularity_scores: Dict[str, float] = Field(default_factory=dict)
    demand_indicators: Dict[str, Any] = Field(default_factory=dict)


class SemanticEmbedding(BaseModel):
    """Semantic embedding for products and queries"""
    text: str
    embedding: List[float]
    model_used: str
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
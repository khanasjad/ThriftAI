"""
Advanced AI Scoring Service
Orchestrates LangChain analysis with traditional ML techniques for intelligent product scoring
"""

import asyncio
import json
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

import numpy as np
from loguru import logger

from models.product_models import (
    Product, ProductAnalysis, ScoreBreakdown, UserPreferences
)
from models.request_models import AIInsightsResponse, GraphData, ProductAnalysisResponse
from services.langchain_service import LangChainService, ChainResult
from services.cache_service import CacheService


class AIScoreService:
    """Advanced AI scoring service using LangChain and machine learning"""

    def __init__(self, langchain_service: LangChainService, cache_service: CacheService):
        self.langchain_service = langchain_service
        self.cache_service = cache_service
        self.performance_metrics = {
            "total_requests": 0,
            "total_processing_time": 0.0,
            "cache_hits": 0,
            "langchain_calls": 0,
            "errors": 0
        }

    async def analyze_products(
        self,
        query: str,
        products: List[Product],
        user_id: str = "anonymous",
        user_preferences: Optional[UserPreferences] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive product analysis using advanced AI techniques
        """
        start_time = time.time()
        self.performance_metrics["total_requests"] += 1

        try:
            logger.info(f"🎯 Starting AI analysis for {len(products)} products")

            # Step 1: Analyze query intent using LangChain
            user_context = self._build_user_context(user_preferences, user_id)
            intent_result = await self.langchain_service.analyze_query_intent(query, user_context)
            self.performance_metrics["langchain_calls"] += 1

            # Step 2: Batch analyze products
            product_analyses = await self._batch_analyze_products(
                query, products, intent_result.metadata, user_preferences
            )

            # Step 3: Generate AI insights
            ai_insights = await self._generate_ai_insights(
                query, product_analyses, intent_result.metadata
            )

            # Step 4: Generate graphs and visualizations
            graphs = self._generate_graph_data(product_analyses)

            # Step 5: Calculate performance metrics
            processing_time = time.time() - start_time
            self.performance_metrics["total_processing_time"] += processing_time

            # Build response
            response = {
                "query": query,
                "totalResults": len(products),
                "products": [self._format_product_for_response(analysis) for analysis in product_analyses],
                "aiInsights": ai_insights,
                "graphs": graphs,
                "searchTime": datetime.now().isoformat(),
                "processingTimeMs": int(processing_time * 1000),
                "modelVersion": "1.0.0-langchain",
                "confidenceLevel": np.mean([p.confidence_score for p in product_analyses])
            }

            logger.info(f"✅ Analysis completed in {processing_time:.2f}s")
            return response

        except Exception as e:
            self.performance_metrics["errors"] += 1
            logger.error(f"❌ Error in product analysis: {e}")
            raise

    async def score_product(
        self,
        query: str,
        product: Product,
        user_id: str = "anonymous",
        user_preferences: Optional[UserPreferences] = None
    ) -> Dict[str, Any]:
        """Score a single product against a query"""
        start_time = time.time()

        try:
            # Check cache first
            cache_key = f"score:{hash(query + product.id + user_id)}"
            cached_result = await self.cache_service.get(cache_key)
            if cached_result:
                self.performance_metrics["cache_hits"] += 1
                return json.loads(cached_result)

            # Analyze query intent
            user_context = self._build_user_context(user_preferences, user_id)
            intent_result = await self.langchain_service.analyze_query_intent(query, user_context)

            # Analyze single product
            analysis = await self._analyze_single_product(
                query, product, intent_result.metadata, user_preferences
            )

            result = {
                "product_id": product.id,
                "ai_score": analysis.ai_score,
                "score_breakdown": analysis.score_breakdown.dict(),
                "reasoning": analysis.reasoning,
                "confidence_score": analysis.confidence_score,
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }

            # Cache result
            await self.cache_service.set(cache_key, json.dumps(result), ttl=3600)

            return result

        except Exception as e:
            logger.error(f"❌ Error scoring product {product.id}: {e}")
            raise

    async def _batch_analyze_products(
        self,
        query: str,
        products: List[Product],
        intent_analysis: Dict[str, Any],
        user_preferences: Optional[UserPreferences]
    ) -> List[ProductAnalysis]:
        """Analyze multiple products in parallel"""

        # Use LangChain for semantic analysis
        langchain_results = await self.langchain_service.batch_analyze_products(
            query, products, intent_analysis, max_concurrent=5
        )

        # Combine with traditional scoring
        analyses = []
        for i, (product, langchain_result) in enumerate(zip(products, langchain_results)):
            analysis = await self._analyze_single_product(
                query, product, intent_analysis, user_preferences, langchain_result
            )
            analyses.append(analysis)

        # Sort by AI score
        analyses.sort(key=lambda x: x.ai_score, reverse=True)
        return analyses

    async def _analyze_single_product(
        self,
        query: str,
        product: Product,
        intent_analysis: Dict[str, Any],
        user_preferences: Optional[UserPreferences],
        langchain_result: Optional[ChainResult] = None
    ) -> ProductAnalysis:
        """Comprehensive analysis of a single product"""

        # Get LangChain analysis if not provided
        if langchain_result is None:
            langchain_result = await self.langchain_service.analyze_product_semantic_match(
                query, product, intent_analysis
            )

        # Calculate semantic similarity
        semantic_score = await self.langchain_service.calculate_semantic_similarity(
            query, f"{product.name} {product.description or ''}"
        )

        # Build score breakdown
        score_breakdown = await self._calculate_score_breakdown(
            product, query, semantic_score, intent_analysis, user_preferences, langchain_result
        )

        # Calculate overall AI score
        ai_score = score_breakdown.overall_score()

        # Generate reasoning
        reasoning_result = await self.langchain_service.generate_product_reasoning(
            query, product, score_breakdown.dict(), user_preferences
        )

        # Build analysis
        analysis = ProductAnalysis(
            product=product,
            ai_score=ai_score,
            score_breakdown=score_breakdown,
            reasoning=reasoning_result.result,
            confidence_score=min(langchain_result.confidence, reasoning_result.confidence),
            processing_time_ms=int((langchain_result.processing_time + reasoning_result.processing_time) * 1000),
            personalization_factors=self._extract_personalization_factors(user_preferences),
            market_insights=self._extract_market_insights(product, intent_analysis)
        )

        return analysis

    async def _calculate_score_breakdown(
        self,
        product: Product,
        query: str,
        semantic_score: float,
        intent_analysis: Dict[str, Any],
        user_preferences: Optional[UserPreferences],
        langchain_result: ChainResult
    ) -> ScoreBreakdown:
        """Calculate detailed score breakdown"""

        # Extract LangChain scores if available
        langchain_scores = langchain_result.metadata if langchain_result else {}

        # Semantic relevance (primary LangChain result)
        semantic_relevance = langchain_scores.get('semantic_relevance', semantic_score)

        # Price competitiveness
        price_competitiveness = self._calculate_price_competitiveness(product)

        # Brand preference
        brand_preference = self._calculate_brand_preference(
            product, user_preferences, intent_analysis
        )

        # Condition quality
        condition_quality = self._calculate_condition_quality(product)

        # Value proposition (from LangChain if available)
        value_proposition = langchain_scores.get('value_proposition',
                                                self._calculate_value_proposition(product))

        # User preference match
        user_preference_match = self._calculate_user_preference_match(
            product, user_preferences
        )

        # Market trend alignment
        market_trend_alignment = self._calculate_market_trend_alignment(
            product, intent_analysis
        )

        return ScoreBreakdown(
            semantic_relevance=float(semantic_relevance),
            price_competitiveness=float(price_competitiveness),
            brand_preference=float(brand_preference),
            condition_quality=float(condition_quality),
            value_proposition=float(value_proposition),
            user_preference_match=float(user_preference_match),
            market_trend_alignment=float(market_trend_alignment)
        )

    def _calculate_price_competitiveness(self, product: Product) -> float:
        """Calculate price competitiveness score"""
        if product.original_price and product.original_price > product.price:
            discount_percentage = (product.original_price - product.price) / product.original_price
            return min(discount_percentage * 2, 1.0)  # Higher score for bigger discounts
        return 0.7  # Default score for products without original price

    def _calculate_brand_preference(
        self,
        product: Product,
        user_preferences: Optional[UserPreferences],
        intent_analysis: Dict[str, Any]
    ) -> float:
        """Calculate brand preference score"""
        if not product.brand:
            return 0.5

        # Check user preferences
        if user_preferences and product.brand.lower() in [b.lower() for b in user_preferences.preferred_brands]:
            return 0.9

        # Premium brands
        premium_brands = {
            'apple', 'nike', 'adidas', 'gucci', 'prada', 'louis vuitton',
            'coach', 'versace', 'armani', 'rolex', 'cartier'
        }

        if product.brand.lower() in premium_brands:
            return 0.8

        return 0.6  # Default for other brands

    def _calculate_condition_quality(self, product: Product) -> float:
        """Calculate condition quality score"""
        if not product.condition:
            return 0.7

        condition_scores = {
            'new': 1.0,
            'excellent': 0.9,
            'very good': 0.8,
            'good': 0.7,
            'fair': 0.6,
            'poor': 0.4
        }

        return condition_scores.get(product.condition.lower(), 0.7)

    def _calculate_value_proposition(self, product: Product) -> float:
        """Calculate value proposition score"""
        if product.original_price and product.original_price > 0:
            value_ratio = product.price / product.original_price
            return max(0.0, min(1.0, 1.0 - value_ratio + 0.3))  # Better value = higher score
        return 0.7

    def _calculate_user_preference_match(
        self,
        product: Product,
        user_preferences: Optional[UserPreferences]
    ) -> float:
        """Calculate user preference match score"""
        if not user_preferences:
            return 0.5

        score = 0.5

        # Category preferences
        if product.category.lower() in [c.lower() for c in user_preferences.preferred_categories]:
            score += 0.3

        # Price range preferences
        if user_preferences.price_range:
            min_price = user_preferences.price_range.get('min', 0)
            max_price = user_preferences.price_range.get('max', float('inf'))
            if min_price <= product.price <= max_price:
                score += 0.2

        return min(score, 1.0)

    def _calculate_market_trend_alignment(
        self,
        product: Product,
        intent_analysis: Dict[str, Any]
    ) -> float:
        """Calculate market trend alignment score"""
        # This could be enhanced with real market data
        trending_categories = ['electronics', 'fashion', 'home decor', 'fitness']

        if product.category.lower() in trending_categories:
            return 0.8

        return 0.6

    async def _generate_ai_insights(
        self,
        query: str,
        product_analyses: List[ProductAnalysis],
        intent_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate comprehensive AI insights"""

        if not product_analyses:
            return self._generate_fallback_insights(query)

        # Calculate statistics
        ai_scores = [analysis.ai_score for analysis in product_analyses]
        average_score = np.mean(ai_scores)
        total_savings = sum(
            (p.product.original_price or 0) - p.product.price
            for p in product_analyses
            if p.product.original_price
        )

        # Find top recommendation
        top_product = product_analyses[0] if product_analyses else None
        top_recommendation = f"{top_product.product.name} by {top_product.product.brand or 'Unknown'} (AI Score: {top_product.ai_score:.1f})" if top_product else "No suitable products found"

        # Generate search summary
        search_summary = f"🎯 Intelligent analysis of {len(product_analyses)} products for '{query}'. Results ranked by AI recommendation engine with detailed scoring."

        return {
            "userIntent": intent_analysis.get("primary_intent", f"User is searching for products related to: {query}"),
            "searchSummary": search_summary,
            "averageAiScore": round(average_score, 1),
            "totalSavings": round(total_savings, 2),
            "topRecommendation": top_recommendation,
            "marketAnalysis": self._generate_market_analysis(product_analyses),
            "personalizationInsights": self._generate_personalization_insights(product_analyses),
            "categoryInsights": self._generate_category_insights(product_analyses),
            "pricingInsights": self._generate_pricing_insights(product_analyses)
        }

    def _generate_graph_data(self, product_analyses: List[ProductAnalysis]) -> Dict[str, Any]:
        """Generate data for charts and graphs"""
        if not product_analyses:
            return {"priceDistribution": [], "categoryBreakdown": [], "aiScoreDistribution": [], "savingsAnalysis": []}

        # Price distribution
        prices = [p.product.price for p in product_analyses]
        price_ranges = [
            {"range": "$0-$50", "count": len([p for p in prices if p <= 50])},
            {"range": "$51-$100", "count": len([p for p in prices if 50 < p <= 100])},
            {"range": "$101-$200", "count": len([p for p in prices if 100 < p <= 200])},
            {"range": "$200+", "count": len([p for p in prices if p > 200])}
        ]

        # Category breakdown
        categories = {}
        for analysis in product_analyses:
            cat = analysis.product.category
            categories[cat] = categories.get(cat, 0) + 1

        category_breakdown = [
            {"category": cat, "count": count}
            for cat, count in categories.items()
        ]

        # AI Score distribution
        score_ranges = [
            {"scoreRange": "90-100", "count": len([p for p in product_analyses if p.ai_score >= 90])},
            {"scoreRange": "80-89", "count": len([p for p in product_analyses if 80 <= p.ai_score < 90])},
            {"scoreRange": "70-79", "count": len([p for p in product_analyses if 70 <= p.ai_score < 80])},
            {"scoreRange": "60-69", "count": len([p for p in product_analyses if 60 <= p.ai_score < 70])},
            {"scoreRange": "Below 60", "count": len([p for p in product_analyses if p.ai_score < 60])}
        ]

        # Savings analysis
        savings_data = []
        for analysis in product_analyses:
            if analysis.product.original_price and analysis.product.original_price > analysis.product.price:
                savings = analysis.product.original_price - analysis.product.price
                savings_data.append(savings)

        savings_ranges = [
            {"savingsRange": "$0-$25", "count": len([s for s in savings_data if s <= 25])},
            {"savingsRange": "$26-$50", "count": len([s for s in savings_data if 25 < s <= 50])},
            {"savingsRange": "$51-$100", "count": len([s for s in savings_data if 50 < s <= 100])},
            {"savingsRange": "$100+", "count": len([s for s in savings_data if s > 100])}
        ]

        return {
            "priceDistribution": price_ranges,
            "categoryBreakdown": category_breakdown,
            "aiScoreDistribution": score_ranges,
            "savingsAnalysis": savings_ranges
        }

    def _build_user_context(self, user_preferences: Optional[UserPreferences], user_id: str) -> Dict[str, Any]:
        """Build user context for LangChain analysis"""
        if not user_preferences:
            return {"user_id": user_id, "preferences": "No specific preferences"}

        return {
            "user_id": user_id,
            "preferred_categories": user_preferences.preferred_categories,
            "preferred_brands": user_preferences.preferred_brands,
            "price_range": user_preferences.price_range,
            "quality_vs_price_preference": user_preferences.quality_vs_price_preference,
            "recent_searches": user_preferences.recent_searches[-10:]  # Last 10 searches
        }

    def _format_product_for_response(self, analysis: ProductAnalysis) -> Dict[str, Any]:
        """Format product analysis for API response"""
        return {
            "id": analysis.product.id,
            "name": analysis.product.name,
            "description": analysis.product.description,
            "price": analysis.product.price,
            "originalPrice": analysis.product.original_price,
            "category": analysis.product.category,
            "brand": analysis.product.brand,
            "condition": analysis.product.condition,
            "imageUrl": analysis.product.image_url,
            "aiScore": round(analysis.ai_score, 1),
            "scoreBreakdown": {
                "priceMatching": round(analysis.score_breakdown.price_competitiveness * 100, 1),
                "categoryRelevance": round(analysis.score_breakdown.semantic_relevance * 100, 1),
                "brandPreference": round(analysis.score_breakdown.brand_preference * 100, 1),
                "conditionMatching": round(analysis.score_breakdown.condition_quality * 100, 1),
                "valueProposition": round(analysis.score_breakdown.value_proposition * 100, 1),
                "keywordRelevance": round(analysis.score_breakdown.user_preference_match * 100, 1)
            },
            "reasoning": analysis.reasoning,
            "savings": (analysis.product.original_price - analysis.product.price) if analysis.product.original_price else 0,
            "savingsPercentage": ((analysis.product.original_price - analysis.product.price) / analysis.product.original_price * 100) if analysis.product.original_price else 0
        }

    def _generate_fallback_insights(self, query: str) -> Dict[str, Any]:
        """Generate fallback insights when no products are available"""
        return {
            "userIntent": f"User is searching for products related to: {query}",
            "searchSummary": f"No products found for query: '{query}'",
            "averageAiScore": 0.0,
            "totalSavings": 0.0,
            "topRecommendation": "No products available for analysis"
        }

    def _generate_market_analysis(self, analyses: List[ProductAnalysis]) -> Dict[str, Any]:
        """Generate market analysis insights"""
        return {"trend": "stable", "demand": "moderate"}

    def _generate_personalization_insights(self, analyses: List[ProductAnalysis]) -> Dict[str, Any]:
        """Generate personalization insights"""
        return {"personalized": True, "factors": ["price_preference", "category_preference"]}

    def _generate_category_insights(self, analyses: List[ProductAnalysis]) -> Dict[str, Any]:
        """Generate category-specific insights"""
        categories = set(a.product.category for a in analyses)
        return {"categories_analyzed": list(categories), "primary_category": list(categories)[0] if categories else "unknown"}

    def _generate_pricing_insights(self, analyses: List[ProductAnalysis]) -> Dict[str, Any]:
        """Generate pricing insights"""
        prices = [a.product.price for a in analyses]
        return {
            "average_price": np.mean(prices) if prices else 0,
            "price_range": {"min": min(prices), "max": max(prices)} if prices else {"min": 0, "max": 0}
        }

    def _extract_personalization_factors(self, user_preferences: Optional[UserPreferences]) -> Dict[str, Any]:
        """Extract personalization factors"""
        if not user_preferences:
            return {}
        return {
            "has_brand_preferences": bool(user_preferences.preferred_brands),
            "has_category_preferences": bool(user_preferences.preferred_categories),
            "has_price_range": bool(user_preferences.price_range)
        }

    def _extract_market_insights(self, product: Product, intent_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Extract market insights for a product"""
        return {
            "category_trend": "stable",
            "brand_popularity": "moderate",
            "price_trend": "stable"
        }

    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get service performance metrics"""
        return {
            "service_metrics": self.performance_metrics,
            "langchain_metrics": await self.langchain_service.get_performance_metrics(),
            "cache_metrics": await self.cache_service.get_metrics() if hasattr(self.cache_service, 'get_metrics') else {}
        }
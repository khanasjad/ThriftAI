"""
User Preference Learning Service
Implements intelligent user preference tracking and continuous learning
"""

import json
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from collections import defaultdict, Counter

import numpy as np
from loguru import logger

from models.product_models import Product, UserPreferences
from services.cache_service import CacheService


class UserPreferenceService:
    """Advanced user preference learning and personalization service"""

    def __init__(self, cache_service: CacheService):
        self.cache_service = cache_service
        self.preference_weights = {
            "category": 0.3,
            "brand": 0.2,
            "price_range": 0.25,
            "style": 0.15,
            "quality": 0.1
        }

    async def get_preferences(self, user_id: str) -> UserPreferences:
        """Get user preferences with intelligent defaults"""
        try:
            cached_prefs = await self.cache_service.get_json(f"user_prefs:{user_id}")

            if cached_prefs:
                # Update with computed preferences
                enhanced_prefs = await self._enhance_preferences(user_id, cached_prefs)
                return UserPreferences(**enhanced_prefs)
            else:
                # Create new profile with learned preferences
                learned_prefs = await self._learn_preferences_from_history(user_id)
                return learned_prefs

        except Exception as e:
            logger.error(f"Error getting preferences for user {user_id}: {e}")
            return self._get_default_preferences(user_id)

    async def update_preferences(
        self,
        user_id: str,
        query: str,
        products: List[Product],
        interaction_data: Optional[UserPreferences] = None
    ):
        """Update user preferences based on search and interaction data"""
        try:
            current_prefs = await self.get_preferences(user_id)

            # Analyze search patterns
            await self._analyze_search_pattern(user_id, query, products)

            # Update category preferences
            await self._update_category_preferences(user_id, query, products)

            # Update brand preferences
            await self._update_brand_preferences(user_id, products)

            # Update price range preferences
            await self._update_price_preferences(user_id, products)

            # Store updated search
            await self._store_search_history(user_id, query, products)

            logger.debug(f"Updated preferences for user {user_id}")

        except Exception as e:
            logger.error(f"Error updating preferences for user {user_id}: {e}")

    async def record_feedback(
        self,
        user_id: str,
        query: str,
        product_id: str,
        action: str,
        score: Optional[float] = None
    ):
        """Record user feedback for continuous learning"""
        try:
            feedback_key = f"feedback:{user_id}"

            feedback_data = {
                "timestamp": datetime.now().isoformat(),
                "query": query,
                "product_id": product_id,
                "action": action,
                "score": score
            }

            # Get existing feedback
            existing_feedback = await self.cache_service.get_json(feedback_key) or []
            existing_feedback.append(feedback_data)

            # Keep only last 100 feedback items
            if len(existing_feedback) > 100:
                existing_feedback = existing_feedback[-100:]

            # Store updated feedback
            await self.cache_service.set_json(feedback_key, existing_feedback, ttl=86400 * 30)  # 30 days

            # Update preferences based on feedback
            await self._learn_from_feedback(user_id, feedback_data)

            logger.info(f"Recorded feedback: {user_id} -> {action} on {product_id}")

        except Exception as e:
            logger.error(f"Error recording feedback for user {user_id}: {e}")

    async def _enhance_preferences(self, user_id: str, base_prefs: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance existing preferences with learned insights"""

        # Get interaction history
        search_history = await self.cache_service.get_json(f"search_history:{user_id}") or []
        feedback_history = await self.cache_service.get_json(f"feedback:{user_id}") or []

        enhanced = base_prefs.copy()

        # Enhance category preferences
        if search_history:
            category_patterns = await self._analyze_category_patterns(search_history)
            enhanced["preferred_categories"] = list(set(
                enhanced.get("preferred_categories", []) + list(category_patterns.keys())
            ))

        # Enhance brand preferences from positive feedback
        if feedback_history:
            brand_patterns = await self._analyze_brand_patterns(feedback_history)
            enhanced["preferred_brands"] = list(set(
                enhanced.get("preferred_brands", []) + list(brand_patterns.keys())
            ))

        # Update quality vs price preference based on feedback
        quality_preference = await self._analyze_quality_preference(feedback_history)
        if quality_preference is not None:
            enhanced["quality_vs_price_preference"] = quality_preference

        enhanced["last_updated"] = datetime.now().isoformat()

        # Cache enhanced preferences
        await self.cache_service.set_json(f"user_prefs:{user_id}", enhanced, ttl=86400 * 7)  # 7 days

        return enhanced

    async def _learn_preferences_from_history(self, user_id: str) -> UserPreferences:
        """Learn user preferences from their interaction history"""

        search_history = await self.cache_service.get_json(f"search_history:{user_id}") or []
        feedback_history = await self.cache_service.get_json(f"feedback:{user_id}") or []

        if not search_history and not feedback_history:
            return self._get_default_preferences(user_id)

        # Analyze patterns
        categories = await self._analyze_category_patterns(search_history)
        brands = await self._analyze_brand_patterns(feedback_history)
        price_range = await self._analyze_price_patterns(search_history)
        quality_preference = await self._analyze_quality_preference(feedback_history)

        learned_prefs = UserPreferences(
            user_id=user_id,
            preferred_categories=list(categories.keys())[:5],  # Top 5 categories
            preferred_brands=list(brands.keys())[:5],  # Top 5 brands
            price_range=price_range,
            quality_vs_price_preference=quality_preference or 0.5,
            recent_searches=[item["query"] for item in search_history[-10:]],  # Last 10 searches
            last_updated=datetime.now()
        )

        # Cache learned preferences
        await self.cache_service.set_json(f"user_prefs:{user_id}", learned_prefs.dict(), ttl=86400 * 7)

        return learned_prefs

    async def _analyze_search_pattern(self, user_id: str, query: str, products: List[Product]):
        """Analyze and learn from search patterns"""

        # Extract query characteristics
        query_lower = query.lower()

        # Store search analytics
        analytics_key = f"search_analytics:{user_id}"
        analytics = await self.cache_service.get_json(analytics_key) or {
            "total_searches": 0,
            "query_patterns": {},
            "search_times": [],
            "product_interactions": {}
        }

        analytics["total_searches"] += 1
        analytics["search_times"].append(datetime.now().isoformat())

        # Analyze query patterns
        for word in query_lower.split():
            if len(word) > 2:  # Ignore short words
                analytics["query_patterns"][word] = analytics["query_patterns"].get(word, 0) + 1

        # Keep only recent search times (last 100)
        analytics["search_times"] = analytics["search_times"][-100:]

        await self.cache_service.set_json(analytics_key, analytics, ttl=86400 * 30)

    async def _update_category_preferences(self, user_id: str, query: str, products: List[Product]):
        """Update category preferences based on search"""

        category_key = f"category_prefs:{user_id}"
        category_data = await self.cache_service.get_json(category_key) or {}

        # Increment search count for categories in results
        categories = [p.category for p in products if p.category]
        for category in categories:
            category_data[category] = category_data.get(category, 0) + 1

        await self.cache_service.set_json(category_key, category_data, ttl=86400 * 30)

    async def _update_brand_preferences(self, user_id: str, products: List[Product]):
        """Update brand preferences based on search results"""

        brand_key = f"brand_prefs:{user_id}"
        brand_data = await self.cache_service.get_json(brand_key) or {}

        # Increment exposure count for brands in results
        brands = [p.brand for p in products if p.brand]
        for brand in brands:
            brand_data[brand] = brand_data.get(brand, 0) + 1

        await self.cache_service.set_json(brand_key, brand_data, ttl=86400 * 30)

    async def _update_price_preferences(self, user_id: str, products: List[Product]):
        """Update price range preferences based on search results"""

        price_key = f"price_prefs:{user_id}"
        price_data = await self.cache_service.get_json(price_key) or {"prices": []}

        # Record prices user is exposed to
        prices = [p.price for p in products if p.price > 0]
        price_data["prices"].extend(prices)

        # Keep only recent prices (last 200)
        price_data["prices"] = price_data["prices"][-200:]

        await self.cache_service.set_json(price_key, price_data, ttl=86400 * 30)

    async def _store_search_history(self, user_id: str, query: str, products: List[Product]):
        """Store search history for learning"""

        history_key = f"search_history:{user_id}"
        history = await self.cache_service.get_json(history_key) or []

        search_record = {
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "product_count": len(products),
            "categories": list(set(p.category for p in products if p.category)),
            "brands": list(set(p.brand for p in products if p.brand)),
            "price_range": {
                "min": min(p.price for p in products) if products else 0,
                "max": max(p.price for p in products) if products else 0
            }
        }

        history.append(search_record)

        # Keep only last 50 searches
        history = history[-50:]

        await self.cache_service.set_json(history_key, history, ttl=86400 * 30)

    async def _learn_from_feedback(self, user_id: str, feedback_data: Dict[str, Any]):
        """Learn and adjust preferences from user feedback"""

        action = feedback_data["action"]

        # Positive actions (clicks, purchases, likes) strengthen preferences
        if action in ["click", "purchase", "like"]:
            await self._strengthen_preferences(user_id, feedback_data)

        # Negative actions (dislikes) weaken preferences
        elif action in ["dislike", "skip"]:
            await self._weaken_preferences(user_id, feedback_data)

    async def _strengthen_preferences(self, user_id: str, feedback_data: Dict[str, Any]):
        """Strengthen preferences based on positive feedback"""
        # This would involve finding the product and updating preferences
        # Implementation would depend on how we store product data
        pass

    async def _weaken_preferences(self, user_id: str, feedback_data: Dict[str, Any]):
        """Weaken preferences based on negative feedback"""
        # Similar to strengthen_preferences but with negative adjustment
        pass

    async def _analyze_category_patterns(self, search_history: List[Dict[str, Any]]) -> Dict[str, int]:
        """Analyze category patterns from search history"""
        category_counts = Counter()

        for search in search_history[-20:]:  # Last 20 searches
            categories = search.get("categories", [])
            for category in categories:
                category_counts[category] += 1

        return dict(category_counts.most_common(10))

    async def _analyze_brand_patterns(self, feedback_history: List[Dict[str, Any]]) -> Dict[str, int]:
        """Analyze brand patterns from feedback history"""
        brand_counts = Counter()

        for feedback in feedback_history:
            if feedback.get("action") in ["click", "purchase", "like"]:
                # Would need to look up product to get brand
                # For now, return empty
                pass

        return dict(brand_counts.most_common(10))

    async def _analyze_price_patterns(self, search_history: List[Dict[str, Any]]) -> Dict[str, float]:
        """Analyze price patterns from search history"""
        prices = []

        for search in search_history[-20:]:
            price_range = search.get("price_range", {})
            if price_range.get("min", 0) > 0:
                prices.extend([price_range["min"], price_range["max"]])

        if prices:
            return {
                "min": max(0, np.percentile(prices, 25)),  # 25th percentile as min preference
                "max": np.percentile(prices, 75)  # 75th percentile as max preference
            }

        return {"min": 0, "max": 1000}  # Default range

    async def _analyze_quality_preference(self, feedback_history: List[Dict[str, Any]]) -> Optional[float]:
        """Analyze quality vs price preference from feedback"""
        if not feedback_history:
            return None

        # This would require more sophisticated analysis of user behavior
        # For now, return neutral preference
        return 0.5

    def _get_default_preferences(self, user_id: str) -> UserPreferences:
        """Get default preferences for new users"""
        return UserPreferences(
            user_id=user_id,
            preferred_categories=[],
            preferred_brands=[],
            price_range={"min": 0, "max": 1000},
            quality_vs_price_preference=0.5,
            recent_searches=[],
            last_updated=datetime.now()
        )

    async def get_user_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user analytics"""
        try:
            search_history = await self.cache_service.get_json(f"search_history:{user_id}") or []
            feedback_history = await self.cache_service.get_json(f"feedback:{user_id}") or []
            analytics = await self.cache_service.get_json(f"search_analytics:{user_id}") or {}

            return {
                "total_searches": len(search_history),
                "total_feedback": len(feedback_history),
                "search_frequency": self._calculate_search_frequency(search_history),
                "engagement_level": self._calculate_engagement_level(feedback_history),
                "preference_strength": self._calculate_preference_strength(search_history),
                "top_categories": await self._analyze_category_patterns(search_history),
                "search_patterns": analytics.get("query_patterns", {})
            }

        except Exception as e:
            logger.error(f"Error getting user analytics for {user_id}: {e}")
            return {}

    def _calculate_search_frequency(self, search_history: List[Dict[str, Any]]) -> str:
        """Calculate user search frequency"""
        if len(search_history) < 2:
            return "new_user"

        recent_searches = [
            datetime.fromisoformat(s["timestamp"])
            for s in search_history[-10:]
            if "timestamp" in s
        ]

        if len(recent_searches) < 2:
            return "low"

        avg_interval = (recent_searches[-1] - recent_searches[0]).total_seconds() / len(recent_searches)

        if avg_interval < 3600:  # Less than 1 hour
            return "high"
        elif avg_interval < 86400:  # Less than 1 day
            return "medium"
        else:
            return "low"

    def _calculate_engagement_level(self, feedback_history: List[Dict[str, Any]]) -> str:
        """Calculate user engagement level"""
        if not feedback_history:
            return "none"

        positive_actions = len([f for f in feedback_history if f.get("action") in ["click", "purchase", "like"]])
        total_actions = len(feedback_history)

        engagement_ratio = positive_actions / total_actions if total_actions > 0 else 0

        if engagement_ratio > 0.7:
            return "high"
        elif engagement_ratio > 0.4:
            return "medium"
        else:
            return "low"

    def _calculate_preference_strength(self, search_history: List[Dict[str, Any]]) -> str:
        """Calculate how strong/consistent user preferences are"""
        if len(search_history) < 5:
            return "developing"

        # Analyze consistency in categories
        categories = []
        for search in search_history[-10:]:
            categories.extend(search.get("categories", []))

        if not categories:
            return "unclear"

        category_counts = Counter(categories)
        top_category_ratio = category_counts.most_common(1)[0][1] / len(categories)

        if top_category_ratio > 0.6:
            return "strong"
        elif top_category_ratio > 0.3:
            return "moderate"
        else:
            return "diverse"
"""
ThriftAI Advanced AI Scoring Service
Powered by LangChain and Claude 3.5 Sonnet

This microservice provides intelligent product scoring and analysis
using state-of-the-art language models and machine learning techniques.
"""

import os
import asyncio
from typing import List, Dict, Any
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from loguru import logger
import aioredis
from dotenv import load_dotenv

from services.ai_scoring_service import AIScoreService
from services.langchain_service import LangChainService
from services.user_preference_service import UserPreferenceService
from services.cache_service import CacheService
from models.request_models import ProductAnalysisRequest, ScoreResponse
from models.product_models import Product, ProductAnalysis

# Load environment variables
load_dotenv()

# Configure logging
logger.add(
    os.getenv("LOG_FILE", "ai_service.log"),
    rotation="100 MB",
    retention="7 days",
    level=os.getenv("LOG_LEVEL", "INFO")
)

# Global services
ai_service: AIScoreService = None
langchain_service: LangChainService = None
user_preference_service: UserPreferenceService = None
cache_service: CacheService = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup application lifecycle"""
    global ai_service, langchain_service, user_preference_service, cache_service

    logger.info("🚀 Starting ThriftAI Advanced AI Scoring Service")

    try:
        # Initialize Redis cache
        cache_service = CacheService()
        await cache_service.initialize()

        # Initialize LangChain service
        langchain_service = LangChainService()
        await langchain_service.initialize()

        # Initialize AI scoring service
        ai_service = AIScoreService(langchain_service, cache_service)

        # Initialize user preference service
        user_preference_service = UserPreferenceService(cache_service)

        logger.info("✅ All services initialized successfully")

        yield

    except Exception as e:
        logger.error(f"❌ Failed to initialize services: {e}")
        raise
    finally:
        # Cleanup
        if cache_service:
            await cache_service.close()
        logger.info("🔄 Service shutdown complete")


# Initialize FastAPI app
app = FastAPI(
    title="ThriftAI Advanced AI Scoring Service",
    description="Intelligent product analysis using LangChain and Claude",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ThriftAI AI Scoring Service",
        "version": "1.0.0"
    }


@app.post("/analyze-products", response_model=Dict[str, Any])
async def analyze_products(request: ProductAnalysisRequest):
    """
    Analyze products using advanced AI scoring algorithms

    This endpoint provides:
    - Semantic product analysis
    - User intent understanding
    - Intelligent scoring with explanations
    - Personalized recommendations
    """
    try:
        logger.info(f"🎯 Analyzing {len(request.products)} products for query: '{request.query}'")

        # Generate comprehensive analysis
        analysis_result = await ai_service.analyze_products(
            query=request.query,
            products=request.products,
            user_id=request.user_id,
            user_preferences=request.user_preferences
        )

        # Update user preferences in background
        if request.user_id:
            await user_preference_service.update_preferences(
                user_id=request.user_id,
                query=request.query,
                products=request.products,
                interaction_data=request.user_preferences
            )

        logger.info(f"✅ Analysis complete. Average AI Score: {analysis_result.get('averageAiScore', 0):.1f}")

        return analysis_result

    except Exception as e:
        logger.error(f"❌ Error analyzing products: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/score-product", response_model=ScoreResponse)
async def score_single_product(
    query: str = Field(..., description="Search query"),
    product: Product = Field(..., description="Product to score"),
    user_id: str = Field(default="anonymous", description="User ID for personalization")
):
    """
    Score a single product against a query
    """
    try:
        logger.info(f"🎯 Scoring product '{product.name}' for query: '{query}'")

        score_result = await ai_service.score_product(
            query=query,
            product=product,
            user_id=user_id
        )

        return score_result

    except Exception as e:
        logger.error(f"❌ Error scoring product: {e}")
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")


@app.get("/user-preferences/{user_id}")
async def get_user_preferences(user_id: str):
    """Get user preference profile"""
    try:
        preferences = await user_preference_service.get_preferences(user_id)
        return preferences
    except Exception as e:
        logger.error(f"❌ Error getting user preferences: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get preferences: {str(e)}")


@app.post("/feedback")
async def submit_feedback(
    user_id: str,
    query: str,
    product_id: str,
    action: str,  # 'click', 'purchase', 'like', 'dislike'
    score: float = None
):
    """Submit user feedback for continuous learning"""
    try:
        await user_preference_service.record_feedback(
            user_id=user_id,
            query=query,
            product_id=product_id,
            action=action,
            score=score
        )

        logger.info(f"📊 Recorded feedback: {user_id} -> {action} on {product_id}")
        return {"status": "success", "message": "Feedback recorded"}

    except Exception as e:
        logger.error(f"❌ Error recording feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to record feedback: {str(e)}")


@app.get("/analytics/performance")
async def get_performance_analytics():
    """Get service performance analytics"""
    try:
        analytics = await ai_service.get_performance_metrics()
        return analytics
    except Exception as e:
        logger.error(f"❌ Error getting analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("SERVICE_HOST", "0.0.0.0"),
        port=int(os.getenv("SERVICE_PORT", 8080)),
        workers=int(os.getenv("WORKERS", 1)),
        reload=os.getenv("RELOAD", "false").lower() == "true",
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    )
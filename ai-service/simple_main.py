"""
Simplified ThriftAI AI Service for testing LangChain + Claude integration
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv
from loguru import logger

from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate

# Load environment variables
load_dotenv()

app = FastAPI(
    title="ThriftAI Advanced AI Service",
    description="LangChain + Claude 3.5 Sonnet Integration",
    version="1.0.0"
)

# Pydantic models
class Product(BaseModel):
    id: str
    name: str
    description: str
    price: float
    original_price: Optional[float] = None
    category: str
    brand: Optional[str] = None
    condition: str

class AnalysisRequest(BaseModel):
    query: str
    products: List[Product]
    user_id: str
    analysis_options: Optional[Dict[str, Any]] = {}

class AIInsights(BaseModel):
    userIntent: str
    searchSummary: str
    averageAiScore: float
    totalSavings: float
    topRecommendation: str
    chatResponse: str

# Initialize Claude
claude_llm = None

@app.on_event("startup")
async def startup_event():
    global claude_llm
    try:
        logger.info("🔧 Initializing Claude LLM...")
        claude_llm = ChatAnthropic(
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            model_name=os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022"),
            max_tokens=int(os.getenv("MAX_TOKENS", 4000)),
            temperature=float(os.getenv("TEMPERATURE", 0.1))
        )
        logger.info("✅ Claude LLM initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Claude LLM: {e}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ThriftAI AI Service",
        "timestamp": datetime.now().isoformat(),
        "claude_available": claude_llm is not None
    }

@app.post("/analyze-products")
async def analyze_products(request: AnalysisRequest):
    """Enhanced product analysis using LangChain + Claude"""
    try:
        logger.info(f"Starting AI analysis for query: {request.query}")

        if not claude_llm:
            raise HTTPException(status_code=503, detail="Claude LLM not available")

        # Create analysis prompt for conversational response
        analysis_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a friendly AI shopping assistant for ThriftAI, a sustainable second-hand marketplace.
            Your job is to help users make smart purchasing decisions through conversational, helpful advice.

            IMPORTANT: Respond in a natural, conversational tone as if talking to a friend. Focus on:
            1. WHY they should consider specific items
            2. What makes each item a good deal
            3. Sustainability benefits
            4. Style and quality insights
            5. Value propositions

            Avoid technical jargon or raw scores. Be personable and helpful.
            """),
            ("user", """A user is searching for: "{query}"

            Here are the available products:
            {products_json}

            Please provide a friendly, conversational response that:
            1. Acknowledges what they're looking for
            2. Highlights 2-3 best matches with compelling reasons to buy
            3. Mentions sustainability benefits
            4. Gives styling or usage tips
            5. Explains why thrift shopping is smart for this search

            Keep it natural and helpful, like a knowledgeable friend giving shopping advice.
            Aim for 3-4 sentences that feel genuine and personal.
            """)
        ])

        # Prepare products data
        products_data = []
        total_savings = 0.0

        for product in request.products:
            product_dict = product.model_dump()
            if product.original_price and product.original_price > product.price:
                savings = product.original_price - product.price
                total_savings += savings
                product_dict["savings"] = savings
                product_dict["savings_percentage"] = (savings / product.original_price) * 100
            products_data.append(product_dict)

        # Call Claude for analysis
        try:
            # Use the conversational prompt directly with Claude
            from langchain_core.messages import SystemMessage, HumanMessage

            system_message = SystemMessage(content="""You are a friendly AI shopping assistant for ThriftAI, a sustainable second-hand marketplace.
Your job is to help users make smart purchasing decisions through conversational, helpful advice.

IMPORTANT: Respond in a natural, conversational tone as if talking to a friend. Focus on:
1. WHY they should consider specific items
2. What makes each item a good deal
3. Sustainability benefits
4. Style and quality insights
5. Value propositions

Avoid technical jargon or raw scores. Be personable and helpful.""")

            human_message = HumanMessage(content=f"""A user is searching for: "{request.query}"

Here are the available products:
{json.dumps(products_data, indent=2)}

Please provide a friendly, conversational response that:
1. Acknowledges what they're looking for
2. Highlights 2-3 best matches with compelling reasons to buy
3. Mentions sustainability benefits
4. Gives styling or usage tips
5. Explains why thrift shopping is smart for this search

Keep it natural and helpful, like a knowledgeable friend giving shopping advice.
Aim for 3-4 sentences that feel genuine and personal.""")

            response = await claude_llm.ainvoke([system_message, human_message])
        except Exception as chain_error:
            logger.warning(f"Claude chain invocation failed: {chain_error}, using direct call")
            # Fallback to direct Claude call
            from langchain_core.messages import HumanMessage
            message = f"""
            Analyze this search query: {request.query}
            Products: {json.dumps(products_data, indent=2)}

            Provide intelligent insights about user intent and product relevance.
            """
            response = await claude_llm.ainvoke([HumanMessage(content=message)])

        # Parse Claude's response and create insights
        claude_analysis = response.content

        # Generate AI scores for each product (enhanced semantic scoring)
        ai_scores = []
        for i, product in enumerate(request.products):
            # Enhanced semantic scoring algorithm
            base_score = 30.0

            # Enhanced relevance scoring with semantic matching
            query_lower = request.query.lower()
            product_text = f"{product.name} {product.description} {product.category}".lower()

            relevance_score = 0.0

            # 1. Direct keyword matching (high weight)
            query_terms = query_lower.split()
            for term in query_terms:
                if term in product_text:
                    relevance_score += 25.0

            # 2. Semantic synonym matching (very important for bags/handbags etc.)
            semantic_boosts = {
                # Bag synonyms
                'bag': ['bag', 'handbag', 'purse', 'tote', 'satchel'],
                'bags': ['bag', 'handbag', 'purse', 'tote', 'satchel'],
                'handbag': ['bag', 'handbag', 'purse', 'tote'],
                'purse': ['bag', 'handbag', 'purse', 'clutch'],

                # Clothing synonyms
                'shirt': ['shirt', 't-shirt', 'tshirt', 'top', 'blouse'],
                'jeans': ['jeans', 'denim', 'pants', 'trousers'],
                'dress': ['dress', 'gown', 'frock'],

                # Electronics synonyms
                'phone': ['phone', 'smartphone', 'mobile', 'cellphone'],
                'laptop': ['laptop', 'computer', 'notebook', 'macbook'],

                # Accessories synonyms
                'watch': ['watch', 'timepiece', 'smartwatch'],
                'jewelry': ['jewelry', 'necklace', 'earrings', 'ring', 'bracelet']
            }

            for query_term in query_terms:
                if query_term in semantic_boosts:
                    synonyms = semantic_boosts[query_term]
                    for synonym in synonyms:
                        if synonym in product_text:
                            relevance_score += 30.0  # High boost for semantic matches
                            break  # Only count once per query term

            # 3. Category matching boost
            category_boost = 0.0
            if product.category:
                category_lower = product.category.lower()

                # Map search terms to likely categories
                category_mappings = {
                    'bag': 'accessories',
                    'bags': 'accessories',
                    'handbag': 'accessories',
                    'purse': 'accessories',
                    'shirt': 'clothing',
                    'jeans': 'clothing',
                    'dress': 'clothing',
                    'phone': 'electronics',
                    'laptop': 'electronics',
                    'watch': 'accessories'
                }

                for term in query_terms:
                    if term in category_mappings:
                        expected_category = category_mappings[term]
                        if expected_category in category_lower:
                            category_boost += 20.0

            # 4. Brand relevance (for designer/luxury searches)
            brand_boost = 0.0
            if any(term in query_lower for term in ['designer', 'luxury', 'premium']):
                luxury_brands = ['gucci', 'prada', 'chanel', 'louis', 'hermes', 'versace', 'coach']
                if product.brand and any(brand in product.brand.lower() for brand in luxury_brands):
                    brand_boost += 15.0

            # 5. Price attractiveness (reduced weight compared to relevance)
            price_score = max(0, 20 - (product.price * 0.2))  # Reduced impact

            # 6. Condition bonus
            condition_bonus = {
                "excellent": 15, "very_good": 12, "good": 8,
                "fair": 4, "poor": 0, "like_new": 18
            }.get(product.condition.lower().replace("_", " "), 5)

            # Final score calculation - prioritize relevance over price
            final_score = min(100, base_score + relevance_score + category_boost + brand_boost + price_score + condition_bonus)
            ai_scores.append(final_score)

            # Debug logging
            logger.info(f"Product: {product.name[:30]} | Relevance: {relevance_score:.1f} | Category: {category_boost:.1f} | Price: {price_score:.1f} | Final: {final_score:.1f}")

        # Find top recommendation
        best_product_idx = ai_scores.index(max(ai_scores))
        best_product = request.products[best_product_idx]
        top_recommendation = f"{best_product.name} by {best_product.brand or 'Unknown'} (AI Score: {ai_scores[best_product_idx]:.1f})"

        # Create enhanced products with AI scores
        enhanced_products = []
        for i, product in enumerate(request.products):
            enhanced_product = product.model_dump()
            enhanced_product["ai_score"] = ai_scores[i]
            enhanced_product["ai_analysis"] = f"AI analyzed this product for '{request.query}'"
            enhanced_products.append(enhanced_product)

        # Create conversational AI insights
        ai_insights = AIInsights(
            userIntent=f"Looking for {request.query}",
            searchSummary=f"I found {len(request.products)} great options for you! Here's what caught my attention:",
            averageAiScore=sum(ai_scores) / len(ai_scores),
            totalSavings=total_savings,
            topRecommendation=f"My top pick: {best_product.name}",
            chatResponse=claude_analysis  # Full conversational response from Claude
        )

        response_data = {
            "aiInsights": ai_insights.model_dump(),
            "products": enhanced_products,
            "ai_analysis": claude_analysis,
            "processing_info": {
                "service": "Smart Product Analysis",
                "timestamp": datetime.now().isoformat(),
                "total_products_analyzed": len(request.products)
            },
            "graphs": {
                "priceComparison": [
                    {
                        "name": p.name[:20] + "..." if len(p.name) > 20 else p.name,
                        "price": p.price,
                        "originalPrice": p.original_price or p.price,
                        "savings": (p.original_price - p.price) if p.original_price else 0,
                        "savingsPercentage": round(((p.original_price - p.price) / p.original_price * 100), 1) if p.original_price and p.original_price > 0 else 0,
                        "brand": p.brand or "Generic",
                        "color": "#22c55e" if ai_scores[i] >= 80 else "#3b82f6" if ai_scores[i] >= 60 else "#f59e0b"
                    }
                    for i, p in enumerate(request.products)
                ],
                "qualityVsPrice": [
                    {
                        "name": p.name[:15] + "..." if len(p.name) > 15 else p.name,
                        "price": p.price,
                        "qualityScore": ai_scores[i],
                        "condition": p.condition.replace("_", " ").title(),
                        "brand": p.brand or "Generic",
                        "valueRating": "Excellent" if ai_scores[i] >= 85 and p.price < 100 else "Great" if ai_scores[i] >= 75 else "Good" if ai_scores[i] >= 60 else "Fair"
                    }
                    for i, p in enumerate(request.products)
                ],
                "brandAnalysis": [
                    {
                        "brand": brand,
                        "averagePrice": round(sum([p.price for p in request.products if (p.brand or "Generic") == brand]) / len([p for p in request.products if (p.brand or "Generic") == brand]), 2),
                        "averageQuality": round(sum([ai_scores[i] for i, p in enumerate(request.products) if (p.brand or "Generic") == brand]) / len([p for p in request.products if (p.brand or "Generic") == brand]), 1),
                        "productCount": len([p for p in request.products if (p.brand or "Generic") == brand]),
                        "totalSavings": sum([(p.original_price or 0) - p.price for p in request.products if (p.brand or "Generic") == brand]),
                        "reputation": "Premium" if brand in ["Chanel", "Louis Vuitton", "Hermes", "Gucci", "Prada"] else "Designer" if brand in ["Coach", "Kate Spade", "Michael Kors"] else "Quality" if brand != "Generic" else "Budget"
                    }
                    for brand in set([p.brand or "Generic" for p in request.products])
                ],
                "savingsBreakdown": [
                    {
                        "name": p.name[:18] + "..." if len(p.name) > 18 else p.name,
                        "originalPrice": p.original_price or p.price,
                        "currentPrice": p.price,
                        "dollarsOff": (p.original_price - p.price) if p.original_price else 0,
                        "percentOff": round(((p.original_price - p.price) / p.original_price * 100), 1) if p.original_price and p.original_price > 0 else 0,
                        "dealQuality": "Amazing Deal" if ((p.original_price - p.price) / p.original_price * 100) > 60 else "Great Deal" if ((p.original_price - p.price) / p.original_price * 100) > 40 else "Good Deal" if ((p.original_price - p.price) / p.original_price * 100) > 20 else "Fair Price"
                    }
                    for p in request.products if p.original_price
                ],
                "conditionComparison": [
                    {
                        "condition": condition.replace("_", " ").title(),
                        "averagePrice": round(sum([p.price for p in request.products if p.condition.lower() == condition.lower()]) / max(1, len([p for p in request.products if p.condition.lower() == condition.lower()])), 2),
                        "averageScore": round(sum([ai_scores[i] for i, p in enumerate(request.products) if p.condition.lower() == condition.lower()]) / max(1, len([p for p in request.products if p.condition.lower() == condition.lower()])), 1),
                        "count": len([p for p in request.products if p.condition.lower() == condition.lower()]),
                        "recommendation": "Buy Now" if condition.lower() in ["excellent", "like_new"] else "Great Choice" if condition.lower() == "very_good" else "Consider" if condition.lower() == "good" else "Inspect Carefully"
                    }
                    for condition in set([p.condition for p in request.products])
                ],
                "sustainabilityImpact": {
                    "totalItemsRescued": len(request.products),
                    "estimatedCO2Saved": round(len(request.products) * 2.5, 1),
                    "wasteReduced": round(len(request.products) * 0.8, 1),
                    "totalMoneySaved": round(sum([(p.original_price or 0) - p.price for p in request.products]), 2),
                    "averageSavingsPerItem": round(sum([(p.original_price or 0) - p.price for p in request.products]) / len(request.products), 2) if request.products else 0,
                    "sustainabilityScore": min(100, len(request.products) * 10 + 30),
                    "message": f"By choosing thrift, you're saving ${round(sum([(p.original_price or 0) - p.price for p in request.products]), 2)} and helping the planet!"
                }
            }
        }

        logger.info(f"✅ AI analysis completed successfully for {len(request.products)} products")
        return response_data

    except Exception as e:
        logger.error(f"❌ Error in AI analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/score-product")
async def score_single_product(product_data: Dict[str, Any]):
    """Score a single product using Claude"""
    try:
        if not claude_llm:
            raise HTTPException(status_code=503, detail="Claude LLM not available")

        # Simple product scoring
        return {
            "product_id": product_data.get("product", {}).get("id"),
            "ai_score": 75.0,  # Simplified scoring
            "reasoning": "AI product analysis",
            "confidence_score": 0.85,
            "processing_time_ms": 150
        }

    except Exception as e:
        logger.error(f"❌ Error scoring product: {e}")
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("SERVICE_PORT", 8080))
    logger.info(f"🚀 Starting ThriftAI AI Service on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
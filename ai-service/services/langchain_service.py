"""
LangChain Service for Advanced AI Product Analysis
Implements sophisticated chains for intelligent product scoring and analysis
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional, Tuple
import time
from dataclasses import dataclass

from langchain_anthropic import ChatAnthropic
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.prompts import PromptTemplate, ChatPromptTemplate
from langchain.chains import LLMChain, SequentialChain
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from langchain.memory import ConversationBufferMemory
from langchain_core.callbacks import AsyncCallbackHandler
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

from loguru import logger
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from models.product_models import Product, UserPreferences


@dataclass
class ChainResult:
    """Result container for LangChain operations"""
    result: str
    metadata: Dict[str, Any]
    processing_time: float
    confidence: float


class LangChainService:
    """Advanced LangChain service for intelligent product analysis"""

    def __init__(self):
        self.claude_llm = None
        self.embeddings_model = None
        self.sentence_transformer = None
        self.vector_store = None

        # Chain components
        self.query_analysis_chain = None
        self.product_analysis_chain = None
        self.comparison_chain = None
        self.intent_classification_chain = None
        self.reasoning_chain = None

        # Performance tracking
        self.chain_performance = {}

    async def initialize(self):
        """Initialize all LangChain components"""
        try:
            logger.info("🔧 Initializing LangChain Service...")

            # Initialize Claude LLM
            self.claude_llm = ChatAnthropic(
                anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
                model_name=os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022"),
                max_tokens=int(os.getenv("MAX_TOKENS", 4000)),
                temperature=float(os.getenv("TEMPERATURE", 0.1))
            )

            # Initialize embeddings
            self.embeddings_model = HuggingFaceEmbeddings(
                model_name=os.getenv("EMBEDDINGS_MODEL", "all-MiniLM-L6-v2"),
                model_kwargs={'device': 'cpu'}
            )

            # Initialize sentence transformer for semantic similarity
            self.sentence_transformer = SentenceTransformer(
                os.getenv("EMBEDDINGS_MODEL", "all-MiniLM-L6-v2")
            )

            # Initialize vector store
            persist_directory = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db")
            self.vector_store = Chroma(
                embedding_function=self.embeddings_model,
                persist_directory=persist_directory
            )

            # Initialize chains
            await self._initialize_chains()

            logger.info("✅ LangChain Service initialized successfully")

        except Exception as e:
            logger.error(f"❌ Failed to initialize LangChain Service: {e}")
            raise

    async def _initialize_chains(self):
        """Initialize all analysis chains"""

        # Query Intent Analysis Chain
        intent_prompt = PromptTemplate(
            input_variables=["query", "user_context"],
            template="""
            Analyze this user's search query and extract their intent, preferences, and requirements.

            Query: {query}
            User Context: {user_context}

            Please analyze and provide:
            1. Primary Intent: What is the user really looking for?
            2. Style Preferences: What style/aesthetic preferences can you infer?
            3. Price Sensitivity: How price-conscious does the user seem?
            4. Quality Requirements: What quality level are they seeking?
            5. Urgency: How urgent is their need?
            6. Category Focus: What product categories are most relevant?

            Provide your analysis in JSON format with clear reasoning.
            """
        )

        self.intent_classification_chain = LLMChain(
            llm=self.claude_llm,
            prompt=intent_prompt,
            output_key="intent_analysis"
        )

        # Product Semantic Analysis Chain
        product_analysis_prompt = PromptTemplate(
            input_variables=["query", "product_details", "intent_analysis"],
            template="""
            Analyze how well this product matches the user's search query and intent.

            User Query: {query}
            User Intent Analysis: {intent_analysis}

            Product Details:
            {product_details}

            Provide a detailed analysis covering:
            1. Semantic Relevance (0-1): How semantically similar is this product to the query?
            2. Intent Alignment (0-1): How well does this product fulfill the user's intent?
            3. Value Proposition (0-1): How good is the value for money?
            4. Quality Assessment (0-1): How would you rate the product quality?
            5. Market Position (0-1): How competitive is this product in the market?

            For each score, provide detailed reasoning. Return as JSON with scores and explanations.
            """
        )

        self.product_analysis_chain = LLMChain(
            llm=self.claude_llm,
            prompt=product_analysis_prompt,
            output_key="product_analysis"
        )

        # Comparative Analysis Chain
        comparison_prompt = PromptTemplate(
            input_variables=["query", "products_data", "market_context"],
            template="""
            Compare these products in the context of the user's search query and current market conditions.

            User Query: {query}
            Market Context: {market_context}

            Products to Compare:
            {products_data}

            Provide:
            1. Ranking with detailed justification
            2. Best value recommendation
            3. Premium choice recommendation
            4. Budget-friendly option
            5. Market trend analysis
            6. Category insights

            Focus on providing actionable insights that help users make informed decisions.
            Return detailed analysis in JSON format.
            """
        )

        self.comparison_chain = LLMChain(
            llm=self.claude_llm,
            prompt=comparison_prompt,
            output_key="comparison_analysis"
        )

        # Reasoning and Explanation Chain
        reasoning_prompt = PromptTemplate(
            input_variables=["query", "product", "scores", "user_preferences"],
            template="""
            Generate a clear, human-friendly explanation for why this product received its AI score.

            User Query: {query}
            Product: {product}
            AI Scores: {scores}
            User Preferences: {user_preferences}

            Create an explanation that:
            1. Is easy to understand for non-technical users
            2. Highlights the key factors that influenced the score
            3. Mentions specific product features that matter
            4. Provides actionable insights
            5. Is personalized to the user's preferences

            Keep it concise but informative (2-3 sentences max).
            """
        )

        self.reasoning_chain = LLMChain(
            llm=self.claude_llm,
            prompt=reasoning_prompt,
            output_key="reasoning"
        )

    async def analyze_query_intent(self, query: str, user_context: Dict[str, Any] = None) -> ChainResult:
        """Analyze user query to understand intent and preferences"""
        start_time = time.time()

        try:
            user_context_str = json.dumps(user_context or {}, indent=2)

            result = await self.intent_classification_chain.arun(
                query=query,
                user_context=user_context_str
            )

            processing_time = time.time() - start_time

            # Parse JSON result
            try:
                parsed_result = json.loads(result)
                confidence = self._calculate_confidence(parsed_result)
            except json.JSONDecodeError:
                parsed_result = {"raw_result": result}
                confidence = 0.7

            return ChainResult(
                result=result,
                metadata=parsed_result,
                processing_time=processing_time,
                confidence=confidence
            )

        except Exception as e:
            logger.error(f"Error in query intent analysis: {e}")
            return ChainResult(
                result=f"Error analyzing query intent: {str(e)}",
                metadata={},
                processing_time=time.time() - start_time,
                confidence=0.0
            )

    async def analyze_product_semantic_match(
        self,
        query: str,
        product: Product,
        intent_analysis: Dict[str, Any]
    ) -> ChainResult:
        """Analyze semantic match between product and query"""
        start_time = time.time()

        try:
            # Prepare product details
            product_details = f"""
            Name: {product.name}
            Description: {product.description or 'No description'}
            Category: {product.category}
            Brand: {product.brand or 'Unknown'}
            Price: ${product.price}
            Condition: {product.condition or 'Not specified'}
            """

            result = await self.product_analysis_chain.arun(
                query=query,
                product_details=product_details,
                intent_analysis=json.dumps(intent_analysis, indent=2)
            )

            processing_time = time.time() - start_time

            # Parse result
            try:
                parsed_result = json.loads(result)
                confidence = self._calculate_confidence(parsed_result)
            except json.JSONDecodeError:
                parsed_result = {"raw_result": result}
                confidence = 0.7

            return ChainResult(
                result=result,
                metadata=parsed_result,
                processing_time=processing_time,
                confidence=confidence
            )

        except Exception as e:
            logger.error(f"Error in product semantic analysis: {e}")
            return ChainResult(
                result=f"Error analyzing product: {str(e)}",
                metadata={},
                processing_time=time.time() - start_time,
                confidence=0.0
            )

    async def generate_product_reasoning(
        self,
        query: str,
        product: Product,
        scores: Dict[str, float],
        user_preferences: Optional[UserPreferences] = None
    ) -> ChainResult:
        """Generate human-friendly explanation for product score"""
        start_time = time.time()

        try:
            product_str = f"{product.name} - {product.description or 'No description'}"
            scores_str = json.dumps(scores, indent=2)
            preferences_str = json.dumps(
                user_preferences.dict() if user_preferences else {},
                indent=2,
                default=str
            )

            result = await self.reasoning_chain.arun(
                query=query,
                product=product_str,
                scores=scores_str,
                user_preferences=preferences_str
            )

            processing_time = time.time() - start_time

            return ChainResult(
                result=result.strip(),
                metadata={"reasoning": result.strip()},
                processing_time=processing_time,
                confidence=0.9  # High confidence for explanation generation
            )

        except Exception as e:
            logger.error(f"Error generating reasoning: {e}")
            return ChainResult(
                result=f"This product scored {scores.get('overall', 0):.1f}/100 based on relevance and value analysis.",
                metadata={},
                processing_time=time.time() - start_time,
                confidence=0.5
            )

    async def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity between two texts using embeddings"""
        try:
            embeddings = self.sentence_transformer.encode([text1, text2])
            similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            return float(similarity)
        except Exception as e:
            logger.error(f"Error calculating semantic similarity: {e}")
            return 0.0

    async def batch_analyze_products(
        self,
        query: str,
        products: List[Product],
        intent_analysis: Dict[str, Any],
        max_concurrent: int = 5
    ) -> List[ChainResult]:
        """Analyze multiple products concurrently"""

        semaphore = asyncio.Semaphore(max_concurrent)

        async def analyze_single(product: Product) -> ChainResult:
            async with semaphore:
                return await self.analyze_product_semantic_match(query, product, intent_analysis)

        tasks = [analyze_single(product) for product in products]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle exceptions
        clean_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error analyzing product {products[i].id}: {result}")
                clean_results.append(ChainResult(
                    result="Error in analysis",
                    metadata={},
                    processing_time=0.0,
                    confidence=0.0
                ))
            else:
                clean_results.append(result)

        return clean_results

    def _calculate_confidence(self, parsed_result: Dict[str, Any]) -> float:
        """Calculate confidence score based on analysis result structure"""
        confidence = 0.5  # Base confidence

        # Increase confidence based on analysis completeness
        if isinstance(parsed_result, dict):
            if any(key in parsed_result for key in ['semantic_relevance', 'intent_alignment']):
                confidence += 0.2
            if 'reasoning' in parsed_result or 'explanation' in parsed_result:
                confidence += 0.2
            if len(parsed_result) >= 3:  # Multiple analysis dimensions
                confidence += 0.1

        return min(confidence, 1.0)

    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics for the LangChain service"""
        return {
            "chain_performance": self.chain_performance,
            "model_info": {
                "claude_model": os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022"),
                "embeddings_model": os.getenv("EMBEDDINGS_MODEL", "all-MiniLM-L6-v2")
            },
            "status": "healthy"
        }
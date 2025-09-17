#!/usr/bin/env python3
"""
AI-Powered Catalog Extraction Service for ThriftAI
Extracts product information from various sources using advanced AI/ML techniques
"""

import os
import asyncio
import aiohttp
from typing import Dict, List, Optional, Any, Tuple
import json
import logging
from dataclasses import dataclass, asdict
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
import torch
from transformers import (
    AutoTokenizer, AutoModel,
    BlipProcessor, BlipForConditionalGeneration,
    pipeline
)
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timedelta
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ProductInfo:
    """Structured product information extracted by AI"""
    name: str
    brand: Optional[str] = None
    category: str = "Unknown"
    subcategory: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    condition: str = "Good"
    size: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    description: str = ""
    features: List[str] = None
    tags: List[str] = None
    confidence_score: float = 0.0
    image_analysis: Dict[str, Any] = None
    source_url: Optional[str] = None
    extracted_at: str = None

    def __post_init__(self):
        if self.features is None:
            self.features = []
        if self.tags is None:
            self.tags = []
        if self.extracted_at is None:
            self.extracted_at = datetime.now().isoformat()
        if self.image_analysis is None:
            self.image_analysis = {}

class AIModelManager:
    """Manages AI models for various extraction tasks"""

    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {self.device}")

        # Initialize models
        self.image_caption_processor = None
        self.image_caption_model = None
        self.text_classifier = None
        self.ner_pipeline = None
        self.sentiment_analyzer = None

        self._load_models()

    def _load_models(self):
        """Load all AI models"""
        try:
            # Image captioning model (BLIP)
            logger.info("Loading image captioning model...")
            self.image_caption_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
            self.image_caption_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
            self.image_caption_model.to(self.device)

            # Text classification pipeline
            logger.info("Loading text classification model...")
            self.text_classifier = pipeline(
                "text-classification",
                model="facebook/bart-large-mnli",
                device=0 if torch.cuda.is_available() else -1
            )

            # Named Entity Recognition
            logger.info("Loading NER model...")
            self.ner_pipeline = pipeline(
                "ner",
                model="dbmdz/bert-large-cased-finetuned-conll03-english",
                aggregation_strategy="simple",
                device=0 if torch.cuda.is_available() else -1
            )

            # Sentiment analysis
            logger.info("Loading sentiment analysis model...")
            self.sentiment_analyzer = pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                device=0 if torch.cuda.is_available() else -1
            )

            logger.info("All models loaded successfully!")

        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise

class ImageAnalyzer:
    """Advanced image analysis for product extraction"""

    def __init__(self, model_manager: AIModelManager):
        self.model_manager = model_manager

    def analyze_product_image(self, image_path: str) -> Dict[str, Any]:
        """Comprehensive image analysis"""
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert("RGB")
            cv_image = cv2.imread(image_path)

            analysis = {
                "caption": self._generate_caption(image),
                "dominant_colors": self._extract_dominant_colors(cv_image),
                "features": self._detect_features(cv_image),
                "text_in_image": self._extract_text_from_image(cv_image),
                "quality_score": self._assess_image_quality(cv_image),
                "category_hints": self._get_category_hints(image),
                "style_analysis": self._analyze_style(image)
            }

            return analysis

        except Exception as e:
            logger.error(f"Error analyzing image {image_path}: {e}")
            return {}

    def _generate_caption(self, image: Image.Image) -> str:
        """Generate descriptive caption for the image"""
        try:
            inputs = self.model_manager.image_caption_processor(image, return_tensors="pt")
            inputs = {k: v.to(self.model_manager.device) for k, v in inputs.items()}

            with torch.no_grad():
                out = self.model_manager.image_caption_model.generate(**inputs, max_length=100)

            caption = self.model_manager.image_caption_processor.decode(out[0], skip_special_tokens=True)
            return caption

        except Exception as e:
            logger.error(f"Error generating caption: {e}")
            return ""

    def _extract_dominant_colors(self, image: np.ndarray) -> List[str]:
        """Extract dominant colors from the image"""
        try:
            # Convert BGR to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # Reshape image to be a list of pixels
            pixels = image_rgb.reshape(-1, 3)

            # Use K-means clustering to find dominant colors
            from sklearn.cluster import KMeans

            kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
            kmeans.fit(pixels)

            # Convert to color names
            colors = []
            for center in kmeans.cluster_centers_:
                color_name = self._rgb_to_color_name(center)
                colors.append(color_name)

            return colors[:3]  # Return top 3 colors

        except Exception as e:
            logger.error(f"Error extracting colors: {e}")
            return []

    def _rgb_to_color_name(self, rgb: np.ndarray) -> str:
        """Convert RGB values to approximate color names"""
        r, g, b = rgb.astype(int)

        # Simple color mapping
        color_map = {
            (255, 0, 0): "red",
            (0, 255, 0): "green",
            (0, 0, 255): "blue",
            (255, 255, 0): "yellow",
            (255, 165, 0): "orange",
            (128, 0, 128): "purple",
            (255, 192, 203): "pink",
            (165, 42, 42): "brown",
            (0, 0, 0): "black",
            (255, 255, 255): "white",
            (128, 128, 128): "gray",
            (0, 128, 128): "teal",
            (128, 128, 0): "olive"
        }

        # Find closest color
        min_distance = float('inf')
        closest_color = "unknown"

        for color_rgb, color_name in color_map.items():
            distance = np.sqrt(sum((a - b) ** 2 for a, b in zip(rgb, color_rgb)))
            if distance < min_distance:
                min_distance = distance
                closest_color = color_name

        return closest_color

    def _detect_features(self, image: np.ndarray) -> List[str]:
        """Detect visual features in the image"""
        features = []

        try:
            # Edge detection
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / edges.size

            if edge_density > 0.1:
                features.append("detailed_pattern")

            # Texture analysis
            # Simple texture detection using standard deviation
            texture_score = np.std(gray)
            if texture_score > 50:
                features.append("textured")
            else:
                features.append("smooth")

            # Brightness analysis
            brightness = np.mean(gray)
            if brightness > 180:
                features.append("bright")
            elif brightness < 80:
                features.append("dark")
            else:
                features.append("medium_brightness")

            return features

        except Exception as e:
            logger.error(f"Error detecting features: {e}")
            return features

    def _extract_text_from_image(self, image: np.ndarray) -> List[str]:
        """Extract text from image using OCR"""
        try:
            # Simple text detection using contours
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # This is a placeholder - in production, use Tesseract OCR
            # import pytesseract
            # text = pytesseract.image_to_string(gray)
            # return [text.strip()] if text.strip() else []

            return []  # Placeholder

        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            return []

    def _assess_image_quality(self, image: np.ndarray) -> float:
        """Assess image quality score"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Calculate sharpness using Laplacian variance
            sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()

            # Normalize to 0-1 scale
            quality_score = min(sharpness / 1000.0, 1.0)

            return quality_score

        except Exception as e:
            logger.error(f"Error assessing quality: {e}")
            return 0.5

    def _get_category_hints(self, image: Image.Image) -> List[str]:
        """Get category hints from image"""
        try:
            # Use image classification
            categories = [
                "clothing", "shoes", "electronics", "books", "jewelry",
                "accessories", "bags", "furniture", "sports", "toys"
            ]

            caption = self._generate_caption(image).lower()

            hints = []
            for category in categories:
                if category in caption:
                    hints.append(category)

            return hints

        except Exception as e:
            logger.error(f"Error getting category hints: {e}")
            return []

    def _analyze_style(self, image: Image.Image) -> Dict[str, str]:
        """Analyze style attributes"""
        try:
            caption = self._generate_caption(image).lower()

            style_analysis = {
                "era": "modern",
                "style": "casual",
                "formality": "informal"
            }

            # Era detection
            vintage_keywords = ["vintage", "retro", "classic", "old", "antique"]
            if any(keyword in caption for keyword in vintage_keywords):
                style_analysis["era"] = "vintage"

            # Style detection
            formal_keywords = ["formal", "dress", "suit", "elegant", "professional"]
            if any(keyword in caption for keyword in formal_keywords):
                style_analysis["style"] = "formal"
                style_analysis["formality"] = "formal"

            return style_analysis

        except Exception as e:
            logger.error(f"Error analyzing style: {e}")
            return {}

class TextAnalyzer:
    """Advanced text analysis for product descriptions"""

    def __init__(self, model_manager: AIModelManager):
        self.model_manager = model_manager

    def extract_product_info(self, text: str) -> Dict[str, Any]:
        """Extract structured information from product text"""
        try:
            info = {
                "entities": self._extract_entities(text),
                "category": self._classify_category(text),
                "condition": self._determine_condition(text),
                "features": self._extract_features(text),
                "sentiment": self._analyze_sentiment(text),
                "price_info": self._extract_price_info(text),
                "size_info": self._extract_size_info(text),
                "brand_info": self._extract_brand_info(text),
                "material_info": self._extract_material_info(text)
            }

            return info

        except Exception as e:
            logger.error(f"Error extracting product info: {e}")
            return {}

    def _extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """Extract named entities from text"""
        try:
            entities = self.model_manager.ner_pipeline(text)
            return entities
        except Exception as e:
            logger.error(f"Error extracting entities: {e}")
            return []

    def _classify_category(self, text: str) -> str:
        """Classify product category"""
        try:
            categories = [
                "clothing and fashion",
                "electronics and technology",
                "books and media",
                "home and garden",
                "sports and fitness",
                "toys and games",
                "jewelry and accessories",
                "automotive",
                "art and collectibles"
            ]

            # Use zero-shot classification
            candidate_labels = categories
            result = self.model_manager.text_classifier(text, candidate_labels)

            return result['labels'][0] if result['labels'] else "unknown"

        except Exception as e:
            logger.error(f"Error classifying category: {e}")
            return "unknown"

    def _determine_condition(self, text: str) -> str:
        """Determine product condition"""
        text_lower = text.lower()

        condition_keywords = {
            "new": ["new", "brand new", "unopened", "sealed", "mint"],
            "like_new": ["like new", "excellent", "pristine", "perfect"],
            "very_good": ["very good", "great condition", "minimal wear"],
            "good": ["good", "used", "working", "functional"],
            "fair": ["fair", "worn", "some damage", "needs repair"],
            "poor": ["poor", "broken", "damaged", "for parts"]
        }

        for condition, keywords in condition_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                return condition.upper()

        return "GOOD"  # Default condition

    def _extract_features(self, text: str) -> List[str]:
        """Extract product features"""
        features = []

        # Common feature keywords
        feature_patterns = [
            r"\b\w+(?:\s+\w+)?\s*(?:included|feature|with|has)\b",
            r"\b(?:waterproof|wireless|bluetooth|vintage|retro|classic)\b",
            r"\b(?:cotton|leather|silk|wool|polyester|denim)\b",
            r"\b(?:small|medium|large|xl|xxl)\b"
        ]

        for pattern in feature_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            features.extend(matches)

        return list(set(features))[:10]  # Limit to 10 features

    def _analyze_sentiment(self, text: str) -> Dict[str, float]:
        """Analyze sentiment of product description"""
        try:
            result = self.model_manager.sentiment_analyzer(text)
            return {
                "label": result[0]["label"],
                "score": result[0]["score"]
            }
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return {"label": "neutral", "score": 0.5}

    def _extract_price_info(self, text: str) -> Dict[str, Optional[float]]:
        """Extract price information"""
        price_patterns = [
            r'\$(\d+(?:\.\d{2})?)',
            r'(\d+(?:\.\d{2})?)\s*dollars?',
            r'price:?\s*\$?(\d+(?:\.\d{2})?)'
        ]

        prices = []
        for pattern in price_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    prices.append(float(match))
                except ValueError:
                    continue

        return {
            "current_price": min(prices) if prices else None,
            "original_price": max(prices) if len(prices) > 1 else None
        }

    def _extract_size_info(self, text: str) -> Optional[str]:
        """Extract size information"""
        size_patterns = [
            r'\bsize:?\s*([XS|S|M|L|XL|XXL|\d+(?:\.\d+)?)\b',
            r'\b([XS|S|M|L|XL|XXL])\b',
            r'\bUS\s*(\d+(?:\.\d+)?)\b'
        ]

        for pattern in size_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).upper()

        return None

    def _extract_brand_info(self, text: str) -> Optional[str]:
        """Extract brand information"""
        # Common brand patterns
        brand_patterns = [
            r'\bbrand:?\s*([A-Z][a-zA-Z\s&]+)',
            r'\b(Nike|Adidas|Apple|Samsung|Sony|Zara|H&M|Uniqlo|Levi\'?s|Gap)\b'
        ]

        for pattern in brand_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        return None

    def _extract_material_info(self, text: str) -> List[str]:
        """Extract material information"""
        materials = [
            "cotton", "leather", "silk", "wool", "polyester", "denim",
            "canvas", "nylon", "plastic", "metal", "wood", "glass",
            "ceramic", "rubber", "synthetic"
        ]

        found_materials = []
        text_lower = text.lower()

        for material in materials:
            if material in text_lower:
                found_materials.append(material)

        return found_materials

class CatalogExtractor:
    """Main catalog extraction service"""

    def __init__(self):
        self.model_manager = AIModelManager()
        self.image_analyzer = ImageAnalyzer(self.model_manager)
        self.text_analyzer = TextAnalyzer(self.model_manager)

    async def extract_from_url(self, url: str) -> List[ProductInfo]:
        """Extract product information from a URL"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    html = await response.text()

            soup = BeautifulSoup(html, 'html.parser')
            products = []

            # Extract product information
            product_elements = soup.find_all(['div', 'article'], class_=re.compile(r'product|item|listing'))

            for element in product_elements[:10]:  # Limit to 10 products
                product_info = await self._extract_product_from_element(element, url)
                if product_info:
                    products.append(product_info)

            return products

        except Exception as e:
            logger.error(f"Error extracting from URL {url}: {e}")
            return []

    async def extract_from_image(self, image_path: str, additional_text: str = "") -> ProductInfo:
        """Extract product information from an image"""
        try:
            # Analyze image
            image_analysis = self.image_analyzer.analyze_product_image(image_path)

            # Combine image caption with additional text
            combined_text = f"{image_analysis.get('caption', '')} {additional_text}".strip()

            # Analyze text
            text_analysis = self.text_analyzer.extract_product_info(combined_text)

            # Create product info
            product_info = ProductInfo(
                name=self._generate_product_name(image_analysis, text_analysis),
                category=text_analysis.get('category', 'Unknown'),
                condition=text_analysis.get('condition', 'Good'),
                description=combined_text,
                features=text_analysis.get('features', []),
                tags=image_analysis.get('category_hints', []),
                confidence_score=self._calculate_confidence_score(image_analysis, text_analysis),
                image_analysis=image_analysis,
                price=text_analysis.get('price_info', {}).get('current_price'),
                original_price=text_analysis.get('price_info', {}).get('original_price'),
                size=text_analysis.get('size_info'),
                brand=text_analysis.get('brand_info'),
                material=', '.join(text_analysis.get('material_info', []))
            )

            # Extract color from image analysis
            if image_analysis.get('dominant_colors'):
                product_info.color = image_analysis['dominant_colors'][0]

            return product_info

        except Exception as e:
            logger.error(f"Error extracting from image {image_path}: {e}")
            return ProductInfo(name="Unknown Product", description="Failed to extract information")

    async def extract_from_text(self, text: str) -> ProductInfo:
        """Extract product information from text description"""
        try:
            text_analysis = self.text_analyzer.extract_product_info(text)

            product_info = ProductInfo(
                name=self._extract_name_from_text(text),
                category=text_analysis.get('category', 'Unknown'),
                condition=text_analysis.get('condition', 'Good'),
                description=text,
                features=text_analysis.get('features', []),
                confidence_score=self._calculate_text_confidence(text_analysis),
                price=text_analysis.get('price_info', {}).get('current_price'),
                original_price=text_analysis.get('price_info', {}).get('original_price'),
                size=text_analysis.get('size_info'),
                brand=text_analysis.get('brand_info'),
                material=', '.join(text_analysis.get('material_info', []))
            )

            return product_info

        except Exception as e:
            logger.error(f"Error extracting from text: {e}")
            return ProductInfo(name="Unknown Product", description=text)

    async def _extract_product_from_element(self, element, base_url: str) -> Optional[ProductInfo]:
        """Extract product information from HTML element"""
        try:
            # Extract text content
            text = element.get_text(strip=True)

            # Find images
            img_elements = element.find_all('img')
            image_urls = [img.get('src') or img.get('data-src') for img in img_elements]
            image_urls = [url for url in image_urls if url]

            if not text and not image_urls:
                return None

            # Analyze text
            text_analysis = self.text_analyzer.extract_product_info(text)

            product_info = ProductInfo(
                name=self._extract_name_from_text(text),
                category=text_analysis.get('category', 'Unknown'),
                condition=text_analysis.get('condition', 'Good'),
                description=text,
                features=text_analysis.get('features', []),
                confidence_score=self._calculate_text_confidence(text_analysis),
                source_url=base_url,
                price=text_analysis.get('price_info', {}).get('current_price'),
                original_price=text_analysis.get('price_info', {}).get('original_price'),
                size=text_analysis.get('size_info'),
                brand=text_analysis.get('brand_info'),
                material=', '.join(text_analysis.get('material_info', []))
            )

            return product_info

        except Exception as e:
            logger.error(f"Error extracting from element: {e}")
            return None

    def _generate_product_name(self, image_analysis: Dict, text_analysis: Dict) -> str:
        """Generate product name from analysis"""
        caption = image_analysis.get('caption', '')
        entities = text_analysis.get('entities', [])

        # Try to extract name from entities
        for entity in entities:
            if entity.get('entity_group') in ['MISC', 'ORG']:
                return entity.get('word', 'Unknown Product')

        # Fallback to caption
        if caption:
            # Take first few words as name
            words = caption.split()[:4]
            return ' '.join(words).title()

        return "Unknown Product"

    def _extract_name_from_text(self, text: str) -> str:
        """Extract product name from text"""
        # Simple heuristic: take first sentence or first 50 characters
        sentences = text.split('.')
        if sentences:
            first_sentence = sentences[0].strip()
            if len(first_sentence) <= 100:
                return first_sentence

        # Fallback to first 50 characters
        return text[:50].strip() + "..." if len(text) > 50 else text.strip()

    def _calculate_confidence_score(self, image_analysis: Dict, text_analysis: Dict) -> float:
        """Calculate confidence score for extraction"""
        score = 0.0

        # Image quality contributes to confidence
        if image_analysis.get('quality_score'):
            score += image_analysis['quality_score'] * 0.3

        # Caption quality
        if image_analysis.get('caption'):
            score += min(len(image_analysis['caption']) / 100, 0.3)

        # Text analysis quality
        if text_analysis.get('entities'):
            score += min(len(text_analysis['entities']) / 10, 0.2)

        # Category classification confidence
        if text_analysis.get('sentiment', {}).get('score'):
            score += text_analysis['sentiment']['score'] * 0.2

        return min(score, 1.0)

    def _calculate_text_confidence(self, text_analysis: Dict) -> float:
        """Calculate confidence score for text-only extraction"""
        score = 0.3  # Base score for text

        if text_analysis.get('entities'):
            score += min(len(text_analysis['entities']) / 10, 0.3)

        if text_analysis.get('price_info', {}).get('current_price'):
            score += 0.2

        if text_analysis.get('brand_info'):
            score += 0.2

        return min(score, 1.0)

# FastAPI service for integration with Java application
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import uvicorn
from pydantic import BaseModel

app = FastAPI(title="ThriftAI Catalog Extractor", version="1.0.0")
extractor = CatalogExtractor()

class TextExtractionRequest(BaseModel):
    text: str
    additional_context: str = ""

class URLExtractionRequest(BaseModel):
    url: str

@app.post("/extract/image")
async def extract_from_image_endpoint(
    file: UploadFile = File(...),
    additional_text: str = Form("")
):
    """Extract product information from uploaded image"""
    try:
        # Save uploaded file temporarily
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Extract product information
        product_info = await extractor.extract_from_image(temp_path, additional_text)

        # Clean up temp file
        os.unlink(temp_path)

        return JSONResponse(content=asdict(product_info))

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/extract/text")
async def extract_from_text_endpoint(request: TextExtractionRequest):
    """Extract product information from text"""
    try:
        product_info = await extractor.extract_from_text(request.text)
        return JSONResponse(content=asdict(product_info))
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/extract/url")
async def extract_from_url_endpoint(request: URLExtractionRequest):
    """Extract product information from URL"""
    try:
        products = await extractor.extract_from_url(request.url)
        return JSONResponse(content=[asdict(product) for product in products])
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ThriftAI Catalog Extractor"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8085)
#!/usr/bin/env python3
"""
Advanced Thrift Theme Engine for ThriftAI
Creates abstract thematic layers for products to enhance discovery and categorization
"""

import json
import asyncio
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from datetime import datetime
import hashlib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
import colorsys

logger = logging.getLogger(__name__)

class ThemeType(Enum):
    """Types of thematic categorization"""
    STYLE = "style"
    ERA = "era"
    OCCASION = "occasion"
    AESTHETIC = "aesthetic"
    LIFESTYLE = "lifestyle"
    MOOD = "mood"
    SEASON = "season"
    COLOR_PALETTE = "color_palette"

@dataclass
class ThemeAttribute:
    """Individual theme attribute"""
    name: str
    confidence: float
    keywords: List[str]
    color_associations: List[str]
    style_indicators: List[str]

@dataclass
class ProductTheme:
    """Complete thematic profile for a product"""
    product_id: str
    primary_theme: str
    theme_confidence: float
    style_attributes: Dict[ThemeType, ThemeAttribute]
    aesthetic_score: float
    trend_relevance: float
    target_demographics: List[str]
    mood_associations: List[str]
    lifestyle_fit: List[str]
    season_relevance: Dict[str, float]
    color_harmony: Dict[str, float]
    vintage_authenticity: float
    uniqueness_score: float
    market_positioning: str
    created_at: str

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()

class ThemeClassifier:
    """AI-powered theme classification system"""

    def __init__(self):
        self.style_themes = self._load_style_themes()
        self.era_themes = self._load_era_themes()
        self.aesthetic_themes = self._load_aesthetic_themes()
        self.color_themes = self._load_color_themes()
        self.lifestyle_themes = self._load_lifestyle_themes()

    def _load_style_themes(self) -> Dict[str, Dict[str, Any]]:
        """Load style theme definitions"""
        return {
            "minimalist": {
                "keywords": ["clean", "simple", "minimal", "basic", "sleek", "modern"],
                "colors": ["white", "black", "gray", "beige", "cream"],
                "indicators": ["geometric", "unadorned", "functional"],
                "demographics": ["young_professional", "urban", "tech_savvy"],
                "mood": ["calm", "focused", "sophisticated"]
            },
            "vintage": {
                "keywords": ["vintage", "retro", "classic", "antique", "nostalgic", "throwback"],
                "colors": ["sepia", "faded", "muted", "earth_tones"],
                "indicators": ["aged", "worn", "authentic", "timeless"],
                "demographics": ["collectors", "history_enthusiasts", "unique_seekers"],
                "mood": ["nostalgic", "authentic", "timeless"]
            },
            "bohemian": {
                "keywords": ["boho", "free-spirited", "artistic", "eclectic", "flowing", "organic"],
                "colors": ["earth_tones", "jewel_tones", "warm_colors"],
                "indicators": ["flowy", "textured", "layered", "natural"],
                "demographics": ["artists", "free_spirits", "travelers"],
                "mood": ["relaxed", "creative", "adventurous"]
            },
            "industrial": {
                "keywords": ["industrial", "metal", "concrete", "urban", "raw", "edgy"],
                "colors": ["gray", "black", "silver", "rust", "dark_brown"],
                "indicators": ["metallic", "angular", "utilitarian"],
                "demographics": ["urban_dwellers", "tech_workers", "design_enthusiasts"],
                "mood": ["bold", "powerful", "modern"]
            },
            "romantic": {
                "keywords": ["romantic", "feminine", "delicate", "soft", "flowing", "elegant"],
                "colors": ["pink", "cream", "lavender", "soft_blue", "rose_gold"],
                "indicators": ["lace", "floral", "curved", "ornate"],
                "demographics": ["romantic_souls", "feminine_style", "elegance_seekers"],
                "mood": ["tender", "dreamy", "elegant"]
            },
            "street_style": {
                "keywords": ["street", "urban", "edgy", "contemporary", "trendy", "casual"],
                "colors": ["neon", "bold", "contrasting", "black", "white"],
                "indicators": ["graphic", "bold", "mixed_textures"],
                "demographics": ["youth", "urban", "trendsetters"],
                "mood": ["energetic", "confident", "rebellious"]
            },
            "preppy": {
                "keywords": ["preppy", "classic", "polished", "traditional", "crisp", "refined"],
                "colors": ["navy", "white", "khaki", "pink", "green"],
                "indicators": ["structured", "tailored", "clean_lines"],
                "demographics": ["professionals", "traditional", "academic"],
                "mood": ["confident", "polished", "traditional"]
            },
            "grunge": {
                "keywords": ["grunge", "alternative", "distressed", "worn", "casual", "rebellious"],
                "colors": ["black", "dark_gray", "faded", "muted"],
                "indicators": ["distressed", "layered", "oversized"],
                "demographics": ["alternative", "music_lovers", "non_conformists"],
                "mood": ["rebellious", "authentic", "casual"]
            }
        }

    def _load_era_themes(self) -> Dict[str, Dict[str, Any]]:
        """Load era-based theme definitions"""
        return {
            "1920s_art_deco": {
                "keywords": ["art_deco", "jazz_age", "flapper", "geometric", "gold", "glamorous"],
                "colors": ["gold", "black", "silver", "emerald", "sapphire"],
                "indicators": ["geometric_patterns", "metallic_accents", "luxurious"],
                "time_period": "1920-1929"
            },
            "1950s_classic": {
                "keywords": ["50s", "classic", "rockabilly", "pin_up", "americana", "atomic"],
                "colors": ["red", "white", "blue", "pink", "mint_green"],
                "indicators": ["full_skirts", "fitted_tops", "polka_dots"],
                "time_period": "1950-1959"
            },
            "1960s_mod": {
                "keywords": ["mod", "60s", "psychedelic", "geometric", "bold", "space_age"],
                "colors": ["bright_colors", "contrasting", "psychedelic"],
                "indicators": ["geometric_shapes", "mini_length", "bold_patterns"],
                "time_period": "1960-1969"
            },
            "1970s_disco": {
                "keywords": ["disco", "70s", "groovy", "psychedelic", "bell_bottom", "peace"],
                "colors": ["earth_tones", "orange", "brown", "gold", "avocado"],
                "indicators": ["flared", "flowing", "metallic_threads"],
                "time_period": "1970-1979"
            },
            "1980s_neon": {
                "keywords": ["80s", "neon", "bold", "oversized", "geometric", "synthetic"],
                "colors": ["neon", "bright_pink", "electric_blue", "lime_green"],
                "indicators": ["oversized", "bold_shoulders", "synthetic_materials"],
                "time_period": "1980-1989"
            },
            "1990s_grunge": {
                "keywords": ["90s", "grunge", "alternative", "casual", "oversized", "denim"],
                "colors": ["faded", "neutral", "earth_tones", "black"],
                "indicators": ["oversized", "layered", "distressed"],
                "time_period": "1990-1999"
            },
            "2000s_y2k": {
                "keywords": ["y2k", "2000s", "futuristic", "metallic", "tech", "digital"],
                "colors": ["metallic", "silver", "holographic", "bright"],
                "indicators": ["metallic_fabrics", "futuristic_cuts", "tech_inspired"],
                "time_period": "2000-2009"
            },
            "contemporary": {
                "keywords": ["modern", "contemporary", "current", "trendy", "updated"],
                "colors": ["varied", "trending", "seasonal"],
                "indicators": ["current_trends", "modern_cuts", "updated_classics"],
                "time_period": "2010-present"
            }
        }

    def _load_aesthetic_themes(self) -> Dict[str, Dict[str, Any]]:
        """Load aesthetic theme definitions"""
        return {
            "dark_academia": {
                "keywords": ["academic", "scholarly", "gothic", "intellectual", "vintage_books"],
                "colors": ["brown", "burgundy", "forest_green", "cream", "gold"],
                "indicators": ["tweed", "leather", "vintage_inspired", "scholarly"],
                "mood": ["intellectual", "mysterious", "romantic"]
            },
            "cottagecore": {
                "keywords": ["cottage", "rural", "handmade", "natural", "pastoral", "cozy"],
                "colors": ["earth_tones", "sage_green", "cream", "soft_pink", "lavender"],
                "indicators": ["floral", "handcrafted", "natural_materials", "vintage_inspired"],
                "mood": ["peaceful", "nostalgic", "cozy"]
            },
            "cyberpunk": {
                "keywords": ["cyber", "futuristic", "neon", "tech", "dystopian", "digital"],
                "colors": ["neon", "black", "electric_blue", "hot_pink", "silver"],
                "indicators": ["metallic", "tech_inspired", "bold_graphics"],
                "mood": ["edgy", "futuristic", "rebellious"]
            },
            "vaporwave": {
                "keywords": ["vaporwave", "retro_futuristic", "synthwave", "aesthetic", "nostalgic"],
                "colors": ["pink", "purple", "cyan", "magenta", "neon"],
                "indicators": ["retro_tech", "geometric", "gradient_colors"],
                "mood": ["nostalgic", "dreamy", "surreal"]
            },
            "kawaii": {
                "keywords": ["kawaii", "cute", "pastel", "japanese", "soft", "adorable"],
                "colors": ["pastel_pink", "baby_blue", "lavender", "mint", "peach"],
                "indicators": ["cute_motifs", "soft_textures", "small_details"],
                "mood": ["cheerful", "innocent", "playful"]
            },
            "goth": {
                "keywords": ["goth", "gothic", "dark", "mysterious", "dramatic", "alternative"],
                "colors": ["black", "deep_purple", "burgundy", "silver", "dark_red"],
                "indicators": ["dark_colors", "dramatic_silhouettes", "alternative"],
                "mood": ["mysterious", "dramatic", "romantic"]
            }
        }

    def _load_color_themes(self) -> Dict[str, Dict[str, Any]]:
        """Load color-based theme definitions"""
        return {
            "monochromatic": {
                "description": "Single color family with variations",
                "harmony_type": "monochromatic",
                "color_count": 1,
                "mood": ["elegant", "sophisticated", "calming"]
            },
            "complementary": {
                "description": "Opposite colors on color wheel",
                "harmony_type": "complementary",
                "color_count": 2,
                "mood": ["dynamic", "energetic", "bold"]
            },
            "analogous": {
                "description": "Adjacent colors on color wheel",
                "harmony_type": "analogous",
                "color_count": 3,
                "mood": ["harmonious", "peaceful", "natural"]
            },
            "triadic": {
                "description": "Three evenly spaced colors",
                "harmony_type": "triadic",
                "color_count": 3,
                "mood": ["vibrant", "playful", "balanced"]
            },
            "earth_tones": {
                "description": "Natural earth colors",
                "colors": ["brown", "beige", "olive", "rust", "cream"],
                "mood": ["natural", "warm", "grounded"]
            },
            "jewel_tones": {
                "description": "Rich, saturated colors",
                "colors": ["emerald", "sapphire", "ruby", "amethyst", "topaz"],
                "mood": ["luxurious", "rich", "elegant"]
            },
            "pastel_palette": {
                "description": "Soft, muted colors",
                "colors": ["baby_pink", "lavender", "mint", "peach", "sky_blue"],
                "mood": ["soft", "gentle", "calming"]
            },
            "neon_bright": {
                "description": "Electric, bright colors",
                "colors": ["neon_pink", "electric_blue", "lime_green", "hot_orange"],
                "mood": ["energetic", "bold", "attention_grabbing"]
            }
        }

    def _load_lifestyle_themes(self) -> Dict[str, Dict[str, Any]]:
        """Load lifestyle-based theme definitions"""
        return {
            "urban_professional": {
                "keywords": ["professional", "business", "urban", "sophisticated", "polished"],
                "style_indicators": ["tailored", "structured", "quality_fabrics"],
                "demographics": ["professionals", "office_workers", "business_people"],
                "occasions": ["work", "business_meetings", "professional_events"]
            },
            "weekend_casual": {
                "keywords": ["casual", "relaxed", "comfortable", "weekend", "laid_back"],
                "style_indicators": ["comfortable", "easy_care", "versatile"],
                "demographics": ["everyone", "casual_lifestyle"],
                "occasions": ["weekend", "casual_outings", "relaxation"]
            },
            "outdoor_adventure": {
                "keywords": ["outdoor", "adventure", "hiking", "camping", "nature", "active"],
                "style_indicators": ["durable", "weather_resistant", "functional"],
                "demographics": ["outdoor_enthusiasts", "athletes", "nature_lovers"],
                "occasions": ["hiking", "camping", "outdoor_activities"]
            },
            "artistic_creative": {
                "keywords": ["artistic", "creative", "unique", "expressive", "bohemian"],
                "style_indicators": ["unique_designs", "artistic_elements", "creative_expression"],
                "demographics": ["artists", "creatives", "bohemians"],
                "occasions": ["art_events", "creative_work", "self_expression"]
            },
            "minimalist_living": {
                "keywords": ["minimalist", "simple", "clean", "functional", "quality"],
                "style_indicators": ["simple_designs", "quality_materials", "versatile"],
                "demographics": ["minimalists", "quality_seekers", "simplicity_lovers"],
                "occasions": ["everyday", "versatile_use", "quality_investment"]
            },
            "luxury_collector": {
                "keywords": ["luxury", "high_end", "collector", "rare", "exclusive", "premium"],
                "style_indicators": ["high_quality", "rare_items", "designer_pieces"],
                "demographics": ["collectors", "luxury_buyers", "connoisseurs"],
                "occasions": ["special_events", "investment_pieces", "collection"]
            }
        }

class ThemeAnalyzer:
    """Analyzes products to determine thematic attributes"""

    def __init__(self):
        self.classifier = ThemeClassifier()
        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')

    def analyze_product_theme(self, product_data: Dict[str, Any]) -> ProductTheme:
        """Analyze a product to determine its complete thematic profile"""
        try:
            # Extract relevant text
            text_content = self._extract_text_content(product_data)

            # Analyze different theme dimensions
            style_analysis = self._analyze_style_themes(text_content, product_data)
            era_analysis = self._analyze_era_themes(text_content, product_data)
            aesthetic_analysis = self._analyze_aesthetic_themes(text_content, product_data)
            color_analysis = self._analyze_color_themes(product_data)
            lifestyle_analysis = self._analyze_lifestyle_themes(text_content, product_data)

            # Determine primary theme
            primary_theme, theme_confidence = self._determine_primary_theme(
                style_analysis, era_analysis, aesthetic_analysis
            )

            # Calculate various scores
            aesthetic_score = self._calculate_aesthetic_score(product_data)
            trend_relevance = self._calculate_trend_relevance(product_data)
            vintage_authenticity = self._calculate_vintage_authenticity(product_data)
            uniqueness_score = self._calculate_uniqueness_score(product_data)

            # Determine target demographics and market positioning
            target_demographics = self._determine_target_demographics(
                style_analysis, lifestyle_analysis
            )
            market_positioning = self._determine_market_positioning(
                aesthetic_score, vintage_authenticity, uniqueness_score
            )

            # Combine all theme attributes
            theme_attributes = {
                ThemeType.STYLE: style_analysis,
                ThemeType.ERA: era_analysis,
                ThemeType.AESTHETIC: aesthetic_analysis,
                ThemeType.COLOR_PALETTE: color_analysis,
                ThemeType.LIFESTYLE: lifestyle_analysis
            }

            # Create product theme
            product_theme = ProductTheme(
                product_id=product_data.get('id', 'unknown'),
                primary_theme=primary_theme,
                theme_confidence=theme_confidence,
                style_attributes=theme_attributes,
                aesthetic_score=aesthetic_score,
                trend_relevance=trend_relevance,
                target_demographics=target_demographics,
                mood_associations=self._extract_mood_associations(theme_attributes),
                lifestyle_fit=self._extract_lifestyle_fit(lifestyle_analysis),
                season_relevance=self._calculate_season_relevance(product_data),
                color_harmony=self._calculate_color_harmony(color_analysis),
                vintage_authenticity=vintage_authenticity,
                uniqueness_score=uniqueness_score,
                market_positioning=market_positioning,
                created_at=datetime.now().isoformat()
            )

            return product_theme

        except Exception as e:
            logger.error(f"Error analyzing product theme: {e}")
            return self._create_default_theme(product_data.get('id', 'unknown'))

    def _extract_text_content(self, product_data: Dict[str, Any]) -> str:
        """Extract all relevant text content from product data"""
        text_parts = []

        # Product name and description
        if product_data.get('name'):
            text_parts.append(product_data['name'])
        if product_data.get('description'):
            text_parts.append(product_data['description'])

        # Category and brand information
        if product_data.get('category'):
            text_parts.append(product_data['category'])
        if product_data.get('brand'):
            text_parts.append(product_data['brand'])

        # Features and tags
        if product_data.get('features'):
            text_parts.extend(product_data['features'])
        if product_data.get('tags'):
            text_parts.extend(product_data['tags'])

        # Image analysis results
        if product_data.get('image_analysis', {}).get('caption'):
            text_parts.append(product_data['image_analysis']['caption'])

        return ' '.join(text_parts).lower()

    def _analyze_style_themes(self, text_content: str, product_data: Dict) -> ThemeAttribute:
        """Analyze style themes"""
        style_scores = {}

        for style_name, style_data in self.classifier.style_themes.items():
            score = 0.0

            # Check keywords
            for keyword in style_data['keywords']:
                if keyword in text_content:
                    score += 1.0

            # Check color associations
            dominant_colors = product_data.get('image_analysis', {}).get('dominant_colors', [])
            for color in dominant_colors:
                if color in style_data['colors']:
                    score += 0.5

            # Normalize score
            max_possible = len(style_data['keywords']) + len(style_data['colors'])
            if max_possible > 0:
                style_scores[style_name] = score / max_possible

        # Find best matching style
        best_style = max(style_scores.items(), key=lambda x: x[1]) if style_scores else ("contemporary", 0.3)

        style_info = self.classifier.style_themes.get(best_style[0], {})

        return ThemeAttribute(
            name=best_style[0],
            confidence=best_style[1],
            keywords=style_info.get('keywords', []),
            color_associations=style_info.get('colors', []),
            style_indicators=style_info.get('indicators', [])
        )

    def _analyze_era_themes(self, text_content: str, product_data: Dict) -> ThemeAttribute:
        """Analyze era themes"""
        era_scores = {}

        for era_name, era_data in self.classifier.era_themes.items():
            score = 0.0

            # Check keywords
            for keyword in era_data['keywords']:
                if keyword in text_content:
                    score += 1.0

            # Additional scoring for vintage indicators
            vintage_keywords = ['vintage', 'retro', 'classic', 'antique', 'old']
            if any(keyword in text_content for keyword in vintage_keywords):
                if era_name != 'contemporary':
                    score += 0.5

            # Normalize score
            max_possible = len(era_data['keywords']) + 1  # +1 for vintage bonus
            if max_possible > 0:
                era_scores[era_name] = score / max_possible

        # Default to contemporary if no clear era
        if not era_scores or max(era_scores.values()) < 0.2:
            era_scores['contemporary'] = 0.8

        best_era = max(era_scores.items(), key=lambda x: x[1])
        era_info = self.classifier.era_themes.get(best_era[0], {})

        return ThemeAttribute(
            name=best_era[0],
            confidence=best_era[1],
            keywords=era_info.get('keywords', []),
            color_associations=era_info.get('colors', []),
            style_indicators=era_info.get('indicators', [])
        )

    def _analyze_aesthetic_themes(self, text_content: str, product_data: Dict) -> ThemeAttribute:
        """Analyze aesthetic themes"""
        aesthetic_scores = {}

        for aesthetic_name, aesthetic_data in self.classifier.aesthetic_themes.items():
            score = 0.0

            # Check keywords
            for keyword in aesthetic_data['keywords']:
                if keyword in text_content:
                    score += 1.0

            # Check mood associations
            image_analysis = product_data.get('image_analysis', {})
            if image_analysis.get('style_analysis'):
                style_analysis = image_analysis['style_analysis']
                for mood in aesthetic_data.get('mood', []):
                    if mood in str(style_analysis).lower():
                        score += 0.3

            # Normalize score
            max_possible = len(aesthetic_data['keywords']) + len(aesthetic_data.get('mood', []))
            if max_possible > 0:
                aesthetic_scores[aesthetic_name] = score / max_possible

        # Find best matching aesthetic
        best_aesthetic = max(aesthetic_scores.items(), key=lambda x: x[1]) if aesthetic_scores else ("contemporary", 0.3)

        aesthetic_info = self.classifier.aesthetic_themes.get(best_aesthetic[0], {})

        return ThemeAttribute(
            name=best_aesthetic[0],
            confidence=best_aesthetic[1],
            keywords=aesthetic_info.get('keywords', []),
            color_associations=aesthetic_info.get('colors', []),
            style_indicators=aesthetic_info.get('indicators', [])
        )

    def _analyze_color_themes(self, product_data: Dict) -> ThemeAttribute:
        """Analyze color themes"""
        dominant_colors = product_data.get('image_analysis', {}).get('dominant_colors', [])

        if not dominant_colors:
            return ThemeAttribute(
                name="neutral",
                confidence=0.5,
                keywords=["neutral", "versatile"],
                color_associations=["neutral"],
                style_indicators=["versatile"]
            )

        # Analyze color harmony
        color_harmony_type = self._determine_color_harmony(dominant_colors)

        # Find matching color theme
        color_theme_data = self.classifier.color_themes.get(color_harmony_type, {})

        return ThemeAttribute(
            name=color_harmony_type,
            confidence=0.8,
            keywords=dominant_colors,
            color_associations=dominant_colors,
            style_indicators=color_theme_data.get('mood', [])
        )

    def _analyze_lifestyle_themes(self, text_content: str, product_data: Dict) -> ThemeAttribute:
        """Analyze lifestyle themes"""
        lifestyle_scores = {}

        for lifestyle_name, lifestyle_data in self.classifier.lifestyle_themes.items():
            score = 0.0

            # Check keywords
            for keyword in lifestyle_data['keywords']:
                if keyword in text_content:
                    score += 1.0

            # Check category alignment
            category = product_data.get('category', '').lower()
            if 'clothing' in category and lifestyle_name in ['urban_professional', 'weekend_casual']:
                score += 0.5

            # Normalize score
            max_possible = len(lifestyle_data['keywords']) + 1  # +1 for category bonus
            if max_possible > 0:
                lifestyle_scores[lifestyle_name] = score / max_possible

        # Find best matching lifestyle
        best_lifestyle = max(lifestyle_scores.items(), key=lambda x: x[1]) if lifestyle_scores else ("weekend_casual", 0.4)

        lifestyle_info = self.classifier.lifestyle_themes.get(best_lifestyle[0], {})

        return ThemeAttribute(
            name=best_lifestyle[0],
            confidence=best_lifestyle[1],
            keywords=lifestyle_info.get('keywords', []),
            color_associations=[],
            style_indicators=lifestyle_info.get('style_indicators', [])
        )

    def _determine_color_harmony(self, colors: List[str]) -> str:
        """Determine color harmony type"""
        if len(colors) == 1:
            return "monochromatic"
        elif len(colors) == 2:
            return "complementary"
        elif len(colors) >= 3:
            # Check for earth tones
            earth_tones = ["brown", "beige", "olive", "rust", "cream", "tan"]
            if any(color in earth_tones for color in colors):
                return "earth_tones"

            # Check for pastels
            pastels = ["pink", "lavender", "mint", "peach", "sky_blue"]
            if any(color in pastels for color in colors):
                return "pastel_palette"

            # Check for jewel tones
            jewels = ["emerald", "sapphire", "ruby", "amethyst", "topaz"]
            if any(color in jewels for color in colors):
                return "jewel_tones"

            return "triadic"

        return "neutral"

    def _determine_primary_theme(self, style_analysis: ThemeAttribute,
                                era_analysis: ThemeAttribute,
                                aesthetic_analysis: ThemeAttribute) -> Tuple[str, float]:
        """Determine the primary theme and confidence"""
        theme_candidates = [
            (style_analysis.name, style_analysis.confidence, "style"),
            (era_analysis.name, era_analysis.confidence, "era"),
            (aesthetic_analysis.name, aesthetic_analysis.confidence, "aesthetic")
        ]

        # Sort by confidence
        theme_candidates.sort(key=lambda x: x[1], reverse=True)

        best_theme = theme_candidates[0]
        primary_theme = f"{best_theme[2]}_{best_theme[0]}"
        confidence = best_theme[1]

        return primary_theme, confidence

    def _calculate_aesthetic_score(self, product_data: Dict) -> float:
        """Calculate overall aesthetic appeal score"""
        score = 0.5  # Base score

        # Image quality contributes to aesthetic
        image_quality = product_data.get('image_analysis', {}).get('quality_score', 0.5)
        score += image_quality * 0.3

        # Brand recognition
        if product_data.get('brand'):
            score += 0.1

        # Condition impacts aesthetic
        condition = product_data.get('condition', 'GOOD').upper()
        condition_scores = {
            'NEW': 0.2,
            'LIKE_NEW': 0.15,
            'VERY_GOOD': 0.1,
            'GOOD': 0.05,
            'FAIR': 0.0,
            'POOR': -0.1
        }
        score += condition_scores.get(condition, 0.05)

        return min(max(score, 0.0), 1.0)

    def _calculate_trend_relevance(self, product_data: Dict) -> float:
        """Calculate how relevant the item is to current trends"""
        # Simplified trend calculation
        current_year = datetime.now().year

        # Recent items are more trend-relevant
        created_at = product_data.get('created_at')
        if created_at:
            try:
                created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                age_years = (datetime.now() - created_date).days / 365
                trend_score = max(0.1, 1.0 - (age_years * 0.1))
            except:
                trend_score = 0.5
        else:
            trend_score = 0.5

        # Category trends (simplified)
        trending_categories = ['electronics', 'streetwear', 'vintage', 'sustainable']
        category = product_data.get('category', '').lower()
        if any(trend in category for trend in trending_categories):
            trend_score += 0.2

        return min(trend_score, 1.0)

    def _calculate_vintage_authenticity(self, product_data: Dict) -> float:
        """Calculate vintage authenticity score"""
        text_content = self._extract_text_content(product_data)

        vintage_indicators = [
            'vintage', 'antique', 'retro', 'classic', 'original',
            'authentic', 'genuine', 'era', 'period', 'heritage'
        ]

        authenticity_score = 0.0
        for indicator in vintage_indicators:
            if indicator in text_content:
                authenticity_score += 0.1

        # Age factor
        created_at = product_data.get('created_at')
        if created_at:
            try:
                created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                age_years = (datetime.now() - created_date).days / 365
                if age_years > 20:  # Items over 20 years old
                    authenticity_score += 0.5
                elif age_years > 10:
                    authenticity_score += 0.3
            except:
                pass

        return min(authenticity_score, 1.0)

    def _calculate_uniqueness_score(self, product_data: Dict) -> float:
        """Calculate how unique/rare the item is"""
        uniqueness_score = 0.5  # Base score

        # Brand rarity
        common_brands = ['h&m', 'zara', 'uniqlo', 'gap', 'old navy']
        brand = product_data.get('brand', '').lower()
        if brand and brand not in common_brands:
            uniqueness_score += 0.2

        # Vintage items are often more unique
        if self._calculate_vintage_authenticity(product_data) > 0.5:
            uniqueness_score += 0.2

        # Limited edition or collector items
        text_content = self._extract_text_content(product_data)
        unique_keywords = ['limited', 'rare', 'collector', 'one-of-a-kind', 'handmade', 'custom']
        for keyword in unique_keywords:
            if keyword in text_content:
                uniqueness_score += 0.1

        return min(uniqueness_score, 1.0)

    def _determine_target_demographics(self, style_analysis: ThemeAttribute,
                                     lifestyle_analysis: ThemeAttribute) -> List[str]:
        """Determine target demographics"""
        demographics = set()

        # From style analysis
        style_data = self.classifier.style_themes.get(style_analysis.name, {})
        demographics.update(style_data.get('demographics', []))

        # From lifestyle analysis
        lifestyle_data = self.classifier.lifestyle_themes.get(lifestyle_analysis.name, {})
        demographics.update(lifestyle_data.get('demographics', []))

        return list(demographics)

    def _determine_market_positioning(self, aesthetic_score: float,
                                    vintage_authenticity: float,
                                    uniqueness_score: float) -> str:
        """Determine market positioning strategy"""
        if vintage_authenticity > 0.7:
            return "vintage_collector"
        elif uniqueness_score > 0.8:
            return "rare_unique"
        elif aesthetic_score > 0.8:
            return "premium_quality"
        elif aesthetic_score > 0.6:
            return "good_value"
        else:
            return "budget_friendly"

    def _extract_mood_associations(self, theme_attributes: Dict) -> List[str]:
        """Extract mood associations from theme attributes"""
        moods = set()

        for theme_type, attribute in theme_attributes.items():
            if theme_type == ThemeType.STYLE:
                style_data = self.classifier.style_themes.get(attribute.name, {})
                moods.update(style_data.get('mood', []))
            elif theme_type == ThemeType.AESTHETIC:
                aesthetic_data = self.classifier.aesthetic_themes.get(attribute.name, {})
                moods.update(aesthetic_data.get('mood', []))

        return list(moods)

    def _extract_lifestyle_fit(self, lifestyle_analysis: ThemeAttribute) -> List[str]:
        """Extract lifestyle fit from lifestyle analysis"""
        lifestyle_data = self.classifier.lifestyle_themes.get(lifestyle_analysis.name, {})
        return lifestyle_data.get('occasions', [])

    def _calculate_season_relevance(self, product_data: Dict) -> Dict[str, float]:
        """Calculate relevance for each season"""
        category = product_data.get('category', '').lower()
        material = product_data.get('material', '').lower()
        colors = product_data.get('image_analysis', {}).get('dominant_colors', [])

        season_scores = {
            'spring': 0.25,
            'summer': 0.25,
            'fall': 0.25,
            'winter': 0.25
        }

        # Adjust based on category
        if 'coat' in category or 'jacket' in category:
            season_scores['fall'] += 0.3
            season_scores['winter'] += 0.4
        elif 'shorts' in category or 'swimwear' in category:
            season_scores['summer'] += 0.5

        # Adjust based on materials
        if 'wool' in material:
            season_scores['winter'] += 0.3
            season_scores['fall'] += 0.2
        elif 'cotton' in material:
            season_scores['summer'] += 0.2
            season_scores['spring'] += 0.2

        # Adjust based on colors
        for color in colors:
            if color in ['orange', 'brown', 'rust']:
                season_scores['fall'] += 0.1
            elif color in ['white', 'bright']:
                season_scores['summer'] += 0.1
            elif color in ['pastel', 'green']:
                season_scores['spring'] += 0.1
            elif color in ['dark', 'black']:
                season_scores['winter'] += 0.1

        # Normalize scores
        total = sum(season_scores.values())
        if total > 0:
            season_scores = {k: v/total for k, v in season_scores.items()}

        return season_scores

    def _calculate_color_harmony(self, color_analysis: ThemeAttribute) -> Dict[str, float]:
        """Calculate color harmony scores"""
        harmony_scores = {
            'monochromatic': 0.0,
            'complementary': 0.0,
            'analogous': 0.0,
            'triadic': 0.0
        }

        harmony_type = color_analysis.name
        if harmony_type in harmony_scores:
            harmony_scores[harmony_type] = color_analysis.confidence

        return harmony_scores

    def _create_default_theme(self, product_id: str) -> ProductTheme:
        """Create default theme for products that can't be analyzed"""
        default_attribute = ThemeAttribute(
            name="contemporary",
            confidence=0.3,
            keywords=["modern", "contemporary"],
            color_associations=["neutral"],
            style_indicators=["versatile"]
        )

        return ProductTheme(
            product_id=product_id,
            primary_theme="style_contemporary",
            theme_confidence=0.3,
            style_attributes={
                ThemeType.STYLE: default_attribute,
                ThemeType.ERA: default_attribute,
                ThemeType.AESTHETIC: default_attribute,
                ThemeType.COLOR_PALETTE: default_attribute,
                ThemeType.LIFESTYLE: default_attribute
            },
            aesthetic_score=0.5,
            trend_relevance=0.5,
            target_demographics=["general"],
            mood_associations=["neutral"],
            lifestyle_fit=["everyday"],
            season_relevance={"spring": 0.25, "summer": 0.25, "fall": 0.25, "winter": 0.25},
            color_harmony={"monochromatic": 0.3},
            vintage_authenticity=0.0,
            uniqueness_score=0.3,
            market_positioning="good_value",
            created_at=datetime.now().isoformat()
        )

# FastAPI integration
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="ThriftAI Theme Engine", version="1.0.0")
theme_analyzer = ThemeAnalyzer()

class ProductThemeRequest(BaseModel):
    product_data: Dict[str, Any]

@app.post("/analyze/theme", response_model=Dict[str, Any])
async def analyze_product_theme_endpoint(request: ProductThemeRequest):
    """Analyze product theme"""
    try:
        theme = theme_analyzer.analyze_product_theme(request.product_data)
        return asdict(theme)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/themes/styles")
async def get_style_themes():
    """Get available style themes"""
    return theme_analyzer.classifier.style_themes

@app.get("/themes/eras")
async def get_era_themes():
    """Get available era themes"""
    return theme_analyzer.classifier.era_themes

@app.get("/themes/aesthetics")
async def get_aesthetic_themes():
    """Get available aesthetic themes"""
    return theme_analyzer.classifier.aesthetic_themes

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ThriftAI Theme Engine"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8086)
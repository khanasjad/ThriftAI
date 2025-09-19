package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.models.Buyer;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.util.*;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * AI Transformation Service for ThriftAI
 * Integrates with OpenAI GPT models to provide intelligent product recommendations,
 * search enhancement, and personalized shopping experiences.
 */
@Service
public class AITransformationService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ChatGPTService chatGPTService;

    @Autowired
    private QualityScoreAIService qualityScoreService;
    
    @Value("${openai.api.key:}")
    private String openAiApiKey;
    
    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String openAiApiUrl;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Transform user search query into AI-enhanced search with thrift-specific context
     */
    public AISearchResult enhanceThriftSearch(String userQuery, String userPreferences) {
        try {
            String enhancedQuery = generateEnhancedSearchQuery(userQuery, userPreferences);
            List<Product> products = searchProductsWithAI(enhancedQuery);
            String aiResponse = generateThriftAwareResponse(userQuery, products, userPreferences);
            
            return new AISearchResult(
                enhancedQuery,
                products,
                aiResponse,
                generateThriftInsights(products),
                generateRelatedSuggestions(userQuery)
            );
        } catch (Exception e) {
            // Fallback to basic service
            return createFallbackResult(userQuery);
        }
    }

    /**
     * Generate personalized product recommendations using AI
     */
    public List<ProductRecommendation> generatePersonalizedRecommendations(Buyer buyer) {
        List<Product> allProducts = productRepository.findAll();
        
        try {
            String prompt = buildRecommendationPrompt(buyer, allProducts);
            String aiResponse = callOpenAI(prompt);
            return parseRecommendationsFromAI(aiResponse, allProducts);
        } catch (Exception e) {
            return generateFallbackRecommendations(buyer, allProducts);
        }
    }

    /**
     * Generate AI-powered product descriptions optimized for thrift items
     */
    public String generateThriftProductDescription(Product product) {
        try {
            String prompt = String.format(
                "Create an engaging product description for this thrift item. " +
                "Focus on value, sustainability, and unique qualities. " +
                "Product: %s by %s, Category: %s, Price: $%.2f, Condition: %s, " +
                "Original Description: %s. " +
                "Make it appealing for thrift shoppers who value deals and sustainability.",
                product.getName(),
                product.getBrand(),
                product.getCategory(),
                product.getPrice(),
                product.getCondition(),
                product.getDescription()
            );
            
            return callOpenAI(prompt);
        } catch (Exception e) {
            return chatGPTService.generateProductDescription(product);
        }
    }

    /**
     * Analyze product images to extract features and suggest similar items
     */
    public VisualSearchResult analyzeProductImage(String imageData) {
        try {
            String prompt = "Analyze this product image and identify: " +
                          "1. Product type and category " +
                          "2. Brand (if visible) " +
                          "3. Color and style " +
                          "4. Key features " +
                          "5. Estimated retail value " +
                          "Provide results in JSON format for thrift shopping.";
            
            String aiResponse = callOpenAIVision(prompt, imageData);
            return parseVisualSearchResult(aiResponse);
        } catch (Exception e) {
            return createFallbackVisualResult();
        }
    }

    /**
     * Generate smart pricing insights comparing thrift to retail
     */
    public PricingInsight generatePricingInsight(Product product) {
        try {
            String prompt = String.format(
                "Analyze this thrift item and provide pricing insights: " +
                "Product: %s by %s, Thrift Price: $%.2f, Category: %s. " +
                "Estimate: 1) Original retail price, 2) Current retail price, " +
                "3) Savings percentage, 4) Value assessment (excellent/good/fair deal), " +
                "5) Market trends for this item type. " +
                "Focus on helping thrift shoppers understand the value.",
                product.getName(),
                product.getBrand(),
                product.getPrice(),
                product.getCategory()
            );
            
            String aiResponse = callOpenAI(prompt);
            return parsePricingInsight(aiResponse, product);
        } catch (Exception e) {
            return createFallbackPricingInsight(product);
        }
    }

    /**
     * Generate conversation responses for the AI assistant
     */
    public String generateConversationalResponse(String userMessage, String context) {
        try {
            String prompt = String.format(
                "You are ThriftAI, an AI assistant specialized in thrift shopping. " +
                "User said: '%s'. Context: %s. " +
                "Respond helpfully about thrift shopping, deals, sustainability, " +
                "and finding great value. Be friendly, knowledgeable, and focus on " +
                "practical advice for thrift shoppers. Include emojis where appropriate.",
                userMessage,
                context
            );
            
            return callOpenAI(prompt);
        } catch (Exception e) {
            return generateFallbackResponse(userMessage);
        }
    }

    // Private helper methods
    
    private String generateEnhancedSearchQuery(String userQuery, String preferences) {
        String baseQuery = chatGPTService.enhanceSearchQuery(userQuery);
        
        // Add thrift-specific enhancements
        StringBuilder enhanced = new StringBuilder(baseQuery);
        
        if (preferences != null && preferences.contains("budget")) {
            enhanced.append(" affordable budget-friendly cheap");
        }
        if (preferences != null && preferences.contains("vintage")) {
            enhanced.append(" vintage retro classic antique");
        }
        if (preferences != null && preferences.contains("designer")) {
            enhanced.append(" designer luxury brand name high-end");
        }
        
        return enhanced.toString();
    }

    private List<Product> searchProductsWithAI(String enhancedQuery) {
        // Use existing ChatGPT service as base
        List<Product> products = chatGPTService.searchProducts(enhancedQuery);
        
        // If no products found, get featured products (best deals) as fallback
        if (products.isEmpty()) {
            products = productRepository.findByIsAvailableTrue()
                .stream()
                .sorted((p1, p2) -> {
                    // Sort by discount percentage (best deals first), then by name
                    double discount1 = p1.getDiscountPercentage();
                    double discount2 = p2.getDiscountPercentage();
                    int discountCompare = Double.compare(discount2, discount1);
                    if (discountCompare != 0) return discountCompare;
                    return p1.getName().compareToIgnoreCase(p2.getName());
                })
                .limit(8)
                .collect(Collectors.toList());
        }
        
        // Apply AI-powered ranking
        return products.stream()
                .sorted((p1, p2) -> calculateAIScore(p2, enhancedQuery) - calculateAIScore(p1, enhancedQuery))
                .limit(20)
                .collect(Collectors.toList());
    }

    private int calculateAIScore(Product product, String query) {
        int score = 0;
        String searchText = (product.getName() + " " + product.getDescription()).toLowerCase();
        String[] keywords = query.toLowerCase().split("\\s+");
        
        for (String keyword : keywords) {
            if (searchText.contains(keyword)) {
                score += 10;
            }
        }
        
        // Boost score for better deals
        if (product.getOriginalPrice() > 0) {
            double discount = (product.getOriginalPrice() - product.getPrice()) / product.getOriginalPrice();
            score += (int)(discount * 50);
        }
        
        return score;
    }

    private String generateThriftAwareResponse(String userQuery, List<Product> products, String preferences) {
        // This method should never receive empty products now due to fallback logic
        if (products.isEmpty()) {
            return "🛍️ Check out these featured thrift finds!\n\n" +
                   "♻️ Shopping thrift helps the environment and saves money!";
        }
        
        // Check if we're showing search results or featured products
        boolean isEmptyQuery = userQuery == null || userQuery.trim().isEmpty();
        boolean isShowingFeaturedProducts = isEmptyQuery || userQuery.equals("Best deals under $25") || userQuery.toLowerCase().contains("featured");
        
        StringBuilder response = new StringBuilder();
        if (isShowingFeaturedProducts) {
            response.append("🛍️ Check out these ").append(products.size()).append(" featured thrift deals!\n\n");
        } else {
            response.append("🛍️ Found ").append(products.size()).append(" amazing thrift finds for '").append(userQuery).append("'!\n\n");
        }
        
        // Calculate savings
        double totalSavings = products.stream()
                .mapToDouble(p -> p.getOriginalPrice() > 0 ? p.getOriginalPrice() - p.getPrice() : 0)
                .sum();
        
        if (totalSavings > 0) {
            response.append("💰 You could save up to $").append(String.format("%.2f", totalSavings))
                   .append(" compared to retail prices!\n\n");
        }
        
        // Highlight best deals
        products.stream()
                .limit(3)
                .forEach(product -> {
                    response.append("🏷️ **").append(product.getName()).append("**")
                           .append(" - $").append(product.getPrice());
                    if (product.getOriginalPrice() > 0) {
                        double discount = ((product.getOriginalPrice() - product.getPrice()) / product.getOriginalPrice()) * 100;
                        response.append(" (").append(String.format("%.0f", discount)).append("% off!)");
                    }
                    response.append("\n📍 ").append(product.getBrand()).append(" • Condition: ").append(product.getCondition()).append("\n\n");
                });
        
        response.append("♻️ Shopping thrift helps the environment and saves money!");
        
        return response.toString();
    }

    private List<String> generateThriftInsights(List<Product> products) {
        List<String> insights = new ArrayList<>();
        
        if (!products.isEmpty()) {
            double avgDiscount = products.stream()
                    .filter(p -> p.getOriginalPrice() > 0)
                    .mapToDouble(p -> ((p.getOriginalPrice() - p.getPrice()) / p.getOriginalPrice()) * 100)
                    .average()
                    .orElse(0);
            
            if (avgDiscount > 0) {
                insights.add(String.format("Average savings: %.0f%% off retail", avgDiscount));
            }
            
            Map<String, Long> brandCounts = products.stream()
                    .collect(Collectors.groupingBy(Product::getBrand, Collectors.counting()));
            
            brandCounts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .ifPresent(entry -> insights.add("Most available brand: " + entry.getKey()));
            
            insights.add("Environmental impact: " + products.size() * 2 + " lbs saved from landfills");
        }
        
        return insights;
    }

    private List<String> generateRelatedSuggestions(String query) {
        return Arrays.asList(
            "Show me similar items in different colors",
            "Find cheaper alternatives",
            "Compare with other brands",
            "Show me vintage " + query,
            "Find designer " + query + " on sale"
        );
    }

    private String callOpenAI(String prompt) {
        if (openAiApiKey == null || openAiApiKey.isEmpty()) {
            throw new RuntimeException("OpenAI API key not configured");
        }
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + openAiApiKey);
            headers.set("Content-Type", "application/json");
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo");
            requestBody.put("messages", Arrays.asList(
                Map.of("role", "user", "content", prompt)
            ));
            requestBody.put("max_tokens", 500);
            requestBody.put("temperature", 0.7);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.exchange(openAiApiUrl, HttpMethod.POST, entity, Map.class);
            
            Map<String, Object> responseBody = response.getBody();
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            
            return (String) message.get("content");
        } catch (Exception e) {
            throw new RuntimeException("Failed to call OpenAI API: " + e.getMessage());
        }
    }

    private String callOpenAIVision(String prompt, String imageData) {
        // For now, return a mock response. In production, this would call OpenAI Vision API
        return "Mock vision analysis: This appears to be a vintage denim jacket, " +
               "likely 1980s style, blue color, good condition, estimated retail value $80-120";
    }

    // Fallback methods for when AI services are unavailable
    
    private AISearchResult createFallbackResult(String query) {
        List<Product> products = chatGPTService.searchProducts(query);
        String response = chatGPTService.generateSearchResponse(query, products);
        
        return new AISearchResult(
            query,
            products,
            response,
            Arrays.asList("Using basic search - AI temporarily unavailable"),
            chatGPTService.getSuggestedQueries("general")
        );
    }

    private List<ProductRecommendation> generateFallbackRecommendations(Buyer buyer, List<Product> products) {
        return products.stream()
                .limit(5)
                .map(product -> new ProductRecommendation(
                    product,
                    0.8, // confidence score
                    "Based on category preference",
                    Arrays.asList("Popular item", "Great value")
                ))
                .collect(Collectors.toList());
    }

    private String generateFallbackResponse(String userMessage) {
        return "I'm here to help with your thrift shopping! " +
               "While my AI is temporarily limited, I can still help you find great deals. " +
               "What specific items are you looking for?";
    }

    private VisualSearchResult createFallbackVisualResult() {
        // Enhanced fallback: return popular items from different categories
        List<Product> fallbackProducts = productRepository.findByIsAvailableTrue()
            .stream()
            .filter(p -> p.getDiscountPercentage() > 30) // Good deals only
            .sorted((p1, p2) -> Double.compare(p2.getDiscountPercentage(), p1.getDiscountPercentage()))
            .limit(6)
            .collect(Collectors.toList());

        return new VisualSearchResult(
            "📸 Visual AI is learning... Here are some amazing deals I found for you!",
            fallbackProducts,
            Arrays.asList(
                "Upload a photo of clothing items",
                "Try searching for 'electronics'",
                "Browse 'vintage clothing'",
                "Search 'nike shoes'"
            )
        );
    }

    private PricingInsight createFallbackPricingInsight(Product product) {
        double estimatedRetail = product.getPrice() * 2.5; // Simple estimation
        double savings = ((estimatedRetail - product.getPrice()) / estimatedRetail) * 100;
        
        return new PricingInsight(
            product.getPrice(),
            estimatedRetail,
            savings,
            savings > 60 ? "Excellent Deal" : "Good Deal",
            "Price comparison temporarily simplified"
        );
    }

    // Helper parsing methods (simplified for now)
    
    private List<ProductRecommendation> parseRecommendationsFromAI(String aiResponse, List<Product> products) {
        // In production, this would parse structured AI response
        return generateFallbackRecommendations(null, products);
    }

    private VisualSearchResult parseVisualSearchResult(String aiResponse) {
        // In production, this would parse structured AI response
        return createFallbackVisualResult();
    }

    private PricingInsight parsePricingInsight(String aiResponse, Product product) {
        // In production, this would parse structured AI response
        return createFallbackPricingInsight(product);
    }

    private String buildRecommendationPrompt(Buyer buyer, List<Product> products) {
        return String.format(
            "Recommend 5 products for this thrift shopper: " +
            "Buyer preferences: %s, Budget: $%.2f, Categories: %s. " +
            "Available products: %d items. Focus on value, sustainability, and personal fit.",
            buyer.getBuyerType(),
            buyer.getMaxBudget(),
            String.join(", ", buyer.getPreferredCategories()),
            products.size()
        );
    }

    // Inner classes for structured responses
    
    public static class AISearchResult {
        public final String enhancedQuery;
        public final List<Product> products;
        public final String response;
        public final List<String> insights;
        public final List<String> suggestions;

        public AISearchResult(String enhancedQuery, List<Product> products, String response, 
                            List<String> insights, List<String> suggestions) {
            this.enhancedQuery = enhancedQuery;
            this.products = products;
            this.response = response;
            this.insights = insights;
            this.suggestions = suggestions;
        }
    }

    public static class ProductRecommendation {
        public final Product product;
        public final double confidence;
        public final String reason;
        public final List<String> tags;

        public ProductRecommendation(Product product, double confidence, String reason, List<String> tags) {
            this.product = product;
            this.confidence = confidence;
            this.reason = reason;
            this.tags = tags;
        }
    }

    public static class VisualSearchResult {
        public final String analysis;
        public final List<Product> similarProducts;
        public final List<String> suggestions;

        public VisualSearchResult(String analysis, List<Product> similarProducts, List<String> suggestions) {
            this.analysis = analysis;
            this.similarProducts = similarProducts;
            this.suggestions = suggestions;
        }
    }

    public static class PricingInsight {
        public final double thriftPrice;
        public final double estimatedRetail;
        public final double savingsPercent;
        public final String valueAssessment;
        public final String notes;

        public PricingInsight(double thriftPrice, double estimatedRetail, double savingsPercent, 
                            String valueAssessment, String notes) {
            this.thriftPrice = thriftPrice;
            this.estimatedRetail = estimatedRetail;
            this.savingsPercent = savingsPercent;
            this.valueAssessment = valueAssessment;
            this.notes = notes;
        }
    }
}
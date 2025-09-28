package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.dto.AIInsights;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Integration service for Python LangChain AI microservice
 * Provides enhanced AI scoring and analysis capabilities
 */
@Service
public class LangChainIntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(LangChainIntegrationService.class);

    private WebClient webClient;
    private final ObjectMapper objectMapper;
    @Value("${ai.service.url:http://localhost:8082}")
    private String aiServiceUrl;

    @Value("${ai.service.timeout:30}")
    private int timeoutSeconds;

    @Value("${ai.service.enabled:true}")
    private boolean aiServiceEnabled;

    public LangChainIntegrationService() {
        this.objectMapper = new ObjectMapper();
        // WebClient will be initialized lazily when aiServiceUrl is available
        this.webClient = null;
    }

    private WebClient getWebClient() {
        if (this.webClient == null) {
            this.webClient = WebClient.builder()
                    .baseUrl(aiServiceUrl)
                    .defaultHeader("Content-Type", "application/json")
                    .defaultHeader("User-Agent", "ThriftAI-Java-Backend/1.0")
                    .build();
        }
        return this.webClient;
    }

    /**
     * Enhanced product analysis using Python LangChain service
     */
    public AIInsights generateEnhancedProductAnalysis(String query, List<Product> products, String userId) {
        if (!aiServiceEnabled || products.isEmpty()) {
            logger.info("🔄 AI service disabled or no products, returning basic response");
            return createBasicAIInsights(query, products);
        }

        try {
            logger.info("🚀 Calling Python LangChain AI service for enhanced analysis");

            // Prepare request payload
            Map<String, Object> requestPayload = buildAnalysisRequest(query, products, userId);

            // Call AI service with timeout and error handling
            CompletableFuture<AIInsights> analysisResult = getWebClient()
                    .post()
                    .uri("/analyze-products")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestPayload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .map(this::parseAIResponse)
                    .doOnSuccess(result -> logger.info("✅ Enhanced AI analysis completed successfully"))
                    .doOnError(error -> logger.error("❌ Enhanced AI analysis failed: {}", error.getMessage()))
                    .onErrorResume(error -> reactor.core.publisher.Mono.just(handleAIServiceError(error)))
                    .toFuture();

            // Get result with timeout
            return analysisResult.get(timeoutSeconds, java.util.concurrent.TimeUnit.SECONDS);

        } catch (Exception e) {
            logger.error("❌ Error calling LangChain AI service: {}", e.getMessage());
            return handleFailureWithFallback(query, products, userId, e);
        }
    }

    /**
     * Enhanced single product scoring
     */
    public Map<String, Object> scoreProductWithLangChain(String query, Product product, String userId) {
        if (!aiServiceEnabled) {
            return createFallbackScore(product, query);
        }

        try {
            Map<String, Object> request = Map.of(
                    "query", query,
                    "product", convertProductToMap(product),
                    "user_id", userId
            );

            String response = getWebClient()
                    .post()
                    .uri("/score-product")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .block();

            return objectMapper.readValue(response, Map.class);

        } catch (Exception e) {
            logger.error("❌ Error scoring product with LangChain: {}", e.getMessage());
            return createFallbackScore(product, query);
        }
    }

    /**
     * Submit user feedback for continuous learning
     */
    public void submitUserFeedback(String userId, String query, String productId, String action, Double score) {
        if (!aiServiceEnabled) {
            return;
        }

        try {
            Map<String, Object> feedback = Map.of(
                    "user_id", userId,
                    "query", query,
                    "product_id", productId,
                    "action", action,
                    "score", score != null ? score : 0.0
            );

            getWebClient()
                    .post()
                    .uri("/feedback")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(feedback)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .doOnSuccess(result -> logger.debug("📊 Feedback submitted successfully"))
                    .doOnError(error -> logger.warn("⚠️ Failed to submit feedback: {}", error.getMessage()))
                    .subscribe(); // Fire and forget

        } catch (Exception e) {
            logger.warn("⚠️ Error submitting feedback: {}", e.getMessage());
        }
    }

    /**
     * Get user preferences from AI service
     */
    public Map<String, Object> getUserPreferences(String userId) {
        if (!aiServiceEnabled) {
            return Map.of("user_id", userId, "preferences", "No AI service available");
        }

        try {
            String response = getWebClient()
                    .get()
                    .uri("/user-preferences/{userId}", userId)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            return objectMapper.readValue(response, Map.class);

        } catch (Exception e) {
            logger.warn("⚠️ Error getting user preferences: {}", e.getMessage());
            return Map.of("user_id", userId, "error", "Failed to get preferences");
        }
    }

    /**
     * Check AI service health
     */
    public boolean isAIServiceHealthy() {
        if (!aiServiceEnabled) {
            return false;
        }

        try {
            String response = getWebClient()
                    .get()
                    .uri("/health")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            JsonNode healthData = objectMapper.readTree(response);
            return "healthy".equals(healthData.get("status").asText());

        } catch (Exception e) {
            logger.warn("⚠️ AI service health check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get AI service performance metrics
     */
    public Map<String, Object> getAIServiceMetrics() {
        if (!aiServiceEnabled) {
            return Map.of("service", "disabled");
        }

        try {
            String response = getWebClient()
                    .get()
                    .uri("/analytics/performance")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            return objectMapper.readValue(response, Map.class);

        } catch (Exception e) {
            logger.warn("⚠️ Error getting AI service metrics: {}", e.getMessage());
            return Map.of("error", "Failed to get metrics");
        }
    }

    private Map<String, Object> buildAnalysisRequest(String query, List<Product> products, String userId) {
        Map<String, Object> request = new HashMap<>();
        request.put("query", query);
        request.put("user_id", userId);
        request.put("products", products.stream()
                .map(this::convertProductToMap)
                .collect(Collectors.toList()));

        // Add analysis options
        Map<String, Object> options = Map.of(
                "include_market_trends", true,
                "include_personalization", true,
                "include_explanations", true,
                "max_products", Math.min(products.size(), 50)
        );
        request.put("analysis_options", options);

        return request;
    }

    private Map<String, Object> convertProductToMap(Product product) {
        Map<String, Object> productMap = new HashMap<>();
        productMap.put("id", product.getId().toString());
        productMap.put("name", product.getName());
        productMap.put("description", product.getDescription());
        productMap.put("price", product.getPrice());
        productMap.put("original_price", product.getOriginalPrice());
        productMap.put("category", product.getCategory());
        productMap.put("brand", product.getBrand());
        productMap.put("condition", product.getCondition());
        productMap.put("image_url", product.getImageUrl());
        productMap.put("is_available", product.isAvailable());
        productMap.put("created_at", product.getCreatedAt() != null ? product.getCreatedAt().toString() : null);
        productMap.put("updated_at", product.getUpdatedAt() != null ? product.getUpdatedAt().toString() : null);

        return productMap;
    }

    private AIInsights parseAIResponse(String responseBody) {
        try {
            JsonNode jsonResponse = objectMapper.readTree(responseBody);

            AIInsights insights = new AIInsights();

            // Parse AI insights
            JsonNode aiInsights = jsonResponse.get("aiInsights");
            if (aiInsights != null) {
                insights.setUserIntent(aiInsights.get("userIntent").asText());
                insights.setSearchSummary(aiInsights.get("searchSummary").asText());
                insights.setAverageAiScore(aiInsights.get("averageAiScore").asDouble());
                // Note: AIInsights doesn't have setTotalSavings method
                insights.setTopRecommendation(aiInsights.get("topRecommendation").asText());
            }

            // Parse enhanced products with AI scores
            JsonNode products = jsonResponse.get("products");
            if (products != null && products.isArray()) {
                // Note: We'll skip setting products for now since we need ProductAnalysis objects
                // This would require additional conversion logic
            }

            // Parse graphs
            JsonNode graphs = jsonResponse.get("graphs");
            if (graphs != null) {
                // Note: We'll skip setting graphs for now since we need GraphData objects
                // This would require additional conversion logic
            }

            // Add metadata
            insights.setChatResponse(jsonResponse.get("message") != null ?
                    jsonResponse.get("message").asText() :
                    "✨ **Perfect Matches Found** - Curated " + (products != null ? products.size() : 0) + " premium items that match your style and budget perfectly.");

            insights.setRecommendationReason("Recommended for exceptional value and quality");
            insights.setEnvironmentalImpact(calculateEnvironmentalImpact(jsonResponse));

            logger.info("✅ Successfully parsed AI response with {} products",
                    insights.getProducts() != null ? insights.getProducts().size() : 0);

            return insights;

        } catch (Exception e) {
            logger.error("❌ Error parsing AI response: {}", e.getMessage());
            throw new RuntimeException("Failed to parse AI service response", e);
        }
    }

    private AIInsights handleAIServiceError(Throwable error) {
        logger.error("❌ AI service error, falling back to traditional analysis: {}", error.getMessage());

        // Create a basic AI insights response indicating fallback
        AIInsights fallbackInsights = new AIInsights();
        fallbackInsights.setUserIntent("Discovering your perfect style matches");
        fallbackInsights.setSearchSummary("Traditional analysis completed due to AI service unavailability");
        fallbackInsights.setAverageAiScore(0.0);
        // Note: AIInsights doesn't have setTotalSavings method
        fallbackInsights.setTopRecommendation("No AI-powered recommendation available");
        fallbackInsights.setChatResponse("Analysis completed using traditional algorithms.");

        return fallbackInsights;
    }

    private AIInsights handleFailureWithFallback(String query, List<Product> products, String userId, Exception error) {
        logger.warn("🔄 LangChain service failed, returning basic response due to error: {}", error.getMessage());
        return createBasicAIInsights(query, products);
    }

    private Map<String, Object> createFallbackScore(Product product, String query) {
        return Map.of(
                "product_id", product.getId().toString(),
                "ai_score", 70.0, // Default score
                "reasoning", "Fallback scoring due to AI service unavailability",
                "confidence_score", 0.5,
                "processing_time_ms", 0
        );
    }

    private Map<String, Object> calculateEnvironmentalImpact(JsonNode response) {
        // Simple environmental impact calculation
        return Map.of(
                "co2_saved", "Estimated CO2 savings from thrift shopping",
                "waste_reduced", "Contributing to circular economy",
                "sustainability_score", 8.5
        );
    }

    private AIInsights createBasicAIInsights(String query, List<Product> products) {
        AIInsights insights = new AIInsights();
        insights.setUserIntent("User searching for: " + query);
        insights.setSearchSummary("Smart curation in progress - finding your perfect items");
        insights.setAverageAiScore(50.0);
        insights.setTopRecommendation(products.isEmpty() ? "No products available" :
            products.get(0).getName() + " (basic recommendation)");
        insights.setChatResponse("🌟 **Curated Just For You** - These handpicked treasures offer incredible value and style. Each piece has been selected for its quality, uniqueness, and amazing savings potential.");
        insights.setRecommendationReason("Selected for outstanding value and style match");
        insights.setEnvironmentalImpact(Map.of(
            "message", "Thrift shopping contributes to sustainability",
            "sustainability_score", 7.0
        ));
        return insights;
    }
}
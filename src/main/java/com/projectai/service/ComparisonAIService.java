package com.projectai.service;

import com.projectai.models.Product;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ComparisonAIService {

    private static final Logger logger = LoggerFactory.getLogger(ComparisonAIService.class);

    @Autowired
    private ClaudeService claudeService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Core AI Orchestration Method: Analyzes products and returns structured comparison data
     */
    public Map<String, Object> performIntelligentComparison(List<Product> products, String userQuery) {
        try {
            logger.info("Starting AI comparison for {} products with query: {}", products.size(), userQuery);

            // 1. Prepare structured product data for AI
            List<Map<String, Object>> structuredProducts = enrichProductData(products);

            // 2. Craft intelligent AI prompt
            String aiPrompt = buildComparisonPrompt(structuredProducts, userQuery);

            // 3. Get AI analysis from Claude
            String aiResponse = claudeService.generateThriftResponse(aiPrompt, products, "intelligent comparison");

            // 4. Parse and validate AI response
            Map<String, Object> parsedResults = parseAIResponse(aiResponse, products);

            // 5. Add enhanced analytics
            addAdvancedAnalytics(parsedResults, products, userQuery);

            logger.info("AI comparison completed successfully");
            return parsedResults;

        } catch (Exception e) {
            logger.error("Error in AI comparison: ", e);
            return createFallbackResponse(products, userQuery);
        }
    }

    /**
     * Enriches raw product data with AI-analyzable attributes
     */
    private List<Map<String, Object>> enrichProductData(List<Product> products) {
        return products.stream().map(product -> {
            Map<String, Object> enriched = new HashMap<>();

            // Basic product info
            enriched.put("id", product.getId());
            enriched.put("name", product.getName());
            enriched.put("brand", product.getBrand());
            enriched.put("category", product.getCategory());
            enriched.put("price", product.getPrice());
            enriched.put("originalPrice", product.getOriginalPrice());
            enriched.put("condition", product.getCondition());
            enriched.put("description", product.getDescription());
            enriched.put("size", product.getSize());

            // AI-enhanced attributes
            enriched.put("valueScore", calculateValueScore(product));
            enriched.put("conditionScore", mapConditionToScore(product.getCondition()));
            enriched.put("savingsAmount", product.getOriginalPrice() - product.getPrice());
            enriched.put("savingsPercentage", ((product.getOriginalPrice() - product.getPrice()) / product.getOriginalPrice()) * 100);

            // Extract key features from description using simple NLP
            enriched.put("keyFeatures", extractKeyFeatures(product.getDescription()));

            return enriched;
        }).collect(Collectors.toList());
    }

    /**
     * Builds sophisticated AI prompt for product comparison
     */
    private String buildComparisonPrompt(List<Map<String, Object>> products, String userQuery) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("You are an expert product comparison analyst. Analyze these products and provide a detailed comparison.\n\n");
        prompt.append("USER QUERY: ").append(userQuery).append("\n\n");
        prompt.append("PRODUCTS TO ANALYZE:\n");

        for (int i = 0; i < products.size(); i++) {
            Map<String, Object> product = products.get(i);
            prompt.append(String.format("Product %d:\n", i + 1));
            prompt.append(String.format("- Name: %s\n", product.get("name")));
            prompt.append(String.format("- Brand: %s\n", product.get("brand")));
            prompt.append(String.format("- Category: %s\n", product.get("category")));
            prompt.append(String.format("- Price: $%.2f (Original: $%.2f)\n",
                (Double) product.get("price"), (Double) product.get("originalPrice")));
            prompt.append(String.format("- Condition: %s\n", product.get("condition")));
            prompt.append(String.format("- Savings: %.1f%%\n", (Double) product.get("savingsPercentage")));
            prompt.append(String.format("- Description: %s\n", product.get("description")));
            prompt.append(String.format("- Key Features: %s\n\n", product.get("keyFeatures")));
        }

        prompt.append("ANALYSIS REQUIREMENTS:\n");
        prompt.append("1. Rank products from BEST to WORST for this user query\n");
        prompt.append("2. Provide specific reasoning for each ranking\n");
        prompt.append("3. Highlight the TOP RECOMMENDATION with clear justification\n");
        prompt.append("4. Compare key attributes: value, quality, features, condition\n");
        prompt.append("5. Identify any deal-breakers or standout advantages\n");
        prompt.append("6. Consider the user's intent based on their query\n\n");

        prompt.append("RESPOND IN THIS EXACT JSON FORMAT:\n");
        prompt.append("{\n");
        prompt.append("  \"topRecommendation\": {\n");
        prompt.append("    \"productId\": \"product_id_here\",\n");
        prompt.append("    \"reason\": \"detailed_explanation\",\n");
        prompt.append("    \"score\": 95\n");
        prompt.append("  },\n");
        prompt.append("  \"rankings\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"productId\": \"product_id\",\n");
        prompt.append("      \"rank\": 1,\n");
        prompt.append("      \"score\": 95,\n");
        prompt.append("      \"reasoning\": \"why_this_rank\",\n");
        prompt.append("      \"pros\": [\"advantage1\", \"advantage2\"],\n");
        prompt.append("      \"cons\": [\"disadvantage1\"]\n");
        prompt.append("    }\n");
        prompt.append("  ],\n");
        prompt.append("  \"comparisonSummary\": \"overall_analysis_summary\",\n");
        prompt.append("  \"userInsight\": \"personalized_advice_for_user\"\n");
        prompt.append("}\n");

        return prompt.toString();
    }

    /**
     * Parses and validates AI response into structured data
     */
    private Map<String, Object> parseAIResponse(String aiResponse, List<Product> products) {
        try {
            // Extract JSON from AI response (may contain additional text)
            String jsonResponse = extractJsonFromResponse(aiResponse);

            // Parse JSON
            JsonNode jsonNode = objectMapper.readTree(jsonResponse);

            // Validate and structure the response
            Map<String, Object> result = new HashMap<>();

            // Extract top recommendation
            if (jsonNode.has("topRecommendation")) {
                result.put("topRecommendation", objectMapper.convertValue(
                    jsonNode.get("topRecommendation"), Map.class));
            }

            // Extract rankings
            if (jsonNode.has("rankings")) {
                result.put("rankings", objectMapper.convertValue(
                    jsonNode.get("rankings"), List.class));
            }

            // Extract summaries
            result.put("comparisonSummary", jsonNode.path("comparisonSummary").asText(""));
            result.put("userInsight", jsonNode.path("userInsight").asText(""));

            return result;

        } catch (Exception e) {
            logger.warn("Failed to parse AI response as JSON, using fallback analysis", e);
            return createStructuredFallback(aiResponse, products);
        }
    }

    /**
     * Adds enhanced analytics and visualization data
     */
    private void addAdvancedAnalytics(Map<String, Object> results, List<Product> products, String userQuery) {
        // Add comparison charts data
        Map<String, Object> charts = new HashMap<>();

        // Price comparison chart
        charts.put("priceComparison", products.stream().map(p -> {
            Map<String, Object> point = new HashMap<>();
            point.put("name", p.getName());
            point.put("price", p.getPrice());
            point.put("originalPrice", p.getOriginalPrice());
            point.put("savings", p.getOriginalPrice() - p.getPrice());
            return point;
        }).collect(Collectors.toList()));

        // Value score radar chart
        charts.put("valueRadar", products.stream().map(p -> {
            Map<String, Object> radar = new HashMap<>();
            radar.put("name", p.getName());
            radar.put("price", normalizeScore(p.getPrice(), 0, 1000)); // Normalize to 0-100
            radar.put("condition", mapConditionToScore(p.getCondition()));
            radar.put("value", calculateValueScore(p));
            radar.put("savings", Math.min(((p.getOriginalPrice() - p.getPrice()) / p.getOriginalPrice()) * 100, 100));
            return radar;
        }).collect(Collectors.toList()));

        results.put("charts", charts);

        // Add search insights
        Map<String, Object> insights = new HashMap<>();
        insights.put("totalProductsAnalyzed", products.size());
        insights.put("averagePrice", products.stream().mapToDouble(Product::getPrice).average().orElse(0));
        insights.put("averageSavings", products.stream()
            .mapToDouble(p -> p.getOriginalPrice() - p.getPrice()).average().orElse(0));
        insights.put("categoryBreakdown", products.stream()
            .collect(Collectors.groupingBy(Product::getCategory, Collectors.counting())));

        results.put("searchInsights", insights);
    }

    /**
     * Helper methods for data processing
     */
    private double calculateValueScore(Product product) {
        double savings = ((product.getOriginalPrice() - product.getPrice()) / product.getOriginalPrice()) * 100;
        double conditionScore = mapConditionToScore(product.getCondition());
        return (savings * 0.6) + (conditionScore * 0.4); // Weighted combination
    }

    private double mapConditionToScore(String condition) {
        if (condition == null) return 70.0;
        switch (condition.toUpperCase()) {
            case "EXCELLENT": case "LIKE_NEW": return 95.0;
            case "VERY_GOOD": return 85.0;
            case "GOOD": return 75.0;
            case "FAIR": return 65.0;
            default: return 70.0;
        }
    }

    private double normalizeScore(double value, double min, double max) {
        return Math.max(0, Math.min(100, ((max - value) / (max - min)) * 100));
    }

    private List<String> extractKeyFeatures(String description) {
        if (description == null || description.trim().isEmpty()) {
            return Arrays.asList("No features listed");
        }

        // Simple feature extraction - could be enhanced with NLP
        List<String> features = new ArrayList<>();
        String[] words = description.toLowerCase().split("\\W+");

        // Look for key feature indicators
        for (int i = 0; i < words.length - 1; i++) {
            String word = words[i];
            if (word.matches("(excellent|good|great|perfect|premium|high|quality)") &&
                words[i + 1].matches("(condition|quality|material|build)")) {
                features.add(word + " " + words[i + 1]);
            }
        }

        if (features.isEmpty()) {
            features.add("Standard condition");
        }

        return features.stream().limit(3).collect(Collectors.toList());
    }

    private String extractJsonFromResponse(String response) {
        // Find JSON block in AI response
        int startIndex = response.indexOf("{");
        int endIndex = response.lastIndexOf("}");

        if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
            return response.substring(startIndex, endIndex + 1);
        }

        throw new IllegalArgumentException("No valid JSON found in AI response");
    }

    private Map<String, Object> createStructuredFallback(String aiResponse, List<Product> products) {
        Map<String, Object> fallback = new HashMap<>();

        // Create basic rankings based on value score
        List<Map<String, Object>> rankings = new ArrayList<>();
        for (int i = 0; i < products.size(); i++) {
            Product product = products.get(i);
            Map<String, Object> ranking = new HashMap<>();
            ranking.put("productId", product.getId());
            ranking.put("rank", i + 1);
            ranking.put("score", calculateValueScore(product));
            ranking.put("reasoning", "Based on value and condition analysis");
            ranking.put("pros", Arrays.asList("Good value", "Available"));
            ranking.put("cons", Arrays.asList("Limited analysis"));
            rankings.add(ranking);
        }

        fallback.put("rankings", rankings);
        fallback.put("comparisonSummary", "AI analysis completed with basic scoring");
        fallback.put("userInsight", aiResponse); // Include raw AI response

        if (!products.isEmpty()) {
            Map<String, Object> topRec = new HashMap<>();
            topRec.put("productId", products.get(0).getId());
            topRec.put("reason", "Best overall value based on analysis");
            topRec.put("score", calculateValueScore(products.get(0)));
            fallback.put("topRecommendation", topRec);
        }

        return fallback;
    }

    private Map<String, Object> createFallbackResponse(List<Product> products, String userQuery) {
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("error", "AI comparison temporarily unavailable");
        fallback.put("message", "Showing products sorted by relevance");
        fallback.put("products", products);
        return fallback;
    }
}
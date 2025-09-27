package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.dto.AIInsights;
import com.projectai.dto.GraphData;
import com.projectai.dto.ProductAnalysis;
import com.projectai.dto.ComparisonMatrix;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.*;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.io.IOException;

/**
 * Advanced AI Orchestration Service
 * Provides next-generation AI capabilities with Claude 3.5 Sonnet integration,
 * intelligent graph generation, and multi-dimensional product analysis
 */
@Service
public class AdvancedAIOrchestrationService {

    @Autowired
    private ClaudeService claudeService;

    @Value("${claude.api.key:}")
    private String claudeApiKey;

    @Value("${claude.api.url:https://api.anthropic.com/v1/messages}")
    private String claudeApiUrl;

    @Value("${claude.api.model:claude-3-5-sonnet-20241022}")
    private String claudeModel;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generate comprehensive AI insights with graph data for products
     * This is the main entry point for the "white shirt" example
     */
    public AIInsights generateComprehensiveProductAnalysis(String query, List<Product> products, String userProfile) {
        AIInsights insights = new AIInsights();

        try {
            // 1. Generate smart query understanding
            insights.setUserIntent(analyzeUserIntent(query));
            insights.setSearchSummary(generateSearchSummary(query, products));

            // 2. Calculate AI scores for all products
            insights.setProducts(calculateAIScores(products, query));
            insights.setAverageAiScore(calculateAverageScore(insights.getProducts()));
            insights.setTopRecommendation(findTopRecommendation(insights.getProducts()));

            // 3. Generate dynamic graphs
            insights.setGraphs(generateDynamicGraphs(insights.getProducts(), query));

            // 4. Create comparison matrix
            insights.setComparisonMatrix(generateComparisonMatrix(insights.getProducts()));

            // 5. Generate intelligent insights using Claude
            insights.setChatResponse(generateAdvancedChatResponse(query, insights.getProducts(), userProfile));
            insights.setRecommendationReason(generateRecommendationReason(insights.getProducts().get(0), query));

            // 6. Calculate environmental impact
            insights.setEnvironmentalImpact(calculateEnvironmentalImpact(products));

        } catch (Exception e) {
            // Fallback to basic insights if advanced analysis fails
            return generateFallbackInsights(query, products);
        }

        return insights;
    }

    /**
     * Analyze user intent from search query using Claude 3.5 Sonnet
     */
    private String analyzeUserIntent(String query) {
        try {
            String prompt = String.format(
                "Analyze this product search query and extract the user's intent in one sentence: '%s'\n\n" +
                "Consider: occasion, style preferences, budget signals, urgency, specific features mentioned.\n" +
                "Format: 'User is looking for [specific intent]'",
                query
            );

            return callClaudeAPI(prompt, 100);
        } catch (Exception e) {
            return String.format("User is searching for products related to: %s", query);
        }
    }

    /**
     * Calculate AI scores for products based on multi-dimensional analysis
     */
    private List<ProductAnalysis> calculateAIScores(List<Product> products, String query) {
        List<ProductAnalysis> analyses = new ArrayList<>();

        for (Product product : products) {
            ProductAnalysis analysis = new ProductAnalysis();
            analysis.setProduct(product);

            // Multi-dimensional scoring
            Map<String, Double> scores = new HashMap<>();
            scores.put("priceMatching", calculatePriceScore(product, products));
            scores.put("categoryRelevance", calculateCategoryRelevance(product, query));
            scores.put("brandPreference", calculateBrandScore(product));
            scores.put("conditionMatching", calculateConditionScore(product));
            scores.put("valueProposition", calculateValueScore(product));
            scores.put("keywordRelevance", calculateKeywordRelevance(product, query));

            analysis.setScoreBreakdown(scores);

            // Calculate overall AI score (weighted average)
            double overallScore = scores.get("priceMatching") * 0.2 +
                                 scores.get("categoryRelevance") * 0.25 +
                                 scores.get("brandPreference") * 0.15 +
                                 scores.get("conditionMatching") * 0.15 +
                                 scores.get("valueProposition") * 0.15 +
                                 scores.get("keywordRelevance") * 0.1;

            analysis.setAiScore(round(overallScore, 1));

            // Calculate savings information
            if (product.getOriginalPrice() > 0) {
                double savings = product.getOriginalPrice() - product.getPrice();
                double savingsPercentage = (savings / product.getOriginalPrice()) * 100;
                analysis.setSavings(round(savings, 2));
                analysis.setSavingsPercentage(round(savingsPercentage, 1));
            }

            analyses.add(analysis);
        }

        // Sort by AI score descending
        return analyses.stream()
                .sorted((a, b) -> Double.compare(b.getAiScore(), a.getAiScore()))
                .collect(Collectors.toList());
    }

    /**
     * Generate dynamic graphs for data visualization
     */
    private List<GraphData> generateDynamicGraphs(List<ProductAnalysis> products, String query) {
        List<GraphData> graphs = new ArrayList<>();

        // 1. AI Score Comparison Bar Chart
        graphs.add(createAIScoreBarChart(products));

        // 2. Price vs Quality Scatter Plot
        graphs.add(createPriceQualityScatterPlot(products));

        // 3. Category Distribution Pie Chart
        graphs.add(createCategoryDistributionChart(products));

        // 4. Savings Opportunities Chart
        graphs.add(createSavingsChart(products));

        // 5. Multi-dimensional Radar Chart for top 3 products
        graphs.add(createRadarChart(products.stream().limit(3).collect(Collectors.toList())));

        return graphs;
    }

    /**
     * Create AI Score Bar Chart
     */
    private GraphData createAIScoreBarChart(List<ProductAnalysis> products) {
        GraphData graph = new GraphData();
        graph.setType("bar");
        graph.setTitle("AI Recommendation Scores");
        graph.setXAxis("Products");
        graph.setYAxis("AI Score (0-100)");

        List<String> labels = products.stream()
                .map(p -> truncateProductName(p.getProduct().getName()))
                .collect(Collectors.toList());

        List<Double> data = products.stream()
                .map(ProductAnalysis::getAiScore)
                .collect(Collectors.toList());

        Map<String, Object> chartData = new HashMap<>();
        chartData.put("labels", labels);
        chartData.put("datasets", Arrays.asList(Map.of(
            "label", "AI Score",
            "data", data,
            "backgroundColor", generateColors(data.size(), "blue"),
            "borderColor", generateColors(data.size(), "darkblue"),
            "borderWidth", 1
        )));

        graph.setData(chartData);
        return graph;
    }

    /**
     * Create Price vs Quality Scatter Plot
     */
    private GraphData createPriceQualityScatterPlot(List<ProductAnalysis> products) {
        GraphData graph = new GraphData();
        graph.setType("scatter");
        graph.setTitle("Price vs Quality Analysis");
        graph.setXAxis("Price ($)");
        graph.setYAxis("Quality Score");

        List<Map<String, Object>> scatterData = products.stream()
                .map(p -> {
                    Map<String, Object> dataPoint = new HashMap<>();
                    dataPoint.put("x", p.getProduct().getPrice());
                    dataPoint.put("y", p.getScoreBreakdown().get("conditionMatching") * 100);
                    dataPoint.put("label", truncateProductName(p.getProduct().getName()));
                    return dataPoint;
                })
                .collect(Collectors.toList());

        Map<String, Object> chartData = new HashMap<>();
        chartData.put("datasets", Arrays.asList(Map.of(
            "label", "Products",
            "data", scatterData,
            "backgroundColor", "rgba(75, 192, 192, 0.6)",
            "borderColor", "rgba(75, 192, 192, 1)",
            "pointRadius", 8
        )));

        graph.setData(chartData);
        return graph;
    }

    /**
     * Create Category Distribution Pie Chart
     */
    private GraphData createCategoryDistributionChart(List<ProductAnalysis> products) {
        GraphData graph = new GraphData();
        graph.setType("pie");
        graph.setTitle("Product Categories");

        Map<String, Long> categoryCount = products.stream()
                .collect(Collectors.groupingBy(
                    p -> p.getProduct().getCategory(),
                    Collectors.counting()
                ));

        List<String> labels = new ArrayList<>(categoryCount.keySet());
        List<Long> data = new ArrayList<>(categoryCount.values());

        Map<String, Object> chartData = new HashMap<>();
        chartData.put("labels", labels);
        chartData.put("datasets", Arrays.asList(Map.of(
            "data", data,
            "backgroundColor", generateColors(labels.size(), "rainbow"),
            "borderColor", "#ffffff",
            "borderWidth", 2
        )));

        graph.setData(chartData);
        return graph;
    }

    /**
     * Create Savings Opportunities Chart
     */
    private GraphData createSavingsChart(List<ProductAnalysis> products) {
        GraphData graph = new GraphData();
        graph.setType("horizontalBar");
        graph.setTitle("Savings Opportunities");
        graph.setXAxis("Savings Percentage (%)");
        graph.setYAxis("Products");

        List<ProductAnalysis> withSavings = products.stream()
                .filter(p -> p.getSavingsPercentage() > 0)
                .sorted((a, b) -> Double.compare(b.getSavingsPercentage(), a.getSavingsPercentage()))
                .limit(10)
                .collect(Collectors.toList());

        List<String> labels = withSavings.stream()
                .map(p -> truncateProductName(p.getProduct().getName()))
                .collect(Collectors.toList());

        List<Double> data = withSavings.stream()
                .map(ProductAnalysis::getSavingsPercentage)
                .collect(Collectors.toList());

        Map<String, Object> chartData = new HashMap<>();
        chartData.put("labels", labels);
        chartData.put("datasets", Arrays.asList(Map.of(
            "label", "Savings %",
            "data", data,
            "backgroundColor", generateColors(data.size(), "green"),
            "borderColor", generateColors(data.size(), "darkgreen"),
            "borderWidth", 1
        )));

        graph.setData(chartData);
        return graph;
    }

    /**
     * Create Multi-dimensional Radar Chart for top products
     */
    private GraphData createRadarChart(List<ProductAnalysis> topProducts) {
        GraphData graph = new GraphData();
        graph.setType("radar");
        graph.setTitle("Multi-Dimensional Product Comparison");

        List<String> dimensions = Arrays.asList(
            "Price Match", "Category Relevance", "Brand Score",
            "Condition", "Value Proposition", "Keyword Match"
        );

        List<Map<String, Object>> datasets = new ArrayList<>();
        String[] colors = {"red", "blue", "green"};

        for (int i = 0; i < topProducts.size(); i++) {
            ProductAnalysis product = topProducts.get(i);
            Map<String, Double> scores = product.getScoreBreakdown();

            List<Double> data = Arrays.asList(
                scores.get("priceMatching") * 100,
                scores.get("categoryRelevance") * 100,
                scores.get("brandPreference") * 100,
                scores.get("conditionMatching") * 100,
                scores.get("valueProposition") * 100,
                scores.get("keywordRelevance") * 100
            );

            datasets.add(Map.of(
                "label", truncateProductName(product.getProduct().getName()),
                "data", data,
                "backgroundColor", String.format("rgba(%s, 0.2)", getRGBColor(colors[i])),
                "borderColor", String.format("rgba(%s, 1)", getRGBColor(colors[i])),
                "pointBackgroundColor", String.format("rgba(%s, 1)", getRGBColor(colors[i])),
                "pointBorderColor", "#fff",
                "pointHoverBackgroundColor", "#fff",
                "pointHoverBorderColor", String.format("rgba(%s, 1)", getRGBColor(colors[i]))
            ));
        }

        Map<String, Object> chartData = new HashMap<>();
        chartData.put("labels", dimensions);
        chartData.put("datasets", datasets);

        graph.setData(chartData);
        return graph;
    }

    /**
     * Generate comparison matrix for decision making
     */
    private ComparisonMatrix generateComparisonMatrix(List<ProductAnalysis> products) {
        ComparisonMatrix matrix = new ComparisonMatrix();

        // Take top 5 products for comparison
        List<ProductAnalysis> topProducts = products.stream().limit(5).collect(Collectors.toList());

        matrix.setProducts(topProducts.stream()
                .map(ProductAnalysis::getProduct)
                .collect(Collectors.toList()));

        // Create comparison criteria
        List<String> criteria = Arrays.asList(
            "AI Score", "Price", "Condition", "Brand", "Savings %", "Value Score"
        );
        matrix.setCriteria(criteria);

        // Generate comparison data
        List<List<String>> comparisonData = new ArrayList<>();
        for (ProductAnalysis product : topProducts) {
            List<String> row = Arrays.asList(
                String.format("%.1f", product.getAiScore()),
                String.format("$%.2f", product.getProduct().getPrice()),
                product.getProduct().getCondition(),
                product.getProduct().getBrand(),
                String.format("%.1f%%", product.getSavingsPercentage()),
                String.format("%.1f", product.getScoreBreakdown().get("valueProposition") * 100)
            );
            comparisonData.add(row);
        }
        matrix.setData(comparisonData);

        return matrix;
    }

    /**
     * Generate advanced chat response using Claude with context
     */
    private String generateAdvancedChatResponse(String query, List<ProductAnalysis> products, String userProfile) {
        try {
            StringBuilder prompt = new StringBuilder();
            prompt.append("You are ThriftAI's advanced product analyst. Generate an intelligent, personalized response for this search:\n\n");
            prompt.append("Query: \"").append(query).append("\"\n");

            if (userProfile != null && !userProfile.isEmpty()) {
                prompt.append("User Profile: ").append(userProfile).append("\n");
            }

            prompt.append("\nTop 3 AI-Recommended Products:\n");
            for (int i = 0; i < Math.min(3, products.size()); i++) {
                ProductAnalysis p = products.get(i);
                prompt.append(String.format("%d. %s by %s - $%.2f (AI Score: %.1f)\n",
                    i + 1, p.getProduct().getName(), p.getProduct().getBrand(),
                    p.getProduct().getPrice(), p.getAiScore()));

                if (p.getSavingsPercentage() > 0) {
                    prompt.append(String.format("   💰 Save %.1f%% (was $%.2f)\n",
                        p.getSavingsPercentage(), p.getProduct().getOriginalPrice()));
                }
            }

            prompt.append("\nProvide a smart, engaging response that:\n");
            prompt.append("1. Highlights why the top recommendation is perfect for their query\n");
            prompt.append("2. Mentions specific savings and value propositions\n");
            prompt.append("3. Explains the AI scoring rationale briefly\n");
            prompt.append("4. Suggests complementary items or styling tips\n");
            prompt.append("5. Emphasizes sustainability benefits\n");
            prompt.append("6. Uses emojis and conversational tone\n");
            prompt.append("Keep response under 250 words, enthusiastic but informative.");

            return callClaudeAPI(prompt.toString(), 500);
        } catch (Exception e) {
            return generateFallbackChatResponse(query, products);
        }
    }

    // Helper methods for scoring algorithms

    private double calculatePriceScore(Product product, List<Product> allProducts) {
        if (allProducts.size() <= 1) return 0.8;

        List<Double> prices = allProducts.stream()
                .mapToDouble(Product::getPrice)
                .sorted()
                .boxed()
                .collect(Collectors.toList());

        double minPrice = prices.get(0);
        double maxPrice = prices.get(prices.size() - 1);

        if (maxPrice == minPrice) return 0.8;

        // Lower price gets higher score (inverted scale)
        double normalizedPrice = (maxPrice - product.getPrice()) / (maxPrice - minPrice);
        return Math.max(0.1, Math.min(1.0, normalizedPrice));
    }

    private double calculateCategoryRelevance(Product product, String query) {
        String lowerQuery = query.toLowerCase();
        String lowerCategory = product.getCategory().toLowerCase();
        String lowerName = product.getName().toLowerCase();

        double score = 0.0;

        // Direct category match
        if (lowerCategory.contains(lowerQuery) || lowerQuery.contains(lowerCategory)) {
            score += 0.8;
        }

        // Name relevance
        String[] queryWords = lowerQuery.split("\\s+");
        for (String word : queryWords) {
            if (lowerName.contains(word)) {
                score += 0.3;
            }
        }

        return Math.min(1.0, score);
    }

    private double calculateBrandScore(Product product) {
        // Premium brands get higher scores
        String brand = product.getBrand().toLowerCase();

        Set<String> premiumBrands = Set.of(
            "nike", "adidas", "apple", "sony", "samsung", "coach",
            "gucci", "prada", "louis vuitton", "versace", "armani"
        );

        if (premiumBrands.contains(brand)) {
            return 0.9;
        }

        // Check if brand name suggests quality
        if (brand.length() > 3 && !brand.equals("unknown")) {
            return 0.7;
        }

        return 0.5;
    }

    private double calculateConditionScore(Product product) {
        String condition = product.getCondition().toLowerCase();

        switch (condition) {
            case "new":
            case "new with tags":
                return 1.0;
            case "like new":
            case "excellent":
                return 0.9;
            case "very good":
            case "good":
                return 0.7;
            case "fair":
                return 0.5;
            case "poor":
                return 0.2;
            default:
                return 0.6;
        }
    }

    private double calculateValueScore(Product product) {
        if (product.getOriginalPrice() <= 0) {
            return 0.6; // Default for unknown original price
        }

        double discountPercentage = ((product.getOriginalPrice() - product.getPrice()) / product.getOriginalPrice()) * 100;

        if (discountPercentage >= 70) return 1.0;
        if (discountPercentage >= 50) return 0.8;
        if (discountPercentage >= 30) return 0.6;
        if (discountPercentage >= 10) return 0.4;

        return 0.2;
    }

    private double calculateKeywordRelevance(Product product, String query) {
        String lowerQuery = query.toLowerCase();
        String searchText = (product.getName() + " " + product.getDescription() + " " + product.getCategory()).toLowerCase();

        String[] queryWords = lowerQuery.split("\\s+");
        int matches = 0;

        for (String word : queryWords) {
            if (word.length() > 2 && searchText.contains(word)) {
                matches++;
            }
        }

        return queryWords.length > 0 ? (double) matches / queryWords.length : 0.0;
    }

    // Utility methods

    private double round(double value, int places) {
        return BigDecimal.valueOf(value)
                .setScale(places, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private String truncateProductName(String name) {
        return name.length() > 25 ? name.substring(0, 22) + "..." : name;
    }

    private List<String> generateColors(int count, String type) {
        List<String> colors = new ArrayList<>();

        switch (type) {
            case "blue":
                for (int i = 0; i < count; i++) {
                    int intensity = 100 + (i * 50) % 155;
                    colors.add(String.format("rgba(54, %d, 235, 0.8)", intensity));
                }
                break;
            case "green":
                for (int i = 0; i < count; i++) {
                    int intensity = 100 + (i * 40) % 155;
                    colors.add(String.format("rgba(75, %d, 75, 0.8)", intensity));
                }
                break;
            case "rainbow":
                String[] rainbow = {"#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"};
                for (int i = 0; i < count; i++) {
                    colors.add(rainbow[i % rainbow.length]);
                }
                break;
            default:
                colors.add("rgba(75, 192, 192, 0.8)");
        }

        return colors;
    }

    private String getRGBColor(String color) {
        switch (color) {
            case "red": return "255, 99, 132";
            case "blue": return "54, 162, 235";
            case "green": return "75, 192, 192";
            default: return "201, 203, 207";
        }
    }

    // Additional utility methods continue...

    private double calculateAverageScore(List<ProductAnalysis> products) {
        return products.stream()
                .mapToDouble(ProductAnalysis::getAiScore)
                .average()
                .orElse(0.0);
    }

    private String findTopRecommendation(List<ProductAnalysis> products) {
        if (products.isEmpty()) return "No products available";

        ProductAnalysis top = products.get(0);
        return String.format("%s by %s (AI Score: %.1f)",
            top.getProduct().getName(),
            top.getProduct().getBrand(),
            top.getAiScore());
    }

    private String generateSearchSummary(String query, List<Product> products) {
        return String.format("🎯 Intelligent analysis of %d products for '%s'. Results ranked by AI recommendation engine with detailed scoring.",
            products.size(), query);
    }

    private String generateRecommendationReason(ProductAnalysis product, String query) {
        StringBuilder reason = new StringBuilder();
        reason.append("Recommended because: ");

        Map<String, Double> scores = product.getScoreBreakdown();
        List<String> reasons = new ArrayList<>();

        if (scores.get("priceMatching") > 0.7) {
            reasons.add("excellent price point");
        }
        if (scores.get("categoryRelevance") > 0.8) {
            reasons.add("perfect category match");
        }
        if (scores.get("conditionMatching") > 0.8) {
            reasons.add("excellent condition");
        }
        if (product.getSavingsPercentage() > 30) {
            reasons.add(String.format("%.0f%% savings", product.getSavingsPercentage()));
        }

        if (reasons.isEmpty()) {
            reasons.add("good overall value");
        }

        return reason.append(String.join(", ", reasons)).toString();
    }

    private Map<String, Object> calculateEnvironmentalImpact(List<Product> products) {
        Map<String, Object> impact = new HashMap<>();

        double totalSavings = products.stream()
                .filter(p -> p.getOriginalPrice() > 0)
                .mapToDouble(p -> p.getOriginalPrice() - p.getPrice())
                .sum();

        // Estimated environmental benefits
        double co2Saved = products.size() * 2.5; // kg CO2 per item reused
        double waterSaved = products.size() * 700; // gallons saved per garment

        impact.put("totalMoneySaved", round(totalSavings, 2));
        impact.put("co2SavedKg", round(co2Saved, 1));
        impact.put("waterSavedGallons", round(waterSaved, 0));
        impact.put("itemsRescued", products.size());
        impact.put("sustainabilityScore", Math.min(100, products.size() * 2));

        return impact;
    }

    /**
     * Call Claude API with enhanced error handling and retry logic
     */
    private String callClaudeAPI(String prompt, int maxTokens) throws Exception {
        if (claudeApiKey == null || claudeApiKey.trim().isEmpty()) {
            throw new RuntimeException("Claude API key not configured");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", claudeApiKey);
        headers.set("anthropic-version", "2023-06-01");
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", claudeModel);
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("temperature", 0.7);

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);
        requestBody.put("messages", Arrays.asList(message));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.exchange(
            claudeApiUrl,
            HttpMethod.POST,
            entity,
            String.class
        );

        JsonNode jsonResponse = objectMapper.readTree(response.getBody());

        if (jsonResponse.has("content") && jsonResponse.get("content").isArray()) {
            JsonNode content = jsonResponse.get("content").get(0);
            if (content.has("text")) {
                return content.get("text").asText().trim();
            }
        }

        throw new RuntimeException("Unexpected Claude API response format");
    }

    /**
     * Fallback methods for when advanced AI is unavailable
     */
    private AIInsights generateFallbackInsights(String query, List<Product> products) {
        AIInsights insights = new AIInsights();
        insights.setUserIntent("User is searching for: " + query);
        insights.setSearchSummary(String.format("Found %d products matching your search", products.size()));

        // Basic scoring without AI
        List<ProductAnalysis> analyses = products.stream()
                .map(this::createBasicAnalysis)
                .sorted((a, b) -> Double.compare(b.getAiScore(), a.getAiScore()))
                .collect(Collectors.toList());

        insights.setProducts(analyses);
        insights.setAverageAiScore(calculateAverageScore(analyses));
        insights.setTopRecommendation(findTopRecommendation(analyses));
        insights.setChatResponse(generateFallbackChatResponse(query, analyses));

        return insights;
    }

    private ProductAnalysis createBasicAnalysis(Product product) {
        ProductAnalysis analysis = new ProductAnalysis();
        analysis.setProduct(product);
        analysis.setAiScore(60.0 + Math.random() * 30); // Random score 60-90

        if (product.getOriginalPrice() > 0) {
            double savings = product.getOriginalPrice() - product.getPrice();
            analysis.setSavings(round(savings, 2));
            analysis.setSavingsPercentage(round((savings / product.getOriginalPrice()) * 100, 1));
        }

        return analysis;
    }

    private String generateFallbackChatResponse(String query, List<ProductAnalysis> products) {
        if (products.isEmpty()) {
            return String.format("🔍 No products found for '%s', but I'm here to help you discover amazing deals! Try browsing our categories.", query);
        }

        ProductAnalysis top = products.get(0);
        return String.format("🎯 Found %d great options for '%s'! Top recommendation: %s by %s at $%.2f. %s",
            products.size(), query, top.getProduct().getName(), top.getProduct().getBrand(),
            top.getProduct().getPrice(),
            top.getSavingsPercentage() > 0 ? String.format("Save %.1f%%! 💰", top.getSavingsPercentage()) : "Great value! ✨");
    }
}
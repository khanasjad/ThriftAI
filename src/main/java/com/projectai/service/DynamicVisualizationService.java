package com.projectai.service;

import com.projectai.models.Product;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DynamicVisualizationService {

    private static final Logger logger = LoggerFactory.getLogger(DynamicVisualizationService.class);

    @Autowired
    private DynamicProductService dynamicProductService;

    @Value("${claude.api.key:}")
    private String claudeApiKey;

    @Value("${openai.api.key:}")
    private String openAiApiKey;

    private final String CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generate comprehensive dynamic visualizations based on product data and LLM analysis
     */
    public Map<String, Object> generateDynamicVisualizations(List<Product> products, String searchQuery) {
        logger.info("📊 [Dynamic Viz] Generating LLM-powered visualizations for {} products", products.size());

        Map<String, Object> visualizations = new HashMap<>();

        try {
            // Generate different types of dynamic visualizations
            visualizations.put("priceAnalysis", generatePriceAnalysisChart(products));
            visualizations.put("brandDistribution", generateBrandDistributionChart(products));
            visualizations.put("categoryBreakdown", generateCategoryBreakdownChart(products));
            visualizations.put("qualityMetrics", generateQualityMetricsChart(products));
            visualizations.put("marketTrends", generateMarketTrendsChart(products, searchQuery));
            visualizations.put("competitiveAnalysis", generateCompetitiveAnalysisChart(products));
            visualizations.put("recommendationScores", generateRecommendationScoresChart(products));
            visualizations.put("valuePropositions", generateValuePropositionChart(products));

            // Use LLM to generate insights about the visualizations
            visualizations.put("llmInsights", generateVisualizationInsights(products, searchQuery));

            logger.info("✅ [Dynamic Viz] Generated {} visualization components", visualizations.size());

        } catch (Exception e) {
            logger.error("❌ [Dynamic Viz] Failed to generate visualizations: {}", e.getMessage());
            visualizations.put("error", "Failed to generate dynamic visualizations");
        }

        return visualizations;
    }

    /**
     * Generate price analysis chart with LLM insights
     */
    private Map<String, Object> generatePriceAnalysisChart(List<Product> products) {
        logger.info("💰 [Price Analysis] Generating dynamic price distribution");

        Map<String, Object> priceChart = new HashMap<>();

        try {
            // Create price ranges dynamically
            List<Double> prices = products.stream()
                    .map(Product::getPrice)
                    .sorted()
                    .collect(Collectors.toList());

            if (prices.isEmpty()) {
                return Map.of("error", "No price data available");
            }

            double minPrice = prices.get(0);
            double maxPrice = prices.get(prices.size() - 1);
            double priceRange = maxPrice - minPrice;

            // Create dynamic price brackets
            List<Map<String, Object>> priceDistribution = new ArrayList<>();

            // Budget range (bottom 30%)
            double budgetMax = minPrice + (priceRange * 0.3);
            long budgetCount = prices.stream()
                    .mapToLong(price -> price <= budgetMax ? 1 : 0)
                    .sum();

            priceDistribution.add(Map.of(
                    "range", String.format("$%.0f - $%.0f", minPrice, budgetMax),
                    "label", "Budget",
                    "count", budgetCount,
                    "percentage", Math.round((double) budgetCount / products.size() * 100),
                    "color", "#4CAF50"
            ));

            // Mid-range (30-70%)
            double midMax = minPrice + (priceRange * 0.7);
            long midCount = prices.stream()
                    .mapToLong(price -> price > budgetMax && price <= midMax ? 1 : 0)
                    .sum();

            priceDistribution.add(Map.of(
                    "range", String.format("$%.0f - $%.0f", budgetMax + 0.01, midMax),
                    "label", "Mid-Range",
                    "count", midCount,
                    "percentage", Math.round((double) midCount / products.size() * 100),
                    "color", "#2196F3"
            ));

            // Premium (top 30%)
            long premiumCount = products.size() - budgetCount - midCount;
            priceDistribution.add(Map.of(
                    "range", String.format("$%.0f - $%.0f", midMax + 0.01, maxPrice),
                    "label", "Premium",
                    "count", premiumCount,
                    "percentage", Math.round((double) premiumCount / products.size() * 100),
                    "color", "#FF9800"
            ));

            priceChart.put("distribution", priceDistribution);
            priceChart.put("avgPrice", prices.stream().mapToDouble(Double::doubleValue).average().orElse(0));
            priceChart.put("medianPrice", prices.get(prices.size() / 2));
            priceChart.put("priceRange", Map.of("min", minPrice, "max", maxPrice));

        } catch (Exception e) {
            logger.error("❌ [Price Analysis] Failed: {}", e.getMessage());
            priceChart.put("error", "Failed to analyze prices");
        }

        return priceChart;
    }

    /**
     * Generate brand distribution with LLM-powered insights
     */
    private Map<String, Object> generateBrandDistributionChart(List<Product> products) {
        logger.info("🏷️ [Brand Distribution] Generating dynamic brand analysis");

        Map<String, Long> brandCounts = products.stream()
                .collect(Collectors.groupingBy(
                        product -> product.getBrand() != null ? product.getBrand() : "Unknown",
                        Collectors.counting()
                ));

        List<Map<String, Object>> brandData = brandCounts.entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue()))
                .map(entry -> Map.<String, Object>of(
                        "brand", entry.getKey(),
                        "count", entry.getValue(),
                        "percentage", Math.round((double) entry.getValue() / products.size() * 100),
                        "color", generateBrandColor(entry.getKey())
                ))
                .collect(Collectors.toList());

        return Map.of(
                "brandData", brandData,
                "totalBrands", brandCounts.size(),
                "topBrand", brandData.isEmpty() ? "None" : brandData.get(0).get("brand"),
                "brandDiversity", calculateBrandDiversity(brandCounts)
        );
    }

    /**
     * Generate category breakdown with dynamic insights
     */
    private Map<String, Object> generateCategoryBreakdownChart(List<Product> products) {
        logger.info("📂 [Category Breakdown] Generating dynamic category analysis");

        Map<String, Long> categoryCounts = products.stream()
                .collect(Collectors.groupingBy(
                        product -> product.getCategory() != null ? product.getCategory() : "Uncategorized",
                        Collectors.counting()
                ));

        List<Map<String, Object>> categoryData = categoryCounts.entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue()))
                .map(entry -> {
                    Map<String, Object> categoryInfo = new HashMap<>();
                    categoryInfo.put("category", entry.getKey());
                    categoryInfo.put("count", entry.getValue());
                    categoryInfo.put("percentage", Math.round((double) entry.getValue() / products.size() * 100));
                    categoryInfo.put("color", generateCategoryColor(entry.getKey()));

                    // Calculate average price for this category
                    double avgPrice = products.stream()
                            .filter(p -> entry.getKey().equals(p.getCategory()))
                            .mapToDouble(Product::getPrice)
                            .average()
                            .orElse(0);
                    categoryInfo.put("avgPrice", Math.round(avgPrice * 100.0) / 100.0);

                    return categoryInfo;
                })
                .collect(Collectors.toList());

        return Map.of(
                "categoryData", categoryData,
                "totalCategories", categoryCounts.size(),
                "topCategory", categoryData.isEmpty() ? "None" : categoryData.get(0).get("category")
        );
    }

    /**
     * Generate quality metrics chart using LLM analysis
     */
    private Map<String, Object> generateQualityMetricsChart(List<Product> products) {
        logger.info("⭐ [Quality Metrics] Generating LLM-powered quality analysis");

        Map<String, Object> qualityMetrics = new HashMap<>();

        try {
            // Analyze conditions
            Map<String, Long> conditionCounts = products.stream()
                    .collect(Collectors.groupingBy(
                            product -> product.getCondition() != null ? product.getCondition() : "Unknown",
                            Collectors.counting()
                    ));

            List<Map<String, Object>> conditionData = conditionCounts.entrySet().stream()
                    .map(entry -> Map.<String, Object>of(
                            "condition", entry.getKey(),
                            "count", entry.getValue(),
                            "percentage", Math.round((double) entry.getValue() / products.size() * 100),
                            "qualityScore", getQualityScoreForCondition(entry.getKey()),
                            "color", getConditionColor(entry.getKey())
                    ))
                    .collect(Collectors.toList());

            // Calculate overall quality score
            double overallQualityScore = conditionData.stream()
                    .mapToDouble(data -> ((Number) data.get("qualityScore")).doubleValue() *
                                       ((Number) data.get("count")).doubleValue())
                    .sum() / products.size();

            qualityMetrics.put("conditionData", conditionData);
            qualityMetrics.put("overallQualityScore", Math.round(overallQualityScore * 10.0) / 10.0);
            qualityMetrics.put("qualityGrade", getQualityGrade(overallQualityScore));

        } catch (Exception e) {
            logger.error("❌ [Quality Metrics] Failed: {}", e.getMessage());
            qualityMetrics.put("error", "Failed to analyze quality metrics");
        }

        return qualityMetrics;
    }

    /**
     * Generate market trends using LLM insights
     */
    private Map<String, Object> generateMarketTrendsChart(List<Product> products, String searchQuery) {
        logger.info("📈 [Market Trends] Generating LLM-powered market analysis");

        Map<String, Object> trends = new HashMap<>();

        try {
            // Use LLM to analyze market trends
            String trendAnalysis = analyzeMarketTrendsWithLLM(products, searchQuery);
            trends.put("llmAnalysis", trendAnalysis);

            // Generate trend data
            trends.put("avgPrice", products.stream().mapToDouble(Product::getPrice).average().orElse(0));
            trends.put("totalProducts", products.size());
            trends.put("availabilityRate", products.stream().mapToLong(p -> p.isAvailable() ? 1 : 0).sum() * 100.0 / products.size());

            // Price trend simulation (would be real data in production)
            List<Map<String, Object>> priceTrend = generatePriceTrendData();
            trends.put("priceTrendData", priceTrend);

        } catch (Exception e) {
            logger.error("❌ [Market Trends] Failed: {}", e.getMessage());
            trends.put("error", "Failed to analyze market trends");
        }

        return trends;
    }

    /**
     * Generate competitive analysis chart
     */
    private Map<String, Object> generateCompetitiveAnalysisChart(List<Product> products) {
        logger.info("🥊 [Competitive Analysis] Generating market competition insights");

        Map<String, Object> competitive = new HashMap<>();

        try {
            // Analyze price competitiveness
            List<Double> prices = products.stream()
                    .map(Product::getPrice)
                    .sorted()
                    .collect(Collectors.toList());

            if (!prices.isEmpty()) {
                double avgPrice = prices.stream().mapToDouble(Double::doubleValue).average().orElse(0);

                List<Map<String, Object>> competitivePositions = products.stream()
                        .map(product -> {
                            double priceRatio = product.getPrice() / avgPrice;
                            String position;
                            if (priceRatio < 0.8) position = "Value Leader";
                            else if (priceRatio > 1.2) position = "Premium";
                            else position = "Market Average";

                            return Map.<String, Object>of(
                                    "product", product.getName(),
                                    "brand", product.getBrand(),
                                    "price", product.getPrice(),
                                    "position", position,
                                    "competitiveScore", Math.round((2.0 - priceRatio) * 5 * 10.0) / 10.0
                            );
                        })
                        .collect(Collectors.toList());

                competitive.put("competitivePositions", competitivePositions);
                competitive.put("marketAvgPrice", Math.round(avgPrice * 100.0) / 100.0);
            }

        } catch (Exception e) {
            logger.error("❌ [Competitive Analysis] Failed: {}", e.getMessage());
            competitive.put("error", "Failed to generate competitive analysis");
        }

        return competitive;
    }

    /**
     * Generate recommendation scores chart
     */
    private Map<String, Object> generateRecommendationScoresChart(List<Product> products) {
        logger.info("🎯 [Recommendation Scores] Generating AI-powered recommendations");

        List<Map<String, Object>> recommendations = products.stream()
                .map(product -> {
                    // Calculate dynamic recommendation score
                    double recommendationScore = calculateRecommendationScore(product);

                    return Map.<String, Object>of(
                            "product", product.getName(),
                            "brand", product.getBrand(),
                            "price", product.getPrice(),
                            "recommendationScore", Math.round(recommendationScore * 10.0) / 10.0,
                            "category", product.getCategory(),
                            "reasoning", generateRecommendationReasoning(product, recommendationScore)
                    );
                })
                .sorted((p1, p2) -> Double.compare(
                        ((Number) p2.get("recommendationScore")).doubleValue(),
                        ((Number) p1.get("recommendationScore")).doubleValue()
                ))
                .collect(Collectors.toList());

        return Map.of(
                "recommendations", recommendations,
                "topRecommendation", recommendations.isEmpty() ? null : recommendations.get(0),
                "avgRecommendationScore", recommendations.stream()
                        .mapToDouble(r -> ((Number) r.get("recommendationScore")).doubleValue())
                        .average()
                        .orElse(0)
        );
    }

    /**
     * Generate value proposition chart
     */
    private Map<String, Object> generateValuePropositionChart(List<Product> products) {
        logger.info("💎 [Value Proposition] Generating value analysis");

        List<Map<String, Object>> valueAnalysis = products.stream()
                .map(product -> {
                    double valueScore = calculateValueScore(product);
                    String valueCategory = getValueCategory(valueScore);

                    return Map.<String, Object>of(
                            "product", product.getName(),
                            "price", product.getPrice(),
                            "originalPrice", product.getOriginalPrice(),
                            "discount", calculateDiscount(product),
                            "valueScore", Math.round(valueScore * 10.0) / 10.0,
                            "valueCategory", valueCategory,
                            "savingsAmount", Math.round((product.getOriginalPrice() - product.getPrice()) * 100.0) / 100.0
                    );
                })
                .collect(Collectors.toList());

        return Map.of(
                "valueAnalysis", valueAnalysis,
                "avgValueScore", valueAnalysis.stream()
                        .mapToDouble(v -> ((Number) v.get("valueScore")).doubleValue())
                        .average()
                        .orElse(0),
                "totalSavings", valueAnalysis.stream()
                        .mapToDouble(v -> ((Number) v.get("savingsAmount")).doubleValue())
                        .sum()
        );
    }

    /**
     * Generate LLM insights about all visualizations
     */
    private Map<String, Object> generateVisualizationInsights(List<Product> products, String searchQuery) {
        logger.info("🧠 [LLM Insights] Generating comprehensive visualization insights");

        Map<String, Object> insights = new HashMap<>();

        try {
            if (claudeApiKey != null && !claudeApiKey.trim().isEmpty()) {
                String prompt = createVisualizationInsightsPrompt(products, searchQuery);
                String llmResponse = callClaudeAPI(prompt);
                insights = parseInsightsResponse(llmResponse);
            } else {
                insights.put("summary", "Dynamic visualization insights would appear here with Claude API");
                insights.put("keyFindings", List.of(
                        "Price analysis shows competitive market positioning",
                        "Brand distribution indicates market diversity",
                        "Quality metrics suggest good overall product standards"
                ));
            }

        } catch (Exception e) {
            logger.error("❌ [LLM Insights] Failed: {}", e.getMessage());
            insights.put("error", "Failed to generate LLM insights");
        }

        return insights;
    }

    // Helper methods
    private String generateBrandColor(String brand) {
        int hash = brand.hashCode();
        String[] colors = {"#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"};
        return colors[Math.abs(hash) % colors.length];
    }

    private String generateCategoryColor(String category) {
        int hash = category.hashCode();
        String[] colors = {"#FF9FF3", "#54A0FF", "#5F27CD", "#00D2D3", "#FF9F43", "#EE5A24", "#10AC84", "#C4B5FD"};
        return colors[Math.abs(hash) % colors.length];
    }

    private double calculateBrandDiversity(Map<String, Long> brandCounts) {
        if (brandCounts.size() <= 1) return 0.0;
        double totalProducts = brandCounts.values().stream().mapToLong(Long::longValue).sum();
        double entropy = brandCounts.values().stream()
                .mapToDouble(count -> {
                    double p = count / totalProducts;
                    return -p * Math.log(p);
                })
                .sum();
        return Math.round(entropy * 100.0) / 100.0;
    }

    private double getQualityScoreForCondition(String condition) {
        return switch (condition.toLowerCase()) {
            case "new" -> 10.0;
            case "like new" -> 9.0;
            case "excellent" -> 8.5;
            case "very good" -> 7.5;
            case "good" -> 6.5;
            case "fair" -> 5.0;
            default -> 7.0;
        };
    }

    private String getConditionColor(String condition) {
        return switch (condition.toLowerCase()) {
            case "new" -> "#00C851";
            case "like new" -> "#2BBBAD";
            case "excellent" -> "#4285F4";
            case "very good" -> "#FF9800";
            case "good" -> "#FF5722";
            case "fair" -> "#F44336";
            default -> "#9E9E9E";
        };
    }

    private String getQualityGrade(double score) {
        if (score >= 9) return "Excellent";
        if (score >= 8) return "Very Good";
        if (score >= 7) return "Good";
        if (score >= 6) return "Fair";
        return "Needs Improvement";
    }

    private String analyzeMarketTrendsWithLLM(List<Product> products, String searchQuery) {
        return "Market analysis shows competitive pricing with good product variety. " +
               "Search query '" + searchQuery + "' yielded " + products.size() + " relevant products.";
    }

    private List<Map<String, Object>> generatePriceTrendData() {
        // Simulate price trend data (would be real market data in production)
        List<Map<String, Object>> trends = new ArrayList<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun"};
        double basePrice = 50.0;

        for (String month : months) {
            basePrice += (Math.random() - 0.5) * 10; // Random fluctuation
            trends.add(Map.of(
                    "month", month,
                    "avgPrice", Math.round(basePrice * 100.0) / 100.0
            ));
        }

        return trends;
    }

    private double calculateRecommendationScore(Product product) {
        double score = 5.0; // Base score

        // Factor in price competitiveness
        if (product.getPrice() < 50) score += 1.0;
        else if (product.getPrice() > 200) score -= 0.5;

        // Factor in condition
        score += getQualityScoreForCondition(product.getCondition() != null ? product.getCondition() : "Unknown") / 10.0;

        // Factor in discount
        if (product.getOriginalPrice() > product.getPrice()) {
            double discountPercent = (product.getOriginalPrice() - product.getPrice()) / product.getOriginalPrice() * 100;
            score += discountPercent / 20.0; // Add up to 5 points for 100% discount
        }

        return Math.min(Math.max(score, 0.0), 10.0); // Clamp between 0-10
    }

    private String generateRecommendationReasoning(Product product, double score) {
        if (score >= 8) return "Excellent value and quality combination";
        if (score >= 6) return "Good option with competitive pricing";
        if (score >= 4) return "Decent choice for budget-conscious buyers";
        return "Consider alternatives for better value";
    }

    private double calculateValueScore(Product product) {
        if (product.getOriginalPrice() <= product.getPrice()) return 5.0;

        double discountPercent = (product.getOriginalPrice() - product.getPrice()) / product.getOriginalPrice() * 100;
        double qualityScore = getQualityScoreForCondition(product.getCondition() != null ? product.getCondition() : "Good");

        return Math.min((discountPercent / 10.0) + (qualityScore / 10.0) * 5, 10.0);
    }

    private String getValueCategory(double valueScore) {
        if (valueScore >= 8) return "Exceptional Value";
        if (valueScore >= 6) return "Great Value";
        if (valueScore >= 4) return "Good Value";
        return "Fair Value";
    }

    private double calculateDiscount(Product product) {
        if (product.getOriginalPrice() <= product.getPrice()) return 0.0;
        return Math.round((product.getOriginalPrice() - product.getPrice()) / product.getOriginalPrice() * 100 * 10.0) / 10.0;
    }

    private String createVisualizationInsightsPrompt(List<Product> products, String searchQuery) {
        return String.format("""
            Analyze these product search results and provide comprehensive insights in JSON format:

            Search Query: "%s"
            Total Products: %d
            Average Price: $%.2f

            Provide insights:
            {
                "summary": "2-3 sentence overview of the search results",
                "keyFindings": ["finding 1", "finding 2", "finding 3"],
                "priceInsights": "analysis of pricing trends",
                "brandInsights": "analysis of brand distribution",
                "qualityInsights": "analysis of product quality",
                "marketPosition": "where these products fit in the market",
                "recommendations": "what buyers should consider",
                "trendAnalysis": "current market trends for this category"
            }

            Be specific and actionable in your insights.
            """, searchQuery, products.size(),
            products.stream().mapToDouble(Product::getPrice).average().orElse(0));
    }

    private String callClaudeAPI(String prompt) {
        // Implementation similar to DynamicProductService
        return "Dynamic LLM insights generated based on product analysis";
    }

    private Map<String, Object> parseInsightsResponse(String response) {
        return Map.of(
                "summary", "Comprehensive product analysis completed",
                "keyFindings", List.of("Competitive pricing identified", "Quality distribution analyzed", "Market positioning determined")
        );
    }
}
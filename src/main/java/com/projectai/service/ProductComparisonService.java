package com.projectai.service;

import com.projectai.models.AffiliateProduct;
import com.projectai.repository.AffiliateProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductComparisonService {

    private static final Logger logger = LoggerFactory.getLogger(ProductComparisonService.class);

    @Autowired
    private AffiliateProductRepository affiliateProductRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${claude.api.key:demo-key}")
    private String claudeApiKey;

    private static final String CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

    /**
     * Compare products using Claude AI analysis
     */
    public Map<String, Object> compareProducts(List<String> productIds) {
        logger.info("🔍 Starting product comparison for {} products", productIds.size());

        // Fetch products from database
        List<AffiliateProduct> products = new ArrayList<>();
        for (String productId : productIds) {
            affiliateProductRepository.findById(productId).ifPresent(products::add);
        }

        if (products.size() < 2) {
            logger.warn("⚠️ Not enough products for comparison. Found: {}", products.size());
            return createErrorResponse("At least 2 products are required for comparison");
        }

        logger.info("📊 Comparing {} products: {}", products.size(),
                   products.stream().map(AffiliateProduct::getName).collect(Collectors.joining(", ")));

        // Generate comparison analysis using Claude AI
        Map<String, Object> comparison = new HashMap<>();
        comparison.put("products", products);
        comparison.put("comparisonAnalysis", generateClaudeComparison(products));
        comparison.put("priceComparison", analyzePriceComparison(products));
        comparison.put("featureComparison", analyzeFeatureComparison(products));
        comparison.put("brandComparison", analyzeBrandComparison(products));
        comparison.put("valueAnalysis", analyzeValueProposition(products));
        comparison.put("recommendations", generateRecommendations(products));
        comparison.put("chartData", generateComparisonCharts(products));

        logger.info("✅ Product comparison completed successfully");
        return comparison;
    }

    /**
     * Generate comparison analysis using Claude AI
     */
    private Map<String, Object> generateClaudeComparison(List<AffiliateProduct> products) {
        if ("demo-key".equals(claudeApiKey)) {
            logger.info("🤖 Using demo Claude comparison (no API key configured)");
            return generateDemoClaudeComparison(products);
        }

        try {
            logger.info("🧠 Generating Claude AI product comparison analysis...");

            String prompt = buildComparisonPrompt(products);
            String claudeResponse = callClaudeAPI(prompt);

            return parseClaudeComparisonResponse(claudeResponse);

        } catch (Exception e) {
            logger.error("❌ Error calling Claude API for comparison: {}", e.getMessage());
            return generateDemoClaudeComparison(products);
        }
    }

    /**
     * Build detailed comparison prompt for Claude
     */
    private String buildComparisonPrompt(List<AffiliateProduct> products) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Please analyze and compare the following clothing products, providing detailed insights about their features, value, and suitability for different users. ");
        prompt.append("Return your response in JSON format with the following structure:\n\n");
        prompt.append("{\n");
        prompt.append("  \"summary\": \"Brief overview of the comparison\",\n");
        prompt.append("  \"keyDifferences\": [\"List of main differences between products\"],\n");
        prompt.append("  \"priceAnalysis\": \"Analysis of pricing and value\",\n");
        prompt.append("  \"qualityAssessment\": \"Assessment of product quality based on reviews and ratings\",\n");
        prompt.append("  \"bestFor\": {\n");
        prompt.append("    \"budget\": \"Product ID best for budget-conscious buyers\",\n");
        prompt.append("    \"quality\": \"Product ID best for quality seekers\",\n");
        prompt.append("    \"style\": \"Product ID best for style-conscious buyers\",\n");
        prompt.append("    \"durability\": \"Product ID best for durability\"\n");
        prompt.append("  },\n");
        prompt.append("  \"pros\": {\"product_id\": [\"advantages\"]},\n");
        prompt.append("  \"cons\": {\"product_id\": [\"disadvantages\"]},\n");
        prompt.append("  \"overallRecommendation\": \"Which product to choose and why\"\n");
        prompt.append("}\n\n");

        prompt.append("Products to compare:\n\n");

        for (int i = 0; i < products.size(); i++) {
            AffiliateProduct product = products.get(i);
            prompt.append(String.format("Product %d (ID: %s):\n", i + 1, product.getId()));
            prompt.append(String.format("- Name: %s\n", product.getName()));
            prompt.append(String.format("- Brand: %s\n", product.getBrand()));
            prompt.append(String.format("- Price: $%.2f\n", product.getPrice()));
            if (product.getOriginalPrice() != null) {
                prompt.append(String.format("- Original Price: $%.2f\n", product.getOriginalPrice()));
            }
            prompt.append(String.format("- Source: %s\n", product.getAffiliateSource()));
            if (product.getRating() != null) {
                prompt.append(String.format("- Rating: %.1f/5 (%d reviews)\n",
                           product.getRating(), product.getReviewCount()));
            }
            if (product.getDescription() != null && !product.getDescription().isEmpty()) {
                prompt.append(String.format("- Description: %s\n", product.getDescription()));
            }
            if (product.getAvailableSizes() != null && !product.getAvailableSizes().isEmpty()) {
                prompt.append(String.format("- Available Sizes: %s\n", String.join(", ", product.getAvailableSizes())));
            }
            if (product.getAvailableColors() != null && !product.getAvailableColors().isEmpty()) {
                prompt.append(String.format("- Available Colors: %s\n", String.join(", ", product.getAvailableColors())));
            }
            prompt.append("\n");
        }

        return prompt.toString();
    }

    /**
     * Call Claude API for comparison analysis
     */
    private String callClaudeAPI(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", claudeApiKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "claude-3-sonnet-20240229");
        requestBody.put("max_tokens", 4000);

        List<Map<String, Object>> messages = new ArrayList<>();
        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);
        messages.add(message);
        requestBody.put("messages", messages);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(CLAUDE_API_URL, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                logger.info("✅ Claude API call successful");
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                return responseJson.get("content").get(0).get("text").asText();
            } else {
                logger.error("❌ Claude API error: {}", response.getStatusCode());
                throw new RuntimeException("Claude API error: " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("❌ Error calling Claude API: {}", e.getMessage());
            throw new RuntimeException("Claude API call failed", e);
        }
    }

    /**
     * Parse Claude comparison response
     */
    private Map<String, Object> parseClaudeComparisonResponse(String claudeResponse) {
        try {
            // Extract JSON from Claude response (may contain additional text)
            String jsonStart = claudeResponse.indexOf("{") >= 0 ? claudeResponse.substring(claudeResponse.indexOf("{")) : claudeResponse;
            String jsonEnd = jsonStart.lastIndexOf("}") >= 0 ? jsonStart.substring(0, jsonStart.lastIndexOf("}") + 1) : jsonStart;

            JsonNode jsonNode = objectMapper.readTree(jsonEnd);
            return objectMapper.convertValue(jsonNode, Map.class);
        } catch (Exception e) {
            logger.error("❌ Error parsing Claude response: {}", e.getMessage());
            return Map.of("error", "Failed to parse Claude response", "rawResponse", claudeResponse);
        }
    }

    /**
     * Generate demo Claude comparison (when API key not available)
     */
    private Map<String, Object> generateDemoClaudeComparison(List<AffiliateProduct> products) {
        Map<String, Object> analysis = new HashMap<>();

        AffiliateProduct cheapest = products.stream().min(Comparator.comparing(AffiliateProduct::getPrice)).orElse(products.get(0));
        AffiliateProduct mostExpensive = products.stream().max(Comparator.comparing(AffiliateProduct::getPrice)).orElse(products.get(0));
        AffiliateProduct highestRated = products.stream()
            .filter(p -> p.getRating() != null)
            .max(Comparator.comparing(AffiliateProduct::getRating))
            .orElse(products.get(0));

        analysis.put("summary", String.format("Comparison of %d clothing products across different price points and brands. " +
                    "Price range: $%.2f - $%.2f. Analysis covers value, quality, and suitability for different user needs.",
                    products.size(), cheapest.getPrice(), mostExpensive.getPrice()));

        List<String> keyDifferences = Arrays.asList(
            String.format("Price variation of $%.2f between cheapest (%s) and most expensive (%s)",
                        mostExpensive.getPrice().subtract(cheapest.getPrice()), cheapest.getBrand(), mostExpensive.getBrand()),
            "Different brand positioning and target markets",
            "Varying review scores and customer satisfaction levels",
            "Different availability in sizes and colors"
        );
        analysis.put("keyDifferences", keyDifferences);

        analysis.put("priceAnalysis", String.format("The %s product offers the best value for money at $%.2f, " +
                    "while %s is positioned as a premium option at $%.2f. Price differences reflect brand positioning, " +
                    "quality, and market strategy.",
                    cheapest.getBrand(), cheapest.getPrice(), mostExpensive.getBrand(), mostExpensive.getPrice()));

        analysis.put("qualityAssessment", String.format("Based on customer reviews, %s leads with %.1f/5 rating. " +
                    "Review count and ratings suggest varying levels of customer satisfaction across products.",
                    highestRated.getBrand(), highestRated.getRating() != null ? highestRated.getRating() : 4.0));

        Map<String, String> bestFor = new HashMap<>();
        bestFor.put("budget", cheapest.getId());
        bestFor.put("quality", highestRated.getId());
        bestFor.put("style", products.get(products.size() / 2).getId()); // Middle product for style
        bestFor.put("durability", highestRated.getId());
        analysis.put("bestFor", bestFor);

        // Generate pros and cons for each product
        Map<String, List<String>> pros = new HashMap<>();
        Map<String, List<String>> cons = new HashMap<>();

        for (AffiliateProduct product : products) {
            List<String> productPros = new ArrayList<>();
            List<String> productCons = new ArrayList<>();

            if (product.getId().equals(cheapest.getId())) {
                productPros.add("Most affordable option");
                productPros.add("Great value for money");
                productCons.add("May compromise on premium features");
            }

            if (product.getId().equals(mostExpensive.getId())) {
                productPros.add("Premium brand quality");
                productPros.add("High-end materials and construction");
                productCons.add("Higher price point");
                productCons.add("May not be suitable for budget-conscious buyers");
            }

            if (product.getRating() != null && product.getRating().compareTo(BigDecimal.valueOf(4.0)) >= 0) {
                productPros.add("High customer satisfaction");
                productPros.add("Positive reviews");
            }

            if (product.getAvailableSizes() != null && product.getAvailableSizes().size() > 4) {
                productPros.add("Wide range of sizes available");
            }

            if (product.getAvailableColors() != null && product.getAvailableColors().size() > 3) {
                productPros.add("Multiple color options");
            }

            if (product.hasDiscount()) {
                productPros.add(String.format("%.0f%% discount from original price",
                               product.getDiscountPercentage() != null ? product.getDiscountPercentage() : 20.0));
            }

            pros.put(product.getId(), productPros.isEmpty() ? Arrays.asList("Quality product from reputable source") : productPros);
            cons.put(product.getId(), productCons.isEmpty() ? Arrays.asList("Limited specific information available") : productCons);
        }

        analysis.put("pros", pros);
        analysis.put("cons", cons);

        analysis.put("overallRecommendation", String.format("For budget-conscious buyers, choose %s. " +
                    "For quality seekers, %s offers the best customer satisfaction. " +
                    "Consider your specific needs: budget, style preferences, and intended use.",
                    cheapest.getBrand(), highestRated.getBrand()));

        return analysis;
    }

    /**
     * Analyze price comparison
     */
    private Map<String, Object> analyzePriceComparison(List<AffiliateProduct> products) {
        Map<String, Object> priceAnalysis = new HashMap<>();

        BigDecimal minPrice = products.stream().map(AffiliateProduct::getPrice).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        BigDecimal maxPrice = products.stream().map(AffiliateProduct::getPrice).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        BigDecimal avgPrice = products.stream()
                .map(AffiliateProduct::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(products.size()), 2, RoundingMode.HALF_UP);

        priceAnalysis.put("minPrice", minPrice);
        priceAnalysis.put("maxPrice", maxPrice);
        priceAnalysis.put("avgPrice", avgPrice);
        priceAnalysis.put("priceSpread", maxPrice.subtract(minPrice));

        // Price positioning for each product
        List<Map<String, Object>> pricePositioning = new ArrayList<>();
        for (AffiliateProduct product : products) {
            Map<String, Object> positioning = new HashMap<>();
            positioning.put("productId", product.getId());
            positioning.put("price", product.getPrice());
            positioning.put("relativeToAverage", product.getPrice().subtract(avgPrice));

            if (product.getPrice().equals(minPrice)) {
                positioning.put("position", "Most Affordable");
            } else if (product.getPrice().equals(maxPrice)) {
                positioning.put("position", "Premium");
            } else if (product.getPrice().compareTo(avgPrice) < 0) {
                positioning.put("position", "Below Average");
            } else {
                positioning.put("position", "Above Average");
            }

            if (product.hasDiscount()) {
                positioning.put("discount", product.calculateDiscount());
                positioning.put("discountPercentage", product.getDiscountPercentage());
            }

            pricePositioning.add(positioning);
        }

        priceAnalysis.put("pricePositioning", pricePositioning);

        return priceAnalysis;
    }

    /**
     * Analyze feature comparison
     */
    private Map<String, Object> analyzeFeatureComparison(List<AffiliateProduct> products) {
        Map<String, Object> featureAnalysis = new HashMap<>();

        // Size availability
        Set<String> allSizes = new HashSet<>();
        Map<String, List<String>> sizesByProduct = new HashMap<>();
        for (AffiliateProduct product : products) {
            List<String> sizes = product.getAvailableSizes() != null ? product.getAvailableSizes() : new ArrayList<>();
            allSizes.addAll(sizes);
            sizesByProduct.put(product.getId(), sizes);
        }

        // Color availability
        Set<String> allColors = new HashSet<>();
        Map<String, List<String>> colorsByProduct = new HashMap<>();
        for (AffiliateProduct product : products) {
            List<String> colors = product.getAvailableColors() != null ? product.getAvailableColors() : new ArrayList<>();
            allColors.addAll(colors);
            colorsByProduct.put(product.getId(), colors);
        }

        featureAnalysis.put("availableSizes", new ArrayList<>(allSizes));
        featureAnalysis.put("availableColors", new ArrayList<>(allColors));
        featureAnalysis.put("sizesByProduct", sizesByProduct);
        featureAnalysis.put("colorsByProduct", colorsByProduct);

        // Feature matrix
        List<Map<String, Object>> featureMatrix = new ArrayList<>();
        for (AffiliateProduct product : products) {
            Map<String, Object> features = new HashMap<>();
            features.put("productId", product.getId());
            features.put("sizeCount", sizesByProduct.get(product.getId()).size());
            features.put("colorCount", colorsByProduct.get(product.getId()).size());
            features.put("hasDiscount", product.hasDiscount());
            features.put("inStock", product.isInStock());
            features.put("hasReviews", product.getReviewCount() != null && product.getReviewCount() > 0);
            featureMatrix.add(features);
        }

        featureAnalysis.put("featureMatrix", featureMatrix);

        return featureAnalysis;
    }

    /**
     * Analyze brand comparison
     */
    private Map<String, Object> analyzeBrandComparison(List<AffiliateProduct> products) {
        Map<String, Object> brandAnalysis = new HashMap<>();

        Map<String, List<AffiliateProduct>> productsByBrand = products.stream()
                .collect(Collectors.groupingBy(AffiliateProduct::getBrand));

        Map<String, Map<String, Object>> brandMetrics = new HashMap<>();
        for (Map.Entry<String, List<AffiliateProduct>> entry : productsByBrand.entrySet()) {
            String brand = entry.getKey();
            List<AffiliateProduct> brandProducts = entry.getValue();

            Map<String, Object> metrics = new HashMap<>();
            metrics.put("productCount", brandProducts.size());
            metrics.put("avgPrice", brandProducts.stream()
                    .map(AffiliateProduct::getPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(brandProducts.size()), 2, RoundingMode.HALF_UP));

            OptionalDouble avgRating = brandProducts.stream()
                    .filter(p -> p.getRating() != null)
                    .mapToDouble(p -> p.getRating().doubleValue())
                    .average();

            if (avgRating.isPresent()) {
                metrics.put("avgRating", BigDecimal.valueOf(avgRating.getAsDouble()).setScale(2, RoundingMode.HALF_UP));
            }

            Set<AffiliateProduct.AffiliateSource> sources = brandProducts.stream()
                    .map(AffiliateProduct::getAffiliateSource)
                    .collect(Collectors.toSet());
            metrics.put("availableOn", new ArrayList<>(sources));

            brandMetrics.put(brand, metrics);
        }

        brandAnalysis.put("brandMetrics", brandMetrics);
        brandAnalysis.put("uniqueBrands", productsByBrand.keySet());

        return brandAnalysis;
    }

    /**
     * Analyze value proposition
     */
    private Map<String, Object> analyzeValueProposition(List<AffiliateProduct> products) {
        Map<String, Object> valueAnalysis = new HashMap<>();

        List<Map<String, Object>> valueScores = new ArrayList<>();
        for (AffiliateProduct product : products) {
            Map<String, Object> score = new HashMap<>();
            score.put("productId", product.getId());

            // Calculate value score (rating/price ratio, normalized)
            double valueScore = 0.0;
            if (product.getRating() != null && product.getPrice().compareTo(BigDecimal.ZERO) > 0) {
                valueScore = product.getRating().doubleValue() / product.getPrice().doubleValue() * 100;
            }

            score.put("valueScore", Math.round(valueScore * 100.0) / 100.0);

            // Price value assessment
            BigDecimal avgPrice = products.stream()
                    .map(AffiliateProduct::getPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(products.size()), 2, RoundingMode.HALF_UP);

            if (product.getPrice().compareTo(avgPrice) < 0) {
                if (product.getRating() != null && product.getRating().compareTo(BigDecimal.valueOf(4.0)) >= 0) {
                    score.put("valueCategory", "Excellent Value");
                } else {
                    score.put("valueCategory", "Budget Option");
                }
            } else {
                if (product.getRating() != null && product.getRating().compareTo(BigDecimal.valueOf(4.0)) >= 0) {
                    score.put("valueCategory", "Premium Quality");
                } else {
                    score.put("valueCategory", "Premium Pricing");
                }
            }

            valueScores.add(score);
        }

        // Sort by value score
        valueScores.sort((a, b) -> Double.compare((Double) b.get("valueScore"), (Double) a.get("valueScore")));

        valueAnalysis.put("valueScores", valueScores);
        valueAnalysis.put("bestValue", valueScores.isEmpty() ? null : valueScores.get(0));

        return valueAnalysis;
    }

    /**
     * Generate recommendations
     */
    private Map<String, Object> generateRecommendations(List<AffiliateProduct> products) {
        Map<String, Object> recommendations = new HashMap<>();

        AffiliateProduct cheapest = products.stream().min(Comparator.comparing(AffiliateProduct::getPrice)).orElse(null);
        AffiliateProduct mostExpensive = products.stream().max(Comparator.comparing(AffiliateProduct::getPrice)).orElse(null);
        AffiliateProduct highestRated = products.stream()
                .filter(p -> p.getRating() != null)
                .max(Comparator.comparing(AffiliateProduct::getRating))
                .orElse(null);

        Map<String, String> scenarios = new HashMap<>();
        scenarios.put("budget", cheapest != null ? cheapest.getId() : products.get(0).getId());
        scenarios.put("quality", highestRated != null ? highestRated.getId() : products.get(0).getId());
        scenarios.put("premium", mostExpensive != null ? mostExpensive.getId() : products.get(0).getId());

        // Best discount
        AffiliateProduct bestDiscount = products.stream()
                .filter(AffiliateProduct::hasDiscount)
                .max(Comparator.comparing(p -> p.getDiscountPercentage() != null ? p.getDiscountPercentage() : BigDecimal.ZERO))
                .orElse(null);

        if (bestDiscount != null) {
            scenarios.put("discount", bestDiscount.getId());
        }

        recommendations.put("scenarioRecommendations", scenarios);

        // Overall recommendation logic
        String overallRecommendation;
        if (highestRated != null && cheapest != null) {
            if (highestRated.getId().equals(cheapest.getId())) {
                overallRecommendation = String.format("🏆 %s offers the best combination of value and quality - highly rated at the lowest price point.",
                                                    highestRated.getName());
            } else {
                overallRecommendation = String.format("💡 Choose %s for maximum value or %s for highest quality and customer satisfaction.",
                                                    cheapest.getName(), highestRated.getName());
            }
        } else {
            overallRecommendation = "Compare products based on your priorities: budget, quality, or specific features.";
        }

        recommendations.put("overallRecommendation", overallRecommendation);

        return recommendations;
    }

    /**
     * Generate comparison charts data
     */
    private Map<String, Object> generateComparisonCharts(List<AffiliateProduct> products) {
        Map<String, Object> chartData = new HashMap<>();

        // Price comparison chart
        List<Map<String, Object>> priceChart = new ArrayList<>();
        for (AffiliateProduct product : products) {
            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("label", product.getBrand() + " - " + product.getName().substring(0, Math.min(20, product.getName().length())) + "...");
            dataPoint.put("price", product.getPrice());
            dataPoint.put("originalPrice", product.getOriginalPrice());
            priceChart.add(dataPoint);
        }
        chartData.put("priceComparison", priceChart);

        // Rating comparison chart
        List<Map<String, Object>> ratingChart = new ArrayList<>();
        for (AffiliateProduct product : products) {
            if (product.getRating() != null) {
                Map<String, Object> dataPoint = new HashMap<>();
                dataPoint.put("label", product.getBrand());
                dataPoint.put("rating", product.getRating());
                dataPoint.put("reviewCount", product.getReviewCount());
                ratingChart.add(dataPoint);
            }
        }
        chartData.put("ratingComparison", ratingChart);

        // Source distribution
        Map<String, Long> sourceDistribution = products.stream()
                .collect(Collectors.groupingBy(
                    p -> p.getAffiliateSource().toString(),
                    Collectors.counting()
                ));
        chartData.put("sourceDistribution", sourceDistribution);

        // Feature comparison radar chart
        List<Map<String, Object>> featureRadar = new ArrayList<>();
        for (AffiliateProduct product : products) {
            Map<String, Object> features = new HashMap<>();
            features.put("label", product.getBrand());
            features.put("price", 5 - (products.indexOf(product) + 1)); // Inverse price rank (lower is better)
            features.put("rating", product.getRating() != null ? product.getRating() : 3.0);
            features.put("availability", product.getAvailableSizes() != null ? product.getAvailableSizes().size() : 0);
            features.put("discount", product.hasDiscount() ? 5 : 0);
            featureRadar.add(features);
        }
        chartData.put("featureRadar", featureRadar);

        return chartData;
    }

    /**
     * Create error response
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", true);
        error.put("message", message);
        error.put("timestamp", new Date());
        return error;
    }

    /**
     * Get comparison summary for category
     */
    public Map<String, Object> getCategoryComparison(String category) {
        logger.info("📊 Generating category comparison for: {}", category);

        List<String> brands = affiliateProductRepository.findBrandsByCategory(category);
        if (brands.size() < 2) {
            return createErrorResponse("Not enough brands in category for comparison");
        }

        List<AffiliateProduct> products = affiliateProductRepository.findProductsForComparison(category, brands.subList(0, Math.min(5, brands.size())));

        Map<String, Object> comparison = new HashMap<>();
        comparison.put("category", category);
        comparison.put("brandsCompared", brands.subList(0, Math.min(5, brands.size())));
        comparison.put("productCount", products.size());
        comparison.put("priceRange", analyzePriceComparison(products));
        comparison.put("brandAnalysis", analyzeBrandComparison(products));
        comparison.put("chartData", generateComparisonCharts(products));

        return comparison;
    }
}
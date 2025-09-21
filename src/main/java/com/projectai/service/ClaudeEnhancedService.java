package com.projectai.service;

import com.projectai.models.*;
import com.projectai.repository.ProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ClaudeEnhancedService {

    @Autowired
    private ProductRepository productRepository;

    @Value("${claude.api.key:}")
    private String claudeApiKey;

    private final String CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ClaudeSearchAnalytics performComprehensiveSearch(String query) {
        System.out.println("🚀 [Claude Enhanced] Starting comprehensive search for: " + query);
        long startTime = System.currentTimeMillis();

        ClaudeSearchAnalytics analytics = new ClaudeSearchAnalytics();
        analytics.setOriginalQuery(query);

        try {
            // Step 1: Extract filters using Claude AI
            SearchFilters filters = extractFiltersWithClaude(query);
            analytics.setExtractedFilters(filters);

            // Step 2: Execute intelligent product search
            List<Product> matchedProducts = executeIntelligentSearch(filters);
            analytics.setMatchedProducts(matchedProducts);

            // Step 3: Generate Claude insights and recommendations
            String claudeInsight = generateClaudeInsights(query, filters, matchedProducts);
            analytics.setClaudeInsight(claudeInsight);

            // Step 4: Calculate advanced analytics
            calculateAdvancedAnalytics(analytics);

            // Step 5: Generate visual data for graphs
            generateVisualAnalytics(analytics);

            // Step 6: Calculate search quality score
            calculateSearchQuality(analytics);

            analytics.setProcessingTimeMs(System.currentTimeMillis() - startTime);
            System.out.println("✅ [Claude Enhanced] Search completed in " + analytics.getProcessingTimeMs() + "ms");

        } catch (Exception e) {
            System.err.println("❌ [Claude Enhanced] Search failed: " + e.getMessage());
            e.printStackTrace();
            return createFallbackAnalytics(query, startTime);
        }

        return analytics;
    }

    private SearchFilters extractFiltersWithClaude(String query) {
        System.out.println("🧠 [Claude Enhanced] Extracting filters with Claude AI...");

        if (claudeApiKey == null || claudeApiKey.trim().isEmpty()) {
            System.out.println("⚠️ [Claude Enhanced] No Claude API key, using fallback filter extraction");
            return extractBasicFilters(query);
        }

        try {
            String prompt = buildAdvancedFilterExtractionPrompt(query);
            String claudeResponse = callClaudeAPI(prompt);

            return parseAdvancedFilterResponse(claudeResponse, query);

        } catch (Exception e) {
            System.err.println("❌ [Claude Enhanced] Claude filter extraction failed: " + e.getMessage());
            return extractBasicFilters(query);
        }
    }

    private String buildAdvancedFilterExtractionPrompt(String query) {
        return String.format("""
            Analyze this thrift shopping query and extract detailed search parameters in JSON format.

            Query: "%s"

            Extract these parameters with confidence scores (0.0-1.0):
            {
              "category": "string or null",
              "categoryConfidence": 0.0-1.0,
              "brand": "string or null",
              "brandConfidence": 0.0-1.0,
              "minPrice": number or null,
              "maxPrice": number or null,
              "priceConfidence": 0.0-1.0,
              "condition": "new/like-new/good/fair or null",
              "conditionConfidence": 0.0-1.0,
              "size": "string or null",
              "sizeConfidence": 0.0-1.0,
              "intent": "budget-shopping/designer-hunting/specific-item/casual-browsing",
              "intentConfidence": 0.0-1.0,
              "style": "vintage/modern/casual/formal/bohemian/minimalist or null",
              "styleConfidence": 0.0-1.0,
              "color": "string or null",
              "colorConfidence": 0.0-1.0,
              "gender": "men/women/unisex or null",
              "genderConfidence": 0.0-1.0,
              "keywords": ["keyword1", "keyword2"],
              "searchStrategy": "exact-match/broad-search/semantic-search",
              "urgency": "low/medium/high",
              "alternatives": ["alternative1", "alternative2"]
            }

            Return only valid JSON.
            """, query);
    }

    private String callClaudeAPI(String prompt) {
        System.out.println("🔮 [Claude Enhanced] Calling Claude API...");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", claudeApiKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "claude-3-5-sonnet-20241022");
        requestBody.put("max_tokens", 2000);

        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);
        messages.add(message);
        requestBody.put("messages", messages);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                CLAUDE_API_URL, HttpMethod.POST, request, String.class);

            JsonNode responseNode = objectMapper.readTree(response.getBody());
            String content = responseNode.path("content").get(0).path("text").asText();

            System.out.println("✅ [Claude Enhanced] Claude API response received");
            return content;

        } catch (Exception e) {
            System.err.println("❌ [Claude Enhanced] Claude API call failed: " + e.getMessage());
            throw new RuntimeException("Claude API call failed", e);
        }
    }

    private SearchFilters parseAdvancedFilterResponse(String claudeResponse, String originalQuery) {
        try {
            JsonNode jsonNode = objectMapper.readTree(claudeResponse);
            SearchFilters filters = new SearchFilters(originalQuery);

            filters.setCategory(getStringValue(jsonNode, "category"));
            filters.setBrand(getStringValue(jsonNode, "brand"));
            filters.setMinPrice(getDoubleValue(jsonNode, "minPrice"));
            filters.setMaxPrice(getDoubleValue(jsonNode, "maxPrice"));
            filters.setCondition(getStringValue(jsonNode, "condition"));
            filters.setSize(getStringValue(jsonNode, "size"));
            filters.setIntent(getStringValue(jsonNode, "intent"));
            filters.setStyle(getStringValue(jsonNode, "style"));
            filters.setColor(getStringValue(jsonNode, "color"));
            filters.setGender(getStringValue(jsonNode, "gender"));

            // Extract keywords array
            if (jsonNode.has("keywords") && jsonNode.get("keywords").isArray()) {
                List<String> keywords = new ArrayList<>();
                jsonNode.get("keywords").forEach(keyword -> keywords.add(keyword.asText()));
                filters.setKeywords(keywords);
            }

            System.out.println("✅ [Claude Enhanced] Parsed filters: " + filters);
            return filters;

        } catch (Exception e) {
            System.err.println("❌ [Claude Enhanced] Failed to parse Claude response, using fallback");
            return extractBasicFilters(originalQuery);
        }
    }

    private String getStringValue(JsonNode node, String fieldName) {
        return node.has(fieldName) && !node.get(fieldName).isNull() ? node.get(fieldName).asText() : null;
    }

    private Double getDoubleValue(JsonNode node, String fieldName) {
        return node.has(fieldName) && !node.get(fieldName).isNull() ? node.get(fieldName).asDouble() : null;
    }

    private SearchFilters extractBasicFilters(String query) {
        SearchFilters filters = new SearchFilters(query);
        String lowerQuery = query.toLowerCase();

        // Basic keyword extraction
        if (lowerQuery.contains("laptop") || lowerQuery.contains("computer")) {
            filters.setCategory("Electronics");
            filters.setIntent("specific-item");
        } else if (lowerQuery.contains("budget")) {
            filters.setIntent("budget-shopping");
        } else if (lowerQuery.contains("vintage")) {
            filters.setStyle("vintage");
        }

        // Extract price range
        if (lowerQuery.contains("under") && lowerQuery.contains("$")) {
            try {
                String[] parts = lowerQuery.split("\\$");
                if (parts.length > 1) {
                    String priceStr = parts[1].replaceAll("[^0-9]", "");
                    if (!priceStr.isEmpty()) {
                        filters.setMaxPrice(Double.parseDouble(priceStr));
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to extract price: " + e.getMessage());
            }
        }

        return filters;
    }

    private List<Product> executeIntelligentSearch(SearchFilters filters) {
        System.out.println("🔍 [Claude Enhanced] Executing intelligent product search...");

        List<Product> allProducts = productRepository.findByIsAvailableTrue();

        return allProducts.stream()
                .filter(product -> matchesAdvancedFilters(product, filters))
                .map(product -> new ProductWithScore(product, calculateAdvancedRelevanceScore(product, filters)))
                .sorted((p1, p2) -> Double.compare(p2.score, p1.score))
                .limit(20)
                .map(productWithScore -> productWithScore.product)
                .collect(Collectors.toList());
    }

    private boolean matchesAdvancedFilters(Product product, SearchFilters filters) {
        // Category matching
        if (filters.getCategory() != null && product.getCategory() != null) {
            if (!product.getCategory().toLowerCase().contains(filters.getCategory().toLowerCase())) {
                return false;
            }
        }

        // Brand matching
        if (filters.getBrand() != null && product.getBrand() != null) {
            if (!product.getBrand().toLowerCase().contains(filters.getBrand().toLowerCase())) {
                return false;
            }
        }

        // Price range matching
        if (filters.getMinPrice() != null && product.getPrice() < filters.getMinPrice()) {
            return false;
        }
        if (filters.getMaxPrice() != null && product.getPrice() > filters.getMaxPrice()) {
            return false;
        }

        // Condition matching
        if (filters.getCondition() != null && product.getCondition() != null) {
            if (!product.getCondition().toLowerCase().contains(filters.getCondition().toLowerCase())) {
                return false;
            }
        }

        // Size matching
        if (filters.getSize() != null && product.getSize() != null) {
            if (!product.getSize().toLowerCase().contains(filters.getSize().toLowerCase())) {
                return false;
            }
        }

        // Keywords matching
        if (filters.getKeywords() != null && !filters.getKeywords().isEmpty()) {
            String productText = (product.getName() + " " + product.getDescription() + " " +
                               product.getBrand() + " " + product.getCategory()).toLowerCase();

            boolean keywordMatch = filters.getKeywords().stream()
                    .anyMatch(keyword -> productText.contains(keyword.toLowerCase()));

            if (!keywordMatch) {
                return false;
            }
        }

        return true;
    }

    private double calculateAdvancedRelevanceScore(Product product, SearchFilters filters) {
        double score = 0.0;

        // Exact category match
        if (filters.getCategory() != null && product.getCategory() != null) {
            if (product.getCategory().toLowerCase().equals(filters.getCategory().toLowerCase())) {
                score += 30.0;
            } else if (product.getCategory().toLowerCase().contains(filters.getCategory().toLowerCase())) {
                score += 15.0;
            }
        }

        // Brand match
        if (filters.getBrand() != null && product.getBrand() != null) {
            if (product.getBrand().toLowerCase().equals(filters.getBrand().toLowerCase())) {
                score += 25.0;
            } else if (product.getBrand().toLowerCase().contains(filters.getBrand().toLowerCase())) {
                score += 10.0;
            }
        }

        // Price relevance (closer to target = higher score)
        if (filters.getMaxPrice() != null) {
            double priceRatio = product.getPrice() / filters.getMaxPrice();
            if (priceRatio <= 1.0) {
                score += (1.0 - priceRatio) * 20.0;
            }
        }

        // Keyword relevance
        if (filters.getKeywords() != null && !filters.getKeywords().isEmpty()) {
            String productText = (product.getName() + " " + product.getDescription()).toLowerCase();
            long keywordMatches = filters.getKeywords().stream()
                    .mapToLong(keyword -> productText.split(keyword.toLowerCase(), -1).length - 1)
                    .sum();
            score += keywordMatches * 5.0;
        }

        return score;
    }

    private String generateClaudeInsights(String query, SearchFilters filters, List<Product> products) {
        System.out.println("💡 [Claude Enhanced] Generating Claude insights...");

        if (claudeApiKey == null || claudeApiKey.trim().isEmpty()) {
            return generateBasicInsights(query, filters, products);
        }

        try {
            String prompt = buildInsightsPrompt(query, filters, products);
            return callClaudeAPI(prompt);
        } catch (Exception e) {
            System.err.println("❌ [Claude Enhanced] Claude insights generation failed: " + e.getMessage());
            return generateBasicInsights(query, filters, products);
        }
    }

    private String buildInsightsPrompt(String query, SearchFilters filters, List<Product> products) {
        StringBuilder productSummary = new StringBuilder();
        products.stream().limit(5).forEach(product ->
            productSummary.append(String.format("- %s by %s ($%.2f, %s condition)\\n",
                product.getName(), product.getBrand(), product.getPrice(), product.getCondition()))
        );

        return String.format("""
            As a thrift shopping expert, analyze this search and provide intelligent insights.

            Original Query: "%s"
            Extracted Filters: %s
            Found %d products

            Top Products:
            %s

            Provide insights including:
            1. Search effectiveness analysis
            2. Product recommendations
            3. Price comparison insights
            4. Alternative suggestions
            5. Shopping strategy advice

            Keep response concise and actionable (max 200 words).
            """, query, filters.toString(), products.size(), productSummary.toString());
    }

    private String generateBasicInsights(String query, SearchFilters filters, List<Product> products) {
        return String.format("Found %d products for '%s'. Price range: $%.2f - $%.2f. " +
                           "Consider expanding search criteria if results are limited.",
                           products.size(),
                           query,
                           products.stream().mapToDouble(Product::getPrice).min().orElse(0.0),
                           products.stream().mapToDouble(Product::getPrice).max().orElse(0.0));
    }

    private void calculateAdvancedAnalytics(ClaudeSearchAnalytics analytics) {
        List<Product> products = analytics.getMatchedProducts();

        // Category confidence scores
        Map<String, Double> categoryScores = new HashMap<>();
        products.stream()
                .collect(Collectors.groupingBy(Product::getCategory, Collectors.counting()))
                .forEach((category, count) ->
                    categoryScores.put(category, count.doubleValue() / products.size()));
        analytics.setCategoryConfidenceScores(categoryScores);

        // Brand distribution
        Map<String, Integer> brandDistribution = products.stream()
                .collect(Collectors.groupingBy(
                    product -> product.getBrand() != null ? product.getBrand() : "Unknown",
                    Collectors.collectingAndThen(Collectors.counting(), Math::toIntExact)));
        analytics.setBrandDistribution(brandDistribution);

        // Price range distribution
        Map<String, Integer> priceDistribution = new HashMap<>();
        products.forEach(product -> {
            String range = getPriceRange(product.getPrice());
            priceDistribution.merge(range, 1, Integer::sum);
        });
        analytics.setPriceRangeDistribution(priceDistribution);

        // Condition distribution
        Map<String, Integer> conditionDistribution = products.stream()
                .collect(Collectors.groupingBy(
                    product -> product.getCondition() != null ? product.getCondition() : "Unknown",
                    Collectors.collectingAndThen(Collectors.counting(), Math::toIntExact)));
        analytics.setConditionDistribution(conditionDistribution);

        // Generate alternatives
        List<String> alternatives = generateAlternatives(analytics.getOriginalQuery());
        analytics.setSuggestedAlternatives(alternatives);
    }

    private String getPriceRange(double price) {
        if (price < 25) return "$0-$25";
        if (price < 50) return "$25-$50";
        if (price < 100) return "$50-$100";
        if (price < 200) return "$100-$200";
        return "$200+";
    }

    private List<String> generateAlternatives(String query) {
        List<String> alternatives = new ArrayList<>();
        String lowerQuery = query.toLowerCase();

        if (lowerQuery.contains("laptop")) {
            alternatives.addAll(Arrays.asList("desktop computer", "tablet", "gaming laptop", "refurbished laptop"));
        } else if (lowerQuery.contains("budget")) {
            alternatives.addAll(Arrays.asList("clearance items", "sale items", "vintage finds"));
        } else if (lowerQuery.contains("vintage")) {
            alternatives.addAll(Arrays.asList("retro items", "antique pieces", "classic styles"));
        }

        return alternatives;
    }

    private void generateVisualAnalytics(ClaudeSearchAnalytics analytics) {
        Map<String, Object> visualData = new HashMap<>();

        // Price distribution data for charts
        List<Map<String, Object>> priceChartData = new ArrayList<>();
        analytics.getPriceRangeDistribution().forEach((range, count) -> {
            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("range", range);
            dataPoint.put("count", count);
            priceChartData.add(dataPoint);
        });
        visualData.put("priceDistribution", priceChartData);

        // Brand distribution for pie chart
        List<Map<String, Object>> brandChartData = new ArrayList<>();
        analytics.getBrandDistribution().entrySet().stream()
                .limit(5) // Top 5 brands
                .forEach(entry -> {
                    Map<String, Object> dataPoint = new HashMap<>();
                    dataPoint.put("brand", entry.getKey());
                    dataPoint.put("count", entry.getValue());
                    brandChartData.add(dataPoint);
                });
        visualData.put("brandDistribution", brandChartData);

        // Search quality metrics
        Map<String, Double> qualityMetrics = new HashMap<>();
        qualityMetrics.put("relevance", calculateRelevanceScore(analytics));
        qualityMetrics.put("coverage", calculateCoverageScore(analytics));
        qualityMetrics.put("diversity", calculateDiversityScore(analytics));
        visualData.put("qualityMetrics", qualityMetrics);

        analytics.setVisualData(visualData);
    }

    private double calculateRelevanceScore(ClaudeSearchAnalytics analytics) {
        // Score based on how well products match the query
        return Math.min(analytics.getMatchedProducts().size() / 10.0, 1.0) * 100;
    }

    private double calculateCoverageScore(ClaudeSearchAnalytics analytics) {
        // Score based on price range coverage
        if (analytics.getPriceRangeDistribution().size() >= 3) return 85.0;
        if (analytics.getPriceRangeDistribution().size() >= 2) return 70.0;
        return 50.0;
    }

    private double calculateDiversityScore(ClaudeSearchAnalytics analytics) {
        // Score based on brand and category diversity
        int brandCount = analytics.getBrandDistribution().size();
        int categoryCount = analytics.getCategoryConfidenceScores().size();
        return Math.min((brandCount + categoryCount) * 10.0, 100.0);
    }

    private void calculateSearchQuality(ClaudeSearchAnalytics analytics) {
        double quality = 0.0;

        // Result count factor
        int resultCount = analytics.getMatchedProducts().size();
        if (resultCount > 15) quality += 25.0;
        else if (resultCount > 5) quality += 15.0;
        else if (resultCount > 0) quality += 10.0;

        // Filter specificity factor
        SearchFilters filters = analytics.getExtractedFilters();
        int filtersUsed = 0;
        if (filters.getCategory() != null) filtersUsed++;
        if (filters.getBrand() != null) filtersUsed++;
        if (filters.getMaxPrice() != null) filtersUsed++;
        if (filters.getCondition() != null) filtersUsed++;

        quality += filtersUsed * 10.0;

        // Diversity factor
        quality += calculateDiversityScore(analytics) * 0.3;

        // Processing time factor (faster = better)
        if (analytics.getProcessingTimeMs() < 1000) quality += 15.0;
        else if (analytics.getProcessingTimeMs() < 2000) quality += 10.0;

        analytics.setSearchQuality(Math.min(quality, 100.0));
        analytics.setSearchStrategy(determineSearchStrategy(analytics));
    }

    private String determineSearchStrategy(ClaudeSearchAnalytics analytics) {
        SearchFilters filters = analytics.getExtractedFilters();

        if (filters.getCategory() != null && filters.getBrand() != null) {
            return "Precision Search";
        } else if (filters.getMaxPrice() != null) {
            return "Budget-Focused Search";
        } else if (filters.getStyle() != null) {
            return "Style-Based Search";
        } else {
            return "Broad Discovery Search";
        }
    }

    private ClaudeSearchAnalytics createFallbackAnalytics(String query, long startTime) {
        ClaudeSearchAnalytics analytics = new ClaudeSearchAnalytics();
        analytics.setOriginalQuery(query);
        analytics.setExtractedFilters(extractBasicFilters(query));
        analytics.setMatchedProducts(new ArrayList<>());
        analytics.setClaudeInsight("Search temporarily unavailable. Please try again.");
        analytics.setSearchQuality(0.0);
        analytics.setSearchStrategy("Fallback Mode");
        analytics.setProcessingTimeMs(System.currentTimeMillis() - startTime);
        return analytics;
    }

    // Helper classes
    private static class ProductWithScore {
        final Product product;
        final double score;

        ProductWithScore(Product product, double score) {
            this.product = product;
            this.score = score;
        }
    }
}
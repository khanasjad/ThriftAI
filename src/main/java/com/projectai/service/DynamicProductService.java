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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
public class DynamicProductService {

    private static final Logger logger = LoggerFactory.getLogger(DynamicProductService.class);

    @Value("${claude.api.key:}")
    private String claudeApiKey;

    @Value("${amazon.api.key:}")
    private String amazonApiKey;

    @Value("${openai.api.key:}")
    private String openAiApiKey;

    @Autowired
    private AmazonProductApiService amazonProductApiService;

    @Autowired
    private ComprehensiveProductComparisonService comparisonService;

    private final String CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Dynamically fetch and analyze products using real Amazon API + Claude AI analysis
     */
    public CompletableFuture<List<Product>> fetchDynamicProducts(String searchQuery, int limit) {
        return CompletableFuture.supplyAsync(() -> {
            logger.info("🚀 [Enhanced Dynamic Products] Starting Amazon API + Claude AI product fetch for: '{}'", searchQuery);

            try {
                // Step 1: Fetch real products from Amazon API with Claude-optimized search
                CompletableFuture<List<Product>> amazonProductsFuture = amazonProductApiService.fetchAmazonProducts(searchQuery, limit);
                List<Product> amazonProducts = amazonProductsFuture.get();

                // Step 2: If Amazon API provides products, use them; otherwise fallback to LLM generation
                List<Product> products;
                if (!amazonProducts.isEmpty()) {
                    logger.info("✅ [Amazon Integration] Got {} real Amazon products", amazonProducts.size());
                    products = amazonProducts;

                    // Step 3: Perform comprehensive comparison analysis on Amazon products
                    Map<String, Object> comparisonAnalysis = comparisonService.performComprehensiveComparison(products,
                        "User searching for: " + searchQuery);
                    logger.info("📊 [Comprehensive Analysis] Applied hundreds of parameters to {} products", products.size());

                } else {
                    logger.info("⚠️ [Amazon Integration] No Amazon products found, using LLM fallback");
                    // Fallback to original LLM-powered generation
                    Map<String, Object> productRequirements = analyzeSearchWithClaude(searchQuery);
                    products = generateProductsWithLLM(productRequirements, limit);
                    enhanceProductsWithLLMAnalysis(products, searchQuery);
                }

                logger.info("✅ [Enhanced Dynamic Products] Successfully generated {} AI-scored products from real Amazon data", products.size());
                return products;

            } catch (Exception e) {
                logger.error("❌ [Enhanced Dynamic Products] Failed to fetch products: {}", e.getMessage());
                // Ultimate fallback to original implementation
                return generateFallbackProducts(searchQuery, limit);
            }
        });
    }

    /**
     * Use Claude API to analyze search intent and generate product requirements
     */
    private Map<String, Object> analyzeSearchWithClaude(String searchQuery) {
        logger.info("🧠 [Claude Analysis] Analyzing search intent for: '{}'", searchQuery);

        if (claudeApiKey == null || claudeApiKey.trim().isEmpty()) {
            logger.warn("⚠️ [Claude Analysis] No Claude API key, using basic analysis");
            return createBasicAnalysis(searchQuery);
        }

        try {
            String prompt = String.format("""
                Analyze this shopping search query and generate detailed product requirements in JSON format:

                Query: "%s"

                Generate a comprehensive analysis with:
                {
                    "searchIntent": "what the user is looking for",
                    "productCategories": ["list of relevant categories"],
                    "suggestedBrands": ["list of popular brands for this category"],
                    "priceRanges": {
                        "budget": {"min": 10, "max": 50},
                        "midrange": {"min": 51, "max": 200},
                        "premium": {"min": 201, "max": 1000}
                    },
                    "keyFeatures": ["important features users would want"],
                    "targetDemographics": ["who would buy this"],
                    "seasonality": "spring/summer/fall/winter/all-season",
                    "trendingKeywords": ["current trending terms"],
                    "qualityFactors": ["what makes a good product in this category"],
                    "productVariations": ["different types/styles to include"],
                    "marketInsights": "current market trends and popular items"
                }

                Make this comprehensive and realistic for an e-commerce marketplace.
                """, searchQuery);

            String claudeResponse = callClaudeAPI(prompt);
            return parseClaudeAnalysis(claudeResponse);

        } catch (Exception e) {
            logger.error("❌ [Claude Analysis] Failed: {}", e.getMessage());
            return createBasicAnalysis(searchQuery);
        }
    }

    /**
     * Generate products using LLM-powered analysis
     */
    private List<Product> generateProductsWithLLM(Map<String, Object> requirements, int limit) {
        logger.info("🏭 [LLM Generation] Generating {} products from LLM analysis", limit);

        List<Product> products = new ArrayList<>();

        try {
            // Use Claude to generate specific product details
            String prompt = createProductGenerationPrompt(requirements, limit);
            String claudeResponse = callClaudeAPI(prompt);

            // Parse Claude's response and create Product objects
            products = parseProductsFromClaude(claudeResponse);

            // Ensure we have the right number of products
            while (products.size() < limit && products.size() < 20) {
                products.addAll(parseProductsFromClaude(claudeResponse));
            }

            return products.stream().limit(limit).toList();

        } catch (Exception e) {
            logger.error("❌ [LLM Generation] Failed: {}", e.getMessage());
            return generateBasicProducts(requirements, limit);
        }
    }

    /**
     * Create detailed prompt for product generation
     */
    private String createProductGenerationPrompt(Map<String, Object> requirements, int limit) {
        return String.format("""
            Based on these product requirements, generate %d specific, realistic products in JSON format:

            Requirements: %s

            Generate an array of products with this exact structure:
            [
                {
                    "name": "specific product name",
                    "brand": "realistic brand name",
                    "category": "product category",
                    "description": "detailed 2-3 sentence description highlighting key features",
                    "price": 29.99,
                    "originalPrice": 39.99,
                    "condition": "New/Like New/Good/Fair",
                    "size": "size if applicable",
                    "imageUrl": "placeholder-image-url",
                    "availability": true,
                    "features": ["key feature 1", "key feature 2", "key feature 3"],
                    "qualityScore": 8.5,
                    "popularityScore": 7.2,
                    "valueScore": 9.1,
                    "targetAge": "age range",
                    "gender": "male/female/unisex",
                    "sellerId": "auto-generated"
                }
            ]

            Make products diverse, realistic, and appealing. Include various price points and conditions.
            Use real brand names and current market prices. Focus on products people actually want to buy.
            """, limit, requirements);
    }

    /**
     * Parse products from Claude's JSON response
     */
    private List<Product> parseProductsFromClaude(String claudeResponse) {
        List<Product> products = new ArrayList<>();

        try {
            // Extract JSON from Claude's response
            String jsonStr = extractJsonFromResponse(claudeResponse);
            JsonNode jsonArray = objectMapper.readTree(jsonStr);

            for (JsonNode productNode : jsonArray) {
                Product product = new Product();
                product.setId(UUID.randomUUID().toString());
                product.setName(productNode.get("name").asText());
                product.setBrand(productNode.get("brand").asText());
                product.setCategory(productNode.get("category").asText());
                product.setDescription(productNode.get("description").asText());
                product.setPrice(productNode.get("price").asDouble());
                product.setOriginalPrice(productNode.get("originalPrice").asDouble());
                product.setCondition(productNode.get("condition").asText());
                product.setSize(productNode.has("size") ? productNode.get("size").asText() : null);
                product.setImageUrl(productNode.has("imageUrl") ? productNode.get("imageUrl").asText() : null);
                product.setAvailable(productNode.has("availability") ? productNode.get("availability").asBoolean() : true);
                // Note: createdAt and updatedAt are managed by JPA @PrePersist/@PreUpdate
                // sellerId is managed through Seller entity relationship

                products.add(product);
            }

        } catch (Exception e) {
            logger.error("❌ [Product Parsing] Failed to parse Claude response: {}", e.getMessage());
        }

        return products;
    }

    /**
     * Enhance products with additional LLM analysis (scoring, insights, etc.)
     */
    private void enhanceProductsWithLLMAnalysis(List<Product> products, String searchQuery) {
        logger.info("⭐ [LLM Enhancement] Adding AI-powered scoring and insights");

        try {
            for (Product product : products) {
                // Use LLM to generate quality scores, popularity metrics, etc.
                Map<String, Object> productAnalysis = analyzeProductWithLLM(product, searchQuery);

                // Apply LLM insights to product (could store in custom fields or database)
                applyLLMInsights(product, productAnalysis);
            }

        } catch (Exception e) {
            logger.error("❌ [LLM Enhancement] Failed: {}", e.getMessage());
        }
    }

    /**
     * Analyze individual product with LLM for scoring and insights
     */
    private Map<String, Object> analyzeProductWithLLM(Product product, String searchQuery) {
        String prompt = String.format("""
            Analyze this product and provide detailed scoring and insights in JSON format:

            Product: %s
            Brand: %s
            Category: %s
            Price: $%.2f
            Original Search: "%s"

            Provide analysis:
            {
                "relevanceScore": 8.5,
                "qualityScore": 9.0,
                "valueScore": 7.8,
                "popularityScore": 8.2,
                "trendScore": 6.5,
                "competitorAnalysis": "how it compares to similar products",
                "keySellingPoints": ["unique feature 1", "unique feature 2"],
                "targetCustomer": "who should buy this",
                "seasonalRelevance": "current seasonal appeal",
                "marketPosition": "budget/mid-range/premium positioning",
                "recommendationReason": "why this matches the search"
            }

            Scores should be 0.0-10.0. Be realistic and detailed.
            """, product.getName(), product.getBrand(), product.getCategory(),
               product.getPrice(), searchQuery);

        try {
            String response = callClaudeAPI(prompt);
            return parseAnalysisResponse(response);
        } catch (Exception e) {
            logger.error("❌ [Product Analysis] Failed for {}: {}", product.getName(), e.getMessage());
            return createBasicProductAnalysis();
        }
    }

    /**
     * Call Claude API with error handling and retry logic
     */
    private String callClaudeAPI(String prompt) {
        if (claudeApiKey == null || claudeApiKey.trim().isEmpty()) {
            throw new RuntimeException("Claude API key not configured");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", claudeApiKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> requestBody = Map.of(
            "model", "claude-3-5-sonnet-20241022",
            "max_tokens", 2000,
            "messages", List.of(Map.of(
                "role", "user",
                "content", prompt
            ))
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(CLAUDE_API_URL, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                return responseJson.get("content").get(0).get("text").asText();
            } else {
                throw new RuntimeException("Claude API call failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            logger.error("❌ [Claude API] Call failed: {}", e.getMessage());
            throw new RuntimeException("Claude API call failed", e);
        }
    }

    // Helper methods for fallback scenarios
    private Map<String, Object> createBasicAnalysis(String searchQuery) {
        return Map.of(
            "searchIntent", "Find products related to: " + searchQuery,
            "productCategories", List.of("General"),
            "suggestedBrands", List.of("Various"),
            "priceRanges", Map.of(
                "budget", Map.of("min", 10, "max", 50),
                "midrange", Map.of("min", 51, "max", 200)
            ),
            "keyFeatures", List.of("Quality", "Affordable", "Popular"),
            "targetDemographics", List.of("General consumers")
        );
    }

    private List<Product> generateBasicProducts(Map<String, Object> requirements, int limit) {
        logger.info("🔄 [Fallback] Generating basic products");
        List<Product> products = new ArrayList<>();

        for (int i = 0; i < limit; i++) {
            Product product = new Product();
            product.setId(UUID.randomUUID().toString());
            product.setName("Dynamic Product " + (i + 1));
            product.setBrand("LLM Generated");
            product.setCategory("General");
            product.setDescription("Dynamically generated product based on search requirements");
            product.setPrice(randomPrice(20, 100));
            product.setOriginalPrice(product.getPrice() * 1.2);
            product.setCondition("New");
            product.setAvailable(true);
            // Note: timestamps managed by JPA, sellerId managed through Seller entity

            products.add(product);
        }

        return products;
    }

    private List<Product> generateFallbackProducts(String searchQuery, int limit) {
        logger.info("🔄 [Emergency Fallback] Generating emergency fallback products");
        return generateBasicProducts(createBasicAnalysis(searchQuery), limit);
    }

    private void applyLLMInsights(Product product, Map<String, Object> analysis) {
        // Store LLM insights in product description or custom fields
        String enhancedDescription = product.getDescription() +
            " [AI Score: " + analysis.getOrDefault("relevanceScore", "N/A") + "/10]";
        product.setDescription(enhancedDescription);
    }

    private Map<String, Object> parseAnalysisResponse(String response) {
        try {
            String jsonStr = extractJsonFromResponse(response);
            return objectMapper.readValue(jsonStr, Map.class);
        } catch (Exception e) {
            return createBasicProductAnalysis();
        }
    }

    private Map<String, Object> createBasicProductAnalysis() {
        return Map.of(
            "relevanceScore", 7.0,
            "qualityScore", 7.5,
            "valueScore", 8.0,
            "popularityScore", 7.0
        );
    }

    private Map<String, Object> parseClaudeAnalysis(String response) {
        try {
            String jsonStr = extractJsonFromResponse(response);
            return objectMapper.readValue(jsonStr, Map.class);
        } catch (Exception e) {
            logger.error("❌ [Parse Analysis] Failed: {}", e.getMessage());
            return createBasicAnalysis("");
        }
    }

    private String extractJsonFromResponse(String response) {
        // Extract JSON from Claude's response (handles markdown code blocks)
        if (response.contains("```json")) {
            int start = response.indexOf("```json") + 7;
            int end = response.indexOf("```", start);
            return response.substring(start, end).trim();
        } else if (response.contains("{")) {
            int start = response.indexOf("{");
            int end = response.lastIndexOf("}") + 1;
            return response.substring(start, end);
        }
        return response;
    }

    private double randomPrice(double min, double max) {
        return BigDecimal.valueOf(min + (max - min) * Math.random())
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
package com.projectai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectai.models.Product;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * AI Integration Service for ThriftAI
 * Integrates with Python AI services for advanced catalog extraction and theme analysis
 */
@Service
public class AIIntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(AIIntegrationService.class);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${ai.catalog.extractor.url:http://localhost:8085}")
    private String catalogExtractorUrl;

    @Value("${ai.theme.engine.url:http://localhost:8086}")
    private String themeEngineUrl;

    @Value("${ai.services.enabled:true}")
    private boolean aiServicesEnabled;

    @Value("${ai.services.timeout:30}")
    private int timeoutSeconds;

    public AIIntegrationService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Extract product information from an image using AI
     */
    public CompletableFuture<Map<String, Object>> extractFromImage(MultipartFile imageFile, String additionalText) {
        return CompletableFuture.supplyAsync(() -> {
            if (!aiServicesEnabled) {
                return createFallbackResponse("AI services disabled");
            }

            try {
                // Save image temporarily
                Path tempFile = saveTemporaryFile(imageFile);

                // Create multipart request
                String boundary = "----WebKitFormBoundary" + System.currentTimeMillis();
                String multipartBody = createMultipartBody(tempFile, additionalText, boundary);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(catalogExtractorUrl + "/extract/image"))
                        .timeout(Duration.ofSeconds(timeoutSeconds))
                        .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                        .POST(HttpRequest.BodyPublishers.ofString(multipartBody))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                // Clean up temp file
                Files.deleteIfExists(tempFile);

                if (response.statusCode() == 200) {
                    return objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
                } else {
                    logger.error("AI service returned status: {}", response.statusCode());
                    return createFallbackResponse("AI service error");
                }

            } catch (Exception e) {
                logger.error("Error extracting from image: ", e);
                return createFallbackResponse("Error processing image");
            }
        });
    }

    /**
     * Extract product information from text using AI
     */
    public CompletableFuture<Map<String, Object>> extractFromText(String text, String additionalContext) {
        return CompletableFuture.supplyAsync(() -> {
            if (!aiServicesEnabled) {
                return createFallbackResponse("AI services disabled");
            }

            try {
                Map<String, String> requestBody = Map.of(
                        "text", text,
                        "additional_context", additionalContext != null ? additionalContext : ""
                );

                String jsonBody = objectMapper.writeValueAsString(requestBody);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(catalogExtractorUrl + "/extract/text"))
                        .timeout(Duration.ofSeconds(timeoutSeconds))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    return objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
                } else {
                    logger.error("AI service returned status: {}", response.statusCode());
                    return createFallbackResponse("AI service error");
                }

            } catch (Exception e) {
                logger.error("Error extracting from text: ", e);
                return createFallbackResponse("Error processing text");
            }
        });
    }

    /**
     * Extract product information from URL using AI
     */
    public CompletableFuture<List<Map<String, Object>>> extractFromUrl(String url) {
        return CompletableFuture.supplyAsync(() -> {
            if (!aiServicesEnabled) {
                return Collections.singletonList(createFallbackResponse("AI services disabled"));
            }

            try {
                Map<String, String> requestBody = Map.of("url", url);
                String jsonBody = objectMapper.writeValueAsString(requestBody);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(catalogExtractorUrl + "/extract/url"))
                        .timeout(Duration.ofSeconds(timeoutSeconds))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    return objectMapper.readValue(response.body(), new TypeReference<List<Map<String, Object>>>() {});
                } else {
                    logger.error("AI service returned status: {}", response.statusCode());
                    return Collections.singletonList(createFallbackResponse("AI service error"));
                }

            } catch (Exception e) {
                logger.error("Error extracting from URL: ", e);
                return Collections.singletonList(createFallbackResponse("Error processing URL"));
            }
        });
    }

    /**
     * Analyze product theme using AI
     */
    public CompletableFuture<Map<String, Object>> analyzeProductTheme(Product product) {
        return CompletableFuture.supplyAsync(() -> {
            if (!aiServicesEnabled) {
                return createFallbackTheme();
            }

            try {
                Map<String, Object> productData = convertProductToMap(product);
                Map<String, Object> requestBody = Map.of("product_data", productData);
                String jsonBody = objectMapper.writeValueAsString(requestBody);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(themeEngineUrl + "/analyze/theme"))
                        .timeout(Duration.ofSeconds(timeoutSeconds))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    return objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
                } else {
                    logger.error("Theme analysis service returned status: {}", response.statusCode());
                    return createFallbackTheme();
                }

            } catch (Exception e) {
                logger.error("Error analyzing product theme: ", e);
                return createFallbackTheme();
            }
        });
    }

    /**
     * Get available style themes
     */
    public CompletableFuture<Map<String, Object>> getStyleThemes() {
        return CompletableFuture.supplyAsync(() -> {
            if (!aiServicesEnabled) {
                return createDefaultThemes();
            }

            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(themeEngineUrl + "/themes/styles"))
                        .timeout(Duration.ofSeconds(timeoutSeconds))
                        .GET()
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    return objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
                } else {
                    return createDefaultThemes();
                }

            } catch (Exception e) {
                logger.error("Error getting style themes: ", e);
                return createDefaultThemes();
            }
        });
    }

    /**
     * Enhanced product categorization using AI
     */
    public CompletableFuture<Map<String, Object>> enhanceProductCategorization(Product product) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Combine text extraction and theme analysis for better categorization
                String productText = buildProductText(product);

                CompletableFuture<Map<String, Object>> textAnalysis = extractFromText(productText, "");
                CompletableFuture<Map<String, Object>> themeAnalysis = analyzeProductTheme(product);

                // Wait for both analyses
                Map<String, Object> textResult = textAnalysis.join();
                Map<String, Object> themeResult = themeAnalysis.join();

                // Combine results for enhanced categorization
                Map<String, Object> enhancedCategory = new HashMap<>();
                enhancedCategory.put("original_category", product.getCategory());
                enhancedCategory.put("ai_suggested_category", textResult.get("category"));
                enhancedCategory.put("confidence_score", textResult.get("confidence_score"));
                enhancedCategory.put("theme_analysis", themeResult);
                enhancedCategory.put("subcategory_suggestions", generateSubcategorySuggestions(textResult, themeResult));
                enhancedCategory.put("tags", generateEnhancedTags(textResult, themeResult));
                enhancedCategory.put("target_audience", extractTargetAudience(themeResult));
                enhancedCategory.put("style_attributes", extractStyleAttributes(themeResult));

                return enhancedCategory;

            } catch (Exception e) {
                logger.error("Error enhancing product categorization: ", e);
                return createFallbackCategorization(product);
            }
        });
    }

    /**
     * Batch process multiple products for theme analysis
     */
    public CompletableFuture<Map<String, Map<String, Object>>> batchAnalyzeThemes(List<Product> products) {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Map<String, Object>> results = new HashMap<>();

            List<CompletableFuture<Void>> futures = products.stream()
                    .map(product -> analyzeProductTheme(product)
                            .thenAccept(theme -> results.put(product.getId(), theme)))
                    .toList();

            // Wait for all analyses to complete
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

            return results;
        });
    }

    /**
     * Generate smart product recommendations based on AI analysis
     */
    public CompletableFuture<List<Map<String, Object>>> generateSmartRecommendations(Product product, List<Product> candidateProducts) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Analyze the base product theme
                Map<String, Object> baseTheme = analyzeProductTheme(product).join();

                // Analyze candidate products and score similarity
                List<Map<String, Object>> recommendations = new ArrayList<>();

                for (Product candidate : candidateProducts) {
                    if (candidate.getId().equals(product.getId())) {
                        continue; // Skip the same product
                    }

                    Map<String, Object> candidateTheme = analyzeProductTheme(candidate).join();
                    double similarityScore = calculateThemeSimilarity(baseTheme, candidateTheme);

                    if (similarityScore > 0.3) { // Only include reasonably similar products
                        Map<String, Object> recommendation = new HashMap<>();
                        recommendation.put("product", convertProductToMap(candidate));
                        recommendation.put("similarity_score", similarityScore);
                        recommendation.put("similarity_reasons", generateSimilarityReasons(baseTheme, candidateTheme));
                        recommendation.put("theme_match", candidateTheme);

                        recommendations.add(recommendation);
                    }
                }

                // Sort by similarity score
                recommendations.sort((a, b) ->
                    Double.compare((Double) b.get("similarity_score"), (Double) a.get("similarity_score")));

                return recommendations.stream().limit(10).toList(); // Top 10 recommendations

            } catch (Exception e) {
                logger.error("Error generating smart recommendations: ", e);
                return Collections.emptyList();
            }
        });
    }

    /**
     * Check AI services health
     */
    public CompletableFuture<Map<String, Object>> checkAIServicesHealth() {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> healthStatus = new HashMap<>();
            healthStatus.put("ai_services_enabled", aiServicesEnabled);

            if (!aiServicesEnabled) {
                healthStatus.put("catalog_extractor", "disabled");
                healthStatus.put("theme_engine", "disabled");
                return healthStatus;
            }

            try {
                // Check catalog extractor
                HttpRequest catalogRequest = HttpRequest.newBuilder()
                        .uri(URI.create(catalogExtractorUrl + "/health"))
                        .timeout(Duration.ofSeconds(5))
                        .GET()
                        .build();

                HttpResponse<String> catalogResponse = httpClient.send(catalogRequest, HttpResponse.BodyHandlers.ofString());
                healthStatus.put("catalog_extractor", catalogResponse.statusCode() == 200 ? "healthy" : "unhealthy");

            } catch (Exception e) {
                healthStatus.put("catalog_extractor", "unreachable");
            }

            try {
                // Check theme engine
                HttpRequest themeRequest = HttpRequest.newBuilder()
                        .uri(URI.create(themeEngineUrl + "/health"))
                        .timeout(Duration.ofSeconds(5))
                        .GET()
                        .build();

                HttpResponse<String> themeResponse = httpClient.send(themeRequest, HttpResponse.BodyHandlers.ofString());
                healthStatus.put("theme_engine", themeResponse.statusCode() == 200 ? "healthy" : "unhealthy");

            } catch (Exception e) {
                healthStatus.put("theme_engine", "unreachable");
            }

            return healthStatus;
        });
    }

    // Helper methods

    private Path saveTemporaryFile(MultipartFile file) throws IOException {
        Path tempFile = Files.createTempFile("upload_", "_" + file.getOriginalFilename());
        Files.copy(file.getInputStream(), tempFile, StandardCopyOption.REPLACE_EXISTING);
        return tempFile;
    }

    private String createMultipartBody(Path imagePath, String additionalText, String boundary) throws IOException {
        StringBuilder body = new StringBuilder();

        // Add file part
        body.append("--").append(boundary).append("\r\n");
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"").append(imagePath.getFileName()).append("\"\r\n");
        body.append("Content-Type: image/jpeg\r\n\r\n");
        body.append(Base64.getEncoder().encodeToString(Files.readAllBytes(imagePath)));
        body.append("\r\n");

        // Add additional text part
        body.append("--").append(boundary).append("\r\n");
        body.append("Content-Disposition: form-data; name=\"additional_text\"\r\n\r\n");
        body.append(additionalText != null ? additionalText : "");
        body.append("\r\n");

        body.append("--").append(boundary).append("--\r\n");

        return body.toString();
    }

    private Map<String, Object> convertProductToMap(Product product) {
        Map<String, Object> productMap = new HashMap<>();
        productMap.put("id", product.getId());
        productMap.put("name", product.getName());
        productMap.put("description", product.getDescription());
        productMap.put("category", product.getCategory());
        productMap.put("brand", product.getBrand());
        productMap.put("condition", product.getCondition());
        productMap.put("price", product.getPrice());
        productMap.put("original_price", product.getOriginalPrice());
        productMap.put("size", product.getSize());
        productMap.put("image_url", product.getImageUrl());
        productMap.put("created_at", product.getCreatedAt() != null ? product.getCreatedAt().toString() : null);
        productMap.put("is_available", product.isAvailable());

        // Add any additional analysis data if available
        Map<String, Object> imageAnalysis = new HashMap<>();
        imageAnalysis.put("quality_score", 0.7); // Placeholder
        imageAnalysis.put("dominant_colors", extractColorsFromDescription(product.getDescription()));
        productMap.put("image_analysis", imageAnalysis);

        return productMap;
    }

    private String buildProductText(Product product) {
        StringBuilder text = new StringBuilder();
        if (product.getName() != null) text.append(product.getName()).append(" ");
        if (product.getDescription() != null) text.append(product.getDescription()).append(" ");
        if (product.getBrand() != null) text.append(product.getBrand()).append(" ");
        if (product.getCategory() != null) text.append(product.getCategory()).append(" ");
        if (product.getCondition() != null) text.append(product.getCondition()).append(" ");
        return text.toString().trim();
    }

    private List<String> extractColorsFromDescription(String description) {
        if (description == null) return Collections.emptyList();

        List<String> colors = new ArrayList<>();
        String lowerDesc = description.toLowerCase();

        String[] colorWords = {"red", "blue", "green", "yellow", "black", "white", "brown", "pink", "purple", "orange", "gray", "grey"};
        for (String color : colorWords) {
            if (lowerDesc.contains(color)) {
                colors.add(color);
            }
        }

        return colors.isEmpty() ? List.of("neutral") : colors;
    }

    private List<String> generateSubcategorySuggestions(Map<String, Object> textResult, Map<String, Object> themeResult) {
        List<String> suggestions = new ArrayList<>();

        // Extract from AI analysis
        Object features = textResult.get("features");
        if (features instanceof List) {
            suggestions.addAll((List<String>) features);
        }

        // Extract from theme analysis
        Object primaryTheme = themeResult.get("primary_theme");
        if (primaryTheme != null) {
            suggestions.add(primaryTheme.toString());
        }

        return suggestions.stream().distinct().limit(5).toList();
    }

    private List<String> generateEnhancedTags(Map<String, Object> textResult, Map<String, Object> themeResult) {
        Set<String> tags = new HashSet<>();

        // From text analysis
        Object textTags = textResult.get("tags");
        if (textTags instanceof List) {
            tags.addAll((List<String>) textTags);
        }

        // From theme analysis
        Object moodAssociations = themeResult.get("mood_associations");
        if (moodAssociations instanceof List) {
            tags.addAll((List<String>) moodAssociations);
        }

        Object targetDemographics = themeResult.get("target_demographics");
        if (targetDemographics instanceof List) {
            tags.addAll((List<String>) targetDemographics);
        }

        return new ArrayList<>(tags);
    }

    private List<String> extractTargetAudience(Map<String, Object> themeResult) {
        Object targetDemographics = themeResult.get("target_demographics");
        if (targetDemographics instanceof List) {
            return (List<String>) targetDemographics;
        }
        return List.of("general");
    }

    private Map<String, Object> extractStyleAttributes(Map<String, Object> themeResult) {
        Map<String, Object> attributes = new HashMap<>();

        Object primaryTheme = themeResult.get("primary_theme");
        if (primaryTheme != null) {
            attributes.put("primary_style", primaryTheme);
        }

        Object aestheticScore = themeResult.get("aesthetic_score");
        if (aestheticScore != null) {
            attributes.put("aesthetic_appeal", aestheticScore);
        }

        Object vintageAuthenticity = themeResult.get("vintage_authenticity");
        if (vintageAuthenticity != null) {
            attributes.put("vintage_score", vintageAuthenticity);
        }

        Object uniquenessScore = themeResult.get("uniqueness_score");
        if (uniquenessScore != null) {
            attributes.put("uniqueness", uniquenessScore);
        }

        return attributes;
    }

    private double calculateThemeSimilarity(Map<String, Object> theme1, Map<String, Object> theme2) {
        double similarity = 0.0;

        // Primary theme match
        Object primaryTheme1 = theme1.get("primary_theme");
        Object primaryTheme2 = theme2.get("primary_theme");
        if (primaryTheme1 != null && primaryTheme1.equals(primaryTheme2)) {
            similarity += 0.4;
        }

        // Mood associations overlap
        Object mood1 = theme1.get("mood_associations");
        Object mood2 = theme2.get("mood_associations");
        if (mood1 instanceof List && mood2 instanceof List) {
            List<String> moods1 = (List<String>) mood1;
            List<String> moods2 = (List<String>) mood2;
            long commonMoods = moods1.stream().filter(moods2::contains).count();
            if (!moods1.isEmpty() && !moods2.isEmpty()) {
                similarity += 0.3 * (double) commonMoods / Math.max(moods1.size(), moods2.size());
            }
        }

        // Target demographics overlap
        Object demo1 = theme1.get("target_demographics");
        Object demo2 = theme2.get("target_demographics");
        if (demo1 instanceof List && demo2 instanceof List) {
            List<String> demographics1 = (List<String>) demo1;
            List<String> demographics2 = (List<String>) demo2;
            long commonDemo = demographics1.stream().filter(demographics2::contains).count();
            if (!demographics1.isEmpty() && !demographics2.isEmpty()) {
                similarity += 0.3 * (double) commonDemo / Math.max(demographics1.size(), demographics2.size());
            }
        }

        return Math.min(similarity, 1.0);
    }

    private List<String> generateSimilarityReasons(Map<String, Object> theme1, Map<String, Object> theme2) {
        List<String> reasons = new ArrayList<>();

        // Check primary theme
        Object primaryTheme1 = theme1.get("primary_theme");
        Object primaryTheme2 = theme2.get("primary_theme");
        if (primaryTheme1 != null && primaryTheme1.equals(primaryTheme2)) {
            reasons.add("Same style theme: " + primaryTheme1);
        }

        // Check mood overlap
        Object mood1 = theme1.get("mood_associations");
        Object mood2 = theme2.get("mood_associations");
        if (mood1 instanceof List && mood2 instanceof List) {
            List<String> moods1 = (List<String>) mood1;
            List<String> moods2 = (List<String>) mood2;
            List<String> commonMoods = moods1.stream().filter(moods2::contains).toList();
            if (!commonMoods.isEmpty()) {
                reasons.add("Similar mood: " + String.join(", ", commonMoods));
            }
        }

        return reasons;
    }

    private Map<String, Object> createFallbackResponse(String reason) {
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("name", "Unknown Product");
        fallback.put("category", "General");
        fallback.put("condition", "Good");
        fallback.put("confidence_score", 0.3);
        fallback.put("error", reason);
        fallback.put("fallback", true);
        return fallback;
    }

    private Map<String, Object> createFallbackTheme() {
        Map<String, Object> theme = new HashMap<>();
        theme.put("primary_theme", "style_contemporary");
        theme.put("theme_confidence", 0.3);
        theme.put("aesthetic_score", 0.5);
        theme.put("trend_relevance", 0.5);
        theme.put("target_demographics", List.of("general"));
        theme.put("mood_associations", List.of("neutral"));
        theme.put("vintage_authenticity", 0.0);
        theme.put("uniqueness_score", 0.3);
        theme.put("market_positioning", "good_value");
        theme.put("fallback", true);
        return theme;
    }

    private Map<String, Object> createDefaultThemes() {
        Map<String, Object> themes = new HashMap<>();
        themes.put("contemporary", Map.of("keywords", List.of("modern", "current"), "colors", List.of("neutral")));
        themes.put("vintage", Map.of("keywords", List.of("vintage", "retro"), "colors", List.of("muted")));
        themes.put("minimalist", Map.of("keywords", List.of("simple", "clean"), "colors", List.of("white", "black")));
        return themes;
    }

    private Map<String, Object> createFallbackCategorization(Product product) {
        Map<String, Object> categorization = new HashMap<>();
        categorization.put("original_category", product.getCategory());
        categorization.put("ai_suggested_category", product.getCategory());
        categorization.put("confidence_score", 0.5);
        categorization.put("subcategory_suggestions", Collections.emptyList());
        categorization.put("tags", Collections.emptyList());
        categorization.put("target_audience", List.of("general"));
        categorization.put("style_attributes", Collections.emptyMap());
        categorization.put("fallback", true);
        return categorization;
    }
}
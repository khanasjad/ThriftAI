package com.projectai.service;

import com.projectai.models.Product;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class ComprehensiveProductComparisonService {

    private static final Logger logger = LoggerFactory.getLogger(ComprehensiveProductComparisonService.class);

    @Value("${claude.api.key:}")
    private String claudeApiKey;

    private final String CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Compare products using hundreds of parameters for unbiased analysis
     */
    public Map<String, Object> performComprehensiveComparison(List<Product> products, String userContext) {
        logger.info("🔍 [Comprehensive Comparison] Analyzing {} products with hundreds of parameters", products.size());

        if (products == null || products.isEmpty()) {
            return createEmptyComparison();
        }

        try {
            // Step 1: Analyze each product individually with hundreds of parameters
            List<Map<String, Object>> individualAnalyses = products.stream()
                .map(product -> analyzeProductComprehensively(product, userContext))
                .collect(Collectors.toList());

            // Step 2: Perform comparative analysis between all products
            Map<String, Object> comparativeAnalysis = performCrossProductAnalysis(products, individualAnalyses, userContext);

            // Step 3: Generate final recommendations and insights
            Map<String, Object> finalRecommendations = generateUnbiasedRecommendations(products, individualAnalyses, comparativeAnalysis, userContext);

            // Step 4: Create comprehensive comparison result
            Map<String, Object> comparisonResult = new HashMap<>();
            comparisonResult.put("totalProducts", products.size());
            comparisonResult.put("analysisTimestamp", System.currentTimeMillis());
            comparisonResult.put("userContext", userContext);
            comparisonResult.put("individualAnalyses", individualAnalyses);
            comparisonResult.put("comparativeAnalysis", comparativeAnalysis);
            comparisonResult.put("recommendations", finalRecommendations);
            comparisonResult.put("comparisonMatrix", generateComparisonMatrix(products, individualAnalyses));
            comparisonResult.put("visualizationData", generateVisualizationData(products, individualAnalyses));
            comparisonResult.put("confidence", calculateOverallConfidence(individualAnalyses));

            logger.info("✅ [Comprehensive Comparison] Generated complete analysis with {} parameter categories",
                ((Map<String, Object>) comparisonResult.get("comparativeAnalysis")).size());

            return comparisonResult;

        } catch (Exception e) {
            logger.error("❌ [Comprehensive Comparison] Analysis failed: {}", e.getMessage());
            return generateFallbackComparison(products, userContext);
        }
    }

    /**
     * Analyze single product with hundreds of parameters
     */
    private Map<String, Object> analyzeProductComprehensively(Product product, String userContext) {
        logger.info("🔬 [Individual Analysis] Deep analysis of: '{}'", product.getName());

        if (claudeApiKey == null || claudeApiKey.trim().isEmpty()) {
            return generateBasicProductAnalysis(product);
        }

        try {
            String prompt = createComprehensiveAnalysisPrompt(product, userContext);
            String claudeResponse = callClaudeAPI(prompt);
            Map<String, Object> analysis = parseProductAnalysis(claudeResponse);

            // Add calculated metrics
            analysis.put("pricePerformanceRatio", calculatePricePerformanceRatio(product, analysis));
            analysis.put("competitiveAdvantageScore", calculateCompetitiveAdvantage(product, analysis));
            analysis.put("riskAdjustedValue", calculateRiskAdjustedValue(product, analysis));

            return analysis;

        } catch (Exception e) {
            logger.error("❌ [Individual Analysis] Failed for '{}': {}", product.getName(), e.getMessage());
            return generateBasicProductAnalysis(product);
        }
    }

    /**
     * Create comprehensive analysis prompt with hundreds of parameters
     */
    private String createComprehensiveAnalysisPrompt(Product product, String userContext) {
        return String.format("""
            Perform a comprehensive analysis of this product using hundreds of detailed parameters:

            PRODUCT:
            Name: %s
            Brand: %s
            Price: $%.2f
            Original Price: $%.2f
            Category: %s
            Condition: %s
            Description: %s

            USER CONTEXT: %s

            Analyze using these detailed parameter categories (score 0.0-10.0):

            QUALITY & PERFORMANCE METRICS:
            {
                "overallQualityScore": 8.5,
                "buildQualityScore": 8.8,
                "materialQualityScore": 8.2,
                "craftsmanshipScore": 8.7,
                "durabilityScore": 8.9,
                "reliabilityScore": 8.4,
                "performanceScore": 8.6,
                "functionalityScore": 9.1,
                "efficiencyScore": 8.3,
                "consistencyScore": 8.5,
                "precisionScore": 8.0,
                "speedScore": 8.7,
                "capacityScore": 8.2,
                "powerScore": 8.8,
                "stabilityScore": 8.6
            },

            VALUE & ECONOMICS METRICS:
            {
                "overallValueScore": 8.3,
                "priceCompetitivenessScore": 8.1,
                "costEffectivenessScore": 8.5,
                "investmentWorthinessScore": 8.0,
                "budgetFriendlinessScore": 7.8,
                "discountValueScore": 8.7,
                "totalCostOfOwnershipScore": 8.2,
                "resaleValueScore": 7.9,
                "depreciationResistanceScore": 7.5,
                "maintenanceCostScore": 8.4,
                "operatingCostScore": 8.6,
                "upgradeValueScore": 7.7,
                "warrantyValueScore": 8.1,
                "insuranceValueScore": 8.0,
                "financingOptionsScore": 8.2
            },

            USER EXPERIENCE METRICS:
            {
                "usabilityScore": 8.7,
                "easeOfUseScore": 8.9,
                "learningCurveScore": 8.2,
                "interfaceQualityScore": 8.5,
                "ergonomicsScore": 8.3,
                "comfortScore": 8.6,
                "accessibilityScore": 8.1,
                "customizationScore": 7.9,
                "personalizationScore": 8.0,
                "flexibilityScore": 8.4,
                "adaptabilityScore": 8.2,
                "responsivenesScore": 8.8,
                "feedbackQualityScore": 8.3,
                "errorHandlingScore": 8.1,
                "troubleshootingScore": 7.8
            },

            DESIGN & AESTHETICS METRICS:
            {
                "overallDesignScore": 8.4,
                "visualAppealScore": 8.6,
                "aestheticQualityScore": 8.3,
                "styleScore": 8.5,
                "modernityScore": 8.2,
                "timelessnessScore": 8.0,
                "brandImageScore": 8.7,
                "premiumFeelScore": 8.1,
                "attentionToDetailScore": 8.4,
                "finishQualityScore": 8.6,
                "colorOptionsScore": 7.9,
                "sizeOptionsScore": 8.0,
                "formFactorScore": 8.3,
                "portabilityScore": 8.2,
                "compactnessScore": 7.8
            },

            TECHNICAL SPECIFICATIONS:
            {
                "technicalInnovationScore": 8.1,
                "technologyMaturityScore": 8.5,
                "specificationCompletenessScore": 8.3,
                "performanceSpecsScore": 8.7,
                "connectivityScore": 8.2,
                "compatibilityScore": 8.4,
                "standardsComplianceScore": 8.6,
                "futureProofingScore": 7.9,
                "upgradeabilityScore": 7.7,
                "modularityScore": 7.5,
                "interoperabilityScore": 8.1,
                "scalabilityScore": 8.0,
                "extensibilityScore": 7.8,
                "integrationScore": 8.2,
                "apiQualityScore": 8.0
            },

            MARKET & COMPETITIVE METRICS:
            {
                "marketPositionScore": 8.3,
                "competitiveAdvantageScore": 8.1,
                "brandReputationScore": 8.7,
                "marketShareScore": 8.0,
                "innovationLeadershipScore": 7.9,
                "trendAlignmentScore": 8.2,
                "customerLoyaltyScore": 8.5,
                "wordOfMouthScore": 8.3,
                "socialProofScore": 8.1,
                "expertEndorsementScore": 8.0,
                "awardRecognitionScore": 7.8,
                "mediaAttentionScore": 8.2,
                "influencerSupportScore": 7.9,
                "communityEngagementScore": 8.0,
                "viralPotentialScore": 7.6
            },

            SUPPORT & SERVICE METRICS:
            {
                "customerSupportScore": 8.2,
                "supportAvailabilityScore": 8.4,
                "supportQualityScore": 8.1,
                "responseTimeScore": 8.3,
                "problemResolutionScore": 8.0,
                "documentationScore": 8.2,
                "tutorialQualityScore": 7.9,
                "communityForumsScore": 8.1,
                "knowledgeBaseScore": 8.0,
                "trainingResourcesScore": 7.8,
                "onboardingScore": 8.2,
                "maintenanceServicesScore": 8.1,
                "repairServicesScore": 7.9,
                "replacementPolicyScore": 8.0,
                "returnPolicyScore": 8.3
            },

            SUSTAINABILITY & ETHICS METRICS:
            {
                "environmentalImpactScore": 7.5,
                "sustainabilityScore": 7.3,
                "recyclabilityScore": 7.8,
                "energyEfficiencyScore": 8.1,
                "carbonFootprintScore": 7.2,
                "ethicalSourcingScore": 7.6,
                "laborPracticesScore": 7.9,
                "corporateResponsibilityScore": 8.0,
                "transparencyScore": 7.7,
                "certificationScore": 7.8,
                "complianceScore": 8.2,
                "socialImpactScore": 7.5,
                "communityBenefitScore": 7.4,
                "philanthropyScore": 7.3,
                "diversityScore": 7.8
            },

            RISK ASSESSMENT:
            {
                "overallRiskScore": 3.2,
                "qualityRiskScore": 2.8,
                "performanceRiskScore": 3.0,
                "reliabilityRiskScore": 2.9,
                "supportRiskScore": 3.1,
                "obsolescenceRiskScore": 3.5,
                "securityRiskScore": 2.7,
                "privacyRiskScore": 2.6,
                "complianceRiskScore": 2.4,
                "financialRiskScore": 3.0,
                "reputationalRiskScore": 2.8,
                "operationalRiskScore": 3.2,
                "strategicRiskScore": 3.4,
                "technicalRiskScore": 3.1,
                "marketRiskScore": 3.6
            }

            DETAILED INSIGHTS:
            {
                "keyStrengths": ["strength 1", "strength 2", "strength 3", "strength 4", "strength 5"],
                "keyWeaknesses": ["weakness 1", "weakness 2", "weakness 3"],
                "uniqueSellingPoints": ["usp 1", "usp 2", "usp 3", "usp 4"],
                "competitiveAdvantages": ["advantage 1", "advantage 2", "advantage 3"],
                "potentialConcerns": ["concern 1", "concern 2", "concern 3"],
                "bestUseCases": ["use case 1", "use case 2", "use case 3"],
                "targetAudience": ["audience 1", "audience 2", "audience 3"],
                "alternativeProducts": ["alternative 1", "alternative 2", "alternative 3"],
                "complementaryProducts": ["complement 1", "complement 2"],
                "upgradePathway": ["upgrade option 1", "upgrade option 2"]
            }

            Be extremely detailed, objective, and unbiased. Consider all aspects that would matter to different types of users.
            """,
            product.getName(),
            product.getBrand() != null ? product.getBrand() : "Unknown",
            product.getPrice(),
            product.getOriginalPrice(),
            product.getCategory() != null ? product.getCategory() : "General",
            product.getCondition() != null ? product.getCondition() : "Unknown",
            product.getDescription() != null ? product.getDescription() : "No description available",
            userContext != null ? userContext : "General consumer"
        );
    }

    /**
     * Perform cross-product comparative analysis
     */
    private Map<String, Object> performCrossProductAnalysis(List<Product> products, List<Map<String, Object>> individualAnalyses, String userContext) {
        logger.info("📊 [Comparative Analysis] Cross-analyzing {} products", products.size());

        if (claudeApiKey == null || claudeApiKey.trim().isEmpty()) {
            return generateBasicComparativeAnalysis(products, individualAnalyses);
        }

        try {
            String prompt = createComparativeAnalysisPrompt(products, individualAnalyses, userContext);
            String claudeResponse = callClaudeAPI(prompt);
            return parseComparativeAnalysis(claudeResponse);

        } catch (Exception e) {
            logger.error("❌ [Comparative Analysis] Failed: {}", e.getMessage());
            return generateBasicComparativeAnalysis(products, individualAnalyses);
        }
    }

    /**
     * Generate unbiased recommendations based on comprehensive analysis
     */
    private Map<String, Object> generateUnbiasedRecommendations(List<Product> products, List<Map<String, Object>> individualAnalyses, Map<String, Object> comparativeAnalysis, String userContext) {
        logger.info("🎯 [Recommendations] Generating unbiased recommendations");

        if (claudeApiKey == null || claudeApiKey.trim().isEmpty()) {
            return generateBasicRecommendations(products, individualAnalyses);
        }

        try {
            String prompt = createRecommendationPrompt(products, individualAnalyses, comparativeAnalysis, userContext);
            String claudeResponse = callClaudeAPI(prompt);
            return parseRecommendations(claudeResponse);

        } catch (Exception e) {
            logger.error("❌ [Recommendations] Failed: {}", e.getMessage());
            return generateBasicRecommendations(products, individualAnalyses);
        }
    }

    /**
     * Generate comparison matrix for visualization
     */
    private Map<String, Object> generateComparisonMatrix(List<Product> products, List<Map<String, Object>> individualAnalyses) {
        Map<String, Object> matrix = new HashMap<>();

        // Categories to compare
        String[] categories = {
            "overallQualityScore", "overallValueScore", "usabilityScore", "overallDesignScore",
            "technicalInnovationScore", "marketPositionScore", "customerSupportScore",
            "sustainabilityScore", "overallRiskScore"
        };

        for (String category : categories) {
            List<Map<String, Object>> categoryData = new ArrayList<>();
            for (int i = 0; i < products.size(); i++) {
                Product product = products.get(i);
                Map<String, Object> analysis = individualAnalyses.get(i);

                Map<String, Object> dataPoint = new HashMap<>();
                dataPoint.put("productName", product.getName());
                dataPoint.put("productId", product.getId());
                dataPoint.put("score", extractScore(analysis, category, 7.5));
                categoryData.add(dataPoint);
            }
            matrix.put(category, categoryData);
        }

        return matrix;
    }

    /**
     * Generate visualization data for charts and graphs
     */
    private Map<String, Object> generateVisualizationData(List<Product> products, List<Map<String, Object>> individualAnalyses) {
        Map<String, Object> vizData = new HashMap<>();

        // Radar chart data
        Map<String, Object> radarData = new HashMap<>();
        List<String> radarLabels = Arrays.asList(
            "Quality", "Value", "Usability", "Design", "Innovation",
            "Market Position", "Support", "Sustainability"
        );
        radarData.put("labels", radarLabels);

        List<Map<String, Object>> datasets = new ArrayList<>();
        for (int i = 0; i < products.size(); i++) {
            Product product = products.get(i);
            Map<String, Object> analysis = individualAnalyses.get(i);

            Map<String, Object> dataset = new HashMap<>();
            dataset.put("label", product.getName());
            dataset.put("data", Arrays.asList(
                extractScore(analysis, "overallQualityScore", 7.5),
                extractScore(analysis, "overallValueScore", 7.5),
                extractScore(analysis, "usabilityScore", 7.5),
                extractScore(analysis, "overallDesignScore", 7.5),
                extractScore(analysis, "technicalInnovationScore", 7.5),
                extractScore(analysis, "marketPositionScore", 7.5),
                extractScore(analysis, "customerSupportScore", 7.5),
                extractScore(analysis, "sustainabilityScore", 7.5)
            ));
            datasets.add(dataset);
        }
        radarData.put("datasets", datasets);
        vizData.put("radarChart", radarData);

        // Price vs Quality scatter plot
        Map<String, Object> scatterData = new HashMap<>();
        List<Map<String, Object>> scatterPoints = new ArrayList<>();
        for (int i = 0; i < products.size(); i++) {
            Product product = products.get(i);
            Map<String, Object> analysis = individualAnalyses.get(i);

            Map<String, Object> point = new HashMap<>();
            point.put("x", product.getPrice());
            point.put("y", extractScore(analysis, "overallQualityScore", 7.5));
            point.put("productName", product.getName());
            scatterPoints.add(point);
        }
        scatterData.put("data", scatterPoints);
        vizData.put("priceQualityScatter", scatterData);

        return vizData;
    }

    // Helper methods for API calls and parsing
    private String callClaudeAPI(String prompt) {
        if (claudeApiKey == null || claudeApiKey.trim().isEmpty()) {
            throw new RuntimeException("Claude API key not configured");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", claudeApiKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> requestBody = Map.of(
            "model", "claude-3-sonnet-20240229",
            "max_tokens", 4000,
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

    // Helper methods for calculations and parsing
    private double calculatePricePerformanceRatio(Product product, Map<String, Object> analysis) {
        double qualityScore = extractScore(analysis, "overallQualityScore", 7.5);
        double price = product.getPrice();
        return price > 0 ? (qualityScore * 100) / price : qualityScore;
    }

    private double calculateCompetitiveAdvantage(Product product, Map<String, Object> analysis) {
        double innovation = extractScore(analysis, "technicalInnovationScore", 7.5);
        double market = extractScore(analysis, "marketPositionScore", 7.5);
        double brand = extractScore(analysis, "brandReputationScore", 7.5);
        return (innovation + market + brand) / 3.0;
    }

    private double calculateRiskAdjustedValue(Product product, Map<String, Object> analysis) {
        double value = extractScore(analysis, "overallValueScore", 7.5);
        double risk = extractScore(analysis, "overallRiskScore", 3.0);
        return value * (1 - (risk / 10.0));
    }

    private double extractScore(Map<String, Object> analysis, String key, double defaultValue) {
        try {
            Object value = analysis.get(key);
            if (value instanceof Number) {
                return ((Number) value).doubleValue();
            }
        } catch (Exception e) {
            // Ignore and return default
        }
        return defaultValue;
    }

    private double calculateOverallConfidence(List<Map<String, Object>> analyses) {
        if (analyses.isEmpty()) return 0.5;

        double totalConfidence = analyses.stream()
            .mapToDouble(analysis -> extractScore(analysis, "confidence", 0.7))
            .sum();

        return totalConfidence / analyses.size();
    }

    // Fallback methods
    private Map<String, Object> createEmptyComparison() {
        Map<String, Object> result = new HashMap<>();
        result.put("totalProducts", 0);
        result.put("message", "No products to compare");
        result.put("recommendations", Map.of("message", "Please provide products to compare"));
        return result;
    }

    private Map<String, Object> generateBasicProductAnalysis(Product product) {
        Map<String, Object> analysis = new HashMap<>();
        analysis.put("overallQualityScore", 7.5);
        analysis.put("overallValueScore", 7.0 + (product.getOriginalPrice() - product.getPrice()) / product.getOriginalPrice() * 2);
        analysis.put("usabilityScore", 8.0);
        analysis.put("confidence", 0.6);
        return analysis;
    }

    private Map<String, Object> generateBasicComparativeAnalysis(List<Product> products, List<Map<String, Object>> analyses) {
        Map<String, Object> comparison = new HashMap<>();
        comparison.put("totalProductsAnalyzed", products.size());
        comparison.put("analysisType", "Basic Comparison");
        comparison.put("confidence", 0.6);
        return comparison;
    }

    private Map<String, Object> generateBasicRecommendations(List<Product> products, List<Map<String, Object>> analyses) {
        Map<String, Object> recommendations = new HashMap<>();
        recommendations.put("topChoice", products.get(0).getName());
        recommendations.put("reason", "Based on available criteria");
        recommendations.put("confidence", 0.6);
        return recommendations;
    }

    private Map<String, Object> generateFallbackComparison(List<Product> products, String userContext) {
        logger.info("🔄 [Fallback Comparison] Generating fallback comparison for {} products", products.size());

        Map<String, Object> result = new HashMap<>();
        result.put("totalProducts", products.size());
        result.put("analysisType", "Fallback Analysis");
        result.put("message", "Detailed analysis unavailable, showing basic comparison");
        result.put("products", products);
        result.put("confidence", 0.5);

        return result;
    }

    // Additional prompt creation and parsing methods would go here
    private String createComparativeAnalysisPrompt(List<Product> products, List<Map<String, Object>> individualAnalyses, String userContext) {
        // Implementation for comparative analysis prompt
        return "Comparative analysis prompt for " + products.size() + " products";
    }

    private String createRecommendationPrompt(List<Product> products, List<Map<String, Object>> individualAnalyses, Map<String, Object> comparativeAnalysis, String userContext) {
        // Implementation for recommendation prompt
        return "Recommendation prompt for " + products.size() + " products";
    }

    private Map<String, Object> parseProductAnalysis(String response) {
        try {
            String jsonStr = extractJsonFromResponse(response);
            return objectMapper.readValue(jsonStr, Map.class);
        } catch (Exception e) {
            return generateBasicProductAnalysis(new Product());
        }
    }

    private Map<String, Object> parseComparativeAnalysis(String response) {
        try {
            String jsonStr = extractJsonFromResponse(response);
            return objectMapper.readValue(jsonStr, Map.class);
        } catch (Exception e) {
            return Map.of("analysisType", "Basic", "confidence", 0.6);
        }
    }

    private Map<String, Object> parseRecommendations(String response) {
        try {
            String jsonStr = extractJsonFromResponse(response);
            return objectMapper.readValue(jsonStr, Map.class);
        } catch (Exception e) {
            return Map.of("recommendation", "Basic analysis completed", "confidence", 0.6);
        }
    }

    private String extractJsonFromResponse(String response) {
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
}
package com.projectai.service;

import com.projectai.models.Product;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.*;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@Service
public class QualityScoreAIService {

    public static class QualityScoreResult {
        public int overallScore;
        public Map<String, Integer> categoryScores;
        public String qualityGrade;
        public List<String> qualityFactors;
        public List<String> recommendations;
        public double marketValueEstimate;
        public String reliabilityIndex;

        public QualityScoreResult() {
            this.categoryScores = new HashMap<>();
            this.qualityFactors = new ArrayList<>();
            this.recommendations = new ArrayList<>();
        }
    }

    public QualityScoreResult analyzeProductQuality(Product product) {
        QualityScoreResult result = new QualityScoreResult();

        // Calculate various quality dimensions
        int conditionScore = calculateConditionScore(product);
        int brandScore = calculateBrandScore(product);
        int descriptionScore = calculateDescriptionScore(product);
        int pricingScore = calculatePricingScore(product);
        int ageScore = calculateAgeScore(product);
        int categoryScore = calculateCategoryScore(product);

        // Store individual scores
        result.categoryScores.put("condition", conditionScore);
        result.categoryScores.put("brand", brandScore);
        result.categoryScores.put("description", descriptionScore);
        result.categoryScores.put("pricing", pricingScore);
        result.categoryScores.put("age", ageScore);
        result.categoryScores.put("category", categoryScore);

        // Calculate weighted overall score
        result.overallScore = calculateOverallScore(
            conditionScore, brandScore, descriptionScore,
            pricingScore, ageScore, categoryScore
        );

        // Determine quality grade
        result.qualityGrade = determineQualityGrade(result.overallScore);

        // Generate quality factors and recommendations
        result.qualityFactors = generateQualityFactors(product, result.categoryScores);
        result.recommendations = generateRecommendations(product, result.categoryScores);

        // Estimate market value
        result.marketValueEstimate = estimateMarketValue(product, result.overallScore);

        // Calculate reliability index
        result.reliabilityIndex = calculateReliabilityIndex(product, result.overallScore);

        return result;
    }

    private int calculateConditionScore(Product product) {
        if (product.getCondition() == null) return 50;

        String condition = product.getCondition().toLowerCase();
        switch (condition) {
            case "new":
            case "like new":
            case "excellent":
                return 95;
            case "very good":
            case "very_good":
                return 85;
            case "good":
                return 70;
            case "fair":
                return 55;
            case "poor":
                return 30;
            default:
                return 60;
        }
    }

    private int calculateBrandScore(Product product) {
        if (product.getBrand() == null || product.getBrand().isEmpty()) return 50;

        String brand = product.getBrand().toLowerCase();

        // Premium luxury brands
        if (Arrays.asList("gucci", "prada", "louis vuitton", "chanel", "hermès", "dior").contains(brand)) {
            return 100;
        }

        // High-end brands
        if (Arrays.asList("nike", "adidas", "apple", "samsung", "sony", "canon", "levi's",
                         "ralph lauren", "tommy hilfiger", "calvin klein").contains(brand)) {
            return 90;
        }

        // Mid-tier brands
        if (Arrays.asList("zara", "h&m", "uniqlo", "gap", "old navy", "target",
                         "dell", "hp", "lenovo").contains(brand)) {
            return 75;
        }

        // Generic or unknown brands
        return 60;
    }

    private int calculateDescriptionScore(Product product) {
        if (product.getDescription() == null || product.getDescription().isEmpty()) {
            return 30;
        }

        String description = product.getDescription().toLowerCase();
        int score = 50; // Base score

        // Length bonus
        if (description.length() > 100) score += 20;
        else if (description.length() > 50) score += 10;

        // Quality indicators
        String[] qualityWords = {"excellent", "perfect", "mint", "pristine", "flawless",
                                "authentic", "genuine", "original", "vintage", "rare"};
        for (String word : qualityWords) {
            if (description.contains(word)) score += 5;
        }

        // Detail indicators
        String[] detailWords = {"measurements", "dimensions", "material", "fabric",
                               "size", "color", "model", "year", "features"};
        for (String word : detailWords) {
            if (description.contains(word)) score += 3;
        }

        return Math.min(100, score);
    }

    private int calculatePricingScore(Product product) {
        if (product.getOriginalPrice() <= 0) return 60;

        double discountPercentage = product.getDiscountPercentage();

        // Sweet spot for thrift pricing (40-80% off)
        if (discountPercentage >= 40 && discountPercentage <= 80) {
            return 90;
        }

        // Good deals (20-40% off or 80-90% off)
        if ((discountPercentage >= 20 && discountPercentage < 40) ||
            (discountPercentage > 80 && discountPercentage <= 90)) {
            return 75;
        }

        // Minimal discount or too good to be true
        if (discountPercentage < 20 || discountPercentage > 90) {
            return 50;
        }

        return 60;
    }

    private int calculateAgeScore(Product product) {
        if (product.getCreatedAt() == null) return 70;

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime created = product.getCreatedAt();
        long daysOld = java.time.Duration.between(created, now).toDays();

        // Newer listings are generally better (more accurate info)
        if (daysOld <= 7) return 90;
        if (daysOld <= 30) return 80;
        if (daysOld <= 90) return 70;
        if (daysOld <= 180) return 60;
        return 50;
    }

    private int calculateCategoryScore(Product product) {
        if (product.getCategory() == null) return 50;

        String category = product.getCategory().toLowerCase();

        // High-demand categories
        if (Arrays.asList("electronics", "designer clothing", "shoes", "bags",
                         "jewelry", "watches").contains(category)) {
            return 85;
        }

        // Medium-demand categories
        if (Arrays.asList("clothing", "books", "home", "sports", "toys").contains(category)) {
            return 75;
        }

        return 65;
    }

    private int calculateOverallScore(int condition, int brand, int description,
                                    int pricing, int age, int category) {
        // Weighted average with condition and brand being most important
        return (int) Math.round(
            condition * 0.25 +       // 25% weight
            brand * 0.20 +           // 20% weight
            description * 0.15 +     // 15% weight
            pricing * 0.20 +         // 20% weight
            age * 0.10 +             // 10% weight
            category * 0.10          // 10% weight
        );
    }

    private String determineQualityGrade(int score) {
        if (score >= 90) return "A+";
        if (score >= 85) return "A";
        if (score >= 80) return "A-";
        if (score >= 75) return "B+";
        if (score >= 70) return "B";
        if (score >= 65) return "B-";
        if (score >= 60) return "C+";
        if (score >= 55) return "C";
        if (score >= 50) return "C-";
        return "D";
    }

    private List<String> generateQualityFactors(Product product, Map<String, Integer> scores) {
        List<String> factors = new ArrayList<>();

        // Positive factors
        if (scores.get("condition") >= 85) {
            factors.add("Excellent condition reported");
        }
        if (scores.get("brand") >= 85) {
            factors.add("Premium brand recognition");
        }
        if (scores.get("description") >= 80) {
            factors.add("Detailed product description");
        }
        if (scores.get("pricing") >= 80) {
            factors.add("Competitive pricing vs retail");
        }

        // Areas for improvement
        if (scores.get("condition") < 60) {
            factors.add("Condition may need verification");
        }
        if (scores.get("brand") < 60) {
            factors.add("Brand value assessment needed");
        }
        if (scores.get("description") < 50) {
            factors.add("Limited product information");
        }

        return factors;
    }

    private List<String> generateRecommendations(Product product, Map<String, Integer> scores) {
        List<String> recommendations = new ArrayList<>();

        if (scores.get("description") < 60) {
            recommendations.add("Request additional photos or details");
        }

        if (scores.get("pricing") < 60) {
            recommendations.add("Compare with similar listings");
        }

        if (scores.get("condition") < 70) {
            recommendations.add("Inspect item thoroughly before purchase");
        }

        if (scores.get("brand") >= 85 && scores.get("pricing") >= 80) {
            recommendations.add("Strong purchase candidate - good brand at fair price");
        }

        if (product.getOriginalPrice() > 0 && product.getDiscountPercentage() > 70) {
            recommendations.add("Verify authenticity due to significant discount");
        }

        return recommendations;
    }

    private double estimateMarketValue(Product product, int qualityScore) {
        double basePrice = product.getPrice();
        double multiplier = 1.0;

        // Adjust based on quality score
        if (qualityScore >= 90) multiplier = 1.2;
        else if (qualityScore >= 80) multiplier = 1.1;
        else if (qualityScore >= 70) multiplier = 1.0;
        else if (qualityScore >= 60) multiplier = 0.9;
        else multiplier = 0.8;

        return basePrice * multiplier;
    }

    private String calculateReliabilityIndex(Product product, int qualityScore) {
        StringBuilder reliability = new StringBuilder();

        if (qualityScore >= 85) {
            reliability.append("High");
        } else if (qualityScore >= 70) {
            reliability.append("Medium");
        } else {
            reliability.append("Low");
        }

        // Add confidence indicators
        if (product.getImageUrl() != null && !product.getImageUrl().isEmpty()) {
            reliability.append(" (Photos Available)");
        }

        if (product.getDescription() != null && product.getDescription().length() > 100) {
            reliability.append(" (Detailed)");
        }

        return reliability.toString();
    }

    public List<Product> rankProductsByQuality(List<Product> products) {
        return products.stream()
            .map(product -> {
                QualityScoreResult quality = analyzeProductQuality(product);
                // Add transient quality data to product metadata
                Map<String, Object> metadata = product.getLocationMetadata();
                metadata.put("qualityScore", quality.overallScore);
                metadata.put("qualityGrade", quality.qualityGrade);
                product.setLocationMetadata(metadata);
                return product;
            })
            .sorted((p1, p2) -> {
                Integer score1 = (Integer) p1.getLocationMetadata().get("qualityScore");
                Integer score2 = (Integer) p2.getLocationMetadata().get("qualityScore");
                return score2.compareTo(score1); // Descending order
            })
            .collect(Collectors.toList());
    }

    public Map<String, Object> generateQualityInsights(List<Product> products) {
        Map<String, Object> insights = new HashMap<>();

        if (products.isEmpty()) {
            insights.put("message", "No products to analyze");
            return insights;
        }

        List<QualityScoreResult> scores = products.stream()
            .map(this::analyzeProductQuality)
            .collect(Collectors.toList());

        double avgScore = scores.stream()
            .mapToInt(s -> s.overallScore)
            .average()
            .orElse(0.0);

        long highQuality = scores.stream()
            .mapToInt(s -> s.overallScore)
            .filter(score -> score >= 80)
            .count();

        insights.put("averageQualityScore", Math.round(avgScore));
        insights.put("highQualityCount", highQuality);
        insights.put("totalAnalyzed", products.size());
        insights.put("highQualityPercentage", Math.round((highQuality * 100.0) / products.size()));

        // Find best product
        QualityScoreResult bestQuality = scores.stream()
            .max(Comparator.comparingInt(s -> s.overallScore))
            .orElse(null);

        if (bestQuality != null) {
            insights.put("bestQualityGrade", bestQuality.qualityGrade);
        }

        return insights;
    }
}
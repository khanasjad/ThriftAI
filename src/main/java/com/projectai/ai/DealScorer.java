package com.projectai.ai;

import com.projectai.models.Deal;
import com.projectai.models.Product;
import com.projectai.models.UserPreferences;
import java.util.Map;
import java.util.HashMap;

public class DealScorer {
    
    private static final double DISCOUNT_WEIGHT = 0.3;
    private static final double BRAND_WEIGHT = 0.2;
    private static final double CONDITION_WEIGHT = 0.15;
    private static final double CATEGORY_WEIGHT = 0.15;
    private static final double PRICE_WEIGHT = 0.1;
    private static final double AVAILABILITY_WEIGHT = 0.1;
    
    private Map<String, Double> brandScores;
    private Map<String, Double> conditionScores;
    
    public DealScorer() {
        initializeBrandScores();
        initializeConditionScores();
    }
    
    private void initializeBrandScores() {
        brandScores = new HashMap<>();
        // Premium brands get higher scores
        brandScores.put("NIKE", 95.0);
        brandScores.put("ADIDAS", 90.0);
        brandScores.put("LEVI'S", 85.0);
        brandScores.put("APPLE", 95.0);
        brandScores.put("SAMSUNG", 88.0);
        brandScores.put("ZARA", 80.0);
        brandScores.put("H&M", 75.0);
        brandScores.put("UNIQLO", 82.0);
        // Default score for unknown brands
        brandScores.put("UNKNOWN", 60.0);
    }
    
    private void initializeConditionScores() {
        conditionScores = new HashMap<>();
        conditionScores.put("NEW", 100.0);
        conditionScores.put("LIKE_NEW", 95.0);
        conditionScores.put("EXCELLENT", 85.0);
        conditionScores.put("VERY_GOOD", 75.0);
        conditionScores.put("GOOD", 65.0);
        conditionScores.put("FAIR", 50.0);
        conditionScores.put("POOR", 30.0);
        conditionScores.put("UNKNOWN", 60.0);
    }
    
    public double calculateDealScore(Product product, UserPreferences preferences) {
        double totalScore = 0.0;
        
        // 1. Discount Score (30%)
        double discountScore = calculateDiscountScore(product);
        totalScore += discountScore * DISCOUNT_WEIGHT;
        
        // 2. Brand Score (20%)
        double brandScore = calculateBrandScore(product);
        totalScore += brandScore * BRAND_WEIGHT;
        
        // 3. Condition Score (15%)
        double conditionScore = calculateConditionScore(product);
        totalScore += conditionScore * CONDITION_WEIGHT;
        
        // 4. Category Preference Score (15%)
        double categoryScore = calculateCategoryScore(product, preferences);
        totalScore += categoryScore * CATEGORY_WEIGHT;
        
        // 5. Price Attractiveness Score (10%)
        double priceScore = calculatePriceScore(product, preferences);
        totalScore += priceScore * PRICE_WEIGHT;
        
        // 6. Availability Score (10%)
        double availabilityScore = product.isAvailable() ? 100.0 : 0.0;
        totalScore += availabilityScore * AVAILABILITY_WEIGHT;
        
        // Apply user preference multiplier
        totalScore *= getUserPreferenceMultiplier(product, preferences);
        
        return Math.min(100.0, Math.max(0.0, totalScore));
    }
    
    private double calculateDiscountScore(Product product) {
        double discountPercentage = product.getDiscountPercentage();
        
        if (discountPercentage >= 70) return 100.0;
        if (discountPercentage >= 50) return 90.0;
        if (discountPercentage >= 30) return 80.0;
        if (discountPercentage >= 20) return 70.0;
        if (discountPercentage >= 10) return 60.0;
        if (discountPercentage >= 5) return 50.0;
        
        return Math.max(20.0, discountPercentage * 2);
    }
    
    private double calculateBrandScore(Product product) {
        String brand = product.getBrand();
        if (brand == null || brand.trim().isEmpty()) {
            return brandScores.get("UNKNOWN");
        }
        return brandScores.getOrDefault(brand.toUpperCase(), brandScores.get("UNKNOWN"));
    }
    
    private double calculateConditionScore(Product product) {
        String condition = product.getCondition();
        if (condition == null || condition.trim().isEmpty()) {
            return conditionScores.get("UNKNOWN");
        }
        return conditionScores.getOrDefault(condition.toUpperCase(), conditionScores.get("UNKNOWN"));
    }
    
    private double calculateCategoryScore(Product product, UserPreferences preferences) {
        if (preferences.getPreferredCategories().isEmpty()) {
            return 70.0; // Neutral score if no preferences
        }
        
        if (preferences.getPreferredCategories().contains(product.getCategory())) {
            return 100.0 * preferences.getCategoryWeight(product.getCategory());
        }
        
        return 30.0; // Lower score for non-preferred categories
    }
    
    private double calculatePriceScore(Product product, UserPreferences preferences) {
        double price = product.getPrice();
        double maxBudget = preferences.getMaxBudget();
        
        if (price > maxBudget) return 0.0;
        
        // Higher score for lower prices relative to budget
        double priceRatio = price / maxBudget;
        if (priceRatio <= 0.25) return 100.0;
        if (priceRatio <= 0.5) return 90.0;
        if (priceRatio <= 0.75) return 70.0;
        
        return Math.max(20.0, (1.0 - priceRatio) * 100);
    }
    
    private double getUserPreferenceMultiplier(Product product, UserPreferences preferences) {
        double multiplier = 1.0;
        
        // Boost for preferred brands
        if (preferences.getPreferredBrands().contains(product.getBrand())) {
            multiplier *= 1.2;
        }
        
        // Boost for preferred sizes
        if (preferences.getPreferredSizes().contains(product.getSize())) {
            multiplier *= 1.1;
        }
        
        // Boost for preferred stores
        if (preferences.getPreferredStores().contains(product.getStoreId())) {
            multiplier *= 1.15;
        }
        
        return Math.min(1.5, multiplier); // Cap at 50% boost
    }
    
    public String getDealScoreReason(Product product, UserPreferences preferences, double score) {
        StringBuilder reason = new StringBuilder();
        
        if (score >= 90) {
            reason.append("Exceptional deal! ");
        } else if (score >= 80) {
            reason.append("Excellent deal! ");
        } else if (score >= 70) {
            reason.append("Very good deal! ");
        } else if (score >= 60) {
            reason.append("Good deal! ");
        } else {
            reason.append("Fair deal. ");
        }
        
        double discount = product.getDiscountPercentage();
        if (discount > 50) {
            reason.append(String.format("Huge %.0f%% discount! ", discount));
        } else if (discount > 20) {
            reason.append(String.format("Great %.0f%% discount! ", discount));
        }
        
        if (preferences.getPreferredBrands().contains(product.getBrand())) {
            reason.append("From your preferred brand. ");
        }
        
        if (preferences.getPreferredCategories().contains(product.getCategory())) {
            reason.append("In your favorite category. ");
        }
        
        return reason.toString().trim();
    }
}
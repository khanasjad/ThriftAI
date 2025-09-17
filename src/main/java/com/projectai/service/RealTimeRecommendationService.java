package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.models.Seller;
import com.projectai.repository.ProductRepository;
import com.projectai.service.UserBehaviorAnalyticsService.InteractionType;
import com.projectai.service.UserBehaviorAnalyticsService.UserInteraction;
import com.projectai.service.PersonalizedStyleProfilingService.PersonalizedStyleProfile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
public class RealTimeRecommendationService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private RecommendationEngineService recommendationEngine;
    
    @Autowired
    private UserBehaviorAnalyticsService behaviorAnalyticsService;
    
    @Autowired
    private PersonalizedStyleProfilingService styleProfilingService;
    
    @Autowired
    private MLProductMatchingService mlProductMatchingService;
    
    @Autowired
    private IntelligentSearchService intelligentSearchService;
    
    // Real-time recommendation storage
    private final Map<String, List<RealTimeRecommendation>> userRecommendations = new ConcurrentHashMap<>();
    private final Map<String, RecommendationContext> userContexts = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> lastRecommendationUpdate = new ConcurrentHashMap<>();
    private final List<RecommendationEvent> realtimeEvents = new CopyOnWriteArrayList<>();
    
    // Real-time parameters
    private static final int MAX_REALTIME_RECOMMENDATIONS = 20;
    private static final int RECOMMENDATION_CACHE_MINUTES = 15;
    private static final double INTERACTION_BOOST_FACTOR = 1.5;
    private static final double TRENDING_BOOST_FACTOR = 1.3;
    private static final double FRESHNESS_BOOST_FACTOR = 1.2;
    
    @Async
    public CompletableFuture<List<RealTimeRecommendation>> generateRealTimeRecommendations(String userId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Check if we have fresh recommendations
                if (hasFreshRecommendations(userId)) {
                    return userRecommendations.getOrDefault(userId, new ArrayList<>());
                }
                
                // Generate new real-time recommendations
                List<RealTimeRecommendation> recommendations = computeRealTimeRecommendations(userId);
                
                // Cache the recommendations
                userRecommendations.put(userId, recommendations);
                lastRecommendationUpdate.put(userId, LocalDateTime.now());
                
                return recommendations;
                
            } catch (Exception e) {
                System.err.println("Error generating real-time recommendations: " + e.getMessage());
                return new ArrayList<>();
            }
        });
    }
    
    public void onUserInteraction(String userId, InteractionType type, String itemId) {
        // Create recommendation event
        RecommendationEvent event = new RecommendationEvent(
                userId, type, itemId, LocalDateTime.now()
        );
        realtimeEvents.add(event);
        
        // Update user context
        updateUserContext(userId, event);
        
        // Trigger real-time recommendation update
        triggerRecommendationUpdate(userId, event);
        
        // Update ML models in real-time
        updateMLModelsRealTime(userId, type, itemId);
    }
    
    public List<RealTimeRecommendation> getInstantRecommendations(String userId, String currentProductId) {
        Product currentProduct = getProductById(currentProductId);
        if (currentProduct == null) {
            return getGeneralRealTimeRecommendations(userId);
        }
        
        List<RealTimeRecommendation> recommendations = new ArrayList<>();
        
        // Similar products (immediate relevance)
        List<Product> similarProducts = mlProductMatchingService.findSimilarProducts(currentProductId, 10);
        for (Product product : similarProducts.subList(0, Math.min(5, similarProducts.size()))) {
            recommendations.add(new RealTimeRecommendation(
                    product, RecommendationType.SIMILAR_PRODUCT, 0.9,
                    "Customers who viewed this also liked", LocalDateTime.now()
            ));
        }
        
        // Cross-selling opportunities
        List<Product> crossSellProducts = mlProductMatchingService.findCrossSellingOpportunities(userId, currentProductId, 5);
        for (Product product : crossSellProducts) {
            recommendations.add(new RealTimeRecommendation(
                    product, RecommendationType.CROSS_SELL, 0.8,
                    "Complete your look with", LocalDateTime.now()
            ));
        }
        
        // Trending in same category
        List<Product> trendingProducts = getTrendingInCategory(currentProduct.getCategory(), 3);
        for (Product product : trendingProducts) {
            recommendations.add(new RealTimeRecommendation(
                    product, RecommendationType.TRENDING, 0.7,
                    "Trending now in " + currentProduct.getCategory(), LocalDateTime.now()
            ));
        }
        
        return recommendations.stream()
                .sorted((a, b) -> Double.compare(b.getConfidenceScore(), a.getConfidenceScore()))
                .limit(MAX_REALTIME_RECOMMENDATIONS)
                .collect(Collectors.toList());
    }
    
    public List<RealTimeRecommendation> getContextualRecommendations(String userId, RecommendationContext context) {
        List<RealTimeRecommendation> recommendations = new ArrayList<>();
        
        // Time-based recommendations
        if (context.getCurrentTime() != null) {
            recommendations.addAll(getTimeBasedRecommendations(userId, context.getCurrentTime()));
        }
        
        // Location-based recommendations
        if (context.getUserLocation() != null) {
            recommendations.addAll(getLocationBasedRecommendations(userId, context.getUserLocation()));
        }
        
        // Weather-based recommendations
        if (context.getWeatherConditions() != null) {
            recommendations.addAll(getWeatherBasedRecommendations(userId, context.getWeatherConditions()));
        }
        
        // Device-based recommendations
        if (context.getDeviceType() != null) {
            recommendations.addAll(getDeviceBasedRecommendations(userId, context.getDeviceType()));
        }
        
        // Session-based recommendations
        if (context.getSessionData() != null) {
            recommendations.addAll(getSessionBasedRecommendations(userId, context.getSessionData()));
        }
        
        return recommendations.stream()
                .distinct()
                .sorted((a, b) -> Double.compare(b.getConfidenceScore(), a.getConfidenceScore()))
                .limit(MAX_REALTIME_RECOMMENDATIONS)
                .collect(Collectors.toList());
    }
    
    public void updateRecommendationsWithFeedback(String userId, String productId, FeedbackType feedback) {
        // Update user recommendations based on feedback
        List<RealTimeRecommendation> currentRecommendations = userRecommendations.get(userId);
        
        if (currentRecommendations != null) {
            for (RealTimeRecommendation rec : currentRecommendations) {
                if (rec.getProduct().getId().equals(productId)) {
                    // Adjust confidence based on feedback
                    double adjustment = feedback == FeedbackType.POSITIVE ? 0.1 : -0.1;
                    rec.adjustConfidence(adjustment);
                    
                    // Track feedback for learning
                    trackRecommendationFeedback(userId, productId, feedback);
                }
            }
        }
        
        // Trigger ML model update
        MLProductMatchingService.FeedbackType mlFeedback = feedback == FeedbackType.POSITIVE ? 
                MLProductMatchingService.FeedbackType.POSITIVE : MLProductMatchingService.FeedbackType.NEGATIVE;
        mlProductMatchingService.updateMLModelsWithUserFeedback(userId, productId, mlFeedback, feedback.getScore());
    }
    
    public List<RealTimeRecommendation> getMixedRecommendations(String userId) {
        List<RealTimeRecommendation> mixed = new ArrayList<>();
        
        // Get base recommendations from recommendation engine
        List<Product> baseRecommendations = recommendationEngine.getPersonalizedRecommendations(userId, 10);
        for (Product product : baseRecommendations) {
            mixed.add(new RealTimeRecommendation(
                    product, RecommendationType.PERSONALIZED, 0.8,
                    "Recommended for you", LocalDateTime.now()
            ));
        }
        
        // Add trending products
        List<String> trendingIds = behaviorAnalyticsService.getTrendingProducts(5);
        for (String productId : trendingIds) {
            Product product = getProductById(productId);
            if (product != null) {
                mixed.add(new RealTimeRecommendation(
                        product, RecommendationType.TRENDING, 0.7,
                        "Trending now", LocalDateTime.now()
                ));
            }
        }
        
        // Add style-matched products
        PersonalizedStyleProfile styleProfile = styleProfilingService.buildUserStyleProfile(userId);
        List<Product> styleMatched = styleProfilingService.findStyleMatchProducts(userId, "general", 1000.0);
        for (Product product : styleMatched.subList(0, Math.min(3, styleMatched.size()))) {
            mixed.add(new RealTimeRecommendation(
                    product, RecommendationType.STYLE_MATCH, 0.75,
                    "Matches your style", LocalDateTime.now()
            ));
        }
        
        // Add fresh arrivals
        List<Product> freshArrivals = getFreshArrivals(5);
        for (Product product : freshArrivals) {
            mixed.add(new RealTimeRecommendation(
                    product, RecommendationType.NEW_ARRIVAL, 0.6,
                    "Just added", LocalDateTime.now()
            ));
        }
        
        return mixed.stream()
                .distinct()
                .sorted((a, b) -> Double.compare(b.getConfidenceScore(), a.getConfidenceScore()))
                .limit(MAX_REALTIME_RECOMMENDATIONS)
                .collect(Collectors.toList());
    }
    
    @Scheduled(fixedDelay = 300000) // Every 5 minutes
    public void refreshRecommendationCache() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(RECOMMENDATION_CACHE_MINUTES);
        
        // Remove stale recommendations
        lastRecommendationUpdate.entrySet().removeIf(entry -> entry.getValue().isBefore(cutoff));
        
        // Refresh active user recommendations
        for (String userId : getActiveUsers()) {
            if (shouldRefreshRecommendations(userId)) {
                generateRealTimeRecommendations(userId);
            }
        }
        
        // Clean up old events
        realtimeEvents.removeIf(event -> event.getTimestamp().isBefore(LocalDateTime.now().minusHours(1)));
    }
    
    @Scheduled(fixedDelay = 60000) // Every minute
    public void processRealtimeEvents() {
        // Process recent events for real-time updates
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(1);
        
        List<RecommendationEvent> recentEvents = realtimeEvents.stream()
                .filter(event -> event.getTimestamp().isAfter(cutoff))
                .collect(Collectors.toList());
        
        // Group events by user
        Map<String, List<RecommendationEvent>> eventsByUser = recentEvents.stream()
                .collect(Collectors.groupingBy(RecommendationEvent::getUserId));
        
        // Update recommendations for users with recent activity
        for (Map.Entry<String, List<RecommendationEvent>> entry : eventsByUser.entrySet()) {
            String userId = entry.getKey();
            List<RecommendationEvent> userEvents = entry.getValue();
            
            if (userEvents.size() > 2) { // Threshold for triggering update
                generateRealTimeRecommendations(userId);
            }
        }
    }
    
    // Private helper methods
    private List<RealTimeRecommendation> computeRealTimeRecommendations(String userId) {
        List<RealTimeRecommendation> recommendations = new ArrayList<>();
        
        // Get user's recent activity
        List<UserInteraction> recentInteractions = behaviorAnalyticsService.getUserInteractions(userId, 20);
        
        // Get user's style profile
        PersonalizedStyleProfile styleProfile = styleProfilingService.buildUserStyleProfile(userId);
        
        // Get context
        RecommendationContext context = userContexts.get(userId);
        
        // Generate recommendations based on recent activity
        for (UserInteraction interaction : recentInteractions.subList(0, Math.min(5, recentInteractions.size()))) {
            Product interactedProduct = getProductById(interaction.getItemId());
            if (interactedProduct != null) {
                // Similar products
                List<Product> similar = mlProductMatchingService.findSimilarProducts(interaction.getItemId(), 3);
                for (Product product : similar) {
                    double score = calculateRealTimeScore(product, userId, interaction, styleProfile, context);
                    recommendations.add(new RealTimeRecommendation(
                            product, RecommendationType.SIMILAR_PRODUCT, score,
                            "Because you viewed " + interactedProduct.getName(), LocalDateTime.now()
                    ));
                }
            }
        }
        
        // Add trending recommendations
        recommendations.addAll(getTrendingRecommendations(userId, styleProfile));
        
        // Add personalized recommendations
        recommendations.addAll(getPersonalizedRecommendations(userId, styleProfile));
        
        // Add contextual recommendations if context available
        if (context != null) {
            recommendations.addAll(getContextualRecommendations(userId, context));
        }
        
        return recommendations.stream()
                .distinct()
                .sorted((a, b) -> Double.compare(b.getConfidenceScore(), a.getConfidenceScore()))
                .limit(MAX_REALTIME_RECOMMENDATIONS)
                .collect(Collectors.toList());
    }
    
    private double calculateRealTimeScore(Product product, String userId, UserInteraction interaction,
                                        PersonalizedStyleProfile styleProfile, RecommendationContext context) {
        double baseScore = mlProductMatchingService.predictUserProductScore(userId, product.getId());
        
        // Apply real-time boosts
        double score = baseScore;
        
        // Interaction recency boost
        long minutesSinceInteraction = ChronoUnit.MINUTES.between(interaction.getTimestamp(), LocalDateTime.now());
        double recencyBoost = Math.max(0.1, 1.0 - (minutesSinceInteraction / 60.0)); // Decay over 1 hour
        score *= (1.0 + recencyBoost * 0.2);
        
        // Trending boost
        if (isTrendingProduct(product.getId())) {
            score *= TRENDING_BOOST_FACTOR;
        }
        
        // Freshness boost
        if (isNewProduct(product)) {
            score *= FRESHNESS_BOOST_FACTOR;
        }
        
        // Context boost
        if (context != null) {
            score *= calculateContextBoost(product, context);
        }
        
        return Math.min(score, 1.0);
    }
    
    private boolean hasFreshRecommendations(String userId) {
        LocalDateTime lastUpdate = lastRecommendationUpdate.get(userId);
        if (lastUpdate == null) return false;
        
        return ChronoUnit.MINUTES.between(lastUpdate, LocalDateTime.now()) < RECOMMENDATION_CACHE_MINUTES;
    }
    
    private void updateUserContext(String userId, RecommendationEvent event) {
        RecommendationContext context = userContexts.computeIfAbsent(userId, id -> new RecommendationContext(id));
        
        context.addEvent(event);
        context.updateLastActivity(LocalDateTime.now());
        
        // Update session data
        if (context.getSessionData() == null) {
            context.setSessionData(new SessionData());
        }
        context.getSessionData().addInteraction(event);
    }
    
    private void triggerRecommendationUpdate(String userId, RecommendationEvent event) {
        // High-impact interactions trigger immediate updates
        if (event.getType() == InteractionType.PURCHASE || 
            event.getType() == InteractionType.ADD_TO_CART) {
            
            // Invalidate current recommendations
            lastRecommendationUpdate.remove(userId);
            
            // Generate new recommendations asynchronously
            generateRealTimeRecommendations(userId);
        }
    }
    
    private void updateMLModelsRealTime(String userId, InteractionType type, String itemId) {
        // Update ML models based on real-time interactions
        FeedbackType feedback = getFeedbackTypeFromInteraction(type);
        double rating = getInteractionRating(type);
        
        mlProductMatchingService.updateMLModelsWithUserFeedback(
                userId, itemId, 
                feedback == FeedbackType.POSITIVE ? 
                        MLProductMatchingService.FeedbackType.POSITIVE : 
                        MLProductMatchingService.FeedbackType.NEGATIVE, 
                rating
        );
    }
    
    private List<RealTimeRecommendation> getGeneralRealTimeRecommendations(String userId) {
        return userRecommendations.getOrDefault(userId, new ArrayList<>());
    }
    
    private List<Product> getTrendingInCategory(String category, int limit) {
        if (category == null) return Collections.emptyList();
        
        return productRepository.findByCategoryContainingIgnoreCase(category)
                .stream()
                .filter(product -> isTrendingProduct(product.getId()))
                .limit(limit)
                .collect(Collectors.toList());
    }
    
    private List<RealTimeRecommendation> getTimeBasedRecommendations(String userId, LocalDateTime currentTime) {
        List<RealTimeRecommendation> recommendations = new ArrayList<>();
        
        int hour = currentTime.getHour();
        String timeContext;
        
        if (hour >= 6 && hour < 12) {
            timeContext = "morning";
        } else if (hour >= 12 && hour < 17) {
            timeContext = "afternoon";  
        } else if (hour >= 17 && hour < 22) {
            timeContext = "evening";
        } else {
            timeContext = "night";
        }
        
        // Find products suitable for this time
        List<Product> timeBasedProducts = findProductsByTimeContext(timeContext, 5);
        for (Product product : timeBasedProducts) {
            recommendations.add(new RealTimeRecommendation(
                    product, RecommendationType.TIME_BASED, 0.6,
                    "Perfect for " + timeContext, LocalDateTime.now()
            ));
        }
        
        return recommendations;
    }
    
    private List<RealTimeRecommendation> getLocationBasedRecommendations(String userId, String location) {
        // Simplified location-based recommendations
        List<RealTimeRecommendation> recommendations = new ArrayList<>();
        
        // Find local sellers or location-appropriate items
        List<Product> locationProducts = findProductsByLocation(location, 3);
        for (Product product : locationProducts) {
            recommendations.add(new RealTimeRecommendation(
                    product, RecommendationType.LOCATION_BASED, 0.65,
                    "Popular in " + location, LocalDateTime.now()
            ));
        }
        
        return recommendations;
    }
    
    private List<RealTimeRecommendation> getWeatherBasedRecommendations(String userId, String weather) {
        List<RealTimeRecommendation> recommendations = new ArrayList<>();
        
        List<Product> weatherProducts = findProductsByWeather(weather, 4);
        for (Product product : weatherProducts) {
            recommendations.add(new RealTimeRecommendation(
                    product, RecommendationType.WEATHER_BASED, 0.7,
                    "Perfect for " + weather + " weather", LocalDateTime.now()
            ));
        }
        
        return recommendations;
    }
    
    private List<RealTimeRecommendation> getDeviceBasedRecommendations(String userId, String deviceType) {
        // Device-specific recommendations (e.g., mobile users might prefer quick purchases)
        List<RealTimeRecommendation> recommendations = new ArrayList<>();
        
        if ("mobile".equals(deviceType)) {
            // Quick, easy-to-buy items for mobile users
            List<Product> quickBuyProducts = findQuickBuyProducts(3);
            for (Product product : quickBuyProducts) {
                recommendations.add(new RealTimeRecommendation(
                        product, RecommendationType.DEVICE_OPTIMIZED, 0.6,
                        "Quick buy", LocalDateTime.now()
                ));
            }
        }
        
        return recommendations;
    }
    
    private List<RealTimeRecommendation> getSessionBasedRecommendations(String userId, SessionData sessionData) {
        List<RealTimeRecommendation> recommendations = new ArrayList<>();
        
        // Analyze session behavior
        if (sessionData.getViewedCategories().size() > 1) {
            // User is browsing multiple categories, suggest cross-category items
            String dominantCategory = sessionData.getDominantCategory();
            if (dominantCategory != null) {
                List<Product> categoryProducts = productRepository.findByCategoryContainingIgnoreCase(dominantCategory)
                        .stream()
                        .limit(3)
                        .collect(Collectors.toList());
                
                for (Product product : categoryProducts) {
                    recommendations.add(new RealTimeRecommendation(
                            product, RecommendationType.SESSION_BASED, 0.65,
                            "Based on your browsing", LocalDateTime.now()
                    ));
                }
            }
        }
        
        return recommendations;
    }
    
    private List<RealTimeRecommendation> getTrendingRecommendations(String userId, PersonalizedStyleProfile styleProfile) {
        List<RealTimeRecommendation> recommendations = new ArrayList<>();
        
        List<String> trendingIds = behaviorAnalyticsService.getTrendingProducts(8);
        for (String productId : trendingIds) {
            Product product = getProductById(productId);
            if (product != null && matchesUserStyle(product, styleProfile)) {
                recommendations.add(new RealTimeRecommendation(
                        product, RecommendationType.TRENDING, 0.7,
                        "Trending now", LocalDateTime.now()
                ));
            }
        }
        
        return recommendations;
    }
    
    private List<RealTimeRecommendation> getPersonalizedRecommendations(String userId, PersonalizedStyleProfile styleProfile) {
        List<RealTimeRecommendation> recommendations = new ArrayList<>();
        
        List<Product> personalized = recommendationEngine.getPersonalizedRecommendations(userId, 8);
        for (Product product : personalized) {
            recommendations.add(new RealTimeRecommendation(
                    product, RecommendationType.PERSONALIZED, 0.8,
                    "Recommended for you", LocalDateTime.now()
            ));
        }
        
        return recommendations;
    }
    
    // Utility methods
    private Product getProductById(String productId) {
        try {
            return productRepository.findById(productId).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
    
    private boolean isTrendingProduct(String productId) {
        return behaviorAnalyticsService.getTrendingProducts(50).contains(productId);
    }
    
    private boolean isNewProduct(Product product) {
        if (product.getCreatedAt() == null) return false;
        return ChronoUnit.DAYS.between(product.getCreatedAt(), LocalDateTime.now()) <= 7;
    }
    
    private double calculateContextBoost(Product product, RecommendationContext context) {
        double boost = 1.0;
        
        // Time boost
        if (context.getCurrentTime() != null) {
            boost *= 1.1; // Small boost for time-aware recommendations
        }
        
        // Weather boost
        if (context.getWeatherConditions() != null && 
            matchesWeather(product, context.getWeatherConditions())) {
            boost *= 1.2;
        }
        
        return boost;
    }
    
    private boolean matchesWeather(Product product, String weather) {
        String description = product.getDescription() != null ? product.getDescription().toLowerCase() : "";
        String name = product.getName() != null ? product.getName().toLowerCase() : "";
        String combined = description + " " + name;
        
        switch (weather.toLowerCase()) {
            case "sunny":
            case "hot":
                return combined.contains("summer") || combined.contains("light") || combined.contains("shorts");
            case "rainy":
                return combined.contains("rain") || combined.contains("waterproof") || combined.contains("jacket");
            case "cold":
            case "winter":
                return combined.contains("warm") || combined.contains("winter") || combined.contains("coat");
            default:
                return false;
        }
    }
    
    private List<String> getActiveUsers() {
        return userContexts.entrySet().stream()
                .filter(entry -> entry.getValue().getLastActivity().isAfter(LocalDateTime.now().minusHours(1)))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }
    
    private boolean shouldRefreshRecommendations(String userId) {
        LocalDateTime lastUpdate = lastRecommendationUpdate.get(userId);
        if (lastUpdate == null) return true;
        
        return ChronoUnit.MINUTES.between(lastUpdate, LocalDateTime.now()) > RECOMMENDATION_CACHE_MINUTES / 2;
    }
    
    private FeedbackType getFeedbackTypeFromInteraction(InteractionType type) {
        switch (type) {
            case PURCHASE:
            case ADD_TO_CART:
                return FeedbackType.POSITIVE;
            case REMOVE_FROM_CART:
                return FeedbackType.NEGATIVE;
            default:
                return FeedbackType.NEUTRAL;
        }
    }
    
    private double getInteractionRating(InteractionType type) {
        switch (type) {
            case PURCHASE: return 1.0;
            case ADD_TO_CART: return 0.8;
            case PRODUCT_VIEW: return 0.3;
            case REMOVE_FROM_CART: return -0.5;
            default: return 0.1;
        }
    }
    
    private void trackRecommendationFeedback(String userId, String productId, FeedbackType feedback) {
        // Track feedback for improving recommendation algorithms
        System.out.println("Recommendation feedback tracked: " + userId + " -> " + productId + " (" + feedback + ")");
    }
    
    // Placeholder implementations for missing methods
    private List<Product> findProductsByTimeContext(String timeContext, int limit) {
        return productRepository.findByDescriptionContainingIgnoreCase(timeContext)
                .stream().limit(limit).collect(Collectors.toList());
    }
    
    private List<Product> findProductsByLocation(String location, int limit) {
        return productRepository.findAll().stream().limit(limit).collect(Collectors.toList());
    }
    
    private List<Product> findProductsByWeather(String weather, int limit) {
        return productRepository.findByDescriptionContainingIgnoreCase(weather)
                .stream().limit(limit).collect(Collectors.toList());
    }
    
    private List<Product> findQuickBuyProducts(int limit) {
        return productRepository.findAll().stream()
                .filter(p -> p.getPrice() < 100) // Assumption: cheaper items are quicker to buy
                .limit(limit).collect(Collectors.toList());
    }
    
    private List<Product> getFreshArrivals(int limit) {
        return productRepository.findAll().stream()
                .filter(this::isNewProduct)
                .limit(limit).collect(Collectors.toList());
    }
    
    private boolean matchesUserStyle(Product product, PersonalizedStyleProfile styleProfile) {
        if (product.getCategory() != null) {
            return styleProfile.getCategoryPreferences().getOrDefault(product.getCategory().toLowerCase(), 0.0) > 0.3;
        }
        return true;
    }
    
    // Enums and Data Classes
    public enum FeedbackType {
        POSITIVE(1.0), NEGATIVE(-1.0), NEUTRAL(0.0);
        
        private final double score;
        
        FeedbackType(double score) {
            this.score = score;
        }
        
        public double getScore() { return score; }
    }
    
    public enum RecommendationType {
        PERSONALIZED, SIMILAR_PRODUCT, CROSS_SELL, TRENDING, NEW_ARRIVAL, STYLE_MATCH,
        TIME_BASED, LOCATION_BASED, WEATHER_BASED, DEVICE_OPTIMIZED, SESSION_BASED
    }
    
    public static class RealTimeRecommendation {
        private Product product;
        private RecommendationType type;
        private double confidenceScore;
        private String reasoning;
        private LocalDateTime timestamp;
        
        public RealTimeRecommendation(Product product, RecommendationType type, double confidenceScore, 
                                    String reasoning, LocalDateTime timestamp) {
            this.product = product;
            this.type = type;
            this.confidenceScore = confidenceScore;
            this.reasoning = reasoning;
            this.timestamp = timestamp;
        }
        
        public void adjustConfidence(double adjustment) {
            this.confidenceScore = Math.max(0.0, Math.min(1.0, this.confidenceScore + adjustment));
        }
        
        @Override
        public boolean equals(Object obj) {
            if (this == obj) return true;
            if (obj == null || getClass() != obj.getClass()) return false;
            RealTimeRecommendation that = (RealTimeRecommendation) obj;
            return Objects.equals(product.getId(), that.product.getId());
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(product.getId());
        }
        
        // Getters
        public Product getProduct() { return product; }
        public RecommendationType getType() { return type; }
        public double getConfidenceScore() { return confidenceScore; }
        public String getReasoning() { return reasoning; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
    
    public static class RecommendationEvent {
        private String userId;
        private InteractionType type;
        private String itemId;
        private LocalDateTime timestamp;
        
        public RecommendationEvent(String userId, InteractionType type, String itemId, LocalDateTime timestamp) {
            this.userId = userId;
            this.type = type;
            this.itemId = itemId;
            this.timestamp = timestamp;
        }
        
        // Getters
        public String getUserId() { return userId; }
        public InteractionType getType() { return type; }
        public String getItemId() { return itemId; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
    
    public static class RecommendationContext {
        private String userId;
        private LocalDateTime currentTime;
        private String userLocation;
        private String weatherConditions;
        private String deviceType;
        private SessionData sessionData;
        private List<RecommendationEvent> recentEvents;
        private LocalDateTime lastActivity;
        
        public RecommendationContext(String userId) {
            this.userId = userId;
            this.currentTime = LocalDateTime.now();
            this.recentEvents = new ArrayList<>();
            this.lastActivity = LocalDateTime.now();
        }
        
        public void addEvent(RecommendationEvent event) {
            recentEvents.add(event);
            if (recentEvents.size() > 50) { // Keep recent events only
                recentEvents.remove(0);
            }
        }
        
        public void updateLastActivity(LocalDateTime time) {
            this.lastActivity = time;
        }
        
        // Getters and setters
        public String getUserId() { return userId; }
        public LocalDateTime getCurrentTime() { return currentTime; }
        public void setCurrentTime(LocalDateTime currentTime) { this.currentTime = currentTime; }
        public String getUserLocation() { return userLocation; }
        public void setUserLocation(String userLocation) { this.userLocation = userLocation; }
        public String getWeatherConditions() { return weatherConditions; }
        public void setWeatherConditions(String weatherConditions) { this.weatherConditions = weatherConditions; }
        public String getDeviceType() { return deviceType; }
        public void setDeviceType(String deviceType) { this.deviceType = deviceType; }
        public SessionData getSessionData() { return sessionData; }
        public void setSessionData(SessionData sessionData) { this.sessionData = sessionData; }
        public List<RecommendationEvent> getRecentEvents() { return recentEvents; }
        public LocalDateTime getLastActivity() { return lastActivity; }
    }
    
    public static class SessionData {
        private List<String> viewedProducts;
        private Set<String> viewedCategories;
        private int pageViews;
        private LocalDateTime sessionStart;
        
        public SessionData() {
            this.viewedProducts = new ArrayList<>();
            this.viewedCategories = new HashSet<>();
            this.pageViews = 0;
            this.sessionStart = LocalDateTime.now();
        }
        
        public void addInteraction(RecommendationEvent event) {
            if (event.getItemId() != null) {
                viewedProducts.add(event.getItemId());
                
                // Try to get product category
                // This is simplified - in real implementation, you'd fetch the product
                viewedCategories.add("general");
            }
            pageViews++;
        }
        
        public String getDominantCategory() {
            return viewedCategories.stream().findFirst().orElse(null);
        }
        
        // Getters
        public List<String> getViewedProducts() { return viewedProducts; }
        public Set<String> getViewedCategories() { return viewedCategories; }
        public int getPageViews() { return pageViews; }
        public LocalDateTime getSessionStart() { return sessionStart; }
    }
}
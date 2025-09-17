package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.models.Seller;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class UserBehaviorAnalyticsService {
    
    @Autowired
    private ProductRepository productRepository;
    
    // In-memory storage for real-time analytics (in production, use Redis or database)
    private final Map<String, UserBehaviorProfile> userProfiles = new ConcurrentHashMap<>();
    private final Map<String, List<UserInteraction>> userInteractions = new ConcurrentHashMap<>();
    private final Map<String, ProductAnalytics> productAnalytics = new ConcurrentHashMap<>();
    private final Map<String, SessionData> activeSessions = new ConcurrentHashMap<>();
    
    // Analytics configuration
    private static final int MAX_INTERACTIONS_PER_USER = 10000;
    private static final int SESSION_TIMEOUT_MINUTES = 30;
    private static final double PURCHASE_WEIGHT = 10.0;
    private static final double ADD_TO_CART_WEIGHT = 5.0;
    private static final double VIEW_WEIGHT = 1.0;
    private static final double SEARCH_WEIGHT = 2.0;
    
    public void trackUserInteraction(String userId, InteractionType type, String itemId, Map<String, Object> metadata) {
        String sessionId = getCurrentSessionId();
        UserInteraction interaction = new UserInteraction(userId, sessionId, type, itemId, metadata);
        
        // Store interaction
        userInteractions.computeIfAbsent(userId, k -> new ArrayList<>()).add(interaction);
        
        // Limit interactions per user to prevent memory issues
        List<UserInteraction> interactions = userInteractions.get(userId);
        if (interactions.size() > MAX_INTERACTIONS_PER_USER) {
            interactions.removeIf(i -> i.getTimestamp().isBefore(LocalDateTime.now().minusDays(30)));
        }
        
        // Update user profile
        updateUserProfile(userId, interaction);
        
        // Update product analytics
        updateProductAnalytics(itemId, type);
        
        // Update session data
        updateSessionData(sessionId, userId, interaction);
    }
    
    public void trackProductView(String userId, String productId, String referrer, long timeSpent) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("referrer", referrer);
        metadata.put("timeSpent", timeSpent);
        metadata.put("timestamp", LocalDateTime.now());
        
        trackUserInteraction(userId, InteractionType.PRODUCT_VIEW, productId, metadata);
    }
    
    public void trackSearch(String userId, String query, List<String> filters, int resultsCount) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("query", query);
        metadata.put("filters", filters);
        metadata.put("resultsCount", resultsCount);
        metadata.put("timestamp", LocalDateTime.now());
        
        trackUserInteraction(userId, InteractionType.SEARCH, query, metadata);
        
        // Update search analytics
        updateSearchAnalytics(query, resultsCount);
    }
    
    public void trackPurchase(String userId, String productId, double amount, String paymentMethod) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("amount", amount);
        metadata.put("paymentMethod", paymentMethod);
        metadata.put("timestamp", LocalDateTime.now());
        
        trackUserInteraction(userId, InteractionType.PURCHASE, productId, metadata);
    }
    
    public void trackCartAction(String userId, String productId, CartAction action) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("action", action.name());
        metadata.put("timestamp", LocalDateTime.now());
        
        InteractionType type = action == CartAction.ADD ? InteractionType.ADD_TO_CART : InteractionType.REMOVE_FROM_CART;
        trackUserInteraction(userId, type, productId, metadata);
    }
    
    public UserBehaviorProfile getUserBehaviorProfile(String userId) {
        return userProfiles.getOrDefault(userId, new UserBehaviorProfile(userId));
    }
    
    public List<UserInteraction> getUserInteractions(String userId, int limit) {
        return userInteractions.getOrDefault(userId, new ArrayList<>())
                .stream()
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .limit(limit)
                .collect(Collectors.toList());
    }
    
    public ProductAnalytics getProductAnalytics(String productId) {
        return productAnalytics.getOrDefault(productId, new ProductAnalytics(productId));
    }
    
    public Map<String, Double> getUserCategoryAffinities(String userId) {
        UserBehaviorProfile profile = getUserBehaviorProfile(userId);
        Map<String, Double> affinities = new HashMap<>();
        
        // Calculate category affinities based on interactions
        List<UserInteraction> interactions = getUserInteractions(userId, 1000);
        Map<String, Double> categoryScores = new HashMap<>();
        Map<String, Integer> categoryCount = new HashMap<>();
        
        for (UserInteraction interaction : interactions) {
            if (interaction.getItemId() != null) {
                Product product = getProductById(interaction.getItemId());
                if (product != null && product.getCategory() != null) {
                    String category = product.getCategory();
                    double score = getInteractionWeight(interaction.getType());
                    
                    categoryScores.merge(category, score, Double::sum);
                    categoryCount.merge(category, 1, Integer::sum);
                }
            }
        }
        
        // Normalize scores
        double maxScore = categoryScores.values().stream().mapToDouble(Double::doubleValue).max().orElse(1.0);
        for (Map.Entry<String, Double> entry : categoryScores.entrySet()) {
            affinities.put(entry.getKey(), entry.getValue() / maxScore);
        }
        
        return affinities;
    }
    
    public List<String> getTrendingProducts(int limit) {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        
        return productAnalytics.entrySet().stream()
                .filter(entry -> entry.getValue().getLastInteraction().isAfter(cutoff))
                .sorted((a, b) -> Double.compare(
                        b.getValue().getTrendingScore(),
                        a.getValue().getTrendingScore()))
                .limit(limit)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }
    
    public List<String> getPopularSearchTerms(int limit) {
        return searchAnalytics.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue().getSearchCount(), a.getValue().getSearchCount()))
                .limit(limit)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }
    
    public double calculateUserEngagementScore(String userId) {
        List<UserInteraction> interactions = getUserInteractions(userId, 100);
        if (interactions.isEmpty()) return 0.0;
        
        double score = 0.0;
        LocalDateTime now = LocalDateTime.now();
        
        for (UserInteraction interaction : interactions) {
            double weight = getInteractionWeight(interaction.getType());
            
            // Apply recency decay
            long daysSince = ChronoUnit.DAYS.between(interaction.getTimestamp(), now);
            double recencyMultiplier = Math.exp(-daysSince / 7.0); // Decay over 7 days
            
            score += weight * recencyMultiplier;
        }
        
        return score;
    }
    
    public SessionAnalytics getSessionAnalytics(String sessionId) {
        SessionData session = activeSessions.get(sessionId);
        if (session == null) return null;
        
        return new SessionAnalytics(
                session.getSessionId(),
                session.getUserId(),
                session.getStartTime(),
                session.getLastActivity(),
                session.getInteractionCount(),
                session.getPagesViewed(),
                session.getProductsViewed(),
                session.getSearchQueries(),
                session.getBounceRate()
        );
    }
    
    public Map<String, Object> generateUserInsights(String userId) {
        Map<String, Object> insights = new HashMap<>();
        
        UserBehaviorProfile profile = getUserBehaviorProfile(userId);
        List<UserInteraction> recentInteractions = getUserInteractions(userId, 50);
        
        insights.put("userId", userId);
        insights.put("engagementScore", calculateUserEngagementScore(userId));
        insights.put("categoryAffinities", getUserCategoryAffinities(userId));
        insights.put("favoriteCategories", profile.getFavoriteCategories());
        insights.put("averageSessionDuration", profile.getAverageSessionDuration());
        insights.put("totalInteractions", profile.getTotalInteractions());
        insights.put("purchaseHistory", profile.getPurchaseHistory());
        insights.put("priceRange", profile.getPreferredPriceRange());
        insights.put("shoppingFrequency", calculateShoppingFrequency(userId));
        insights.put("conversionRate", calculateConversionRate(userId));
        insights.put("lastActiveDate", profile.getLastActiveDate());
        
        return insights;
    }
    
    // Private helper methods
    private void updateUserProfile(String userId, UserInteraction interaction) {
        UserBehaviorProfile profile = userProfiles.computeIfAbsent(userId, UserBehaviorProfile::new);
        profile.addInteraction(interaction);
        
        // Update specific profile attributes
        if (interaction.getType() == InteractionType.PURCHASE) {
            Double amount = (Double) interaction.getMetadata().get("amount");
            if (amount != null) {
                profile.addPurchase(interaction.getItemId(), amount);
            }
        }
        
        profile.setLastActiveDate(LocalDateTime.now());
    }
    
    private void updateProductAnalytics(String productId, InteractionType type) {
        if (productId == null) return;
        
        ProductAnalytics analytics = productAnalytics.computeIfAbsent(productId, ProductAnalytics::new);
        analytics.incrementInteraction(type);
        analytics.setLastInteraction(LocalDateTime.now());
        
        // Update trending score
        analytics.updateTrendingScore();
    }
    
    private void updateSessionData(String sessionId, String userId, UserInteraction interaction) {
        SessionData session = activeSessions.computeIfAbsent(sessionId, id -> new SessionData(id, userId));
        session.addInteraction(interaction);
        
        // Clean up old sessions
        cleanupOldSessions();
    }
    
    private void updateSearchAnalytics(String query, int resultsCount) {
        SearchAnalytics analytics = searchAnalytics.computeIfAbsent(query, SearchAnalytics::new);
        analytics.incrementSearch();
        analytics.addResultCount(resultsCount);
        analytics.setLastSearched(LocalDateTime.now());
    }
    
    private Product getProductById(String productId) {
        try {
            return productRepository.findById(productId).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
    
    private double getInteractionWeight(InteractionType type) {
        switch (type) {
            case PURCHASE: return PURCHASE_WEIGHT;
            case ADD_TO_CART: return ADD_TO_CART_WEIGHT;
            case SEARCH: return SEARCH_WEIGHT;
            case PRODUCT_VIEW: return VIEW_WEIGHT;
            default: return 1.0;
        }
    }
    
    private String getCurrentSessionId() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            HttpSession session = request.getSession();
            return session.getId();
        } catch (Exception e) {
            return "default-session-" + System.currentTimeMillis();
        }
    }
    
    private void cleanupOldSessions() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(SESSION_TIMEOUT_MINUTES);
        activeSessions.entrySet().removeIf(entry -> entry.getValue().getLastActivity().isBefore(cutoff));
    }
    
    private double calculateShoppingFrequency(String userId) {
        List<UserInteraction> purchases = getUserInteractions(userId, 1000).stream()
                .filter(i -> i.getType() == InteractionType.PURCHASE)
                .collect(Collectors.toList());
        
        if (purchases.size() < 2) return 0.0;
        
        LocalDateTime firstPurchase = purchases.get(purchases.size() - 1).getTimestamp();
        LocalDateTime lastPurchase = purchases.get(0).getTimestamp();
        
        long daysBetween = ChronoUnit.DAYS.between(firstPurchase, lastPurchase);
        return daysBetween > 0 ? (double) purchases.size() / daysBetween : 0.0;
    }
    
    private double calculateConversionRate(String userId) {
        List<UserInteraction> interactions = getUserInteractions(userId, 1000);
        long views = interactions.stream().filter(i -> i.getType() == InteractionType.PRODUCT_VIEW).count();
        long purchases = interactions.stream().filter(i -> i.getType() == InteractionType.PURCHASE).count();
        
        return views > 0 ? (double) purchases / views : 0.0;
    }
    
    // Storage for search analytics
    private final Map<String, SearchAnalytics> searchAnalytics = new ConcurrentHashMap<>();
    
    // Enums and inner classes
    public enum InteractionType {
        PRODUCT_VIEW, SEARCH, ADD_TO_CART, REMOVE_FROM_CART, PURCHASE, WISHLIST_ADD, 
        SHARE, REVIEW, RATING, CLICK_RECOMMENDATION, FILTER_APPLY
    }
    
    public enum CartAction {
        ADD, REMOVE
    }
    
    public static class UserInteraction {
        private String userId;
        private String sessionId;
        private InteractionType type;
        private String itemId;
        private LocalDateTime timestamp;
        private Map<String, Object> metadata;
        
        public UserInteraction(String userId, String sessionId, InteractionType type, String itemId, Map<String, Object> metadata) {
            this.userId = userId;
            this.sessionId = sessionId;
            this.type = type;
            this.itemId = itemId;
            this.timestamp = LocalDateTime.now();
            this.metadata = metadata != null ? metadata : new HashMap<>();
        }
        
        // Getters
        public String getUserId() { return userId; }
        public String getSessionId() { return sessionId; }
        public InteractionType getType() { return type; }
        public String getItemId() { return itemId; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public Map<String, Object> getMetadata() { return metadata; }
    }
    
    public static class UserBehaviorProfile {
        private String userId;
        private LocalDateTime createdAt;
        private LocalDateTime lastActiveDate;
        private int totalInteractions;
        private List<String> favoriteCategories;
        private Map<String, Integer> categoryInteractions;
        private List<String> purchaseHistory;
        private double averageSessionDuration;
        private Map<String, Double> preferredPriceRange;
        private List<String> searchHistory;
        private double engagementScore;
        
        public UserBehaviorProfile(String userId) {
            this.userId = userId;
            this.createdAt = LocalDateTime.now();
            this.lastActiveDate = LocalDateTime.now();
            this.totalInteractions = 0;
            this.favoriteCategories = new ArrayList<>();
            this.categoryInteractions = new HashMap<>();
            this.purchaseHistory = new ArrayList<>();
            this.preferredPriceRange = new HashMap<>();
            this.searchHistory = new ArrayList<>();
            this.engagementScore = 0.0;
        }
        
        public void addInteraction(UserInteraction interaction) {
            totalInteractions++;
            
            if (interaction.getMetadata().containsKey("query")) {
                String query = (String) interaction.getMetadata().get("query");
                searchHistory.add(query);
                if (searchHistory.size() > 100) {
                    searchHistory.remove(0);
                }
            }
        }
        
        public void addPurchase(String productId, double amount) {
            purchaseHistory.add(productId);
            
            // Update preferred price range
            if (amount < 50) {
                preferredPriceRange.merge("budget", 1.0, Double::sum);
            } else if (amount < 200) {
                preferredPriceRange.merge("mid-range", 1.0, Double::sum);
            } else {
                preferredPriceRange.merge("premium", 1.0, Double::sum);
            }
        }
        
        // Getters and setters
        public String getUserId() { return userId; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public LocalDateTime getLastActiveDate() { return lastActiveDate; }
        public void setLastActiveDate(LocalDateTime lastActiveDate) { this.lastActiveDate = lastActiveDate; }
        public int getTotalInteractions() { return totalInteractions; }
        public List<String> getFavoriteCategories() { return favoriteCategories; }
        public List<String> getPurchaseHistory() { return purchaseHistory; }
        public double getAverageSessionDuration() { return averageSessionDuration; }
        public void setAverageSessionDuration(double averageSessionDuration) { this.averageSessionDuration = averageSessionDuration; }
        public Map<String, Double> getPreferredPriceRange() { return preferredPriceRange; }
        public List<String> getSearchHistory() { return searchHistory; }
        public double getEngagementScore() { return engagementScore; }
        public void setEngagementScore(double engagementScore) { this.engagementScore = engagementScore; }
    }
    
    public static class ProductAnalytics {
        private String productId;
        private int viewCount;
        private int addToCartCount;
        private int purchaseCount;
        private double trendingScore;
        private LocalDateTime lastInteraction;
        private Map<InteractionType, Integer> interactionCounts;
        
        public ProductAnalytics(String productId) {
            this.productId = productId;
            this.viewCount = 0;
            this.addToCartCount = 0;
            this.purchaseCount = 0;
            this.trendingScore = 0.0;
            this.lastInteraction = LocalDateTime.now();
            this.interactionCounts = new HashMap<>();
        }
        
        public void incrementInteraction(InteractionType type) {
            interactionCounts.merge(type, 1, Integer::sum);
            
            switch (type) {
                case PRODUCT_VIEW: viewCount++; break;
                case ADD_TO_CART: addToCartCount++; break;
                case PURCHASE: purchaseCount++; break;
            }
        }
        
        public void updateTrendingScore() {
            // Calculate trending score based on recent activity
            LocalDateTime now = LocalDateTime.now();
            long hoursSinceLastInteraction = ChronoUnit.HOURS.between(lastInteraction, now);
            
            double recencyMultiplier = Math.exp(-hoursSinceLastInteraction / 24.0);
            this.trendingScore = (viewCount * 1.0 + addToCartCount * 3.0 + purchaseCount * 5.0) * recencyMultiplier;
        }
        
        // Getters
        public String getProductId() { return productId; }
        public int getViewCount() { return viewCount; }
        public int getAddToCartCount() { return addToCartCount; }
        public int getPurchaseCount() { return purchaseCount; }
        public double getTrendingScore() { return trendingScore; }
        public LocalDateTime getLastInteraction() { return lastInteraction; }
        public void setLastInteraction(LocalDateTime lastInteraction) { this.lastInteraction = lastInteraction; }
        public Map<InteractionType, Integer> getInteractionCounts() { return interactionCounts; }
    }
    
    public static class SessionData {
        private String sessionId;
        private String userId;
        private LocalDateTime startTime;
        private LocalDateTime lastActivity;
        private int interactionCount;
        private Set<String> pagesViewed;
        private Set<String> productsViewed;
        private List<String> searchQueries;
        
        public SessionData(String sessionId, String userId) {
            this.sessionId = sessionId;
            this.userId = userId;
            this.startTime = LocalDateTime.now();
            this.lastActivity = LocalDateTime.now();
            this.interactionCount = 0;
            this.pagesViewed = new HashSet<>();
            this.productsViewed = new HashSet<>();
            this.searchQueries = new ArrayList<>();
        }
        
        public void addInteraction(UserInteraction interaction) {
            this.interactionCount++;
            this.lastActivity = LocalDateTime.now();
            
            if (interaction.getType() == InteractionType.PRODUCT_VIEW) {
                productsViewed.add(interaction.getItemId());
            }
            
            if (interaction.getType() == InteractionType.SEARCH) {
                String query = (String) interaction.getMetadata().get("query");
                if (query != null) {
                    searchQueries.add(query);
                }
            }
        }
        
        public double getBounceRate() {
            return interactionCount <= 1 ? 1.0 : 0.0;
        }
        
        // Getters
        public String getSessionId() { return sessionId; }
        public String getUserId() { return userId; }
        public LocalDateTime getStartTime() { return startTime; }
        public LocalDateTime getLastActivity() { return lastActivity; }
        public int getInteractionCount() { return interactionCount; }
        public Set<String> getPagesViewed() { return pagesViewed; }
        public Set<String> getProductsViewed() { return productsViewed; }
        public List<String> getSearchQueries() { return searchQueries; }
    }
    
    public static class SessionAnalytics {
        private String sessionId;
        private String userId;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private int totalInteractions;
        private Set<String> pagesViewed;
        private Set<String> productsViewed;
        private List<String> searchQueries;
        private double bounceRate;
        
        public SessionAnalytics(String sessionId, String userId, LocalDateTime startTime, LocalDateTime endTime,
                               int totalInteractions, Set<String> pagesViewed, Set<String> productsViewed,
                               List<String> searchQueries, double bounceRate) {
            this.sessionId = sessionId;
            this.userId = userId;
            this.startTime = startTime;
            this.endTime = endTime;
            this.totalInteractions = totalInteractions;
            this.pagesViewed = pagesViewed;
            this.productsViewed = productsViewed;
            this.searchQueries = searchQueries;
            this.bounceRate = bounceRate;
        }
        
        // Getters
        public String getSessionId() { return sessionId; }
        public String getUserId() { return userId; }
        public LocalDateTime getStartTime() { return startTime; }
        public LocalDateTime getEndTime() { return endTime; }
        public int getTotalInteractions() { return totalInteractions; }
        public Set<String> getPagesViewed() { return pagesViewed; }
        public Set<String> getProductsViewed() { return productsViewed; }
        public List<String> getSearchQueries() { return searchQueries; }
        public double getBounceRate() { return bounceRate; }
        
        public long getSessionDurationMinutes() {
            return ChronoUnit.MINUTES.between(startTime, endTime != null ? endTime : LocalDateTime.now());
        }
    }
    
    public static class SearchAnalytics {
        private String query;
        private int searchCount;
        private List<Integer> resultCounts;
        private LocalDateTime lastSearched;
        
        public SearchAnalytics(String query) {
            this.query = query;
            this.searchCount = 0;
            this.resultCounts = new ArrayList<>();
            this.lastSearched = LocalDateTime.now();
        }
        
        public void incrementSearch() {
            searchCount++;
        }
        
        public void addResultCount(int count) {
            resultCounts.add(count);
            if (resultCounts.size() > 100) {
                resultCounts.remove(0);
            }
        }
        
        public double getAverageResults() {
            return resultCounts.stream().mapToInt(Integer::intValue).average().orElse(0.0);
        }
        
        // Getters and setters
        public String getQuery() { return query; }
        public int getSearchCount() { return searchCount; }
        public List<Integer> getResultCounts() { return resultCounts; }
        public LocalDateTime getLastSearched() { return lastSearched; }
        public void setLastSearched(LocalDateTime lastSearched) { this.lastSearched = lastSearched; }
    }
}
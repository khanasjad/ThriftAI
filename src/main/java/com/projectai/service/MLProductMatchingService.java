package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.models.Seller;
import com.projectai.repository.ProductRepository;
import com.projectai.service.UserBehaviorAnalyticsService.UserInteraction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class MLProductMatchingService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserBehaviorAnalyticsService behaviorAnalyticsService;
    
    // ML Model components (in production, these would be trained models)
    private final Map<String, ProductVector> productVectors = new ConcurrentHashMap<>();
    private final Map<String, UserPreferenceVector> userPreferenceVectors = new ConcurrentHashMap<>();
    private final Map<String, Double> featureWeights = new ConcurrentHashMap<>();
    
    // Feature extraction parameters
    private static final double PRICE_NORMALIZATION_FACTOR = 1000.0;
    private static final double BRAND_SIMILARITY_THRESHOLD = 0.8;
    private static final double CATEGORY_MATCH_WEIGHT = 3.0;
    private static final double STYLE_MATCH_WEIGHT = 2.5;
    private static final double PRICE_MATCH_WEIGHT = 2.0;
    private static final double CONDITION_MATCH_WEIGHT = 1.5;
    private static final double BRAND_MATCH_WEIGHT = 2.8;
    
    // Neural network-inspired similarity calculation
    private static final double LEARNING_RATE = 0.01;
    private static final int VECTOR_DIMENSION = 50;
    
    public List<Product> findSimilarProducts(String productId, int limit) {
        Product baseProduct = productRepository.findById(productId).orElse(null);
        if (baseProduct == null) return new ArrayList<>();
        
        ProductVector baseVector = getOrCreateProductVector(baseProduct);
        List<Product> allProducts = productRepository.findByIsAvailableTrue();
        
        return allProducts.stream()
                .filter(p -> !p.getId().equals(productId))
                .map(product -> new SimilarityScore(product, calculateProductSimilarity(baseVector, getOrCreateProductVector(product))))
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .limit(limit)
                .map(SimilarityScore::getProduct)
                .collect(Collectors.toList());
    }
    
    public List<Product> findUserMatchedProducts(String userId, int limit) {
        UserPreferenceVector userVector = getOrCreateUserPreferenceVector(userId);
        List<Product> availableProducts = productRepository.findByIsAvailableTrue();
        
        return availableProducts.stream()
                .map(product -> new MatchScore(product, calculateUserProductMatch(userVector, getOrCreateProductVector(product))))
                .filter(score -> score.getScore() > 0.3) // Minimum relevance threshold
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .limit(limit)
                .map(MatchScore::getProduct)
                .collect(Collectors.toList());
    }
    
    public List<Product> findCrossSellingOpportunities(String userId, String currentProductId, int limit) {
        Product currentProduct = productRepository.findById(currentProductId).orElse(null);
        if (currentProduct == null) return new ArrayList<>();
        
        UserPreferenceVector userVector = getOrCreateUserPreferenceVector(userId);
        ProductVector currentVector = getOrCreateProductVector(currentProduct);
        
        // Find complementary products based on user behavior patterns
        List<Product> candidates = productRepository.findByIsAvailableTrue();
        
        return candidates.stream()
                .filter(p -> !p.getId().equals(currentProductId))
                .filter(p -> isComplementaryProduct(currentProduct, p))
                .map(product -> {
                    double crossSellScore = calculateCrossSellingScore(userVector, currentVector, getOrCreateProductVector(product));
                    return new MatchScore(product, crossSellScore);
                })
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .limit(limit)
                .map(MatchScore::getProduct)
                .collect(Collectors.toList());
    }
    
    public void updateMLModelsWithUserFeedback(String userId, String productId, FeedbackType feedbackType, double rating) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return;
        
        UserPreferenceVector userVector = getOrCreateUserPreferenceVector(userId);
        ProductVector productVector = getOrCreateProductVector(product);
        
        // Update user preferences based on feedback
        updateUserPreferences(userVector, productVector, feedbackType, rating);
        
        // Update product features based on user interactions
        updateProductFeatures(productVector, feedbackType, rating);
        
        // Track this feedback for model improvement
        trackModelFeedback(userId, productId, feedbackType, rating);
    }
    
    public double predictUserProductScore(String userId, String productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return 0.0;
        
        UserPreferenceVector userVector = getOrCreateUserPreferenceVector(userId);
        ProductVector productVector = getOrCreateProductVector(product);
        
        return calculateUserProductMatch(userVector, productVector);
    }
    
    public List<String> extractProductTags(Product product) {
        List<String> tags = new ArrayList<>();
        
        // Extract style tags from description
        String description = product.getDescription() != null ? product.getDescription().toLowerCase() : "";
        String name = product.getName() != null ? product.getName().toLowerCase() : "";
        String combined = description + " " + name;
        
        // Style tags
        if (combined.contains("vintage") || combined.contains("retro")) tags.add("vintage");
        if (combined.contains("modern") || combined.contains("contemporary")) tags.add("modern");
        if (combined.contains("casual")) tags.add("casual");
        if (combined.contains("formal") || combined.contains("business")) tags.add("formal");
        if (combined.contains("boho") || combined.contains("bohemian")) tags.add("bohemian");
        if (combined.contains("minimalist") || combined.contains("simple")) tags.add("minimalist");
        if (combined.contains("luxury") || combined.contains("designer")) tags.add("luxury");
        if (combined.contains("streetwear") || combined.contains("urban")) tags.add("streetwear");
        
        // Season tags
        if (combined.contains("summer") || combined.contains("light")) tags.add("summer");
        if (combined.contains("winter") || combined.contains("warm")) tags.add("winter");
        if (combined.contains("spring") || combined.contains("fall")) tags.add("transitional");
        
        // Occasion tags
        if (combined.contains("party") || combined.contains("evening")) tags.add("party");
        if (combined.contains("work") || combined.contains("office")) tags.add("work");
        if (combined.contains("weekend") || combined.contains("leisure")) tags.add("weekend");
        if (combined.contains("wedding") || combined.contains("special")) tags.add("special-occasion");
        
        // Material tags
        if (combined.contains("cotton")) tags.add("cotton");
        if (combined.contains("denim")) tags.add("denim");
        if (combined.contains("leather")) tags.add("leather");
        if (combined.contains("silk")) tags.add("silk");
        if (combined.contains("wool")) tags.add("wool");
        
        return tags;
    }
    
    public Map<String, Double> analyzeUserStyleProfile(String userId) {
        List<UserInteraction> interactions = behaviorAnalyticsService.getUserInteractions(userId, 500);
        Map<String, Double> styleProfile = new HashMap<>();
        Map<String, Integer> styleCounts = new HashMap<>();
        
        for (UserInteraction interaction : interactions) {
            if (interaction.getType() == UserBehaviorAnalyticsService.InteractionType.PRODUCT_VIEW ||
                interaction.getType() == UserBehaviorAnalyticsService.InteractionType.PURCHASE) {
                
                Product product = productRepository.findById(interaction.getItemId()).orElse(null);
                if (product != null) {
                    List<String> tags = extractProductTags(product);
                    double weight = getInteractionWeight(interaction.getType());
                    
                    for (String tag : tags) {
                        styleProfile.merge(tag, weight, Double::sum);
                        styleCounts.merge(tag, 1, Integer::sum);
                    }
                }
            }
        }
        
        // Normalize scores
        double maxScore = styleProfile.values().stream().mapToDouble(Double::doubleValue).max().orElse(1.0);
        styleProfile.replaceAll((k, v) -> v / maxScore);
        
        return styleProfile;
    }
    
    public void trainModelsWithHistoricalData() {
        List<Product> allProducts = productRepository.findAll();
        
        // Initialize feature weights
        initializeFeatureWeights();
        
        // Process all products to create vectors
        for (Product product : allProducts) {
            getOrCreateProductVector(product);
        }
        
        // Train user preference vectors based on historical interactions
        trainUserPreferenceVectors();
        
        System.out.println("ML models trained with " + allProducts.size() + " products and historical user data");
    }
    
    // Private helper methods
    private ProductVector getOrCreateProductVector(Product product) {
        return productVectors.computeIfAbsent(product.getId(), id -> createProductVector(product));
    }
    
    private UserPreferenceVector getOrCreateUserPreferenceVector(String userId) {
        return userPreferenceVectors.computeIfAbsent(userId, this::createUserPreferenceVector);
    }
    
    private ProductVector createProductVector(Product product) {
        double[] features = new double[VECTOR_DIMENSION];
        List<String> tags = extractProductTags(product);
        
        // Feature 0-9: Price features
        features[0] = Math.log(product.getPrice() + 1) / Math.log(PRICE_NORMALIZATION_FACTOR);
        features[1] = product.getOriginalPrice() > 0 ? product.getDiscountPercentage() / 100.0 : 0;
        features[2] = product.isOnSale() ? 1.0 : 0.0;
        
        // Feature 3-12: Category encoding (one-hot)
        int categoryHash = Math.abs(product.getCategory() != null ? product.getCategory().hashCode() : 0) % 10;
        features[3 + categoryHash] = 1.0;
        
        // Feature 13-22: Brand encoding
        int brandHash = Math.abs(product.getBrand() != null ? product.getBrand().hashCode() : 0) % 10;
        features[13 + brandHash] = 1.0;
        
        // Feature 23-32: Condition encoding
        String condition = product.getCondition() != null ? product.getCondition() : "unknown";
        int conditionValue = getConditionValue(condition);
        features[23 + (conditionValue % 10)] = 1.0;
        
        // Feature 33-42: Style tags
        for (int i = 0; i < Math.min(tags.size(), 10); i++) {
            features[33 + i] = 1.0;
        }
        
        // Feature 43-49: Additional features
        features[43] = product.getSize() != null ? 1.0 : 0.0;
        features[44] = product.getDescription() != null ? Math.min(product.getDescription().length() / 500.0, 1.0) : 0;
        features[45] = product.getImageUrl() != null ? 1.0 : 0.0;
        features[46] = product.getCreatedAt() != null ? 
                     (System.currentTimeMillis() - java.sql.Timestamp.valueOf(product.getCreatedAt()).getTime()) / (1000.0 * 60 * 60 * 24 * 365) : 0;
        features[47] = product.getSeller() != null && product.getSeller().isVerified() ? 1.0 : 0.0;
        features[48] = product.getSeller() != null ? product.getSeller().getRating() / 5.0 : 0.5;
        features[49] = 1.0; // Bias term
        
        return new ProductVector(product.getId(), features, tags);
    }
    
    private UserPreferenceVector createUserPreferenceVector(String userId) {
        double[] preferences = new double[VECTOR_DIMENSION];
        
        // Analyze user behavior to build preferences
        List<UserInteraction> interactions = behaviorAnalyticsService.getUserInteractions(userId, 1000);
        Map<String, Double> categoryPrefs = new HashMap<>();
        Map<String, Double> brandPrefs = new HashMap<>();
        Map<String, Double> stylePrefs = new HashMap<>();
        double avgPrice = 0.0;
        int priceCount = 0;
        
        for (UserInteraction interaction : interactions) {
            Product product = productRepository.findById(interaction.getItemId()).orElse(null);
            if (product != null) {
                double weight = getInteractionWeight(interaction.getType());
                
                if (product.getCategory() != null) {
                    categoryPrefs.merge(product.getCategory(), weight, Double::sum);
                }
                if (product.getBrand() != null) {
                    brandPrefs.merge(product.getBrand(), weight, Double::sum);
                }
                
                List<String> tags = extractProductTags(product);
                for (String tag : tags) {
                    stylePrefs.merge(tag, weight, Double::sum);
                }
                
                avgPrice += product.getPrice();
                priceCount++;
            }
        }
        
        avgPrice = priceCount > 0 ? avgPrice / priceCount : 100.0;
        
        // Build preference vector similar to product vector structure
        preferences[0] = Math.log(avgPrice + 1) / Math.log(PRICE_NORMALIZATION_FACTOR);
        preferences[1] = 0.5; // Default discount preference
        
        // Set category preferences
        String topCategory = categoryPrefs.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("general");
        int categoryHash = Math.abs(topCategory.hashCode()) % 10;
        preferences[3 + categoryHash] = 1.0;
        
        // Set brand preferences
        String topBrand = brandPrefs.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("unknown");
        int brandHash = Math.abs(topBrand.hashCode()) % 10;
        preferences[13 + brandHash] = 1.0;
        
        // Set style preferences
        stylePrefs.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(10)
                .forEach(entry -> {
                    int styleIndex = Math.abs(entry.getKey().hashCode()) % 10;
                    preferences[33 + styleIndex] = entry.getValue() / stylePrefs.values().stream().mapToDouble(Double::doubleValue).max().orElse(1.0);
                });
        
        preferences[49] = 1.0; // Bias term
        
        return new UserPreferenceVector(userId, preferences, categoryPrefs, brandPrefs, stylePrefs);
    }
    
    private double calculateProductSimilarity(ProductVector vector1, ProductVector vector2) {
        double[] features1 = vector1.getFeatures();
        double[] features2 = vector2.getFeatures();
        
        double dotProduct = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;
        
        for (int i = 0; i < VECTOR_DIMENSION; i++) {
            dotProduct += features1[i] * features2[i];
            norm1 += features1[i] * features1[i];
            norm2 += features2[i] * features2[i];
        }
        
        if (norm1 == 0.0 || norm2 == 0.0) return 0.0;
        
        double cosineSimilarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        
        // Add tag similarity bonus
        Set<String> tags1 = new HashSet<>(vector1.getTags());
        Set<String> tags2 = new HashSet<>(vector2.getTags());
        Set<String> intersection = new HashSet<>(tags1);
        intersection.retainAll(tags2);
        Set<String> union = new HashSet<>(tags1);
        union.addAll(tags2);
        
        double tagSimilarity = union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
        
        return 0.7 * cosineSimilarity + 0.3 * tagSimilarity;
    }
    
    private double calculateUserProductMatch(UserPreferenceVector userVector, ProductVector productVector) {
        double[] userPrefs = userVector.getPreferences();
        double[] productFeatures = productVector.getFeatures();
        
        double score = 0.0;
        for (int i = 0; i < VECTOR_DIMENSION; i++) {
            score += userPrefs[i] * productFeatures[i] * featureWeights.getOrDefault("feature_" + i, 1.0);
        }
        
        // Apply sigmoid activation
        return 1.0 / (1.0 + Math.exp(-score));
    }
    
    private double calculateCrossSellingScore(UserPreferenceVector userVector, ProductVector currentProduct, ProductVector candidateProduct) {
        double userMatch = calculateUserProductMatch(userVector, candidateProduct);
        double complementaryScore = calculateComplementaryScore(currentProduct, candidateProduct);
        
        return 0.6 * userMatch + 0.4 * complementaryScore;
    }
    
    private boolean isComplementaryProduct(Product current, Product candidate) {
        // Define complementary product rules
        String currentCategory = current.getCategory();
        String candidateCategory = candidate.getCategory();
        
        if (currentCategory == null || candidateCategory == null) return false;
        
        // Fashion complementary rules
        if (currentCategory.toLowerCase().contains("dress") && candidateCategory.toLowerCase().contains("shoe")) return true;
        if (currentCategory.toLowerCase().contains("top") && candidateCategory.toLowerCase().contains("bottom")) return true;
        if (currentCategory.toLowerCase().contains("jacket") && candidateCategory.toLowerCase().contains("shirt")) return true;
        
        return false;
    }
    
    private double calculateComplementaryScore(ProductVector current, ProductVector candidate) {
        // Calculate how well products complement each other
        List<String> currentTags = current.getTags();
        List<String> candidateTags = candidate.getTags();
        
        double styleCompatibility = calculateStyleCompatibility(currentTags, candidateTags);
        double priceCompatibility = calculatePriceCompatibility(current.getFeatures()[0], candidate.getFeatures()[0]);
        
        return 0.7 * styleCompatibility + 0.3 * priceCompatibility;
    }
    
    private double calculateStyleCompatibility(List<String> tags1, List<String> tags2) {
        // Define style compatibility rules
        Map<String, List<String>> compatibleStyles = new HashMap<>();
        compatibleStyles.put("vintage", Arrays.asList("vintage", "retro", "boho"));
        compatibleStyles.put("modern", Arrays.asList("modern", "minimalist", "contemporary"));
        compatibleStyles.put("casual", Arrays.asList("casual", "streetwear", "weekend"));
        compatibleStyles.put("formal", Arrays.asList("formal", "business", "luxury"));
        
        double compatibility = 0.0;
        for (String tag1 : tags1) {
            List<String> compatible = compatibleStyles.getOrDefault(tag1, new ArrayList<>());
            for (String tag2 : tags2) {
                if (compatible.contains(tag2)) {
                    compatibility += 1.0;
                }
            }
        }
        
        return Math.min(compatibility / Math.max(tags1.size(), tags2.size()), 1.0);
    }
    
    private double calculatePriceCompatibility(double price1, double price2) {
        double ratio = Math.min(price1, price2) / Math.max(price1, price2);
        return ratio; // Products with similar prices are more compatible
    }
    
    private void updateUserPreferences(UserPreferenceVector userVector, ProductVector productVector, FeedbackType feedback, double rating) {
        double[] userPrefs = userVector.getPreferences();
        double[] productFeatures = productVector.getFeatures();
        
        double learningRate = LEARNING_RATE * (feedback == FeedbackType.POSITIVE ? rating : -rating);
        
        for (int i = 0; i < VECTOR_DIMENSION; i++) {
            userPrefs[i] += learningRate * productFeatures[i];
            userPrefs[i] = Math.max(-1.0, Math.min(1.0, userPrefs[i])); // Clip values
        }
    }
    
    private void updateProductFeatures(ProductVector productVector, FeedbackType feedback, double rating) {
        // Update product popularity and trending scores based on user feedback
        double[] features = productVector.getFeatures();
        
        if (feedback == FeedbackType.POSITIVE) {
            features[2] += 0.01 * rating; // Increase popularity
        } else {
            features[2] = Math.max(0.0, features[2] - 0.01 * rating); // Decrease popularity
        }
        
        features[2] = Math.min(1.0, features[2]); // Cap at 1.0
    }
    
    private void trackModelFeedback(String userId, String productId, FeedbackType feedback, double rating) {
        // In production, store this in database for model retraining
        Map<String, Object> feedbackData = new HashMap<>();
        feedbackData.put("userId", userId);
        feedbackData.put("productId", productId);
        feedbackData.put("feedback", feedback.name());
        feedbackData.put("rating", rating);
        feedbackData.put("timestamp", LocalDateTime.now());
        
        System.out.println("Model feedback tracked: " + feedbackData);
    }
    
    private void initializeFeatureWeights() {
        // Initialize feature weights (in production, these would be learned)
        for (int i = 0; i < VECTOR_DIMENSION; i++) {
            featureWeights.put("feature_" + i, 1.0);
        }
        
        // Set higher weights for important features
        featureWeights.put("feature_0", 2.0);  // Price
        featureWeights.put("feature_3", 3.0);  // Category start
        featureWeights.put("feature_33", 2.5); // Style tags start
    }
    
    private void trainUserPreferenceVectors() {
        // In production, this would use historical data to train vectors
        System.out.println("Training user preference vectors with historical data...");
    }
    
    private int getConditionValue(String condition) {
        switch (condition.toLowerCase()) {
            case "new": return 5;
            case "like new": return 4;
            case "excellent": return 3;
            case "good": return 2;
            case "fair": return 1;
            default: return 0;
        }
    }
    
    private double getInteractionWeight(UserBehaviorAnalyticsService.InteractionType type) {
        switch (type) {
            case PURCHASE: return 10.0;
            case ADD_TO_CART: return 5.0;
            case PRODUCT_VIEW: return 1.0;
            case SEARCH: return 2.0;
            default: return 1.0;
        }
    }
    
    // Data classes
    public enum FeedbackType {
        POSITIVE, NEGATIVE, NEUTRAL
    }
    
    private static class SimilarityScore {
        private final Product product;
        private final double score;
        
        public SimilarityScore(Product product, double score) {
            this.product = product;
            this.score = score;
        }
        
        public Product getProduct() { return product; }
        public double getScore() { return score; }
    }
    
    private static class MatchScore {
        private final Product product;
        private final double score;
        
        public MatchScore(Product product, double score) {
            this.product = product;
            this.score = score;
        }
        
        public Product getProduct() { return product; }
        public double getScore() { return score; }
    }
    
    public static class ProductVector {
        private final String productId;
        private final double[] features;
        private final List<String> tags;
        
        public ProductVector(String productId, double[] features, List<String> tags) {
            this.productId = productId;
            this.features = features.clone();
            this.tags = new ArrayList<>(tags);
        }
        
        public String getProductId() { return productId; }
        public double[] getFeatures() { return features; }
        public List<String> getTags() { return tags; }
    }
    
    public static class UserPreferenceVector {
        private final String userId;
        private final double[] preferences;
        private final Map<String, Double> categoryPreferences;
        private final Map<String, Double> brandPreferences;
        private final Map<String, Double> stylePreferences;
        
        public UserPreferenceVector(String userId, double[] preferences, 
                                  Map<String, Double> categoryPrefs, 
                                  Map<String, Double> brandPrefs,
                                  Map<String, Double> stylePrefs) {
            this.userId = userId;
            this.preferences = preferences.clone();
            this.categoryPreferences = new HashMap<>(categoryPrefs);
            this.brandPreferences = new HashMap<>(brandPrefs);
            this.stylePreferences = new HashMap<>(stylePrefs);
        }
        
        public String getUserId() { return userId; }
        public double[] getPreferences() { return preferences; }
        public Map<String, Double> getCategoryPreferences() { return categoryPreferences; }
        public Map<String, Double> getBrandPreferences() { return brandPreferences; }
        public Map<String, Double> getStylePreferences() { return stylePreferences; }
    }
}
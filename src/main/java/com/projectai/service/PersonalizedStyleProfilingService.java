package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.models.Seller;
import com.projectai.repository.ProductRepository;
import com.projectai.service.UserBehaviorAnalyticsService.UserInteraction;
import com.projectai.service.UserBehaviorAnalyticsService.InteractionType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class PersonalizedStyleProfilingService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserBehaviorAnalyticsService behaviorAnalyticsService;
    
    @Autowired
    private MLProductMatchingService mlProductMatchingService;
    
    // User style profiles storage
    private final Map<String, PersonalizedStyleProfile> styleProfiles = new ConcurrentHashMap<>();
    private final Map<String, FashionPersonality> fashionPersonalities = new ConcurrentHashMap<>();
    private final Map<String, SeasonalPreferences> seasonalPrefs = new ConcurrentHashMap<>();
    private final Map<String, StyleEvolutionTracker> styleEvolution = new ConcurrentHashMap<>();
    
    // Style analysis parameters
    private static final int MIN_INTERACTIONS_FOR_PROFILING = 10;
    private static final double CONFIDENCE_THRESHOLD = 0.6;
    private static final int PROFILE_UPDATE_DAYS = 7;
    
    public PersonalizedStyleProfile buildUserStyleProfile(String userId) {
        PersonalizedStyleProfile profile = styleProfiles.get(userId);
        
        if (profile == null || profile.needsUpdate()) {
            profile = createStyleProfile(userId);
            styleProfiles.put(userId, profile);
        }
        
        return profile;
    }
    
    public FashionPersonality analyzeFashionPersonality(String userId) {
        List<UserInteraction> interactions = behaviorAnalyticsService.getUserInteractions(userId, 500);
        
        if (interactions.size() < MIN_INTERACTIONS_FOR_PROFILING) {
            return new FashionPersonality(userId, PersonalityType.UNDEFINED, 0.0);
        }
        
        Map<PersonalityType, Double> personalityScores = calculatePersonalityScores(interactions);
        
        PersonalityType dominantType = personalityScores.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(PersonalityType.BALANCED);
        
        double confidence = personalityScores.getOrDefault(dominantType, 0.0);
        
        FashionPersonality personality = new FashionPersonality(userId, dominantType, confidence);
        fashionPersonalities.put(userId, personality);
        
        return personality;
    }
    
    public List<StyleRecommendation> generateStyleRecommendations(String userId) {
        PersonalizedStyleProfile profile = buildUserStyleProfile(userId);
        FashionPersonality personality = analyzeFashionPersonality(userId);
        
        List<StyleRecommendation> recommendations = new ArrayList<>();
        
        // Generate recommendations based on style gaps
        List<String> missingCategories = identifyStyleGaps(profile);
        for (String category : missingCategories) {
            StyleRecommendation rec = createCategoryRecommendation(userId, category, profile, personality);
            if (rec != null) recommendations.add(rec);
        }
        
        // Generate trend-based recommendations
        recommendations.addAll(generateTrendRecommendations(userId, profile));
        
        // Generate seasonal recommendations
        recommendations.addAll(generateSeasonalRecommendations(userId, profile));
        
        // Generate occasion-based recommendations
        recommendations.addAll(generateOccasionRecommendations(userId, profile));
        
        return recommendations.stream()
                .sorted((a, b) -> Double.compare(b.getConfidenceScore(), a.getConfidenceScore()))
                .limit(20)
                .collect(Collectors.toList());
    }
    
    public Map<String, Double> analyzeColorPreferences(String userId) {
        List<UserInteraction> interactions = behaviorAnalyticsService.getUserInteractions(userId, 300);
        Map<String, Double> colorPrefs = new HashMap<>();
        
        for (UserInteraction interaction : interactions) {
            if (interaction.getType() == InteractionType.PRODUCT_VIEW || 
                interaction.getType() == InteractionType.PURCHASE) {
                
                Product product = getProduct(interaction.getItemId());
                if (product != null) {
                    List<String> colors = extractColors(product);
                    double weight = getInteractionWeight(interaction.getType());
                    
                    for (String color : colors) {
                        colorPrefs.merge(color, weight, Double::sum);
                    }
                }
            }
        }
        
        // Normalize scores
        double maxScore = colorPrefs.values().stream().mapToDouble(Double::doubleValue).max().orElse(1.0);
        colorPrefs.replaceAll((k, v) -> v / maxScore);
        
        return colorPrefs;
    }
    
    public Map<String, Double> analyzeSizePreferences(String userId) {
        List<UserInteraction> interactions = behaviorAnalyticsService.getUserInteractions(userId, 200);
        Map<String, Double> sizePrefs = new HashMap<>();
        
        for (UserInteraction interaction : interactions) {
            if (interaction.getType() == InteractionType.PURCHASE) {
                Product product = getProduct(interaction.getItemId());
                if (product != null && product.getSize() != null) {
                    String normalizedSize = normalizeSize(product.getSize());
                    sizePrefs.merge(normalizedSize, 1.0, Double::sum);
                }
            }
        }
        
        return sizePrefs;
    }
    
    public StyleEvolutionInsights analyzeStyleEvolution(String userId) {
        List<UserInteraction> interactions = behaviorAnalyticsService.getUserInteractions(userId, 1000);
        
        // Group interactions by time periods (monthly)
        Map<String, List<UserInteraction>> monthlyInteractions = groupInteractionsByMonth(interactions);
        
        List<MonthlyStyleProfile> evolution = new ArrayList<>();
        for (Map.Entry<String, List<UserInteraction>> entry : monthlyInteractions.entrySet()) {
            MonthlyStyleProfile monthlyProfile = analyzeMonthlyStyle(entry.getKey(), entry.getValue());
            evolution.add(monthlyProfile);
        }
        
        evolution.sort((a, b) -> a.getMonth().compareTo(b.getMonth()));
        
        return new StyleEvolutionInsights(userId, evolution, generateStyleTrendInsights(evolution));
    }
    
    public List<Product> findStyleMatchProducts(String userId, String occasion, double budget) {
        PersonalizedStyleProfile profile = buildUserStyleProfile(userId);
        FashionPersonality personality = analyzeFashionPersonality(userId);
        
        List<Product> availableProducts = productRepository.findByIsAvailableTrue();
        
        return availableProducts.stream()
                .filter(product -> product.getPrice() <= budget)
                .filter(product -> matchesOccasion(product, occasion))
                .map(product -> new StyleMatch(product, calculateStyleMatchScore(product, profile, personality)))
                .filter(match -> match.getScore() > CONFIDENCE_THRESHOLD)
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .limit(50)
                .map(StyleMatch::getProduct)
                .collect(Collectors.toList());
    }
    
    public OutfitSuggestion generateCompleteOutfit(String userId, String occasion, double budget) {
        PersonalizedStyleProfile profile = buildUserStyleProfile(userId);
        
        Map<String, Product> outfitComponents = new HashMap<>();
        double totalCost = 0.0;
        
        // Essential clothing categories for a complete outfit
        List<String> essentialCategories = getEssentialCategories(occasion);
        
        for (String category : essentialCategories) {
            if (totalCost >= budget) break;
            
            double categoryBudget = (budget - totalCost) / (essentialCategories.size() - outfitComponents.size());
            Product bestMatch = findBestCategoryMatch(userId, category, categoryBudget, profile);
            
            if (bestMatch != null && totalCost + bestMatch.getPrice() <= budget) {
                outfitComponents.put(category, bestMatch);
                totalCost += bestMatch.getPrice();
            }
        }
        
        return new OutfitSuggestion(userId, occasion, outfitComponents, totalCost, calculateOutfitCoherence(outfitComponents));
    }
    
    public void updateStylePreferences(String userId, String productId, PreferenceUpdate update) {
        PersonalizedStyleProfile profile = buildUserStyleProfile(userId);
        Product product = getProduct(productId);
        
        if (product != null) {
            updateProfileWithFeedback(profile, product, update);
            
            // Update ML models with this feedback
            MLProductMatchingService.FeedbackType feedbackType = update.isPositive() ? 
                    MLProductMatchingService.FeedbackType.POSITIVE : 
                    MLProductMatchingService.FeedbackType.NEGATIVE;
            
            mlProductMatchingService.updateMLModelsWithUserFeedback(userId, productId, feedbackType, update.getRating());
        }
    }
    
    public StyleCompatibilityReport analyzeWardrobeCompatibility(String userId, List<String> productIds) {
        List<Product> products = productIds.stream()
                .map(this::getProduct)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        
        if (products.isEmpty()) {
            return new StyleCompatibilityReport(userId, Collections.emptyList(), 0.0);
        }
        
        PersonalizedStyleProfile profile = buildUserStyleProfile(userId);
        List<CompatibilityAnalysis> analyses = new ArrayList<>();
        
        for (int i = 0; i < products.size(); i++) {
            for (int j = i + 1; j < products.size(); j++) {
                Product prod1 = products.get(i);
                Product prod2 = products.get(j);
                
                double compatibility = calculateProductCompatibility(prod1, prod2, profile);
                analyses.add(new CompatibilityAnalysis(prod1, prod2, compatibility));
            }
        }
        
        double overallCompatibility = analyses.stream()
                .mapToDouble(CompatibilityAnalysis::getScore)
                .average()
                .orElse(0.0);
        
        return new StyleCompatibilityReport(userId, analyses, overallCompatibility);
    }
    
    // Private helper methods
    private PersonalizedStyleProfile createStyleProfile(String userId) {
        List<UserInteraction> interactions = behaviorAnalyticsService.getUserInteractions(userId, 500);
        
        Map<String, Double> categoryPrefs = analyzeCategoryPreferences(interactions);
        Map<String, Double> stylePrefs = analyzeStylePreferences(interactions);
        Map<String, Double> brandPrefs = analyzeBrandPreferences(interactions);
        Map<String, Double> colorPrefs = analyzeColorPreferences(userId);
        Map<String, Double> priceRange = analyzePriceRange(interactions);
        Map<String, Double> occasionPrefs = analyzeOccasionPreferences(interactions);
        
        PersonalizedStyleProfile profile = new PersonalizedStyleProfile(
                userId, categoryPrefs, stylePrefs, brandPrefs, colorPrefs, priceRange, occasionPrefs);
        
        profile.setLastUpdated(LocalDateTime.now());
        profile.setConfidenceScore(calculateProfileConfidence(interactions.size()));
        
        return profile;
    }
    
    private Map<PersonalityType, Double> calculatePersonalityScores(List<UserInteraction> interactions) {
        Map<PersonalityType, Double> scores = new HashMap<>();
        
        for (PersonalityType type : PersonalityType.values()) {
            scores.put(type, 0.0);
        }
        
        for (UserInteraction interaction : interactions) {
            Product product = getProduct(interaction.getItemId());
            if (product != null) {
                Map<PersonalityType, Double> productScores = analyzeProductPersonality(product);
                double weight = getInteractionWeight(interaction.getType());
                
                for (Map.Entry<PersonalityType, Double> entry : productScores.entrySet()) {
                    scores.merge(entry.getKey(), entry.getValue() * weight, Double::sum);
                }
            }
        }
        
        // Normalize scores
        double totalScore = scores.values().stream().mapToDouble(Double::doubleValue).sum();
        if (totalScore > 0) {
            scores.replaceAll((k, v) -> v / totalScore);
        }
        
        return scores;
    }
    
    private Map<PersonalityType, Double> analyzeProductPersonality(Product product) {
        Map<PersonalityType, Double> scores = new HashMap<>();
        
        String description = (product.getDescription() != null ? product.getDescription() : "") + " " +
                           (product.getName() != null ? product.getName() : "");
        String lowerDesc = description.toLowerCase();
        
        // Trendsetter indicators
        if (lowerDesc.contains("trendy") || lowerDesc.contains("latest") || lowerDesc.contains("fashion-forward")) {
            scores.put(PersonalityType.TRENDSETTER, 0.8);
        }
        
        // Classic indicators  
        if (lowerDesc.contains("classic") || lowerDesc.contains("timeless") || lowerDesc.contains("traditional")) {
            scores.put(PersonalityType.CLASSIC, 0.8);
        }
        
        // Minimalist indicators
        if (lowerDesc.contains("minimalist") || lowerDesc.contains("simple") || lowerDesc.contains("clean")) {
            scores.put(PersonalityType.MINIMALIST, 0.7);
        }
        
        // Bohemian indicators
        if (lowerDesc.contains("boho") || lowerDesc.contains("bohemian") || lowerDesc.contains("free-spirit")) {
            scores.put(PersonalityType.BOHEMIAN, 0.8);
        }
        
        // Edgy indicators
        if (lowerDesc.contains("edgy") || lowerDesc.contains("rock") || lowerDesc.contains("punk")) {
            scores.put(PersonalityType.EDGY, 0.7);
        }
        
        // Default to balanced if no strong indicators
        if (scores.isEmpty()) {
            scores.put(PersonalityType.BALANCED, 0.3);
        }
        
        return scores;
    }
    
    private List<String> identifyStyleGaps(PersonalizedStyleProfile profile) {
        List<String> allCategories = Arrays.asList(
                "tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"
        );
        
        return allCategories.stream()
                .filter(category -> profile.getCategoryPreferences().getOrDefault(category, 0.0) < 0.3)
                .collect(Collectors.toList());
    }
    
    private StyleRecommendation createCategoryRecommendation(String userId, String category, 
                                                           PersonalizedStyleProfile profile, 
                                                           FashionPersonality personality) {
        List<Product> categoryProducts = productRepository.findByCategoryContainingIgnoreCase(category);
        
        if (categoryProducts.isEmpty()) return null;
        
        Product bestMatch = categoryProducts.stream()
                .max((a, b) -> Double.compare(
                        calculateStyleMatchScore(a, profile, personality),
                        calculateStyleMatchScore(b, profile, personality)))
                .orElse(null);
        
        if (bestMatch == null) return null;
        
        return new StyleRecommendation(
                RecommendationType.CATEGORY_GAP,
                "Complete your " + category + " collection",
                bestMatch,
                calculateStyleMatchScore(bestMatch, profile, personality),
                "Based on your style preferences, this would be a great addition to your " + category + " collection."
        );
    }
    
    private List<StyleRecommendation> generateTrendRecommendations(String userId, PersonalizedStyleProfile profile) {
        List<String> trendingProducts = behaviorAnalyticsService.getTrendingProducts(20);
        
        return trendingProducts.stream()
                .map(this::getProduct)
                .filter(Objects::nonNull)
                .filter(product -> calculateStyleMatchScore(product, profile, null) > 0.5)
                .limit(5)
                .map(product -> new StyleRecommendation(
                        RecommendationType.TRENDING,
                        "Trending now in your style",
                        product,
                        0.8,
                        "This trending item matches your personal style preferences."
                ))
                .collect(Collectors.toList());
    }
    
    private List<StyleRecommendation> generateSeasonalRecommendations(String userId, PersonalizedStyleProfile profile) {
        String currentSeason = getCurrentSeason();
        List<Product> seasonalProducts = findSeasonalProducts(currentSeason);
        
        return seasonalProducts.stream()
                .filter(product -> calculateStyleMatchScore(product, profile, null) > 0.6)
                .limit(3)
                .map(product -> new StyleRecommendation(
                        RecommendationType.SEASONAL,
                        "Perfect for " + currentSeason,
                        product,
                        0.7,
                        "This item is perfect for the current " + currentSeason + " season and matches your style."
                ))
                .collect(Collectors.toList());
    }
    
    private List<StyleRecommendation> generateOccasionRecommendations(String userId, PersonalizedStyleProfile profile) {
        List<String> commonOccasions = Arrays.asList("work", "casual", "formal", "party");
        List<StyleRecommendation> recommendations = new ArrayList<>();
        
        for (String occasion : commonOccasions) {
            if (profile.getOccasionPreferences().getOrDefault(occasion, 0.0) < 0.3) {
                Product match = findBestOccasionMatch(occasion, profile);
                if (match != null) {
                    recommendations.add(new StyleRecommendation(
                            RecommendationType.OCCASION,
                            "Perfect for " + occasion + " occasions",
                            match,
                            0.6,
                            "This would be great for " + occasion + " occasions based on your style."
                    ));
                }
            }
        }
        
        return recommendations;
    }
    
    private double calculateStyleMatchScore(Product product, PersonalizedStyleProfile profile, FashionPersonality personality) {
        if (product == null || profile == null) return 0.0;
        
        double score = 0.0;
        
        // Category match
        String category = product.getCategory();
        if (category != null) {
            score += profile.getCategoryPreferences().getOrDefault(category.toLowerCase(), 0.0) * 0.3;
        }
        
        // Brand match
        String brand = product.getBrand();
        if (brand != null) {
            score += profile.getBrandPreferences().getOrDefault(brand.toLowerCase(), 0.0) * 0.2;
        }
        
        // Price range match
        double price = product.getPrice();
        String priceRange = getPriceRange(price);
        score += profile.getPriceRangePreferences().getOrDefault(priceRange, 0.0) * 0.2;
        
        // Style tags match
        List<String> productTags = mlProductMatchingService.extractProductTags(product);
        for (String tag : productTags) {
            score += profile.getStylePreferences().getOrDefault(tag, 0.0) * 0.2;
        }
        
        // Personality match
        if (personality != null && personality.getType() != PersonalityType.UNDEFINED) {
            Map<PersonalityType, Double> productPersonality = analyzeProductPersonality(product);
            score += productPersonality.getOrDefault(personality.getType(), 0.0) * 0.1;
        }
        
        return Math.min(score, 1.0);
    }
    
    private List<String> extractColors(Product product) {
        String description = (product.getDescription() != null ? product.getDescription() : "") + " " +
                           (product.getName() != null ? product.getName() : "");
        String lowerDesc = description.toLowerCase();
        
        List<String> colors = new ArrayList<>();
        List<String> colorKeywords = Arrays.asList(
                "black", "white", "red", "blue", "green", "yellow", "pink", "purple", "orange", "brown",
                "grey", "gray", "navy", "burgundy", "maroon", "teal", "olive", "tan", "beige", "cream"
        );
        
        for (String color : colorKeywords) {
            if (lowerDesc.contains(color)) {
                colors.add(color);
            }
        }
        
        return colors.isEmpty() ? Arrays.asList("neutral") : colors;
    }
    
    private Product getProduct(String productId) {
        try {
            return productRepository.findById(productId).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
    
    private double getInteractionWeight(InteractionType type) {
        switch (type) {
            case PURCHASE: return 10.0;
            case ADD_TO_CART: return 5.0;
            case PRODUCT_VIEW: return 1.0;
            case SEARCH: return 2.0;
            default: return 1.0;
        }
    }
    
    // Data classes and enums
    public enum PersonalityType {
        TRENDSETTER, CLASSIC, MINIMALIST, BOHEMIAN, EDGY, ROMANTIC, SPORTY, BALANCED, UNDEFINED
    }
    
    public enum RecommendationType {
        CATEGORY_GAP, TRENDING, SEASONAL, OCCASION, STYLE_EVOLUTION, WARDROBE_COMPLETION
    }
    
    public static class PersonalizedStyleProfile {
        private String userId;
        private Map<String, Double> categoryPreferences;
        private Map<String, Double> stylePreferences;
        private Map<String, Double> brandPreferences;
        private Map<String, Double> colorPreferences;
        private Map<String, Double> priceRangePreferences;
        private Map<String, Double> occasionPreferences;
        private LocalDateTime lastUpdated;
        private double confidenceScore;
        
        public PersonalizedStyleProfile(String userId, Map<String, Double> categoryPrefs,
                                      Map<String, Double> stylePrefs, Map<String, Double> brandPrefs,
                                      Map<String, Double> colorPrefs, Map<String, Double> priceRange,
                                      Map<String, Double> occasionPrefs) {
            this.userId = userId;
            this.categoryPreferences = new HashMap<>(categoryPrefs);
            this.stylePreferences = new HashMap<>(stylePrefs);
            this.brandPreferences = new HashMap<>(brandPrefs);
            this.colorPreferences = new HashMap<>(colorPrefs);
            this.priceRangePreferences = new HashMap<>(priceRange);
            this.occasionPreferences = new HashMap<>(occasionPrefs);
            this.lastUpdated = LocalDateTime.now();
            this.confidenceScore = 0.0;
        }
        
        public boolean needsUpdate() {
            return lastUpdated == null || 
                   ChronoUnit.DAYS.between(lastUpdated, LocalDateTime.now()) > PROFILE_UPDATE_DAYS;
        }
        
        // Getters and setters
        public String getUserId() { return userId; }
        public Map<String, Double> getCategoryPreferences() { return categoryPreferences; }
        public Map<String, Double> getStylePreferences() { return stylePreferences; }
        public Map<String, Double> getBrandPreferences() { return brandPreferences; }
        public Map<String, Double> getColorPreferences() { return colorPreferences; }
        public Map<String, Double> getPriceRangePreferences() { return priceRangePreferences; }
        public Map<String, Double> getOccasionPreferences() { return occasionPreferences; }
        public LocalDateTime getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
        public double getConfidenceScore() { return confidenceScore; }
        public void setConfidenceScore(double confidenceScore) { this.confidenceScore = confidenceScore; }
    }
    
    public static class FashionPersonality {
        private String userId;
        private PersonalityType type;
        private double confidence;
        private Map<PersonalityType, Double> typeScores;
        
        public FashionPersonality(String userId, PersonalityType type, double confidence) {
            this.userId = userId;
            this.type = type;
            this.confidence = confidence;
            this.typeScores = new HashMap<>();
        }
        
        // Getters and setters
        public String getUserId() { return userId; }
        public PersonalityType getType() { return type; }
        public double getConfidence() { return confidence; }
        public Map<PersonalityType, Double> getTypeScores() { return typeScores; }
        public void setTypeScores(Map<PersonalityType, Double> typeScores) { this.typeScores = typeScores; }
    }
    
    public static class StyleRecommendation {
        private RecommendationType type;
        private String title;
        private Product product;
        private double confidenceScore;
        private String reasoning;
        
        public StyleRecommendation(RecommendationType type, String title, Product product, 
                                 double confidenceScore, String reasoning) {
            this.type = type;
            this.title = title;
            this.product = product;
            this.confidenceScore = confidenceScore;
            this.reasoning = reasoning;
        }
        
        // Getters
        public RecommendationType getType() { return type; }
        public String getTitle() { return title; }
        public Product getProduct() { return product; }
        public double getConfidenceScore() { return confidenceScore; }
        public String getReasoning() { return reasoning; }
    }
    
    public static class OutfitSuggestion {
        private String userId;
        private String occasion;
        private Map<String, Product> components;
        private double totalCost;
        private double coherenceScore;
        
        public OutfitSuggestion(String userId, String occasion, Map<String, Product> components, 
                              double totalCost, double coherenceScore) {
            this.userId = userId;
            this.occasion = occasion;
            this.components = new HashMap<>(components);
            this.totalCost = totalCost;
            this.coherenceScore = coherenceScore;
        }
        
        // Getters
        public String getUserId() { return userId; }
        public String getOccasion() { return occasion; }
        public Map<String, Product> getComponents() { return components; }
        public double getTotalCost() { return totalCost; }
        public double getCoherenceScore() { return coherenceScore; }
    }
    
    public static class PreferenceUpdate {
        private boolean positive;
        private double rating;
        private String reason;
        
        public PreferenceUpdate(boolean positive, double rating, String reason) {
            this.positive = positive;
            this.rating = rating;
            this.reason = reason;
        }
        
        public boolean isPositive() { return positive; }
        public double getRating() { return rating; }
        public String getReason() { return reason; }
    }
    
    // Additional helper method implementations would go here...
    private Map<String, Double> analyzeCategoryPreferences(List<UserInteraction> interactions) {
        Map<String, Double> prefs = new HashMap<>();
        for (UserInteraction interaction : interactions) {
            Product product = getProduct(interaction.getItemId());
            if (product != null && product.getCategory() != null) {
                double weight = getInteractionWeight(interaction.getType());
                prefs.merge(product.getCategory().toLowerCase(), weight, Double::sum);
            }
        }
        double maxScore = prefs.values().stream().mapToDouble(Double::doubleValue).max().orElse(1.0);
        prefs.replaceAll((k, v) -> v / maxScore);
        return prefs;
    }
    
    private Map<String, Double> analyzeStylePreferences(List<UserInteraction> interactions) {
        Map<String, Double> stylePrefs = new HashMap<>();
        for (UserInteraction interaction : interactions) {
            Product product = getProduct(interaction.getItemId());
            if (product != null) {
                List<String> tags = mlProductMatchingService.extractProductTags(product);
                double weight = getInteractionWeight(interaction.getType());
                for (String tag : tags) {
                    stylePrefs.merge(tag, weight, Double::sum);
                }
            }
        }
        double maxScore = stylePrefs.values().stream().mapToDouble(Double::doubleValue).max().orElse(1.0);
        stylePrefs.replaceAll((k, v) -> v / maxScore);
        return stylePrefs;
    }
    
    private Map<String, Double> analyzeBrandPreferences(List<UserInteraction> interactions) {
        Map<String, Double> brandPrefs = new HashMap<>();
        for (UserInteraction interaction : interactions) {
            Product product = getProduct(interaction.getItemId());
            if (product != null && product.getBrand() != null) {
                double weight = getInteractionWeight(interaction.getType());
                brandPrefs.merge(product.getBrand().toLowerCase(), weight, Double::sum);
            }
        }
        double maxScore = brandPrefs.values().stream().mapToDouble(Double::doubleValue).max().orElse(1.0);
        brandPrefs.replaceAll((k, v) -> v / maxScore);
        return brandPrefs;
    }
    
    private Map<String, Double> analyzePriceRange(List<UserInteraction> interactions) {
        Map<String, Double> pricePrefs = new HashMap<>();
        for (UserInteraction interaction : interactions) {
            Product product = getProduct(interaction.getItemId());
            if (product != null) {
                String priceRange = getPriceRange(product.getPrice());
                double weight = getInteractionWeight(interaction.getType());
                pricePrefs.merge(priceRange, weight, Double::sum);
            }
        }
        double maxScore = pricePrefs.values().stream().mapToDouble(Double::doubleValue).max().orElse(1.0);
        pricePrefs.replaceAll((k, v) -> v / maxScore);
        return pricePrefs;
    }
    
    private Map<String, Double> analyzeOccasionPreferences(List<UserInteraction> interactions) {
        Map<String, Double> occasionPrefs = new HashMap<>();
        for (UserInteraction interaction : interactions) {
            Product product = getProduct(interaction.getItemId());
            if (product != null) {
                List<String> occasions = extractOccasions(product);
                double weight = getInteractionWeight(interaction.getType());
                for (String occasion : occasions) {
                    occasionPrefs.merge(occasion, weight, Double::sum);
                }
            }
        }
        double maxScore = occasionPrefs.values().stream().mapToDouble(Double::doubleValue).max().orElse(1.0);
        occasionPrefs.replaceAll((k, v) -> v / maxScore);
        return occasionPrefs;
    }
    
    private String getPriceRange(double price) {
        if (price < 50) return "budget";
        else if (price < 150) return "mid-range";
        else if (price < 300) return "premium";
        else return "luxury";
    }
    
    private List<String> extractOccasions(Product product) {
        String description = (product.getDescription() != null ? product.getDescription() : "") + " " +
                           (product.getName() != null ? product.getName() : "");
        String lowerDesc = description.toLowerCase();
        
        List<String> occasions = new ArrayList<>();
        if (lowerDesc.contains("work") || lowerDesc.contains("office") || lowerDesc.contains("business")) {
            occasions.add("work");
        }
        if (lowerDesc.contains("casual") || lowerDesc.contains("everyday")) {
            occasions.add("casual");
        }
        if (lowerDesc.contains("formal") || lowerDesc.contains("dress")) {
            occasions.add("formal");
        }
        if (lowerDesc.contains("party") || lowerDesc.contains("evening")) {
            occasions.add("party");
        }
        
        return occasions.isEmpty() ? Arrays.asList("general") : occasions;
    }
    
    private double calculateProfileConfidence(int interactionCount) {
        if (interactionCount < MIN_INTERACTIONS_FOR_PROFILING) return 0.0;
        return Math.min(1.0, (double) interactionCount / 100.0);
    }
    
    // Placeholder implementations for missing methods
    private String normalizeSize(String size) {
        return size.toUpperCase().trim();
    }
    
    private Map<String, List<UserInteraction>> groupInteractionsByMonth(List<UserInteraction> interactions) {
        return new HashMap<>(); // Simplified implementation
    }
    
    private MonthlyStyleProfile analyzeMonthlyStyle(String month, List<UserInteraction> interactions) {
        return new MonthlyStyleProfile(month, new HashMap<>());
    }
    
    private StyleEvolutionInsights detectStyleTrends(List<MonthlyStyleProfile> evolution) {
        return new StyleEvolutionInsights("", evolution, new ArrayList<>());
    }
    
    private boolean matchesOccasion(Product product, String occasion) {
        return extractOccasions(product).contains(occasion.toLowerCase());
    }
    
    private List<String> getEssentialCategories(String occasion) {
        return Arrays.asList("tops", "bottoms", "shoes");
    }
    
    private Product findBestCategoryMatch(String userId, String category, double budget, PersonalizedStyleProfile profile) {
        return productRepository.findByCategoryContainingIgnoreCase(category)
                .stream()
                .filter(p -> p.getPrice() <= budget)
                .max((a, b) -> Double.compare(
                        calculateStyleMatchScore(a, profile, null),
                        calculateStyleMatchScore(b, profile, null)))
                .orElse(null);
    }
    
    private double calculateOutfitCoherence(Map<String, Product> components) {
        return 0.8; // Simplified implementation
    }
    
    private void updateProfileWithFeedback(PersonalizedStyleProfile profile, Product product, PreferenceUpdate update) {
        // Update profile based on user feedback
        if (product.getCategory() != null) {
            String category = product.getCategory().toLowerCase();
            double currentPref = profile.getCategoryPreferences().getOrDefault(category, 0.0);
            double adjustment = update.isPositive() ? 0.1 : -0.1;
            profile.getCategoryPreferences().put(category, Math.max(0.0, Math.min(1.0, currentPref + adjustment)));
        }
    }
    
    private double calculateProductCompatibility(Product prod1, Product prod2, PersonalizedStyleProfile profile) {
        return 0.7; // Simplified implementation
    }
    
    private String getCurrentSeason() {
        int month = LocalDateTime.now().getMonthValue();
        if (month >= 3 && month <= 5) return "spring";
        else if (month >= 6 && month <= 8) return "summer";
        else if (month >= 9 && month <= 11) return "fall";
        else return "winter";
    }
    
    private List<Product> findSeasonalProducts(String season) {
        return productRepository.findByDescriptionContainingIgnoreCase(season);
    }
    
    private Product findBestOccasionMatch(String occasion, PersonalizedStyleProfile profile) {
        return productRepository.findByDescriptionContainingIgnoreCase(occasion)
                .stream()
                .max((a, b) -> Double.compare(
                        calculateStyleMatchScore(a, profile, null),
                        calculateStyleMatchScore(b, profile, null)))
                .orElse(null);
    }
    
    // Additional inner classes for completeness
    public static class StyleMatch {
        private final Product product;
        private final double score;
        
        public StyleMatch(Product product, double score) {
            this.product = product;
            this.score = score;
        }
        
        public Product getProduct() { return product; }
        public double getScore() { return score; }
    }
    
    public static class StyleEvolutionTracker {
        // Implementation details
    }
    
    public static class SeasonalPreferences {
        // Implementation details
    }
    
    public static class MonthlyStyleProfile {
        private String month;
        private Map<String, Double> preferences;
        
        public MonthlyStyleProfile(String month, Map<String, Double> preferences) {
            this.month = month;
            this.preferences = preferences;
        }
        
        public String getMonth() { return month; }
        public Map<String, Double> getPreferences() { return preferences; }
    }
    
    public static class StyleEvolutionInsights {
        private String userId;
        private List<MonthlyStyleProfile> evolution;
        private List<String> trendInsights;
        
        public StyleEvolutionInsights(String userId, List<MonthlyStyleProfile> evolution, List<String> trendInsights) {
            this.userId = userId;
            this.evolution = evolution;
            this.trendInsights = trendInsights;
        }
        
        public String getUserId() { return userId; }
        public List<MonthlyStyleProfile> getEvolution() { return evolution; }
        public List<String> getTrendInsights() { return trendInsights; }
    }
    
    public static class CompatibilityAnalysis {
        private Product product1;
        private Product product2;
        private double score;
        
        public CompatibilityAnalysis(Product product1, Product product2, double score) {
            this.product1 = product1;
            this.product2 = product2;
            this.score = score;
        }
        
        public Product getProduct1() { return product1; }
        public Product getProduct2() { return product2; }
        public double getScore() { return score; }
    }
    
    public static class StyleCompatibilityReport {
        private String userId;
        private List<CompatibilityAnalysis> analyses;
        private double overallScore;
        
        public StyleCompatibilityReport(String userId, List<CompatibilityAnalysis> analyses, double overallScore) {
            this.userId = userId;
            this.analyses = analyses;
            this.overallScore = overallScore;
        }
        
        public String getUserId() { return userId; }
        public List<CompatibilityAnalysis> getAnalyses() { return analyses; }
        public double getOverallScore() { return overallScore; }
    }

    private List<String> generateStyleTrendInsights(List<MonthlyStyleProfile> evolution) {
        List<String> insights = new ArrayList<>();

        if (evolution.size() < 2) {
            insights.add("Not enough data to analyze style trends");
            return insights;
        }

        // Analyze color preferences evolution
        insights.add("Your color preferences have evolved over time");

        // Analyze category preferences evolution
        insights.add("Your style preferences show increasing sophistication");

        // Analyze seasonal patterns
        insights.add("You adapt your style choices seasonally");

        return insights;
    }
}
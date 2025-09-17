package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.models.Seller;
import com.projectai.repository.ProductRepository;
import com.projectai.service.PersonalizedStyleProfilingService.PersonalizedStyleProfile;
import com.projectai.service.UserBehaviorAnalyticsService.InteractionType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

@Service
public class IntelligentSearchService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserBehaviorAnalyticsService behaviorAnalyticsService;
    
    @Autowired
    private PersonalizedStyleProfilingService styleProfilingService;
    
    @Autowired
    private MLProductMatchingService mlProductMatchingService;
    
    // Search intelligence components
    private final Map<String, QueryIntent> queryIntents = new ConcurrentHashMap<>();
    private final Map<String, List<String>> searchSuggestions = new ConcurrentHashMap<>();
    private final Map<String, SearchPersonalization> userSearchProfiles = new ConcurrentHashMap<>();
    private final Map<String, Integer> queryPopularity = new ConcurrentHashMap<>();
    
    // Search parameters
    private static final double SEMANTIC_SIMILARITY_THRESHOLD = 0.4;
    private static final int MAX_SEARCH_RESULTS = 100;
    private static final int SUGGESTION_LIMIT = 10;
    private static final double PERSONALIZATION_WEIGHT = 0.3;
    private static final double RELEVANCE_WEIGHT = 0.4;
    private static final double POPULARITY_WEIGHT = 0.2;
    private static final double FRESHNESS_WEIGHT = 0.1;
    
    public IntelligentSearchResult intelligentSearch(String userId, String query, SearchFilters filters) {
        // Track the search for analytics and personalization
        behaviorAnalyticsService.trackSearch(userId, query, 
                filters != null ? filters.toFilterList() : Collections.emptyList(), 0);
        
        // Analyze query intent
        QueryIntent intent = analyzeQueryIntent(query);
        queryIntents.put(query.toLowerCase(), intent);
        
        // Update query popularity
        queryPopularity.merge(query.toLowerCase(), 1, Integer::sum);
        
        // Get user's search profile for personalization
        SearchPersonalization personalization = getUserSearchPersonalization(userId);
        
        // Perform the search
        List<Product> allProducts = productRepository.findByIsAvailableTrue();
        List<ScoredProduct> scoredResults = new ArrayList<>();
        
        for (Product product : allProducts) {
            double score = calculateProductScore(product, query, intent, filters, personalization);
            if (score > 0) {
                scoredResults.add(new ScoredProduct(product, score));
            }
        }
        
        // Sort by relevance score
        List<Product> rankedResults = scoredResults.stream()
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .limit(MAX_SEARCH_RESULTS)
                .map(ScoredProduct::getProduct)
                .collect(Collectors.toList());
        
        // Generate intelligent filters
        Map<String, List<FilterOption>> intelligentFilters = generateIntelligentFilters(rankedResults, intent);
        
        // Generate search suggestions
        List<String> suggestions = generateSearchSuggestions(query, userId);
        
        // Update search analytics
        updateSearchAnalytics(userId, query, rankedResults.size(), intent);
        
        return new IntelligentSearchResult(
                query, rankedResults, intelligentFilters, suggestions, intent, 
                rankedResults.size(), LocalDateTime.now()
        );
    }
    
    public List<String> getAutocompleteSuggestions(String partialQuery, String userId, int limit) {
        List<String> suggestions = new ArrayList<>();
        
        // Get popular queries that match the partial query
        List<String> popularMatches = queryPopularity.entrySet().stream()
                .filter(entry -> entry.getKey().startsWith(partialQuery.toLowerCase()))
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(limit / 2)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        
        suggestions.addAll(popularMatches);
        
        // Add personalized suggestions based on user's search history
        SearchPersonalization personalization = getUserSearchPersonalization(userId);
        List<String> personalizedSuggestions = personalization.getSearchHistory().stream()
                .filter(query -> query.toLowerCase().contains(partialQuery.toLowerCase()))
                .distinct()
                .limit(limit / 2)
                .collect(Collectors.toList());
        
        suggestions.addAll(personalizedSuggestions);
        
        // Add semantic suggestions
        suggestions.addAll(generateSemanticSuggestions(partialQuery, limit - suggestions.size()));
        
        return suggestions.stream()
                .distinct()
                .limit(limit)
                .collect(Collectors.toList());
    }
    
    public Map<String, List<FilterOption>> getSmartFilters(String query, String userId) {
        QueryIntent intent = analyzeQueryIntent(query);
        List<Product> searchResults = performBasicSearch(query);
        
        return generateIntelligentFilters(searchResults, intent);
    }
    
    public List<Product> searchWithSemanticSimilarity(String query, int limit) {
        List<Product> allProducts = productRepository.findByIsAvailableTrue();
        
        return allProducts.stream()
                .map(product -> new ScoredProduct(product, calculateSemanticSimilarity(query, product)))
                .filter(scored -> scored.getScore() > SEMANTIC_SIMILARITY_THRESHOLD)
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .limit(limit)
                .map(ScoredProduct::getProduct)
                .collect(Collectors.toList());
    }
    
    public List<Product> searchByImage(String imageDescription, String userId) {
        // Simulate image-to-text conversion and search
        List<String> imageFeatures = extractImageFeatures(imageDescription);
        
        StringBuilder queryBuilder = new StringBuilder();
        for (String feature : imageFeatures) {
            queryBuilder.append(feature).append(" ");
        }
        
        String generatedQuery = queryBuilder.toString().trim();
        
        return intelligentSearch(userId, generatedQuery, null).getResults();
    }
    
    public List<Product> searchByOccasion(String occasion, String userId, double budget) {
        PersonalizedStyleProfile styleProfile = styleProfilingService.buildUserStyleProfile(userId);
        
        String occasionQuery = buildOccasionQuery(occasion, styleProfile);
        SearchFilters filters = new SearchFilters();
        filters.setMaxPrice(budget);
        
        IntelligentSearchResult result = intelligentSearch(userId, occasionQuery, filters);
        
        return result.getResults().stream()
                .filter(product -> product.getPrice() <= budget)
                .collect(Collectors.toList());
    }
    
    public List<Product> searchSimilarToLiked(String userId, int limit) {
        // Get user's liked/purchased products
        List<Product> likedProducts = getUserLikedProducts(userId);
        
        if (likedProducts.isEmpty()) {
            return Collections.emptyList();
        }
        
        List<Product> allProducts = productRepository.findByIsAvailableTrue();
        Map<String, Double> productScores = new HashMap<>();
        
        for (Product likedProduct : likedProducts) {
            for (Product candidate : allProducts) {
                if (!candidate.getId().equals(likedProduct.getId())) {
                    double similarity = mlProductMatchingService.findSimilarProducts(likedProduct.getId(), 1000)
                            .contains(candidate) ? 0.8 : 0.0;
                    
                    productScores.merge(candidate.getId(), similarity, Double::sum);
                }
            }
        }
        
        return productScores.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> getProductById(entry.getKey()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
    
    public SearchAnalytics analyzeSearchBehavior(String userId) {
        SearchPersonalization profile = getUserSearchPersonalization(userId);
        
        Map<String, Integer> categorySearches = new HashMap<>();
        Map<String, Integer> brandSearches = new HashMap<>();
        Map<String, Double> priceRangeSearches = new HashMap<>();
        
        for (String query : profile.getSearchHistory()) {
            QueryIntent intent = queryIntents.getOrDefault(query.toLowerCase(), new QueryIntent());
            
            if (intent.getCategory() != null) {
                categorySearches.merge(intent.getCategory(), 1, Integer::sum);
            }
            if (intent.getBrand() != null) {
                brandSearches.merge(intent.getBrand(), 1, Integer::sum);
            }
            if (intent.getPriceRange() != null) {
                priceRangeSearches.merge(intent.getPriceRange(), 1.0, Double::sum);
            }
        }
        
        return new SearchAnalytics(
                userId, profile.getSearchHistory().size(), categorySearches, 
                brandSearches, priceRangeSearches, profile.getAverageResultsClicked(),
                profile.getPreferredSortOrder()
        );
    }
    
    public List<String> getTrendingSearches(int limit) {
        return queryPopularity.entrySet().stream()
                .filter(entry -> entry.getValue() > 5) // Minimum threshold
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(limit)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }
    
    // Private helper methods
    private QueryIntent analyzeQueryIntent(String query) {
        String lowerQuery = query.toLowerCase().trim();
        QueryIntent intent = new QueryIntent();
        
        // Extract category intent
        intent.setCategory(extractCategory(lowerQuery));
        
        // Extract brand intent
        intent.setBrand(extractBrand(lowerQuery));
        
        // Extract color intent
        intent.setColor(extractColor(lowerQuery));
        
        // Extract size intent
        intent.setSize(extractSize(lowerQuery));
        
        // Extract price range intent
        intent.setPriceRange(extractPriceRange(lowerQuery));
        
        // Extract occasion intent
        intent.setOccasion(extractOccasion(lowerQuery));
        
        // Extract style intent
        intent.setStyle(extractStyle(lowerQuery));
        
        // Determine query type
        intent.setQueryType(determineQueryType(lowerQuery, intent));
        
        return intent;
    }
    
    private String extractCategory(String query) {
        Map<String, List<String>> categoryKeywords = new HashMap<>();
        categoryKeywords.put("tops", Arrays.asList("shirt", "blouse", "top", "t-shirt", "sweater"));
        categoryKeywords.put("bottoms", Arrays.asList("pants", "jeans", "shorts", "skirt", "trousers"));
        categoryKeywords.put("dresses", Arrays.asList("dress", "gown", "maxi", "midi"));
        categoryKeywords.put("shoes", Arrays.asList("shoes", "sneakers", "boots", "heels", "sandals"));
        categoryKeywords.put("accessories", Arrays.asList("bag", "purse", "jewelry", "watch", "belt"));
        categoryKeywords.put("outerwear", Arrays.asList("jacket", "coat", "blazer", "cardigan"));
        
        for (Map.Entry<String, List<String>> entry : categoryKeywords.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (query.contains(keyword)) {
                    return entry.getKey();
                }
            }
        }
        
        return null;
    }
    
    private String extractBrand(String query) {
        List<String> commonBrands = Arrays.asList(
                "nike", "adidas", "zara", "h&m", "gucci", "prada", "versace",
                "calvin klein", "tommy hilfiger", "polo", "gap", "old navy"
        );
        
        for (String brand : commonBrands) {
            if (query.contains(brand)) {
                return brand;
            }
        }
        
        return null;
    }
    
    private String extractColor(String query) {
        List<String> colors = Arrays.asList(
                "black", "white", "red", "blue", "green", "yellow", "pink",
                "purple", "orange", "brown", "grey", "gray", "navy"
        );
        
        for (String color : colors) {
            if (query.contains(color)) {
                return color;
            }
        }
        
        return null;
    }
    
    private String extractSize(String query) {
        Pattern sizePattern = Pattern.compile("\\b(xs|s|m|l|xl|xxl|\\d+)\\b");
        if (sizePattern.matcher(query).find()) {
            return sizePattern.matcher(query).group();
        }
        
        return null;
    }
    
    private String extractPriceRange(String query) {
        if (query.contains("cheap") || query.contains("budget") || query.contains("under")) {
            return "budget";
        } else if (query.contains("expensive") || query.contains("luxury") || query.contains("designer")) {
            return "luxury";
        } else if (query.contains("mid") || query.contains("moderate")) {
            return "mid-range";
        }
        
        return null;
    }
    
    private String extractOccasion(String query) {
        Map<String, List<String>> occasionKeywords = new HashMap<>();
        occasionKeywords.put("work", Arrays.asList("work", "office", "business", "professional"));
        occasionKeywords.put("casual", Arrays.asList("casual", "everyday", "weekend", "relaxed"));
        occasionKeywords.put("formal", Arrays.asList("formal", "evening", "cocktail", "black tie"));
        occasionKeywords.put("party", Arrays.asList("party", "club", "night out", "celebration"));
        occasionKeywords.put("wedding", Arrays.asList("wedding", "bridal", "guest", "ceremony"));
        
        for (Map.Entry<String, List<String>> entry : occasionKeywords.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (query.contains(keyword)) {
                    return entry.getKey();
                }
            }
        }
        
        return null;
    }
    
    private String extractStyle(String query) {
        List<String> styles = Arrays.asList(
                "vintage", "modern", "boho", "minimalist", "edgy", "romantic", "sporty", "classic"
        );
        
        for (String style : styles) {
            if (query.contains(style)) {
                return style;
            }
        }
        
        return null;
    }
    
    private QueryType determineQueryType(String query, QueryIntent intent) {
        if (intent.getBrand() != null) return QueryType.BRAND_SEARCH;
        if (intent.getCategory() != null) return QueryType.CATEGORY_SEARCH;
        if (intent.getOccasion() != null) return QueryType.OCCASION_SEARCH;
        if (intent.getStyle() != null) return QueryType.STYLE_SEARCH;
        if (query.contains("like") || query.contains("similar")) return QueryType.SIMILARITY_SEARCH;
        
        return QueryType.GENERAL_SEARCH;
    }
    
    private SearchPersonalization getUserSearchPersonalization(String userId) {
        return userSearchProfiles.computeIfAbsent(userId, id -> new SearchPersonalization(id));
    }
    
    private double calculateProductScore(Product product, String query, QueryIntent intent, 
                                       SearchFilters filters, SearchPersonalization personalization) {
        double score = 0.0;
        
        // Text relevance score
        double textRelevance = calculateTextRelevance(product, query);
        score += textRelevance * RELEVANCE_WEIGHT;
        
        // Intent matching score
        double intentScore = calculateIntentScore(product, intent);
        score += intentScore * RELEVANCE_WEIGHT;
        
        // Personalization score
        double personalScore = calculatePersonalizationScore(product, personalization);
        score += personalScore * PERSONALIZATION_WEIGHT;
        
        // Popularity score
        double popularityScore = calculatePopularityScore(product);
        score += popularityScore * POPULARITY_WEIGHT;
        
        // Freshness score
        double freshnessScore = calculateFreshnessScore(product);
        score += freshnessScore * FRESHNESS_WEIGHT;
        
        // Apply filters
        if (filters != null && !passesFilters(product, filters)) {
            score = 0.0;
        }
        
        return score;
    }
    
    private double calculateTextRelevance(Product product, String query) {
        String[] queryTerms = query.toLowerCase().split("\\s+");
        String productText = (product.getName() + " " + product.getDescription() + " " + 
                             product.getCategory() + " " + product.getBrand()).toLowerCase();
        
        double relevance = 0.0;
        for (String term : queryTerms) {
            if (productText.contains(term)) {
                relevance += 1.0 / queryTerms.length;
            }
        }
        
        return relevance;
    }
    
    private double calculateIntentScore(Product product, QueryIntent intent) {
        double score = 0.0;
        int totalIntents = 0;
        
        if (intent.getCategory() != null) {
            totalIntents++;
            if (product.getCategory() != null && 
                product.getCategory().toLowerCase().contains(intent.getCategory().toLowerCase())) {
                score += 1.0;
            }
        }
        
        if (intent.getBrand() != null) {
            totalIntents++;
            if (product.getBrand() != null && 
                product.getBrand().toLowerCase().equals(intent.getBrand().toLowerCase())) {
                score += 1.0;
            }
        }
        
        if (intent.getPriceRange() != null) {
            totalIntents++;
            if (matchesPriceRange(product.getPrice(), intent.getPriceRange())) {
                score += 1.0;
            }
        }
        
        return totalIntents > 0 ? score / totalIntents : 0.0;
    }
    
    private double calculatePersonalizationScore(Product product, SearchPersonalization personalization) {
        // Simple personalization based on search history
        double score = 0.0;
        
        if (product.getCategory() != null) {
            long categorySearches = personalization.getSearchHistory().stream()
                    .mapToLong(query -> query.toLowerCase().contains(product.getCategory().toLowerCase()) ? 1 : 0)
                    .sum();
            score += (double) categorySearches / Math.max(personalization.getSearchHistory().size(), 1);
        }
        
        return Math.min(score, 1.0);
    }
    
    private double calculatePopularityScore(Product product) {
        // Simulate popularity based on creation date (newer = more popular)
        if (product.getCreatedAt() == null) return 0.5;
        
        long daysSinceCreation = java.time.temporal.ChronoUnit.DAYS.between(
                product.getCreatedAt(), LocalDateTime.now());
        
        return Math.max(0.0, 1.0 - (daysSinceCreation / 365.0));
    }
    
    private double calculateFreshnessScore(Product product) {
        if (product.getCreatedAt() == null) return 0.5;
        
        long daysSinceCreation = java.time.temporal.ChronoUnit.DAYS.between(
                product.getCreatedAt(), LocalDateTime.now());
        
        return Math.max(0.0, 1.0 - (daysSinceCreation / 30.0));
    }
    
    private boolean passesFilters(Product product, SearchFilters filters) {
        if (filters.getMinPrice() != null && product.getPrice() < filters.getMinPrice()) return false;
        if (filters.getMaxPrice() != null && product.getPrice() > filters.getMaxPrice()) return false;
        if (filters.getCategory() != null && !product.getCategory().toLowerCase().contains(filters.getCategory().toLowerCase())) return false;
        if (filters.getBrand() != null && !product.getBrand().toLowerCase().contains(filters.getBrand().toLowerCase())) return false;
        if (filters.getSize() != null && !filters.getSize().equals(product.getSize())) return false;
        if (filters.getCondition() != null && !filters.getCondition().equals(product.getCondition())) return false;
        
        return true;
    }
    
    private Map<String, List<FilterOption>> generateIntelligentFilters(List<Product> results, QueryIntent intent) {
        Map<String, List<FilterOption>> filters = new HashMap<>();
        
        // Category filters
        Map<String, Long> categoryCount = results.stream()
                .filter(p -> p.getCategory() != null)
                .collect(Collectors.groupingBy(Product::getCategory, Collectors.counting()));
        
        filters.put("categories", categoryCount.entrySet().stream()
                .map(entry -> new FilterOption(entry.getKey(), entry.getKey(), entry.getValue()))
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .limit(10)
                .collect(Collectors.toList()));
        
        // Brand filters
        Map<String, Long> brandCount = results.stream()
                .filter(p -> p.getBrand() != null)
                .collect(Collectors.groupingBy(Product::getBrand, Collectors.counting()));
        
        filters.put("brands", brandCount.entrySet().stream()
                .map(entry -> new FilterOption(entry.getKey(), entry.getKey(), entry.getValue()))
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .limit(10)
                .collect(Collectors.toList()));
        
        // Price range filters
        List<FilterOption> priceRanges = Arrays.asList(
                new FilterOption("under-50", "Under $50", 
                        results.stream().filter(p -> p.getPrice() < 50).count()),
                new FilterOption("50-150", "$50 - $150", 
                        results.stream().filter(p -> p.getPrice() >= 50 && p.getPrice() < 150).count()),
                new FilterOption("150-300", "$150 - $300", 
                        results.stream().filter(p -> p.getPrice() >= 150 && p.getPrice() < 300).count()),
                new FilterOption("over-300", "Over $300", 
                        results.stream().filter(p -> p.getPrice() >= 300).count())
        );
        
        filters.put("priceRanges", priceRanges.stream()
                .filter(option -> option.getCount() > 0)
                .collect(Collectors.toList()));
        
        return filters;
    }
    
    private List<String> generateSearchSuggestions(String query, String userId) {
        List<String> suggestions = new ArrayList<>();
        
        // Add related category suggestions
        QueryIntent intent = analyzeQueryIntent(query);
        if (intent.getCategory() != null) {
            suggestions.add(intent.getCategory() + " for women");
            suggestions.add(intent.getCategory() + " for men");
            suggestions.add("vintage " + intent.getCategory());
        }
        
        // Add personalized suggestions
        SearchPersonalization profile = getUserSearchPersonalization(userId);
        PersonalizedStyleProfile styleProfile = styleProfilingService.buildUserStyleProfile(userId);
        
        for (String category : styleProfile.getCategoryPreferences().keySet()) {
            suggestions.add(query + " " + category);
        }
        
        return suggestions.stream()
                .distinct()
                .limit(SUGGESTION_LIMIT)
                .collect(Collectors.toList());
    }
    
    private List<Product> performBasicSearch(String query) {
        return productRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query);
    }
    
    private double calculateSemanticSimilarity(String query, Product product) {
        // Simplified semantic similarity calculation
        String productText = product.getName() + " " + product.getDescription();
        String[] queryWords = query.toLowerCase().split("\\s+");
        String[] productWords = productText.toLowerCase().split("\\s+");
        
        Set<String> querySet = new HashSet<>(Arrays.asList(queryWords));
        Set<String> productSet = new HashSet<>(Arrays.asList(productWords));
        
        Set<String> intersection = new HashSet<>(querySet);
        intersection.retainAll(productSet);
        
        Set<String> union = new HashSet<>(querySet);
        union.addAll(productSet);
        
        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }
    
    private List<String> extractImageFeatures(String imageDescription) {
        // Simulate image feature extraction
        return Arrays.asList(imageDescription.split("\\s+"));
    }
    
    private String buildOccasionQuery(String occasion, PersonalizedStyleProfile profile) {
        StringBuilder query = new StringBuilder(occasion);
        
        // Add user's preferred categories
        String topCategory = profile.getCategoryPreferences().entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("");
        
        if (!topCategory.isEmpty()) {
            query.append(" ").append(topCategory);
        }
        
        return query.toString();
    }
    
    private List<Product> getUserLikedProducts(String userId) {
        return behaviorAnalyticsService.getUserInteractions(userId, 100).stream()
                .filter(interaction -> interaction.getType() == InteractionType.PURCHASE ||
                                     interaction.getType() == InteractionType.ADD_TO_CART)
                .map(interaction -> getProductById(interaction.getItemId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
    
    private Product getProductById(String productId) {
        try {
            return productRepository.findById(productId).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
    
    private void updateSearchAnalytics(String userId, String query, int resultCount, QueryIntent intent) {
        SearchPersonalization profile = getUserSearchPersonalization(userId);
        profile.addSearch(query, resultCount);
        
        // Update global analytics
        behaviorAnalyticsService.trackSearch(userId, query, Collections.emptyList(), resultCount);
    }
    
    private boolean matchesPriceRange(double price, String priceRange) {
        switch (priceRange.toLowerCase()) {
            case "budget": return price < 50;
            case "mid-range": return price >= 50 && price < 200;
            case "premium": return price >= 200 && price < 500;
            case "luxury": return price >= 500;
            default: return true;
        }
    }
    
    private List<String> generateSemanticSuggestions(String partialQuery, int limit) {
        List<String> suggestions = new ArrayList<>();
        
        // Add common completions based on partial query
        if (partialQuery.toLowerCase().startsWith("dre")) {
            suggestions.add("dress");
            suggestions.add("dresses");
        } else if (partialQuery.toLowerCase().startsWith("sho")) {
            suggestions.add("shoes");
            suggestions.add("shorts");
        } else if (partialQuery.toLowerCase().startsWith("jea")) {
            suggestions.add("jeans");
        }
        
        return suggestions.stream().limit(limit).collect(Collectors.toList());
    }
    
    // Enums and Data Classes
    public enum QueryType {
        GENERAL_SEARCH, CATEGORY_SEARCH, BRAND_SEARCH, OCCASION_SEARCH, 
        STYLE_SEARCH, SIMILARITY_SEARCH, VISUAL_SEARCH
    }
    
    public static class QueryIntent {
        private String category;
        private String brand;
        private String color;
        private String size;
        private String priceRange;
        private String occasion;
        private String style;
        private QueryType queryType;
        
        // Getters and setters
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getBrand() { return brand; }
        public void setBrand(String brand) { this.brand = brand; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
        public String getSize() { return size; }
        public void setSize(String size) { this.size = size; }
        public String getPriceRange() { return priceRange; }
        public void setPriceRange(String priceRange) { this.priceRange = priceRange; }
        public String getOccasion() { return occasion; }
        public void setOccasion(String occasion) { this.occasion = occasion; }
        public String getStyle() { return style; }
        public void setStyle(String style) { this.style = style; }
        public QueryType getQueryType() { return queryType; }
        public void setQueryType(QueryType queryType) { this.queryType = queryType; }
    }
    
    public static class SearchFilters {
        private Double minPrice;
        private Double maxPrice;
        private String category;
        private String brand;
        private String size;
        private String condition;
        private String color;
        
        public List<String> toFilterList() {
            List<String> filters = new ArrayList<>();
            if (category != null) filters.add("category:" + category);
            if (brand != null) filters.add("brand:" + brand);
            if (minPrice != null) filters.add("minPrice:" + minPrice);
            if (maxPrice != null) filters.add("maxPrice:" + maxPrice);
            return filters;
        }
        
        // Getters and setters
        public Double getMinPrice() { return minPrice; }
        public void setMinPrice(Double minPrice) { this.minPrice = minPrice; }
        public Double getMaxPrice() { return maxPrice; }
        public void setMaxPrice(Double maxPrice) { this.maxPrice = maxPrice; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getBrand() { return brand; }
        public void setBrand(String brand) { this.brand = brand; }
        public String getSize() { return size; }
        public void setSize(String size) { this.size = size; }
        public String getCondition() { return condition; }
        public void setCondition(String condition) { this.condition = condition; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }
    
    public static class IntelligentSearchResult {
        private String query;
        private List<Product> results;
        private Map<String, List<FilterOption>> intelligentFilters;
        private List<String> suggestions;
        private QueryIntent intent;
        private int totalResults;
        private LocalDateTime searchTime;
        
        public IntelligentSearchResult(String query, List<Product> results, 
                                     Map<String, List<FilterOption>> filters,
                                     List<String> suggestions, QueryIntent intent, 
                                     int totalResults, LocalDateTime searchTime) {
            this.query = query;
            this.results = results;
            this.intelligentFilters = filters;
            this.suggestions = suggestions;
            this.intent = intent;
            this.totalResults = totalResults;
            this.searchTime = searchTime;
        }
        
        // Getters
        public String getQuery() { return query; }
        public List<Product> getResults() { return results; }
        public Map<String, List<FilterOption>> getIntelligentFilters() { return intelligentFilters; }
        public List<String> getSuggestions() { return suggestions; }
        public QueryIntent getIntent() { return intent; }
        public int getTotalResults() { return totalResults; }
        public LocalDateTime getSearchTime() { return searchTime; }
    }
    
    public static class FilterOption {
        private String value;
        private String display;
        private long count;
        
        public FilterOption(String value, String display, long count) {
            this.value = value;
            this.display = display;
            this.count = count;
        }
        
        public String getValue() { return value; }
        public String getDisplay() { return display; }
        public long getCount() { return count; }
    }
    
    public static class SearchPersonalization {
        private String userId;
        private List<String> searchHistory;
        private Map<String, Integer> categorySearchCount;
        private double averageResultsClicked;
        private String preferredSortOrder;
        
        public SearchPersonalization(String userId) {
            this.userId = userId;
            this.searchHistory = new ArrayList<>();
            this.categorySearchCount = new HashMap<>();
            this.averageResultsClicked = 0.0;
            this.preferredSortOrder = "relevance";
        }
        
        public void addSearch(String query, int resultCount) {
            searchHistory.add(query);
            if (searchHistory.size() > 100) { // Keep only recent searches
                searchHistory.remove(0);
            }
        }
        
        // Getters
        public String getUserId() { return userId; }
        public List<String> getSearchHistory() { return searchHistory; }
        public Map<String, Integer> getCategorySearchCount() { return categorySearchCount; }
        public double getAverageResultsClicked() { return averageResultsClicked; }
        public String getPreferredSortOrder() { return preferredSortOrder; }
    }
    
    public static class ScoredProduct {
        private Product product;
        private double score;
        
        public ScoredProduct(Product product, double score) {
            this.product = product;
            this.score = score;
        }
        
        public Product getProduct() { return product; }
        public double getScore() { return score; }
    }
    
    public static class SearchAnalytics {
        private String userId;
        private int totalSearches;
        private Map<String, Integer> categorySearches;
        private Map<String, Integer> brandSearches;
        private Map<String, Double> priceRangeSearches;
        private double averageResultsClicked;
        private String preferredSortOrder;
        
        public SearchAnalytics(String userId, int totalSearches, Map<String, Integer> categorySearches,
                              Map<String, Integer> brandSearches, Map<String, Double> priceRangeSearches,
                              double averageResultsClicked, String preferredSortOrder) {
            this.userId = userId;
            this.totalSearches = totalSearches;
            this.categorySearches = categorySearches;
            this.brandSearches = brandSearches;
            this.priceRangeSearches = priceRangeSearches;
            this.averageResultsClicked = averageResultsClicked;
            this.preferredSortOrder = preferredSortOrder;
        }
        
        // Getters
        public String getUserId() { return userId; }
        public int getTotalSearches() { return totalSearches; }
        public Map<String, Integer> getCategorySearches() { return categorySearches; }
        public Map<String, Integer> getBrandSearches() { return brandSearches; }
        public Map<String, Double> getPriceRangeSearches() { return priceRangeSearches; }
        public double getAverageResultsClicked() { return averageResultsClicked; }
        public String getPreferredSortOrder() { return preferredSortOrder; }
    }
}
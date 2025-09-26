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

    @Autowired
    private ClaudeService claudeService;
    
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

    /**
     * Enhanced search with Claude AI analysis and product scoring
     */
    public ClaudeEnhancedSearchResult searchWithClaudeAI(String userId, String userQuery) {
        try {
            // Get all available products
            List<Product> allProducts = productRepository.findByIsAvailableTrue();

            // Use Claude API to analyze user intent and preferences
            ClaudeUserIntent intent = analyzeUserIntentWithClaude(userQuery, allProducts);

            // Score and rank products based on AI analysis
            List<ClaudeScoredProduct> scoredProducts = scoreProductsWithClaudeAI(allProducts, intent, userQuery);

            // Get top recommendations
            List<ClaudeScoredProduct> topRecommendations = scoredProducts.stream()
                .limit(10)
                .collect(Collectors.toList());

            // Generate Claude insights and recommendations
            String claudeAnalysis = generateClaudeInsights(userQuery, topRecommendations, intent);

            // Create visualization data
            RecommendationGraphs graphs = generateRecommendationGraphs(topRecommendations, intent);

            // Track search analytics
            behaviorAnalyticsService.trackSearch(userId, userQuery, Collections.emptyList(), topRecommendations.size());

            return new ClaudeEnhancedSearchResult(
                userQuery,
                topRecommendations,
                claudeAnalysis,
                intent,
                graphs,
                allProducts.size(),
                LocalDateTime.now()
            );

        } catch (Exception e) {
            System.err.println("Claude enhanced search error: " + e.getMessage());
            return fallbackClaudeSearch(userQuery, userId);
        }
    }

    /**
     * Analyze user intent using Claude API
     */
    private ClaudeUserIntent analyzeUserIntentWithClaude(String query, List<Product> products) {
        String prompt = buildIntentAnalysisPrompt(query, products);
        String claudeResponse = claudeService.generateConversationalResponse(prompt, "intent_analysis");

        return parseClaudeUserIntent(claudeResponse, query, products);
    }

    /**
     * Score products using Claude AI analysis
     */
    private List<ClaudeScoredProduct> scoreProductsWithClaudeAI(List<Product> products, ClaudeUserIntent intent, String query) {
        return products.stream()
            .map(product -> calculateClaudeAIScore(product, intent, query))
            .sorted((a, b) -> Double.compare(b.getAiScore(), a.getAiScore()))
            .collect(Collectors.toList());
    }

    /**
     * Calculate Claude AI score for a product based on user intent
     */
    private ClaudeScoredProduct calculateClaudeAIScore(Product product, ClaudeUserIntent intent, String query) {
        double score = 0.0;
        Map<String, Double> scoreBreakdown = new HashMap<>();

        // Price matching score (25%)
        double priceScore = calculateClaudePriceScore(product, intent.getBudgetRange());
        score += priceScore * 0.25;
        scoreBreakdown.put("price_match", priceScore);

        // Category relevance score (20%)
        double categoryScore = calculateClaudeCategoryScore(product, intent.getPreferredCategories());
        score += categoryScore * 0.20;
        scoreBreakdown.put("category_relevance", categoryScore);

        // Brand preference score (15%)
        double brandScore = calculateClaudeBrandScore(product, intent.getPreferredBrands());
        score += brandScore * 0.15;
        scoreBreakdown.put("brand_preference", brandScore);

        // Condition preference score (15%)
        double conditionScore = calculateClaudeConditionScore(product, intent.getPreferredConditions());
        score += conditionScore * 0.15;
        scoreBreakdown.put("condition_match", conditionScore);

        // Value proposition score (15%)
        double valueScore = calculateClaudeValueScore(product);
        score += valueScore * 0.15;
        scoreBreakdown.put("value_proposition", valueScore);

        // Keyword relevance score (10%)
        double keywordScore = calculateClaudeKeywordScore(product, intent.getKeywords());
        score += keywordScore * 0.10;
        scoreBreakdown.put("keyword_relevance", keywordScore);

        return new ClaudeScoredProduct(product, score, scoreBreakdown);
    }

    /**
     * Generate Claude insights for the search results
     */
    private String generateClaudeInsights(String query, List<ClaudeScoredProduct> products, ClaudeUserIntent intent) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Analyze these ThriftAI search results for the query: '").append(query).append("'\n\n");
        prompt.append("User Intent Analysis:\n");
        prompt.append("- Budget: $").append(intent.getBudgetRange().getMin())
              .append(" - $").append(intent.getBudgetRange().getMax()).append("\n");
        prompt.append("- Preferred Categories: ").append(String.join(", ", intent.getPreferredCategories())).append("\n");
        prompt.append("- Keywords: ").append(String.join(", ", intent.getKeywords())).append("\n\n");

        prompt.append("Top AI-Recommended Products:\n");
        for (int i = 0; i < Math.min(5, products.size()); i++) {
            ClaudeScoredProduct sp = products.get(i);
            Product p = sp.getProduct();
            prompt.append(String.format("%d. **%s** by %s - $%.2f (AI Score: %.1f%%)\n",
                i + 1, p.getName(), p.getBrand(), p.getPrice(), sp.getAiScore()));
            if (p.getOriginalPrice() > 0) {
                double savings = ((p.getOriginalPrice() - p.getPrice()) / p.getOriginalPrice()) * 100;
                prompt.append(String.format("   💰 Savings: %.0f%% off retail ($%.2f)\n", savings, p.getOriginalPrice()));
            }
            prompt.append("   ✨ Condition: ").append(p.getCondition()).append("\n");
            prompt.append("   📊 Score Breakdown: Price(").append(String.format("%.0f", sp.getScoreBreakdown().get("price_match")))
                  .append("%), Category(").append(String.format("%.0f", sp.getScoreBreakdown().get("category_relevance")))
                  .append("%), Value(").append(String.format("%.0f", sp.getScoreBreakdown().get("value_proposition"))).append("%)\n\n");
        }

        prompt.append("Provide comprehensive shopping insights including:\n");
        prompt.append("1. Why these products are perfect matches for the user's needs\n");
        prompt.append("2. Best value recommendations with savings analysis\n");
        prompt.append("3. Sustainability and environmental impact\n");
        prompt.append("4. Smart shopping tips and alternative suggestions\n");
        prompt.append("5. Market trends and price predictions\n");
        prompt.append("Use emojis, be enthusiastic about thrift shopping, and keep response engaging but informative (max 400 words).");

        return claudeService.generateThriftResponse(prompt.toString(),
            products.stream().map(ClaudeScoredProduct::getProduct).collect(Collectors.toList()),
            "ai_product_analysis");
    }

    /**
     * Generate recommendation graphs and visualizations
     */
    private RecommendationGraphs generateRecommendationGraphs(List<ClaudeScoredProduct> products, ClaudeUserIntent intent) {
        // Price distribution data
        Map<String, Integer> priceDistribution = new LinkedHashMap<>();
        priceDistribution.put("Under $25", 0);
        priceDistribution.put("$25-$50", 0);
        priceDistribution.put("$50-$100", 0);
        priceDistribution.put("$100-$200", 0);
        priceDistribution.put("Over $200", 0);

        // Category distribution
        Map<String, Integer> categoryDistribution = new HashMap<>();

        // Score distribution with ranges
        Map<String, Integer> scoreDistribution = new LinkedHashMap<>();
        scoreDistribution.put("90-100%", 0);
        scoreDistribution.put("80-89%", 0);
        scoreDistribution.put("70-79%", 0);
        scoreDistribution.put("60-69%", 0);
        scoreDistribution.put("Below 60%", 0);

        // Savings distribution
        Map<String, Integer> savingsDistribution = new LinkedHashMap<>();
        savingsDistribution.put("70%+ off", 0);
        savingsDistribution.put("50-69% off", 0);
        savingsDistribution.put("30-49% off", 0);
        savingsDistribution.put("10-29% off", 0);
        savingsDistribution.put("Under 10% off", 0);

        for (ClaudeScoredProduct sp : products) {
            Product p = sp.getProduct();

            // Price distribution
            if (p.getPrice() < 25) priceDistribution.put("Under $25", priceDistribution.get("Under $25") + 1);
            else if (p.getPrice() < 50) priceDistribution.put("$25-$50", priceDistribution.get("$25-$50") + 1);
            else if (p.getPrice() < 100) priceDistribution.put("$50-$100", priceDistribution.get("$50-$100") + 1);
            else if (p.getPrice() < 200) priceDistribution.put("$100-$200", priceDistribution.get("$100-$200") + 1);
            else priceDistribution.put("Over $200", priceDistribution.get("Over $200") + 1);

            // Category distribution
            categoryDistribution.put(p.getCategory(), categoryDistribution.getOrDefault(p.getCategory(), 0) + 1);

            // Score distribution
            double score = sp.getAiScore();
            if (score >= 90) scoreDistribution.put("90-100%", scoreDistribution.get("90-100%") + 1);
            else if (score >= 80) scoreDistribution.put("80-89%", scoreDistribution.get("80-89%") + 1);
            else if (score >= 70) scoreDistribution.put("70-79%", scoreDistribution.get("70-79%") + 1);
            else if (score >= 60) scoreDistribution.put("60-69%", scoreDistribution.get("60-69%") + 1);
            else scoreDistribution.put("Below 60%", scoreDistribution.get("Below 60%") + 1);

            // Savings distribution
            if (p.getOriginalPrice() > 0) {
                double savings = ((p.getOriginalPrice() - p.getPrice()) / p.getOriginalPrice()) * 100;
                if (savings >= 70) savingsDistribution.put("70%+ off", savingsDistribution.get("70%+ off") + 1);
                else if (savings >= 50) savingsDistribution.put("50-69% off", savingsDistribution.get("50-69% off") + 1);
                else if (savings >= 30) savingsDistribution.put("30-49% off", savingsDistribution.get("30-49% off") + 1);
                else if (savings >= 10) savingsDistribution.put("10-29% off", savingsDistribution.get("10-29% off") + 1);
                else savingsDistribution.put("Under 10% off", savingsDistribution.get("Under 10% off") + 1);
            }
        }

        return new RecommendationGraphs(priceDistribution, categoryDistribution, scoreDistribution, savingsDistribution);
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

    // Claude AI Enhanced Search Helper Methods

    private String buildIntentAnalysisPrompt(String query, List<Product> products) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Analyze this ThriftAI shopping query and extract detailed user intent: '").append(query).append("'\n\n");

        prompt.append("Available Context:\n");
        prompt.append("- Product Categories: ").append(products.stream().map(Product::getCategory).distinct().collect(Collectors.joining(", "))).append("\n");
        prompt.append("- Available Brands: ").append(products.stream().map(Product::getBrand).distinct().limit(20).collect(Collectors.joining(", "))).append("\n");
        prompt.append("- Price Range: $").append(String.format("%.2f", products.stream().mapToDouble(Product::getPrice).min().orElse(0)))
              .append(" - $").append(String.format("%.2f", products.stream().mapToDouble(Product::getPrice).max().orElse(1000))).append("\n\n");

        prompt.append("Extract and return in this EXACT format:\n");
        prompt.append("BUDGET: min_price-max_price\n");
        prompt.append("CATEGORIES: category1,category2,category3\n");
        prompt.append("BRANDS: brand1,brand2,brand3\n");
        prompt.append("KEYWORDS: keyword1,keyword2,keyword3\n");
        prompt.append("CONDITIONS: condition1,condition2,condition3\n");
        prompt.append("STYLE: style_preference\n");
        prompt.append("OCCASION: occasion_type\n");

        return prompt.toString();
    }

    private ClaudeUserIntent parseClaudeUserIntent(String claudeResponse, String originalQuery, List<Product> products) {
        // Default values
        ClaudeBudgetRange budget = new ClaudeBudgetRange(0, 1000);
        List<String> categories = new ArrayList<>();
        List<String> brands = new ArrayList<>();
        List<String> keywords = Arrays.asList(originalQuery.toLowerCase().split("\\s+"));
        List<String> conditions = Arrays.asList("EXCELLENT", "LIKE_NEW", "VERY_GOOD", "GOOD");
        String style = null;
        String occasion = null;

        try {
            // Parse Claude response
            String[] lines = claudeResponse.split("\n");
            for (String line : lines) {
                if (line.startsWith("BUDGET:")) {
                    String budgetStr = line.substring(7).trim();
                    String[] range = budgetStr.split("-");
                    if (range.length == 2) {
                        budget = new ClaudeBudgetRange(
                            Double.parseDouble(range[0]),
                            Double.parseDouble(range[1])
                        );
                    }
                } else if (line.startsWith("CATEGORIES:")) {
                    String categoriesStr = line.substring(11).trim();
                    if (!categoriesStr.isEmpty()) {
                        categories = Arrays.asList(categoriesStr.split(","));
                    }
                } else if (line.startsWith("BRANDS:")) {
                    String brandsStr = line.substring(7).trim();
                    if (!brandsStr.isEmpty()) {
                        brands = Arrays.asList(brandsStr.split(","));
                    }
                } else if (line.startsWith("KEYWORDS:")) {
                    String keywordsStr = line.substring(9).trim();
                    if (!keywordsStr.isEmpty()) {
                        keywords = Arrays.asList(keywordsStr.split(","));
                    }
                } else if (line.startsWith("CONDITIONS:")) {
                    String conditionsStr = line.substring(11).trim();
                    if (!conditionsStr.isEmpty()) {
                        conditions = Arrays.asList(conditionsStr.split(","));
                    }
                } else if (line.startsWith("STYLE:")) {
                    style = line.substring(6).trim();
                } else if (line.startsWith("OCCASION:")) {
                    occasion = line.substring(9).trim();
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing Claude intent response: " + e.getMessage());
        }

        return new ClaudeUserIntent(budget, categories, brands, keywords, conditions, style, occasion);
    }

    // Claude AI Scoring Methods

    private double calculateClaudePriceScore(Product product, ClaudeBudgetRange budget) {
        if (budget.getMin() <= product.getPrice() && product.getPrice() <= budget.getMax()) {
            // Perfect fit - calculate how close to ideal price
            double midpoint = (budget.getMin() + budget.getMax()) / 2;
            double distance = Math.abs(product.getPrice() - midpoint);
            double range = budget.getMax() - budget.getMin();
            return Math.max(50, 100 - (distance / range * 50)); // 50-100 score for in-range
        } else if (product.getPrice() < budget.getMin()) {
            // Below budget - excellent value
            return 95;
        } else {
            // Over budget - penalize based on how much over
            double excess = product.getPrice() - budget.getMax();
            return Math.max(0, 50 - (excess / budget.getMax() * 50));
        }
    }

    private double calculateClaudeCategoryScore(Product product, List<String> preferredCategories) {
        if (preferredCategories.isEmpty()) return 50; // neutral

        for (String category : preferredCategories) {
            if (product.getCategory().toUpperCase().contains(category.toUpperCase().trim())) {
                return 100;
            }
        }
        return 25; // penalty for non-matching category
    }

    private double calculateClaudeBrandScore(Product product, List<String> preferredBrands) {
        if (preferredBrands.isEmpty()) return 50; // neutral

        for (String brand : preferredBrands) {
            if (product.getBrand() != null &&
                product.getBrand().toUpperCase().contains(brand.toUpperCase().trim())) {
                return 100;
            }
        }
        return 40; // slight penalty for non-preferred brand
    }

    private double calculateClaudeConditionScore(Product product, List<String> preferredConditions) {
        if (preferredConditions.isEmpty()) return 50; // neutral

        Map<String, Integer> conditionRanking = Map.of(
            "EXCELLENT", 5,
            "LIKE_NEW", 4,
            "VERY_GOOD", 3,
            "GOOD", 2,
            "FAIR", 1
        );

        String productCondition = product.getCondition();
        for (String preferred : preferredConditions) {
            if (productCondition.equalsIgnoreCase(preferred.trim())) {
                return 100;
            }
        }

        // Score based on condition quality
        return conditionRanking.getOrDefault(productCondition, 1) * 20;
    }

    private double calculateClaudeValueScore(Product product) {
        if (product.getOriginalPrice() <= 0) return 50; // no original price data

        double discountPercent = ((product.getOriginalPrice() - product.getPrice()) / product.getOriginalPrice()) * 100;

        if (discountPercent >= 70) return 100; // Amazing deal
        if (discountPercent >= 60) return 90;  // Excellent deal
        if (discountPercent >= 50) return 80;  // Great deal
        if (discountPercent >= 40) return 70;  // Very good deal
        if (discountPercent >= 30) return 60;  // Good deal
        if (discountPercent >= 20) return 50;  // Fair deal
        if (discountPercent >= 10) return 40;  // Below average
        return 25; // Poor value
    }

    private double calculateClaudeKeywordScore(Product product, List<String> keywords) {
        if (keywords.isEmpty()) return 50;

        String searchText = (product.getName() + " " + product.getDescription() + " " +
                           product.getBrand() + " " + product.getCategory()).toLowerCase();

        long exactMatches = keywords.stream()
            .mapToLong(keyword -> {
                String kw = keyword.toLowerCase().trim();
                return searchText.contains(kw) ? 1 : 0;
            })
            .sum();

        double exactMatchScore = (double) exactMatches / keywords.size() * 100;

        // Bonus for partial matches
        long partialMatches = keywords.stream()
            .mapToLong(keyword -> {
                String kw = keyword.toLowerCase().trim();
                return searchText.contains(kw.substring(0, Math.min(3, kw.length()))) ? 1 : 0;
            })
            .sum();

        double partialMatchScore = (double) partialMatches / keywords.size() * 30;

        return Math.min(100, exactMatchScore + partialMatchScore);
    }

    private ClaudeEnhancedSearchResult fallbackClaudeSearch(String query, String userId) {
        List<Product> products = productRepository.findByIsAvailableTrue();
        List<ClaudeScoredProduct> scoredProducts = products.stream()
            .limit(10)
            .map(p -> new ClaudeScoredProduct(p, 50.0, Map.of(
                "price_match", 50.0,
                "category_relevance", 50.0,
                "brand_preference", 50.0,
                "condition_match", 50.0,
                "value_proposition", 50.0,
                "keyword_relevance", 50.0
            )))
            .collect(Collectors.toList());

        return new ClaudeEnhancedSearchResult(
            query,
            scoredProducts,
            "Search completed with basic matching. For better AI recommendations, please try a more specific query.",
            new ClaudeUserIntent(
                new ClaudeBudgetRange(0, 1000),
                new ArrayList<>(),
                new ArrayList<>(),
                Arrays.asList(query.split("\\s+")),
                new ArrayList<>(),
                null,
                null
            ),
            new RecommendationGraphs(new HashMap<>(), new HashMap<>(), new HashMap<>(), new HashMap<>()),
            products.size(),
            LocalDateTime.now()
        );
    }

    // Claude AI Enhanced Data Classes

    public static class ClaudeEnhancedSearchResult {
        private final String query;
        private final List<ClaudeScoredProduct> products;
        private final String claudeAnalysis;
        private final ClaudeUserIntent userIntent;
        private final RecommendationGraphs graphs;
        private final int totalProductsAnalyzed;
        private final LocalDateTime searchTime;

        public ClaudeEnhancedSearchResult(String query, List<ClaudeScoredProduct> products,
                                        String claudeAnalysis, ClaudeUserIntent userIntent,
                                        RecommendationGraphs graphs, int totalProductsAnalyzed,
                                        LocalDateTime searchTime) {
            this.query = query;
            this.products = products;
            this.claudeAnalysis = claudeAnalysis;
            this.userIntent = userIntent;
            this.graphs = graphs;
            this.totalProductsAnalyzed = totalProductsAnalyzed;
            this.searchTime = searchTime;
        }

        // Getters
        public String getQuery() { return query; }
        public List<ClaudeScoredProduct> getProducts() { return products; }
        public String getClaudeAnalysis() { return claudeAnalysis; }
        public ClaudeUserIntent getUserIntent() { return userIntent; }
        public RecommendationGraphs getGraphs() { return graphs; }
        public int getTotalProductsAnalyzed() { return totalProductsAnalyzed; }
        public LocalDateTime getSearchTime() { return searchTime; }
    }

    public static class ClaudeScoredProduct {
        private final Product product;
        private final double aiScore;
        private final Map<String, Double> scoreBreakdown;

        public ClaudeScoredProduct(Product product, double aiScore, Map<String, Double> scoreBreakdown) {
            this.product = product;
            this.aiScore = Math.round(aiScore * 10.0) / 10.0; // Round to 1 decimal
            this.scoreBreakdown = scoreBreakdown;
        }

        public Product getProduct() { return product; }
        public double getAiScore() { return aiScore; }
        public Map<String, Double> getScoreBreakdown() { return scoreBreakdown; }
    }

    public static class ClaudeUserIntent {
        private final ClaudeBudgetRange budgetRange;
        private final List<String> preferredCategories;
        private final List<String> preferredBrands;
        private final List<String> keywords;
        private final List<String> preferredConditions;
        private final String style;
        private final String occasion;

        public ClaudeUserIntent(ClaudeBudgetRange budgetRange, List<String> preferredCategories,
                              List<String> preferredBrands, List<String> keywords,
                              List<String> preferredConditions, String style, String occasion) {
            this.budgetRange = budgetRange;
            this.preferredCategories = preferredCategories;
            this.preferredBrands = preferredBrands;
            this.keywords = keywords;
            this.preferredConditions = preferredConditions;
            this.style = style;
            this.occasion = occasion;
        }

        public ClaudeBudgetRange getBudgetRange() { return budgetRange; }
        public List<String> getPreferredCategories() { return preferredCategories; }
        public List<String> getPreferredBrands() { return preferredBrands; }
        public List<String> getKeywords() { return keywords; }
        public List<String> getPreferredConditions() { return preferredConditions; }
        public String getStyle() { return style; }
        public String getOccasion() { return occasion; }
    }

    public static class ClaudeBudgetRange {
        private final double min;
        private final double max;

        public ClaudeBudgetRange(double min, double max) {
            this.min = Math.max(0, min);
            this.max = Math.max(min, max);
        }

        public double getMin() { return min; }
        public double getMax() { return max; }
    }

    public static class RecommendationGraphs {
        private final Map<String, Integer> priceDistribution;
        private final Map<String, Integer> categoryDistribution;
        private final Map<String, Integer> scoreDistribution;
        private final Map<String, Integer> savingsDistribution;

        public RecommendationGraphs(Map<String, Integer> priceDistribution,
                                  Map<String, Integer> categoryDistribution,
                                  Map<String, Integer> scoreDistribution,
                                  Map<String, Integer> savingsDistribution) {
            this.priceDistribution = priceDistribution;
            this.categoryDistribution = categoryDistribution;
            this.scoreDistribution = scoreDistribution;
            this.savingsDistribution = savingsDistribution;
        }

        public Map<String, Integer> getPriceDistribution() { return priceDistribution; }
        public Map<String, Integer> getCategoryDistribution() { return categoryDistribution; }
        public Map<String, Integer> getScoreDistribution() { return scoreDistribution; }
        public Map<String, Integer> getSavingsDistribution() { return savingsDistribution; }
    }
}
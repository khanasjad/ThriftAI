package com.projectai.controller;

import com.projectai.models.Product;
import com.projectai.service.*;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mobile/v1")
@CrossOrigin(origins = "*")
public class MobileApiController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RecommendationEngineService recommendationService;

    @Autowired
    private IntelligentSearchService searchService;

    @Autowired
    private UserBehaviorAnalyticsService analyticsService;

    @Autowired
    private SellerPerformanceAnalyticsService sellerAnalyticsService;

    @Autowired
    private AdvancedSecurityAndFraudDetectionService securityService;

    @Autowired
    private CachingAndPerformanceService cachingService;

    // DTO Classes for Mobile Responses
    public static class MobileProductSummary {
        private String id;
        private String name;
        private BigDecimal price;
        private String category;
        private String imageUrl;
        private double rating;
        private int reviewCount;
        private boolean isAvailable;
        private String condition;
        private String sellerName;
        private double distance; // km from user
        private boolean isFeatured;
        private String priceRange;

        public MobileProductSummary(Product product) {
            this.id = product.getId();
            this.name = truncateText(product.getName(), 50);
            this.price = BigDecimal.valueOf(product.getPrice());
            this.category = product.getCategory();
            this.imageUrl = getOptimizedImageUrl(product.getId());
            this.rating = generateRealisticRating();
            this.reviewCount = ThreadLocalRandom.current().nextInt(0, 500);
            this.isAvailable = product.isAvailable();
            this.condition = product.getCondition();
            this.sellerName = "Seller " + product.getSellerId();
            this.distance = ThreadLocalRandom.current().nextDouble(0.5, 50.0);
            this.isFeatured = ThreadLocalRandom.current().nextBoolean();
            this.priceRange = determinePriceRange(product.getPrice());
        }

        // Getters
        public String getId() { return id; }
        public String getName() { return name; }
        public BigDecimal getPrice() { return price; }
        public String getCategory() { return category; }
        public String getImageUrl() { return imageUrl; }
        public double getRating() { return rating; }
        public int getReviewCount() { return reviewCount; }
        public boolean isAvailable() { return isAvailable; }
        public String getCondition() { return condition; }
        public String getSellerName() { return sellerName; }
        public double getDistance() { return distance; }
        public boolean isFeatured() { return isFeatured; }
        public String getPriceRange() { return priceRange; }
    }

    public static class MobileSearchResult {
        private List<MobileProductSummary> products;
        private int totalElements;
        private int totalPages;
        private int currentPage;
        private boolean hasNext;
        private boolean hasPrevious;
        private List<String> suggestedFilters;
        private List<String> relatedSearches;
        private Map<String, Long> categoryDistribution;

        public MobileSearchResult() {
            this.products = new ArrayList<>();
            this.suggestedFilters = new ArrayList<>();
            this.relatedSearches = new ArrayList<>();
            this.categoryDistribution = new HashMap<>();
        }

        // Getters and setters
        public List<MobileProductSummary> getProducts() { return products; }
        public void setProducts(List<MobileProductSummary> products) { this.products = products; }
        public int getTotalElements() { return totalElements; }
        public void setTotalElements(int totalElements) { this.totalElements = totalElements; }
        public int getTotalPages() { return totalPages; }
        public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
        public int getCurrentPage() { return currentPage; }
        public void setCurrentPage(int currentPage) { this.currentPage = currentPage; }
        public boolean isHasNext() { return hasNext; }
        public void setHasNext(boolean hasNext) { this.hasNext = hasNext; }
        public boolean isHasPrevious() { return hasPrevious; }
        public void setHasPrevious(boolean hasPrevious) { this.hasPrevious = hasPrevious; }
        public List<String> getSuggestedFilters() { return suggestedFilters; }
        public void setSuggestedFilters(List<String> suggestedFilters) { this.suggestedFilters = suggestedFilters; }
        public List<String> getRelatedSearches() { return relatedSearches; }
        public void setRelatedSearches(List<String> relatedSearches) { this.relatedSearches = relatedSearches; }
        public Map<String, Long> getCategoryDistribution() { return categoryDistribution; }
        public void setCategoryDistribution(Map<String, Long> categoryDistribution) { this.categoryDistribution = categoryDistribution; }
    }

    public static class MobileUserProfile {
        private String userId;
        private String displayName;
        private String profileImageUrl;
        private int totalOrders;
        private double totalSpent;
        private String memberSince;
        private String preferredCategories;
        private double averageRating;
        private Map<String, Object> preferences;
        private List<String> recentSearches;

        public MobileUserProfile(String userId) {
            this.userId = userId;
            this.displayName = "User " + userId;
            this.profileImageUrl = "/api/mobile/v1/users/" + userId + "/avatar";
            this.totalOrders = ThreadLocalRandom.current().nextInt(1, 100);
            this.totalSpent = ThreadLocalRandom.current().nextDouble(50, 5000);
            this.memberSince = "2023-" + String.format("%02d", ThreadLocalRandom.current().nextInt(1, 13));
            this.preferredCategories = "Fashion, Electronics";
            this.averageRating = ThreadLocalRandom.current().nextDouble(3.5, 5.0);
            this.preferences = new HashMap<>();
            this.recentSearches = new ArrayList<>();
        }

        // Getters and setters
        public String getUserId() { return userId; }
        public String getDisplayName() { return displayName; }
        public String getProfileImageUrl() { return profileImageUrl; }
        public int getTotalOrders() { return totalOrders; }
        public double getTotalSpent() { return totalSpent; }
        public String getMemberSince() { return memberSince; }
        public String getPreferredCategories() { return preferredCategories; }
        public double getAverageRating() { return averageRating; }
        public Map<String, Object> getPreferences() { return preferences; }
        public List<String> getRecentSearches() { return recentSearches; }
        public void setRecentSearches(List<String> recentSearches) { this.recentSearches = recentSearches; }
    }

    public static class MobileDashboard {
        private List<MobileProductSummary> featuredProducts;
        private List<MobileProductSummary> recommendedProducts;
        private List<MobileProductSummary> nearbyProducts;
        private List<String> trendingCategories;
        private List<String> trendingSearches;
        private Map<String, Object> userStats;
        private List<Map<String, Object>> notifications;

        public MobileDashboard() {
            this.featuredProducts = new ArrayList<>();
            this.recommendedProducts = new ArrayList<>();
            this.nearbyProducts = new ArrayList<>();
            this.trendingCategories = new ArrayList<>();
            this.trendingSearches = new ArrayList<>();
            this.userStats = new HashMap<>();
            this.notifications = new ArrayList<>();
        }

        // Getters and setters
        public List<MobileProductSummary> getFeaturedProducts() { return featuredProducts; }
        public void setFeaturedProducts(List<MobileProductSummary> featuredProducts) { this.featuredProducts = featuredProducts; }
        public List<MobileProductSummary> getRecommendedProducts() { return recommendedProducts; }
        public void setRecommendedProducts(List<MobileProductSummary> recommendedProducts) { this.recommendedProducts = recommendedProducts; }
        public List<MobileProductSummary> getNearbyProducts() { return nearbyProducts; }
        public void setNearbyProducts(List<MobileProductSummary> nearbyProducts) { this.nearbyProducts = nearbyProducts; }
        public List<String> getTrendingCategories() { return trendingCategories; }
        public void setTrendingCategories(List<String> trendingCategories) { this.trendingCategories = trendingCategories; }
        public List<String> getTrendingSearches() { return trendingSearches; }
        public void setTrendingSearches(List<String> trendingSearches) { this.trendingSearches = trendingSearches; }
        public Map<String, Object> getUserStats() { return userStats; }
        public void setUserStats(Map<String, Object> userStats) { this.userStats = userStats; }
        public List<Map<String, Object>> getNotifications() { return notifications; }
        public void setNotifications(List<Map<String, Object>> notifications) { this.notifications = notifications; }
    }

    // Mobile Dashboard Endpoint
    @GetMapping("/dashboard")
    public CompletableFuture<ResponseEntity<MobileDashboard>> getMobileDashboard(
            @RequestParam(defaultValue = "guest") String userId,
            @RequestParam(defaultValue = "0.0") double latitude,
            @RequestParam(defaultValue = "0.0") double longitude) {
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                MobileDashboard dashboard = new MobileDashboard();
                
                // Get featured products (lightweight)
                List<Product> featuredProductList = productRepository.findByIsAvailableTrue()
                    .stream().limit(6).collect(Collectors.toList());
                dashboard.setFeaturedProducts(featuredProductList.stream()
                    .map(MobileProductSummary::new)
                    .collect(Collectors.toList()));
                
                // Get personalized recommendations
                if (!userId.equals("guest")) {
                    List<Product> recommendations = recommendationService.getPersonalizedRecommendations(userId, 8);
                    dashboard.setRecommendedProducts(recommendations.stream()
                        .map(MobileProductSummary::new)
                        .collect(Collectors.toList()));
                }
                
                // Get nearby products (simulated based on location)
                List<Product> nearbyProductList = productRepository.findByIsAvailableTrue()
                    .stream().limit(5).collect(Collectors.toList());
                dashboard.setNearbyProducts(nearbyProductList.stream()
                    .map(MobileProductSummary::new)
                    .collect(Collectors.toList()));
                
                // Trending categories
                dashboard.setTrendingCategories(Arrays.asList(
                    "Fashion", "Electronics", "Books", "Home & Garden", "Sports"
                ));
                
                // Trending searches
                dashboard.setTrendingSearches(Arrays.asList(
                    "vintage jacket", "smartphone", "running shoes", "desk lamp", "cookbook"
                ));
                
                // User stats
                if (!userId.equals("guest")) {
                    dashboard.getUserStats().put("savedItems", ThreadLocalRandom.current().nextInt(5, 50));
                    dashboard.getUserStats().put("recentViews", ThreadLocalRandom.current().nextInt(10, 100));
                    dashboard.getUserStats().put("watchlistCount", ThreadLocalRandom.current().nextInt(2, 20));
                }
                
                // Notifications
                dashboard.setNotifications(generateMobileNotifications(userId));
                
                return ResponseEntity.ok(dashboard);
                
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        });
    }

    // Mobile Product Search
    @GetMapping("/search")
    public CompletableFuture<ResponseEntity<MobileSearchResult>> searchProducts(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priceRange,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "guest") String userId) {
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Create pageable
                Pageable pageable = PageRequest.of(page, Math.min(size, 50)); // Limit max size for mobile
                
                // Get all products matching basic criteria
                List<Product> allProducts = productRepository.findByIsAvailableTrue();
                
                // Apply search filters
                List<Product> filteredProducts = applyMobileSearchFilters(allProducts, query, category, priceRange, condition);
                
                // Apply sorting
                filteredProducts = applySorting(filteredProducts, sortBy);
                
                // Paginate results
                int start = (int) pageable.getOffset();
                int end = Math.min(start + pageable.getPageSize(), filteredProducts.size());
                List<Product> pageProducts = filteredProducts.subList(start, end);
                
                // Convert to mobile summaries
                List<MobileProductSummary> mobileSummaries = pageProducts.stream()
                    .map(MobileProductSummary::new)
                    .collect(Collectors.toList());
                
                // Create result
                MobileSearchResult result = new MobileSearchResult();
                result.setProducts(mobileSummaries);
                result.setTotalElements(filteredProducts.size());
                result.setTotalPages((int) Math.ceil((double) filteredProducts.size() / size));
                result.setCurrentPage(page);
                result.setHasNext(end < filteredProducts.size());
                result.setHasPrevious(page > 0);
                
                // Add suggested filters and related searches
                result.setSuggestedFilters(generateSuggestedFilters(filteredProducts));
                result.setRelatedSearches(generateRelatedSearches(query));
                result.setCategoryDistribution(calculateCategoryDistribution(filteredProducts));
                
                // Track search analytics
                if (!userId.equals("guest")) {
                    analyticsService.trackUserInteraction(userId, 
                        UserBehaviorAnalyticsService.InteractionType.SEARCH, 
                        query, Map.of("resultCount", filteredProducts.size()));
                }
                
                return ResponseEntity.ok(result);
                
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        });
    }

    // Mobile Product Details
    @GetMapping("/products/{productId}")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getProductDetails(
            @PathVariable String productId,
            @RequestParam(defaultValue = "guest") String userId) {
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                Optional<Product> productOpt = productRepository.findById(productId);
                if (!productOpt.isPresent()) {
                    return ResponseEntity.notFound().build();
                }
                
                Product product = productOpt.get();
                Map<String, Object> productDetails = new HashMap<>();
                
                // Basic product info (optimized for mobile)
                productDetails.put("id", product.getId());
                productDetails.put("name", product.getName());
                productDetails.put("description", truncateText(product.getDescription(), 200));
                productDetails.put("price", product.getPrice());
                productDetails.put("category", product.getCategory());
                productDetails.put("condition", product.getCondition());
                productDetails.put("isAvailable", product.isAvailable());
                
                // Enhanced mobile-specific data
                productDetails.put("images", generateProductImages(productId));
                productDetails.put("rating", generateRealisticRating());
                productDetails.put("reviewCount", ThreadLocalRandom.current().nextInt(1, 500));
                productDetails.put("views", ThreadLocalRandom.current().nextInt(50, 1000));
                productDetails.put("sellerInfo", generateSellerInfo(product.getSellerId()));
                productDetails.put("shippingInfo", generateShippingInfo());
                productDetails.put("specifications", generateSpecifications(product));
                productDetails.put("similarProducts", getSimilarProducts(product, 4));
                
                // User-specific data
                if (!userId.equals("guest")) {
                    productDetails.put("isFavorited", ThreadLocalRandom.current().nextBoolean());
                    productDetails.put("isInWatchlist", ThreadLocalRandom.current().nextBoolean());
                    productDetails.put("recommendationScore", ThreadLocalRandom.current().nextDouble(0.5, 1.0));
                    
                    // Track view
                    analyticsService.trackUserInteraction(userId, 
                        UserBehaviorAnalyticsService.InteractionType.PRODUCT_VIEW, 
                        productId, Map.of("timestamp", LocalDateTime.now()));
                }
                
                return ResponseEntity.ok(productDetails);
                
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        });
    }

    // Mobile Categories
    @GetMapping("/categories")
    public ResponseEntity<Map<String, Object>> getCategories() {
        Map<String, Object> categoriesData = new HashMap<>();
        
        List<Map<String, Object>> categories = Arrays.asList(
            createCategoryInfo("Fashion", "👗", 1250),
            createCategoryInfo("Electronics", "📱", 890),
            createCategoryInfo("Books", "📚", 2100),
            createCategoryInfo("Home & Garden", "🏠", 650),
            createCategoryInfo("Sports", "⚽", 420),
            createCategoryInfo("Toys & Games", "🎮", 380),
            createCategoryInfo("Art & Collectibles", "🎨", 290),
            createCategoryInfo("Automotive", "🚗", 180)
        );
        
        categoriesData.put("categories", categories);
        categoriesData.put("trending", Arrays.asList("Fashion", "Electronics", "Books"));
        
        return ResponseEntity.ok(categoriesData);
    }

    // Mobile User Profile
    @GetMapping("/users/{userId}/profile")
    public CompletableFuture<ResponseEntity<MobileUserProfile>> getUserProfile(@PathVariable String userId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                MobileUserProfile profile = new MobileUserProfile(userId);
                
                // Add recent searches (simulated)
                profile.setRecentSearches(Arrays.asList(
                    "vintage leather jacket", "iphone case", "nike shoes", "coffee table", "cookbooks"
                ));
                
                // Add preferences
                profile.getPreferences().put("maxDistance", 25.0);
                profile.getPreferences().put("priceRange", "budget");
                profile.getPreferences().put("notifications", true);
                profile.getPreferences().put("darkMode", false);
                
                return ResponseEntity.ok(profile);
                
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        });
    }

    // Mobile Recommendations
    @GetMapping("/recommendations")
    public CompletableFuture<ResponseEntity<List<MobileProductSummary>>> getRecommendations(
            @RequestParam String userId,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "personalized") String type) {
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                List<Product> recommendations;
                
                switch (type) {
                    case "trending":
                        recommendations = getTrendingProducts(limit);
                        break;
                    case "nearby":
                        recommendations = getNearbyProducts(userId, limit);
                        break;
                    case "similar":
                        recommendations = getSimilarProductsForUser(userId, limit);
                        break;
                    default:
                        recommendations = recommendationService.getPersonalizedRecommendations(userId, limit);
                }
                
                List<MobileProductSummary> mobileSummaries = recommendations.stream()
                    .map(MobileProductSummary::new)
                    .collect(Collectors.toList());
                
                return ResponseEntity.ok(mobileSummaries);
                
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        });
    }

    // Mobile Quick Search Suggestions
    @GetMapping("/search/suggestions")
    public ResponseEntity<List<String>> getSearchSuggestions(
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int limit) {
        
        List<String> suggestions = generateSearchSuggestions(query, limit);
        return ResponseEntity.ok(suggestions);
    }

    // Mobile Filters
    @GetMapping("/filters")
    public ResponseEntity<Map<String, Object>> getFilters(@RequestParam(required = false) String category) {
        Map<String, Object> filters = new HashMap<>();
        
        // Price ranges
        filters.put("priceRanges", Arrays.asList(
            Map.of("label", "Under $25", "value", "0-25"),
            Map.of("label", "$25 - $50", "value", "25-50"),
            Map.of("label", "$50 - $100", "value", "50-100"),
            Map.of("label", "$100 - $250", "value", "100-250"),
            Map.of("label", "Over $250", "value", "250+")
        ));
        
        // Conditions
        filters.put("conditions", Arrays.asList("New", "Like New", "Good", "Fair"));
        
        // Sort options
        filters.put("sortOptions", Arrays.asList(
            Map.of("label", "Relevance", "value", "relevance"),
            Map.of("label", "Price: Low to High", "value", "price_asc"),
            Map.of("label", "Price: High to Low", "value", "price_desc"),
            Map.of("label", "Newest First", "value", "newest"),
            Map.of("label", "Distance", "value", "distance")
        ));
        
        // Distance options
        filters.put("distanceOptions", Arrays.asList(
            Map.of("label", "Within 5 km", "value", "5"),
            Map.of("label", "Within 10 km", "value", "10"),
            Map.of("label", "Within 25 km", "value", "25"),
            Map.of("label", "Within 50 km", "value", "50")
        ));
        
        return ResponseEntity.ok(filters);
    }

    // Mobile App Configuration
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getAppConfig() {
        Map<String, Object> config = new HashMap<>();
        
        config.put("apiVersion", "1.0.0");
        config.put("features", Map.of(
            "visualSearch", true,
            "voiceSearch", true,
            "augmentedReality", false,
            "socialSharing", true,
            "pushNotifications", true,
            "offlineMode", false
        ));
        
        config.put("limits", Map.of(
            "maxSearchResults", 50,
            "maxImageSize", "5MB",
            "maxImagesPerProduct", 8,
            "sessionTimeout", 3600
        ));
        
        config.put("endpoints", Map.of(
            "imageUpload", "/api/mobile/v1/images/upload",
            "support", "/api/mobile/v1/support",
            "feedback", "/api/mobile/v1/feedback"
        ));
        
        return ResponseEntity.ok(config);
    }

    // Helper Methods
    private static String truncateText(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + "...";
    }

    private static String getOptimizedImageUrl(String productId) {
        return "/api/mobile/v1/images/" + productId + "/thumbnail";
    }

    private static double generateRealisticRating() {
        return Math.round(ThreadLocalRandom.current().nextDouble(3.0, 5.0) * 10.0) / 10.0;
    }

    private String determinePriceRange(BigDecimal price) {
        if (price.compareTo(new BigDecimal("25")) <= 0) return "budget";
        if (price.compareTo(new BigDecimal("100")) <= 0) return "moderate";
        if (price.compareTo(new BigDecimal("250")) <= 0) return "premium";
        return "luxury";
    }

    private List<Product> applyMobileSearchFilters(List<Product> products, String query, 
                                                 String category, String priceRange, String condition) {
        return products.stream()
            .filter(product -> query == null || 
                product.getName().toLowerCase().contains(query.toLowerCase()) ||
                product.getDescription().toLowerCase().contains(query.toLowerCase()))
            .filter(product -> category == null || 
                product.getCategory().equalsIgnoreCase(category))
            .filter(product -> condition == null || 
                product.getCondition().equalsIgnoreCase(condition))
            .filter(product -> priceRange == null || 
                isPriceInRange(product.getPrice(), priceRange))
            .collect(Collectors.toList());
    }

    private boolean isPriceInRange(BigDecimal price, String priceRange) {
        switch (priceRange) {
            case "0-25": return price.compareTo(new BigDecimal("25")) <= 0;
            case "25-50": return price.compareTo(new BigDecimal("25")) > 0 && 
                                price.compareTo(new BigDecimal("50")) <= 0;
            case "50-100": return price.compareTo(new BigDecimal("50")) > 0 && 
                                 price.compareTo(new BigDecimal("100")) <= 0;
            case "100-250": return price.compareTo(new BigDecimal("100")) > 0 && 
                                  price.compareTo(new BigDecimal("250")) <= 0;
            case "250+": return price.compareTo(new BigDecimal("250")) > 0;
            default: return true;
        }
    }

    private List<Product> applySorting(List<Product> products, String sortBy) {
        if (sortBy == null) return products;
        
        switch (sortBy) {
            case "price_asc":
                return products.stream()
                    .sorted(Comparator.comparing(Product::getPrice))
                    .collect(Collectors.toList());
            case "price_desc":
                return products.stream()
                    .sorted(Comparator.comparing(Product::getPrice).reversed())
                    .collect(Collectors.toList());
            case "newest":
                return products.stream()
                    .sorted(Comparator.comparing(Product::getId).reversed())
                    .collect(Collectors.toList());
            default:
                return products;
        }
    }

    private List<String> generateSuggestedFilters(List<Product> products) {
        return Arrays.asList("Price: Under $50", "Condition: Like New", "Distance: Within 10km");
    }

    private List<String> generateRelatedSearches(String query) {
        return Arrays.asList(
            query + " vintage", query + " brand new", query + " sale", query + " discount"
        );
    }

    private Map<String, Long> calculateCategoryDistribution(List<Product> products) {
        return products.stream()
            .collect(Collectors.groupingBy(Product::getCategory, Collectors.counting()));
    }

    private List<String> generateProductImages(String productId) {
        return Arrays.asList(
            "/api/mobile/v1/images/" + productId + "/main",
            "/api/mobile/v1/images/" + productId + "/alt1",
            "/api/mobile/v1/images/" + productId + "/alt2"
        );
    }

    private Map<String, Object> generateSellerInfo(String sellerId) {
        Map<String, Object> sellerInfo = new HashMap<>();
        sellerInfo.put("id", sellerId);
        sellerInfo.put("name", "Seller " + sellerId);
        sellerInfo.put("rating", generateRealisticRating());
        sellerInfo.put("totalSales", ThreadLocalRandom.current().nextInt(10, 500));
        sellerInfo.put("responseTime", "Usually responds in 2-4 hours");
        sellerInfo.put("isVerified", ThreadLocalRandom.current().nextBoolean());
        return sellerInfo;
    }

    private Map<String, Object> generateShippingInfo() {
        Map<String, Object> shippingInfo = new HashMap<>();
        shippingInfo.put("cost", ThreadLocalRandom.current().nextDouble(5.0, 25.0));
        shippingInfo.put("estimatedDays", ThreadLocalRandom.current().nextInt(3, 14));
        shippingInfo.put("freeShippingThreshold", 50.0);
        shippingInfo.put("methods", Arrays.asList("Standard", "Express", "Local Pickup"));
        return shippingInfo;
    }

    private Map<String, Object> generateSpecifications(Product product) {
        Map<String, Object> specs = new HashMap<>();
        specs.put("Brand", "Sample Brand");
        specs.put("Color", "Varies");
        specs.put("Size", "Medium");
        specs.put("Material", "Cotton/Polyester");
        return specs;
    }

    private List<MobileProductSummary> getSimilarProducts(Product product, int limit) {
        return productRepository.findByIsAvailableTrue().stream()
            .filter(p -> p.getCategory().equals(product.getCategory()) && !p.getId().equals(product.getId()))
            .limit(limit)
            .map(MobileProductSummary::new)
            .collect(Collectors.toList());
    }

    private Map<String, Object> createCategoryInfo(String name, String icon, int itemCount) {
        Map<String, Object> category = new HashMap<>();
        category.put("name", name);
        category.put("icon", icon);
        category.put("itemCount", itemCount);
        category.put("trending", ThreadLocalRandom.current().nextBoolean());
        return category;
    }

    private List<Product> getTrendingProducts(int limit) {
        return productRepository.findByIsAvailableTrue().stream()
            .limit(limit)
            .collect(Collectors.toList());
    }

    private List<Product> getNearbyProducts(String userId, int limit) {
        return productRepository.findByIsAvailableTrue().stream()
            .limit(limit)
            .collect(Collectors.toList());
    }

    private List<Product> getSimilarProductsForUser(String userId, int limit) {
        return productRepository.findByIsAvailableTrue().stream()
            .limit(limit)
            .collect(Collectors.toList());
    }

    private List<String> generateSearchSuggestions(String query, int limit) {
        List<String> suggestions = Arrays.asList(
            query + " jacket", query + " shoes", query + " bag", 
            query + " vintage", query + " new", query + " sale"
        );
        return suggestions.stream().limit(limit).collect(Collectors.toList());
    }

    private List<Map<String, Object>> generateMobileNotifications(String userId) {
        List<Map<String, Object>> notifications = new ArrayList<>();
        
        if (!userId.equals("guest")) {
            notifications.add(Map.of(
                "id", "notif1",
                "type", "price_drop",
                "title", "Price Drop Alert!",
                "message", "An item in your watchlist has dropped in price",
                "timestamp", LocalDateTime.now().minusHours(2).toString()
            ));
            
            notifications.add(Map.of(
                "id", "notif2",
                "type", "new_recommendation",
                "title", "New Recommendations",
                "message", "We found 5 new items you might like",
                "timestamp", LocalDateTime.now().minusHours(6).toString()
            ));
        }
        
        return notifications;
    }

    private static String determinePriceRange(double price) {
        if (price < 25.0) return "Under $25";
        if (price < 50.0) return "$25-$50";
        if (price < 100.0) return "$50-$100";
        if (price < 200.0) return "$100-$200";
        return "$200+";
    }

    private static boolean isPriceInRange(double price, String priceRange) {
        if (priceRange == null) return true;

        switch (priceRange.toLowerCase()) {
            case "under $25":
            case "under 25":
                return price < 25.0;
            case "$25-$50":
            case "25-50":
                return price >= 25.0 && price < 50.0;
            case "$50-$100":
            case "50-100":
                return price >= 50.0 && price < 100.0;
            case "$100-$200":
            case "100-200":
                return price >= 100.0 && price < 200.0;
            case "$200+":
            case "200+":
                return price >= 200.0;
            default:
                return true;
        }
    }
}
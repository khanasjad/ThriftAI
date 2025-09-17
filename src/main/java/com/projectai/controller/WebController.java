package com.projectai.controller;
// Updated for template changes

import com.projectai.models.Deal;
import com.projectai.models.Product;
import com.projectai.models.UserPreferences;
import com.projectai.service.ThriftAIService;
import com.projectai.service.CartService;
import com.projectai.service.VisualSearchService;
import com.projectai.service.ExternalMarketplaceService;
import com.projectai.service.ExternalMarketplaceService.ExternalProduct;
import jakarta.servlet.http.HttpServletRequest;
import com.projectai.service.PriceComparisonService;
import com.projectai.service.LocationService;
import com.projectai.service.LocationService.LocationData;
import com.projectai.service.RecommendationEngineService;
import com.projectai.service.IntelligentSearchService;
import com.projectai.service.RealTimeRecommendationService;
import com.projectai.models.Seller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Controller
public class WebController {

    @Autowired
    private ThriftAIService thriftAIService;

    @Autowired
    private CartService cartService;

    @Autowired
    private VisualSearchService visualSearchService;

    @Autowired
    private ExternalMarketplaceService externalMarketplaceService;

    @Autowired
    private PriceComparisonService priceComparisonService;

    @Autowired
    private LocationService locationService;

    @Autowired
    private RecommendationEngineService recommendationService;

    @Autowired
    private IntelligentSearchService intelligentSearchService;

    @Autowired
    private RealTimeRecommendationService realTimeRecommendationService;

    @GetMapping("/")
    public String home(Model model) {
        // Simple home page without service calls
        return "index";
    }
    
    @GetMapping("/old-home")
    public String oldHome(@RequestParam(required = false) String category,
                      @RequestParam(required = false) String search,
                      @RequestParam(required = false) String brand,
                      @RequestParam(defaultValue = "12") int limit,
                      Model model) {
        
        try {
            // Get platform overview for homepage
            Map<String, Object> overview = thriftAIService.getPlatformOverview();
            model.addAttribute("overview", overview);
        } catch (Exception e) {
            // Log error but continue with basic homepage
            System.err.println("Error getting platform overview: " + e.getMessage());
        }
        
        try {
            // Get some featured deals
            UserPreferences defaultPrefs = thriftAIService.getDefaultUserPreferences(null);
            List<Deal> featuredDeals = thriftAIService.findBestDeals(defaultPrefs, 6);
            model.addAttribute("featuredDeals", featuredDeals);
        } catch (Exception e) {
            System.err.println("Error getting featured deals: " + e.getMessage());
        }
        
        try {
            // Get all products with filtering capabilities
            List<Product> products;
            if (search != null && !search.trim().isEmpty()) {
                products = thriftAIService.searchProducts(search, category);
                model.addAttribute("searchQuery", search);
            } else if (category != null && !category.trim().isEmpty()) {
                products = thriftAIService.getProductsByCategory(category);
                model.addAttribute("selectedCategory", category);
            } else {
                products = thriftAIService.getAllAvailableProducts();
            }
            
            // Filter by brand if specified
            if (brand != null && !brand.trim().isEmpty()) {
                products = products.stream()
                        .filter(p -> brand.equals(p.getBrand()))
                        .toList();
                model.addAttribute("selectedBrand", brand);
            }
            
            // Limit products if specified
            if (products.size() > limit) {
                products = products.stream().limit(limit).toList();
            }
            
            model.addAttribute("products", products);
            model.addAttribute("categories", thriftAIService.getAllCategories());
            model.addAttribute("brands", thriftAIService.getAllBrands());
            
            // Get AI deals as well
            UserPreferences defaultPrefs = thriftAIService.getDefaultUserPreferences(null);
            List<Deal> aiDeals = thriftAIService.findBestDealsWithAI(defaultPrefs, 8);
            model.addAttribute("aiDeals", aiDeals);
            
        } catch (Exception e) {
            System.err.println("Error getting products: " + e.getMessage());
        }
        
        return "index";
    }

    // Redirect old products endpoint to home page
    @GetMapping("/products")
    public String products(@RequestParam(required = false) String category,
                          @RequestParam(required = false) String search) {
        String redirectUrl = "/?";
        if (search != null && !search.trim().isEmpty()) {
            redirectUrl += "search=" + search;
            if (category != null && !category.trim().isEmpty()) {
                redirectUrl += "&category=" + category;
            }
        } else if (category != null && !category.trim().isEmpty()) {
            redirectUrl += "category=" + category;
        }
        return "redirect:" + redirectUrl.replaceAll("\\?$", "");
    }

    @GetMapping("/products/{id}")
    public String productDetail(@PathVariable String id, Model model) {
        Product product = thriftAIService.getProductById(id);
        if (product == null) {
            return "redirect:/?error=notfound";
        }
        
        // Add the selected product
        model.addAttribute("product", product);
        
        // Get similar products from same category
        List<Product> similarProducts = thriftAIService.getProductsByCategory(product.getCategory())
                .stream()
                .filter(p -> !p.getId().equals(id) && p.isAvailable())
                .limit(6)
                .toList();
        model.addAttribute("similarProducts", similarProducts);
        
        // Get related products from other categories
        List<Product> relatedProducts = thriftAIService.getAllAvailableProducts()
                .stream()
                .filter(p -> !p.getId().equals(id) && !p.getCategory().equals(product.getCategory()))
                .limit(4)
                .toList();
        model.addAttribute("relatedProducts", relatedProducts);
        
        // Add breadcrumb data
        model.addAttribute("categoryName", product.getCategory());
        
        return "product-detail";
    }

    // Redirect old deals endpoints to home page
    @GetMapping("/deals")
    public String deals() {
        return "redirect:/";
    }

    @GetMapping("/ai-deals")
    public String aiDeals() {
        return "redirect:/";
    }

    @GetMapping("/analytics")
    public String analytics() {
        return "redirect:/";
    }

    @GetMapping("/about")
    public String about() {
        return "redirect:/";
    }

    @GetMapping("/contact")
    public String contact() {
        return "redirect:/";
    }
    
    @GetMapping("/search")
    public String search(@RequestParam(required = false) String q,
                        @RequestParam(required = false) String query,
                        Model model) {
        // Handle both 'q' and 'query' parameters for flexibility
        String searchQuery = q != null ? q : query;
        
        if (searchQuery != null && !searchQuery.trim().isEmpty()) {
            return "redirect:/buyers/search?q=" + searchQuery;
        } else {
            return "redirect:/buyers/search";
        }
    }
    
    

    // AJAX endpoints for dynamic content
    @GetMapping("/api/web/search-suggestions")
    @ResponseBody
    public List<String> getSearchSuggestions(@RequestParam String query) {
        return thriftAIService.searchProducts(query, null)
                .stream()
                .map(Product::getName)
                .distinct()
                .limit(5)
                .toList();
    }

    @GetMapping("/api/web/quick-deals")
    @ResponseBody
    public List<Deal> getQuickDeals(@RequestParam(defaultValue = "3") int limit) {
        UserPreferences defaultPrefs = thriftAIService.getDefaultUserPreferences(null);
        return thriftAIService.findBestDeals(defaultPrefs, limit);
    }

    @GetMapping("/api/products/{id}/similar")
    @ResponseBody
    public List<Product> getSimilarProducts(@PathVariable String id, @RequestParam(defaultValue = "6") int limit) {
        Product product = thriftAIService.getProductById(id);
        if (product == null) {
            return List.of();
        }
        
        return thriftAIService.getProductsByCategory(product.getCategory())
                .stream()
                .filter(p -> !p.getId().equals(id) && p.isAvailable())
                .limit(limit)
                .toList();
    }

    @PostMapping("/api/products/{id}/wishlist")
    @ResponseBody
    public Map<String, Object> addToWishlist(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();
        
        Product product = thriftAIService.getProductById(id);
        if (product == null) {
            response.put("success", false);
            response.put("message", "Product not found");
            return response;
        }
        
        // TODO: Implement actual wishlist functionality when user authentication is added
        response.put("success", true);
        response.put("message", "Added to wishlist! (Demo mode)");
        return response;
    }

    @GetMapping("/api/products/{id}/quality-score")
    @ResponseBody
    public Map<String, Object> getQualityScore(@PathVariable String id) {
        Product product = thriftAIService.getProductById(id);
        if (product == null) {
            return Map.of("error", "Product not found");
        }
        
        // Calculate AI quality score based on product attributes
        int score = calculateQualityScore(product);
        String category = getQualityCategory(score);
        List<String> factors = getQualityFactors(product, score);
        
        return Map.of(
            "score", score,
            "category", category,
            "factors", factors,
            "recommendation", getQualityRecommendation(score)
        );
    }

    private int calculateQualityScore(Product product) {
        int score = 50; // Base score
        
        // Condition impact
        if (product.getCondition() != null) {
            switch (product.getCondition().toUpperCase()) {
                case "EXCELLENT" -> score += 25;
                case "VERY_GOOD" -> score += 20;
                case "GOOD" -> score += 15;
                case "FAIR" -> score += 5;
                case "POOR" -> score -= 10;
            }
        }
        
        // Discount impact
        if (product.getOriginalPrice() > 0 && product.getOriginalPrice() > product.getPrice()) {
            double discount = (product.getOriginalPrice() - product.getPrice()) / product.getOriginalPrice();
            score += Math.min(discount * 25, 25); // Max 25 points for discount
        }
        
        // Brand reputation (simplified)
        if (product.getBrand() != null) {
            String brand = product.getBrand().toUpperCase();
            if (brand.contains("NIKE") || brand.contains("APPLE") || brand.contains("LEVI")) {
                score += 10;
            }
        }
        
        // Age simulation (newer = better)
        if (product.getCreatedAt() != null) {
            long daysSinceCreated = java.time.Duration.between(product.getCreatedAt(), java.time.LocalDateTime.now()).toDays();
            if (daysSinceCreated < 7) score += 5; // Recent listing
        }
        
        return Math.max(0, Math.min(100, score));
    }

    private String getQualityCategory(int score) {
        if (score >= 85) return "Excellent";
        if (score >= 75) return "Very Good";
        if (score >= 65) return "Good";
        if (score >= 50) return "Fair";
        return "Poor";
    }

    private List<String> getQualityFactors(Product product, int score) {
        List<String> factors = new ArrayList<>();
        
        if (product.getCondition() != null) {
            factors.add("Condition: " + product.getCondition());
        }
        
        if (product.getOriginalPrice() > 0 && product.getOriginalPrice() > product.getPrice()) {
            double discount = (product.getOriginalPrice() - product.getPrice()) / product.getOriginalPrice() * 100;
            factors.add(String.format("Discount: %.1f%% off", discount));
        }
        
        if (product.getBrand() != null) {
            factors.add("Brand: " + product.getBrand());
        }
        
        if (score >= 75) {
            factors.add("High quality item");
        } else if (score >= 50) {
            factors.add("Good value for money");
        }
        
        return factors;
    }

    private String getQualityRecommendation(int score) {
        if (score >= 85) return "Highly recommended! Excellent quality and value.";
        if (score >= 75) return "Great choice! Good quality item worth buying.";
        if (score >= 65) return "Solid option. Consider if it matches your needs.";
        if (score >= 50) return "Fair deal. Check condition carefully before buying.";
        return "Consider alternatives. This item may have quality concerns.";
    }

    // Amazon-style recommendation endpoints
    @GetMapping("/api/recommendations/personalized")
    @ResponseBody
    public List<Product> getPersonalizedRecommendations(
            @RequestParam(required = false) String userId,
            @RequestParam(defaultValue = "10") int limit) {
        return thriftAIService.getPersonalizedRecommendations(userId, limit);
    }

    @GetMapping("/api/recommendations/frequently-bought-together/{productId}")
    @ResponseBody
    public List<Product> getFrequentlyBoughtTogether(
            @PathVariable String productId,
            @RequestParam(defaultValue = "4") int limit) {
        Product product = thriftAIService.getProductById(productId);
        if (product == null) {
            return List.of();
        }
        return thriftAIService.getFrequentlyBoughtTogether(product, limit);
    }

    @GetMapping("/api/recommendations/customers-also-viewed/{productId}")
    @ResponseBody
    public List<Product> getCustomersAlsoViewed(
            @PathVariable String productId,
            @RequestParam(defaultValue = "6") int limit) {
        Product product = thriftAIService.getProductById(productId);
        if (product == null) {
            return List.of();
        }
        return thriftAIService.getCustomersAlsoViewed(product, limit);
    }

    @GetMapping("/api/recommendations/best-sellers/{category}")
    @ResponseBody
    public List<Product> getBestSellersInCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "8") int limit) {
        return thriftAIService.getBestSellersInCategory(category, limit);
    }

    @PostMapping("/api/recommendations/based-on-recent")
    @ResponseBody
    public List<Product> getRecentlyViewedRecommendations(
            @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<String> recentlyViewedIds = (List<String>) request.getOrDefault("recentlyViewed", List.of());
        int limit = (Integer) request.getOrDefault("limit", 8);
        
        return thriftAIService.getRecentlyViewedRecommendations(recentlyViewedIds, limit);
    }

    @GetMapping("/api/recommendations/trending")
    @ResponseBody
    public List<Product> getTrendingProducts(@RequestParam(defaultValue = "10") int limit) {
        // Get products with high discount percentages as "trending"
        return thriftAIService.getAllAvailableProducts().stream()
                .sorted((p1, p2) -> Double.compare(p2.getDiscountPercentage(), p1.getDiscountPercentage()))
                .limit(limit)
                .toList();
    }

    @GetMapping("/api/recommendations/for-you")
    @ResponseBody
    public Map<String, Object> getForYouRecommendations(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String category) {
        
        Map<String, Object> recommendations = new HashMap<>();
        
        // Personalized recommendations
        recommendations.put("personalizedForYou", 
            thriftAIService.getPersonalizedRecommendations(userId, 6));
        
        // Trending products
        recommendations.put("trending", getTrendingProducts(4));
        
        // New arrivals
        recommendations.put("newArrivals", thriftAIService.getNewArrivals(4));
        
        // Best deals
        recommendations.put("bestDeals", thriftAIService.getBestDealsProducts(4));
        
        // Category-specific recommendations if category provided
        if (category != null && !category.trim().isEmpty()) {
            recommendations.put("bestInCategory", 
                thriftAIService.getBestSellersInCategory(category, 4));
        }
        
        return recommendations;
    }

    // Shopping Cart API Endpoints
    @PostMapping("/api/cart/add")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> addToCart(
            @RequestParam String productId,
            @RequestParam(defaultValue = "1") Integer quantity,
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false) String buyerId,
            jakarta.servlet.http.HttpServletRequest request) {
        
        // Use session ID from request if not provided
        if (sessionId == null) {
            sessionId = request.getSession().getId();
        }
        
        Map<String, Object> response = cartService.quickAddToCart(sessionId, buyerId, productId, quantity);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/cart")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getCart(
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false) String buyerId,
            jakarta.servlet.http.HttpServletRequest request) {
        
        // Use session ID from request if not provided
        if (sessionId == null) {
            sessionId = request.getSession().getId();
        }
        
        Map<String, Object> cartSummary = cartService.getCartSummary(sessionId, buyerId);
        return ResponseEntity.ok(cartSummary);
    }

    @PutMapping("/api/cart/items/{cartItemId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateCartItem(
            @PathVariable String cartItemId,
            @RequestParam Integer quantity,
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false) String buyerId,
            jakarta.servlet.http.HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Use session ID from request if not provided
            if (sessionId == null) {
                sessionId = request.getSession().getId();
            }
            
            cartService.updateCartItemQuantity(sessionId, buyerId, cartItemId, quantity);
            Map<String, Object> cartSummary = cartService.getCartSummary(sessionId, buyerId);
            
            response.put("success", true);
            response.put("message", "Cart item updated successfully");
            response.put("cartSummary", cartSummary);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/api/cart/items/{cartItemId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> removeFromCart(
            @PathVariable String cartItemId,
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false) String buyerId,
            jakarta.servlet.http.HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Use session ID from request if not provided
            if (sessionId == null) {
                sessionId = request.getSession().getId();
            }
            
            cartService.removeFromCart(sessionId, buyerId, cartItemId);
            Map<String, Object> cartSummary = cartService.getCartSummary(sessionId, buyerId);
            
            response.put("success", true);
            response.put("message", "Item removed from cart");
            response.put("cartSummary", cartSummary);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/api/cart/clear")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> clearCart(
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false) String buyerId,
            jakarta.servlet.http.HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Use session ID from request if not provided
            if (sessionId == null) {
                sessionId = request.getSession().getId();
            }
            
            cartService.clearCart(sessionId, buyerId);
            
            response.put("success", true);
            response.put("message", "Cart cleared successfully");
            response.put("cartSummary", Map.of("isEmpty", true, "itemCount", 0, "subtotal", 0.0));
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cart")
    public String cartPage(Model model) {
        return "cart";
    }

    // Review system API endpoints for product detail page
    @GetMapping("/api/products/{productId}/reviews")
    @ResponseBody
    public Map<String, Object> getProductReviews(
            @PathVariable String productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "all") String filter) {
        
        // For now, return mock data since review functionality is already implemented in BuyerController
        // This provides the API endpoint that the frontend expects
        Map<String, Object> response = new HashMap<>();
        
        // Mock review summary
        Map<String, Object> summary = new HashMap<>();
        summary.put("averageRating", 4.3);
        summary.put("totalReviews", 42);
        
        Map<String, Integer> breakdown = new HashMap<>();
        breakdown.put("5", 25);
        breakdown.put("4", 12);
        breakdown.put("3", 3);
        breakdown.put("2", 1);
        breakdown.put("1", 1);
        summary.put("ratingBreakdown", breakdown);
        
        // Mock reviews list (empty for now - redirects to BuyerController)
        response.put("reviews", new ArrayList<>());
        response.put("summary", summary);
        response.put("hasMore", false);
        
        return response;
    }

    @GetMapping("/api/products/{productId}/similar")
    @ResponseBody
    public List<Product> getSimilarProductsForWeb(@PathVariable String productId, @RequestParam(defaultValue = "4") int limit) {
        // Reuse existing similar products functionality
        return getSimilarProducts(productId, limit);
    }

    // === VISUAL SEARCH API ENDPOINTS ===
    
    @GetMapping("/visual-search")
    public String visualSearchPage(Model model) {
        return "visual-search";
    }

    @PostMapping("/api/visual-search/upload")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> searchByImage(@RequestParam("image") MultipartFile image) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (image.isEmpty()) {
                response.put("success", false);
                response.put("error", "No image file provided");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Validate file type
            String contentType = image.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                response.put("success", false);
                response.put("error", "Please upload a valid image file");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Validate file size (max 10MB)
            if (image.getSize() > 10 * 1024 * 1024) {
                response.put("success", false);
                response.put("error", "Image file too large. Maximum size is 10MB");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Search for products using the image
            List<Product> products = visualSearchService.searchByImage(image);
            String description = visualSearchService.describeImage(image);
            Map<String, Object> analysis = visualSearchService.analyzeImage(image);
            
            response.put("success", true);
            response.put("products", products);
            response.put("description", description);
            response.put("analysis", analysis);
            response.put("productCount", products.size());
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error processing image: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/visual-search/analyze")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> analyzeImage(@RequestParam("image") MultipartFile image) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (image.isEmpty()) {
                response.put("success", false);
                response.put("error", "No image file provided");
                return ResponseEntity.badRequest().body(response);
            }
            
            Map<String, Object> analysis = visualSearchService.analyzeImage(image);
            String description = visualSearchService.describeImage(image);
            
            response.put("success", true);
            response.put("analysis", analysis);
            response.put("description", description);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error analyzing image: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/visual-search/similar/{productId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getVisualSimilarProducts(@PathVariable String productId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Product product = thriftAIService.getProductById(productId);
            if (product == null) {
                response.put("success", false);
                response.put("error", "Product not found");
                return ResponseEntity.notFound().build();
            }
            
            List<Product> similarProducts = visualSearchService.findSimilarProducts(product);
            
            response.put("success", true);
            response.put("originalProduct", product);
            response.put("similarProducts", similarProducts);
            response.put("count", similarProducts.size());
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error finding similar products: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    // === EXTERNAL MARKETPLACE API ENDPOINTS ===
    
    @GetMapping("/api/marketplace/search")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> searchMarketplaces(
            @RequestParam String query,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "false") boolean includeLocal) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Search external marketplaces asynchronously
            CompletableFuture<List<Map<String, Object>>> externalResults = 
                externalMarketplaceService.searchAllMarketplaces(query, category, limit)
                    .thenApply(products -> products.stream()
                        .map(product -> {
                            Map<String, Object> productMap = new HashMap<>();
                            productMap.put("id", product.getId());
                            productMap.put("name", product.getName());
                            productMap.put("price", product.getPrice());
                            productMap.put("originalPrice", product.getOriginalPrice());
                            productMap.put("imageUrl", product.getImageUrl());
                            productMap.put("marketplace", product.getMarketplace());
                            productMap.put("condition", product.getCondition());
                            productMap.put("rating", product.getRating());
                            productMap.put("reviewCount", product.getReviewCount());
                            productMap.put("affiliateLink", product.getAffiliateLink());
                            productMap.put("savings", product.getOriginalPrice() - product.getPrice());
                            productMap.put("savingsPercentage", product.getSavingsPercentage());
                            productMap.put("isSponsored", product.isSponsored());
                            productMap.put("popularityScore", product.getPopularityScore());
                            return productMap;
                        })
                        .toList());
            
            // Get local products if requested
            List<Product> localProducts = new ArrayList<>();
            if (includeLocal) {
                localProducts = thriftAIService.searchProducts(query, category)
                    .stream()
                    .limit(limit / 2)
                    .toList();
            }
            
            // Wait for external results with timeout
            List<Map<String, Object>> externalProductMaps = externalResults.get(5, TimeUnit.SECONDS);
            
            response.put("success", true);
            response.put("query", query);
            response.put("category", category);
            response.put("externalProducts", externalProductMaps);
            response.put("localProducts", localProducts);
            response.put("totalResults", externalProductMaps.size() + localProducts.size());
            response.put("hasExternalResults", !externalProductMaps.isEmpty());
            response.put("hasLocalResults", !localProducts.isEmpty());
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error searching marketplaces: " + e.getMessage());
            response.put("externalProducts", new ArrayList<>());
            response.put("localProducts", new ArrayList<>());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/marketplace/price-compare/{productId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> comparePrices(@PathVariable String productId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Product localProduct = thriftAIService.getProductById(productId);
            if (localProduct == null) {
                response.put("success", false);
                response.put("error", "Product not found");
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> comparison = priceComparisonService.compareProductPrices(localProduct);
            
            response.put("success", true);
            response.put("localProduct", localProduct);
            response.put("comparison", comparison);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error comparing prices: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/marketplace/trending")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getTrendingMarketplaceProducts(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "15") int limit) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            CompletableFuture<List<Map<String, Object>>> trendingResults =
                externalMarketplaceService.getTrendingProductsAsync(category, limit)
                    .thenApply(result -> {
                        @SuppressWarnings("unchecked")
                        List<ExternalProduct> products = (List<ExternalProduct>) result.get("products");
                        if (products == null) return new ArrayList<>();
                        return products.stream()
                        .map(product -> {
                            Map<String, Object> productMap = new HashMap<>();
                            productMap.put("id", product.getId());
                            productMap.put("name", product.getName());
                            productMap.put("price", product.getPrice());
                            productMap.put("originalPrice", product.getOriginalPrice());
                            productMap.put("imageUrl", product.getImageUrl());
                            productMap.put("marketplace", product.getMarketplace());
                            productMap.put("rating", product.getRating());
                            productMap.put("reviewCount", product.getReviewCount());
                            productMap.put("affiliateLink", product.getAffiliateLink());
                            productMap.put("savingsPercentage", product.getSavingsPercentage());
                            productMap.put("popularityScore", product.getPopularityScore());
                            productMap.put("trendingReason", product.getTrendingReason());
                            return productMap;
                        })
                        .toList();
                    });
            
            List<Map<String, Object>> trending = trendingResults.get(5, TimeUnit.SECONDS);
            
            response.put("success", true);
            response.put("category", category);
            response.put("trendingProducts", trending);
            response.put("count", trending.size());
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error getting trending products: " + e.getMessage());
            response.put("trendingProducts", new ArrayList<>());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/marketplace/best-deals")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getBestMarketplaceDeals(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "12") int limit,
            @RequestParam(defaultValue = "30") double minSavingsPercentage) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Map<String, Object>> bestDeals = externalMarketplaceService.getBestDeals(category, limit, minSavingsPercentage)
                .get().stream()
                .map(product -> {
                    Map<String, Object> dealMap = new HashMap<>();
                    dealMap.put("id", product.getId());
                    dealMap.put("name", product.getName());
                    dealMap.put("price", product.getPrice());
                    dealMap.put("originalPrice", product.getOriginalPrice());
                    dealMap.put("imageUrl", product.getImageUrl());
                    dealMap.put("marketplace", product.getMarketplace());
                    dealMap.put("condition", product.getCondition());
                    dealMap.put("rating", product.getRating());
                    dealMap.put("affiliateLink", product.getAffiliateLink());
                    dealMap.put("savings", product.getOriginalPrice() - product.getPrice());
                    dealMap.put("savingsPercentage", product.getSavingsPercentage());
                    dealMap.put("dealQuality", product.getDealQuality());
                    dealMap.put("timeLeft", product.getTimeLeft());
                    return dealMap;
                })
                .toList();
            
            response.put("success", true);
            response.put("category", category);
            response.put("bestDeals", bestDeals);
            response.put("count", bestDeals.size());
            response.put("minSavingsPercentage", minSavingsPercentage);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error getting best deals: " + e.getMessage());
            response.put("bestDeals", new ArrayList<>());
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/marketplace/track-click")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> trackAffiliateClick(
            @RequestParam String productId,
            @RequestParam String marketplace,
            @RequestParam String affiliateLink,
            jakarta.servlet.http.HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String sessionId = request.getSession().getId();
            String userAgent = request.getHeader("User-Agent");
            String referrer = request.getHeader("Referer");
            
            externalMarketplaceService.trackAffiliateClick(productId, marketplace, affiliateLink, sessionId, userAgent, referrer);
            
            response.put("success", true);
            response.put("message", "Click tracked successfully");
            response.put("redirectUrl", affiliateLink);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error tracking click: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/marketplace/similar-deals/{productId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getSimilarDeals(
            @PathVariable String productId,
            @RequestParam(defaultValue = "8") int limit) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Product localProduct = thriftAIService.getProductById(productId);
            if (localProduct == null) {
                response.put("success", false);
                response.put("error", "Product not found");
                return ResponseEntity.notFound().build();
            }
            
            CompletableFuture<List<Map<String, Object>>> similarDeals = 
                externalMarketplaceService.findSimilarDeals(localProduct, limit)
                    .thenApply(products -> products.stream()
                        .map(product -> {
                            Map<String, Object> dealMap = new HashMap<>();
                            dealMap.put("id", product.getId());
                            dealMap.put("name", product.getName());
                            dealMap.put("price", product.getPrice());
                            dealMap.put("originalPrice", product.getOriginalPrice());
                            dealMap.put("imageUrl", product.getImageUrl());
                            dealMap.put("marketplace", product.getMarketplace());
                            dealMap.put("condition", product.getCondition());
                            dealMap.put("affiliateLink", product.getAffiliateLink());
                            dealMap.put("savingsPercentage", product.getSavingsPercentage());
                            dealMap.put("similarityScore", product.getSimilarityScore());
                            return dealMap;
                        })
                        .toList());
            
            List<Map<String, Object>> deals = similarDeals.get(5, TimeUnit.SECONDS);
            
            response.put("success", true);
            response.put("originalProduct", localProduct);
            response.put("similarDeals", deals);
            response.put("count", deals.size());
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error finding similar deals: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/marketplace/commission-stats")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getCommissionStats(
            @RequestParam(required = false) String timeframe) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> stats = externalMarketplaceService.getCommissionStats(timeframe);
            
            response.put("success", true);
            response.put("timeframe", timeframe != null ? timeframe : "all");
            response.put("stats", stats);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error getting commission stats: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    // === LOCATION-BASED API ENDPOINTS ===
    
    @GetMapping("/api/location/detect")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> detectUserLocation(HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocationData userLocation = locationService.getUserLocation(request);
            
            response.put("success", true);
            response.put("location", Map.of(
                "latitude", userLocation.getLatitude(),
                "longitude", userLocation.getLongitude(),
                "city", userLocation.getCity(),
                "state", userLocation.getState(),
                "country", userLocation.getCountry(),
                "zipCode", userLocation.getZipCode(),
                "timezone", userLocation.getTimezone(),
                "source", userLocation.getSource()
            ));
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Unable to detect location");
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/location/nearby-products")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getNearbyProducts(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(defaultValue = "25") double radiusMiles,
            @RequestParam(defaultValue = "20") int limit,
            HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocationData userLocation;
            if (latitude != null && longitude != null) {
                userLocation = locationService.getLocationFromCoordinates(latitude, longitude);
            } else {
                userLocation = locationService.getUserLocation(request);
            }
            
            List<Product> nearbyProducts = locationService.getProductsNearLocation(userLocation, radiusMiles, limit);
            
            response.put("success", true);
            response.put("userLocation", Map.of(
                "city", userLocation.getCity(),
                "state", userLocation.getState(),
                "latitude", userLocation.getLatitude(),
                "longitude", userLocation.getLongitude()
            ));
            response.put("radiusMiles", radiusMiles);
            response.put("products", nearbyProducts);
            response.put("count", nearbyProducts.size());
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Unable to find nearby products: " + e.getMessage());
            response.put("products", new ArrayList<>());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/location/nearby-sellers")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getNearbySellers(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(defaultValue = "50") double radiusMiles,
            @RequestParam(defaultValue = "15") int limit,
            HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocationData userLocation;
            if (latitude != null && longitude != null) {
                userLocation = locationService.getLocationFromCoordinates(latitude, longitude);
            } else {
                userLocation = locationService.getUserLocation(request);
            }
            
            List<Seller> nearbySellers = locationService.getNearbysellers(userLocation, radiusMiles, limit);
            
            response.put("success", true);
            response.put("userLocation", Map.of(
                "city", userLocation.getCity(),
                "state", userLocation.getState()
            ));
            response.put("radiusMiles", radiusMiles);
            response.put("sellers", nearbySellers);
            response.put("count", nearbySellers.size());
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Unable to find nearby sellers: " + e.getMessage());
            response.put("sellers", new ArrayList<>());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/location/shipping-cost")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> calculateShipping(
            @RequestParam String productId,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(defaultValue = "1.0") double weight,
            @RequestParam(required = false) String serviceLevel,
            HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Product product = thriftAIService.getProductById(productId);
            if (product == null) {
                response.put("success", false);
                response.put("error", "Product not found");
                return ResponseEntity.notFound().build();
            }
            
            LocationData userLocation;
            if (latitude != null && longitude != null) {
                userLocation = locationService.getLocationFromCoordinates(latitude, longitude);
            } else {
                userLocation = locationService.getUserLocation(request);
            }
            
            // Get seller location
            Seller seller = product.getSeller();
            if (seller == null) {
                response.put("success", false);
                response.put("error", "Seller information not available");
                return ResponseEntity.ok(response);
            }
            
            LocationData sellerLocation = getSellerLocationHelper(seller);
            Map<String, Object> shippingInfo = locationService.calculateShippingCost(
                sellerLocation, userLocation, weight, serviceLevel);
            
            response.put("success", true);
            response.put("product", Map.of(
                "id", product.getId(),
                "name", product.getName(),
                "price", product.getPrice()
            ));
            response.put("shipping", shippingInfo);
            response.put("from", Map.of(
                "city", sellerLocation.getCity(),
                "state", sellerLocation.getState()
            ));
            response.put("to", Map.of(
                "city", userLocation.getCity(),
                "state", userLocation.getState()
            ));
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Unable to calculate shipping: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/location/regional-trends")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getRegionalTrends(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocationData userLocation;
            if (latitude != null && longitude != null) {
                userLocation = locationService.getLocationFromCoordinates(latitude, longitude);
            } else {
                userLocation = locationService.getUserLocation(request);
            }
            
            List<String> trends = locationService.getRegionalTrends(userLocation);
            
            response.put("success", true);
            response.put("location", Map.of(
                "city", userLocation.getCity(),
                "state", userLocation.getState(),
                "region", userLocation.getState() // Could be enhanced with region mapping
            ));
            response.put("trends", trends);
            response.put("count", trends.size());
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Unable to get regional trends: " + e.getMessage());
            response.put("trends", new ArrayList<>());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/location/analytics")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getLocationAnalytics(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(defaultValue = "7d") String timeframe,
            HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocationData userLocation;
            if (latitude != null && longitude != null) {
                userLocation = locationService.getLocationFromCoordinates(latitude, longitude);
            } else {
                userLocation = locationService.getUserLocation(request);
            }
            
            Map<String, Object> analytics = locationService.getLocationAnalytics(userLocation, timeframe);
            
            response.put("success", true);
            response.put("analytics", analytics);
            response.put("timeframe", timeframe);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Unable to get location analytics: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/location/pickup-locations")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getPickupLocations(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(defaultValue = "10") double radiusMiles,
            HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocationData userLocation;
            if (latitude != null && longitude != null) {
                userLocation = locationService.getLocationFromCoordinates(latitude, longitude);
            } else {
                userLocation = locationService.getUserLocation(request);
            }
            
            List<Map<String, Object>> pickupLocations = locationService.getPickupLocations(userLocation, radiusMiles);
            
            response.put("success", true);
            response.put("userLocation", Map.of(
                "city", userLocation.getCity(),
                "state", userLocation.getState(),
                "latitude", userLocation.getLatitude(),
                "longitude", userLocation.getLongitude()
            ));
            response.put("radiusMiles", radiusMiles);
            response.put("pickupLocations", pickupLocations);
            response.put("count", pickupLocations.size());
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Unable to find pickup locations: " + e.getMessage());
            response.put("pickupLocations", new ArrayList<>());
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/location/update")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateUserLocation(
            @RequestParam double latitude,
            @RequestParam double longitude) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocationData location = locationService.getLocationFromCoordinates(latitude, longitude);
            
            response.put("success", true);
            response.put("location", Map.of(
                "latitude", location.getLatitude(),
                "longitude", location.getLongitude(),
                "city", location.getCity(),
                "state", location.getState(),
                "country", location.getCountry(),
                "source", "gps"
            ));
            response.put("message", "Location updated successfully");
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Unable to update location: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/location/distance")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> calculateDistance(
            @RequestParam double fromLat,
            @RequestParam double fromLon,
            @RequestParam double toLat,
            @RequestParam double toLon) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocationData from = locationService.getLocationFromCoordinates(fromLat, fromLon);
            LocationData to = locationService.getLocationFromCoordinates(toLat, toLon);
            
            // Use the Haversine formula from LocationService
            double distance = calculateDistanceInMiles(fromLat, fromLon, toLat, toLon);
            
            response.put("success", true);
            response.put("from", Map.of(
                "latitude", from.getLatitude(),
                "longitude", from.getLongitude(),
                "city", from.getCity(),
                "state", from.getState()
            ));
            response.put("to", Map.of(
                "latitude", to.getLatitude(),
                "longitude", to.getLongitude(),
                "city", to.getCity(),
                "state", to.getState()
            ));
            response.put("distance", Math.round(distance * 100.0) / 100.0);
            response.put("unit", "miles");
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Unable to calculate distance: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    // Helper method for distance calculation
    private double calculateDistanceInMiles(double lat1, double lon1, double lat2, double lon2) {
        final int R = 3959; // Earth's radius in miles
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    // Helper method to get seller location data
    private LocationData getSellerLocationHelper(Seller seller) {
        LocationData location = new LocationData();
        
        if (seller.getCity() != null && seller.getState() != null) {
            location.setCity(seller.getCity());
            location.setState(seller.getState());
            location.setLatitude(40.7128 + (Math.random() - 0.5) * 0.1);
            location.setLongitude(-74.0060 + (Math.random() - 0.5) * 0.1);
        } else {
            location.setCity("New York");
            location.setState("New York");
            location.setLatitude(40.7128);
            location.setLongitude(-74.0060);
        }
        
        location.setCountry("United States");
        location.setSource("seller");
        return location;
    }
}
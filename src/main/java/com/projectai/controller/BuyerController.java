package com.projectai.controller;

import com.projectai.models.Buyer;
import com.projectai.models.Product;
import com.projectai.repository.BuyerRepository;
import com.projectai.repository.ProductRepository;
import com.projectai.service.ChatGPTService;
import com.projectai.service.VisualSearchService;
import com.projectai.service.PriceComparisonService;
import com.projectai.service.ThriftAIService;
import com.projectai.service.OrderService;
import com.projectai.service.ReviewService;
import com.projectai.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Controller
@RequestMapping("/buyers")
public class BuyerController {

    @Autowired
    private BuyerRepository buyerRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private ChatGPTService chatGPTService;
    
    @Autowired
    private VisualSearchService visualSearchService;
    
    @Autowired
    private PriceComparisonService priceComparisonService;
    
    @Autowired
    private ThriftAIService thriftAIService;
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private ReviewService reviewService;
    
    @Autowired
    private CartService cartService;
    
    // Add API endpoint for filter options
    @GetMapping("/api/filter-options")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> getFilterOptions(
            @RequestParam(required = false) String category) {
        try {
            java.util.Map<String, Object> options = new java.util.HashMap<>();
            
            // Get all available filter options
            options.put("categories", productRepository.findDistinctCategories());
            options.put("brands", category != null ? 
                productRepository.findDistinctBrandsByCategory(category) : 
                productRepository.findAllAvailableBrands());
            options.put("conditions", productRepository.findDistinctConditions());
            options.put("sizes", category != null ? 
                productRepository.findDistinctSizesByCategory(category) : 
                productRepository.findDistinctSizes());
                
            // Get price range
            Double minPrice = category != null ? 
                productRepository.findMinPriceByCategory(category) : 
                productRepository.findMinPrice();
            Double maxPrice = category != null ? 
                productRepository.findMaxPriceByCategory(category) : 
                productRepository.findMaxPrice();
                
            options.put("priceRange", java.util.Map.of(
                "min", minPrice != null ? minPrice : 0.0,
                "max", maxPrice != null ? maxPrice : 1000.0
            ));
            
            return ResponseEntity.ok(options);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Failed to load filter options: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping
    public String buyersHome(Model model) {
        // Redirect to search page since buyers page is removed
        return "redirect:/buyers/search";
    }

    @GetMapping("/register")
    public String showRegistrationForm(Model model) {
        model.addAttribute("buyer", new Buyer());
        return "buyers/register";
    }

    @PostMapping("/register")
    public String registerBuyer(@Valid @ModelAttribute("buyer") Buyer buyer, 
                              BindingResult result, 
                              RedirectAttributes redirectAttributes, 
                              Model model) {
        
        if (result.hasErrors()) {
            return "buyers/register";
        }
        
        // Check if email already exists
        Optional<Buyer> existingBuyer = buyerRepository.findByEmail(buyer.getEmail());
        if (existingBuyer.isPresent()) {
            result.rejectValue("email", "error.buyer", "Email already registered");
            return "buyers/register";
        }
        
        try {
            buyerRepository.save(buyer);
            redirectAttributes.addFlashAttribute("successMessage", 
                "Registration successful! Welcome to ThriftAI!");
            return "redirect:/buyers/dashboard/" + buyer.getId();
        } catch (Exception e) {
            result.rejectValue("email", "error.buyer", "Registration failed. Please try again.");
            return "buyers/register";
        }
    }

    @GetMapping("/dashboard/{buyerId}")
    public String buyerDashboard(@PathVariable String buyerId, Model model) {
        Optional<Buyer> buyerOpt = buyerRepository.findById(buyerId);
        
        if (buyerOpt.isEmpty()) {
            return "redirect:/buyers?error=buyer-not-found";
        }
        
        Buyer buyer = buyerOpt.get();
        model.addAttribute("buyer", buyer);
        model.addAttribute("user", buyer); // For the dashboard template
        
        // Update last login
        buyer.setLastLoginAt(LocalDateTime.now());
        buyerRepository.save(buyer);
        
        return "dashboard";
    }

    @GetMapping("/dashboard")
    public String generalDashboard(Model model) {
        // General dashboard without specific user (demo mode)
        model.addAttribute("user", null);
        return "dashboard";
    }

    @GetMapping("/profile/{buyerId}")
    public String buyerProfile(@PathVariable String buyerId, Model model) {
        Optional<Buyer> buyerOpt = buyerRepository.findById(buyerId);
        
        if (buyerOpt.isEmpty()) {
            return "redirect:/buyers?error=buyer-not-found";
        }
        
        model.addAttribute("buyer", buyerOpt.get());
        return "buyers/profile";
    }

    @GetMapping("/edit/{buyerId}")
    public String editBuyerForm(@PathVariable String buyerId, Model model) {
        Optional<Buyer> buyerOpt = buyerRepository.findById(buyerId);
        
        if (buyerOpt.isEmpty()) {
            return "redirect:/buyers?error=buyer-not-found";
        }
        
        model.addAttribute("buyer", buyerOpt.get());
        return "buyers/edit";
    }

    @PostMapping("/edit/{buyerId}")
    public String updateBuyer(@PathVariable String buyerId,
                            @Valid @ModelAttribute("buyer") Buyer buyer,
                            BindingResult result,
                            RedirectAttributes redirectAttributes) {
        
        if (result.hasErrors()) {
            return "buyers/edit";
        }
        
        try {
            buyer.setId(buyerId);
            buyerRepository.save(buyer);
            redirectAttributes.addFlashAttribute("successMessage", "Profile updated successfully!");
            return "redirect:/buyers/profile/" + buyerId;
        } catch (Exception e) {
            result.rejectValue("email", "error.buyer", "Update failed. Please try again.");
            return "buyers/edit";
        }
    }

    @GetMapping("/preferences/{buyerId}")
    public String buyerPreferences(@PathVariable String buyerId, Model model) {
        Optional<Buyer> buyerOpt = buyerRepository.findById(buyerId);
        
        if (buyerOpt.isEmpty()) {
            return "redirect:/buyers?error=buyer-not-found";
        }
        
        model.addAttribute("buyer", buyerOpt.get());
        return "buyers/preferences";
    }

    @PostMapping("/preferences/{buyerId}")
    public String updatePreferences(@PathVariable String buyerId,
                                  @RequestParam(required = false) List<String> preferredCategories,
                                  @RequestParam(required = false) List<String> preferredBrands,
                                  @RequestParam(required = false) List<String> preferredSizes,
                                  @RequestParam double maxBudget,
                                  @RequestParam double minDiscountThreshold,
                                  @RequestParam(defaultValue = "false") boolean receiveNewsletters,
                                  @RequestParam(defaultValue = "false") boolean receiveDeals,
                                  @RequestParam(defaultValue = "false") boolean receiveSms,
                                  @RequestParam String notificationFrequency,
                                  RedirectAttributes redirectAttributes) {
        
        Optional<Buyer> buyerOpt = buyerRepository.findById(buyerId);
        
        if (buyerOpt.isEmpty()) {
            return "redirect:/buyers?error=buyer-not-found";
        }
        
        Buyer buyer = buyerOpt.get();
        
        // Update preferences
        buyer.setPreferredCategories(preferredCategories != null ? preferredCategories : List.of());
        buyer.setPreferredBrands(preferredBrands != null ? preferredBrands : List.of());
        buyer.setPreferredSizes(preferredSizes != null ? preferredSizes : List.of());
        buyer.setMaxBudget(maxBudget);
        buyer.setMinDiscountThreshold(minDiscountThreshold);
        buyer.setReceiveNewsletters(receiveNewsletters);
        buyer.setReceiveDeals(receiveDeals);
        buyer.setReceiveSms(receiveSms);
        
        try {
            Buyer.NotificationFrequency freq = Buyer.NotificationFrequency.valueOf(notificationFrequency.toUpperCase());
            buyer.setNotificationFrequency(freq);
        } catch (IllegalArgumentException e) {
            buyer.setNotificationFrequency(Buyer.NotificationFrequency.WEEKLY);
        }
        
        buyerRepository.save(buyer);
        redirectAttributes.addFlashAttribute("successMessage", "Preferences updated successfully!");
        
        return "redirect:/buyers/dashboard/" + buyerId;
    }

    @GetMapping("/directory")
    public String buyerDirectory(@RequestParam(required = false) String search,
                               @RequestParam(required = false) String city,
                               @RequestParam(required = false) String buyerType,
                               Model model) {
        
        List<Buyer> buyers;
        
        if (search != null && !search.trim().isEmpty()) {
            buyers = buyerRepository.searchBuyers(search.trim());
        } else if (city != null && !city.trim().isEmpty()) {
            buyers = buyerRepository.findByCityIgnoreCase(city.trim());
        } else if (buyerType != null && !buyerType.trim().isEmpty()) {
            try {
                Buyer.BuyerType type = Buyer.BuyerType.valueOf(buyerType.toUpperCase());
                buyers = buyerRepository.findByBuyerType(type);
            } catch (IllegalArgumentException e) {
                buyers = buyerRepository.findByIsActiveTrue();
            }
        } else {
            buyers = buyerRepository.findByIsActiveTrue();
        }
        
        model.addAttribute("buyers", buyers);
        model.addAttribute("search", search);
        model.addAttribute("city", city);
        model.addAttribute("buyerType", buyerType);
        model.addAttribute("buyerTypes", Buyer.BuyerType.values());
        
        return "buyers/directory";
    }

    @GetMapping("/analytics")
    public String buyerAnalytics(Model model) {
        model.addAttribute("totalBuyers", buyerRepository.count());
        model.addAttribute("activeBuyers", buyerRepository.countActiveBuyers());
        model.addAttribute("verifiedBuyers", buyerRepository.countVerifiedBuyers());
        
        // Get recent buyers (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Buyer> recentBuyers = buyerRepository.findNewBuyers(thirtyDaysAgo);
        model.addAttribute("recentBuyersCount", recentBuyers.size());
        
        // Get top buyers
        List<Buyer> topBuyers = buyerRepository.findTopLoyaltyCustomers(100.0).stream().limit(10).toList();
        model.addAttribute("topBuyers", topBuyers);
        
        // Get buyer type distribution
        List<Object[]> buyerTypeStats = buyerRepository.countByBuyerType();
        model.addAttribute("buyerTypeStats", buyerTypeStats);
        
        // Get city distribution
        List<Object[]> cityStats = buyerRepository.countByCity();
        model.addAttribute("cityStats", cityStats);
        
        // Get spending stats
        Double averageSpending = buyerRepository.getAverageSpending();
        Double averageOrderValue = buyerRepository.getAverageOrderValue();
        model.addAttribute("averageSpending", averageSpending != null ? averageSpending : 0.0);
        model.addAttribute("averageOrderValue", averageOrderValue != null ? averageOrderValue : 0.0);
        
        return "buyers/analytics";
    }

    @GetMapping("/wishlist/{buyerId}")
    public String buyerWishlist(@PathVariable String buyerId, Model model) {
        Optional<Buyer> buyerOpt = buyerRepository.findById(buyerId);
        
        if (buyerOpt.isEmpty()) {
            return "redirect:/buyers?error=buyer-not-found";
        }
        
        model.addAttribute("buyer", buyerOpt.get());
        // TODO: Add wishlist items when Product-Buyer relationship is implemented
        
        return "buyers/wishlist";
    }

    @GetMapping("/orders/{buyerId}")
    public String buyerOrders(@PathVariable String buyerId, Model model) {
        Optional<Buyer> buyerOpt = buyerRepository.findById(buyerId);
        
        if (buyerOpt.isEmpty()) {
            return "redirect:/buyers?error=buyer-not-found";
        }
        
        model.addAttribute("buyer", buyerOpt.get());
        // TODO: Add order history when Order model is implemented
        
        return "buyers/orders";
    }

    @GetMapping("/search-page")
    public String searchPage(Model model) {
        model.addAttribute("pageTitle", "Smart Product Search");
        
        // Get some featured products for buyers
        List<Product> featuredProducts = productRepository.findAll().stream()
                .filter(Product::isAvailable)
                .limit(8)
                .toList();
        model.addAttribute("featuredProducts", featuredProducts);
        
        // Add filter options for Amazon-like experience
        model.addAttribute("categories", thriftAIService.getAllCategories());
        model.addAttribute("brands", thriftAIService.getAllBrands());
        model.addAttribute("sizes", thriftAIService.getAllSizes());
        model.addAttribute("conditions", thriftAIService.getAllConditions());
        model.addAttribute("priceRange", thriftAIService.getPriceRange());
        
        return "standalone-search";
    }

    @PostMapping("/api/chat-search")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> chatSearch(@RequestBody java.util.Map<String, String> request) {
        String query = request.get("query");
        
        try {
            // Use ChatGPT to understand the query and find relevant products
            String enhancedQuery = chatGPTService.enhanceSearchQuery(query);
            List<Product> products = chatGPTService.searchProducts(enhancedQuery);
            
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("products", products);
            response.put("enhancedQuery", enhancedQuery);
            response.put("chatResponse", chatGPTService.generateSearchResponse(query, products));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Search failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/api/visual-search")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> visualSearch(@RequestParam("image") MultipartFile image) {
        try {
            // Process image and find similar products
            List<Product> products = visualSearchService.searchByImage(image);
            String description = visualSearchService.describeImage(image);
            
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("products", products);
            response.put("description", description);
            response.put("imageAnalysis", visualSearchService.analyzeImage(image));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Visual search failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/api/advanced-search")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> advancedSearch(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice) {
        
        try {
            List<Product> products = thriftAIService.searchProductsWithFilters(
                query, category, brand, condition, size, minPrice, maxPrice);
            
            long totalCount = thriftAIService.countProductsWithFilters(
                query, category, brand, condition, size, minPrice, maxPrice);
            
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("products", products);
            response.put("totalCount", totalCount);
            response.put("filters", java.util.Map.of(
                "query", query != null ? query : "",
                "category", category != null ? category : "",
                "brand", brand != null ? brand : "",
                "condition", condition != null ? condition : "",
                "size", size != null ? size : "",
                "minPrice", minPrice != null ? minPrice : 0,
                "maxPrice", maxPrice != null ? maxPrice : 0
            ));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Advanced search failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/api/price-comparison/{productId}")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> getPriceComparison(@PathVariable String productId) {
        try {
            Product product = productRepository.findById(productId).orElse(null);
            if (product == null) {
                java.util.Map<String, Object> error = new java.util.HashMap<>();
                error.put("error", "Product not found");
                return ResponseEntity.notFound().build();
            }
            
            java.util.Map<String, Object> comparison = priceComparisonService.comparePrice(product);
            return ResponseEntity.ok(comparison);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Price comparison failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/api/price-comparison/{productId}/real-time")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> getRealTimePriceUpdate(@PathVariable String productId) {
        try {
            Product product = productRepository.findById(productId).orElse(null);
            if (product == null) {
                return ResponseEntity.notFound().build();
            }
            
            java.util.Map<String, Object> update = priceComparisonService.getRealTimePriceUpdate(product);
            return ResponseEntity.ok(update);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Real-time price update failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/api/price-comparison/{productId}/competitor-analysis")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> getCompetitorAnalysis(@PathVariable String productId) {
        try {
            Product product = productRepository.findById(productId).orElse(null);
            if (product == null) {
                return ResponseEntity.notFound().build();
            }
            
            java.util.Map<String, Object> analysis = priceComparisonService.getCompetitorAnalysis(product);
            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Competitor analysis failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/api/price-comparison/{productId}/history")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> getPriceHistory(@PathVariable String productId) {
        try {
            Product product = productRepository.findById(productId).orElse(null);
            if (product == null) {
                return ResponseEntity.notFound().build();
            }
            
            java.util.Map<String, Object> history = priceComparisonService.getPriceHistory(product);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Price history failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/api/price-alerts")
    @ResponseBody
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> getPriceAlerts(
            @RequestParam(required = false) String userId) {
        try {
            java.util.List<java.util.Map<String, Object>> alerts = priceComparisonService.getPriceAlerts(userId);
            return ResponseEntity.ok(alerts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/api/market-trends/{category}")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> getMarketTrends(@PathVariable String category) {
        try {
            java.util.Map<String, Object> trends = priceComparisonService.getMarketTrends(category);
            return ResponseEntity.ok(trends);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Market trends failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/api/recommendations")
    @ResponseBody
    public ResponseEntity<List<Product>> getRecommendations(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "10") int limit) {
        
        try {
            List<Product> recommendations = productRepository.findAll().stream()
                    .filter(Product::isAvailable)
                    .filter(p -> category == null || category.equals(p.getCategory()))
                    .filter(p -> maxPrice == null || p.getPrice() <= maxPrice)
                    .limit(limit)
                    .toList();
                    
            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/api/similar-products/{productId}")
    @ResponseBody
    public ResponseEntity<List<Product>> getSimilarProducts(@PathVariable String productId) {
        try {
            Product product = productRepository.findById(productId).orElse(null);
            if (product == null) {
                return ResponseEntity.notFound().build();
            }
            
            List<Product> similarProducts = thriftAIService.findSimilarProducts(product);
            return ResponseEntity.ok(similarProducts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/products/{productId}")
    public String productDetail(@PathVariable String productId, Model model) {
        Optional<Product> productOpt = productRepository.findById(productId);
        
        if (productOpt.isEmpty()) {
            return "redirect:/buyers/search?error=product-not-found";
        }
        
        model.addAttribute("product", productOpt.get());
        return "product-detail";
    }

    // Review System API Endpoints
    @GetMapping("/api/products/{productId}/reviews")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> getProductReviews(
            @PathVariable String productId,
            @RequestParam(defaultValue = "recent") String sortBy) {
        try {
            List<com.projectai.models.Review> reviews;
            
            switch (sortBy.toLowerCase()) {
                case "helpful" -> reviews = reviewService.getProductReviewsSortedByHelpfulness(productId);
                case "verified" -> reviews = reviewService.getVerifiedPurchaseReviews(productId);
                case "photos" -> reviews = reviewService.getReviewsWithPhotos(productId);
                default -> reviews = reviewService.getProductReviews(productId);
            }
            
            java.util.Map<String, Object> reviewStats = reviewService.getProductReviewStats(productId);
            
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("reviews", reviews);
            response.put("stats", reviewStats);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Failed to load reviews: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/api/products/{productId}/reviews")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> createReview(
            @PathVariable String productId,
            @RequestParam String buyerId,
            @RequestParam Integer rating,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) Integer conditionRating,
            @RequestParam(required = false) Integer valueRating,
            @RequestParam(required = false) Integer sellerRating) {
        try {
            com.projectai.models.Review review;
            
            if (conditionRating != null && valueRating != null && sellerRating != null) {
                review = reviewService.createDetailedReview(productId, buyerId, rating, title, content,
                        conditionRating, valueRating, sellerRating);
            } else {
                review = reviewService.createReview(productId, buyerId, rating, title, content);
            }
            
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("review", review);
            response.put("message", "Review submitted successfully and is pending approval");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Failed to create review: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/api/reviews/{reviewId}/helpful")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> markReviewHelpful(@PathVariable String reviewId) {
        try {
            com.projectai.models.Review review = reviewService.markReviewHelpful(reviewId);
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("helpfulVotes", review.getHelpfulVotes());
            response.put("message", "Review marked as helpful");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Failed to mark review as helpful: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/api/reviews/{reviewId}/unhelpful")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> markReviewUnhelpful(@PathVariable String reviewId) {
        try {
            com.projectai.models.Review review = reviewService.markReviewUnhelpful(reviewId);
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("unhelpfulVotes", review.getUnhelpfulVotes());
            response.put("message", "Review marked as unhelpful");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Failed to mark review as unhelpful: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/api/buyers/{buyerId}/reviews")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> getBuyerReviews(@PathVariable String buyerId) {
        try {
            List<com.projectai.models.Review> reviews = reviewService.getBuyerReviews(buyerId);
            java.util.Map<String, Object> stats = reviewService.getBuyerReviewStats(buyerId);
            
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("reviews", reviews);
            response.put("stats", stats);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Failed to load buyer reviews: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/api/reviews/search")
    @ResponseBody
    public ResponseEntity<List<com.projectai.models.Review>> searchReviews(
            @RequestParam String productId,
            @RequestParam String query) {
        try {
            List<com.projectai.models.Review> reviews = reviewService.searchProductReviews(productId, query);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/api/reviews/filter")
    @ResponseBody
    public ResponseEntity<List<com.projectai.models.Review>> filterReviewsByRating(
            @RequestParam String productId,
            @RequestParam(defaultValue = "1") Integer minRating,
            @RequestParam(defaultValue = "5") Integer maxRating) {
        try {
            List<com.projectai.models.Review> reviews = reviewService.filterProductReviewsByRating(
                    productId, minRating, maxRating);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/search")
    public String searchResults(@RequestParam(value = "q", required = false) String query, Model model) {
        try {
            List<Product> searchResults;
            if (query == null || query.trim().isEmpty()) {
                // Show all available products when no query is provided
                searchResults = thriftAIService.getAllAvailableProducts();
                query = ""; // Set empty string for template
            } else {
                searchResults = thriftAIService.searchProducts(query, null);
            }
            
            model.addAttribute("query", query);
            model.addAttribute("products", searchResults);
            model.addAttribute("resultCount", searchResults.size());
            
            return "search-results";
        } catch (Exception e) {
            model.addAttribute("query", query);
            model.addAttribute("products", java.util.Collections.emptyList());
            model.addAttribute("resultCount", 0);
            model.addAttribute("error", "Search failed. Please try again.");
            return "search-results";
        }
    }
    
    // Shopping Cart API Endpoints
    @PostMapping("/api/cart/add")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> addToCart(
            @RequestParam String productId,
            @RequestParam(defaultValue = "1") Integer quantity,
            HttpSession session) {
        try {
            String sessionId = session.getId();
            String buyerId = (String) session.getAttribute("buyerId");
            
            Map<String, Object> response = cartService.quickAddToCart(sessionId, buyerId, productId, quantity);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/api/cart")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getCart(HttpSession session) {
        try {
            String sessionId = session.getId();
            String buyerId = (String) session.getAttribute("buyerId");
            
            Map<String, Object> cartSummary = cartService.getCartSummary(sessionId, buyerId);
            return ResponseEntity.ok(cartSummary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/api/cart/item/{itemId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateCartItem(
            @PathVariable String itemId,
            @RequestParam Integer quantity,
            HttpSession session) {
        try {
            String sessionId = session.getId();
            String buyerId = (String) session.getAttribute("buyerId");
            
            cartService.updateCartItemQuantity(sessionId, buyerId, itemId, quantity);
            Map<String, Object> cartSummary = cartService.getCartSummary(sessionId, buyerId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("cartSummary", cartSummary);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @DeleteMapping("/api/cart/item/{itemId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> removeFromCart(
            @PathVariable String itemId,
            HttpSession session) {
        try {
            String sessionId = session.getId();
            String buyerId = (String) session.getAttribute("buyerId");
            
            cartService.removeFromCart(sessionId, buyerId, itemId);
            Map<String, Object> cartSummary = cartService.getCartSummary(sessionId, buyerId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("cartSummary", cartSummary);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/cart")
    public String viewCart(HttpSession session, Model model) {
        String sessionId = session.getId();
        String buyerId = (String) session.getAttribute("buyerId");
        
        Map<String, Object> cartSummary = cartService.getCartSummary(sessionId, buyerId);
        List<Product> recommendations = cartService.getCartBasedRecommendations(sessionId, buyerId, 8);
        
        model.addAttribute("cartSummary", cartSummary);
        model.addAttribute("recommendations", recommendations);
        
        return "cart";
    }
    
    @PostMapping("/api/claude-search")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> claudeSearch(@RequestBody java.util.Map<String, String> request) {
        try {
            String query = request.get("query");
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            List<Product> products = thriftAIService.searchProducts(query, null);
            String aiResponse = chatGPTService.generateSearchResponse(query, products);
            
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("query", query);
            response.put("aiResponse", aiResponse);
            response.put("products", products);
            response.put("resultCount", products.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
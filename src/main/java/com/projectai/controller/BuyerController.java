package com.projectai.controller;

import com.projectai.models.Buyer;
import com.projectai.models.Order;
import com.projectai.models.Product;
import com.projectai.repository.BuyerRepository;
import com.projectai.repository.ProductRepository;
import com.projectai.service.ChatGPTService;
import com.projectai.service.ClaudeService;
import com.projectai.service.VisualSearchService;
import com.projectai.service.PriceComparisonService;
import com.projectai.service.ThriftAIService;
import com.projectai.service.OrderService;
import com.projectai.service.ReviewService;
import com.projectai.service.CartService;
import com.projectai.service.SmartSearchService;
import com.projectai.service.WorldClassSearchService;
import com.projectai.service.ClaudeEnhancedService;
import com.projectai.models.ClaudeSearchAnalytics;
import com.projectai.models.SearchFilters;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpServletRequest;
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
    private ClaudeService claudeService;

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
    
    @Autowired
    private SmartSearchService smartSearchService;

    @Autowired
    private WorldClassSearchService worldClassSearchService;

    @Autowired
    private ClaudeEnhancedService claudeEnhancedService;

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
            System.out.println("🚀 [Claude Enhanced] Starting comprehensive search for: " + query);

            // Use Claude Enhanced Search Service for intelligent AI-powered search
            ClaudeSearchAnalytics analytics = claudeEnhancedService.performComprehensiveSearch(query);

            model.addAttribute("query", query != null ? query : "");
            model.addAttribute("products", analytics.getMatchedProducts());
            model.addAttribute("resultCount", analytics.getMatchedProducts().size());
            model.addAttribute("searchInsights", analytics.getClaudeInsight());
            model.addAttribute("searchSuggestions", analytics.getSuggestedAlternatives());
            model.addAttribute("interpretedQuery", query);
            model.addAttribute("originalQuery", query);
            model.addAttribute("aiResponse", analytics.getClaudeInsight());
            model.addAttribute("analytics", analytics);
            model.addAttribute("categoryScores", analytics.getCategoryConfidenceScores());
            model.addAttribute("visualData", analytics.getVisualData());

            System.out.println("✅ [Claude Enhanced] Search completed with " + analytics.getMatchedProducts().size() + " products");
            return "search-results";
        } catch (Exception e) {
            model.addAttribute("query", query);
            model.addAttribute("products", java.util.Collections.emptyList());
            model.addAttribute("resultCount", 0);
            model.addAttribute("error", "Search failed. Please try again.");
            return "search-results";
        }
    }

    @GetMapping("/search-3step")
    public String searchThreeStep(@RequestParam(value = "q", required = false) String query, Model model) {
        try {
            System.out.println("🚀 Testing 3-Step LLM Search Flow via /buyers/search-3step endpoint");

            // Step 1: Extract filters using LLM
            SearchFilters filters = chatGPTService.extractSearchFilters(query);

            // Step 2: Execute business logic search with extracted filters
            List<Product> filteredProducts = chatGPTService.executeFilteredSearch(filters);

            // Step 3: Generate intelligent summary using LLM
            String aiResponse = chatGPTService.generateIntelligentSummary(filters, filteredProducts);

            model.addAttribute("query", query != null ? query : "");
            model.addAttribute("products", filteredProducts);
            model.addAttribute("resultCount", filteredProducts.size());
            model.addAttribute("searchInsights", "3-Step LLM Search: " + filters.toString());
            model.addAttribute("searchSuggestions", java.util.Arrays.asList("Try more specific terms", "Adjust price range", "Explore different brands"));
            model.addAttribute("interpretedQuery", "Filters: " + (filters.getCategory() != null ? filters.getCategory() : "Any Category") +
                " | Intent: " + (filters.getIntent() != null ? filters.getIntent() : "General") +
                " | Style: " + (filters.getStyle() != null ? filters.getStyle() : "Any"));
            model.addAttribute("originalQuery", query);
            model.addAttribute("aiResponse", aiResponse);
            model.addAttribute("searchType", "3-Step LLM Search");

            System.out.println("✅ 3-Step LLM Search completed successfully with " + filteredProducts.size() + " products");
            return "search-results";

        } catch (Exception e) {
            System.err.println("❌ 3-Step LLM Search failed: " + e.getMessage());
            e.printStackTrace();
            model.addAttribute("query", query);
            model.addAttribute("products", java.util.Collections.emptyList());
            model.addAttribute("resultCount", 0);
            model.addAttribute("error", "3-Step LLM Search failed. Please try again.");
            model.addAttribute("searchType", "3-Step LLM Search (Failed)");
            return "search-results";
        }
    }

    private String generateAIResponse(String query, List<Product> products) {
        System.out.println("🔍 DEBUG: generateAIResponse called with query: " + query + ", products count: " + products.size());
        String openAIResponse = null;
        String claudeResponse = null;

        // Try ChatGPT first
        try {
            System.out.println("🔍 DEBUG: Calling ChatGPT service...");
            openAIResponse = chatGPTService.generateSearchResponse(query, products);
            System.out.println("🔍 DEBUG: ChatGPT response received: " + (openAIResponse != null ? openAIResponse.substring(0, Math.min(100, openAIResponse.length())) + "..." : "null"));
        } catch (Exception e) {
            System.out.println("❌ ChatGPT service failed: " + e.getMessage());
            e.printStackTrace();
        }

        // Try Claude as backup or alternative
        try {
            System.out.println("🔍 DEBUG: Calling Claude service...");
            claudeResponse = claudeService.generateThriftResponse(query, products, "search");
            System.out.println("🔍 DEBUG: Claude response received: " + (claudeResponse != null ? claudeResponse.substring(0, Math.min(100, claudeResponse.length())) + "..." : "null"));
        } catch (Exception e) {
            System.out.println("❌ Claude service failed: " + e.getMessage());
            e.printStackTrace();
        }

        // Return best available response with fallback logic
        String finalResponse = null;
        if (openAIResponse != null && !openAIResponse.contains("I'm having trouble")) {
            finalResponse = openAIResponse;
            System.out.println("✅ DEBUG: Using ChatGPT response");
        } else if (claudeResponse != null && !claudeResponse.contains("I'm having trouble")) {
            finalResponse = claudeResponse;
            System.out.println("✅ DEBUG: Using Claude response");
        } else if (openAIResponse != null) {
            finalResponse = openAIResponse;
            System.out.println("✅ DEBUG: Using ChatGPT response (fallback)");
        } else if (claudeResponse != null) {
            finalResponse = claudeResponse;
            System.out.println("✅ DEBUG: Using Claude response (fallback)");
        } else {
            finalResponse = generateFallbackResponse(query, products);
            System.out.println("✅ DEBUG: Using fallback response");
        }

        System.out.println("🔍 DEBUG: Final AI response (first 100 chars): " + (finalResponse != null ? finalResponse.substring(0, Math.min(100, finalResponse.length())) + "..." : "null"));
        return finalResponse;
    }

    private String generateFallbackResponse(String query, List<Product> products) {
        if (products == null || products.isEmpty()) {
            return "🤖 No exact matches found for '" + query + "', but here are popular items you might love! 💡 Our AI suggests browsing these categories or trying more specific search terms.";
        } else {
            return "🎯 Found " + products.size() + " perfect matches for your search! Let me know if you need help choosing the best option for you.";
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
    
    // Checkout endpoints
    @GetMapping("/checkout")
    public String checkout(HttpSession session, Model model) {
        String sessionId = session.getId();
        String buyerId = (String) session.getAttribute("buyerId");
        
        Map<String, Object> cartSummary = cartService.getCartSummary(sessionId, buyerId);
        
        if ((Boolean) cartSummary.get("isEmpty")) {
            return "redirect:/buyers/cart?error=empty-cart";
        }
        
        model.addAttribute("cartSummary", cartSummary);
        return "checkout";
    }
    
    @PostMapping("/api/checkout/create-order")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> createOrder(
            @RequestBody Map<String, Object> orderData,
            HttpSession session) {
        try {
            String sessionId = session.getId();
            String buyerId = (String) session.getAttribute("buyerId");
            
            Order order = orderService.createOrderFromCart(sessionId, buyerId, orderData);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("orderId", order.getId());
            response.put("message", "Order created successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/api/checkout/process-payment")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> processPayment(
            @RequestBody Map<String, Object> paymentData) {
        try {
            String orderId = (String) paymentData.get("orderId");
            Order order = orderService.processPayment(orderId, paymentData);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", order.getPaymentStatus() == Order.PaymentStatus.COMPLETED);
            response.put("orderId", order.getId());
            response.put("orderNumber", order.getFormattedOrderNumber());
            response.put("paymentStatus", order.getPaymentStatus());
            
            if (order.getPaymentStatus() == Order.PaymentStatus.FAILED) {
                response.put("error", "Payment failed. Please try again with a different payment method.");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/orders/{orderId}")
    public String viewOrder(@PathVariable String orderId, Model model) {
        Optional<Order> orderOpt = orderService.getOrderByIdJPA(orderId);
        
        if (orderOpt.isEmpty()) {
            return "redirect:/buyers/dashboard?error=order-not-found";
        }
        
        model.addAttribute("order", orderOpt.get());
        return "order-details";
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
    
    @PostMapping("/api/smart-search")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> smartSearch(@RequestBody java.util.Map<String, String> request) {
        try {
            String query = request.get("query");
            if (query == null) {
                query = "";
            }
            
            SmartSearchService.SearchResult searchResult = smartSearchService.parseAndSearch(query);
            
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("originalQuery", searchResult.getOriginalQuery());
            response.put("interpretedQuery", searchResult.getInterpretedQuery());
            response.put("products", searchResult.getProducts());
            response.put("resultCount", searchResult.getResultCount());
            response.put("searchCriteria", searchResult.getCriteria());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Smart search failed: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @GetMapping("/api/products")
    @ResponseBody
    public ResponseEntity<List<Product>> getAllProducts() {
        try {
            List<Product> products = productRepository.findByIsAvailableTrue();
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
    
    @GetMapping("/orders")
    public String orders(HttpServletRequest request, Model model) {
        String sessionId = request.getSession().getId();
        String buyerId = (String) request.getSession().getAttribute("buyerId");

        List<Order> orders;
        Map<String, Object> orderStats = new HashMap<>();

        if (buyerId != null) {
            orders = orderService.getBuyerOrdersJPA(buyerId);
            orderStats = orderService.getBuyerOrderStats(buyerId);
        } else {
            orders = orderService.getSessionOrdersJPA(sessionId);
            orderStats = orderService.getSessionOrderStats(sessionId);
        }

        model.addAttribute("orders", orders);
        model.addAttribute("orderStats", orderStats);
        model.addAttribute("buyerId", buyerId);

        return "orders";
    }

    @GetMapping("/claude-enhanced-search")
    public String claudeEnhancedSearch(@RequestParam(value = "q", required = false) String query, Model model) {
        try {
            System.out.println("🚀 Claude Enhanced Search initiated for query: " + query);

            if (query == null || query.trim().isEmpty()) {
                query = "budget laptops under $500"; // Default example query for testing
            }

            ClaudeSearchAnalytics analytics = claudeEnhancedService.performComprehensiveSearch(query);

            model.addAttribute("query", query);
            model.addAttribute("products", analytics.getMatchedProducts());
            model.addAttribute("resultCount", analytics.getMatchedProducts().size());
            model.addAttribute("searchInsights", "Claude Enhanced Search: " + analytics.toString());
            model.addAttribute("interpretedQuery", "Strategy: " + analytics.getSearchStrategy() +
                " | Quality: " + String.format("%.1f%%", analytics.getSearchQuality()) +
                " | Processing: " + analytics.getProcessingTimeMs() + "ms");
            model.addAttribute("originalQuery", query);
            model.addAttribute("aiResponse", analytics.getClaudeInsight());
            model.addAttribute("searchType", "Claude Enhanced AI Search");

            // Add analytics data for frontend visualization
            model.addAttribute("analytics", analytics);
            model.addAttribute("categoryScores", analytics.getCategoryConfidenceScores());
            model.addAttribute("brandDistribution", analytics.getBrandDistribution());
            model.addAttribute("priceDistribution", analytics.getPriceRangeDistribution());
            model.addAttribute("conditionDistribution", analytics.getConditionDistribution());
            model.addAttribute("suggestedAlternatives", analytics.getSuggestedAlternatives());
            model.addAttribute("visualData", analytics.getVisualData());

            System.out.println("✅ Claude Enhanced Search completed successfully with " +
                analytics.getMatchedProducts().size() + " products");
            return "search-results-enhanced";

        } catch (Exception e) {
            System.err.println("❌ Claude Enhanced Search failed: " + e.getMessage());
            e.printStackTrace();
            model.addAttribute("query", query);
            model.addAttribute("products", java.util.Collections.emptyList());
            model.addAttribute("resultCount", 0);
            model.addAttribute("error", "Claude Enhanced Search failed. Please try again.");
            model.addAttribute("searchType", "Claude Enhanced Search (Failed)");
            return "search-results";
        }
    }

    @PostMapping("/api/claude-enhanced-search")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> claudeEnhancedSearchAPI(@RequestBody Map<String, String> request) {
        try {
            String query = request.get("query");
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            ClaudeSearchAnalytics analytics = claudeEnhancedService.performComprehensiveSearch(query);

            Map<String, Object> response = new HashMap<>();
            response.put("query", query);
            response.put("products", analytics.getMatchedProducts());
            response.put("resultCount", analytics.getMatchedProducts().size());
            response.put("claudeInsight", analytics.getClaudeInsight());
            response.put("searchQuality", analytics.getSearchQuality());
            response.put("searchStrategy", analytics.getSearchStrategy());
            response.put("processingTime", analytics.getProcessingTimeMs());
            response.put("extractedFilters", analytics.getExtractedFilters());
            response.put("categoryScores", analytics.getCategoryConfidenceScores());
            response.put("brandDistribution", analytics.getBrandDistribution());
            response.put("priceDistribution", analytics.getPriceRangeDistribution());
            response.put("conditionDistribution", analytics.getConditionDistribution());
            response.put("suggestedAlternatives", analytics.getSuggestedAlternatives());
            response.put("visualData", analytics.getVisualData());
            response.put("success", true);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Claude Enhanced Search failed: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
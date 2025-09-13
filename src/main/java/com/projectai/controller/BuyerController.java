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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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

    @GetMapping("/search")
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
}
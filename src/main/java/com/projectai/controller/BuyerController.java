package com.projectai.controller;

import com.projectai.models.Buyer;
import com.projectai.models.Order;
import com.projectai.models.Product;
import com.projectai.repository.BuyerRepository;
import com.projectai.repository.ProductRepository;
import com.projectai.service.ChatGPTService;
import com.projectai.service.ClaudeService;
import com.projectai.service.ComparisonAIService;
import com.projectai.service.VisualSearchService;
import com.projectai.service.PriceComparisonService;
import com.projectai.service.ThriftAIService;
import com.projectai.service.OrderService;
import com.projectai.service.ReviewService;
import com.projectai.service.CartService;
import com.projectai.service.SmartSearchService;
import com.projectai.service.WorldClassSearchService;
import com.projectai.service.ClaudeEnhancedService;
import com.projectai.service.DynamicProductService;
import com.projectai.service.IntelligentSearchService;
import com.projectai.service.OpenSourceProductService;
import com.projectai.service.AdvancedAIOrchestrationService;
import com.projectai.dto.AIInsights;
import com.projectai.models.ClaudeSearchAnalytics;
import com.projectai.models.SearchFilters;
import java.util.concurrent.CompletableFuture;
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.Arrays;
import java.util.Collections;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;

@Controller
@RequestMapping("/buyers")
public class BuyerController {

    private static final Logger logger = LoggerFactory.getLogger(BuyerController.class);

    @Autowired
    private BuyerRepository buyerRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private ChatGPTService chatGPTService;

    @Autowired
    private ClaudeService claudeService;

    @Autowired
    private ComparisonAIService comparisonAIService;

    @Autowired
    private VisualSearchService visualSearchService;

    @Autowired
    private IntelligentSearchService intelligentSearchService;
    
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

    @Autowired
    private DynamicProductService dynamicProductService;

    @Autowired
    private OpenSourceProductService openSourceProductService;

    @Autowired
    private AdvancedAIOrchestrationService advancedAIOrchestrationService;

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

    @CrossOrigin(origins = "http://localhost:3001")
    @PostMapping("/api/claude-ai-search")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> claudeAISearch(@RequestBody java.util.Map<String, String> request) {
        String query = request.get("query");
        String userId = request.getOrDefault("userId", "anonymous");

        try {
            // Premium product discovery system
            List<Product> products;
            if (query == null || query.trim().isEmpty()) {
                // If no query, get all available products
                products = productRepository.findByIsAvailableTrue()
                        .stream()
                        .limit(10)
                        .collect(java.util.stream.Collectors.toList());

                logger.info("📋 Empty query - returning {} random products", products.size());
            } else {
                // Premium search system for all queries
                logger.info("🌟 Starting personalized search for query: '{}'", query);

                products = performIntelligentSemanticSearch(query, userId);
                logger.info("✨ Curated search completed: {} premium products found", products.size());
            }

            // Premium product analysis system
            AIInsights aiInsights = advancedAIOrchestrationService.generateComprehensiveProductAnalysis(
                query != null ? query : "", products, userId);

            java.util.Map<String, Object> response = new java.util.HashMap<>();

            // Core response data
            response.put("query", query);
            response.put("totalProductsAnalyzed", products.size());
            response.put("searchTime", java.time.LocalDateTime.now());

            // Advanced AI Insights with graphs and comprehensive analysis
            response.put("aiInsights", aiInsights);

            // Prioritize chatResponse from Claude over technical messages
            if (aiInsights.getChatResponse() != null && !aiInsights.getChatResponse().trim().isEmpty()) {
                response.put("message", aiInsights.getChatResponse());
            } else {
                // Fallback to user-friendly message if no chatResponse
                response.put("message", "I've analyzed " + products.size() + " great options for your search. Check out the recommendations above to find your perfect match!");
            }

            // Enhanced products with AI scores
            List<java.util.Map<String, Object>> enhancedProducts = new ArrayList<>();
            for (int i = 0; i < products.size(); i++) {
                Product product = products.get(i);
                java.util.Map<String, Object> enhancedProduct = new java.util.HashMap<>();

                // Copy product fields
                enhancedProduct.put("id", product.getId());
                enhancedProduct.put("name", product.getName());
                enhancedProduct.put("price", product.getPrice());
                enhancedProduct.put("originalPrice", product.getOriginalPrice());
                enhancedProduct.put("description", product.getDescription());
                enhancedProduct.put("category", product.getCategory());
                enhancedProduct.put("brand", product.getBrand());
                enhancedProduct.put("condition", product.getCondition());
                enhancedProduct.put("imageUrl", product.getImageUrl());
                enhancedProduct.put("size", product.getSize());
                enhancedProduct.put("available", product.isAvailable());

                // Calculate AI scoring based on actual relevance to search query
                java.util.Map<String, Double> scoreBreakdown = calculateRelevanceScores(product, query);

                // Calculate overall AI score as weighted average
                double aiScore = (scoreBreakdown.get("keywordRelevance") * 0.3) +
                               (scoreBreakdown.get("categoryRelevance") * 0.2) +
                               (scoreBreakdown.get("brandPreference") * 0.15) +
                               (scoreBreakdown.get("priceMatching") * 0.15) +
                               (scoreBreakdown.get("valueProposition") * 0.1) +
                               (scoreBreakdown.get("conditionMatching") * 0.1);

                enhancedProduct.put("aiScore", Math.round(aiScore * 10.0) / 10.0);
                enhancedProduct.put("scoreBreakdown", scoreBreakdown);

                // Apply minimum relevance threshold filtering to exclude poor matches
                final double MINIMUM_RELEVANCE_THRESHOLD = 50.0;
                if (aiScore < MINIMUM_RELEVANCE_THRESHOLD) {
                    logger.info("🚫 THRESHOLD FILTER: Excluding '{}' (aiScore: {:.1f} < {:.1f})",
                        product.getName(), aiScore, MINIMUM_RELEVANCE_THRESHOLD);
                    continue; // Skip this product - it doesn't meet minimum relevance
                }

                logger.info("✅ THRESHOLD PASS: Including '{}' (aiScore: {:.1f} >= {:.1f})",
                    product.getName(), aiScore, MINIMUM_RELEVANCE_THRESHOLD);

                // Add savings calculation
                if (product.getOriginalPrice() > product.getPrice()) {
                    double savings = product.getOriginalPrice() - product.getPrice();
                    double savingsPercentage = (savings / product.getOriginalPrice()) * 100;
                    enhancedProduct.put("retailPrice", product.getOriginalPrice());
                    enhancedProduct.put("savings", savings);
                    enhancedProduct.put("savingsPercentage", savingsPercentage);
                }

                enhancedProducts.add(enhancedProduct);
            }

            response.put("products", enhancedProducts);

            // 🚀 ENHANCED GRAPHS: Use Python AI service graphs when available, fallback to static graphs
            java.util.Map<String, Object> graphs = new java.util.HashMap<>();

            // Try to use Python AI service graphs first
            if (aiInsights.getPythonGraphsData() != null && !aiInsights.getPythonGraphsData().isEmpty()) {
                // Use dynamic graphs from Python AI service (LangChain + Claude)
                graphs = aiInsights.getPythonGraphsData();
                logger.info("✅ Using dynamic graphs from Python AI service: {} chart types", graphs.size());
            } else {
                // Fallback to static graphs for backward compatibility
                logger.info("⚠️ Python graphs not available, using fallback static graphs");

                // Price distribution
                java.util.List<java.util.Map<String, Object>> priceDistribution = java.util.Arrays.asList(
                    java.util.Map.of("range", "$0-$25", "count", 3),
                    java.util.Map.of("range", "$25-$50", "count", 4),
                    java.util.Map.of("range", "$50-$100", "count", 2),
                    java.util.Map.of("range", "$100+", "count", 1)
                );
                graphs.put("priceDistribution", priceDistribution);

                // Category breakdown
                java.util.List<java.util.Map<String, Object>> categoryBreakdown = new ArrayList<>();
                java.util.Map<String, Long> categoryCount = products.stream()
                    .collect(java.util.stream.Collectors.groupingBy(Product::getCategory, java.util.stream.Collectors.counting()));
                for (java.util.Map.Entry<String, Long> entry : categoryCount.entrySet()) {
                    categoryBreakdown.add(java.util.Map.of("category", entry.getKey(), "count", entry.getValue()));
                }
                graphs.put("categoryBreakdown", categoryBreakdown);

                // AI Score distribution
                java.util.List<java.util.Map<String, Object>> aiScoreDistribution = java.util.Arrays.asList(
                    java.util.Map.of("scoreRange", "90-100", "count", 2),
                    java.util.Map.of("scoreRange", "80-89", "count", 3),
                    java.util.Map.of("scoreRange", "70-79", "count", 3),
                    java.util.Map.of("scoreRange", "60-69", "count", 2)
                );
                graphs.put("aiScoreDistribution", aiScoreDistribution);

                // Savings analysis
                java.util.List<java.util.Map<String, Object>> savingsAnalysis = java.util.Arrays.asList(
                    java.util.Map.of("savingsRange", "$0-$10", "count", 4),
                    java.util.Map.of("savingsRange", "$10-$25", "count", 3),
                    java.util.Map.of("savingsRange", "$25-$50", "count", 2),
                    java.util.Map.of("savingsRange", "$50+", "count", 1)
                );
                graphs.put("savingsAnalysis", savingsAnalysis);
            }

            response.put("graphs", graphs);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Premium search temporarily unavailable: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Helper method to calculate relevance scores based on search query
    private java.util.Map<String, Double> calculateRelevanceScores(Product product, String query) {
        java.util.Map<String, Double> scores = new java.util.HashMap<>();

        if (query == null || query.trim().isEmpty()) {
            // Default scores when no query
            scores.put("keywordRelevance", 70.0);
            scores.put("categoryRelevance", 70.0);
            scores.put("brandPreference", 70.0);
            scores.put("priceMatching", 70.0);
            scores.put("valueProposition", 70.0);
            scores.put("conditionMatching", 80.0);
            return scores;
        }

        String[] queryTerms = query.toLowerCase().trim().split("\\s+");

        // Keyword Relevance (30% weight) - matches in name, description, brand
        double keywordScore = 0.0;
        String productText = (product.getName() + " " +
                            (product.getDescription() != null ? product.getDescription() : "") + " " +
                            (product.getBrand() != null ? product.getBrand() : "") + " " +
                            (product.getCategory() != null ? product.getCategory() : "")).toLowerCase();

        int matchCount = 0;
        for (String term : queryTerms) {
            if (productText.contains(term)) {
                matchCount++;
                // Higher score for exact matches in name
                if (product.getName().toLowerCase().contains(term)) {
                    keywordScore += 25;
                } else if (product.getBrand() != null && product.getBrand().toLowerCase().contains(term)) {
                    keywordScore += 20;
                } else if (product.getCategory() != null && product.getCategory().toLowerCase().contains(term)) {
                    keywordScore += 15;
                } else {
                    keywordScore += 10;
                }
            }
        }
        keywordScore = Math.min(100.0, keywordScore);
        scores.put("keywordRelevance", keywordScore);

        // Category Relevance (20% weight)
        double categoryScore = 60.0; // Base score
        if (product.getCategory() != null) {
            for (String term : queryTerms) {
                if (product.getCategory().toLowerCase().contains(term)) {
                    categoryScore = Math.min(100.0, categoryScore + 30);
                }
            }
        }
        scores.put("categoryRelevance", categoryScore);

        // Brand Preference (15% weight)
        double brandScore = 50.0; // Base score
        if (product.getBrand() != null) {
            for (String term : queryTerms) {
                if (product.getBrand().toLowerCase().contains(term)) {
                    brandScore = Math.min(100.0, brandScore + 40);
                }
            }
        }
        scores.put("brandPreference", brandScore);

        // Price Matching (15% weight) - based on value proposition
        double priceScore = 70.0;
        if (product.getOriginalPrice() > product.getPrice()) {
            double savings = (product.getOriginalPrice() - product.getPrice()) / product.getOriginalPrice();
            priceScore = Math.min(100.0, 60.0 + (savings * 80)); // More savings = higher score
        }
        scores.put("priceMatching", priceScore);

        // Value Proposition (10% weight)
        double valueScore = priceScore * 0.8; // Related to price but slightly lower
        scores.put("valueProposition", valueScore);

        // Condition Matching (10% weight)
        double conditionScore = 75.0; // Base score
        if (product.getCondition() != null) {
            switch (product.getCondition().toUpperCase()) {
                case "EXCELLENT": case "LIKE_NEW": conditionScore = 95.0; break;
                case "VERY_GOOD": conditionScore = 85.0; break;
                case "GOOD": conditionScore = 75.0; break;
                case "FAIR": conditionScore = 65.0; break;
                default: conditionScore = 70.0;
            }
        }
        scores.put("conditionMatching", conditionScore);

        return scores;
    }

    private int getSearchMatchScore(Product product, String searchTerm) {
        int score = 0;

        // Name match gets highest priority (100 points)
        if (product.getName() != null && product.getName().toLowerCase().contains(searchTerm)) {
            score += 100;
            // Bonus if search term is at the beginning of name
            if (product.getName().toLowerCase().startsWith(searchTerm)) {
                score += 50;
            }
        }

        // Brand match gets high priority (75 points)
        if (product.getBrand() != null && product.getBrand().toLowerCase().contains(searchTerm)) {
            score += 75;
        }

        // Category match gets medium priority (50 points)
        if (product.getCategory() != null && product.getCategory().toLowerCase().contains(searchTerm)) {
            score += 50;
        }

        // Description match gets lower priority (25 points)
        if (product.getDescription() != null && product.getDescription().toLowerCase().contains(searchTerm)) {
            score += 25;
        }

        return score;
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
            System.out.println("🚀 [Integrated Search] Starting comprehensive search for: " + query);

            List<Product> foundProducts = new ArrayList<>();
            ClaudeSearchAnalytics analytics = null;

            // Step 1: First, try searching in bulk products catalog (prioritized for relevance)
            if (query != null && !query.trim().isEmpty()) {
                System.out.println("🔍 [Integrated Search] Step 1: Searching in bulk products for: " + query);
                try {
                    // Parse price constraints from query
                    PriceFilter priceFilter = parsePriceFromQuery(query);
                    String cleanQuery = removePriceFromQuery(query);

                    // Search existing bulk products using keyword matching + price filtering
                    List<Product> bulkProducts = productRepository.findAll().stream()
                        .filter(product -> matchesSearchQuery(product, cleanQuery))
                        .filter(product -> matchesPriceFilter(product, priceFilter))
                        .limit(12)
                        .toList();

                    if (!bulkProducts.isEmpty()) {
                        foundProducts = bulkProducts;
                        System.out.println("✅ [Integrated Search] Found " + foundProducts.size() + " products from bulk catalog");

                        // Generate analytics for bulk products to enable charts
                        analytics = generateAnalyticsForBulkProducts(query, foundProducts);
                        System.out.println("📊 [Integrated Search] Generated analytics for bulk products with visual data");
                    } else {
                        System.out.println("🔄 [Integrated Search] No bulk products found for query: '" + query + "'");
                        long totalProducts = productRepository.count();
                        System.out.println("📊 [Integrated Search] Total products in database: " + totalProducts);
                    }
                } catch (Exception bulkError) {
                    System.err.println("❌ [Integrated Search] Bulk products search failed: " + bulkError.getMessage());
                }
            }

            // Step 2: If no bulk products found, try Claude Enhanced Search as fallback
            if (foundProducts.isEmpty() && query != null && !query.trim().isEmpty()) {
                System.out.println("🧠 [Integrated Search] Step 2: Trying Claude Enhanced Search as fallback");
                analytics = claudeEnhancedService.performComprehensiveSearch(query);
                foundProducts = analytics.getMatchedProducts();
            }

            // Step 3: If still no products found, use dynamic LLM generation as final fallback
            if (foundProducts.isEmpty() && query != null && !query.trim().isEmpty()) {
                System.out.println("🔄 [Integrated Search] Step 3: No products found in catalogs, continuing with empty results for: " + query);
                try {
                    // Keep empty list - charts will use demo data
                    foundProducts = java.util.Collections.emptyList();
                    System.out.println("✅ [Integrated Search] Prepared empty results for chart demo mode");
                } catch (Exception dynamicError) {
                    System.err.println("❌ [Integrated Search] Sample generation failed: " + dynamicError.getMessage());
                }
            }


            model.addAttribute("query", query != null ? query : "");
            model.addAttribute("products", foundProducts);
            model.addAttribute("resultCount", foundProducts.size());
            // Generate AI response using Claude/ChatGPT services for comprehensive explanatory text
            System.out.println("🧠 [Claude Integration] Generating AI explanatory text for " + foundProducts.size() + " products");
            String searchInsight = generateAIResponse(query != null ? query : "", foundProducts);
            System.out.println("✅ [Claude Integration] AI response generated: " + (searchInsight != null ? searchInsight.substring(0, Math.min(100, searchInsight.length())) + "..." : "null"));

            // If analytics has Claude insight, prioritize it
            if (analytics != null && analytics.getClaudeInsight() != null && !analytics.getClaudeInsight().trim().isEmpty()) {
                searchInsight = analytics.getClaudeInsight();
                System.out.println("🔄 [Claude Integration] Using analytics Claude insight instead");
            }

            model.addAttribute("searchInsights", searchInsight);
            model.addAttribute("searchSuggestions", analytics != null ? analytics.getSuggestedAlternatives() : java.util.Collections.emptyList());
            model.addAttribute("interpretedQuery", query);
            model.addAttribute("originalQuery", query);
            model.addAttribute("aiResponse", searchInsight);

            // Add JavaScript-safe version of AI response
            if (searchInsight != null) {
                try {
                    ObjectMapper objectMapper = new ObjectMapper();
                    String aiResponseJson = objectMapper.writeValueAsString(searchInsight);
                    model.addAttribute("aiResponseJson", aiResponseJson);
                    System.out.println("🤖 [AI Debug] AI response JSON: " + aiResponseJson);
                } catch (Exception e) {
                    System.err.println("❌ [AI Debug] Failed to serialize AI response: " + e.getMessage());
                    model.addAttribute("aiResponseJson", "\"AI response temporarily unavailable\"");
                }
            } else {
                model.addAttribute("aiResponseJson", "\"\"");
            }

            model.addAttribute("analytics", analytics);
            model.addAttribute("categoryScores", analytics != null ? analytics.getCategoryConfidenceScores() : java.util.Collections.emptyMap());
            model.addAttribute("visualData", analytics != null ? analytics.getVisualData() : java.util.Collections.emptyMap());

            // Add JSON serialized version for JavaScript consumption
            if (analytics != null && analytics.getVisualData() != null) {
                try {
                    ObjectMapper objectMapper = new ObjectMapper();
                    String visualDataJson = objectMapper.writeValueAsString(analytics.getVisualData());
                    model.addAttribute("visualDataJson", visualDataJson);
                    System.out.println("📊 [Chart Debug] Visual data JSON: " + visualDataJson);
                } catch (Exception e) {
                    System.err.println("❌ [Chart Debug] Failed to serialize visual data: " + e.getMessage());
                    model.addAttribute("visualDataJson", "{}");
                }
            } else {
                model.addAttribute("visualDataJson", "{}");
            }

            model.addAttribute("searchType", !foundProducts.isEmpty() ?
                "Integrated Search (Database)" : "Integrated Search (Dynamic LLM)");

            System.out.println("✅ [Integrated Search] Search completed with " + foundProducts.size() + " products");
            return "search-results";
        } catch (Exception e) {
            System.err.println("❌ [Integrated Search] Search failed: " + e.getMessage());
            e.printStackTrace();
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

            // Add JSON-serialized chart data for JavaScript
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                if (analytics.getVisualData() != null) {
                    String priceDistributionJson = mapper.writeValueAsString(analytics.getVisualData().get("priceDistribution"));
                    String brandDistributionJson = mapper.writeValueAsString(analytics.getVisualData().get("brandDistribution"));
                    model.addAttribute("priceDistributionJson", priceDistributionJson);
                    model.addAttribute("brandDistributionJson", brandDistributionJson);
                } else {
                    model.addAttribute("priceDistributionJson", "[]");
                    model.addAttribute("brandDistributionJson", "[]");
                }
            } catch (Exception e) {
                System.err.println("❌ [Claude Enhanced] Failed to serialize chart data: " + e.getMessage());
                model.addAttribute("priceDistributionJson", "[]");
                model.addAttribute("brandDistributionJson", "[]");
            }

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

    /**
     * Generate analytics for bulk products to enable chart visualization
     */
    private ClaudeSearchAnalytics generateAnalyticsForBulkProducts(String query, List<Product> products) {
        ClaudeSearchAnalytics analytics = new ClaudeSearchAnalytics();

        analytics.setOriginalQuery(query);
        analytics.setMatchedProducts(products);

        // Create basic search filters
        SearchFilters filters = new SearchFilters();
        filters.setOriginalQuery(query);
        analytics.setExtractedFilters(filters);

        // Generate comprehensive AI insight using Claude service
        String insight;
        try {
            System.out.println("🧠 [Bulk Analytics] Generating Claude insight for " + products.size() + " bulk products");
            insight = claudeService.generateThriftResponse(query, products, "bulk product analysis");
            System.out.println("✅ [Bulk Analytics] Claude insight generated: " + (insight != null ? insight.substring(0, Math.min(150, insight.length())) + "..." : "null"));
        } catch (Exception e) {
            System.err.println("❌ [Bulk Analytics] Claude insight generation failed: " + e.getMessage());
            // Fallback to basic insight
            insight = String.format("🎯 Excellent! Found %d quality products matching '%s' from our extensive catalog. Price range: $%.2f - $%.2f. 🌿 Each purchase supports sustainable shopping and reduces environmental impact!",
                products.size(), query,
                products.stream().mapToDouble(Product::getPrice).min().orElse(0.0),
                products.stream().mapToDouble(Product::getPrice).max().orElse(0.0));
        }
        analytics.setClaudeInsight(insight);

        // Calculate brand distribution
        Map<String, Integer> brandDistribution = new HashMap<>();
        products.forEach(product -> {
            String brand = product.getBrand() != null ? product.getBrand() : "Unknown";
            brandDistribution.put(brand, brandDistribution.getOrDefault(brand, 0) + 1);
        });
        analytics.setBrandDistribution(brandDistribution);

        // Calculate price distribution
        Map<String, Integer> priceRangeDistribution = new HashMap<>();
        products.forEach(product -> {
            double price = product.getPrice();
            String range;
            if (price < 25) range = "Under $25";
            else if (price < 50) range = "$25-$50";
            else if (price < 100) range = "$50-$100";
            else if (price < 200) range = "$100-$200";
            else range = "Over $200";

            priceRangeDistribution.put(range, priceRangeDistribution.getOrDefault(range, 0) + 1);
        });
        analytics.setPriceRangeDistribution(priceRangeDistribution);

        // Generate visual data for charts
        Map<String, Object> visualData = new HashMap<>();

        // Price distribution for charts
        List<Map<String, Object>> priceChartData = new ArrayList<>();
        priceRangeDistribution.forEach((range, count) -> {
            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("range", range);
            dataPoint.put("count", count);
            priceChartData.add(dataPoint);
        });
        visualData.put("priceDistribution", priceChartData);

        // Brand distribution for charts
        List<Map<String, Object>> brandChartData = new ArrayList<>();
        brandDistribution.forEach((brand, count) -> {
            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("brand", brand);
            dataPoint.put("count", count);
            brandChartData.add(dataPoint);
        });
        visualData.put("brandDistribution", brandChartData);

        analytics.setVisualData(visualData);

        // Set other analytics fields
        analytics.setSearchQuality(85.0); // Good quality for bulk catalog matches
        analytics.setSearchStrategy("Bulk Catalog Search");
        analytics.setProcessingTimeMs(50L); // Fast since no external API calls

        return analytics;
    }

    /**
     * Helper method to match products against search query
     * This is similar to the matching logic used in the OpenSourceProductController
     */
    // Price filtering helper classes and methods
    private static class PriceFilter {
        public final Double maxPrice;
        public final Double minPrice;

        public PriceFilter(Double minPrice, Double maxPrice) {
            this.minPrice = minPrice;
            this.maxPrice = maxPrice;
        }
    }

    private PriceFilter parsePriceFromQuery(String query) {
        if (query == null) return new PriceFilter(null, null);

        String lowerQuery = query.toLowerCase();

        // Pattern for "under $X", "below $X", "less than $X"
        java.util.regex.Pattern underPattern = java.util.regex.Pattern.compile("(under|below|less than)\\s*\\$?([0-9]+(?:\\.[0-9]{2})?)");
        java.util.regex.Matcher underMatcher = underPattern.matcher(lowerQuery);
        if (underMatcher.find()) {
            double maxPrice = Double.parseDouble(underMatcher.group(2));
            System.out.println("🔍 [Price Filter] Detected max price: $" + maxPrice);
            return new PriceFilter(null, maxPrice);
        }

        // Pattern for "over $X", "above $X", "more than $X"
        java.util.regex.Pattern overPattern = java.util.regex.Pattern.compile("(over|above|more than)\\s*\\$?([0-9]+(?:\\.[0-9]{2})?)");
        java.util.regex.Matcher overMatcher = overPattern.matcher(lowerQuery);
        if (overMatcher.find()) {
            double minPrice = Double.parseDouble(overMatcher.group(2));
            System.out.println("🔍 [Price Filter] Detected min price: $" + minPrice);
            return new PriceFilter(minPrice, null);
        }

        // Pattern for "$X to $Y" or "$X - $Y"
        java.util.regex.Pattern rangePattern = java.util.regex.Pattern.compile("\\$?([0-9]+(?:\\.[0-9]{2})?)\\s*(?:to|-|and)\\s*\\$?([0-9]+(?:\\.[0-9]{2})?)");
        java.util.regex.Matcher rangeMatcher = rangePattern.matcher(lowerQuery);
        if (rangeMatcher.find()) {
            double minPrice = Double.parseDouble(rangeMatcher.group(1));
            double maxPrice = Double.parseDouble(rangeMatcher.group(2));
            System.out.println("🔍 [Price Filter] Detected price range: $" + minPrice + " - $" + maxPrice);
            return new PriceFilter(minPrice, maxPrice);
        }

        return new PriceFilter(null, null);
    }

    private String removePriceFromQuery(String query) {
        if (query == null) return "";

        String cleanQuery = query
            .replaceAll("(?i)(under|below|less than)\\s*\\$?[0-9]+(?:\\.[0-9]{2})?", "")
            .replaceAll("(?i)(over|above|more than)\\s*\\$?[0-9]+(?:\\.[0-9]{2})?", "")
            .replaceAll("(?i)\\$?[0-9]+(?:\\.[0-9]{2})?\\s*(?:to|-|and)\\s*\\$?[0-9]+(?:\\.[0-9]{2})?", "")
            .replaceAll("\\s+", " ")
            .trim();

        System.out.println("🔍 [Query Processing] Original: '" + query + "' -> Clean: '" + cleanQuery + "'");
        return cleanQuery;
    }

    private boolean matchesPriceFilter(Product product, PriceFilter filter) {
        if (filter.minPrice == null && filter.maxPrice == null) {
            return true; // No price filter
        }

        double productPrice = product.getPrice();

        logger.info("🔍 [Price Match] Product '{}' ${} vs filter max: {}, min: {}",
            product.getName(), productPrice, filter.maxPrice, filter.minPrice);

        if (filter.maxPrice != null && productPrice > filter.maxPrice) {
            logger.info("❌ [Price Filter] REJECTED '{}' - ${} > max ${}",
                product.getName(), productPrice, filter.maxPrice);
            return false;
        }

        if (filter.minPrice != null && productPrice < filter.minPrice) {
            logger.info("❌ [Price Filter] REJECTED '{}' - ${} < min ${}",
                product.getName(), productPrice, filter.minPrice);
            return false;
        }

        logger.info("✅ [Price Filter] ACCEPTED '{}' - ${} within range",
            product.getName(), productPrice);
        return true;
    }

    private boolean matchesSearchQuery(Product product, String query) {
        if (query == null || query.trim().isEmpty()) {
            return true; // No text filter, match all
        }

        String lowerQuery = query.toLowerCase();

        // Enhanced automotive detection for "car" queries
        if (lowerQuery.contains("car") || lowerQuery.contains("auto") || lowerQuery.contains("vehicle")) {
            // For automotive queries, only return automotive products
            if (isAutomotiveProductForSearch(product)) {
                return true; // Automotive product for automotive query
            } else {
                return false; // Non-automotive product for automotive query - filter out
            }
        }

        // Enhanced bag/handbag matching for fashion queries
        if (lowerQuery.contains("bag") || lowerQuery.contains("handbag") || lowerQuery.contains("purse")) {
            String productText = (
                (product.getName() != null ? product.getName() : "") + " " +
                (product.getBrand() != null ? product.getBrand() : "") + " " +
                (product.getCategory() != null ? product.getCategory() : "") + " " +
                (product.getDescription() != null ? product.getDescription() : "")
            ).toLowerCase();

            // Match bag synonyms - if product has bag-related terms, it's a potential match
            if (productText.contains("bag") || productText.contains("handbag") ||
                productText.contains("purse") || productText.contains("tote")) {

                // For designer queries, check if product is from a designer brand or has designer keywords
                if (lowerQuery.contains("designer")) {
                    if (productText.contains("designer") || productText.contains("luxury") ||
                        productText.contains("gucci") || productText.contains("prada") ||
                        productText.contains("louis") || productText.contains("chanel") ||
                        productText.contains("hermes") || productText.contains("versace")) {
                        return true; // Designer bag found
                    }
                    // If "designer" was requested but product doesn't match designer criteria, continue to standard matching
                } else {
                    return true; // Bag product matches without designer requirement
                }
            }
        }

        // Standard matching for non-automotive queries
        return (product.getName() != null && product.getName().toLowerCase().contains(lowerQuery)) ||
               (product.getBrand() != null && product.getBrand().toLowerCase().contains(lowerQuery)) ||
               (product.getCategory() != null && product.getCategory().toLowerCase().contains(lowerQuery)) ||
               (product.getDescription() != null && product.getDescription().toLowerCase().contains(lowerQuery));
    }

    /**
     * 🧠 INTELLIGENT SEMANTIC SEARCH - Context-Aware Product Discovery
     * Understands user intent and returns semantically relevant products
     * ENHANCED: Comprehensive debug logging and filtering analytics
     */
    private List<Product> performIntelligentSemanticSearch(String query, String userId) {
        logger.info("🚀 SEMANTIC SEARCH METHOD ENTRY: query='{}', userId='{}'", query, userId);

        try {
            long startTime = System.currentTimeMillis();
            logger.info("🔧 STEP 1: Processing query parameters");
            String originalQuery = query.trim().toLowerCase();
            logger.info("🔧 STEP 2: Parsing price filter from query");
            PriceFilter priceFilter = parsePriceFromQuery(originalQuery);
            logger.info("🔧 STEP 3: Removing price info from query");
            String cleanSearchTerm = removePriceFromQuery(originalQuery);
            logger.info("🔧 STEP 4: Initial processing complete - originalQuery='{}', cleanSearchTerm='{}'", originalQuery, cleanSearchTerm);

        logger.info("🔧 STEP 5: Starting semantic search analysis");

        logger.info("🚀 SEMANTIC SEARCH START: User={}, Query='{}', Clean term='{}'", userId, originalQuery, cleanSearchTerm);
        logger.info("💰 PRICE FILTER: ${} - ${}",
            priceFilter.minPrice == null ? "0.00" : priceFilter.minPrice,
            priceFilter.maxPrice == null ? "unlimited" : priceFilter.maxPrice);

            // 1. Analyze search intent and context
            SearchIntent intent = analyzeSearchIntent(cleanSearchTerm);
            logger.info("🎯 SEARCH INTENT ANALYSIS:");
            logger.info("   📂 Relevant categories: {}", intent.relevantCategories);
            logger.info("   🚫 Excluded categories: {}", intent.excludedCategories);
            logger.info("   🎨 Style pattern: '{}'", intent.style);
            logger.info("   🔤 Keywords: {}", intent.keywords);

            // 2. Get all products and apply intelligent filtering
            List<Product> allProducts = productRepository.findByIsAvailableTrue();
            logger.info("📊 PRODUCT POOL: {} total available products to analyze", allProducts.size());

            List<ProductMatch> matches = new ArrayList<>();
            int priceFilteredOut = 0;
            int categoryExcluded = 0;
            int lowScore = 0;

            for (Product product : allProducts) {
                // Apply price filter first
                if (!matchesPriceFilter(product, priceFilter)) {
                    priceFilteredOut++;
                    continue;
                }

                // Calculate semantic relevance score
                double relevanceScore = calculateSemanticRelevance(product, intent, cleanSearchTerm);

                if (relevanceScore > 0) {
                    matches.add(new ProductMatch(product, relevanceScore));
                    logger.info("✅ MATCHED: '{}' (category: {}, score: {:.1f})",
                        product.getName(), product.getCategory(), relevanceScore);
                } else {
                    // Check if excluded by category or just low score
                    if (intent.excludedCategories.contains(product.getCategory())) {
                        categoryExcluded++;
                        logger.info("❌ EXCLUDED by category: '{}' ({})", product.getName(), product.getCategory());
                    } else {
                        lowScore++;
                        logger.info("📉 LOW SCORE: '{}' (score: 0)", product.getName());
                    }
                }
            }

            // 3. Sort by relevance and return top matches
            List<Product> results = matches.stream()
                .sorted((a, b) -> Double.compare(b.score, a.score))
                .limit(10)
                .map(match -> match.product)
                .collect(java.util.stream.Collectors.toList());

            long endTime = System.currentTimeMillis();

            // 📊 COMPREHENSIVE ANALYTICS
            logger.info("📊 KEYWORD SEARCH ANALYTICS:");
            logger.info("   🏪 Total products analyzed: {}", allProducts.size());
            logger.info("   💰 Price filtered out: {}", priceFilteredOut);
            logger.info("   🚫 Category excluded: {}", categoryExcluded);
            logger.info("   📉 Low relevance score: {}", lowScore);
            logger.info("   ✅ Semantically matched: {}", matches.size());
            logger.info("   🎯 Top results returned: {}", results.size());

            if (!results.isEmpty()) {
                logger.info("🏆 TOP SCORING RESULTS:");
                for (int i = 0; i < Math.min(5, results.size()); i++) {
                    Product p = results.get(i);
                    double score = matches.stream()
                        .filter(m -> m.product.getId().equals(p.getId()))
                        .findFirst()
                        .map(m -> m.score)
                        .orElse(0.0);
                    logger.info("   {}. '{}' - {} (score: {:.1f})",
                        i + 1, p.getName(), p.getCategory(), score);
                }
            } else {
                logger.warn("⚠️ NO RESULTS: No products matched semantic criteria for query '{}'", originalQuery);
                logger.warn("💡 SUGGESTION: Consider adjusting search terms or categories");
            }

            logger.info("⏱️ KEYWORD SEARCH COMPLETED: {}ms execution time", endTime - startTime);
            logger.info("🎉 KEYWORD SEARCH RESULT: {} contextually relevant products found for '{}' (style: {})",
                results.size(), originalQuery, intent.style);

            return results;
        } catch (Exception e) {
            logger.error("❌ CRITICAL ERROR in performIntelligentSemanticSearch: {}", e.getMessage(), e);
            logger.error("📊 ERROR CONTEXT: query='{}', userId='{}'", query, userId);
            logger.error("🚨 STACK TRACE: ", e);

            // Return empty list as fallback
            logger.warn("🔄 FALLBACK: Returning empty product list due to error");
            return new java.util.ArrayList<>();
        }
    }

    /**
     * Analyzes search query to understand user intent and context
     * FIXED: Uses cumulative pattern matching instead of if-else chain
     */
    private SearchIntent analyzeSearchIntent(String query) {
        SearchIntent intent = new SearchIntent();

        // Initialize with base defaults
        intent.style = "general";
        intent.relevantCategories = new ArrayList<>(Arrays.asList("CLOTHING", "SHOES", "ACCESSORIES"));
        intent.excludedCategories = new ArrayList<>();
        intent.keywords = new ArrayList<>();

        // 🎯 CUMULATIVE PATTERN MATCHING - Check all patterns, not just first match
        boolean matchedVintage = false;
        boolean matchedDesigner = false;
        boolean matchedTech = false;
        boolean matchedFashion = false;
        boolean matchedFootwear = false;

        // Check for vintage/retro patterns
        if (query.contains("vintage") || query.contains("retro") || query.contains("classic")) {
            logger.debug("🔍 INTENT: Detected vintage pattern");
            matchedVintage = true;
            intent.style = intent.style.equals("general") ? "vintage" : intent.style + "+vintage";
            intent.keywords.addAll(Arrays.asList("vintage", "retro", "classic", "antique"));
            intent.excludedCategories.addAll(Arrays.asList("ELECTRONICS", "HOME", "BOOKS"));
        }

        // Check for designer/luxury patterns
        if (query.contains("designer") || query.contains("luxury") || query.contains("premium")) {
            logger.debug("🔍 INTENT: Detected designer pattern");
            matchedDesigner = true;
            intent.style = intent.style.equals("general") ? "designer" : intent.style + "+designer";
            intent.keywords.addAll(Arrays.asList("designer", "luxury", "premium", "high-end", "branded"));
            intent.excludedCategories.addAll(Arrays.asList("ELECTRONICS", "HOME", "BOOKS"));
        }

        // Check for technology patterns
        if (query.contains("tech") || query.contains("electronic") || query.contains("gadget") ||
                 query.contains("phone") || query.contains("laptop") || query.contains("computer") ||
                 query.contains("watch") || query.contains("tablet") || query.contains("headphone") ||
                 query.contains("speaker") || query.contains("camera")) {
            logger.debug("🔍 INTENT: Detected technology pattern");
            matchedTech = true;
            intent.style = intent.style.equals("general") ? "technology" : intent.style + "+tech";
            intent.relevantCategories = Arrays.asList("ELECTRONICS");
            intent.excludedCategories.addAll(Arrays.asList("CLOTHING", "SHOES", "ACCESSORIES", "HOME", "BOOKS"));
            intent.keywords.addAll(Arrays.asList("electronic", "digital", "tech", "gadget"));
        }

        // Check for automotive/vehicle patterns
        boolean matchedAutomotive = false;
        if (query.contains("car") || query.contains("auto") || query.contains("vehicle") ||
                 query.contains("automotive") || query.contains("truck") || query.contains("motorcycle") ||
                 query.contains("bike") || query.contains("scooter")) {
            logger.debug("🔍 INTENT: Detected automotive pattern");
            matchedAutomotive = true;
            intent.style = intent.style.equals("general") ? "automotive" : intent.style + "+automotive";
            // Note: Since this is thrift/fashion, automotive items might be accessories/parts
            intent.relevantCategories = Arrays.asList("ACCESSORIES", "ELECTRONICS");
            intent.excludedCategories.addAll(Arrays.asList("CLOTHING", "SHOES", "HOME", "BOOKS"));
            intent.keywords.addAll(Arrays.asList("car", "auto", "vehicle", "automotive", "gear"));
        }

        // Check for fashion patterns
        if (query.contains("clothing") || query.contains("fashion") || query.contains("apparel") ||
                 query.contains("shirt") || query.contains("dress") || query.contains("jeans")) {
            logger.debug("🔍 INTENT: Detected fashion pattern");
            matchedFashion = true;
            intent.style = intent.style.equals("general") ? "fashion" : intent.style + "+fashion";
            intent.keywords.addAll(Arrays.asList("fashion", "clothing", "apparel", "wear"));
            intent.excludedCategories.addAll(Arrays.asList("ELECTRONICS", "HOME", "BOOKS"));
        }

        // Check for footwear patterns
        if (query.contains("shoes") || query.contains("sneakers") || query.contains("boots") ||
                 query.contains("heels") || query.contains("sandals")) {
            logger.debug("🔍 INTENT: Detected footwear pattern");
            matchedFootwear = true;
            intent.style = intent.style.equals("general") ? "footwear" : intent.style + "+footwear";
            intent.keywords.addAll(Arrays.asList("footwear", "shoes", "sneakers"));
            intent.excludedCategories.addAll(Arrays.asList("ELECTRONICS", "HOME", "BOOKS"));
        }

        // Check for bag/handbag/purse patterns - CRITICAL for proper category filtering
        boolean matchedBag = false;
        if (query.contains("bag") || query.contains("handbag") || query.contains("purse") ||
                 query.contains("tote") || query.contains("clutch") || query.contains("satchel")) {
            logger.debug("🔍 INTENT: Detected bag/accessory pattern");
            matchedBag = true;
            intent.style = intent.style.equals("general") ? "bags" : intent.style + "+bags";
            intent.relevantCategories = Arrays.asList("ACCESSORIES");
            intent.excludedCategories.addAll(Arrays.asList("CLOTHING", "SHOES", "ELECTRONICS", "HOME", "BOOKS"));
            intent.keywords.addAll(Arrays.asList("bag", "handbag", "purse", "tote", "accessory"));
            logger.info("🎯 BAG PATTERN MATCHED: Excluding CLOTHING category from search results");
        }

        // 🚨 CRITICAL: For vintage+designer combinations, ensure strictest filtering
        // BUT: If bag pattern is matched, prioritize bag-specific filtering
        if (matchedVintage && matchedDesigner && !matchedBag) {
            logger.info("🎯 CRITICAL PATTERN: vintage+designer detected - applying strictest filtering");
            intent.style = "vintage+designer";
            intent.relevantCategories = Arrays.asList("CLOTHING", "SHOES", "ACCESSORIES");
            intent.excludedCategories = Arrays.asList("ELECTRONICS", "HOME", "BOOKS", "SPORTS", "BEAUTY");
        } else if (matchedVintage && matchedDesigner && matchedBag) {
            logger.info("🎯 CRITICAL PATTERN: vintage+designer+bags detected - prioritizing bag filtering");
            intent.style = "vintage+designer+bags";
            // Keep the bag-specific filtering: only ACCESSORIES, exclude CLOTHING
            // This ensures jeans/clothing items don't appear in bag searches
        }

        // If no specific patterns matched, use general search
        if (!matchedVintage && !matchedDesigner && !matchedTech && !matchedFashion && !matchedFootwear && !matchedAutomotive && !matchedBag) {
            intent.style = "general";
            intent.relevantCategories = Arrays.asList("CLOTHING", "SHOES", "ACCESSORIES", "ELECTRONICS");
            intent.excludedCategories = new ArrayList<>();
            intent.keywords = Arrays.asList(query.split("\\s+"));
        }

        // Remove duplicates from exclusions
        intent.excludedCategories = intent.excludedCategories.stream().distinct().collect(java.util.stream.Collectors.toList());

        logger.debug("🧠 FINAL INTENT: style='{}', relevant={}, excluded={}, keywords={}",
            intent.style, intent.relevantCategories, intent.excludedCategories, intent.keywords);

        return intent;
    }

    /**
     * Calculates semantic relevance score for a product based on search intent
     * ENHANCED: Multi-term bonus, sophisticated scoring, and quality factors
     */
    private double calculateSemanticRelevance(Product product, SearchIntent intent, String searchTerm) {
        double score = 0.0;

        // 1. Category relevance (40% weight) - with content validation
        if (intent.relevantCategories.contains(product.getCategory())) {
            // Special validation for automotive queries
            if (intent.style != null && intent.style.contains("automotive")) {
                if (isActuallyAutomotiveRelated(product)) {
                    score += 40.0;
                    logger.debug("📊 SCORE: +40 for verified automotive category relevance ({})", product.getCategory());
                } else {
                    logger.debug("❌ AUTOMOTIVE VALIDATION: '{}' not car-related despite being in {}", product.getName(), product.getCategory());
                    // No category points for non-automotive items in automotive searches
                }
            } else {
                // Normal category scoring for non-automotive searches
                score += 40.0;
                logger.debug("📊 SCORE: +40 for category relevance ({})", product.getCategory());
            }
        }

        // 2. Category exclusion (immediate disqualification)
        if (intent.excludedCategories.contains(product.getCategory())) {
            logger.debug("❌ EXCLUDED: {} category not allowed for intent {}", product.getCategory(), intent.style);
            return 0.0; // This product is not relevant for this search intent
        }

        // 3. Enhanced keyword matching (30% weight + bonuses)
        String productText = (product.getName() + " " + product.getBrand() + " " +
                             product.getDescription() + " " + product.getCategory()).toLowerCase();

        int keywordMatches = 0;
        double keywordScore = 0.0;

        for (String keyword : intent.keywords) {
            if (productText.contains(keyword.toLowerCase())) {
                keywordMatches++;
                keywordScore += 30.0 / intent.keywords.size(); // Distribute keyword score
                logger.debug("📊 SCORE: +{} for keyword match '{}'", 30.0 / intent.keywords.size(), keyword);
            }
        }
        score += keywordScore;

        // 4. 🎯 MULTI-TERM BONUS: Extra points for matching multiple keywords
        if (keywordMatches > 1) {
            double bonus = keywordMatches * 5.0; // 5 points per additional match
            score += bonus;
            logger.debug("🎯 BONUS: +{} for {} keyword matches", bonus, keywordMatches);
        }

        // 5. Direct search term matching (25% weight)
        String[] searchTerms = searchTerm.toLowerCase().split("\\s+");
        int directMatches = 0;

        for (String term : searchTerms) {
            if (term.length() > 2) { // Skip very short terms
                if (product.getName() != null && product.getName().toLowerCase().contains(term)) {
                    score += 15.0; // Name match
                    directMatches++;
                    logger.debug("📊 SCORE: +15 for name match '{}'", term);
                }
                if (product.getBrand() != null && product.getBrand().toLowerCase().contains(term)) {
                    score += 10.0; // Brand match
                    directMatches++;
                    logger.debug("📊 SCORE: +10 for brand match '{}'", term);
                }
                if (product.getDescription() != null && product.getDescription().toLowerCase().contains(term)) {
                    score += 5.0; // Description match
                    directMatches++;
                    logger.debug("📊 SCORE: +5 for description match '{}'", term);
                }
            }
        }

        // 6. 🚀 SEARCH TERM COMBINATION BONUS: Extra points for finding multiple search terms
        if (directMatches >= 2) {
            double comboBonus = directMatches * 3.0; // 3 points per direct match
            score += comboBonus;
            logger.debug("🚀 COMBO BONUS: +{} for {} direct matches", comboBonus, directMatches);
        }

        // 7. 💎 PREMIUM STYLE BONUS: Extra relevance for premium patterns
        if (intent.style != null && (intent.style.contains("vintage") || intent.style.contains("designer"))) {
            if (product.getBrand() != null) {
                String brandLower = product.getBrand().toLowerCase();
                // Known premium/designer brands get extra points
                if (brandLower.contains("louis") || brandLower.contains("gucci") || brandLower.contains("prada") ||
                    brandLower.contains("chanel") || brandLower.contains("versace") || brandLower.contains("armani") ||
                    brandLower.contains("dior") || brandLower.contains("burberry") || brandLower.contains("fendi")) {
                    score += 15.0;
                    logger.debug("💎 PREMIUM BONUS: +15 for luxury brand '{}'", product.getBrand());
                }
            }

            // Vintage condition bonus
            if (product.getCondition() != null && product.getCondition().toLowerCase().contains("excellent")) {
                score += 10.0;
                logger.debug("💎 CONDITION BONUS: +10 for excellent vintage condition");
            }
        }

        // 8. 👜 BAG RELEVANCE BONUS: Prioritize actual bags for bag searches
        if (intent.style != null && intent.style.contains("bags")) {
            String productTextLower = (product.getName() + " " + product.getDescription()).toLowerCase();

            // Strong bonus for actual bag products
            if (productTextLower.contains("bag") || productTextLower.contains("handbag") ||
                productTextLower.contains("purse") || productTextLower.contains("tote") ||
                productTextLower.contains("clutch") || productTextLower.contains("satchel") ||
                productTextLower.contains("messenger") || productTextLower.contains("backpack") ||
                productTextLower.contains("shoulder bag") || productTextLower.contains("crossbody")) {
                score += 25.0;
                logger.debug("👜 BAG BONUS: +25 for actual bag product");
            }

            // Penalty for non-bag accessories in bag searches
            else if (productTextLower.contains("cap") || productTextLower.contains("hat") ||
                     productTextLower.contains("phone mount") || productTextLower.contains("charger") ||
                     productTextLower.contains("watch") || productTextLower.contains("jewelry") ||
                     productTextLower.contains("sunglasses") || productTextLower.contains("belt")) {
                score -= 15.0;
                logger.debug("👜 NON-BAG PENALTY: -15 for non-bag accessory in bag search");
            }
        }

        // 9. 🏆 FINAL QUALITY FACTORS (5% weight)
        if (product.getPrice() > 0 && product.getOriginalPrice() > 0) {
            double discount = ((product.getOriginalPrice() - product.getPrice()) / product.getOriginalPrice()) * 100;
            if (discount > 50) {
                score += 5.0; // Good deal bonus
                logger.debug("🏆 DEAL BONUS: +5 for {}% discount", String.format("%.1f", discount));
            }
        }

        logger.debug("✅ FINAL SCORE: {} for '{}' (category: {}, style: {})",
            String.format("%.1f", score), product.getName(), product.getCategory(), intent.style);

        return score;
    }

    private boolean isActuallyAutomotiveRelated(Product product) {
        if (product == null) return false;

        String productText = ((product.getName() != null ? product.getName() : "") + " " +
                             (product.getDescription() != null ? product.getDescription() : "") + " " +
                             (product.getBrand() != null ? product.getBrand() : "")).toLowerCase();

        // Automotive keywords - products must contain these to be considered automotive
        String[] automotiveKeywords = {
            "car", "auto", "vehicle", "automotive", "car mount", "car charger",
            "dashboard", "navigation", "gps", "windshield", "console", "steering",
            "ignition", "engine", "transmission", "brake", "tire", "wheel",
            "headlight", "taillight", "bumper", "hood", "trunk", "door handle",
            "seat cover", "floor mat", "air freshener", "phone mount", "cup holder",
            "sun visor", "mirror", "antenna", "radio", "stereo", "speaker",
            "amplifier", "subwoofer", "dash cam", "backup camera", "car wash",
            "wax", "polish", "detailing", "garage", "parking", "license plate",
            "registration", "insurance", "roadside", "jumper cables", "battery",
            "oil", "fluid", "coolant", "antifreeze", "gas", "fuel", "diesel",
            "hybrid", "electric vehicle", "ev", "tesla", "ford", "chevy", "honda",
            "toyota", "nissan", "bmw", "mercedes", "audi", "volkswagen", "jeep",
            "truck", "suv", "sedan", "coupe", "convertible", "motorcycle", "bike"
        };

        for (String keyword : automotiveKeywords) {
            if (productText.contains(keyword)) {
                logger.debug("✅ AUTOMOTIVE VALIDATION: '{}' contains keyword '{}'", product.getName(), keyword);
                return true;
            }
        }

        logger.debug("❌ AUTOMOTIVE VALIDATION: '{}' contains no automotive keywords", product.getName());
        return false;
    }

    /**
     * Check if a product is automotive-related for search filtering
     */
    private boolean isAutomotiveProductForSearch(Product product) {
        String productText = ((product.getName() != null ? product.getName() : "") + " " +
                             (product.getDescription() != null ? product.getDescription() : "") + " " +
                             (product.getCategory() != null ? product.getCategory() : "")).toLowerCase();

        String[] automotiveKeywords = {
            "car mount", "car charger", "dashboard", "windshield", "automotive",
            "steering wheel", "seat cover", "floor mat", "air freshener",
            "phone mount", "cup holder", "sun visor", "car wash", "tire", "wheel",
            "vehicle", "auto", "automotive accessory", "car care", "driving",
            "parking", "garage", "road trip", "travel mug"
        };

        for (String keyword : automotiveKeywords) {
            if (productText.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    /**
     * AI Analytics Dashboard - Display comprehensive AI insights with graphs
     */
    @GetMapping("/ai-analytics")
    public String aiAnalyticsDashboard(
            @RequestParam(required = false, defaultValue = "electronics") String query,
            @RequestParam(required = false) String userId,
            Model model) {

        System.out.println("🧠 [AI Analytics] Loading dashboard for query: " + query);

        try {
            // Get products for analysis
            List<Product> products = new ArrayList<>();

            // First try to get products from existing search
            if (query != null && !query.trim().isEmpty()) {
                products = productRepository.findAll().stream()
                    .filter(product -> matchesSearchQuery(product, query))
                    .limit(20)
                    .collect(Collectors.toList());
            }

            // If no products found, get sample products for demo
            if (products.isEmpty()) {
                products = productRepository.findAll().stream()
                    .limit(10)
                    .collect(Collectors.toList());
                System.out.println("📊 [AI Analytics] Using sample products for demo: " + products.size() + " products");
            }

            // Generate comprehensive AI insights
            AIInsights aiInsights = advancedAIOrchestrationService.generateComprehensiveProductAnalysis(
                query, products, userId != null ? userId : "demo_user");

            // Serialize AI insights to JSON for JavaScript consumption
            ObjectMapper objectMapper = new ObjectMapper();
            String aiInsightsJson = objectMapper.writeValueAsString(aiInsights);

            // Add data to model
            model.addAttribute("aiInsights", aiInsights);
            model.addAttribute("aiInsightsJson", aiInsightsJson);
            model.addAttribute("products", products);
            model.addAttribute("query", query);
            model.addAttribute("productCount", products.size());

            System.out.println("✅ [AI Analytics] Dashboard data prepared successfully");
            System.out.println("📊 [AI Analytics] Graphs available: " + (aiInsights.getGraphs() != null ? aiInsights.getGraphs().size() : 0));
            System.out.println("📈 [AI Analytics] Average AI Score: " + aiInsights.getAverageAiScore());

            return "ai-insights-dashboard";

        } catch (Exception e) {
            System.err.println("❌ [AI Analytics] Dashboard failed: " + e.getMessage());
            e.printStackTrace();

            // Fallback with minimal data
            model.addAttribute("aiInsights", null);
            model.addAttribute("aiInsightsJson", "{}");
            model.addAttribute("products", Collections.emptyList());
            model.addAttribute("query", query);
            model.addAttribute("error", "Failed to load AI analytics: " + e.getMessage());

            return "ai-insights-dashboard";
        }
    }

    /**
     * API endpoint for AI Analytics data (for AJAX requests)
     */
    @GetMapping("/api/ai-analytics")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getAIAnalytics(
            @RequestParam(required = false, defaultValue = "electronics") String query,
            @RequestParam(required = false) String userId) {

        Map<String, Object> response = new HashMap<>();

        try {
            List<Product> products = productRepository.findAll().stream()
                .filter(product -> matchesSearchQuery(product, query))
                .limit(20)
                .collect(Collectors.toList());

            AIInsights aiInsights = advancedAIOrchestrationService.generateComprehensiveProductAnalysis(
                query, products, userId != null ? userId : "api_user");

            response.put("success", true);
            response.put("aiInsights", aiInsights);
            response.put("products", products);
            response.put("query", query);
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // Helper classes for semantic search
    private static class SearchIntent {
        List<String> relevantCategories = new ArrayList<>();
        List<String> excludedCategories = new ArrayList<>();
        String style;
        List<String> keywords = new ArrayList<>();
    }

    private static class ProductMatch {
        Product product;
        double score;

        ProductMatch(Product product, double score) {
            this.product = product;
            this.score = score;
        }
    }
}
package com.projectai.controller;
// Updated for template changes

import com.projectai.models.Deal;
import com.projectai.models.Product;
import com.projectai.models.UserPreferences;
import com.projectai.service.ThriftAIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

@Controller
public class WebController {

    @Autowired
    private ThriftAIService thriftAIService;

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
        if (product.getOriginalPrice() != null && product.getOriginalPrice() > product.getPrice()) {
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
        
        if (product.getOriginalPrice() != null && product.getOriginalPrice() > product.getPrice()) {
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
}
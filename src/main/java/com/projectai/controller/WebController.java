package com.projectai.controller;

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

@Controller
public class WebController {

    @Autowired
    private ThriftAIService thriftAIService;

    @GetMapping("/")
    public String home(Model model) {
        // Get platform overview for homepage
        Map<String, Object> overview = thriftAIService.getPlatformOverview();
        model.addAttribute("overview", overview);
        
        // Get some featured deals
        UserPreferences defaultPrefs = thriftAIService.getDefaultUserPreferences(null);
        List<Deal> featuredDeals = thriftAIService.findBestDeals(defaultPrefs, 6);
        model.addAttribute("featuredDeals", featuredDeals);
        
        return "index";
    }

    @GetMapping("/products")
    public String products(@RequestParam(required = false) String category,
                          @RequestParam(required = false) String search,
                          Model model) {
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
        
        model.addAttribute("products", products);
        model.addAttribute("categories", thriftAIService.getAllCategories());
        model.addAttribute("brands", thriftAIService.getAllBrands());
        
        return "products";
    }

    @GetMapping("/products/{id}")
    public String productDetail(@PathVariable String id, Model model) {
        Product product = thriftAIService.getProductById(id);
        if (product == null) {
            return "redirect:/products?error=notfound";
        }
        
        model.addAttribute("product", product);
        
        // Get similar products
        List<Product> similar = thriftAIService.getProductsByCategory(product.getCategory())
                .stream()
                .filter(p -> !p.getId().equals(id))
                .limit(4)
                .toList();
        model.addAttribute("similarProducts", similar);
        
        return "product-detail";
    }

    @GetMapping("/deals")
    public String deals(@RequestParam(defaultValue = "12") int limit, Model model) {
        UserPreferences defaultPrefs = thriftAIService.getDefaultUserPreferences(null);
        List<Deal> deals = thriftAIService.findBestDeals(defaultPrefs, limit);
        
        model.addAttribute("deals", deals);
        model.addAttribute("userPreferences", defaultPrefs);
        
        return "deals";
    }

    @GetMapping("/ai-deals")
    public String aiDeals(@RequestParam(defaultValue = "10") int limit, Model model) {
        UserPreferences defaultPrefs = thriftAIService.getDefaultUserPreferences(null);
        List<Deal> deals = thriftAIService.findBestDealsWithAI(defaultPrefs, limit);
        
        model.addAttribute("deals", deals);
        model.addAttribute("userPreferences", defaultPrefs);
        model.addAttribute("isAIEnhanced", true);
        
        return "deals";
    }

    @GetMapping("/analytics")
    public String analytics(Model model) {
        Map<String, Object> overview = thriftAIService.getPlatformOverview();
        Map<String, Long> categoryStats = thriftAIService.getCategoryStatistics();
        
        model.addAttribute("overview", overview);
        model.addAttribute("categoryStats", categoryStats);
        model.addAttribute("categories", thriftAIService.getAllCategories());
        
        return "analytics";
    }

    @GetMapping("/about")
    public String about(Model model) {
        return "about";
    }

    @GetMapping("/contact")
    public String contact(Model model) {
        return "contact";
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
}
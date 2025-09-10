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
    public String home(@RequestParam(required = false) String category,
                      @RequestParam(required = false) String search,
                      @RequestParam(required = false) String brand,
                      @RequestParam(defaultValue = "12") int limit,
                      Model model) {
        
        // Get platform overview for homepage
        Map<String, Object> overview = thriftAIService.getPlatformOverview();
        model.addAttribute("overview", overview);
        
        // Get some featured deals
        UserPreferences defaultPrefs = thriftAIService.getDefaultUserPreferences(null);
        List<Deal> featuredDeals = thriftAIService.findBestDeals(defaultPrefs, 6);
        model.addAttribute("featuredDeals", featuredDeals);
        
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
        List<Deal> aiDeals = thriftAIService.findBestDealsWithAI(defaultPrefs, 8);
        model.addAttribute("aiDeals", aiDeals);
        
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
        
        // Get platform overview for homepage
        Map<String, Object> overview = thriftAIService.getPlatformOverview();
        model.addAttribute("overview", overview);
        
        // Get some featured deals
        UserPreferences defaultPrefs = thriftAIService.getDefaultUserPreferences(null);
        List<Deal> featuredDeals = thriftAIService.findBestDeals(defaultPrefs, 6);
        model.addAttribute("featuredDeals", featuredDeals);
        
        // Get all products
        List<Product> products = thriftAIService.getAllAvailableProducts();
        model.addAttribute("products", products);
        model.addAttribute("categories", thriftAIService.getAllCategories());
        model.addAttribute("brands", thriftAIService.getAllBrands());
        
        // Get AI deals as well
        List<Deal> aiDeals = thriftAIService.findBestDealsWithAI(defaultPrefs, 8);
        model.addAttribute("aiDeals", aiDeals);
        
        // Add the selected product and similar products
        model.addAttribute("selectedProduct", product);
        
        // Get similar products
        List<Product> similar = thriftAIService.getProductsByCategory(product.getCategory())
                .stream()
                .filter(p -> !p.getId().equals(id))
                .limit(4)
                .toList();
        model.addAttribute("similarProducts", similar);
        
        return "index";
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
}
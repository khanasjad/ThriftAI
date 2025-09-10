package com.projectai.controller;

import com.projectai.models.Product;
import com.projectai.models.Seller;
import com.projectai.repository.ProductRepository;
import com.projectai.repository.SellerRepository;
import com.projectai.service.ExternalMarketplaceService;
import com.projectai.service.TrendingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Controller
@RequestMapping("/sellers")
public class SellerController {

    @Autowired
    private SellerRepository sellerRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private ExternalMarketplaceService externalMarketplaceService;
    
    @Autowired
    private TrendingService trendingService;

    @GetMapping
    public String sellersHome(Model model) {
        List<Seller> recentSellers = sellerRepository.findAll().stream()
                .sorted((s1, s2) -> s2.getCreatedAt().compareTo(s1.getCreatedAt()))
                .limit(6)
                .toList();
        
        model.addAttribute("recentSellers", recentSellers);
        model.addAttribute("totalSellers", sellerRepository.count());
        model.addAttribute("activeSellers", sellerRepository.countActiveSellers());
        model.addAttribute("verifiedSellers", sellerRepository.countVerifiedSellers());
        model.addAttribute("pendingSellers", sellerRepository.countByStatus(Seller.SellerStatus.PENDING));
        
        return "sellers/index";
    }

    @GetMapping("/register")
    public String showRegistrationForm(Model model) {
        model.addAttribute("seller", new Seller());
        return "sellers/register";
    }

    @PostMapping("/register")
    public String registerSeller(@Valid @ModelAttribute("seller") Seller seller, 
                               BindingResult result, 
                               RedirectAttributes redirectAttributes, 
                               Model model) {
        
        if (result.hasErrors()) {
            return "sellers/register";
        }
        
        // Check if email already exists
        Optional<Seller> existingSeller = sellerRepository.findByEmail(seller.getEmail());
        if (existingSeller.isPresent()) {
            result.rejectValue("email", "error.seller", "Email already registered");
            return "sellers/register";
        }
        
        try {
            sellerRepository.save(seller);
            redirectAttributes.addFlashAttribute("successMessage", 
                "Registration successful! Your application is under review.");
            return "redirect:/sellers/dashboard/" + seller.getId();
        } catch (Exception e) {
            result.rejectValue("email", "error.seller", "Registration failed. Please try again.");
            return "sellers/register";
        }
    }

    @GetMapping("/dashboard/{sellerId}")
    public String sellerDashboard(@PathVariable String sellerId, Model model) {
        Optional<Seller> sellerOpt = sellerRepository.findById(sellerId);
        
        if (sellerOpt.isEmpty()) {
            return "redirect:/sellers?error=seller-not-found";
        }
        
        Seller seller = sellerOpt.get();
        model.addAttribute("seller", seller);
        
        // Add dashboard stats
        model.addAttribute("totalSales", seller.getTotalSales());
        model.addAttribute("totalRevenue", seller.getTotalRevenue());
        model.addAttribute("rating", seller.getRating());
        model.addAttribute("status", seller.getStatus().toString());
        
        return "sellers/dashboard";
    }

    @GetMapping("/profile/{sellerId}")
    public String sellerProfile(@PathVariable String sellerId, Model model) {
        Optional<Seller> sellerOpt = sellerRepository.findById(sellerId);
        
        if (sellerOpt.isEmpty()) {
            return "redirect:/sellers?error=seller-not-found";
        }
        
        model.addAttribute("seller", sellerOpt.get());
        return "sellers/profile";
    }

    @GetMapping("/edit/{sellerId}")
    public String editSellerForm(@PathVariable String sellerId, Model model) {
        Optional<Seller> sellerOpt = sellerRepository.findById(sellerId);
        
        if (sellerOpt.isEmpty()) {
            return "redirect:/sellers?error=seller-not-found";
        }
        
        model.addAttribute("seller", sellerOpt.get());
        return "sellers/edit";
    }

    @PostMapping("/edit/{sellerId}")
    public String updateSeller(@PathVariable String sellerId,
                             @Valid @ModelAttribute("seller") Seller seller,
                             BindingResult result,
                             RedirectAttributes redirectAttributes) {
        
        if (result.hasErrors()) {
            return "sellers/edit";
        }
        
        try {
            seller.setId(sellerId);
            sellerRepository.save(seller);
            redirectAttributes.addFlashAttribute("successMessage", "Profile updated successfully!");
            return "redirect:/sellers/profile/" + sellerId;
        } catch (Exception e) {
            result.rejectValue("email", "error.seller", "Update failed. Please try again.");
            return "sellers/edit";
        }
    }

    @GetMapping("/directory")
    public String sellerDirectory(@RequestParam(required = false) String search,
                                @RequestParam(required = false) String city,
                                @RequestParam(required = false) String sellerType,
                                Model model) {
        
        List<Seller> sellers;
        
        if (search != null && !search.trim().isEmpty()) {
            sellers = sellerRepository.searchSellers(search.trim());
        } else if (city != null && !city.trim().isEmpty()) {
            sellers = sellerRepository.findByCityIgnoreCase(city.trim());
        } else if (sellerType != null && !sellerType.trim().isEmpty()) {
            try {
                Seller.SellerType type = Seller.SellerType.valueOf(sellerType.toUpperCase());
                sellers = sellerRepository.findBySellerType(type);
            } catch (IllegalArgumentException e) {
                sellers = sellerRepository.findActiveAndVerifiedSellers();
            }
        } else {
            sellers = sellerRepository.findActiveAndVerifiedSellers();
        }
        
        model.addAttribute("sellers", sellers);
        model.addAttribute("search", search);
        model.addAttribute("city", city);
        model.addAttribute("sellerType", sellerType);
        model.addAttribute("sellerTypes", Seller.SellerType.values());
        
        return "sellers/directory";
    }

    @GetMapping("/analytics")
    public String sellerAnalytics(Model model) {
        model.addAttribute("totalSellers", sellerRepository.count());
        model.addAttribute("activeSellers", sellerRepository.countActiveSellers());
        model.addAttribute("verifiedSellers", sellerRepository.countVerifiedSellers());
        model.addAttribute("pendingSellers", sellerRepository.countByStatus(Seller.SellerStatus.PENDING));
        model.addAttribute("approvedSellers", sellerRepository.countByStatus(Seller.SellerStatus.APPROVED));
        model.addAttribute("rejectedSellers", sellerRepository.countByStatus(Seller.SellerStatus.REJECTED));
        
        // Get top sellers
        List<Seller> topSellers = sellerRepository.findTopSellersByRevenue().stream().limit(10).toList();
        model.addAttribute("topSellers", topSellers);
        
        // Get seller type distribution
        List<Object[]> sellerTypeStats = sellerRepository.countBySellerType();
        model.addAttribute("sellerTypeStats", sellerTypeStats);
        
        // Get city distribution
        List<Object[]> cityStats = sellerRepository.countByCity();
        model.addAttribute("cityStats", cityStats);
        
        return "sellers/analytics";
    }

    @PostMapping("/approve/{sellerId}")
    @ResponseBody
    public String approveSeller(@PathVariable String sellerId) {
        Optional<Seller> sellerOpt = sellerRepository.findById(sellerId);
        
        if (sellerOpt.isPresent()) {
            Seller seller = sellerOpt.get();
            seller.setStatus(Seller.SellerStatus.APPROVED);
            seller.setVerified(true);
            sellerRepository.save(seller);
            return "success";
        }
        
        return "error";
    }

    @PostMapping("/reject/{sellerId}")
    @ResponseBody
    public String rejectSeller(@PathVariable String sellerId) {
        Optional<Seller> sellerOpt = sellerRepository.findById(sellerId);
        
        if (sellerOpt.isPresent()) {
            Seller seller = sellerOpt.get();
            seller.setStatus(Seller.SellerStatus.REJECTED);
            sellerRepository.save(seller);
            return "success";
        }
        
        return "error";
    }

    // ============= PRODUCT LISTING ENDPOINTS =============
    
    @GetMapping("/add-product")
    public String showAddProductForm(Model model) {
        model.addAttribute("product", new Product());
        
        // Get all sellers for dropdown
        List<Seller> activeSellers = sellerRepository.findActiveAndVerifiedSellers();
        model.addAttribute("sellers", activeSellers);
        
        // Add trending data
        model.addAttribute("trendingItems", trendingService.getTrendingItems());
        model.addAttribute("trendingCategories", trendingService.getTrendingCategories());
        model.addAttribute("popularBrands", trendingService.getPopularBrands());
        
        // Add predefined options
        model.addAttribute("categories", List.of(
            "Clothing", "Shoes", "Accessories", "Bags", "Jewelry", 
            "Outerwear", "Dresses", "Tops", "Bottoms", "Activewear", 
            "Vintage", "Designer", "Electronics", "Home & Decor", "Books"
        ));
        
        model.addAttribute("conditions", List.of(
            "Like New", "Excellent", "Very Good", "Good", "Fair", "Poor"
        ));
        
        model.addAttribute("sizes", List.of(
            "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL",
            "Size 4", "Size 6", "Size 8", "Size 10", "Size 12", "Size 14", "Size 16",
            "Size 5", "Size 6", "Size 7", "Size 8", "Size 9", "Size 10", "Size 11", "Size 12",
            "One Size", "Free Size"
        ));
        
        return "sellers/add-product";
    }
    
    @PostMapping("/add-product")
    public String addProduct(@Valid @ModelAttribute("product") Product product,
                            BindingResult result,
                            @RequestParam("sellerId") String sellerId,
                            RedirectAttributes redirectAttributes,
                            Model model) {
        
        if (result.hasErrors()) {
            // Re-populate dropdowns on error
            List<Seller> activeSellers = sellerRepository.findActiveAndVerifiedSellers();
            model.addAttribute("sellers", activeSellers);
            model.addAttribute("categories", List.of(
                "Clothing", "Shoes", "Accessories", "Bags", "Jewelry", 
                "Outerwear", "Dresses", "Tops", "Bottoms", "Activewear", 
                "Vintage", "Designer", "Electronics", "Home & Decor", "Books"
            ));
            model.addAttribute("conditions", List.of(
                "Like New", "Excellent", "Very Good", "Good", "Fair", "Poor"
            ));
            model.addAttribute("sizes", List.of(
                "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL",
                "Size 4", "Size 6", "Size 8", "Size 10", "Size 12", "Size 14", "Size 16",
                "Size 5", "Size 6", "Size 7", "Size 8", "Size 9", "Size 10", "Size 11", "Size 12",
                "One Size", "Free Size"
            ));
            return "sellers/add-product";
        }
        
        // Find seller
        Optional<Seller> sellerOpt = sellerRepository.findById(sellerId);
        if (sellerOpt.isEmpty()) {
            result.rejectValue("seller", "error.product", "Invalid seller selected");
            return "sellers/add-product";
        }
        
        try {
            product.setSeller(sellerOpt.get());
            product.setAvailable(true);
            
            // If no image URL provided, use placeholder
            if (product.getImageUrl() == null || product.getImageUrl().trim().isEmpty()) {
                String placeholderText = product.getName().replaceAll("\\s+", "+");
                product.setImageUrl("https://via.placeholder.com/300x300?text=" + placeholderText);
            }
            
            productRepository.save(product);
            redirectAttributes.addFlashAttribute("successMessage", 
                "Product '" + product.getName() + "' added successfully!");
            return "redirect:/";
            
        } catch (Exception e) {
            result.rejectValue("name", "error.product", "Failed to save product. Please try again.");
            
            // Re-populate dropdowns on error
            List<Seller> activeSellers = sellerRepository.findActiveAndVerifiedSellers();
            model.addAttribute("sellers", activeSellers);
            model.addAttribute("categories", List.of(
                "Clothing", "Shoes", "Accessories", "Bags", "Jewelry", 
                "Outerwear", "Dresses", "Tops", "Bottoms", "Activewear", 
                "Vintage", "Designer", "Electronics", "Home & Decor", "Books"
            ));
            model.addAttribute("conditions", List.of(
                "Like New", "Excellent", "Very Good", "Good", "Fair", "Poor"
            ));
            model.addAttribute("sizes", List.of(
                "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL",
                "Size 4", "Size 6", "Size 8", "Size 10", "Size 12", "Size 14", "Size 16",
                "Size 5", "Size 6", "Size 7", "Size 8", "Size 9", "Size 10", "Size 11", "Size 12",
                "One Size", "Free Size"
            ));
            
            return "sellers/add-product";
        }
    }
    
    @GetMapping("/products")
    public String sellerProducts(@RequestParam(required = false) String search,
                                @RequestParam(required = false) String category,
                                @RequestParam(required = false) String condition,
                                @RequestParam(required = false) Double minPrice,
                                @RequestParam(required = false) Double maxPrice) {
        
        // Redirect to home page with search parameters
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
    
    @GetMapping("/api/search-external")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> searchExternalMarketplaces(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int limit) {
        
        try {
            Map<String, Object> response = new HashMap<>();
            
            // Search Amazon
            List<Map<String, Object>> amazonResults = externalMarketplaceService.searchAmazon(query, limit / 2);
            response.put("amazon", amazonResults);
            
            // Search eBay
            List<Map<String, Object>> ebayResults = externalMarketplaceService.searchEbay(query, limit / 2);
            response.put("ebay", ebayResults);
            
            response.put("success", true);
            response.put("total", amazonResults.size() + ebayResults.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Failed to search external marketplaces: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @GetMapping("/api/product-alternatives/{productId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getProductAlternatives(@PathVariable String productId) {
        
        try {
            Optional<Product> productOpt = productRepository.findById(productId);
            
            if (productOpt.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("error", "Product not found");
                return ResponseEntity.status(404).body(error);
            }
            
            Product product = productOpt.get();
            String searchQuery = product.getName() + " " + product.getBrand();
            
            Map<String, Object> response = new HashMap<>();
            
            // Find similar local products
            List<Product> similarProducts = productRepository.searchProducts(searchQuery).stream()
                    .filter(p -> !p.getId().equals(productId))
                    .limit(5)
                    .toList();
            
            response.put("localSimilar", similarProducts);
            
            // Search external marketplaces for alternatives
            List<Map<String, Object>> amazonAlternatives = externalMarketplaceService.searchAmazon(searchQuery, 5);
            List<Map<String, Object>> ebayAlternatives = externalMarketplaceService.searchEbay(searchQuery, 5);
            
            response.put("amazon", amazonAlternatives);
            response.put("ebay", ebayAlternatives);
            response.put("success", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Failed to get product alternatives: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    // ============= TRENDING API ENDPOINTS =============
    
    @GetMapping("/api/trending")
    @ResponseBody
    public ResponseEntity<List<TrendingService.TrendingItem>> getTrendingItems() {
        try {
            List<TrendingService.TrendingItem> trending = trendingService.getTrendingItems();
            return ResponseEntity.ok(trending);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
    
    @GetMapping("/api/trending/search")
    @ResponseBody
    public ResponseEntity<List<TrendingService.TrendingItem>> searchTrending(@RequestParam String query) {
        try {
            List<TrendingService.TrendingItem> results = trendingService.searchTrending(query);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
    
    @GetMapping("/api/trending/category/{category}")
    @ResponseBody
    public ResponseEntity<List<TrendingService.TrendingItem>> getTrendingByCategory(@PathVariable String category) {
        try {
            List<TrendingService.TrendingItem> results = trendingService.getTrendingByCategory(category);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
    
    @GetMapping("/api/trending/brands")
    @ResponseBody
    public ResponseEntity<List<String>> getPopularBrands() {
        try {
            List<String> brands = trendingService.getPopularBrands();
            return ResponseEntity.ok(brands);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
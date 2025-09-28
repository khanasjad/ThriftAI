package com.projectai.controller;

import com.projectai.models.AffiliateProduct;
import com.projectai.service.AffiliateProductService;
import com.projectai.service.ProductComparisonService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.projectai.service.ConfigurationService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Controller
@RequestMapping("/affiliate")
public class AffiliateProductController {

    private static final Logger logger = LoggerFactory.getLogger(AffiliateProductController.class);

    @Autowired
    private AffiliateProductService affiliateProductService;

    @Autowired
    private ConfigurationService configurationService;

    @Autowired
    private ProductComparisonService productComparisonService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Affiliate Products Dashboard
     */
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        logger.info("📊 Loading affiliate products dashboard");

        // Get product statistics
        Map<String, Object> stats = affiliateProductService.getProductStatistics();
        model.addAttribute("stats", stats);

        // Get recent products
        Pageable pageable = PageRequest.of(0, 10, Sort.by("createdAt").descending());
        Page<AffiliateProduct> recentProducts = affiliateProductService.searchProducts(
            null, null, null, null, null, null, pageable);
        model.addAttribute("recentProducts", recentProducts.getContent());

        return "affiliate/dashboard";
    }

    /**
     * Search affiliate products
     */
    @GetMapping("/search")
    public String searchPage(Model model) {
        logger.info("🔍 Loading affiliate product search page");
        return "affiliate/search";
    }

    /**
     * Search affiliate products API
     */
    @GetMapping("/api/search")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> searchProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) AffiliateProduct.Gender gender,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        logger.info("🔍 API search: keyword='{}', category='{}', brand='{}'", keyword, category, brand);

        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<AffiliateProduct> results = affiliateProductService.searchProducts(
            keyword, category, brand, minPrice, maxPrice, gender, pageable);

        Map<String, Object> response = Map.of(
            "products", results.getContent(),
            "totalElements", results.getTotalElements(),
            "totalPages", results.getTotalPages(),
            "currentPage", results.getNumber(),
            "size", results.getSize()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Product comparison page
     */
    @GetMapping("/compare")
    public String comparePage(@RequestParam(required = false) List<String> productIds, Model model) {
        logger.info("📊 Loading product comparison page with {} products",
                   productIds != null ? productIds.size() : 0);

        if (productIds != null && productIds.size() >= 2) {
            Map<String, Object> comparison = productComparisonService.compareProducts(productIds);
            model.addAttribute("comparison", comparison);

            // Serialize chart data for JavaScript
            try {
                Map<String, Object> chartData = (Map<String, Object>) comparison.get("chartData");
                if (chartData != null) {
                    model.addAttribute("chartDataJson", objectMapper.writeValueAsString(chartData));
                }
            } catch (Exception e) {
                logger.error("❌ Error serializing chart data: {}", e.getMessage());
                model.addAttribute("chartDataJson", "{}");
            }
        }

        model.addAttribute("productIds", productIds);
        return "affiliate/compare";
    }

    /**
     * Product comparison API
     */
    @PostMapping("/api/compare")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> compareProducts(@RequestBody List<String> productIds) {
        logger.info("📊 API comparison for {} products", productIds.size());

        if (productIds.size() < 2) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "At least 2 products are required for comparison",
                "provided", productIds.size()
            ));
        }

        Map<String, Object> comparison = productComparisonService.compareProducts(productIds);
        return ResponseEntity.ok(comparison);
    }

    /**
     * Category comparison
     */
    @GetMapping("/category/{category}/compare")
    public String categoryComparison(@PathVariable String category, Model model) {
        logger.info("📊 Loading category comparison for: {}", category);

        Map<String, Object> comparison = productComparisonService.getCategoryComparison(category);
        model.addAttribute("comparison", comparison);
        model.addAttribute("category", category);

        // Serialize chart data for JavaScript
        try {
            Map<String, Object> chartData = (Map<String, Object>) comparison.get("chartData");
            if (chartData != null) {
                model.addAttribute("chartDataJson", objectMapper.writeValueAsString(chartData));
            }
        } catch (Exception e) {
            logger.error("❌ Error serializing chart data: {}", e.getMessage());
            model.addAttribute("chartDataJson", "{}");
        }

        return "affiliate/category-compare";
    }

    /**
     * Fetch products from all sources
     */
    @PostMapping("/api/fetch-products")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> fetchProducts() {
        logger.info("🔄 Starting affiliate product fetch");

        CompletableFuture<Integer> fetchTask = affiliateProductService.fetchAllProducts();

        try {
            Integer totalFetched = fetchTask.get();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Product fetch completed",
                "totalFetched", totalFetched
            ));
        } catch (Exception e) {
            logger.error("❌ Error in product fetch: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Product fetch failed: " + e.getMessage()
            ));
        }
    }

    /**
     * Generate Amazon products based on search query
     */
    @PostMapping("/api/generate-for-search")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> generateProductsForSearch(
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int limit) {
        logger.info("🔍 Generating products for search query: '{}'", query);

        try {
            List<com.projectai.models.Product> products = affiliateProductService.generateSearchBasedAmazonProducts(query, limit);

            // Save the products
            List<com.projectai.models.Product> savedProducts = affiliateProductService.getProductRepository().saveAll(products);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Products generated for search",
                "query", query,
                "totalGenerated", savedProducts.size(),
                "products", savedProducts.stream().map(p -> Map.of(
                    "name", p.getName(),
                    "category", p.getCategory(),
                    "price", p.getPrice(),
                    "description", p.getDescription()
                )).collect(java.util.stream.Collectors.toList())
            ));
        } catch (Exception e) {
            logger.error("❌ Error generating products for search: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Product generation failed: " + e.getMessage()
            ));
        }
    }

    /**
     * Get product statistics
     */
    @GetMapping("/api/stats")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getStatistics() {
        logger.info("📊 Getting affiliate product statistics");

        Map<String, Object> stats = affiliateProductService.getProductStatistics();
        return ResponseEntity.ok(stats);
    }

    /**
     * Product details page
     */
    @GetMapping("/product/{productId}")
    public String productDetails(@PathVariable String productId, Model model) {
        logger.info("📱 Loading product details for: {}", productId);

        return affiliateProductService.searchProducts(null, null, null, null, null, null,
                PageRequest.of(0, 1))
                .stream()
                .filter(p -> p.getId().equals(productId))
                .findFirst()
                .map(product -> {
                    model.addAttribute("product", product);

                    // Get similar products for comparison
                    List<AffiliateProduct> similarProducts = affiliateProductService.searchProducts(
                        null, product.getCategory(), null, null, null, null,
                        PageRequest.of(0, 5)).getContent();
                    similarProducts.removeIf(p -> p.getId().equals(productId));
                    model.addAttribute("similarProducts", similarProducts);

                    return "affiliate/product-details";
                })
                .orElse("redirect:/affiliate/search?error=Product not found");
    }

    /**
     * Bulk product operations
     */
    @PostMapping("/api/bulk-operations")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> bulkOperations(
            @RequestParam String operation,
            @RequestBody List<String> productIds) {

        logger.info("🔧 Bulk operation '{}' on {} products", operation, productIds.size());

        try {
            switch (operation.toLowerCase()) {
                case "compare":
                    if (productIds.size() < 2) {
                        return ResponseEntity.badRequest().body(Map.of(
                            "error", "At least 2 products required for comparison"
                        ));
                    }
                    Map<String, Object> comparison = productComparisonService.compareProducts(productIds);
                    return ResponseEntity.ok(Map.of(
                        "success", true,
                        "operation", "compare",
                        "result", comparison
                    ));

                case "export":
                    // TODO: Implement export functionality
                    return ResponseEntity.ok(Map.of(
                        "success", true,
                        "operation", "export",
                        "message", "Export functionality coming soon"
                    ));

                default:
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "Unknown operation: " + operation
                    ));
            }
        } catch (Exception e) {
            logger.error("❌ Error in bulk operation: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    /**
     * Product recommendations based on comparison
     */
    @GetMapping("/api/recommendations")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getRecommendations(
            @RequestParam String category,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String preferredBrand) {

        logger.info("💡 Getting recommendations for category: {}", category);

        Pageable pageable = PageRequest.of(0, 10, Sort.by("rating").descending());
        Page<AffiliateProduct> products = affiliateProductService.searchProducts(
            null, category, preferredBrand, null, maxPrice, null, pageable);

        Map<String, Object> recommendations = Map.of(
            "category", category,
            "recommendedProducts", products.getContent(),
            "criteria", Map.of(
                "maxPrice", maxPrice,
                "preferredBrand", preferredBrand,
                "sortBy", "rating"
            )
        );

        return ResponseEntity.ok(recommendations);
    }

    /**
     * Advanced search with filters
     */
    @GetMapping("/advanced-search")
    public String advancedSearchPage(Model model) {
        logger.info("🔍 Loading advanced search page");

        // Get available filters
        // Use configuration service for categories instead of hardcoded values
        try {
            model.addAttribute("categories", configurationService.getAllActiveCategories());
        } catch (Exception e) {
            // Fallback to hardcoded values if configuration service fails
            model.addAttribute("categories", Arrays.asList("clothing", "accessories", "shoes", "bags"));
        }
        model.addAttribute("brands", Arrays.asList("Amazon Essentials", "Nike", "Adidas", "H&M", "Zara", "Uniqlo"));
        model.addAttribute("sources", AffiliateProduct.AffiliateSource.values());
        model.addAttribute("genders", AffiliateProduct.Gender.values());

        return "affiliate/advanced-search";
    }

    /**
     * Trending products
     */
    @GetMapping("/trending")
    public String trendingProducts(Model model) {
        logger.info("📈 Loading trending products");

        // Get trending products (highest rated, most recent)
        Pageable pageable = PageRequest.of(0, 20, Sort.by("rating").descending().and(Sort.by("createdAt").descending()));
        Page<AffiliateProduct> trendingProducts = affiliateProductService.searchProducts(
            null, null, null, null, null, null, pageable);

        model.addAttribute("trendingProducts", trendingProducts.getContent());

        return "affiliate/trending";
    }

    /**
     * Price tracking and alerts
     */
    @GetMapping("/price-tracking")
    public String priceTracking(Model model) {
        logger.info("💰 Loading price tracking page");

        // Get products with discounts
        Pageable pageable = PageRequest.of(0, 20);
        Page<AffiliateProduct> discountedProducts = affiliateProductService.searchProducts(
            null, null, null, null, null, null, pageable);

        List<AffiliateProduct> productsWithDiscounts = discountedProducts.getContent()
            .stream()
            .filter(AffiliateProduct::hasDiscount)
            .toList();

        model.addAttribute("discountedProducts", productsWithDiscounts);

        return "affiliate/price-tracking";
    }
}
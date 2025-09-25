package com.projectai.controller;

import com.projectai.models.Product;
import com.projectai.service.OpenSourceProductService;
import com.projectai.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Controller
@RequestMapping("/bulk-products")
public class OpenSourceProductController {

    private static final Logger logger = LoggerFactory.getLogger(OpenSourceProductController.class);

    @Autowired
    private OpenSourceProductService openSourceProductService;

    @Autowired
    private ProductRepository productRepository;

    /**
     * Generate and save 1000 products from open source APIs with Claude intelligence
     */
    @PostMapping("/api/generate-1000")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> generate1000Products() {
        logger.info("🚀 [Bulk Generation] Starting generation of 1000 products from open source APIs");

        try {
            // Generate 1000 products using open source APIs + Claude
            CompletableFuture<List<Product>> productsFuture = openSourceProductService.fetch1000Products();
            List<Product> products = productsFuture.get();

            // Save all products to database
            logger.info("💾 [Database] Saving {} products to database", products.size());
            List<Product> savedProducts = productRepository.saveAll(products);

            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Successfully generated and saved 1000 products");
            response.put("totalGenerated", products.size());
            response.put("totalSaved", savedProducts.size());
            response.put("dataSources", List.of(
                "Fake Store API",
                "DummyJSON API",
                "Claude AI Generation",
                "Category-based Generation",
                "Seasonal Products",
                "Brand-specific Products",
                "Product Variations"
            ));
            response.put("categories", getProductCategories(savedProducts));
            response.put("priceRange", getPriceRange(savedProducts));
            response.put("generationMethod", "Open Source APIs + Claude AI Intelligence");

            logger.info("✅ [Bulk Generation] Successfully generated {} products with {} saved to database",
                products.size(), savedProducts.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ [Bulk Generation] Failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Failed to generate products: " + e.getMessage());
            error.put("suggestion", "Check API connectivity and Claude API key configuration");
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Generate additional products (for topping up to 1000+)
     */
    @PostMapping("/api/generate-additional")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> generateAdditionalProducts(
            @RequestParam(defaultValue = "200") int count) {

        logger.info("➕ [Additional Generation] Generating {} additional products", count);

        try {
            // Check current product count
            long currentCount = productRepository.count();

            CompletableFuture<List<Product>> productsFuture = openSourceProductService.fetch1000Products();
            List<Product> newProducts = productsFuture.get().stream().limit(count).toList();

            List<Product> savedProducts = productRepository.saveAll(newProducts);
            long finalCount = productRepository.count();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", String.format("Added %d new products", savedProducts.size()));
            response.put("previousCount", currentCount);
            response.put("addedCount", savedProducts.size());
            response.put("totalCount", finalCount);
            response.put("generatedProducts", savedProducts);

            logger.info("✅ [Additional Generation] Added {} products (total: {})", savedProducts.size(), finalCount);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ [Additional Generation] Failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Failed to generate additional products: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get bulk products dashboard
     */
    @GetMapping("/dashboard")
    public String bulkProductsDashboard(Model model) {
        logger.info("📊 [Dashboard] Loading bulk products dashboard");

        try {
            long totalProducts = productRepository.count();
            List<Product> recentProducts = productRepository.findAll().stream().limit(20).toList();

            model.addAttribute("totalProducts", totalProducts);
            model.addAttribute("recentProducts", recentProducts);
            model.addAttribute("needsGeneration", totalProducts < 1000);
            model.addAttribute("targetCount", 1000);
            model.addAttribute("remainingToGenerate", Math.max(0, 1000 - totalProducts));

            if (!recentProducts.isEmpty()) {
                model.addAttribute("categories", getProductCategories(recentProducts));
                model.addAttribute("priceRange", getPriceRange(recentProducts));
            }

            logger.info("📊 [Dashboard] Loaded dashboard with {} products", totalProducts);

        } catch (Exception e) {
            logger.error("❌ [Dashboard] Failed to load: {}", e.getMessage());
            model.addAttribute("error", "Failed to load dashboard: " + e.getMessage());
        }

        return "bulk-products-dashboard";
    }

    /**
     * Get product statistics and analytics
     */
    @GetMapping("/api/statistics")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getProductStatistics() {
        logger.info("📈 [Statistics] Generating product statistics");

        try {
            List<Product> allProducts = productRepository.findAll();

            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalProducts", allProducts.size());
            statistics.put("categories", getCategoryStatistics(allProducts));
            statistics.put("brands", getBrandStatistics(allProducts));
            statistics.put("priceAnalysis", getPriceAnalysis(allProducts));
            statistics.put("conditionBreakdown", getConditionBreakdown(allProducts));
            statistics.put("availabilityStatus", getAvailabilityStatus(allProducts));

            return ResponseEntity.ok(statistics);

        } catch (Exception e) {
            logger.error("❌ [Statistics] Failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Failed to generate statistics: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Search within the 1000+ generated products
     */
    @GetMapping("/api/search")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> searchProducts(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        logger.info("🔍 [Bulk Search] Searching for '{}' (page: {}, size: {})", query, page, size);

        try {
            List<Product> allProducts = productRepository.findAll();
            List<Product> filteredProducts = allProducts.stream()
                .filter(product -> matchesQuery(product, query))
                .skip((long) page * size)
                .limit(size)
                .toList();

            long totalMatches = allProducts.stream()
                .filter(product -> matchesQuery(product, query))
                .count();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("query", query);
            response.put("products", filteredProducts);
            response.put("totalResults", totalMatches);
            response.put("page", page);
            response.put("size", size);
            response.put("hasMore", totalMatches > (page + 1) * size);

            logger.info("✅ [Bulk Search] Found {} matches for '{}'", totalMatches, query);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ [Bulk Search] Failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Search failed: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Clear all products (for testing regeneration)
     */
    @PostMapping("/api/clear-all")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> clearAllProducts() {
        logger.info("🗑️ [Clear All] Clearing all products from database");

        try {
            long count = productRepository.count();
            productRepository.deleteAll();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "All products cleared successfully");
            response.put("deletedCount", count);
            response.put("remainingCount", productRepository.count());

            logger.info("✅ [Clear All] Deleted {} products", count);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ [Clear All] Failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Failed to clear products: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get sample products for preview
     */
    @GetMapping("/api/sample")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getSampleProducts(
            @RequestParam(defaultValue = "50") int count) {

        logger.info("📦 [Sample] Getting {} sample products", count);

        try {
            List<Product> sampleProducts = productRepository.findAll().stream()
                .limit(count)
                .toList();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("sampleSize", sampleProducts.size());
            response.put("totalAvailable", productRepository.count());
            response.put("products", sampleProducts);
            response.put("categories", getProductCategories(sampleProducts));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ [Sample] Failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Failed to get sample: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    // Helper methods for analytics and utilities

    private Map<String, Integer> getProductCategories(List<Product> products) {
        Map<String, Integer> categories = new HashMap<>();
        for (Product product : products) {
            String category = product.getCategory() != null ? product.getCategory() : "Unknown";
            categories.put(category, categories.getOrDefault(category, 0) + 1);
        }
        return categories;
    }

    private Map<String, Double> getPriceRange(List<Product> products) {
        double min = products.stream().mapToDouble(Product::getPrice).min().orElse(0.0);
        double max = products.stream().mapToDouble(Product::getPrice).max().orElse(0.0);
        double avg = products.stream().mapToDouble(Product::getPrice).average().orElse(0.0);

        Map<String, Double> priceRange = new HashMap<>();
        priceRange.put("min", min);
        priceRange.put("max", max);
        priceRange.put("average", Math.round(avg * 100.0) / 100.0);
        return priceRange;
    }

    private Map<String, Integer> getCategoryStatistics(List<Product> products) {
        return getProductCategories(products);
    }

    private Map<String, Integer> getBrandStatistics(List<Product> products) {
        Map<String, Integer> brands = new HashMap<>();
        for (Product product : products) {
            String brand = product.getBrand() != null ? product.getBrand() : "Unknown";
            brands.put(brand, brands.getOrDefault(brand, 0) + 1);
        }
        return brands;
    }

    private Map<String, Object> getPriceAnalysis(List<Product> products) {
        Map<String, Object> analysis = new HashMap<>();

        if (products.isEmpty()) {
            return analysis;
        }

        double[] prices = products.stream().mapToDouble(Product::getPrice).toArray();
        Arrays.sort(prices);

        analysis.put("min", prices[0]);
        analysis.put("max", prices[prices.length - 1]);
        analysis.put("median", prices[prices.length / 2]);
        analysis.put("average", Arrays.stream(prices).average().orElse(0.0));

        // Price ranges
        Map<String, Integer> ranges = new HashMap<>();
        for (double price : prices) {
            if (price < 25) ranges.put("Under $25", ranges.getOrDefault("Under $25", 0) + 1);
            else if (price < 50) ranges.put("$25-$50", ranges.getOrDefault("$25-$50", 0) + 1);
            else if (price < 100) ranges.put("$50-$100", ranges.getOrDefault("$50-$100", 0) + 1);
            else if (price < 200) ranges.put("$100-$200", ranges.getOrDefault("$100-$200", 0) + 1);
            else ranges.put("Over $200", ranges.getOrDefault("Over $200", 0) + 1);
        }
        analysis.put("priceRanges", ranges);

        return analysis;
    }

    private Map<String, Integer> getConditionBreakdown(List<Product> products) {
        Map<String, Integer> conditions = new HashMap<>();
        for (Product product : products) {
            String condition = product.getCondition() != null ? product.getCondition() : "Unknown";
            conditions.put(condition, conditions.getOrDefault(condition, 0) + 1);
        }
        return conditions;
    }

    private Map<String, Integer> getAvailabilityStatus(List<Product> products) {
        Map<String, Integer> status = new HashMap<>();
        int available = 0, unavailable = 0;

        for (Product product : products) {
            if (product.isAvailable()) {
                available++;
            } else {
                unavailable++;
            }
        }

        status.put("available", available);
        status.put("unavailable", unavailable);
        return status;
    }

    private boolean matchesQuery(Product product, String query) {
        String lowerQuery = query.toLowerCase();
        return (product.getName() != null && product.getName().toLowerCase().contains(lowerQuery)) ||
               (product.getBrand() != null && product.getBrand().toLowerCase().contains(lowerQuery)) ||
               (product.getCategory() != null && product.getCategory().toLowerCase().contains(lowerQuery)) ||
               (product.getDescription() != null && product.getDescription().toLowerCase().contains(lowerQuery));
    }
}
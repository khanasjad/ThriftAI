package com.projectai.controller;

import com.projectai.models.Product;
import com.projectai.service.DynamicProductService;
import com.projectai.service.DynamicVisualizationService;
import com.projectai.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Controller
@RequestMapping("/dynamic")
public class DynamicProductController {

    private static final Logger logger = LoggerFactory.getLogger(DynamicProductController.class);

    @Autowired
    private DynamicProductService dynamicProductService;

    @Autowired
    private DynamicVisualizationService visualizationService;

    @Autowired
    private ProductRepository productRepository;

    /**
     * Dynamic product search using LLM analysis - completely no hardcoded products
     */
    @PostMapping("/api/search")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> dynamicSearch(@RequestBody Map<String, String> request) {
        String query = request.get("query");
        Integer limit = Integer.parseInt(request.getOrDefault("limit", "10"));

        logger.info("🚀 [Dynamic Search] Starting fully LLM-powered search for: '{}', limit: {}", query, limit);

        try {
            // Step 1: Fetch dynamic products using LLM (no hardcoded data)
            CompletableFuture<List<Product>> productsFuture = dynamicProductService.fetchDynamicProducts(query, limit);
            List<Product> products = productsFuture.get();

            // Step 2: Save products to database (temporary storage)
            List<Product> savedProducts = productRepository.saveAll(products);

            // Step 3: Generate dynamic visualizations and insights
            Map<String, Object> visualizations = visualizationService.generateDynamicVisualizations(savedProducts, query);

            // Step 4: Prepare comprehensive response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("query", query);
            response.put("totalProducts", savedProducts.size());
            response.put("products", savedProducts);
            response.put("visualizations", visualizations);
            response.put("searchType", "Fully Dynamic LLM-Powered");
            response.put("generationMethod", "Claude API + Amazon Integration");
            response.put("dataSource", "Real-time LLM Analysis");

            logger.info("✅ [Dynamic Search] Generated {} LLM products with full visualization suite", savedProducts.size());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ [Dynamic Search] Failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Dynamic search failed: " + e.getMessage());
            error.put("fallbackMessage", "Please ensure Claude API key is configured for full LLM functionality");
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Dynamic search page with LLM-powered visualizations
     */
    @GetMapping("/search")
    public String dynamicSearchPage(
            @RequestParam(value = "q", required = false) String query,
            Model model) {

        logger.info("🎨 [Dynamic UI] Loading fully dynamic search interface for: '{}'", query);

        if (query != null && !query.trim().isEmpty()) {
            try {
                // Generate dynamic products and visualizations
                CompletableFuture<List<Product>> productsFuture = dynamicProductService.fetchDynamicProducts(query, 12);
                List<Product> products = productsFuture.get();

                // Save to database
                List<Product> savedProducts = productRepository.saveAll(products);

                // Generate comprehensive visualizations
                Map<String, Object> visualizations = visualizationService.generateDynamicVisualizations(savedProducts, query);

                // Add to model
                model.addAttribute("query", query);
                model.addAttribute("products", savedProducts);
                model.addAttribute("resultCount", savedProducts.size());
                model.addAttribute("visualizations", visualizations);
                model.addAttribute("searchType", "Fully Dynamic LLM System");
                model.addAttribute("noHardcodedData", true);
                model.addAttribute("llmPowered", true);

                logger.info("✅ [Dynamic UI] Generated {} products with comprehensive visualizations", savedProducts.size());

            } catch (Exception e) {
                logger.error("❌ [Dynamic UI] Failed: {}", e.getMessage());
                model.addAttribute("query", query);
                model.addAttribute("products", List.of());
                model.addAttribute("resultCount", 0);
                model.addAttribute("error", "Dynamic search failed - please ensure API keys are configured");
                model.addAttribute("searchType", "Dynamic Search (Failed)");
            }
        } else {
            // Show empty state for dynamic search
            model.addAttribute("query", "");
            model.addAttribute("products", List.of());
            model.addAttribute("resultCount", 0);
            model.addAttribute("searchType", "Dynamic LLM Search Ready");
            model.addAttribute("welcomeMessage", "Enter a search query to generate products dynamically using LLM");
        }

        return "dynamic-search-results";
    }

    /**
     * Generate products on-demand using LLM
     */
    @PostMapping("/api/generate")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> generateProducts(
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(defaultValue = "true") boolean saveToDatabase) {

        logger.info("🏭 [On-Demand Generation] Generating {} products for: '{}'", limit, query);

        try {
            // Generate products using LLM
            CompletableFuture<List<Product>> productsFuture = dynamicProductService.fetchDynamicProducts(query, limit);
            List<Product> products = productsFuture.get();

            // Optionally save to database
            List<Product> savedProducts = products;
            if (saveToDatabase) {
                savedProducts = productRepository.saveAll(products);
                logger.info("💾 [Database] Saved {} generated products", savedProducts.size());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("query", query);
            response.put("generated", savedProducts.size());
            response.put("products", savedProducts);
            response.put("generationMethod", "LLM-Powered Dynamic Generation");
            response.put("saved", saveToDatabase);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ [On-Demand Generation] Failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Product generation failed: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get dynamic analytics and insights for a search query
     */
    @GetMapping("/api/analytics")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getDynamicAnalytics(@RequestParam String query) {
        logger.info("📊 [Dynamic Analytics] Generating analytics for: '{}'", query);

        try {
            // Generate products first
            CompletableFuture<List<Product>> productsFuture = dynamicProductService.fetchDynamicProducts(query, 15);
            List<Product> products = productsFuture.get();

            // Generate comprehensive visualizations and analytics
            Map<String, Object> analytics = visualizationService.generateDynamicVisualizations(products, query);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("query", query);
            response.put("analytics", analytics);
            response.put("productCount", products.size());
            response.put("generatedAt", System.currentTimeMillis());
            response.put("analysisType", "LLM-Powered Dynamic Analytics");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ [Dynamic Analytics] Failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Analytics generation failed: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Clear all products (for testing dynamic generation)
     */
    @PostMapping("/api/clear-database")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> clearDatabase() {
        logger.info("🗑️ [Database Clear] Clearing all products to test dynamic generation");

        try {
            long deletedCount = productRepository.count();
            productRepository.deleteAll();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Database cleared successfully");
            response.put("deletedProducts", deletedCount);
            response.put("readyFor", "Fully dynamic product generation");

            logger.info("✅ [Database Clear] Deleted {} products - system ready for dynamic generation", deletedCount);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ [Database Clear] Failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Failed to clear database: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * System status - shows if we're running fully dynamic
     */
    @GetMapping("/api/status")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getSystemStatus() {
        long productCount = productRepository.count();
        boolean isDynamic = productCount == 0; // True if no hardcoded products

        Map<String, Object> status = new HashMap<>();
        status.put("fullyDynamic", isDynamic);
        status.put("productCount", productCount);
        status.put("systemMode", isDynamic ? "Fully Dynamic LLM-Powered" : "Mixed Mode (some hardcoded data)");
        status.put("dataSource", isDynamic ? "100% LLM Generated" : "Mixed Sources");
        status.put("hardcodedDataRemoved", isDynamic);
        status.put("recommendedAction", isDynamic ?
            "System ready for dynamic search" :
            "Use /dynamic/api/clear-database to enable fully dynamic mode");

        return ResponseEntity.ok(status);
    }

    /**
     * Demo endpoint showing the difference between static and dynamic
     */
    @GetMapping("/demo")
    public String demoPage(Model model) {
        logger.info("🎪 [Demo] Loading dynamic vs static comparison demo");

        long productCount = productRepository.count();
        boolean hasHardcodedData = productCount > 0;

        model.addAttribute("hasHardcodedData", hasHardcodedData);
        model.addAttribute("productCount", productCount);
        model.addAttribute("demoQueries", List.of(
            "wireless bluetooth headphones",
            "vintage leather jackets",
            "gaming laptops under $1000",
            "eco-friendly water bottles",
            "minimalist home decor"
        ));

        return "dynamic-demo";
    }
}
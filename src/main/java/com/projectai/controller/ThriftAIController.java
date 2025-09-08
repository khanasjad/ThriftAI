package com.projectai.controller;

import com.projectai.models.Product;
import com.projectai.models.Deal;
import com.projectai.models.UserPreferences;

import com.projectai.service.ThriftAIService;
import com.projectai.dto.ApiResponse;
import com.projectai.dto.DealRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
public class ThriftAIController {

    @Autowired
    private ThriftAIService thriftAIService;

    // Product endpoints
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<Product>>> getAllProducts() {
        List<Product> products = thriftAIService.getAllAvailableProducts();
        return ResponseEntity.ok(new ApiResponse<>(true, "Products retrieved successfully", products));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ApiResponse<Product>> getProductById(@PathVariable String id) {
        Product product = thriftAIService.getProductById(id);
        if (product != null) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Product found", product));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/products/search")
    public ResponseEntity<ApiResponse<List<Product>>> searchProducts(
            @RequestParam String query,
            @RequestParam(required = false) String category) {
        List<Product> products = thriftAIService.searchProducts(query, category);
        return ResponseEntity.ok(new ApiResponse<>(true, "Search completed", products));
    }

    @GetMapping("/products/category/{category}")
    public ResponseEntity<ApiResponse<List<Product>>> getProductsByCategory(@PathVariable String category) {
        List<Product> products = thriftAIService.getProductsByCategory(category);
        return ResponseEntity.ok(new ApiResponse<>(true, "Products by category retrieved", products));
    }

    @PostMapping("/products")
    public ResponseEntity<ApiResponse<Product>> createProduct(@Valid @RequestBody Product product) {
        Product savedProduct = thriftAIService.saveProduct(product);
        return ResponseEntity.ok(new ApiResponse<>(true, "Product created successfully", savedProduct));
    }

    // Deal endpoints
    @PostMapping("/deals/find")
    public ResponseEntity<ApiResponse<List<Deal>>> findBestDeals(@RequestBody DealRequest request) {
        List<Deal> deals = thriftAIService.findBestDeals(request.getUserPreferences(), request.getLimit());
        return ResponseEntity.ok(new ApiResponse<>(true, "Best deals found", deals));
    }

    @GetMapping("/deals/recommendations")
    public ResponseEntity<ApiResponse<List<Deal>>> getRecommendations(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String userId) {
        
        // For demo purposes, use default preferences if no userId provided
        UserPreferences preferences = thriftAIService.getDefaultUserPreferences(userId);
        List<Deal> deals = thriftAIService.findBestDeals(preferences, limit);
        return ResponseEntity.ok(new ApiResponse<>(true, "Recommendations generated", deals));
    }

    // Analytics endpoints
    @GetMapping("/analytics/categories")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getCategoryStats() {
        Map<String, Long> stats = thriftAIService.getCategoryStatistics();
        return ResponseEntity.ok(new ApiResponse<>(true, "Category statistics retrieved", stats));
    }

    @GetMapping("/analytics/overview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOverview() {
        Map<String, Object> overview = thriftAIService.getPlatformOverview();
        return ResponseEntity.ok(new ApiResponse<>(true, "Platform overview retrieved", overview));
    }

    // Utility endpoints
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        List<String> categories = thriftAIService.getAllCategories();
        return ResponseEntity.ok(new ApiResponse<>(true, "Categories retrieved", categories));
    }

    @GetMapping("/brands")
    public ResponseEntity<ApiResponse<List<String>>> getBrands() {
        List<String> brands = thriftAIService.getAllBrands();
        return ResponseEntity.ok(new ApiResponse<>(true, "Brands retrieved", brands));
    }

    // Health check
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> healthCheck() {
        return ResponseEntity.ok(new ApiResponse<>(true, "ThriftAI API is running", "OK"));
    }

    // AI Enhancement endpoint (placeholder for future AI integration)
    @PostMapping("/ai/enhance-recommendations")
    public ResponseEntity<ApiResponse<List<Deal>>> enhanceRecommendations(
            @RequestBody DealRequest request,
            @RequestParam(defaultValue = "false") boolean useExternalAI) {
        
        List<Deal> deals;
        if (useExternalAI) {
            // This will be implemented when we add external AI integration
            deals = thriftAIService.findBestDealsWithAI(request.getUserPreferences(), request.getLimit());
        } else {
            deals = thriftAIService.findBestDeals(request.getUserPreferences(), request.getLimit());
        }
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Enhanced recommendations generated", deals));
    }

    // Exception handling
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleException(Exception e) {
        return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Error: " + e.getMessage(), null));
    }
}
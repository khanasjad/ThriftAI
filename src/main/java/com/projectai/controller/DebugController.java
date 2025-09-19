package com.projectai.controller;

import com.projectai.service.WorldClassSearchService;
import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.lang.reflect.Method;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @Autowired
    private WorldClassSearchService searchService;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/price-filter")
    public ResponseEntity<Map<String, Object>> testPriceFilter(@RequestParam String query) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Use reflection to access the private extractPriceFilter method
            Method extractPriceFilterMethod = WorldClassSearchService.class.getDeclaredMethod("extractPriceFilter", String.class);
            extractPriceFilterMethod.setAccessible(true);

            Double maxPrice = (Double) extractPriceFilterMethod.invoke(searchService, query);

            response.put("success", true);
            response.put("query", query);
            response.put("extractedMaxPrice", maxPrice);
            response.put("priceFilterDetected", maxPrice != null);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/cheapest-products")
    public ResponseEntity<Map<String, Object>> getCheapestProducts(@RequestParam(defaultValue = "10") int limit) {
        Map<String, Object> response = new HashMap<>();

        try {
            List<Product> cheapestProducts = productRepository.findByIsAvailableTrue()
                .stream()
                .sorted((a, b) -> Double.compare(a.getPrice(), b.getPrice()))
                .limit(limit)
                .collect(Collectors.toList());

            response.put("success", true);
            response.put("cheapestProducts", cheapestProducts.stream()
                .map(product -> {
                    Map<String, Object> productInfo = new HashMap<>();
                    productInfo.put("name", product.getName());
                    productInfo.put("price", product.getPrice());
                    productInfo.put("brand", product.getBrand());
                    productInfo.put("category", product.getCategory());
                    return productInfo;
                })
                .collect(Collectors.toList()));

            if (!cheapestProducts.isEmpty()) {
                response.put("cheapestPrice", cheapestProducts.get(0).getPrice());
                response.put("totalProducts", productRepository.findByIsAvailableTrue().size());
            }

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}
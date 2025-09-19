package com.projectai.controller;

import com.projectai.service.QualityScoreAIService;
import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/quality")
public class QualityController {

    @Autowired
    private QualityScoreAIService qualityScoreService;

    @Autowired
    private ProductRepository productRepository;

    @PostMapping("/analyze")
    public ResponseEntity<Map<String, Object>> analyzeProduct(@RequestBody Map<String, String> request) {
        String productId = request.get("productId");
        Map<String, Object> response = new HashMap<>();

        try {
            Optional<Product> productOpt = productRepository.findById(productId);
            if (productOpt.isEmpty()) {
                response.put("success", false);
                response.put("error", "Product not found");
                return ResponseEntity.badRequest().body(response);
            }

            Product product = productOpt.get();
            QualityScoreAIService.QualityScoreResult qualityResult =
                qualityScoreService.analyzeProductQuality(product);

            response.put("success", true);
            response.put("productId", productId);
            response.put("productName", product.getName());
            response.put("overallScore", qualityResult.overallScore);
            response.put("qualityGrade", qualityResult.qualityGrade);
            response.put("categoryScores", qualityResult.categoryScores);
            response.put("qualityFactors", qualityResult.qualityFactors);
            response.put("recommendations", qualityResult.recommendations);
            response.put("marketValueEstimate", qualityResult.marketValueEstimate);
            response.put("reliabilityIndex", qualityResult.reliabilityIndex);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Unable to analyze product quality: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/insights")
    public ResponseEntity<Map<String, Object>> getQualityInsights(
            @RequestParam(defaultValue = "20") int limit) {
        Map<String, Object> response = new HashMap<>();

        try {
            List<Product> recentProducts = productRepository.findByIsAvailableTrue()
                .stream()
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());

            Map<String, Object> insights = qualityScoreService.generateQualityInsights(recentProducts);

            response.put("success", true);
            response.putAll(insights);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Unable to generate insights: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/rank")
    public ResponseEntity<Map<String, Object>> rankProducts(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();

        try {
            @SuppressWarnings("unchecked")
            List<String> productIds = (List<String>) request.get("productIds");

            if (productIds == null || productIds.isEmpty()) {
                response.put("success", false);
                response.put("error", "No product IDs provided");
                return ResponseEntity.badRequest().body(response);
            }

            List<Product> products = new ArrayList<>();
            for (String id : productIds) {
                Optional<Product> product = productRepository.findById(id);
                product.ifPresent(products::add);
            }

            List<Product> rankedProducts = qualityScoreService.rankProductsByQuality(products);

            response.put("success", true);
            response.put("rankedProducts", rankedProducts.stream()
                .map(product -> {
                    Map<String, Object> productData = new HashMap<>();
                    productData.put("id", product.getId());
                    productData.put("name", product.getName());
                    productData.put("price", product.getPrice());
                    productData.put("qualityScore", product.getLocationMetadata().get("qualityScore"));
                    productData.put("qualityGrade", product.getLocationMetadata().get("qualityGrade"));
                    return productData;
                })
                .collect(java.util.stream.Collectors.toList()));

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Unable to rank products: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}
package com.projectai.controller;

import com.projectai.service.WorldClassSearchService;
import com.projectai.service.ExternalMarketplaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;

@RestController
@RequestMapping("/api")
public class SearchApiController {

    @Autowired
    private WorldClassSearchService worldClassSearchService;

    @Autowired(required = false)
    private ExternalMarketplaceService externalMarketplaceService;

    @GetMapping("/search-json")
    public ResponseEntity<Map<String, Object>> searchProducts(@RequestParam("q") String query) {
        try {
            WorldClassSearchService.SearchResponse response = worldClassSearchService.performWorldClassSearch(query);

            Map<String, Object> result = new HashMap<>();
            result.put("products", response.getProducts());
            result.put("totalResults", response.getTotalResults());
            result.put("insights", response.getInsights());
            result.put("suggestions", response.getSuggestions());
            result.put("successful", response.isSuccessful());
            result.put("originalQuery", response.getOriginalQuery());
            result.put("processedQuery", response.getProcessedQuery());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("products", Arrays.asList());
            errorResult.put("totalResults", 0);
            errorResult.put("insights", Arrays.asList("⚠️ Search error occurred"));
            errorResult.put("suggestions", Arrays.asList("electronics", "clothing", "shoes"));
            errorResult.put("successful", false);

            return ResponseEntity.ok(errorResult);
        }
    }

    @GetMapping("/external-search")
    public ResponseEntity<Map<String, Object>> externalSearch(@RequestParam("q") String query) {
        try {
            if (externalMarketplaceService != null) {
                // Use real external marketplace service when available
                var externalResults = externalMarketplaceService.searchAllMarketplaces(query, null, 10).join();

                Map<String, Object> result = new HashMap<>();
                result.put("products", externalResults);
                result.put("totalResults", externalResults.size());
                result.put("insights", Arrays.asList(
                    "🌐 Searching external marketplaces for \"" + query + "\"",
                    "💼 Results from partner stores and verified sellers"
                ));
                result.put("suggestions", Arrays.asList(
                    query + " deals",
                    query + " reviews",
                    "similar to " + query
                ));
                result.put("successful", !externalResults.isEmpty());

                return ResponseEntity.ok(result);
            } else {
                // Fallback response when external service is not available
                Map<String, Object> result = new HashMap<>();
                result.put("products", Arrays.asList());
                result.put("totalResults", 0);
                result.put("insights", Arrays.asList(
                    "❌ No local matches found for \"" + query + "\"",
                    "🔄 External marketplace search is currently unavailable",
                    "💡 Try searching for items we typically have: clothing, electronics, shoes, or vintage items"
                ));
                result.put("suggestions", Arrays.asList(
                    "electronics", "clothing", "vintage clothing",
                    "nike shoes", "apple products", "designer bags"
                ));
                result.put("successful", false);

                return ResponseEntity.ok(result);
            }
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("products", Arrays.asList());
            errorResult.put("totalResults", 0);
            errorResult.put("insights", Arrays.asList(
                "⚠️ External search temporarily unavailable",
                "🏠 Try searching our local inventory instead"
            ));
            errorResult.put("suggestions", Arrays.asList("electronics", "clothing", "shoes"));
            errorResult.put("successful", false);

            return ResponseEntity.ok(errorResult);
        }
    }

    @GetMapping("/search-suggestions")
    public ResponseEntity<Map<String, Object>> getSearchSuggestions(@RequestParam("q") String query) {
        try {
            // Generate intelligent suggestions based on query
            String[] suggestions;
            String lowerQuery = query.toLowerCase();

            if (lowerQuery.contains("car") || lowerQuery.contains("auto") || lowerQuery.contains("vehicle")) {
                suggestions = new String[]{
                    "car accessories", "automotive parts", "car electronics",
                    "vintage car memorabilia", "car care products", "automotive tools"
                };
            } else if (lowerQuery.contains("tech") || lowerQuery.contains("electronic")) {
                suggestions = new String[]{
                    "electronics", "computers", "phones", "tablets",
                    "gaming", "audio equipment", "smart watches"
                };
            } else {
                suggestions = new String[]{
                    "electronics", "clothing", "shoes", "vintage items",
                    "designer brands", "sports equipment", "home decor"
                };
            }

            Map<String, Object> result = new HashMap<>();
            result.put("suggestions", Arrays.asList(suggestions));
            result.put("query", query);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("suggestions", Arrays.asList("electronics", "clothing", "shoes"));
            errorResult.put("query", query);

            return ResponseEntity.ok(errorResult);
        }
    }
}
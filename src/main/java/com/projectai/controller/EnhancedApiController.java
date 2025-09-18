package com.projectai.controller;

import com.projectai.models.Product;
import com.projectai.service.*;
import com.projectai.service.EnhancedVisualSearchService.VisualSearchResult;
import com.projectai.service.ExternalMarketplaceIntegrationService.AggregatedSearchResult;
import com.projectai.service.ExternalMarketplaceIntegrationService.ComparisonResult;
import com.projectai.service.LocationOptimizationService.LocationOptimizationResult;
import com.projectai.service.LocationOptimizationService.ShippingCalculationResult;
import com.projectai.service.WorldClassSearchService.SearchResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/enhanced")
@CrossOrigin(origins = "*")
public class EnhancedApiController {

    @Autowired
    private EnhancedVisualSearchService enhancedVisualSearchService;

    @Autowired
    private ExternalMarketplaceIntegrationService marketplaceService;

    @Autowired
    private LocationOptimizationService locationService;

    @Autowired
    private CommissionPayoutService commissionService;

    @Autowired
    private ThriftAIService thriftAIService;

    @Autowired
    private WorldClassSearchService worldClassSearchService;

    // Enhanced Visual Search Endpoints
    @PostMapping("/visual-search/advanced")
    public ResponseEntity<Map<String, Object>> advancedVisualSearch(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "location", required = false) String userLocation,
            @RequestParam(value = "includeExternal", defaultValue = "true") boolean includeExternal) {

        Map<String, Object> response = new HashMap<>();

        try {
            if (image.isEmpty()) {
                response.put("success", false);
                response.put("error", "No image file provided");
                return ResponseEntity.badRequest().body(response);
            }

            // Step 1: Perform enhanced visual search
            VisualSearchResult visualResult = enhancedVisualSearchService.searchByImageAdvanced(image);

            // Step 2: Get local products
            List<Product> localProducts = visualResult.getProducts();

            // Step 3: Search external marketplaces if requested
            AggregatedSearchResult externalResult = null;
            if (includeExternal && !visualResult.getSearchTerms().isEmpty()) {
                String searchQuery = String.join(" ", visualResult.getSearchTerms());
                String category = (String) visualResult.getImageAnalysis().get("category");
                externalResult = marketplaceService.searchAcrossMarketplaces(searchQuery, category, 20);
            }

            // Step 4: Apply location optimization if provided
            LocationOptimizationResult locationResult = null;
            if (userLocation != null && !userLocation.trim().isEmpty()) {
                locationResult = locationService.optimizeForLocation(userLocation, localProducts);
                // Re-order local products by location optimization
                localProducts = locationService.prioritizeByLocation(localProducts, userLocation);
            }

            // Step 5: Build comprehensive response
            response.put("success", true);
            response.put("visualSearch", buildVisualSearchResponse(visualResult));
            response.put("localProducts", buildProductResponse(localProducts));

            if (externalResult != null) {
                response.put("externalProducts", buildExternalProductResponse(externalResult));
            }

            if (locationResult != null) {
                response.put("locationOptimization", buildLocationResponse(locationResult));
            }

            // Step 6: Generate comprehensive insights
            List<String> allInsights = new ArrayList<>();
            allInsights.addAll(visualResult.getAiInsights());
            if (externalResult != null) {
                allInsights.addAll(externalResult.getInsights());
            }
            if (locationResult != null) {
                allInsights.addAll(locationResult.getInsights());
            }

            response.put("insights", allInsights);
            response.put("totalResults", localProducts.size() +
                (externalResult != null ? externalResult.getProducts().size() : 0));

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Visual search failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }

        return ResponseEntity.ok(response);
    }

    // Marketplace Integration Endpoints
    @GetMapping("/marketplace/search")
    public ResponseEntity<Map<String, Object>> searchMarketplaces(
            @RequestParam("query") String query,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "maxResults", defaultValue = "20") int maxResults) {

        Map<String, Object> response = new HashMap<>();

        try {
            AggregatedSearchResult result = marketplaceService.searchAcrossMarketplaces(query, category, maxResults);

            response.put("success", true);
            response.put("products", buildExternalProductResponse(result));
            response.put("insights", result.getInsights());
            response.put("marketplaceBreakdown", buildMarketplaceBreakdown(result));

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Marketplace search failed: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/marketplace/compare")
    public ResponseEntity<Map<String, Object>> comparePrices(
            @RequestParam("productName") String productName,
            @RequestParam("brand") String brand) {

        Map<String, Object> response = new HashMap<>();

        try {
            ComparisonResult result = marketplaceService.comparePricesAcrossMarketplaces(productName, brand);

            response.put("success", true);
            response.put("productName", result.getProductName());
            response.put("brand", result.getBrand());
            response.put("priceComparisons", result.getPriceComparisons().stream()
                .map(this::buildPriceComparisonResponse)
                .collect(Collectors.toList()));

            // Add comparison insights
            double minPrice = result.getPriceComparisons().stream()
                .mapToDouble(p -> p.getPrice())
                .min().orElse(0);
            double maxPrice = result.getPriceComparisons().stream()
                .mapToDouble(p -> p.getPrice())
                .max().orElse(0);

            List<String> insights = Arrays.asList(
                "💰 Price range: $" + String.format("%.2f", minPrice) + " - $" + String.format("%.2f", maxPrice),
                "🏪 Found on " + result.getPriceComparisons().size() + " marketplaces",
                "💵 Potential savings: $" + String.format("%.2f", maxPrice - minPrice)
            );

            response.put("insights", insights);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Price comparison failed: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    // Location Optimization Endpoints
    @GetMapping("/location/optimize")
    public ResponseEntity<Map<String, Object>> optimizeByLocation(
            @RequestParam("location") String userLocation,
            @RequestParam(value = "query", required = false) String searchQuery,
            @RequestParam(value = "category", required = false) String category) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Get products to optimize
            List<Product> products;
            if (searchQuery != null && !searchQuery.trim().isEmpty()) {
                products = thriftAIService.searchProducts(searchQuery, category);
            } else if (category != null && !category.trim().isEmpty()) {
                products = thriftAIService.getProductsByCategory(category);
            } else {
                products = thriftAIService.getAllAvailableProducts().stream().limit(20).collect(Collectors.toList());
            }

            LocationOptimizationResult result = locationService.optimizeForLocation(userLocation, products);

            response.put("success", true);
            response.put("location", buildLocationResponse(result));
            response.put("optimizedProducts", buildProductResponse(
                result.getProductInfos().stream()
                    .map(info -> findProductById(products, info.getProductId()))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList())
            ));

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Location optimization failed: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/location/shipping")
    public ResponseEntity<Map<String, Object>> calculateShipping(
            @RequestParam("from") String fromLocation,
            @RequestParam("to") String toLocation,
            @RequestParam(value = "weight", defaultValue = "1.0") double weight,
            @RequestParam(value = "dimensions", defaultValue = "12x8x4") String dimensions) {

        Map<String, Object> response = new HashMap<>();

        try {
            ShippingCalculationResult result = locationService.calculateShippingCosts(
                fromLocation, toLocation, weight, dimensions);

            response.put("success", true);
            response.put("fromLocation", buildLocationDataResponse(result.getFromLocation()));
            response.put("toLocation", buildLocationDataResponse(result.getToLocation()));
            response.put("distance", result.getDistance());
            response.put("shippingOptions", result.getShippingOptions().stream()
                .map(this::buildShippingOptionResponse)
                .collect(Collectors.toList()));
            response.put("insights", result.getInsights());

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Shipping calculation failed: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    // Smart Search Endpoint (combines all services)
    @GetMapping("/search/smart")
    public ResponseEntity<Map<String, Object>> smartSearch(
            @RequestParam("query") String query,
            @RequestParam(value = "location", required = false) String userLocation,
            @RequestParam(value = "includeExternal", defaultValue = "true") boolean includeExternal,
            @RequestParam(value = "maxResults", defaultValue = "20") int maxResults) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Step 1: Local search
            SearchResponse localSearch = worldClassSearchService.performWorldClassSearch(query);
            List<Product> localProducts = localSearch.getProducts();

            // Step 2: External marketplace search
            AggregatedSearchResult externalResult = null;
            if (includeExternal) {
                externalResult = marketplaceService.searchAcrossMarketplaces(query, null, maxResults);
            }

            // Step 3: Location optimization
            LocationOptimizationResult locationResult = null;
            if (userLocation != null && !userLocation.trim().isEmpty()) {
                locationResult = locationService.optimizeForLocation(userLocation, localProducts);
                localProducts = locationService.prioritizeByLocation(localProducts, userLocation);
            }

            // Step 4: Build comprehensive response
            response.put("success", true);
            response.put("query", query);
            response.put("localProducts", buildProductResponse(localProducts));

            if (externalResult != null) {
                response.put("externalProducts", buildExternalProductResponse(externalResult));
            }

            if (locationResult != null) {
                response.put("locationOptimization", buildLocationResponse(locationResult));
            }

            // Combine all insights
            List<String> allInsights = new ArrayList<>();
            allInsights.addAll(localSearch.getInsights());
            if (externalResult != null) {
                allInsights.addAll(externalResult.getInsights());
            }
            if (locationResult != null) {
                allInsights.addAll(locationResult.getInsights());
            }

            response.put("insights", allInsights);
            response.put("totalResults", localProducts.size() +
                (externalResult != null ? externalResult.getProducts().size() : 0));

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Smart search failed: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    // Analytics Endpoint
    @GetMapping("/analytics/search-trends")
    public ResponseEntity<Map<String, Object>> getSearchTrends() {
        Map<String, Object> response = new HashMap<>();

        try {
            // Mock trending data (in production, this would come from analytics service)
            List<Map<String, Object>> trends = Arrays.asList(
                Map.of("term", "vintage nike", "searches", 1250, "growth", "+15%"),
                Map.of("term", "designer bags", "searches", 980, "growth", "+8%"),
                Map.of("term", "retro sneakers", "searches", 850, "growth", "+22%"),
                Map.of("term", "sustainable fashion", "searches", 720, "growth", "+35%"),
                Map.of("term", "y2k clothing", "searches", 650, "growth", "+45%")
            );

            response.put("success", true);
            response.put("trends", trends);
            response.put("timeframe", "Last 7 days");
            response.put("insights", Arrays.asList(
                "🔥 'Y2K clothing' trending with 45% growth",
                "♻️ Sustainable fashion searches up 35%",
                "👟 Sneaker searches consistently popular"
            ));

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Analytics unavailable: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    // Helper methods for building responses
    private Map<String, Object> buildVisualSearchResponse(VisualSearchResult result) {
        Map<String, Object> visualResponse = new HashMap<>();
        visualResponse.put("confidence", result.getConfidence());
        visualResponse.put("searchTerms", result.getSearchTerms());
        visualResponse.put("imageAnalysis", result.getImageAnalysis());
        visualResponse.put("similarities", result.getSimilarities().stream()
            .map(sim -> Map.of(
                "productId", sim.getProduct().getId(),
                "similarity", sim.getSimilarity()
            ))
            .collect(Collectors.toList()));
        return visualResponse;
    }

    private List<Map<String, Object>> buildProductResponse(List<Product> products) {
        return products.stream()
            .map(product -> {
                Map<String, Object> productMap = new HashMap<>();
                productMap.put("id", product.getId());
                productMap.put("name", product.getName());
                productMap.put("price", product.getPrice());
                productMap.put("originalPrice", product.getOriginalPrice());
                productMap.put("category", product.getCategory());
                productMap.put("brand", product.getBrand());
                productMap.put("description", product.getDescription());
                productMap.put("imageUrl", product.getImageUrl());
                productMap.put("condition", product.getCondition());
                productMap.put("size", product.getSize());
                productMap.put("isAvailable", product.isAvailable());
                return productMap;
            })
            .collect(Collectors.toList());
    }

    private Map<String, Object> buildExternalProductResponse(AggregatedSearchResult result) {
        Map<String, Object> externalResponse = new HashMap<>();
        externalResponse.put("products", result.getProducts().stream()
            .map(product -> {
                Map<String, Object> productMap = new HashMap<>();
                productMap.put("id", product.getId());
                productMap.put("name", product.getName());
                productMap.put("price", product.getPrice());
                productMap.put("originalPrice", product.getOriginalPrice());
                productMap.put("category", product.getCategory());
                productMap.put("brand", product.getBrand());
                productMap.put("description", product.getDescription());
                productMap.put("imageUrl", product.getImageUrl());
                productMap.put("marketplace", product.getMarketplace());
                productMap.put("externalUrl", product.getExternalUrl());
                productMap.put("rating", product.getRating());
                productMap.put("reviewCount", product.getReviewCount());
                productMap.put("shippingInfo", product.getShippingInfo());
                productMap.put("condition", product.getCondition());
                return productMap;
            })
            .collect(Collectors.toList()));
        externalResponse.put("marketplaceResults", result.getMarketplaceResults());
        return externalResponse;
    }

    private Map<String, Object> buildLocationResponse(LocationOptimizationResult result) {
        Map<String, Object> locationResponse = new HashMap<>();
        locationResponse.put("userLocation", buildLocationDataResponse(result.getUserLocation()));
        locationResponse.put("nearbyStores", result.getNearbyStores().stream()
            .map(store -> Map.of(
                "id", store.getId(),
                "name", store.getName(),
                "distance", store.getDistance(),
                "address", store.getAddress(),
                "rating", store.getRating(),
                "openNow", store.isOpenNow()
            ))
            .collect(Collectors.toList()));
        locationResponse.put("insights", result.getInsights());
        return locationResponse;
    }

    private Map<String, Object> buildLocationDataResponse(LocationOptimizationService.LocationData location) {
        Map<String, Object> locationMap = new HashMap<>();
        locationMap.put("originalAddress", location.getOriginalAddress());
        locationMap.put("formattedAddress", location.getFormattedAddress());
        locationMap.put("latitude", location.getLatitude());
        locationMap.put("longitude", location.getLongitude());
        return locationMap;
    }

    private Map<String, Object> buildShippingOptionResponse(LocationOptimizationService.ShippingOption option) {
        Map<String, Object> optionMap = new HashMap<>();
        optionMap.put("name", option.getName());
        optionMap.put("carrier", option.getCarrier());
        optionMap.put("cost", option.getCost());
        optionMap.put("deliveryDays", option.getDeliveryDays());
        optionMap.put("description", option.getDescription());
        optionMap.put("available", option.isAvailable());
        return optionMap;
    }

    private Map<String, Object> buildPriceComparisonResponse(ExternalMarketplaceIntegrationService.PriceComparison comparison) {
        Map<String, Object> comparisonMap = new HashMap<>();
        comparisonMap.put("marketplace", comparison.getMarketplace());
        comparisonMap.put("price", comparison.getPrice());
        comparisonMap.put("originalPrice", comparison.getOriginalPrice());
        comparisonMap.put("available", comparison.isAvailable());
        comparisonMap.put("notes", comparison.getNotes());
        return comparisonMap;
    }

    private Map<String, Object> buildMarketplaceBreakdown(AggregatedSearchResult result) {
        Map<String, Long> breakdown = result.getProducts().stream()
            .collect(Collectors.groupingBy(
                p -> p.getMarketplace(),
                Collectors.counting()
            ));

        return new HashMap<>(breakdown);
    }

    private Product findProductById(List<Product> products, String productId) {
        return products.stream()
            .filter(p -> p.getId().equals(productId))
            .findFirst()
            .orElse(null);
    }

    // Commission and Payout Endpoints
    @GetMapping("/commission/seller/{sellerId}")
    public ResponseEntity<CommissionPayoutService.PayoutSummary> getSellerPayout(
            @PathVariable String sellerId,
            @RequestParam(value = "startDate", required = false) String startDateStr,
            @RequestParam(value = "endDate", required = false) String endDateStr) {

        try {
            LocalDate startDate = startDateStr != null ? LocalDate.parse(startDateStr) : LocalDate.now().withDayOfMonth(1);
            LocalDate endDate = endDateStr != null ? LocalDate.parse(endDateStr) : LocalDate.now();

            CommissionPayoutService.PayoutSummary summary = commissionService.calculateSellerPayout(sellerId, startDate, endDate);
            return ResponseEntity.ok(summary);

        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/commission/all")
    public ResponseEntity<List<CommissionPayoutService.SellerPayoutOverview>> getAllSellerPayouts(
            @RequestParam(value = "startDate", required = false) String startDateStr,
            @RequestParam(value = "endDate", required = false) String endDateStr) {

        try {
            LocalDate startDate = startDateStr != null ? LocalDate.parse(startDateStr) : LocalDate.now().withDayOfMonth(1);
            LocalDate endDate = endDateStr != null ? LocalDate.parse(endDateStr) : LocalDate.now();

            List<CommissionPayoutService.SellerPayoutOverview> payouts = commissionService.getAllSellerPayouts(startDate, endDate);
            return ResponseEntity.ok(payouts);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/commission/process")
    public ResponseEntity<CommissionPayoutService.PayoutProcessingResult> processPayouts(
            @RequestBody Map<String, Object> request) {

        try {
            @SuppressWarnings("unchecked")
            List<String> sellerIds = (List<String>) request.get("sellerIds");
            String startDateStr = (String) request.get("startDate");
            String endDateStr = (String) request.get("endDate");

            LocalDate startDate = startDateStr != null ? LocalDate.parse(startDateStr) : LocalDate.now().withDayOfMonth(1);
            LocalDate endDate = endDateStr != null ? LocalDate.parse(endDateStr) : LocalDate.now();

            CommissionPayoutService.PayoutProcessingResult result = commissionService.processPayouts(sellerIds, startDate, endDate);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/commission/dashboard/{sellerId}")
    public ResponseEntity<CommissionPayoutService.SellerDashboardData> getSellerDashboard(
            @PathVariable String sellerId) {

        try {
            CommissionPayoutService.SellerDashboardData dashboard = commissionService.getSellerDashboard(sellerId);
            return ResponseEntity.ok(dashboard);

        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/commission/analytics")
    public ResponseEntity<CommissionPayoutService.CommissionAnalytics> getCommissionAnalytics(
            @RequestParam(value = "startDate", required = false) String startDateStr,
            @RequestParam(value = "endDate", required = false) String endDateStr) {

        try {
            LocalDate startDate = startDateStr != null ? LocalDate.parse(startDateStr) : LocalDate.now().minusMonths(1);
            LocalDate endDate = endDateStr != null ? LocalDate.parse(endDateStr) : LocalDate.now();

            CommissionPayoutService.CommissionAnalytics analytics = commissionService.getCommissionAnalytics(startDate, endDate);
            return ResponseEntity.ok(analytics);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
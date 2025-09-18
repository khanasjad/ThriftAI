package com.projectai.service;

import com.projectai.models.Product;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.*;
import java.util.stream.Collectors;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ExternalMarketplaceIntegrationService {

    @Value("${amazon.api.key:demo-key}")
    private String amazonApiKey;

    @Value("${ebay.api.key:demo-key}")
    private String ebayApiKey;

    @Value("${nike.api.key:demo-key}")
    private String nikeApiKey;

    @Value("${adidas.api.key:demo-key}")
    private String adidasApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final Random random = new Random();

    // Cache for external results (in production, use Redis)
    private final Map<String, List<ExternalProduct>> searchCache = new ConcurrentHashMap<>();

    public AggregatedSearchResult searchAcrossMarketplaces(String query, String category, int maxResults) {
        try {
            // Search multiple marketplaces in parallel
            List<CompletableFuture<MarketplaceSearchResult>> futures = Arrays.asList(
                CompletableFuture.supplyAsync(() -> searchAmazon(query, category, maxResults / 4)),
                CompletableFuture.supplyAsync(() -> searchEbay(query, category, maxResults / 4)),
                CompletableFuture.supplyAsync(() -> searchNike(query, category, maxResults / 4)),
                CompletableFuture.supplyAsync(() -> searchAdidas(query, category, maxResults / 4))
            );

            // Wait for all searches to complete
            List<MarketplaceSearchResult> results = futures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList());

            // Aggregate and deduplicate results
            return aggregateResults(results, query);

        } catch (Exception e) {
            return createFallbackResults(query, category, maxResults);
        }
    }

    public ComparisonResult comparePricesAcrossMarketplaces(String productName, String brand) {
        try {
            List<CompletableFuture<PriceComparison>> futures = Arrays.asList(
                CompletableFuture.supplyAsync(() -> getPriceFromAmazon(productName, brand)),
                CompletableFuture.supplyAsync(() -> getPriceFromEbay(productName, brand)),
                CompletableFuture.supplyAsync(() -> getPriceFromNike(productName, brand)),
                CompletableFuture.supplyAsync(() -> getPriceFromAdidas(productName, brand))
            );

            List<PriceComparison> prices = futures.stream()
                .map(CompletableFuture::join)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

            return new ComparisonResult(productName, brand, prices);

        } catch (Exception e) {
            return createFallbackPriceComparison(productName, brand);
        }
    }

    // Amazon integration (mock implementation - replace with actual Amazon Product Advertising API)
    private MarketplaceSearchResult searchAmazon(String query, String category, int maxResults) {
        try {
            if (!"demo-key".equals(amazonApiKey)) {
                return searchAmazonReal(query, category, maxResults);
            } else {
                return searchAmazonMock(query, category, maxResults);
            }
        } catch (Exception e) {
            return searchAmazonMock(query, category, maxResults);
        }
    }

    private MarketplaceSearchResult searchAmazonReal(String query, String category, int maxResults) {
        // TODO: Implement real Amazon Product Advertising API integration
        // This would use the Amazon Product Advertising API v5.0
        /*
        Map<String, Object> request = new HashMap<>();
        request.put("Keywords", query);
        request.put("SearchIndex", mapCategoryToAmazonIndex(category));
        request.put("ItemCount", maxResults);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "AWS4-HMAC-SHA256 " + generateAmazonSignature());
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
            "https://webservices.amazon.com/paapi5/searchitems", entity, Map.class);

        return parseAmazonResponse(response.getBody());
        */

        return searchAmazonMock(query, category, maxResults);
    }

    private MarketplaceSearchResult searchAmazonMock(String query, String category, int maxResults) {
        List<ExternalProduct> products = new ArrayList<>();

        for (int i = 0; i < Math.min(maxResults, 5); i++) {
            ExternalProduct product = new ExternalProduct();
            product.setId("amz_" + UUID.randomUUID().toString().substring(0, 8));
            product.setName(generateMockProductName(query, "Amazon"));
            product.setPrice(19.99 + random.nextDouble() * 200);
            product.setOriginalPrice(product.getPrice() * (1.1 + random.nextDouble() * 0.5));
            product.setCategory(category != null ? category : "Clothing");
            product.setBrand(selectRandomBrand());
            product.setDescription("High-quality " + query + " from Amazon marketplace");
            product.setImageUrl("https://via.placeholder.com/300x300?text=" + query.replace(" ", "+"));
            product.setMarketplace("Amazon");
            product.setExternalUrl("https://amazon.com/dp/" + product.getId());
            product.setRating(3.5 + random.nextDouble() * 1.5);
            product.setReviewCount(10 + random.nextInt(500));
            product.setShippingInfo("Free shipping with Prime");
            product.setAvailability(true);

            products.add(product);
        }

        return new MarketplaceSearchResult("Amazon", products, true);
    }

    // eBay integration (mock implementation)
    private MarketplaceSearchResult searchEbay(String query, String category, int maxResults) {
        List<ExternalProduct> products = new ArrayList<>();

        for (int i = 0; i < Math.min(maxResults, 5); i++) {
            ExternalProduct product = new ExternalProduct();
            product.setId("ebay_" + UUID.randomUUID().toString().substring(0, 8));
            product.setName(generateMockProductName(query, "eBay"));
            product.setPrice(15.99 + random.nextDouble() * 150);
            product.setOriginalPrice(product.getPrice() * (1.05 + random.nextDouble() * 0.3));
            product.setCategory(category != null ? category : "Clothing");
            product.setBrand(selectRandomBrand());
            product.setDescription("Pre-owned/vintage " + query + " from eBay");
            product.setImageUrl("https://via.placeholder.com/300x300?text=" + query.replace(" ", "+"));
            product.setMarketplace("eBay");
            product.setExternalUrl("https://ebay.com/itm/" + product.getId());
            product.setRating(3.2 + random.nextDouble() * 1.8);
            product.setReviewCount(5 + random.nextInt(100));
            product.setShippingInfo("Calculated shipping");
            product.setAvailability(true);
            product.setCondition(random.nextBoolean() ? "Used" : "New");

            products.add(product);
        }

        return new MarketplaceSearchResult("eBay", products, true);
    }

    // Nike integration (mock implementation)
    private MarketplaceSearchResult searchNike(String query, String category, int maxResults) {
        // Only search Nike if query is shoe/athletic related
        if (!isRelevantForNike(query, category)) {
            return new MarketplaceSearchResult("Nike", new ArrayList<>(), true);
        }

        List<ExternalProduct> products = new ArrayList<>();

        for (int i = 0; i < Math.min(maxResults, 3); i++) {
            ExternalProduct product = new ExternalProduct();
            product.setId("nike_" + UUID.randomUUID().toString().substring(0, 8));
            product.setName("Nike " + generateNikeProductName(query));
            product.setPrice(89.99 + random.nextDouble() * 120);
            product.setOriginalPrice(product.getPrice() * (1.1 + random.nextDouble() * 0.2));
            product.setCategory("Shoes");
            product.setBrand("Nike");
            product.setDescription("Official Nike " + query + " with premium materials");
            product.setImageUrl("https://via.placeholder.com/300x300?text=Nike+" + query.replace(" ", "+"));
            product.setMarketplace("Nike");
            product.setExternalUrl("https://nike.com/product/" + product.getId());
            product.setRating(4.2 + random.nextDouble() * 0.8);
            product.setReviewCount(50 + random.nextInt(300));
            product.setShippingInfo("Free shipping on orders $50+");
            product.setAvailability(true);

            products.add(product);
        }

        return new MarketplaceSearchResult("Nike", products, true);
    }

    // Adidas integration (mock implementation)
    private MarketplaceSearchResult searchAdidas(String query, String category, int maxResults) {
        // Only search Adidas if query is shoe/athletic related
        if (!isRelevantForAdidas(query, category)) {
            return new MarketplaceSearchResult("Adidas", new ArrayList<>(), true);
        }

        List<ExternalProduct> products = new ArrayList<>();

        for (int i = 0; i < Math.min(maxResults, 3); i++) {
            ExternalProduct product = new ExternalProduct();
            product.setId("adidas_" + UUID.randomUUID().toString().substring(0, 8));
            product.setName("Adidas " + generateAdidasProductName(query));
            product.setPrice(79.99 + random.nextDouble() * 140);
            product.setOriginalPrice(product.getPrice() * (1.1 + random.nextDouble() * 0.3));
            product.setCategory("Shoes");
            product.setBrand("Adidas");
            product.setDescription("Authentic Adidas " + query + " with innovative technology");
            product.setImageUrl("https://via.placeholder.com/300x300?text=Adidas+" + query.replace(" ", "+"));
            product.setMarketplace("Adidas");
            product.setExternalUrl("https://adidas.com/product/" + product.getId());
            product.setRating(4.0 + random.nextDouble() * 1.0);
            product.setReviewCount(30 + random.nextInt(200));
            product.setShippingInfo("Free shipping on orders $49+");
            product.setAvailability(true);

            products.add(product);
        }

        return new MarketplaceSearchResult("Adidas", products, true);
    }

    // Price comparison methods
    private PriceComparison getPriceFromAmazon(String productName, String brand) {
        double price = 50 + random.nextDouble() * 200;
        return new PriceComparison("Amazon", price, price * 1.15, true, "Prime eligible");
    }

    private PriceComparison getPriceFromEbay(String productName, String brand) {
        double price = 30 + random.nextDouble() * 150;
        return new PriceComparison("eBay", price, price * 1.1, true, "Auction available");
    }

    private PriceComparison getPriceFromNike(String productName, String brand) {
        if (!"Nike".equalsIgnoreCase(brand)) return null;
        double price = 80 + random.nextDouble() * 120;
        return new PriceComparison("Nike", price, price * 1.2, true, "Official store");
    }

    private PriceComparison getPriceFromAdidas(String productName, String brand) {
        if (!"Adidas".equalsIgnoreCase(brand)) return null;
        double price = 75 + random.nextDouble() * 130;
        return new PriceComparison("Adidas", price, price * 1.18, true, "Official store");
    }

    // Helper methods
    private AggregatedSearchResult aggregateResults(List<MarketplaceSearchResult> results, String query) {
        List<ExternalProduct> allProducts = results.stream()
            .flatMap(r -> r.getProducts().stream())
            .collect(Collectors.toList());

        // Deduplicate based on product name similarity
        List<ExternalProduct> deduplicatedProducts = deduplicateProducts(allProducts);

        // Sort by relevance and price
        deduplicatedProducts.sort((a, b) -> {
            // Primary sort: relevance to query
            int relevanceA = calculateRelevance(a, query);
            int relevanceB = calculateRelevance(b, query);
            if (relevanceA != relevanceB) {
                return Integer.compare(relevanceB, relevanceA);
            }
            // Secondary sort: price
            return Double.compare(a.getPrice(), b.getPrice());
        });

        // Generate insights
        List<String> insights = generateMarketplaceInsights(deduplicatedProducts, results);

        return new AggregatedSearchResult(deduplicatedProducts, results, insights);
    }

    private List<ExternalProduct> deduplicateProducts(List<ExternalProduct> products) {
        Map<String, ExternalProduct> uniqueProducts = new HashMap<>();

        for (ExternalProduct product : products) {
            String key = generateProductKey(product);
            if (!uniqueProducts.containsKey(key) ||
                product.getPrice() < uniqueProducts.get(key).getPrice()) {
                uniqueProducts.put(key, product);
            }
        }

        return new ArrayList<>(uniqueProducts.values());
    }

    private String generateProductKey(ExternalProduct product) {
        return (product.getBrand() + "_" + product.getName())
            .toLowerCase()
            .replaceAll("[^a-z0-9]", "_");
    }

    private int calculateRelevance(ExternalProduct product, String query) {
        String productText = (product.getName() + " " + product.getDescription()).toLowerCase();
        String[] queryWords = query.toLowerCase().split("\\s+");

        int relevance = 0;
        for (String word : queryWords) {
            if (productText.contains(word)) {
                relevance += 10;
            }
        }

        // Bonus for exact brand matches
        if (productText.contains(query.toLowerCase())) {
            relevance += 20;
        }

        return relevance;
    }

    private List<String> generateMarketplaceInsights(List<ExternalProduct> products,
                                                   List<MarketplaceSearchResult> results) {
        List<String> insights = new ArrayList<>();

        // Total products found
        int totalProducts = products.size();
        insights.add("🛍️ Found " + totalProducts + " products across " +
                    results.size() + " marketplaces");

        // Price insights
        if (!products.isEmpty()) {
            double minPrice = products.stream().mapToDouble(ExternalProduct::getPrice).min().orElse(0);
            double maxPrice = products.stream().mapToDouble(ExternalProduct::getPrice).max().orElse(0);
            double avgPrice = products.stream().mapToDouble(ExternalProduct::getPrice).average().orElse(0);

            insights.add("💰 Price range: $" + String.format("%.2f", minPrice) +
                        " - $" + String.format("%.2f", maxPrice) +
                        " (avg: $" + String.format("%.2f", avgPrice) + ")");
        }

        // Marketplace breakdown
        Map<String, Long> marketplaceCounts = products.stream()
            .collect(Collectors.groupingBy(ExternalProduct::getMarketplace, Collectors.counting()));

        if (marketplaceCounts.size() > 1) {
            insights.add("🏪 Available on: " + String.join(", ", marketplaceCounts.keySet()));
        }

        // Best deals
        if (products.size() > 3) {
            ExternalProduct cheapest = products.stream()
                .min(Comparator.comparing(ExternalProduct::getPrice))
                .orElse(null);
            if (cheapest != null) {
                insights.add("🔥 Best deal: " + cheapest.getName() +
                           " on " + cheapest.getMarketplace() +
                           " for $" + String.format("%.2f", cheapest.getPrice()));
            }
        }

        return insights;
    }

    private String generateMockProductName(String query, String marketplace) {
        List<String> adjectives = Arrays.asList("Premium", "Classic", "Vintage", "Modern",
                                              "Stylish", "Trendy", "Luxury", "Authentic");
        String adjective = adjectives.get(random.nextInt(adjectives.size()));
        return adjective + " " + query + " (" + marketplace + ")";
    }

    private String generateNikeProductName(String query) {
        List<String> nikeLines = Arrays.asList("Air Max", "Air Force", "React", "Zoom", "Free");
        String line = nikeLines.get(random.nextInt(nikeLines.size()));
        return line + " " + query;
    }

    private String generateAdidasProductName(String query) {
        List<String> adidasLines = Arrays.asList("Ultraboost", "Stan Smith", "Gazelle", "Superstar", "NMD");
        String line = adidasLines.get(random.nextInt(adidasLines.size()));
        return line + " " + query;
    }

    private String selectRandomBrand() {
        List<String> brands = Arrays.asList("Nike", "Adidas", "Puma", "Reebok", "New Balance",
                                          "Converse", "Vans", "ASICS", "Under Armour", "Generic");
        return brands.get(random.nextInt(brands.size()));
    }

    private boolean isRelevantForNike(String query, String category) {
        String lowerQuery = query.toLowerCase();
        return lowerQuery.contains("shoe") || lowerQuery.contains("sneaker") ||
               lowerQuery.contains("athletic") || lowerQuery.contains("sport") ||
               (category != null && category.toLowerCase().contains("shoe"));
    }

    private boolean isRelevantForAdidas(String query, String category) {
        return isRelevantForNike(query, category); // Same logic for now
    }

    private AggregatedSearchResult createFallbackResults(String query, String category, int maxResults) {
        List<ExternalProduct> fallbackProducts = new ArrayList<>();
        List<MarketplaceSearchResult> fallbackMarketplaces = Arrays.asList(
            new MarketplaceSearchResult("Amazon", fallbackProducts, false),
            new MarketplaceSearchResult("eBay", fallbackProducts, false)
        );

        List<String> insights = Arrays.asList(
            "⚠️ External marketplace search temporarily unavailable",
            "📱 Showing local inventory only"
        );

        return new AggregatedSearchResult(fallbackProducts, fallbackMarketplaces, insights);
    }

    private ComparisonResult createFallbackPriceComparison(String productName, String brand) {
        List<PriceComparison> fallbackPrices = Arrays.asList(
            new PriceComparison("Local", 50.0, 60.0, true, "In stock")
        );
        return new ComparisonResult(productName, brand, fallbackPrices);
    }

    // Supporting classes
    public static class ExternalProduct {
        private String id;
        private String name;
        private double price;
        private double originalPrice;
        private String category;
        private String brand;
        private String description;
        private String imageUrl;
        private String marketplace;
        private String externalUrl;
        private double rating;
        private int reviewCount;
        private String shippingInfo;
        private boolean availability;
        private String condition = "New";

        // Getters and Setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public double getPrice() { return price; }
        public void setPrice(double price) { this.price = price; }

        public double getOriginalPrice() { return originalPrice; }
        public void setOriginalPrice(double originalPrice) { this.originalPrice = originalPrice; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getBrand() { return brand; }
        public void setBrand(String brand) { this.brand = brand; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

        public String getMarketplace() { return marketplace; }
        public void setMarketplace(String marketplace) { this.marketplace = marketplace; }

        public String getExternalUrl() { return externalUrl; }
        public void setExternalUrl(String externalUrl) { this.externalUrl = externalUrl; }

        public double getRating() { return rating; }
        public void setRating(double rating) { this.rating = rating; }

        public int getReviewCount() { return reviewCount; }
        public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }

        public String getShippingInfo() { return shippingInfo; }
        public void setShippingInfo(String shippingInfo) { this.shippingInfo = shippingInfo; }

        public boolean isAvailability() { return availability; }
        public void setAvailability(boolean availability) { this.availability = availability; }

        public String getCondition() { return condition; }
        public void setCondition(String condition) { this.condition = condition; }
    }

    public static class MarketplaceSearchResult {
        private String marketplace;
        private List<ExternalProduct> products;
        private boolean successful;

        public MarketplaceSearchResult(String marketplace, List<ExternalProduct> products, boolean successful) {
            this.marketplace = marketplace;
            this.products = products;
            this.successful = successful;
        }

        public String getMarketplace() { return marketplace; }
        public List<ExternalProduct> getProducts() { return products; }
        public boolean isSuccessful() { return successful; }
    }

    public static class AggregatedSearchResult {
        private List<ExternalProduct> products;
        private List<MarketplaceSearchResult> marketplaceResults;
        private List<String> insights;

        public AggregatedSearchResult(List<ExternalProduct> products,
                                    List<MarketplaceSearchResult> marketplaceResults,
                                    List<String> insights) {
            this.products = products;
            this.marketplaceResults = marketplaceResults;
            this.insights = insights;
        }

        public List<ExternalProduct> getProducts() { return products; }
        public List<MarketplaceSearchResult> getMarketplaceResults() { return marketplaceResults; }
        public List<String> getInsights() { return insights; }
    }

    public static class PriceComparison {
        private String marketplace;
        private double price;
        private double originalPrice;
        private boolean available;
        private String notes;

        public PriceComparison(String marketplace, double price, double originalPrice,
                             boolean available, String notes) {
            this.marketplace = marketplace;
            this.price = price;
            this.originalPrice = originalPrice;
            this.available = available;
            this.notes = notes;
        }

        public String getMarketplace() { return marketplace; }
        public double getPrice() { return price; }
        public double getOriginalPrice() { return originalPrice; }
        public boolean isAvailable() { return available; }
        public String getNotes() { return notes; }
    }

    public static class ComparisonResult {
        private String productName;
        private String brand;
        private List<PriceComparison> priceComparisons;

        public ComparisonResult(String productName, String brand, List<PriceComparison> priceComparisons) {
            this.productName = productName;
            this.brand = brand;
            this.priceComparisons = priceComparisons;
        }

        public String getProductName() { return productName; }
        public String getBrand() { return brand; }
        public List<PriceComparison> getPriceComparisons() { return priceComparisons; }
    }
}
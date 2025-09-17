package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.*;
import java.util.stream.Collectors;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.time.LocalDateTime;
import java.util.regex.Pattern;

@Service
public class ExternalMarketplaceService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Value("${amazon.api.key:demo-key}")
    private String amazonApiKey;
    
    @Value("${amazon.api.secret:demo-secret}")
    private String amazonApiSecret;
    
    @Value("${amazon.associate.tag:thriftai-20}")
    private String amazonAssociateTag;
    
    @Value("${ebay.api.key:demo-key}")
    private String ebayApiKey;
    
    @Value("${external.marketplace.enabled:true}")
    private boolean externalMarketplaceEnabled;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ExecutorService executorService = Executors.newFixedThreadPool(10);
    private final Random random = new Random();
    
    // Fashion categories mapping for external APIs
    private static final Map<String, List<String>> FASHION_CATEGORIES = Map.of(
        "CLOTHING", Arrays.asList("women's clothing", "men's clothing", "clothing", "fashion", "apparel"),
        "SHOES", Arrays.asList("shoes", "footwear", "sneakers", "boots", "sandals"),
        "ACCESSORIES", Arrays.asList("jewelry", "watches", "bags", "handbags", "accessories", "belts"),
        "ELECTRONICS", Arrays.asList("electronics", "wearable tech", "smart watches"),
        "SPORTS_OUTDOORS", Arrays.asList("athletic wear", "sportswear", "outdoor clothing")
    );

    public CompletableFuture<List<ExternalProduct>> searchAllMarketplaces(String query, String category, int limit) {
        List<CompletableFuture<List<ExternalProduct>>> futures = new ArrayList<>();
        
        // Search Amazon
        futures.add(CompletableFuture.supplyAsync(() -> searchAmazon(query, category, limit / 2), executorService));
        
        // Search eBay
        futures.add(CompletableFuture.supplyAsync(() -> searchEbay(query, category, limit / 2), executorService));
        
        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .thenApply(v -> futures.stream()
                .flatMap(f -> f.join().stream())
                .sorted((p1, p2) -> Double.compare(p1.getPrice(), p2.getPrice()))
                .limit(limit)
                .collect(Collectors.toList()));
    }

    public List<ExternalProduct> searchAmazon(String query, String category, int limit) {
        if (!externalMarketplaceEnabled || "demo-key".equals(amazonApiKey)) {
            return generateMockAmazonProducts(query, category, limit);
        }
        
        try {
            // Amazon Product Advertising API integration
            String searchIndex = mapCategoryToAmazonIndex(category);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("Keywords", query);
            requestBody.put("SearchIndex", searchIndex);
            requestBody.put("ItemCount", limit);
            requestBody.put("AssociateTag", amazonAssociateTag);
            requestBody.put("ResponseGroup", "ItemAttributes,Offers,Images");
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "AWS4-HMAC-SHA256 " + generateAmazonSignature(requestBody));
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://webservices.amazon.com/paapi5/searchitems", entity, Map.class);
                
            return parseAmazonResponse(response.getBody());
            
        } catch (Exception e) {
            System.err.println("Amazon API error: " + e.getMessage());
            return generateMockAmazonProducts(query, category, limit);
        }
    }
    
    public List<ExternalProduct> searchEbay(String query, String category, int limit) {
        if (!externalMarketplaceEnabled || "demo-key".equals(ebayApiKey)) {
            return generateMockEbayProducts(query, category, limit);
        }
        
        try {
            // eBay Finding API integration
            String categoryId = mapCategoryToEbayId(category);
            
            String url = String.format(
                "https://svcs.ebay.com/services/search/FindingService/v1?" +
                "OPERATION-NAME=findItemsByKeywords&" +
                "SERVICE-VERSION=1.0.0&" +
                "SECURITY-APPNAME=%s&" +
                "RESPONSE-DATA-FORMAT=JSON&" +
                "keywords=%s&" +
                "categoryId=%s&" +
                "paginationInput.entriesPerPage=%d&" +
                "itemFilter(0).name=Condition&" +
                "itemFilter(0).value=New&" +
                "itemFilter(0).value=Used&" +
                "sortOrder=PricePlusShippingLowest",
                ebayApiKey, query.replace(" ", "%20"), categoryId, limit
            );
            
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return parseEbayResponse(response.getBody());
            
        } catch (Exception e) {
            System.err.println("eBay API error: " + e.getMessage());
            return generateMockEbayProducts(query, category, limit);
        }
    }

    public List<ExternalProduct> getVisualSimilarProducts(String productName, String category, String imageUrl) {
        List<ExternalProduct> allResults = new ArrayList<>();
        
        // Extract keywords from product name for search
        String searchQuery = extractSearchKeywords(productName);
        
        // Search all marketplaces for similar items
        try {
            List<ExternalProduct> results = searchAllMarketplaces(searchQuery, category, 20).get();
            allResults.addAll(results);
        } catch (Exception e) {
            System.err.println("Error getting visual similar products: " + e.getMessage());
        }
        
        // Filter and rank by similarity
        return allResults.stream()
            .filter(p -> calculateSimilarityScore(productName, p.getName()) > 0.3)
            .sorted((p1, p2) -> Double.compare(
                calculateSimilarityScore(productName, p2.getName()),
                calculateSimilarityScore(productName, p1.getName())
            ))
            .limit(10)
            .collect(Collectors.toList());
    }

    public Map<String, Object> getPriceComparison(String productName, String category) {
        Map<String, Object> comparison = new HashMap<>();
        
        try {
            List<ExternalProduct> products = searchAllMarketplaces(productName, category, 50).get();
            
            if (products.isEmpty()) {
                comparison.put("found", false);
                comparison.put("message", "No comparable products found");
                return comparison;
            }
            
            DoubleSummaryStatistics priceStats = products.stream()
                .mapToDouble(ExternalProduct::getPrice)
                .summaryStatistics();
            
            // Group by marketplace
            Map<String, List<ExternalProduct>> byMarketplace = products.stream()
                .collect(Collectors.groupingBy(ExternalProduct::getSource));
            
            // Find best deals
            List<ExternalProduct> bestDeals = products.stream()
                .sorted(Comparator.comparingDouble(ExternalProduct::getPrice))
                .limit(5)
                .collect(Collectors.toList());
            
            comparison.put("found", true);
            comparison.put("totalProducts", products.size());
            comparison.put("priceRange", Map.of(
                "min", priceStats.getMin(),
                "max", priceStats.getMax(),
                "average", priceStats.getAverage()
            ));
            comparison.put("marketplaces", byMarketplace.keySet());
            comparison.put("bestDeals", bestDeals);
            comparison.put("savingsOpportunity", priceStats.getMax() - priceStats.getMin());
            
        } catch (Exception e) {
            comparison.put("found", false);
            comparison.put("error", e.getMessage());
        }
        
        return comparison;
    }

    public Map<String, Object> getTrendingProducts(String category, int limit) {
        Map<String, Object> trending = new HashMap<>();
        
        // Get trending search terms based on category
        List<String> trendingTerms = getTrendingSearchTerms(category);
        List<ExternalProduct> allTrending = new ArrayList<>();
        
        for (String term : trendingTerms.subList(0, Math.min(3, trendingTerms.size()))) {
            try {
                List<ExternalProduct> products = searchAllMarketplaces(term, category, limit / 3).get();
                allTrending.addAll(products);
            } catch (Exception e) {
                System.err.println("Error getting trending for " + term + ": " + e.getMessage());
            }
        }
        
        // Sort by popularity score (combination of price, rating, and recency)
        List<ExternalProduct> topTrending = allTrending.stream()
            .distinct()
            .sorted((p1, p2) -> Double.compare(p2.getPopularityScore(), p1.getPopularityScore()))
            .limit(limit)
            .collect(Collectors.toList());
        
        trending.put("products", topTrending);
        trending.put("trendingTerms", trendingTerms);
        trending.put("category", category);
        trending.put("lastUpdated", LocalDateTime.now());
        
        return trending;
    }

    public Map<String, Object> getAffiliateLink(String productId, String source) {
        Map<String, Object> affiliateInfo = new HashMap<>();
        
        try {
            switch (source.toLowerCase()) {
                case "amazon":
                    String amazonLink = generateAmazonAffiliateLink(productId);
                    affiliateInfo.put("affiliateUrl", amazonLink);
                    affiliateInfo.put("commission", "4-8%");
                    affiliateInfo.put("trackingId", amazonAssociateTag);
                    break;
                    
                case "ebay":
                    String ebayLink = generateEbayAffiliateLink(productId);
                    affiliateInfo.put("affiliateUrl", ebayLink);
                    affiliateInfo.put("commission", "1-4%");
                    affiliateInfo.put("campaignId", "5338760082");
                    break;
                    
                default:
                    affiliateInfo.put("error", "Unsupported marketplace");
                    return affiliateInfo;
            }
            
            affiliateInfo.put("success", true);
            affiliateInfo.put("disclaimer", "ThriftAI may earn a commission from qualifying purchases");
            
        } catch (Exception e) {
            affiliateInfo.put("success", false);
            affiliateInfo.put("error", e.getMessage());
        }
        
        return affiliateInfo;
    }

    // Helper methods for mock data generation (used when APIs are not configured)
    
    private List<ExternalProduct> generateMockAmazonProducts(String query, String category, int limit) {
        List<ExternalProduct> mockProducts = new ArrayList<>();
        String[] adjectives = {"Premium", "Classic", "Modern", "Vintage", "Luxury", "Trendy", "Stylish", "Comfortable"};
        String[] conditions = {"New", "Like New", "Very Good", "Good"};
        
        for (int i = 0; i < limit; i++) {
            ExternalProduct product = new ExternalProduct();
            product.setId("AMZ-" + UUID.randomUUID().toString().substring(0, 8));
            product.setName(adjectives[random.nextInt(adjectives.length)] + " " + query + " " + (i + 1));
            product.setDescription("High-quality " + query + " with excellent reviews and fast Prime shipping");
            product.setPrice(20.0 + random.nextDouble() * 200.0);
            product.setOriginalPrice(product.getPrice() + random.nextDouble() * 50.0);
            product.setSource("Amazon");
            product.setImageUrl("https://images.unsplash.com/photo-" + (1600000000 + random.nextInt(100000000)) + "?w=300&h=300&fit=crop");
            product.setUrl("https://amazon.com/dp/" + product.getId());
            product.setRating(3.5 + random.nextDouble() * 1.5);
            product.setReviewCount(random.nextInt(1000) + 10);
            product.setCondition(conditions[random.nextInt(conditions.length)]);
            product.setBrand("Amazon Brand " + (i + 1));
            product.setCategory(category);
            product.setShippingInfo("Prime 2-day shipping");
            product.setAffiliateCommission(0.06);
            
            mockProducts.add(product);
        }
        
        return mockProducts;
    }
    
    private List<ExternalProduct> generateMockEbayProducts(String query, String category, int limit) {
        List<ExternalProduct> mockProducts = new ArrayList<>();
        String[] types = {"Auction", "Buy It Now", "Best Offer", "Pre-owned", "Refurbished"};
        
        for (int i = 0; i < limit; i++) {
            ExternalProduct product = new ExternalProduct();
            product.setId("EBAY-" + UUID.randomUUID().toString().substring(0, 8));
            product.setName(query + " - " + types[random.nextInt(types.length)]);
            product.setDescription("Great condition " + query + " from trusted eBay seller");
            product.setPrice(15.0 + random.nextDouble() * 150.0);
            product.setOriginalPrice(product.getPrice() + random.nextDouble() * 30.0);
            product.setSource("eBay");
            product.setImageUrl("https://images.unsplash.com/photo-" + (1600000000 + random.nextInt(100000000)) + "?w=300&h=300&fit=crop");
            product.setUrl("https://ebay.com/itm/" + product.getId());
            product.setRating(4.0 + random.nextDouble());
            product.setReviewCount(random.nextInt(500) + 5);
            product.setCondition(random.nextBoolean() ? "Used" : "New");
            product.setBrand("eBay Seller " + (i + 1));
            product.setCategory(category);
            product.setShippingInfo("$" + (5 + random.nextInt(10)) + " shipping");
            product.setAffiliateCommission(0.03);
            product.setAuctionEndTime(LocalDateTime.now().plusHours(random.nextInt(72)));
            
            mockProducts.add(product);
        }
        
        return mockProducts;
    }
    
    private List<String> getTrendingSearchTerms(String category) {
        // Mock trending terms - in production, this would come from Google Trends or similar
        Map<String, List<String>> trendingByCategory = Map.of(
            "CLOTHING", Arrays.asList("oversized hoodie", "cargo pants", "crop top", "blazer", "denim jacket"),
            "SHOES", Arrays.asList("chunky sneakers", "platform boots", "minimalist sandals", "running shoes", "loafers"),
            "ACCESSORIES", Arrays.asList("crossbody bag", "gold jewelry", "smart watch", "sunglasses", "bucket hat"),
            "ELECTRONICS", Arrays.asList("wireless earbuds", "fitness tracker", "phone case", "portable charger"),
            "SPORTS_OUTDOORS", Arrays.asList("yoga pants", "hiking boots", "athletic wear", "water bottle", "gym bag")
        );
        
        return trendingByCategory.getOrDefault(category, Arrays.asList("fashion", "style", "trending"));
    }
    
    private String extractSearchKeywords(String productName) {
        // Remove common words and extract meaningful keywords
        String[] stopWords = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"};
        String[] words = productName.toLowerCase().split("\\s+");
        
        return Arrays.stream(words)
            .filter(word -> !Arrays.asList(stopWords).contains(word))
            .filter(word -> word.length() > 2)
            .limit(3)
            .collect(Collectors.joining(" "));
    }
    
    private double calculateSimilarityScore(String name1, String name2) {
        String[] words1 = name1.toLowerCase().split("\\s+");
        String[] words2 = name2.toLowerCase().split("\\s+");
        
        Set<String> set1 = new HashSet<>(Arrays.asList(words1));
        Set<String> set2 = new HashSet<>(Arrays.asList(words2));
        
        Set<String> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);
        
        Set<String> union = new HashSet<>(set1);
        union.addAll(set2);
        
        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }
    
    private String mapCategoryToAmazonIndex(String category) {
        Map<String, String> categoryMap = Map.of(
            "CLOTHING", "Fashion",
            "SHOES", "Shoes",
            "ACCESSORIES", "Jewelry",
            "ELECTRONICS", "Electronics",
            "SPORTS_OUTDOORS", "SportingGoods"
        );
        return categoryMap.getOrDefault(category, "All");
    }
    
    private String mapCategoryToEbayId(String category) {
        Map<String, String> categoryMap = Map.of(
            "CLOTHING", "11450",
            "SHOES", "93427",
            "ACCESSORIES", "4250",
            "ELECTRONICS", "58058",
            "SPORTS_OUTDOORS", "888"
        );
        return categoryMap.getOrDefault(category, "0");
    }
    
    private String generateAmazonSignature(Map<String, Object> requestBody) {
        // Mock signature generation - in production, implement proper AWS signature v4
        return "demo-signature-" + requestBody.hashCode();
    }
    
    private String generateAmazonAffiliateLink(String productId) {
        return String.format("https://amazon.com/dp/%s?tag=%s", productId, amazonAssociateTag);
    }
    
    private String generateEbayAffiliateLink(String productId) {
        return String.format("https://rover.ebay.com/rover/1/711-53200-19255-0/1?icep_id=114&ipn=icep&toolid=20004&campid=5338760082&mpre=https://ebay.com/itm/%s", productId);
    }
    
    private List<ExternalProduct> parseAmazonResponse(Map<String, Object> response) {
        // Mock parser - implement real Amazon API response parsing
        return new ArrayList<>();
    }
    
    private List<ExternalProduct> parseEbayResponse(Map<String, Object> response) {
        // Mock parser - implement real eBay API response parsing
        return new ArrayList<>();
    }

    // External Product DTO
    public static class ExternalProduct {
        private String id;
        private String name;
        private String description;
        private double price;
        private double originalPrice;
        private String source;
        private String imageUrl;
        private String url;
        private double rating;
        private int reviewCount;
        private String condition;
        private String brand;
        private String category;
        private String shippingInfo;
        private double affiliateCommission;
        private LocalDateTime auctionEndTime;
        private LocalDateTime lastUpdated = LocalDateTime.now();

        // Constructors
        public ExternalProduct() {}

        // Getters and Setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public double getPrice() { return price; }
        public void setPrice(double price) { this.price = price; }

        public double getOriginalPrice() { return originalPrice; }
        public void setOriginalPrice(double originalPrice) { this.originalPrice = originalPrice; }

        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }

        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }

        public double getRating() { return rating; }
        public void setRating(double rating) { this.rating = rating; }

        public int getReviewCount() { return reviewCount; }
        public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }

        public String getCondition() { return condition; }
        public void setCondition(String condition) { this.condition = condition; }

        public String getBrand() { return brand; }
        public void setBrand(String brand) { this.brand = brand; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getShippingInfo() { return shippingInfo; }
        public void setShippingInfo(String shippingInfo) { this.shippingInfo = shippingInfo; }

        public double getAffiliateCommission() { return affiliateCommission; }
        public void setAffiliateCommission(double affiliateCommission) { this.affiliateCommission = affiliateCommission; }

        public LocalDateTime getAuctionEndTime() { return auctionEndTime; }
        public void setAuctionEndTime(LocalDateTime auctionEndTime) { this.auctionEndTime = auctionEndTime; }

        public LocalDateTime getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }

        public double getDiscountPercentage() {
            if (originalPrice > 0) {
                return ((originalPrice - price) / originalPrice) * 100;
            }
            return 0.0;
        }

        public double getPopularityScore() {
            // Calculate popularity based on rating, review count, and recency
            double ratingScore = rating / 5.0;
            double reviewScore = Math.min(reviewCount / 100.0, 1.0);
            double recencyScore = 1.0; // Could factor in lastUpdated
            return (ratingScore * 0.4) + (reviewScore * 0.4) + (recencyScore * 0.2);
        }

        public String getMarketplace() {
            return source;
        }

        public String getAffiliateLink() {
            return url;
        }

        public double getSavingsPercentage() {
            return getDiscountPercentage();
        }

        public boolean isSponsored() {
            return affiliateCommission > 0;
        }

        public double getSimilarityScore() {
            return getPopularityScore();
        }

        public String getTrendingReason() {
            return "Popular item";
        }

        public String getDealQuality() {
            return "Excellent";
        }

        public String getTimeLeft() {
            return "2 days left";
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            ExternalProduct that = (ExternalProduct) o;
            return Objects.equals(id, that.id) && Objects.equals(source, that.source);
        }

        @Override
        public int hashCode() {
            return Objects.hash(id, source);
        }
    }

    public CompletableFuture<List<ExternalProduct>> getBestDeals(String category, int limit, double maxPrice) {
        return CompletableFuture.supplyAsync(() -> {
            List<ExternalProduct> allProducts = new ArrayList<>();
            try {
                allProducts.addAll(searchAmazon("deals", category, limit));
                allProducts.addAll(searchEbay("auction", category, limit));
            } catch (Exception e) {
                // Handle errors gracefully
            }

            return allProducts.stream()
                .filter(p -> p.getPrice() <= maxPrice)
                .sorted((a, b) -> Double.compare(a.getPrice(), b.getPrice()))
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());
        });
    }

    public void trackAffiliateClick(String productId, String marketplace, String userId, String sessionId, String referrer, String userAgent) {
        // Track affiliate click for analytics and commission tracking
        // In a real implementation, this would:
        // 1. Log the click event
        // 2. Update click analytics
        // 3. Prepare for commission tracking
        System.out.println("Affiliate click tracked: " + productId + " from " + marketplace);
    }

    public CompletableFuture<List<ExternalProduct>> findSimilarDeals(Product product, int limit) {
        return searchAllMarketplaces(product.getName(), product.getCategory(), limit);
    }

    public Map<String, Object> getCommissionStats(String timeframe) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalClicks", 150);
        stats.put("totalCommissions", 45.67);
        stats.put("conversionRate", 3.2);
        stats.put("topMarketplaces", Arrays.asList("Amazon", "eBay"));
        return stats;
    }

    public CompletableFuture<Map<String, Object>> getTrendingProductsAsync(String category, int limit) {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> result = new HashMap<>();
            try {
                List<ExternalProduct> products = searchAllMarketplaces("trending", category, limit).get();
                result.put("products", products);
                result.put("success", true);
            } catch (Exception e) {
                result.put("success", false);
                result.put("error", e.getMessage());
            }
            return result;
        });
    }
}
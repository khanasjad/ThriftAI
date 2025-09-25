package com.projectai.service;

import com.projectai.models.AffiliateProduct;
import com.projectai.models.AffiliateProduct.AffiliateSource;
import com.projectai.repository.AffiliateProductRepository;
import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class AffiliateProductService {

    private static final Logger logger = LoggerFactory.getLogger(AffiliateProductService.class);

    @Autowired
    private AffiliateProductRepository affiliateProductRepository;

    @Autowired
    private ProductRepository productRepository;

    // Getter for ProductRepository (used by controller)
    public ProductRepository getProductRepository() {
        return productRepository;
    }

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Rate limiting - requests per minute per source
    private final Map<AffiliateSource, AtomicLong> rateLimitCounters = new ConcurrentHashMap<>();
    private final Map<AffiliateSource, LocalDateTime> rateLimitResetTimes = new ConcurrentHashMap<>();
    private final Map<AffiliateSource, Integer> rateLimits = Map.of(
        AffiliateSource.AMAZON, 100,
        AffiliateSource.EBAY, 5000,
        AffiliateSource.ZALANDO, 1000,
        AffiliateSource.ASOS, 1000,
        AffiliateSource.H_AND_M, 500,
        AffiliateSource.ZARA, 200,
        AffiliateSource.UNIQLO, 300
    );

    // Configuration properties
    @Value("${amazon.api.key:demo-key}")
    private String amazonApiKey;

    @Value("${ebay.api.key:demo-key}")
    private String ebayApiKey;

    @Value("${zalando.api.key:demo-key}")
    private String zalandoApiKey;

    @Value("${asos.api.key:demo-key}")
    private String asosApiKey;

    @Value("${affiliate.fetch.enabled:true}")
    private boolean affiliateFetchEnabled;

    @Value("${affiliate.sync.batch.size:50}")
    private int syncBatchSize;

    /**
     * Fetch products from all affiliate sources
     */
    @Async
    public CompletableFuture<Integer> fetchAllProducts() {
        if (!affiliateFetchEnabled) {
            logger.info("🚫 Affiliate product fetching is disabled");
            return CompletableFuture.completedFuture(0);
        }

        logger.info("🔄 Starting comprehensive affiliate product fetch from all sources...");
        int totalFetched = 0;

        // Fetch from each source concurrently
        List<CompletableFuture<Integer>> fetchTasks = Arrays.asList(
            fetchAmazonProducts("clothing", 100),
            fetchEbayProducts("clothing", 100),
            fetchZalandoProducts("clothing", 100),
            fetchAsosProducts("clothing", 100),
            fetchHAndMProducts("clothing", 50),
            fetchZaraProducts("clothing", 50),
            fetchUniqloProducts("clothing", 50)
        );

        // Wait for all tasks to complete
        for (CompletableFuture<Integer> task : fetchTasks) {
            try {
                totalFetched += task.get();
            } catch (Exception e) {
                logger.error("❌ Error in affiliate product fetch task: {}", e.getMessage());
            }
        }

        logger.info("✅ Completed affiliate product fetch. Total products fetched: {}", totalFetched);
        return CompletableFuture.completedFuture(totalFetched);
    }

    /**
     * Fetch products from Amazon Product Advertising API
     */
    // @Async - TEMPORARILY DISABLED FOR DEBUGGING
    public CompletableFuture<Integer> fetchAmazonProducts(String category, int limit) {
        if (!isRateLimitAllowed(AffiliateSource.AMAZON)) {
            logger.warn("⚠️ Rate limit exceeded for Amazon API");
            return CompletableFuture.completedFuture(0);
        }

        try {
            logger.info("🛒 Fetching Amazon products for category: {} - USING SIMPLE PRODUCT ENTITIES", category);

            // TEMPORARY FIX: Create regular Product entities instead of complex AffiliateProduct entities
            List<com.projectai.models.Product> simpleProducts = generateSimpleAmazonProducts(category, limit);

            // Save to regular Product table
            List<com.projectai.models.Product> savedProducts = productRepository.saveAll(simpleProducts);

            incrementRateLimit(AffiliateSource.AMAZON, savedProducts.size());
            logger.info("✅ Successfully saved {} Amazon products to regular Product table", savedProducts.size());

            return CompletableFuture.completedFuture(savedProducts.size());

        } catch (Exception e) {
            logger.error("❌ Error fetching Amazon products: {}", e.getMessage(), e);
            return CompletableFuture.completedFuture(0);
        }
    }

    /**
     * Fetch products from eBay API
     */
    @Async
    public CompletableFuture<Integer> fetchEbayProducts(String category, int limit) {
        if (!isRateLimitAllowed(AffiliateSource.EBAY)) {
            logger.warn("⚠️ Rate limit exceeded for eBay API");
            return CompletableFuture.completedFuture(0);
        }

        try {
            logger.info("🛒 Fetching eBay products for category: {}", category);

            // Demo products since we don't have real API keys
            List<AffiliateProduct> products = generateDemoEbayProducts(category, limit);

            // Save products to database
            List<AffiliateProduct> savedProducts = affiliateProductRepository.saveAll(products);

            incrementRateLimit(AffiliateSource.EBAY, products.size());
            logger.info("✅ Successfully fetched {} eBay products", savedProducts.size());

            return CompletableFuture.completedFuture(savedProducts.size());

        } catch (Exception e) {
            logger.error("❌ Error fetching eBay products: {}", e.getMessage());
            return CompletableFuture.completedFuture(0);
        }
    }

    /**
     * Fetch products from Zalando API
     */
    @Async
    public CompletableFuture<Integer> fetchZalandoProducts(String category, int limit) {
        if (!isRateLimitAllowed(AffiliateSource.ZALANDO)) {
            logger.warn("⚠️ Rate limit exceeded for Zalando API");
            return CompletableFuture.completedFuture(0);
        }

        try {
            logger.info("🛒 Fetching Zalando products for category: {}", category);

            // Demo products since we don't have real API keys
            List<AffiliateProduct> products = generateDemoZalandoProducts(category, limit);

            // Save products to database
            List<AffiliateProduct> savedProducts = affiliateProductRepository.saveAll(products);

            incrementRateLimit(AffiliateSource.ZALANDO, products.size());
            logger.info("✅ Successfully fetched {} Zalando products", savedProducts.size());

            return CompletableFuture.completedFuture(savedProducts.size());

        } catch (Exception e) {
            logger.error("❌ Error fetching Zalando products: {}", e.getMessage());
            return CompletableFuture.completedFuture(0);
        }
    }

    /**
     * Fetch products from ASOS API
     */
    @Async
    public CompletableFuture<Integer> fetchAsosProducts(String category, int limit) {
        if (!isRateLimitAllowed(AffiliateSource.ASOS)) {
            logger.warn("⚠️ Rate limit exceeded for ASOS API");
            return CompletableFuture.completedFuture(0);
        }

        try {
            logger.info("🛒 Fetching ASOS products for category: {}", category);

            // Demo products since we don't have real API keys
            List<AffiliateProduct> products = generateDemoAsosProducts(category, limit);

            // Save products to database
            List<AffiliateProduct> savedProducts = affiliateProductRepository.saveAll(products);

            incrementRateLimit(AffiliateSource.ASOS, products.size());
            logger.info("✅ Successfully fetched {} ASOS products", savedProducts.size());

            return CompletableFuture.completedFuture(savedProducts.size());

        } catch (Exception e) {
            logger.error("❌ Error fetching ASOS products: {}", e.getMessage());
            return CompletableFuture.completedFuture(0);
        }
    }

    /**
     * Fetch products from H&M API
     */
    @Async
    public CompletableFuture<Integer> fetchHAndMProducts(String category, int limit) {
        if (!isRateLimitAllowed(AffiliateSource.H_AND_M)) {
            logger.warn("⚠️ Rate limit exceeded for H&M API");
            return CompletableFuture.completedFuture(0);
        }

        try {
            logger.info("🛒 Fetching H&M products for category: {}", category);

            // Demo products since we don't have real API keys
            List<AffiliateProduct> products = generateDemoHAndMProducts(category, limit);

            // Save products to database
            List<AffiliateProduct> savedProducts = affiliateProductRepository.saveAll(products);

            incrementRateLimit(AffiliateSource.H_AND_M, products.size());
            logger.info("✅ Successfully fetched {} H&M products", savedProducts.size());

            return CompletableFuture.completedFuture(savedProducts.size());

        } catch (Exception e) {
            logger.error("❌ Error fetching H&M products: {}", e.getMessage());
            return CompletableFuture.completedFuture(0);
        }
    }

    /**
     * Fetch products from Zara API
     */
    @Async
    public CompletableFuture<Integer> fetchZaraProducts(String category, int limit) {
        if (!isRateLimitAllowed(AffiliateSource.ZARA)) {
            logger.warn("⚠️ Rate limit exceeded for Zara API");
            return CompletableFuture.completedFuture(0);
        }

        try {
            logger.info("🛒 Fetching Zara products for category: {}", category);

            // Demo products since we don't have real API keys
            List<AffiliateProduct> products = generateDemoZaraProducts(category, limit);

            // Save products to database
            List<AffiliateProduct> savedProducts = affiliateProductRepository.saveAll(products);

            incrementRateLimit(AffiliateSource.ZARA, products.size());
            logger.info("✅ Successfully fetched {} Zara products", savedProducts.size());

            return CompletableFuture.completedFuture(savedProducts.size());

        } catch (Exception e) {
            logger.error("❌ Error fetching Zara products: {}", e.getMessage());
            return CompletableFuture.completedFuture(0);
        }
    }

    /**
     * Fetch products from Uniqlo API
     */
    @Async
    public CompletableFuture<Integer> fetchUniqloProducts(String category, int limit) {
        if (!isRateLimitAllowed(AffiliateSource.UNIQLO)) {
            logger.warn("⚠️ Rate limit exceeded for Uniqlo API");
            return CompletableFuture.completedFuture(0);
        }

        try {
            logger.info("🛒 Fetching Uniqlo products for category: {}", category);

            // Demo products since we don't have real API keys
            List<AffiliateProduct> products = generateDemoUniqloProducts(category, limit);

            // Save products to database
            List<AffiliateProduct> savedProducts = affiliateProductRepository.saveAll(products);

            incrementRateLimit(AffiliateSource.UNIQLO, products.size());
            logger.info("✅ Successfully fetched {} Uniqlo products", savedProducts.size());

            return CompletableFuture.completedFuture(savedProducts.size());

        } catch (Exception e) {
            logger.error("❌ Error fetching Uniqlo products: {}", e.getMessage());
            return CompletableFuture.completedFuture(0);
        }
    }

    /**
     * Search affiliate products with advanced filtering
     */
    public Page<AffiliateProduct> searchProducts(String keyword, String category, String brand,
                                               BigDecimal minPrice, BigDecimal maxPrice,
                                               AffiliateProduct.Gender gender, Pageable pageable) {
        logger.info("🔍 Searching affiliate products: keyword='{}', category='{}', brand='{}'",
                   keyword, category, brand);

        return affiliateProductRepository.searchProducts(keyword, category, brand, minPrice, maxPrice, gender, pageable);
    }

    /**
     * Get products for comparison
     */
    public List<AffiliateProduct> getProductsForComparison(String category, List<String> brands) {
        logger.info("📊 Getting products for comparison: category='{}', brands={}", category, brands);
        return affiliateProductRepository.findProductsForComparison(category, brands);
    }

    /**
     * Sync stale products from all sources
     */
    @Scheduled(fixedRate = 3600000) // Every hour
    public void syncStaleProducts() {
        if (!affiliateFetchEnabled) {
            return;
        }

        logger.info("🔄 Starting scheduled sync of stale products...");

        List<AffiliateProduct> staleProducts = affiliateProductRepository.findStaleProducts(LocalDateTime.now());

        if (staleProducts.isEmpty()) {
            logger.info("✅ No stale products found");
            return;
        }

        logger.info("📊 Found {} stale products to sync", staleProducts.size());

        // Group by source and sync in batches
        Map<AffiliateSource, List<AffiliateProduct>> productsBySource = new HashMap<>();
        for (AffiliateProduct product : staleProducts) {
            productsBySource.computeIfAbsent(product.getAffiliateSource(), k -> new ArrayList<>()).add(product);
        }

        for (Map.Entry<AffiliateSource, List<AffiliateProduct>> entry : productsBySource.entrySet()) {
            syncProductsBySource(entry.getKey(), entry.getValue());
        }

        logger.info("✅ Completed scheduled sync of stale products");
    }

    /**
     * Rate limiting check
     */
    private boolean isRateLimitAllowed(AffiliateSource source) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime resetTime = rateLimitResetTimes.get(source);

        // Reset counter if a minute has passed
        if (resetTime == null || now.isAfter(resetTime)) {
            rateLimitCounters.put(source, new AtomicLong(0));
            rateLimitResetTimes.put(source, now.plusMinutes(1));
            return true;
        }

        AtomicLong counter = rateLimitCounters.get(source);
        int limit = rateLimits.getOrDefault(source, 100);

        return counter == null || counter.get() < limit;
    }

    /**
     * Increment rate limit counter
     */
    private void incrementRateLimit(AffiliateSource source, int count) {
        rateLimitCounters.computeIfAbsent(source, k -> new AtomicLong(0)).addAndGet(count);
    }

    /**
     * Sync products by source
     */
    private void syncProductsBySource(AffiliateSource source, List<AffiliateProduct> products) {
        logger.info("🔄 Syncing {} products from {}", products.size(), source);

        // Update lastSyncAt and dataExpiresAt for all products
        LocalDateTime now = LocalDateTime.now();
        for (AffiliateProduct product : products) {
            product.setLastSyncAt(now);
            product.setDataExpiresAt(now.plusHours(24));
        }

        affiliateProductRepository.saveAll(products);
        logger.info("✅ Synced {} products from {}", products.size(), source);
    }

    // Demo data generators (replace with real API calls when keys are available)

    private List<AffiliateProduct> generateDemoAmazonProducts(String category, int limit) {
        logger.info("🏗️ Generating demo Amazon products for category: {}, limit: {}", category, limit);
        List<AffiliateProduct> products = new ArrayList<>();
        String[] amazonProducts = {
            "Amazon Essentials Men's Regular-Fit Long-Sleeve Pocket T-Shirt",
            "Amazon Essentials Women's Classic-Fit Tank Top",
            "Amazon Basics Men's Regular-Fit Quick-Dry Golf Polo Shirt",
            "Amazon Essentials Women's Slim-Fit Tank Top",
            "Amazon Basics Women's Classic-Fit Short-Sleeve Crewneck T-Shirt"
        };

        for (int i = 0; i < Math.min(limit, amazonProducts.length); i++) {
            logger.info("🔨 Creating Amazon product {}: {}", i, amazonProducts[i]);
            AffiliateProduct product = new AffiliateProduct();
            product.setName(amazonProducts[i]);
            product.setSku("AMZ-" + UUID.randomUUID().toString().substring(0, 8));
            product.setPrice(BigDecimal.valueOf(15.99 + (i * 5)));
            product.setOriginalPrice(BigDecimal.valueOf(25.99 + (i * 5)));
            product.setBrand("Amazon Essentials");
            product.setCategory("clothing");
            product.setAffiliateSource(AffiliateSource.AMAZON);
            product.setAffiliateUrl("https://amazon.com/dp/example" + i);
            product.setImageUrl("https://m.media-amazon.com/images/I/example" + i + ".jpg");
            product.setRating(BigDecimal.valueOf(4.0 + (Math.random() * 1.0)));
            product.setReviewCount((int)(Math.random() * 1000) + 100);
            product.setCommissionRate(BigDecimal.valueOf(4.0)); // 4% commission
            // Initialize collections properly for JPA
            List<String> sizes = new ArrayList<>();
            sizes.addAll(Arrays.asList("S", "M", "L", "XL"));
            product.setAvailableSizes(sizes);

            List<String> colors = new ArrayList<>();
            colors.addAll(Arrays.asList("Black", "White", "Navy", "Gray"));
            product.setAvailableColors(colors);
            products.add(product);
        }

        return products;
    }

    private List<AffiliateProduct> generateDemoEbayProducts(String category, int limit) {
        List<AffiliateProduct> products = new ArrayList<>();
        String[] ebayProducts = {
            "Vintage Levi's 501 Original Fit Jeans",
            "Nike Air Force 1 Low White Sneakers",
            "Adidas Originals Three Stripes Track Jacket",
            "Champion Reverse Weave Pullover Hoodie",
            "Carhartt WIP Regular Cargo Pants"
        };

        for (int i = 0; i < Math.min(limit, ebayProducts.length); i++) {
            AffiliateProduct product = new AffiliateProduct();
            product.setName(ebayProducts[i]);
            product.setSku("EBAY-" + UUID.randomUUID().toString().substring(0, 8));
            product.setPrice(BigDecimal.valueOf(45.99 + (i * 10)));
            product.setOriginalPrice(BigDecimal.valueOf(65.99 + (i * 10)));
            product.setBrand(i % 2 == 0 ? "Nike" : "Adidas");
            product.setCategory("clothing");
            product.setAffiliateSource(AffiliateSource.EBAY);
            product.setAffiliateUrl("https://ebay.com/itm/example" + i);
            product.setImageUrl("https://i.ebayimg.com/images/g/example" + i + ".jpg");
            product.setRating(BigDecimal.valueOf(3.5 + (Math.random() * 1.5)));
            product.setReviewCount((int)(Math.random() * 500) + 50);
            product.setCommissionRate(BigDecimal.valueOf(6.0)); // 6% commission
            product.setAvailableSizes(Arrays.asList("S", "M", "L", "XL", "XXL"));
            product.setAvailableColors(Arrays.asList("Black", "Blue", "Red", "Green"));
            products.add(product);
        }

        return products;
    }

    private List<AffiliateProduct> generateDemoZalandoProducts(String category, int limit) {
        List<AffiliateProduct> products = new ArrayList<>();
        String[] zalandoProducts = {
            "Zalando Essentials Basic T-Shirt",
            "Selected Homme Slim Fit Chinos",
            "Only & Sons Casual Button-Down Shirt",
            "Vero Moda High-Waisted Jeans",
            "Jack & Jones Premium Wool Blend Sweater"
        };

        for (int i = 0; i < Math.min(limit, zalandoProducts.length); i++) {
            AffiliateProduct product = new AffiliateProduct();
            product.setName(zalandoProducts[i]);
            product.setSku("ZLD-" + UUID.randomUUID().toString().substring(0, 8));
            product.setPrice(BigDecimal.valueOf(29.99 + (i * 8)));
            product.setOriginalPrice(BigDecimal.valueOf(39.99 + (i * 8)));
            product.setBrand("Zalando Essentials");
            product.setCategory("clothing");
            product.setAffiliateSource(AffiliateSource.ZALANDO);
            product.setAffiliateUrl("https://zalando.com/example" + i);
            product.setImageUrl("https://img01.ztat.net/article/example" + i + ".jpg");
            product.setRating(BigDecimal.valueOf(4.2 + (Math.random() * 0.8)));
            product.setReviewCount((int)(Math.random() * 800) + 200);
            product.setCommissionRate(BigDecimal.valueOf(7.0)); // 7% commission
            product.setAvailableSizes(Arrays.asList("XS", "S", "M", "L", "XL"));
            product.setAvailableColors(Arrays.asList("Black", "White", "Beige", "Navy"));
            products.add(product);
        }

        return products;
    }

    private List<AffiliateProduct> generateDemoAsosProducts(String category, int limit) {
        List<AffiliateProduct> products = new ArrayList<>();
        String[] asosProducts = {
            "ASOS DESIGN Oversized T-Shirt in Organic Cotton",
            "ASOS DESIGN Skinny Jeans in Stretch Denim",
            "ASOS DESIGN Regular Fit Hoodie",
            "ASOS DESIGN Cropped Cardigan",
            "ASOS DESIGN Wide Leg Trousers"
        };

        for (int i = 0; i < Math.min(limit, asosProducts.length); i++) {
            AffiliateProduct product = new AffiliateProduct();
            product.setName(asosProducts[i]);
            product.setSku("ASOS-" + UUID.randomUUID().toString().substring(0, 8));
            product.setPrice(BigDecimal.valueOf(19.99 + (i * 6)));
            product.setOriginalPrice(BigDecimal.valueOf(29.99 + (i * 6)));
            product.setBrand("ASOS DESIGN");
            product.setCategory("clothing");
            product.setAffiliateSource(AffiliateSource.ASOS);
            product.setAffiliateUrl("https://asos.com/example" + i);
            product.setImageUrl("https://images.asos-media.com/products/example" + i + ".jpg");
            product.setRating(BigDecimal.valueOf(3.8 + (Math.random() * 1.2)));
            product.setReviewCount((int)(Math.random() * 600) + 100);
            product.setCommissionRate(BigDecimal.valueOf(5.5)); // 5.5% commission
            product.setAvailableSizes(Arrays.asList("XS", "S", "M", "L"));
            product.setAvailableColors(Arrays.asList("Black", "White", "Pink", "Blue"));
            products.add(product);
        }

        return products;
    }

    private List<AffiliateProduct> generateDemoHAndMProducts(String category, int limit) {
        List<AffiliateProduct> products = new ArrayList<>();
        String[] hmProducts = {
            "H&M Conscious Cotton T-shirt",
            "H&M Slim Fit Chinos",
            "H&M Knitted Sweater",
            "H&M Denim Jacket",
            "H&M Jersey Dress"
        };

        for (int i = 0; i < Math.min(limit, hmProducts.length); i++) {
            AffiliateProduct product = new AffiliateProduct();
            product.setName(hmProducts[i]);
            product.setSku("HM-" + UUID.randomUUID().toString().substring(0, 8));
            product.setPrice(BigDecimal.valueOf(12.99 + (i * 4)));
            product.setOriginalPrice(BigDecimal.valueOf(19.99 + (i * 4)));
            product.setBrand("H&M");
            product.setCategory("clothing");
            product.setAffiliateSource(AffiliateSource.H_AND_M);
            product.setAffiliateUrl("https://hm.com/example" + i);
            product.setImageUrl("https://lp2.hm.com/hmgoepprod/example" + i + ".jpg");
            product.setRating(BigDecimal.valueOf(3.6 + (Math.random() * 1.4)));
            product.setReviewCount((int)(Math.random() * 400) + 80);
            product.setCommissionRate(BigDecimal.valueOf(3.5)); // 3.5% commission
            product.setAvailableSizes(Arrays.asList("XS", "S", "M", "L", "XL"));
            product.setAvailableColors(Arrays.asList("Black", "White", "Red", "Yellow"));
            products.add(product);
        }

        return products;
    }

    private List<AffiliateProduct> generateDemoZaraProducts(String category, int limit) {
        List<AffiliateProduct> products = new ArrayList<>();
        String[] zaraProducts = {
            "Zara Basic T-Shirt with Pocket",
            "Zara High-Waist Jeans",
            "Zara Cropped Blazer",
            "Zara Knit Polo Shirt",
            "Zara Wide-Leg Trousers"
        };

        for (int i = 0; i < Math.min(limit, zaraProducts.length); i++) {
            AffiliateProduct product = new AffiliateProduct();
            product.setName(zaraProducts[i]);
            product.setSku("ZARA-" + UUID.randomUUID().toString().substring(0, 8));
            product.setPrice(BigDecimal.valueOf(25.99 + (i * 10)));
            product.setOriginalPrice(BigDecimal.valueOf(39.99 + (i * 10)));
            product.setBrand("Zara");
            product.setCategory("clothing");
            product.setAffiliateSource(AffiliateSource.ZARA);
            product.setAffiliateUrl("https://zara.com/example" + i);
            product.setImageUrl("https://static.zara.net/photos/example" + i + ".jpg");
            product.setRating(BigDecimal.valueOf(4.1 + (Math.random() * 0.9)));
            product.setReviewCount((int)(Math.random() * 300) + 150);
            product.setCommissionRate(BigDecimal.valueOf(4.5)); // 4.5% commission
            product.setAvailableSizes(Arrays.asList("XS", "S", "M", "L"));
            product.setAvailableColors(Arrays.asList("Black", "White", "Beige", "Brown"));
            products.add(product);
        }

        return products;
    }

    private List<AffiliateProduct> generateDemoUniqloProducts(String category, int limit) {
        List<AffiliateProduct> products = new ArrayList<>();
        String[] uniqloProducts = {
            "Uniqlo Heattech Crew Neck Long Sleeve T-Shirt",
            "Uniqlo Selvedge Regular Fit Straight Jeans",
            "Uniqlo UV Protection Pocketable Parka",
            "Uniqlo Cashmere Crew Neck Sweater",
            "Uniqlo Airism Cotton Blend T-Shirt"
        };

        for (int i = 0; i < Math.min(limit, uniqloProducts.length); i++) {
            AffiliateProduct product = new AffiliateProduct();
            product.setName(uniqloProducts[i]);
            product.setSku("UNI-" + UUID.randomUUID().toString().substring(0, 8));
            product.setPrice(BigDecimal.valueOf(14.99 + (i * 7)));
            product.setOriginalPrice(BigDecimal.valueOf(24.99 + (i * 7)));
            product.setBrand("Uniqlo");
            product.setCategory("clothing");
            product.setAffiliateSource(AffiliateSource.UNIQLO);
            product.setAffiliateUrl("https://uniqlo.com/example" + i);
            product.setImageUrl("https://uniqlo.scene7.com/is/image/example" + i + ".jpg");
            product.setRating(BigDecimal.valueOf(4.3 + (Math.random() * 0.7)));
            product.setReviewCount((int)(Math.random() * 500) + 200);
            product.setCommissionRate(BigDecimal.valueOf(6.0)); // 6% commission
            product.setAvailableSizes(Arrays.asList("XS", "S", "M", "L", "XL", "XXL"));
            product.setAvailableColors(Arrays.asList("Black", "White", "Gray", "Navy"));
            products.add(product);
        }

        return products;
    }

    /**
     * Get product statistics
     */
    public Map<String, Object> getProductStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Count by source
        List<Object[]> sourceStats = affiliateProductRepository.getProductCountBySource();
        Map<String, Long> sourceCounts = new HashMap<>();
        for (Object[] stat : sourceStats) {
            sourceCounts.put(stat[0].toString(), (Long) stat[1]);
        }
        stats.put("sourceBreakdown", sourceCounts);

        // Count by category
        List<Object[]> categoryStats = affiliateProductRepository.getProductCountByCategory();
        Map<String, Long> categoryCounts = new HashMap<>();
        for (Object[] stat : categoryStats) {
            categoryCounts.put(stat[0].toString(), (Long) stat[1]);
        }
        stats.put("categoryBreakdown", categoryCounts);

        // Total products
        stats.put("totalProducts", affiliateProductRepository.count());

        // Active products
        long activeProducts = affiliateProductRepository.countByCategory("clothing");
        stats.put("activeProducts", activeProducts);

        return stats;
    }

    /**
     * DYNAMIC SOLUTION: Generate Amazon products based on actual search queries
     * This creates relevant products when users search for items that don't exist
     */
    public List<Product> generateSearchBasedAmazonProducts(String searchQuery, int limit) {
        logger.info("🏗️ Generating Amazon products based on search: '{}', limit: {}", searchQuery, limit);
        List<Product> products = new ArrayList<>();

        // Extract keywords from search query
        List<String> keywords = extractSearchKeywords(searchQuery);
        logger.info("📝 Extracted keywords: {}", keywords);

        // Generate products based on search intent
        products.addAll(generateProductsForKeywords(keywords, limit));

        logger.info("✅ Generated {} search-based Amazon products", products.size());
        return products;
    }

    /**
     * Extract meaningful keywords from search query
     */
    private List<String> extractSearchKeywords(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Arrays.asList("essentials", "clothing");
        }

        // Common stop words to ignore
        Set<String> stopWords = Set.of("find", "me", "get", "buy", "search", "for", "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "with", "by");

        return Arrays.stream(query.toLowerCase().split("[\\s,.-]+"))
                .filter(word -> word.length() > 2 && !stopWords.contains(word))
                .limit(5) // Limit to top 5 keywords
                .collect(Collectors.toList());
    }

    /**
     * Generate products based on extracted keywords
     */
    private List<Product> generateProductsForKeywords(List<String> keywords, int limit) {
        List<Product> products = new ArrayList<>();
        Map<String, List<String>> keywordProductMap = createKeywordProductMap();

        int productsPerKeyword = Math.max(1, limit / Math.max(keywords.size(), 1));

        for (String keyword : keywords) {
            List<String> matchingProducts = findMatchingProducts(keyword, keywordProductMap);
            for (int i = 0; i < Math.min(productsPerKeyword, matchingProducts.size()); i++) {
                if (products.size() >= limit) break;

                String productName = matchingProducts.get(i);
                Product product = createAmazonProduct(productName, keyword, products.size());
                products.add(product);
                logger.info("🔨 Created Amazon product for '{}': {}", keyword, productName);
            }
        }

        // If no keywords matched, add some general products
        if (products.isEmpty()) {
            products.addAll(generateFallbackProducts(Math.min(limit, 3)));
        }

        return products;
    }

    /**
     * Create keyword to product mapping for dynamic generation
     */
    private Map<String, List<String>> createKeywordProductMap() {
        Map<String, List<String>> map = new HashMap<>();

        // Fashion & Clothing
        map.put("vintage", Arrays.asList(
            "Amazon Essentials Vintage Denim Jacket",
            "Amazon Basics Vintage Leather Boots",
            "Amazon Essentials Vintage Graphic T-Shirt",
            "Amazon Basics Vintage Style Sunglasses"
        ));

        map.put("designer", Arrays.asList(
            "Amazon Essentials Designer-Style Blazer",
            "Amazon Basics Designer-Inspired Watch",
            "Amazon Essentials Designer-Cut Jeans",
            "Amazon Basics Designer Laptop Bag"
        ));

        map.put("jacket", Arrays.asList(
            "Amazon Essentials Fleece Jacket",
            "Amazon Basics Windbreaker Jacket",
            "Amazon Essentials Denim Jacket",
            "Amazon Basics Rain Jacket"
        ));

        map.put("dress", Arrays.asList(
            "Amazon Essentials Casual Dress",
            "Amazon Basics Summer Dress",
            "Amazon Essentials Maxi Dress",
            "Amazon Basics Work Dress"
        ));

        map.put("shoes", Arrays.asList(
            "Amazon Essentials Running Shoes",
            "Amazon Basics Canvas Sneakers",
            "Amazon Essentials Dress Shoes",
            "Amazon Basics Hiking Boots"
        ));

        map.put("electronics", Arrays.asList(
            "Amazon Basics Wireless Headphones",
            "Amazon Essentials Phone Charger",
            "Amazon Basics Bluetooth Speaker",
            "Amazon Essentials USB Cable"
        ));

        map.put("home", Arrays.asList(
            "Amazon Basics Storage Baskets",
            "Amazon Essentials Throw Pillows",
            "Amazon Basics Table Lamp",
            "Amazon Essentials Kitchen Set"
        ));

        return map;
    }

    /**
     * Find products that match a keyword
     */
    private List<String> findMatchingProducts(String keyword, Map<String, List<String>> keywordProductMap) {
        // Direct match
        if (keywordProductMap.containsKey(keyword)) {
            return keywordProductMap.get(keyword);
        }

        // Partial match
        for (Map.Entry<String, List<String>> entry : keywordProductMap.entrySet()) {
            if (entry.getKey().contains(keyword) || keyword.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        // Default fallback
        return Arrays.asList("Amazon Essentials " + capitalizeFirst(keyword) + " Item");
    }

    /**
     * Create an Amazon product with proper details
     */
    private Product createAmazonProduct(String productName, String searchKeyword, int index) {
        Product product = new Product();
        product.setId(UUID.randomUUID().toString());
        product.setName(productName);
        product.setDescription("High-quality " + productName + " from Amazon. Perfect match for your search: " + searchKeyword);
        product.setPrice(19.99 + (index * 7.50)); // Variable pricing
        product.setOriginalPrice(29.99 + (index * 10.00));
        product.setBrand("Amazon Essentials");
        product.setCategory(determineCategory(searchKeyword));
        product.setSize("M"); // Default size
        product.setCondition("New");
        product.setAvailable(true);
        return product;
    }

    /**
     * Determine product category based on search keyword
     */
    private String determineCategory(String keyword) {
        if (Arrays.asList("jacket", "dress", "vintage", "designer", "shirt", "jeans").contains(keyword)) {
            return "Clothing";
        } else if (Arrays.asList("shoes", "boots", "sneakers").contains(keyword)) {
            return "Footwear";
        } else if (Arrays.asList("electronics", "phone", "headphones", "charger").contains(keyword)) {
            return "Electronics";
        } else if (Arrays.asList("home", "kitchen", "lamp", "pillows").contains(keyword)) {
            return "Home & Garden";
        }
        return "General";
    }

    /**
     * Generate fallback products when no keywords match
     */
    private List<Product> generateFallbackProducts(int limit) {
        List<Product> products = new ArrayList<>();
        String[] fallbackProducts = {
            "Amazon Essentials Classic T-Shirt",
            "Amazon Basics Comfortable Jeans",
            "Amazon Essentials Versatile Jacket"
        };

        for (int i = 0; i < Math.min(limit, fallbackProducts.length); i++) {
            Product product = createAmazonProduct(fallbackProducts[i], "general", i);
            products.add(product);
        }

        return products;
    }

    /**
     * Helper method to capitalize first letter
     */
    private String capitalizeFirst(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    /**
     * LEGACY: Generate simple Amazon products (kept for backward compatibility)
     */
    private List<Product> generateSimpleAmazonProducts(String category, int limit) {
        // Use search-based generation with a default query
        return generateSearchBasedAmazonProducts("clothing essentials", limit);
    }
}
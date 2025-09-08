package com.projectai.service;

import com.projectai.models.*;
import com.projectai.repository.ProductRepository;
import com.projectai.ai.DealScorer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ThriftAIService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private DealScorer dealScorer;

    // @Autowired
    // private AIEnhancementService aiEnhancementService;

    // Product operations
    public List<Product> getAllAvailableProducts() {
        return productRepository.findByIsAvailableTrue();
    }

    public Product getProductById(String id) {
        return productRepository.findById(id).orElse(null);
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    public List<Product> searchProducts(String query, String category) {
        if (category != null && !category.isEmpty()) {
            return productRepository.searchProductsByCategory(query, category);
        } else {
            return productRepository.searchProducts(query);
        }
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    public List<Product> getProductsByPriceRange(double minPrice, double maxPrice) {
        return productRepository.findByPriceRange(minPrice, maxPrice);
    }

    // Deal operations
    public List<Deal> findBestDeals(UserPreferences preferences, int limit) {
        List<Product> allProducts = getAllAvailableProducts();
        List<Deal> potentialDeals = new ArrayList<>();

        for (Product product : allProducts) {
            if (preferences.matchesPreferences(product)) {
                double score = dealScorer.calculateDealScore(product, preferences);
                String reason = dealScorer.getDealScoreReason(product, preferences, score);

                Deal deal = new Deal("deal_" + product.getId(), product, score, "AI_RECOMMENDED");
                deal.setDealReason(reason);
                potentialDeals.add(deal);
            }
        }

        return potentialDeals.stream()
                .sorted((d1, d2) -> Double.compare(d2.getDealScore(), d1.getDealScore()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<Deal> findBestDealsWithAI(UserPreferences preferences, int limit) {
        // Enhanced AI recommendations (placeholder for external AI integration)
        List<Deal> baseDeals = findBestDeals(preferences, limit * 2); // Get more for AI filtering
        
        // For now, return the base deals with some AI-simulated enhancement
        return baseDeals.stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    // Analytics
    public Map<String, Long> getCategoryStatistics() {
        List<String> categories = productRepository.findAllAvailableCategories();
        Map<String, Long> stats = new HashMap<>();
        
        for (String category : categories) {
            long count = productRepository.countByCategoryAndAvailable(category);
            stats.put(category, count);
        }
        
        return stats;
    }

    public Map<String, Object> getPlatformOverview() {
        Map<String, Object> overview = new HashMap<>();
        
        overview.put("totalProducts", productRepository.countAvailableProducts());
        overview.put("totalCategories", productRepository.findAllAvailableCategories().size());
        overview.put("totalBrands", productRepository.findAllAvailableBrands().size());
        overview.put("categoryStats", getCategoryStatistics());
        
        // Calculate average discount
        List<Product> productsWithDiscount = productRepository.findProductsWithMinDiscount(0);
        double avgDiscount = productsWithDiscount.stream()
                .mapToDouble(Product::getDiscountPercentage)
                .average()
                .orElse(0.0);
        overview.put("averageDiscount", Math.round(avgDiscount * 100.0) / 100.0);
        
        return overview;
    }

    // Utility methods
    public List<String> getAllCategories() {
        return productRepository.findAllAvailableCategories();
    }

    public List<String> getAllBrands() {
        return productRepository.findAllAvailableBrands();
    }

    public UserPreferences getDefaultUserPreferences(String userId) {
        // In a real app, this would fetch from user database
        UserPreferences prefs = new UserPreferences(userId != null ? userId : "default_user");
        prefs.addPreferredCategory("CLOTHING", 1.2);
        prefs.addPreferredCategory("ELECTRONICS", 1.0);
        prefs.addPreferredBrand("NIKE");
        prefs.addPreferredBrand("LEVI'S");
        prefs.addPreferredSize("M");
        prefs.addPreferredSize("10");
        prefs.setMaxBudget(500.0);
        prefs.setMinDiscountThreshold(15.0);
        return prefs;
    }

    // Data initialization for demo
    @Transactional
    public void initializeSampleData() {
        if (productRepository.count() == 0) {
            List<Product> sampleProducts = createSampleProducts();
            productRepository.saveAll(sampleProducts);
        }
    }

    private List<Product> createSampleProducts() {
        List<Product> products = new ArrayList<>();

        // Sample clothing products
        Product product1 = new Product();
        product1.setName("Vintage Levi's 501 Jeans");
        product1.setCategory("CLOTHING");
        product1.setPrice(45.99);
        product1.setBrand("LEVI'S");
        product1.setOriginalPrice(120.00);
        product1.setCondition("EXCELLENT");
        product1.setSize("M");
        product1.setStoreId("store1");
        product1.setDescription("Classic vintage Levi's 501 jeans in excellent condition");
        product1.setAvailable(true);
        products.add(product1);

        Product product2 = new Product();
        product2.setName("Nike Air Max Sneakers");
        product2.setCategory("SHOES");
        product2.setPrice(65.00);
        product2.setBrand("NIKE");
        product2.setOriginalPrice(150.00);
        product2.setCondition("VERY_GOOD");
        product2.setSize("10");
        product2.setStoreId("store3");
        product2.setDescription("Gently used Nike Air Max sneakers");
        product2.setAvailable(true);
        products.add(product2);

        Product product3 = new Product();
        product3.setName("MacBook Air 2019");
        product3.setCategory("ELECTRONICS");
        product3.setPrice(599.99);
        product3.setBrand("APPLE");
        product3.setOriginalPrice(999.99);
        product3.setCondition("GOOD");
        product3.setStoreId("store2");
        product3.setDescription("MacBook Air 2019, 13-inch, some signs of use but fully functional");
        product3.setAvailable(true);
        products.add(product3);

        Product product4 = new Product();
        product4.setName("Zara Wool Coat");
        product4.setCategory("CLOTHING");
        product4.setPrice(89.99);
        product4.setBrand("ZARA");
        product4.setOriginalPrice(199.99);
        product4.setCondition("LIKE_NEW");
        product4.setSize("L");
        product4.setStoreId("store1");
        product4.setDescription("Beautiful wool coat from Zara, barely worn");
        product4.setAvailable(true);
        products.add(product4);

        Product product5 = new Product();
        product5.setName("Samsung Galaxy Watch");
        product5.setCategory("ELECTRONICS");
        product5.setPrice(149.99);
        product5.setBrand("SAMSUNG");
        product5.setOriginalPrice(299.99);
        product5.setCondition("EXCELLENT");
        product5.setStoreId("store2");
        product5.setDescription("Samsung Galaxy Watch in excellent condition with original box");
        product5.setAvailable(true);
        products.add(product5);

        return products;
    }
}
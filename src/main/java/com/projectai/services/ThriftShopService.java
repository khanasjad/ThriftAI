package com.projectai.services;

import com.projectai.models.*;
import com.projectai.ai.DealScorer;
import java.util.*;
import com.projectai.service.ConfigurationService;
import java.util.stream.Collectors;

public class ThriftShopService {
    private Map<String, Product> products;
    private ConfigurationService configurationService;
    private Map<String, Store> stores;
    private Map<String, Deal> deals;
    private DealScorer dealScorer;
    
    public ThriftShopService() {
        this(null);
    }

    public ThriftShopService(ConfigurationService configurationService) {
        this.products = new HashMap<>();
        this.stores = new HashMap<>();
        this.deals = new HashMap<>();
        this.dealScorer = new DealScorer();
        this.configurationService = configurationService;
        initializeSampleData();
    }
    
    private void initializeSampleData() {
        // Initialize empty collections - actual data should be loaded from database
        // This method is preserved for backward compatibility but should be replaced
        // with proper data loading mechanisms in production

        // Sample data creation is now conditional based on environment
        String environment = System.getProperty("app.environment", "development");
        boolean createSampleData = "development".equals(environment) || "test".equals(environment);

        if (createSampleData) {
            createMinimalSampleData();
        }
    }
    
    private void createMinimalSampleData() {
        // Create basic sample stores for development/testing
        createSampleStores();
        // Create generic sample products for development/testing
        createSampleProducts();
    }

    private void createSampleStores() {
        Store store1 = new Store("store1", "Downtown Thrift", "PHYSICAL");
        Store store2 = new Store("store2", "Vintage Finds", "PHYSICAL");
        Store store3 = new Store("store3", "Second Hand Shop", "ONLINE");

        stores.put(store1.getId(), store1);
        stores.put(store2.getId(), store2);
        stores.put(store3.getId(), store3);
    }

    private void createSampleProducts() {
        // Generic sample products for development/testing only
        // Note: In production, products should be loaded from database

        // Use configuration service for categories instead of hardcoded values
        List<String> categoryList = configurationService != null ?
            configurationService.getAllActiveCategories() :
            Arrays.asList("CLOTHING", "SHOES", "ELECTRONICS", "ACCESSORIES", "HOME");
        String[] categories = categoryList.toArray(new String[0]);
        String[] conditions = {"EXCELLENT", "VERY_GOOD", "GOOD", "FAIR"};
        String[] sizes = {"XS", "S", "M", "L", "XL", "XXL", "6", "7", "8", "9", "10", "11", "12"};
        String[] storeIds = {"store1", "store2", "store3"};

        // Create 5 generic sample products
        for (int i = 1; i <= 5; i++) {
            String productId = "sample_product_" + i;
            String category = categories[(i - 1) % categories.length];
            String condition = conditions[(i - 1) % conditions.length];
            String size = sizes[(i - 1) % sizes.length];
            String storeId = storeIds[(i - 1) % storeIds.length];

            double basePrice = 25.0 + (i * 15.0); // Price range: $25-$100
            double originalPrice = basePrice * (1.5 + (i * 0.2)); // Original price 1.5x to 2.5x current

            Product product = new Product(productId,
                "Sample " + category.toLowerCase() + " item " + i,
                category,
                basePrice);

            product.setBrand("Generic Brand " + i);
            product.setOriginalPrice(originalPrice);
            product.setCondition(condition);
            product.setSize(size);
            product.setStoreId(storeId);
            product.setDescription("Sample " + category.toLowerCase() + " item for development/testing purposes");

            products.put(product.getId(), product);
        }
    }
    
    public List<Deal> findBestDeals(UserPreferences preferences, int limit) {
        List<Deal> potentialDeals = new ArrayList<>();
        
        for (Product product : products.values()) {
            if (preferences.matchesPreferences(product)) {
                double score = dealScorer.calculateDealScore(product, preferences);
                String reason = dealScorer.getDealScoreReason(product, preferences, score);
                
                Deal deal = new Deal("deal_" + product.getId(), product, score, "AI_RECOMMENDED");
                deal.setDealReason(reason);
                potentialDeals.add(deal);
            }
        }
        
        // Sort by deal score and return top deals
        return potentialDeals.stream()
                .sorted((d1, d2) -> Double.compare(d2.getDealScore(), d1.getDealScore()))
                .limit(limit)
                .collect(Collectors.toList());
    }
    
    public List<Product> searchProducts(String query, String category) {
        return products.values().stream()
                .filter(p -> {
                    boolean matchesQuery = query == null || 
                                         p.getName().toLowerCase().contains(query.toLowerCase()) ||
                                         (p.getBrand() != null && p.getBrand().toLowerCase().contains(query.toLowerCase()));
                    boolean matchesCategory = category == null || p.getCategory().equals(category);
                    return matchesQuery && matchesCategory && p.isAvailable();
                })
                .collect(Collectors.toList());
    }
    
    public List<Product> getProductsByCategory(String category) {
        return products.values().stream()
                .filter(p -> p.getCategory().equals(category) && p.isAvailable())
                .collect(Collectors.toList());
    }
    
    public Product getProductById(String id) {
        return products.get(id);
    }
    
    public Store getStoreById(String id) {
        return stores.get(id);
    }
    
    public List<Store> getAllStores() {
        return new ArrayList<>(stores.values());
    }
    
    public List<String> getAvailableCategories() {
        return products.values().stream()
                .map(Product::getCategory)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }
    
    public void addProduct(Product product) {
        products.put(product.getId(), product);
    }
    
    public void addStore(Store store) {
        stores.put(store.getId(), store);
    }
    
    public Map<String, Integer> getCategoryStats() {
        Map<String, Integer> stats = new HashMap<>();
        for (Product product : products.values()) {
            stats.merge(product.getCategory(), 1, Integer::sum);
        }
        return stats;
    }
    
    public double getAverageDealScore(List<Deal> deals) {
        return deals.stream()
                .mapToDouble(Deal::getDealScore)
                .average()
                .orElse(0.0);
    }
}
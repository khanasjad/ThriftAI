package com.projectai.services;

import com.projectai.models.*;
import com.projectai.ai.DealScorer;
import java.util.*;
import java.util.stream.Collectors;

public class ThriftShopService {
    private Map<String, Product> products;
    private Map<String, Store> stores;
    private Map<String, Deal> deals;
    private DealScorer dealScorer;
    
    public ThriftShopService() {
        this.products = new HashMap<>();
        this.stores = new HashMap<>();
        this.deals = new HashMap<>();
        this.dealScorer = new DealScorer();
        initializeSampleData();
    }
    
    private void initializeSampleData() {
        // Create sample stores
        Store store1 = new Store("store1", "Vintage Vibes", "THRIFT_STORE");
        store1.setLocation("Downtown");
        store1.setRating(4.5);
        store1.setOnline(true);
        store1.addCategory("CLOTHING");
        store1.addCategory("ACCESSORIES");
        stores.put(store1.getId(), store1);
        
        Store store2 = new Store("store2", "Second Chance Electronics", "ELECTRONICS");
        store2.setLocation("Tech District");
        store2.setRating(4.2);
        store2.setOnline(true);
        store2.addCategory("ELECTRONICS");
        store2.addCategory("COMPUTERS");
        stores.put(store2.getId(), store2);
        
        Store store3 = new Store("store3", "Fashion Forward Finds", "CONSIGNMENT");
        store3.setLocation("Fashion Quarter");
        store3.setRating(4.7);
        store3.setOnline(false);
        store3.addCategory("CLOTHING");
        store3.addCategory("SHOES");
        stores.put(store3.getId(), store3);
        
        // Create sample products
        createSampleProducts();
    }
    
    private void createSampleProducts() {
        // Sample clothing products
        Product product1 = new Product("p1", "Vintage Levi's 501 Jeans", "CLOTHING", 45.99);
        product1.setBrand("LEVI'S");
        product1.setOriginalPrice(120.00);
        product1.setCondition("EXCELLENT");
        product1.setSize("M");
        product1.setStoreId("store1");
        product1.setDescription("Classic vintage Levi's 501 jeans in excellent condition");
        products.put(product1.getId(), product1);
        
        Product product2 = new Product("p2", "Nike Air Max Sneakers", "SHOES", 65.00);
        product2.setBrand("NIKE");
        product2.setOriginalPrice(150.00);
        product2.setCondition("VERY_GOOD");
        product2.setSize("10");
        product2.setStoreId("store3");
        product2.setDescription("Gently used Nike Air Max sneakers");
        products.put(product2.getId(), product2);
        
        Product product3 = new Product("p3", "MacBook Air 2019", "ELECTRONICS", 599.99);
        product3.setBrand("APPLE");
        product3.setOriginalPrice(999.99);
        product3.setCondition("GOOD");
        product3.setStoreId("store2");
        product3.setDescription("MacBook Air 2019, 13-inch, some signs of use but fully functional");
        products.put(product3.getId(), product3);
        
        Product product4 = new Product("p4", "Zara Wool Coat", "CLOTHING", 89.99);
        product4.setBrand("ZARA");
        product4.setOriginalPrice(199.99);
        product4.setCondition("LIKE_NEW");
        product4.setSize("L");
        product4.setStoreId("store1");
        product4.setDescription("Beautiful wool coat from Zara, barely worn");
        products.put(product4.getId(), product4);
        
        Product product5 = new Product("p5", "Samsung Galaxy Watch", "ELECTRONICS", 149.99);
        product5.setBrand("SAMSUNG");
        product5.setOriginalPrice(299.99);
        product5.setCondition("EXCELLENT");
        product5.setStoreId("store2");
        product5.setDescription("Samsung Galaxy Watch in excellent condition with original box");
        products.put(product5.getId(), product5);
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
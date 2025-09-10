package com.projectai.service;

import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TrendingService {
    
    // Mock trending data - in production this would come from external APIs or analytics
    private final Map<String, TrendingItem> trendingData = new HashMap<>();
    
    public TrendingService() {
        initializeTrendingData();
    }
    
    private void initializeTrendingData() {
        // Fashion trends
        trendingData.put("vintage-denim", new TrendingItem(
            "Vintage Denim", "Clothing", "High", 85.0, 120.0, 
            "90s vintage jeans are making a comeback", 
            Arrays.asList("Levi's", "Wrangler", "Lee", "Calvin Klein")
        ));
        
        trendingData.put("y2k-fashion", new TrendingItem(
            "Y2K Fashion", "Clothing", "Very High", 45.0, 90.0,
            "Early 2000s fashion is extremely popular with Gen Z",
            Arrays.asList("Juicy Couture", "Von Dutch", "Ed Hardy", "True Religion")
        ));
        
        trendingData.put("designer-bags", new TrendingItem(
            "Designer Handbags", "Accessories", "High", 200.0, 800.0,
            "Luxury bags maintain strong resale value",
            Arrays.asList("Louis Vuitton", "Gucci", "Chanel", "Prada")
        ));
        
        trendingData.put("sneakers", new TrendingItem(
            "Vintage Sneakers", "Shoes", "Very High", 80.0, 300.0,
            "Retro sneakers have massive resale market",
            Arrays.asList("Nike", "Adidas", "Jordan", "New Balance")
        ));
        
        trendingData.put("band-tees", new TrendingItem(
            "Band T-Shirts", "Clothing", "High", 25.0, 75.0,
            "Authentic vintage band merchandise is highly sought",
            Arrays.asList("Vintage", "Concert Merch", "Tour Shirts")
        ));
        
        trendingData.put("leather-jackets", new TrendingItem(
            "Leather Jackets", "Outerwear", "Medium", 60.0, 200.0,
            "Classic leather pieces never go out of style",
            Arrays.asList("Wilson's Leather", "Members Only", "Schott")
        ));
        
        trendingData.put("jewelry", new TrendingItem(
            "Vintage Jewelry", "Jewelry", "High", 15.0, 150.0,
            "Statement jewelry and gold pieces trending",
            Arrays.asList("Tiffany & Co", "Pandora", "Vintage Gold")
        ));
        
        trendingData.put("sunglasses", new TrendingItem(
            "Designer Sunglasses", "Accessories", "Medium", 30.0, 120.0,
            "Classic frames and designer brands popular",
            Arrays.asList("Ray-Ban", "Oakley", "Gucci", "Prada")
        ));
    }
    
    public List<TrendingItem> getTrendingItems() {
        return trendingData.values().stream()
                .sorted((a, b) -> getTrendingScore(b).compareTo(getTrendingScore(a)))
                .collect(Collectors.toList());
    }
    
    public List<TrendingItem> getTrendingByCategory(String category) {
        return trendingData.values().stream()
                .filter(item -> item.getCategory().equalsIgnoreCase(category))
                .sorted((a, b) -> getTrendingScore(b).compareTo(getTrendingScore(a)))
                .collect(Collectors.toList());
    }
    
    public List<TrendingItem> searchTrending(String query) {
        return trendingData.values().stream()
                .filter(item -> 
                    item.getName().toLowerCase().contains(query.toLowerCase()) ||
                    item.getDescription().toLowerCase().contains(query.toLowerCase()) ||
                    item.getBrands().stream().anyMatch(brand -> 
                        brand.toLowerCase().contains(query.toLowerCase())
                    )
                )
                .sorted((a, b) -> getTrendingScore(b).compareTo(getTrendingScore(a)))
                .collect(Collectors.toList());
    }
    
    public Optional<TrendingItem> getTrendingItem(String key) {
        return Optional.ofNullable(trendingData.get(key));
    }
    
    private Integer getTrendingScore(TrendingItem item) {
        switch (item.getDemand().toLowerCase()) {
            case "very high": return 5;
            case "high": return 4;
            case "medium": return 3;
            case "low": return 2;
            default: return 1;
        }
    }
    
    public List<String> getTrendingCategories() {
        return trendingData.values().stream()
                .map(TrendingItem::getCategory)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }
    
    public List<String> getPopularBrands() {
        return trendingData.values().stream()
                .flatMap(item -> item.getBrands().stream())
                .collect(Collectors.groupingBy(brand -> brand, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .limit(20)
                .collect(Collectors.toList());
    }
    
    // Inner class for trending items
    public static class TrendingItem {
        private String name;
        private String category;
        private String demand;
        private double avgLowPrice;
        private double avgHighPrice;
        private String description;
        private List<String> brands;
        
        public TrendingItem(String name, String category, String demand, 
                          double avgLowPrice, double avgHighPrice, 
                          String description, List<String> brands) {
            this.name = name;
            this.category = category;
            this.demand = demand;
            this.avgLowPrice = avgLowPrice;
            this.avgHighPrice = avgHighPrice;
            this.description = description;
            this.brands = brands;
        }
        
        // Getters
        public String getName() { return name; }
        public String getCategory() { return category; }
        public String getDemand() { return demand; }
        public double getAvgLowPrice() { return avgLowPrice; }
        public double getAvgHighPrice() { return avgHighPrice; }
        public String getDescription() { return description; }
        public List<String> getBrands() { return brands; }
        
        public String getDemandColor() {
            switch (demand.toLowerCase()) {
                case "very high": return "#22c55e";
                case "high": return "#3b82f6";
                case "medium": return "#f59e0b";
                case "low": return "#6b7280";
                default: return "#6b7280";
            }
        }
        
        public String getDemandIcon() {
            switch (demand.toLowerCase()) {
                case "very high": return "fas fa-fire";
                case "high": return "fas fa-arrow-up";
                case "medium": return "fas fa-minus";
                case "low": return "fas fa-arrow-down";
                default: return "fas fa-minus";
            }
        }
    }
}
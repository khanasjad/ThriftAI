package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SmartSearchService {
    
    @Autowired
    private ProductRepository productRepository;
    
    // Categories and their related keywords - using uppercase to match database
    private static final Map<String, List<String>> CATEGORY_KEYWORDS = Map.of(
        "CLOTHING", Arrays.asList("shirt", "dress", "pants", "jeans", "jacket", "coat", "sweater", "hoodie", "t-shirt", "blouse", "skirt", "shorts"),
        "SHOES", Arrays.asList("shoes", "sneakers", "boots", "sandals", "heels", "flats", "loafers", "running shoes"),
        "ACCESSORIES", Arrays.asList("watch", "jewelry", "necklace", "bracelet", "ring", "earrings", "bag", "purse", "wallet", "belt", "hat", "scarf"),
        "ELECTRONICS", Arrays.asList("phone", "laptop", "tablet", "headphones", "speaker", "camera", "tv", "computer", "gadget"),
        "BOOKS", Arrays.asList("book", "novel", "textbook", "magazine", "comic", "biography", "fiction", "non-fiction"),
        "HOME_GARDEN", Arrays.asList("furniture", "lamp", "table", "chair", "sofa", "bed", "plant", "garden", "decor", "kitchen"),
        "SPORTS_OUTDOORS", Arrays.asList("sports", "fitness", "gym", "outdoor", "camping", "hiking", "bike", "exercise")
    );
    
    // Colors that can be extracted from descriptions
    private static final List<String> COLORS = Arrays.asList(
        "white", "black", "red", "blue", "green", "yellow", "purple", "pink", "orange", "brown", 
        "gray", "grey", "navy", "beige", "cream", "gold", "silver", "maroon", "teal", "turquoise"
    );
    
    // Sizes
    private static final List<String> SIZES = Arrays.asList(
        "xs", "s", "m", "l", "xl", "xxl", "small", "medium", "large", "extra large"
    );
    
    // Conditions
    private static final List<String> CONDITIONS = Arrays.asList(
        "new", "like new", "very good", "good", "acceptable", "excellent", "fair", "poor"
    );
    
    public SearchResult parseAndSearch(String naturalQuery) {
        SearchCriteria criteria = parseNaturalLanguage(naturalQuery);
        List<Product> results = searchWithCriteria(criteria);
        
        return new SearchResult(criteria, results, naturalQuery);
    }
    
    private SearchCriteria parseNaturalLanguage(String query) {
        query = query.toLowerCase().trim();
        SearchCriteria criteria = new SearchCriteria();
        
        // Extract price information
        extractPrice(query, criteria);
        
        // Extract category
        extractCategory(query, criteria);
        
        // Extract colors
        extractColors(query, criteria);
        
        // Extract sizes
        extractSizes(query, criteria);
        
        // Extract conditions
        extractConditions(query, criteria);
        
        // Extract general keywords (everything that's not a price, color, size, etc.)
        extractKeywords(query, criteria);
        
        return criteria;
    }
    
    private void extractPrice(String query, SearchCriteria criteria) {
        // Pattern for prices like "$20", "20$", "under $30", "below 25", "less than $40"
        Pattern pricePattern = Pattern.compile("(?:under|below|less than|up to|max|maximum)\\s*\\$?(\\d+)|\\$?(\\d+)\\s*(?:dollars?|bucks?|usd)?|\\$?(\\d+)");
        Matcher matcher = pricePattern.matcher(query);
        
        if (matcher.find()) {
            String priceStr = matcher.group(1) != null ? matcher.group(1) : 
                           matcher.group(2) != null ? matcher.group(2) : matcher.group(3);
            try {
                double price = Double.parseDouble(priceStr);
                
                // If query contains "under", "below", "less than", etc., set as max price
                if (query.contains("under") || query.contains("below") || query.contains("less than") || 
                    query.contains("up to") || query.contains("max")) {
                    criteria.setMaxPrice(price);
                } else {
                    // For exact price mentions, create a range (±20%)
                    criteria.setMinPrice(price * 0.8);
                    criteria.setMaxPrice(price * 1.2);
                }
            } catch (NumberFormatException ignored) {}
        }
    }
    
    private void extractCategory(String query, SearchCriteria criteria) {
        for (Map.Entry<String, List<String>> entry : CATEGORY_KEYWORDS.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (query.contains(keyword)) {
                    criteria.setCategory(entry.getKey());
                    criteria.addKeyword(keyword);
                    return; // Use first match
                }
            }
        }
    }
    
    private void extractColors(String query, SearchCriteria criteria) {
        for (String color : COLORS) {
            if (query.contains(color)) {
                criteria.addKeyword(color);
            }
        }
    }
    
    private void extractSizes(String query, SearchCriteria criteria) {
        for (String size : SIZES) {
            if (query.contains(size)) {
                criteria.setSize(size.toUpperCase());
                return; // Use first match
            }
        }
    }
    
    private void extractConditions(String query, SearchCriteria criteria) {
        for (String condition : CONDITIONS) {
            if (query.contains(condition)) {
                criteria.setCondition(condition);
                return; // Use first match
            }
        }
    }
    
    private void extractKeywords(String query, SearchCriteria criteria) {
        // Remove price patterns, common words, and add remaining words as keywords
        String cleanQuery = query.replaceAll("\\$?\\d+", "")
                                .replaceAll("\\b(i|want|a|an|the|for|under|below|less|than|up|to|max|maximum|dollars?|bucks?|usd)\\b", "")
                                .replaceAll("\\s+", " ")
                                .trim();
        
        if (!cleanQuery.isEmpty()) {
            String[] words = cleanQuery.split("\\s+");
            for (String word : words) {
                if (word.length() > 2) { // Only add meaningful words
                    criteria.addKeyword(word);
                }
            }
        }
    }
    
    private List<Product> searchWithCriteria(SearchCriteria criteria) {
        String searchQuery = String.join(" ", criteria.getKeywords());
        
        // Get all available products as base
        List<Product> allProducts = productRepository.findByIsAvailableTrue();
        
        // If we have specific filters, apply them
        if (criteria.getCategory() != null || criteria.getBrand() != null || 
            criteria.getCondition() != null || criteria.getSize() != null ||
            criteria.getMinPrice() != null || criteria.getMaxPrice() != null ||
            !searchQuery.isEmpty()) {
            
            List<Product> filteredResults = productRepository.findWithFilters(
                searchQuery.isEmpty() ? null : searchQuery,
                criteria.getCategory(),
                criteria.getBrand(),
                criteria.getCondition(),
                criteria.getSize(),
                criteria.getMinPrice(),
                criteria.getMaxPrice()
            );
            
            // If filtered results are empty but we have products, return popular products
            if (filteredResults.isEmpty() && !allProducts.isEmpty()) {
                // Return a diverse mix of products from different categories
                List<Product> fallbackProducts = allProducts.stream()
                    .sorted((p1, p2) -> {
                        // Sort by discount percentage (best deals first), then by name
                        double discount1 = p1.getDiscountPercentage();
                        double discount2 = p2.getDiscountPercentage();
                        int discountCompare = Double.compare(discount2, discount1);
                        if (discountCompare != 0) return discountCompare;
                        return p1.getName().compareToIgnoreCase(p2.getName());
                    })
                    .limit(8)
                    .collect(java.util.stream.Collectors.toList());
                return fallbackProducts;
            } else {
                return filteredResults.isEmpty() ? allProducts.stream().limit(8).collect(java.util.stream.Collectors.toList()) : filteredResults;
            }
        }
        
        // For empty/no filter queries, return featured products (best deals)
        List<Product> featuredProducts = allProducts.stream()
            .sorted((p1, p2) -> {
                // Sort by discount percentage (best deals first), then by name
                double discount1 = p1.getDiscountPercentage();
                double discount2 = p2.getDiscountPercentage();
                int discountCompare = Double.compare(discount2, discount1);
                if (discountCompare != 0) return discountCompare;
                return p1.getName().compareToIgnoreCase(p2.getName());
            })
            .limit(8)
            .collect(java.util.stream.Collectors.toList());
        
        return featuredProducts;
    }
    
    // Inner classes for search criteria and results
    public static class SearchCriteria {
        private String category;
        private String brand;
        private String condition;
        private String size;
        private Double minPrice;
        private Double maxPrice;
        private List<String> keywords = new ArrayList<>();
        
        // Getters and setters
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        
        public String getBrand() { return brand; }
        public void setBrand(String brand) { this.brand = brand; }
        
        public String getCondition() { return condition; }
        public void setCondition(String condition) { this.condition = condition; }
        
        public String getSize() { return size; }
        public void setSize(String size) { this.size = size; }
        
        public Double getMinPrice() { return minPrice; }
        public void setMinPrice(Double minPrice) { this.minPrice = minPrice; }
        
        public Double getMaxPrice() { return maxPrice; }
        public void setMaxPrice(Double maxPrice) { this.maxPrice = maxPrice; }
        
        public List<String> getKeywords() { return keywords; }
        public void addKeyword(String keyword) { this.keywords.add(keyword); }
        
        @Override
        public String toString() {
            return "SearchCriteria{" +
                    "category='" + category + '\'' +
                    ", brand='" + brand + '\'' +
                    ", condition='" + condition + '\'' +
                    ", size='" + size + '\'' +
                    ", minPrice=" + minPrice +
                    ", maxPrice=" + maxPrice +
                    ", keywords=" + keywords +
                    '}';
        }
    }
    
    public static class SearchResult {
        private final SearchCriteria criteria;
        private final List<Product> products;
        private final String originalQuery;
        private final String interpretedQuery;
        
        public SearchResult(SearchCriteria criteria, List<Product> products, String originalQuery) {
            this.criteria = criteria;
            this.products = products;
            this.originalQuery = originalQuery;
            this.interpretedQuery = generateInterpretedQuery(criteria);
        }
        
        private String generateInterpretedQuery(SearchCriteria criteria) {
            List<String> parts = new ArrayList<>();
            
            if (criteria.getCategory() != null) {
                parts.add("Category: " + criteria.getCategory());
            }
            
            if (!criteria.getKeywords().isEmpty()) {
                parts.add("Keywords: " + String.join(", ", criteria.getKeywords()));
            }
            
            if (criteria.getMinPrice() != null || criteria.getMaxPrice() != null) {
                if (criteria.getMinPrice() != null && criteria.getMaxPrice() != null) {
                    parts.add(String.format("Price: $%.2f - $%.2f", criteria.getMinPrice(), criteria.getMaxPrice()));
                } else if (criteria.getMaxPrice() != null) {
                    parts.add(String.format("Max Price: $%.2f", criteria.getMaxPrice()));
                } else {
                    parts.add(String.format("Min Price: $%.2f", criteria.getMinPrice()));
                }
            }
            
            if (criteria.getSize() != null) {
                parts.add("Size: " + criteria.getSize());
            }
            
            if (criteria.getCondition() != null) {
                parts.add("Condition: " + criteria.getCondition());
            }
            
            return parts.isEmpty() ? "All products" : String.join(" | ", parts);
        }
        
        // Getters
        public SearchCriteria getCriteria() { return criteria; }
        public List<Product> getProducts() { return products; }
        public String getOriginalQuery() { return originalQuery; }
        public String getInterpretedQuery() { return interpretedQuery; }
        public int getResultCount() { return products.size(); }
    }
}
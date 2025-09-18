package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.Arrays;
import java.util.stream.Collectors;

@Service
public class WorldClassSearchService {

    @Autowired
    private ProductRepository productRepository;

    public SearchResponse performWorldClassSearch(String query) {
        SearchResponse response = new SearchResponse();

        if (query == null || query.trim().isEmpty()) {
            return getFeaturedProducts(response);
        }

        String searchTerm = query.toLowerCase().trim();
        response.setOriginalQuery(query);
        response.setProcessedQuery(searchTerm);

        // Multi-layered search strategy that GUARANTEES results
        List<Product> results = performMultiLayerSearch(searchTerm);

        if (results.isEmpty()) {
            // Ultimate fallback - return featured products with AI insights
            return getFallbackResults(response, searchTerm);
        }

        response.setProducts(results);
        response.setTotalResults(results.size());
        response.setSuccessful(true);
        response.addInsight("🎯 Found " + results.size() + " perfect matches for your search");

        // Add smart suggestions based on results
        addSmartSuggestions(response, searchTerm, results);

        return response;
    }

    private List<Product> performMultiLayerSearch(String searchTerm) {
        List<Product> allProducts = productRepository.findByIsAvailableTrue();

        // Apply price filtering first if detected in query
        Double maxPrice = extractPriceFilter(searchTerm);
        if (maxPrice != null) {
            allProducts = allProducts.stream()
                .filter(p -> p.getPrice() <= maxPrice)
                .collect(Collectors.toList());
        }

        Set<Product> results = new LinkedHashSet<>();

        // Smart query preprocessing for better matching
        String processedQuery = preprocessQuery(searchTerm);
        String[] queryWords = processedQuery.split("\\s+");

        // Layer 1: Exact brand matches (highest priority)
        for (String word : queryWords) {
            results.addAll(allProducts.stream()
                .filter(p -> p.getBrand() != null &&
                            p.getBrand().toLowerCase().contains(word))
                .collect(Collectors.toList()));
        }

        // Layer 2: Product name matches
        for (String word : queryWords) {
            results.addAll(allProducts.stream()
                .filter(p -> p.getName().toLowerCase().contains(word))
                .collect(Collectors.toList()));
        }

        // Layer 3: Category matches - Enhanced for electronics
        for (String word : queryWords) {
            results.addAll(allProducts.stream()
                .filter(p -> p.getCategory() != null &&
                            p.getCategory().toLowerCase().contains(word))
                .collect(Collectors.toList()));
        }

        // Layer 4: Description matches
        for (String word : queryWords) {
            results.addAll(allProducts.stream()
                .filter(p -> p.getDescription() != null &&
                            p.getDescription().toLowerCase().contains(word))
                .collect(Collectors.toList()));
        }

        // Layer 5: Fuzzy matches for common brands
        if (results.size() < 5) {
            for (String word : queryWords) {
                results.addAll(getFuzzyMatches(allProducts, word));
            }
        }

        // Layer 6: Smart category expansion - Process each word
        if (results.size() < 5) {
            for (String word : queryWords) {
                results.addAll(getSmartCategoryMatches(allProducts, word));
            }
            // Also try the full original term
            results.addAll(getSmartCategoryMatches(allProducts, searchTerm));
        }

        return results.stream()
            .sorted((a, b) -> calculateRelevanceScore(b, searchTerm) - calculateRelevanceScore(a, searchTerm))
            .limit(20)
            .collect(Collectors.toList());
    }

    private List<Product> getFuzzyMatches(List<Product> allProducts, String searchTerm) {
        Map<String, String> brandVariations = Map.of(
            "nike", "nike",
            "adidas", "adidas",
            "puma", "puma",
            "reebok", "reebok",
            "gucci", "gucci",
            "prada", "prada",
            "louis", "louis vuitton",
            "lv", "louis vuitton",
            "supreme", "supreme"
        );

        String brandMatch = brandVariations.get(searchTerm);
        if (brandMatch != null) {
            return allProducts.stream()
                .filter(p -> p.getBrand() != null &&
                           p.getBrand().toLowerCase().contains(brandMatch))
                .collect(Collectors.toList());
        }

        return new ArrayList<>();
    }

    private List<Product> getSmartCategoryMatches(List<Product> allProducts, String searchTerm) {
        Map<String, List<String>> categoryMappings = new HashMap<>();

        // Fashion & Apparel
        categoryMappings.put("shoes", Arrays.asList("SHOES", "SNEAKERS", "FOOTWEAR"));
        categoryMappings.put("sneakers", Arrays.asList("SHOES", "SNEAKERS", "FOOTWEAR"));
        categoryMappings.put("clothing", Arrays.asList("CLOTHING", "APPAREL", "FASHION"));
        categoryMappings.put("jacket", Arrays.asList("CLOTHING", "OUTERWEAR"));
        categoryMappings.put("bag", Arrays.asList("ACCESSORIES", "BAGS", "HANDBAGS"));
        categoryMappings.put("watch", Arrays.asList("ACCESSORIES", "WATCHES", "JEWELRY"));

        // Electronics & Technology - EXPANDED
        categoryMappings.put("electronics", Arrays.asList("ELECTRONICS", "TECHNOLOGY", "GADGETS", "TECH"));
        categoryMappings.put("gadgets", Arrays.asList("ELECTRONICS", "TECHNOLOGY", "GADGETS", "TECH"));
        categoryMappings.put("phone", Arrays.asList("ELECTRONICS", "PHONES", "MOBILE", "SMARTPHONES"));
        categoryMappings.put("smartphone", Arrays.asList("ELECTRONICS", "PHONES", "MOBILE", "SMARTPHONES"));
        categoryMappings.put("laptop", Arrays.asList("ELECTRONICS", "COMPUTERS", "LAPTOPS"));
        categoryMappings.put("computer", Arrays.asList("ELECTRONICS", "COMPUTERS", "LAPTOPS", "PC"));
        categoryMappings.put("tablet", Arrays.asList("ELECTRONICS", "TABLETS", "IPAD"));
        categoryMappings.put("ipad", Arrays.asList("ELECTRONICS", "TABLETS", "IPAD"));
        categoryMappings.put("headphones", Arrays.asList("ELECTRONICS", "AUDIO", "HEADPHONES"));
        categoryMappings.put("earbuds", Arrays.asList("ELECTRONICS", "AUDIO", "HEADPHONES", "EARBUDS"));
        categoryMappings.put("speaker", Arrays.asList("ELECTRONICS", "AUDIO", "SPEAKERS"));
        categoryMappings.put("camera", Arrays.asList("ELECTRONICS", "CAMERAS", "PHOTOGRAPHY"));
        categoryMappings.put("gaming", Arrays.asList("ELECTRONICS", "GAMING", "CONSOLE", "VIDEO GAMES"));
        categoryMappings.put("xbox", Arrays.asList("ELECTRONICS", "GAMING", "CONSOLE", "XBOX"));
        categoryMappings.put("playstation", Arrays.asList("ELECTRONICS", "GAMING", "CONSOLE", "PLAYSTATION", "PS5"));
        categoryMappings.put("nintendo", Arrays.asList("ELECTRONICS", "GAMING", "CONSOLE", "NINTENDO", "SWITCH"));
        categoryMappings.put("tv", Arrays.asList("ELECTRONICS", "TELEVISION", "TV", "DISPLAY"));
        categoryMappings.put("monitor", Arrays.asList("ELECTRONICS", "MONITORS", "DISPLAY", "SCREEN"));

        // Multi-word queries
        if (searchTerm.contains("electronics") || searchTerm.contains("gadgets")) {
            categoryMappings.put(searchTerm, Arrays.asList("ELECTRONICS", "TECHNOLOGY", "GADGETS", "TECH"));
        }

        List<String> categories = categoryMappings.get(searchTerm);
        if (categories != null) {
            return allProducts.stream()
                .filter(p -> categories.stream()
                    .anyMatch(cat -> p.getCategory() != null &&
                                   p.getCategory().toUpperCase().contains(cat)))
                .limit(10)
                .collect(Collectors.toList());
        }

        return new ArrayList<>();
    }

    private int calculateRelevanceScore(Product product, String searchTerm) {
        int score = 0;

        // Brand exact match gets highest score
        if (product.getBrand() != null &&
            product.getBrand().toLowerCase().equals(searchTerm)) {
            score += 100;
        } else if (product.getBrand() != null &&
                  product.getBrand().toLowerCase().contains(searchTerm)) {
            score += 80;
        }

        // Product name matches
        if (product.getName().toLowerCase().contains(searchTerm)) {
            score += 60;
        }

        // Category matches
        if (product.getCategory() != null &&
            product.getCategory().toLowerCase().contains(searchTerm)) {
            score += 40;
        }

        // Description matches
        if (product.getDescription() != null &&
            product.getDescription().toLowerCase().contains(searchTerm)) {
            score += 20;
        }

        // Boost popular brands
        if (product.getBrand() != null) {
            String brand = product.getBrand().toLowerCase();
            if (Arrays.asList("nike", "adidas", "gucci", "prada", "supreme").contains(brand)) {
                score += 10;
            }
        }

        return score;
    }

    private SearchResponse getFeaturedProducts(SearchResponse response) {
        List<Product> featured = productRepository.findByIsAvailableTrue()
            .stream()
            .limit(12)
            .collect(Collectors.toList());

        response.setProducts(featured);
        response.setTotalResults(featured.size());
        response.setSuccessful(true);
        response.addInsight("🌟 Discover trending items from our curated collection");
        response.addInsight("💎 Featuring the best deals and latest arrivals");

        return response;
    }

    private SearchResponse getFallbackResults(SearchResponse response, String searchTerm) {
        // AI-powered intelligent fallback based on search intent
        String lowerTerm = searchTerm.toLowerCase();

        // Special handling for items we don't carry (like cars)
        if (lowerTerm.contains("car") || lowerTerm.contains("auto") || lowerTerm.contains("vehicle")) {
            response.setProducts(Arrays.asList()); // No products
            response.setTotalResults(0);
            response.setSuccessful(false);
            response.addInsight("🚗 We don't currently have cars or vehicles in our thrift inventory");
            response.addInsight("💡 However, we do carry car accessories, automotive memorabilia, and related items!");
            response.addInsight("🌐 For actual vehicles, we recommend checking external marketplaces or automotive dealers");

            // Intelligent suggestions for car-related searches
            response.addSuggestion("car accessories");
            response.addSuggestion("automotive tools");
            response.addSuggestion("vintage car memorabilia");
            response.addSuggestion("electronics"); // Car electronics

            return response;
        }

        // For other searches, show relevant products from our inventory
        List<Product> fallback = productRepository.findByIsAvailableTrue()
            .stream()
            .limit(8)
            .collect(Collectors.toList());

        response.setProducts(fallback);
        response.setTotalResults(fallback.size());
        response.setSuccessful(true);
        response.addInsight("🤖 No exact matches found for '" + searchTerm + "', but here are popular items you might love!");
        response.addInsight("💡 Our AI suggests browsing these categories or trying more specific search terms");

        // AI-powered contextual suggestions based on search term
        if (lowerTerm.contains("tech") || lowerTerm.contains("electronic")) {
            response.addSuggestion("electronics");
            response.addSuggestion("apple products");
            response.addSuggestion("samsung gadgets");
            response.addSuggestion("vintage electronics");
        } else if (lowerTerm.contains("fashion") || lowerTerm.contains("style")) {
            response.addSuggestion("designer clothing");
            response.addSuggestion("vintage fashion");
            response.addSuggestion("luxury brands");
            response.addSuggestion("accessories");
        } else {
            // Default intelligent suggestions
            response.addSuggestion("electronics");
            response.addSuggestion("vintage clothing");
            response.addSuggestion("nike shoes");
            response.addSuggestion("designer bags");
        }

        return response;
    }

    private void addSmartSuggestions(SearchResponse response, String searchTerm, List<Product> results) {
        Set<String> suggestions = new HashSet<>();

        // Add brand-based suggestions
        results.stream()
            .filter(p -> p.getBrand() != null)
            .map(p -> p.getBrand().toLowerCase())
            .distinct()
            .limit(3)
            .forEach(brand -> suggestions.add(brand + " collection"));

        // Add category-based suggestions
        results.stream()
            .filter(p -> p.getCategory() != null)
            .map(p -> p.getCategory().toLowerCase())
            .distinct()
            .limit(2)
            .forEach(category -> suggestions.add(category + " deals"));

        // Add search term variations
        if (searchTerm.equals("nike")) {
            suggestions.addAll(Arrays.asList("nike shoes", "nike clothing", "nike vintage"));
        } else if (searchTerm.equals("vintage")) {
            suggestions.addAll(Arrays.asList("vintage clothing", "vintage bags", "retro style"));
        }

        suggestions.forEach(response::addSuggestion);
    }

    // Response class for structured search results
    public static class SearchResponse {
        private List<Product> products = new ArrayList<>();
        private int totalResults = 0;
        private String originalQuery = "";
        private String processedQuery = "";
        private boolean successful = false;
        private List<String> insights = new ArrayList<>();
        private List<String> suggestions = new ArrayList<>();

        // Getters and setters
        public List<Product> getProducts() { return products; }
        public void setProducts(List<Product> products) { this.products = products; }

        public int getTotalResults() { return totalResults; }
        public void setTotalResults(int totalResults) { this.totalResults = totalResults; }

        public String getOriginalQuery() { return originalQuery; }
        public void setOriginalQuery(String originalQuery) { this.originalQuery = originalQuery; }

        public String getProcessedQuery() { return processedQuery; }
        public void setProcessedQuery(String processedQuery) { this.processedQuery = processedQuery; }

        public boolean isSuccessful() { return successful; }
        public void setSuccessful(boolean successful) { this.successful = successful; }

        public List<String> getInsights() { return insights; }
        public void addInsight(String insight) { this.insights.add(insight); }

        public List<String> getSuggestions() { return suggestions; }
        public void addSuggestion(String suggestion) { this.suggestions.add(suggestion); }
    }

    // Smart query preprocessing for better electronics matching
    private String preprocessQuery(String query) {
        if (query == null) return "";

        // Convert to lowercase and remove extra whitespace
        String processed = query.toLowerCase().trim().replaceAll("\\s+", " ");

        // Remove common stop words that don't add value
        processed = processed.replaceAll("\\b(and|or|the|a|an|for|in|on|at|to|with)\\b", " ");

        // Normalize electronics terms
        processed = processed.replace("electronics and gadgets", "electronics gadgets");
        processed = processed.replace("tech gadgets", "electronics technology");
        processed = processed.replace("electronic devices", "electronics");
        processed = processed.replace("tech devices", "electronics technology");

        // Clean up extra spaces
        processed = processed.trim().replaceAll("\\s+", " ");

        return processed;
    }
}
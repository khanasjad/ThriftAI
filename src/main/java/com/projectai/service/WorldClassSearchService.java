package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
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
        Set<Product> results = new LinkedHashSet<>();

        // Layer 1: Exact brand matches (highest priority)
        results.addAll(allProducts.stream()
            .filter(p -> p.getBrand() != null &&
                        p.getBrand().toLowerCase().contains(searchTerm))
            .collect(Collectors.toList()));

        // Layer 2: Product name matches
        results.addAll(allProducts.stream()
            .filter(p -> p.getName().toLowerCase().contains(searchTerm))
            .collect(Collectors.toList()));

        // Layer 3: Category matches
        results.addAll(allProducts.stream()
            .filter(p -> p.getCategory() != null &&
                        p.getCategory().toLowerCase().contains(searchTerm))
            .collect(Collectors.toList()));

        // Layer 4: Description matches
        results.addAll(allProducts.stream()
            .filter(p -> p.getDescription() != null &&
                        p.getDescription().toLowerCase().contains(searchTerm))
            .collect(Collectors.toList()));

        // Layer 5: Fuzzy matches for common brands
        if (results.size() < 5) {
            results.addAll(getFuzzyMatches(allProducts, searchTerm));
        }

        // Layer 6: Smart category expansion
        if (results.size() < 5) {
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
        Map<String, List<String>> categoryMappings = Map.of(
            "shoes", Arrays.asList("SHOES", "SNEAKERS", "FOOTWEAR"),
            "sneakers", Arrays.asList("SHOES", "SNEAKERS", "FOOTWEAR"),
            "clothing", Arrays.asList("CLOTHING", "APPAREL", "FASHION"),
            "jacket", Arrays.asList("CLOTHING", "OUTERWEAR"),
            "bag", Arrays.asList("ACCESSORIES", "BAGS", "HANDBAGS"),
            "watch", Arrays.asList("ACCESSORIES", "WATCHES", "JEWELRY")
        );

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
        List<Product> fallback = productRepository.findByIsAvailableTrue()
            .stream()
            .limit(10)
            .collect(Collectors.toList());

        response.setProducts(fallback);
        response.setTotalResults(fallback.size());
        response.setSuccessful(true);
        response.addInsight("🤖 No exact matches found for '" + searchTerm + "', but here are similar items you might love!");
        response.addInsight("💡 Try searching for brands like Nike, Adidas, or categories like shoes, clothing");

        // Add smart suggestions
        response.addSuggestion("nike shoes");
        response.addSuggestion("vintage clothing");
        response.addSuggestion("designer bags");
        response.addSuggestion("luxury watches");

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
}
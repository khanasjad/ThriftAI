package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

@Service
public class ChatGPTService {

    @Autowired
    private ProductRepository productRepository;
    
    @Value("${openai.api.key:}")
    private String openAiApiKey;
    
    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String openAiApiUrl;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String enhanceSearchQuery(String query) {
        // For now, implement basic query enhancement
        // In a real implementation, this would call OpenAI API
        
        String lowerQuery = query.toLowerCase();
        
        // Enhance common search terms
        if (lowerQuery.contains("cheap") || lowerQuery.contains("affordable")) {
            return query + " budget friendly low price";
        }
        if (lowerQuery.contains("vintage") || lowerQuery.contains("retro")) {
            return query + " classic old style antique";
        }
        if (lowerQuery.contains("designer") || lowerQuery.contains("luxury")) {
            return query + " high end premium brand";
        }
        if (lowerQuery.contains("casual") || lowerQuery.contains("everyday")) {
            return query + " comfortable relaxed daily wear";
        }
        
        return query;
    }

    public List<Product> searchProducts(String enhancedQuery) {
        // Enhanced search implementation with better relevance scoring
        String[] keywords = enhancedQuery.toLowerCase().split("\\s+");
        
        return productRepository.findAll().stream()
                .filter(Product::isAvailable)
                .map(product -> {
                    String searchText = (product.getName() + " " + 
                                      product.getDescription() + " " + 
                                      product.getBrand() + " " + 
                                      product.getCategory()).toLowerCase();
                    
                    // Calculate relevance score
                    int score = 0;
                    for (String keyword : keywords) {
                        // Skip common words that don't add value
                        if (keyword.length() < 3 || Arrays.asList("the", "and", "for", "with", "are", "has", "can", "you", "all", "any", "had", "her", "was", "one", "our", "out", "day", "get", "use", "man", "new", "now", "old", "see", "him", "two", "way", "who", "its", "did", "yes", "his", "has", "had").contains(keyword)) {
                            continue;
                        }
                        
                        // Exact match in name gets highest score
                        if (product.getName().toLowerCase().contains(keyword)) {
                            score += 10;
                        }
                        // Brand match gets high score
                        if (product.getBrand() != null && product.getBrand().toLowerCase().contains(keyword)) {
                            score += 8;
                        }
                        // Category match gets medium score
                        if (product.getCategory().toLowerCase().contains(keyword)) {
                            score += 6;
                        }
                        // Description match gets lower score
                        if (product.getDescription() != null && product.getDescription().toLowerCase().contains(keyword)) {
                            score += 3;
                        }
                        
                        // Handle synonyms and related terms
                        if (handleSynonyms(keyword, searchText)) {
                            score += 5;
                        }
                    }
                    
                    return new ProductScore(product, score);
                })
                .filter(productScore -> productScore.score > 0) // Only return products with some relevance
                .sorted((p1, p2) -> Integer.compare(p2.score, p1.score)) // Sort by relevance descending
                .limit(10) // Reduce to top 10 most relevant
                .map(productScore -> productScore.product)
                .collect(Collectors.toList());
    }
    
    private boolean handleSynonyms(String keyword, String searchText) {
        // Handle clothing synonyms
        if (keyword.equals("shirt") && (searchText.contains("tee") || searchText.contains("top") || searchText.contains("blouse"))) {
            return true;
        }
        if (keyword.equals("shoes") && (searchText.contains("sneakers") || searchText.contains("boots") || searchText.contains("heels") || searchText.contains("footwear"))) {
            return true;
        }
        if (keyword.equals("jacket") && (searchText.contains("coat") || searchText.contains("blazer") || searchText.contains("outerwear"))) {
            return true;
        }
        if (keyword.equals("bag") && (searchText.contains("handbag") || searchText.contains("purse") || searchText.contains("tote") || searchText.contains("satchel"))) {
            return true;
        }
        if (keyword.equals("vintage") && (searchText.contains("retro") || searchText.contains("classic") || searchText.contains("antique"))) {
            return true;
        }
        if (keyword.equals("cheap") && (searchText.contains("affordable") || searchText.contains("budget") || searchText.contains("low price"))) {
            return true;
        }
        if (keyword.equals("gaming") && (searchText.contains("console") || searchText.contains("nintendo") || searchText.contains("game"))) {
            return true;
        }
        if (keyword.equals("electronics") && (searchText.contains("console") || searchText.contains("nintendo") || searchText.contains("electronic"))) {
            return true;
        }
        return false;
    }
    
    // Helper class for scoring products
    private static class ProductScore {
        final Product product;
        final int score;
        
        ProductScore(Product product, int score) {
            this.product = product;
            this.score = score;
        }
    }

    public String generateSearchResponse(String originalQuery, List<Product> products) {
        // Use OpenAI API for natural, contextual responses
        if (openAiApiKey == null || openAiApiKey.trim().isEmpty()) {
            return generateFallbackResponse(originalQuery, products);
        }
        
        try {
            String prompt = buildSearchResponsePrompt(originalQuery, products);
            return callOpenAI(prompt);
        } catch (Exception e) {
            System.err.println("OpenAI API error: " + e.getMessage());
            return generateFallbackResponse(originalQuery, products);
        }
    }
    
    private String callOpenAI(String prompt) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + openAiApiKey);
        headers.set("Content-Type", "application/json");
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "gpt-3.5-turbo");
        requestBody.put("messages", Arrays.asList(
            Map.of("role", "system", "content", "You are a helpful AI assistant for a thrift shopping platform. Be enthusiastic, friendly, and focus on value and sustainability."),
            Map.of("role", "user", "content", prompt)
        ));
        requestBody.put("max_tokens", 300);
        requestBody.put("temperature", 0.7);
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(openAiApiUrl, HttpMethod.POST, entity, String.class);
        
        JsonNode jsonResponse = objectMapper.readTree(response.getBody());
        return jsonResponse.path("choices").get(0).path("message").path("content").asText().trim();
    }
    
    private String buildSearchResponsePrompt(String originalQuery, List<Product> products) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("User searched for: '").append(originalQuery).append("'\n\n");
        
        if (products.isEmpty()) {
            prompt.append("No products found. Generate a helpful response suggesting alternatives or browsing categories.");
            return prompt.toString();
        }
        
        prompt.append("Found ").append(products.size()).append(" products:\n");
        for (int i = 0; i < Math.min(products.size(), 3); i++) {
            Product p = products.get(i);
            prompt.append("- ").append(p.getName()).append(" by ").append(p.getBrand())
                  .append(" ($").append(p.getPrice()).append(", originally $").append(p.getOriginalPrice())
                  .append(", condition: ").append(p.getCondition()).append(")\n");
        }
        
        prompt.append("\nGenerate an enthusiastic, helpful response (2-3 sentences) highlighting the best deals and savings. Use emojis and focus on thrift shopping benefits like sustainability and affordability.");
        return prompt.toString();
    }
    
    private String generateFallbackResponse(String originalQuery, List<Product> products) {
        if (products.isEmpty()) {
            return "I couldn't find any products matching '" + originalQuery + 
                   "'. Try searching for something else or browse our categories!";
        }
        
        String response = "🛍️ Found " + products.size() + " great thrift finds for '" + originalQuery + "'! ";
        
        if (products.size() == 1) {
            Product product = products.get(0);
            double savings = product.getOriginalPrice() - product.getPrice();
            int savingsPercent = (int)((savings / product.getOriginalPrice()) * 100);
            response += "Check out this " + product.getName() + " by " + product.getBrand() + 
                       " for just $" + product.getPrice() + " (save " + savingsPercent + "%)! 💰";
        } else {
            double minPrice = products.stream().mapToDouble(Product::getPrice).min().orElse(0);
            double maxPrice = products.stream().mapToDouble(Product::getPrice).max().orElse(0);
            
            response += "Prices range from $" + String.format("%.2f", minPrice) + 
                       " to $" + String.format("%.2f", maxPrice) + ". ";
            
            double avgSavings = products.stream()
                .mapToDouble(p -> ((p.getOriginalPrice() - p.getPrice()) / p.getOriginalPrice()) * 100)
                .average().orElse(0);
            
            response += "Average savings: " + Math.round(avgSavings) + "% off retail! ♻️";
        }
        
        return response;
    }

    public String generateProductDescription(Product product) {
        // Generate enhanced product descriptions using AI
        // This would use ChatGPT API in a real implementation
        
        return "This " + product.getName() + " by " + product.getBrand() + 
               " is a " + product.getCategory().toLowerCase() + " item " +
               "priced at $" + product.getPrice() + ". " +
               (product.getDescription() != null ? product.getDescription() : "") +
               " Perfect for anyone looking for quality " + product.getCategory().toLowerCase() + ".";
    }

    public List<String> getSuggestedQueries(String category) {
        // Return suggested search queries for a category
        switch (category.toLowerCase()) {
            case "clothing":
                return Arrays.asList(
                    "vintage band t-shirts",
                    "designer jeans under $50",
                    "casual summer dresses",
                    "winter coats",
                    "workout clothes"
                );
            case "shoes":
                return Arrays.asList(
                    "vintage Nike sneakers",
                    "comfortable walking shoes",
                    "designer heels",
                    "boots for winter",
                    "running shoes"
                );
            case "accessories":
                return Arrays.asList(
                    "designer handbags",
                    "vintage jewelry",
                    "sunglasses",
                    "watches",
                    "belts and ties"
                );
            case "electronics":
                return Arrays.asList(
                    "vintage gaming consoles",
                    "retro cameras",
                    "audio equipment",
                    "smartphones",
                    "tablets"
                );
            default:
                return Arrays.asList(
                    "trending items",
                    "best deals today",
                    "popular brands",
                    "vintage finds",
                    "designer pieces"
                );
        }
    }
}
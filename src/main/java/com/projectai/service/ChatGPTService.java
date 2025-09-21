package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.models.SearchFilters;
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
import java.util.ArrayList;
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
        try {
            // Always use ChatGPT to create intelligent responses mixed with product data
            String prompt = buildAdvancedSearchResponsePrompt(originalQuery, products);
            String chatGPTResponse = callOpenAI(prompt);

            // Mix ChatGPT response with product business logic
            return enhanceResponseWithBusinessLogic(chatGPTResponse, products, originalQuery);

        } catch (Exception e) {
            System.err.println("OpenAI API error: " + e.getMessage());
            // Even fallback should be intelligent
            return generateIntelligentFallback(originalQuery, products);
        }
    }
    
    public String callOpenAI(String prompt) throws Exception {
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
    
    private String buildAdvancedSearchResponsePrompt(String originalQuery, List<Product> products) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are a friendly, knowledgeable thrift shopping assistant for ThriftAI. ");
        prompt.append("User searched for: '").append(originalQuery).append("'\n\n");

        if (products.isEmpty()) {
            prompt.append("No exact matches found. Provide helpful alternatives and suggest related categories or similar items they might like.");
            return prompt.toString();
        }

        prompt.append("Available products matching their search:\n");
        for (int i = 0; i < Math.min(products.size(), 5); i++) {
            Product p = products.get(i);
            double savings = p.getOriginalPrice() - p.getPrice();
            int savingsPercent = (int)((savings / p.getOriginalPrice()) * 100);

            prompt.append(String.format("%d. %s by %s\n", i+1, p.getName(), p.getBrand()));
            prompt.append(String.format("   Price: $%.2f (originally $%.2f) - %d%% off\n",
                p.getPrice(), p.getOriginalPrice(), savingsPercent));
            prompt.append(String.format("   Condition: %s, Category: %s\n", p.getCondition(), p.getCategory()));
            if (p.getDescription() != null) {
                prompt.append(String.format("   Details: %s\n", p.getDescription()));
            }
            prompt.append("\n");
        }

        prompt.append("Instructions:\n");
        prompt.append("1. Write a conversational, enthusiastic response (3-4 sentences)\n");
        prompt.append("2. Highlight the best deals and value propositions\n");
        prompt.append("3. Mention sustainability benefits of thrift shopping\n");
        prompt.append("4. Use emojis appropriately\n");
        prompt.append("5. Suggest why each item is a great find\n");
        prompt.append("6. Be specific about the savings and conditions\n");
        prompt.append("\nRespond as a helpful shopping assistant:");

        return prompt.toString();
    }

    private String enhanceResponseWithBusinessLogic(String chatGPTResponse, List<Product> products, String originalQuery) {
        StringBuilder enhanced = new StringBuilder();
        enhanced.append(chatGPTResponse).append("\n\n");

        if (!products.isEmpty()) {
            // Add business insights
            double totalSavings = products.stream()
                .mapToDouble(p -> p.getOriginalPrice() - p.getPrice())
                .sum();

            double avgDiscount = products.stream()
                .mapToDouble(p -> ((p.getOriginalPrice() - p.getPrice()) / p.getOriginalPrice()) * 100)
                .average()
                .orElse(0);

            enhanced.append("💰 **Value Analysis:**\n");
            enhanced.append(String.format("• Total potential savings: $%.2f\n", totalSavings));
            enhanced.append(String.format("• Average discount: %.0f%% off retail\n", avgDiscount));
            enhanced.append(String.format("• Found %d items in excellent condition\n",
                products.stream().mapToInt(p -> "EXCELLENT".equals(p.getCondition()) ? 1 : 0).sum()));

            // Add eco-friendly message
            enhanced.append("\n🌱 **Environmental Impact:**\n");
            enhanced.append(String.format("By choosing these thrift items, you're preventing %.1f lbs of textile waste!\n",
                products.size() * 2.3)); // Approximate environmental impact
        }

        return enhanced.toString();
    }

    private String generateIntelligentFallback(String originalQuery, List<Product> products) {
        StringBuilder response = new StringBuilder();

        if (products.isEmpty()) {
            response.append("🔍 I couldn't find exact matches for '").append(originalQuery)
                   .append("', but don't worry! Let me suggest some alternatives:\n\n");

            // Suggest related categories
            String[] suggestions = getSuggestedAlternatives(originalQuery);
            for (String suggestion : suggestions) {
                response.append("• ").append(suggestion).append("\n");
            }

            response.append("\n💡 Try browsing our categories or searching with different keywords!");
        } else {
            response.append("🛍️ Great news! I found ").append(products.size())
                   .append(" amazing thrift finds for '").append(originalQuery).append("'!\n\n");

            // Highlight top products
            for (int i = 0; i < Math.min(3, products.size()); i++) {
                Product p = products.get(i);
                double savings = p.getOriginalPrice() - p.getPrice();
                int savingsPercent = (int)((savings / p.getOriginalPrice()) * 100);

                response.append(String.format("✨ **%s** by %s - $%.2f (%d%% off!)\n",
                    p.getName(), p.getBrand(), p.getPrice(), savingsPercent));
                response.append(String.format("   Condition: %s | Originally $%.2f\n\n",
                    p.getCondition(), p.getOriginalPrice()));
            }

            response.append("♻️ These pre-loved items are not only great deals but also eco-friendly choices!");
        }

        return response.toString();
    }

    private String[] getSuggestedAlternatives(String query) {
        String lower = query.toLowerCase();

        if (lower.contains("nike") || lower.contains("sneaker") || lower.contains("shoe")) {
            return new String[]{
                "Athletic shoes from other top brands",
                "Casual sneakers and walking shoes",
                "Designer footwear at thrift prices",
                "Vintage sports shoes collection"
            };
        } else if (lower.contains("vintage") || lower.contains("retro")) {
            return new String[]{
                "Classic clothing pieces",
                "Retro accessories and jewelry",
                "Vintage-style home decor",
                "Timeless designer items"
            };
        } else if (lower.contains("dress") || lower.contains("clothing")) {
            return new String[]{
                "Designer dresses and formal wear",
                "Casual everyday clothing",
                "Seasonal wardrobe pieces",
                "Professional attire options"
            };
        }

        return new String[]{
            "Browse our featured collections",
            "Check out today's best deals",
            "Explore popular categories",
            "Discover trending thrift finds"
        };
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
        if (openAiApiKey == null || openAiApiKey.trim().isEmpty()) {
            return generateFallbackProductDescription(product);
        }

        try {
            String prompt = buildProductDescriptionPrompt(product);
            return callOpenAI(prompt);
        } catch (Exception e) {
            System.err.println("OpenAI API error in product description: " + e.getMessage());
            return generateFallbackProductDescription(product);
        }
    }

    private String buildProductDescriptionPrompt(Product product) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Generate an engaging, detailed product description for this thrift item:\n\n");
        prompt.append("Product: ").append(product.getName()).append("\n");
        prompt.append("Brand: ").append(product.getBrand()).append("\n");
        prompt.append("Category: ").append(product.getCategory()).append("\n");
        prompt.append("Price: $").append(product.getPrice()).append("\n");
        prompt.append("Original Price: $").append(product.getOriginalPrice()).append("\n");
        prompt.append("Condition: ").append(product.getCondition()).append("\n");
        if (product.getSize() != null) {
            prompt.append("Size: ").append(product.getSize()).append("\n");
        }
        if (product.getDescription() != null) {
            prompt.append("Current Description: ").append(product.getDescription()).append("\n");
        }

        double savings = product.getOriginalPrice() - product.getPrice();
        int savingsPercent = (int)((savings / product.getOriginalPrice()) * 100);
        prompt.append("Savings: $").append(String.format("%.2f", savings)).append(" (").append(savingsPercent).append("% off)\n\n");

        prompt.append("Write a compelling 2-3 sentence description that highlights:\n");
        prompt.append("- Quality and condition\n");
        prompt.append("- Value and savings\n");
        prompt.append("- Style appeal\n");
        prompt.append("- Sustainability benefits\n");
        prompt.append("Keep it enthusiastic but authentic. Focus on thrift shopping benefits.");

        return prompt.toString();
    }

    private String generateFallbackProductDescription(Product product) {
        return "This " + product.getName() + " by " + product.getBrand() +
               " is a " + product.getCategory().toLowerCase() + " item " +
               "priced at $" + product.getPrice() + ". " +
               (product.getDescription() != null ? product.getDescription() : "") +
               " Perfect for anyone looking for quality " + product.getCategory().toLowerCase() + ".";
    }

    public List<Product> getPersonalizedRecommendations(String userQuery, String userPreferences, int limit) {
        List<Product> baseProducts = productRepository.findByIsAvailableTrue();

        if (openAiApiKey == null || openAiApiKey.trim().isEmpty()) {
            return getBasicRecommendations(userQuery, baseProducts, limit);
        }

        try {
            String prompt = buildPersonalizationPrompt(userQuery, userPreferences, baseProducts);
            String aiResponse = callOpenAI(prompt);
            return parseRecommendationResponse(aiResponse, baseProducts, limit);
        } catch (Exception e) {
            System.err.println("OpenAI API error in personalized recommendations: " + e.getMessage());
            return getBasicRecommendations(userQuery, baseProducts, limit);
        }
    }

    private String buildPersonalizationPrompt(String userQuery, String userPreferences, List<Product> products) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("User Query: '").append(userQuery).append("'\n");
        if (userPreferences != null && !userPreferences.trim().isEmpty()) {
            prompt.append("User Preferences: ").append(userPreferences).append("\n");
        }
        prompt.append("\nAvailable Products:\n");

        for (int i = 0; i < Math.min(products.size(), 20); i++) {
            Product p = products.get(i);
            prompt.append(i + 1).append(". ").append(p.getName())
                  .append(" by ").append(p.getBrand())
                  .append(" - $").append(p.getPrice())
                  .append(" (").append(p.getCategory()).append(", ")
                  .append(p.getCondition()).append(")\n");
        }

        prompt.append("\nBased on the user's query and preferences, rank the top products by relevance.");
        prompt.append(" Return only the product numbers (1-").append(Math.min(products.size(), 20))
              .append(") in order of recommendation, separated by commas.");
        prompt.append(" Consider style match, value, condition, and user preferences.");

        return prompt.toString();
    }

    private List<Product> parseRecommendationResponse(String aiResponse, List<Product> products, int limit) {
        List<Product> recommendations = new ArrayList<>();
        String[] productNumbers = aiResponse.replaceAll("[^0-9,]", "").split(",");

        for (String numStr : productNumbers) {
            try {
                int index = Integer.parseInt(numStr.trim()) - 1;
                if (index >= 0 && index < products.size()) {
                    recommendations.add(products.get(index));
                    if (recommendations.size() >= limit) break;
                }
            } catch (NumberFormatException e) {
                // Skip invalid numbers
            }
        }

        // Fill remaining spots with basic recommendations if needed
        if (recommendations.size() < limit) {
            for (Product p : products) {
                if (!recommendations.contains(p)) {
                    recommendations.add(p);
                    if (recommendations.size() >= limit) break;
                }
            }
        }

        return recommendations;
    }

    private List<Product> getBasicRecommendations(String userQuery, List<Product> products, int limit) {
        String[] keywords = userQuery.toLowerCase().split("\\s+");

        return products.stream()
                .map(product -> {
                    String searchText = (product.getName() + " " +
                                      product.getDescription() + " " +
                                      product.getBrand() + " " +
                                      product.getCategory()).toLowerCase();

                    int score = 0;
                    for (String keyword : keywords) {
                        if (searchText.contains(keyword)) {
                            score += 1;
                        }
                    }
                    return new ProductScore(product, score);
                })
                .filter(ps -> ps.score > 0)
                .sorted((p1, p2) -> Integer.compare(p2.score, p1.score))
                .limit(limit)
                .map(ps -> ps.product)
                .collect(Collectors.toList());
    }

    public String generateSmartSearchSuggestions(String userQuery) {
        if (openAiApiKey == null || openAiApiKey.trim().isEmpty()) {
            return generateBasicSearchSuggestions(userQuery);
        }

        try {
            String prompt = "User searched for: '" + userQuery + "'\n\n" +
                           "Generate 5 related search suggestions for a thrift shopping platform. " +
                           "Focus on:\n" +
                           "- Related items or categories\n" +
                           "- Brand alternatives\n" +
                           "- Style variations\n" +
                           "- Budget-friendly options\n" +
                           "- Seasonal relevance\n\n" +
                           "Return suggestions as a comma-separated list.";

            return callOpenAI(prompt);
        } catch (Exception e) {
            System.err.println("OpenAI API error in search suggestions: " + e.getMessage());
            return generateBasicSearchSuggestions(userQuery);
        }
    }

    private String generateBasicSearchSuggestions(String userQuery) {
        String lower = userQuery.toLowerCase();
        List<String> suggestions = new ArrayList<>();

        if (lower.contains("shirt") || lower.contains("top")) {
            suggestions.addAll(Arrays.asList("vintage t-shirts", "designer blouses", "casual tops", "button-up shirts", "graphic tees"));
        } else if (lower.contains("jeans") || lower.contains("pants")) {
            suggestions.addAll(Arrays.asList("vintage denim", "designer jeans", "high-waisted jeans", "skinny jeans", "wide-leg pants"));
        } else if (lower.contains("shoes") || lower.contains("sneakers")) {
            suggestions.addAll(Arrays.asList("vintage sneakers", "designer heels", "casual shoes", "running shoes", "dress shoes"));
        } else if (lower.contains("jacket") || lower.contains("coat")) {
            suggestions.addAll(Arrays.asList("vintage jackets", "leather coats", "winter coats", "blazers", "denim jackets"));
        } else {
            suggestions.addAll(Arrays.asList("trending items", "designer pieces", "vintage finds", "budget deals", "seasonal items"));
        }

        return String.join(", ", suggestions.subList(0, Math.min(5, suggestions.size())));
    }

    public SearchFilters extractSearchFilters(String naturalLanguageQuery) {
        System.out.println("🔍 Step 1: Extracting filters from query: " + naturalLanguageQuery);

        if (openAiApiKey == null || openAiApiKey.trim().isEmpty()) {
            System.out.println("⚠️ No OpenAI API key available, using basic filter extraction");
            return extractBasicFilters(naturalLanguageQuery);
        }

        try {
            String prompt = buildFilterExtractionPrompt(naturalLanguageQuery);
            String llmResponse = callOpenAI(prompt);
            return parseFilterResponse(llmResponse, naturalLanguageQuery);
        } catch (Exception e) {
            System.err.println("❌ LLM filter extraction failed: " + e.getMessage());
            return extractBasicFilters(naturalLanguageQuery);
        }
    }

    private String buildFilterExtractionPrompt(String query) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Extract structured search filters from this natural language query: '").append(query).append("'\n\n");

        prompt.append("Analyze the query and extract the following filters (use 'null' if not mentioned):\n");
        prompt.append("- category: clothing, shoes, accessories, electronics, home, books, etc.\n");
        prompt.append("- brand: specific brand names mentioned\n");
        prompt.append("- minPrice: minimum price (number only)\n");
        prompt.append("- maxPrice: maximum price (number only)\n");
        prompt.append("- condition: new, excellent, good, fair\n");
        prompt.append("- size: XS, S, M, L, XL, XXL, or specific sizes\n");
        prompt.append("- keywords: important descriptive words (comma-separated)\n");
        prompt.append("- intent: budget-shopping, designer-hunting, specific-item, browsing\n");
        prompt.append("- style: vintage, modern, casual, formal, sporty\n");
        prompt.append("- color: any color mentioned\n");
        prompt.append("- gender: men, women, unisex, kids\n\n");

        prompt.append("Example Query: 'Show me budget vintage Nike sneakers under $50 for men'\n");
        prompt.append("Example Response:\n");
        prompt.append("category: shoes\n");
        prompt.append("brand: Nike\n");
        prompt.append("minPrice: null\n");
        prompt.append("maxPrice: 50\n");
        prompt.append("condition: null\n");
        prompt.append("size: null\n");
        prompt.append("keywords: vintage,sneakers\n");
        prompt.append("intent: budget-shopping\n");
        prompt.append("style: vintage\n");
        prompt.append("color: null\n");
        prompt.append("gender: men\n\n");

        prompt.append("Now extract filters for the given query. Respond in the exact format shown above:");

        return prompt.toString();
    }

    private SearchFilters parseFilterResponse(String llmResponse, String originalQuery) {
        SearchFilters filters = new SearchFilters(originalQuery);

        try {
            String[] lines = llmResponse.split("\n");
            for (String line : lines) {
                String[] parts = line.split(":", 2);
                if (parts.length != 2) continue;

                String key = parts[0].trim().toLowerCase();
                String value = parts[1].trim();

                if ("null".equals(value) || value.isEmpty()) {
                    continue;
                }

                switch (key) {
                    case "category":
                        filters.setCategory(value);
                        break;
                    case "brand":
                        filters.setBrand(value);
                        break;
                    case "minprice":
                        try {
                            filters.setMinPrice(Double.parseDouble(value));
                        } catch (NumberFormatException e) {
                            System.err.println("Invalid minPrice: " + value);
                        }
                        break;
                    case "maxprice":
                        try {
                            filters.setMaxPrice(Double.parseDouble(value));
                        } catch (NumberFormatException e) {
                            System.err.println("Invalid maxPrice: " + value);
                        }
                        break;
                    case "condition":
                        filters.setCondition(value);
                        break;
                    case "size":
                        filters.setSize(value);
                        break;
                    case "keywords":
                        filters.setKeywords(Arrays.asList(value.split(",")));
                        break;
                    case "intent":
                        filters.setIntent(value);
                        break;
                    case "style":
                        filters.setStyle(value);
                        break;
                    case "color":
                        filters.setColor(value);
                        break;
                    case "gender":
                        filters.setGender(value);
                        break;
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing LLM filter response: " + e.getMessage());
        }

        System.out.println("✅ Extracted filters: " + filters.toString());
        return filters;
    }

    private SearchFilters extractBasicFilters(String query) {
        SearchFilters filters = new SearchFilters(query);
        String lowerQuery = query.toLowerCase();

        // Basic category detection
        if (lowerQuery.contains("shirt") || lowerQuery.contains("dress") || lowerQuery.contains("jeans") || lowerQuery.contains("clothing")) {
            filters.setCategory("clothing");
        } else if (lowerQuery.contains("shoes") || lowerQuery.contains("sneakers") || lowerQuery.contains("boots")) {
            filters.setCategory("shoes");
        } else if (lowerQuery.contains("bag") || lowerQuery.contains("jewelry") || lowerQuery.contains("watch")) {
            filters.setCategory("accessories");
        } else if (lowerQuery.contains("electronics") || lowerQuery.contains("console") || lowerQuery.contains("gaming")) {
            filters.setCategory("electronics");
        }

        // Basic price detection
        if (lowerQuery.contains("under $") || lowerQuery.contains("below $")) {
            String[] parts = lowerQuery.split("under \\$|below \\$");
            if (parts.length > 1) {
                try {
                    String priceStr = parts[1].split("\\s+")[0];
                    filters.setMaxPrice(Double.parseDouble(priceStr));
                } catch (NumberFormatException e) {
                    // Ignore invalid price
                }
            }
        }

        // Basic intent detection
        if (lowerQuery.contains("cheap") || lowerQuery.contains("budget") || lowerQuery.contains("affordable")) {
            filters.setIntent("budget-shopping");
        } else if (lowerQuery.contains("designer") || lowerQuery.contains("luxury") || lowerQuery.contains("premium")) {
            filters.setIntent("designer-hunting");
        }

        // Basic style detection
        if (lowerQuery.contains("vintage") || lowerQuery.contains("retro")) {
            filters.setStyle("vintage");
        } else if (lowerQuery.contains("casual")) {
            filters.setStyle("casual");
        } else if (lowerQuery.contains("formal")) {
            filters.setStyle("formal");
        }

        // Basic gender detection
        if (lowerQuery.contains("men") || lowerQuery.contains("male")) {
            filters.setGender("men");
        } else if (lowerQuery.contains("women") || lowerQuery.contains("female") || lowerQuery.contains("ladies")) {
            filters.setGender("women");
        }

        // Extract basic keywords (remove common words)
        String[] words = lowerQuery.split("\\s+");
        List<String> keywords = Arrays.stream(words)
            .filter(word -> word.length() > 2)
            .filter(word -> !Arrays.asList("the", "and", "for", "with", "are", "has", "can", "you", "all", "any", "had", "her", "was", "one", "our", "out", "day", "get", "use", "man", "new", "now", "old", "see", "him", "two", "way", "who", "its", "did", "yes", "his", "has", "had", "under", "below", "show").contains(word))
            .collect(Collectors.toList());
        filters.setKeywords(keywords);

        return filters;
    }

    public List<Product> executeFilteredSearch(SearchFilters filters) {
        System.out.println("🔍 Step 2: Executing business logic query with filters: " + filters.toString());

        List<Product> allProducts = productRepository.findByIsAvailableTrue();
        return allProducts.stream()
                .filter(product -> matchesFilters(product, filters))
                .map(product -> new ProductScore(product, calculateRelevanceScore(product, filters)))
                .sorted((p1, p2) -> Integer.compare(p2.score, p1.score))
                .limit(20)
                .map(productScore -> productScore.product)
                .collect(Collectors.toList());
    }

    private boolean matchesFilters(Product product, SearchFilters filters) {
        // Category filter
        if (filters.getCategory() != null) {
            if (!product.getCategory().toLowerCase().contains(filters.getCategory().toLowerCase())) {
                return false;
            }
        }

        // Brand filter
        if (filters.getBrand() != null) {
            if (product.getBrand() == null || !product.getBrand().toLowerCase().contains(filters.getBrand().toLowerCase())) {
                return false;
            }
        }

        // Price range filters
        if (filters.getMinPrice() != null && product.getPrice() < filters.getMinPrice()) {
            return false;
        }
        if (filters.getMaxPrice() != null && product.getPrice() > filters.getMaxPrice()) {
            return false;
        }

        // Condition filter
        if (filters.getCondition() != null) {
            if (product.getCondition() == null || !product.getCondition().toLowerCase().contains(filters.getCondition().toLowerCase())) {
                return false;
            }
        }

        // Size filter
        if (filters.getSize() != null) {
            if (product.getSize() == null || !product.getSize().toLowerCase().contains(filters.getSize().toLowerCase())) {
                return false;
            }
        }

        // Color filter (check name and description)
        if (filters.getColor() != null) {
            String searchText = (product.getName() + " " + (product.getDescription() != null ? product.getDescription() : "")).toLowerCase();
            if (!searchText.contains(filters.getColor().toLowerCase())) {
                return false;
            }
        }

        // Keywords filter (at least one keyword must match)
        if (filters.getKeywords() != null && !filters.getKeywords().isEmpty()) {
            String searchText = (product.getName() + " " +
                              (product.getDescription() != null ? product.getDescription() : "") + " " +
                              product.getBrand() + " " +
                              product.getCategory()).toLowerCase();

            boolean keywordMatch = filters.getKeywords().stream()
                    .anyMatch(keyword -> searchText.contains(keyword.toLowerCase()));

            if (!keywordMatch) {
                return false;
            }
        }

        return true;
    }

    private int calculateRelevanceScore(Product product, SearchFilters filters) {
        int score = 0;
        String searchText = (product.getName() + " " +
                          (product.getDescription() != null ? product.getDescription() : "") + " " +
                          product.getBrand() + " " +
                          product.getCategory()).toLowerCase();

        // Keyword matching with different weights
        if (filters.getKeywords() != null) {
            for (String keyword : filters.getKeywords()) {
                String lowerKeyword = keyword.toLowerCase();

                // Name match gets highest score
                if (product.getName().toLowerCase().contains(lowerKeyword)) {
                    score += 15;
                }
                // Brand match gets high score
                if (product.getBrand() != null && product.getBrand().toLowerCase().contains(lowerKeyword)) {
                    score += 12;
                }
                // Category match gets medium score
                if (product.getCategory().toLowerCase().contains(lowerKeyword)) {
                    score += 8;
                }
                // Description match gets lower score
                if (product.getDescription() != null && product.getDescription().toLowerCase().contains(lowerKeyword)) {
                    score += 5;
                }
            }
        }

        // Exact category match bonus
        if (filters.getCategory() != null && product.getCategory().toLowerCase().equals(filters.getCategory().toLowerCase())) {
            score += 10;
        }

        // Exact brand match bonus
        if (filters.getBrand() != null && product.getBrand() != null &&
            product.getBrand().toLowerCase().equals(filters.getBrand().toLowerCase())) {
            score += 10;
        }

        // Style-based scoring
        if (filters.getStyle() != null) {
            if (searchText.contains(filters.getStyle().toLowerCase())) {
                score += 8;
            }
        }

        // Intent-based scoring
        if (filters.getIntent() != null) {
            switch (filters.getIntent().toLowerCase()) {
                case "budget-shopping":
                    // Favor lower prices and good deals
                    double savings = product.getOriginalPrice() - product.getPrice();
                    double savingsPercent = (savings / product.getOriginalPrice()) * 100;
                    if (savingsPercent > 50) score += 10;
                    else if (savingsPercent > 30) score += 6;
                    else if (savingsPercent > 15) score += 3;
                    break;
                case "designer-hunting":
                    // Favor high-end brands and premium items
                    if (product.getOriginalPrice() > 100) score += 5;
                    if (searchText.contains("designer") || searchText.contains("luxury") ||
                        searchText.contains("premium") || searchText.contains("authentic")) {
                        score += 10;
                    }
                    break;
                case "specific-item":
                    // Favor exact matches
                    score += 5; // Already handled by keyword matching
                    break;
            }
        }

        // Condition-based scoring
        if ("excellent".equalsIgnoreCase(product.getCondition())) {
            score += 5;
        } else if ("good".equalsIgnoreCase(product.getCondition())) {
            score += 3;
        }

        // Price range fit bonus
        if (filters.getMaxPrice() != null) {
            double priceRatio = product.getPrice() / filters.getMaxPrice();
            if (priceRatio <= 0.7) score += 3; // Well under budget
            else if (priceRatio <= 0.9) score += 1; // Within budget
        }

        return score;
    }

    public String generateIntelligentSummary(SearchFilters filters, List<Product> products) {
        System.out.println("🔍 Step 3: Generating LLM summary and ranking for " + products.size() + " products");

        if (openAiApiKey == null || openAiApiKey.trim().isEmpty()) {
            System.out.println("⚠️ No OpenAI API key available, using basic summary");
            return generateBasicSummary(filters, products);
        }

        try {
            String prompt = buildSummaryPrompt(filters, products);
            String llmSummary = callOpenAI(prompt);
            return enhanceSummaryWithAnalytics(llmSummary, filters, products);
        } catch (Exception e) {
            System.err.println("❌ LLM summary generation failed: " + e.getMessage());
            return generateBasicSummary(filters, products);
        }
    }

    private String buildSummaryPrompt(SearchFilters filters, List<Product> products) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are ThriftAI's intelligent shopping assistant. Analyze the search results and create an engaging response.\n\n");

        prompt.append("User's Original Query: '").append(filters.getOriginalQuery()).append("'\n");
        prompt.append("Search Intent: ").append(filters.getIntent() != null ? filters.getIntent() : "general browsing").append("\n");
        prompt.append("Filters Applied:\n");
        if (filters.getCategory() != null) prompt.append("- Category: ").append(filters.getCategory()).append("\n");
        if (filters.getBrand() != null) prompt.append("- Brand: ").append(filters.getBrand()).append("\n");
        if (filters.getMaxPrice() != null) prompt.append("- Max Price: $").append(filters.getMaxPrice()).append("\n");
        if (filters.getStyle() != null) prompt.append("- Style: ").append(filters.getStyle()).append("\n");
        if (filters.getGender() != null) prompt.append("- Gender: ").append(filters.getGender()).append("\n");
        prompt.append("\n");

        if (products.isEmpty()) {
            prompt.append("No products found matching the filters.\n\n");
            prompt.append("Provide helpful suggestions for:\n");
            prompt.append("1. Alternative search terms\n");
            prompt.append("2. Related categories to explore\n");
            prompt.append("3. Tips for broadening the search\n");
            prompt.append("Keep it encouraging and helpful!");
        } else {
            prompt.append("Found ").append(products.size()).append(" matching products:\n\n");

            for (int i = 0; i < Math.min(products.size(), 5); i++) {
                Product p = products.get(i);
                double savings = p.getOriginalPrice() - p.getPrice();
                int savingsPercent = (int)((savings / p.getOriginalPrice()) * 100);

                prompt.append(String.format("%d. %s by %s\n", i+1, p.getName(), p.getBrand()));
                prompt.append(String.format("   Price: $%.2f (was $%.2f) - %d%% off\n",
                    p.getPrice(), p.getOriginalPrice(), savingsPercent));
                prompt.append(String.format("   Condition: %s | Category: %s\n", p.getCondition(), p.getCategory()));
                if (p.getDescription() != null && p.getDescription().length() > 0) {
                    prompt.append(String.format("   Details: %s\n", p.getDescription().substring(0, Math.min(80, p.getDescription().length()))));
                }
                prompt.append("\n");
            }

            prompt.append("Analysis Tasks:\n");
            prompt.append("1. Create an enthusiastic opening statement about the findings\n");
            prompt.append("2. Highlight the best deals and unique finds\n");
            prompt.append("3. Mention sustainability benefits of choosing thrift\n");
            prompt.append("4. Provide shopping recommendations based on the user's intent\n");
            prompt.append("5. Use appropriate emojis to make it engaging\n");
            prompt.append("6. Keep the tone conversational and helpful\n");
            prompt.append("7. Focus on value propositions and why each item is special\n\n");

            if (filters.getIntent() != null) {
                switch (filters.getIntent().toLowerCase()) {
                    case "budget-shopping":
                        prompt.append("Special focus: Emphasize savings, affordability, and great deals\n");
                        break;
                    case "designer-hunting":
                        prompt.append("Special focus: Highlight premium brands, authenticity, and luxury at thrift prices\n");
                        break;
                    case "specific-item":
                        prompt.append("Special focus: How well these items match their specific requirements\n");
                        break;
                }
            }
        }

        prompt.append("\nWrite a compelling, personalized response (3-4 sentences):");
        return prompt.toString();
    }

    private String enhanceSummaryWithAnalytics(String llmSummary, SearchFilters filters, List<Product> products) {
        StringBuilder enhanced = new StringBuilder();
        enhanced.append(llmSummary).append("\n\n");

        if (!products.isEmpty()) {
            // Add detailed analytics
            double totalSavings = products.stream()
                .mapToDouble(p -> p.getOriginalPrice() - p.getPrice())
                .sum();

            double avgDiscount = products.stream()
                .mapToDouble(p -> ((p.getOriginalPrice() - p.getPrice()) / p.getOriginalPrice()) * 100)
                .average()
                .orElse(0);

            long excellentConditionCount = products.stream()
                .filter(p -> "EXCELLENT".equalsIgnoreCase(p.getCondition()))
                .count();

            enhanced.append("📊 **Smart Analytics:**\n");
            enhanced.append(String.format("• Total potential savings: $%.2f across all items\n", totalSavings));
            enhanced.append(String.format("• Average discount: %.0f%% off original retail prices\n", avgDiscount));
            enhanced.append(String.format("• %d items in excellent condition\n", excellentConditionCount));

            // Category breakdown
            Map<String, Long> categoryBreakdown = products.stream()
                .collect(Collectors.groupingBy(Product::getCategory, Collectors.counting()));

            if (categoryBreakdown.size() > 1) {
                enhanced.append("• Categories found: ").append(
                    categoryBreakdown.entrySet().stream()
                        .map(entry -> entry.getKey() + " (" + entry.getValue() + ")")
                        .collect(Collectors.joining(", "))
                ).append("\n");
            }

            // Price range analysis
            double minPrice = products.stream().mapToDouble(Product::getPrice).min().orElse(0);
            double maxPrice = products.stream().mapToDouble(Product::getPrice).max().orElse(0);
            enhanced.append(String.format("• Price range: $%.2f - $%.2f\n", minPrice, maxPrice));

            // Intent-specific insights
            if (filters.getIntent() != null) {
                enhanced.append("\n💡 **Personalized Insights:**\n");
                switch (filters.getIntent().toLowerCase()) {
                    case "budget-shopping":
                        Product bestDeal = products.stream()
                            .max((p1, p2) -> Double.compare(
                                (p1.getOriginalPrice() - p1.getPrice()) / p1.getOriginalPrice(),
                                (p2.getOriginalPrice() - p2.getPrice()) / p2.getOriginalPrice()
                            )).orElse(null);
                        if (bestDeal != null) {
                            double savingsPercent = ((bestDeal.getOriginalPrice() - bestDeal.getPrice()) / bestDeal.getOriginalPrice()) * 100;
                            enhanced.append(String.format("• Best deal: %s with %.0f%% off!\n", bestDeal.getName(), savingsPercent));
                        }
                        break;
                    case "designer-hunting":
                        long premiumCount = products.stream()
                            .filter(p -> p.getOriginalPrice() > 100)
                            .count();
                        enhanced.append(String.format("• %d premium items (original price >$100) available\n", premiumCount));
                        break;
                }
            }

            // Environmental impact
            enhanced.append("\n🌱 **Environmental Impact:**\n");
            double estimatedWastePrevented = products.size() * 2.3; // Estimate
            enhanced.append(String.format("• Choosing these thrift items prevents ~%.1f lbs of textile waste\n", estimatedWastePrevented));
            enhanced.append(String.format("• Each purchase supports sustainable fashion and reduces environmental impact\n"));
        }

        return enhanced.toString();
    }

    private String generateBasicSummary(SearchFilters filters, List<Product> products) {
        StringBuilder summary = new StringBuilder();

        if (products.isEmpty()) {
            summary.append("🔍 No items found matching '").append(filters.getOriginalQuery()).append("'.\n\n");
            summary.append("💡 Try these alternatives:\n");
            summary.append("• Broaden your search terms\n");
            summary.append("• Check different categories\n");
            summary.append("• Explore related brands\n");
            summary.append("• Browse our featured collections\n");
        } else {
            summary.append("🛍️ Found ").append(products.size()).append(" great thrift finds for '")
                   .append(filters.getOriginalQuery()).append("'!\n\n");

            // Highlight top 3 products
            for (int i = 0; i < Math.min(3, products.size()); i++) {
                Product p = products.get(i);
                double savings = p.getOriginalPrice() - p.getPrice();
                int savingsPercent = (int)((savings / p.getOriginalPrice()) * 100);

                summary.append(String.format("✨ **%s** by %s - $%.2f (%d%% off!)\n",
                    p.getName(), p.getBrand(), p.getPrice(), savingsPercent));
                summary.append(String.format("   Condition: %s | Save $%.2f\n\n",
                    p.getCondition(), savings));
            }

            if (products.size() > 3) {
                summary.append("...and ").append(products.size() - 3).append(" more items!\n\n");
            }

            // Basic analytics
            double avgSavings = products.stream()
                .mapToDouble(p -> ((p.getOriginalPrice() - p.getPrice()) / p.getOriginalPrice()) * 100)
                .average().orElse(0);

            summary.append("💰 Average savings: ").append(Math.round(avgSavings)).append("% off retail prices\n");
            summary.append("♻️ Sustainable shopping that's good for your wallet and the planet!");
        }

        return summary.toString();
    }

    public String executeThreeStepSearch(String naturalLanguageQuery) {
        System.out.println("🚀 Starting 3-Step LLM Search Flow for: " + naturalLanguageQuery);

        // Step 1: Extract filters using LLM
        SearchFilters filters = extractSearchFilters(naturalLanguageQuery);

        // Step 2: Execute business logic search
        List<Product> products = executeFilteredSearch(filters);

        // Step 3: Generate intelligent summary
        String summary = generateIntelligentSummary(filters, products);

        System.out.println("✅ 3-Step Search Flow completed successfully");
        return summary;
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
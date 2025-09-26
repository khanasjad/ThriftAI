package com.projectai.service;

import com.projectai.models.Product;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;
import java.util.Arrays;
import java.util.Map;
import java.util.HashMap;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Claude AI Service for real-time text generation
 * Integrates with Anthropic's Claude API for intelligent thrift shopping assistance
 */
@Service
public class ClaudeService {

    @Value("${claude.api.key:}")
    private String claudeApiKey;
    
    @Value("${claude.api.url:https://api.anthropic.com/v1/messages}")
    private String claudeApiUrl;
    
    @Value("${claude.api.model:claude-3-5-sonnet-20241022}")
    private String claudeModel;
    
    @Value("${claude.api.max-tokens:1000}")
    private int maxTokens;
    
    @Value("${claude.api.temperature:0.7}")
    private double temperature;
    
    @Value("${claude.api.version:2023-06-01}")
    private String apiVersion;
    
    @Value("${claude.streaming.enabled:true}")
    private boolean streamingEnabled;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generate streaming text response for thrift shopping queries
     */
    public String generateThriftResponse(String userMessage, List<Product> products, String context) {
        if (claudeApiKey == null || claudeApiKey.trim().isEmpty()) {
            return generateFallbackResponse(userMessage, products);
        }

        try {
            String prompt = buildThriftPrompt(userMessage, products, context);
            return callClaudeAPI(prompt);
        } catch (Exception e) {
            System.err.println("Claude API error: " + e.getMessage());
            return generateFallbackResponse(userMessage, products);
        }
    }

    /**
     * Generate product-specific insights using Claude
     */
    public String generateProductInsights(List<Product> products, String query) {
        if (products.isEmpty()) {
            return "I couldn't find any products matching your search. Try browsing our categories or searching for different terms!";
        }

        try {
            String prompt = buildProductInsightsPrompt(products, query);
            return callClaudeAPI(prompt);
        } catch (Exception e) {
            return generateBasicInsights(products, query);
        }
    }

    /**
     * Generate conversational response for general thrift shopping questions
     */
    public String generateConversationalResponse(String userMessage, String sessionContext) {
        if (claudeApiKey == null || claudeApiKey.trim().isEmpty()) {
            return generateBasicConversationalResponse(userMessage);
        }

        try {
            String prompt = buildConversationalPrompt(userMessage, sessionContext);
            return callClaudeAPI(prompt);
        } catch (Exception e) {
            return generateBasicConversationalResponse(userMessage);
        }
    }

    /**
     * Generate shopping recommendations using Claude
     */
    public String generateShoppingRecommendations(String userPreferences, List<Product> availableProducts) {
        try {
            String prompt = buildRecommendationPrompt(userPreferences, availableProducts);
            return callClaudeAPI(prompt);
        } catch (Exception e) {
            return generateBasicRecommendations(availableProducts);
        }
    }

    /**
     * Call Claude API with proper headers and error handling
     */
    private String callClaudeAPI(String prompt) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", claudeApiKey);
        headers.set("anthropic-version", apiVersion);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", claudeModel);
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("temperature", temperature);
        
        // Claude API expects messages in a specific format
        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);
        requestBody.put("messages", Arrays.asList(message));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        
        ResponseEntity<String> response = restTemplate.exchange(
            claudeApiUrl, 
            HttpMethod.POST, 
            entity, 
            String.class
        );

        // Parse Claude API response
        JsonNode jsonResponse = objectMapper.readTree(response.getBody());
        
        if (jsonResponse.has("content") && jsonResponse.get("content").isArray()) {
            JsonNode content = jsonResponse.get("content").get(0);
            if (content.has("text")) {
                return content.get("text").asText().trim();
            }
        }
        
        throw new RuntimeException("Unexpected Claude API response format");
    }

    /**
     * Build thrift-specific prompt for Claude
     */
    private String buildThriftPrompt(String userMessage, List<Product> products, String context) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("You are ThriftAI, an expert AI assistant specializing in thrift shopping and sustainable fashion. ");
        prompt.append("You help users find the best deals, understand product value, and make eco-friendly shopping decisions.\n\n");
        
        prompt.append("User Query: \"").append(userMessage).append("\"\n");
        
        if (context != null && !context.trim().isEmpty()) {
            prompt.append("Context: ").append(context).append("\n");
        }
        
        if (!products.isEmpty()) {
            prompt.append("\nAvailable Products:\n");
            for (int i = 0; i < Math.min(products.size(), 5); i++) {
                Product p = products.get(i);
                prompt.append("• ").append(p.getName())
                      .append(" by ").append(p.getBrand())
                      .append(" - $").append(p.getPrice());
                
                if (p.getOriginalPrice() > 0) {
                    double savings = ((p.getOriginalPrice() - p.getPrice()) / p.getOriginalPrice()) * 100;
                    prompt.append(" (was $").append(p.getOriginalPrice())
                          .append(", ").append(String.format("%.0f", savings)).append("% off)");
                }
                
                prompt.append("\n  Condition: ").append(p.getCondition())
                      .append(", Size: ").append(p.getSize())
                      .append("\n  ").append(p.getDescription()).append("\n\n");
            }
        }
        
        prompt.append("Provide a helpful, enthusiastic response that:\n");
        prompt.append("1. Addresses the user's specific query\n");
        prompt.append("2. Highlights the best deals and value propositions\n");
        prompt.append("3. Emphasizes sustainability and environmental benefits\n");
        prompt.append("4. Uses emojis appropriately for engagement\n");
        prompt.append("5. Provides actionable shopping advice\n");
        prompt.append("6. Suggests related items or searches if relevant\n\n");
        prompt.append("Keep the response conversational, informative, and under 200 words.");
        
        return prompt.toString();
    }

    /**
     * Build product insights prompt
     */
    private String buildProductInsightsPrompt(List<Product> products, String query) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("Analyze these thrift products and provide insights for the query: '").append(query).append("'\n\n");
        
        double totalSavings = 0;
        int savingsCount = 0;
        
        for (Product p : products) {
            if (p.getOriginalPrice() > 0) {
                totalSavings += p.getOriginalPrice() - p.getPrice();
                savingsCount++;
            }
        }
        
        prompt.append("Products found: ").append(products.size()).append("\n");
        if (savingsCount > 0) {
            prompt.append("Total potential savings: $").append(String.format("%.2f", totalSavings)).append("\n");
        }
        
        prompt.append("\nProvide 3-4 bullet points about:\n");
        prompt.append("• Value and savings opportunities\n");
        prompt.append("• Product variety and selection\n");
        prompt.append("• Sustainability impact\n");
        prompt.append("• Shopping recommendations\n");
        prompt.append("\nKeep each point concise and actionable.");
        
        return prompt.toString();
    }

    /**
     * Build conversational prompt for general queries
     */
    private String buildConversationalPrompt(String userMessage, String sessionContext) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("You are ThriftAI, a friendly and knowledgeable assistant for thrift shopping. ");
        prompt.append("Respond to this user message in a helpful, conversational way:\n\n");
        prompt.append("User: \"").append(userMessage).append("\"\n\n");
        
        if (sessionContext != null && !sessionContext.trim().isEmpty()) {
            prompt.append("Session Context: ").append(sessionContext).append("\n\n");
        }
        
        prompt.append("Provide advice about thrift shopping, deals, sustainability, or fashion. ");
        prompt.append("Be encouraging and helpful. Use emojis moderately. Keep response under 150 words.");
        
        return prompt.toString();
    }

    /**
     * Build recommendation prompt
     */
    private String buildRecommendationPrompt(String userPreferences, List<Product> availableProducts) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("Based on these user preferences: ").append(userPreferences).append("\n\n");
        prompt.append("Recommend the best products from this selection:\n");
        
        for (int i = 0; i < Math.min(availableProducts.size(), 10); i++) {
            Product p = availableProducts.get(i);
            prompt.append("• ").append(p.getName()).append(" - $").append(p.getPrice())
                  .append(" (").append(p.getCondition()).append(")\n");
        }
        
        prompt.append("\nProvide 2-3 specific recommendations with reasons why they match the user's preferences.");
        
        return prompt.toString();
    }

    // Fallback methods when Claude API is unavailable

    private String generateFallbackResponse(String userMessage, List<Product> products) {
        if (products.isEmpty()) {
            return "🔍 I didn't find specific products for '" + userMessage + 
                   "', but I'm here to help you discover amazing thrift deals! Try browsing our categories or search for different terms.";
        }

        StringBuilder response = new StringBuilder();
        response.append("🛍️ Found ").append(products.size()).append(" great thrift finds");
        
        if (products.size() == 1) {
            Product p = products.get(0);
            response.append("! Check out this ").append(p.getName())
                   .append(" for just $").append(p.getPrice());
            
            if (p.getOriginalPrice() > 0) {
                double savings = ((p.getOriginalPrice() - p.getPrice()) / p.getOriginalPrice()) * 100;
                response.append(" (").append(String.format("%.0f", savings)).append("% off!)");
            }
            response.append(" ♻️");
        } else {
            response.append("!\n\n💰 Amazing deals available from $")
                   .append(String.format("%.2f", products.stream().mapToDouble(Product::getPrice).min().orElse(0)))
                   .append(" to $")
                   .append(String.format("%.2f", products.stream().mapToDouble(Product::getPrice).max().orElse(0)))
                   .append("\n🌱 Every purchase helps the environment!");
        }
        
        return response.toString();
    }

    private String generateBasicInsights(List<Product> products, String query) {
        double avgSavings = products.stream()
                .filter(p -> p.getOriginalPrice() > 0)
                .mapToDouble(p -> ((p.getOriginalPrice() - p.getPrice()) / p.getOriginalPrice()) * 100)
                .average()
                .orElse(0);

        return String.format("• Average savings: %.0f%% off retail\n• %d items available\n• Great variety in condition and pricing\n• Sustainable shopping choice",
                avgSavings, products.size());
    }

    private String generateBasicConversationalResponse(String userMessage) {
        String message = userMessage.toLowerCase();
        
        if (message.contains("help") || message.contains("how")) {
            return "I'm here to help you find amazing thrift deals! 🛍️ You can search for specific items, " +
                   "browse categories, or ask me about pricing and product details. What are you looking for today?";
        }
        
        if (message.contains("thank") || message.contains("thanks")) {
            return "You're welcome! Happy thrift shopping! 😊 Remember, every thrift purchase helps the environment " +
                   "and saves you money. Is there anything else I can help you find?";
        }
        
        return "I'm ThriftAI, your smart shopping assistant! 🤖 I can help you find the best thrift deals, " +
               "compare prices, and discover sustainable fashion choices. What would you like to shop for?";
    }

    private String generateBasicRecommendations(List<Product> products) {
        if (products.isEmpty()) {
            return "Check back soon for new arrivals! We're always getting fresh inventory.";
        }
        
        return "Based on current selection, I recommend checking out our " +
               products.get(0).getCategory().toLowerCase() + " section for the best deals!";
    }
}
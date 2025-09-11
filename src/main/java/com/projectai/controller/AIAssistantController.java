package com.projectai.controller;

import com.projectai.service.AITransformationService;
import com.projectai.service.ChatGPTService;
import com.projectai.service.ClaudeService;
import com.projectai.service.StreamingTextService;
import com.projectai.models.Product;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Arrays;

@Controller
@RequestMapping("/ai")
public class AIAssistantController {

    @Autowired
    private AITransformationService aiTransformationService;
    
    @Autowired
    private ChatGPTService chatGPTService;
    
    @Autowired
    private ClaudeService claudeService;
    
    @Autowired
    private StreamingTextService streamingTextService;

    @GetMapping("/assistant")
    public String aiAssistant(Model model) {
        return "ai/assistant-standalone";
    }
    
    @GetMapping("/streaming")
    public String streamingAssistant(Model model) {
        return "ai/streaming-assistant";
    }
    
    @GetMapping("/test")
    public String aiTest(Model model) {
        return "ai/simple-search";
    }
    
    @GetMapping("/search")
    public String aiSearch(Model model) {
        return "ai/search";
    }
    
    @PostMapping("/chat")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, String> request) {
        String userMessage = request.get("message");
        String chatType = request.get("type"); // "shopping", "search", "comparison"
        String userPreferences = request.get("preferences"); // User preferences context
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String aiResponse;
            List<String> suggestions;
            Map<String, Object> additionalData = new HashMap<>();
            
            // Use AI Transformation Service for enhanced responses
            if ("search".equals(chatType) || "shopping".equals(chatType)) {
                AITransformationService.AISearchResult searchResult = 
                    aiTransformationService.enhanceThriftSearch(userMessage, userPreferences);
                
                aiResponse = searchResult.response;
                suggestions = searchResult.suggestions;
                
                // Add product results and insights
                additionalData.put("products", searchResult.products);
                additionalData.put("insights", searchResult.insights);
                additionalData.put("enhancedQuery", searchResult.enhancedQuery);
                
            } else {
                // Use AI for general conversation
                String context = buildContextFromChatType(chatType);
                aiResponse = aiTransformationService.generateConversationalResponse(userMessage, context);
                suggestions = Arrays.asList(generateSuggestions(chatType));
            }
            
            response.put("success", true);
            response.put("message", aiResponse);
            response.put("type", "enhanced");
            response.put("suggestions", suggestions);
            response.putAll(additionalData);
            
        } catch (Exception e) {
            // Fallback to mock responses if AI service fails
            String aiResponse = generateMockResponse(userMessage, chatType);
            
            response.put("success", true);
            response.put("message", aiResponse);
            response.put("type", "fallback");
            response.put("suggestions", Arrays.asList(generateSuggestions(chatType)));
            response.put("note", "AI service temporarily unavailable - using enhanced fallback");
        }
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/visual-search")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> visualSearch(@RequestBody Map<String, String> request) {
        String imageData = request.get("image");
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Use AI Transformation Service for visual search
            AITransformationService.VisualSearchResult visualResult = 
                aiTransformationService.analyzeProductImage(imageData);
            
            response.put("success", true);
            response.put("analysis", visualResult.analysis);
            response.put("products", visualResult.similarProducts);
            response.put("suggestions", visualResult.suggestions);
            response.put("message", "I analyzed your image and found some similar thrift items!");
            
        } catch (Exception e) {
            // Fallback to mock response
            response.put("success", true);
            response.put("products", generateMockProducts());
            response.put("message", "I found some similar products based on your image!");
            response.put("note", "Visual AI temporarily unavailable - showing popular items");
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/pricing-insight")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getPricingInsight(@RequestBody Map<String, String> request) {
        String productId = request.get("productId");
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Find product and generate pricing insight
            // This would typically fetch from repository
            Product mockProduct = new Product(); // Replace with actual product lookup
            AITransformationService.PricingInsight insight = 
                aiTransformationService.generatePricingInsight(mockProduct);
            
            response.put("success", true);
            response.put("thriftPrice", insight.thriftPrice);
            response.put("estimatedRetail", insight.estimatedRetail);
            response.put("savingsPercent", insight.savingsPercent);
            response.put("valueAssessment", insight.valueAssessment);
            response.put("notes", insight.notes);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Unable to generate pricing insight");
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @ResponseBody
    public SseEmitter createStreamingConnection() {
        return streamingTextService.createStreamingSession();
    }

    @PostMapping("/stream/chat")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> startStreamingChat(@RequestBody Map<String, String> request) {
        String userMessage = request.get("message");
        String sessionId = request.get("sessionId");
        String chatType = request.get("type");
        String userPreferences = request.get("preferences");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if ("search".equals(chatType) || "shopping".equals(chatType)) {
                // For search requests, get products first then stream response
                AITransformationService.AISearchResult searchResult = 
                    aiTransformationService.enhanceThriftSearch(userMessage, userPreferences);
                
                // Start streaming the search response
                streamingTextService.generateStreamingSearchResponse(sessionId, userMessage, searchResult.products);
                
                response.put("success", true);
                response.put("type", "streaming_search");
                response.put("message", "Streaming search results...");
                
            } else {
                // For general conversation, start streaming response
                String context = buildContextFromChatType(chatType);
                streamingTextService.generateStreamingResponse(sessionId, userMessage, context);
                
                response.put("success", true);
                response.put("type", "streaming_chat");
                response.put("message", "Streaming response...");
            }
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Failed to start streaming: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/stream/close")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> closeStreamingSession(@RequestBody Map<String, String> request) {
        String sessionId = request.get("sessionId");
        streamingTextService.closeSession(sessionId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Session closed");
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stream/status")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getStreamingStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("activeSessions", streamingTextService.getActiveSessionCount());
        response.put("status", "operational");
        
        return ResponseEntity.ok(response);
    }

    private String buildContextFromChatType(String chatType) {
        switch (chatType) {
            case "shopping":
                return "User is shopping for thrift items and wants product recommendations";
            case "comparison":
                return "User wants to compare thrift prices with retail prices";
            case "location":
                return "User is looking for thrift stores and locations";
            default:
                return "General thrift shopping assistance";
        }
    }
    
    private String generateMockResponse(String userMessage, String chatType) {
        String message = userMessage.toLowerCase();
        
        if (message.contains("shirt") || message.contains("clothing")) {
            return "I found some great thrift options for shirts! Here are the best deals:\n\n" +
                   "🏷️ **Vintage Band T-Shirt** - $12.99 (Originally $45)\n" +
                   "📍 Local Thrift Store - 2 miles away\n\n" +
                   "🏷️ **Designer Button-Up** - $18.50 (Originally $89)\n" +
                   "📍 Consignment Shop - 3 miles away\n\n" +
                   "💡 **Pro Tip**: These are 60-75% cheaper than buying new!";
        }
        
        if (message.contains("shoes") || message.contains("sneakers")) {
            return "Found some amazing shoe deals! Here's what I recommend:\n\n" +
                   "👟 **Nike Air Max** - $45.00 (Originally $130)\n" +
                   "📍 Premium Consignment - 1.5 miles away\n" +
                   "⭐ Condition: Excellent\n\n" +
                   "👟 **Adidas Ultraboost** - $38.99 (Originally $120)\n" +
                   "📍 Thrift Boutique - 4 miles away\n" +
                   "⭐ Condition: Very Good\n\n" +
                   "💰 **You'll save $200+ compared to retail!**";
        }
        
        if (message.contains("budget") || message.contains("cheap") || message.contains("affordable")) {
            return "Let me help you find the best budget-friendly options! 💰\n\n" +
                   "**Under $20 Deals:**\n" +
                   "• Vintage jackets: $8-$15\n" +
                   "• Designer jeans: $12-$18\n" +
                   "• Quality shoes: $10-$19\n\n" +
                   "**Under $50 Premium:**\n" +
                   "• Leather jackets: $25-$45\n" +
                   "• Brand sneakers: $30-$48\n" +
                   "• Designer bags: $20-$40\n\n" +
                   "🎯 **Average savings: 70-85% off retail prices!**";
        }
        
        if (message.contains("location") || message.contains("near") || message.contains("nearby")) {
            return "Here are the best thrift stores near you! 📍\n\n" +
                   "🏪 **Vintage Treasures** (0.8 miles)\n" +
                   "⭐ 4.8/5 stars • Best for clothing\n" +
                   "🕒 Open until 7 PM\n\n" +
                   "🏪 **Second Chance Boutique** (1.2 miles)\n" +
                   "⭐ 4.9/5 stars • Designer items\n" +
                   "🕒 Open until 6 PM\n\n" +
                   "🏪 **Thrift & Gift** (2.1 miles)\n" +
                   "⭐ 4.7/5 stars • Electronics & books\n" +
                   "🕒 Open until 8 PM";
        }
        
        // Default response
        return "I'm here to help you find the best thrift deals! 🛍️\n\n" +
               "I can help you with:\n" +
               "• Finding specific items\n" +
               "• Price comparisons with retail\n" +
               "• Location-based recommendations\n" +
               "• Quality assessments\n" +
               "• Visual search from photos\n\n" +
               "What are you looking to buy today?";
    }
    
    private String[] generateSuggestions(String chatType) {
        switch (chatType) {
            case "shopping":
                return new String[]{
                    "Show me vintage jackets under $30",
                    "Find designer shoes in my area",
                    "What's the best deal today?",
                    "Compare thrift prices to retail"
                };
            case "search":
                return new String[]{
                    "Search by uploading a photo",
                    "Find similar items",
                    "Show me brand alternatives",
                    "Filter by condition"
                };
            default:
                return new String[]{
                    "Help me find a specific item",
                    "Show me today's best deals",
                    "Compare prices with retail",
                    "Find stores near me"
                };
        }
    }
    
    private Object[] generateMockProducts() {
        return new Object[]{
            Map.of(
                "name", "Vintage Denim Jacket",
                "price", "$24.99",
                "originalPrice", "$89.00",
                "savings", "72%",
                "condition", "Excellent",
                "store", "Retro Finds",
                "distance", "1.2 miles"
            ),
            Map.of(
                "name", "Designer Leather Boots",
                "price", "$45.00", 
                "originalPrice", "$180.00",
                "savings", "75%",
                "condition", "Very Good",
                "store", "Luxury Consignment",
                "distance", "2.8 miles"
            ),
            Map.of(
                "name", "Silk Vintage Scarf",
                "price", "$12.50",
                "originalPrice", "$65.00",
                "savings", "81%",
                "condition", "Good",
                "store", "Vintage Vault",
                "distance", "0.9 miles"
            )
        };
    }
}
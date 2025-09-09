package com.projectai.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.HashMap;

@Controller
@RequestMapping("/ai")
public class AIAssistantController {

    @GetMapping("/assistant")
    public String aiAssistant(Model model) {
        return "ai/assistant";
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
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // For now, return mock responses - will integrate with actual AI services later
            String aiResponse = generateMockResponse(userMessage, chatType);
            
            response.put("success", true);
            response.put("message", aiResponse);
            response.put("type", "text");
            
            // Add suggestions for follow-up questions
            response.put("suggestions", generateSuggestions(chatType));
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Sorry, I'm having trouble processing your request. Please try again.");
        }
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/visual-search")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> visualSearch(@RequestParam("image") String imageUrl) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Mock visual search response - will integrate with actual AI vision APIs later
            response.put("success", true);
            response.put("products", generateMockProducts());
            response.put("message", "I found some similar products based on your image!");
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Unable to process image. Please try again.");
        }
        
        return ResponseEntity.ok(response);
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
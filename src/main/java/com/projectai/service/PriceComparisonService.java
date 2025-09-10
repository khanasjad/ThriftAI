package com.projectai.service;

import com.projectai.models.Product;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Random;

@Service
public class PriceComparisonService {

    private final Random random = new Random();

    public Map<String, Object> comparePrice(Product product) {
        // Mock implementation for price comparison with external sources
        // In a real implementation, this would:
        // 1. Search Amazon, eBay, Nike, Adidas APIs
        // 2. Find similar products
        // 3. Compare prices and features
        // 4. Return comprehensive comparison data
        
        Map<String, Object> comparison = new HashMap<>();
        
        // Basic product info
        comparison.put("product", Map.of(
                "name", product.getName(),
                "brand", product.getBrand(),
                "price", product.getPrice(),
                "category", product.getCategory(),
                "condition", product.getCondition() != null ? product.getCondition() : "Good"
        ));
        
        // Generate mock comparison data
        List<Map<String, Object>> externalPrices = generateMockExternalPrices(product);
        comparison.put("externalPrices", externalPrices);
        
        // Calculate savings
        double minExternalPrice = externalPrices.stream()
                .mapToDouble(p -> (Double) p.get("price"))
                .min()
                .orElse(product.getPrice());
        
        double savings = minExternalPrice - product.getPrice();
        double savingsPercentage = savings > 0 ? (savings / minExternalPrice) * 100 : 0;
        
        comparison.put("savings", Map.of(
                "amount", Math.max(0, savings),
                "percentage", Math.max(0, savingsPercentage),
                "isGoodDeal", savings > 0
        ));
        
        // Price analysis
        comparison.put("priceAnalysis", generatePriceAnalysis(product, externalPrices));
        
        // Recommendations
        comparison.put("recommendations", generateRecommendations(product, savings));
        
        return comparison;
    }

    private List<Map<String, Object>> generateMockExternalPrices(Product product) {
        List<Map<String, Object>> externalPrices = new ArrayList<>();
        
        // Mock Amazon price
        double amazonPrice = product.getPrice() * (1.2 + random.nextDouble() * 0.8); // 20-100% higher
        externalPrices.add(Map.of(
                "source", "Amazon",
                "price", Math.round(amazonPrice * 100.0) / 100.0,
                "url", "https://amazon.com/search?q=" + product.getName().replace(" ", "+"),
                "condition", "New",
                "shipping", "Free with Prime",
                "availability", "In Stock",
                "rating", 4.2 + random.nextDouble() * 0.8
        ));
        
        // Mock eBay price
        double ebayPrice = product.getPrice() * (0.8 + random.nextDouble() * 0.6); // 80-140% of thrift price
        externalPrices.add(Map.of(
                "source", "eBay",
                "price", Math.round(ebayPrice * 100.0) / 100.0,
                "url", "https://ebay.com/sch/" + product.getName().replace(" ", "+"),
                "condition", "Used",
                "shipping", "$" + (5 + random.nextInt(10)),
                "availability", "Multiple listings",
                "rating", 3.8 + random.nextDouble() * 1.0
        ));
        
        // Brand-specific comparisons
        if (product.getBrand() != null) {
            String brand = product.getBrand().toLowerCase();
            
            if (brand.contains("nike")) {
                double nikePrice = product.getPrice() * (2.0 + random.nextDouble() * 1.5); // Much higher for new
                externalPrices.add(Map.of(
                        "source", "Nike.com",
                        "price", Math.round(nikePrice * 100.0) / 100.0,
                        "url", "https://nike.com",
                        "condition", "New",
                        "shipping", "Free over $50",
                        "availability", "Limited Stock",
                        "rating", 4.6
                ));
            } else if (brand.contains("adidas")) {
                double adidasPrice = product.getPrice() * (1.8 + random.nextDouble() * 1.2);
                externalPrices.add(Map.of(
                        "source", "Adidas.com",
                        "price", Math.round(adidasPrice * 100.0) / 100.0,
                        "url", "https://adidas.com",
                        "condition", "New",
                        "shipping", "Free over $49",
                        "availability", "In Stock",
                        "rating", 4.4
                ));
            }
        }
        
        // Mock other thrift stores
        double thriftPrice = product.getPrice() * (0.9 + random.nextDouble() * 0.4); // Similar pricing
        externalPrices.add(Map.of(
                "source", "Other Thrift Stores",
                "price", Math.round(thriftPrice * 100.0) / 100.0,
                "url", "#",
                "condition", "Used",
                "shipping", "Pickup only",
                "availability", "Check locally",
                "rating", 4.0
        ));
        
        return externalPrices;
    }

    private Map<String, Object> generatePriceAnalysis(Product product, List<Map<String, Object>> externalPrices) {
        double avgExternalPrice = externalPrices.stream()
                .mapToDouble(p -> (Double) p.get("price"))
                .average()
                .orElse(product.getPrice());
        
        double priceRank = product.getPrice() / avgExternalPrice;
        String priceCategory;
        
        if (priceRank < 0.5) {
            priceCategory = "Excellent Deal";
        } else if (priceRank < 0.7) {
            priceCategory = "Great Value";
        } else if (priceRank < 0.9) {
            priceCategory = "Good Price";
        } else if (priceRank < 1.1) {
            priceCategory = "Fair Price";
        } else {
            priceCategory = "Consider Alternatives";
        }
        
        return Map.of(
                "averageMarketPrice", Math.round(avgExternalPrice * 100.0) / 100.0,
                "priceRank", Math.round(priceRank * 100.0) / 100.0,
                "priceCategory", priceCategory,
                "marketPosition", priceRank < 0.8 ? "Below Market" : 
                               priceRank < 1.2 ? "Market Rate" : "Above Market"
        );
    }

    private List<String> generateRecommendations(Product product, double savings) {
        List<String> recommendations = new ArrayList<>();
        
        if (savings > 20) {
            recommendations.add("🎉 Excellent deal! You're saving over $20 compared to market prices.");
            recommendations.add("💰 This item is significantly underpriced - grab it quickly!");
        } else if (savings > 10) {
            recommendations.add("👍 Good value! You're saving $" + String.format("%.2f", savings) + " here.");
            recommendations.add("⏰ Fair price for a thrift item - consider buying if you need it.");
        } else if (savings > 0) {
            recommendations.add("✅ Decent price, though not a huge saving.");
            recommendations.add("🔍 Check the condition carefully before purchasing.");
        } else {
            recommendations.add("⚠️ Consider shopping around - you might find better deals elsewhere.");
            recommendations.add("🛒 Check eBay or other thrift stores for similar items.");
        }
        
        // Category-specific recommendations
        String category = product.getCategory().toLowerCase();
        if (category.contains("clothing")) {
            recommendations.add("👕 For clothing, always check the size and material quality.");
        } else if (category.contains("electronics")) {
            recommendations.add("🔌 For electronics, verify that all functions work properly.");
        } else if (category.contains("shoes")) {
            recommendations.add("👟 For shoes, check the sole wear and overall condition.");
        }
        
        return recommendations;
    }

    public Map<String, Object> getMarketTrends(String category) {
        // Mock implementation for market trends
        Map<String, Object> trends = new HashMap<>();
        
        trends.put("category", category);
        trends.put("averagePrice", 45.0 + random.nextDouble() * 50);
        trends.put("priceChange", -5.0 + random.nextDouble() * 10); // -5% to +5%
        trends.put("popularBrands", List.of("Nike", "Adidas", "Levi's", "H&M"));
        trends.put("seasonalTrend", "Increasing demand");
        
        return trends;
    }
}
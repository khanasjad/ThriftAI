package com.projectai.service;

import com.projectai.models.Product;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Random;
import java.util.Arrays;

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

    public Map<String, Object> getRealTimePriceUpdate(Product product) {
        // Simulate real-time price monitoring
        Map<String, Object> update = new HashMap<>();
        
        List<Map<String, Object>> currentPrices = generateMockExternalPrices(product);
        Map<String, Object> baseComparison = comparePrice(product);
        
        // Add real-time specific data
        update.put("timestamp", System.currentTimeMillis());
        update.put("product", Map.of(
                "id", product.getId(),
                "name", product.getName(),
                "currentPrice", product.getPrice()
        ));
        
        // Simulate price alerts
        List<Map<String, String>> alerts = new ArrayList<>();
        double minExternalPrice = currentPrices.stream()
                .mapToDouble(p -> (Double) p.get("price"))
                .min()
                .orElse(product.getPrice());
        
        if (product.getPrice() < minExternalPrice * 0.8) {
            alerts.add(Map.of(
                    "type", "EXCELLENT_DEAL",
                    "message", "🎉 Incredible deal! This is 20%+ below market price!",
                    "urgency", "HIGH"
            ));
        } else if (product.getPrice() < minExternalPrice * 0.9) {
            alerts.add(Map.of(
                    "type", "GOOD_DEAL",
                    "message", "👍 Great price! Below market average.",
                    "urgency", "MEDIUM"
            ));
        }
        
        // Add price drop simulation
        if (random.nextDouble() < 0.3) { // 30% chance of price drop alert
            alerts.add(Map.of(
                    "type", "PRICE_DROP",
                    "message", "📉 Price dropped recently! Good time to buy.",
                    "urgency", "MEDIUM"
            ));
        }
        
        update.put("alerts", alerts);
        update.put("externalPrices", currentPrices);
        update.put("analysis", baseComparison.get("priceAnalysis"));
        update.put("savings", baseComparison.get("savings"));
        
        return update;
    }

    public Map<String, Object> getCompetitorAnalysis(Product product) {
        // Detailed competitor analysis
        Map<String, Object> analysis = new HashMap<>();
        
        List<Map<String, Object>> competitors = generateMockExternalPrices(product);
        
        // Calculate market position
        double[] prices = competitors.stream()
                .mapToDouble(c -> (Double) c.get("price"))
                .toArray();
        
        double avgPrice = Arrays.stream(prices).average().orElse(product.getPrice());
        double minPrice = Arrays.stream(prices).min().orElse(product.getPrice());
        double maxPrice = Arrays.stream(prices).max().orElse(product.getPrice());
        
        analysis.put("marketPosition", Map.of(
                "rank", calculatePriceRank(product.getPrice(), prices),
                "percentile", calculatePercentile(product.getPrice(), prices),
                "competitiveAdvantage", product.getPrice() < avgPrice ? "PRICE_LEADER" : "PREMIUM"
        ));
        
        analysis.put("priceSpread", Map.of(
                "minimum", minPrice,
                "maximum", maxPrice,
                "average", Math.round(avgPrice * 100.0) / 100.0,
                "range", Math.round((maxPrice - minPrice) * 100.0) / 100.0
        ));
        
        // Competitor insights
        List<Map<String, Object>> insights = new ArrayList<>();
        for (Map<String, Object> competitor : competitors) {
            String source = (String) competitor.get("source");
            double price = (Double) competitor.get("price");
            double priceDiff = price - product.getPrice();
            
            if (Math.abs(priceDiff) > 5) {
                insights.add(Map.of(
                        "competitor", source,
                        "priceDifference", Math.round(priceDiff * 100.0) / 100.0,
                        "insight", priceDiff > 0 ? 
                                "We're $" + String.format("%.2f", priceDiff) + " cheaper" :
                                "They're $" + String.format("%.2f", -priceDiff) + " cheaper"
                ));
            }
        }
        
        analysis.put("competitorInsights", insights);
        analysis.put("lastUpdated", System.currentTimeMillis());
        
        return analysis;
    }

    public Map<String, Object> getPriceHistory(Product product) {
        // Simulate price history data
        Map<String, Object> history = new HashMap<>();
        
        List<Map<String, Object>> pricePoints = new ArrayList<>();
        double basePrice = product.getPrice();
        
        // Generate 30 days of mock price history
        for (int i = 30; i >= 0; i--) {
            double variation = 0.9 + (random.nextDouble() * 0.2); // ±10% variation
            double historicalPrice = basePrice * variation;
            
            pricePoints.add(Map.of(
                    "date", System.currentTimeMillis() - (i * 24 * 60 * 60 * 1000L),
                    "price", Math.round(historicalPrice * 100.0) / 100.0,
                    "source", "ThriftAI"
            ));
        }
        
        history.put("priceHistory", pricePoints);
        
        // Calculate price trends
        double firstPrice = (Double) pricePoints.get(0).get("price");
        double lastPrice = (Double) pricePoints.get(pricePoints.size() - 1).get("price");
        double trend = ((lastPrice - firstPrice) / firstPrice) * 100;
        
        history.put("trends", Map.of(
                "thirtyDayChange", Math.round(trend * 100.0) / 100.0,
                "direction", trend > 2 ? "INCREASING" : trend < -2 ? "DECREASING" : "STABLE",
                "volatility", calculateVolatility(pricePoints)
        ));
        
        // Price predictions
        history.put("predictions", Map.of(
                "nextWeek", Math.round((lastPrice * (1 + (trend / 100) * 0.25)) * 100.0) / 100.0,
                "confidence", 0.7 + random.nextDouble() * 0.25,
                "recommendation", trend < -5 ? "BUY_NOW" : trend > 5 ? "WAIT" : "NEUTRAL"
        ));
        
        return history;
    }

    public List<Map<String, Object>> getPriceAlerts(String userId) {
        // Simulate personalized price alerts
        List<Map<String, Object>> alerts = new ArrayList<>();
        
        // Mock alerts for demo
        alerts.add(Map.of(
                "id", "alert_001",
                "type", "PRICE_DROP",
                "productName", "Nike Air Max Sneakers",
                "previousPrice", 85.00,
                "currentPrice", 65.00,
                "savings", 20.00,
                "timestamp", System.currentTimeMillis() - 3600000, // 1 hour ago
                "urgency", "HIGH"
        ));
        
        alerts.add(Map.of(
                "id", "alert_002",
                "type", "BACK_IN_STOCK",
                "productName", "Vintage Levi's 501 Jeans",
                "price", 45.99,
                "timestamp", System.currentTimeMillis() - 1800000, // 30 min ago
                "urgency", "MEDIUM"
        ));
        
        return alerts;
    }

    private int calculatePriceRank(double price, double[] allPrices) {
        long lowerCount = Arrays.stream(allPrices)
                .filter(p -> p < price)
                .count();
        return (int) lowerCount + 1;
    }

    private double calculatePercentile(double price, double[] allPrices) {
        long lowerCount = Arrays.stream(allPrices)
                .filter(p -> p < price)
                .count();
        return (double) lowerCount / allPrices.length * 100;
    }

    private String calculateVolatility(List<Map<String, Object>> pricePoints) {
        if (pricePoints.size() < 2) return "LOW";
        
        double[] prices = pricePoints.stream()
                .mapToDouble(p -> (Double) p.get("price"))
                .toArray();
        
        double mean = Arrays.stream(prices).average().orElse(0);
        double variance = Arrays.stream(prices)
                .map(p -> Math.pow(p - mean, 2))
                .average()
                .orElse(0);
        
        double stdDev = Math.sqrt(variance);
        double coefficientOfVariation = stdDev / mean;
        
        if (coefficientOfVariation > 0.15) return "HIGH";
        if (coefficientOfVariation > 0.08) return "MEDIUM";
        return "LOW";
    }

    public Map<String, Object> compareProductPrices(Product product) {
        return comparePrice(product);
    }
}
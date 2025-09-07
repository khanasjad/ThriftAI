package com.projectai;

import com.projectai.models.*;
import com.projectai.services.ThriftShopService;
import com.projectai.utils.ConsoleUtils;
import java.util.List;
import java.util.Scanner;

public class SimpleMain {
    private static ThriftShopService thriftService = new ThriftShopService();
    
    public static void main(String[] args) {
        ConsoleUtils.printHeader("Welcome to ThriftAI - Smart Thrift Shopping Assistant");
        
        System.out.println("🛍️  ThriftAI helps you find the best thrift deals using AI technology!");
        System.out.println();
        System.out.println("Features:");
        System.out.println("• 🤖 AI-powered deal scoring");
        System.out.println("• 💰 Smart price comparison");
        System.out.println("• 🎯 Personalized recommendations");
        System.out.println("• 📱 Real-time deal alerts");
        
        ConsoleUtils.printSeparator();
        
        // Demonstrate all features automatically
        demonstrateAllFeatures();
        
        ConsoleUtils.printFooter("Thank you for using ThriftAI!");
    }
    
    private static void demonstrateAllFeatures() {
        // Create sample user preferences
        UserPreferences userPrefs = createSampleUserPreferences();
        
        // 1. Show best AI deals
        showBestDeals(userPrefs);
        
        // 2. Show product search
        System.out.println("\n" + "=".repeat(60));
        searchProductsDemo();
        
        // 3. Show stores
        System.out.println("\n" + "=".repeat(60));
        showStores();
        
        // 4. Show categories and stats
        System.out.println("\n" + "=".repeat(60));
        showCategoriesAndStats();
    }
    
    private static UserPreferences createSampleUserPreferences() {
        UserPreferences prefs = new UserPreferences("user123");
        prefs.addPreferredCategory("CLOTHING", 1.2);
        prefs.addPreferredCategory("ELECTRONICS", 1.0);
        prefs.addPreferredBrand("NIKE");
        prefs.addPreferredBrand("LEVI'S");
        prefs.addPreferredSize("M");
        prefs.addPreferredSize("10");
        prefs.setMaxBudget(500.0);
        prefs.setMinDiscountThreshold(15.0);
        return prefs;
    }
    
    private static void showBestDeals(UserPreferences preferences) {
        ConsoleUtils.printSection("AI-Recommended Best Deals");
        List<Deal> bestDeals = thriftService.findBestDeals(preferences, 10);
        
        if (bestDeals.isEmpty()) {
            System.out.println("No deals found matching your preferences.");
            return;
        }
        
        System.out.printf("🎯 Found %d amazing AI-recommended deals for you:\n\n", bestDeals.size());
        
        for (int i = 0; i < bestDeals.size(); i++) {
            Deal deal = bestDeals.get(i);
            Product product = deal.getProduct();
            
            System.out.printf("🏆 %d. %s\n", i + 1, product.getName());
            System.out.printf("   💰 Price: $%.2f (was $%.2f) - %.0f%% OFF\n", 
                            product.getPrice(), product.getOriginalPrice(), product.getDiscountPercentage());
            System.out.printf("   🎯 AI Deal Score: %.1f/100 (%s)\n", deal.getDealScore(), deal.getDealQuality());
            System.out.printf("   🏪 Store: %s\n", thriftService.getStoreById(product.getStoreId()).getName());
            System.out.printf("   ✨ Why it's great: %s\n", deal.getDealReason());
            System.out.printf("   💸 Your savings: $%.2f\n", deal.getSavingsAmount());
            System.out.printf("   🏷️  Brand: %s | Condition: %s | Size: %s\n\n", 
                            product.getBrand(), product.getCondition(), product.getSize());
        }
        
        double avgScore = thriftService.getAverageDealScore(bestDeals);
        System.out.printf("📊 Average Deal Quality Score: %.1f/100\n", avgScore);
    }
    
    private static void searchProductsDemo() {
        ConsoleUtils.printSection("Product Search Demo");
        System.out.println("🔍 Searching for 'Nike' products...\n");
        
        List<Product> results = thriftService.searchProducts("Nike", null);
        
        if (results.isEmpty()) {
            System.out.println("No Nike products found.");
            return;
        }
        
        System.out.printf("Found %d Nike products:\n\n", results.size());
        
        for (int i = 0; i < results.size(); i++) {
            Product product = results.get(i);
            System.out.printf("%d. %s - $%.2f\n", i + 1, product.getName(), product.getPrice());
            System.out.printf("   Brand: %s | Category: %s | Condition: %s\n", 
                            product.getBrand(), product.getCategory(), product.getCondition());
            if (product.getOriginalPrice() > 0) {
                System.out.printf("   💰 Discount: %.0f%% off original price ($%.2f)\n", 
                                product.getDiscountPercentage(), product.getOriginalPrice());
            }
            System.out.println();
        }
    }
    
    private static void showStores() {
        ConsoleUtils.printSection("Available Thrift Stores");
        List<Store> stores = thriftService.getAllStores();
        
        for (Store store : stores) {
            System.out.printf("🏪 %s (%s)\n", store.getName(), store.getType());
            System.out.printf("   📍 Location: %s | ⭐ Rating: %.1f/5.0\n", 
                            store.getLocation(), store.getRating());
            System.out.printf("   🌐 Online Shopping: %s\n", 
                            store.isOnline() ? "Available" : "In-Store Only");
            System.out.printf("   📂 Categories: %s\n", String.join(", ", store.getCategories()));
            System.out.printf("   🏆 Quality: %s\n\n", store.getStoreQuality());
        }
    }
    
    private static void showCategoriesAndStats() {
        ConsoleUtils.printSection("ThriftAI Analytics Dashboard");
        
        var categoryStats = thriftService.getCategoryStats();
        int totalProducts = categoryStats.values().stream().mapToInt(Integer::intValue).sum();
        
        System.out.printf("📊 Platform Statistics:\n");
        System.out.printf("   • Total Products: %d\n", totalProducts);
        System.out.printf("   • Total Stores: %d\n", thriftService.getAllStores().size());
        System.out.printf("   • Product Categories: %d\n\n", categoryStats.size());
        
        System.out.println("📈 Category Breakdown:");
        categoryStats.forEach((category, count) -> {
            double percentage = (count * 100.0) / totalProducts;
            String bar = "█".repeat(Math.max(1, (int)(percentage / 5)));
            System.out.printf("   %-12s: %2d products (%.1f%%) %s\n", 
                            category, count, percentage, bar);
        });
        
        System.out.println("\n🎯 User Preferences Applied:");
        System.out.println("   • Preferred Categories: CLOTHING (1.2x boost), ELECTRONICS");
        System.out.println("   • Favorite Brands: NIKE, LEVI'S");
        System.out.println("   • Budget Limit: $500");
        System.out.println("   • Minimum Discount: 15%");
    }
}
package com.projectai;

import com.projectai.models.*;
import com.projectai.services.ThriftShopService;
import com.projectai.utils.ConsoleUtils;
import java.util.List;

public class DemoRunner {
    public static void main(String[] args) {
        ThriftShopService thriftService = new ThriftShopService();
        
        ConsoleUtils.printHeader("ThriftAI - Best AI Deals Demo");
        
        // Create sample user preferences
        UserPreferences userPrefs = new UserPreferences("demo_user");
        userPrefs.addPreferredCategory("CLOTHING", 1.2);
        userPrefs.addPreferredCategory("ELECTRONICS", 1.0);
        userPrefs.addPreferredBrand("NIKE");
        userPrefs.addPreferredBrand("LEVI'S");
        userPrefs.addPreferredSize("M");
        userPrefs.addPreferredSize("10");
        userPrefs.setMaxBudget(500.0);
        userPrefs.setMinDiscountThreshold(15.0);
        
        ConsoleUtils.printSection("AI-Recommended Best Deals");
        List<Deal> bestDeals = thriftService.findBestDeals(userPrefs, 10);
        
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
            System.out.printf("   🏷️  Brand: %s | Condition: %s\n\n", product.getBrand(), product.getCondition());
        }
        
        double avgScore = thriftService.getAverageDealScore(bestDeals);
        System.out.printf("📊 Average Deal Quality Score: %.1f/100\n", avgScore);
        
        ConsoleUtils.printSeparator();
        System.out.println("🤖 AI Analysis Complete! These deals are personalized based on your preferences:");
        System.out.println("• Preferred categories: CLOTHING, ELECTRONICS");
        System.out.println("• Favorite brands: NIKE, LEVI'S");  
        System.out.println("• Budget limit: $500");
        System.out.println("• Minimum discount: 15%");
        
        ConsoleUtils.printFooter("ThriftAI Demo Complete");
    }
}
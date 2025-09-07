package com.projectai;

import com.projectai.models.*;
import com.projectai.services.ThriftShopService;
import com.projectai.utils.ConsoleUtils;
import java.util.List;
import java.util.Scanner;

public class Main {
    private static ThriftShopService thriftService = new ThriftShopService();
    private static Scanner scanner = new Scanner(System.in);
    
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
        
        try {
            runThriftShoppingDemo();
        } catch (Exception e) {
            System.err.println("Error during demonstration: " + e.getMessage());
            e.printStackTrace();
        }
        
        ConsoleUtils.printFooter("Thank you for using ThriftAI!");
        scanner.close();
    }
    
    private static void runThriftShoppingDemo() {
        // Create sample user preferences
        UserPreferences userPrefs = createSampleUserPreferences();
        
        boolean running = true;
        while (running) {
            showMenu();
            int choice = getMenuChoice();
            
            switch (choice) {
                case 1:
                    showBestDeals(userPrefs);
                    break;
                case 2:
                    searchProducts();
                    break;
                case 3:
                    showStores();
                    break;
                case 4:
                    showCategories();
                    break;
                case 5:
                    customizePreferences(userPrefs);
                    break;
                case 6:
                    showAppStats();
                    break;
                case 0:
                    running = false;
                    break;
                default:
                    System.out.println("Invalid choice. Please try again.");
            }
            
            if (running) {
                System.out.println("\nPress Enter to continue...");
                scanner.nextLine();
            }
        }
    }
    
    private static void showMenu() {
        ConsoleUtils.printSection("Main Menu");
        System.out.println("1. 🎯 Show Best AI-Recommended Deals");
        System.out.println("2. 🔍 Search Products");
        System.out.println("3. 🏪 Browse Stores");
        System.out.println("4. 📂 View Categories");
        System.out.println("5. ⚙️  Customize Preferences");
        System.out.println("6. 📊 App Statistics");
        System.out.println("0. 👋 Exit");
        System.out.print("\nEnter your choice: ");
    }
    
    private static int getMenuChoice() {
        try {
            String input = scanner.nextLine().trim();
            if (input.isEmpty()) {
                return -1;
            }
            return Integer.parseInt(input);
        } catch (NumberFormatException e) {
            return -1;
        } catch (Exception e) {
            System.err.println("Input error: " + e.getMessage());
            return -1;
        }
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
        
        System.out.printf("Found %d amazing deals for you:\n\n", bestDeals.size());
        
        for (int i = 0; i < bestDeals.size(); i++) {
            Deal deal = bestDeals.get(i);
            Product product = deal.getProduct();
            
            System.out.printf("%d. %s\n", i + 1, product.getName());
            System.out.printf("   💰 Price: $%.2f (was $%.2f) - %.0f%% OFF\n", 
                            product.getPrice(), product.getOriginalPrice(), product.getDiscountPercentage());
            System.out.printf("   🏆 Deal Score: %.1f/100 (%s)\n", deal.getDealScore(), deal.getDealQuality());
            System.out.printf("   🏪 Store: %s\n", thriftService.getStoreById(product.getStoreId()).getName());
            System.out.printf("   📝 Why it's great: %s\n", deal.getDealReason());
            System.out.printf("   💸 You save: $%.2f\n\n", deal.getSavingsAmount());
        }
        
        double avgScore = thriftService.getAverageDealScore(bestDeals);
        System.out.printf("Average Deal Quality: %.1f/100\n", avgScore);
    }
    
    private static void searchProducts() {
        ConsoleUtils.printSection("Product Search");
        System.out.print("Enter search term (or press Enter for all): ");
        String query = scanner.nextLine().trim();
        if (query.isEmpty()) query = null;
        
        List<Product> results = thriftService.searchProducts(query, null);
        
        if (results.isEmpty()) {
            System.out.println("No products found matching your search.");
            return;
        }
        
        System.out.printf("\nFound %d products:\n\n", results.size());
        
        for (int i = 0; i < Math.min(results.size(), 10); i++) {
            Product product = results.get(i);
            System.out.printf("%d. %s - $%.2f\n", i + 1, product.getName(), product.getPrice());
            System.out.printf("   Brand: %s | Category: %s | Condition: %s\n", 
                            product.getBrand(), product.getCategory(), product.getCondition());
            if (product.getOriginalPrice() > 0) {
                System.out.printf("   Discount: %.0f%% off original price\n", product.getDiscountPercentage());
            }
            System.out.println();
        }
    }
    
    private static void showStores() {
        ConsoleUtils.printSection("Available Stores");
        List<Store> stores = thriftService.getAllStores();
        
        for (Store store : stores) {
            System.out.printf("🏪 %s (%s)\n", store.getName(), store.getType());
            System.out.printf("   📍 Location: %s | ⭐ Rating: %.1f/5\n", 
                            store.getLocation(), store.getRating());
            System.out.printf("   🌐 Online: %s | 📂 Categories: %s\n", 
                            store.isOnline() ? "Yes" : "No", store.getCategories());
            System.out.println();
        }
    }
    
    private static void showCategories() {
        ConsoleUtils.printSection("Product Categories");
        var categoryStats = thriftService.getCategoryStats();
        
        for (var entry : categoryStats.entrySet()) {
            System.out.printf("📂 %s: %d products\n", entry.getKey(), entry.getValue());
        }
    }
    
    private static void customizePreferences(UserPreferences preferences) {
        ConsoleUtils.printSection("Current Preferences");
        System.out.println(preferences);
        System.out.println("\n(Preference customization feature coming soon!)");
    }
    
    private static void showAppStats() {
        ConsoleUtils.printSection("ThriftAI Statistics");
        var categoryStats = thriftService.getCategoryStats();
        int totalProducts = categoryStats.values().stream().mapToInt(Integer::intValue).sum();
        
        System.out.printf("📊 Total Products: %d\n", totalProducts);
        System.out.printf("🏪 Total Stores: %d\n", thriftService.getAllStores().size());
        System.out.printf("📂 Categories: %d\n", categoryStats.size());
        System.out.println("\n📈 Category Distribution:");
        categoryStats.forEach((category, count) -> 
            System.out.printf("   %s: %d (%.1f%%)\n", category, count, (count * 100.0) / totalProducts));
    }
}
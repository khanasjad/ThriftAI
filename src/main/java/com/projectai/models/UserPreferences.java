package com.projectai.models;

import java.util.*;

public class UserPreferences {
    private String userId;
    private List<String> preferredCategories;
    private List<String> preferredBrands;
    private List<String> preferredSizes;
    private double maxBudget;
    private double minDiscountThreshold;
    private List<String> preferredStores;
    private Map<String, Double> categoryWeights;
    private boolean notificationsEnabled;
    private String preferredCondition;
    
    public UserPreferences(String userId) {
        this.userId = userId;
        this.preferredCategories = new ArrayList<>();
        this.preferredBrands = new ArrayList<>();
        this.preferredSizes = new ArrayList<>();
        this.preferredStores = new ArrayList<>();
        this.categoryWeights = new HashMap<>();
        this.maxBudget = Double.MAX_VALUE;
        this.minDiscountThreshold = 0.0;
        this.notificationsEnabled = true;
        this.preferredCondition = "ANY";
    }
    
    // Getters
    public String getUserId() { return userId; }
    public List<String> getPreferredCategories() { return preferredCategories; }
    public List<String> getPreferredBrands() { return preferredBrands; }
    public List<String> getPreferredSizes() { return preferredSizes; }
    public double getMaxBudget() { return maxBudget; }
    public double getMinDiscountThreshold() { return minDiscountThreshold; }
    public List<String> getPreferredStores() { return preferredStores; }
    public Map<String, Double> getCategoryWeights() { return categoryWeights; }
    public boolean isNotificationsEnabled() { return notificationsEnabled; }
    public String getPreferredCondition() { return preferredCondition; }
    
    // Setters
    public void setMaxBudget(double maxBudget) { this.maxBudget = maxBudget; }
    public void setMinDiscountThreshold(double minDiscountThreshold) { this.minDiscountThreshold = minDiscountThreshold; }
    public void setNotificationsEnabled(boolean notificationsEnabled) { this.notificationsEnabled = notificationsEnabled; }
    public void setPreferredCondition(String preferredCondition) { this.preferredCondition = preferredCondition; }
    
    // Business methods
    public void addPreferredCategory(String category, double weight) {
        if (!preferredCategories.contains(category)) {
            preferredCategories.add(category);
        }
        categoryWeights.put(category, weight);
    }
    
    public void addPreferredBrand(String brand) {
        if (!preferredBrands.contains(brand)) {
            preferredBrands.add(brand);
        }
    }
    
    public void addPreferredSize(String size) {
        if (!preferredSizes.contains(size)) {
            preferredSizes.add(size);
        }
    }
    
    public void addPreferredStore(String storeId) {
        if (!preferredStores.contains(storeId)) {
            preferredStores.add(storeId);
        }
    }
    
    public double getCategoryWeight(String category) {
        return categoryWeights.getOrDefault(category, 1.0);
    }
    
    public boolean matchesPreferences(Product product) {
        // Check budget
        if (product.getPrice() > maxBudget) return false;
        
        // Check discount threshold
        if (product.getDiscountPercentage() < minDiscountThreshold) return false;
        
        // Check category preference
        if (!preferredCategories.isEmpty() && !preferredCategories.contains(product.getCategory())) {
            return false;
        }
        
        // Check brand preference
        if (!preferredBrands.isEmpty() && product.getBrand() != null && 
            !preferredBrands.contains(product.getBrand())) {
            return false;
        }
        
        // Check size preference
        if (!preferredSizes.isEmpty() && product.getSize() != null && 
            !preferredSizes.contains(product.getSize())) {
            return false;
        }
        
        return true;
    }
    
    @Override
    public String toString() {
        return String.format("UserPreferences{userId='%s', categories=%d, brands=%d, maxBudget=%.2f, minDiscount=%.1f%%}", 
                           userId, preferredCategories.size(), preferredBrands.size(), maxBudget, minDiscountThreshold);
    }
}
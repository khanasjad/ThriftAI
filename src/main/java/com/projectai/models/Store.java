package com.projectai.models;

import java.util.ArrayList;
import java.util.List;

public class Store {
    private String id;
    private String name;
    private String type;
    private String location;
    private double rating;
    private String website;
    private boolean isOnline;
    private List<String> categories;
    private double averageDiscount;
    private int totalProducts;
    
    public Store(String id, String name, String type) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.categories = new ArrayList<>();
        this.rating = 0.0;
        this.totalProducts = 0;
    }
    
    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getType() { return type; }
    public String getLocation() { return location; }
    public double getRating() { return rating; }
    public String getWebsite() { return website; }
    public boolean isOnline() { return isOnline; }
    public List<String> getCategories() { return categories; }
    public double getAverageDiscount() { return averageDiscount; }
    public int getTotalProducts() { return totalProducts; }
    
    // Setters
    public void setLocation(String location) { this.location = location; }
    public void setRating(double rating) { this.rating = rating; }
    public void setWebsite(String website) { this.website = website; }
    public void setOnline(boolean online) { this.isOnline = online; }
    public void setAverageDiscount(double averageDiscount) { this.averageDiscount = averageDiscount; }
    public void setTotalProducts(int totalProducts) { this.totalProducts = totalProducts; }
    
    // Business methods
    public void addCategory(String category) {
        if (!categories.contains(category)) {
            categories.add(category);
        }
    }
    
    public boolean hasCategory(String category) {
        return categories.contains(category);
    }
    
    public String getStoreQuality() {
        if (rating >= 4.5) return "PREMIUM";
        if (rating >= 4.0) return "EXCELLENT";
        if (rating >= 3.5) return "GOOD";
        if (rating >= 3.0) return "AVERAGE";
        return "NEEDS_IMPROVEMENT";
    }
    
    @Override
    public String toString() {
        return String.format("Store{id='%s', name='%s', type='%s', rating=%.1f, products=%d, online=%s}", 
                           id, name, type, rating, totalProducts, isOnline);
    }
}
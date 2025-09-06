package com.projectai.models;

import java.util.Objects;

public class Product {
    private String id;
    private String name;
    private String category;
    private String brand;
    private double price;
    private double originalPrice;
    private String condition;
    private String description;
    private String imageUrl;
    private String storeId;
    private String size;
    private boolean isAvailable;
    
    public Product(String id, String name, String category, double price) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.price = price;
        this.isAvailable = true;
    }
    
    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getBrand() { return brand; }
    public double getPrice() { return price; }
    public double getOriginalPrice() { return originalPrice; }
    public String getCondition() { return condition; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
    public String getStoreId() { return storeId; }
    public String getSize() { return size; }
    public boolean isAvailable() { return isAvailable; }
    
    // Setters
    public void setBrand(String brand) { this.brand = brand; }
    public void setOriginalPrice(double originalPrice) { this.originalPrice = originalPrice; }
    public void setCondition(String condition) { this.condition = condition; }
    public void setDescription(String description) { this.description = description; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setStoreId(String storeId) { this.storeId = storeId; }
    public void setSize(String size) { this.size = size; }
    public void setAvailable(boolean available) { this.isAvailable = available; }
    
    // Calculate discount percentage
    public double getDiscountPercentage() {
        if (originalPrice > 0) {
            return ((originalPrice - price) / originalPrice) * 100;
        }
        return 0.0;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Product product = (Product) o;
        return Objects.equals(id, product.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return String.format("Product{id='%s', name='%s', category='%s', price=%.2f, brand='%s'}", 
                           id, name, category, price, brand);
    }
}
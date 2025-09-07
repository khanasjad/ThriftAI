package com.projectai.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @NotBlank(message = "Product name is required")
    @Size(min = 2, max = 100, message = "Product name must be between 2 and 100 characters")
    @Column(nullable = false)
    private String name;
    
    @NotBlank(message = "Category is required")
    @Column(nullable = false)
    private String category;
    
    private String brand;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @Column(nullable = false)
    private double price;
    
    @DecimalMin(value = "0.0", message = "Original price must be 0 or greater")
    private double originalPrice;
    
    private String condition;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String imageUrl;
    
    @Column(name = "store_id")
    private String storeId;
    
    private String size;
    
    @Column(name = "is_available", nullable = false)
    private boolean isAvailable;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
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
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    
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
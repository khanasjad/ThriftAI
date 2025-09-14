package com.projectai.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "cart_items")
public class CartItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @NotNull
    @Column(name = "session_id")
    private String sessionId; // For guest shopping
    
    @Column(name = "buyer_id")
    private String buyerId; // For logged-in users
    
    @NotNull
    @Column(name = "product_id")
    private String productId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;
    
    @NotNull
    @Min(1)
    private Integer quantity = 1;
    
    @Column(name = "price_at_time")
    private Double priceAtTime; // Store price when added to cart
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public CartItem() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public CartItem(String sessionId, String productId, Integer quantity) {
        this();
        this.sessionId = sessionId;
        this.productId = productId;
        this.quantity = quantity;
    }
    
    public CartItem(String sessionId, String buyerId, String productId, Integer quantity, Double priceAtTime) {
        this(sessionId, productId, quantity);
        this.buyerId = buyerId;
        this.priceAtTime = priceAtTime;
    }
    
    // Update timestamp on any change
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Calculated properties
    public Double getSubtotal() {
        if (priceAtTime != null) {
            return priceAtTime * quantity;
        }
        if (product != null) {
            return product.getPrice() * quantity;
        }
        return 0.0;
    }
    
    public Double getCurrentPrice() {
        return product != null ? product.getPrice() : priceAtTime;
    }
    
    public boolean isPriceChanged() {
        return product != null && priceAtTime != null && 
               !priceAtTime.equals(product.getPrice());
    }
    
    public boolean isProductAvailable() {
        return product != null && product.isAvailable();
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    
    public String getBuyerId() {
        return buyerId;
    }
    
    public void setBuyerId(String buyerId) {
        this.buyerId = buyerId;
    }
    
    public String getProductId() {
        return productId;
    }
    
    public void setProductId(String productId) {
        this.productId = productId;
    }
    
    public Product getProduct() {
        return product;
    }
    
    public void setProduct(Product product) {
        this.product = product;
    }
    
    public Integer getQuantity() {
        return quantity;
    }
    
    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
        this.updatedAt = LocalDateTime.now();
    }
    
    public Double getPriceAtTime() {
        return priceAtTime;
    }
    
    public void setPriceAtTime(Double priceAtTime) {
        this.priceAtTime = priceAtTime;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @Override
    public String toString() {
        return "CartItem{" +
                "id='" + id + '\'' +
                ", sessionId='" + sessionId + '\'' +
                ", buyerId='" + buyerId + '\'' +
                ", productId='" + productId + '\'' +
                ", quantity=" + quantity +
                ", priceAtTime=" + priceAtTime +
                ", createdAt=" + createdAt +
                '}';
    }
}
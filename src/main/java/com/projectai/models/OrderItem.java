package com.projectai.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.DecimalMin;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_items")
public class OrderItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @NotNull
    @Column(name = "product_id")
    private String productId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;
    
    @NotNull
    @Min(1)
    private Integer quantity;
    
    @NotNull
    @DecimalMin("0.0")
    @Column(name = "unit_price")
    private Double unitPrice;
    
    @NotNull
    @DecimalMin("0.0")
    @Column(name = "total_price")
    private Double totalPrice;
    
    @Column(name = "seller_id")
    private String sellerId;
    
    @Column(name = "product_name")
    private String productName;
    
    @Column(name = "product_brand")
    private String productBrand;
    
    @Column(name = "product_category")
    private String productCategory;
    
    @Column(name = "product_condition")
    private String productCondition;
    
    @Column(name = "product_size")
    private String productSize;
    
    @Column(name = "product_image_url")
    private String productImageUrl;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public OrderItem() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public OrderItem(Order order, String productId, Integer quantity, Double unitPrice) {
        this();
        this.order = order;
        this.productId = productId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = quantity * unitPrice;
    }
    
    public OrderItem(Order order, Product product, Integer quantity) {
        this(order, product.getId(), quantity, product.getPrice());
        this.productName = product.getName();
        this.productBrand = product.getBrand();
        this.productCategory = product.getCategory();
        this.productCondition = product.getCondition();
        this.productSize = product.getSize();
        this.productImageUrl = product.getImageUrl();
        // this.sellerId = product.getSellerId(); // Product doesn't have sellerId method
    }
    
    // Update timestamp on any change
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Helper methods
    public void updateTotalPrice() {
        if (quantity != null && unitPrice != null) {
            this.totalPrice = quantity * unitPrice;
        }
    }
    
    public Double getSavings() {
        if (product != null && product.getOriginalPrice() > 0 && unitPrice != null) {
            double originalPrice = product.getOriginalPrice();
            double savingsPerItem = originalPrice - unitPrice;
            return savingsPerItem > 0 ? savingsPerItem * quantity : 0.0;
        }
        return 0.0;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public Order getOrder() {
        return order;
    }
    
    public void setOrder(Order order) {
        this.order = order;
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
        updateTotalPrice();
        this.updatedAt = LocalDateTime.now();
    }
    
    public Double getUnitPrice() {
        return unitPrice;
    }
    
    public void setUnitPrice(Double unitPrice) {
        this.unitPrice = unitPrice;
        updateTotalPrice();
        this.updatedAt = LocalDateTime.now();
    }
    
    public Double getTotalPrice() {
        return totalPrice;
    }
    
    public void setTotalPrice(Double totalPrice) {
        this.totalPrice = totalPrice;
    }
    
    public String getSellerId() {
        return sellerId;
    }
    
    public void setSellerId(String sellerId) {
        this.sellerId = sellerId;
    }
    
    public String getProductName() {
        return productName;
    }
    
    public void setProductName(String productName) {
        this.productName = productName;
    }
    
    public String getProductBrand() {
        return productBrand;
    }
    
    public void setProductBrand(String productBrand) {
        this.productBrand = productBrand;
    }
    
    public String getProductCategory() {
        return productCategory;
    }
    
    public void setProductCategory(String productCategory) {
        this.productCategory = productCategory;
    }
    
    public String getProductCondition() {
        return productCondition;
    }
    
    public void setProductCondition(String productCondition) {
        this.productCondition = productCondition;
    }
    
    public String getProductSize() {
        return productSize;
    }
    
    public void setProductSize(String productSize) {
        this.productSize = productSize;
    }
    
    public String getProductImageUrl() {
        return productImageUrl;
    }
    
    public void setProductImageUrl(String productImageUrl) {
        this.productImageUrl = productImageUrl;
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
}
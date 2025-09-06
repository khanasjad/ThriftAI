package com.projectai.models;

import java.time.LocalDateTime;

public class Deal {
    private String id;
    private Product product;
    private double dealScore;
    private String dealType;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean isActive;
    private String dealReason;
    private double savingsAmount;
    
    public Deal(String id, Product product, double dealScore, String dealType) {
        this.id = id;
        this.product = product;
        this.dealScore = dealScore;
        this.dealType = dealType;
        this.createdAt = LocalDateTime.now();
        this.isActive = true;
        this.savingsAmount = calculateSavings();
    }
    
    // Getters
    public String getId() { return id; }
    public Product getProduct() { return product; }
    public double getDealScore() { return dealScore; }
    public String getDealType() { return dealType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public boolean isActive() { return isActive; }
    public String getDealReason() { return dealReason; }
    public double getSavingsAmount() { return savingsAmount; }
    
    // Setters
    public void setDealScore(double dealScore) { this.dealScore = dealScore; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public void setActive(boolean active) { this.isActive = active; }
    public void setDealReason(String dealReason) { this.dealReason = dealReason; }
    
    // Business logic methods
    private double calculateSavings() {
        if (product.getOriginalPrice() > 0) {
            return product.getOriginalPrice() - product.getPrice();
        }
        return 0.0;
    }
    
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
    
    public String getDealQuality() {
        if (dealScore >= 90) return "EXCEPTIONAL";
        if (dealScore >= 80) return "EXCELLENT";
        if (dealScore >= 70) return "VERY_GOOD";
        if (dealScore >= 60) return "GOOD";
        if (dealScore >= 50) return "FAIR";
        return "POOR";
    }
    
    @Override
    public String toString() {
        return String.format("Deal{id='%s', product='%s', score=%.1f, type='%s', quality='%s', savings=$%.2f}", 
                           id, product.getName(), dealScore, dealType, getDealQuality(), savingsAmount);
    }
}
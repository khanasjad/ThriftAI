package com.projectai.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "affiliate_products")
public class AffiliateProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank(message = "Product name is required")
    @Size(max = 200, message = "Product name must be less than 200 characters")
    @Column(nullable = false, length = 200)
    private String name;

    @NotBlank(message = "SKU is required")
    @Column(nullable = false, unique = true, length = 100)
    private String sku;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Column(precision = 5, scale = 2)
    private BigDecimal discountPercentage;

    @NotBlank(message = "Brand is required")
    @Size(max = 100, message = "Brand must be less than 100 characters")
    @Column(nullable = false, length = 100)
    private String brand;

    @NotBlank(message = "Category is required")
    @Size(max = 100, message = "Category must be less than 100 characters")
    @Column(nullable = false, length = 100)
    private String category;

    @Size(max = 50, message = "Subcategory must be less than 50 characters")
    @Column(length = 50)
    private String subcategory;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String imageUrl;

    @Column(length = 500)
    private String affiliateUrl;

    @NotBlank(message = "Affiliate source is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AffiliateSource affiliateSource;

    @Column(length = 100)
    private String affiliateId;

    @ElementCollection
    @CollectionTable(name = "affiliate_product_sizes", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "size")
    private List<String> availableSizes;

    @ElementCollection
    @CollectionTable(name = "affiliate_product_colors", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "color")
    private List<String> availableColors;

    @ElementCollection
    @CollectionTable(name = "affiliate_product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url", length = 500)
    private List<String> additionalImages;

    @ElementCollection
    @CollectionTable(name = "affiliate_product_tags", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "tag")
    private List<String> tags;

    // Product specifications as JSON
    @ElementCollection
    @CollectionTable(name = "affiliate_product_specifications", joinColumns = @JoinColumn(name = "product_id"))
    @MapKeyColumn(name = "spec_name")
    @Column(name = "spec_value")
    private Map<String, String> specifications;

    // Rating and reviews
    @DecimalMin(value = "0.0", message = "Rating must be between 0 and 5")
    @DecimalMax(value = "5.0", message = "Rating must be between 0 and 5")
    @Column(precision = 3, scale = 2)
    private BigDecimal rating;

    @Min(value = 0, message = "Review count cannot be negative")
    private Integer reviewCount = 0;

    // Availability and stock
    @Column(nullable = false)
    private boolean inStock = true;

    private Integer stockQuantity;

    // SEO and marketing
    @Size(max = 200, message = "SEO title must be less than 200 characters")
    private String seoTitle;

    @Size(max = 500, message = "SEO description must be less than 500 characters")
    private String seoDescription;

    @ElementCollection
    @CollectionTable(name = "affiliate_product_keywords", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "keyword")
    private List<String> keywords;

    // Gender and demographic targeting
    @Enumerated(EnumType.STRING)
    private Gender targetGender;

    @Size(max = 50, message = "Age group must be less than 50 characters")
    private String ageGroup;

    // Seasonal and trend data
    @Enumerated(EnumType.STRING)
    private Season season;

    @Column(columnDefinition = "TEXT")
    private String trendingKeywords;

    // Affiliate commission data
    @Column(precision = 5, scale = 2)
    private BigDecimal commissionRate;

    @Column(precision = 10, scale = 2)
    private BigDecimal commissionAmount;

    // Data freshness and synchronization
    @Column(nullable = false)
    private LocalDateTime lastSyncAt;

    @Column(nullable = false)
    private LocalDateTime dataExpiresAt;

    @Column(nullable = false)
    private boolean isActive = true;

    @Column(nullable = false)
    private boolean isFeatured = false;

    // Timestamps
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Comparison and analytics data (populated by Claude AI)
    @Transient
    @JsonIgnore
    private Map<String, Object> comparisonMetrics;

    @Transient
    @JsonIgnore
    private List<String> comparisonAdvantages;

    @Transient
    @JsonIgnore
    private List<String> comparisonDisadvantages;

    @Transient
    @JsonIgnore
    private Double comparisonScore;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (lastSyncAt == null) {
            lastSyncAt = LocalDateTime.now();
        }
        if (dataExpiresAt == null) {
            dataExpiresAt = LocalDateTime.now().plusHours(24); // Default 24-hour expiry
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors
    public AffiliateProduct() {}

    public AffiliateProduct(String name, String sku, BigDecimal price, String brand,
                           String category, AffiliateSource affiliateSource) {
        this.name = name;
        this.sku = sku;
        this.price = price;
        this.brand = brand;
        this.category = category;
        this.affiliateSource = affiliateSource;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public BigDecimal getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(BigDecimal originalPrice) { this.originalPrice = originalPrice; }

    public BigDecimal getDiscountPercentage() { return discountPercentage; }
    public void setDiscountPercentage(BigDecimal discountPercentage) { this.discountPercentage = discountPercentage; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSubcategory() { return subcategory; }
    public void setSubcategory(String subcategory) { this.subcategory = subcategory; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getAffiliateUrl() { return affiliateUrl; }
    public void setAffiliateUrl(String affiliateUrl) { this.affiliateUrl = affiliateUrl; }

    public AffiliateSource getAffiliateSource() { return affiliateSource; }
    public void setAffiliateSource(AffiliateSource affiliateSource) { this.affiliateSource = affiliateSource; }

    public String getAffiliateId() { return affiliateId; }
    public void setAffiliateId(String affiliateId) { this.affiliateId = affiliateId; }

    public List<String> getAvailableSizes() { return availableSizes; }
    public void setAvailableSizes(List<String> availableSizes) { this.availableSizes = availableSizes; }

    public List<String> getAvailableColors() { return availableColors; }
    public void setAvailableColors(List<String> availableColors) { this.availableColors = availableColors; }

    public List<String> getAdditionalImages() { return additionalImages; }
    public void setAdditionalImages(List<String> additionalImages) { this.additionalImages = additionalImages; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public Map<String, String> getSpecifications() { return specifications; }
    public void setSpecifications(Map<String, String> specifications) { this.specifications = specifications; }

    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }

    public Integer getReviewCount() { return reviewCount; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }

    public boolean isInStock() { return inStock; }
    public void setInStock(boolean inStock) { this.inStock = inStock; }

    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }

    public String getSeoTitle() { return seoTitle; }
    public void setSeoTitle(String seoTitle) { this.seoTitle = seoTitle; }

    public String getSeoDescription() { return seoDescription; }
    public void setSeoDescription(String seoDescription) { this.seoDescription = seoDescription; }

    public List<String> getKeywords() { return keywords; }
    public void setKeywords(List<String> keywords) { this.keywords = keywords; }

    public Gender getTargetGender() { return targetGender; }
    public void setTargetGender(Gender targetGender) { this.targetGender = targetGender; }

    public String getAgeGroup() { return ageGroup; }
    public void setAgeGroup(String ageGroup) { this.ageGroup = ageGroup; }

    public Season getSeason() { return season; }
    public void setSeason(Season season) { this.season = season; }

    public String getTrendingKeywords() { return trendingKeywords; }
    public void setTrendingKeywords(String trendingKeywords) { this.trendingKeywords = trendingKeywords; }

    public BigDecimal getCommissionRate() { return commissionRate; }
    public void setCommissionRate(BigDecimal commissionRate) { this.commissionRate = commissionRate; }

    public BigDecimal getCommissionAmount() { return commissionAmount; }
    public void setCommissionAmount(BigDecimal commissionAmount) { this.commissionAmount = commissionAmount; }

    public LocalDateTime getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(LocalDateTime lastSyncAt) { this.lastSyncAt = lastSyncAt; }

    public LocalDateTime getDataExpiresAt() { return dataExpiresAt; }
    public void setDataExpiresAt(LocalDateTime dataExpiresAt) { this.dataExpiresAt = dataExpiresAt; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public boolean isFeatured() { return isFeatured; }
    public void setFeatured(boolean featured) { isFeatured = featured; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Comparison data getters/setters
    public Map<String, Object> getComparisonMetrics() { return comparisonMetrics; }
    public void setComparisonMetrics(Map<String, Object> comparisonMetrics) { this.comparisonMetrics = comparisonMetrics; }

    public List<String> getComparisonAdvantages() { return comparisonAdvantages; }
    public void setComparisonAdvantages(List<String> comparisonAdvantages) { this.comparisonAdvantages = comparisonAdvantages; }

    public List<String> getComparisonDisadvantages() { return comparisonDisadvantages; }
    public void setComparisonDisadvantages(List<String> comparisonDisadvantages) { this.comparisonDisadvantages = comparisonDisadvantages; }

    public Double getComparisonScore() { return comparisonScore; }
    public void setComparisonScore(Double comparisonScore) { this.comparisonScore = comparisonScore; }

    // Utility methods
    public boolean isDataStale() {
        return dataExpiresAt != null && LocalDateTime.now().isAfter(dataExpiresAt);
    }

    public boolean hasDiscount() {
        return originalPrice != null && originalPrice.compareTo(price) > 0;
    }

    public BigDecimal calculateDiscount() {
        if (!hasDiscount()) return BigDecimal.ZERO;
        return originalPrice.subtract(price);
    }

    // Enums
    public enum AffiliateSource {
        AMAZON, EBAY, ZALANDO, ASOS, H_AND_M, ZARA, UNIQLO,
        NORDSTROM, MACY, TARGET, WALMART, SHOPIFY,
        COMMISSION_JUNCTION, SHAREASALE, IMPACT, RAKUTEN, OTHER
    }

    public enum Gender {
        MALE, FEMALE, UNISEX, KIDS_BOYS, KIDS_GIRLS, KIDS_UNISEX
    }

    public enum Season {
        SPRING, SUMMER, FALL, WINTER, ALL_SEASON
    }
}
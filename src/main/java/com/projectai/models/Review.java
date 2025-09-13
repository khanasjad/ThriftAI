package com.projectai.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "reviews")
public class Review {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private Buyer buyer;
    
    @NotNull
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot exceed 5")
    @Column(nullable = false)
    private Integer rating;
    
    @NotBlank(message = "Review title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    @Column(nullable = false)
    private String title;
    
    @Size(max = 2000, message = "Review content cannot exceed 2000 characters")
    @Column(columnDefinition = "TEXT")
    private String content;
    
    // Individual ratings for different aspects
    @Min(1) @Max(5)
    private Integer conditionRating;
    
    @Min(1) @Max(5)
    private Integer valueRating;
    
    @Min(1) @Max(5)
    private Integer sellerRating;
    
    @Min(1) @Max(5)
    private Integer shippingRating;
    
    // Review metadata
    @Column(name = "is_verified_purchase")
    private boolean isVerifiedPurchase;
    
    @Column(name = "helpful_votes")
    private Integer helpfulVotes = 0;
    
    @Column(name = "unhelpful_votes")
    private Integer unhelpfulVotes = 0;
    
    // Photos attached to review
    @ElementCollection
    @CollectionTable(name = "review_photos", joinColumns = @JoinColumn(name = "review_id"))
    @Column(name = "photo_url")
    private List<String> photoUrls;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Status and moderation
    @Enumerated(EnumType.STRING)
    private ReviewStatus status = ReviewStatus.PENDING;
    
    @Column(name = "moderation_notes")
    private String moderationNotes;
    
    public enum ReviewStatus {
        PENDING, APPROVED, REJECTED, FLAGGED
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public Review() {}
    
    public Review(Product product, Buyer buyer, Integer rating, String title, String content) {
        this.product = product;
        this.buyer = buyer;
        this.rating = rating;
        this.title = title;
        this.content = content;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    
    public Buyer getBuyer() { return buyer; }
    public void setBuyer(Buyer buyer) { this.buyer = buyer; }
    
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public Integer getConditionRating() { return conditionRating; }
    public void setConditionRating(Integer conditionRating) { this.conditionRating = conditionRating; }
    
    public Integer getValueRating() { return valueRating; }
    public void setValueRating(Integer valueRating) { this.valueRating = valueRating; }
    
    public Integer getSellerRating() { return sellerRating; }
    public void setSellerRating(Integer sellerRating) { this.sellerRating = sellerRating; }
    
    public Integer getShippingRating() { return shippingRating; }
    public void setShippingRating(Integer shippingRating) { this.shippingRating = shippingRating; }
    
    public boolean isVerifiedPurchase() { return isVerifiedPurchase; }
    public void setVerifiedPurchase(boolean verifiedPurchase) { isVerifiedPurchase = verifiedPurchase; }
    
    public Integer getHelpfulVotes() { return helpfulVotes; }
    public void setHelpfulVotes(Integer helpfulVotes) { this.helpfulVotes = helpfulVotes; }
    
    public Integer getUnhelpfulVotes() { return unhelpfulVotes; }
    public void setUnhelpfulVotes(Integer unhelpfulVotes) { this.unhelpfulVotes = unhelpfulVotes; }
    
    public List<String> getPhotoUrls() { return photoUrls; }
    public void setPhotoUrls(List<String> photoUrls) { this.photoUrls = photoUrls; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    
    public ReviewStatus getStatus() { return status; }
    public void setStatus(ReviewStatus status) { this.status = status; }
    
    public String getModerationNotes() { return moderationNotes; }
    public void setModerationNotes(String moderationNotes) { this.moderationNotes = moderationNotes; }
    
    // Utility methods
    public double getOverallRating() {
        if (conditionRating != null && valueRating != null && sellerRating != null) {
            return (conditionRating + valueRating + sellerRating) / 3.0;
        }
        return rating;
    }
    
    public int getHelpfulnessScore() {
        return helpfulVotes - unhelpfulVotes;
    }
    
    public double getHelpfulnessRatio() {
        int totalVotes = helpfulVotes + unhelpfulVotes;
        if (totalVotes == 0) return 0.0;
        return (double) helpfulVotes / totalVotes;
    }
    
    public boolean hasPhotos() {
        return photoUrls != null && !photoUrls.isEmpty();
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Review review = (Review) o;
        return Objects.equals(id, review.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return String.format("Review{id='%s', rating=%d, title='%s', buyer='%s'}", 
                           id, rating, title, buyer != null ? buyer.getFirstName() + " " + buyer.getLastName() : "Unknown");
    }
}
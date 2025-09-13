package com.projectai.repository;

import com.projectai.models.Review;
import com.projectai.models.Product;
import com.projectai.models.Buyer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    
    // Find reviews by product
    List<Review> findByProductAndStatusOrderByCreatedAtDesc(Product product, Review.ReviewStatus status);
    
    List<Review> findByProductOrderByCreatedAtDesc(Product product);
    
    List<Review> findByProductOrderByHelpfulVotesDesc(Product product);
    
    // Find reviews by buyer
    List<Review> findByBuyerOrderByCreatedAtDesc(Buyer buyer);
    
    // Find verified purchase reviews
    List<Review> findByProductAndIsVerifiedPurchaseTrueAndStatusOrderByCreatedAtDesc(
            Product product, Review.ReviewStatus status);
    
    // Rating-based queries
    List<Review> findByProductAndRatingOrderByCreatedAtDesc(Product product, Integer rating);
    
    List<Review> findByProductAndRatingGreaterThanEqualOrderByCreatedAtDesc(Product product, Integer minRating);
    
    // Status-based queries
    List<Review> findByStatus(Review.ReviewStatus status);
    
    List<Review> findByStatusOrderByCreatedAtAsc(Review.ReviewStatus status);
    
    // Check if user has already reviewed a product
    Optional<Review> findByProductAndBuyer(Product product, Buyer buyer);
    
    boolean existsByProductAndBuyer(Product product, Buyer buyer);
    
    // Statistics queries
    @Query("SELECT COUNT(r) FROM Review r WHERE r.product = :product AND r.status = :status")
    long countByProductAndStatus(@Param("product") Product product, @Param("status") Review.ReviewStatus status);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product = :product AND r.status = :status")
    Double getAverageRatingByProduct(@Param("product") Product product, @Param("status") Review.ReviewStatus status);
    
    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.product = :product AND r.status = :status GROUP BY r.rating ORDER BY r.rating DESC")
    List<Object[]> getRatingDistributionByProduct(@Param("product") Product product, @Param("status") Review.ReviewStatus status);
    
    // Advanced statistics
    @Query("SELECT AVG(r.conditionRating) FROM Review r WHERE r.product = :product AND r.conditionRating IS NOT NULL AND r.status = :status")
    Double getAverageConditionRating(@Param("product") Product product, @Param("status") Review.ReviewStatus status);
    
    @Query("SELECT AVG(r.valueRating) FROM Review r WHERE r.product = :product AND r.valueRating IS NOT NULL AND r.status = :status")
    Double getAverageValueRating(@Param("product") Product product, @Param("status") Review.ReviewStatus status);
    
    @Query("SELECT AVG(r.sellerRating) FROM Review r WHERE r.product = :product AND r.sellerRating IS NOT NULL AND r.status = :status")
    Double getAverageSellerRating(@Param("product") Product product, @Param("status") Review.ReviewStatus status);
    
    // Recent reviews
    @Query("SELECT r FROM Review r WHERE r.status = :status AND r.createdAt >= :since ORDER BY r.createdAt DESC")
    List<Review> findRecentReviews(@Param("status") Review.ReviewStatus status, @Param("since") LocalDateTime since);
    
    // Most helpful reviews
    @Query("SELECT r FROM Review r WHERE r.product = :product AND r.status = :status ORDER BY r.helpfulVotes DESC, r.createdAt DESC")
    List<Review> findMostHelpfulReviews(@Param("product") Product product, @Param("status") Review.ReviewStatus status);
    
    // Reviews with photos
    @Query("SELECT r FROM Review r WHERE r.product = :product AND r.status = :status AND SIZE(r.photoUrls) > 0 ORDER BY r.createdAt DESC")
    List<Review> findReviewsWithPhotos(@Param("product") Product product, @Param("status") Review.ReviewStatus status);
    
    // Verified purchase reviews
    @Query("SELECT COUNT(r) FROM Review r WHERE r.product = :product AND r.isVerifiedPurchase = true AND r.status = :status")
    long countVerifiedPurchaseReviews(@Param("product") Product product, @Param("status") Review.ReviewStatus status);
    
    // Moderation queries
    @Query("SELECT r FROM Review r WHERE r.status = 'PENDING' ORDER BY r.createdAt ASC")
    List<Review> findPendingReviews();
    
    @Query("SELECT r FROM Review r WHERE r.status = 'FLAGGED' ORDER BY r.createdAt ASC")
    List<Review> findFlaggedReviews();
    
    // Buyer activity
    @Query("SELECT COUNT(r) FROM Review r WHERE r.buyer = :buyer AND r.status = :status")
    long countByBuyerAndStatus(@Param("buyer") Buyer buyer, @Param("status") Review.ReviewStatus status);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.buyer = :buyer AND r.status = :status")
    Double getAverageBuyerRating(@Param("buyer") Buyer buyer, @Param("status") Review.ReviewStatus status);
    
    // Top reviewers
    @Query("SELECT r.buyer, COUNT(r) as reviewCount FROM Review r WHERE r.status = :status GROUP BY r.buyer ORDER BY reviewCount DESC")
    List<Object[]> findTopReviewers(@Param("status") Review.ReviewStatus status);
    
    // Product popularity based on reviews
    @Query("SELECT r.product, COUNT(r) as reviewCount, AVG(r.rating) as avgRating FROM Review r WHERE r.status = :status GROUP BY r.product ORDER BY reviewCount DESC, avgRating DESC")
    List<Object[]> findMostReviewedProducts(@Param("status") Review.ReviewStatus status);
    
    // Filter by rating range
    @Query("SELECT r FROM Review r WHERE r.product = :product AND r.rating BETWEEN :minRating AND :maxRating AND r.status = :status ORDER BY r.createdAt DESC")
    List<Review> findByProductAndRatingRange(@Param("product") Product product, 
                                           @Param("minRating") Integer minRating, 
                                           @Param("maxRating") Integer maxRating, 
                                           @Param("status") Review.ReviewStatus status);
    
    // Search reviews by content
    @Query("SELECT r FROM Review r WHERE r.product = :product AND r.status = :status AND " +
           "(LOWER(r.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.content) LIKE LOWER(CONCAT('%', :query, '%'))) ORDER BY r.createdAt DESC")
    List<Review> searchReviewsByContent(@Param("product") Product product, 
                                       @Param("query") String query, 
                                       @Param("status") Review.ReviewStatus status);
}
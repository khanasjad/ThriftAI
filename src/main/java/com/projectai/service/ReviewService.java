package com.projectai.service;

import com.projectai.models.Review;
import com.projectai.models.Product;
import com.projectai.models.Buyer;
import com.projectai.repository.ReviewRepository;
import com.projectai.repository.ProductRepository;
import com.projectai.repository.BuyerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private BuyerRepository buyerRepository;

    // Create and manage reviews
    public Review createReview(String productId, String buyerId, Integer rating, String title, String content) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));
        
        // Check if buyer has already reviewed this product
        if (reviewRepository.existsByProductAndBuyer(product, buyer)) {
            throw new IllegalStateException("Buyer has already reviewed this product");
        }
        
        Review review = new Review(product, buyer, rating, title, content);
        review.setStatus(Review.ReviewStatus.PENDING);
        
        return reviewRepository.save(review);
    }
    
    public Review createDetailedReview(String productId, String buyerId, Integer rating, String title, String content,
                                     Integer conditionRating, Integer valueRating, Integer sellerRating) {
        Review review = createReview(productId, buyerId, rating, title, content);
        review.setConditionRating(conditionRating);
        review.setValueRating(valueRating);
        review.setSellerRating(sellerRating);
        
        return reviewRepository.save(review);
    }
    
    public Review updateReview(String reviewId, String title, String content, Integer rating) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        
        review.setTitle(title);
        review.setContent(content);
        review.setRating(rating);
        
        return reviewRepository.save(review);
    }
    
    public void deleteReview(String reviewId) {
        reviewRepository.deleteById(reviewId);
    }

    // Review retrieval
    public List<Review> getProductReviews(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        return reviewRepository.findByProductAndStatusOrderByCreatedAtDesc(product, Review.ReviewStatus.APPROVED);
    }
    
    public List<Review> getProductReviewsSortedByHelpfulness(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        return reviewRepository.findMostHelpfulReviews(product, Review.ReviewStatus.APPROVED);
    }
    
    public List<Review> getVerifiedPurchaseReviews(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        return reviewRepository.findByProductAndIsVerifiedPurchaseTrueAndStatusOrderByCreatedAtDesc(
                product, Review.ReviewStatus.APPROVED);
    }
    
    public List<Review> getReviewsWithPhotos(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        return reviewRepository.findReviewsWithPhotos(product, Review.ReviewStatus.APPROVED);
    }
    
    public List<Review> getBuyerReviews(String buyerId) {
        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));
        
        return reviewRepository.findByBuyerOrderByCreatedAtDesc(buyer);
    }

    // Review statistics
    public Map<String, Object> getProductReviewStats(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        Map<String, Object> stats = new HashMap<>();
        
        // Basic stats
        long totalReviews = reviewRepository.countByProductAndStatus(product, Review.ReviewStatus.APPROVED);
        Double avgRating = reviewRepository.getAverageRatingByProduct(product, Review.ReviewStatus.APPROVED);
        long verifiedReviews = reviewRepository.countVerifiedPurchaseReviews(product, Review.ReviewStatus.APPROVED);
        
        stats.put("totalReviews", totalReviews);
        stats.put("averageRating", avgRating != null ? Math.round(avgRating * 100.0) / 100.0 : 0.0);
        stats.put("verifiedPurchaseReviews", verifiedReviews);
        stats.put("verifiedPercentage", totalReviews > 0 ? (double) verifiedReviews / totalReviews * 100 : 0.0);
        
        // Rating distribution
        List<Object[]> ratingDist = reviewRepository.getRatingDistributionByProduct(product, Review.ReviewStatus.APPROVED);
        Map<Integer, Long> ratingDistribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            ratingDistribution.put(i, 0L);
        }
        for (Object[] row : ratingDist) {
            ratingDistribution.put((Integer) row[0], (Long) row[1]);
        }
        stats.put("ratingDistribution", ratingDistribution);
        
        // Detailed ratings
        Double avgCondition = reviewRepository.getAverageConditionRating(product, Review.ReviewStatus.APPROVED);
        Double avgValue = reviewRepository.getAverageValueRating(product, Review.ReviewStatus.APPROVED);
        Double avgSeller = reviewRepository.getAverageSellerRating(product, Review.ReviewStatus.APPROVED);
        
        Map<String, Double> detailedRatings = new HashMap<>();
        detailedRatings.put("condition", avgCondition != null ? Math.round(avgCondition * 100.0) / 100.0 : null);
        detailedRatings.put("value", avgValue != null ? Math.round(avgValue * 100.0) / 100.0 : null);
        detailedRatings.put("seller", avgSeller != null ? Math.round(avgSeller * 100.0) / 100.0 : null);
        stats.put("detailedRatings", detailedRatings);
        
        return stats;
    }
    
    public Map<String, Object> getBuyerReviewStats(String buyerId) {
        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));
        
        Map<String, Object> stats = new HashMap<>();
        
        long totalReviews = reviewRepository.countByBuyerAndStatus(buyer, Review.ReviewStatus.APPROVED);
        Double avgRating = reviewRepository.getAverageBuyerRating(buyer, Review.ReviewStatus.APPROVED);
        
        stats.put("totalReviews", totalReviews);
        stats.put("averageRating", avgRating != null ? Math.round(avgRating * 100.0) / 100.0 : 0.0);
        
        return stats;
    }

    // Review helpfulness
    public Review markReviewHelpful(String reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        
        review.setHelpfulVotes(review.getHelpfulVotes() + 1);
        return reviewRepository.save(review);
    }
    
    public Review markReviewUnhelpful(String reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        
        review.setUnhelpfulVotes(review.getUnhelpfulVotes() + 1);
        return reviewRepository.save(review);
    }

    // Review moderation
    public Review approveReview(String reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        
        review.setStatus(Review.ReviewStatus.APPROVED);
        return reviewRepository.save(review);
    }
    
    public Review rejectReview(String reviewId, String reason) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        
        review.setStatus(Review.ReviewStatus.REJECTED);
        review.setModerationNotes(reason);
        return reviewRepository.save(review);
    }
    
    public Review flagReview(String reviewId, String reason) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        
        review.setStatus(Review.ReviewStatus.FLAGGED);
        review.setModerationNotes(reason);
        return reviewRepository.save(review);
    }
    
    public List<Review> getPendingReviews() {
        return reviewRepository.findPendingReviews();
    }
    
    public List<Review> getFlaggedReviews() {
        return reviewRepository.findFlaggedReviews();
    }

    // Advanced features
    public List<Review> searchProductReviews(String productId, String query) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        return reviewRepository.searchReviewsByContent(product, query, Review.ReviewStatus.APPROVED);
    }
    
    public List<Review> filterProductReviewsByRating(String productId, Integer minRating, Integer maxRating) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        return reviewRepository.findByProductAndRatingRange(product, minRating, maxRating, Review.ReviewStatus.APPROVED);
    }
    
    public List<Review> getRecentReviews(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return reviewRepository.findRecentReviews(Review.ReviewStatus.APPROVED, since);
    }
    
    public List<Map<String, Object>> getTopReviewers(int limit) {
        List<Object[]> topReviewers = reviewRepository.findTopReviewers(Review.ReviewStatus.APPROVED);
        
        return topReviewers.stream()
                .limit(limit)
                .map(row -> {
                    Map<String, Object> reviewer = new HashMap<>();
                    Buyer buyer = (Buyer) row[0];
                    Long reviewCount = (Long) row[1];
                    
                    reviewer.put("buyer", Map.of(
                            "id", buyer.getId(),
                            "name", buyer.getFirstName() + " " + buyer.getLastName(),
                            "email", buyer.getEmail()
                    ));
                    reviewer.put("reviewCount", reviewCount);
                    
                    return reviewer;
                })
                .collect(Collectors.toList());
    }
    
    public List<Map<String, Object>> getMostReviewedProducts(int limit) {
        List<Object[]> mostReviewed = reviewRepository.findMostReviewedProducts(Review.ReviewStatus.APPROVED);
        
        return mostReviewed.stream()
                .limit(limit)
                .map(row -> {
                    Map<String, Object> productStats = new HashMap<>();
                    Product product = (Product) row[0];
                    Long reviewCount = (Long) row[1];
                    Double avgRating = (Double) row[2];
                    
                    productStats.put("product", Map.of(
                            "id", product.getId(),
                            "name", product.getName(),
                            "category", product.getCategory(),
                            "price", product.getPrice()
                    ));
                    productStats.put("reviewCount", reviewCount);
                    productStats.put("averageRating", avgRating != null ? Math.round(avgRating * 100.0) / 100.0 : 0.0);
                    
                    return productStats;
                })
                .collect(Collectors.toList());
    }

    // Generate mock reviews for demo purposes
    @Transactional
    public void generateMockReviews(String productId, int count) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        List<Buyer> buyers = buyerRepository.findByIsActiveTrue();
        if (buyers.isEmpty()) {
            return;
        }
        
        Random random = new Random();
        String[] titles = {
                "Great quality product!",
                "Excellent condition as described",
                "Good value for money",
                "Fast shipping and good packaging",
                "Would recommend to others",
                "Perfect fit and style",
                "Better than expected",
                "Exactly what I was looking for"
        };
        
        String[] contents = {
                "I'm very satisfied with this purchase. The item arrived quickly and was exactly as described.",
                "Good quality product at a fair price. Shipping was fast and packaging was secure.",
                "The condition was better than I expected. Great find on ThriftAI!",
                "Excellent seller communication and fast delivery. Item matches description perfectly.",
                "Really happy with this purchase. Will definitely buy from this seller again.",
                "Great quality and exactly what I needed. Highly recommend this product.",
                "Fast shipping and item was in excellent condition. Very pleased with the purchase.",
                "Good value for the price. Item was clean and in great condition."
        };
        
        for (int i = 0; i < count; i++) {
            Buyer buyer = buyers.get(random.nextInt(buyers.size()));
            
            // Skip if buyer already reviewed this product
            if (reviewRepository.existsByProductAndBuyer(product, buyer)) {
                continue;
            }
            
            Review review = new Review();
            review.setProduct(product);
            review.setBuyer(buyer);
            review.setRating(3 + random.nextInt(3)); // 3-5 stars
            review.setTitle(titles[random.nextInt(titles.length)]);
            review.setContent(contents[random.nextInt(contents.length)]);
            review.setConditionRating(3 + random.nextInt(3));
            review.setValueRating(3 + random.nextInt(3));
            review.setSellerRating(4 + random.nextInt(2));
            review.setVerifiedPurchase(random.nextBoolean());
            review.setHelpfulVotes(random.nextInt(10));
            review.setUnhelpfulVotes(random.nextInt(3));
            review.setStatus(Review.ReviewStatus.APPROVED);
            
            reviewRepository.save(review);
        }
    }
}
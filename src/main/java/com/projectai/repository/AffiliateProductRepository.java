package com.projectai.repository;

import com.projectai.models.AffiliateProduct;
import com.projectai.models.AffiliateProduct.AffiliateSource;
import com.projectai.models.AffiliateProduct.Gender;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AffiliateProductRepository extends JpaRepository<AffiliateProduct, String> {

    // Basic product queries
    List<AffiliateProduct> findByBrand(String brand);
    List<AffiliateProduct> findByCategory(String category);
    List<AffiliateProduct> findByBrandAndCategory(String brand, String category);
    Optional<AffiliateProduct> findBySku(String sku);
    List<AffiliateProduct> findByAffiliateSource(AffiliateSource affiliateSource);

    // Price range queries
    List<AffiliateProduct> findByPriceBetween(BigDecimal minPrice, BigDecimal maxPrice);

    @Query("SELECT p FROM AffiliateProduct p WHERE p.price >= :minPrice AND p.price <= :maxPrice AND p.category = :category")
    List<AffiliateProduct> findByPriceRangeAndCategory(@Param("minPrice") BigDecimal minPrice,
                                                       @Param("maxPrice") BigDecimal maxPrice,
                                                       @Param("category") String category);

    // Advanced search queries
    @Query("SELECT p FROM AffiliateProduct p WHERE " +
           "(:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:category IS NULL OR p.category = :category) AND " +
           "(:brand IS NULL OR p.brand = :brand) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:gender IS NULL OR p.targetGender = :gender) AND " +
           "p.isActive = true AND p.inStock = true")
    Page<AffiliateProduct> searchProducts(@Param("keyword") String keyword,
                                         @Param("category") String category,
                                         @Param("brand") String brand,
                                         @Param("minPrice") BigDecimal minPrice,
                                         @Param("maxPrice") BigDecimal maxPrice,
                                         @Param("gender") Gender gender,
                                         Pageable pageable);

    // Trending and featured products
    @Query("SELECT p FROM AffiliateProduct p WHERE p.isFeatured = true AND p.isActive = true AND p.inStock = true ORDER BY p.rating DESC, p.reviewCount DESC")
    List<AffiliateProduct> findFeaturedProducts(Pageable pageable);

    @Query("SELECT p FROM AffiliateProduct p WHERE p.isActive = true AND p.inStock = true ORDER BY p.createdAt DESC")
    List<AffiliateProduct> findNewArrivals(Pageable pageable);

    @Query("SELECT p FROM AffiliateProduct p WHERE p.isActive = true AND p.inStock = true AND p.originalPrice IS NOT NULL AND p.discountPercentage > :minDiscount ORDER BY p.discountPercentage DESC")
    List<AffiliateProduct> findSaleProducts(@Param("minDiscount") BigDecimal minDiscount, Pageable pageable);

    // Comparison and analytics queries
    @Query("SELECT p FROM AffiliateProduct p WHERE p.category = :category AND p.brand IN :brands AND p.isActive = true AND p.inStock = true")
    List<AffiliateProduct> findProductsForComparison(@Param("category") String category, @Param("brands") List<String> brands);

    @Query("SELECT DISTINCT p.brand FROM AffiliateProduct p WHERE p.category = :category AND p.isActive = true ORDER BY p.brand")
    List<String> findBrandsByCategory(@Param("category") String category);

    @Query("SELECT DISTINCT p.category FROM AffiliateProduct p WHERE p.isActive = true ORDER BY p.category")
    List<String> findAllActiveCategories();

    // Data synchronization queries
    @Query("SELECT p FROM AffiliateProduct p WHERE p.dataExpiresAt < :currentTime")
    List<AffiliateProduct> findStaleProducts(@Param("currentTime") LocalDateTime currentTime);

    @Query("SELECT p FROM AffiliateProduct p WHERE p.affiliateSource = :source AND p.lastSyncAt < :syncTime")
    List<AffiliateProduct> findProductsNeedingSync(@Param("source") AffiliateSource source, @Param("syncTime") LocalDateTime syncTime);

    // Statistical queries for comparison
    @Query("SELECT AVG(p.price) FROM AffiliateProduct p WHERE p.category = :category AND p.isActive = true")
    BigDecimal findAveragePriceByCategory(@Param("category") String category);

    @Query("SELECT MIN(p.price) FROM AffiliateProduct p WHERE p.category = :category AND p.isActive = true")
    BigDecimal findMinPriceByCategory(@Param("category") String category);

    @Query("SELECT MAX(p.price) FROM AffiliateProduct p WHERE p.category = :category AND p.isActive = true")
    BigDecimal findMaxPriceByCategory(@Param("category") String category);

    @Query("SELECT AVG(p.rating) FROM AffiliateProduct p WHERE p.category = :category AND p.rating IS NOT NULL AND p.isActive = true")
    BigDecimal findAverageRatingByCategory(@Param("category") String category);

    // Size and color availability
    @Query("SELECT p FROM AffiliateProduct p JOIN p.availableSizes s WHERE s = :size AND p.isActive = true AND p.inStock = true")
    List<AffiliateProduct> findBySize(@Param("size") String size);

    @Query("SELECT p FROM AffiliateProduct p JOIN p.availableColors c WHERE c = :color AND p.isActive = true AND p.inStock = true")
    List<AffiliateProduct> findByColor(@Param("color") String color);

    // Recommendation queries
    @Query("SELECT p FROM AffiliateProduct p WHERE p.category = :category AND p.id != :excludeId AND p.isActive = true AND p.inStock = true ORDER BY p.rating DESC, p.reviewCount DESC")
    List<AffiliateProduct> findSimilarProducts(@Param("category") String category, @Param("excludeId") String excludeId, Pageable pageable);

    @Query("SELECT p FROM AffiliateProduct p WHERE p.brand = :brand AND p.id != :excludeId AND p.isActive = true AND p.inStock = true ORDER BY p.rating DESC")
    List<AffiliateProduct> findByBrandExcluding(@Param("brand") String brand, @Param("excludeId") String excludeId, Pageable pageable);

    // Performance metrics
    @Query("SELECT COUNT(p) FROM AffiliateProduct p WHERE p.affiliateSource = :source AND p.isActive = true")
    Long countBySource(@Param("source") AffiliateSource source);

    @Query("SELECT COUNT(p) FROM AffiliateProduct p WHERE p.category = :category AND p.isActive = true")
    Long countByCategory(@Param("category") String category);

    @Query("SELECT p.affiliateSource, COUNT(p) FROM AffiliateProduct p WHERE p.isActive = true GROUP BY p.affiliateSource")
    List<Object[]> getProductCountBySource();

    @Query("SELECT p.category, COUNT(p) FROM AffiliateProduct p WHERE p.isActive = true GROUP BY p.category ORDER BY COUNT(p) DESC")
    List<Object[]> getProductCountByCategory();

    // Text search with ranking
    @Query("SELECT p FROM AffiliateProduct p WHERE " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "EXISTS (SELECT 1 FROM p.tags t WHERE LOWER(t) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) OR " +
           "EXISTS (SELECT 1 FROM p.keywords k WHERE LOWER(k) LIKE LOWER(CONCAT('%', :searchTerm, '%')))) AND " +
           "p.isActive = true AND p.inStock = true " +
           "ORDER BY " +
           "CASE WHEN LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) THEN 1 " +
           "     WHEN LOWER(p.brand) LIKE LOWER(CONCAT('%', :searchTerm, '%')) THEN 2 " +
           "     WHEN LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) THEN 3 " +
           "     ELSE 4 END, " +
           "p.rating DESC, p.reviewCount DESC")
    Page<AffiliateProduct> searchByText(@Param("searchTerm") String searchTerm, Pageable pageable);

    // Seasonal and trending
    @Query("SELECT p FROM AffiliateProduct p WHERE p.season = :season AND p.isActive = true AND p.inStock = true ORDER BY p.rating DESC")
    List<AffiliateProduct> findBySeason(@Param("season") AffiliateProduct.Season season, Pageable pageable);

    @Query("SELECT p FROM AffiliateProduct p WHERE p.trendingKeywords IS NOT NULL AND " +
           "LOWER(p.trendingKeywords) LIKE LOWER(CONCAT('%', :keyword, '%')) AND " +
           "p.isActive = true AND p.inStock = true ORDER BY p.rating DESC")
    List<AffiliateProduct> findByTrendingKeyword(@Param("keyword") String keyword, Pageable pageable);
}
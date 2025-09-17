package com.projectai.repository;

import com.projectai.models.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
    
    List<Product> findByCategory(String category);
    
    List<Product> findByBrand(String brand);
    
    List<Product> findByStoreId(String storeId);
    
    List<Product> findByIsAvailableTrue();
    
    @Query("SELECT p FROM Product p WHERE p.isAvailable = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.category) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Product> searchProducts(@Param("query") String query);
    
    @Query("SELECT p FROM Product p WHERE p.isAvailable = true AND p.category = :category AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Product> searchProductsByCategory(@Param("query") String query, @Param("category") String category);
    
    @Query("SELECT p FROM Product p WHERE p.isAvailable = true AND " +
           "p.price BETWEEN :minPrice AND :maxPrice ORDER BY p.price ASC")
    List<Product> findByPriceRange(@Param("minPrice") double minPrice, @Param("maxPrice") double maxPrice);
    
    @Query("SELECT p FROM Product p WHERE p.isAvailable = true AND " +
           "p.originalPrice > 0 AND ((p.originalPrice - p.price) / p.originalPrice) * 100 >= :minDiscount " +
           "ORDER BY ((p.originalPrice - p.price) / p.originalPrice) DESC")
    List<Product> findProductsWithMinDiscount(@Param("minDiscount") double minDiscount);
    
    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.isAvailable = true")
    List<String> findAllAvailableCategories();
    
    @Query("SELECT DISTINCT p.brand FROM Product p WHERE p.isAvailable = true AND p.brand IS NOT NULL")
    List<String> findAllAvailableBrands();
    
    @Query("SELECT COUNT(p) FROM Product p WHERE p.isAvailable = true")
    long countAvailableProducts();
    
    @Query("SELECT COUNT(p) FROM Product p WHERE p.category = :category AND p.isAvailable = true")
    long countByCategoryAndAvailable(@Param("category") String category);
    
    List<Product> findByCategoryIgnoreCase(String category);
    
    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.category IS NOT NULL ORDER BY p.category")
    List<String> findDistinctCategories();
    
    @Query("SELECT DISTINCT p.condition FROM Product p WHERE p.condition IS NOT NULL ORDER BY p.condition")
    List<String> findDistinctConditions();
    
    // Advanced filtering methods for Amazon-like search experience
    @Query("SELECT p FROM Product p WHERE p.isAvailable = true AND " +
           "(:query IS NULL OR :query = '' OR " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.category) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:category IS NULL OR :category = '' OR p.category = :category) AND " +
           "(:brand IS NULL OR :brand = '' OR p.brand = :brand) AND " +
           "(:condition IS NULL OR :condition = '' OR p.condition = :condition) AND " +
           "(:size IS NULL OR :size = '' OR p.size = :size) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice)")
    List<Product> findWithFilters(@Param("query") String query,
                                  @Param("category") String category,
                                  @Param("brand") String brand,
                                  @Param("condition") String condition,
                                  @Param("size") String size,
                                  @Param("minPrice") Double minPrice,
                                  @Param("maxPrice") Double maxPrice);
                                  
    @Query("SELECT DISTINCT p.size FROM Product p WHERE p.isAvailable = true AND p.size IS NOT NULL AND p.size != '' ORDER BY p.size")
    List<String> findDistinctSizes();
    
    @Query("SELECT DISTINCT p.size FROM Product p WHERE p.isAvailable = true AND p.category = :category AND p.size IS NOT NULL AND p.size != '' ORDER BY p.size")
    List<String> findDistinctSizesByCategory(@Param("category") String category);
    
    @Query("SELECT DISTINCT p.brand FROM Product p WHERE p.isAvailable = true AND p.category = :category AND p.brand IS NOT NULL ORDER BY p.brand")
    List<String> findDistinctBrandsByCategory(@Param("category") String category);
    
    // Price range analysis for dynamic filter ranges
    @Query("SELECT MIN(p.price) FROM Product p WHERE p.isAvailable = true")
    Double findMinPrice();
    
    @Query("SELECT MAX(p.price) FROM Product p WHERE p.isAvailable = true")
    Double findMaxPrice();
    
    @Query("SELECT MIN(p.price) FROM Product p WHERE p.isAvailable = true AND p.category = :category")
    Double findMinPriceByCategory(@Param("category") String category);
    
    @Query("SELECT MAX(p.price) FROM Product p WHERE p.isAvailable = true AND p.category = :category")
    Double findMaxPriceByCategory(@Param("category") String category);
    
    // Popular/trending items
    @Query("SELECT p FROM Product p WHERE p.isAvailable = true ORDER BY p.createdAt DESC")
    List<Product> findNewArrivals();
    
    @Query("SELECT p FROM Product p WHERE p.isAvailable = true AND p.originalPrice > 0 " +
           "ORDER BY ((p.originalPrice - p.price) / p.originalPrice) DESC")
    List<Product> findBestDeals();
    
    // Count products with filters for result pagination
    @Query("SELECT COUNT(p) FROM Product p WHERE p.isAvailable = true AND " +
           "(:query IS NULL OR :query = '' OR " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.category) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:category IS NULL OR :category = '' OR p.category = :category) AND " +
           "(:brand IS NULL OR :brand = '' OR p.brand = :brand) AND " +
           "(:condition IS NULL OR :condition = '' OR p.condition = :condition) AND " +
           "(:size IS NULL OR :size = '' OR p.size = :size) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice)")
    long countWithFilters(@Param("query") String query,
                         @Param("category") String category,
                         @Param("brand") String brand,
                         @Param("condition") String condition,
                         @Param("size") String size,
                         @Param("minPrice") Double minPrice,
                         @Param("maxPrice") Double maxPrice);
                         
    // Additional methods for RealTimeRecommendationService
    @Query("SELECT p FROM Product p WHERE p.isAvailable = true AND LOWER(p.category) LIKE LOWER(CONCAT('%', :category, '%'))")
    List<Product> findByCategoryContainingIgnoreCase(@Param("category") String category);
    
    @Query("SELECT p FROM Product p WHERE p.isAvailable = true AND LOWER(p.description) LIKE LOWER(CONCAT('%', :description, '%'))")
    List<Product> findByDescriptionContainingIgnoreCase(@Param("description") String description);
    
    // Seller-specific queries for analytics
    List<Product> findBySeller_Id(String sellerId);
    
    // Additional methods for IntelligentSearchService
    List<Product> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);
    
    // Additional methods for AdvancedInventoryManagementService
    long countByIsAvailableTrue();
}
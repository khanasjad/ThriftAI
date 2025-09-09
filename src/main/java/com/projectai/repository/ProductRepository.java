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
}
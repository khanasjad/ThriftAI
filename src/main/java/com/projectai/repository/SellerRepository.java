package com.projectai.repository;

import com.projectai.models.Seller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SellerRepository extends JpaRepository<Seller, String> {
    
    Optional<Seller> findByEmail(String email);
    
    List<Seller> findByIsActiveTrue();
    
    List<Seller> findByIsVerifiedTrue();
    
    List<Seller> findByStatus(Seller.SellerStatus status);
    
    List<Seller> findBySellerType(Seller.SellerType sellerType);
    
    List<Seller> findByCityIgnoreCase(String city);
    
    List<Seller> findByStateIgnoreCase(String state);
    
    @Query("SELECT s FROM Seller s WHERE s.isActive = true AND s.isVerified = true")
    List<Seller> findActiveAndVerifiedSellers();
    
    @Query("SELECT s FROM Seller s WHERE LOWER(s.businessName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(s.ownerName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(s.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Seller> searchSellers(@Param("query") String query);
    
    @Query("SELECT s FROM Seller s WHERE :category MEMBER OF s.categories")
    List<Seller> findByCategoriesContaining(@Param("category") String category);
    
    @Query("SELECT s FROM Seller s WHERE s.rating >= :minRating ORDER BY s.rating DESC")
    List<Seller> findByRatingGreaterThanEqual(@Param("minRating") double minRating);
    
    @Query("SELECT s FROM Seller s WHERE s.totalSales >= :minSales ORDER BY s.totalSales DESC")
    List<Seller> findByTotalSalesGreaterThanEqual(@Param("minSales") int minSales);
    
    @Query("SELECT s FROM Seller s ORDER BY s.totalRevenue DESC")
    List<Seller> findTopSellersByRevenue();
    
    @Query("SELECT COUNT(s) FROM Seller s WHERE s.status = :status")
    long countByStatus(@Param("status") Seller.SellerStatus status);
    
    @Query("SELECT COUNT(s) FROM Seller s WHERE s.isActive = true")
    long countActiveSellers();
    
    @Query("SELECT COUNT(s) FROM Seller s WHERE s.isVerified = true")
    long countVerifiedSellers();
    
    @Query("SELECT s.sellerType, COUNT(s) FROM Seller s GROUP BY s.sellerType")
    List<Object[]> countBySellerType();
    
    @Query("SELECT s.city, COUNT(s) FROM Seller s WHERE s.city IS NOT NULL GROUP BY s.city ORDER BY COUNT(s) DESC")
    List<Object[]> countByCity();
}
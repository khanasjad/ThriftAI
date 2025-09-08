package com.projectai.repository;

import com.projectai.models.Buyer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BuyerRepository extends JpaRepository<Buyer, String> {
    
    Optional<Buyer> findByEmail(String email);
    
    List<Buyer> findByIsActiveTrue();
    
    List<Buyer> findByEmailVerifiedTrue();
    
    List<Buyer> findByBuyerType(Buyer.BuyerType buyerType);
    
    List<Buyer> findByCityIgnoreCase(String city);
    
    List<Buyer> findByStateIgnoreCase(String state);
    
    @Query("SELECT b FROM Buyer b WHERE LOWER(b.firstName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(b.lastName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(b.email) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Buyer> searchBuyers(@Param("query") String query);
    
    @Query("SELECT b FROM Buyer b WHERE :category MEMBER OF b.preferredCategories")
    List<Buyer> findByPreferredCategoriesContaining(@Param("category") String category);
    
    @Query("SELECT b FROM Buyer b WHERE :brand MEMBER OF b.preferredBrands")
    List<Buyer> findByPreferredBrandsContaining(@Param("brand") String brand);
    
    @Query("SELECT b FROM Buyer b WHERE b.maxBudget >= :minBudget AND b.maxBudget <= :maxBudget")
    List<Buyer> findByBudgetRange(@Param("minBudget") double minBudget, @Param("maxBudget") double maxBudget);
    
    @Query("SELECT b FROM Buyer b WHERE b.totalSpent >= :minSpent ORDER BY b.totalSpent DESC")
    List<Buyer> findByTotalSpentGreaterThanEqual(@Param("minSpent") double minSpent);
    
    @Query("SELECT b FROM Buyer b WHERE b.totalOrders >= :minOrders ORDER BY b.totalOrders DESC")
    List<Buyer> findByTotalOrdersGreaterThanEqual(@Param("minOrders") int minOrders);
    
    @Query("SELECT b FROM Buyer b WHERE b.loyaltyPoints >= :minPoints ORDER BY b.loyaltyPoints DESC")
    List<Buyer> findTopLoyaltyCustomers(@Param("minPoints") double minPoints);
    
    @Query("SELECT b FROM Buyer b WHERE b.lastOrderAt >= :since")
    List<Buyer> findRecentBuyers(@Param("since") LocalDateTime since);
    
    @Query("SELECT b FROM Buyer b WHERE b.createdAt >= :since")
    List<Buyer> findNewBuyers(@Param("since") LocalDateTime since);
    
    @Query("SELECT b FROM Buyer b WHERE b.receiveDeals = true AND b.isActive = true")
    List<Buyer> findBuyersWhoReceiveDeals();
    
    @Query("SELECT b FROM Buyer b WHERE b.receiveNewsletters = true AND b.isActive = true")
    List<Buyer> findNewsletterSubscribers();
    
    @Query("SELECT COUNT(b) FROM Buyer b WHERE b.isActive = true")
    long countActiveBuyers();
    
    @Query("SELECT COUNT(b) FROM Buyer b WHERE b.emailVerified = true")
    long countVerifiedBuyers();
    
    @Query("SELECT b.buyerType, COUNT(b) FROM Buyer b GROUP BY b.buyerType")
    List<Object[]> countByBuyerType();
    
    @Query("SELECT b.city, COUNT(b) FROM Buyer b WHERE b.city IS NOT NULL GROUP BY b.city ORDER BY COUNT(b) DESC")
    List<Object[]> countByCity();
    
    @Query("SELECT AVG(b.totalSpent) FROM Buyer b WHERE b.totalOrders > 0")
    Double getAverageSpending();
    
    @Query("SELECT AVG(b.averageOrderValue) FROM Buyer b WHERE b.totalOrders > 0")
    Double getAverageOrderValue();
}
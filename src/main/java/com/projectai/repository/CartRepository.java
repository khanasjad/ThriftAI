package com.projectai.repository;

import com.projectai.models.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<CartItem, String> {
    
    // Find cart items by session ID (for guest users)
    List<CartItem> findBySessionIdOrderByCreatedAtDesc(String sessionId);
    
    // Find cart items by buyer ID (for logged-in users)
    List<CartItem> findByBuyerIdOrderByCreatedAtDesc(String buyerId);
    
    // Find cart items by session ID or buyer ID
    @Query("SELECT c FROM CartItem c WHERE c.sessionId = :sessionId OR c.buyerId = :buyerId ORDER BY c.createdAt DESC")
    List<CartItem> findBySessionIdOrBuyerId(@Param("sessionId") String sessionId, @Param("buyerId") String buyerId);
    
    // Find specific cart item by session/buyer and product
    @Query("SELECT c FROM CartItem c WHERE (c.sessionId = :sessionId OR c.buyerId = :buyerId) AND c.productId = :productId")
    Optional<CartItem> findBySessionIdOrBuyerIdAndProductId(@Param("sessionId") String sessionId, 
                                                           @Param("buyerId") String buyerId, 
                                                           @Param("productId") String productId);
    
    // Count items in cart
    @Query("SELECT COUNT(c) FROM CartItem c WHERE c.sessionId = :sessionId OR c.buyerId = :buyerId")
    Long countBySessionIdOrBuyerId(@Param("sessionId") String sessionId, @Param("buyerId") String buyerId);
    
    // Get total quantity in cart
    @Query("SELECT COALESCE(SUM(c.quantity), 0) FROM CartItem c WHERE c.sessionId = :sessionId OR c.buyerId = :buyerId")
    Long getTotalQuantityBySessionIdOrBuyerId(@Param("sessionId") String sessionId, @Param("buyerId") String buyerId);
    
    // Get cart total value
    @Query("SELECT COALESCE(SUM(c.quantity * COALESCE(c.priceAtTime, c.product.price)), 0.0) FROM CartItem c " +
           "JOIN c.product p WHERE c.sessionId = :sessionId OR c.buyerId = :buyerId")
    Double getTotalValueBySessionIdOrBuyerId(@Param("sessionId") String sessionId, @Param("buyerId") String buyerId);
    
    // Delete cart items by session ID
    void deleteBySessionId(String sessionId);
    
    // Delete cart items by buyer ID
    void deleteByBuyerId(String buyerId);
    
    // Delete cart items by session ID or buyer ID
    @Query("DELETE FROM CartItem c WHERE c.sessionId = :sessionId OR c.buyerId = :buyerId")
    void deleteBySessionIdOrBuyerId(@Param("sessionId") String sessionId, @Param("buyerId") String buyerId);
    
    // Clean up old guest carts (older than specified date)
    @Query("DELETE FROM CartItem c WHERE c.buyerId IS NULL AND c.createdAt < :cutoffDate")
    void deleteOldGuestCarts(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // Find cart items with products that are no longer available
    @Query("SELECT c FROM CartItem c JOIN c.product p WHERE (c.sessionId = :sessionId OR c.buyerId = :buyerId) AND p.isAvailable = false")
    List<CartItem> findUnavailableItemsBySessionIdOrBuyerId(@Param("sessionId") String sessionId, @Param("buyerId") String buyerId);
    
    // Find cart items where price has changed
    @Query("SELECT c FROM CartItem c JOIN c.product p WHERE (c.sessionId = :sessionId OR c.buyerId = :buyerId) AND c.priceAtTime != p.price")
    List<CartItem> findPriceChangedItemsBySessionIdOrBuyerId(@Param("sessionId") String sessionId, @Param("buyerId") String buyerId);
    
    // Transfer guest cart items to user account
    @Query("UPDATE CartItem c SET c.buyerId = :buyerId WHERE c.sessionId = :sessionId AND c.buyerId IS NULL")
    int transferGuestCartToUser(@Param("sessionId") String sessionId, @Param("buyerId") String buyerId);
    
    // Get recently added items
    @Query("SELECT c FROM CartItem c WHERE (c.sessionId = :sessionId OR c.buyerId = :buyerId) " +
           "ORDER BY c.createdAt DESC")
    List<CartItem> findRecentlyAddedBySessionIdOrBuyerId(@Param("sessionId") String sessionId, 
                                                        @Param("buyerId") String buyerId);
    
    // Find cart items by product ID (for checking if product is in any cart)
    List<CartItem> findByProductId(String productId);
    
    // Count how many users have a specific product in their cart
    @Query("SELECT COUNT(DISTINCT COALESCE(c.buyerId, c.sessionId)) FROM CartItem c WHERE c.productId = :productId")
    Long countUsersWithProductInCart(@Param("productId") String productId);
}
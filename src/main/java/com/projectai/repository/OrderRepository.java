package com.projectai.repository;

import com.projectai.models.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    
    // Find orders by buyer
    List<Order> findByBuyerIdOrderByCreatedAtDesc(String buyerId);
    
    // Find orders by session (for guest checkout)
    List<Order> findBySessionIdOrderByCreatedAtDesc(String sessionId);
    
    // Find orders by buyer or session
    @Query("SELECT o FROM Order o WHERE (o.buyerId = :buyerId OR o.sessionId = :sessionId) ORDER BY o.createdAt DESC")
    List<Order> findByBuyerIdOrSessionIdOrderByCreatedAtDesc(@Param("buyerId") String buyerId, @Param("sessionId") String sessionId);
    
    // Find recent orders
    List<Order> findByBuyerIdAndCreatedAtAfterOrderByCreatedAtDesc(String buyerId, LocalDateTime since);
    
    // Find orders by status
    List<Order> findByStatusOrderByCreatedAtDesc(Order.OrderStatus status);
    
    // Find orders by payment status
    List<Order> findByPaymentStatusOrderByCreatedAtDesc(Order.PaymentStatus paymentStatus);
    
    // Find orders by buyer and status
    List<Order> findByBuyerIdAndStatusOrderByCreatedAtDesc(String buyerId, Order.OrderStatus status);
    
    // Count orders by buyer
    long countByBuyerId(String buyerId);
    
    // Count orders by status
    long countByStatus(Order.OrderStatus status);
    
    // Count orders by payment status
    long countByPaymentStatus(Order.PaymentStatus paymentStatus);
    
    // Get total revenue
    @Query("SELECT COALESCE(SUM(o.total), 0.0) FROM Order o WHERE o.paymentStatus = 'COMPLETED'")
    Double getTotalRevenue();
    
    // Get total revenue by buyer
    @Query("SELECT COALESCE(SUM(o.total), 0.0) FROM Order o WHERE o.buyerId = :buyerId AND o.paymentStatus = 'COMPLETED'")
    Double getTotalRevenueByBuyer(@Param("buyerId") String buyerId);
    
    // Get revenue by date range
    @Query("SELECT COALESCE(SUM(o.total), 0.0) FROM Order o WHERE o.paymentStatus = 'COMPLETED' AND o.createdAt BETWEEN :startDate AND :endDate")
    Double getRevenueByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Find orders needing shipping
    @Query("SELECT o FROM Order o WHERE o.status = 'CONFIRMED' OR o.status = 'PROCESSING' ORDER BY o.createdAt ASC")
    List<Order> findOrdersNeedingShipping();
    
    // Find overdue orders (not shipped within 3 days)
    @Query("SELECT o FROM Order o WHERE o.status IN ('CONFIRMED', 'PROCESSING') AND o.createdAt < :cutoffDate ORDER BY o.createdAt ASC")
    List<Order> findOverdueOrders(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // Find deliverable orders (shipped but not delivered)
    @Query("SELECT o FROM Order o WHERE o.status = 'SHIPPED' AND o.shippedAt IS NOT NULL ORDER BY o.shippedAt ASC")
    List<Order> findDeliverableOrders();
    
    // Find orders by tracking number
    Optional<Order> findByTrackingNumber(String trackingNumber);
    
    // Get order statistics
    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> getOrderStatusCounts();
    
    @Query("SELECT o.paymentStatus, COUNT(o) FROM Order o GROUP BY o.paymentStatus")
    List<Object[]> getPaymentStatusCounts();
    
    // Get daily order counts
    @Query(value = "SELECT DATE(created_at) as order_date, COUNT(*) as order_count " +
                   "FROM orders WHERE created_at >= :startDate " +
                   "GROUP BY DATE(created_at) ORDER BY order_date DESC", nativeQuery = true)
    List<Object[]> getDailyOrderCounts(@Param("startDate") LocalDateTime startDate);
    
    // Get monthly revenue
    @Query(value = "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total) as revenue " +
                   "FROM orders WHERE payment_status = 'COMPLETED' AND created_at >= :startDate " +
                   "GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month DESC", nativeQuery = true)
    List<Object[]> getMonthlyRevenue(@Param("startDate") LocalDateTime startDate);
    
    // Find top buyers by order count
    @Query("SELECT o.buyerId, COUNT(o) as orderCount, SUM(o.total) as totalSpent " +
           "FROM Order o WHERE o.paymentStatus = 'COMPLETED' " +
           "GROUP BY o.buyerId ORDER BY orderCount DESC")
    List<Object[]> getTopBuyersByOrderCount();
    
    // Find top buyers by spending
    @Query("SELECT o.buyerId, COUNT(o) as orderCount, SUM(o.total) as totalSpent " +
           "FROM Order o WHERE o.paymentStatus = 'COMPLETED' " +
           "GROUP BY o.buyerId ORDER BY totalSpent DESC")
    List<Object[]> getTopBuyersBySpending();
    
    // Average order value
    @Query("SELECT AVG(o.total) FROM Order o WHERE o.paymentStatus = 'COMPLETED'")
    Double getAverageOrderValue();
    
    // Average order value by buyer
    @Query("SELECT AVG(o.total) FROM Order o WHERE o.buyerId = :buyerId AND o.paymentStatus = 'COMPLETED'")
    Double getAverageOrderValueByBuyer(@Param("buyerId") String buyerId);
    
    // Find returnable orders (delivered within return window)
    @Query("SELECT o FROM Order o WHERE o.status = 'DELIVERED' AND o.deliveredAt > :returnCutoff ORDER BY o.deliveredAt DESC")
    List<Order> findReturnableOrdersByBuyer(@Param("returnCutoff") LocalDateTime returnCutoff);
    
    // Search orders
    @Query("SELECT o FROM Order o WHERE " +
           "o.id LIKE %:searchTerm% OR " +
           "o.shippingName LIKE %:searchTerm% OR " +
           "o.billingName LIKE %:searchTerm% OR " +
           "o.trackingNumber LIKE %:searchTerm% " +
           "ORDER BY o.createdAt DESC")
    List<Order> searchOrders(@Param("searchTerm") String searchTerm);
    
    // Additional methods for AdvancedFulfillmentService
    List<Order> findByStatusAndCreatedAtBefore(Order.OrderStatus status, LocalDateTime date);

    // Methods for Commission and Payout Service
    @Query("SELECT o FROM Order o WHERE o.status = :status AND o.deliveredAt BETWEEN :startDate AND :endDate")
    List<Order> findByStatusAndDeliveredAtBetween(@Param("status") String status,
                                                  @Param("startDate") LocalDateTime startDate,
                                                  @Param("endDate") LocalDateTime endDate);

    @Query("SELECT o FROM Order o JOIN o.orderItems oi WHERE oi.sellerId = :sellerId ORDER BY o.createdAt DESC")
    List<Order> findByOrderItemsSellerIdOrderByCreatedAtDesc(@Param("sellerId") String sellerId);
}
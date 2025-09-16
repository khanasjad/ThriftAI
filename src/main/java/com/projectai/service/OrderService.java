package com.projectai.service;

import com.projectai.models.*;
import com.projectai.repository.ProductRepository;
import com.projectai.repository.BuyerRepository;
import com.projectai.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.OptionalDouble;

@Service
@Transactional
public class OrderService {

    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private BuyerRepository buyerRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private CartService cartService;

    public Map<String, Object> initiateOneClickPurchase(String productId, String buyerId, Map<String, Object> purchaseOptions) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Validate product and buyer
            Product product = productRepository.findById(productId).orElse(null);
            Buyer buyer = buyerRepository.findById(buyerId).orElse(null);
            
            if (product == null) {
                response.put("success", false);
                response.put("error", "Product not found");
                return response;
            }
            
            if (buyer == null) {
                response.put("success", false);
                response.put("error", "Buyer not found");
                return response;
            }
            
            if (!product.isAvailable()) {
                response.put("success", false);
                response.put("error", "Product is no longer available");
                return response;
            }
            
            // Create order
            String orderId = "ORD_" + System.currentTimeMillis();
            Map<String, Object> order = createOrder(orderId, product, buyer, purchaseOptions);
            
            // Process payment (mock)
            Map<String, Object> paymentResult = processPayment(order);
            
            if ((Boolean) paymentResult.get("success")) {
                // Complete order
                order.put("status", "CONFIRMED");
                order.put("paymentId", paymentResult.get("paymentId"));
                order.put("estimatedDelivery", calculateDeliveryDate());
                
                // Update product availability
                product.setAvailable(false);
                productRepository.save(product);
                
                response.put("success", true);
                response.put("orderId", orderId);
                response.put("order", order);
                response.put("message", "Order placed successfully!");
                
                // Send confirmation (mock)
                sendOrderConfirmation(order);
                
            } else {
                response.put("success", false);
                response.put("error", paymentResult.get("error"));
            }
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Order processing failed: " + e.getMessage());
        }
        
        return response;
    }

    public Map<String, Object> getOneClickOptions(String productId, String buyerId) {
        Map<String, Object> options = new HashMap<>();
        
        Product product = productRepository.findById(productId).orElse(null);
        Buyer buyer = buyerRepository.findById(buyerId).orElse(null);
        
        if (product == null || buyer == null) {
            options.put("available", false);
            return options;
        }
        
        options.put("available", product.isAvailable());
        options.put("productPrice", product.getPrice());
        
        // Shipping options
        List<Map<String, Object>> shippingOptions = Arrays.asList(
            Map.of(
                "id", "standard",
                "name", "Standard Shipping",
                "price", 5.99,
                "estimatedDays", "3-5 business days",
                "description", "Reliable and affordable"
            ),
            Map.of(
                "id", "express",
                "name", "Express Shipping", 
                "price", 12.99,
                "estimatedDays", "1-2 business days",
                "description", "Fast delivery"
            ),
            Map.of(
                "id", "overnight",
                "name", "Overnight Delivery",
                "price", 24.99,
                "estimatedDays", "Next business day",
                "description", "Get it tomorrow"
            )
        );
        options.put("shippingOptions", shippingOptions);
        
        // Payment methods (mock stored payment methods)
        List<Map<String, Object>> paymentMethods = Arrays.asList(
            Map.of(
                "id", "card_001",
                "type", "credit_card",
                "lastFour", "4242",
                "brand", "Visa",
                "expiryMonth", 12,
                "expiryYear", 2026,
                "isDefault", true
            ),
            Map.of(
                "id", "paypal_001",
                "type", "paypal",
                "email", "user@example.com",
                "isDefault", false
            )
        );
        options.put("paymentMethods", paymentMethods);
        
        // Delivery addresses (mock)
        List<Map<String, Object>> addresses = Arrays.asList(
            Map.of(
                "id", "addr_001",
                "type", "home",
                "street", "123 Main St",
                "city", "New York",
                "state", "NY",
                "zipCode", "10001",
                "country", "US",
                "isDefault", true
            ),
            Map.of(
                "id", "addr_002", 
                "type", "work",
                "street", "456 Office Blvd",
                "city", "New York",
                "state", "NY", 
                "zipCode", "10002",
                "country", "US",
                "isDefault", false
            )
        );
        options.put("deliveryAddresses", addresses);
        
        // Calculate total cost with default options
        double subtotal = product.getPrice();
        double shipping = 5.99; // Default standard shipping
        double tax = subtotal * 0.08; // 8% tax
        double total = subtotal + shipping + tax;
        
        options.put("pricing", Map.of(
            "subtotal", Math.round(subtotal * 100.0) / 100.0,
            "shipping", shipping,
            "tax", Math.round(tax * 100.0) / 100.0,
            "total", Math.round(total * 100.0) / 100.0
        ));
        
        return options;
    }

    private Map<String, Object> createOrder(String orderId, Product product, Buyer buyer, Map<String, Object> options) {
        Map<String, Object> order = new HashMap<>();
        
        order.put("orderId", orderId);
        order.put("productId", product.getId());
        order.put("productName", product.getName());
        order.put("productPrice", product.getPrice());
        order.put("buyerId", buyer.getId());
        order.put("buyerName", buyer.getFirstName() + " " + buyer.getLastName());
        order.put("buyerEmail", buyer.getEmail());
        order.put("orderDate", LocalDateTime.now());
        order.put("status", "PROCESSING");
        
        // Add selected options
        String shippingId = (String) options.getOrDefault("shippingOption", "standard");
        String paymentId = (String) options.getOrDefault("paymentMethod", "card_001");
        String addressId = (String) options.getOrDefault("deliveryAddress", "addr_001");
        
        order.put("shippingOption", shippingId);
        order.put("paymentMethod", paymentId);
        order.put("deliveryAddress", addressId);
        
        // Calculate pricing
        double subtotal = product.getPrice();
        double shipping = getShippingCost(shippingId);
        double tax = subtotal * 0.08;
        double total = subtotal + shipping + tax;
        
        order.put("subtotal", Math.round(subtotal * 100.0) / 100.0);
        order.put("shipping", shipping);
        order.put("tax", Math.round(tax * 100.0) / 100.0);
        order.put("total", Math.round(total * 100.0) / 100.0);
        
        return order;
    }

    private Map<String, Object> processPayment(Map<String, Object> order) {
        Map<String, Object> result = new HashMap<>();
        
        // Mock payment processing
        try {
            // Simulate payment processing delay
            Thread.sleep(1000);
            
            // Mock payment success (95% success rate)
            if (Math.random() < 0.95) {
                String paymentId = "PAY_" + System.currentTimeMillis();
                result.put("success", true);
                result.put("paymentId", paymentId);
                result.put("transactionAmount", order.get("total"));
                result.put("paymentMethod", order.get("paymentMethod"));
                result.put("processedAt", LocalDateTime.now());
            } else {
                result.put("success", false);
                result.put("error", "Payment declined. Please try a different payment method.");
            }
            
        } catch (InterruptedException e) {
            result.put("success", false);
            result.put("error", "Payment processing timeout");
        }
        
        return result;
    }

    private double getShippingCost(String shippingId) {
        switch (shippingId) {
            case "express": return 12.99;
            case "overnight": return 24.99;
            default: return 5.99; // standard
        }
    }

    private LocalDateTime calculateDeliveryDate() {
        // Add 3-5 business days for standard shipping
        return LocalDateTime.now().plusDays(4);
    }

    private void sendOrderConfirmation(Map<String, Object> order) {
        // Mock email/SMS confirmation
        System.out.println("Order confirmation sent for order: " + order.get("orderId"));
    }

    public Map<String, Object> getOrderStatus(String orderId) {
        // Mock order tracking
        Map<String, Object> tracking = new HashMap<>();
        tracking.put("orderId", orderId);
        tracking.put("status", "IN_TRANSIT");
        tracking.put("trackingNumber", "TRK" + orderId.substring(4));
        
        List<Map<String, Object>> trackingEvents = Arrays.asList(
            Map.of(
                "timestamp", LocalDateTime.now().minusHours(24),
                "status", "ORDER_CONFIRMED",
                "description", "Order confirmed and being prepared",
                "location", "Warehouse - New York"
            ),
            Map.of(
                "timestamp", LocalDateTime.now().minusHours(18),
                "status", "PICKED_UP",
                "description", "Package picked up by carrier",
                "location", "Distribution Center - New York"
            ),
            Map.of(
                "timestamp", LocalDateTime.now().minusHours(6),
                "status", "IN_TRANSIT",
                "description", "Package is on the way",
                "location", "Distribution Center - Philadelphia"
            )
        );
        
        tracking.put("events", trackingEvents);
        tracking.put("estimatedDelivery", LocalDateTime.now().plusDays(2));
        
        return tracking;
    }

    public List<Map<String, Object>> getBuyerOrders(String buyerId) {
        // Mock order history
        List<Map<String, Object>> orders = new ArrayList<>();
        
        orders.add(Map.of(
            "orderId", "ORD_1699123456789",
            "productName", "Nike Air Max Sneakers",
            "productPrice", 65.00,
            "orderDate", LocalDateTime.now().minusDays(5),
            "status", "DELIVERED",
            "total", 77.99
        ));
        
        orders.add(Map.of(
            "orderId", "ORD_1699023456789",
            "productName", "Vintage Levi's 501 Jeans",
            "productPrice", 45.99,
            "orderDate", LocalDateTime.now().minusDays(12),
            "status", "DELIVERED",
            "total", 57.47
        ));
        
        return orders;
    }

    public Map<String, Object> cancelOrder(String orderId) {
        Map<String, Object> result = new HashMap<>();
        
        // Mock cancellation logic
        result.put("success", true);
        result.put("orderId", orderId);
        result.put("status", "CANCELLED");
        result.put("refundAmount", 77.99);
        result.put("refundProcessingTime", "3-5 business days");
        result.put("message", "Order cancelled successfully. Refund will be processed to your original payment method.");
        
        return result;
    }

    public Map<String, Object> getQuickBuySettings(String buyerId) {
        // Return user's quick buy preferences
        Map<String, Object> settings = new HashMap<>();
        
        settings.put("oneClickEnabled", true);
        settings.put("defaultPaymentMethod", "card_001");
        settings.put("defaultShippingOption", "standard");
        settings.put("defaultDeliveryAddress", "addr_001");
        settings.put("requireConfirmation", false);
        settings.put("maxOrderAmount", 500.00);
        
        return settings;
    }

    public Map<String, Object> updateQuickBuySettings(String buyerId, Map<String, Object> newSettings) {
        // Mock updating user preferences
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Quick buy settings updated successfully");
        result.put("settings", newSettings);
        
        return result;
    }
    
    // New checkout methods
    public Order createOrderFromCart(String sessionId, String buyerId, Map<String, Object> orderData) {
        // Get cart items
        List<CartItem> cartItems = cartService.getCartItems(sessionId, buyerId);
        
        if (cartItems.isEmpty()) {
            throw new IllegalStateException("Cannot create order from empty cart");
        }
        
        // Validate cart
        Map<String, Object> cartValidation = cartService.validateCart(sessionId, buyerId);
        if (!(Boolean) cartValidation.get("isValid")) {
            throw new IllegalStateException("Cart validation failed: " + cartValidation.get("errors"));
        }
        
        // Create order
        Order order = new Order(buyerId, sessionId);
        populateOrderFromData(order, orderData);
        
        // Calculate totals
        Map<String, Object> cartSummary = cartService.getCartSummary(sessionId, buyerId);
        order.setSubtotal((Double) cartSummary.get("subtotal"));
        order.setTax((Double) cartSummary.get("estimatedTax"));
        order.setShipping((Double) cartSummary.get("estimatedShipping"));
        order.setTotal((Double) cartSummary.get("total"));
        
        // Set estimated delivery (5-7 business days)
        order.setEstimatedDelivery(LocalDateTime.now().plusDays(7));
        
        // Save order first
        order = orderRepository.save(order);
        
        // Create order items
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cartItems) {
            if (cartItem.getProduct() != null && cartItem.getProduct().isAvailable()) {
                OrderItem orderItem = new OrderItem(order, cartItem.getProduct(), cartItem.getQuantity());
                orderItems.add(orderItem);
            }
        }
        order.setOrderItems(orderItems);
        
        // Save order with items
        order = orderRepository.save(order);
        
        // Clear cart after successful order creation
        cartService.clearCart(sessionId, buyerId);
        
        return order;
    }
    
    // Process payment and confirm order
    public Order processPayment(String orderId, Map<String, Object> paymentData) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        
        if (order.getPaymentStatus() != Order.PaymentStatus.PENDING) {
            throw new IllegalStateException("Order payment already processed");
        }
        
        try {
            // Mock payment processing
            boolean paymentSuccess = processPaymentWithProvider(paymentData);
            
            if (paymentSuccess) {
                order.setPaymentStatus(Order.PaymentStatus.COMPLETED);
                order.setStatus(Order.OrderStatus.CONFIRMED);
                order.setPaymentMethod((String) paymentData.get("paymentMethod"));
                order.setPaymentTransactionId(generateTransactionId());
                
            } else {
                order.setPaymentStatus(Order.PaymentStatus.FAILED);
            }
            
        } catch (Exception e) {
            order.setPaymentStatus(Order.PaymentStatus.FAILED);
            throw new RuntimeException("Payment processing failed: " + e.getMessage(), e);
        }
        
        return orderRepository.save(order);
    }
    
    // Get orders for buyer (JPA-based)
    public List<Order> getBuyerOrdersJPA(String buyerId) {
        return orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId);
    }
    
    // Get order by ID (JPA-based)
    public Optional<Order> getOrderByIdJPA(String orderId) {
        return orderRepository.findById(orderId);
    }
    
    // Update order status
    public Order updateOrderStatus(String orderId, Order.OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        
        Order.OrderStatus oldStatus = order.getStatus();
        order.setStatus(newStatus);
        
        // Set timestamps based on status changes
        if (newStatus == Order.OrderStatus.SHIPPED && oldStatus != Order.OrderStatus.SHIPPED) {
            order.setShippedAt(LocalDateTime.now());
            order.setTrackingNumber(generateTrackingNumber());
        } else if (newStatus == Order.OrderStatus.DELIVERED && oldStatus != Order.OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
        }
        
        return orderRepository.save(order);
    }
    
    // Get order analytics
    public Map<String, Object> getOrderAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        
        // Basic counts
        analytics.put("totalOrders", orderRepository.count());
        analytics.put("pendingOrders", orderRepository.countByStatus(Order.OrderStatus.PENDING));
        analytics.put("confirmedOrders", orderRepository.countByStatus(Order.OrderStatus.CONFIRMED));
        analytics.put("shippedOrders", orderRepository.countByStatus(Order.OrderStatus.SHIPPED));
        analytics.put("deliveredOrders", orderRepository.countByStatus(Order.OrderStatus.DELIVERED));
        analytics.put("cancelledOrders", orderRepository.countByStatus(Order.OrderStatus.CANCELLED));
        
        // Revenue
        analytics.put("totalRevenue", orderRepository.getTotalRevenue());
        analytics.put("averageOrderValue", orderRepository.getAverageOrderValue());
        
        return analytics;
    }
    
    // Private helper methods
    private void populateOrderFromData(Order order, Map<String, Object> orderData) {
        // Shipping address
        order.setShippingName((String) orderData.get("shippingName"));
        order.setShippingAddress((String) orderData.get("shippingAddress"));
        order.setShippingCity((String) orderData.get("shippingCity"));
        order.setShippingState((String) orderData.get("shippingState"));
        order.setShippingZip((String) orderData.get("shippingZip"));
        order.setShippingCountry((String) orderData.getOrDefault("shippingCountry", "US"));
        order.setShippingPhone((String) orderData.get("shippingPhone"));
        
        // Billing address
        order.setBillingName((String) orderData.get("billingName"));
        order.setBillingAddress((String) orderData.get("billingAddress"));
        order.setBillingCity((String) orderData.get("billingCity"));
        order.setBillingState((String) orderData.get("billingState"));
        order.setBillingZip((String) orderData.get("billingZip"));
        order.setBillingCountry((String) orderData.getOrDefault("billingCountry", "US"));
        
        // Notes
        order.setOrderNotes((String) orderData.get("orderNotes"));
    }
    
    private boolean processPaymentWithProvider(Map<String, Object> paymentData) {
        // Mock payment processing - in real implementation, integrate with Stripe, PayPal, etc.
        String paymentMethod = (String) paymentData.get("paymentMethod");
        
        // Simulate different success rates for different payment methods
        switch (paymentMethod != null ? paymentMethod.toLowerCase() : "") {
            case "credit_card":
                return Math.random() > 0.05; // 95% success rate
            case "paypal":
                return Math.random() > 0.02; // 98% success rate
            case "apple_pay":
                return Math.random() > 0.01; // 99% success rate
            default:
                return Math.random() > 0.10; // 90% success rate
        }
    }
    
    private String generateTransactionId() {
        return "TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    private String generateTrackingNumber() {
        return "TH" + System.currentTimeMillis() + String.format("%04d", (int) (Math.random() * 10000));
    }
    
    // Order history and dashboard methods
    public List<Order> getSessionOrdersJPA(String sessionId) {
        return orderRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
    }
    
    public Map<String, Object> getBuyerOrderStats(String buyerId) {
        List<Order> orders = orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", orders.size());
        stats.put("totalSpent", orders.stream().mapToDouble(Order::getTotal).sum());
        
        long completedOrders = orders.stream()
            .filter(o -> o.getStatus() == Order.OrderStatus.DELIVERED)
            .count();
        stats.put("completedOrders", completedOrders);
        
        long pendingOrders = orders.stream()
            .filter(o -> o.getStatus() == Order.OrderStatus.PENDING || 
                         o.getStatus() == Order.OrderStatus.CONFIRMED ||
                         o.getStatus() == Order.OrderStatus.PROCESSING)
            .count();
        stats.put("pendingOrders", pendingOrders);
        
        long shippedOrders = orders.stream()
            .filter(o -> o.getStatus() == Order.OrderStatus.SHIPPED)
            .count();
        stats.put("shippedOrders", shippedOrders);
        
        // Recent orders (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long recentOrders = orders.stream()
            .filter(o -> o.getCreatedAt().isAfter(thirtyDaysAgo))
            .count();
        stats.put("recentOrders", recentOrders);
        
        // Average order value
        OptionalDouble avgOrderValue = orders.stream()
            .mapToDouble(Order::getTotal)
            .average();
        stats.put("averageOrderValue", avgOrderValue.orElse(0.0));
        
        return stats;
    }
    
    public Map<String, Object> getSessionOrderStats(String sessionId) {
        List<Order> orders = orderRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", orders.size());
        stats.put("totalSpent", orders.stream().mapToDouble(Order::getTotal).sum());
        
        long completedOrders = orders.stream()
            .filter(o -> o.getStatus() == Order.OrderStatus.DELIVERED)
            .count();
        stats.put("completedOrders", completedOrders);
        
        long pendingOrders = orders.stream()
            .filter(o -> o.getStatus() == Order.OrderStatus.PENDING || 
                         o.getStatus() == Order.OrderStatus.CONFIRMED ||
                         o.getStatus() == Order.OrderStatus.PROCESSING)
            .count();
        stats.put("pendingOrders", pendingOrders);
        
        long shippedOrders = orders.stream()
            .filter(o -> o.getStatus() == Order.OrderStatus.SHIPPED)
            .count();
        stats.put("shippedOrders", shippedOrders);
        
        // Recent orders (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long recentOrders = orders.stream()
            .filter(o -> o.getCreatedAt().isAfter(thirtyDaysAgo))
            .count();
        stats.put("recentOrders", recentOrders);
        
        // Average order value
        OptionalDouble avgOrderValue = orders.stream()
            .mapToDouble(Order::getTotal)
            .average();
        stats.put("averageOrderValue", avgOrderValue.orElse(0.0));
        
        return stats;
    }
}
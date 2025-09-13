package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.models.Buyer;
import com.projectai.repository.ProductRepository;
import com.projectai.repository.BuyerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class OrderService {

    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private BuyerRepository buyerRepository;

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
}
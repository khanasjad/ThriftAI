package com.projectai.controller;

import com.projectai.models.Order;
import com.projectai.repository.OrderRepository;
import com.projectai.service.MockPaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private MockPaymentService mockPaymentService;

    @Autowired
    private OrderRepository orderRepository;

    @PostMapping("/create-payment-intent")
    public ResponseEntity<Map<String, Object>> createPaymentIntent(@RequestBody Map<String, String> request) {
        try {
            String orderId = request.get("order_id");

            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Order not found"));
            }

            Order order = orderOpt.get();
            Map<String, Object> paymentIntent = mockPaymentService.createPaymentIntent(order);

            logger.info("Created payment intent for order: {}", orderId);
            return ResponseEntity.ok(paymentIntent);

        } catch (Exception e) {
            logger.error("Error creating payment intent", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to create payment intent"));
        }
    }

    @PostMapping("/confirm-payment")
    public ResponseEntity<Map<String, Object>> confirmPayment(@RequestBody Map<String, Object> request) {
        try {
            String paymentIntentId = (String) request.get("payment_intent_id");
            String orderId = (String) request.get("order_id");
            @SuppressWarnings("unchecked")
            Map<String, String> paymentMethod = (Map<String, String>) request.get("payment_method");

            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Order not found"));
            }

            Order order = orderOpt.get();

            // Process payment using mock service
            MockPaymentService.MockPaymentResult result = mockPaymentService.processPayment(
                order,
                paymentMethod.getOrDefault("type", "card"),
                paymentMethod
            );

            if (result.isSuccess()) {
                // Update order with payment information
                order.setPaymentStatus(Order.PaymentStatus.COMPLETED);
                order.setPaymentTransactionId(result.getTransactionId());
                order.setPaymentMethod(result.getPaymentMethod());
                order.setStatus(Order.OrderStatus.CONFIRMED);
                order.setUpdatedAt(LocalDateTime.now());

                orderRepository.save(order);

                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("transaction_id", result.getTransactionId());
                response.put("message", result.getMessage());
                response.put("order_status", order.getStatus());

                logger.info("Payment confirmed for order: {}", orderId);
                return ResponseEntity.ok(response);
            } else {
                // Update order with failed payment
                order.setPaymentStatus(Order.PaymentStatus.FAILED);
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);

                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", result.getMessage());

                logger.warn("Payment failed for order: {}", orderId);
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            logger.error("Error confirming payment", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to process payment"));
        }
    }

    @PostMapping("/refund")
    public ResponseEntity<Map<String, Object>> processRefund(@RequestBody Map<String, Object> request) {
        try {
            String transactionId = (String) request.get("transaction_id");
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            String reason = (String) request.get("reason");

            MockPaymentService.MockRefundResult result = mockPaymentService.processRefund(transactionId, amount, reason);

            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("refund_id", result.getRefundId());
            response.put("message", result.getMessage());

            logger.info("Refund processed for transaction: {}", transactionId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error processing refund", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to process refund"));
        }
    }

    @GetMapping("/payment-methods")
    public ResponseEntity<Map<String, Object>> getAvailablePaymentMethods() {
        Map<String, Object> paymentMethods = new HashMap<>();

        // Mock available payment methods
        paymentMethods.put("card", Map.of(
            "enabled", true,
            "types", new String[]{"visa", "mastercard", "amex", "discover"}
        ));

        paymentMethods.put("paypal", Map.of(
            "enabled", true,
            "description", "Pay with PayPal"
        ));

        paymentMethods.put("apple_pay", Map.of(
            "enabled", true,
            "description", "Pay with Apple Pay"
        ));

        return ResponseEntity.ok(paymentMethods);
    }

    @GetMapping("/order/{orderId}/payment-status")
    public ResponseEntity<Map<String, Object>> getOrderPaymentStatus(@PathVariable String orderId) {
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Order order = orderOpt.get();
            Map<String, Object> status = new HashMap<>();
            status.put("order_id", order.getId());
            status.put("payment_status", order.getPaymentStatus());
            status.put("order_status", order.getStatus());
            status.put("payment_method", order.getPaymentMethod());
            status.put("transaction_id", order.getPaymentTransactionId());
            status.put("total", order.getTotal());

            return ResponseEntity.ok(status);

        } catch (Exception e) {
            logger.error("Error getting payment status for order: {}", orderId, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get payment status"));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "healthy");
        health.put("service", "mock-payment-service");
        health.put("timestamp", LocalDateTime.now());
        health.put("features", new String[]{"payment_processing", "refunds", "payment_intents"});

        return ResponseEntity.ok(health);
    }
}
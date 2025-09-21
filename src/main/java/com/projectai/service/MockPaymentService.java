package com.projectai.service;

import com.projectai.models.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class MockPaymentService {

    private static final Logger logger = LoggerFactory.getLogger(MockPaymentService.class);

    public MockPaymentResult processPayment(Order order, String paymentMethod, Map<String, String> paymentDetails) {
        logger.info("Processing mock payment for order: {} with method: {}", order.getId(), paymentMethod);

        try {
            // Simulate payment processing delay
            Thread.sleep(1000);

            // Mock payment logic - simulate success/failure based on order total
            boolean isSuccess = simulatePaymentOutcome(order.getTotal());

            String transactionId = "mock_" + UUID.randomUUID().toString().substring(0, 8);

            if (isSuccess) {
                logger.info("Mock payment successful for order: {}", order.getId());
                return new MockPaymentResult(true, transactionId, "Payment processed successfully", paymentMethod);
            } else {
                logger.warn("Mock payment failed for order: {}", order.getId());
                return new MockPaymentResult(false, null, "Payment declined - insufficient funds", paymentMethod);
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.error("Payment processing interrupted for order: {}", order.getId());
            return new MockPaymentResult(false, null, "Payment processing error", paymentMethod);
        }
    }

    public MockRefundResult processRefund(String transactionId, BigDecimal amount, String reason) {
        logger.info("Processing mock refund for transaction: {} amount: {}", transactionId, amount);

        try {
            // Simulate refund processing delay
            Thread.sleep(500);

            String refundId = "refund_" + UUID.randomUUID().toString().substring(0, 8);

            // Mock refunds always succeed for demo purposes
            logger.info("Mock refund successful: {}", refundId);
            return new MockRefundResult(true, refundId, "Refund processed successfully");

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.error("Refund processing interrupted for transaction: {}", transactionId);
            return new MockRefundResult(false, null, "Refund processing error");
        }
    }

    public Map<String, Object> createPaymentIntent(Order order) {
        logger.info("Creating mock payment intent for order: {}", order.getId());

        String clientSecret = "pi_mock_" + UUID.randomUUID().toString().replace("-", "");

        Map<String, Object> paymentIntent = new HashMap<>();
        paymentIntent.put("id", "pi_" + UUID.randomUUID().toString().substring(0, 8));
        paymentIntent.put("client_secret", clientSecret);
        paymentIntent.put("amount", BigDecimal.valueOf(order.getTotal()).multiply(BigDecimal.valueOf(100)).intValue()); // Convert to cents
        paymentIntent.put("currency", "usd");
        paymentIntent.put("status", "requires_payment_method");
        paymentIntent.put("created", LocalDateTime.now().toString());

        return paymentIntent;
    }

    public Map<String, Object> confirmPayment(String paymentIntentId, Map<String, String> paymentMethod) {
        logger.info("Confirming mock payment intent: {}", paymentIntentId);

        Map<String, Object> result = new HashMap<>();
        result.put("id", paymentIntentId);
        result.put("status", "succeeded");
        result.put("amount_received", 2500); // Mock amount in cents
        result.put("payment_method", paymentMethod.getOrDefault("type", "card"));
        result.put("confirmed_at", LocalDateTime.now().toString());

        return result;
    }

    private boolean simulatePaymentOutcome(double total) {
        // Mock logic: payments over $1000 have 10% failure rate, others 5% failure rate
        double failureRate = total > 1000 ? 0.10 : 0.05;
        return Math.random() > failureRate;
    }

    public static class MockPaymentResult {
        private final boolean success;
        private final String transactionId;
        private final String message;
        private final String paymentMethod;

        public MockPaymentResult(boolean success, String transactionId, String message, String paymentMethod) {
            this.success = success;
            this.transactionId = transactionId;
            this.message = message;
            this.paymentMethod = paymentMethod;
        }

        public boolean isSuccess() { return success; }
        public String getTransactionId() { return transactionId; }
        public String getMessage() { return message; }
        public String getPaymentMethod() { return paymentMethod; }
    }

    public static class MockRefundResult {
        private final boolean success;
        private final String refundId;
        private final String message;

        public MockRefundResult(boolean success, String refundId, String message) {
            this.success = success;
            this.refundId = refundId;
            this.message = message;
        }

        public boolean isSuccess() { return success; }
        public String getRefundId() { return refundId; }
        public String getMessage() { return message; }
    }
}
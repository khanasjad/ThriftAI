package com.projectai.service;

import com.projectai.models.Order;
import com.projectai.models.OrderItem;
import com.projectai.models.Seller;
import com.projectai.repository.OrderRepository;
import com.projectai.repository.SellerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CommissionPayoutService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private SellerRepository sellerRepository;

    @Value("${commission.processing.fee:0.029}")
    private double processingFeeRate;

    @Value("${commission.minimum.payout:10.0}")
    private double minimumPayoutAmount;

    @Value("${commission.payout.schedule:weekly}")
    private String payoutSchedule;

    public PayoutSummary calculateSellerPayout(String sellerId, LocalDate startDate, LocalDate endDate) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found: " + sellerId));

        List<Order> completedOrders = orderRepository.findByStatusAndDeliveredAtBetween(
                "DELIVERED", startDate.atStartOfDay(), endDate.atTime(23, 59, 59));

        double totalSales = 0.0;
        double totalCommission = 0.0;
        double totalProcessingFees = 0.0;
        int totalItemsSold = 0;
        Map<String, Integer> categorySales = new HashMap<>();
        List<OrderCommissionDetail> orderDetails = new ArrayList<>();

        for (Order order : completedOrders) {
            for (OrderItem item : order.getOrderItems()) {
                if (sellerId.equals(item.getSellerId())) {
                    double itemTotal = item.getTotalPrice();
                    double commission = itemTotal * seller.getCommissionRate();
                    double processingFee = itemTotal * processingFeeRate;
                    double sellerPayout = itemTotal - commission - processingFee;

                    totalSales += itemTotal;
                    totalCommission += commission;
                    totalProcessingFees += processingFee;
                    totalItemsSold++;

                    String category = item.getProductCategory() != null ? item.getProductCategory() : "Other";
                    categorySales.merge(category, 1, Integer::sum);

                    orderDetails.add(new OrderCommissionDetail(
                            order.getId(),
                            item.getId(),
                            item.getProductName(),
                            itemTotal,
                            commission,
                            processingFee,
                            sellerPayout,
                            order.getDeliveredAt()
                    ));
                }
            }
        }

        double netPayout = totalSales - totalCommission - totalProcessingFees;

        return new PayoutSummary(
                sellerId,
                seller.getBusinessName(),
                startDate,
                endDate,
                totalSales,
                totalCommission,
                totalProcessingFees,
                netPayout,
                totalItemsSold,
                categorySales,
                orderDetails,
                seller.getCommissionRate() * 100,
                processingFeeRate * 100
        );
    }

    public List<SellerPayoutOverview> getAllSellerPayouts(LocalDate startDate, LocalDate endDate) {
        List<Seller> activeSellers = sellerRepository.findByIsActiveTrue();
        List<SellerPayoutOverview> payouts = new ArrayList<>();

        for (Seller seller : activeSellers) {
            PayoutSummary summary = calculateSellerPayout(seller.getId(), startDate, endDate);
            if (summary.getNetPayout() >= minimumPayoutAmount) {
                payouts.add(new SellerPayoutOverview(
                        seller.getId(),
                        seller.getBusinessName(),
                        seller.getEmail(),
                        summary.getTotalSales(),
                        summary.getNetPayout(),
                        summary.getTotalItemsSold(),
                        seller.getCommissionRate() * 100,
                        PayoutStatus.PENDING
                ));
            }
        }

        return payouts.stream()
                .sorted((a, b) -> Double.compare(b.getNetPayout(), a.getNetPayout()))
                .collect(Collectors.toList());
    }

    public PayoutProcessingResult processPayouts(List<String> sellerIds, LocalDate startDate, LocalDate endDate) {
        List<PayoutTransaction> successfulPayouts = new ArrayList<>();
        List<PayoutError> errors = new ArrayList<>();
        double totalAmount = 0.0;

        for (String sellerId : sellerIds) {
            try {
                PayoutSummary summary = calculateSellerPayout(sellerId, startDate, endDate);

                if (summary.getNetPayout() < minimumPayoutAmount) {
                    errors.add(new PayoutError(sellerId,
                            "Payout amount below minimum threshold: $" + minimumPayoutAmount));
                    continue;
                }

                Seller seller = sellerRepository.findById(sellerId).orElse(null);
                if (seller == null) {
                    errors.add(new PayoutError(sellerId, "Seller not found"));
                    continue;
                }

                String transactionId = processPayoutTransaction(seller, summary.getNetPayout());

                successfulPayouts.add(new PayoutTransaction(
                        transactionId,
                        sellerId,
                        seller.getBusinessName(),
                        summary.getNetPayout(),
                        LocalDateTime.now(),
                        PayoutStatus.COMPLETED
                ));

                totalAmount += summary.getNetPayout();

            } catch (Exception e) {
                errors.add(new PayoutError(sellerId, "Processing failed: " + e.getMessage()));
            }
        }

        return new PayoutProcessingResult(
                successfulPayouts,
                errors,
                totalAmount,
                LocalDateTime.now()
        );
    }

    private String processPayoutTransaction(Seller seller, double amount) {
        String transactionId = "PAY_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return transactionId;
    }

    public SellerDashboardData getSellerDashboard(String sellerId) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found: " + sellerId));

        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate lastMonthStart = monthStart.minusMonths(1);
        LocalDate lastMonthEnd = monthStart.minusDays(1);

        PayoutSummary currentMonth = calculateSellerPayout(sellerId, monthStart, today);
        PayoutSummary lastMonth = calculateSellerPayout(sellerId, lastMonthStart, lastMonthEnd);

        List<Order> recentOrders = orderRepository.findByOrderItemsSellerIdOrderByCreatedAtDesc(sellerId)
                .stream().limit(10).collect(Collectors.toList());

        Map<String, Double> monthlyTrends = calculateMonthlyTrends(sellerId, 6);

        double pendingPayout = currentMonth.getNetPayout();
        LocalDate nextPayoutDate = calculateNextPayoutDate();

        return new SellerDashboardData(
                seller.getId(),
                seller.getBusinessName(),
                currentMonth.getTotalSales(),
                currentMonth.getNetPayout(),
                currentMonth.getTotalItemsSold(),
                lastMonth.getTotalSales(),
                lastMonth.getNetPayout(),
                lastMonth.getTotalItemsSold(),
                pendingPayout,
                nextPayoutDate,
                seller.getCommissionRate() * 100,
                recentOrders,
                monthlyTrends,
                currentMonth.getCategorySales()
        );
    }

    private Map<String, Double> calculateMonthlyTrends(String sellerId, int months) {
        Map<String, Double> trends = new LinkedHashMap<>();
        LocalDate endDate = LocalDate.now();

        for (int i = months - 1; i >= 0; i--) {
            LocalDate monthStart = endDate.minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);

            PayoutSummary summary = calculateSellerPayout(sellerId, monthStart, monthEnd);
            String monthKey = monthStart.getMonth().toString().substring(0, 3) + " " + monthStart.getYear();
            trends.put(monthKey, summary.getTotalSales());
        }

        return trends;
    }

    private LocalDate calculateNextPayoutDate() {
        LocalDate today = LocalDate.now();
        if ("weekly".equals(payoutSchedule)) {
            return today.plusWeeks(1).with(java.time.DayOfWeek.FRIDAY);
        } else if ("monthly".equals(payoutSchedule)) {
            return today.plusMonths(1).withDayOfMonth(1);
        }
        return today.plusDays(7);
    }

    public CommissionAnalytics getCommissionAnalytics(LocalDate startDate, LocalDate endDate) {
        List<SellerPayoutOverview> allPayouts = getAllSellerPayouts(startDate, endDate);

        double totalPlatformRevenue = allPayouts.stream()
                .mapToDouble(p -> p.getTotalSales() - p.getNetPayout())
                .sum();

        double totalSales = allPayouts.stream()
                .mapToDouble(SellerPayoutOverview::getTotalSales)
                .sum();

        int totalTransactions = allPayouts.stream()
                .mapToInt(SellerPayoutOverview::getTotalItemsSold)
                .sum();

        double averageCommissionRate = allPayouts.stream()
                .mapToDouble(SellerPayoutOverview::getCommissionRate)
                .average()
                .orElse(0.0);

        Map<String, Double> topSellersByRevenue = allPayouts.stream()
                .sorted((a, b) -> Double.compare(b.getTotalSales(), a.getTotalSales()))
                .limit(10)
                .collect(Collectors.toMap(
                        SellerPayoutOverview::getBusinessName,
                        SellerPayoutOverview::getTotalSales,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));

        return new CommissionAnalytics(
                totalPlatformRevenue,
                totalSales,
                totalTransactions,
                averageCommissionRate,
                allPayouts.size(),
                topSellersByRevenue,
                startDate,
                endDate
        );
    }

    public static class PayoutSummary {
        private String sellerId;
        private String businessName;
        private LocalDate startDate;
        private LocalDate endDate;
        private double totalSales;
        private double totalCommission;
        private double totalProcessingFees;
        private double netPayout;
        private int totalItemsSold;
        private Map<String, Integer> categorySales;
        private List<OrderCommissionDetail> orderDetails;
        private double commissionRate;
        private double processingFeeRate;

        public PayoutSummary(String sellerId, String businessName, LocalDate startDate, LocalDate endDate,
                           double totalSales, double totalCommission, double totalProcessingFees, double netPayout,
                           int totalItemsSold, Map<String, Integer> categorySales,
                           List<OrderCommissionDetail> orderDetails, double commissionRate, double processingFeeRate) {
            this.sellerId = sellerId;
            this.businessName = businessName;
            this.startDate = startDate;
            this.endDate = endDate;
            this.totalSales = totalSales;
            this.totalCommission = totalCommission;
            this.totalProcessingFees = totalProcessingFees;
            this.netPayout = netPayout;
            this.totalItemsSold = totalItemsSold;
            this.categorySales = categorySales;
            this.orderDetails = orderDetails;
            this.commissionRate = commissionRate;
            this.processingFeeRate = processingFeeRate;
        }

        public String getSellerId() { return sellerId; }
        public String getBusinessName() { return businessName; }
        public LocalDate getStartDate() { return startDate; }
        public LocalDate getEndDate() { return endDate; }
        public double getTotalSales() { return totalSales; }
        public double getTotalCommission() { return totalCommission; }
        public double getTotalProcessingFees() { return totalProcessingFees; }
        public double getNetPayout() { return netPayout; }
        public int getTotalItemsSold() { return totalItemsSold; }
        public Map<String, Integer> getCategorySales() { return categorySales; }
        public List<OrderCommissionDetail> getOrderDetails() { return orderDetails; }
        public double getCommissionRate() { return commissionRate; }
        public double getProcessingFeeRate() { return processingFeeRate; }
    }

    public static class OrderCommissionDetail {
        private String orderId;
        private String orderItemId;
        private String productName;
        private double itemTotal;
        private double commission;
        private double processingFee;
        private double sellerPayout;
        private LocalDateTime deliveredAt;

        public OrderCommissionDetail(String orderId, String orderItemId, String productName, double itemTotal,
                                   double commission, double processingFee, double sellerPayout, LocalDateTime deliveredAt) {
            this.orderId = orderId;
            this.orderItemId = orderItemId;
            this.productName = productName;
            this.itemTotal = itemTotal;
            this.commission = commission;
            this.processingFee = processingFee;
            this.sellerPayout = sellerPayout;
            this.deliveredAt = deliveredAt;
        }

        public String getOrderId() { return orderId; }
        public String getOrderItemId() { return orderItemId; }
        public String getProductName() { return productName; }
        public double getItemTotal() { return itemTotal; }
        public double getCommission() { return commission; }
        public double getProcessingFee() { return processingFee; }
        public double getSellerPayout() { return sellerPayout; }
        public LocalDateTime getDeliveredAt() { return deliveredAt; }
    }

    public static class SellerPayoutOverview {
        private String sellerId;
        private String businessName;
        private String email;
        private double totalSales;
        private double netPayout;
        private int totalItemsSold;
        private double commissionRate;
        private PayoutStatus status;

        public SellerPayoutOverview(String sellerId, String businessName, String email, double totalSales,
                                  double netPayout, int totalItemsSold, double commissionRate, PayoutStatus status) {
            this.sellerId = sellerId;
            this.businessName = businessName;
            this.email = email;
            this.totalSales = totalSales;
            this.netPayout = netPayout;
            this.totalItemsSold = totalItemsSold;
            this.commissionRate = commissionRate;
            this.status = status;
        }

        public String getSellerId() { return sellerId; }
        public String getBusinessName() { return businessName; }
        public String getEmail() { return email; }
        public double getTotalSales() { return totalSales; }
        public double getNetPayout() { return netPayout; }
        public int getTotalItemsSold() { return totalItemsSold; }
        public double getCommissionRate() { return commissionRate; }
        public PayoutStatus getStatus() { return status; }
    }

    public static class PayoutProcessingResult {
        private List<PayoutTransaction> successfulPayouts;
        private List<PayoutError> errors;
        private double totalAmountProcessed;
        private LocalDateTime processedAt;

        public PayoutProcessingResult(List<PayoutTransaction> successfulPayouts, List<PayoutError> errors,
                                    double totalAmountProcessed, LocalDateTime processedAt) {
            this.successfulPayouts = successfulPayouts;
            this.errors = errors;
            this.totalAmountProcessed = totalAmountProcessed;
            this.processedAt = processedAt;
        }

        public List<PayoutTransaction> getSuccessfulPayouts() { return successfulPayouts; }
        public List<PayoutError> getErrors() { return errors; }
        public double getTotalAmountProcessed() { return totalAmountProcessed; }
        public LocalDateTime getProcessedAt() { return processedAt; }
    }

    public static class PayoutTransaction {
        private String transactionId;
        private String sellerId;
        private String businessName;
        private double amount;
        private LocalDateTime processedAt;
        private PayoutStatus status;

        public PayoutTransaction(String transactionId, String sellerId, String businessName,
                               double amount, LocalDateTime processedAt, PayoutStatus status) {
            this.transactionId = transactionId;
            this.sellerId = sellerId;
            this.businessName = businessName;
            this.amount = amount;
            this.processedAt = processedAt;
            this.status = status;
        }

        public String getTransactionId() { return transactionId; }
        public String getSellerId() { return sellerId; }
        public String getBusinessName() { return businessName; }
        public double getAmount() { return amount; }
        public LocalDateTime getProcessedAt() { return processedAt; }
        public PayoutStatus getStatus() { return status; }
    }

    public static class PayoutError {
        private String sellerId;
        private String errorMessage;

        public PayoutError(String sellerId, String errorMessage) {
            this.sellerId = sellerId;
            this.errorMessage = errorMessage;
        }

        public String getSellerId() { return sellerId; }
        public String getErrorMessage() { return errorMessage; }
    }

    public static class SellerDashboardData {
        private String sellerId;
        private String businessName;
        private double currentMonthSales;
        private double currentMonthPayout;
        private int currentMonthItems;
        private double lastMonthSales;
        private double lastMonthPayout;
        private int lastMonthItems;
        private double pendingPayout;
        private LocalDate nextPayoutDate;
        private double commissionRate;
        private List<Order> recentOrders;
        private Map<String, Double> monthlyTrends;
        private Map<String, Integer> categorySales;

        public SellerDashboardData(String sellerId, String businessName, double currentMonthSales,
                                 double currentMonthPayout, int currentMonthItems, double lastMonthSales,
                                 double lastMonthPayout, int lastMonthItems, double pendingPayout,
                                 LocalDate nextPayoutDate, double commissionRate, List<Order> recentOrders,
                                 Map<String, Double> monthlyTrends, Map<String, Integer> categorySales) {
            this.sellerId = sellerId;
            this.businessName = businessName;
            this.currentMonthSales = currentMonthSales;
            this.currentMonthPayout = currentMonthPayout;
            this.currentMonthItems = currentMonthItems;
            this.lastMonthSales = lastMonthSales;
            this.lastMonthPayout = lastMonthPayout;
            this.lastMonthItems = lastMonthItems;
            this.pendingPayout = pendingPayout;
            this.nextPayoutDate = nextPayoutDate;
            this.commissionRate = commissionRate;
            this.recentOrders = recentOrders;
            this.monthlyTrends = monthlyTrends;
            this.categorySales = categorySales;
        }

        public String getSellerId() { return sellerId; }
        public String getBusinessName() { return businessName; }
        public double getCurrentMonthSales() { return currentMonthSales; }
        public double getCurrentMonthPayout() { return currentMonthPayout; }
        public int getCurrentMonthItems() { return currentMonthItems; }
        public double getLastMonthSales() { return lastMonthSales; }
        public double getLastMonthPayout() { return lastMonthPayout; }
        public int getLastMonthItems() { return lastMonthItems; }
        public double getPendingPayout() { return pendingPayout; }
        public LocalDate getNextPayoutDate() { return nextPayoutDate; }
        public double getCommissionRate() { return commissionRate; }
        public List<Order> getRecentOrders() { return recentOrders; }
        public Map<String, Double> getMonthlyTrends() { return monthlyTrends; }
        public Map<String, Integer> getCategorySales() { return categorySales; }
    }

    public static class CommissionAnalytics {
        private double totalPlatformRevenue;
        private double totalSales;
        private int totalTransactions;
        private double averageCommissionRate;
        private int activeSellers;
        private Map<String, Double> topSellersByRevenue;
        private LocalDate startDate;
        private LocalDate endDate;

        public CommissionAnalytics(double totalPlatformRevenue, double totalSales, int totalTransactions,
                                 double averageCommissionRate, int activeSellers, Map<String, Double> topSellersByRevenue,
                                 LocalDate startDate, LocalDate endDate) {
            this.totalPlatformRevenue = totalPlatformRevenue;
            this.totalSales = totalSales;
            this.totalTransactions = totalTransactions;
            this.averageCommissionRate = averageCommissionRate;
            this.activeSellers = activeSellers;
            this.topSellersByRevenue = topSellersByRevenue;
            this.startDate = startDate;
            this.endDate = endDate;
        }

        public double getTotalPlatformRevenue() { return totalPlatformRevenue; }
        public double getTotalSales() { return totalSales; }
        public int getTotalTransactions() { return totalTransactions; }
        public double getAverageCommissionRate() { return averageCommissionRate; }
        public int getActiveSellers() { return activeSellers; }
        public Map<String, Double> getTopSellersByRevenue() { return topSellersByRevenue; }
        public LocalDate getStartDate() { return startDate; }
        public LocalDate getEndDate() { return endDate; }
    }

    public enum PayoutStatus {
        PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
    }
}
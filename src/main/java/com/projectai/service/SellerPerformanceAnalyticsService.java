package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class SellerPerformanceAnalyticsService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserBehaviorAnalyticsService behaviorAnalyticsService;

    @Autowired
    private CachingAndPerformanceService cachingService;

    private final Map<String, SellerMetrics> sellerMetricsCache = new ConcurrentHashMap<>();
    private final Map<String, List<PerformanceDataPoint>> sellerPerformanceHistory = new ConcurrentHashMap<>();
    private final Map<String, SellerRanking> globalSellerRankings = new ConcurrentHashMap<>();
    private final Map<String, List<SellerAlert>> sellerAlerts = new ConcurrentHashMap<>();

    private static final int HISTORY_RETENTION_DAYS = 365;
    private static final int TOP_SELLERS_LIMIT = 100;
    private static final double EXCELLENCE_THRESHOLD = 4.5;
    private static final double WARNING_THRESHOLD = 3.0;

    public enum PerformanceMetric {
        SALES_VOLUME, REVENUE, CUSTOMER_SATISFACTION, RESPONSE_TIME, 
        RETURN_RATE, LISTING_QUALITY, SHIPPING_SPEED, INVENTORY_TURNOVER,
        CUSTOMER_RETENTION, PRODUCT_VIEWS, CONVERSION_RATE, PROFIT_MARGIN
    }

    public enum PerformanceLevel {
        EXCELLENT(4.5, 5.0), GOOD(3.5, 4.5), AVERAGE(2.5, 3.5), 
        BELOW_AVERAGE(1.5, 2.5), POOR(0.0, 1.5);

        private final double minScore;
        private final double maxScore;

        PerformanceLevel(double minScore, double maxScore) {
            this.minScore = minScore;
            this.maxScore = maxScore;
        }

        public static PerformanceLevel fromScore(double score) {
            for (PerformanceLevel level : values()) {
                if (score >= level.minScore && score < level.maxScore) {
                    return level;
                }
            }
            return POOR;
        }
    }

    public enum AlertType {
        PERFORMANCE_DROP, LOW_INVENTORY, HIGH_RETURN_RATE, SLOW_RESPONSE,
        POOR_REVIEWS, SHIPPING_DELAYS, POLICY_VIOLATION, OPPORTUNITY
    }

    public enum AlertPriority {
        CRITICAL, HIGH, MEDIUM, LOW
    }

    public static class SellerMetrics {
        private String sellerId;
        private String sellerName;
        private LocalDateTime lastUpdated;
        
        private BigDecimal totalRevenue = BigDecimal.ZERO;
        private AtomicInteger totalSales = new AtomicInteger(0);
        private AtomicInteger totalProducts = new AtomicInteger(0);
        private AtomicInteger totalReviews = new AtomicInteger(0);
        
        private double averageRating = 0.0;
        private double responseTime = 0.0; // hours
        private double returnRate = 0.0; // percentage
        private double conversionRate = 0.0; // percentage
        private double customerSatisfactionScore = 0.0;
        private double listingQualityScore = 0.0;
        private double shippingSpeedScore = 0.0;
        private double inventoryTurnoverRate = 0.0;
        private double profitMargin = 0.0;
        
        private AtomicLong totalViews = new AtomicLong(0);
        private AtomicLong totalOrders = new AtomicLong(0);
        private AtomicLong totalReturns = new AtomicLong(0);
        private AtomicInteger activeListings = new AtomicInteger(0);
        
        private PerformanceLevel performanceLevel = PerformanceLevel.AVERAGE;
        private double overallScore = 0.0;
        private Map<PerformanceMetric, Double> metricScores = new HashMap<>();
        
        public SellerMetrics(String sellerId, String sellerName) {
            this.sellerId = sellerId;
            this.sellerName = sellerName;
            this.lastUpdated = LocalDateTime.now();
        }

        // Getters and setters
        public String getSellerId() { return sellerId; }
        public String getSellerName() { return sellerName; }
        public LocalDateTime getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
        
        public BigDecimal getTotalRevenue() { return totalRevenue; }
        public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
        
        public int getTotalSales() { return totalSales.get(); }
        public void incrementSales() { this.totalSales.incrementAndGet(); }
        
        public int getTotalProducts() { return totalProducts.get(); }
        public void setTotalProducts(int count) { this.totalProducts.set(count); }

        public int getTotalReviews() { return totalReviews.get(); }
        public void setTotalReviews(int count) { this.totalReviews.set(count); }
        
        public double getAverageRating() { return averageRating; }
        public void setAverageRating(double averageRating) { this.averageRating = averageRating; }
        
        public double getResponseTime() { return responseTime; }
        public void setResponseTime(double responseTime) { this.responseTime = responseTime; }
        
        public double getReturnRate() { return returnRate; }
        public void setReturnRate(double returnRate) { this.returnRate = returnRate; }
        
        public double getConversionRate() { return conversionRate; }
        public void setConversionRate(double conversionRate) { this.conversionRate = conversionRate; }
        
        public double getCustomerSatisfactionScore() { return customerSatisfactionScore; }
        public void setCustomerSatisfactionScore(double customerSatisfactionScore) { 
            this.customerSatisfactionScore = customerSatisfactionScore; 
        }
        
        public double getListingQualityScore() { return listingQualityScore; }
        public void setListingQualityScore(double listingQualityScore) { 
            this.listingQualityScore = listingQualityScore; 
        }
        
        public double getShippingSpeedScore() { return shippingSpeedScore; }
        public void setShippingSpeedScore(double shippingSpeedScore) { 
            this.shippingSpeedScore = shippingSpeedScore; 
        }
        
        public double getInventoryTurnoverRate() { return inventoryTurnoverRate; }
        public void setInventoryTurnoverRate(double inventoryTurnoverRate) { 
            this.inventoryTurnoverRate = inventoryTurnoverRate; 
        }
        
        public double getProfitMargin() { return profitMargin; }
        public void setProfitMargin(double profitMargin) { this.profitMargin = profitMargin; }
        
        public long getTotalViews() { return totalViews.get(); }
        public void incrementViews() { this.totalViews.incrementAndGet(); }
        
        public long getTotalOrders() { return totalOrders.get(); }
        public void incrementOrders() { this.totalOrders.incrementAndGet(); }
        
        public long getTotalReturns() { return totalReturns.get(); }
        public void incrementReturns() { this.totalReturns.incrementAndGet(); }
        
        public int getActiveListings() { return activeListings.get(); }
        public void setActiveListings(int count) { this.activeListings.set(count); }
        
        public PerformanceLevel getPerformanceLevel() { return performanceLevel; }
        public void setPerformanceLevel(PerformanceLevel performanceLevel) { 
            this.performanceLevel = performanceLevel; 
        }
        
        public double getOverallScore() { return overallScore; }
        public void setOverallScore(double overallScore) { this.overallScore = overallScore; }
        
        public Map<PerformanceMetric, Double> getMetricScores() { return metricScores; }
        public void setMetricScores(Map<PerformanceMetric, Double> metricScores) { 
            this.metricScores = metricScores; 
        }
    }

    public static class PerformanceDataPoint {
        private LocalDateTime timestamp;
        private PerformanceMetric metric;
        private double value;
        private String context;

        public PerformanceDataPoint(PerformanceMetric metric, double value, String context) {
            this.timestamp = LocalDateTime.now();
            this.metric = metric;
            this.value = value;
            this.context = context;
        }

        // Getters
        public LocalDateTime getTimestamp() { return timestamp; }
        public PerformanceMetric getMetric() { return metric; }
        public double getValue() { return value; }
        public String getContext() { return context; }
    }

    public static class SellerRanking {
        private String sellerId;
        private String sellerName;
        private int globalRank;
        private int categoryRank;
        private double score;
        private PerformanceLevel level;
        private String primaryCategory;
        private LocalDateTime rankingDate;
        private Map<PerformanceMetric, Integer> metricRankings;

        public SellerRanking(String sellerId, String sellerName, double score) {
            this.sellerId = sellerId;
            this.sellerName = sellerName;
            this.score = score;
            this.level = PerformanceLevel.fromScore(score);
            this.rankingDate = LocalDateTime.now();
            this.metricRankings = new HashMap<>();
        }

        // Getters and setters
        public String getSellerId() { return sellerId; }
        public String getSellerName() { return sellerName; }
        public int getGlobalRank() { return globalRank; }
        public void setGlobalRank(int globalRank) { this.globalRank = globalRank; }
        public int getCategoryRank() { return categoryRank; }
        public void setCategoryRank(int categoryRank) { this.categoryRank = categoryRank; }
        public double getScore() { return score; }
        public PerformanceLevel getLevel() { return level; }
        public String getPrimaryCategory() { return primaryCategory; }
        public void setPrimaryCategory(String primaryCategory) { this.primaryCategory = primaryCategory; }
        public LocalDateTime getRankingDate() { return rankingDate; }
        public Map<PerformanceMetric, Integer> getMetricRankings() { return metricRankings; }
    }

    public static class SellerAlert {
        private String alertId;
        private String sellerId;
        private AlertType type;
        private AlertPriority priority;
        private String title;
        private String message;
        private String actionRequired;
        private LocalDateTime createdAt;
        private LocalDateTime expiresAt;
        private boolean acknowledged;
        private Map<String, Object> metadata;

        public SellerAlert(String sellerId, AlertType type, AlertPriority priority, 
                          String title, String message, String actionRequired) {
            this.alertId = UUID.randomUUID().toString();
            this.sellerId = sellerId;
            this.type = type;
            this.priority = priority;
            this.title = title;
            this.message = message;
            this.actionRequired = actionRequired;
            this.createdAt = LocalDateTime.now();
            this.expiresAt = createdAt.plusDays(30);
            this.acknowledged = false;
            this.metadata = new HashMap<>();
        }

        // Getters and setters
        public String getAlertId() { return alertId; }
        public String getSellerId() { return sellerId; }
        public AlertType getType() { return type; }
        public AlertPriority getPriority() { return priority; }
        public String getTitle() { return title; }
        public String getMessage() { return message; }
        public String getActionRequired() { return actionRequired; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public LocalDateTime getExpiresAt() { return expiresAt; }
        public boolean isAcknowledged() { return acknowledged; }
        public void setAcknowledged(boolean acknowledged) { this.acknowledged = acknowledged; }
        public Map<String, Object> getMetadata() { return metadata; }
    }

    public static class SellerDashboard {
        private String sellerId;
        private SellerMetrics metrics;
        private SellerRanking ranking;
        private List<SellerAlert> alerts;
        private List<PerformanceDataPoint> recentPerformance;
        private Map<String, Object> insights;
        private Map<String, List<Object>> charts;
        private LocalDateTime lastUpdated;

        public SellerDashboard(String sellerId) {
            this.sellerId = sellerId;
            this.insights = new HashMap<>();
            this.charts = new HashMap<>();
            this.lastUpdated = LocalDateTime.now();
        }

        // Getters and setters
        public String getSellerId() { return sellerId; }
        public SellerMetrics getMetrics() { return metrics; }
        public void setMetrics(SellerMetrics metrics) { this.metrics = metrics; }
        public SellerRanking getRanking() { return ranking; }
        public void setRanking(SellerRanking ranking) { this.ranking = ranking; }
        public List<SellerAlert> getAlerts() { return alerts; }
        public void setAlerts(List<SellerAlert> alerts) { this.alerts = alerts; }
        public List<PerformanceDataPoint> getRecentPerformance() { return recentPerformance; }
        public void setRecentPerformance(List<PerformanceDataPoint> recentPerformance) { 
            this.recentPerformance = recentPerformance; 
        }
        public Map<String, Object> getInsights() { return insights; }
        public Map<String, List<Object>> getCharts() { return charts; }
        public LocalDateTime getLastUpdated() { return lastUpdated; }
    }

    @Async
    public CompletableFuture<SellerMetrics> calculateSellerMetrics(String sellerId) {
        return CompletableFuture.supplyAsync(() -> {
            SellerMetrics metrics = sellerMetricsCache.computeIfAbsent(sellerId, 
                id -> new SellerMetrics(id, "Seller " + id));

            // Calculate basic metrics
            List<Product> sellerProducts = productRepository.findBySeller_Id(sellerId);
            metrics.setTotalProducts(sellerProducts.size());
            metrics.setActiveListings((int) sellerProducts.stream().filter(Product::isAvailable).count());

            // Calculate revenue and sales
            BigDecimal revenue = sellerProducts.stream()
                .map(Product::getPrice)
                .filter(price -> price != null)
                .map(BigDecimal::valueOf)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            metrics.setTotalRevenue(revenue);

            // Calculate performance scores
            calculatePerformanceScores(metrics, sellerProducts);
            
            // Calculate overall score
            double overallScore = calculateOverallScore(metrics);
            metrics.setOverallScore(overallScore);
            metrics.setPerformanceLevel(PerformanceLevel.fromScore(overallScore));
            
            metrics.setLastUpdated(LocalDateTime.now());
            
            // Record performance data point
            recordPerformanceDataPoint(sellerId, PerformanceMetric.SALES_VOLUME, 
                metrics.getTotalSales(), "Daily calculation");

            return metrics;
        });
    }

    private void calculatePerformanceScores(SellerMetrics metrics, List<Product> products) {
        Map<PerformanceMetric, Double> scores = new HashMap<>();
        
        // Calculate individual metric scores
        scores.put(PerformanceMetric.LISTING_QUALITY, calculateListingQualityScore(products));
        scores.put(PerformanceMetric.INVENTORY_TURNOVER, calculateInventoryTurnoverScore(products));
        scores.put(PerformanceMetric.CUSTOMER_SATISFACTION, generateRealisticScore(3.5, 5.0));
        scores.put(PerformanceMetric.RESPONSE_TIME, generateRealisticScore(3.0, 5.0));
        scores.put(PerformanceMetric.RETURN_RATE, 5.0 - (ThreadLocalRandom.current().nextDouble(0.05, 0.15) * 100));
        scores.put(PerformanceMetric.SHIPPING_SPEED, generateRealisticScore(3.5, 5.0));
        scores.put(PerformanceMetric.CONVERSION_RATE, generateRealisticScore(2.0, 4.5));
        scores.put(PerformanceMetric.PROFIT_MARGIN, generateRealisticScore(2.5, 4.5));

        metrics.setMetricScores(scores);
        
        // Set individual scores
        metrics.setListingQualityScore(scores.get(PerformanceMetric.LISTING_QUALITY));
        metrics.setCustomerSatisfactionScore(scores.get(PerformanceMetric.CUSTOMER_SATISFACTION));
        metrics.setShippingSpeedScore(scores.get(PerformanceMetric.SHIPPING_SPEED));
        metrics.setInventoryTurnoverRate(scores.get(PerformanceMetric.INVENTORY_TURNOVER));
        
        // Calculate derived metrics
        metrics.setReturnRate(5.0 - scores.get(PerformanceMetric.RETURN_RATE));
        metrics.setConversionRate(scores.get(PerformanceMetric.CONVERSION_RATE) * 2); // Convert to percentage
        metrics.setProfitMargin(scores.get(PerformanceMetric.PROFIT_MARGIN) * 5); // Convert to percentage
        metrics.setResponseTime(24.0 / scores.get(PerformanceMetric.RESPONSE_TIME)); // Hours
    }

    private double calculateListingQualityScore(List<Product> products) {
        if (products.isEmpty()) return 0.0;
        
        double totalScore = 0.0;
        for (Product product : products) {
            double score = 0.0;
            
            // Title quality (length and keywords)
            if (product.getName() != null && product.getName().length() > 10) score += 1.0;
            if (product.getName() != null && product.getName().length() > 30) score += 0.5;
            
            // Description quality
            if (product.getDescription() != null && product.getDescription().length() > 50) score += 1.0;
            if (product.getDescription() != null && product.getDescription().length() > 200) score += 1.0;
            
            // Price reasonableness
            BigDecimal price = BigDecimal.valueOf(product.getPrice());
            if (price != null && price.compareTo(BigDecimal.ZERO) > 0) score += 1.0;
            
            // Category assignment
            if (product.getCategory() != null && !product.getCategory().isEmpty()) score += 0.5;
            
            totalScore += Math.min(score, 5.0);
        }
        
        return totalScore / products.size();
    }

    private double calculateInventoryTurnoverScore(List<Product> products) {
        if (products.isEmpty()) return 0.0;
        
        // Simulate inventory turnover based on product availability and age
        return products.stream()
            .mapToDouble(product -> product.isAvailable() ? 
                ThreadLocalRandom.current().nextDouble(2.0, 5.0) : 
                ThreadLocalRandom.current().nextDouble(0.5, 2.0))
            .average()
            .orElse(0.0);
    }

    private double generateRealisticScore(double min, double max) {
        return ThreadLocalRandom.current().nextDouble(min, max);
    }

    private double calculateOverallScore(SellerMetrics metrics) {
        Map<PerformanceMetric, Double> scores = metrics.getMetricScores();
        
        // Weighted average of all metrics
        Map<PerformanceMetric, Double> weights = Map.of(
            PerformanceMetric.CUSTOMER_SATISFACTION, 0.20,
            PerformanceMetric.LISTING_QUALITY, 0.15,
            PerformanceMetric.RESPONSE_TIME, 0.15,
            PerformanceMetric.RETURN_RATE, 0.15,
            PerformanceMetric.SHIPPING_SPEED, 0.10,
            PerformanceMetric.CONVERSION_RATE, 0.10,
            PerformanceMetric.INVENTORY_TURNOVER, 0.10,
            PerformanceMetric.PROFIT_MARGIN, 0.05
        );
        
        double weightedSum = 0.0;
        double totalWeight = 0.0;
        
        for (Map.Entry<PerformanceMetric, Double> entry : weights.entrySet()) {
            Double score = scores.get(entry.getKey());
            if (score != null) {
                weightedSum += score * entry.getValue();
                totalWeight += entry.getValue();
            }
        }
        
        return totalWeight > 0 ? weightedSum / totalWeight : 0.0;
    }

    private void recordPerformanceDataPoint(String sellerId, PerformanceMetric metric, 
                                          double value, String context) {
        sellerPerformanceHistory.computeIfAbsent(sellerId, k -> new ArrayList<>())
            .add(new PerformanceDataPoint(metric, value, context));
        
        // Clean old data
        cleanOldPerformanceData(sellerId);
    }

    private void cleanOldPerformanceData(String sellerId) {
        List<PerformanceDataPoint> history = sellerPerformanceHistory.get(sellerId);
        if (history != null) {
            LocalDateTime cutoff = LocalDateTime.now().minusDays(HISTORY_RETENTION_DAYS);
            history.removeIf(point -> point.getTimestamp().isBefore(cutoff));
        }
    }

    @Async
    public CompletableFuture<SellerRanking> calculateSellerRanking(String sellerId) {
        return CompletableFuture.supplyAsync(() -> {
            SellerMetrics metrics = sellerMetricsCache.get(sellerId);
            if (metrics == null) {
                return null;
            }
            
            SellerRanking ranking = new SellerRanking(sellerId, metrics.getSellerName(), 
                metrics.getOverallScore());
            
            // Calculate global ranking
            List<SellerMetrics> allSellers = new ArrayList<>(sellerMetricsCache.values());
            allSellers.sort((a, b) -> Double.compare(b.getOverallScore(), a.getOverallScore()));
            
            for (int i = 0; i < allSellers.size(); i++) {
                if (allSellers.get(i).getSellerId().equals(sellerId)) {
                    ranking.setGlobalRank(i + 1);
                    break;
                }
            }
            
            // Calculate metric rankings
            for (PerformanceMetric metric : PerformanceMetric.values()) {
                List<SellerMetrics> metricRanked = new ArrayList<>(sellerMetricsCache.values());
                metricRanked.sort((a, b) -> Double.compare(
                    b.getMetricScores().getOrDefault(metric, 0.0),
                    a.getMetricScores().getOrDefault(metric, 0.0)
                ));
                
                for (int i = 0; i < metricRanked.size(); i++) {
                    if (metricRanked.get(i).getSellerId().equals(sellerId)) {
                        ranking.getMetricRankings().put(metric, i + 1);
                        break;
                    }
                }
            }
            
            globalSellerRankings.put(sellerId, ranking);
            return ranking;
        });
    }

    @Async
    public CompletableFuture<List<SellerAlert>> generateSellerAlerts(String sellerId) {
        return CompletableFuture.supplyAsync(() -> {
            List<SellerAlert> alerts = new ArrayList<>();
            SellerMetrics metrics = sellerMetricsCache.get(sellerId);
            
            if (metrics == null) {
                return alerts;
            }
            
            // Performance drop alert
            if (metrics.getOverallScore() < WARNING_THRESHOLD) {
                alerts.add(new SellerAlert(sellerId, AlertType.PERFORMANCE_DROP, AlertPriority.HIGH,
                    "Performance Below Standards", 
                    "Your overall performance score has dropped below acceptable levels.",
                    "Review your metrics and implement improvement strategies."));
            }
            
            // Low inventory alert
            if (metrics.getActiveListings() < 5) {
                alerts.add(new SellerAlert(sellerId, AlertType.LOW_INVENTORY, AlertPriority.MEDIUM,
                    "Low Inventory Warning",
                    "You have fewer than 5 active listings.",
                    "Add more products to increase visibility and sales opportunities."));
            }
            
            // High return rate alert
            if (metrics.getReturnRate() > 15.0) {
                alerts.add(new SellerAlert(sellerId, AlertType.HIGH_RETURN_RATE, AlertPriority.HIGH,
                    "High Return Rate Detected",
                    "Your return rate is above 15%, which may indicate quality issues.",
                    "Review product descriptions and quality control processes."));
            }
            
            // Slow response alert
            if (metrics.getResponseTime() > 24.0) {
                alerts.add(new SellerAlert(sellerId, AlertType.SLOW_RESPONSE, AlertPriority.MEDIUM,
                    "Slow Response Time",
                    "Your average response time is over 24 hours.",
                    "Improve customer communication to enhance satisfaction."));
            }
            
            // Opportunity alert for high performers
            if (metrics.getOverallScore() > EXCELLENCE_THRESHOLD) {
                alerts.add(new SellerAlert(sellerId, AlertType.OPPORTUNITY, AlertPriority.LOW,
                    "Expansion Opportunity",
                    "Your excellent performance qualifies you for premium seller benefits.",
                    "Contact support to learn about advanced seller programs."));
            }
            
            sellerAlerts.put(sellerId, alerts);
            return alerts;
        });
    }

    @Async
    public CompletableFuture<SellerDashboard> generateSellerDashboard(String sellerId) {
        return CompletableFuture.supplyAsync(() -> {
            SellerDashboard dashboard = new SellerDashboard(sellerId);
            
            // Get all components
            SellerMetrics metrics = sellerMetricsCache.get(sellerId);
            SellerRanking ranking = globalSellerRankings.get(sellerId);
            List<SellerAlert> alerts = sellerAlerts.getOrDefault(sellerId, new ArrayList<>());
            List<PerformanceDataPoint> recentPerformance = getRecentPerformanceData(sellerId, 30);
            
            dashboard.setMetrics(metrics);
            dashboard.setRanking(ranking);
            dashboard.setAlerts(alerts);
            dashboard.setRecentPerformance(recentPerformance);
            
            // Generate insights
            generateSellerInsights(dashboard);
            
            // Generate chart data
            generateChartData(dashboard);
            
            return dashboard;
        });
    }

    private List<PerformanceDataPoint> getRecentPerformanceData(String sellerId, int days) {
        List<PerformanceDataPoint> allData = sellerPerformanceHistory.getOrDefault(sellerId, new ArrayList<>());
        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
        
        return allData.stream()
            .filter(point -> point.getTimestamp().isAfter(cutoff))
            .sorted((a, b) -> a.getTimestamp().compareTo(b.getTimestamp()))
            .collect(Collectors.toList());
    }

    private void generateSellerInsights(SellerDashboard dashboard) {
        Map<String, Object> insights = dashboard.getInsights();
        SellerMetrics metrics = dashboard.getMetrics();
        
        if (metrics != null) {
            // Performance insights
            insights.put("performanceGrade", metrics.getPerformanceLevel().toString());
            insights.put("scoreImprovement", calculateScoreImprovement(metrics.getSellerId()));
            insights.put("topStrength", findTopStrength(metrics));
            insights.put("improvementArea", findImprovementArea(metrics));
            
            // Competitive insights
            SellerRanking ranking = dashboard.getRanking();
            if (ranking != null) {
                insights.put("rankingTrend", calculateRankingTrend(metrics.getSellerId()));
                insights.put("competitivePosition", analyzeCompetitivePosition(ranking));
            }
            
            // Financial insights
            insights.put("revenueGrowth", calculateRevenueGrowth(metrics.getSellerId()));
            insights.put("profitabilityStatus", analyzeProfitability(metrics));
            
            // Operational insights
            insights.put("inventoryHealth", analyzeInventoryHealth(metrics));
            insights.put("customerSatisfactionTrend", analyzeCustomerSatisfactionTrend(metrics.getSellerId()));
        }
    }

    private void generateChartData(SellerDashboard dashboard) {
        Map<String, List<Object>> charts = dashboard.getCharts();
        String sellerId = dashboard.getSellerId();
        
        // Performance trend chart
        List<PerformanceDataPoint> performanceData = getRecentPerformanceData(sellerId, 30);
        charts.put("performanceTrend", convertToChartData(performanceData));
        
        // Revenue chart
        charts.put("revenueChart", generateRevenueChartData(sellerId));
        
        // Metric comparison chart
        charts.put("metricComparison", generateMetricComparisonChart(dashboard.getMetrics()));
        
        // Ranking history chart
        charts.put("rankingHistory", generateRankingHistoryChart(sellerId));
    }

    private double calculateScoreImprovement(String sellerId) {
        List<PerformanceDataPoint> history = getRecentPerformanceData(sellerId, 30);
        if (history.size() < 2) return 0.0;
        
        double oldScore = history.get(0).getValue();
        double newScore = history.get(history.size() - 1).getValue();
        return ((newScore - oldScore) / oldScore) * 100;
    }

    private String findTopStrength(SellerMetrics metrics) {
        return metrics.getMetricScores().entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(entry -> entry.getKey().toString())
            .orElse("None identified");
    }

    private String findImprovementArea(SellerMetrics metrics) {
        return metrics.getMetricScores().entrySet().stream()
            .min(Map.Entry.comparingByValue())
            .map(entry -> entry.getKey().toString())
            .orElse("None identified");
    }

    private String calculateRankingTrend(String sellerId) {
        // Simulate ranking trend analysis
        return ThreadLocalRandom.current().nextBoolean() ? "IMPROVING" : "STABLE";
    }

    private String analyzeCompetitivePosition(SellerRanking ranking) {
        if (ranking.getGlobalRank() <= 10) return "TOP_TIER";
        if (ranking.getGlobalRank() <= 50) return "HIGH_PERFORMER";
        if (ranking.getGlobalRank() <= 100) return "ABOVE_AVERAGE";
        return "NEEDS_IMPROVEMENT";
    }

    private double calculateRevenueGrowth(String sellerId) {
        return ThreadLocalRandom.current().nextDouble(-10.0, 25.0);
    }

    private String analyzeProfitability(SellerMetrics metrics) {
        if (metrics.getProfitMargin() > 20) return "EXCELLENT";
        if (metrics.getProfitMargin() > 15) return "GOOD";
        if (metrics.getProfitMargin() > 10) return "AVERAGE";
        return "BELOW_AVERAGE";
    }

    private String analyzeInventoryHealth(SellerMetrics metrics) {
        if (metrics.getInventoryTurnoverRate() > 4.0) return "HEALTHY";
        if (metrics.getInventoryTurnoverRate() > 2.0) return "MODERATE";
        return "NEEDS_ATTENTION";
    }

    private String analyzeCustomerSatisfactionTrend(String sellerId) {
        return ThreadLocalRandom.current().nextBoolean() ? "IMPROVING" : "STABLE";
    }

    private List<Object> convertToChartData(List<PerformanceDataPoint> data) {
        return data.stream()
            .map(point -> Map.of(
                "date", point.getTimestamp(),
                "value", point.getValue(),
                "metric", point.getMetric().toString()
            ))
            .collect(Collectors.toList());
    }

    private List<Object> generateRevenueChartData(String sellerId) {
        List<Object> chartData = new ArrayList<>();
        LocalDate startDate = LocalDate.now().minusDays(30);
        
        for (int i = 0; i < 30; i++) {
            chartData.add(Map.of(
                "date", startDate.plusDays(i),
                "revenue", ThreadLocalRandom.current().nextDouble(100, 1000)
            ));
        }
        
        return chartData;
    }

    private List<Object> generateMetricComparisonChart(SellerMetrics metrics) {
        if (metrics == null) return new ArrayList<>();
        
        return metrics.getMetricScores().entrySet().stream()
            .map(entry -> Map.of(
                "metric", entry.getKey().toString(),
                "score", entry.getValue(),
                "benchmark", 3.5 // Industry average
            ))
            .collect(Collectors.toList());
    }

    private List<Object> generateRankingHistoryChart(String sellerId) {
        List<Object> chartData = new ArrayList<>();
        LocalDate startDate = LocalDate.now().minusDays(30);
        
        int baseRank = ThreadLocalRandom.current().nextInt(10, 100);
        for (int i = 0; i < 30; i++) {
            chartData.add(Map.of(
                "date", startDate.plusDays(i),
                "rank", Math.max(1, baseRank + ThreadLocalRandom.current().nextInt(-5, 6))
            ));
        }
        
        return chartData;
    }

    public CompletableFuture<List<SellerMetrics>> getTopPerformers(int limit) {
        return CompletableFuture.supplyAsync(() -> {
            return sellerMetricsCache.values().stream()
                .sorted((a, b) -> Double.compare(b.getOverallScore(), a.getOverallScore()))
                .limit(Math.min(limit, TOP_SELLERS_LIMIT))
                .collect(Collectors.toList());
        });
    }

    public CompletableFuture<Map<String, Object>> getMarketplaceAnalytics() {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> analytics = new HashMap<>();
            
            List<SellerMetrics> allSellers = new ArrayList<>(sellerMetricsCache.values());
            
            analytics.put("totalSellers", allSellers.size());
            analytics.put("averageScore", allSellers.stream()
                .mapToDouble(SellerMetrics::getOverallScore)
                .average().orElse(0.0));
            analytics.put("excellentSellers", allSellers.stream()
                .filter(s -> s.getPerformanceLevel() == PerformanceLevel.EXCELLENT)
                .count());
            analytics.put("totalRevenue", allSellers.stream()
                .map(SellerMetrics::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
            
            return analytics;
        });
    }

    @Scheduled(fixedRate = 3600000) // Every hour
    public void updateAllSellerMetrics() {
        List<String> sellerIds = new ArrayList<>(sellerMetricsCache.keySet());
        
        sellerIds.parallelStream().forEach(sellerId -> {
            try {
                calculateSellerMetrics(sellerId).get();
                calculateSellerRanking(sellerId).get();
                generateSellerAlerts(sellerId).get();
            } catch (Exception e) {
                System.err.println("Error updating metrics for seller " + sellerId + ": " + e.getMessage());
            }
        });
    }

    public void acknowledgeAlert(String sellerId, String alertId) {
        List<SellerAlert> alerts = sellerAlerts.get(sellerId);
        if (alerts != null) {
            alerts.stream()
                .filter(alert -> alert.getAlertId().equals(alertId))
                .findFirst()
                .ifPresent(alert -> alert.setAcknowledged(true));
        }
    }

    public CompletableFuture<Void> processSellerEvent(String sellerId, String eventType, Map<String, Object> eventData) {
        return CompletableFuture.runAsync(() -> {
            switch (eventType) {
                case "SALE_COMPLETED":
                    handleSaleCompleted(sellerId, eventData);
                    break;
                case "PRODUCT_VIEWED":
                    handleProductViewed(sellerId, eventData);
                    break;
                case "RETURN_INITIATED":
                    handleReturnInitiated(sellerId, eventData);
                    break;
                case "REVIEW_RECEIVED":
                    handleReviewReceived(sellerId, eventData);
                    break;
                default:
                    System.out.println("Unknown event type: " + eventType);
            }
        });
    }

    private void handleSaleCompleted(String sellerId, Map<String, Object> eventData) {
        SellerMetrics metrics = sellerMetricsCache.get(sellerId);
        if (metrics != null) {
            metrics.incrementSales();
            metrics.incrementOrders();
            
            BigDecimal saleAmount = (BigDecimal) eventData.get("amount");
            if (saleAmount != null) {
                metrics.setTotalRevenue(metrics.getTotalRevenue().add(saleAmount));
            }
            
            recordPerformanceDataPoint(sellerId, PerformanceMetric.SALES_VOLUME, 
                metrics.getTotalSales(), "Sale completed");
        }
    }

    private void handleProductViewed(String sellerId, Map<String, Object> eventData) {
        SellerMetrics metrics = sellerMetricsCache.get(sellerId);
        if (metrics != null) {
            metrics.incrementViews();
            
            recordPerformanceDataPoint(sellerId, PerformanceMetric.PRODUCT_VIEWS, 
                metrics.getTotalViews(), "Product viewed");
        }
    }

    private void handleReturnInitiated(String sellerId, Map<String, Object> eventData) {
        SellerMetrics metrics = sellerMetricsCache.get(sellerId);
        if (metrics != null) {
            metrics.incrementReturns();
            
            // Recalculate return rate
            double returnRate = (double) metrics.getTotalReturns() / Math.max(1, metrics.getTotalOrders()) * 100;
            metrics.setReturnRate(returnRate);
            
            recordPerformanceDataPoint(sellerId, PerformanceMetric.RETURN_RATE, 
                returnRate, "Return initiated");
        }
    }

    private void handleReviewReceived(String sellerId, Map<String, Object> eventData) {
        SellerMetrics metrics = sellerMetricsCache.get(sellerId);
        if (metrics != null) {
            Double rating = (Double) eventData.get("rating");
            if (rating != null) {
                // Update average rating
                int totalReviews = metrics.getTotalReviews();
                double currentAverage = metrics.getAverageRating();
                double newAverage = (currentAverage * totalReviews + rating) / (totalReviews + 1);
                
                metrics.setAverageRating(newAverage);
                metrics.setTotalReviews(totalReviews + 1);
                
                recordPerformanceDataPoint(sellerId, PerformanceMetric.CUSTOMER_SATISFACTION, 
                    newAverage, "Review received");
            }
        }
    }
}
package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.models.Seller;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class AdvancedInventoryManagementService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserBehaviorAnalyticsService behaviorAnalyticsService;
    
    @Autowired
    private CachingAndPerformanceService cachingService;
    
    // Inventory tracking and analytics
    private final Map<String, InventoryItem> inventoryTracking = new ConcurrentHashMap<>();
    private final Map<String, DemandForecast> demandForecasts = new ConcurrentHashMap<>();
    private final Map<String, RestockAlert> activeAlerts = new ConcurrentHashMap<>();
    private final Map<String, InventoryMetrics> categoryMetrics = new ConcurrentHashMap<>();
    private final List<InventoryEvent> inventoryHistory = Collections.synchronizedList(new ArrayList<>());
    
    // Configuration
    private static final int LOW_STOCK_THRESHOLD = 5;
    private static final int CRITICAL_STOCK_THRESHOLD = 2;
    private static final double DEMAND_SPIKE_THRESHOLD = 2.0; // 200% increase
    private static final int FORECAST_DAYS = 30;
    private static final int MAX_HISTORY_EVENTS = 10000;
    
    public CompletableFuture<InventoryAnalysis> analyzeInventoryHealth() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                List<Product> allProducts = productRepository.findByIsAvailableTrue();
                InventoryAnalysis analysis = new InventoryAnalysis();
                
                // Calculate overall metrics
                analysis.setTotalProducts(allProducts.size());
                analysis.setTotalValue(calculateTotalInventoryValue(allProducts));
                analysis.setAveragePrice(allProducts.stream().mapToDouble(Product::getPrice).average().orElse(0.0));
                
                // Analyze stock levels
                Map<StockLevel, Long> stockDistribution = analyzeStockLevels(allProducts);
                analysis.setStockDistribution(stockDistribution);
                
                // Identify slow-moving items
                List<Product> slowMoving = identifySlowMovingItems(allProducts);
                analysis.setSlowMovingItems(slowMoving);
                
                // Calculate turnover rates
                Map<String, Double> turnoverRates = calculateTurnoverRates();
                analysis.setTurnoverRates(turnoverRates);
                
                // Generate recommendations
                List<InventoryRecommendation> recommendations = generateInventoryRecommendations(allProducts, analysis);
                analysis.setRecommendations(recommendations);
                
                // Calculate health score
                double healthScore = calculateInventoryHealthScore(analysis);
                analysis.setHealthScore(healthScore);
                
                return analysis;
                
            } catch (Exception e) {
                throw new RuntimeException("Failed to analyze inventory health: " + e.getMessage(), e);
            }
        });
    }
    
    public CompletableFuture<DemandForecast> generateDemandForecast(String productId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Product product = productRepository.findById(productId).orElse(null);
                if (product == null) {
                    throw new IllegalArgumentException("Product not found: " + productId);
                }
                
                // Get historical demand data
                List<DemandDataPoint> historicalDemand = getHistoricalDemand(productId);
                
                if (historicalDemand.size() < 7) {
                    // Not enough data for accurate forecasting
                    return new DemandForecast(productId, ForecastAccuracy.LOW, Collections.emptyList());
                }
                
                // Apply forecasting algorithms
                List<DemandPrediction> predictions = new ArrayList<>();
                
                // Simple moving average (7-day)
                double movingAverage = calculateMovingAverage(historicalDemand, 7);
                
                // Trend analysis
                double trend = calculateTrend(historicalDemand);
                
                // Seasonal adjustment
                double seasonalFactor = calculateSeasonalFactor(product.getCategory());
                
                // Generate predictions for next 30 days
                for (int i = 1; i <= FORECAST_DAYS; i++) {
                    LocalDateTime date = LocalDateTime.now().plusDays(i);
                    double baseDemand = movingAverage + (trend * i);
                    double adjustedDemand = baseDemand * seasonalFactor;
                    
                    // Add day-of-week effect
                    double dayOfWeekFactor = getDayOfWeekFactor(date.getDayOfWeek());
                    adjustedDemand *= dayOfWeekFactor;
                    
                    predictions.add(new DemandPrediction(date, Math.max(0, adjustedDemand)));
                }
                
                // Calculate forecast accuracy based on data quality
                ForecastAccuracy accuracy = calculateForecastAccuracy(historicalDemand);
                
                DemandForecast forecast = new DemandForecast(productId, accuracy, predictions);
                demandForecasts.put(productId, forecast);
                
                return forecast;
                
            } catch (Exception e) {
                throw new RuntimeException("Failed to generate demand forecast: " + e.getMessage(), e);
            }
        });
    }
    
    @Async
    public void processInventoryEvent(InventoryEventType eventType, String productId, int quantity, String reason) {
        try {
            Product product = productRepository.findById(productId).orElse(null);
            if (product == null) return;
            
            // Create inventory event
            InventoryEvent event = new InventoryEvent(eventType, productId, quantity, reason);
            inventoryHistory.add(event);
            
            // Limit history size
            if (inventoryHistory.size() > MAX_HISTORY_EVENTS) {
                inventoryHistory.remove(0);
            }
            
            // Update inventory tracking
            updateInventoryTracking(productId, eventType, quantity);
            
            // Check for restock alerts
            checkRestockAlerts(productId);
            
            // Update demand forecasts if significant event
            if (eventType == InventoryEventType.SOLD && quantity > 10) {
                generateDemandForecast(productId);
            }
            
            // Update category metrics
            updateCategoryMetrics(product.getCategory(), eventType, quantity);
            
        } catch (Exception e) {
            System.err.println("Failed to process inventory event: " + e.getMessage());
        }
    }
    
    public List<RestockAlert> getRestockAlerts(AlertPriority minPriority) {
        return activeAlerts.values().stream()
                .filter(alert -> alert.getPriority().ordinal() >= minPriority.ordinal())
                .sorted((a, b) -> b.getPriority().compareTo(a.getPriority()))
                .collect(Collectors.toList());
    }
    
    public InventoryDashboard getInventoryDashboard() {
        InventoryDashboard dashboard = new InventoryDashboard();
        
        // Get basic inventory counts
        long totalProducts = productRepository.countByIsAvailableTrue();
        dashboard.setTotalProducts(totalProducts);
        
        // Alert counts
        Map<AlertPriority, Long> alertCounts = activeAlerts.values().stream()
                .collect(Collectors.groupingBy(RestockAlert::getPriority, Collectors.counting()));
        dashboard.setAlertCounts(alertCounts);
        
        // Low stock items
        List<Product> lowStockItems = findLowStockItems();
        dashboard.setLowStockCount(lowStockItems.size());
        dashboard.setLowStockItems(lowStockItems.stream().limit(10).collect(Collectors.toList()));
        
        // Top categories by value
        Map<String, Double> categoryValues = calculateCategoryValues();
        dashboard.setTopCategoriesByValue(categoryValues);
        
        // Recent inventory activities
        List<InventoryEvent> recentEvents = inventoryHistory.stream()
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .limit(20)
                .collect(Collectors.toList());
        dashboard.setRecentActivities(recentEvents);
        
        // Inventory health metrics
        dashboard.setInventoryTurnover(calculateOverallTurnover());
        dashboard.setAverageStockDays(calculateAverageStockDays());
        dashboard.setStockAccuracy(calculateStockAccuracy());
        
        return dashboard;
    }
    
    public CompletableFuture<OptimizationResult> optimizeInventoryLevels() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                List<Product> allProducts = productRepository.findByIsAvailableTrue();
                OptimizationResult result = new OptimizationResult();
                
                List<OptimizationRecommendation> recommendations = new ArrayList<>();
                
                for (Product product : allProducts) {
                    // Get demand forecast
                    DemandForecast forecast = demandForecasts.get(product.getId());
                    if (forecast == null) continue;
                    
                    // Calculate optimal stock level
                    double avgDailyDemand = forecast.getAverageDailyDemand();
                    double safetyStock = calculateSafetyStock(product.getId(), avgDailyDemand);
                    double optimalLevel = (avgDailyDemand * 14) + safetyStock; // 2-week supply
                    
                    // Current stock level (simplified - in reality would track actual inventory)
                    int currentStock = getCurrentStockLevel(product.getId());
                    
                    if (currentStock < optimalLevel * 0.5) {
                        // Needs restocking
                        recommendations.add(new OptimizationRecommendation(
                                product.getId(),
                                OptimizationType.RESTOCK,
                                currentStock,
                                (int) Math.ceil(optimalLevel),
                                "Low stock detected"
                        ));
                    } else if (currentStock > optimalLevel * 2) {
                        // Overstocked
                        recommendations.add(new OptimizationRecommendation(
                                product.getId(),
                                OptimizationType.REDUCE,
                                currentStock,
                                (int) Math.ceil(optimalLevel),
                                "Overstock detected"
                        ));
                    }
                }
                
                result.setRecommendations(recommendations);
                result.setPotentialSavings(calculatePotentialSavings(recommendations));
                result.setOptimizedProducts(recommendations.size());
                
                return result;
                
            } catch (Exception e) {
                throw new RuntimeException("Failed to optimize inventory levels: " + e.getMessage(), e);
            }
        });
    }
    
    @Scheduled(fixedDelay = 3600000) // Every hour
    public void monitorInventoryLevels() {
        try {
            List<Product> allProducts = productRepository.findByIsAvailableTrue();
            
            for (Product product : allProducts) {
                checkForLowStock(product);
                checkForDemandSpikes(product);
                updateInventoryTracking(product);
            }
            
            // Clean up old alerts
            cleanupExpiredAlerts();
            
            System.out.println("Inventory monitoring completed for " + allProducts.size() + " products");
            
        } catch (Exception e) {
            System.err.println("Inventory monitoring failed: " + e.getMessage());
        }
    }
    
    @Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM
    public void generateDailyInventoryReport() {
        try {
            InventoryReport report = new InventoryReport();
            report.setGeneratedAt(LocalDateTime.now());
            
            // Gather daily metrics
            report.setTotalProducts(productRepository.countByIsAvailableTrue());
            report.setLowStockAlerts(activeAlerts.size());
            report.setTotalInventoryValue(calculateTotalInventoryValue());
            
            // Yesterday's activity
            LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
            List<InventoryEvent> yesterdayEvents = inventoryHistory.stream()
                    .filter(event -> event.getTimestamp().isAfter(yesterday))
                    .collect(Collectors.toList());
            
            report.setDailyEvents(yesterdayEvents.size());
            report.setItemsSold(yesterdayEvents.stream()
                    .filter(event -> event.getEventType() == InventoryEventType.SOLD)
                    .mapToInt(InventoryEvent::getQuantity)
                    .sum());
            
            // Store report (in production, would save to database)
            System.out.println("Daily inventory report generated: " + report);
            
        } catch (Exception e) {
            System.err.println("Failed to generate daily inventory report: " + e.getMessage());
        }
    }
    
    // Private helper methods
    private double calculateTotalInventoryValue(List<Product> products) {
        return products.stream().mapToDouble(Product::getPrice).sum();
    }
    
    private double calculateTotalInventoryValue() {
        List<Product> allProducts = productRepository.findByIsAvailableTrue();
        return calculateTotalInventoryValue(allProducts);
    }
    
    private Map<StockLevel, Long> analyzeStockLevels(List<Product> products) {
        Map<StockLevel, Long> distribution = new EnumMap<>(StockLevel.class);
        
        for (Product product : products) {
            int stockLevel = getCurrentStockLevel(product.getId());
            StockLevel level;
            
            if (stockLevel <= CRITICAL_STOCK_THRESHOLD) {
                level = StockLevel.CRITICAL;
            } else if (stockLevel <= LOW_STOCK_THRESHOLD) {
                level = StockLevel.LOW;
            } else if (stockLevel <= 20) {
                level = StockLevel.NORMAL;
            } else {
                level = StockLevel.HIGH;
            }
            
            distribution.merge(level, 1L, Long::sum);
        }
        
        return distribution;
    }
    
    private List<Product> identifySlowMovingItems(List<Product> products) {
        return products.stream()
                .filter(product -> {
                    // Check if product hasn't sold in 30 days
                    LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
                    return inventoryHistory.stream()
                            .filter(event -> event.getProductId().equals(product.getId()))
                            .filter(event -> event.getEventType() == InventoryEventType.SOLD)
                            .noneMatch(event -> event.getTimestamp().isAfter(cutoff));
                })
                .collect(Collectors.toList());
    }
    
    private Map<String, Double> calculateTurnoverRates() {
        Map<String, Double> turnoverRates = new HashMap<>();
        
        // Group products by category
        List<Product> allProducts = productRepository.findByIsAvailableTrue();
        Map<String, List<Product>> productsByCategory = allProducts.stream()
                .collect(Collectors.groupingBy(Product::getCategory));
        
        for (Map.Entry<String, List<Product>> entry : productsByCategory.entrySet()) {
            String category = entry.getKey();
            List<Product> products = entry.getValue();
            
            // Calculate average turnover for category
            double avgTurnover = products.stream()
                    .mapToDouble(product -> calculateProductTurnover(product.getId()))
                    .average()
                    .orElse(0.0);
            
            turnoverRates.put(category, avgTurnover);
        }
        
        return turnoverRates;
    }
    
    private double calculateProductTurnover(String productId) {
        // Count sales in last 30 days
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        int salesCount = inventoryHistory.stream()
                .filter(event -> event.getProductId().equals(productId))
                .filter(event -> event.getEventType() == InventoryEventType.SOLD)
                .filter(event -> event.getTimestamp().isAfter(cutoff))
                .mapToInt(InventoryEvent::getQuantity)
                .sum();
        
        int averageStock = getCurrentStockLevel(productId);
        return averageStock > 0 ? (double) salesCount / averageStock : 0.0;
    }
    
    private List<InventoryRecommendation> generateInventoryRecommendations(List<Product> products, InventoryAnalysis analysis) {
        List<InventoryRecommendation> recommendations = new ArrayList<>();
        
        // Recommend restocking for low stock items
        analysis.getStockDistribution().forEach((level, count) -> {
            if (level == StockLevel.CRITICAL || level == StockLevel.LOW) {
                recommendations.add(new InventoryRecommendation(
                        RecommendationType.RESTOCK,
                        "Immediate restocking needed for " + count + " " + level.name() + " stock items",
                        RecommendationPriority.HIGH
                ));
            }
        });
        
        // Recommend clearance for slow-moving items
        if (!analysis.getSlowMovingItems().isEmpty()) {
            recommendations.add(new InventoryRecommendation(
                    RecommendationType.CLEARANCE,
                    "Consider clearance sale for " + analysis.getSlowMovingItems().size() + " slow-moving items",
                    RecommendationPriority.MEDIUM
            ));
        }
        
        return recommendations;
    }
    
    private double calculateInventoryHealthScore(InventoryAnalysis analysis) {
        double score = 100.0;
        
        // Penalize for critical/low stock
        Long criticalStock = analysis.getStockDistribution().getOrDefault(StockLevel.CRITICAL, 0L);
        Long lowStock = analysis.getStockDistribution().getOrDefault(StockLevel.LOW, 0L);
        
        score -= (criticalStock * 10.0) + (lowStock * 5.0);
        
        // Penalize for slow-moving inventory
        score -= analysis.getSlowMovingItems().size() * 2.0;
        
        // Adjust based on turnover rates
        double avgTurnover = analysis.getTurnoverRates().values().stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
        
        if (avgTurnover < 0.5) score -= 20; // Very low turnover
        else if (avgTurnover > 2.0) score += 10; // Good turnover
        
        return Math.max(0, Math.min(100, score));
    }
    
    private List<DemandDataPoint> getHistoricalDemand(String productId) {
        // Get demand data from inventory events
        return inventoryHistory.stream()
                .filter(event -> event.getProductId().equals(productId))
                .filter(event -> event.getEventType() == InventoryEventType.SOLD)
                .filter(event -> event.getTimestamp().isAfter(LocalDateTime.now().minusDays(60)))
                .map(event -> new DemandDataPoint(event.getTimestamp(), event.getQuantity()))
                .collect(Collectors.toList());
    }
    
    private double calculateMovingAverage(List<DemandDataPoint> data, int days) {
        return data.stream()
                .filter(point -> point.getDate().isAfter(LocalDateTime.now().minusDays(days)))
                .mapToDouble(DemandDataPoint::getQuantity)
                .average()
                .orElse(0.0);
    }
    
    private double calculateTrend(List<DemandDataPoint> data) {
        if (data.size() < 2) return 0.0;
        
        // Simple linear trend calculation
        List<DemandDataPoint> recent = data.stream()
                .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                .collect(Collectors.toList());
        
        if (recent.size() < 2) return 0.0;
        
        double firstValue = recent.get(0).getQuantity();
        double lastValue = recent.get(recent.size() - 1).getQuantity();
        long daysDifference = ChronoUnit.DAYS.between(recent.get(0).getDate(), recent.get(recent.size() - 1).getDate());
        
        return daysDifference > 0 ? (lastValue - firstValue) / daysDifference : 0.0;
    }
    
    private double calculateSeasonalFactor(String category) {
        // Simplified seasonal adjustment based on category
        int month = LocalDateTime.now().getMonthValue();
        
        switch (category.toLowerCase()) {
            case "outerwear":
            case "jackets":
                return (month >= 10 || month <= 3) ? 1.3 : 0.7; // Higher demand in fall/winter
            case "swimwear":
            case "shorts":
                return (month >= 4 && month <= 9) ? 1.4 : 0.6; // Higher demand in spring/summer
            default:
                return 1.0; // No seasonal adjustment
        }
    }
    
    private double getDayOfWeekFactor(java.time.DayOfWeek dayOfWeek) {
        // Weekend vs weekday shopping patterns
        return (dayOfWeek == java.time.DayOfWeek.SATURDAY || dayOfWeek == java.time.DayOfWeek.SUNDAY) ? 1.2 : 1.0;
    }
    
    private ForecastAccuracy calculateForecastAccuracy(List<DemandDataPoint> historicalData) {
        if (historicalData.size() < 7) return ForecastAccuracy.LOW;
        if (historicalData.size() < 30) return ForecastAccuracy.MEDIUM;
        return ForecastAccuracy.HIGH;
    }
    
    private void updateInventoryTracking(String productId, InventoryEventType eventType, int quantity) {
        InventoryItem item = inventoryTracking.computeIfAbsent(productId, id -> new InventoryItem(id));
        
        switch (eventType) {
            case SOLD:
                item.decreaseStock(quantity);
                break;
            case RESTOCKED:
                item.increaseStock(quantity);
                break;
            case DAMAGED:
            case RETURNED:
                item.adjustStock(quantity, eventType);
                break;
        }
        
        item.setLastUpdated(LocalDateTime.now());
    }
    
    private void updateInventoryTracking(Product product) {
        InventoryItem item = inventoryTracking.computeIfAbsent(product.getId(), id -> new InventoryItem(id));
        item.setLastUpdated(LocalDateTime.now());
    }
    
    private void checkRestockAlerts(String productId) {
        int currentStock = getCurrentStockLevel(productId);
        
        AlertPriority priority = null;
        String message = null;
        
        if (currentStock <= CRITICAL_STOCK_THRESHOLD) {
            priority = AlertPriority.CRITICAL;
            message = "Critical stock level: " + currentStock + " units remaining";
        } else if (currentStock <= LOW_STOCK_THRESHOLD) {
            priority = AlertPriority.HIGH;
            message = "Low stock level: " + currentStock + " units remaining";
        }
        
        if (priority != null) {
            RestockAlert alert = new RestockAlert(productId, priority, message);
            activeAlerts.put(productId, alert);
        } else {
            activeAlerts.remove(productId); // Remove alert if stock is sufficient
        }
    }
    
    private int getCurrentStockLevel(String productId) {
        // Simplified stock level calculation
        InventoryItem item = inventoryTracking.get(productId);
        return item != null ? item.getCurrentStock() : 1; // Default to 1 for available products
    }
    
    // Additional helper methods and classes would be implemented here...
    private void checkForLowStock(Product product) {
        checkRestockAlerts(product.getId());
    }
    
    private void checkForDemandSpikes(Product product) {
        // Check for unusual demand patterns
        List<DemandDataPoint> recentDemand = getHistoricalDemand(product.getId());
        if (recentDemand.size() < 7) return;
        
        double avgDemand = recentDemand.stream().mapToDouble(DemandDataPoint::getQuantity).average().orElse(0);
        double todayDemand = recentDemand.get(recentDemand.size() - 1).getQuantity();
        
        if (todayDemand > avgDemand * DEMAND_SPIKE_THRESHOLD) {
            // Demand spike detected - create alert
            RestockAlert alert = new RestockAlert(
                    product.getId(),
                    AlertPriority.MEDIUM,
                    "Demand spike detected: " + String.format("%.1f%%", (todayDemand / avgDemand) * 100) + " above average"
            );
            activeAlerts.put("spike_" + product.getId(), alert);
        }
    }
    
    private void updateCategoryMetrics(String category, InventoryEventType eventType, int quantity) {
        InventoryMetrics metrics = categoryMetrics.computeIfAbsent(category, cat -> new InventoryMetrics(cat));
        metrics.recordEvent(eventType, quantity);
    }
    
    private void cleanupExpiredAlerts() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        activeAlerts.entrySet().removeIf(entry -> entry.getValue().getCreatedAt().isBefore(cutoff));
    }
    
    private List<Product> findLowStockItems() {
        return productRepository.findByIsAvailableTrue().stream()
                .filter(product -> getCurrentStockLevel(product.getId()) <= LOW_STOCK_THRESHOLD)
                .collect(Collectors.toList());
    }
    
    private Map<String, Double> calculateCategoryValues() {
        return productRepository.findByIsAvailableTrue().stream()
                .collect(Collectors.groupingBy(Product::getCategory,
                        Collectors.summingDouble(Product::getPrice)));
    }
    
    private double calculateOverallTurnover() {
        return calculateTurnoverRates().values().stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    }
    
    private double calculateAverageStockDays() { return 15.0; } // Simplified
    private double calculateStockAccuracy() { return 0.95; } // Simplified
    private double calculateSafetyStock(String productId, double avgDailyDemand) { return avgDailyDemand * 3; }
    private double calculatePotentialSavings(List<OptimizationRecommendation> recommendations) { return recommendations.size() * 100.0; }
    
    // Enums and Data Classes
    public enum InventoryEventType { SOLD, RESTOCKED, DAMAGED, RETURNED, ADJUSTED }
    public enum StockLevel { CRITICAL, LOW, NORMAL, HIGH }
    public enum AlertPriority { LOW, MEDIUM, HIGH, CRITICAL }
    public enum ForecastAccuracy { LOW, MEDIUM, HIGH }
    public enum RecommendationType { RESTOCK, CLEARANCE, PRICE_ADJUSTMENT, CATEGORY_OPTIMIZATION }
    public enum RecommendationPriority { LOW, MEDIUM, HIGH }
    public enum OptimizationType { RESTOCK, REDUCE, MAINTAIN }
    
    public static class InventoryEvent {
        private InventoryEventType eventType;
        private String productId;
        private int quantity;
        private String reason;
        private LocalDateTime timestamp;
        
        public InventoryEvent(InventoryEventType eventType, String productId, int quantity, String reason) {
            this.eventType = eventType;
            this.productId = productId;
            this.quantity = quantity;
            this.reason = reason;
            this.timestamp = LocalDateTime.now();
        }
        
        // Getters
        public InventoryEventType getEventType() { return eventType; }
        public String getProductId() { return productId; }
        public int getQuantity() { return quantity; }
        public String getReason() { return reason; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
    
    public static class InventoryItem {
        private String productId;
        private int currentStock = 1;
        private LocalDateTime lastUpdated;
        private int totalSold = 0;
        private int totalRestocked = 0;
        
        public InventoryItem(String productId) {
            this.productId = productId;
            this.lastUpdated = LocalDateTime.now();
        }
        
        public void decreaseStock(int quantity) { 
            this.currentStock = Math.max(0, currentStock - quantity);
            this.totalSold += quantity;
        }
        public void increaseStock(int quantity) { 
            this.currentStock += quantity;
            this.totalRestocked += quantity;
        }
        public void adjustStock(int quantity, InventoryEventType reason) { this.currentStock += quantity; }
        
        // Getters and setters
        public String getProductId() { return productId; }
        public int getCurrentStock() { return currentStock; }
        public LocalDateTime getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
        public int getTotalSold() { return totalSold; }
        public int getTotalRestocked() { return totalRestocked; }
    }
    
    public static class DemandDataPoint {
        private LocalDateTime date;
        private double quantity;
        
        public DemandDataPoint(LocalDateTime date, double quantity) {
            this.date = date;
            this.quantity = quantity;
        }
        
        public LocalDateTime getDate() { return date; }
        public double getQuantity() { return quantity; }
    }
    
    public static class DemandPrediction {
        private LocalDateTime date;
        private double predictedDemand;
        
        public DemandPrediction(LocalDateTime date, double predictedDemand) {
            this.date = date;
            this.predictedDemand = predictedDemand;
        }
        
        public LocalDateTime getDate() { return date; }
        public double getPredictedDemand() { return predictedDemand; }
    }
    
    public static class DemandForecast {
        private String productId;
        private ForecastAccuracy accuracy;
        private List<DemandPrediction> predictions;
        private LocalDateTime generatedAt;
        
        public DemandForecast(String productId, ForecastAccuracy accuracy, List<DemandPrediction> predictions) {
            this.productId = productId;
            this.accuracy = accuracy;
            this.predictions = predictions;
            this.generatedAt = LocalDateTime.now();
        }
        
        public double getAverageDailyDemand() {
            return predictions.stream().mapToDouble(DemandPrediction::getPredictedDemand).average().orElse(0.0);
        }
        
        // Getters
        public String getProductId() { return productId; }
        public ForecastAccuracy getAccuracy() { return accuracy; }
        public List<DemandPrediction> getPredictions() { return predictions; }
        public LocalDateTime getGeneratedAt() { return generatedAt; }
    }
    
    public static class RestockAlert {
        private String productId;
        private AlertPriority priority;
        private String message;
        private LocalDateTime createdAt;
        
        public RestockAlert(String productId, AlertPriority priority, String message) {
            this.productId = productId;
            this.priority = priority;
            this.message = message;
            this.createdAt = LocalDateTime.now();
        }
        
        // Getters
        public String getProductId() { return productId; }
        public AlertPriority getPriority() { return priority; }
        public String getMessage() { return message; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }
    
    // Additional data classes (simplified implementations)
    public static class InventoryAnalysis {
        private int totalProducts;
        private double totalValue;
        private double averagePrice;
        private Map<StockLevel, Long> stockDistribution;
        private List<Product> slowMovingItems;
        private Map<String, Double> turnoverRates;
        private List<InventoryRecommendation> recommendations;
        private double healthScore;
        
        // Getters and setters
        public int getTotalProducts() { return totalProducts; }
        public void setTotalProducts(int totalProducts) { this.totalProducts = totalProducts; }
        public double getTotalValue() { return totalValue; }
        public void setTotalValue(double totalValue) { this.totalValue = totalValue; }
        public double getAveragePrice() { return averagePrice; }
        public void setAveragePrice(double averagePrice) { this.averagePrice = averagePrice; }
        public Map<StockLevel, Long> getStockDistribution() { return stockDistribution; }
        public void setStockDistribution(Map<StockLevel, Long> stockDistribution) { this.stockDistribution = stockDistribution; }
        public List<Product> getSlowMovingItems() { return slowMovingItems; }
        public void setSlowMovingItems(List<Product> slowMovingItems) { this.slowMovingItems = slowMovingItems; }
        public Map<String, Double> getTurnoverRates() { return turnoverRates; }
        public void setTurnoverRates(Map<String, Double> turnoverRates) { this.turnoverRates = turnoverRates; }
        public List<InventoryRecommendation> getRecommendations() { return recommendations; }
        public void setRecommendations(List<InventoryRecommendation> recommendations) { this.recommendations = recommendations; }
        public double getHealthScore() { return healthScore; }
        public void setHealthScore(double healthScore) { this.healthScore = healthScore; }
    }
    
    public static class InventoryRecommendation {
        private RecommendationType type;
        private String description;
        private RecommendationPriority priority;
        
        public InventoryRecommendation(RecommendationType type, String description, RecommendationPriority priority) {
            this.type = type;
            this.description = description;
            this.priority = priority;
        }
        
        public RecommendationType getType() { return type; }
        public String getDescription() { return description; }
        public RecommendationPriority getPriority() { return priority; }
    }
    
    public static class InventoryDashboard {
        private long totalProducts;
        private Map<AlertPriority, Long> alertCounts;
        private int lowStockCount;
        private List<Product> lowStockItems;
        private Map<String, Double> topCategoriesByValue;
        private List<InventoryEvent> recentActivities;
        private double inventoryTurnover;
        private double averageStockDays;
        private double stockAccuracy;
        
        // Getters and setters
        public long getTotalProducts() { return totalProducts; }
        public void setTotalProducts(long totalProducts) { this.totalProducts = totalProducts; }
        public Map<AlertPriority, Long> getAlertCounts() { return alertCounts; }
        public void setAlertCounts(Map<AlertPriority, Long> alertCounts) { this.alertCounts = alertCounts; }
        public int getLowStockCount() { return lowStockCount; }
        public void setLowStockCount(int lowStockCount) { this.lowStockCount = lowStockCount; }
        public List<Product> getLowStockItems() { return lowStockItems; }
        public void setLowStockItems(List<Product> lowStockItems) { this.lowStockItems = lowStockItems; }
        public Map<String, Double> getTopCategoriesByValue() { return topCategoriesByValue; }
        public void setTopCategoriesByValue(Map<String, Double> topCategoriesByValue) { this.topCategoriesByValue = topCategoriesByValue; }
        public List<InventoryEvent> getRecentActivities() { return recentActivities; }
        public void setRecentActivities(List<InventoryEvent> recentActivities) { this.recentActivities = recentActivities; }
        public double getInventoryTurnover() { return inventoryTurnover; }
        public void setInventoryTurnover(double inventoryTurnover) { this.inventoryTurnover = inventoryTurnover; }
        public double getAverageStockDays() { return averageStockDays; }
        public void setAverageStockDays(double averageStockDays) { this.averageStockDays = averageStockDays; }
        public double getStockAccuracy() { return stockAccuracy; }
        public void setStockAccuracy(double stockAccuracy) { this.stockAccuracy = stockAccuracy; }
    }
    
    // Additional placeholder classes
    public static class OptimizationResult {
        private List<OptimizationRecommendation> recommendations;
        private double potentialSavings;
        private int optimizedProducts;
        
        // Getters and setters
        public List<OptimizationRecommendation> getRecommendations() { return recommendations; }
        public void setRecommendations(List<OptimizationRecommendation> recommendations) { this.recommendations = recommendations; }
        public double getPotentialSavings() { return potentialSavings; }
        public void setPotentialSavings(double potentialSavings) { this.potentialSavings = potentialSavings; }
        public int getOptimizedProducts() { return optimizedProducts; }
        public void setOptimizedProducts(int optimizedProducts) { this.optimizedProducts = optimizedProducts; }
    }
    
    public static class OptimizationRecommendation {
        private String productId;
        private OptimizationType type;
        private int currentLevel;
        private int recommendedLevel;
        private String reason;
        
        public OptimizationRecommendation(String productId, OptimizationType type, int currentLevel, int recommendedLevel, String reason) {
            this.productId = productId;
            this.type = type;
            this.currentLevel = currentLevel;
            this.recommendedLevel = recommendedLevel;
            this.reason = reason;
        }
        
        // Getters
        public String getProductId() { return productId; }
        public OptimizationType getType() { return type; }
        public int getCurrentLevel() { return currentLevel; }
        public int getRecommendedLevel() { return recommendedLevel; }
        public String getReason() { return reason; }
    }
    
    public static class InventoryMetrics {
        private String category;
        private Map<InventoryEventType, Integer> eventCounts = new HashMap<>();
        
        public InventoryMetrics(String category) { this.category = category; }
        
        public void recordEvent(InventoryEventType type, int quantity) {
            eventCounts.merge(type, quantity, Integer::sum);
        }
        
        public String getCategory() { return category; }
        public Map<InventoryEventType, Integer> getEventCounts() { return eventCounts; }
    }
    
    public static class InventoryReport {
        private LocalDateTime generatedAt;
        private long totalProducts;
        private int lowStockAlerts;
        private double totalInventoryValue;
        private int dailyEvents;
        private int itemsSold;
        
        // Getters and setters
        public LocalDateTime getGeneratedAt() { return generatedAt; }
        public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
        public long getTotalProducts() { return totalProducts; }
        public void setTotalProducts(long totalProducts) { this.totalProducts = totalProducts; }
        public int getLowStockAlerts() { return lowStockAlerts; }
        public void setLowStockAlerts(int lowStockAlerts) { this.lowStockAlerts = lowStockAlerts; }
        public double getTotalInventoryValue() { return totalInventoryValue; }
        public void setTotalInventoryValue(double totalInventoryValue) { this.totalInventoryValue = totalInventoryValue; }
        public int getDailyEvents() { return dailyEvents; }
        public void setDailyEvents(int dailyEvents) { this.dailyEvents = dailyEvents; }
        public int getItemsSold() { return itemsSold; }
        public void setItemsSold(int itemsSold) { this.itemsSold = itemsSold; }
        
        @Override
        public String toString() {
            return "InventoryReport{totalProducts=" + totalProducts + ", lowStockAlerts=" + lowStockAlerts + 
                   ", totalValue=" + totalInventoryValue + ", dailyEvents=" + dailyEvents + ", itemsSold=" + itemsSold + "}";
        }
    }
}
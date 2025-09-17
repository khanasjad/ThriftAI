package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.models.Order;
import com.projectai.repository.ProductRepository;
import com.projectai.repository.OrderRepository;
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
public class AdvancedFulfillmentService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private CachingAndPerformanceService cachingService;
    
    // Fulfillment tracking
    private final Map<String, FulfillmentWorkflow> activeWorkflows = new ConcurrentHashMap<>();
    private final Map<String, ShippingPartner> shippingPartners = new ConcurrentHashMap<>();
    private final Map<String, WarehouseOperation> warehouseQueue = new ConcurrentHashMap<>();
    private final Map<String, FulfillmentMetrics> fulfillmentStats = new ConcurrentHashMap<>();
    
    // Configuration
    private static final int MAX_PROCESSING_TIME_HOURS = 24;
    private static final int BATCH_SIZE = 50;
    private static final double SLA_FULFILLMENT_HOURS = 48.0;
    
    public CompletableFuture<FulfillmentPlan> createFulfillmentPlan(String orderId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Order order = orderRepository.findById(orderId)
                        .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
                
                FulfillmentPlan plan = new FulfillmentPlan(orderId);
                
                // Analyze order complexity
                OrderComplexity complexity = analyzeOrderComplexity(order);
                plan.setComplexity(complexity);
                
                // Determine optimal fulfillment strategy
                FulfillmentStrategy strategy = selectFulfillmentStrategy(order, complexity);
                plan.setStrategy(strategy);
                
                // Calculate estimated timeline
                FulfillmentTimeline timeline = calculateFulfillmentTimeline(order, strategy);
                plan.setTimeline(timeline);
                
                // Select shipping partner
                ShippingPartner partner = selectOptimalShippingPartner(order);
                plan.setShippingPartner(partner);
                
                // Create workflow steps
                List<WorkflowStep> steps = generateWorkflowSteps(order, strategy);
                plan.setWorkflowSteps(steps);
                
                // Calculate costs
                FulfillmentCosts costs = calculateFulfillmentCosts(order, strategy, partner);
                plan.setCosts(costs);
                
                // Risk assessment
                RiskAssessment risks = assessFulfillmentRisks(order, strategy);
                plan.setRiskAssessment(risks);
                
                return plan;
                
            } catch (Exception e) {
                throw new RuntimeException("Failed to create fulfillment plan: " + e.getMessage(), e);
            }
        });
    }
    
    @Async
    public CompletableFuture<Void> executeFulfillmentPlan(String orderId, FulfillmentPlan plan) {
        return CompletableFuture.runAsync(() -> {
            try {
                FulfillmentWorkflow workflow = new FulfillmentWorkflow(orderId, plan);
                activeWorkflows.put(orderId, workflow);
                
                // Start workflow execution
                for (WorkflowStep step : plan.getWorkflowSteps()) {
                    executeWorkflowStep(workflow, step);
                    
                    // Update progress
                    workflow.completeStep(step.getStepId());
                    
                    // Check for issues
                    if (step.getStatus() == StepStatus.FAILED) {
                        handleWorkflowFailure(workflow, step);
                        break;
                    }
                }
                
                if (workflow.isCompleted()) {
                    finalizeOrderFulfillment(orderId);
                }
                
            } catch (Exception e) {
                handleFulfillmentException(orderId, e);
            }
        });
    }
    
    public FulfillmentStatus getFulfillmentStatus(String orderId) {
        FulfillmentWorkflow workflow = activeWorkflows.get(orderId);
        
        if (workflow == null) {
            // Check if order exists and get status from database
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) {
                return new FulfillmentStatus(orderId, "ORDER_NOT_FOUND", 0.0, Collections.emptyList());
            }
            
            return mapOrderStatusToFulfillmentStatus(order);
        }
        
        return new FulfillmentStatus(
                orderId,
                workflow.getCurrentStatus(),
                workflow.getProgressPercentage(),
                workflow.getCompletedSteps(),
                workflow.getEstimatedCompletion(),
                workflow.getCurrentStep() != null ? workflow.getCurrentStep().getDescription() : "Processing"
        );
    }
    
    public List<FulfillmentAlert> getActiveAlerts() {
        List<FulfillmentAlert> alerts = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        // Check for delayed orders
        List<Order> delayedOrders = orderRepository.findByStatusAndCreatedAtBefore(
                Order.OrderStatus.PROCESSING, 
                now.minusHours((long) SLA_FULFILLMENT_HOURS)
        );
        
        for (Order order : delayedOrders) {
            alerts.add(new FulfillmentAlert(
                    AlertType.SLA_BREACH,
                    AlertSeverity.HIGH,
                    "Order " + order.getId() + " exceeds SLA timeline",
                    order.getId()
            ));
        }
        
        // Check warehouse capacity
        long queueSize = warehouseQueue.size();
        if (queueSize > 100) {
            alerts.add(new FulfillmentAlert(
                    AlertType.CAPACITY_ISSUE,
                    AlertSeverity.MEDIUM,
                    "Warehouse queue high: " + queueSize + " operations pending",
                    null
            ));
        }
        
        // Check shipping partner performance
        for (ShippingPartner partner : shippingPartners.values()) {
            if (partner.getPerformanceScore() < 0.8) {
                alerts.add(new FulfillmentAlert(
                        AlertType.PARTNER_PERFORMANCE,
                        AlertSeverity.MEDIUM,
                        "Low performance from " + partner.getName() + ": " + 
                        String.format("%.1f%%", partner.getPerformanceScore() * 100),
                        null
                ));
            }
        }
        
        return alerts;
    }
    
    public FulfillmentDashboard getFulfillmentDashboard() {
        FulfillmentDashboard dashboard = new FulfillmentDashboard();
        
        // Order metrics
        dashboard.setTotalActiveOrders(activeWorkflows.size());
        dashboard.setPendingOrders(orderRepository.countByStatus(Order.OrderStatus.PENDING));
        dashboard.setProcessingOrders(orderRepository.countByStatus(Order.OrderStatus.PROCESSING));
        dashboard.setShippedOrders(orderRepository.countByStatus(Order.OrderStatus.SHIPPED));
        
        // Performance metrics
        dashboard.setAverageFulfillmentTime(calculateAverageFulfillmentTime());
        dashboard.setSlaComplianceRate(calculateSlaComplianceRate());
        
        // Warehouse metrics
        dashboard.setWarehouseQueueSize(warehouseQueue.size());
        dashboard.setWarehouseUtilization(calculateWarehouseUtilization());
        
        // Shipping metrics
        dashboard.setShippingPartnerCount(shippingPartners.size());
        dashboard.setAverageShippingCost(calculateAverageShippingCost());
        
        // Recent activities
        dashboard.setRecentActivities(getRecentFulfillmentActivities(10));
        
        // Alerts
        dashboard.setActiveAlerts(getActiveAlerts());
        
        return dashboard;
    }
    
    public CompletableFuture<Void> optimizeFulfillmentRoutes() {
        return CompletableFuture.runAsync(() -> {
            try {
                // Get all pending orders
                List<Order> pendingOrders = orderRepository.findByStatusOrderByCreatedAtDesc(Order.OrderStatus.PENDING);
                
                // Group by geographic region
                Map<String, List<Order>> ordersByRegion = groupOrdersByRegion(pendingOrders);
                
                // Optimize shipping routes for each region
                for (Map.Entry<String, List<Order>> entry : ordersByRegion.entrySet()) {
                    String region = entry.getKey();
                    List<Order> orders = entry.getValue();
                    
                    RouteOptimization optimization = optimizeRegionalRoutes(region, orders);
                    applyRouteOptimization(optimization);
                }
                
                System.out.println("Route optimization completed for " + pendingOrders.size() + " orders");
                
            } catch (Exception e) {
                System.err.println("Route optimization failed: " + e.getMessage());
            }
        });
    }
    
    @Scheduled(fixedDelay = 300000) // Every 5 minutes
    public void monitorFulfillmentWorkflows() {
        LocalDateTime now = LocalDateTime.now();
        
        for (FulfillmentWorkflow workflow : activeWorkflows.values()) {
            // Check for stuck workflows
            if (workflow.getLastUpdated().isBefore(now.minusHours(1))) {
                handleStuckWorkflow(workflow);
            }
            
            // Update progress estimates
            updateWorkflowEstimates(workflow);
            
            // Check SLA compliance
            if (workflow.isOverdue()) {
                escalateOverdueWorkflow(workflow);
            }
        }
        
        // Cleanup completed workflows
        activeWorkflows.entrySet().removeIf(entry -> entry.getValue().isCompleted());
    }
    
    @Scheduled(fixedDelay = 3600000) // Every hour
    public void updateShippingPartnerMetrics() {
        for (ShippingPartner partner : shippingPartners.values()) {
            updatePartnerPerformanceMetrics(partner);
        }
    }
    
    public BatchFulfillmentResult processBatchFulfillment(List<String> orderIds) {
        BatchFulfillmentResult result = new BatchFulfillmentResult();
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        
        // Process orders in batches
        for (int i = 0; i < orderIds.size(); i += BATCH_SIZE) {
            List<String> batch = orderIds.subList(i, Math.min(i + BATCH_SIZE, orderIds.size()));
            
            CompletableFuture<Void> batchFuture = CompletableFuture.runAsync(() -> {
                processFulfillmentBatch(batch, result);
            });
            
            futures.add(batchFuture);
        }
        
        // Wait for all batches to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        
        return result;
    }
    
    // Private helper methods
    private OrderComplexity analyzeOrderComplexity(Order order) {
        int itemCount = order.getOrderItems() != null ? order.getOrderItems().size() : 1;
        boolean hasSpecialHandling = requiresSpecialHandling(order);
        boolean isInternational = isInternationalOrder(order);
        
        if (itemCount > 10 || hasSpecialHandling || isInternational) {
            return OrderComplexity.HIGH;
        } else if (itemCount > 5 || hasSpecialHandling) {
            return OrderComplexity.MEDIUM;
        } else {
            return OrderComplexity.LOW;
        }
    }
    
    private FulfillmentStrategy selectFulfillmentStrategy(Order order, OrderComplexity complexity) {
        // Select strategy based on order characteristics
        if (complexity == OrderComplexity.HIGH) {
            return FulfillmentStrategy.CUSTOM_HANDLING;
        } else if (order.getTotal() > 500) {
            return FulfillmentStrategy.PRIORITY_PROCESSING;
        } else {
            return FulfillmentStrategy.STANDARD_PROCESSING;
        }
    }
    
    private FulfillmentTimeline calculateFulfillmentTimeline(Order order, FulfillmentStrategy strategy) {
        LocalDateTime now = LocalDateTime.now();
        
        // Base processing time
        int processingHours = switch (strategy) {
            case PRIORITY_PROCESSING -> 4;
            case CUSTOM_HANDLING -> 12;
            default -> 8;
        };
        
        // Shipping time (estimated)
        int shippingHours = 48; // 2 days standard
        
        return new FulfillmentTimeline(
                now,
                now.plusHours(processingHours),
                now.plusHours(processingHours + shippingHours),
                processingHours,
                shippingHours
        );
    }
    
    private ShippingPartner selectOptimalShippingPartner(Order order) {
        // Simple partner selection logic
        String destination = order.getShippingState();
        double orderWeight = estimateOrderWeight(order);
        
        return shippingPartners.values().stream()
                .min((p1, p2) -> {
                    double cost1 = p1.calculateShippingCost(destination, orderWeight);
                    double cost2 = p2.calculateShippingCost(destination, orderWeight);
                    return Double.compare(cost1, cost2);
                })
                .orElse(getDefaultShippingPartner());
    }
    
    private List<WorkflowStep> generateWorkflowSteps(Order order, FulfillmentStrategy strategy) {
        List<WorkflowStep> steps = new ArrayList<>();
        
        steps.add(new WorkflowStep("INVENTORY_CHECK", "Verify inventory availability", 5));
        steps.add(new WorkflowStep("PICK_ITEMS", "Pick items from warehouse", 15));
        steps.add(new WorkflowStep("QUALITY_CHECK", "Quality control inspection", 10));
        steps.add(new WorkflowStep("PACKAGING", "Package items for shipping", 10));
        steps.add(new WorkflowStep("LABEL_GENERATION", "Generate shipping labels", 5));
        steps.add(new WorkflowStep("HANDOFF_CARRIER", "Hand off to shipping carrier", 5));
        
        if (strategy == FulfillmentStrategy.CUSTOM_HANDLING) {
            steps.add(1, new WorkflowStep("SPECIAL_HANDLING", "Special handling requirements", 30));
        }
        
        return steps;
    }
    
    private FulfillmentCosts calculateFulfillmentCosts(Order order, FulfillmentStrategy strategy, ShippingPartner partner) {
        double laborCost = calculateLaborCost(order, strategy);
        double packagingCost = calculatePackagingCost(order);
        double shippingCost = partner.calculateShippingCost(order.getShippingState(), estimateOrderWeight(order));
        double overheadCost = (laborCost + packagingCost) * 0.15; // 15% overhead
        
        return new FulfillmentCosts(laborCost, packagingCost, shippingCost, overheadCost);
    }
    
    private RiskAssessment assessFulfillmentRisks(Order order, FulfillmentStrategy strategy) {
        List<RiskFactor> risks = new ArrayList<>();
        
        // Address validation risk
        if (!isValidAddress(order.getShippingAddress())) {
            risks.add(new RiskFactor(RiskType.ADDRESS_VALIDATION, RiskLevel.HIGH, "Invalid shipping address"));
        }
        
        // International shipping risk
        if (isInternationalOrder(order)) {
            risks.add(new RiskFactor(RiskType.CUSTOMS_DELAY, RiskLevel.MEDIUM, "International shipping delays possible"));
        }
        
        // High-value order risk
        if (order.getTotal() > 1000) {
            risks.add(new RiskFactor(RiskType.THEFT_LOSS, RiskLevel.MEDIUM, "High-value shipment"));
        }
        
        double overallRiskScore = risks.stream().mapToDouble(r -> r.getLevel().getScore()).average().orElse(0.0);
        
        return new RiskAssessment(overallRiskScore, risks);
    }
    
    private void executeWorkflowStep(FulfillmentWorkflow workflow, WorkflowStep step) {
        try {
            step.setStatus(StepStatus.IN_PROGRESS);
            step.setStartTime(LocalDateTime.now());
            
            // Simulate step execution
            Thread.sleep(step.getEstimatedDurationMinutes() * 100); // Simulate work
            
            // Step-specific logic
            switch (step.getStepId()) {
                case "INVENTORY_CHECK":
                    performInventoryCheck(workflow.getOrderId());
                    break;
                case "PICK_ITEMS":
                    performItemPicking(workflow.getOrderId());
                    break;
                case "QUALITY_CHECK":
                    performQualityCheck(workflow.getOrderId());
                    break;
                case "PACKAGING":
                    performPackaging(workflow.getOrderId());
                    break;
                case "LABEL_GENERATION":
                    generateShippingLabel(workflow.getOrderId());
                    break;
                case "HANDOFF_CARRIER":
                    handoffToCarrier(workflow.getOrderId());
                    break;
            }
            
            step.setStatus(StepStatus.COMPLETED);
            step.setEndTime(LocalDateTime.now());
            
        } catch (Exception e) {
            step.setStatus(StepStatus.FAILED);
            step.setErrorMessage(e.getMessage());
            step.setEndTime(LocalDateTime.now());
        }
    }
    
    // Workflow step implementations (simplified)
    private void performInventoryCheck(String orderId) {
        // Mock inventory check
        System.out.println("Performing inventory check for order: " + orderId);
    }
    
    private void performItemPicking(String orderId) {
        // Mock item picking
        System.out.println("Picking items for order: " + orderId);
    }
    
    private void performQualityCheck(String orderId) {
        // Mock quality check
        System.out.println("Quality check for order: " + orderId);
    }
    
    private void performPackaging(String orderId) {
        // Mock packaging
        System.out.println("Packaging order: " + orderId);
    }
    
    private void generateShippingLabel(String orderId) {
        // Mock label generation
        System.out.println("Generating shipping label for order: " + orderId);
    }
    
    private void handoffToCarrier(String orderId) {
        // Mock carrier handoff
        orderService.updateOrderStatus(orderId, Order.OrderStatus.SHIPPED);
        System.out.println("Handed off to carrier: " + orderId);
    }
    
    // Additional helper methods would be implemented here...
    private boolean requiresSpecialHandling(Order order) { return false; }
    private boolean isInternationalOrder(Order order) { return !"US".equals(order.getShippingCountry()); }
    private double estimateOrderWeight(Order order) { return 2.0; } // kg
    private boolean isValidAddress(String address) { return address != null && !address.trim().isEmpty(); }
    private double calculateLaborCost(Order order, FulfillmentStrategy strategy) { return 5.0; }
    private double calculatePackagingCost(Order order) { return 2.0; }
    private double calculateAverageFulfillmentTime() { return 24.0; }
    private double calculateSlaComplianceRate() { return 0.95; }
    private double calculateWarehouseUtilization() { return 0.75; }
    private double calculateAverageShippingCost() { return 12.50; }
    private ShippingPartner getDefaultShippingPartner() { return new ShippingPartner("DEFAULT", "Default Shipping", 0.9); }
    
    // Enums and Data Classes
    public enum OrderComplexity { LOW, MEDIUM, HIGH }
    public enum FulfillmentStrategy { STANDARD_PROCESSING, PRIORITY_PROCESSING, CUSTOM_HANDLING }
    public enum StepStatus { PENDING, IN_PROGRESS, COMPLETED, FAILED }
    public enum AlertType { SLA_BREACH, CAPACITY_ISSUE, PARTNER_PERFORMANCE, INVENTORY_LOW }
    public enum AlertSeverity { LOW, MEDIUM, HIGH, CRITICAL }
    public enum RiskType { ADDRESS_VALIDATION, CUSTOMS_DELAY, THEFT_LOSS, WEATHER_DELAY }
    public enum RiskLevel { 
        LOW(0.2), MEDIUM(0.5), HIGH(0.8), CRITICAL(1.0);
        private final double score;
        RiskLevel(double score) { this.score = score; }
        public double getScore() { return score; }
    }
    
    public static class FulfillmentPlan {
        private String orderId;
        private OrderComplexity complexity;
        private FulfillmentStrategy strategy;
        private FulfillmentTimeline timeline;
        private ShippingPartner shippingPartner;
        private List<WorkflowStep> workflowSteps;
        private FulfillmentCosts costs;
        private RiskAssessment riskAssessment;
        
        public FulfillmentPlan(String orderId) { this.orderId = orderId; }
        
        // Getters and setters
        public String getOrderId() { return orderId; }
        public OrderComplexity getComplexity() { return complexity; }
        public void setComplexity(OrderComplexity complexity) { this.complexity = complexity; }
        public FulfillmentStrategy getStrategy() { return strategy; }
        public void setStrategy(FulfillmentStrategy strategy) { this.strategy = strategy; }
        public FulfillmentTimeline getTimeline() { return timeline; }
        public void setTimeline(FulfillmentTimeline timeline) { this.timeline = timeline; }
        public ShippingPartner getShippingPartner() { return shippingPartner; }
        public void setShippingPartner(ShippingPartner shippingPartner) { this.shippingPartner = shippingPartner; }
        public List<WorkflowStep> getWorkflowSteps() { return workflowSteps; }
        public void setWorkflowSteps(List<WorkflowStep> workflowSteps) { this.workflowSteps = workflowSteps; }
        public FulfillmentCosts getCosts() { return costs; }
        public void setCosts(FulfillmentCosts costs) { this.costs = costs; }
        public RiskAssessment getRiskAssessment() { return riskAssessment; }
        public void setRiskAssessment(RiskAssessment riskAssessment) { this.riskAssessment = riskAssessment; }
    }
    
    public static class WorkflowStep {
        private String stepId;
        private String description;
        private int estimatedDurationMinutes;
        private StepStatus status = StepStatus.PENDING;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String errorMessage;
        
        public WorkflowStep(String stepId, String description, int estimatedDurationMinutes) {
            this.stepId = stepId;
            this.description = description;
            this.estimatedDurationMinutes = estimatedDurationMinutes;
        }
        
        // Getters and setters
        public String getStepId() { return stepId; }
        public String getDescription() { return description; }
        public int getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
        public StepStatus getStatus() { return status; }
        public void setStatus(StepStatus status) { this.status = status; }
        public LocalDateTime getStartTime() { return startTime; }
        public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
        public LocalDateTime getEndTime() { return endTime; }
        public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }
    
    // Additional data classes would be implemented here...
    public static class FulfillmentTimeline {
        private LocalDateTime startTime;
        private LocalDateTime estimatedProcessingComplete;
        private LocalDateTime estimatedDelivery;
        private int processingHours;
        private int shippingHours;
        
        public FulfillmentTimeline(LocalDateTime startTime, LocalDateTime estimatedProcessingComplete, 
                                 LocalDateTime estimatedDelivery, int processingHours, int shippingHours) {
            this.startTime = startTime;
            this.estimatedProcessingComplete = estimatedProcessingComplete;
            this.estimatedDelivery = estimatedDelivery;
            this.processingHours = processingHours;
            this.shippingHours = shippingHours;
        }
        
        // Getters
        public LocalDateTime getStartTime() { return startTime; }
        public LocalDateTime getEstimatedProcessingComplete() { return estimatedProcessingComplete; }
        public LocalDateTime getEstimatedDelivery() { return estimatedDelivery; }
        public int getProcessingHours() { return processingHours; }
        public int getShippingHours() { return shippingHours; }
    }
    
    // Simplified implementations for remaining classes
    public static class ShippingPartner {
        private String id;
        private String name;
        private double performanceScore;
        
        public ShippingPartner(String id, String name, double performanceScore) {
            this.id = id;
            this.name = name;
            this.performanceScore = performanceScore;
        }
        
        public double calculateShippingCost(String destination, double weight) {
            return 10.0 + (weight * 2.0); // Simplified calculation
        }
        
        public String getId() { return id; }
        public String getName() { return name; }
        public double getPerformanceScore() { return performanceScore; }
    }
    
    public static class FulfillmentStatus {
        private String orderId;
        private String status;
        private double progressPercentage;
        private List<String> completedSteps;
        private LocalDateTime estimatedCompletion;
        private String currentActivity;
        
        public FulfillmentStatus(String orderId, String status, double progressPercentage, List<String> completedSteps) {
            this.orderId = orderId;
            this.status = status;
            this.progressPercentage = progressPercentage;
            this.completedSteps = completedSteps;
        }
        
        public FulfillmentStatus(String orderId, String status, double progressPercentage, List<String> completedSteps,
                               LocalDateTime estimatedCompletion, String currentActivity) {
            this(orderId, status, progressPercentage, completedSteps);
            this.estimatedCompletion = estimatedCompletion;
            this.currentActivity = currentActivity;
        }
        
        // Getters
        public String getOrderId() { return orderId; }
        public String getStatus() { return status; }
        public double getProgressPercentage() { return progressPercentage; }
        public List<String> getCompletedSteps() { return completedSteps; }
        public LocalDateTime getEstimatedCompletion() { return estimatedCompletion; }
        public String getCurrentActivity() { return currentActivity; }
    }
    
    // Additional placeholder classes
    public static class FulfillmentWorkflow {
        private String orderId;
        private FulfillmentPlan plan;
        private LocalDateTime lastUpdated;
        private Set<String> completedSteps = new HashSet<>();
        private WorkflowStep currentStep;
        
        public FulfillmentWorkflow(String orderId, FulfillmentPlan plan) {
            this.orderId = orderId;
            this.plan = plan;
            this.lastUpdated = LocalDateTime.now();
        }
        
        public void completeStep(String stepId) {
            completedSteps.add(stepId);
            lastUpdated = LocalDateTime.now();
        }
        
        public boolean isCompleted() {
            return completedSteps.size() == plan.getWorkflowSteps().size();
        }
        
        public double getProgressPercentage() {
            return (double) completedSteps.size() / plan.getWorkflowSteps().size();
        }
        
        public boolean isOverdue() {
            return LocalDateTime.now().isAfter(plan.getTimeline().getEstimatedProcessingComplete());
        }
        
        public String getCurrentStatus() { return isCompleted() ? "COMPLETED" : "IN_PROGRESS"; }
        public String getOrderId() { return orderId; }
        public LocalDateTime getLastUpdated() { return lastUpdated; }
        public List<String> getCompletedSteps() { return new ArrayList<>(completedSteps); }
        public WorkflowStep getCurrentStep() { return currentStep; }
        public LocalDateTime getEstimatedCompletion() { return plan.getTimeline().getEstimatedProcessingComplete(); }
    }
    
    // Additional simple classes
    public static class FulfillmentCosts {
        private double laborCost;
        private double packagingCost;
        private double shippingCost;
        private double overheadCost;
        
        public FulfillmentCosts(double laborCost, double packagingCost, double shippingCost, double overheadCost) {
            this.laborCost = laborCost;
            this.packagingCost = packagingCost;
            this.shippingCost = shippingCost;
            this.overheadCost = overheadCost;
        }
        
        public double getTotalCost() { return laborCost + packagingCost + shippingCost + overheadCost; }
        public double getLaborCost() { return laborCost; }
        public double getPackagingCost() { return packagingCost; }
        public double getShippingCost() { return shippingCost; }
        public double getOverheadCost() { return overheadCost; }
    }
    
    public static class RiskAssessment {
        private double overallRiskScore;
        private List<RiskFactor> riskFactors;
        
        public RiskAssessment(double overallRiskScore, List<RiskFactor> riskFactors) {
            this.overallRiskScore = overallRiskScore;
            this.riskFactors = riskFactors;
        }
        
        public double getOverallRiskScore() { return overallRiskScore; }
        public List<RiskFactor> getRiskFactors() { return riskFactors; }
    }
    
    public static class RiskFactor {
        private RiskType type;
        private RiskLevel level;
        private String description;
        
        public RiskFactor(RiskType type, RiskLevel level, String description) {
            this.type = type;
            this.level = level;
            this.description = description;
        }
        
        public RiskType getType() { return type; }
        public RiskLevel getLevel() { return level; }
        public String getDescription() { return description; }
    }
    
    public static class FulfillmentAlert {
        private AlertType type;
        private AlertSeverity severity;
        private String message;
        private String orderId;
        private LocalDateTime timestamp;
        
        public FulfillmentAlert(AlertType type, AlertSeverity severity, String message, String orderId) {
            this.type = type;
            this.severity = severity;
            this.message = message;
            this.orderId = orderId;
            this.timestamp = LocalDateTime.now();
        }
        
        // Getters
        public AlertType getType() { return type; }
        public AlertSeverity getSeverity() { return severity; }
        public String getMessage() { return message; }
        public String getOrderId() { return orderId; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
    
    // Placeholder implementations for remaining methods
    private void handleWorkflowFailure(FulfillmentWorkflow workflow, WorkflowStep step) { }
    private void finalizeOrderFulfillment(String orderId) { }
    private void handleFulfillmentException(String orderId, Exception e) { }
    private FulfillmentStatus mapOrderStatusToFulfillmentStatus(Order order) { 
        return new FulfillmentStatus(order.getId(), order.getStatus().name(), 0.5, Collections.emptyList());
    }
    private Map<String, List<Order>> groupOrdersByRegion(List<Order> orders) { return new HashMap<>(); }
    private RouteOptimization optimizeRegionalRoutes(String region, List<Order> orders) { return new RouteOptimization(); }
    private void applyRouteOptimization(RouteOptimization optimization) { }
    private void handleStuckWorkflow(FulfillmentWorkflow workflow) { }
    private void updateWorkflowEstimates(FulfillmentWorkflow workflow) { }
    private void escalateOverdueWorkflow(FulfillmentWorkflow workflow) { }
    private void updatePartnerPerformanceMetrics(ShippingPartner partner) { }
    private void processFulfillmentBatch(List<String> batch, BatchFulfillmentResult result) { }
    private List<String> getRecentFulfillmentActivities(int limit) { return new ArrayList<>(); }
    
    // Simple placeholder classes
    public static class WarehouseOperation { }
    public static class FulfillmentMetrics { }
    public static class RouteOptimization { }
    public static class BatchFulfillmentResult { }
    public static class FulfillmentDashboard {
        private int totalActiveOrders;
        private long pendingOrders;
        private long processingOrders;
        private long shippedOrders;
        private double averageFulfillmentTime;
        private double slaComplianceRate;
        private int warehouseQueueSize;
        private double warehouseUtilization;
        private int shippingPartnerCount;
        private double averageShippingCost;
        private List<String> recentActivities;
        private List<FulfillmentAlert> activeAlerts;
        
        // Getters and setters
        public int getTotalActiveOrders() { return totalActiveOrders; }
        public void setTotalActiveOrders(int totalActiveOrders) { this.totalActiveOrders = totalActiveOrders; }
        public long getPendingOrders() { return pendingOrders; }
        public void setPendingOrders(long pendingOrders) { this.pendingOrders = pendingOrders; }
        public long getProcessingOrders() { return processingOrders; }
        public void setProcessingOrders(long processingOrders) { this.processingOrders = processingOrders; }
        public long getShippedOrders() { return shippedOrders; }
        public void setShippedOrders(long shippedOrders) { this.shippedOrders = shippedOrders; }
        public double getAverageFulfillmentTime() { return averageFulfillmentTime; }
        public void setAverageFulfillmentTime(double averageFulfillmentTime) { this.averageFulfillmentTime = averageFulfillmentTime; }
        public double getSlaComplianceRate() { return slaComplianceRate; }
        public void setSlaComplianceRate(double slaComplianceRate) { this.slaComplianceRate = slaComplianceRate; }
        public int getWarehouseQueueSize() { return warehouseQueueSize; }
        public void setWarehouseQueueSize(int warehouseQueueSize) { this.warehouseQueueSize = warehouseQueueSize; }
        public double getWarehouseUtilization() { return warehouseUtilization; }
        public void setWarehouseUtilization(double warehouseUtilization) { this.warehouseUtilization = warehouseUtilization; }
        public int getShippingPartnerCount() { return shippingPartnerCount; }
        public void setShippingPartnerCount(int shippingPartnerCount) { this.shippingPartnerCount = shippingPartnerCount; }
        public double getAverageShippingCost() { return averageShippingCost; }
        public void setAverageShippingCost(double averageShippingCost) { this.averageShippingCost = averageShippingCost; }
        public List<String> getRecentActivities() { return recentActivities; }
        public void setRecentActivities(List<String> recentActivities) { this.recentActivities = recentActivities; }
        public List<FulfillmentAlert> getActiveAlerts() { return activeAlerts; }
        public void setActiveAlerts(List<FulfillmentAlert> activeAlerts) { this.activeAlerts = activeAlerts; }
    }
}
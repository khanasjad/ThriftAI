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
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class CachingAndPerformanceService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private RecommendationEngineService recommendationEngine;
    
    @Autowired
    private IntelligentSearchService intelligentSearchService;
    
    // Multi-layer caching system
    private final ConcurrentHashMap<String, CacheEntry> l1Cache = new ConcurrentHashMap<>(); // Fast in-memory cache
    private final ConcurrentHashMap<String, CacheEntry> l2Cache = new ConcurrentHashMap<>(); // Larger secondary cache
    private final ConcurrentHashMap<String, CompletableFuture<Object>> pendingOperations = new ConcurrentHashMap<>();
    
    // Performance monitoring
    private final Map<String, PerformanceMetrics> performanceMetrics = new ConcurrentHashMap<>();
    private final Map<String, DatabaseQueryStats> queryStats = new ConcurrentHashMap<>();
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong cacheHits = new AtomicLong(0);
    private final AtomicLong cacheMisses = new AtomicLong(0);
    
    // Connection pooling and optimization
    private final ExecutorService asyncExecutor = Executors.newFixedThreadPool(20);
    private final ExecutorService cacheExecutor = Executors.newFixedThreadPool(10);
    private final ScheduledExecutorService maintenanceExecutor = Executors.newScheduledThreadPool(5);
    
    // Cache configuration
    private static final long L1_CACHE_SIZE_LIMIT = 10000; // entries
    private static final long L2_CACHE_SIZE_LIMIT = 50000; // entries
    private static final long L1_TTL_MINUTES = 15;
    private static final long L2_TTL_MINUTES = 60;
    private static final long CACHE_CLEANUP_INTERVAL_MINUTES = 10;
    
    // Precomputed data caches
    private final Map<String, List<Product>> precomputedRecommendations = new ConcurrentHashMap<>();
    private final Map<String, List<Product>> precomputedSearchResults = new ConcurrentHashMap<>();
    private final Map<String, Object> precomputedAnalytics = new ConcurrentHashMap<>();
    
    public <T> CompletableFuture<T> getOrCompute(String key, Callable<T> computation, 
                                               CacheLevel level, long ttlMinutes) {
        totalRequests.incrementAndGet();
        
        // Check L1 cache first
        CacheEntry entry = l1Cache.get(key);
        if (entry != null && !entry.isExpired()) {
            cacheHits.incrementAndGet();
            return CompletableFuture.completedFuture((T) entry.getValue());
        }
        
        // Check L2 cache if L1 miss
        if (level == CacheLevel.L2 || level == CacheLevel.BOTH) {
            entry = l2Cache.get(key);
            if (entry != null && !entry.isExpired()) {
                cacheHits.incrementAndGet();
                // Promote to L1 cache
                l1Cache.put(key, new CacheEntry(entry.getValue(), L1_TTL_MINUTES));
                return CompletableFuture.completedFuture((T) entry.getValue());
            }
        }
        
        cacheMisses.incrementAndGet();
        
        // Prevent duplicate computations for the same key
        return (CompletableFuture<T>) pendingOperations.computeIfAbsent(key, k -> 
            CompletableFuture.supplyAsync(() -> {
                try {
                    long startTime = System.currentTimeMillis();
                    T result = computation.call();
                    long executionTime = System.currentTimeMillis() - startTime;
                    
                    // Store in appropriate cache levels
                    CacheEntry newEntry = new CacheEntry(result, ttlMinutes);
                    if (level == CacheLevel.L1 || level == CacheLevel.BOTH) {
                        l1Cache.put(key, newEntry);
                    }
                    if (level == CacheLevel.L2 || level == CacheLevel.BOTH) {
                        l2Cache.put(key, newEntry);
                    }
                    
                    // Update performance metrics
                    updatePerformanceMetrics(key, executionTime, true);
                    
                    return result;
                } catch (Exception e) {
                    updatePerformanceMetrics(key, 0, false);
                    throw new RuntimeException("Computation failed for key: " + key, e);
                } finally {
                    pendingOperations.remove(key);
                }
            }, asyncExecutor)
        );
    }
    
    public CompletableFuture<List<Product>> getCachedRecommendations(String userId, int limit) {
        String cacheKey = "recommendations:" + userId + ":" + limit;
        
        return getOrCompute(cacheKey, () -> {
            return recommendationEngine.getPersonalizedRecommendations(userId, limit);
        }, CacheLevel.BOTH, L1_TTL_MINUTES);
    }
    
    public CompletableFuture<List<Product>> getCachedSearchResults(String query, String userId) {
        String cacheKey = "search:" + query.toLowerCase() + ":" + userId;
        
        return getOrCompute(cacheKey, () -> {
            return intelligentSearchService.intelligentSearch(userId, query, null).getResults();
        }, CacheLevel.L2, L2_TTL_MINUTES);
    }
    
    public CompletableFuture<Product> getCachedProduct(String productId) {
        String cacheKey = "product:" + productId;
        
        return getOrCompute(cacheKey, () -> {
            return productRepository.findById(productId).orElse(null);
        }, CacheLevel.BOTH, L2_TTL_MINUTES);
    }
    
    @Async
    public void precomputeRecommendations(String userId) {
        CompletableFuture.runAsync(() -> {
            try {
                List<Product> recommendations = recommendationEngine.getPersonalizedRecommendations(userId, 50);
                precomputedRecommendations.put(userId, recommendations);
                
                // Also cache in main cache system
                String cacheKey = "recommendations:" + userId + ":50";
                l1Cache.put(cacheKey, new CacheEntry(recommendations, L1_TTL_MINUTES));
                
            } catch (Exception e) {
                System.err.println("Failed to precompute recommendations for user: " + userId);
            }
        }, cacheExecutor);
    }
    
    @Async
    public void precomputePopularSearches() {
        CompletableFuture.runAsync(() -> {
            try {
                List<String> trendingSearches = intelligentSearchService.getTrendingSearches(20);
                
                for (String query : trendingSearches) {
                    List<Product> results = intelligentSearchService.searchWithSemanticSimilarity(query, 30);
                    precomputedSearchResults.put(query.toLowerCase(), results);
                    
                    // Cache in L2
                    String cacheKey = "search:" + query.toLowerCase() + ":anonymous";
                    l2Cache.put(cacheKey, new CacheEntry(results, L2_TTL_MINUTES));
                }
                
            } catch (Exception e) {
                System.err.println("Failed to precompute popular searches");
            }
        }, cacheExecutor);
    }
    
    public void warmupCache() {
        CompletableFuture.runAsync(() -> {
            try {
                // Warmup popular products
                List<Product> popularProducts = productRepository.findAll()
                        .stream()
                        .limit(1000)
                        .collect(Collectors.toList());
                
                for (Product product : popularProducts) {
                    String cacheKey = "product:" + product.getId();
                    l1Cache.put(cacheKey, new CacheEntry(product, L2_TTL_MINUTES));
                }
                
                // Warmup trending searches
                precomputePopularSearches();
                
                System.out.println("Cache warmup completed: " + popularProducts.size() + " products cached");
                
            } catch (Exception e) {
                System.err.println("Cache warmup failed: " + e.getMessage());
            }
        }, cacheExecutor);
    }
    
    public void invalidateCache(String pattern) {
        // Remove entries matching pattern from both cache levels
        Set<String> keysToRemove = new HashSet<>();
        
        l1Cache.keySet().stream()
                .filter(key -> key.contains(pattern))
                .forEach(keysToRemove::add);
        
        l2Cache.keySet().stream()
                .filter(key -> key.contains(pattern))
                .forEach(keysToRemove::add);
        
        keysToRemove.forEach(key -> {
            l1Cache.remove(key);
            l2Cache.remove(key);
        });
        
        System.out.println("Invalidated " + keysToRemove.size() + " cache entries matching pattern: " + pattern);
    }
    
    public void invalidateUserCache(String userId) {
        invalidateCache(":" + userId);
        precomputedRecommendations.remove(userId);
    }
    
    public void invalidateProductCache(String productId) {
        invalidateCache("product:" + productId);
    }
    
    @Scheduled(fixedDelay = CACHE_CLEANUP_INTERVAL_MINUTES * 60 * 1000) // Convert to milliseconds
    public void cleanupExpiredEntries() {
        CompletableFuture.runAsync(() -> {
            long cleanupStart = System.currentTimeMillis();
            
            // Cleanup L1 cache
            int l1Removed = cleanupCache(l1Cache);
            
            // Cleanup L2 cache
            int l2Removed = cleanupCache(l2Cache);
            
            // Cleanup precomputed caches
            cleanupPrecomputedCaches();
            
            // Enforce size limits
            enforceCacheSizeLimits();
            
            long cleanupTime = System.currentTimeMillis() - cleanupStart;
            System.out.println("Cache cleanup completed in " + cleanupTime + "ms. " +
                             "L1 removed: " + l1Removed + ", L2 removed: " + l2Removed);
            
        }, maintenanceExecutor);
    }
    
    public CacheStatistics getCacheStatistics() {
        long total = totalRequests.get();
        long hits = cacheHits.get();
        long misses = cacheMisses.get();
        
        double hitRate = total > 0 ? (double) hits / total : 0.0;
        double missRate = total > 0 ? (double) misses / total : 0.0;
        
        return new CacheStatistics(
                l1Cache.size(),
                l2Cache.size(),
                precomputedRecommendations.size(),
                precomputedSearchResults.size(),
                total,
                hits,
                misses,
                hitRate,
                missRate,
                calculateMemoryUsage(),
                getTopPerformingOperations()
        );
    }
    
    public PerformanceReport generatePerformanceReport() {
        Map<String, OperationStats> operationStats = new HashMap<>();
        
        for (Map.Entry<String, PerformanceMetrics> entry : performanceMetrics.entrySet()) {
            PerformanceMetrics metrics = entry.getValue();
            operationStats.put(entry.getKey(), new OperationStats(
                    metrics.getTotalRequests(),
                    metrics.getAverageResponseTime(),
                    metrics.getSuccessRate(),
                    metrics.getLastExecuted()
            ));
        }
        
        return new PerformanceReport(
                getCacheStatistics(),
                operationStats,
                getSlowQueries(),
                getSystemResourceUsage(),
                LocalDateTime.now()
        );
    }
    
    public void optimizeQueryPerformance() {
        CompletableFuture.runAsync(() -> {
            try {
                // Identify slow queries
                List<DatabaseQueryStats> slowQueries = getSlowQueries();
                
                // Create indices for frequently accessed fields
                for (DatabaseQueryStats query : slowQueries) {
                    if (query.getAverageExecutionTime() > 1000) { // > 1 second
                        suggestOptimization(query);
                    }
                }
                
                // Precompute expensive operations
                precomputeExpensiveOperations();
                
            } catch (Exception e) {
                System.err.println("Query optimization failed: " + e.getMessage());
            }
        }, maintenanceExecutor);
    }
    
    // Batch operations for better performance
    public CompletableFuture<List<Product>> batchGetProducts(List<String> productIds) {
        return CompletableFuture.supplyAsync(() -> {
            List<Product> products = new ArrayList<>();
            List<String> uncachedIds = new ArrayList<>();
            
            // Check cache first
            for (String id : productIds) {
                String cacheKey = "product:" + id;
                CacheEntry entry = l1Cache.get(cacheKey);
                if (entry != null && !entry.isExpired()) {
                    products.add((Product) entry.getValue());
                    cacheHits.incrementAndGet();
                } else {
                    uncachedIds.add(id);
                    cacheMisses.incrementAndGet();
                }
            }
            
            // Fetch uncached products in batch
            if (!uncachedIds.isEmpty()) {
                List<Product> uncachedProducts = productRepository.findAllById(uncachedIds);
                
                // Cache the results
                for (Product product : uncachedProducts) {
                    String cacheKey = "product:" + product.getId();
                    l1Cache.put(cacheKey, new CacheEntry(product, L2_TTL_MINUTES));
                }
                
                products.addAll(uncachedProducts);
            }
            
            totalRequests.addAndGet(productIds.size());
            return products;
        }, asyncExecutor);
    }
    
    // Private helper methods
    private int cleanupCache(ConcurrentHashMap<String, CacheEntry> cache) {
        int removed = 0;
        Iterator<Map.Entry<String, CacheEntry>> iterator = cache.entrySet().iterator();
        
        while (iterator.hasNext()) {
            Map.Entry<String, CacheEntry> entry = iterator.next();
            if (entry.getValue().isExpired()) {
                iterator.remove();
                removed++;
            }
        }
        
        return removed;
    }
    
    private void cleanupPrecomputedCaches() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(2);
        
        precomputedRecommendations.entrySet().removeIf(entry -> {
            // This is simplified - in production, you'd track creation time
            return false; // Keep for now, implement proper timestamp tracking
        });
        
        precomputedSearchResults.entrySet().removeIf(entry -> {
            // This is simplified - in production, you'd track creation time
            return false; // Keep for now, implement proper timestamp tracking
        });
    }
    
    private void enforceCacheSizeLimits() {
        // L1 cache size enforcement (LRU eviction)
        if (l1Cache.size() > L1_CACHE_SIZE_LIMIT) {
            List<Map.Entry<String, CacheEntry>> entries = new ArrayList<>(l1Cache.entrySet());
            entries.sort(Map.Entry.comparingByValue((e1, e2) -> 
                Long.compare(e1.getLastAccessed(), e2.getLastAccessed())));
            
            int toRemove = (int) (l1Cache.size() - L1_CACHE_SIZE_LIMIT * 0.9); // Remove 10% extra
            for (int i = 0; i < toRemove && i < entries.size(); i++) {
                l1Cache.remove(entries.get(i).getKey());
            }
        }
        
        // L2 cache size enforcement
        if (l2Cache.size() > L2_CACHE_SIZE_LIMIT) {
            List<Map.Entry<String, CacheEntry>> entries = new ArrayList<>(l2Cache.entrySet());
            entries.sort(Map.Entry.comparingByValue((e1, e2) -> 
                Long.compare(e1.getLastAccessed(), e2.getLastAccessed())));
            
            int toRemove = (int) (l2Cache.size() - L2_CACHE_SIZE_LIMIT * 0.9);
            for (int i = 0; i < toRemove && i < entries.size(); i++) {
                l2Cache.remove(entries.get(i).getKey());
            }
        }
    }
    
    private void updatePerformanceMetrics(String operation, long executionTime, boolean success) {
        performanceMetrics.computeIfAbsent(operation, k -> new PerformanceMetrics(k))
                .recordExecution(executionTime, success);
    }
    
    private long calculateMemoryUsage() {
        // Simplified memory usage calculation
        Runtime runtime = Runtime.getRuntime();
        return runtime.totalMemory() - runtime.freeMemory();
    }
    
    private List<String> getTopPerformingOperations() {
        return performanceMetrics.entrySet().stream()
                .sorted(Map.Entry.<String, PerformanceMetrics>comparingByValue(
                        (m1, m2) -> Long.compare(m1.getAverageResponseTime(), m2.getAverageResponseTime())))
                .limit(10)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }
    
    private List<DatabaseQueryStats> getSlowQueries() {
        return queryStats.values().stream()
                .filter(stats -> stats.getAverageExecutionTime() > 500) // > 500ms
                .sorted((s1, s2) -> Long.compare(s2.getAverageExecutionTime(), s1.getAverageExecutionTime()))
                .limit(10)
                .collect(Collectors.toList());
    }
    
    private Map<String, Object> getSystemResourceUsage() {
        Map<String, Object> resources = new HashMap<>();
        Runtime runtime = Runtime.getRuntime();
        
        resources.put("totalMemory", runtime.totalMemory());
        resources.put("freeMemory", runtime.freeMemory());
        resources.put("usedMemory", runtime.totalMemory() - runtime.freeMemory());
        resources.put("maxMemory", runtime.maxMemory());
        resources.put("availableProcessors", runtime.availableProcessors());
        
        return resources;
    }
    
    private void suggestOptimization(DatabaseQueryStats query) {
        System.out.println("Optimization suggestion for slow query: " + query.getQueryPattern() + 
                          " (avg: " + query.getAverageExecutionTime() + "ms)");
        // In production, this would generate specific optimization recommendations
    }
    
    private void precomputeExpensiveOperations() {
        // Precompute frequently accessed expensive operations
        CompletableFuture.runAsync(() -> {
            try {
                // Example: Precompute category aggregations
                Map<String, Long> categoryCounts = productRepository.findAll()
                        .stream()
                        .collect(Collectors.groupingBy(Product::getCategory, Collectors.counting()));
                
                precomputedAnalytics.put("category_counts", categoryCounts);
                
            } catch (Exception e) {
                System.err.println("Failed to precompute expensive operations: " + e.getMessage());
            }
        }, cacheExecutor);
    }
    
    // Enums and Data Classes
    public enum CacheLevel {
        L1, L2, BOTH
    }
    
    public static class CacheEntry {
        private final Object value;
        private final long expirationTime;
        private volatile long lastAccessed;
        
        public CacheEntry(Object value, long ttlMinutes) {
            this.value = value;
            this.expirationTime = System.currentTimeMillis() + (ttlMinutes * 60 * 1000);
            this.lastAccessed = System.currentTimeMillis();
        }
        
        public Object getValue() {
            this.lastAccessed = System.currentTimeMillis();
            return value;
        }
        
        public boolean isExpired() {
            return System.currentTimeMillis() > expirationTime;
        }
        
        public long getLastAccessed() {
            return lastAccessed;
        }
    }
    
    public static class CacheStatistics {
        private final int l1Size;
        private final int l2Size;
        private final int precomputedRecommendationsSize;
        private final int precomputedSearchSize;
        private final long totalRequests;
        private final long cacheHits;
        private final long cacheMisses;
        private final double hitRate;
        private final double missRate;
        private final long memoryUsage;
        private final List<String> topOperations;
        
        public CacheStatistics(int l1Size, int l2Size, int precomputedRecommendationsSize, 
                              int precomputedSearchSize, long totalRequests, long cacheHits, 
                              long cacheMisses, double hitRate, double missRate, long memoryUsage,
                              List<String> topOperations) {
            this.l1Size = l1Size;
            this.l2Size = l2Size;
            this.precomputedRecommendationsSize = precomputedRecommendationsSize;
            this.precomputedSearchSize = precomputedSearchSize;
            this.totalRequests = totalRequests;
            this.cacheHits = cacheHits;
            this.cacheMisses = cacheMisses;
            this.hitRate = hitRate;
            this.missRate = missRate;
            this.memoryUsage = memoryUsage;
            this.topOperations = topOperations;
        }
        
        // Getters
        public int getL1Size() { return l1Size; }
        public int getL2Size() { return l2Size; }
        public int getPrecomputedRecommendationsSize() { return precomputedRecommendationsSize; }
        public int getPrecomputedSearchSize() { return precomputedSearchSize; }
        public long getTotalRequests() { return totalRequests; }
        public long getCacheHits() { return cacheHits; }
        public long getCacheMisses() { return cacheMisses; }
        public double getHitRate() { return hitRate; }
        public double getMissRate() { return missRate; }
        public long getMemoryUsage() { return memoryUsage; }
        public List<String> getTopOperations() { return topOperations; }
    }
    
    public static class PerformanceMetrics {
        private final String operation;
        private long totalRequests;
        private long totalResponseTime;
        private long successfulRequests;
        private LocalDateTime lastExecuted;
        
        public PerformanceMetrics(String operation) {
            this.operation = operation;
            this.totalRequests = 0;
            this.totalResponseTime = 0;
            this.successfulRequests = 0;
            this.lastExecuted = LocalDateTime.now();
        }
        
        public synchronized void recordExecution(long responseTime, boolean success) {
            totalRequests++;
            totalResponseTime += responseTime;
            if (success) successfulRequests++;
            lastExecuted = LocalDateTime.now();
        }
        
        public long getAverageResponseTime() {
            return totalRequests > 0 ? totalResponseTime / totalRequests : 0;
        }
        
        public double getSuccessRate() {
            return totalRequests > 0 ? (double) successfulRequests / totalRequests : 0;
        }
        
        // Getters
        public String getOperation() { return operation; }
        public long getTotalRequests() { return totalRequests; }
        public LocalDateTime getLastExecuted() { return lastExecuted; }
    }
    
    public static class DatabaseQueryStats {
        private final String queryPattern;
        private final long averageExecutionTime;
        private final long totalExecutions;
        
        public DatabaseQueryStats(String queryPattern, long averageExecutionTime, long totalExecutions) {
            this.queryPattern = queryPattern;
            this.averageExecutionTime = averageExecutionTime;
            this.totalExecutions = totalExecutions;
        }
        
        public String getQueryPattern() { return queryPattern; }
        public long getAverageExecutionTime() { return averageExecutionTime; }
        public long getTotalExecutions() { return totalExecutions; }
    }
    
    public static class OperationStats {
        private final long totalRequests;
        private final long averageResponseTime;
        private final double successRate;
        private final LocalDateTime lastExecuted;
        
        public OperationStats(long totalRequests, long averageResponseTime, double successRate, LocalDateTime lastExecuted) {
            this.totalRequests = totalRequests;
            this.averageResponseTime = averageResponseTime;
            this.successRate = successRate;
            this.lastExecuted = lastExecuted;
        }
        
        // Getters
        public long getTotalRequests() { return totalRequests; }
        public long getAverageResponseTime() { return averageResponseTime; }
        public double getSuccessRate() { return successRate; }
        public LocalDateTime getLastExecuted() { return lastExecuted; }
    }
    
    public static class PerformanceReport {
        private final CacheStatistics cacheStats;
        private final Map<String, OperationStats> operationStats;
        private final List<DatabaseQueryStats> slowQueries;
        private final Map<String, Object> systemResources;
        private final LocalDateTime generatedAt;
        
        public PerformanceReport(CacheStatistics cacheStats, Map<String, OperationStats> operationStats,
                               List<DatabaseQueryStats> slowQueries, Map<String, Object> systemResources,
                               LocalDateTime generatedAt) {
            this.cacheStats = cacheStats;
            this.operationStats = operationStats;
            this.slowQueries = slowQueries;
            this.systemResources = systemResources;
            this.generatedAt = generatedAt;
        }
        
        // Getters
        public CacheStatistics getCacheStats() { return cacheStats; }
        public Map<String, OperationStats> getOperationStats() { return operationStats; }
        public List<DatabaseQueryStats> getSlowQueries() { return slowQueries; }
        public Map<String, Object> getSystemResources() { return systemResources; }
        public LocalDateTime getGeneratedAt() { return generatedAt; }
    }
}
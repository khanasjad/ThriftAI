package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.models.ProductEmbedding;
import com.projectai.repository.ProductEmbeddingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

/**
 * Vector-based semantic search service
 * Provides advanced product search using vector embeddings for true semantic matching
 */
@Service
public class VectorSearchService {

    private static final Logger logger = LoggerFactory.getLogger(VectorSearchService.class);

    @Autowired
    private ProductEmbeddingService productEmbeddingService;

    @Autowired
    private ProductEmbeddingRepository productEmbeddingRepository;

    // Category mappings for intelligent filtering
    private static final Map<String, List<String>> CATEGORY_MAPPINGS = createCategoryMappings();

    private static Map<String, List<String>> createCategoryMappings() {
        Map<String, List<String>> mappings = new HashMap<>();
        mappings.put("bag", Arrays.asList("accessories"));
        mappings.put("bags", Arrays.asList("accessories"));
        mappings.put("handbag", Arrays.asList("accessories"));
        mappings.put("purse", Arrays.asList("accessories"));
        mappings.put("tote", Arrays.asList("accessories"));
        mappings.put("jeans", Arrays.asList("clothing"));
        mappings.put("shirt", Arrays.asList("clothing"));
        mappings.put("dress", Arrays.asList("clothing"));
        mappings.put("phone", Arrays.asList("electronics"));
        mappings.put("laptop", Arrays.asList("electronics"));
        mappings.put("computer", Arrays.asList("electronics"));
        return mappings;
    }

    // Categories to exclude based on query intent
    private static final Map<String, List<String>> EXCLUSION_MAPPINGS = createExclusionMappings();

    private static Map<String, List<String>> createExclusionMappings() {
        Map<String, List<String>> mappings = new HashMap<>();
        mappings.put("bag", Arrays.asList("clothing", "electronics", "books", "shoes"));
        mappings.put("bags", Arrays.asList("clothing", "electronics", "books", "shoes"));
        mappings.put("handbag", Arrays.asList("clothing", "electronics", "books", "shoes"));
        mappings.put("purse", Arrays.asList("clothing", "electronics", "books", "shoes"));
        mappings.put("jeans", Arrays.asList("accessories", "electronics", "books", "shoes"));
        mappings.put("shirt", Arrays.asList("accessories", "electronics", "books", "shoes"));
        mappings.put("phone", Arrays.asList("clothing", "accessories", "books", "shoes"));
        mappings.put("electronics", Arrays.asList("clothing", "accessories", "books", "shoes"));
        return mappings;
    }

    /**
     * Perform semantic search using vector embeddings
     * This is the main entry point for vector-based product search
     *
     * @param query the search query
     * @param limit maximum number of results to return
     * @return list of products ranked by semantic similarity
     */
    public List<Product> semanticSearch(String query, int limit) {
        logger.info("🔍 Performing vector semantic search for query: '{}' (limit: {})", query, limit);

        try {
            // Generate query embedding
            float[] queryEmbedding = productEmbeddingService.generateQueryEmbedding(query);
            String embeddingString = convertEmbeddingToString(queryEmbedding);

            // Determine search strategy based on query
            SearchStrategy strategy = determineSearchStrategy(query);

            List<ProductEmbedding> similarEmbeddings;

            switch (strategy.type) {
                case CATEGORY_FILTERED:
                    logger.info("📂 Using category-filtered search for category: {}", strategy.targetCategory);
                    similarEmbeddings = productEmbeddingRepository.findSimilarProductsByCategory(
                            embeddingString, strategy.targetCategory, limit);
                    break;

                case EXCLUSION_FILTERED:
                    logger.info("❌ Using exclusion-filtered search, excluding: {}", strategy.excludedCategories);
                    similarEmbeddings = productEmbeddingRepository.findSimilarProductsExcludingCategories(
                            embeddingString, strategy.excludedCategories, limit);
                    break;

                case HYBRID:
                    logger.info("🔄 Using hybrid search combining vector and text");
                    similarEmbeddings = productEmbeddingRepository.findProductsHybridSearch(
                            embeddingString, query, limit);
                    break;

                default:
                    logger.info("🎯 Using standard vector similarity search");
                    similarEmbeddings = productEmbeddingRepository.findSimilarProductsByCombinedEmbedding(
                            embeddingString, limit);
                    break;
            }

            // Convert to products and apply additional filtering
            List<Product> results = similarEmbeddings.stream()
                    .map(ProductEmbedding::getProduct)
                    .filter(product -> product != null && product.isAvailable())
                    .collect(Collectors.toList());

            logger.info("✅ Vector search completed. Found {} results for query: '{}'", results.size(), query);

            // Log top results for debugging
            if (!results.isEmpty()) {
                logger.info("🏆 Top vector search results:");
                for (int i = 0; i < Math.min(3, results.size()); i++) {
                    Product p = results.get(i);
                    logger.info("  {}. {} (Category: {}, Brand: {})",
                            i + 1, p.getName(), p.getCategory(), p.getBrand());
                }
            }

            return results;

        } catch (Exception e) {
            logger.error("❌ Vector search failed for query '{}': {}", query, e.getMessage());
            // Return empty list rather than throwing exception to allow fallback
            return new ArrayList<>();
        }
    }

    /**
     * Advanced semantic search with additional filters
     *
     * @param query the search query
     * @param category optional category filter
     * @param minPrice minimum price filter
     * @param maxPrice maximum price filter
     * @param limit maximum number of results
     * @return filtered and ranked products
     */
    public List<Product> semanticSearchAdvanced(String query, String category,
                                               double minPrice, double maxPrice, int limit) {
        logger.info("🔍 Advanced vector search: query='{}', category='{}', price={}−{}",
                   query, category, minPrice, maxPrice);

        try {
            float[] queryEmbedding = productEmbeddingService.generateQueryEmbedding(query);
            String embeddingString = convertEmbeddingToString(queryEmbedding);

            List<ProductEmbedding> similarEmbeddings = productEmbeddingRepository.findSimilarProductsAdvanced(
                    embeddingString, category, null, minPrice, maxPrice, limit);

            List<Product> results = similarEmbeddings.stream()
                    .map(ProductEmbedding::getProduct)
                    .filter(product -> product != null && product.isAvailable())
                    .collect(Collectors.toList());

            logger.info("✅ Advanced vector search completed. Found {} results", results.size());
            return results;

        } catch (Exception e) {
            logger.error("❌ Advanced vector search failed: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Determine the best search strategy based on the query
     */
    private SearchStrategy determineSearchStrategy(String query) {
        String lowerQuery = query.toLowerCase();

        // Check for specific category intent
        for (Map.Entry<String, List<String>> entry : CATEGORY_MAPPINGS.entrySet()) {
            if (lowerQuery.contains(entry.getKey())) {
                String targetCategory = entry.getValue().get(0);

                // Check if we should exclude categories instead
                if (EXCLUSION_MAPPINGS.containsKey(entry.getKey())) {
                    return new SearchStrategy(
                            SearchStrategyType.EXCLUSION_FILTERED,
                            null,
                            EXCLUSION_MAPPINGS.get(entry.getKey())
                    );
                } else {
                    return new SearchStrategy(
                            SearchStrategyType.CATEGORY_FILTERED,
                            targetCategory,
                            null
                    );
                }
            }
        }

        // Default to standard vector search
        return new SearchStrategy(SearchStrategyType.STANDARD, null, null);
    }

    /**
     * Convert embedding array to PostgreSQL vector string format
     */
    private String convertEmbeddingToString(float[] embedding) {
        if (embedding == null || embedding.length == 0) {
            throw new IllegalArgumentException("Embedding cannot be null or empty");
        }

        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < embedding.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(embedding[i]);
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * Check if vector search is available (embeddings exist)
     */
    public boolean isVectorSearchAvailable() {
        try {
            long embeddingCount = productEmbeddingRepository.count();
            boolean available = embeddingCount > 0;
            logger.debug("Vector search availability: {} (embeddings: {})", available, embeddingCount);
            return available;
        } catch (Exception e) {
            logger.warn("Could not check vector search availability: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get vector search statistics
     */
    public Map<String, Object> getVectorSearchStats() {
        try {
            Map<String, Object> stats = productEmbeddingService.getEmbeddingStatistics();
            stats.put("vectorSearchAvailable", isVectorSearchAvailable());
            return stats;
        } catch (Exception e) {
            logger.error("Failed to get vector search stats: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    // Helper classes for search strategy
    private enum SearchStrategyType {
        STANDARD,
        CATEGORY_FILTERED,
        EXCLUSION_FILTERED,
        HYBRID
    }

    private static class SearchStrategy {
        final SearchStrategyType type;
        final String targetCategory;
        final List<String> excludedCategories;

        SearchStrategy(SearchStrategyType type, String targetCategory, List<String> excludedCategories) {
            this.type = type;
            this.targetCategory = targetCategory;
            this.excludedCategories = excludedCategories;
        }
    }
}
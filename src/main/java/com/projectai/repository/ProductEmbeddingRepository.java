package com.projectai.repository;

import com.projectai.models.ProductEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for ProductEmbedding entity with vector similarity search capabilities
 * Provides methods for semantic search using vector embeddings
 */
@Repository
public interface ProductEmbeddingRepository extends JpaRepository<ProductEmbedding, String> {

    /**
     * Count embeddings that need updating
     */
    long countByNeedsUpdateTrue();

    /**
     * Find embeddings that need updates
     */
    List<ProductEmbedding> findByNeedsUpdateTrue();

    /**
     * Find similar products using combined embedding with cosine similarity
     * Uses PostgreSQL vector operations for similarity search
     *
     * @param queryEmbedding the query vector as comma-separated string
     * @param limit maximum number of results
     * @return list of similar ProductEmbeddings ordered by similarity
     */
    @Query(value = """
        SELECT pe.* FROM product_embeddings pe
        JOIN products p ON pe.product_id = p.id
        WHERE pe.combined_embedding IS NOT NULL
        AND p.is_available = true
        ORDER BY pe.combined_embedding <-> CAST(:queryEmbedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<ProductEmbedding> findSimilarProductsByCombinedEmbedding(
            @Param("queryEmbedding") String queryEmbedding,
            @Param("limit") int limit);

    /**
     * Find similar products using name embedding with cosine similarity
     *
     * @param queryEmbedding the query vector as comma-separated string
     * @param limit maximum number of results
     * @return list of similar ProductEmbeddings ordered by similarity
     */
    @Query(value = """
        SELECT pe.* FROM product_embeddings pe
        JOIN products p ON pe.product_id = p.id
        WHERE pe.name_embedding IS NOT NULL
        AND p.is_available = true
        ORDER BY pe.name_embedding <-> CAST(:queryEmbedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<ProductEmbedding> findSimilarProductsByNameEmbedding(
            @Param("queryEmbedding") String queryEmbedding,
            @Param("limit") int limit);

    /**
     * Find similar products with category filtering
     * Combines vector similarity with traditional category filtering
     *
     * @param queryEmbedding the query vector as comma-separated string
     * @param category the product category to filter by
     * @param limit maximum number of results
     * @return list of similar ProductEmbeddings in specified category
     */
    @Query(value = """
        SELECT pe.* FROM product_embeddings pe
        JOIN products p ON pe.product_id = p.id
        WHERE pe.combined_embedding IS NOT NULL
        AND p.is_available = true
        AND LOWER(p.category) = LOWER(:category)
        ORDER BY pe.combined_embedding <-> CAST(:queryEmbedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<ProductEmbedding> findSimilarProductsByCategory(
            @Param("queryEmbedding") String queryEmbedding,
            @Param("category") String category,
            @Param("limit") int limit);

    /**
     * Find similar products with price range filtering
     * Combines vector similarity with price constraints
     *
     * @param queryEmbedding the query vector as comma-separated string
     * @param minPrice minimum price filter
     * @param maxPrice maximum price filter
     * @param limit maximum number of results
     * @return list of similar ProductEmbeddings within price range
     */
    @Query(value = """
        SELECT pe.* FROM product_embeddings pe
        JOIN products p ON pe.product_id = p.id
        WHERE pe.combined_embedding IS NOT NULL
        AND p.is_available = true
        AND p.price BETWEEN :minPrice AND :maxPrice
        ORDER BY pe.combined_embedding <-> CAST(:queryEmbedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<ProductEmbedding> findSimilarProductsByPriceRange(
            @Param("queryEmbedding") String queryEmbedding,
            @Param("minPrice") double minPrice,
            @Param("maxPrice") double maxPrice,
            @Param("limit") int limit);

    /**
     * Advanced semantic search with multiple filters
     * Combines vector similarity with category, price, and brand filtering
     *
     * @param queryEmbedding the query vector as comma-separated string
     * @param category optional category filter (null to ignore)
     * @param brand optional brand filter (null to ignore)
     * @param minPrice minimum price (0 to ignore)
     * @param maxPrice maximum price (Double.MAX_VALUE to ignore)
     * @param limit maximum number of results
     * @return list of similar ProductEmbeddings matching all criteria
     */
    @Query(value = """
        SELECT pe.* FROM product_embeddings pe
        JOIN products p ON pe.product_id = p.id
        WHERE pe.combined_embedding IS NOT NULL
        AND p.is_available = true
        AND (:category IS NULL OR LOWER(p.category) = LOWER(:category))
        AND (:brand IS NULL OR LOWER(p.brand) = LOWER(:brand))
        AND p.price BETWEEN :minPrice AND :maxPrice
        ORDER BY pe.combined_embedding <-> CAST(:queryEmbedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<ProductEmbedding> findSimilarProductsAdvanced(
            @Param("queryEmbedding") String queryEmbedding,
            @Param("category") String category,
            @Param("brand") String brand,
            @Param("minPrice") double minPrice,
            @Param("maxPrice") double maxPrice,
            @Param("limit") int limit);

    /**
     * Get similarity score between query and products
     * Returns products with their similarity scores for ranking
     *
     * @param queryEmbedding the query vector as comma-separated string
     * @param limit maximum number of results
     * @return list of objects containing ProductEmbedding and similarity score
     */
    @Query(value = """
        SELECT pe.*,
               (1 - (pe.combined_embedding <-> CAST(:queryEmbedding AS vector))) as similarity_score
        FROM product_embeddings pe
        JOIN products p ON pe.product_id = p.id
        WHERE pe.combined_embedding IS NOT NULL
        AND p.is_available = true
        ORDER BY pe.combined_embedding <-> CAST(:queryEmbedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findSimilarProductsWithScores(
            @Param("queryEmbedding") String queryEmbedding,
            @Param("limit") int limit);

    /**
     * Exclude specific categories from search results
     * Useful for filtering out irrelevant product types (e.g., exclude clothing when searching for electronics)
     *
     * @param queryEmbedding the query vector as comma-separated string
     * @param excludedCategories list of categories to exclude
     * @param limit maximum number of results
     * @return list of similar ProductEmbeddings excluding specified categories
     */
    @Query(value = """
        SELECT pe.* FROM product_embeddings pe
        JOIN products p ON pe.product_id = p.id
        WHERE pe.combined_embedding IS NOT NULL
        AND p.is_available = true
        AND LOWER(p.category) NOT IN (:excludedCategories)
        ORDER BY pe.combined_embedding <-> CAST(:queryEmbedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<ProductEmbedding> findSimilarProductsExcludingCategories(
            @Param("queryEmbedding") String queryEmbedding,
            @Param("excludedCategories") List<String> excludedCategories,
            @Param("limit") int limit);

    /**
     * Hybrid search combining vector similarity with text search
     * Provides fallback when vector search doesn't find enough results
     *
     * @param queryEmbedding the query vector as comma-separated string
     * @param textQuery text query for keyword matching
     * @param limit maximum number of results
     * @return list of ProductEmbeddings from combined search
     */
    @Query(value = """
        (SELECT pe.*, 1.0 as search_type FROM product_embeddings pe
         JOIN products p ON pe.product_id = p.id
         WHERE pe.combined_embedding IS NOT NULL
         AND p.is_available = true
         ORDER BY pe.combined_embedding <-> CAST(:queryEmbedding AS vector)
         LIMIT :limit)
        UNION
        (SELECT pe.*, 0.5 as search_type FROM product_embeddings pe
         JOIN products p ON pe.product_id = p.id
         WHERE p.is_available = true
         AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :textQuery, '%'))
              OR LOWER(p.description) LIKE LOWER(CONCAT('%', :textQuery, '%')))
         AND pe.product_id NOT IN (
             SELECT pe2.product_id FROM product_embeddings pe2
             JOIN products p2 ON pe2.product_id = p2.id
             WHERE pe2.combined_embedding IS NOT NULL
             AND p2.is_available = true
             ORDER BY pe2.combined_embedding <-> CAST(:queryEmbedding AS vector)
             LIMIT :limit
         )
         LIMIT :limit)
        ORDER BY search_type DESC, similarity_score DESC
        """, nativeQuery = true)
    List<ProductEmbedding> findProductsHybridSearch(
            @Param("queryEmbedding") String queryEmbedding,
            @Param("textQuery") String textQuery,
            @Param("limit") int limit);
}
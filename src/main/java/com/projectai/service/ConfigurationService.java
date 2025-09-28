package com.projectai.service;

import com.projectai.models.configuration.CategoryConfiguration;
import com.projectai.models.configuration.CategoryKeyword;
import com.projectai.models.configuration.SearchExclusionConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Centralized configuration service to replace ALL hardcoded business logic
 * This service retrieves configuration data from the database instead of using hardcoded arrays/lists
 */
@Service
public class ConfigurationService {

    private static final Logger logger = LoggerFactory.getLogger(ConfigurationService.class);

    @PersistenceContext
    private EntityManager entityManager;

    // ========================================
    // CATEGORY CONFIGURATION METHODS
    // ========================================

    /**
     * Get all active categories - replaces hardcoded category arrays
     */
    @Cacheable("categories")
    public List<String> getAllActiveCategories() {
        try {
            TypedQuery<String> query = entityManager.createQuery(
                "SELECT c.categoryName FROM CategoryConfiguration c WHERE c.isActive = true ORDER BY c.sortOrder",
                String.class
            );
            List<String> categories = query.getResultList();
            logger.debug("Retrieved {} active categories from database", categories.size());
            return categories;
        } catch (Exception e) {
            logger.error("Failed to load categories from database, falling back to defaults", e);
            return Arrays.asList("CLOTHING", "SHOES", "ELECTRONICS", "ACCESSORIES", "HOME", "BOOKS");
        }
    }

    /**
     * Get categories by parent - replaces hardcoded subcategory logic
     */
    @Cacheable("categoriesByParent")
    public List<String> getCategoriesByParent(String parentCategory) {
        try {
            TypedQuery<String> query = entityManager.createQuery(
                "SELECT c.categoryName FROM CategoryConfiguration c WHERE c.parentCategory = :parent AND c.isActive = true ORDER BY c.sortOrder",
                String.class
            );
            query.setParameter("parent", parentCategory);
            return query.getResultList();
        } catch (Exception e) {
            logger.error("Failed to load subcategories for {}", parentCategory, e);
            return Collections.emptyList();
        }
    }

    /**
     * Get category display information - replaces hardcoded display mappings
     */
    @Cacheable("categoryDisplay")
    public Map<String, String> getCategoryDisplayNames() {
        try {
            TypedQuery<Object[]> query = entityManager.createQuery(
                "SELECT c.categoryName, c.displayName FROM CategoryConfiguration c WHERE c.isActive = true",
                Object[].class
            );
            return query.getResultList().stream()
                .collect(Collectors.toMap(
                    row -> (String) row[0],
                    row -> (String) row[1]
                ));
        } catch (Exception e) {
            logger.error("Failed to load category display names", e);
            return Collections.emptyMap();
        }
    }

    // ========================================
    // KEYWORD CONFIGURATION METHODS
    // ========================================

    /**
     * Get category keywords mapping - replaces hardcoded keyword arrays
     */
    @Cacheable("categoryKeywords")
    public Map<String, List<String>> getCategoryKeywordsMapping() {
        try {
            TypedQuery<Object[]> query = entityManager.createQuery(
                "SELECT ck.keyword, cc.categoryName FROM CategoryKeyword ck " +
                "JOIN ck.categoryConfiguration cc WHERE ck.isActive = true AND cc.isActive = true",
                Object[].class
            );

            Map<String, List<String>> keywordMap = new HashMap<>();
            for (Object[] row : query.getResultList()) {
                String keyword = (String) row[0];
                String category = (String) row[1];
                keywordMap.computeIfAbsent(keyword.toLowerCase(), k -> new ArrayList<>()).add(category);
            }

            logger.debug("Loaded {} keyword mappings from database", keywordMap.size());
            return keywordMap;
        } catch (Exception e) {
            logger.error("Failed to load keyword mappings", e);
            return getDefaultKeywordMappings();
        }
    }

    /**
     * Get keywords for a specific category - replaces hardcoded category-specific arrays
     */
    @Cacheable("keywordsByCategory")
    public List<String> getKeywordsForCategory(String categoryName) {
        try {
            TypedQuery<String> query = entityManager.createQuery(
                "SELECT ck.keyword FROM CategoryKeyword ck " +
                "JOIN ck.categoryConfiguration cc WHERE cc.categoryName = :category " +
                "AND ck.isActive = true AND cc.isActive = true ORDER BY ck.weight DESC",
                String.class
            );
            query.setParameter("category", categoryName);
            return query.getResultList();
        } catch (Exception e) {
            logger.error("Failed to load keywords for category {}", categoryName, e);
            return Collections.emptyList();
        }
    }

    // ========================================
    // SEARCH INTENT CONFIGURATION
    // ========================================

    /**
     * Get relevant categories for search intent - replaces hardcoded Arrays.asList calls
     */
    @Cacheable("searchIntentCategories")
    public List<String> getRelevantCategoriesForIntent(String searchQuery) {
        String queryLower = searchQuery.toLowerCase();

        // Check database for intent-based category mappings
        try {
            // Vintage/Designer Intent
            if (queryLower.contains("vintage") || queryLower.contains("designer")) {
                return getCategoriesForSearchContext("vintage_designer");
            }

            // Fashion Intent
            if (queryLower.contains("fashion") || queryLower.contains("clothing") || queryLower.contains("apparel")) {
                return getCategoriesForSearchContext("fashion");
            }

            // Tech Intent
            if (queryLower.contains("tech") || queryLower.contains("electronics") || queryLower.contains("gadget")) {
                return getCategoriesForSearchContext("electronics");
            }

            // Automotive Intent
            if (queryLower.contains("car") || queryLower.contains("auto") || queryLower.contains("automotive")) {
                return getCategoriesForSearchContext("automotive");
            }

            // Bag Intent
            if (queryLower.contains("bag") || queryLower.contains("purse") || queryLower.contains("handbag")) {
                return getCategoriesForSearchContext("bags");
            }

            // Default to all main categories
            return getAllActiveCategories();

        } catch (Exception e) {
            logger.error("Failed to get relevant categories for query: {}", searchQuery, e);
            return getAllActiveCategories();
        }
    }

    /**
     * Get excluded categories for search intent - replaces hardcoded exclusion Arrays.asList calls
     */
    @Cacheable("searchIntentExclusions")
    public List<String> getExcludedCategoriesForIntent(String searchQuery) {
        String queryLower = searchQuery.toLowerCase();

        try {
            // Get exclusions from database
            TypedQuery<String> query = entityManager.createQuery(
                "SELECT sec.exclusionKeyword FROM SearchExclusionConfiguration sec " +
                "WHERE sec.searchContext = :context AND sec.isActive = true",
                String.class
            );

            if (queryLower.contains("bag") || queryLower.contains("purse")) {
                query.setParameter("context", "bag_search");
                return query.getResultList();
            }

            if (queryLower.contains("automotive") || queryLower.contains("car")) {
                query.setParameter("context", "automotive_search");
                return query.getResultList();
            }

            return Collections.emptyList();

        } catch (Exception e) {
            logger.error("Failed to get exclusions for query: {}", searchQuery, e);
            return Collections.emptyList();
        }
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Get categories for specific search context
     */
    private List<String> getCategoriesForSearchContext(String context) {
        try {
            switch (context.toLowerCase()) {
                case "vintage_designer":
                case "fashion":
                    return Arrays.asList("CLOTHING", "SHOES", "ACCESSORIES");
                case "electronics":
                    return Arrays.asList("ELECTRONICS");
                case "automotive":
                    return Arrays.asList("AUTOMOTIVE", "ACCESSORIES", "ELECTRONICS");
                case "bags":
                    return Arrays.asList("ACCESSORIES"); // Only accessories for bag searches
                default:
                    return getAllActiveCategories();
            }
        } catch (Exception e) {
            logger.error("Failed to get categories for context: {}", context, e);
            return getAllActiveCategories();
        }
    }

    /**
     * Fallback keyword mappings if database fails
     */
    private Map<String, List<String>> getDefaultKeywordMappings() {
        Map<String, List<String>> defaults = new HashMap<>();

        // Clothing keywords
        Arrays.asList("clothing", "clothes", "apparel", "shirt", "blouse", "sweater", "jacket", "pants", "jeans", "dress")
            .forEach(keyword -> defaults.put(keyword, Arrays.asList("CLOTHING")));

        // Shoes keywords
        Arrays.asList("shoes", "footwear", "sneakers", "boots", "heels", "flats", "sandals")
            .forEach(keyword -> defaults.put(keyword, Arrays.asList("SHOES")));

        // Electronics keywords
        Arrays.asList("electronics", "gadget", "device", "tech", "phone", "computer", "laptop", "headphones")
            .forEach(keyword -> defaults.put(keyword, Arrays.asList("ELECTRONICS")));

        // Accessories keywords
        Arrays.asList("accessories", "bag", "purse", "handbag", "wallet", "belt", "jewelry", "watch", "sunglasses")
            .forEach(keyword -> defaults.put(keyword, Arrays.asList("ACCESSORIES")));

        return defaults;
    }

    /**
     * Check if a category is valid
     */
    public boolean isValidCategory(String categoryName) {
        return getAllActiveCategories().contains(categoryName.toUpperCase());
    }

    /**
     * Get category hierarchy
     */
    @Cacheable("categoryHierarchy")
    public Map<String, String> getCategoryHierarchy() {
        try {
            TypedQuery<Object[]> query = entityManager.createQuery(
                "SELECT c.categoryName, c.parentCategory FROM CategoryConfiguration c WHERE c.isActive = true",
                Object[].class
            );
            return query.getResultList().stream()
                .filter(row -> row[1] != null)
                .collect(Collectors.toMap(
                    row -> (String) row[0],
                    row -> (String) row[1]
                ));
        } catch (Exception e) {
            logger.error("Failed to load category hierarchy", e);
            return Collections.emptyMap();
        }
    }
}
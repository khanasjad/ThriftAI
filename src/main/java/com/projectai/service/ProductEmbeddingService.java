package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.models.ProductEmbedding;
import com.projectai.repository.ProductEmbeddingRepository;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Service for generating and managing product embeddings using OpenAI API
 * Provides vector embeddings for semantic search capabilities
 */
@Service
public class ProductEmbeddingService {

    private static final Logger logger = LoggerFactory.getLogger(ProductEmbeddingService.class);

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductEmbeddingRepository productEmbeddingRepository;

    @Value("${openai.api.key:}")
    private String openAiApiKey;

    @Value("${openai.embedding.url:https://api.openai.com/v1/embeddings}")
    private String openAiEmbeddingUrl;

    @Value("${openai.embedding.model:text-embedding-ada-002}")
    private String embeddingModel;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generate embeddings for a single product
     * @param product the product to generate embeddings for
     * @return ProductEmbedding entity with generated vectors
     */
    public ProductEmbedding generateEmbeddings(Product product) {
        logger.info("🔢 Generating embeddings for product: {} (ID: {})", product.getName(), product.getId());

        try {
            ProductEmbedding embedding = productEmbeddingRepository.findById(product.getId())
                    .orElse(new ProductEmbedding(product));

            // Generate combined text for comprehensive embedding
            String combinedText = buildCombinedText(product);
            String nameText = buildNameText(product);
            String descriptionText = product.getDescription() != null ? product.getDescription() : "";

            // Generate embeddings using OpenAI API
            if (isOpenAiConfigured()) {
                embedding.setCombinedEmbeddingFromArray(generateOpenAiEmbedding(combinedText));
                embedding.setNameEmbeddingFromArray(generateOpenAiEmbedding(nameText));
                if (!descriptionText.isEmpty()) {
                    embedding.setDescriptionEmbeddingFromArray(generateOpenAiEmbedding(descriptionText));
                }
                logger.info("✅ Generated OpenAI embeddings for product: {}", product.getName());
            } else {
                // Fallback to dummy embeddings for development
                embedding.setCombinedEmbeddingFromArray(generateDummyEmbedding(combinedText));
                embedding.setNameEmbeddingFromArray(generateDummyEmbedding(nameText));
                if (!descriptionText.isEmpty()) {
                    embedding.setDescriptionEmbeddingFromArray(generateDummyEmbedding(descriptionText));
                }
                logger.warn("⚠️ Using dummy embeddings for product: {} (OpenAI API not configured)", product.getName());
            }

            embedding.markUpdated();
            return productEmbeddingRepository.save(embedding);

        } catch (Exception e) {
            logger.error("❌ Failed to generate embeddings for product: {} - {}", product.getName(), e.getMessage());
            throw new RuntimeException("Failed to generate embeddings for product: " + product.getName(), e);
        }
    }

    /**
     * Generate embeddings for a batch of products asynchronously
     * @param products list of products to process
     * @return CompletableFuture with list of ProductEmbeddings
     */
    public CompletableFuture<List<ProductEmbedding>> generateEmbeddingsBatch(List<Product> products) {
        logger.info("🔄 Starting batch embedding generation for {} products", products.size());

        return CompletableFuture.supplyAsync(() -> {
            return products.stream()
                    .map(this::generateEmbeddings)
                    .collect(Collectors.toList());
        });
    }

    /**
     * Generate embeddings for all products that need updates
     * @return number of products processed
     */
    public int generateEmbeddingsForAllProducts() {
        logger.info("🚀 Starting complete embedding generation for all products");

        List<Product> allProducts = productRepository.findAll();
        List<Product> productsNeedingUpdate = allProducts.stream()
                .filter(product -> {
                    Optional<ProductEmbedding> existing = productEmbeddingRepository.findById(product.getId());
                    return existing.isEmpty() || existing.get().isNeedsUpdate();
                })
                .collect(Collectors.toList());

        logger.info("📊 Found {} products needing embedding updates out of {} total",
                    productsNeedingUpdate.size(), allProducts.size());

        for (Product product : productsNeedingUpdate) {
            try {
                generateEmbeddings(product);
            } catch (Exception e) {
                logger.error("❌ Failed to process product: {} - {}", product.getName(), e.getMessage());
                // Continue with other products
            }
        }

        logger.info("✅ Completed embedding generation for {} products", productsNeedingUpdate.size());
        return productsNeedingUpdate.size();
    }

    /**
     * Generate embedding for a query string (for similarity search)
     * @param query the search query
     * @return embedding vector for the query
     */
    public float[] generateQueryEmbedding(String query) {
        logger.debug("🔍 Generating query embedding for: '{}'", query);

        try {
            if (isOpenAiConfigured()) {
                return generateOpenAiEmbedding(query);
            } else {
                logger.warn("⚠️ Using dummy embedding for query (OpenAI API not configured)");
                return generateDummyEmbedding(query);
            }
        } catch (Exception e) {
            logger.error("❌ Failed to generate query embedding: {}", e.getMessage());
            throw new RuntimeException("Failed to generate query embedding", e);
        }
    }

    /**
     * Build combined text representation of a product for embedding
     */
    private String buildCombinedText(Product product) {
        StringBuilder combined = new StringBuilder();

        if (product.getName() != null) {
            combined.append(product.getName()).append(" ");
        }
        if (product.getCategory() != null) {
            combined.append("Category: ").append(product.getCategory()).append(" ");
        }
        if (product.getBrand() != null) {
            combined.append("Brand: ").append(product.getBrand()).append(" ");
        }
        if (product.getDescription() != null) {
            combined.append(product.getDescription()).append(" ");
        }
        if (product.getCondition() != null) {
            combined.append("Condition: ").append(product.getCondition()).append(" ");
        }

        return combined.toString().trim();
    }

    /**
     * Build name-focused text for name embedding
     */
    private String buildNameText(Product product) {
        StringBuilder nameText = new StringBuilder();

        if (product.getName() != null) {
            nameText.append(product.getName()).append(" ");
        }
        if (product.getBrand() != null) {
            nameText.append(product.getBrand()).append(" ");
        }
        if (product.getCategory() != null) {
            nameText.append(product.getCategory());
        }

        return nameText.toString().trim();
    }

    /**
     * Generate embedding using OpenAI API
     */
    private float[] generateOpenAiEmbedding(String text) {
        if (text == null || text.trim().isEmpty()) {
            logger.warn("⚠️ Empty text provided for embedding generation");
            return new float[1536]; // Return zero vector
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + openAiApiKey);
            headers.set("Content-Type", "application/json");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", embeddingModel);
            requestBody.put("input", text.trim());

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    openAiEmbeddingUrl, HttpMethod.POST, request, String.class);

            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            JsonNode embeddingArray = jsonResponse.path("data").get(0).path("embedding");

            float[] embedding = new float[embeddingArray.size()];
            for (int i = 0; i < embeddingArray.size(); i++) {
                embedding[i] = (float) embeddingArray.get(i).asDouble();
            }

            logger.debug("✅ Generated OpenAI embedding with {} dimensions", embedding.length);
            return embedding;

        } catch (Exception e) {
            logger.error("❌ OpenAI API call failed: {}", e.getMessage());
            throw new RuntimeException("Failed to generate OpenAI embedding", e);
        }
    }

    /**
     * Generate dummy embedding for development/testing without OpenAI API
     */
    private float[] generateDummyEmbedding(String text) {
        // Generate a simple hash-based dummy embedding for testing
        float[] embedding = new float[1536];

        if (text != null && !text.trim().isEmpty()) {
            int hash = text.toLowerCase().hashCode();
            for (int i = 0; i < embedding.length; i++) {
                embedding[i] = (float) Math.sin(hash + i) * 0.1f;
            }
        }

        return embedding;
    }

    /**
     * Check if OpenAI API is properly configured
     */
    private boolean isOpenAiConfigured() {
        return openAiApiKey != null && !openAiApiKey.trim().isEmpty() && !openAiApiKey.equals("your_openai_api_key_here");
    }

    /**
     * Mark product embedding as needing update
     * @param productId the product ID
     */
    public void markEmbeddingForUpdate(String productId) {
        Optional<ProductEmbedding> embedding = productEmbeddingRepository.findById(productId);
        if (embedding.isPresent()) {
            embedding.get().markForUpdate();
            productEmbeddingRepository.save(embedding.get());
            logger.info("📝 Marked embedding for update: product ID {}", productId);
        }
    }

    /**
     * Get embedding statistics
     * @return Map with embedding statistics
     */
    public Map<String, Object> getEmbeddingStatistics() {
        long totalProducts = productRepository.count();
        long embeddedProducts = productEmbeddingRepository.count();
        long needingUpdate = productEmbeddingRepository.countByNeedsUpdateTrue();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProducts", totalProducts);
        stats.put("embeddedProducts", embeddedProducts);
        stats.put("needingUpdate", needingUpdate);
        stats.put("coverage", totalProducts > 0 ? (double) embeddedProducts / totalProducts : 0.0);
        stats.put("openAiConfigured", isOpenAiConfigured());

        return stats;
    }
}
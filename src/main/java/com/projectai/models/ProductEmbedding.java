package com.projectai.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

/**
 * ProductEmbedding entity for storing vector embeddings of products
 * Used for semantic search and similarity matching
 */
@Entity
@Table(name = "product_embeddings")
public class ProductEmbedding {

    @Id
    private String productId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "product_id")
    private Product product;

    /**
     * Vector embedding for product name and basic attributes
     * Dimensions: 1536 (OpenAI text-embedding-ada-002 standard)
     */
    @Column(name = "name_embedding", columnDefinition = "TEXT")
    private String nameEmbedding;

    /**
     * Vector embedding for product description
     * Dimensions: 1536 (OpenAI text-embedding-ada-002 standard)
     */
    @Column(name = "description_embedding", columnDefinition = "TEXT")
    private String descriptionEmbedding;

    /**
     * Combined vector embedding for comprehensive product representation
     * Includes name, description, category, and brand information
     * Dimensions: 1536 (OpenAI text-embedding-ada-002 standard)
     */
    @Column(name = "combined_embedding", columnDefinition = "TEXT")
    private String combinedEmbedding;

    /**
     * Timestamp when embeddings were created
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Timestamp when embeddings were last updated
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Flag to indicate if embeddings are stale and need regeneration
     */
    @Column(name = "needs_update")
    private boolean needsUpdate = false;

    // Constructors
    public ProductEmbedding() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public ProductEmbedding(String productId) {
        this();
        this.productId = productId;
    }

    public ProductEmbedding(Product product) {
        this();
        this.product = product;
        this.productId = product.getId();
    }

    // Getters and Setters
    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
        if (product != null) {
            this.productId = product.getId();
        }
    }

    public String getNameEmbedding() {
        return nameEmbedding;
    }

    public void setNameEmbedding(String nameEmbedding) {
        this.nameEmbedding = nameEmbedding;
        this.updatedAt = LocalDateTime.now();
    }

    public float[] getNameEmbeddingAsArray() {
        return parseEmbeddingString(nameEmbedding);
    }

    public void setNameEmbeddingFromArray(float[] embedding) {
        this.nameEmbedding = formatEmbeddingArray(embedding);
        this.updatedAt = LocalDateTime.now();
    }

    public String getDescriptionEmbedding() {
        return descriptionEmbedding;
    }

    public void setDescriptionEmbedding(String descriptionEmbedding) {
        this.descriptionEmbedding = descriptionEmbedding;
        this.updatedAt = LocalDateTime.now();
    }

    public float[] getDescriptionEmbeddingAsArray() {
        return parseEmbeddingString(descriptionEmbedding);
    }

    public void setDescriptionEmbeddingFromArray(float[] embedding) {
        this.descriptionEmbedding = formatEmbeddingArray(embedding);
        this.updatedAt = LocalDateTime.now();
    }

    public String getCombinedEmbedding() {
        return combinedEmbedding;
    }

    public void setCombinedEmbedding(String combinedEmbedding) {
        this.combinedEmbedding = combinedEmbedding;
        this.updatedAt = LocalDateTime.now();
    }

    public float[] getCombinedEmbeddingAsArray() {
        return parseEmbeddingString(combinedEmbedding);
    }

    public void setCombinedEmbeddingFromArray(float[] embedding) {
        this.combinedEmbedding = formatEmbeddingArray(embedding);
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Helper method to format float array as string for database storage
     */
    private String formatEmbeddingArray(float[] embedding) {
        if (embedding == null || embedding.length == 0) {
            return null;
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
     * Helper method to parse string back to float array
     */
    private float[] parseEmbeddingString(String embeddingString) {
        if (embeddingString == null || embeddingString.trim().isEmpty()) {
            return null;
        }
        try {
            String trimmed = embeddingString.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                trimmed = trimmed.substring(1, trimmed.length() - 1);
            }
            String[] parts = trimmed.split(",");
            float[] result = new float[parts.length];
            for (int i = 0; i < parts.length; i++) {
                result[i] = Float.parseFloat(parts[i].trim());
            }
            return result;
        } catch (Exception e) {
            return null;
        }
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isNeedsUpdate() {
        return needsUpdate;
    }

    public void setNeedsUpdate(boolean needsUpdate) {
        this.needsUpdate = needsUpdate;
    }

    /**
     * Marks this embedding as needing an update
     * Called when the associated product is modified
     */
    public void markForUpdate() {
        this.needsUpdate = true;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Marks this embedding as up-to-date
     * Called after successful embedding generation
     */
    public void markUpdated() {
        this.needsUpdate = false;
        this.updatedAt = LocalDateTime.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProductEmbedding that = (ProductEmbedding) o;
        return productId != null && productId.equals(that.productId);
    }

    @Override
    public int hashCode() {
        return productId != null ? productId.hashCode() : 0;
    }

    @Override
    public String toString() {
        return "ProductEmbedding{" +
                "productId='" + productId + '\'' +
                ", hasNameEmbedding=" + (nameEmbedding != null) +
                ", hasDescriptionEmbedding=" + (descriptionEmbedding != null) +
                ", hasCombinedEmbedding=" + (combinedEmbedding != null) +
                ", needsUpdate=" + needsUpdate +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
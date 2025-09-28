package com.projectai.models.configuration;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity representing keywords that map to categories
 * Replaces hardcoded keyword-to-category mapping logic
 */
@Entity
@Table(name = "category_keywords",
       indexes = {
           @Index(name = "idx_keyword", columnList = "keyword"),
           @Index(name = "idx_category_keyword", columnList = "category_id, keyword")
       })
public class CategoryKeyword {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private CategoryConfiguration categoryConfiguration;

    @Column(name = "keyword", nullable = false, length = 100)
    private String keyword;

    @Column(name = "synonym", length = 100)
    private String synonym;

    @Column(name = "weight", precision = 3, scale = 2)
    private BigDecimal weight = BigDecimal.ONE;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Constructors
    public CategoryKeyword() {}

    public CategoryKeyword(String keyword, BigDecimal weight) {
        this.keyword = keyword;
        this.weight = weight;
    }

    public CategoryKeyword(CategoryConfiguration categoryConfiguration, String keyword, BigDecimal weight) {
        this.categoryConfiguration = categoryConfiguration;
        this.keyword = keyword;
        this.weight = weight;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CategoryConfiguration getCategoryConfiguration() {
        return categoryConfiguration;
    }

    public void setCategoryConfiguration(CategoryConfiguration categoryConfiguration) {
        this.categoryConfiguration = categoryConfiguration;
    }

    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
    }

    public String getSynonym() {
        return synonym;
    }

    public void setSynonym(String synonym) {
        this.synonym = synonym;
    }

    public BigDecimal getWeight() {
        return weight;
    }

    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "CategoryKeyword{" +
                "id=" + id +
                ", keyword='" + keyword + '\'' +
                ", weight=" + weight +
                ", isActive=" + isActive +
                '}';
    }
}
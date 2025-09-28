package com.projectai.models.configuration;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity representing configurable product categories
 * Replaces hardcoded category logic throughout the application
 */
@Entity
@Table(name = "category_configuration")
public class CategoryConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_name", unique = true, nullable = false, length = 100)
    private String categoryName;

    @Column(name = "parent_category", length = 100)
    private String parentCategory;

    @Column(name = "display_name", nullable = false, length = 200)
    private String displayName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // One-to-many relationship with category keywords
    @OneToMany(mappedBy = "categoryConfiguration", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CategoryKeyword> keywords;

    // Constructors
    public CategoryConfiguration() {}

    public CategoryConfiguration(String categoryName, String displayName) {
        this.categoryName = categoryName;
        this.displayName = displayName;
    }

    public CategoryConfiguration(String categoryName, String parentCategory, String displayName, String description) {
        this.categoryName = categoryName;
        this.parentCategory = parentCategory;
        this.displayName = displayName;
        this.description = description;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getParentCategory() {
        return parentCategory;
    }

    public void setParentCategory(String parentCategory) {
        this.parentCategory = parentCategory;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
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

    public List<CategoryKeyword> getKeywords() {
        return keywords;
    }

    public void setKeywords(List<CategoryKeyword> keywords) {
        this.keywords = keywords;
    }

    @Override
    public String toString() {
        return "CategoryConfiguration{" +
                "id=" + id +
                ", categoryName='" + categoryName + '\'' +
                ", parentCategory='" + parentCategory + '\'' +
                ", displayName='" + displayName + '\'' +
                ", isActive=" + isActive +
                '}';
    }
}
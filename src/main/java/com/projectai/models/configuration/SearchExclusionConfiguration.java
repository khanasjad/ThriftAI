package com.projectai.models.configuration;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity representing search exclusion rules
 * Replaces hardcoded exclusion logic in search functions
 */
@Entity
@Table(name = "search_exclusion_configuration",
       indexes = {
           @Index(name = "idx_exclusion_context", columnList = "search_context, exclusion_keyword")
       })
public class SearchExclusionConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_name", nullable = false, length = 100)
    private String ruleName;

    @Column(name = "search_context", nullable = false, length = 100)
    private String searchContext;

    @Column(name = "exclusion_keyword", nullable = false, length = 100)
    private String exclusionKeyword;

    @Column(name = "exclusion_type", length = 50)
    private String exclusionType = "STRICT";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private CategoryConfiguration categoryConfiguration;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public SearchExclusionConfiguration() {}

    public SearchExclusionConfiguration(String ruleName, String searchContext, String exclusionKeyword) {
        this.ruleName = ruleName;
        this.searchContext = searchContext;
        this.exclusionKeyword = exclusionKeyword;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRuleName() {
        return ruleName;
    }

    public void setRuleName(String ruleName) {
        this.ruleName = ruleName;
    }

    public String getSearchContext() {
        return searchContext;
    }

    public void setSearchContext(String searchContext) {
        this.searchContext = searchContext;
    }

    public String getExclusionKeyword() {
        return exclusionKeyword;
    }

    public void setExclusionKeyword(String exclusionKeyword) {
        this.exclusionKeyword = exclusionKeyword;
    }

    public String getExclusionType() {
        return exclusionType;
    }

    public void setExclusionType(String exclusionType) {
        this.exclusionType = exclusionType;
    }

    public CategoryConfiguration getCategoryConfiguration() {
        return categoryConfiguration;
    }

    public void setCategoryConfiguration(CategoryConfiguration categoryConfiguration) {
        this.categoryConfiguration = categoryConfiguration;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "SearchExclusionConfiguration{" +
                "id=" + id +
                ", ruleName='" + ruleName + '\'' +
                ", searchContext='" + searchContext + '\'' +
                ", exclusionKeyword='" + exclusionKeyword + '\'' +
                ", exclusionType='" + exclusionType + '\'' +
                ", isActive=" + isActive +
                '}';
    }
}
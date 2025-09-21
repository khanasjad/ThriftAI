package com.projectai.models;

import java.util.List;

public class SearchFilters {
    private String originalQuery;
    private String category;
    private String brand;
    private Double minPrice;
    private Double maxPrice;
    private String condition;
    private String size;
    private List<String> keywords;
    private String intent; // e.g., "budget-shopping", "designer-hunting", "specific-item"
    private String style; // e.g., "vintage", "modern", "casual", "formal"
    private String color;
    private String gender; // e.g., "men", "women", "unisex"

    public SearchFilters() {}

    public SearchFilters(String originalQuery) {
        this.originalQuery = originalQuery;
    }

    // Getters and setters
    public String getOriginalQuery() { return originalQuery; }
    public void setOriginalQuery(String originalQuery) { this.originalQuery = originalQuery; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public Double getMinPrice() { return minPrice; }
    public void setMinPrice(Double minPrice) { this.minPrice = minPrice; }

    public Double getMaxPrice() { return maxPrice; }
    public void setMaxPrice(Double maxPrice) { this.maxPrice = maxPrice; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public List<String> getKeywords() { return keywords; }
    public void setKeywords(List<String> keywords) { this.keywords = keywords; }

    public String getIntent() { return intent; }
    public void setIntent(String intent) { this.intent = intent; }

    public String getStyle() { return style; }
    public void setStyle(String style) { this.style = style; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    @Override
    public String toString() {
        return "SearchFilters{" +
                "originalQuery='" + originalQuery + '\'' +
                ", category='" + category + '\'' +
                ", brand='" + brand + '\'' +
                ", minPrice=" + minPrice +
                ", maxPrice=" + maxPrice +
                ", condition='" + condition + '\'' +
                ", size='" + size + '\'' +
                ", keywords=" + keywords +
                ", intent='" + intent + '\'' +
                ", style='" + style + '\'' +
                ", color='" + color + '\'' +
                ", gender='" + gender + '\'' +
                '}';
    }
}
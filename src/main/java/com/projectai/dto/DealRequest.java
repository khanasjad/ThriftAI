package com.projectai.dto;

import com.projectai.models.UserPreferences;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

public class DealRequest {
    
    @Valid
    private UserPreferences userPreferences;
    
    @Min(value = 1, message = "Limit must be at least 1")
    @Max(value = 100, message = "Limit cannot exceed 100")
    private int limit = 10;
    
    private boolean includeOutOfStock = false;
    private String sortBy = "score"; // score, price, discount, date
    private String sortDirection = "desc"; // asc, desc

    public DealRequest() {}

    public DealRequest(UserPreferences userPreferences, int limit) {
        this.userPreferences = userPreferences;
        this.limit = limit;
    }

    // Getters and setters
    public UserPreferences getUserPreferences() { return userPreferences; }
    public void setUserPreferences(UserPreferences userPreferences) { this.userPreferences = userPreferences; }

    public int getLimit() { return limit; }
    public void setLimit(int limit) { this.limit = limit; }

    public boolean isIncludeOutOfStock() { return includeOutOfStock; }
    public void setIncludeOutOfStock(boolean includeOutOfStock) { this.includeOutOfStock = includeOutOfStock; }

    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }

    public String getSortDirection() { return sortDirection; }
    public void setSortDirection(String sortDirection) { this.sortDirection = sortDirection; }
}
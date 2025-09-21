package com.projectai.models;

import java.util.List;
import java.util.Map;

public class ClaudeSearchAnalytics {
    private String originalQuery;
    private SearchFilters extractedFilters;
    private List<Product> matchedProducts;
    private String claudeInsight;
    private Map<String, Double> categoryConfidenceScores;
    private Map<String, Integer> brandDistribution;
    private Map<String, Integer> priceRangeDistribution;
    private Map<String, Integer> conditionDistribution;
    private List<String> suggestedAlternatives;
    private double searchQuality;
    private String searchStrategy;
    private long processingTimeMs;
    private Map<String, Object> visualData;

    public ClaudeSearchAnalytics() {}

    public ClaudeSearchAnalytics(String originalQuery, SearchFilters extractedFilters, List<Product> matchedProducts) {
        this.originalQuery = originalQuery;
        this.extractedFilters = extractedFilters;
        this.matchedProducts = matchedProducts;
    }

    public String getOriginalQuery() { return originalQuery; }
    public void setOriginalQuery(String originalQuery) { this.originalQuery = originalQuery; }

    public SearchFilters getExtractedFilters() { return extractedFilters; }
    public void setExtractedFilters(SearchFilters extractedFilters) { this.extractedFilters = extractedFilters; }

    public List<Product> getMatchedProducts() { return matchedProducts; }
    public void setMatchedProducts(List<Product> matchedProducts) { this.matchedProducts = matchedProducts; }

    public String getClaudeInsight() { return claudeInsight; }
    public void setClaudeInsight(String claudeInsight) { this.claudeInsight = claudeInsight; }

    public Map<String, Double> getCategoryConfidenceScores() { return categoryConfidenceScores; }
    public void setCategoryConfidenceScores(Map<String, Double> categoryConfidenceScores) {
        this.categoryConfidenceScores = categoryConfidenceScores;
    }

    public Map<String, Integer> getBrandDistribution() { return brandDistribution; }
    public void setBrandDistribution(Map<String, Integer> brandDistribution) {
        this.brandDistribution = brandDistribution;
    }

    public Map<String, Integer> getPriceRangeDistribution() { return priceRangeDistribution; }
    public void setPriceRangeDistribution(Map<String, Integer> priceRangeDistribution) {
        this.priceRangeDistribution = priceRangeDistribution;
    }

    public Map<String, Integer> getConditionDistribution() { return conditionDistribution; }
    public void setConditionDistribution(Map<String, Integer> conditionDistribution) {
        this.conditionDistribution = conditionDistribution;
    }

    public List<String> getSuggestedAlternatives() { return suggestedAlternatives; }
    public void setSuggestedAlternatives(List<String> suggestedAlternatives) {
        this.suggestedAlternatives = suggestedAlternatives;
    }

    public double getSearchQuality() { return searchQuality; }
    public void setSearchQuality(double searchQuality) { this.searchQuality = searchQuality; }

    public String getSearchStrategy() { return searchStrategy; }
    public void setSearchStrategy(String searchStrategy) { this.searchStrategy = searchStrategy; }

    public long getProcessingTimeMs() { return processingTimeMs; }
    public void setProcessingTimeMs(long processingTimeMs) { this.processingTimeMs = processingTimeMs; }

    public Map<String, Object> getVisualData() { return visualData; }
    public void setVisualData(Map<String, Object> visualData) { this.visualData = visualData; }

    @Override
    public String toString() {
        return "ClaudeSearchAnalytics{" +
                "originalQuery='" + originalQuery + '\'' +
                ", extractedFilters=" + extractedFilters +
                ", matchedProducts=" + (matchedProducts != null ? matchedProducts.size() : 0) + " products" +
                ", claudeInsight='" + claudeInsight + '\'' +
                ", searchQuality=" + searchQuality +
                ", searchStrategy='" + searchStrategy + '\'' +
                ", processingTimeMs=" + processingTimeMs +
                '}';
    }
}
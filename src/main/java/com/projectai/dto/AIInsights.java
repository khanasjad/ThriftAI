package com.projectai.dto;

import java.util.List;
import java.util.Map;

public class AIInsights {
    private String userIntent;
    private String searchSummary;
    private List<ProductAnalysis> products;
    private List<GraphData> graphs;
    private ComparisonMatrix comparisonMatrix;
    private Map<String, Object> environmentalImpact;
    private Map<String, Object> personalizedRecommendations;
    private Double overallConfidenceScore;
    private String aiExplanation;
    private Map<String, Object> metadata;
    private Double averageAiScore;
    private String topRecommendation;
    private String chatResponse;
    private String recommendationReason;
    private Map<String, Object> pythonGraphsData;

    public AIInsights() {}

    public String getUserIntent() {
        return userIntent;
    }

    public void setUserIntent(String userIntent) {
        this.userIntent = userIntent;
    }

    public String getSearchSummary() {
        return searchSummary;
    }

    public void setSearchSummary(String searchSummary) {
        this.searchSummary = searchSummary;
    }

    public List<ProductAnalysis> getProducts() {
        return products;
    }

    public void setProducts(List<ProductAnalysis> products) {
        this.products = products;
    }

    public List<GraphData> getGraphs() {
        return graphs;
    }

    public void setGraphs(List<GraphData> graphs) {
        this.graphs = graphs;
    }

    public ComparisonMatrix getComparisonMatrix() {
        return comparisonMatrix;
    }

    public void setComparisonMatrix(ComparisonMatrix comparisonMatrix) {
        this.comparisonMatrix = comparisonMatrix;
    }

    public Map<String, Object> getEnvironmentalImpact() {
        return environmentalImpact;
    }

    public void setEnvironmentalImpact(Map<String, Object> environmentalImpact) {
        this.environmentalImpact = environmentalImpact;
    }

    public Map<String, Object> getPersonalizedRecommendations() {
        return personalizedRecommendations;
    }

    public void setPersonalizedRecommendations(Map<String, Object> personalizedRecommendations) {
        this.personalizedRecommendations = personalizedRecommendations;
    }

    public Double getOverallConfidenceScore() {
        return overallConfidenceScore;
    }

    public void setOverallConfidenceScore(Double overallConfidenceScore) {
        this.overallConfidenceScore = overallConfidenceScore;
    }

    public String getAiExplanation() {
        return aiExplanation;
    }

    public void setAiExplanation(String aiExplanation) {
        this.aiExplanation = aiExplanation;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public Double getAverageAiScore() {
        return averageAiScore;
    }

    public void setAverageAiScore(Double averageAiScore) {
        this.averageAiScore = averageAiScore;
    }

    public String getTopRecommendation() {
        return topRecommendation;
    }

    public void setTopRecommendation(String topRecommendation) {
        this.topRecommendation = topRecommendation;
    }

    public String getChatResponse() {
        return chatResponse;
    }

    public void setChatResponse(String chatResponse) {
        this.chatResponse = chatResponse;
    }

    public String getRecommendationReason() {
        return recommendationReason;
    }

    public void setRecommendationReason(String recommendationReason) {
        this.recommendationReason = recommendationReason;
    }

    public Map<String, Object> getPythonGraphsData() {
        return pythonGraphsData;
    }

    public void setPythonGraphsData(Map<String, Object> pythonGraphsData) {
        this.pythonGraphsData = pythonGraphsData;
    }
}
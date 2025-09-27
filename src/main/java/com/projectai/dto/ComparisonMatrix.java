package com.projectai.dto;

import java.util.List;
import java.util.Map;

public class ComparisonMatrix {
    private List<String> criteria;
    private List<Map<String, Object>> products;
    private Map<String, String> explanations;
    private String bestOverallChoice;
    private String bestValueChoice;
    private String bestQualityChoice;
    private Map<String, Object> summary;
    private List<String> recommendations;
    private List<List<String>> data;

    public ComparisonMatrix() {}

    public List<String> getCriteria() {
        return criteria;
    }

    public void setCriteria(List<String> criteria) {
        this.criteria = criteria;
    }

    public List<Map<String, Object>> getProducts() {
        return products;
    }

    public void setProducts(List<Map<String, Object>> products) {
        this.products = products;
    }

    public Map<String, String> getExplanations() {
        return explanations;
    }

    public void setExplanations(Map<String, String> explanations) {
        this.explanations = explanations;
    }

    public String getBestOverallChoice() {
        return bestOverallChoice;
    }

    public void setBestOverallChoice(String bestOverallChoice) {
        this.bestOverallChoice = bestOverallChoice;
    }

    public String getBestValueChoice() {
        return bestValueChoice;
    }

    public void setBestValueChoice(String bestValueChoice) {
        this.bestValueChoice = bestValueChoice;
    }

    public String getBestQualityChoice() {
        return bestQualityChoice;
    }

    public void setBestQualityChoice(String bestQualityChoice) {
        this.bestQualityChoice = bestQualityChoice;
    }

    public Map<String, Object> getSummary() {
        return summary;
    }

    public void setSummary(Map<String, Object> summary) {
        this.summary = summary;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }

    public List<List<String>> getData() {
        return data;
    }

    public void setData(List<List<String>> data) {
        this.data = data;
    }
}
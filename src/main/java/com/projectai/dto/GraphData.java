package com.projectai.dto;

import java.util.List;
import java.util.Map;

public class GraphData {
    private String type;
    private String title;
    private String description;
    private Map<String, Object> data;
    private Map<String, Object> options;
    private List<String> labels;
    private List<Map<String, Object>> datasets;
    private String chartId;
    private Map<String, Object> styling;
    private String xAxis;
    private String yAxis;

    public GraphData() {}

    public GraphData(String type, String title) {
        this.type = type;
        this.title = title;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Map<String, Object> getData() {
        return data;
    }

    public void setData(Map<String, Object> data) {
        this.data = data;
    }

    public Map<String, Object> getOptions() {
        return options;
    }

    public void setOptions(Map<String, Object> options) {
        this.options = options;
    }

    public List<String> getLabels() {
        return labels;
    }

    public void setLabels(List<String> labels) {
        this.labels = labels;
    }

    public List<Map<String, Object>> getDatasets() {
        return datasets;
    }

    public void setDatasets(List<Map<String, Object>> datasets) {
        this.datasets = datasets;
    }

    public String getChartId() {
        return chartId;
    }

    public void setChartId(String chartId) {
        this.chartId = chartId;
    }

    public Map<String, Object> getStyling() {
        return styling;
    }

    public void setStyling(Map<String, Object> styling) {
        this.styling = styling;
    }

    public String getXAxis() {
        return xAxis;
    }

    public void setXAxis(String xAxis) {
        this.xAxis = xAxis;
    }

    public String getYAxis() {
        return yAxis;
    }

    public void setYAxis(String yAxis) {
        this.yAxis = yAxis;
    }
}
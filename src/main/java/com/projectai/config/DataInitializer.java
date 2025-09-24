package com.projectai.config;

import com.projectai.service.ThriftAIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

// @Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ThriftAIService thriftAIService;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("🚀 Initializing ThriftAI sample data...");
        thriftAIService.initializeSampleData();
        System.out.println("✅ Sample data initialized successfully!");
    }
}
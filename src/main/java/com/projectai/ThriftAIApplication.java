package com.projectai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ThriftAIApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(ThriftAIApplication.class, args);
    }
}
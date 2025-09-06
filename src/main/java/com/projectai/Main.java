package com.projectai;

import com.projectai.algorithms.SortingDemo;
import com.projectai.algorithms.SearchingDemo;
import com.projectai.datastructures.DataStructureDemo;
import com.projectai.utils.ConsoleUtils;

public class Main {
    public static void main(String[] args) {
        ConsoleUtils.printHeader("Welcome to ProjectAI");
        
        System.out.println("ProjectAI - A comprehensive Java project demonstrating:");
        System.out.println("• Data Structures");
        System.out.println("• Algorithms");
        System.out.println("• AI Concepts");
        System.out.println("• Best Practices");
        
        ConsoleUtils.printSeparator();
        
        // Demonstrate various components
        try {
            DataStructureDemo.demonstrate();
            SortingDemo.demonstrate();
            SearchingDemo.demonstrate();
        } catch (Exception e) {
            System.err.println("Error during demonstration: " + e.getMessage());
        }
        
        ConsoleUtils.printFooter("ProjectAI Demo Complete");
    }
}
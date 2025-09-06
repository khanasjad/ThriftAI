package com.projectai.utils;

public class ConsoleUtils {
    private static final String SEPARATOR = "=".repeat(60);
    private static final String LINE = "-".repeat(40);
    
    public static void printHeader(String title) {
        System.out.println(SEPARATOR);
        System.out.println(centerText(title, SEPARATOR.length()));
        System.out.println(SEPARATOR);
    }
    
    public static void printFooter(String message) {
        System.out.println(SEPARATOR);
        System.out.println(centerText(message, SEPARATOR.length()));
        System.out.println(SEPARATOR);
    }
    
    public static void printSeparator() {
        System.out.println(LINE);
    }
    
    public static void printSection(String sectionName) {
        System.out.println("\n" + sectionName.toUpperCase() + ":");
        printSeparator();
    }
    
    private static String centerText(String text, int width) {
        int padding = (width - text.length()) / 2;
        return " ".repeat(Math.max(0, padding)) + text;
    }
    
    public static void pause(int milliseconds) {
        try {
            Thread.sleep(milliseconds);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
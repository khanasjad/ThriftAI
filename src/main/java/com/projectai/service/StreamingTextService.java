package com.projectai.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Streaming Text Service for real-time AI responses
 * Provides Claude/ChatGPT-like streaming text generation
 */
@Service
public class StreamingTextService {

    @Autowired
    private ClaudeService claudeService;

    private final Map<String, SseEmitter> activeConnections = new ConcurrentHashMap<>();

    /**
     * Create a new streaming session for real-time text generation
     */
    public SseEmitter createStreamingSession() {
        String sessionId = UUID.randomUUID().toString();
        SseEmitter emitter = new SseEmitter(30000L); // 30 second timeout
        
        activeConnections.put(sessionId, emitter);
        
        emitter.onCompletion(() -> activeConnections.remove(sessionId));
        emitter.onTimeout(() -> activeConnections.remove(sessionId));
        emitter.onError((e) -> activeConnections.remove(sessionId));
        
        try {
            // Send initial connection confirmation
            emitter.send(SseEmitter.event()
                .name("connected")
                .data("{\"sessionId\":\"" + sessionId + "\",\"status\":\"connected\"}"));
        } catch (IOException e) {
            emitter.complete();
        }
        
        return emitter;
    }

    /**
     * Generate streaming text response similar to Claude/ChatGPT
     */
    public void generateStreamingResponse(String sessionId, String prompt, String context) {
        SseEmitter emitter = activeConnections.get(sessionId);
        if (emitter == null) {
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                // Send typing indicator
                sendEvent(emitter, "typing", "{\"status\":\"generating\"}");
                
                // Get full response from Claude service
                String fullResponse = claudeService.generateConversationalResponse(prompt, context);
                
                // Stream the response character by character for realistic typing effect
                streamTextResponse(emitter, fullResponse);
                
                // Send completion event
                sendEvent(emitter, "complete", "{\"status\":\"completed\"}");
                
            } catch (Exception e) {
                try {
                    sendEvent(emitter, "error", 
                        "{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
                } catch (IOException ioException) {
                    // Connection lost
                }
            }
        });
    }

    /**
     * Generate streaming search response with products
     */
    public void generateStreamingSearchResponse(String sessionId, String query, 
                                              java.util.List<com.projectai.models.Product> products) {
        SseEmitter emitter = activeConnections.get(sessionId);
        if (emitter == null) {
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                // Send typing indicator
                sendEvent(emitter, "typing", "{\"status\":\"searching\"}");
                
                // Send products first
                sendProductResults(emitter, products);
                
                // Generate AI response about the products
                String aiResponse = claudeService.generateThriftResponse(query, products, "product search");
                
                // Stream the AI commentary
                streamTextResponse(emitter, aiResponse);
                
                // Send completion
                sendEvent(emitter, "complete", "{\"status\":\"completed\"}");
                
            } catch (Exception e) {
                try {
                    sendEvent(emitter, "error", 
                        "{\"status\":\"error\",\"message\":\"Failed to generate response\"}");
                } catch (IOException ioException) {
                    // Connection lost
                }
            }
        });
    }

    /**
     * Stream text response with realistic typing effect
     */
    private void streamTextResponse(SseEmitter emitter, String text) throws IOException, InterruptedException {
        String[] words = text.split(" ");
        StringBuilder currentText = new StringBuilder();
        
        for (String word : words) {
            currentText.append(word).append(" ");
            
            // Send word-by-word for realistic streaming
            sendEvent(emitter, "text", 
                "{\"text\":\"" + escapeJson(currentText.toString().trim()) + "\",\"partial\":true}");
            
            // Simulate realistic typing speed (varies between 50-150ms per word)
            Thread.sleep(50 + (int)(Math.random() * 100));
        }
        
        // Send final complete text
        sendEvent(emitter, "text", 
            "{\"text\":\"" + escapeJson(text) + "\",\"partial\":false}");
    }

    /**
     * Send product results to client
     */
    private void sendProductResults(SseEmitter emitter, java.util.List<com.projectai.models.Product> products) 
            throws IOException {
        StringBuilder productsJson = new StringBuilder();
        productsJson.append("{\"products\":[");
        
        for (int i = 0; i < products.size(); i++) {
            com.projectai.models.Product p = products.get(i);
            if (i > 0) productsJson.append(",");
            
            productsJson.append("{")
                .append("\"name\":\"").append(escapeJson(p.getName())).append("\",")
                .append("\"brand\":\"").append(escapeJson(p.getBrand())).append("\",")
                .append("\"price\":").append(p.getPrice()).append(",")
                .append("\"originalPrice\":").append(p.getOriginalPrice()).append(",")
                .append("\"condition\":\"").append(escapeJson(p.getCondition())).append("\",")
                .append("\"size\":\"").append(escapeJson(p.getSize())).append("\",")
                .append("\"description\":\"").append(escapeJson(p.getDescription())).append("\"")
                .append("}");
        }
        
        productsJson.append("]}");
        
        sendEvent(emitter, "products", productsJson.toString());
    }

    /**
     * Send Server-Sent Event
     */
    private void sendEvent(SseEmitter emitter, String eventName, String data) throws IOException {
        emitter.send(SseEmitter.event()
            .name(eventName)
            .data(data));
    }

    /**
     * Escape JSON strings properly
     */
    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }

    /**
     * Close streaming session
     */
    public void closeSession(String sessionId) {
        SseEmitter emitter = activeConnections.remove(sessionId);
        if (emitter != null) {
            emitter.complete();
        }
    }

    /**
     * Get active session count
     */
    public int getActiveSessionCount() {
        return activeConnections.size();
    }

    /**
     * Send custom event to specific session
     */
    public void sendCustomEvent(String sessionId, String eventName, String data) {
        SseEmitter emitter = activeConnections.get(sessionId);
        if (emitter != null) {
            try {
                sendEvent(emitter, eventName, data);
            } catch (IOException e) {
                activeConnections.remove(sessionId);
            }
        }
    }
}
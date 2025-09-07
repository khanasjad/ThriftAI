package com.projectai.controller;

import com.projectai.models.Deal;
import com.projectai.models.UserPreferences;
import com.projectai.service.ThriftAIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ThriftAIService thriftAIService;

    /**
     * Handle real-time deal requests from clients
     */
    @MessageMapping("/deals/request")
    @SendTo("/topic/deals")
    public List<Deal> handleDealRequest(Map<String, Object> request) {
        try {
            UserPreferences preferences = thriftAIService.getDefaultUserPreferences(null);
            int limit = (Integer) request.getOrDefault("limit", 5);
            
            List<Deal> deals = thriftAIService.findBestDeals(preferences, limit);
            
            return deals;
        } catch (Exception e) {
            // Log error and return empty list
            return List.of();
        }
    }

    /**
     * Handle AI enhancement requests
     */
    @MessageMapping("/deals/ai-enhance")
    @SendTo("/topic/ai-deals")
    public List<Deal> handleAIEnhanceRequest(Map<String, Object> request) {
        try {
            UserPreferences preferences = thriftAIService.getDefaultUserPreferences(null);
            int limit = (Integer) request.getOrDefault("limit", 5);
            
            List<Deal> aiDeals = thriftAIService.findBestDealsWithAI(preferences, limit);
            
            return aiDeals;
        } catch (Exception e) {
            return List.of();
        }
    }

    /**
     * Handle live statistics requests
     */
    @MessageMapping("/stats/request")
    @SendTo("/topic/stats")
    public Map<String, Object> handleStatsRequest() {
        return thriftAIService.getPlatformOverview();
    }

    /**
     * Scheduled task to broadcast deal updates every 30 seconds
     */
    @Scheduled(fixedRate = 30000) // 30 seconds
    @Async
    public void broadcastDealUpdates() {
        try {
            UserPreferences preferences = thriftAIService.getDefaultUserPreferences(null);
            List<Deal> latestDeals = thriftAIService.findBestDeals(preferences, 3);
            
            Map<String, Object> update = new HashMap<>();
            update.put("type", "DEAL_UPDATE");
            update.put("timestamp", System.currentTimeMillis());
            update.put("deals", latestDeals);
            update.put("message", "New deals available!");
            
            messagingTemplate.convertAndSend("/topic/live-updates", update);
            
        } catch (Exception e) {
            // Log error silently
        }
    }

    /**
     * Scheduled task to broadcast platform statistics every 60 seconds
     */
    @Scheduled(fixedRate = 60000) // 1 minute
    @Async
    public void broadcastStatsUpdate() {
        try {
            Map<String, Object> stats = thriftAIService.getPlatformOverview();
            
            Map<String, Object> update = new HashMap<>();
            update.put("type", "STATS_UPDATE");
            update.put("timestamp", System.currentTimeMillis());
            update.put("stats", stats);
            
            messagingTemplate.convertAndSend("/topic/stats-updates", update);
            
        } catch (Exception e) {
            // Log error silently
        }
    }

    /**
     * Send notification to specific user
     */
    public void sendNotificationToUser(String userId, String message, String type) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("message", message);
        notification.put("type", type);
        notification.put("timestamp", System.currentTimeMillis());
        
        messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", notification);
    }

    /**
     * Broadcast system-wide notification
     */
    public void broadcastNotification(String message, String type) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("message", message);
        notification.put("type", type);
        notification.put("timestamp", System.currentTimeMillis());
        
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }
}
package com.projectai.service;

import com.projectai.models.Deal;
import com.projectai.models.UserPreferences;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AIEnhancementService {

    private final WebClient webClient;
    
    @Value("${thriftai.ai.enabled:false}")
    private boolean aiEnabled;
    
    @Value("${thriftai.ai.api.url:}")
    private String aiApiUrl;

    public AIEnhancementService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public List<Deal> enhanceDeals(List<Deal> deals, UserPreferences preferences) {
        if (!aiEnabled || deals.isEmpty()) {
            return deals;
        }

        // For now, simulate AI enhancement by applying additional scoring
        return deals.stream()
                .map(deal -> enhanceDealWithAI(deal, preferences))
                .sorted((d1, d2) -> Double.compare(d2.getDealScore(), d1.getDealScore()))
                .collect(Collectors.toList());
    }

    private Deal enhanceDealWithAI(Deal deal, UserPreferences preferences) {
        // Simulate AI enhancement logic
        double enhancementFactor = 1.0;
        
        // Boost score based on user behavior patterns (simulated)
        if (isPopularProduct(deal)) {
            enhancementFactor += 0.1;
        }
        
        // Seasonal adjustments (simulated)
        if (isSeasonalProduct(deal)) {
            enhancementFactor += 0.05;
        }
        
        // Trending boost (simulated)
        if (isTrendingProduct(deal)) {
            enhancementFactor += 0.15;
        }

        double newScore = Math.min(100.0, deal.getDealScore() * enhancementFactor);
        deal.setDealScore(newScore);
        
        // Update deal reason
        String aiReason = deal.getDealReason() + " Enhanced by AI: ";
        if (isPopularProduct(deal)) aiReason += "Popular choice! ";
        if (isSeasonalProduct(deal)) aiReason += "Perfect timing! ";
        if (isTrendingProduct(deal)) aiReason += "Trending now! ";
        
        deal.setDealReason(aiReason.trim());
        
        return deal;
    }

    // Simulated AI analysis methods (in real implementation, these would call external APIs)
    private boolean isPopularProduct(Deal deal) {
        return deal.getProduct().getBrand() != null && 
               (deal.getProduct().getBrand().equals("NIKE") || deal.getProduct().getBrand().equals("APPLE"));
    }

    private boolean isSeasonalProduct(Deal deal) {
        String category = deal.getProduct().getCategory();
        return "CLOTHING".equals(category) || "SHOES".equals(category);
    }

    private boolean isTrendingProduct(Deal deal) {
        return deal.getProduct().getDiscountPercentage() > 50;
    }

    // Placeholder for future external AI API integration
    public String callExternalAI(String prompt, Object context) {
        if (!aiEnabled || aiApiUrl.isEmpty()) {
            return "AI enhancement not configured";
        }

        // This would make actual API calls to services like OpenAI, Anthropic, etc.
        // For now, return a simulated response
        return "AI-enhanced recommendation based on user preferences and market trends";
    }

    public boolean isAIEnabled() {
        return aiEnabled;
    }
}
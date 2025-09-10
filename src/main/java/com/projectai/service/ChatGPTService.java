package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;

@Service
public class ChatGPTService {

    @Autowired
    private ProductRepository productRepository;

    public String enhanceSearchQuery(String query) {
        // For now, implement basic query enhancement
        // In a real implementation, this would call OpenAI API
        
        String lowerQuery = query.toLowerCase();
        
        // Enhance common search terms
        if (lowerQuery.contains("cheap") || lowerQuery.contains("affordable")) {
            return query + " budget friendly low price";
        }
        if (lowerQuery.contains("vintage") || lowerQuery.contains("retro")) {
            return query + " classic old style antique";
        }
        if (lowerQuery.contains("designer") || lowerQuery.contains("luxury")) {
            return query + " high end premium brand";
        }
        if (lowerQuery.contains("casual") || lowerQuery.contains("everyday")) {
            return query + " comfortable relaxed daily wear";
        }
        
        return query;
    }

    public List<Product> searchProducts(String enhancedQuery) {
        // Basic search implementation
        // In a real implementation, this would use vector embeddings or advanced NLP
        
        String[] keywords = enhancedQuery.toLowerCase().split("\\s+");
        
        return productRepository.findAll().stream()
                .filter(product -> {
                    String searchText = (product.getName() + " " + 
                                      product.getDescription() + " " + 
                                      product.getBrand() + " " + 
                                      product.getCategory()).toLowerCase();
                    
                    return Arrays.stream(keywords)
                            .anyMatch(keyword -> searchText.contains(keyword));
                })
                .filter(Product::isAvailable)
                .limit(20)
                .collect(Collectors.toList());
    }

    public String generateSearchResponse(String originalQuery, List<Product> products) {
        // Generate a conversational response
        // In a real implementation, this would use ChatGPT API
        
        if (products.isEmpty()) {
            return "I couldn't find any products matching '" + originalQuery + 
                   "'. Try searching for something else or browse our categories!";
        }
        
        String response = "I found " + products.size() + " great options for '" + originalQuery + "'! ";
        
        if (products.size() == 1) {
            Product product = products.get(0);
            response += "Check out this " + product.getName() + " by " + product.getBrand() + 
                       " for just $" + product.getPrice() + ". " + product.getDescription();
        } else {
            // Highlight price range
            double minPrice = products.stream().mapToDouble(Product::getPrice).min().orElse(0);
            double maxPrice = products.stream().mapToDouble(Product::getPrice).max().orElse(0);
            
            response += "Prices range from $" + String.format("%.2f", minPrice) + 
                       " to $" + String.format("%.2f", maxPrice) + ". ";
            
            // Mention popular brands
            List<String> brands = products.stream()
                    .map(Product::getBrand)
                    .distinct()
                    .limit(3)
                    .collect(Collectors.toList());
            
            if (!brands.isEmpty()) {
                response += "Popular brands include " + String.join(", ", brands) + ". ";
            }
            
            response += "Browse through the results to find your perfect match!";
        }
        
        return response;
    }

    public String generateProductDescription(Product product) {
        // Generate enhanced product descriptions using AI
        // This would use ChatGPT API in a real implementation
        
        return "This " + product.getName() + " by " + product.getBrand() + 
               " is a " + product.getCategory().toLowerCase() + " item " +
               "priced at $" + product.getPrice() + ". " +
               (product.getDescription() != null ? product.getDescription() : "") +
               " Perfect for anyone looking for quality " + product.getCategory().toLowerCase() + ".";
    }

    public List<String> getSuggestedQueries(String category) {
        // Return suggested search queries for a category
        switch (category.toLowerCase()) {
            case "clothing":
                return Arrays.asList(
                    "vintage band t-shirts",
                    "designer jeans under $50",
                    "casual summer dresses",
                    "winter coats",
                    "workout clothes"
                );
            case "shoes":
                return Arrays.asList(
                    "vintage Nike sneakers",
                    "comfortable walking shoes",
                    "designer heels",
                    "boots for winter",
                    "running shoes"
                );
            case "accessories":
                return Arrays.asList(
                    "designer handbags",
                    "vintage jewelry",
                    "sunglasses",
                    "watches",
                    "belts and ties"
                );
            case "electronics":
                return Arrays.asList(
                    "vintage gaming consoles",
                    "retro cameras",
                    "audio equipment",
                    "smartphones",
                    "tablets"
                );
            default:
                return Arrays.asList(
                    "trending items",
                    "best deals today",
                    "popular brands",
                    "vintage finds",
                    "designer pieces"
                );
        }
    }
}
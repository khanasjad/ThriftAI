package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Arrays;
import java.util.stream.Collectors;

@Service
public class VisualSearchService {

    @Autowired
    private ProductRepository productRepository;

    public List<Product> searchByImage(MultipartFile image) {
        // Mock implementation for visual search
        // In a real implementation, this would:
        // 1. Extract features from the uploaded image using computer vision
        // 2. Compare with stored product images
        // 3. Return similar products based on visual similarity
        
        try {
            String filename = image.getOriginalFilename();
            if (filename == null) {
                return List.of();
            }
            
            // Mock logic based on filename or image analysis
            String searchTerm = extractSearchTermFromImage(filename);
            
            return productRepository.findAll().stream()
                    .filter(product -> {
                        String productText = (product.getName() + " " + 
                                            product.getDescription() + " " + 
                                            product.getCategory()).toLowerCase();
                        return productText.contains(searchTerm.toLowerCase());
                    })
                    .filter(Product::isAvailable)
                    .limit(10)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            // Return some random products as fallback
            return productRepository.findAll().stream()
                    .filter(Product::isAvailable)
                    .limit(5)
                    .collect(Collectors.toList());
        }
    }

    public String describeImage(MultipartFile image) {
        // Mock implementation for image description
        // In a real implementation, this would use computer vision API
        
        try {
            String filename = image.getOriginalFilename();
            if (filename == null) {
                return "I can see an image that you'd like to search for. Let me find similar products!";
            }
            
            // Extract clues from filename
            String lowerFilename = filename.toLowerCase();
            
            if (lowerFilename.contains("shirt") || lowerFilename.contains("tshirt")) {
                return "I can see a shirt in this image. The style appears to be casual with interesting details.";
            } else if (lowerFilename.contains("shoe") || lowerFilename.contains("sneaker")) {
                return "I can see a shoe/sneaker in this image. It looks like a trendy athletic or casual style.";
            } else if (lowerFilename.contains("dress")) {
                return "I can see a dress in this image. It appears to have an elegant design suitable for various occasions.";
            } else if (lowerFilename.contains("bag") || lowerFilename.contains("purse")) {
                return "I can see a bag/purse in this image. It looks like a stylish accessory with good craftsmanship.";
            } else if (lowerFilename.contains("jean") || lowerFilename.contains("pant")) {
                return "I can see pants/jeans in this image. They appear to have a classic fit and style.";
            } else {
                return "I can see an interesting fashion item in this image. Let me search for similar products based on the style and features I detect.";
            }
            
        } catch (Exception e) {
            return "I'm analyzing your image to find similar products. Please wait while I search our inventory!";
        }
    }

    public Map<String, Object> analyzeImage(MultipartFile image) {
        // Mock implementation for detailed image analysis
        // In a real implementation, this would use advanced computer vision
        
        Map<String, Object> analysis = new HashMap<>();
        
        try {
            String filename = image.getOriginalFilename();
            long fileSize = image.getSize();
            
            analysis.put("filename", filename);
            analysis.put("fileSize", fileSize);
            analysis.put("contentType", image.getContentType());
            
            // Mock analysis results
            analysis.put("dominantColors", Arrays.asList("blue", "white", "gray"));
            analysis.put("detectedObjects", Arrays.asList("clothing", "fabric", "textile"));
            analysis.put("style", "casual");
            analysis.put("confidence", 0.85);
            analysis.put("tags", Arrays.asList("clothing", "casual", "trendy", "comfortable"));
            
            // Extract category from filename
            if (filename != null) {
                String category = extractCategoryFromImage(filename);
                analysis.put("suggestedCategory", category);
                analysis.put("searchTerms", generateSearchTerms(filename));
            }
            
        } catch (Exception e) {
            analysis.put("error", "Failed to analyze image: " + e.getMessage());
        }
        
        return analysis;
    }

    private String extractSearchTermFromImage(String filename) {
        // Extract search terms from filename
        String lowerFilename = filename.toLowerCase();
        
        if (lowerFilename.contains("shirt") || lowerFilename.contains("tshirt")) {
            return "shirt";
        } else if (lowerFilename.contains("shoe") || lowerFilename.contains("sneaker")) {
            return "shoes";
        } else if (lowerFilename.contains("dress")) {
            return "dress";
        } else if (lowerFilename.contains("bag") || lowerFilename.contains("purse")) {
            return "accessories";
        } else if (lowerFilename.contains("jean") || lowerFilename.contains("pant")) {
            return "pants";
        } else if (lowerFilename.contains("jacket") || lowerFilename.contains("coat")) {
            return "jacket";
        } else {
            return "clothing";
        }
    }

    private String extractCategoryFromImage(String filename) {
        // Extract category from filename
        String lowerFilename = filename.toLowerCase();
        
        if (lowerFilename.contains("shirt") || lowerFilename.contains("dress") || 
            lowerFilename.contains("jean") || lowerFilename.contains("jacket")) {
            return "Clothing";
        } else if (lowerFilename.contains("shoe") || lowerFilename.contains("sneaker") || 
                   lowerFilename.contains("boot")) {
            return "Shoes";
        } else if (lowerFilename.contains("bag") || lowerFilename.contains("purse") || 
                   lowerFilename.contains("wallet") || lowerFilename.contains("belt")) {
            return "Accessories";
        } else if (lowerFilename.contains("phone") || lowerFilename.contains("laptop") || 
                   lowerFilename.contains("watch")) {
            return "Electronics";
        } else {
            return "Clothing";
        }
    }

    private List<String> generateSearchTerms(String filename) {
        // Generate relevant search terms from filename
        String category = extractCategoryFromImage(filename);
        String searchTerm = extractSearchTermFromImage(filename);
        
        return Arrays.asList(
                searchTerm,
                category.toLowerCase(),
                "trending " + searchTerm,
                "popular " + searchTerm,
                "best " + searchTerm
        );
    }

    public List<Product> findSimilarProducts(Product product) {
        // Find products similar to a given product
        return productRepository.findAll().stream()
                .filter(p -> !p.getId().equals(product.getId()))
                .filter(p -> p.getCategory().equals(product.getCategory()) || 
                           p.getBrand().equals(product.getBrand()))
                .filter(Product::isAvailable)
                .limit(8)
                .collect(Collectors.toList());
    }
}
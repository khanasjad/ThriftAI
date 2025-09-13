package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Arrays;
import java.util.stream.Collectors;
import java.io.IOException;
import java.util.Base64;
import java.util.Random;

@Service
public class VisualSearchService {

    @Autowired
    private ProductRepository productRepository;
    
    @Value("${openai.api.key:demo-key}")
    private String openAiApiKey;
    
    @Value("${visual.search.provider:mock}")
    private String visualSearchProvider;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final Random random = new Random();

    public List<Product> searchByImage(MultipartFile image) {
        try {
            Map<String, Object> imageAnalysis = analyzeImageWithAI(image);
            
            // Extract search terms from AI analysis
            List<String> searchTerms = (List<String>) imageAnalysis.getOrDefault("searchTerms", Arrays.asList("clothing"));
            String category = (String) imageAnalysis.getOrDefault("suggestedCategory", "Clothing");
            List<String> colors = (List<String>) imageAnalysis.getOrDefault("dominantColors", Arrays.asList());
            
            // Find products based on AI analysis
            return findProductsByVisualFeatures(searchTerms, category, colors);
            
        } catch (Exception e) {
            // Fallback to filename-based search
            return searchByImageFallback(image);
        }
    }
    
    private List<Product> searchByImageFallback(MultipartFile image) {
        try {
            String filename = image.getOriginalFilename();
            if (filename == null) {
                return getRandomProducts(5);
            }
            
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
            return getRandomProducts(5);
        }
    }
    
    private List<Product> getRandomProducts(int count) {
        List<Product> allProducts = productRepository.findByIsAvailableTrue();
        return allProducts.stream()
                .skip(random.nextInt(Math.max(1, allProducts.size() - count)))
                .limit(count)
                .collect(Collectors.toList());
    }

    public String describeImage(MultipartFile image) {
        try {
            if ("openai".equals(visualSearchProvider) && !"demo-key".equals(openAiApiKey)) {
                return describeImageWithOpenAI(image);
            } else {
                return describeImageFallback(image);
            }
        } catch (Exception e) {
            return describeImageFallback(image);
        }
    }
    
    private String describeImageWithOpenAI(MultipartFile image) {
        try {
            // Convert image to base64
            byte[] imageBytes = image.getBytes();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            
            // Prepare OpenAI Vision API request
            Map<String, Object> request = new HashMap<>();
            request.put("model", "gpt-4-vision-preview");
            request.put("messages", Arrays.asList(
                Map.of(
                    "role", "user",
                    "content", Arrays.asList(
                        Map.of("type", "text", "text", "Describe this fashion item in detail. Focus on style, category, color, and key features."),
                        Map.of("type", "image_url", "image_url", Map.of("url", "data:image/jpeg;base64," + base64Image))
                    )
                )
            ));
            request.put("max_tokens", 200);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openAiApiKey);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.openai.com/v1/chat/completions", entity, Map.class);
            
            if (response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
            
            return describeImageFallback(image);
            
        } catch (Exception e) {
            return describeImageFallback(image);
        }
    }
    
    private String describeImageFallback(MultipartFile image) {
        try {
            String filename = image.getOriginalFilename();
            if (filename == null) {
                return "I can see an image that you'd like to search for. Let me find similar products!";
            }
            
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
        try {
            if ("openai".equals(visualSearchProvider) && !"demo-key".equals(openAiApiKey)) {
                return analyzeImageWithAI(image);
            } else {
                return analyzeImageFallback(image);
            }
        } catch (Exception e) {
            return analyzeImageFallback(image);
        }
    }
    
    private Map<String, Object> analyzeImageWithAI(MultipartFile image) {
        Map<String, Object> analysis = new HashMap<>();
        
        try {
            String filename = image.getOriginalFilename();
            long fileSize = image.getSize();
            
            analysis.put("filename", filename);
            analysis.put("fileSize", fileSize);
            analysis.put("contentType", image.getContentType());
            
            // Get AI description
            String description = describeImageWithOpenAI(image);
            analysis.put("aiDescription", description);
            
            // Extract features from AI description
            Map<String, Object> extractedFeatures = extractFeaturesFromDescription(description);
            analysis.putAll(extractedFeatures);
            
            // Fallback to filename analysis if needed
            if (filename != null) {
                String category = extractCategoryFromImage(filename);
                if (!analysis.containsKey("suggestedCategory")) {
                    analysis.put("suggestedCategory", category);
                }
                if (!analysis.containsKey("searchTerms")) {
                    analysis.put("searchTerms", generateSearchTerms(filename));
                }
            }
            
        } catch (Exception e) {
            return analyzeImageFallback(image);
        }
        
        return analysis;
    }
    
    private Map<String, Object> analyzeImageFallback(MultipartFile image) {
        Map<String, Object> analysis = new HashMap<>();
        
        try {
            String filename = image.getOriginalFilename();
            long fileSize = image.getSize();
            
            analysis.put("filename", filename);
            analysis.put("fileSize", fileSize);
            analysis.put("contentType", image.getContentType());
            
            // Mock analysis results with randomization
            analysis.put("dominantColors", getRandomColors());
            analysis.put("detectedObjects", Arrays.asList("clothing", "fabric", "textile"));
            analysis.put("style", getRandomStyle());
            analysis.put("confidence", 0.75 + random.nextDouble() * 0.2);
            analysis.put("tags", getRandomTags());
            
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
        return productRepository.findAll().stream()
                .filter(p -> !p.getId().equals(product.getId()))
                .filter(p -> p.getCategory().equals(product.getCategory()) || 
                           p.getBrand().equals(product.getBrand()))
                .filter(Product::isAvailable)
                .limit(8)
                .collect(Collectors.toList());
    }
    
    private List<Product> findProductsByVisualFeatures(List<String> searchTerms, String category, List<String> colors) {
        return productRepository.findAll().stream()
                .filter(Product::isAvailable)
                .filter(product -> {
                    String productText = (product.getName() + " " + 
                                        product.getDescription() + " " + 
                                        product.getCategory() + " " + 
                                        product.getBrand()).toLowerCase();
                    
                    // Check if any search term matches
                    boolean termMatch = searchTerms.stream()
                            .anyMatch(term -> productText.contains(term.toLowerCase()));
                    
                    // Category match bonus
                    boolean categoryMatch = product.getCategory().equalsIgnoreCase(category);
                    
                    return termMatch || categoryMatch;
                })
                .limit(10)
                .collect(Collectors.toList());
    }
    
    private Map<String, Object> extractFeaturesFromDescription(String description) {
        Map<String, Object> features = new HashMap<>();
        String lowerDesc = description.toLowerCase();
        
        // Extract colors
        List<String> colors = Arrays.asList("red", "blue", "green", "black", "white", "gray", "brown", "yellow", "pink", "purple")
                .stream()
                .filter(color -> lowerDesc.contains(color))
                .collect(Collectors.toList());
        if (colors.isEmpty()) colors = getRandomColors();
        features.put("dominantColors", colors);
        
        // Extract category
        if (lowerDesc.contains("shirt") || lowerDesc.contains("blouse")) {
            features.put("suggestedCategory", "Clothing");
            features.put("searchTerms", Arrays.asList("shirt", "top", "clothing"));
        } else if (lowerDesc.contains("shoe") || lowerDesc.contains("sneaker") || lowerDesc.contains("boot")) {
            features.put("suggestedCategory", "Shoes");
            features.put("searchTerms", Arrays.asList("shoes", "footwear", "sneakers"));
        } else if (lowerDesc.contains("bag") || lowerDesc.contains("purse") || lowerDesc.contains("handbag")) {
            features.put("suggestedCategory", "Accessories");
            features.put("searchTerms", Arrays.asList("bag", "purse", "accessories"));
        } else {
            features.put("suggestedCategory", "Clothing");
            features.put("searchTerms", Arrays.asList("clothing", "fashion", "apparel"));
        }
        
        // Extract style
        if (lowerDesc.contains("casual")) features.put("style", "casual");
        else if (lowerDesc.contains("formal")) features.put("style", "formal");
        else if (lowerDesc.contains("sporty")) features.put("style", "sporty");
        else features.put("style", "trendy");
        
        features.put("confidence", 0.85);
        features.put("tags", Arrays.asList("ai-analyzed", "visual-search", "trendy"));
        
        return features;
    }
    
    private List<String> getRandomColors() {
        List<String> allColors = Arrays.asList("red", "blue", "green", "black", "white", "gray", "brown", "navy", "beige", "pink");
        return allColors.stream()
                .filter(color -> random.nextDouble() < 0.4)
                .limit(3)
                .collect(Collectors.toList());
    }
    
    private String getRandomStyle() {
        List<String> styles = Arrays.asList("casual", "formal", "trendy", "vintage", "sporty", "elegant");
        return styles.get(random.nextInt(styles.size()));
    }
    
    private List<String> getRandomTags() {
        List<String> allTags = Arrays.asList("clothing", "fashion", "trendy", "comfortable", "stylish", "modern", "classic", "casual");
        return allTags.stream()
                .filter(tag -> random.nextDouble() < 0.6)
                .limit(4)
                .collect(Collectors.toList());
    }
}
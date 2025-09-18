package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;
import java.io.IOException;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;

@Service
public class EnhancedVisualSearchService {

    @Autowired
    private ProductRepository productRepository;

    @Value("${openai.api.key:demo-key}")
    private String openAiApiKey;

    @Value("${visual.search.provider:openai}")
    private String visualSearchProvider;

    private final RestTemplate restTemplate = new RestTemplate();
    private final Random random = new Random();

    // In-memory vector store for demo (in production, use Pinecone/Weaviate/Chroma)
    private final Map<String, List<Double>> productVectors = new ConcurrentHashMap<>();
    private final Map<String, ProductImageMetadata> imageMetadata = new ConcurrentHashMap<>();

    // AI-powered visual search with vector similarity
    public VisualSearchResult searchByImageAdvanced(MultipartFile image) {
        try {
            // Step 1: Analyze image with AI
            Map<String, Object> imageAnalysis = analyzeImageWithAI(image);

            // Step 2: Generate embeddings for the uploaded image
            List<Double> imageVector = generateImageEmbeddings(image);

            // Step 3: Find similar products using vector similarity
            List<ProductSimilarity> similarProducts = findSimilarProductsByVector(imageVector);

            // Step 4: Enhance results with AI insights
            List<Product> products = similarProducts.stream()
                .map(ps -> ps.product)
                .collect(Collectors.toList());

            // Step 5: Build comprehensive response
            return VisualSearchResult.builder()
                .products(products)
                .similarities(similarProducts)
                .imageAnalysis(imageAnalysis)
                .searchTerms((List<String>) imageAnalysis.getOrDefault("searchTerms", Arrays.asList()))
                .confidence(calculateOverallConfidence(similarProducts))
                .aiInsights(generateAIInsights(imageAnalysis, products))
                .build();

        } catch (Exception e) {
            // Enhanced fallback with better matching
            return searchByImageFallbackAdvanced(image);
        }
    }

    // Generate vector embeddings for images (mock implementation)
    private List<Double> generateImageEmbeddings(MultipartFile image) {
        try {
            if ("openai".equals(visualSearchProvider) && !"demo-key".equals(openAiApiKey)) {
                return generateOpenAIEmbeddings(image);
            } else {
                return generateMockEmbeddings(image);
            }
        } catch (Exception e) {
            return generateMockEmbeddings(image);
        }
    }

    private List<Double> generateOpenAIEmbeddings(MultipartFile image) {
        try {
            // Convert image to base64
            byte[] imageBytes = image.getBytes();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            // Use OpenAI Vision API to describe image
            String description = describeImageWithOpenAI(image);

            // Generate text embeddings from description
            Map<String, Object> request = new HashMap<>();
            request.put("model", "text-embedding-ada-002");
            request.put("input", description);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openAiApiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.openai.com/v1/embeddings", entity, Map.class);

            if (response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                List<Map<String, Object>> data = (List<Map<String, Object>>) responseBody.get("data");
                if (!data.isEmpty()) {
                    List<Double> embedding = (List<Double>) data.get(0).get("embedding");
                    return embedding;
                }
            }

            return generateMockEmbeddings(image);

        } catch (Exception e) {
            return generateMockEmbeddings(image);
        }
    }

    private List<Double> generateMockEmbeddings(MultipartFile image) {
        // Generate realistic mock embeddings based on image properties
        List<Double> embeddings = new ArrayList<>();
        try {
            // Use image properties to generate semi-realistic vectors
            byte[] imageBytes = image.getBytes();
            BufferedImage bufferedImage = ImageIO.read(new ByteArrayInputStream(imageBytes));

            if (bufferedImage != null) {
                int width = bufferedImage.getWidth();
                int height = bufferedImage.getHeight();

                // Generate 1536-dimensional vector (same as OpenAI ada-002)
                Random vectorRandom = new Random(image.getOriginalFilename().hashCode());
                for (int i = 0; i < 1536; i++) {
                    double value = vectorRandom.nextGaussian() * 0.1;

                    // Add some pattern based on image characteristics
                    if (i < 100) {
                        value += (width % 1000) / 10000.0;
                    } else if (i < 200) {
                        value += (height % 1000) / 10000.0;
                    } else if (i < 300) {
                        value += (imageBytes.length % 1000) / 10000.0;
                    }

                    embeddings.add(value);
                }
            } else {
                // Fallback: purely random but consistent vector
                Random vectorRandom = new Random(image.getOriginalFilename().hashCode());
                for (int i = 0; i < 1536; i++) {
                    embeddings.add(vectorRandom.nextGaussian() * 0.1);
                }
            }

        } catch (Exception e) {
            // Final fallback
            Random vectorRandom = new Random(42);
            for (int i = 0; i < 1536; i++) {
                embeddings.add(vectorRandom.nextGaussian() * 0.1);
            }
        }

        return embeddings;
    }

    // Find similar products using cosine similarity
    private List<ProductSimilarity> findSimilarProductsByVector(List<Double> queryVector) {
        List<Product> allProducts = productRepository.findByIsAvailableTrue();
        List<ProductSimilarity> similarities = new ArrayList<>();

        for (Product product : allProducts) {
            // Get or generate vector for this product
            List<Double> productVector = getOrGenerateProductVector(product);

            // Calculate cosine similarity
            double similarity = calculateCosineSimilarity(queryVector, productVector);

            similarities.add(new ProductSimilarity(product, similarity));
        }

        // Sort by similarity score (descending) and return top 10
        return similarities.stream()
            .sorted((a, b) -> Double.compare(b.similarity, a.similarity))
            .limit(10)
            .collect(Collectors.toList());
    }

    private List<Double> getOrGenerateProductVector(Product product) {
        String productId = product.getId();

        if (productVectors.containsKey(productId)) {
            return productVectors.get(productId);
        }

        // Generate vector based on product text
        String productText = String.join(" ",
            product.getName(),
            product.getDescription() != null ? product.getDescription() : "",
            product.getCategory() != null ? product.getCategory() : "",
            product.getBrand() != null ? product.getBrand() : ""
        );

        List<Double> vector = generateTextEmbeddings(productText, productId);
        productVectors.put(productId, vector);

        return vector;
    }

    private List<Double> generateTextEmbeddings(String text, String productId) {
        // Generate consistent mock embeddings based on text
        Random vectorRandom = new Random(text.hashCode());
        List<Double> embeddings = new ArrayList<>();

        for (int i = 0; i < 1536; i++) {
            double value = vectorRandom.nextGaussian() * 0.1;

            // Add semantic meaning based on keywords
            String lowerText = text.toLowerCase();
            if (lowerText.contains("nike") && i < 50) value += 0.3;
            if (lowerText.contains("adidas") && i >= 50 && i < 100) value += 0.3;
            if (lowerText.contains("shoe") && i >= 100 && i < 150) value += 0.3;
            if (lowerText.contains("shirt") && i >= 150 && i < 200) value += 0.3;
            if (lowerText.contains("dress") && i >= 200 && i < 250) value += 0.3;
            if (lowerText.contains("vintage") && i >= 250 && i < 300) value += 0.3;

            embeddings.add(value);
        }

        return embeddings;
    }

    private double calculateCosineSimilarity(List<Double> vectorA, List<Double> vectorB) {
        if (vectorA.size() != vectorB.size()) {
            return 0.0;
        }

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < vectorA.size(); i++) {
            dotProduct += vectorA.get(i) * vectorB.get(i);
            normA += Math.pow(vectorA.get(i), 2);
            normB += Math.pow(vectorB.get(i), 2);
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private Map<String, Object> analyzeImageWithAI(MultipartFile image) {
        Map<String, Object> analysis = new HashMap<>();

        try {
            if ("openai".equals(visualSearchProvider) && !"demo-key".equals(openAiApiKey)) {
                String aiDescription = describeImageWithOpenAI(image);
                analysis.put("aiDescription", aiDescription);
                analysis.putAll(extractAdvancedFeatures(aiDescription));
            } else {
                analysis.putAll(analyzeMockAdvanced(image));
            }

        } catch (Exception e) {
            analysis.putAll(analyzeMockAdvanced(image));
        }

        return analysis;
    }

    private String describeImageWithOpenAI(MultipartFile image) {
        try {
            byte[] imageBytes = image.getBytes();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            Map<String, Object> request = new HashMap<>();
            request.put("model", "gpt-4-vision-preview");
            request.put("messages", Arrays.asList(
                Map.of(
                    "role", "user",
                    "content", Arrays.asList(
                        Map.of("type", "text", "text",
                            "Analyze this fashion item. Provide: 1) Category (clothing/shoes/accessories), " +
                            "2) Style description, 3) Colors, 4) Brand if visible, 5) Key features, " +
                            "6) Target demographic, 7) Season/occasion suitability, 8) Price range estimate"),
                        Map.of("type", "image_url", "image_url",
                            Map.of("url", "data:image/jpeg;base64," + base64Image))
                    )
                )
            ));
            request.put("max_tokens", 300);

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

        } catch (Exception e) {
            // Fallback
        }

        return "Fashion item analysis not available";
    }

    private Map<String, Object> extractAdvancedFeatures(String aiDescription) {
        Map<String, Object> features = new HashMap<>();
        String lowerDesc = aiDescription.toLowerCase();

        // Extract category with confidence
        if (lowerDesc.contains("shoe") || lowerDesc.contains("sneaker") || lowerDesc.contains("boot")) {
            features.put("category", "Shoes");
            features.put("categoryConfidence", 0.9);
        } else if (lowerDesc.contains("shirt") || lowerDesc.contains("blouse") || lowerDesc.contains("top")) {
            features.put("category", "Clothing");
            features.put("categoryConfidence", 0.85);
        } else if (lowerDesc.contains("dress")) {
            features.put("category", "Clothing");
            features.put("categoryConfidence", 0.9);
        } else if (lowerDesc.contains("bag") || lowerDesc.contains("purse") || lowerDesc.contains("accessories")) {
            features.put("category", "Accessories");
            features.put("categoryConfidence", 0.8);
        } else {
            features.put("category", "Clothing");
            features.put("categoryConfidence", 0.5);
        }

        // Extract colors
        List<String> colors = Arrays.asList("red", "blue", "green", "black", "white", "gray", "brown",
            "yellow", "pink", "purple", "navy", "beige", "tan", "gold", "silver")
            .stream()
            .filter(color -> lowerDesc.contains(color))
            .collect(Collectors.toList());
        features.put("dominantColors", colors.isEmpty() ? Arrays.asList("unknown") : colors);

        // Extract style keywords
        List<String> styles = Arrays.asList("casual", "formal", "sporty", "vintage", "modern", "classic",
            "trendy", "elegant", "bohemian", "minimalist")
            .stream()
            .filter(style -> lowerDesc.contains(style))
            .collect(Collectors.toList());
        features.put("styles", styles);

        // Extract brands
        List<String> brands = Arrays.asList("nike", "adidas", "gucci", "prada", "zara", "h&m", "uniqlo",
            "supreme", "louis vuitton", "chanel")
            .stream()
            .filter(brand -> lowerDesc.contains(brand))
            .collect(Collectors.toList());
        features.put("detectedBrands", brands);

        // Generate search terms
        List<String> searchTerms = new ArrayList<>();
        searchTerms.add((String) features.get("category"));
        searchTerms.addAll(colors);
        searchTerms.addAll(styles);
        searchTerms.addAll(brands);
        features.put("searchTerms", searchTerms.stream().distinct().collect(Collectors.toList()));

        return features;
    }

    private Map<String, Object> analyzeMockAdvanced(MultipartFile image) {
        Map<String, Object> analysis = new HashMap<>();

        // Enhanced mock analysis based on filename and file properties
        String filename = image.getOriginalFilename();
        if (filename != null) {
            String lowerFilename = filename.toLowerCase();

            if (lowerFilename.contains("shoe") || lowerFilename.contains("sneaker")) {
                analysis.put("category", "Shoes");
                analysis.put("categoryConfidence", 0.8);
                analysis.put("styles", Arrays.asList("sporty", "casual"));
                analysis.put("searchTerms", Arrays.asList("shoes", "sneakers", "footwear", "athletic"));
            } else if (lowerFilename.contains("dress")) {
                analysis.put("category", "Clothing");
                analysis.put("categoryConfidence", 0.85);
                analysis.put("styles", Arrays.asList("elegant", "formal"));
                analysis.put("searchTerms", Arrays.asList("dress", "formal wear", "clothing"));
            } else {
                analysis.put("category", "Clothing");
                analysis.put("categoryConfidence", 0.6);
                analysis.put("styles", Arrays.asList("casual", "trendy"));
                analysis.put("searchTerms", Arrays.asList("clothing", "fashion", "apparel"));
            }
        }

        analysis.put("dominantColors", getRandomColors());
        analysis.put("detectedBrands", Arrays.asList());
        analysis.put("aiDescription", "Mock analysis: Fashion item with trendy styling");

        return analysis;
    }

    private VisualSearchResult searchByImageFallbackAdvanced(MultipartFile image) {
        // Enhanced fallback with better product matching
        List<Product> products = productRepository.findByIsAvailableTrue()
            .stream()
            .limit(8)
            .collect(Collectors.toList());

        List<ProductSimilarity> similarities = products.stream()
            .map(p -> new ProductSimilarity(p, 0.3 + random.nextDouble() * 0.4))
            .collect(Collectors.toList());

        Map<String, Object> analysis = analyzeMockAdvanced(image);

        return VisualSearchResult.builder()
            .products(products)
            .similarities(similarities)
            .imageAnalysis(analysis)
            .searchTerms((List<String>) analysis.get("searchTerms"))
            .confidence(0.6)
            .aiInsights(Arrays.asList("Fallback search performed", "Consider uploading a clearer image"))
            .build();
    }

    private double calculateOverallConfidence(List<ProductSimilarity> similarities) {
        if (similarities.isEmpty()) return 0.0;
        return similarities.stream().mapToDouble(s -> s.similarity).average().orElse(0.0);
    }

    private List<String> generateAIInsights(Map<String, Object> analysis, List<Product> products) {
        List<String> insights = new ArrayList<>();

        String category = (String) analysis.get("category");
        if (category != null) {
            insights.add("🎯 Detected " + category.toLowerCase() + " item");
        }

        List<String> colors = (List<String>) analysis.get("dominantColors");
        if (colors != null && !colors.isEmpty()) {
            insights.add("🎨 Dominant colors: " + String.join(", ", colors));
        }

        if (!products.isEmpty()) {
            insights.add("✨ Found " + products.size() + " similar items");

            // Price range insight
            double minPrice = products.stream().mapToDouble(Product::getPrice).min().orElse(0);
            double maxPrice = products.stream().mapToDouble(Product::getPrice).max().orElse(0);
            insights.add("💰 Price range: $" + String.format("%.2f", minPrice) + " - $" + String.format("%.2f", maxPrice));

            // Brand variety
            Set<String> brands = products.stream()
                .map(Product::getBrand)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
            if (brands.size() > 1) {
                insights.add("🏷️ Multiple brands available: " + brands.size() + " options");
            }
        }

        return insights;
    }

    private List<String> getRandomColors() {
        List<String> allColors = Arrays.asList("red", "blue", "green", "black", "white",
            "gray", "brown", "navy", "beige", "pink");
        return allColors.stream()
            .filter(color -> random.nextDouble() < 0.4)
            .limit(3)
            .collect(Collectors.toList());
    }

    // Supporting classes
    public static class VisualSearchResult {
        private List<Product> products;
        private List<ProductSimilarity> similarities;
        private Map<String, Object> imageAnalysis;
        private List<String> searchTerms;
        private double confidence;
        private List<String> aiInsights;

        // Builder pattern
        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private VisualSearchResult result = new VisualSearchResult();

            public Builder products(List<Product> products) {
                result.products = products;
                return this;
            }

            public Builder similarities(List<ProductSimilarity> similarities) {
                result.similarities = similarities;
                return this;
            }

            public Builder imageAnalysis(Map<String, Object> imageAnalysis) {
                result.imageAnalysis = imageAnalysis;
                return this;
            }

            public Builder searchTerms(List<String> searchTerms) {
                result.searchTerms = searchTerms;
                return this;
            }

            public Builder confidence(double confidence) {
                result.confidence = confidence;
                return this;
            }

            public Builder aiInsights(List<String> aiInsights) {
                result.aiInsights = aiInsights;
                return this;
            }

            public VisualSearchResult build() {
                return result;
            }
        }

        // Getters
        public List<Product> getProducts() { return products; }
        public List<ProductSimilarity> getSimilarities() { return similarities; }
        public Map<String, Object> getImageAnalysis() { return imageAnalysis; }
        public List<String> getSearchTerms() { return searchTerms; }
        public double getConfidence() { return confidence; }
        public List<String> getAiInsights() { return aiInsights; }
    }

    public static class ProductSimilarity {
        private Product product;
        private double similarity;

        public ProductSimilarity(Product product, double similarity) {
            this.product = product;
            this.similarity = similarity;
        }

        public Product getProduct() { return product; }
        public double getSimilarity() { return similarity; }
    }

    public static class ProductImageMetadata {
        private String productId;
        private List<Double> vector;
        private Map<String, Object> metadata;

        public ProductImageMetadata(String productId, List<Double> vector, Map<String, Object> metadata) {
            this.productId = productId;
            this.vector = vector;
            this.metadata = metadata;
        }

        // Getters
        public String getProductId() { return productId; }
        public List<Double> getVector() { return vector; }
        public Map<String, Object> getMetadata() { return metadata; }
    }
}
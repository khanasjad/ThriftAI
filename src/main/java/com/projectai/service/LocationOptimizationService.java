package com.projectai.service;

import com.projectai.models.Product;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.*;
import java.util.stream.Collectors;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LocationOptimizationService {

    @Value("${google.maps.api.key:demo-key}")
    private String googleMapsApiKey;

    @Value("${shipping.service.provider:shippo}")
    private String shippingProvider;

    private final RestTemplate restTemplate = new RestTemplate();
    private final Random random = new Random();

    // Cache for location data
    private final Map<String, LocationData> locationCache = new ConcurrentHashMap<>();
    private final Map<String, List<ShippingOption>> shippingCache = new ConcurrentHashMap<>();

    public LocationOptimizationResult optimizeForLocation(String userLocation, List<Product> products) {
        try {
            // Get user's coordinates
            LocationData userLocationData = getLocationData(userLocation);

            // Calculate shipping costs and delivery times for each product
            List<ProductLocationInfo> productInfos = products.stream()
                .map(product -> calculateProductLocationInfo(product, userLocationData))
                .collect(Collectors.toList());

            // Sort by total cost (product price + shipping)
            productInfos.sort(Comparator.comparing(ProductLocationInfo::getTotalCost));

            // Generate location-based insights
            List<String> insights = generateLocationInsights(userLocationData, productInfos);

            // Find local stores/sellers
            List<LocalStore> nearbyStores = findNearbyStores(userLocationData);

            return new LocationOptimizationResult(
                userLocationData,
                productInfos,
                insights,
                nearbyStores
            );

        } catch (Exception e) {
            return createFallbackLocationResult(userLocation, products);
        }
    }

    public ShippingCalculationResult calculateShippingCosts(String fromLocation, String toLocation,
                                                          double weight, String dimensions) {
        try {
            LocationData fromData = getLocationData(fromLocation);
            LocationData toData = getLocationData(toLocation);

            // Calculate distance
            double distance = calculateDistance(fromData, toData);

            // Get shipping options from multiple carriers
            List<ShippingOption> options = getShippingOptions(fromData, toData, weight, dimensions, distance);

            // Generate shipping insights
            List<String> insights = generateShippingInsights(options, distance);

            return new ShippingCalculationResult(fromData, toData, distance, options, insights);

        } catch (Exception e) {
            return createFallbackShippingResult(fromLocation, toLocation);
        }
    }

    public List<Product> prioritizeByLocation(List<Product> products, String userLocation) {
        try {
            LocationData userLocationData = getLocationData(userLocation);

            return products.stream()
                .map(product -> {
                    ProductLocationInfo info = calculateProductLocationInfo(product, userLocationData);
                    return new ProductWithLocation(product, info);
                })
                .sorted((a, b) -> {
                    // Primary sort: local availability
                    if (a.locationInfo.isLocallyAvailable() != b.locationInfo.isLocallyAvailable()) {
                        return Boolean.compare(b.locationInfo.isLocallyAvailable(), a.locationInfo.isLocallyAvailable());
                    }
                    // Secondary sort: total cost
                    return Double.compare(a.locationInfo.getTotalCost(), b.locationInfo.getTotalCost());
                })
                .map(ProductWithLocation::getProduct)
                .collect(Collectors.toList());

        } catch (Exception e) {
            return products; // Return original order if optimization fails
        }
    }

    // Location data retrieval (Google Maps Geocoding API)
    private LocationData getLocationData(String location) {
        if (locationCache.containsKey(location)) {
            return locationCache.get(location);
        }

        try {
            if (!"demo-key".equals(googleMapsApiKey)) {
                return getLocationDataFromGoogle(location);
            } else {
                return generateMockLocationData(location);
            }
        } catch (Exception e) {
            return generateMockLocationData(location);
        }
    }

    private LocationData getLocationDataFromGoogle(String location) {
        // TODO: Implement real Google Maps Geocoding API call
        /*
        String url = "https://maps.googleapis.com/maps/api/geocode/json" +
                    "?address=" + URLEncoder.encode(location, StandardCharsets.UTF_8) +
                    "&key=" + googleMapsApiKey;

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        if (response.getBody() != null) {
            Map<String, Object> body = response.getBody();
            List<Map<String, Object>> results = (List<Map<String, Object>>) body.get("results");
            if (!results.isEmpty()) {
                Map<String, Object> result = results.get(0);
                Map<String, Object> geometry = (Map<String, Object>) result.get("geometry");
                Map<String, Object> locationData = (Map<String, Object>) geometry.get("location");

                double lat = (Double) locationData.get("lat");
                double lng = (Double) locationData.get("lng");
                String formattedAddress = (String) result.get("formatted_address");

                LocationData data = new LocationData(location, lat, lng, formattedAddress);
                locationCache.put(location, data);
                return data;
            }
        }
        */

        return generateMockLocationData(location);
    }

    private LocationData generateMockLocationData(String location) {
        // Generate consistent mock coordinates based on location string
        int hash = location.hashCode();
        Random locationRandom = new Random(hash);

        // Generate coordinates within reasonable ranges
        double lat = 25.0 + locationRandom.nextDouble() * 45.0; // US lat range approximately
        double lng = -125.0 + locationRandom.nextDouble() * 50.0; // US lng range approximately

        String formattedAddress = location + ", United States";

        LocationData data = new LocationData(location, lat, lng, formattedAddress);
        locationCache.put(location, data);
        return data;
    }

    // Shipping options calculation
    private List<ShippingOption> getShippingOptions(LocationData from, LocationData to,
                                                   double weight, String dimensions, double distance) {
        String cacheKey = from.getOriginalAddress() + "_" + to.getOriginalAddress() + "_" + weight;

        if (shippingCache.containsKey(cacheKey)) {
            return shippingCache.get(cacheKey);
        }

        List<ShippingOption> options = new ArrayList<>();

        // Calculate base shipping cost based on distance and weight
        double baseCost = Math.max(5.99, distance * 0.05 + weight * 2.0);

        // Standard shipping
        options.add(new ShippingOption(
            "Standard",
            "USPS",
            baseCost,
            calculateDeliveryDays(distance, "standard"),
            "5-7 business days",
            true
        ));

        // Express shipping
        options.add(new ShippingOption(
            "Express",
            "FedEx",
            baseCost * 2.5,
            calculateDeliveryDays(distance, "express"),
            "2-3 business days",
            distance < 2000
        ));

        // Overnight shipping
        if (distance < 1500) {
            options.add(new ShippingOption(
                "Overnight",
                "UPS",
                baseCost * 4.0,
                1,
                "Next business day",
                true
            ));
        }

        // Free shipping option for orders over $50
        if (baseCost > 8.0) {
            options.add(new ShippingOption(
                "Free Standard",
                "Economy",
                0.0,
                calculateDeliveryDays(distance, "standard") + 2,
                "7-10 business days (orders $50+)",
                true
            ));
        }

        // Local pickup if very close
        if (distance < 50) {
            options.add(new ShippingOption(
                "Local Pickup",
                "In-Store",
                0.0,
                0,
                "Same day pickup",
                true
            ));
        }

        shippingCache.put(cacheKey, options);
        return options;
    }

    private int calculateDeliveryDays(double distance, String shippingType) {
        int baseDays = distance < 100 ? 1 : distance < 500 ? 2 : distance < 1500 ? 3 : 5;

        switch (shippingType) {
            case "express":
                return Math.max(1, baseDays - 2);
            case "overnight":
                return 1;
            default:
                return baseDays;
        }
    }

    // Product location information calculation
    private ProductLocationInfo calculateProductLocationInfo(Product product, LocationData userLocation) {
        // Simulate seller location (in real app, this would be stored with product)
        LocationData sellerLocation = generateSellerLocation(product);

        // Calculate distance
        double distance = calculateDistance(userLocation, sellerLocation);

        // Calculate shipping options
        List<ShippingOption> shippingOptions = getShippingOptions(
            sellerLocation, userLocation, 1.0, "12x8x4", distance);

        // Find cheapest shipping
        ShippingOption cheapestShipping = shippingOptions.stream()
            .min(Comparator.comparing(ShippingOption::getCost))
            .orElse(new ShippingOption("Standard", "USPS", 9.99, 5, "5-7 days", true));

        // Calculate total cost
        double totalCost = product.getPrice() + cheapestShipping.getCost();

        // Determine if locally available (within 100 miles)
        boolean locallyAvailable = distance < 100;

        return new ProductLocationInfo(
            product.getId(),
            sellerLocation,
            distance,
            shippingOptions,
            cheapestShipping,
            totalCost,
            locallyAvailable
        );
    }

    private LocationData generateSellerLocation(Product product) {
        // Generate consistent seller location based on product ID
        Random sellerRandom = new Random(product.getId().hashCode());

        // Simulate sellers being distributed across major US cities
        List<String> majorCities = Arrays.asList(
            "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX",
            "Phoenix, AZ", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA",
            "Dallas, TX", "San Jose, CA", "Austin, TX", "Jacksonville, FL"
        );

        String city = majorCities.get(sellerRandom.nextInt(majorCities.size()));
        return getLocationData(city);
    }

    // Distance calculation using Haversine formula
    private double calculateDistance(LocationData loc1, LocationData loc2) {
        final int EARTH_RADIUS = 3959; // miles

        double lat1Rad = Math.toRadians(loc1.getLatitude());
        double lat2Rad = Math.toRadians(loc2.getLatitude());
        double deltaLatRad = Math.toRadians(loc2.getLatitude() - loc1.getLatitude());
        double deltaLngRad = Math.toRadians(loc2.getLongitude() - loc1.getLongitude());

        double a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                  Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS * c;
    }

    // Find nearby stores
    private List<LocalStore> findNearbyStores(LocationData userLocation) {
        List<LocalStore> stores = new ArrayList<>();

        // Mock nearby stores
        Random storeRandom = new Random(userLocation.getOriginalAddress().hashCode());

        for (int i = 0; i < 3 + storeRandom.nextInt(3); i++) {
            double distance = 5 + storeRandom.nextDouble() * 45; // 5-50 miles
            String storeName = generateStoreName(storeRandom);

            stores.add(new LocalStore(
                "store_" + i,
                storeName,
                distance,
                userLocation.getOriginalAddress() + " area",
                4.0 + storeRandom.nextDouble() * 1.0, // 4.0-5.0 rating
                storeRandom.nextBoolean() // open now
            ));
        }

        return stores.stream()
            .sorted(Comparator.comparing(LocalStore::getDistance))
            .collect(Collectors.toList());
    }

    private String generateStoreName(Random random) {
        List<String> storeTypes = Arrays.asList("Thrift", "Vintage", "Consignment", "Second Hand");
        List<String> storeNames = Arrays.asList("Treasure", "Style", "Fashion", "Closet", "Boutique");

        return storeTypes.get(random.nextInt(storeTypes.size())) + " " +
               storeNames.get(random.nextInt(storeNames.size()));
    }

    // Insights generation
    private List<String> generateLocationInsights(LocationData userLocation, List<ProductLocationInfo> productInfos) {
        List<String> insights = new ArrayList<>();

        if (!productInfos.isEmpty()) {
            // Local availability insight
            long localCount = productInfos.stream()
                .filter(ProductLocationInfo::isLocallyAvailable)
                .count();

            if (localCount > 0) {
                insights.add("📍 " + localCount + " items available locally (within 100 miles)");
            }

            // Shipping cost insight
            double avgShippingCost = productInfos.stream()
                .mapToDouble(p -> p.getCheapestShipping().getCost())
                .average()
                .orElse(0);

            if (avgShippingCost > 0) {
                insights.add("🚚 Average shipping cost: $" + String.format("%.2f", avgShippingCost));
            }

            // Best deals insight
            ProductLocationInfo bestDeal = productInfos.stream()
                .min(Comparator.comparing(ProductLocationInfo::getTotalCost))
                .orElse(null);

            if (bestDeal != null) {
                insights.add("💰 Best total price: $" + String.format("%.2f", bestDeal.getTotalCost()) +
                           " (including shipping)");
            }

            // Fast delivery insight
            long fastDeliveryCount = productInfos.stream()
                .filter(p -> p.getCheapestShipping().getDeliveryDays() <= 2)
                .count();

            if (fastDeliveryCount > 0) {
                insights.add("⚡ " + fastDeliveryCount + " items available for fast delivery (2 days or less)");
            }
        }

        return insights;
    }

    private List<String> generateShippingInsights(List<ShippingOption> options, double distance) {
        List<String> insights = new ArrayList<>();

        // Distance insight
        insights.add("📏 Distance: " + String.format("%.1f", distance) + " miles");

        // Cheapest option
        ShippingOption cheapest = options.stream()
            .min(Comparator.comparing(ShippingOption::getCost))
            .orElse(null);

        if (cheapest != null) {
            if (cheapest.getCost() == 0) {
                insights.add("🆓 Free shipping available!");
            } else {
                insights.add("💵 Cheapest shipping: $" + String.format("%.2f", cheapest.getCost()) +
                           " (" + cheapest.getName() + ")");
            }
        }

        // Fastest option
        ShippingOption fastest = options.stream()
            .min(Comparator.comparing(ShippingOption::getDeliveryDays))
            .orElse(null);

        if (fastest != null) {
            insights.add("🏃 Fastest delivery: " + fastest.getDeliveryDays() +
                        " day" + (fastest.getDeliveryDays() == 1 ? "" : "s") +
                        " (" + fastest.getName() + ")");
        }

        return insights;
    }

    // Fallback methods
    private LocationOptimizationResult createFallbackLocationResult(String userLocation, List<Product> products) {
        LocationData fallbackLocation = new LocationData(userLocation, 40.7128, -74.0060, userLocation + ", US");

        List<ProductLocationInfo> fallbackInfos = products.stream()
            .map(product -> new ProductLocationInfo(
                product.getId(),
                fallbackLocation,
                100.0, // default distance
                Arrays.asList(new ShippingOption("Standard", "USPS", 9.99, 5, "5-7 days", true)),
                new ShippingOption("Standard", "USPS", 9.99, 5, "5-7 days", true),
                product.getPrice() + 9.99,
                false
            ))
            .collect(Collectors.toList());

        List<String> fallbackInsights = Arrays.asList(
            "⚠️ Location services temporarily unavailable",
            "📦 Estimated shipping costs shown"
        );

        return new LocationOptimizationResult(
            fallbackLocation,
            fallbackInfos,
            fallbackInsights,
            new ArrayList<>()
        );
    }

    private ShippingCalculationResult createFallbackShippingResult(String fromLocation, String toLocation) {
        LocationData from = new LocationData(fromLocation, 40.7128, -74.0060, fromLocation);
        LocationData to = new LocationData(toLocation, 34.0522, -118.2437, toLocation);

        List<ShippingOption> fallbackOptions = Arrays.asList(
            new ShippingOption("Standard", "USPS", 9.99, 5, "5-7 days", true)
        );

        return new ShippingCalculationResult(
            from, to, 2400.0, fallbackOptions,
            Arrays.asList("⚠️ Using estimated shipping costs")
        );
    }

    // Supporting classes
    public static class LocationData {
        private String originalAddress;
        private double latitude;
        private double longitude;
        private String formattedAddress;

        public LocationData(String originalAddress, double latitude, double longitude, String formattedAddress) {
            this.originalAddress = originalAddress;
            this.latitude = latitude;
            this.longitude = longitude;
            this.formattedAddress = formattedAddress;
        }

        // Getters
        public String getOriginalAddress() { return originalAddress; }
        public double getLatitude() { return latitude; }
        public double getLongitude() { return longitude; }
        public String getFormattedAddress() { return formattedAddress; }
    }

    public static class ShippingOption {
        private String name;
        private String carrier;
        private double cost;
        private int deliveryDays;
        private String description;
        private boolean available;

        public ShippingOption(String name, String carrier, double cost, int deliveryDays,
                            String description, boolean available) {
            this.name = name;
            this.carrier = carrier;
            this.cost = cost;
            this.deliveryDays = deliveryDays;
            this.description = description;
            this.available = available;
        }

        // Getters
        public String getName() { return name; }
        public String getCarrier() { return carrier; }
        public double getCost() { return cost; }
        public int getDeliveryDays() { return deliveryDays; }
        public String getDescription() { return description; }
        public boolean isAvailable() { return available; }
    }

    public static class ProductLocationInfo {
        private String productId;
        private LocationData sellerLocation;
        private double distance;
        private List<ShippingOption> shippingOptions;
        private ShippingOption cheapestShipping;
        private double totalCost;
        private boolean locallyAvailable;

        public ProductLocationInfo(String productId, LocationData sellerLocation, double distance,
                                 List<ShippingOption> shippingOptions, ShippingOption cheapestShipping,
                                 double totalCost, boolean locallyAvailable) {
            this.productId = productId;
            this.sellerLocation = sellerLocation;
            this.distance = distance;
            this.shippingOptions = shippingOptions;
            this.cheapestShipping = cheapestShipping;
            this.totalCost = totalCost;
            this.locallyAvailable = locallyAvailable;
        }

        // Getters
        public String getProductId() { return productId; }
        public LocationData getSellerLocation() { return sellerLocation; }
        public double getDistance() { return distance; }
        public List<ShippingOption> getShippingOptions() { return shippingOptions; }
        public ShippingOption getCheapestShipping() { return cheapestShipping; }
        public double getTotalCost() { return totalCost; }
        public boolean isLocallyAvailable() { return locallyAvailable; }
    }

    public static class LocalStore {
        private String id;
        private String name;
        private double distance;
        private String address;
        private double rating;
        private boolean openNow;

        public LocalStore(String id, String name, double distance, String address,
                        double rating, boolean openNow) {
            this.id = id;
            this.name = name;
            this.distance = distance;
            this.address = address;
            this.rating = rating;
            this.openNow = openNow;
        }

        // Getters
        public String getId() { return id; }
        public String getName() { return name; }
        public double getDistance() { return distance; }
        public String getAddress() { return address; }
        public double getRating() { return rating; }
        public boolean isOpenNow() { return openNow; }
    }

    public static class LocationOptimizationResult {
        private LocationData userLocation;
        private List<ProductLocationInfo> productInfos;
        private List<String> insights;
        private List<LocalStore> nearbyStores;

        public LocationOptimizationResult(LocationData userLocation, List<ProductLocationInfo> productInfos,
                                        List<String> insights, List<LocalStore> nearbyStores) {
            this.userLocation = userLocation;
            this.productInfos = productInfos;
            this.insights = insights;
            this.nearbyStores = nearbyStores;
        }

        // Getters
        public LocationData getUserLocation() { return userLocation; }
        public List<ProductLocationInfo> getProductInfos() { return productInfos; }
        public List<String> getInsights() { return insights; }
        public List<LocalStore> getNearbyStores() { return nearbyStores; }
    }

    public static class ShippingCalculationResult {
        private LocationData fromLocation;
        private LocationData toLocation;
        private double distance;
        private List<ShippingOption> shippingOptions;
        private List<String> insights;

        public ShippingCalculationResult(LocationData fromLocation, LocationData toLocation,
                                       double distance, List<ShippingOption> shippingOptions,
                                       List<String> insights) {
            this.fromLocation = fromLocation;
            this.toLocation = toLocation;
            this.distance = distance;
            this.shippingOptions = shippingOptions;
            this.insights = insights;
        }

        // Getters
        public LocationData getFromLocation() { return fromLocation; }
        public LocationData getToLocation() { return toLocation; }
        public double getDistance() { return distance; }
        public List<ShippingOption> getShippingOptions() { return shippingOptions; }
        public List<String> getInsights() { return insights; }
    }

    private static class ProductWithLocation {
        private Product product;
        private ProductLocationInfo locationInfo;

        public ProductWithLocation(Product product, ProductLocationInfo locationInfo) {
            this.product = product;
            this.locationInfo = locationInfo;
        }

        public Product getProduct() { return product; }
        public ProductLocationInfo getLocationInfo() { return locationInfo; }
    }
}
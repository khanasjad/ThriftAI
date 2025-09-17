package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.models.Seller;
import com.projectai.repository.ProductRepository;
import com.projectai.repository.SellerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.*;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import jakarta.servlet.http.HttpServletRequest;

@Service
public class LocationService {

    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private SellerRepository sellerRepository;
    
    @Value("${location.api.key:demo-key}")
    private String locationApiKey;
    
    @Value("${location.provider:ipapi}")
    private String locationProvider;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final Random random = new Random();
    
    // Cache for location data to avoid repeated API calls
    private final Map<String, LocationData> locationCache = new ConcurrentHashMap<>();
    private final Map<String, List<String>> regionalTrendsCache = new ConcurrentHashMap<>();
    
    // Major US cities with coordinates for mock data
    private final Map<String, double[]> majorCities = Map.of(
        "New York", new double[]{40.7128, -74.0060},
        "Los Angeles", new double[]{34.0522, -118.2437},
        "Chicago", new double[]{41.8781, -87.6298},
        "Houston", new double[]{29.7604, -95.3698},
        "Phoenix", new double[]{33.4484, -112.0740},
        "Philadelphia", new double[]{39.9526, -75.1652},
        "San Antonio", new double[]{29.4241, -98.4936},
        "San Diego", new double[]{32.7157, -117.1611},
        "Dallas", new double[]{32.7767, -96.7970},
        "San Jose", new double[]{37.3382, -121.8863}
    );

    public LocationData getUserLocation(HttpServletRequest request) {
        try {
            String ipAddress = getClientIpAddress(request);
            
            // Check cache first
            if (locationCache.containsKey(ipAddress)) {
                LocationData cached = locationCache.get(ipAddress);
                // Cache for 24 hours
                if (cached.getTimestamp().isAfter(LocalDateTime.now().minusHours(24))) {
                    return cached;
                }
            }
            
            LocationData location = null;
            
            // Try real IP geolocation API first
            if (!"demo-key".equals(locationApiKey) && "ipapi".equals(locationProvider)) {
                location = getLocationFromIPAPI(ipAddress);
            }
            
            // Fallback to mock data
            if (location == null) {
                location = getMockLocationData(ipAddress);
            }
            
            // Cache the result
            locationCache.put(ipAddress, location);
            return location;
            
        } catch (Exception e) {
            return getDefaultLocation();
        }
    }

    public LocationData getLocationFromCoordinates(double latitude, double longitude) {
        try {
            String cacheKey = latitude + "," + longitude;
            
            if (locationCache.containsKey(cacheKey)) {
                LocationData cached = locationCache.get(cacheKey);
                if (cached.getTimestamp().isAfter(LocalDateTime.now().minusHours(24))) {
                    return cached;
                }
            }
            
            LocationData location = reverseGeocode(latitude, longitude);
            if (location == null) {
                location = getMockLocationFromCoordinates(latitude, longitude);
            }
            
            locationCache.put(cacheKey, location);
            return location;
            
        } catch (Exception e) {
            return getDefaultLocation();
        }
    }

    public List<Product> getProductsNearLocation(LocationData userLocation, double radiusMiles, int limit) {
        try {
            return productRepository.findByIsAvailableTrue().stream()
                .map(product -> {
                    // Get seller location and calculate distance
                    Seller seller = sellerRepository.findById(product.getSellerId()).orElse(null);
                    if (seller != null) {
                        LocationData sellerLocation = getSellerLocation(seller);
                        double distance = calculateDistance(userLocation, sellerLocation);
                        
                        // Add distance metadata
                        Map<String, Object> locationMeta = new HashMap<>();
                        locationMeta.put("distance", distance);
                        locationMeta.put("sellerCity", sellerLocation.getCity());
                        locationMeta.put("sellerState", sellerLocation.getState());
                        product.setLocationMetadata(locationMeta);
                        
                        return new ProductDistancePair(product, distance);
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .filter(pair -> pair.distance <= radiusMiles)
                .sorted(Comparator.comparing(pair -> pair.distance))
                .limit(limit)
                .map(pair -> pair.product)
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            return productRepository.findByIsAvailableTrue().stream().limit(limit).collect(Collectors.toList());
        }
    }

    public List<Seller> getNearbysellers(LocationData userLocation, double radiusMiles, int limit) {
        try {
            return sellerRepository.findAll().stream()
                .map(seller -> {
                    LocationData sellerLocation = getSellerLocation(seller);
                    double distance = calculateDistance(userLocation, sellerLocation);
                    return new SellerDistancePair(seller, distance);
                })
                .filter(pair -> pair.distance <= radiusMiles)
                .sorted(Comparator.comparing(pair -> pair.distance))
                .limit(limit)
                .map(pair -> {
                    // Add distance info to seller
                    Map<String, Object> locationInfo = new HashMap<>();
                    locationInfo.put("distance", pair.distance);
                    locationInfo.put("distanceText", formatDistance(pair.distance));
                    pair.seller.setLocationInfo(locationInfo);
                    return pair.seller;
                })
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            return sellerRepository.findAll().stream().limit(limit).collect(Collectors.toList());
        }
    }

    public Map<String, Object> calculateShippingCost(LocationData from, LocationData to, double weight, String serviceLevel) {
        Map<String, Object> shipping = new HashMap<>();
        
        try {
            double distance = calculateDistance(from, to);
            
            // Base shipping calculation
            double baseCost = 5.99; // Base shipping cost
            double distanceFactor = Math.min(distance * 0.15, 25.0); // Distance-based cost
            double weightFactor = Math.max(weight - 1.0, 0) * 2.0; // Extra weight cost
            
            double standardCost = baseCost + distanceFactor + weightFactor;
            
            Map<String, Map<String, Object>> options = new HashMap<>();
            
            // Standard shipping (5-7 days)
            Map<String, Object> standard = new HashMap<>();
            standard.put("cost", Math.round(standardCost * 100.0) / 100.0);
            standard.put("days", "5-7");
            standard.put("service", "Standard Ground");
            options.put("standard", standard);
            
            // Expedited shipping (2-3 days)
            Map<String, Object> expedited = new HashMap<>();
            expedited.put("cost", Math.round((standardCost * 1.8) * 100.0) / 100.0);
            expedited.put("days", "2-3");
            expedited.put("service", "Expedited");
            options.put("expedited", expedited);
            
            // Express shipping (1-2 days)
            Map<String, Object> express = new HashMap<>();
            express.put("cost", Math.round((standardCost * 2.5) * 100.0) / 100.0);
            express.put("days", "1-2");
            express.put("service", "Express");
            options.put("express", express);
            
            // Local pickup option if within 50 miles
            if (distance <= 50) {
                Map<String, Object> pickup = new HashMap<>();
                pickup.put("cost", 0.0);
                pickup.put("days", "Available");
                pickup.put("service", "Local Pickup");
                options.put("pickup", pickup);
            }
            
            shipping.put("success", true);
            shipping.put("distance", Math.round(distance * 100.0) / 100.0);
            shipping.put("options", options);
            shipping.put("currency", "USD");
            
            // Recommended option
            String recommended = distance <= 50 ? "pickup" : 
                               serviceLevel != null ? serviceLevel : "standard";
            shipping.put("recommended", recommended);
            
        } catch (Exception e) {
            shipping.put("success", false);
            shipping.put("error", "Unable to calculate shipping cost");
        }
        
        return shipping;
    }

    public List<String> getRegionalTrends(LocationData location) {
        try {
            String regionKey = location.getState() + "_" + location.getCity();
            
            // Check cache
            if (regionalTrendsCache.containsKey(regionKey)) {
                return regionalTrendsCache.get(regionKey);
            }
            
            // Mock regional trends based on location
            List<String> trends = generateRegionalTrends(location);
            regionalTrendsCache.put(regionKey, trends);
            
            return trends;
            
        } catch (Exception e) {
            return Arrays.asList("vintage clothing", "sustainable fashion", "local brands", "seasonal items");
        }
    }

    public Map<String, Object> getLocationAnalytics(LocationData location, String timeframe) {
        Map<String, Object> analytics = new HashMap<>();
        
        try {
            // Mock analytics data for the region
            analytics.put("totalUsers", 1500 + random.nextInt(3000));
            analytics.put("activeListings", 850 + random.nextInt(1500));
            analytics.put("popularCategories", Arrays.asList("Clothing", "Shoes", "Accessories", "Electronics"));
            
            // Price trends
            Map<String, Double> priceRanges = new HashMap<>();
            priceRanges.put("Clothing", 15.0 + random.nextDouble() * 20);
            priceRanges.put("Shoes", 25.0 + random.nextDouble() * 35);
            priceRanges.put("Accessories", 8.0 + random.nextDouble() * 15);
            analytics.put("avgPriceRanges", priceRanges);
            
            // Regional preferences
            List<String> preferences = getRegionalPreferences(location);
            analytics.put("regionalPreferences", preferences);
            
            // Seasonal trends
            List<String> seasonalTrends = getSeasonalTrends(location);
            analytics.put("seasonalTrends", seasonalTrends);
            
            analytics.put("location", Map.of(
                "city", location.getCity(),
                "state", location.getState(),
                "region", location.getRegion()
            ));
            
        } catch (Exception e) {
            analytics.put("error", "Unable to fetch location analytics");
        }
        
        return analytics;
    }

    public List<Map<String, Object>> getPickupLocations(LocationData userLocation, double radiusMiles) {
        List<Map<String, Object>> pickupLocations = new ArrayList<>();
        
        try {
            // Generate mock pickup locations (retailers, lockers, etc.)
            for (int i = 0; i < 8; i++) {
                Map<String, Object> location = new HashMap<>();
                
                // Generate random coordinates within radius
                double[] randomCoords = generateRandomCoordinatesInRadius(
                    userLocation.getLatitude(), userLocation.getLongitude(), radiusMiles);
                
                location.put("id", "pickup_" + i);
                location.put("name", getPickupLocationName());
                location.put("address", generateAddress(randomCoords[0], randomCoords[1]));
                location.put("latitude", randomCoords[0]);
                location.put("longitude", randomCoords[1]);
                location.put("hours", "Mon-Fri: 9AM-7PM, Sat-Sun: 10AM-6PM");
                location.put("phone", generatePhoneNumber());
                location.put("type", getPickupLocationType());
                
                double distance = calculateDistance(
                    userLocation.getLatitude(), userLocation.getLongitude(),
                    randomCoords[0], randomCoords[1]);
                location.put("distance", Math.round(distance * 100.0) / 100.0);
                location.put("distanceText", formatDistance(distance));
                
                pickupLocations.add(location);
            }
            
            // Sort by distance
            pickupLocations.sort((a, b) -> 
                Double.compare((Double) a.get("distance"), (Double) b.get("distance")));
                
        } catch (Exception e) {
            // Return empty list on error
        }
        
        return pickupLocations;
    }

    // Helper methods

    private String getClientIpAddress(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        
        String xrHeader = request.getHeader("X-Real-IP");
        if (xrHeader != null && !xrHeader.isEmpty()) {
            return xrHeader;
        }
        
        return request.getRemoteAddr();
    }

    private LocationData getLocationFromIPAPI(String ipAddress) {
        try {
            String url = "http://ip-api.com/json/" + ipAddress + "?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> data = response.getBody();
            
            if ("success".equals(data.get("status"))) {
                LocationData location = new LocationData();
                location.setLatitude((Double) data.get("lat"));
                location.setLongitude((Double) data.get("lon"));
                location.setCity((String) data.get("city"));
                location.setState((String) data.get("regionName"));
                location.setCountry((String) data.get("country"));
                location.setCountryCode((String) data.get("countryCode"));
                location.setZipCode((String) data.get("zip"));
                location.setTimezone((String) data.get("timezone"));
                location.setSource("ipapi");
                location.setTimestamp(LocalDateTime.now());
                return location;
            }
            
        } catch (Exception e) {
            // Fall back to mock data
        }
        
        return null;
    }

    private LocationData getMockLocationData(String ipAddress) {
        // Generate consistent mock data based on IP hash
        int hash = Math.abs(ipAddress.hashCode());
        String[] cities = majorCities.keySet().toArray(new String[0]);
        String city = cities[hash % cities.length];
        double[] coords = majorCities.get(city);
        
        LocationData location = new LocationData();
        location.setLatitude(coords[0] + (random.nextDouble() - 0.5) * 0.1);
        location.setLongitude(coords[1] + (random.nextDouble() - 0.5) * 0.1);
        location.setCity(city);
        location.setState(getStateFromCity(city));
        location.setCountry("United States");
        location.setCountryCode("US");
        location.setZipCode(String.format("%05d", 10000 + hash % 90000));
        location.setTimezone(getTimezoneFromState(getStateFromCity(city)));
        location.setSource("mock");
        location.setTimestamp(LocalDateTime.now());
        
        return location;
    }

    private LocationData getMockLocationFromCoordinates(double lat, double lon) {
        // Find closest major city
        String closestCity = "New York";
        double minDistance = Double.MAX_VALUE;
        
        for (Map.Entry<String, double[]> entry : majorCities.entrySet()) {
            double distance = calculateDistance(lat, lon, entry.getValue()[0], entry.getValue()[1]);
            if (distance < minDistance) {
                minDistance = distance;
                closestCity = entry.getKey();
            }
        }
        
        LocationData location = new LocationData();
        location.setLatitude(lat);
        location.setLongitude(lon);
        location.setCity(closestCity);
        location.setState(getStateFromCity(closestCity));
        location.setCountry("United States");
        location.setCountryCode("US");
        location.setSource("coordinates");
        location.setTimestamp(LocalDateTime.now());
        
        return location;
    }

    private LocationData getDefaultLocation() {
        LocationData location = new LocationData();
        location.setLatitude(40.7128);
        location.setLongitude(-74.0060);
        location.setCity("New York");
        location.setState("New York");
        location.setCountry("United States");
        location.setCountryCode("US");
        location.setZipCode("10001");
        location.setTimezone("America/New_York");
        location.setSource("default");
        location.setTimestamp(LocalDateTime.now());
        return location;
    }

    private LocationData reverseGeocode(double latitude, double longitude) {
        // Implementation for reverse geocoding API would go here
        return null;
    }

    private LocationData getSellerLocation(Seller seller) {
        // Mock seller location based on seller data
        LocationData location = new LocationData();
        
        if (seller.getCity() != null && seller.getState() != null) {
            location.setCity(seller.getCity());
            location.setState(seller.getState());
            
            // Try to get coordinates for known city
            String cityKey = seller.getCity();
            if (majorCities.containsKey(cityKey)) {
                double[] coords = majorCities.get(cityKey);
                location.setLatitude(coords[0] + (random.nextDouble() - 0.5) * 0.05);
                location.setLongitude(coords[1] + (random.nextDouble() - 0.5) * 0.05);
            } else {
                // Random coordinates for unknown cities
                location.setLatitude(40.0 + random.nextDouble() * 10);
                location.setLongitude(-120.0 + random.nextDouble() * 40);
            }
        } else {
            // Default location
            location = getDefaultLocation();
        }
        
        location.setSource("seller");
        return location;
    }

    private double calculateDistance(LocationData loc1, LocationData loc2) {
        return calculateDistance(loc1.getLatitude(), loc1.getLongitude(), 
                               loc2.getLatitude(), loc2.getLongitude());
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // Haversine formula for calculating distance between two points on Earth
        final int R = 3959; // Earth's radius in miles
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c; // Distance in miles
    }

    private List<String> generateRegionalTrends(LocationData location) {
        List<String> trends = new ArrayList<>();
        
        // Base trends
        trends.addAll(Arrays.asList("sustainable fashion", "vintage finds", "local artisans"));
        
        // Regional specific trends
        String state = location.getState();
        if ("California".equals(state)) {
            trends.addAll(Arrays.asList("surf wear", "tech accessories", "organic cotton"));
        } else if ("Texas".equals(state)) {
            trends.addAll(Arrays.asList("western wear", "boots", "leather goods"));
        } else if ("New York".equals(state)) {
            trends.addAll(Arrays.asList("designer pieces", "streetwear", "formal wear"));
        } else if ("Florida".equals(state)) {
            trends.addAll(Arrays.asList("beach wear", "lightweight fabrics", "sun protection"));
        } else {
            trends.addAll(Arrays.asList("seasonal clothing", "outdoor gear", "casual wear"));
        }
        
        return trends.stream().distinct().limit(6).collect(Collectors.toList());
    }

    private List<String> getRegionalPreferences(LocationData location) {
        // Mock regional preferences
        return Arrays.asList("Eco-friendly materials", "Local brands", "Vintage style", "Affordable prices");
    }

    private List<String> getSeasonalTrends(LocationData location) {
        // Mock seasonal trends based on current season
        LocalDateTime now = LocalDateTime.now();
        int month = now.getMonthValue();
        
        if (month >= 3 && month <= 5) {
            return Arrays.asList("Spring jackets", "Light colors", "Transition pieces");
        } else if (month >= 6 && month <= 8) {
            return Arrays.asList("Summer dresses", "Shorts", "Swimwear");
        } else if (month >= 9 && month <= 11) {
            return Arrays.asList("Fall coats", "Boots", "Layering pieces");
        } else {
            return Arrays.asList("Winter coats", "Sweaters", "Holiday wear");
        }
    }

    private String getStateFromCity(String city) {
        Map<String, String> cityToState = Map.of(
            "New York", "New York",
            "Los Angeles", "California",
            "Chicago", "Illinois",
            "Houston", "Texas",
            "Phoenix", "Arizona",
            "Philadelphia", "Pennsylvania",
            "San Antonio", "Texas",
            "San Diego", "California",
            "Dallas", "Texas",
            "San Jose", "California"
        );
        return cityToState.getOrDefault(city, "New York");
    }

    private String getTimezoneFromState(String state) {
        Map<String, String> stateToTimezone = Map.of(
            "New York", "America/New_York",
            "California", "America/Los_Angeles",
            "Illinois", "America/Chicago",
            "Texas", "America/Chicago",
            "Arizona", "America/Phoenix",
            "Pennsylvania", "America/New_York"
        );
        return stateToTimezone.getOrDefault(state, "America/New_York");
    }

    private String formatDistance(double distance) {
        if (distance < 1.0) {
            return String.format("%.1f mi", distance);
        } else {
            return String.format("%.0f mi", distance);
        }
    }

    private double[] generateRandomCoordinatesInRadius(double centerLat, double centerLon, double radiusMiles) {
        // Generate random point within radius
        double radiusInDegrees = radiusMiles / 69.0; // Approximate conversion
        
        double angle = random.nextDouble() * 2 * Math.PI;
        double distance = Math.sqrt(random.nextDouble()) * radiusInDegrees;
        
        double lat = centerLat + distance * Math.cos(angle);
        double lon = centerLon + distance * Math.sin(angle);
        
        return new double[]{lat, lon};
    }

    private String getPickupLocationName() {
        String[] names = {"FedEx Office", "UPS Store", "Amazon Hub", "CVS Pharmacy", 
                         "Walgreens", "7-Eleven", "Package Locker", "Retail Partner"};
        return names[random.nextInt(names.length)];
    }

    private String getPickupLocationType() {
        String[] types = {"retail", "locker", "office", "pharmacy", "convenience"};
        return types[random.nextInt(types.length)];
    }

    private String generateAddress(double lat, double lon) {
        String[] streets = {"Main St", "Oak Ave", "First Ave", "Park Blvd", "Market St"};
        int number = 100 + random.nextInt(9900);
        String street = streets[random.nextInt(streets.length)];
        return number + " " + street;
    }

    private String generatePhoneNumber() {
        return String.format("(%03d) %03d-%04d", 
                           200 + random.nextInt(800),
                           200 + random.nextInt(800),
                           random.nextInt(10000));
    }

    // Helper classes
    private static class ProductDistancePair {
        final Product product;
        final double distance;
        
        ProductDistancePair(Product product, double distance) {
            this.product = product;
            this.distance = distance;
        }
    }

    private static class SellerDistancePair {
        final Seller seller;
        final double distance;
        
        SellerDistancePair(Seller seller, double distance) {
            this.seller = seller;
            this.distance = distance;
        }
    }

    // LocationData class
    public static class LocationData {
        private double latitude;
        private double longitude;
        private String city;
        private String state;
        private String country;
        private String countryCode;
        private String zipCode;
        private String timezone;
        private String region;
        private String source;
        private LocalDateTime timestamp;

        // Getters and setters
        public double getLatitude() { return latitude; }
        public void setLatitude(double latitude) { this.latitude = latitude; }
        
        public double getLongitude() { return longitude; }
        public void setLongitude(double longitude) { this.longitude = longitude; }
        
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        
        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
        
        public String getCountryCode() { return countryCode; }
        public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
        
        public String getZipCode() { return zipCode; }
        public void setZipCode(String zipCode) { this.zipCode = zipCode; }
        
        public String getTimezone() { return timezone; }
        public void setTimezone(String timezone) { this.timezone = timezone; }
        
        public String getRegion() { return region; }
        public void setRegion(String region) { this.region = region; }
        
        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }
        
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    }
}
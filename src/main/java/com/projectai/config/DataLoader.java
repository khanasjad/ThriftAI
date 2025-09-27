package com.projectai.config;

import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component // Enabled to load sample data including automotive products
public class DataLoader implements CommandLineRunner {

    @Autowired
    private ProductRepository productRepository;

    @Override
    public void run(String... args) throws Exception {
        // Only load sample data if the database is empty
        if (productRepository.count() == 0) {
            loadSampleProducts();
        } else {
            // Always ensure automotive products exist for testing
            loadAutomotiveProductsIfMissing();
        }
    }

    private void loadSampleProducts() {
        // Vintage Clothing
        Product jacket1 = new Product();
        jacket1.setId(UUID.randomUUID().toString());
        jacket1.setName("Vintage Leather Motorcycle Jacket");
        jacket1.setDescription("Authentic 1980s leather motorcycle jacket in excellent condition. Classic style with original hardware and minimal wear.");
        jacket1.setPrice(89.99);
        jacket1.setOriginalPrice(150.00);
        jacket1.setCategory("Clothing");
        jacket1.setBrand("Schott NYC");
        jacket1.setSize("L");
        jacket1.setCondition("Excellent");
        jacket1.setAvailable(true);
        productRepository.save(jacket1);

        Product denim = new Product();
        denim.setId(UUID.randomUUID().toString());
        denim.setName("Classic Levi's Denim Jacket");
        denim.setDescription("Vintage Levi's 501 denim jacket with original tags. Perfect for layering and timeless style.");
        denim.setPrice(45.00);
        denim.setOriginalPrice(80.00);
        denim.setCategory("Clothing");
        denim.setBrand("Levi's");
        denim.setSize("M");
        denim.setCondition("Like New");
        denim.setAvailable(true);
        productRepository.save(denim);

        Product peacoat = new Product();
        peacoat.setId(UUID.randomUUID().toString());
        peacoat.setName("Navy Wool Peacoat");
        peacoat.setDescription("Classic navy blue wool peacoat from the 1970s. Double-breasted with anchor buttons.");
        peacoat.setPrice(75.50);
        peacoat.setOriginalPrice(120.00);
        peacoat.setCategory("Clothing");
        peacoat.setBrand("US Navy");
        peacoat.setSize("L");
        peacoat.setCondition("Good");
        peacoat.setAvailable(true);
        productRepository.save(peacoat);

        Product bomber = new Product();
        bomber.setId(UUID.randomUUID().toString());
        bomber.setName("Military Bomber Jacket");
        bomber.setDescription("Military-style bomber jacket in olive green. Authentic flight jacket with patches.");
        bomber.setPrice(65.00);
        bomber.setOriginalPrice(95.00);
        bomber.setCategory("Clothing");
        bomber.setBrand("Alpha Industries");
        bomber.setSize("L");
        bomber.setCondition("Very Good");
        bomber.setAvailable(true);
        productRepository.save(bomber);

        // Designer Items
        Product suede = new Product();
        suede.setId(UUID.randomUUID().toString());
        suede.setName("Bohemian Suede Fringe Jacket");
        suede.setDescription("1970s suede jacket with fringe details. Perfect boho chic piece for the modern wardrobe.");
        suede.setPrice(95.00);
        suede.setOriginalPrice(160.00);
        suede.setCategory("Clothing");
        suede.setBrand("Custom Made");
        suede.setSize("M");
        suede.setCondition("Excellent");
        suede.setAvailable(true);
        productRepository.save(suede);

        Product blazer = new Product();
        blazer.setId(UUID.randomUUID().toString());
        blazer.setName("Vintage Wool Blazer");
        blazer.setDescription("Tailored wool blazer from the 1960s. Professional yet stylish with classic lapels.");
        blazer.setPrice(55.00);
        blazer.setOriginalPrice(90.00);
        blazer.setCategory("Clothing");
        blazer.setBrand("Brooks Brothers");
        blazer.setSize("M");
        blazer.setCondition("Good");
        blazer.setAvailable(true);
        productRepository.save(blazer);

        // Electronics
        Product walkman = new Product();
        walkman.setId(UUID.randomUUID().toString());
        walkman.setName("Sony Walkman WM-10");
        walkman.setDescription("Classic Sony Walkman from the 1980s. Rare collector's item in working condition.");
        walkman.setPrice(125.00);
        walkman.setOriginalPrice(200.00);
        walkman.setCategory("Electronics");
        walkman.setBrand("Sony");
        walkman.setSize("Portable");
        walkman.setCondition("Very Good");
        walkman.setAvailable(true);
        productRepository.save(walkman);

        Product radio = new Product();
        radio.setId(UUID.randomUUID().toString());
        radio.setName("Vintage Transistor Radio");
        radio.setDescription("1960s transistor radio with leather case. Perfect for collectors or functional use.");
        radio.setPrice(35.00);
        radio.setOriginalPrice(60.00);
        radio.setCategory("Electronics");
        radio.setBrand("Motorola");
        radio.setSize("Small");
        radio.setCondition("Good");
        radio.setAvailable(true);
        productRepository.save(radio);

        // Home & Decor
        Product chair = new Product();
        chair.setId(UUID.randomUUID().toString());
        chair.setName("Mid-Century Modern Chair");
        chair.setDescription("Authentic mid-century modern chair with teak legs and original upholstery.");
        chair.setPrice(180.00);
        chair.setOriginalPrice(300.00);
        chair.setCategory("Furniture");
        chair.setBrand("Herman Miller");
        chair.setSize("Standard");
        chair.setCondition("Excellent");
        chair.setAvailable(true);
        productRepository.save(chair);

        Product lamp = new Product();
        lamp.setId(UUID.randomUUID().toString());
        lamp.setName("Art Deco Table Lamp");
        lamp.setDescription("Beautiful art deco style table lamp with geometric patterns and brass accents.");
        lamp.setPrice(85.00);
        lamp.setOriginalPrice(140.00);
        lamp.setCategory("Home Decor");
        lamp.setBrand("Vintage Lighting Co");
        lamp.setSize("Medium");
        lamp.setCondition("Very Good");
        lamp.setAvailable(true);
        productRepository.save(lamp);

        // Automotive Products
        Product carMount = new Product();
        carMount.setId(UUID.randomUUID().toString());
        carMount.setName("Universal Car Phone Mount");
        carMount.setDescription("Adjustable car phone mount with dashboard suction cup. Compatible with all smartphone sizes. Perfect for GPS navigation.");
        carMount.setPrice(15.99);
        carMount.setOriginalPrice(29.99);
        carMount.setCategory("Automotive");
        carMount.setBrand("AutoTech");
        carMount.setSize("Universal");
        carMount.setCondition("Like New");
        carMount.setAvailable(true);
        productRepository.save(carMount);

        Product carCharger = new Product();
        carCharger.setId(UUID.randomUUID().toString());
        carCharger.setName("Dual USB Car Charger");
        carCharger.setDescription("Fast charging dual USB car charger adapter. Works with all devices. LED indicator shows charging status.");
        carCharger.setPrice(12.50);
        carCharger.setOriginalPrice(24.99);
        carCharger.setCategory("Automotive");
        carCharger.setBrand("PowerDrive");
        carCharger.setSize("Compact");
        carCharger.setCondition("Excellent");
        carCharger.setAvailable(true);
        productRepository.save(carCharger);

        Product dashboardCover = new Product();
        dashboardCover.setId(UUID.randomUUID().toString());
        dashboardCover.setName("Dashboard Sun Cover");
        dashboardCover.setDescription("Reflective dashboard sun cover protects your car interior from UV damage. Foldable and easy to store.");
        dashboardCover.setPrice(18.99);
        dashboardCover.setOriginalPrice(35.00);
        dashboardCover.setCategory("Automotive");
        dashboardCover.setBrand("SunShield");
        dashboardCover.setSize("Standard");
        dashboardCover.setCondition("Very Good");
        dashboardCover.setAvailable(true);
        productRepository.save(dashboardCover);

        Product seatCovers = new Product();
        seatCovers.setId(UUID.randomUUID().toString());
        seatCovers.setName("Waterproof Car Seat Covers");
        seatCovers.setDescription("Set of 2 waterproof car seat covers. Protects upholstery from spills and wear. Easy to install and remove.");
        seatCovers.setPrice(35.00);
        seatCovers.setOriginalPrice(65.00);
        seatCovers.setCategory("Automotive");
        seatCovers.setBrand("AutoGuard");
        seatCovers.setSize("Universal");
        seatCovers.setCondition("Good");
        seatCovers.setAvailable(true);
        productRepository.save(seatCovers);

        Product airFreshener = new Product();
        airFreshener.setId(UUID.randomUUID().toString());
        airFreshener.setName("Car Air Freshener Set");
        airFreshener.setDescription("Set of 5 long-lasting car air fresheners in various scents. Hanging style for rearview mirror.");
        airFreshener.setPrice(8.99);
        airFreshener.setOriginalPrice(15.99);
        airFreshener.setCategory("Automotive");
        airFreshener.setBrand("FreshRide");
        airFreshener.setSize("Small");
        airFreshener.setCondition("New");
        airFreshener.setAvailable(true);
        productRepository.save(airFreshener);

        Product cupHolder = new Product();
        cupHolder.setId(UUID.randomUUID().toString());
        cupHolder.setName("Expandable Car Cup Holder");
        cupHolder.setDescription("Adjustable car cup holder organizer with phone slot. Fits in most vehicle cup holders.");
        cupHolder.setPrice(22.99);
        cupHolder.setOriginalPrice(39.99);
        cupHolder.setCategory("Automotive");
        cupHolder.setBrand("OrganizeIt");
        cupHolder.setSize("Adjustable");
        cupHolder.setCondition("Like New");
        cupHolder.setAvailable(true);
        productRepository.save(cupHolder);

        System.out.println("Loaded " + productRepository.count() + " sample products into the database (including automotive items).");
    }

    private void loadAutomotiveProductsIfMissing() {
        // Check if automotive products already exist
        long automotiveCount = productRepository.findAll().stream()
                .filter(p -> "Automotive".equals(p.getCategory()))
                .count();

        if (automotiveCount == 0) {
            System.out.println("No automotive products found. Adding automotive products for testing...");

            // Add automotive products
            Product carMount = new Product();
            carMount.setId(UUID.randomUUID().toString());
            carMount.setName("Universal Car Phone Mount");
            carMount.setDescription("Adjustable car phone mount with dashboard suction cup. Compatible with all smartphone sizes. Perfect for GPS navigation.");
            carMount.setPrice(15.99);
            carMount.setOriginalPrice(29.99);
            carMount.setCategory("Automotive");
            carMount.setBrand("AutoTech");
            carMount.setSize("Universal");
            carMount.setCondition("Like New");
            carMount.setAvailable(true);
            productRepository.save(carMount);

            Product carCharger = new Product();
            carCharger.setId(UUID.randomUUID().toString());
            carCharger.setName("Dual USB Car Charger");
            carCharger.setDescription("Fast charging dual USB car charger adapter. Works with all devices. LED indicator shows charging status.");
            carCharger.setPrice(12.50);
            carCharger.setOriginalPrice(24.99);
            carCharger.setCategory("Automotive");
            carCharger.setBrand("PowerDrive");
            carCharger.setSize("Compact");
            carCharger.setCondition("Excellent");
            carCharger.setAvailable(true);
            productRepository.save(carCharger);

            Product dashboardCover = new Product();
            dashboardCover.setId(UUID.randomUUID().toString());
            dashboardCover.setName("Dashboard Sun Cover");
            dashboardCover.setDescription("Reflective dashboard sun cover protects your car interior from UV damage. Foldable and easy to store.");
            dashboardCover.setPrice(18.99);
            dashboardCover.setOriginalPrice(35.00);
            dashboardCover.setCategory("Automotive");
            dashboardCover.setBrand("SunShield");
            dashboardCover.setSize("Standard");
            dashboardCover.setCondition("Very Good");
            dashboardCover.setAvailable(true);
            productRepository.save(dashboardCover);

            System.out.println("Added " + 3 + " automotive products. Total products: " + productRepository.count());
        } else {
            System.out.println("Found " + automotiveCount + " existing automotive products. No additional loading needed.");
        }
    }
}
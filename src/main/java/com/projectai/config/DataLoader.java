package com.projectai.config;

import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

// @Component - Disabled to prevent hardcoded data loading
public class DataLoader implements CommandLineRunner {

    @Autowired
    private ProductRepository productRepository;

    @Override
    public void run(String... args) throws Exception {
        // Only load sample data if the database is empty
        if (productRepository.count() == 0) {
            loadSampleProducts();
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

        System.out.println("Loaded " + productRepository.count() + " sample products into the database.");
    }
}